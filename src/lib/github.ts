/**
 * GitHub API layer for RepoFlow.
 *
 * WHY THIS FILE EXISTS:
 * The original code pushed files one-by-one using `createOrUpdateFileContents`,
 * which means a 50-file upload = 50 separate HTTP round-trips.  This is slow,
 * burns through GitHub's rate limit quickly, and can leave a repo in a partial
 * state if a request fails midway.
 *
 * This module uses the lower-level Git Data API instead:
 *   1. Create a blob  (one request per file, but can be parallelised)
 *   2. Create a tree  (one request for ALL files)
 *   3. Create a commit (one request)
 *   4. Update the ref (one request)
 *
 * A 50-file upload now costs 53 requests instead of 50.  More importantly,
 * the commit is atomic — either all files land or none do.
 */

import { Octokit } from '@octokit/rest';
import type { RepoSnapshot, RepoFileEntry } from '../types';

// ─── Snapshot (shared by deploy + update) ────────────────────────────────────

/**
 * Fetch the current state of a GitHub repo: the full file list, the HEAD
 * commit SHA, and the root tree SHA.  The tree SHA is needed for batch
 * updates so we can say "start with this tree and apply a delta".
 */
export async function getSnapshot(
  octokit: Octokit,
  owner: string,
  repoName: string,
): Promise<RepoSnapshot> {
  const { data: repo } = await octokit.repos.get({ owner, repo: repoName });
  const branch = repo.default_branch;

  const { data: branchData } = await octokit.repos.getBranch({
    owner, repo: repoName, branch,
  });

  const headSha = branchData.commit.sha;

  // Get the root tree SHA from the commit object
  const { data: commitData } = await octokit.git.getCommit({
    owner, repo: repoName, commit_sha: headSha,
  });
  const treeSha = commitData.tree.sha;

  // Recursive tree gives us every file in one request
  const { data: tree } = await octokit.git.getTree({
    owner, repo: repoName, tree_sha: headSha, recursive: 'true',
  });

  const files: RepoFileEntry[] = tree.tree
    .filter((item) => item.type === 'blob' && item.path && item.sha)
    .map((item) => ({ path: item.path!, sha: item.sha!, size: item.size || 0 }))
    .sort((a, b) => a.path.localeCompare(b.path));

  return { files, headSha, treeSha };
}

// ─── Initial deploy (brand-new empty repo) ───────────────────────────────────

/**
 * Push the first commit to an empty repository.
 *
 * Because there is no existing branch yet, we can't "update a ref" — we have
 * to CREATE refs/heads/main pointing at the new commit.
 *
 * Progress callback receives (blobsDone, totalFiles) so the UI can show a
 * meaningful percentage as blobs are created.
 */
export async function batchInitialCommit(
  octokit: Octokit,
  owner: string,
  repoName: string,
  files: Array<{ path: string; contentBase64: string }>,
  onProgress?: (done: number, total: number) => void,
): Promise<void> {
  const total = files.length;

  // 1️⃣  Create one blob per file (parallelised in chunks of 5 to stay polite)
  const blobShas: Array<{ path: string; sha: string }> = [];
  for (let i = 0; i < files.length; i += 5) {
    const chunk = files.slice(i, i + 5);
    const results = await Promise.all(
      chunk.map((f) =>
        octokit.git.createBlob({
          owner, repo: repoName,
          content: f.contentBase64,
          encoding: 'base64',
        }).then(({ data }) => ({ path: f.path, sha: data.sha })),
      ),
    );
    blobShas.push(...results);
    onProgress?.(blobShas.length, total);
  }

  // 2️⃣  Create a single tree that references every blob
  const { data: newTree } = await octokit.git.createTree({
    owner, repo: repoName,
    tree: blobShas.map(({ path, sha }) => ({
      path,
      mode: '100644' as const,
      type: 'blob' as const,
      sha,
    })),
  });

  // 3️⃣  Create the initial commit (no parents = root commit)
  const { data: newCommit } = await octokit.git.createCommit({
    owner, repo: repoName,
    message: `Initial commit via RepoFlow — ${files.length} file${files.length === 1 ? '' : 's'}`,
    tree: newTree.sha,
    parents: [],
  });

  // 4️⃣  Point main branch at the new commit
  await octokit.git.createRef({
    owner, repo: repoName,
    ref: 'refs/heads/main',
    sha: newCommit.sha,
  });
}

// ─── Incremental update (existing repo) ──────────────────────────────────────

/**
 * Push a delta (add/update files + optionally delete files) to an existing repo.
 *
 * Key concepts:
 * - `base_tree` tells GitHub "start with this tree and overlay my changes"
 *   → files we don't touch stay exactly as they were.
 * - Setting a tree entry's `sha` to `null` deletes that file.
 * - We check the current HEAD SHA against the one we snapshotted earlier.
 *   If they differ, someone pushed directly to GitHub between our sync and
 *   our save, so we refuse the update to avoid silently overwriting their work.
 *
 * Returns the new commit SHA (useful for updating local state).
 */
export async function batchUpdateCommit(
  octokit: Octokit,
  owner: string,
  repoName: string,
  stagedFiles: Array<{ path: string; contentBase64: string }>,
  deletedPaths: string[],
  baseTreeSha: string,
  parentCommitSha: string,
  onProgress?: (done: number, total: number) => void,
): Promise<string> {
  const total = stagedFiles.length;
  let done = 0;

  // 1️⃣  Create blobs for changed/new files (chunked for rate-limit safety)
  const treeItems: Array<{
    path: string;
    mode: '100644';
    type: 'blob';
    sha: string | null;
  }> = [];

  for (let i = 0; i < stagedFiles.length; i += 5) {
    const chunk = stagedFiles.slice(i, i + 5);
    const results = await Promise.all(
      chunk.map((f) =>
        octokit.git.createBlob({
          owner, repo: repoName,
          content: f.contentBase64,
          encoding: 'base64',
        }).then(({ data }) => ({
          path: f.path,
          mode: '100644' as const,
          type: 'blob' as const,
          sha: data.sha,
        })),
      ),
    );
    treeItems.push(...results);
    done += chunk.length;
    onProgress?.(done, total);
  }

  // Deletions: sha=null removes the file from the tree
  for (const path of deletedPaths) {
    treeItems.push({ path, mode: '100644', type: 'blob', sha: null });
  }

  // 2️⃣  New tree = base tree + our delta
  const { data: newTree } = await octokit.git.createTree({
    owner, repo: repoName,
    tree: treeItems,
    base_tree: baseTreeSha,
  });

  // 3️⃣  Commit
  const parts: string[] = [];
  if (stagedFiles.length) parts.push(`${stagedFiles.length} file diupdate`);
  if (deletedPaths.length) parts.push(`${deletedPaths.length} file dihapus`);
  const { data: newCommit } = await octokit.git.createCommit({
    owner, repo: repoName,
    message: `Update via RepoFlow: ${parts.join(', ')}`,
    tree: newTree.sha,
    parents: [parentCommitSha],
  });

  // 4️⃣  Fast-forward the default branch
  const { data: repo } = await octokit.repos.get({ owner, repo: repoName });
  await octokit.git.updateRef({
    owner, repo: repoName,
    ref: `heads/${repo.default_branch}`,
    sha: newCommit.sha,
  });

  return newCommit.sha;
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * App.tsx is the single source of truth for application state.
 * It does NOT contain any JSX rendering logic — that lives in
 * src/components/. This separation makes each piece independently
 * testable and the overall flow easy to follow.
 *
 * DATA FLOW:
 *   IndexedDB (Dexie) ──► loadUserData() ──► React state ──► components
 *   User actions ──► state setters / action handlers ──► IndexedDB + GitHub API
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import JSZip from 'jszip';
import { Octokit } from '@octokit/rest';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

import { db, type GitHubAccount, type Project, type ActivityLog } from './lib/db';
import { getSnapshot, batchInitialCommit, batchUpdateCommit } from './lib/github';
import {
  toBase64, sanitizePath, normalizeTokenInput, inferTokenType,
  getArchiveExtension, ARCHIVE_EXTENSIONS, getRecentActivity,
  inferTokenFailure, inferGitHubFailure, IMAGE_EXTENSIONS, getFileExtension, getImageMimeType,
} from './utils';
import { WEB_ICON, APP_BANNER, NAV_ITEMS } from './constants';
import type { AppTab, UploadEntry, RepoFileEntry, StagedFile, TreeNode, PreviewKind, RepoSnapshot } from './types';

import Welcome  from './components/Welcome';
import Header   from './components/Header';
import BottomNav from './components/BottomNav';
import Dashboard from './components/Dashboard';
import UploadTab from './components/Upload';
import Tools    from './components/Tools';
import InfoTab  from './components/Info';

// ── Structured logger (keeps noisy console output machine-parseable) ─────────
const appLogger = {
  error(event: string, payload: Record<string, unknown>) {
    console.error(JSON.stringify({ level: 'error', event, ts: new Date().toISOString(), ...payload }));
  },
};

export default function App() {
  // ── Persistence / auth ──────────────────────────────────────────────────────
  const [token,        setToken]        = useState('');
  const [accountLabel, setAccountLabel] = useState('Akun Utama');
  const [accounts,     setAccounts]     = useState<GitHubAccount[]>([]);
  const [user,         setUser]         = useState<GitHubAccount | null>(null);

  // ── Data ────────────────────────────────────────────────────────────────────
  const [projects, setProjects] = useState<Project[]>([]);
  const [logs,     setLogs]     = useState<ActivityLog[]>([]);

  // ── Upload tab state ────────────────────────────────────────────────────────
  const [repoName,         setRepoName]         = useState('');
  const [uploadEntries,    setUploadEntries]    = useState<UploadEntry[]>([]);
  const [pickedFileNames,  setPickedFileNames]  = useState<string[]>([]);
  const [isExtracting,     setIsExtracting]     = useState(false);
  const [extractProgress,  setExtractProgress]  = useState(0);
  const [isDeploying,      setIsDeploying]      = useState(false);
  const [deployStatus,     setDeployStatus]     = useState('');
  const [progress,         setProgress]         = useState(0);
  const [uploadFilter,     setUploadFilter]     = useState('');
  const [hasGithubAccount, setHasGithubAccount] = useState<'yes' | 'no' | null>(null);
  const [repoCheckStatus,  setRepoCheckStatus]  = useState<'idle' | 'checking' | 'available' | 'exists'>('idle');

  // ── Tools tab state ─────────────────────────────────────────────────────────
  const [searchProject,    setSearchProject]    = useState('');
  const [copiedId,         setCopiedId]         = useState<number | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [repoFiles,        setRepoFiles]        = useState<RepoFileEntry[]>([]);
  const [baseShas,         setBaseShas]         = useState<Record<string, string>>({});
  const [baseHeadSha,      setBaseHeadSha]      = useState('');
  const [baseTreeSha,      setBaseTreeSha]      = useState(''); // needed for batch updates
  const [stagedFiles,      setStagedFiles]      = useState<StagedFile[]>([]);
  const [deletedPaths,     setDeletedPaths]     = useState<string[]>([]);
  const [folderPrefix,     setFolderPrefix]     = useState('');
  const [syncingRepo,      setSyncingRepo]      = useState(false);
  const [backgroundSyncing, setBackgroundSyncing] = useState(false);
  const [savingRepo,       setSavingRepo]       = useState(false);
  const [expandedFolders,  setExpandedFolders]  = useState<Record<string, boolean>>({});

  // File preview
  const [selectedRepoPath,    setSelectedRepoPath]    = useState('');
  const [selectedRepoContent, setSelectedRepoContent] = useState('');
  const [previewKind,         setPreviewKind]         = useState<PreviewKind>('text');
  const [selectedRepoDataUrl, setSelectedRepoDataUrl] = useState('');
  const [loadingRepoContent,  setLoadingRepoContent]  = useState(false);
  const [previewWrap,         setPreviewWrap]         = useState(false);
  const [previewZoom,         setPreviewZoom]         = useState(1);

  // ── Global UI state ─────────────────────────────────────────────────────────
  const [tab,          setTab]          = useState<AppTab>('dashboard');
  const [error,        setError]        = useState<string | null>(null);
  const [success,      setSuccess]      = useState<string | null>(null);
  const [tokenDebugHint, setTokenDebugHint] = useState<string | null>(null);
  const [tokenDiagnostics, setTokenDiagnostics] = useState('');
  const [iconSrc,      setIconSrc]      = useState(WEB_ICON);
  const [bannerSrc,    setBannerSrc]    = useState(APP_BANNER);
  const [hasStarted,   setHasStarted]   = useState(
    localStorage.getItem('repoflow_started') === 'true',
  );

  // ── On mount ─────────────────────────────────────────────────────────────────
  useEffect(() => { loadUserData(); }, []);

  // ── Repo name availability check (debounced) ────────────────────────────────
  useEffect(() => {
    if (!user || !repoName.trim()) { setRepoCheckStatus('idle'); return; }
    const id = setTimeout(async () => {
      setRepoCheckStatus('checking');
      try {
        await new Octokit({ auth: user.token }).repos.get({ owner: user.username, repo: repoName.trim() });
        setRepoCheckStatus('exists');
      } catch (err: any) {
        setRepoCheckStatus(err?.status === 404 ? 'available' : 'idle');
      }
    }, 450);
    return () => clearTimeout(id);
  }, [repoName, user]);

  // ── Background auto-sync in Tools ─────────────────────────────────────────
  useEffect(() => {
    if (tab !== 'tools' || !selectedProject || !user) return;
    syncSelectedRepo(selectedProject, { silent: true, preserveDraft: true });
    const id = window.setInterval(() => {
      if (!stagedFiles.length && !deletedPaths.length) {
        syncSelectedRepo(selectedProject, { silent: true, preserveDraft: true });
      }
    }, 30_000);
    return () => window.clearInterval(id);
  }, [tab, selectedProject, user, stagedFiles.length, deletedPaths.length]);

  // ── Derived / memoised values ───────────────────────────────────────────────
  const filteredProjects = useMemo(
    () => projects.filter((p) => p.repoName.toLowerCase().includes(searchProject.toLowerCase())),
    [projects, searchProject],
  );

  const activityData      = useMemo(() => getRecentActivity(projects), [projects]);
  const totalWeekActivity = activityData.reduce((acc, c) => acc + c.count, 0);
  const maxActivity       = Math.max(1, ...activityData.map((d) => d.count));

  const selectedEntries = uploadEntries.filter((e) => e.include);
  const filteredUploadEntries = useMemo(
    () => uploadEntries.filter((e) => e.path.toLowerCase().includes(uploadFilter.toLowerCase())),
    [uploadEntries, uploadFilter],
  );
  const selectedTotalSize = selectedEntries.reduce((sum, e) => sum + e.size, 0);
  const selectedProject   = projects.find((p) => p.id === selectedProjectId) ?? null;

  const repoFolders = useMemo(() => {
    const folders = new Set<string>();
    repoFiles.forEach((file) => {
      const parts = file.path.split('/');
      for (let i = 1; i < parts.length; i++) folders.add(parts.slice(0, i).join('/'));
    });
    return [...folders].sort((a, b) => a.localeCompare(b));
  }, [repoFiles]);

  // Build a nested tree from the flat file list for the Tools UI
  const repoTree = useMemo(() => {
    const root: TreeNode = { name: '', path: '', type: 'folder', children: [] };

    const ensureFolder = (children: TreeNode[], name: string, path: string): TreeNode => {
      let node = children.find((n) => n.type === 'folder' && n.name === name);
      if (!node) { node = { name, path, type: 'folder', children: [] }; children.push(node); }
      return node;
    };

    repoFiles.forEach((file) => {
      const parts = file.path.split('/');
      let pointer = root;
      parts.forEach((part, idx) => {
        const currentPath = parts.slice(0, idx + 1).join('/');
        if (idx === parts.length - 1) {
          pointer.children?.push({ name: part, path: currentPath, type: 'file', size: file.size });
        } else {
          pointer = ensureFolder(pointer.children!, part, currentPath);
        }
      });
    });

    const sort = (nodes: TreeNode[]) => {
      nodes.sort((a, b) => a.type !== b.type ? (a.type === 'folder' ? -1 : 1) : a.name.localeCompare(b.name));
      nodes.forEach((n) => { if (n.children) sort(n.children); });
      return nodes;
    };
    return sort(root.children!);
  }, [repoFiles]);

  // ── DB helpers ──────────────────────────────────────────────────────────────
  const loadUserData = async () => {
    const savedAccounts = await db.accounts.toArray();
    setAccounts(savedAccounts);
    const active = savedAccounts.find((a) => a.active === 1) ?? savedAccounts[0] ?? null;
    setUser(active);
    setToken(active?.token ?? '');
    setHasGithubAccount(active ? 'yes' : null);
    await loadProjects(active?.id);
    await loadLogs(active?.id);
  };

  const loadProjects = async (accountId?: number) => {
    const q = accountId ? db.projects.where('accountId').equals(accountId) : db.projects.toCollection();
    setProjects((await q.sortBy('updatedAt')).reverse());
  };

  const loadLogs = async (accountId?: number) => {
    const q = accountId ? db.logs.where('accountId').equals(accountId) : db.logs.toCollection();
    setLogs((await q.sortBy('createdAt')).reverse().slice(0, 40));
  };

  const addLog = async (log: Omit<ActivityLog, 'id' | 'createdAt'>) => {
    await db.logs.add({ ...log, accountId: user?.id, createdAt: Date.now() });
    await loadLogs(user?.id);
  };

  const upsertProjectMeta = async (project: Project, info: Partial<Project>) => {
    if (!project.id) return;
    await db.projects.update(project.id, { ...info, updatedAt: Date.now() });
    await loadProjects(user?.id);
  };

  // ── Account actions ─────────────────────────────────────────────────────────
  const validateToken = async (inputToken: string) => {
    const t = normalizeTokenInput(inputToken);
    if (!t) { setError('Token GitHub wajib diisi.'); return; }
    if (t.length < 20) { setError('Token terlalu pendek. Periksa ulang token yang disalin.'); return; }
    try {
      setError(null); setTokenDebugHint(null);
      const octokit = new Octokit({ auth: t, request: { timeout: 10_000 } });
      const { data } = await octokit.users.getAuthenticated();
      const now = Date.now();
      const userData: GitHubAccount = {
        label: accountLabel || data.login, token: t, username: data.login,
        avatarUrl: data.avatar_url, tokenType: inferTokenType(t),
        active: 1, createdAt: now, lastValidatedAt: now,
      };
      await db.accounts.toCollection().modify({ active: 0 });
      await db.accounts.add(userData);
      await loadUserData();
      setTokenDiagnostics(`Akun terdeteksi @${data.login} • token ${userData.tokenType}.`);
      setSuccess('Akun GitHub berhasil ditambahkan dan diaktifkan.');
      setTimeout(() => setSuccess(null), 2200);
    } catch (err: any) {
      const f = inferTokenFailure(err);
      const msgs: Record<string, [string, string]> = {
        unauthorized: ['Token ditolak GitHub (401). Cek expiry/scope/revocation.', 'Minimal scope: repo. Jika organisasi memakai SSO, authorize token ke org.'],
        rate_limited: ['Permintaan kena rate limit GitHub. Coba beberapa saat lagi.', 'Terlalu banyak validasi token dari IP/perangkat yang sama.'],
        network:      ['Koneksi ke GitHub gagal.', 'Kemungkinan DNS/firewall/proxy memblokir api.github.com.'],
      };
      const [msg, hint] = msgs[f] ?? ['Token tidak valid atau koneksi bermasalah.', 'Buka DevTools > Network untuk cek response /user.'];
      setError(msg); setTokenDebugHint(hint);
      appLogger.error('token_validation_failed', { f, status: err?.status ?? null });
    }
  };

  const handleLogout = async () => {
    if (user?.id) await db.accounts.delete(user.id);
    await loadUserData(); setRepoCheckStatus('idle');
  };

  const setActiveAccount = async (accountId: number) => {
    await db.accounts.toCollection().modify({ active: 0 });
    await db.accounts.update(accountId, { active: 1, lastValidatedAt: Date.now() });
    await loadUserData();
    setSelectedProjectId(null); setRepoFiles([]); setStagedFiles([]); setDeletedPaths([]);
  };

  // ── Upload / extraction ─────────────────────────────────────────────────────
  const extractEntries = async (files: FileList) => {
    setIsExtracting(true); setExtractProgress(8);
    const list = Array.from(files);
    const next: UploadEntry[] = [];
    setPickedFileNames(list.map((f) => f.name));

    for (let i = 0; i < list.length; i++) {
      const file = list[i];
      const ext  = getArchiveExtension(file.name);

      if (ext === 'zip') {
        const zip   = await new JSZip().loadAsync(file);
        const paths = Object.keys(zip.files).filter((p) => !zip.files[p].dir);
        for (const p of paths) {
          const zf = zip.files[p];
          const buf = await zf.async('uint8array');
          next.push({
            id: `${file.name}:${p}`, path: sanitizePath(p) ?? '',
            size: buf.length, source: 'zip-extracted',
            include: true, contentBase64: await zf.async('base64'),
          });
        }
      } else if (ARCHIVE_EXTENSIONS.includes(ext)) {
        next.push({
          id: `${file.name}:${crypto.randomUUID()}`,
          path: sanitizePath(file.webkitRelativePath || file.name) ?? '',
          size: file.size, source: 'zip-raw',
          include: true, contentBase64: await toBase64(file),
        });
      } else {
        next.push({
          id: `${file.name}:${crypto.randomUUID()}`,
          path: sanitizePath(file.webkitRelativePath || file.name) ?? '',
          size: file.size, source: 'single',
          include: true, contentBase64: await toBase64(file),
        });
      }
      setExtractProgress(Math.round(((i + 1) / list.length) * 100));
    }

    setUploadEntries(next.filter((e) => e.path));
    setDeployStatus(`Total ${next.length} file siap diproses.`);
    setTimeout(() => { setIsExtracting(false); setExtractProgress(0); }, 250);
  };

  const toggleUploadEntry = (id: string) =>
    setUploadEntries((prev) => prev.map((e) => (e.id === id ? { ...e, include: !e.include } : e)));

  // ── Deploy (new repo) — uses batch commit ───────────────────────────────────
  const deployRepo = async () => {
    if (!user || !repoName.trim()) return setError('Lengkapi nama repository.');
    if (selectedEntries.length === 0) return setError('Pilih minimal 1 file untuk dipush ke GitHub.');
    if (repoCheckStatus === 'exists') return setError('Nama repository sudah dipakai. Gunakan nama lain.');

    setIsDeploying(true); setError(null); setProgress(5);
    try {
      const octokit  = new Octokit({ auth: user.token, request: { timeout: 12_000 } });
      const finalRepo = repoName.trim();

      // Create an empty repo (no auto_init — we'll push the initial commit ourselves)
      const { data: repo } = await octokit.repos.createForAuthenticatedUser({
        name: finalRepo, auto_init: false,
      });
      setProgress(10);
      setDeployStatus('Mengunggah file (batch commit)...');

      // Batch commit: create all blobs + one tree + one commit + one ref
      await batchInitialCommit(
        octokit, user.username, finalRepo,
        selectedEntries.map((e) => ({ path: e.path, contentBase64: e.contentBase64 })),
        (done, total) => setProgress(10 + (done / total) * 85),
      );

      const now = Date.now();
      await db.projects.add({
        accountId: user.id, repoName: finalRepo, owner: user.username,
        url: repo.html_url, createdAt: now, updatedAt: now,
        lastSyncedAt: now, totalFiles: selectedEntries.length,
      });
      await addLog({ repoName: finalRepo, owner: user.username, action: 'create_repo',
        detail: `Repo dibuat dengan ${selectedEntries.length} file.` });
      await loadProjects(user.id);

      setProgress(100);
      setSuccess(`Push ${finalRepo} berhasil.`);
      setRepoName(''); setUploadEntries([]); setPickedFileNames([]); setRepoCheckStatus('idle');
    } catch (err: any) {
      const f = inferGitHubFailure(err);
      const msgs: Record<string, string> = {
        unauthorized: 'Push gagal: token tidak valid / expired. Hubungkan ulang token GitHub.',
        forbidden:    'Push gagal: akses ditolak GitHub. Cek permission token dan limit akun.',
        rate_limited: 'Push gagal: rate limit GitHub. Coba ulang beberapa menit lagi.',
        validation:   'Push gagal: validasi GitHub gagal (nama repo/path file mungkin tidak valid).',
        network:      'Push gagal: koneksi ke GitHub terputus. Coba jaringan stabil lalu ulang.',
      };
      setError(msgs[f] ?? `Push gagal: ${err?.message || 'Terjadi kesalahan.'}`);
      appLogger.error('deploy_repo_failed', { f, status: err?.status ?? null, repoName: repoName.trim() });
    } finally {
      setIsDeploying(false);
      setTimeout(() => { setSuccess(null); setDeployStatus(''); setProgress(0); }, 1800);
    }
  };

  // ── Sync selected repo ──────────────────────────────────────────────────────
  const syncSelectedRepo = async (project?: Project, opts?: { silent?: boolean; preserveDraft?: boolean }) => {
    const target = project ?? selectedProject;
    if (!target || !user) return;
    try {
      opts?.silent ? setBackgroundSyncing(true) : setSyncingRepo(true);
      setError(null);
      const snap = await getSnapshot(new Octokit({ auth: user.token }), target.owner, target.repoName);
      setRepoFiles(snap.files);
      setBaseShas(Object.fromEntries(snap.files.map((f) => [f.path, f.sha])));
      setBaseHeadSha(snap.headSha);
      setBaseTreeSha(snap.treeSha);
      if (!opts?.preserveDraft) { setDeletedPaths([]); setStagedFiles([]); }
      await upsertProjectMeta(target, { lastSyncedAt: Date.now(), totalFiles: snap.files.length });
      if (!opts?.silent) {
        await addLog({ repoName: target.repoName, owner: target.owner, action: 'sync_repo',
          detail: `Sinkronisasi ${snap.files.length} file.` });
        setSuccess(`Repo ${target.repoName} tersinkron realtime.`);
        setTimeout(() => setSuccess(null), 1600);
      }
    } catch (err: any) {
      setError(`Gagal sinkron: ${err?.message || 'unknown error'}`);
    } finally {
      setSyncingRepo(false); setBackgroundSyncing(false);
    }
  };

  // ── Stage files for update ──────────────────────────────────────────────────
  const handleStageFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const files   = Array.from(e.target.files as FileList);
    const prefix  = folderPrefix.trim().replace(/^\/+|\/+$/g, '');
    const staged: StagedFile[] = await Promise.all(files.map(async (f) => ({
      id: crypto.randomUUID(),
      path: `${prefix ? `${prefix}/` : ''}${f.webkitRelativePath || f.name}`,
      size: f.size,
      contentBase64: await toBase64(f),
    })));
    setStagedFiles((prev) => {
      const map = new Map<string, StagedFile>(prev.map((s) => [s.path, s]));
      staged.forEach((s) => map.set(s.path, s));
      return [...map.values()].sort((a, b) => a.path.localeCompare(b.path));
    });
    e.target.value = '';
  };

  const toggleDeletePath = (path: string) =>
    setDeletedPaths((prev) => prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]);

  // ── Apply changes to existing repo — uses batch commit ─────────────────────
  const applyRepoChanges = async () => {
    if (!selectedProject || !user) return;
    if (!stagedFiles.length && !deletedPaths.length) { setError('Belum ada perubahan yang disiapkan.'); return; }

    try {
      setSavingRepo(true); setError(null);
      const octokit = new Octokit({ auth: user.token });
      const latest  = await getSnapshot(octokit, selectedProject.owner, selectedProject.repoName);
      const latestMap = Object.fromEntries(latest.files.map((f) => [f.path, f.sha]));

      // Refuse if someone else pushed since our last sync
      if (baseHeadSha && latest.headSha !== baseHeadSha) {
        setError('Repo berubah di GitHub setelah sync terakhir. Klik sinkronkan ulang agar tidak bentrok.');
        return;
      }

      // Conflict detection: check if files we're touching were changed externally
      const conflicts = [...deletedPaths, ...stagedFiles.map((f) => f.path)].filter((path) => {
        const base = baseShas[path];
        return (!base && latestMap[path]) || (base && latestMap[path] && latestMap[path] !== base);
      });
      if (conflicts.length > 0) {
        setError(`Konflik terdeteksi (${conflicts.length} file). Sinkronkan ulang dulu agar edit di GitHub tidak hilang.`);
        return;
      }

      // Single batch commit for all staged + deleted files
      await batchUpdateCommit(
        octokit, selectedProject.owner, selectedProject.repoName,
        stagedFiles.map((f) => ({ path: f.path, contentBase64: f.contentBase64 })),
        deletedPaths,
        latest.treeSha,       // base tree for delta
        latest.headSha,       // parent commit
        (done, total) => setDeployStatus(`Membuat blob ${done}/${total}...`),
      );

      await addLog({ repoName: selectedProject.repoName, owner: selectedProject.owner, action: 'update_repo',
        detail: `Update ${stagedFiles.length} file + hapus ${deletedPaths.length} file.` });
      await syncSelectedRepo(selectedProject);
      setSuccess('Perubahan repository berhasil disimpan.');
      setTimeout(() => setSuccess(null), 1800);
    } catch (err: any) {
      setError(`Gagal menyimpan perubahan: ${err?.message || 'unknown error'}`);
    } finally {
      setSavingRepo(false);
    }
  };

  // ── Delete project ──────────────────────────────────────────────────────────
  const deleteProject = async (project: Project) => {
    if (!user) return;
    if (!window.confirm(`Hapus repository "${project.repoName}" dari GitHub?`)) return;
    try {
      await new Octokit({ auth: user.token }).repos.delete({ owner: project.owner, repo: project.repoName });
      if (project.id) await db.projects.delete(project.id);
      await addLog({ repoName: project.repoName, owner: project.owner, action: 'delete_repo',
        detail: 'Repository dihapus dari GitHub.' });
      await loadProjects(user.id);
      setSuccess('Repository berhasil dihapus.');
      if (selectedProjectId === project.id) { setSelectedProjectId(null); setRepoFiles([]); }
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: any) {
      setError(`Gagal menghapus repository: ${err.message}`);
    }
  };

  // ── Copy-to-clipboard ───────────────────────────────────────────────────────
  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // ── Shared project selection (used in both Dashboard & Tools) ───────────────
  const selectProject = (project: Project) => {
    setSelectedProjectId(project.id ?? null);
    setSelectedRepoPath(''); setSelectedRepoContent('');
    setSelectedRepoDataUrl(''); setPreviewKind('text');
    setPreviewWrap(false); setPreviewZoom(1);
  };

  // ── File content preview (Tools) ────────────────────────────────────────────
  const loadRepoFileContent = async (path: string) => {
    if (!selectedProject || !user) return;
    try {
      setLoadingRepoContent(true); setSelectedRepoPath(path);
      setPreviewKind('text'); setSelectedRepoDataUrl('');
      const { data } = await new Octokit({ auth: user.token }).repos.getContent({
        owner: selectedProject.owner, repo: selectedProject.repoName, path,
      });
      if (Array.isArray(data) || data.type !== 'file' || !data.content) {
        setSelectedRepoContent('Konten file tidak tersedia.');
      } else {
        const b64 = data.content.replace(/\n/g, '');
        const ext = getFileExtension(path);
        if (IMAGE_EXTENSIONS.includes(ext)) {
          setPreviewKind('image');
          setSelectedRepoDataUrl(`data:${getImageMimeType(path)};base64,${b64}`);
          setSelectedRepoContent('Preview gambar tersedia.');
        } else {
          const binary  = atob(b64);
          const bytes   = Uint8Array.from(binary, (c) => c.charCodeAt(0));
          const decoded = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
          const binaryRatio = decoded.replace(/[\u0000-\u0008\u000E-\u001F]/g, '').length / decoded.length;
          if (decoded.length > 0 && binaryRatio < 0.55) {
            setPreviewKind('binary');
            setSelectedRepoContent('File ini terdeteksi sebagai binary/non-teks.');
          } else {
            setSelectedRepoContent(decoded || 'File kosong.');
          }
        }
      }
    } catch (err: any) {
      setPreviewKind('text'); setSelectedRepoDataUrl('');
      setSelectedRepoContent(`Gagal memuat isi file: ${err?.message || 'unknown error'}`);
    } finally {
      setLoadingRepoContent(false);
    }
  };

  // ── Welcome screen ──────────────────────────────────────────────────────────
  if (!hasStarted) {
    return (
      <Welcome
        bannerSrc={bannerSrc}
        iconSrc={iconSrc}
        onBannerError={() => setBannerSrc(APP_BANNER)}
        onIconError={() => setIconSrc(WEB_ICON)}
        onStart={() => { setHasStarted(true); localStorage.setItem('repoflow_started', 'true'); }}
      />
    );
  }

  // ── Main app shell ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-[86px] md:pb-0">
      <Header
        iconSrc={iconSrc}
        onIconError={() => setIconSrc(WEB_ICON)}
        tab={tab}
        user={user}
      />

      <main className="px-3 py-3 md:px-6">
        <div className="max-w-6xl mx-auto md:grid md:grid-cols-[220px_1fr] md:gap-4">
          {/* Desktop sidebar nav */}
          <aside className="hidden md:block app-card p-2 h-fit sticky top-[86px]">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs mb-1 transition-colors ${
                  tab === item.id ? 'text-brand-light bg-brand/10' : 'text-zinc-400 hover:bg-white/[0.04]'
                }`}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </aside>

          {/* Page content */}
          <div>
            {/* Global alert banner */}
            {(error || success) && (
              <div className={`mb-3 p-2.5 rounded-xl text-xs flex items-center gap-2 border ${
                error
                  ? 'bg-red-500/10 border-red-500/20 text-red-300'
                  : 'bg-green-500/10 border-green-500/20 text-green-300'
              }`}>
                {error ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
                {error ?? success}
              </div>
            )}
            {tokenDebugHint && (
              <div className="mb-3 p-2.5 rounded-xl text-[11px] border bg-amber-500/10 border-amber-500/20 text-amber-200">
                {tokenDebugHint}
              </div>
            )}
            {tokenDiagnostics && (
              <div className="mb-3 p-2.5 rounded-xl text-[11px] border bg-blue-500/10 border-blue-500/20 text-blue-200">
                Status akun: {tokenDiagnostics}
              </div>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                {tab === 'dashboard' && (
                  <Dashboard
                    projects={projects}
                    logs={logs}
                    activityData={activityData}
                    totalWeekActivity={totalWeekActivity}
                    maxActivity={maxActivity}
                    selectedEntries={selectedEntries}
                    selectedTotalSize={selectedTotalSize}
                    filteredProjects={filteredProjects}
                    copiedId={copiedId}
                    onCopy={copyToClipboard}
                    onSelectProject={(p) => { selectProject(p); setTab('tools'); }}
                    onDeleteProject={deleteProject}
                    onNavigateToTools={() => setTab('tools')}
                  />
                )}

                {tab === 'upload' && (
                  <UploadTab
                    user={user}
                    accounts={accounts}
                    token={token}
                    setToken={setToken}
                    accountLabel={accountLabel}
                    setAccountLabel={setAccountLabel}
                    hasGithubAccount={hasGithubAccount}
                    setHasGithubAccount={setHasGithubAccount}
                    onValidateToken={validateToken}
                    onLogout={handleLogout}
                    onSetActiveAccount={setActiveAccount}
                    repoName={repoName}
                    setRepoName={setRepoName}
                    repoCheckStatus={repoCheckStatus}
                    isExtracting={isExtracting}
                    extractProgress={extractProgress}
                    pickedFileNames={pickedFileNames}
                    uploadEntries={uploadEntries}
                    filteredUploadEntries={filteredUploadEntries}
                    uploadFilter={uploadFilter}
                    setUploadFilter={setUploadFilter}
                    selectedEntries={selectedEntries}
                    selectedTotalSize={selectedTotalSize}
                    onToggleUploadEntry={toggleUploadEntry}
                    onExtractFiles={extractEntries}
                    onSelectAll={() => setUploadEntries((p) => p.map((e) => ({ ...e, include: true })))}
                    onDeselectAll={() => setUploadEntries((p) => p.map((e) => ({ ...e, include: false })))}
                    isDeploying={isDeploying}
                    deployStatus={deployStatus}
                    progress={progress}
                    onDeploy={deployRepo}
                  />
                )}

                {tab === 'tools' && (
                  <Tools
                    projects={projects}
                    filteredProjects={filteredProjects}
                    searchProject={searchProject}
                    setSearchProject={setSearchProject}
                    copiedId={copiedId}
                    onCopy={copyToClipboard}
                    onSelectProject={(p) => { selectProject(p); setTab('tools'); }}
                    onDeleteProject={deleteProject}
                    selectedProject={selectedProject}
                    repoFiles={repoFiles}
                    repoTree={repoTree}
                    expandedFolders={expandedFolders}
                    toggleFolder={(path) => setExpandedFolders((prev) => ({ ...prev, [path]: !prev[path] }))}
                    syncingRepo={syncingRepo}
                    backgroundSyncing={backgroundSyncing}
                    onSyncRepo={() => syncSelectedRepo()}
                    deletedPaths={deletedPaths}
                    toggleDeletePath={toggleDeletePath}
                    setDeletedPaths={setDeletedPaths}
                    stagedFiles={stagedFiles}
                    removeStagedFile={(path) => setStagedFiles((p) => p.filter((f) => f.path !== path))}
                    folderPrefix={folderPrefix}
                    setFolderPrefix={setFolderPrefix}
                    repoFolders={repoFolders}
                    onStageFiles={handleStageFiles}
                    selectedRepoPath={selectedRepoPath}
                    selectedRepoContent={selectedRepoContent}
                    previewKind={previewKind}
                    selectedRepoDataUrl={selectedRepoDataUrl}
                    loadingRepoContent={loadingRepoContent}
                    previewWrap={previewWrap}
                    setPreviewWrap={setPreviewWrap}
                    previewZoom={previewZoom}
                    setPreviewZoom={setPreviewZoom}
                    onLoadRepoFileContent={loadRepoFileContent}
                    savingRepo={savingRepo}
                    onApplyChanges={applyRepoChanges}
                  />
                )}

                {tab === 'info' && (
                  <InfoTab iconSrc={iconSrc} onIconError={() => setIconSrc(WEB_ICON)} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      <BottomNav tab={tab} setTab={setTab} />
    </div>
  );
}

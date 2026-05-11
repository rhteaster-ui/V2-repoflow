/**
 * Centralized type definitions for RepoFlow.
 * Keeping types here avoids circular imports and makes refactors easier.
 */

export type AppTab = 'dashboard' | 'upload' | 'tools' | 'info';

/** A single file entry staged for upload/push */
export type UploadEntry = {
  id: string;
  path: string;
  size: number;
  source: 'single' | 'folder' | 'zip-raw' | 'zip-extracted';
  status?: 'new' | 'overwrite' | 'same' | 'delete' | 'unknown';
  include: boolean;
  contentBase64: string;
};

/** A file entry from an existing GitHub repository tree */
export type RepoFileEntry = {
  path: string;
  sha: string;   // blob SHA, used for conflict detection
  size: number;
};

/** A file staged for update/push to an existing repo */
export type StagedFile = {
  id: string;
  path: string;
  size: number;
  contentBase64: string;
};

/** Node in a recursive directory tree UI */
export type TreeNode = {
  name: string;
  path: string;
  type: 'folder' | 'file';
  size?: number;
  children?: TreeNode[];
};

export type PreviewKind = 'text' | 'image' | 'binary';

export type TokenValidationFailure =
  | 'empty'
  | 'bad_format'
  | 'unauthorized'
  | 'rate_limited'
  | 'network'
  | 'unknown';

export type GitHubFailureType =
  | 'unauthorized'
  | 'rate_limited'
  | 'forbidden'
  | 'not_found'
  | 'network'
  | 'validation'
  | 'unknown';

/** Snapshot of a GitHub repository at a point in time */
export type RepoSnapshot = {
  files: RepoFileEntry[];
  headSha: string;    // commit SHA of HEAD
  treeSha: string;    // root tree SHA (needed for batch updates)
};

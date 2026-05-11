/**
 * Pure utility functions — no React, no side-effects.
 * Keeping these separate makes unit testing trivial and keeps components clean.
 */

import type { TokenValidationFailure, GitHubFailureType } from '../types';

// ─── File size display ───────────────────────────────────────────────────────

export const bytesToReadable = (value: number): string => {
  if (!value) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(value) / Math.log(1024)), sizes.length - 1);
  return `${(value / 1024 ** i).toFixed(i === 0 ? 0 : 2)} ${sizes[i]}`;
};

// ─── File conversion ─────────────────────────────────────────────────────────

/** Convert a browser File to a base64 string (no data-URI prefix). */
export const toBase64 = async (file: File): Promise<string> => {
  const buff = new Uint8Array(await file.arrayBuffer());
  let binary = '';
  buff.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary);
};

// ─── Path utilities ───────────────────────────────────────────────────────────

/**
 * Sanitize a file path for GitHub:
 * - Normalise back-slashes to forward-slashes
 * - Strip leading/trailing slashes
 * - Block path-traversal, .DS_Store, and known junk folders
 */
export const sanitizePath = (input: string): string | null => {
  const path = input.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/');
  if (!path || path.startsWith('/') || path.includes('..')) return null;
  const blocked = ['.git/', 'node_modules/', '__MACOSX/'];
  if (blocked.some((b) => path === b.slice(0, -1) || path.startsWith(b))) return null;
  if (path.endsWith('.DS_Store')) return null;
  return path;
};

// ─── Extension helpers ────────────────────────────────────────────────────────

export const ARCHIVE_EXTENSIONS = ['zip', 'rar', '7z', 'tar', 'gz', 'tgz', 'bz2', 'xz', 'tar.gz'];
export const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif'];

export const getArchiveExtension = (fileName: string): string => {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.tar.gz')) return 'tar.gz';
  return lower.split('.').pop() || '';
};

export const getFileExtension = (fileName: string): string =>
  fileName.toLowerCase().split('.').pop() || '';

export const getImageMimeType = (path: string): string => {
  const ext = getFileExtension(path);
  if (ext === 'jpg') return 'image/jpeg';
  if (ext === 'svg') return 'image/svg+xml';
  if (ext === 'ico') return 'image/x-icon';
  return `image/${ext || 'png'}`;
};

// ─── Token helpers ────────────────────────────────────────────────────────────

/** Strip non-breaking spaces that can sneak in from clipboard pastes. */
export const normalizeTokenInput = (value: string): string =>
  value.replace(/\u00A0/g, ' ').trim();

export const inferTokenType = (token: string): 'classic' | 'fine-grained' | 'unknown' =>
  token.startsWith('github_pat_') ? 'fine-grained' : token.startsWith('gh') ? 'classic' : 'unknown';

/** Mask a token for display — show first 6 and last 4 chars only. */
export const maskToken = (token: string): string =>
  token.length < 12 ? '••••' : `${token.slice(0, 6)}••••${token.slice(-4)}`;

// ─── GitHub error inference ───────────────────────────────────────────────────

export const inferTokenFailure = (err: any): TokenValidationFailure => {
  if (err?.status === 401) return 'unauthorized';
  if (err?.status === 429) return 'rate_limited';
  if (err?.name === 'HttpError' && !err?.status) return 'network';
  return 'unknown';
};

export const inferGitHubFailure = (err: any): GitHubFailureType => {
  if (err?.status === 401) return 'unauthorized';
  if (err?.status === 403) return 'forbidden';
  if (err?.status === 404) return 'not_found';
  if (err?.status === 422) return 'validation';
  if (err?.status === 429) return 'rate_limited';
  if (err?.name === 'HttpError' && !err?.status) return 'network';
  return 'unknown';
};

// ─── Activity chart ───────────────────────────────────────────────────────────

import type { Project } from '../lib/db';

export const getRecentActivity = (projects: Project[]) => {
  const now = new Date();
  const labels = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  return [...Array(7)].map((_, i) => {
    const date = new Date(now);
    date.setDate(now.getDate() - (6 - i));
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    const count = projects.filter(
      (p) => p.updatedAt >= dayStart.getTime() && p.updatedAt <= dayEnd.getTime(),
    ).length;
    return { label: labels[date.getDay()], count };
  });
};

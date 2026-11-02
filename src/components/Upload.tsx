import React, { useRef, useState } from 'react';
import {
  AlertCircle, ChevronDown, ChevronUp, ExternalLink, FileArchive,
  FileCode2, FileImage, FileJson, FileText, FolderGit2, Key,
  Loader2, Rocket, ShieldCheck, Sparkles, Upload, UserRoundPlus,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { GitHubAccount } from '../lib/db';
import type { UploadEntry } from '../types';
import { bytesToReadable, maskToken } from '../utils';

type Props = {
  // ── Account ────────────────────────────────────────────────────
  user: GitHubAccount | null;
  accounts: GitHubAccount[];
  token: string;
  setToken: (v: string) => void;
  accountLabel: string;
  setAccountLabel: (v: string) => void;
  hasGithubAccount: 'yes' | 'no' | null;
  setHasGithubAccount: (v: 'yes' | 'no' | null) => void;
  onValidateToken: (token: string) => void;
  onLogout: () => void;
  onSetActiveAccount: (id: number) => void;
  // ── Upload state ───────────────────────────────────────────────
  repoName: string;
  setRepoName: (v: string) => void;
  repoCheckStatus: 'idle' | 'checking' | 'available' | 'exists';
  isExtracting: boolean;
  extractProgress: number;
  pickedFileNames: string[];
  uploadEntries: UploadEntry[];
  filteredUploadEntries: UploadEntry[];
  uploadFilter: string;
  setUploadFilter: (v: string) => void;
  selectedEntries: UploadEntry[];
  selectedTotalSize: number;
  onToggleUploadEntry: (id: string) => void;
  onExtractFiles: (files: FileList) => Promise<void>;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  // ── Deploy ─────────────────────────────────────────────────────
  isDeploying: boolean;
  deployStatus: string;
  progress: number;
  onDeploy: () => void;
};

function getSmartFileIcon(path: string) {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  if (['ts', 'tsx', 'js', 'jsx', 'py', 'java', 'cpp', 'c', 'cs', 'go', 'rs', 'php', 'html', 'css'].includes(ext)) {
    return <FileCode2 size={13} className="text-cyan-400 shrink-0 mt-0.5" />;
  }
  if (['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif', 'ico'].includes(ext)) {
    return <FileImage size={13} className="text-pink-400 shrink-0 mt-0.5" />;
  }
  if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) {
    return <FileArchive size={13} className="text-amber-400 shrink-0 mt-0.5" />;
  }
  if (['json', 'yaml', 'yml', 'toml', 'env', 'config'].includes(ext)) {
    return <FileJson size={13} className="text-emerald-400 shrink-0 mt-0.5" />;
  }
  return <FileText size={13} className="text-zinc-400 shrink-0 mt-0.5" />;
}

export default function UploadTab({
  user, accounts, token, setToken, accountLabel, setAccountLabel,
  hasGithubAccount, setHasGithubAccount, onValidateToken, onLogout, onSetActiveAccount,
  repoName, setRepoName, repoCheckStatus,
  isExtracting, extractProgress, pickedFileNames,
  uploadEntries, filteredUploadEntries, uploadFilter, setUploadFilter,
  selectedEntries, selectedTotalSize,
  onToggleUploadEntry, onExtractFiles, onSelectAll, onDeselectAll,
  isDeploying, deployStatus, progress, onDeploy,
}: Props) {
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // ── UI States ────────────────────────────────────────────────────────────
  const [isDragging, setIsDragging] = useState(false);
  const [showFileDetail, setShowFileDetail] = useState(false);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isDeploying || isExtracting) return;
    const files = e.dataTransfer.files;
    if (files.length) await onExtractFiles(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes('Files')) setIsDragging(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    await onExtractFiles(e.target.files);
    e.target.value = '';
  };

  return (
    <div className="space-y-3.5">
      {/* ── Section 1: GitHub Account ─────────────────────────────────────── */}
      <section className="app-card p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand/15 border border-brand/25 flex items-center justify-center">
              <Key size={14} className="text-brand-light" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Akun GitHub</h3>
              <p className="text-[11px] text-zinc-500">Otorisasi Personal Access Token</p>
            </div>
          </div>
          {user && (
            <button
              onClick={onLogout}
              className="text-[11px] font-medium px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-300 border border-red-500/20 hover:bg-red-500/20 transition-colors"
            >
              Putuskan
            </button>
          )}
        </div>

        {!user ? (
          <div className="space-y-3 pt-1">
            <p className="text-xs text-zinc-300">Apakah Anda sudah memiliki akun GitHub?</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setHasGithubAccount('yes')}
                className={`text-xs py-2 rounded-xl border transition-all font-medium ${
                  hasGithubAccount === 'yes'
                    ? 'bg-brand/20 border-brand/50 text-white shadow-sm'
                    : 'border-white/10 bg-white/[0.02] text-zinc-300 hover:bg-white/[0.05]'
                }`}
              >
                Sudah punya
              </button>
              <button
                onClick={() => setHasGithubAccount('no')}
                className={`text-xs py-2 rounded-xl border transition-all font-medium ${
                  hasGithubAccount === 'no'
                    ? 'bg-brand/20 border-brand/50 text-white shadow-sm'
                    : 'border-white/10 bg-white/[0.02] text-zinc-300 hover:bg-white/[0.05]'
                }`}
              >
                Belum punya
              </button>
            </div>

            {hasGithubAccount === 'no' && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <p className="text-xs text-amber-200">Silakan buat akun GitHub gratis terlebih dahulu.</p>
                <a
                  href="https://github.com/signup"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300 hover:underline"
                >
                  <UserRoundPlus size={13} /> Daftar GitHub <ExternalLink size={13} />
                </a>
              </div>
            )}

            {hasGithubAccount === 'yes' && (
              <div className="space-y-2.5 pt-1">
                <input
                  type="text"
                  value={accountLabel}
                  onChange={(e) => setAccountLabel(e.target.value)}
                  placeholder="Nama label akun (contoh: Akun Utama)"
                  className="input-modern"
                />
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Masukkan Personal Access Token (ghp_...)"
                  className="input-modern"
                />
                <button onClick={() => onValidateToken(token)} className="btn-primary w-full text-xs py-2.5">
                  Validasi & Simpan Akun
                </button>

                {accounts.length > 0 && (
                  <div className="rounded-xl border border-white/10 bg-black/20 p-2 space-y-1.5">
                    <p className="text-[11px] font-medium text-zinc-400">Pilih akun tersimpan</p>
                    {accounts.map((acc) => (
                      <button
                        key={acc.id}
                        onClick={() => acc.id && onSetActiveAccount(acc.id)}
                        className={`w-full text-left text-xs p-2 rounded-lg border transition-colors ${
                          user?.id === acc.id
                            ? 'border-brand/40 bg-brand/10 text-white'
                            : 'border-white/5 bg-white/[0.02] text-zinc-300 hover:bg-white/[0.05]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{acc.label} (@{acc.username})</span>
                          <span className="text-[10px] text-zinc-500">{maskToken(acc.token)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <a
                  href="https://github.com/settings/tokens/new?scopes=repo,delete_repo&description=RepoFlow_App"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors pt-1"
                >
                  <ShieldCheck size={13} className="text-emerald-400" /> Buat token di GitHub (scope: repo)
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-brand/[0.08] border border-brand/25 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={user.avatarUrl} alt={user.username} className="w-9 h-9 rounded-xl border border-white/20" />
              <div>
                <p className="text-xs font-semibold text-white">@{user.username}</p>
                <p className="text-[10px] text-zinc-400">{user.label} • {user.tokenType}</p>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium">
              Aktif
            </span>
          </div>
        )}
      </section>

      {/* ── Section 2: Upload Workflow (Target & Dropzone) ──────────────────── */}
      <section className="app-card p-3.5 space-y-3.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-brand/15 border border-brand/25 flex items-center justify-center">
            <FolderGit2 size={14} className="text-brand-light" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Target Repository</h3>
            <p className="text-[11px] text-zinc-500">Nama repo tujuan push ke GitHub</p>
          </div>
        </div>

        {/* Repo name input */}
        <div className="space-y-1">
          <input
            type="text"
            value={repoName}
            onChange={(e) => setRepoName(e.target.value.replace(/\s+/g, '-'))}
            placeholder="nama-repository-anda"
            className="input-modern"
          />
          {repoCheckStatus === 'checking'  && <p className="text-[11px] text-zinc-400">⏳ Memeriksa ketersediaan nama repo...</p>}
          {repoCheckStatus === 'available' && <p className="text-[11px] text-emerald-400">✓ Nama repo tersedia di akun Anda.</p>}
          {repoCheckStatus === 'exists'    && <p className="text-[11px] text-amber-400">⚠️ Nama repo sudah ada (akan ditambahkan/update).</p>}
        </div>

        {/* ── Dropzone Area ──────────────────────────────────────────────── */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={() => setIsDragging(false)}
          onClick={() => !isDeploying && !isExtracting && fileInputRef.current?.click()}
          className={`rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all select-none ${
            isDragging
              ? 'border-brand bg-brand/[0.12] scale-[1.01]'
              : pickedFileNames.length
                ? 'border-brand/40 bg-brand/[0.04]'
                : 'border-white/10 bg-white/[0.015] hover:border-white/25 hover:bg-white/[0.03]'
          }`}
        >
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple />
          <input type="file" ref={folderInputRef} onChange={handleFileChange} className="hidden" multiple
            {...({ webkitdirectory: 'true', directory: 'true' } as any)} />

          {isDragging ? (
            <div className="space-y-2 pointer-events-none">
              <Upload size={24} className="mx-auto text-brand-light animate-bounce" />
              <p className="text-xs text-brand-light font-semibold">Lepaskan file di sini</p>
            </div>
          ) : pickedFileNames.length > 0 ? (
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-full bg-brand/20 border border-brand/40 flex items-center justify-center mx-auto text-brand-light">
                <FileArchive size={20} />
              </div>
              <p className="text-xs font-semibold text-white">{pickedFileNames.length} file / archive terpilih</p>
              <p className="text-[11px] text-zinc-400">Klik lagi jika ingin mengganti file</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto text-zinc-400">
                <Upload size={18} />
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-200">
                  Tap / Drag & drop file ZIP project ke sini
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Mendukung .zip, .tar.gz, folder, serta semua file source code
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary text-xs py-2"
            disabled={isDeploying || isExtracting}
          >
            <Upload size={13} /> Pilih File ZIP
          </button>
          <button
            onClick={() => folderInputRef.current?.click()}
            className="btn-secondary text-xs py-2"
            disabled={isDeploying || isExtracting}
          >
            <FileArchive size={13} /> Pilih Folder
          </button>
        </div>

        {/* Extraction progress */}
        {isExtracting && (
          <div className="space-y-1.5 p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center justify-between text-xs text-zinc-300">
              <span className="flex items-center gap-1.5 font-medium">
                <Loader2 size={13} className="animate-spin text-brand-light" /> Ekstraksi file di browser...
              </span>
              <span className="font-mono text-zinc-400">{extractProgress}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-brand via-violet-500 to-cyan-400"
                initial={{ width: 0 }}
                animate={{ width: `${extractProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* ── Extracted Files Summary & Collapsible Detail ────────────────── */}
        {uploadEntries.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-white">
                  📦 {selectedEntries.length} dari {uploadEntries.length} file siap dipush
                </p>
                <p className="text-[11px] text-zinc-400">Total payload: {bytesToReadable(selectedTotalSize)}</p>
              </div>
              <button
                onClick={() => setShowFileDetail(!showFileDetail)}
                className="text-xs px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/10 text-zinc-300 hover:text-white flex items-center gap-1 transition-colors"
              >
                {showFileDetail ? 'Sembunyikan' : 'Rincian File'}
                {showFileDetail ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
            </div>

            {showFileDetail && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-2 border-t border-white/5 space-y-2"
              >
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    value={uploadFilter}
                    onChange={(e) => setUploadFilter(e.target.value)}
                    placeholder="Filter file atau folder..."
                    className="input-modern text-xs py-1.5 flex-1"
                  />
                  <div className="flex gap-2">
                    <button onClick={onSelectAll} className="btn-secondary text-[11px] py-1 px-2.5">Pilih semua</button>
                    <button onClick={onDeselectAll} className="btn-secondary text-[11px] py-1 px-2.5">Lepas semua</button>
                  </div>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                  {filteredUploadEntries.map((entry) => (
                    <label
                      key={entry.id}
                      className="flex items-center gap-2 text-xs rounded-lg px-2.5 py-1.5 bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={entry.include}
                        onChange={() => onToggleUploadEntry(entry.id)}
                        className="rounded border-zinc-700 text-brand focus:ring-brand/30"
                      />
                      {getSmartFileIcon(entry.path)}
                      <span className="text-zinc-300 break-all flex-1 font-mono text-[11px] leading-tight" title={entry.path}>
                        {entry.path}
                      </span>
                      <span className="text-[10px] text-zinc-500 shrink-0 font-mono">
                        {bytesToReadable(entry.size)}
                      </span>
                    </label>
                  ))}
                  {filteredUploadEntries.length === 0 && (
                    <p className="text-xs text-zinc-500 py-2 text-center">Tidak ada file yang sesuai filter.</p>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* ── Action Push Button ─────────────────────────────────────────── */}
        <button
          onClick={onDeploy}
          disabled={isDeploying || !user || !repoName || selectedEntries.length === 0}
          className="btn-primary w-full text-sm py-3 mt-1"
        >
          {isDeploying ? (
            <><Loader2 size={16} className="animate-spin" /> {deployStatus}</>
          ) : (
            <><Rocket size={16} /> Push ke GitHub ({selectedEntries.length} File)</>
          )}
        </button>

        {isDeploying && (
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[11px] text-zinc-400">
              <span>Proses Git Tree Batch Commit</span>
              <span className="font-mono font-semibold">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-brand via-violet-500 to-emerald-400"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Atomic Batch Tip */}
        {selectedEntries.length > 5 && !isDeploying && (
          <div className="p-3 rounded-xl bg-brand/10 border border-brand/20 text-[11px] text-brand-light flex items-start gap-2.5">
            <Sparkles size={14} className="shrink-0 mt-0.5 text-cyan-400" />
            <span className="leading-relaxed">
              <strong>{selectedEntries.length} file</strong> akan dipush dalam <strong>1 commit atomik</strong> menggunakan Git Tree API (sangat hemat rate-limit & anti-gagal).
            </span>
          </div>
        )}
      </section>
    </div>
  );
}

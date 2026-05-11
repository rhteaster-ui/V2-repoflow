import React, { useRef, useState } from 'react';
import {
  AlertCircle, ExternalLink, FileArchive, FileJson, Key,
  Loader2, Rocket, ShieldCheck, Upload, UserRoundPlus,
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

  // ── Drag-and-drop state ──────────────────────────────────────────────────
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isDeploying || isExtracting) return;
    const files = e.dataTransfer.files;
    if (files.length) await onExtractFiles(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    // Only highlight when files are being dragged (not text/images from page)
    if (e.dataTransfer.types.includes('Files')) setIsDragging(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    await onExtractFiles(e.target.files);
    e.target.value = '';
  };

  return (
    <div className="space-y-3">
      {/* ── GitHub account section ─────────────────────────────────────────── */}
      <section className="app-card p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand/15 flex items-center justify-center">
              <Key size={15} className="text-brand-light" />
            </div>
            <h3 className="text-sm font-semibold text-white">Akses GitHub</h3>
          </div>
          {user && (
            <button
              onClick={onLogout}
              className="text-[11px] px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-300"
            >
              Putuskan
            </button>
          )}
        </div>

        {!user ? (
          <div className="space-y-3">
            <p className="text-xs text-zinc-300">Apakah Anda sudah memiliki akun GitHub?</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setHasGithubAccount('yes')}
                className={`text-xs py-2 rounded-lg border transition-colors ${
                  hasGithubAccount === 'yes'
                    ? 'bg-brand/20 border-brand/50 text-brand-light'
                    : 'border-white/10 text-zinc-300'
                }`}
              >
                Sudah punya
              </button>
              <button
                onClick={() => setHasGithubAccount('no')}
                className={`text-xs py-2 rounded-lg border transition-colors ${
                  hasGithubAccount === 'no'
                    ? 'bg-brand/20 border-brand/50 text-brand-light'
                    : 'border-white/10 text-zinc-300'
                }`}
              >
                Belum punya
              </button>
            </div>

            {hasGithubAccount === 'no' && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <p className="text-xs text-amber-100">Silakan daftar akun GitHub terlebih dahulu.</p>
                <a
                  href="https://github.com/signup"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-100"
                >
                  <UserRoundPlus size={13} /> Daftar GitHub <ExternalLink size={13} />
                </a>
              </div>
            )}

            {hasGithubAccount === 'yes' && (
              <>
                <input
                  type="text"
                  value={accountLabel}
                  onChange={(e) => setAccountLabel(e.target.value)}
                  placeholder="Nama profil akun (contoh: Akun Personal)"
                  className="input-modern text-sm"
                />
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Masukkan Personal Access Token"
                  className="input-modern text-sm"
                />
                <button onClick={() => onValidateToken(token)} className="btn-modern w-full text-sm py-2.5">
                  Tambah akun
                </button>

                {accounts.length > 0 && (
                  <div className="rounded-xl border border-white/10 p-2 space-y-2">
                    <p className="text-xs text-zinc-400">Pilih akun aktif</p>
                    {accounts.map((acc) => (
                      <button
                        key={acc.id}
                        onClick={() => acc.id && onSetActiveAccount(acc.id)}
                        className={`w-full text-left text-xs p-2 rounded-lg border transition-colors ${
                          user?.id === acc.id
                            ? 'border-brand/40 bg-brand/10 text-white'
                            : 'border-white/10 text-zinc-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{acc.label} (@{acc.username})</span>
                          <span className="text-[10px] text-zinc-500">{maskToken(acc.token)}</span>
                        </div>
                        <div className="text-[10px] text-zinc-500 mt-1">
                          {acc.tokenType} • divalidasi {new Date(acc.lastValidatedAt).toLocaleString('id-ID')}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <a
                  href="https://github.com/settings/tokens/new?scopes=repo,delete_repo&description=RepoFlow_App"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-xs text-zinc-400"
                >
                  <ShieldCheck size={13} /> Buat token di GitHub
                </a>
              </>
            )}
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-brand/[0.08] border border-brand/25 flex items-center gap-2.5">
            <img src={user.avatarUrl} alt={user.username} className="w-8 h-8 rounded-lg" />
            <p className="text-xs text-zinc-200">
              Login sebagai <span className="font-semibold text-white">@{user.username}</span>
            </p>
          </div>
        )}
      </section>

      {/* ── Upload section ─────────────────────────────────────────────────── */}
      <section className="app-card p-3.5 space-y-3">
        <h3 className="text-sm font-semibold text-white">
          Upload Multi-file / ZIP / Archive (dengan kontrol sebelum push)
        </h3>

        {/* Repo name input */}
        <input
          type="text"
          value={repoName}
          onChange={(e) => setRepoName(e.target.value.replace(/\s+/g, '-'))}
          placeholder="nama-repository"
          className="input-modern text-sm"
        />
        {repoCheckStatus === 'checking'  && <p className="text-[11px] text-zinc-500">Memeriksa nama repo...</p>}
        {repoCheckStatus === 'available' && <p className="text-[11px] text-green-400">Nama repo tersedia.</p>}
        {repoCheckStatus === 'exists'    && <p className="text-[11px] text-red-400">Nama repo sudah dipakai.</p>}

        {/* ── Drop zone — supports click AND drag & drop ─────────────────── */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={() => setIsDragging(false)}
          onClick={() => !isDeploying && !isExtracting && fileInputRef.current?.click()}
          className={`rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all select-none ${
            isDragging
              ? 'border-brand/70 bg-brand/[0.08] scale-[1.01]'
              : pickedFileNames.length
                ? 'border-brand/40 bg-brand/[0.05]'
                : 'border-white/12 bg-white/[0.02] hover:border-white/20'
          }`}
        >
          <input type="file" ref={fileInputRef}   onChange={handleFileChange} className="hidden" multiple />
          <input type="file" ref={folderInputRef} onChange={handleFileChange} className="hidden" multiple
            {...({ webkitdirectory: 'true', directory: 'true' } as any)} />

          {isDragging ? (
            <div className="space-y-1.5 pointer-events-none">
              <Upload size={22} className="mx-auto text-brand-light" />
              <p className="text-xs text-brand-light font-semibold">Lepaskan file di sini</p>
            </div>
          ) : pickedFileNames.length > 0 ? (
            <div className="space-y-1.5">
              <FileArchive size={18} className="mx-auto text-brand-light" />
              <p className="text-xs text-white">{pickedFileNames.length} file terpilih</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Upload size={18} className="mx-auto text-zinc-500" />
              <p className="text-xs text-zinc-300">
                Drag & drop file di sini, atau klik untuk pilih file
              </p>
              <p className="text-[11px] text-zinc-500">
                Mendukung .zip, .rar, .7z, .tar, .gz dan semua jenis file
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-modern text-xs py-2"
            disabled={isDeploying || isExtracting}
          >
            <Upload size={13} /> Pilih File
          </button>
          <button
            onClick={() => folderInputRef.current?.click()}
            className="btn-modern text-xs py-2"
            disabled={isDeploying || isExtracting}
          >
            <FileArchive size={13} /> Pilih Folder
          </button>
        </div>

        {/* Extraction progress */}
        {isExtracting && (
          <div className="space-y-1.5">
            <p className="text-xs text-zinc-300 flex items-center gap-1.5">
              <Loader2 size={14} className="animate-spin" /> Ekstrak & analisis file...
            </p>
            <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-brand to-brand-light"
                initial={{ width: 0 }}
                animate={{ width: `${extractProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* File list preview */}
        <AnimatePresence>
          {uploadEntries.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-xl border border-white/10 bg-black/20 p-2.5"
            >
              <div className="flex items-center justify-between mb-2 gap-2">
                <p className="text-xs text-zinc-300">
                  Preview ekstrak ({selectedEntries.length}/{uploadEntries.length})
                </p>
                <p className="text-[11px] text-zinc-500">{bytesToReadable(selectedTotalSize)}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2 mb-2">
                <input
                  value={uploadFilter}
                  onChange={(e) => setUploadFilter(e.target.value)}
                  placeholder="Cari file panjang / nested folder..."
                  className="input-modern text-xs py-2"
                />
                <button onClick={onSelectAll}   className="btn-modern text-xs py-2">Pilih semua</button>
                <button onClick={onDeselectAll} className="btn-modern text-xs py-2">Lepas semua</button>
              </div>

              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                {filteredUploadEntries.map((entry) => (
                  <label
                    key={entry.id}
                    className="flex items-start gap-2 text-xs rounded-lg px-2 py-1.5 bg-white/[0.03] border border-white/5 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={entry.include}
                      onChange={() => onToggleUploadEntry(entry.id)}
                      className="mt-0.5"
                    />
                    <FileJson size={13} className="text-zinc-500 shrink-0 mt-0.5" />
                    <span className="text-zinc-300 break-all flex-1 whitespace-normal" title={entry.path}>
                      {entry.path}
                    </span>
                    <span className="text-[10px] text-zinc-500 ml-auto shrink-0">
                      {bytesToReadable(entry.size)}
                    </span>
                  </label>
                ))}
                {filteredUploadEntries.length === 0 && (
                  <p className="text-xs text-zinc-500">Tidak ada file yang cocok filter.</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Deploy button */}
        <button
          onClick={onDeploy}
          disabled={isDeploying || !user || !repoName || repoCheckStatus === 'exists' || selectedEntries.length === 0}
          className="btn-modern w-full text-sm py-2.5"
        >
          {isDeploying
            ? <><Loader2 size={15} className="animate-spin" /> {deployStatus}</>
            : <><Rocket size={15} /> Push repo baru ke GitHub</>}
        </button>

        {isDeploying && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] text-zinc-500">
              <span>Progress Push</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-brand to-brand-light"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Batch commit info tip */}
        {selectedEntries.length > 5 && !isDeploying && (
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-200 flex items-start gap-2">
            <AlertCircle size={13} className="shrink-0 mt-0.5" />
            <span>
              {selectedEntries.length} file akan dipush dalam <strong>1 commit atomik</strong> menggunakan
              Git Tree API — lebih cepat dan aman dibanding push satu per satu.
            </span>
          </div>
        )}
      </section>
    </div>
  );
}

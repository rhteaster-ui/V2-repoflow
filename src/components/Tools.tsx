import React, { useRef } from 'react';
import {
  BookOpenCheck, ChevronDown, ChevronLeft, ChevronRight, ChevronUp,
  FileArchive, FileCode2, FileText, Folder, FolderOpen, FolderTree,
  Loader2, RefreshCcw, Save, Search, Trash2, Upload,
} from 'lucide-react';
import type { Project } from '../lib/db';
import type { PreviewKind, RepoFileEntry, StagedFile, TreeNode } from '../types';
import { bytesToReadable } from '../utils';
import RepoList from './RepoList';

type Props = {
  projects: Project[];
  filteredProjects: Project[];
  searchProject: string;
  setSearchProject: (v: string) => void;
  copiedId: number | null;
  onCopy: (url: string, id: number) => void;
  onSelectProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;

  selectedProject: Project | null;
  repoFiles: RepoFileEntry[];
  repoTree: TreeNode[];
  expandedFolders: Record<string, boolean>;
  toggleFolder: (path: string) => void;
  syncingRepo: boolean;
  backgroundSyncing: boolean;
  onSyncRepo: () => void;

  deletedPaths: string[];
  toggleDeletePath: (path: string) => void;
  setDeletedPaths: (paths: string[]) => void;

  stagedFiles: StagedFile[];
  removeStagedFile: (path: string) => void;
  folderPrefix: string;
  setFolderPrefix: (v: string) => void;
  repoFolders: string[];
  onStageFiles: (e: React.ChangeEvent<HTMLInputElement>) => void;

  selectedRepoPath: string;
  selectedRepoContent: string;
  previewKind: PreviewKind;
  selectedRepoDataUrl: string;
  loadingRepoContent: boolean;
  previewWrap: boolean;
  setPreviewWrap: (v: boolean) => void;
  previewZoom: number;
  setPreviewZoom: (v: number) => void;
  onLoadRepoFileContent: (path: string) => void;

  savingRepo: boolean;
  onApplyChanges: () => void;
};

export default function Tools({
  projects, filteredProjects, searchProject, setSearchProject,
  copiedId, onCopy, onSelectProject, onDeleteProject,
  selectedProject, repoFiles, repoTree, expandedFolders, toggleFolder,
  syncingRepo, backgroundSyncing, onSyncRepo,
  deletedPaths, toggleDeletePath, setDeletedPaths,
  stagedFiles, removeStagedFile, folderPrefix, setFolderPrefix, repoFolders, onStageFiles,
  selectedRepoPath, selectedRepoContent, previewKind, selectedRepoDataUrl, loadingRepoContent,
  previewWrap, setPreviewWrap, previewZoom, setPreviewZoom, onLoadRepoFileContent,
  savingRepo, onApplyChanges,
}: Props) {
  const updateInputRef       = useRef<HTMLInputElement>(null);
  const updateFolderInputRef = useRef<HTMLInputElement>(null);

  // Scrollable preview viewport refs
  const codePreviewRef    = useRef<HTMLPreElement>(null);
  const previewViewportRef = useRef<HTMLDivElement>(null);

  const scrollPreview = (x: number, y: number) => {
    const target = previewViewportRef.current || codePreviewRef.current;
    target?.scrollBy({ left: x, top: y, behavior: 'smooth' });
  };

  const resetPreviewPosition = () => {
    const target = previewViewportRef.current || codePreviewRef.current;
    target?.scrollTo({ left: 0, top: 0, behavior: 'smooth' });
  };

  const zoomPreview = (factor: number) => {
    setPreviewZoom(Math.min(3, Math.max(0.4, Number((previewZoom * factor).toFixed(2)))));
  };

  // ── Recursive tree renderer ───────────────────────────────────────────────
  const renderTreeNodes = (nodes: TreeNode[], depth = 0): React.ReactNode =>
    nodes.map((node) => {
      const isExpanded = expandedFolders[node.path] ?? depth < 1;

      if (node.type === 'folder') {
        return (
          <div key={node.path || node.name}>
            <button
              type="button"
              className="w-full text-left text-xs rounded-lg px-2 py-1.5 bg-white/[0.03] border border-white/5 flex items-center gap-1.5"
              onClick={() => toggleFolder(node.path)}
            >
              <span className="text-zinc-500" style={{ paddingLeft: `${depth * 12}px` }}>
                <ChevronRight size={12} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
              </span>
              {isExpanded
                ? <FolderOpen size={12} className="text-brand-light" />
                : <Folder     size={12} className="text-brand-light" />}
              <span className="text-zinc-200">{node.name}</span>
              <span className="ml-auto text-[10px] text-zinc-500">({node.children?.length ?? 0})</span>
            </button>
            {isExpanded && node.children && (
              <div className="mt-1 space-y-1">{renderTreeNodes(node.children, depth + 1)}</div>
            )}
          </div>
        );
      }

      const markedDelete = deletedPaths.includes(node.path);
      return (
        <div key={node.path} className="text-xs rounded-lg px-2 py-1.5 bg-white/[0.03] border border-white/5 flex items-start gap-2">
          <input
            type="checkbox"
            checked={markedDelete}
            onChange={() => toggleDeletePath(node.path)}
            className="mt-0.5"
          />
          <button
            type="button"
            className="flex items-start gap-2 min-w-0 flex-1 text-left"
            onClick={() => onLoadRepoFileContent(node.path)}
          >
            <FileText size={12} className="mt-0.5 text-zinc-400 shrink-0" />
            <span className="text-zinc-300 break-all" style={{ paddingLeft: `${depth * 12}px` }}>
              {node.name}
            </span>
          </button>
          <span className="text-[10px] text-zinc-500">{bytesToReadable(node.size ?? 0)}</span>
        </div>
      );
    });

  return (
    <div className="space-y-3">
      {/* ── Intro ─────────────────────────────────────────────────────────── */}
      <section className="app-card p-3.5 space-y-2.5">
        <h3 className="text-sm font-semibold text-white">
          Control Repository (real-time sync, tambah/hapus file)
        </h3>
        <div className="grid gap-2 md:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-2.5 text-xs text-zinc-300">
            <BookOpenCheck size={14} className="mb-1 text-brand-light" />
            1) Pilih repo dari daftar.
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-2.5 text-xs text-zinc-300">
            <RefreshCcw size={14} className="mb-1 text-brand-light" />
            2) Sinkronkan agar data sama dengan GitHub utama.
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-2.5 text-xs text-zinc-300">
            <Save size={14} className="mb-1 text-brand-light" />
            3) Pilih file untuk hapus/tambah lalu simpan.
          </div>
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchProject}
            onChange={(e) => setSearchProject(e.target.value)}
            placeholder="Cari repository"
            className="input-modern pl-9 text-sm"
          />
        </div>
      </section>

      {/* ── Repo list ─────────────────────────────────────────────────────── */}
      <section>
        <RepoList
          projects={filteredProjects}
          copiedId={copiedId}
          onCopy={onCopy}
          onSelect={onSelectProject}
          onDelete={onDeleteProject}
        />
      </section>

      {/* ── Selected repo detail ───────────────────────────────────────────── */}
      {selectedProject && (
        <section className="app-card p-3.5 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-white">{selectedProject.repoName}</p>
              <p className="text-[11px] text-zinc-500">
                Terakhir sinkron:{' '}
                {selectedProject.lastSyncedAt
                  ? new Date(selectedProject.lastSyncedAt).toLocaleString('id-ID')
                  : '-'}
              </p>
            </div>
            <button onClick={onSyncRepo} className="icon-btn" disabled={syncingRepo}>
              {syncingRepo
                ? <Loader2 size={14} className="animate-spin" />
                : <RefreshCcw size={14} />}
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            {/* ── Left: file tree + preview ────────────────────────────────── */}
            <div className="space-y-2 min-w-0">
              <p className="text-xs text-zinc-300 flex items-center gap-1.5">
                <FolderTree size={13} />
                Struktur file repository
                {backgroundSyncing && <span className="text-[10px] text-zinc-500">(auto-sync)</span>}
              </p>
              <p className="text-[10px] text-zinc-500">
                Root ditampilkan paling atas. Centang file untuk menandai sebagai hapus.
              </p>

              <div className="max-h-56 overflow-y-auto pr-1 space-y-1.5">
                {repoTree.length > 0
                  ? renderTreeNodes(repoTree)
                  : <p className="text-xs text-zinc-500">Belum ada file atau belum disinkronkan.</p>}
              </div>

              {/* Delete controls */}
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-2 space-y-2">
                <p className="text-[11px] text-red-200">
                  File dicentang untuk dihapus: <span className="font-semibold">{deletedPaths.length}</span>
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDeletedPaths([])}
                    className="btn-modern text-xs py-1.5 flex-1"
                    disabled={!deletedPaths.length}
                  >
                    Reset centang
                  </button>
                  <button
                    onClick={onApplyChanges}
                    className="btn-modern text-xs py-1.5 flex-1"
                    disabled={savingRepo || syncingRepo || !deletedPaths.length}
                  >
                    Hapus file terpilih
                  </button>
                </div>
              </div>

              {/* File preview */}
              <div className="rounded-lg border border-white/10 bg-black/30 p-2">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-[11px] text-zinc-400 truncate">
                    Preview{selectedRepoPath ? `: ${selectedRepoPath}` : ''}
                  </p>
                  <div className="flex items-center gap-1 flex-wrap justify-end shrink-0">
                    <button className="icon-btn w-6 h-6" onClick={() => scrollPreview(-220, 0)}>
                      <ChevronLeft size={12} />
                    </button>
                    <button className="icon-btn w-6 h-6" onClick={() => scrollPreview(220, 0)}>
                      <ChevronRight size={12} />
                    </button>
                    <button className="icon-btn w-6 h-6" onClick={() => scrollPreview(0, -140)}>
                      <ChevronUp size={12} />
                    </button>
                    <button className="icon-btn w-6 h-6" onClick={() => scrollPreview(0, 140)}>
                      <ChevronDown size={12} />
                    </button>
                    {previewKind === 'text' && (
                      <button className="icon-btn h-6 px-1.5 w-auto text-[9px]"
                        onClick={() => setPreviewWrap(!previewWrap)}>
                        {previewWrap ? 'NOWRAP' : 'WRAP'}
                      </button>
                    )}
                    {previewKind === 'image' && (
                      <>
                        <button className="icon-btn h-6 px-1.5 w-auto text-[10px]" onClick={() => zoomPreview(0.85)}>-</button>
                        <button className="icon-btn h-6 px-1.5 w-auto text-[9px]" onClick={() => setPreviewZoom(1)}>
                          {Math.round(previewZoom * 100)}%
                        </button>
                        <button className="icon-btn h-6 px-1.5 w-auto text-[10px]" onClick={() => zoomPreview(1.15)}>+</button>
                      </>
                    )}
                    <button className="icon-btn w-6 h-6 text-[9px]" onClick={resetPreviewPosition}>RST</button>
                  </div>
                </div>

                <div
                  ref={previewViewportRef}
                  className="max-h-44 overflow-auto overscroll-contain rounded-md border border-white/5 bg-black/20"
                >
                  {loadingRepoContent ? (
                    <pre className="text-[11px] text-zinc-200 whitespace-pre p-2">Memuat isi file...</pre>
                  ) : previewKind === 'image' && selectedRepoDataUrl ? (
                    <div className="min-w-full min-h-full p-2">
                      <div style={{ transform: `scale(${previewZoom})`, transformOrigin: 'top left', width: 'max-content' }}>
                        <img
                          src={selectedRepoDataUrl}
                          alt={selectedRepoPath || 'Preview gambar'}
                          className="max-w-none h-auto rounded-md border border-white/10"
                        />
                      </div>
                    </div>
                  ) : (
                    <pre
                      ref={codePreviewRef}
                      className={`text-[11px] text-zinc-200 p-2 ${
                        previewWrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre min-w-max'
                      }`}
                    >
                      {selectedRepoContent || 'Klik nama file untuk menampilkan isinya.'}
                    </pre>
                  )}
                </div>
              </div>
            </div>

            {/* ── Right: stage new files ──────────────────────────────────── */}
            <div className="space-y-2 min-w-0">
              <p className="text-xs text-zinc-300">Tambahkan / update file (mendukung multi upload)</p>

              <input
                value={folderPrefix}
                onChange={(e) => setFolderPrefix(e.target.value)}
                placeholder="Folder tujuan (opsional), contoh: src/components"
                className="input-modern text-xs"
              />

              {repoFolders.length > 0 && (
                <select
                  value={folderPrefix}
                  onChange={(e) => setFolderPrefix(e.target.value)}
                  className="input-modern text-xs"
                >
                  <option value="">Root repository</option>
                  {repoFolders.map((folder) => (
                    <option key={folder} value={folder}>{folder}</option>
                  ))}
                </select>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => updateInputRef.current?.click()} className="btn-modern w-full text-xs py-2">
                  <Upload size={14} /> Pilih file
                </button>
                <button onClick={() => updateFolderInputRef.current?.click()} className="btn-modern w-full text-xs py-2">
                  <FileArchive size={14} /> Pilih folder
                </button>
              </div>

              <input ref={updateInputRef}       type="file" multiple className="hidden" onChange={onStageFiles} />
              <input ref={updateFolderInputRef} type="file" multiple className="hidden" onChange={onStageFiles}
                {...({ webkitdirectory: 'true', directory: 'true' } as any)} />

              <div className="max-h-44 overflow-y-auto pr-1 space-y-1.5">
                {stagedFiles.length === 0 && (
                  <p className="text-xs text-zinc-500">Belum ada file yang di-stage.</p>
                )}
                {stagedFiles.map((file) => (
                  <div key={file.id} className="text-xs rounded-lg px-2 py-1.5 bg-white/[0.03] border border-white/5 flex items-start gap-2">
                    <FileCode2 size={12} className="mt-0.5 text-zinc-500" />
                    <span className="break-all text-zinc-300">{file.path}</span>
                    <button className="icon-btn w-6 h-6 ml-auto" onClick={() => removeStagedFile(file.path)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Save button */}
          <button
            onClick={onApplyChanges}
            disabled={savingRepo || syncingRepo || (!stagedFiles.length && !deletedPaths.length)}
            className="btn-modern w-full text-sm py-2.5"
          >
            {savingRepo
              ? <><Loader2 size={15} className="animate-spin" /> Menyimpan...</>
              : <><Save size={14} /> Simpan perubahan ke GitHub</>}
          </button>
        </section>
      )}
    </div>
  );
}

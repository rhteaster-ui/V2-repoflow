import React from 'react';
import { ArrowUpRight, BarChart3, Clock, Database, FileArchive, FolderGit2, PlusCircle, Sparkles, UploadCloud } from 'lucide-react';
import type { Project, ActivityLog } from '../lib/db';
import type { UploadEntry } from '../types';
import { bytesToReadable } from '../utils';
import RepoList from './RepoList';

type Props = {
  projects: Project[];
  logs: ActivityLog[];
  activityData: { label: string; count: number }[];
  totalWeekActivity: number;
  maxActivity: number;
  selectedEntries: UploadEntry[];
  selectedTotalSize: number;
  filteredProjects: Project[];
  copiedId: number | null;
  onCopy: (url: string, id: number) => void;
  onSelectProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
  onNavigateToTools: () => void;
  onNavigateToUpload?: () => void;
};

export default function Dashboard({
  projects,
  logs,
  activityData,
  totalWeekActivity,
  maxActivity,
  selectedEntries,
  selectedTotalSize,
  filteredProjects,
  copiedId,
  onCopy,
  onSelectProject,
  onDeleteProject,
  onNavigateToTools,
  onNavigateToUpload,
}: Props) {
  return (
    <div className="space-y-3.5">
      {/* ── Quick Action Hero Banner ────────────────────────────────────── */}
      <div className="app-card p-4 relative overflow-hidden bg-gradient-to-br from-brand/15 via-white/[0.03] to-cyan-500/10 border-brand/20">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand/20 border border-brand/30 text-[10px] font-semibold text-brand-light font-mono">
              <Sparkles size={11} /> WORKFLOW CEPAT
            </div>
            <h2 className="text-base font-bold text-white tracking-tight">Upload & Push Project ke GitHub</h2>
            <p className="text-xs text-zinc-400 max-w-md">
              Pilih file ZIP atau folder project, ekstrak otomatis di browser, dan batch push dalam 1 commit atomik.
            </p>
          </div>
          {onNavigateToUpload && (
            <button
              onClick={onNavigateToUpload}
              className="btn-primary text-xs py-2.5 px-4 self-start sm:self-auto shrink-0"
            >
              <UploadCloud size={15} /> Upload Project
            </button>
          )}
        </div>
      </div>

      {/* ── Stat cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <div className="app-card p-3.5 space-y-2">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-[11px] font-medium">Total Repo</span>
            <FolderGit2 size={14} className="text-brand-light" />
          </div>
          <p className="text-2xl font-bold text-white tracking-tight">{projects.length}</p>
          <p className="text-[10px] text-zinc-500">Tersinkron di IndexedDB</p>
        </div>

        <div className="app-card p-3.5 space-y-2">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-[11px] font-medium">Aktivitas 7 Hari</span>
            <Clock size={14} className="text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-white tracking-tight">{totalWeekActivity}</p>
          <p className="text-[10px] text-zinc-500">Commit & update tercatat</p>
        </div>

        <div className="app-card p-3.5 space-y-2">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-[11px] font-medium">File Terpilih</span>
            <FileArchive size={14} className="text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-white tracking-tight">{selectedEntries.length}</p>
          <p className="text-[10px] text-zinc-500">Siap didorong ke repo</p>
        </div>

        <div className="app-card p-3.5 space-y-2">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-[11px] font-medium">Ukuran Upload</span>
            <Database size={14} className="text-emerald-400" />
          </div>
          <p className="text-xl font-bold text-white tracking-tight">{bytesToReadable(selectedTotalSize)}</p>
          <p className="text-[10px] text-zinc-500">Estimasi payload git</p>
        </div>
      </div>

      {/* ── Activity bar chart ──────────────────────────────────────────── */}
      <div className="app-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Grafik Aktivitas Push</h3>
            <p className="text-[11px] text-zinc-500">Frekuensi push ke GitHub selama 7 hari terakhir</p>
          </div>
          <div className="w-7 h-7 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center text-brand-light">
            <BarChart3 size={14} />
          </div>
        </div>

        <div className="flex items-end gap-2.5 h-28 pt-2">
          {activityData.map((item) => (
            <div key={item.label} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
              <div className="w-full rounded-lg bg-white/[0.03] border border-white/[0.05] h-20 flex items-end p-1">
                <div
                  className="w-full rounded-md bg-gradient-to-t from-brand via-violet-500 to-cyan-400 transition-all duration-300"
                  style={{ height: `${Math.max(10, (item.count / maxActivity) * 100)}%` }}
                />
              </div>
              <span className="text-[10px] font-medium text-zinc-500">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Activity log & Recent Repos Grid ────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-3">
        {/* Activity Log */}
        <div className="app-card p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Riwayat Log</h3>
            <span className="text-[10px] font-mono text-zinc-500">Local Dexie</span>
          </div>
          <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
            {logs.length === 0 && (
              <p className="text-xs text-zinc-500 py-6 text-center">Belum ada riwayat push.</p>
            )}
            {logs.slice(0, 8).map((log) => (
              <div key={log.id} className="p-2 rounded-xl bg-white/[0.02] border border-white/5 text-xs space-y-0.5">
                <div className="flex items-center justify-between text-[10px] text-zinc-500">
                  <span className="font-semibold text-brand-light">{log.repoName}</span>
                  <span>{new Date(log.createdAt).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-zinc-300 text-[11px] leading-relaxed">{log.detail}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Repos */}
        <div className="app-card p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Repository Terbaru</h3>
            <button
              onClick={onNavigateToTools}
              className="text-xs text-brand-light hover:underline inline-flex items-center gap-1 font-medium"
            >
              Kelola di Tools <ArrowUpRight size={12} />
            </button>
          </div>
          <RepoList
            projects={filteredProjects.slice(0, 3)}
            copiedId={copiedId}
            onCopy={onCopy}
            onSelect={onSelectProject}
            onDelete={onDeleteProject}
          />
        </div>
      </div>
    </div>
  );
}

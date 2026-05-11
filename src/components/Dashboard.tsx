import React from 'react';
import { BarChart3 } from 'lucide-react';
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
}: Props) {
  return (
    <div className="space-y-3">
      {/* ── Stat cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="app-card p-3">
          <p className="text-[11px] text-zinc-500">Total Repo</p>
          <p className="text-xl font-bold text-white mt-1">{projects.length}</p>
        </div>
        <div className="app-card p-3">
          <p className="text-[11px] text-zinc-500">Aktivitas 7 Hari</p>
          <p className="text-xl font-bold text-white mt-1">{totalWeekActivity}</p>
        </div>
        <div className="app-card p-3">
          <p className="text-[11px] text-zinc-500">File Dipilih</p>
          <p className="text-xl font-bold text-white mt-1">{selectedEntries.length}</p>
        </div>
        <div className="app-card p-3">
          <p className="text-[11px] text-zinc-500">Ukuran Upload</p>
          <p className="text-base font-bold text-white mt-1">{bytesToReadable(selectedTotalSize)}</p>
        </div>
      </div>

      {/* ── Activity bar chart ──────────────────────────────────────────── */}
      <div className="app-card p-3.5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">Grafik Aktivitas Push</h3>
          <BarChart3 size={14} className="text-brand" />
        </div>
        <div className="flex items-end gap-2 h-28">
          {activityData.map((item) => (
            <div key={item.label} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full rounded-md bg-white/[0.04] h-20 flex items-end p-1">
                <div
                  className="w-full rounded-[6px] bg-gradient-to-t from-brand to-brand-light"
                  style={{ height: `${Math.max(8, (item.count / maxActivity) * 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-zinc-500">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Activity log ────────────────────────────────────────────────── */}
      <div className="app-card p-3.5 space-y-2">
        <h3 className="text-sm font-semibold text-white">Riwayat Aktivitas</h3>
        <div className="space-y-1.5 max-h-40 overflow-auto pr-1">
          {logs.length === 0 && <p className="text-xs text-zinc-500">Belum ada log.</p>}
          {logs.slice(0, 10).map((log) => (
            <p key={log.id} className="text-xs text-zinc-300 break-words">
              [{new Date(log.createdAt).toLocaleString('id-ID')}] {log.repoName}: {log.detail}
            </p>
          ))}
        </div>
      </div>

      {/* ── Recent repos ────────────────────────────────────────────────── */}
      <div className="app-card p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Repository Terbaru</h3>
          <button onClick={onNavigateToTools} className="text-xs text-brand-light">
            Kelola di Tools
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
  );
}

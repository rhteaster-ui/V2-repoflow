import React from 'react';
import { Check, Copy, ExternalLink, Trash2 } from 'lucide-react';
import type { Project } from '../lib/db';

type Props = {
  projects: Project[];
  copiedId: number | null;
  onCopy: (url: string, id: number) => void;
  onSelect: (project: Project) => void;
  onDelete: (project: Project) => void;
  emptyMessage?: string;
};

/**
 * Reusable repo card list.
 * Accepts an already-filtered/sliced `projects` array so callers control
 * whether to show 3 (Dashboard preview) or all (Tools).
 */
export default function RepoList({ projects, copiedId, onCopy, onSelect, onDelete, emptyMessage }: Props) {
  if (projects.length === 0) {
    return (
      <div className="app-card p-6 text-center">
        <p className="text-xs text-zinc-500">{emptyMessage ?? 'Belum ada repository.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {projects.map((project) => (
        <div key={project.id} className="app-card p-3 flex items-center justify-between gap-2">
          {/* Clickable name — selects the repo in Tools view */}
          <button className="min-w-0 text-left" onClick={() => onSelect(project)}>
            <p className="text-sm text-white font-semibold truncate">{project.repoName}</p>
            <p className="text-[11px] text-zinc-500">
              Update: {new Date(project.updatedAt).toLocaleString('id-ID')}
            </p>
          </button>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => project.id && onCopy(project.url, project.id)}
              className="icon-btn"
              title="Salin URL"
            >
              {copiedId === project.id
                ? <Check size={14} className="text-green-400" />
                : <Copy size={14} />}
            </button>
            <a href={project.url} target="_blank" rel="noreferrer" className="icon-btn" title="Buka GitHub">
              <ExternalLink size={14} />
            </a>
            <button
              onClick={() => onDelete(project)}
              className="icon-btn hover:text-red-400"
              title="Hapus repo"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

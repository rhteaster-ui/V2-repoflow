import React from 'react';
import { Github } from 'lucide-react';
import type { AppTab } from '../types';
import type { GitHubAccount } from '../lib/db';

const TAB_LABELS: Record<AppTab, string> = {
  dashboard: 'Dashboard',
  upload: 'Upload & Push Git',
  tools: 'Tools Repository',
  info: 'Info Website',
};

type Props = {
  iconSrc: string;
  onIconError: () => void;
  tab: AppTab;
  user: GitHubAccount | null;
};

export default function Header({ iconSrc, onIconError, tab, user }: Props) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-bg-dark/90 backdrop-blur-xl px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <img
            src={iconSrc}
            alt="RepoFlow logo"
            className="w-8 h-8 rounded-lg border border-white/15"
            onError={onIconError}
          />
          <div>
            <p className="text-xs text-zinc-500">RepoFlow App</p>
            <h1 className="text-sm text-white font-semibold">{TAB_LABELS[tab]}</h1>
          </div>
        </div>

        {/* Connected account */}
        {user ? (
          <div className="flex items-center gap-2">
            <Github size={14} className="text-zinc-400" />
            <span className="text-xs text-zinc-300">@{user.username}</span>
          </div>
        ) : (
          <span className="text-[11px] text-zinc-500">Belum terhubung</span>
        )}
      </div>
    </header>
  );
}

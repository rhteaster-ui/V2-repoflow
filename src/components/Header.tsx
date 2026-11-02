import React from 'react';
import { Github, Sparkles } from 'lucide-react';
import type { AppTab } from '../types';
import type { GitHubAccount } from '../lib/db';

const TAB_LABELS: Record<AppTab, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Ringkasan & Aktivitas' },
  upload:    { title: 'Upload & Push', subtitle: 'Ekstrak ZIP & Git Tree API' },
  tools:     { title: 'Tools Repository', subtitle: 'Struktur File & Manajemen Repo' },
  info:      { title: 'Informasi Web', subtitle: 'Arsitektur & Developer' },
};

type Props = {
  iconSrc: string;
  onIconError: () => void;
  tab: AppTab;
  user: GitHubAccount | null;
};

export default function Header({ iconSrc, onIconError, tab, user }: Props) {
  const currentTab = TAB_LABELS[tab];

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-zinc-950/80 backdrop-blur-xl px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={iconSrc}
              alt="RepoFlow logo"
              className="w-9 h-9 rounded-xl border border-white/15 object-cover shadow-sm bg-black/40"
              onError={onIconError}
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-zinc-950" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold tracking-wider uppercase text-brand-light font-mono">RepoFlow</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/[0.06] text-zinc-400 font-mono">v1.2</span>
            </div>
            <h1 className="text-sm text-white font-semibold leading-tight">{currentTab.title}</h1>
          </div>
        </div>

        {/* Connected account */}
        {user ? (
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/10">
            <img
              src={user.avatarUrl}
              alt={user.username}
              className="w-5 h-5 rounded-full border border-white/20"
            />
            <span className="text-xs text-zinc-200 font-medium">@{user.username}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 px-2.5 py-1.5 rounded-xl bg-white/[0.03] border border-white/5">
            <Github size={13} className="text-zinc-500" />
            <span className="text-[11px]">Belum login</span>
          </div>
        )}
      </div>
    </header>
  );
}

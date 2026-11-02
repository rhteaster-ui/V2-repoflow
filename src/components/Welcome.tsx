import React from 'react';
import { ArrowRight, Database, FileArchive, FolderGit2, ShieldCheck, Sparkles } from 'lucide-react';
import { APP_BANNER, WEB_ICON } from '../constants';

type Props = {
  bannerSrc: string;
  iconSrc: string;
  onBannerError: () => void;
  onIconError: () => void;
  onStart: () => void;
};

export default function Welcome({ bannerSrc, iconSrc, onBannerError, onIconError, onStart }: Props) {
  return (
    <div className="min-h-screen px-4 py-8 flex items-center justify-center">
      <div className="w-full max-w-md app-card p-5 space-y-4 text-center border-white/12 shadow-2xl relative overflow-hidden">
        {/* Subtle top glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-brand/20 blur-2xl pointer-events-none" />

        {/* Banner image — resolves from /public/banner.png */}
        <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-lg bg-zinc-950">
          <img
            src={bannerSrc}
            alt="RepoFlow banner"
            className="w-full h-28 object-cover transition-transform hover:scale-105 duration-500"
            onError={onBannerError}
          />
        </div>

        {/* Icon overlapping the banner */}
        <div className="relative -mt-9 mx-auto w-14 h-14 rounded-2xl p-1 bg-zinc-950 border border-white/20 shadow-xl flex items-center justify-center">
          <img
            src={iconSrc}
            alt="RepoFlow logo"
            className="w-full h-full rounded-xl object-cover"
            onError={onIconError}
          />
        </div>

        <div className="space-y-1.5 pt-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand/15 border border-brand/30 text-[10px] font-semibold text-brand-light font-mono">
            <Sparkles size={11} /> GITHUB AUTOMATION TOOL
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Selamat Datang di RepoFlow</h1>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
            Web manager modern untuk upload project ZIP, inspeksi file hirarkis, dan batch commit atomik ke GitHub dari HP maupun desktop.
          </p>
        </div>

        {/* Highlights */}
        <div className="grid grid-cols-2 gap-2 text-left pt-1">
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-brand-light text-xs font-semibold">
              <FileArchive size={13} /> Batch Tree API
            </div>
            <p className="text-[10px] text-zinc-400">Push puluhan file dalam 1 commit atomik.</p>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-semibold">
              <Database size={13} /> Offline Dexie DB
            </div>
            <p className="text-[10px] text-zinc-400">Cache repo & riwayat log tersimpan lokal.</p>
          </div>
        </div>

        <button onClick={onStart} className="btn-primary w-full text-sm py-3 mt-2">
          <span>Masuk ke Workspace</span>
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}

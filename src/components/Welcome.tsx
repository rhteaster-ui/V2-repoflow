import React from 'react';
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
      <div className="w-full max-w-md app-card p-5 space-y-4 text-center">
        {/* Banner image — resolves from /public/banner.png */}
        <img
          src={bannerSrc}
          alt="RepoFlow banner"
          className="w-full h-24 rounded-2xl mx-auto border border-white/15 object-cover"
          onError={onBannerError}
        />

        {/* Icon overlapping the banner */}
        <img
          src={iconSrc}
          alt="RepoFlow logo"
          className="w-12 h-12 rounded-2xl mx-auto border border-white/15 -mt-9 bg-black/50 p-1"
          onError={onIconError}
        />

        <h1 className="text-xl font-bold text-white">Selamat Datang di RepoFlow</h1>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Aplikasi push project modern untuk upload ZIP/semua file ke GitHub, memantau aktivitas,
          dan mengelola repository dari HP maupun desktop.
        </p>

        <button onClick={onStart} className="btn-modern w-full text-sm py-2.5">
          Lanjutkan ke Aplikasi
        </button>
      </div>
    </div>
  );
}

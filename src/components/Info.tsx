import React from 'react';
import { Clock3, ExternalLink, FileCode2, Folder, FolderTree, Github, Link2 } from 'lucide-react';
import { SOCIAL_LINKS } from '../constants';

type Props = {
  iconSrc: string;
  onIconError: () => void;
};

export default function InfoTab({ iconSrc, onIconError }: Props) {
  return (
    <div className="space-y-3">
      {/* ── About the app ─────────────────────────────────────────────────── */}
      <section className="app-card p-3.5 space-y-2">
        <div className="flex items-center gap-2">
          <img
            src={iconSrc}
            alt="RepoFlow icon"
            className="w-8 h-8 rounded-lg border border-white/15"
            onError={onIconError}
          />
          <h3 className="text-sm font-semibold text-white">Tentang Website</h3>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed">
          RepoFlow adalah web manager repository GitHub yang membantu upload project, membaca
          struktur file bertingkat, melakukan update/hapus file terpilih, dan menjaga sinkronisasi
          agar workflow coding lebih aman dari HP maupun desktop.
        </p>

        <div className="grid md:grid-cols-2 gap-2">
          {[
            { icon: <Clock3   size={13} />, text: 'Data waktu simpan: dibuat, diubah, terakhir sinkron.' },
            { icon: <FolderTree size={13} />, text: 'Mendukung file root dan file di dalam folder untuk update.' },
            { icon: <FileCode2 size={13} />, text: 'Teknologi: React + TypeScript + Vite + Tailwind CSS.' },
            { icon: <Github   size={13} />, text: 'Integrasi API: Octokit GitHub REST API + IndexedDB (Dexie).' },
          ].map(({ icon, text }) => (
            <div key={text} className="rounded-lg border border-white/10 bg-white/[0.02] p-2.5 text-xs text-zinc-300 flex items-start gap-2">
              <span className="text-brand-light mt-0.5 shrink-0">{icon}</span>
              {text}
            </div>
          ))}
        </div>
      </section>

      {/* ── Developer info ────────────────────────────────────────────────── */}
      <section className="app-card p-3.5 space-y-2">
        <div className="flex items-center gap-2">
          <img
            src={iconSrc}
            alt="Developer profile"
            className="w-10 h-10 rounded-full border border-white/15 object-cover"
            onError={onIconError}
          />
          <div>
            <p className="text-sm text-white font-semibold">Info Developer</p>
            <p className="text-[11px] text-zinc-500">Rahmat / rAi Engine</p>
          </div>
        </div>

        <div className="space-y-1.5">
          {SOCIAL_LINKS.map((item) => (
            <a
              key={item.url}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="link-item"
            >
              <span>{item.label}</span>
              <span className="inline-flex items-center gap-1 text-zinc-400">
                <Link2 size={12} /> Buka <ExternalLink size={12} />
              </span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}

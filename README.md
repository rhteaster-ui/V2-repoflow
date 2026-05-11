# RepoFlow

**RepoFlow** adalah web app untuk push project ke GitHub dengan alur upload yang simpel — nyaman dipakai di mobile maupun desktop.

## Fitur

- **Dashboard hidup** — total repo, grafik aktivitas 7 hari, riwayat log, daftar repo terbaru.
- **Upload semua jenis file** — `.zip`, `.py`, `.ts`, `.java`, `.cpp`, `.json`, dll.
- **Preview ekstrak ZIP** — cek dan uncheck file sebelum push. Drag & drop juga didukung.
- **Batch commit via Git Tree API** — semua file dipush dalam 1 commit atomik, jauh lebih cepat dan aman.
- **Tools Repository** — cari repo, sinkronisasi real-time, tambah/hapus file, preview isi file.
- **Multi-akun GitHub** — simpan dan switch antar personal access token.
- **Social preview ready** — Open Graph + Twitter Card meta tag.

## Perubahan v1.1.0

| # | Perubahan | Dampak |
|---|-----------|--------|
| 1 | **Fix banner & icon** — dipindah ke `public/` agar Vite serve dengan benar | Bug visual utama terselesaikan |
| 2 | **Batch commit (Git Tree API)** — push N file = N+3 request, bukan N request | Lebih cepat, lebih hemat rate limit |
| 3 | **Drag & drop** di area upload | UX lebih baik |
| 4 | **Struktur repo dirapikan** — `App.tsx` 63KB dipecah jadi komponen + utils + types | Maintainability |
| 5 | **`.gitignore`** (sebelumnya `gitignore.txt`) dan **`.env.example`** diperbaiki | Repo hygiene |
| 6 | **`package.json` name** diubah dari `react-example` → `repoflow` | Identitas paket benar |
| 7 | Dependency `express`, `dotenv`, `@google/genai` dihapus (tidak digunakan) | Bundle lebih ringan |

## Struktur Proyek

```
repoflow/
├── public/
│   ├── banner.png        ← static asset (dulu di src/, sekarang benar)
│   └── icon.png
├── src/
│   ├── components/
│   │   ├── BottomNav.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Header.tsx
│   │   ├── Info.tsx
│   │   ├── RepoList.tsx
│   │   ├── Tools.tsx
│   │   ├── Upload.tsx
│   │   └── Welcome.tsx
│   ├── lib/
│   │   ├── db.ts          ← IndexedDB schema (Dexie)
│   │   └── github.ts      ← GitHub API helpers (batch commit)
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   └── index.ts
│   ├── App.tsx            ← state container
│   ├── constants.ts
│   ├── index.css
│   └── main.tsx
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
├── vercel.json
└── vite.config.ts
```

## Setup

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # output ke dist/
```

## Catatan

Aplikasi ini melakukan **push ke GitHub repository** (bukan deploy hosting).  
Token GitHub minimal butuh scope `repo` dan `delete_repo`.

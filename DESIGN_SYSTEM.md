# RepoFlow Design System (v1.2)

> **Design Read:** A lightweight, high-performance web utility for developers to upload ZIP projects, inspect directory structures, and perform atomic batch commits to GitHub via Git Tree API. Mobile-first ergonomics combined with desktop productivity.

---

## 1. Core Principles
* **Anti-Slop Utility:** Zero fake sci-fi noise, zero superfluous charts. Every pixel serves the workflow: choose repo → drop ZIP → review summary → push.
* **Ergonomic & Mobile-First:** Touch targets ≥44px, thumb-friendly bottom navigation with safe-area insets, sticky primary action triggers.
* **High-End Dark Aesthetic:** Inspired by Linear and GitHub Mobile. Neutral deep zinc background with crisp 1px borders, subtle glass cards, and focused violet/cyan accents.

---

## 2. Color System (60 / 30 / 10 Rule)
* **60% Canvas & Surfaces (Dominant):**
  - Background Canvas: `#06070a`
  - Elevated Cards: `rgba(13, 14, 22, 0.76)` (`backdrop-blur-md`)
  - Inner Panels: `rgba(255, 255, 255, 0.02)` to `rgba(255, 255, 255, 0.04)`
* **30% Structure & Contrast:**
  - Headings & Primary Text: `#ffffff`
  - Body & Secondary Text: `#cbd5e1` / `#94a3b8`
  - Muted / Placeholders: `#64748b` / `#52525b`
  - Subtle Borders: `rgba(255, 255, 255, 0.08)` to `rgba(255, 255, 255, 0.12)`
* **10% Accent Focal Points:**
  - Primary Brand Accent: `#7c3aed` (Violet 600)
  - Brand Light: `#a78bfa` (Violet 400)
  - Cyan Flow Glow: `#06b6d4` (Cyan 500)
  - Success / Live Sync: `#10b981` (Emerald 500)
  - Warning / Exists: `#f59e0b` (Amber 500)

---

## 3. Typography
* **Primary Sans:** `Plus Jakarta Sans` — clean, open counters, highly legible at small sizes on mobile screens.
* **Code & Metrics:** `Space Grotesk` / `ui-monospace` — monospace precision for commit hashes, paths, file sizes, and API labels.

| Element | Size | Weight | Line Height |
|---|---|---|---|
| Display / Banner | 24–32px | 800 Bold | 1.1 |
| Card Title | 14–16px | 600 SemiBold | 1.25 |
| Body / Form Text | 13–14px | 400 / 500 | 1.5 |
| Caption / Status | 10–11px | 500 / 600 | 1.4 |

---

## 4. Components & Tokens
* **`.app-card`**: `bg-card-bg border border-white/[0.08] rounded-2xl shadow-xl shadow-black/40 backdrop-blur-md`
* **`.btn-primary`**: Gradient from `brand` to `violet-600` with subtle purple drop shadow, active scale `0.95`.
* **`.btn-secondary`**: Subtle dark glass with 1px border `hover:bg-white/[0.08]`.
* **`.input-modern`**: Dark transluscent input with subtle focus ring `focus:ring-brand/30`.

---

## 5. Iconography
* **Brand Asset:** Vector squircle icon (`/public/icon.png`) and modern showcase banner (`/public/banner.png`).
* **Navigation:**
  - `Home` → Dashboard
  - `Upload` → Upload & Push
  - `FolderGit2` → Tools & Repo Management
  - `Info` → Web Info & Architecture
* **Smart File Indicators:**
  - Code (`.ts`, `.js`, `.py`, `.html`): `FileCode2` (cyan)
  - Data / Config (`.json`, `.md`, `.env`): `FileJson` / `FileText` (emerald)
  - Archive (`.zip`, `.tar.gz`): `FileArchive` (amber)
  - Media (`.png`, `.svg`): `FileImage` (pink)

/**
 * Application-wide constants.
 * Centralizing these here means you only need to change one place if
 * a URL, label, or asset path ever changes.
 */

import React from 'react';
import { BarChart3, Home, Info, Upload } from 'lucide-react';
import type { AppTab } from './types';

// ─── Static asset paths ────────────────────────────────────────────────────────
// These files live in /public/ so Vite serves them at the root URL.
export const WEB_ICON   = '/icon.png';
export const APP_BANNER = '/banner.png';

// ─── Developer social links ───────────────────────────────────────────────────
export const SOCIAL_LINKS = [
  { label: 'WhatsApp Channel', url: 'https://whatsapp.com/channel/0029VbBjyjlJ93wa6hwSWa0p' },
  { label: 'Instagram Dev',    url: 'https://www.instagram.com/rahmt_nhw?igsh=MWQwcnB3bTA2ZnVidg==' },
  { label: 'TikTok Dev',       url: 'https://www.tiktok.com/@r_hmtofc?_r=1&_t=ZS-94KRfWQjeUu' },
  { label: 'Telegram Dev',     url: 'https://t.me/rAi_engine' },
] as const;

// ─── Bottom nav / sidebar items ────────────────────────────────────────────────
export const NAV_ITEMS: { id: AppTab; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: React.createElement(Home,     { size: 16 }) },
  { id: 'upload',    label: 'Upload',    icon: React.createElement(Upload,   { size: 16 }) },
  { id: 'tools',     label: 'Tools',     icon: React.createElement(BarChart3, { size: 16 }) },
  { id: 'info',      label: 'Info Web',  icon: React.createElement(Info,     { size: 16 }) },
];

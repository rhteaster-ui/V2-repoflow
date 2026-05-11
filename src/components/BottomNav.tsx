import React from 'react';
import { NAV_ITEMS } from '../constants';
import type { AppTab } from '../types';

type Props = {
  tab: AppTab;
  setTab: (tab: AppTab) => void;
};

/**
 * Fixed bottom navigation for mobile screens.
 * Hidden on md+ breakpoints where the sidebar sidebar is used instead.
 * Uses safe-area-inset-bottom padding so it clears the iPhone home indicator.
 */
export default function BottomNav({ tab, setTab }: Props) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-white/10 bg-zinc-950/95 backdrop-blur-xl z-50 pb-[calc(0.35rem+env(safe-area-inset-bottom))]">
      <div className="max-w-xl mx-auto grid grid-cols-4 gap-1 px-2 pt-1.5">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`flex flex-col items-center justify-center gap-1 py-2 rounded-lg text-[10px] transition-colors ${
              tab === item.id ? 'text-brand-light bg-brand/10' : 'text-zinc-400'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

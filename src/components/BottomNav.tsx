import React from 'react';
import { NAV_ITEMS } from '../constants';
import type { AppTab } from '../types';

type Props = {
  tab: AppTab;
  setTab: (tab: AppTab) => void;
};

/**
 * Fixed bottom navigation for mobile screens.
 * Hidden on md+ breakpoints where desktop sidebar is used.
 * Optimized for thumb ergonomics with safe-area support.
 */
export default function BottomNav({ tab, setTab }: Props) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-white/[0.08] bg-zinc-950/90 backdrop-blur-2xl z-50 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 px-3 shadow-2xl">
      <div className="max-w-md mx-auto grid grid-cols-4 gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive = tab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`relative flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl text-[11px] font-medium transition-all active:scale-90 ${
                isActive
                  ? 'text-white bg-white/[0.08] shadow-inner'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
              }`}
            >
              <div className={`transition-transform duration-200 ${isActive ? 'scale-110 text-brand-light' : ''}`}>
                {item.icon}
              </div>
              <span className={`leading-none ${isActive ? 'font-semibold text-white' : ''}`}>
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-brand-light shadow-[0_0_6px_#a78bfa]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

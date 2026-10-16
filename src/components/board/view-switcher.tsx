'use client';

import { ViewType } from '@/types';

interface ViewSwitcherProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  dailyCount?: number;
  longTermCount?: number;
}

export default function ViewSwitcher({
  currentView,
  onViewChange,
  dailyCount,
  longTermCount,
}: ViewSwitcherProps) {
  return (
    <div className="inline-flex items-center p-1 rounded-xl glass-surface">
      {/* Giornaliere (Amber / Warm Orange) */}
      <button
        type="button"
        onClick={() => onViewChange('daily')}
        className={`px-4 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
          currentView === 'daily'
            ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/25'
            : 'hover:bg-slate-500/10'
        }`}
        style={currentView !== 'daily' ? { color: 'var(--text-secondary)' } : undefined}
      >
        <span>☀️</span>
        <span>Giornaliere</span>
        {typeof dailyCount === 'number' && (
          <span
            className={`px-1.5 py-0.5 rounded-full text-xs font-extrabold ${
              currentView === 'daily' ? 'bg-black/20 text-white' : 'bg-slate-500/20'
            }`}
          >
            {dailyCount}
          </span>
        )}
      </button>

      {/* Lungo Termine (Indigo / Violet) */}
      <button
        type="button"
        onClick={() => onViewChange('longterm')}
        className={`px-4 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
          currentView === 'longterm'
            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25'
            : 'hover:bg-slate-500/10'
        }`}
        style={currentView !== 'longterm' ? { color: 'var(--text-secondary)' } : undefined}
      >
        <span>📅</span>
        <span>Lungo Termine</span>
        {typeof longTermCount === 'number' && (
          <span
            className={`px-1.5 py-0.5 rounded-full text-xs font-extrabold ${
              currentView === 'longterm' ? 'bg-black/20 text-white' : 'bg-slate-500/20'
            }`}
          >
            {longTermCount}
          </span>
        )}
      </button>
    </div>
  );
}

'use client';

import { ViewType } from '@/types';

interface ViewSwitcherProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export default function ViewSwitcher({
  currentView,
  onViewChange,
}: ViewSwitcherProps) {
  return (
    <div className="flex justify-center mb-6">
      <div className="inline-flex bg-slate-800/80 backdrop-blur-sm rounded-2xl p-1.5 border border-slate-700/60 shadow-lg">
        {/* Giornaliere (Amber / Warm Orange) */}
        <button
          onClick={() => onViewChange('daily')}
          className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
            currentView === 'daily'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>☀️</span>
          <span>Giornaliere</span>
        </button>

        {/* Lungo Termine (Indigo / Violet) */}
        <button
          onClick={() => onViewChange('longterm')}
          className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
            currentView === 'longterm'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>📅</span>
          <span>Lungo Termine</span>
        </button>
      </div>
    </div>
  );
}

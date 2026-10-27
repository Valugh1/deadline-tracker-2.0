'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, Calendar, Clock, AlertTriangle, CheckCircle, ArrowRight, Filter } from 'lucide-react';
import { useSearch } from './search-context';
import { TaskItem } from '@/types';
import { formatDeadlineText } from '@/lib/utils';

export default function SearchModal() {
  const {
    isSearchOpen,
    closeSearch,
    query,
    setQuery,
    tasks,
    selectTask,
    boardFilterQuery,
    setBoardFilterQuery,
  } = useSearch();

  const [activeTab, setActiveTab] = useState<'all' | 'daily' | 'longterm' | 'urgent'>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isSearchOpen]);

  // Filter tasks based on query and tab
  const filteredTasks = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks.filter((task) => {
      // Tab filter
      if (activeTab === 'daily' && task.type !== 'daily') return false;
      if (activeTab === 'longterm' && task.type !== 'longterm') return false;
      if (activeTab === 'urgent') {
        if (task.type === 'longterm') {
          if (task.deadlineState !== 'warning' && task.deadlineState !== 'expired') return false;
        } else {
          if (!task.dueTime || task.status === 'done') return false;
        }
      }

      // Query filter
      if (!q) return true;
      const inTitle = task.title.toLowerCase().includes(q);
      const inNotes = (task.notes || '').toLowerCase().includes(q);
      return inTitle || inNotes;
    });
  }, [tasks, query, activeTab]);

  // Reset selected index when filtered list changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredTasks.length, query, activeTab]);

  // Keyboard navigation inside modal
  useEffect(() => {
    if (!isSearchOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeSearch();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredTasks.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : Math.max(0, filteredTasks.length - 1)));
      } else if (e.key === 'Enter') {
        if (filteredTasks[selectedIndex]) {
          e.preventDefault();
          selectTask(filteredTasks[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, filteredTasks, selectedIndex, closeSearch, selectTask]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.children[selectedIndex] as HTMLElement | undefined;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isSearchOpen) return null;

  const handleApplyToBoard = () => {
    setBoardFilterQuery(query.trim());
    closeSearch();
  };

  const getStatusBadge = (status: TaskItem['status']) => {
    switch (status) {
      case 'done':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            <CheckCircle className="w-3 h-3" />
            Completata
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full">
            In corso
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-500/10 border border-slate-500/20 px-2 py-0.5 rounded-full">
            To Do
          </span>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
      onClick={closeSearch}
    >
      <div
        className="w-full max-w-2xl glass-elevated rounded-2xl shadow-2xl overflow-hidden border border-slate-700/60 flex flex-col max-h-[82vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div
          className="flex items-center gap-3 px-4 py-3.5 border-b"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <Search className="w-5 h-5 text-indigo-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cerca per titolo, scadenza o note..."
            className="flex-1 bg-transparent text-sm sm:text-base focus:outline-none placeholder:text-slate-400"
            style={{ color: 'var(--text-primary)' }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-lg hover:bg-slate-500/20 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Cancella testo"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-mono rounded bg-slate-500/15 text-slate-400 border border-slate-500/30 select-none">
            ESC
          </kbd>
        </div>

        {/* Filter Categories Bar */}
        <div
          className="flex items-center justify-between px-4 py-2 border-b bg-slate-500/5 text-xs flex-wrap gap-2"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                  : 'hover:bg-slate-500/10'
              }`}
              style={activeTab !== 'all' ? { color: 'var(--text-secondary)' } : undefined}
            >
              Tutte ({tasks.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('daily')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                activeTab === 'daily'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'hover:bg-slate-500/10'
              }`}
              style={activeTab !== 'daily' ? { color: 'var(--text-secondary)' } : undefined}
            >
              ☀️ Giornaliere ({tasks.filter((t) => t.type === 'daily').length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('longterm')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                activeTab === 'longterm'
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                  : 'hover:bg-slate-500/10'
              }`}
              style={activeTab !== 'longterm' ? { color: 'var(--text-secondary)' } : undefined}
            >
              📅 Scadenze ({tasks.filter((t) => t.type === 'longterm').length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('urgent')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                activeTab === 'urgent'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'hover:bg-slate-500/10'
              }`}
              style={activeTab !== 'urgent' ? { color: 'var(--text-secondary)' } : undefined}
            >
              ⚡ Urgenti
            </button>
          </div>

          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {filteredTasks.length} {filteredTasks.length === 1 ? 'risultato' : 'risultati'}
          </span>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar min-h-[160px] max-h-[50vh]"
        >
          {filteredTasks.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <Search className="w-10 h-10 mx-auto text-slate-500/50 mb-3" />
              <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                Nessuna attività trovata
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                {query
                  ? `Nessuna corrispondenza per "${query}". Prova con un termine diverso.`
                  : 'Non ci sono attività in questa categoria.'}
              </p>
            </div>
          ) : (
            filteredTasks.map((task, idx) => {
              const isSelected = idx === selectedIndex;
              const isDaily = task.type === 'daily';

              return (
                <div
                  key={`${task.type}-${task.id}`}
                  onClick={() => selectTask(task)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-3 group ${
                    isSelected
                      ? 'bg-indigo-500/15 border border-indigo-500/35 shadow-md'
                      : 'hover:bg-slate-500/10 border border-transparent'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    {/* Header line: badges */}
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {isDaily ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25">
                          ☀️ Giornaliero
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
                          📅 Scadenza
                        </span>
                      )}

                      {getStatusBadge(task.status)}

                      {/* Due info badge */}
                      {isDaily && task.dueTime && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                          <Clock className="w-3 h-3" />
                          {task.dueTime}
                        </span>
                      )}

                      {!isDaily && (
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            task.deadlineState === 'expired'
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                              : task.deadlineState === 'warning'
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                              : 'bg-emerald-500/10 text-emerald-400'
                          }`}
                        >
                          {task.deadlineState === 'expired' && <AlertTriangle className="w-3 h-3" />}
                          {task.deadlineState === 'warning' && <Clock className="w-3 h-3" />}
                          {!['expired', 'warning'].includes(task.deadlineState) && <Calendar className="w-3 h-3" />}
                          {formatDeadlineText(task.daysRemaining)}
                        </span>
                      )}
                    </div>

                    {/* Task Title */}
                    <h4
                      className="font-bold text-sm truncate"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {task.title}
                    </h4>

                    {/* Notes snippet if present */}
                    {task.notes && (
                      <p
                        className="text-xs truncate mt-0.5"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {task.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <ArrowRight
                      className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${
                        isSelected ? 'text-indigo-400' : 'text-slate-500'
                      }`}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div
          className="px-4 py-3 border-t flex items-center justify-between text-xs flex-wrap gap-2 bg-slate-500/5"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex items-center gap-2">
            {query.trim() && (
              <button
                type="button"
                onClick={handleApplyToBoard}
                className="px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 border border-indigo-500/30 font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filtra board con &quot;{query.trim()}&quot;</span>
              </button>
            )}
            {boardFilterQuery && (
              <button
                type="button"
                onClick={() => setBoardFilterQuery('')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-500/15 hover:bg-slate-500/25 text-slate-300 font-medium transition-all cursor-pointer"
              >
                Azzera filtro board
              </button>
            )}
          </div>

          <div
            className="hidden sm:flex items-center gap-3 text-[11px]"
            style={{ color: 'var(--text-muted)' }}
          >
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-500/20 font-mono">↑↓</kbd> naviga
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-500/20 font-mono">↵</kbd> apri
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-500/20 font-mono">esc</kbd> chiudi
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

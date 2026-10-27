'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { TaskItem, ViewType } from '@/types';

interface SearchContextType {
  isSearchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;
  query: string;
  setQuery: (q: string) => void;
  boardFilterQuery: string;
  setBoardFilterQuery: (q: string) => void;
  tasks: TaskItem[];
  setTasks: (tasks: TaskItem[]) => void;
  selectTask: (task: TaskItem) => void;
  registerSelectTaskHandler: (handler: (task: TaskItem) => void) => void;
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  registerViewChangeHandler: (handler: (view: ViewType) => void) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProviderWrapper({ children }: { children: React.ReactNode }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [boardFilterQuery, setBoardFilterQuery] = useState('');
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [currentView, setCurrentViewState] = useState<ViewType>('daily');
  const [selectTaskHandler, setSelectTaskHandler] = useState<((task: TaskItem) => void) | null>(null);
  const [viewChangeHandler, setViewChangeHandler] = useState<((view: ViewType) => void) | null>(null);

  const openSearch = useCallback(() => {
    setIsSearchOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false);
  }, []);

  const toggleSearch = useCallback(() => {
    setIsSearchOpen((prev) => !prev);
  }, []);

  const registerSelectTaskHandler = useCallback((handler: (task: TaskItem) => void) => {
    setSelectTaskHandler(() => handler);
  }, []);

  const registerViewChangeHandler = useCallback((handler: (view: ViewType) => void) => {
    setViewChangeHandler(() => handler);
  }, []);

  const setCurrentView = useCallback((view: ViewType) => {
    setCurrentViewState(view);
    if (viewChangeHandler) {
      viewChangeHandler(view);
    }
  }, [viewChangeHandler]);

  const selectTask = useCallback((task: TaskItem) => {
    if (task.type !== currentView && viewChangeHandler) {
      viewChangeHandler(task.type);
      setCurrentViewState(task.type);
    }
    if (selectTaskHandler) {
      selectTaskHandler(task);
    }
    setIsSearchOpen(false);
  }, [currentView, selectTaskHandler, viewChangeHandler]);

  // Global keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <SearchContext.Provider
      value={{
        isSearchOpen,
        openSearch,
        closeSearch,
        toggleSearch,
        query,
        setQuery,
        boardFilterQuery,
        setBoardFilterQuery,
        tasks,
        setTasks,
        selectTask,
        registerSelectTaskHandler,
        currentView,
        setCurrentView,
        registerViewChangeHandler,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}

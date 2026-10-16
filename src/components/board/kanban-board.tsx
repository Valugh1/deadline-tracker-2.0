'use client';

import { useState, useEffect, useTransition } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Plus, Search, Zap, CheckCircle2, Sparkles } from 'lucide-react';
import { ViewType, TaskStatus, EnrichedLongTermTask } from '@/types';
import { DailyTask } from '@/db/schema';
import ViewSwitcher from './view-switcher';
import KanbanColumn from './kanban-column';
import TaskDetailModal from './task-detail-modal';
import CreateTaskModal from './create-task-modal';
import {
  createDailyTask,
  updateDailyTaskStatus,
  updateDailyTask,
  deleteDailyTask,
  reorderDailyTasks,
} from '@/actions/daily-tasks';
import {
  createLongTermTask,
  updateLongTermTaskStatus,
  updateLongTermTask,
  deleteLongTermTask,
  reorderLongTermTasks,
} from '@/actions/longterm-tasks';
import { getDeadlineInfo } from '@/lib/utils';

interface KanbanBoardProps {
  initialDailyTasks: DailyTask[];
  initialLongTermTasks: EnrichedLongTermTask[];
}

export default function KanbanBoard({
  initialDailyTasks,
  initialLongTermTasks,
}: KanbanBoardProps) {
  // Prevent SSR hydration mismatch for drag & drop
  const [isMounted, setIsMounted] = useState(false);
  const [resetCountdown, setResetCountdown] = useState<string>('');
  const [todayFormatted, setTodayFormatted] = useState<string>('');

  useEffect(() => {
    setIsMounted(true);

    const updateTimeInfo = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diffMs = midnight.getTime() - now.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      setResetCountdown(`tra ${hours}h ${minutes}m`);

      const formatted = now.toLocaleDateString('it-IT', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
      setTodayFormatted(formatted.charAt(0).toUpperCase() + formatted.slice(1));
    };

    updateTimeInfo();
    const timer = setInterval(updateTimeInfo, 60000);
    return () => clearInterval(timer);
  }, []);

  const [currentView, setCurrentView] = useState<ViewType>('daily');
  const [dailyList, setDailyList] = useState<DailyTask[]>(initialDailyTasks);
  const [longTermList, setLongTermList] = useState<EnrichedLongTermTask[]>(initialLongTermTasks);
  const [searchQuery, setSearchQuery] = useState('');
  const [quickFilter, setQuickFilter] = useState<'all' | 'urgent'>('all');

  // Modals state
  const [selectedTask, setSelectedTask] = useState<
    | (DailyTask & { type: 'daily' })
    | (EnrichedLongTermTask & { type: 'longterm' })
    | null
  >(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [, startTransition] = useTransition();

  // Keep state in sync with server revalidations
  useEffect(() => {
    setDailyList(initialDailyTasks);
  }, [initialDailyTasks]);

  useEffect(() => {
    setLongTermList(initialLongTermTasks);
  }, [initialLongTermTasks]);

  // Handle Drag & Drop
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId as TaskStatus;

    if (currentView === 'daily') {
      const currentTasks = [...dailyList];
      const targetIndex = currentTasks.findIndex((t) => t.id === draggableId);
      if (targetIndex === -1) return;

      const [movedTask] = currentTasks.splice(targetIndex, 1);
      const updatedTask = { ...movedTask, status: newStatus };

      const destColumnTasks = currentTasks.filter((t) => t.status === newStatus);
      destColumnTasks.splice(destination.index, 0, updatedTask);

      const otherTasks = currentTasks.filter((t) => t.status !== newStatus);
      const reorderedList = [...otherTasks, ...destColumnTasks];
      setDailyList(reorderedList);

      startTransition(async () => {
        if (movedTask.status !== newStatus) {
          await updateDailyTaskStatus(draggableId, newStatus);
        }
        await reorderDailyTasks(reorderedList.map((t) => t.id));
      });
    } else {
      const currentTasks = [...longTermList];
      const targetIndex = currentTasks.findIndex((t) => t.id === draggableId);
      if (targetIndex === -1) return;

      const [movedTask] = currentTasks.splice(targetIndex, 1);
      const updatedTask = { ...movedTask, status: newStatus };

      const destColumnTasks = currentTasks.filter((t) => t.status === newStatus);
      destColumnTasks.splice(destination.index, 0, updatedTask);

      const otherTasks = currentTasks.filter((t) => t.status !== newStatus);
      const reorderedList = [...otherTasks, ...destColumnTasks];
      setLongTermList(reorderedList);

      startTransition(async () => {
        if (movedTask.status !== newStatus) {
          await updateLongTermTaskStatus(draggableId, newStatus);
        }
        await reorderLongTermTasks(reorderedList.map((t) => t.id));
      });
    }
  };

  // Quick cycle status button
  const handleCycleStatus = async (
    e: React.MouseEvent,
    id: string,
    currentStatus: TaskStatus
  ) => {
    e.stopPropagation();

    let nextStatus: TaskStatus = 'todo';
    if (currentStatus === 'todo') nextStatus = 'in_progress';
    else if (currentStatus === 'in_progress') nextStatus = 'done';
    else nextStatus = 'todo';

    if (currentView === 'daily') {
      setDailyList((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: nextStatus } : t))
      );
      await updateDailyTaskStatus(id, nextStatus);
    } else {
      setLongTermList((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: nextStatus } : t))
      );
      await updateLongTermTaskStatus(id, nextStatus);
    }
  };

  // Modal status change
  const handleModalStatusChange = async (id: string, newStatus: TaskStatus) => {
    if (currentView === 'daily') {
      setDailyList((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
      );
      if (selectedTask && selectedTask.id === id) {
        setSelectedTask({ ...selectedTask, status: newStatus });
      }
      await updateDailyTaskStatus(id, newStatus);
    } else {
      setLongTermList((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
      );
      if (selectedTask && selectedTask.id === id) {
        setSelectedTask({ ...selectedTask, status: newStatus });
      }
      await updateLongTermTaskStatus(id, newStatus);
    }
  };

  // Deletion
  const handleDeleteTask = async (id: string) => {
    if (currentView === 'daily') {
      setDailyList((prev) => prev.filter((t) => t.id !== id));
      await deleteDailyTask(id);
    } else {
      setLongTermList((prev) => prev.filter((t) => t.id !== id));
      await deleteLongTermTask(id);
    }
  };

  // Creation handlers
  const handleCreateDaily = async (data: {
    title: string;
    dueTime?: string;
    notes?: string;
  }) => {
    const res = await createDailyTask(data);
    if (res.success && res.task) {
      setDailyList((prev) => [res.task as DailyTask, ...prev]);
      return { success: true };
    }
    return { error: res.error || 'Errore nella creazione' };
  };

  const handleCreateLongTerm = async (data: {
    title: string;
    dueDate: string;
    advanceNoticeDays: number;
    notes?: string;
  }) => {
    const res = await createLongTermTask(data);
    if (res.success && res.task) {
      const deadlineInfo = getDeadlineInfo(data.dueDate, data.advanceNoticeDays);
      const enriched: EnrichedLongTermTask = {
        ...(res.task as any),
        daysRemaining: deadlineInfo.daysRemaining,
        deadlineState: deadlineInfo.state,
        deadlineLabel: deadlineInfo.label,
      };
      setLongTermList((prev) => [enriched, ...prev]);
      return { success: true };
    }
    return { error: res.error || 'Errore nella creazione' };
  };

  const handleUpdateDaily = async (
    id: string,
    data: { title: string; dueTime?: string; notes?: string }
  ) => {
    setDailyList((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              title: data.title,
              dueTime: data.dueTime || null,
              notes: data.notes || null,
            }
          : t
      )
    );
    if (selectedTask && selectedTask.id === id) {
      setSelectedTask((prev: any) => ({
        ...prev,
        title: data.title,
        dueTime: data.dueTime || null,
        notes: data.notes || null,
      }));
    }
    await updateDailyTask(id, data);
  };

  const handleUpdateLongTerm = async (
    id: string,
    data: { title: string; dueDate: string; advanceNoticeDays: number; notes?: string }
  ) => {
    const deadlineInfo = getDeadlineInfo(data.dueDate, data.advanceNoticeDays);
    setLongTermList((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              title: data.title,
              dueDate: new Date(data.dueDate),
              advanceNoticeDays: data.advanceNoticeDays,
              notes: data.notes || null,
              daysRemaining: deadlineInfo.daysRemaining,
              deadlineState: deadlineInfo.state,
              deadlineLabel: deadlineInfo.label,
            }
          : t
      )
    );
    if (selectedTask && selectedTask.id === id) {
      setSelectedTask((prev: any) => ({
        ...prev,
        title: data.title,
        dueDate: new Date(data.dueDate),
        advanceNoticeDays: data.advanceNoticeDays,
        notes: data.notes || null,
        daysRemaining: deadlineInfo.daysRemaining,
        deadlineState: deadlineInfo.state,
        deadlineLabel: deadlineInfo.label,
      }));
    }
    await updateLongTermTask(id, data);
  };

  // Filter tasks into columns
  const dailyTasksWithType = dailyList.map((t) => ({ ...t, type: 'daily' as const }));
  const longTermTasksWithType = longTermList.map((t) => ({
    ...t,
    type: 'longterm' as const,
  }));

  const rawActiveList =
    currentView === 'daily' ? dailyTasksWithType : longTermTasksWithType;

  // Apply Search & Quick Filter
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const activeTaskList = rawActiveList.filter((t) => {
    if ( normalizedQuery ) {
      const inTitle = t.title.toLowerCase().includes(normalizedQuery);
      const inNotes = (t.notes || '').toLowerCase().includes(normalizedQuery);
      if (!inTitle && !inNotes) return false;
    }
    if (quickFilter === 'urgent') {
      if (t.type === 'longterm') {
        return t.deadlineState === 'warning' || t.deadlineState === 'expired';
      } else {
        return Boolean(t.dueTime) && t.status !== 'done';
      }
    }
    return true;
  });

  const todoTasks = activeTaskList.filter((t) => t.status === 'todo');
  const inProgressTasks = activeTaskList.filter((t) => t.status === 'in_progress');
  const doneTasks = activeTaskList.filter((t) => t.status === 'done');

  // Compute Bento KPIs
  const totalInView = rawActiveList.length;
  const completedInView = rawActiveList.filter((t) => t.status === 'done').length;
  const pendingInView = totalInView - completedInView;
  const completionPercent = totalInView > 0 ? Math.round((completedInView / totalInView) * 100) : 0;

  const warningCount = longTermList.filter((t) => t.deadlineState === 'warning' && t.status !== 'done').length;
  const expiredCount = longTermList.filter((t) => t.deadlineState === 'expired' && t.status !== 'done').length;

  const auraClass = currentView === 'daily' ? 'kairon-aura-daily' : 'kairon-aura-longterm';

  if (!isMounted) {
    return (
      <div className="min-h-[calc(100vh-64px)] p-8 flex items-center justify-center" style={{ color: 'var(--text-secondary)' }}>
        Caricamento board...
      </div>
    );
  }

  return (
    <div className={`min-h-[calc(100vh-64px)] ${auraClass}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        
        {/* BENTO HEADER & STATISTICS */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* Overview & Reset Countdown Card */}
          <div className="lg:col-span-5 glass-surface rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <span
                className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  currentView === 'daily' ? 'text-amber-400' : 'text-indigo-400'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{todayFormatted || 'Oggi'}</span>
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-1">
                {currentView === 'daily' ? 'Focus Giornaliero' : 'Pianificazione Scadenze'}
              </h1>
              <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                Hai{' '}
                <strong className={currentView === 'daily' ? 'text-amber-400' : 'text-indigo-400'}>
                  {pendingInView} {pendingInView === 1 ? 'attività attiva' : 'attività attive'}
                </strong>{' '}
                in questa vista.
              </p>
            </div>

            <div
              className="mt-4 pt-3 border-t flex items-center justify-between text-xs flex-wrap gap-2"
              style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
            >
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Reset giornaliero: <strong>00:00 ({resetCountdown || 'mezzanotte'})</strong>
              </span>
              <span className="font-semibold text-emerald-400">
                ✓ {completedInView} completate
              </span>
            </div>
          </div>

          {/* Bento KPI Cards */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* KPI 1: Progress */}
            <div className="glass-surface rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  Completamento
                </span>
                <span className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold">{completionPercent}%</span>
                  <span className="text-xs text-emerald-400 font-semibold">
                    {completedInView} / {totalInView} task
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-500/20 mt-2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* KPI 2: Deadlines Monitor */}
            <div className="glass-surface rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  Stato Scadenze
                </span>
                <span className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-amber-400">{warningCount}</span>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    in scadenza
                  </span>
                </div>
                <p className="text-xs font-medium mt-1.5 flex items-center gap-1.5">
                  {expiredCount > 0 ? (
                    <span className="text-rose-400">🔴 {expiredCount} scadute da risolvere</span>
                  ) : (
                    <span className="text-emerald-400">🟢 Nessuna attività scaduta</span>
                  )}
                </p>
              </div>
            </div>

            {/* KPI 3: Search & Quick Filter */}
            <div className="glass-surface rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                Ricerca & Filtro Rapido
              </span>
              <div className="relative mb-2">
                <Search
                  className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--text-muted)' }}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cerca task o note..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl kairon-input focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                />
              </div>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setQuickFilter('all')}
                  className={`flex-1 py-1 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    quickFilter === 'all'
                      ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                      : 'hover:bg-slate-500/10'
                  }`}
                  style={quickFilter !== 'all' ? { color: 'var(--text-secondary)' } : undefined}
                >
                  Tutte
                </button>
                <button
                  type="button"
                  onClick={() => setQuickFilter(quickFilter === 'urgent' ? 'all' : 'urgent')}
                  className={`flex-1 py-1 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    quickFilter === 'urgent'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'hover:bg-slate-500/10'
                  }`}
                  style={quickFilter !== 'urgent' ? { color: 'var(--text-secondary)' } : undefined}
                >
                  ⚡ Prioritarie
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ACTION BAR: VIEW SWITCHER + CREATE CTA */}
        <section className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-surface p-2.5 rounded-2xl">
          <ViewSwitcher
            currentView={currentView}
            onViewChange={(view) => setCurrentView(view)}
            dailyCount={dailyList.length}
            longTermCount={longTermList.length}
          />

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white shadow-lg transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 cursor-pointer ${
              currentView === 'daily'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 shadow-amber-500/25'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-500/25'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Nuova Attività</span>
          </button>
        </section>

        {/* KANBAN BOARD (3 COLUMNS) */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            <KanbanColumn
              id="todo"
              title="To Do"
              tasks={todoTasks}
              viewType={currentView}
              onCardClick={(task) => setSelectedTask(task)}
              onCycleStatus={handleCycleStatus}
            />

            <KanbanColumn
              id="in_progress"
              title="In Progress"
              tasks={inProgressTasks}
              viewType={currentView}
              onCardClick={(task) => setSelectedTask(task)}
              onCycleStatus={handleCycleStatus}
            />

            <KanbanColumn
              id="done"
              title="Done"
              tasks={doneTasks}
              viewType={currentView}
              onCardClick={(task) => setSelectedTask(task)}
              onCycleStatus={handleCycleStatus}
            />
          </div>
        </DragDropContext>

        <p className="text-center text-xs mt-8" style={{ color: 'var(--text-muted)' }}>
          💡 Trascina le card tra le colonne o clicca sullo stato per spostarle rapidamente.
        </p>
      </div>

      {/* Task Details Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          viewType={currentView}
          onClose={() => setSelectedTask(null)}
          onStatusChange={handleModalStatusChange}
          onDelete={handleDeleteTask}
          onUpdateDailyTask={handleUpdateDaily}
          onUpdateLongTermTask={handleUpdateLongTerm}
        />
      )}

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        viewType={currentView}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateDaily={handleCreateDaily}
        onCreateLongTerm={handleCreateLongTerm}
      />
    </div>
  );
}

'use client';

import { useState, useEffect, useTransition } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Plus } from 'lucide-react';
import { ViewType, TaskStatus, EnrichedLongTermTask, TaskItem } from '@/types';
import { DailyTask } from '@/db/schema';
import ViewSwitcher from './view-switcher';
import KanbanColumn from './kanban-column';
import TaskDetailModal from './task-detail-modal';
import CreateTaskModal from './create-task-modal';
import { useSearch } from '@/components/search/search-provider';
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

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [currentView, setCurrentView] = useState<ViewType>('daily');
  const [dailyList, setDailyList] = useState<DailyTask[]>(initialDailyTasks);
  const [longTermList, setLongTermList] = useState<EnrichedLongTermTask[]>(initialLongTermTasks);
  const [quickFilter, setQuickFilter] = useState<'all' | 'urgent'>('all');

  const {
    boardFilterQuery,
    setBoardFilterQuery,
    setTasks,
    registerSelectTaskHandler,
    registerViewChangeHandler,
  } = useSearch();

  // Modals state
  const [selectedTask, setSelectedTask] = useState<
    | (DailyTask & { type: 'daily' })
    | (EnrichedLongTermTask & { type: 'longterm' })
    | null
  >(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [, startTransition] = useTransition();

  // Synchronize tasks with SearchContext
  useEffect(() => {
    const allTasks: TaskItem[] = [
      ...dailyList.map((t) => ({ ...t, type: 'daily' as const })),
      ...longTermList.map((t) => ({ ...t, type: 'longterm' as const })),
    ];
    setTasks(allTasks);
  }, [dailyList, longTermList, setTasks]);

  // Register task selection and view change handlers with SearchContext
  useEffect(() => {
    registerSelectTaskHandler((task: TaskItem) => {
      if (task.type !== currentView) {
        setCurrentView(task.type);
      }
      setSelectedTask(task);
    });
  }, [currentView, registerSelectTaskHandler]);

  useEffect(() => {
    registerViewChangeHandler((view: ViewType) => {
      setCurrentView(view);
    });
  }, [registerViewChangeHandler]);

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

  // Apply Search (from boardFilterQuery) & Quick Filter
  const normalizedQuery = boardFilterQuery.trim().toLowerCase();
  const activeTaskList = rawActiveList.filter((t) => {
    if (normalizedQuery) {
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
        
        {/* ACTION BAR: VIEW SWITCHER + QUICK FILTERS + CREATE CTA */}
        <section className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-surface p-2.5 rounded-2xl">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <ViewSwitcher
              currentView={currentView}
              onViewChange={(view) => setCurrentView(view)}
              dailyCount={dailyList.length}
              longTermCount={longTermList.length}
            />

            <button
              type="button"
              onClick={() => setQuickFilter(quickFilter === 'urgent' ? 'all' : 'urgent')}
              className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                quickFilter === 'urgent'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'hover:bg-slate-500/10'
              }`}
              style={quickFilter !== 'urgent' ? { color: 'var(--text-secondary)' } : undefined}
              title="Filtra solo le attività prioritarie o in scadenza"
            >
              <span>⚡</span>
              <span>Prioritarie</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
            {boardFilterQuery && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
                <span>Filtro: &quot;{boardFilterQuery}&quot;</span>
                <button
                  type="button"
                  onClick={() => setBoardFilterQuery('')}
                  className="hover:text-white cursor-pointer ml-1 text-slate-400 hover:text-white transition-colors"
                  title="Rimuovi filtro di ricerca"
                >
                  ✕
                </button>
              </div>
            )}

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
          </div>
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

'use client';

import { useState, useEffect, useTransition } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Plus } from 'lucide-react';
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
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [currentView, setCurrentView] = useState<ViewType>('daily');
  const [dailyList, setDailyList] = useState<DailyTask[]>(initialDailyTasks);
  const [longTermList, setLongTermList] = useState<EnrichedLongTermTask[]>(initialLongTermTasks);

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

    // Dropped outside or in same position
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId as TaskStatus;

    if (currentView === 'daily') {
      // Optimistic update for daily tasks
      const currentTasks = [...dailyList];
      const targetIndex = currentTasks.findIndex((t) => t.id === draggableId);
      if (targetIndex === -1) return;

      const [movedTask] = currentTasks.splice(targetIndex, 1);
      const updatedTask = { ...movedTask, status: newStatus };

      // Find tasks in destination column to insert at proper index
      const destColumnTasks = currentTasks.filter((t) => t.status === newStatus);
      destColumnTasks.splice(destination.index, 0, updatedTask);

      // Reassemble list
      const otherTasks = currentTasks.filter((t) => t.status !== newStatus);
      const reorderedList = [...otherTasks, ...destColumnTasks];
      setDailyList(reorderedList);

      // Persist in DB
      startTransition(async () => {
        if (movedTask.status !== newStatus) {
          await updateDailyTaskStatus(draggableId, newStatus);
        }
        await reorderDailyTasks(reorderedList.map((t) => t.id));
      });
    } else {
      // Optimistic update for long term tasks
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

      // Persist in DB
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
      // Re-fetch or enrich
      const enriched: EnrichedLongTermTask = {
        ...(res.task as any),
        daysRemaining: 7,
        deadlineState: 'on_track',
        deadlineLabel: 'In orario',
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

  const activeTaskList =
    currentView === 'daily' ? dailyTasksWithType : longTermTasksWithType;

  const todoTasks = activeTaskList.filter((t) => t.status === 'todo');
  const inProgressTasks = activeTaskList.filter((t) => t.status === 'in_progress');
  const doneTasks = activeTaskList.filter((t) => t.status === 'done');

  // Dynamic background style based on view
  // Inverted: daily = warm amber (#451a03), longterm = cool indigo (#1e1b4b)
  const bgStyle =
    currentView === 'daily'
      ? 'bg-gradient-to-br from-[#0f172a] via-[#1c1208] to-[#451a03]/50'
      : 'bg-gradient-to-br from-[#0f172a] via-[#0d1326] to-[#1e1b4b]/50';

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#0f172a] p-8 flex items-center justify-center text-slate-400">
        Caricamento board...
      </div>
    );
  }

  return (
    <div className={`min-h-[calc(100vh-61px)] transition-all duration-500 ${bgStyle}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* CENTERED View Switcher */}
        <ViewSwitcher
          currentView={currentView}
          onViewChange={(view) => setCurrentView(view)}
        />

        {/* Action Bar with "Crea Attività" */}
        <div className="flex justify-center mb-8">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className={`px-6 py-3 rounded-2xl text-sm font-semibold text-white shadow-xl transition-all duration-200 active:scale-95 flex items-center gap-2 ${
              currentView === 'daily'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-600/30'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-600/30'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Crea Attività</span>
          </button>
        </div>

        {/* Kanban Board with DragDropContext */}
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

        <p className="text-center text-slate-500 text-xs mt-10">
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

'use client';

import { Droppable } from '@hello-pangea/dnd';
import { TaskStatus, ViewType, EnrichedLongTermTask } from '@/types';
import { DailyTask } from '@/db/schema';
import TaskCard from './task-card';

interface KanbanColumnProps {
  id: TaskStatus;
  title: string;
  tasks: ((DailyTask & { type: 'daily' }) | (EnrichedLongTermTask & { type: 'longterm' }))[];
  viewType: ViewType;
  onCardClick: (task: (DailyTask & { type: 'daily' }) | (EnrichedLongTermTask & { type: 'longterm' })) => void;
  onCycleStatus: (e: React.MouseEvent, id: string, currentStatus: TaskStatus) => void;
}

export default function KanbanColumn({
  id,
  title,
  tasks,
  viewType,
  onCardClick,
  onCycleStatus,
}: KanbanColumnProps) {
  const getHeaderConfig = (status: TaskStatus) => {
    switch (status) {
      case 'todo':
        return {
          dot: 'bg-slate-400 ring-4 ring-slate-400/15',
          titleColor: '',
          badge: 'glass-surface',
          barBg: 'bg-slate-500/20',
          barFill: 'bg-slate-400 w-1/3',
        };
      case 'in_progress':
        return {
          dot: 'bg-sky-400 ring-4 ring-sky-400/20',
          titleColor: 'text-sky-400',
          badge: 'bg-sky-500/15 text-sky-400 border border-sky-500/30',
          barBg: 'bg-sky-500/15',
          barFill: 'bg-gradient-to-r from-sky-400 to-indigo-500 w-2/3',
        };
      case 'done':
        return {
          dot: 'bg-emerald-400 ring-4 ring-emerald-400/20',
          titleColor: 'text-emerald-400',
          badge: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
          barBg: 'bg-emerald-500/15',
          barFill: 'bg-gradient-to-r from-emerald-400 to-teal-500 w-full',
        };
    }
  };

  const cfg = getHeaderConfig(id);

  return (
    <div className="glass-surface rounded-2xl p-4 flex flex-col min-h-[440px] transition-all">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2.5">
          <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
          <h3 className={`font-extrabold text-xs uppercase tracking-wider ${cfg.titleColor}`}>
            {title}
          </h3>
        </div>
        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${cfg.badge}`}>
          {tasks.length}
        </span>
      </div>

      {/* Subtle Column Accent Bar */}
      <div className={`h-1 w-full rounded-full ${cfg.barBg} mb-4 overflow-hidden`}>
        <div className={`h-full rounded-full ${cfg.barFill}`} />
      </div>

      {/* Droppable Area */}
      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 space-y-3 rounded-xl transition-all duration-150 p-1 min-h-[180px] ${
              snapshot.isDraggingOver
                ? 'bg-indigo-500/10 ring-2 ring-dashed ring-indigo-500/50 rounded-2xl'
                : ''
            }`}
          >
            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                viewType={viewType}
                onClick={() => onCardClick(task)}
                onCycleStatus={onCycleStatus}
              />
            ))}
            {provided.placeholder}

            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <div
                className="h-32 flex items-center justify-center border-2 border-dashed rounded-2xl text-xs"
                style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
              >
                Nessuna attività
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}

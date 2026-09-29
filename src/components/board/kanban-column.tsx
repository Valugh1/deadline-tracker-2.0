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
  const getHeaderDot = (status: TaskStatus) => {
    switch (status) {
      case 'todo':
        return 'bg-slate-400';
      case 'in_progress':
        return 'bg-blue-400';
      case 'done':
        return 'bg-emerald-400';
    }
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 flex flex-col min-h-[420px]">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${getHeaderDot(id)}`} />
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300">
            {title}
          </h3>
        </div>
        <span className="text-xs font-semibold bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-700/50">
          {tasks.length}
        </span>
      </div>

      {/* Droppable Area */}
      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 space-y-3 rounded-xl transition-colors duration-150 p-1 min-h-[160px] ${
              snapshot.isDraggingOver ? 'bg-slate-800/40 rounded-xl ring-1 ring-slate-700' : ''
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
              <div className="h-28 flex items-center justify-center border-2 border-dashed border-slate-800 rounded-xl text-xs text-slate-600">
                Nessuna attività
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}

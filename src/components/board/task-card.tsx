'use client';

import { Draggable } from '@hello-pangea/dnd';
import { Clock, Calendar } from 'lucide-react';
import { TaskStatus, ViewType, EnrichedLongTermTask } from '@/types';
import { DailyTask } from '@/db/schema';
import { formatDisplayDate, calculateDaysRemaining, formatDeadlineText } from '@/lib/utils';

interface TaskCardProps {
  task: (DailyTask & { type: 'daily' }) | (EnrichedLongTermTask & { type: 'longterm' });
  index: number;
  viewType: ViewType;
  onClick: () => void;
  onCycleStatus: (e: React.MouseEvent, id: string, currentStatus: TaskStatus) => void;
}

export default function TaskCard({
  task,
  index,
  viewType,
  onClick,
  onCycleStatus,
}: TaskCardProps) {
  const dailyTask = task.type === 'daily' ? task : null;
  const ltTask = task.type === 'longterm' ? task : null;

  const getStatusLabel = (status: TaskStatus) => {
    switch (status) {
      case 'todo':
        return 'To Do';
      case 'in_progress':
        return 'In Progress';
      case 'done':
        return 'Done';
    }
  };

  const getStatusBadgeStyle = (status: TaskStatus) => {
    switch (status) {
      case 'todo':
        return 'bg-slate-600/30 border-slate-500/30 text-slate-300 hover:bg-slate-600/50';
      case 'in_progress':
        return 'bg-blue-500/15 border-blue-500/30 text-blue-400 hover:bg-blue-500/25';
      case 'done':
        return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25';
    }
  };

  let daysRemaining = 0;
  let deadlineColorClass = 'text-emerald-400';
  if (ltTask) {
    daysRemaining = calculateDaysRemaining(ltTask.dueDate);
    if (daysRemaining <= 0) {
      deadlineColorClass = 'text-red-400';
    } else if (daysRemaining <= ltTask.advanceNoticeDays) {
      deadlineColorClass = 'text-amber-400';
    }
  }

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`bg-slate-800/80 hover:bg-slate-800 border border-slate-700/50 rounded-xl p-4 transition-all duration-150 cursor-pointer select-none group ${
            snapshot.isDragging
              ? 'shadow-2xl scale-[1.02] ring-2 ring-indigo-500/50 z-50 bg-slate-800'
              : 'hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20'
          }`}
        >
          {/* Title & Quick Status Cycle */}
          <div className="flex items-start justify-between gap-2 mb-2.5">
            <h4 className="font-semibold text-sm text-white leading-snug flex-1 group-hover:text-slate-100">
              {task.title}
            </h4>

            <button
              type="button"
              onClick={(e) => onCycleStatus(e, task.id, task.status)}
              title="Clicca per avanzare lo stato"
              className={`text-xs px-2 py-0.5 rounded-lg border transition-all hover:scale-105 active:scale-95 shrink-0 font-medium ${getStatusBadgeStyle(
                task.status
              )}`}
            >
              {getStatusLabel(task.status)} →
            </button>
          </div>

          {/* Daily specific: Due Time */}
          {dailyTask && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{dailyTask.dueTime ? `Entro le ${dailyTask.dueTime}` : 'Nessun orario'}</span>
            </div>
          )}

          {/* Long Term specific: Due Date, Days Remaining/Expired, Deadline Badge */}
          {ltTask && (
            <div className="space-y-2 mt-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 flex-wrap">
                <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>{formatDisplayDate(ltTask.dueDate)}</span>
                <span className="text-slate-600">·</span>
                <span className={`font-medium ${deadlineColorClass}`}>
                  {formatDeadlineText(daysRemaining)}
                </span>
              </div>

              <div>
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md border ${
                    ltTask.deadlineState === 'expired'
                      ? 'bg-red-500/15 border-red-500/30 text-red-400'
                      : ltTask.deadlineState === 'warning'
                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                      : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  }`}
                >
                  {ltTask.deadlineState === 'expired' && <span>🔴</span>}
                  {ltTask.deadlineState === 'warning' && <span>🟡</span>}
                  {ltTask.deadlineState === 'on_track' && <span>🟢</span>}
                  <span>{ltTask.deadlineLabel}</span>
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}

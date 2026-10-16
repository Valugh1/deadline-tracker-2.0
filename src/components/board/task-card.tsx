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
  onClick,
  onCycleStatus,
}: TaskCardProps) {
  const dailyTask = task.type === 'daily' ? task : null;
  const ltTask = task.type === 'longterm' ? task : null;

  const getStatusLabel = (status: TaskStatus) => {
    switch (status) {
      case 'todo':
        return 'To Do →';
      case 'in_progress':
        return 'In Corso →';
      case 'done':
        return 'Done ✓';
    }
  };

  const getStatusBadgeStyle = (status: TaskStatus) => {
    switch (status) {
      case 'todo':
        return 'bg-slate-500/15 border-slate-500/30 hover:bg-slate-500/30';
      case 'in_progress':
        return 'bg-sky-500/15 border-sky-500/30 text-sky-400 hover:bg-sky-500/30';
      case 'done':
        return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30';
    }
  };

  let daysRemaining = 0;
  let deadlineColorClass = 'text-emerald-400';
  if (ltTask) {
    daysRemaining = calculateDaysRemaining(ltTask.dueDate);
    if (daysRemaining <= 0) {
      deadlineColorClass = 'text-rose-400';
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
          className={`task-card-surface rounded-2xl p-4 cursor-pointer select-none group ${
            snapshot.isDragging
              ? 'shadow-2xl scale-[1.02] ring-2 ring-indigo-500/60 z-50'
              : 'hover:-translate-y-0.5'
          }`}
        >
          {/* Top Badges Row */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <span
              className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                dailyTask
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                  : 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/25'
              }`}
            >
              {dailyTask ? '☀️ Giornaliera' : '📅 Scadenza'}
            </span>

            {ltTask && (
              <span
                className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md border ${
                  ltTask.deadlineState === 'expired'
                    ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
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
            )}
          </div>

          {/* Title */}
          <div className="my-2">
            <h4
              className={`font-bold text-sm leading-snug ${
                task.status === 'done' ? 'line-through opacity-60' : ''
              }`}
              style={{ color: 'var(--text-primary)' }}
            >
              {task.title}
            </h4>
          </div>

          {/* Notes preview if present */}
          {task.notes && (
            <p
              className="text-xs mb-3 line-clamp-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              {task.notes}
            </p>
          )}

          {/* Footer: Time / Date + Quick Status Cycle Button */}
          <div
            className="pt-2.5 mt-2 border-t flex items-center justify-between gap-2"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            {/* Daily specific: Due Time */}
            {dailyTask && (
              <div
                className="flex items-center gap-1.5 text-xs font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{dailyTask.dueTime ? `Entro le ${dailyTask.dueTime}` : 'Nessun orario'}</span>
              </div>
            )}

            {/* Long Term specific: Due Date & Days Remaining */}
            {ltTask && (
              <div
                className="flex items-center gap-1.5 text-xs flex-wrap"
                style={{ color: 'var(--text-secondary)' }}
              >
                <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>{formatDisplayDate(ltTask.dueDate)}</span>
                <span>·</span>
                <span className={`font-semibold ${deadlineColorClass}`}>
                  {formatDeadlineText(daysRemaining)}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={(e) => onCycleStatus(e, task.id, task.status)}
              title="Clicca per avanzare lo stato"
              className={`text-xs px-2.5 py-1 rounded-lg border transition-all hover:scale-105 active:scale-95 shrink-0 font-semibold cursor-pointer ${getStatusBadgeStyle(
                task.status
              )}`}
            >
              {getStatusLabel(task.status)}
            </button>
          </div>
        </div>
      )}
    </Draggable>
  );
}

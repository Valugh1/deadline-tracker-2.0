'use client';

import { useState } from 'react';
import { X, Clock, Calendar, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';
import { TaskStatus, ViewType, EnrichedLongTermTask } from '@/types';
import { DailyTask } from '@/db/schema';
import { formatDisplayDate, calculateDaysRemaining } from '@/lib/utils';
import ConfirmDeleteModal from './confirm-delete-modal';

interface TaskDetailModalProps {
  task: (DailyTask & { type: 'daily' }) | (EnrichedLongTermTask & { type: 'longterm' });
  viewType: ViewType;
  onClose: () => void;
  onStatusChange: (id: string, newStatus: TaskStatus) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function TaskDetailModal({
  task,
  viewType,
  onClose,
  onStatusChange,
  onDelete,
}: TaskDetailModalProps) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  const dailyTask = task.type === 'daily' ? task : null;
  const ltTask = task.type === 'longterm' ? task : null;

  const handleStatusClick = async (status: TaskStatus) => {
    if (task.status === status) return;
    setIsChangingStatus(true);
    await onStatusChange(task.id, status);
    setIsChangingStatus(false);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    await onDelete(task.id);
    setIsDeleting(false);
    setShowConfirmDelete(false);
    onClose();
  };

  // Calculate days for long-term task
  let daysRemaining = 0;
  let isExpired = false;
  if (ltTask) {
    daysRemaining = calculateDaysRemaining(ltTask.dueDate);
    isExpired = daysRemaining <= 0;
  }

  // Label for remaining/expired days:
  // If task is in 'done' state and was expired, or simply expired: show "Scaduto da" without negative sign
  const daysLabel = isExpired ? 'Scaduto da' : 'Giorni rimanenti';
  const positiveDays = Math.abs(daysRemaining);

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="bg-slate-800 border border-slate-700/60 rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-start justify-between mb-5 gap-3">
            <h2 className="text-xl font-bold text-white leading-snug">
              {task.title}
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Status selector buttons */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Stato
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={isChangingStatus}
                onClick={() => handleStatusClick('todo')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                  task.status === 'todo'
                    ? 'bg-slate-600/40 border-slate-400/50 text-white shadow-sm'
                    : 'bg-slate-700/20 border-slate-700/40 text-slate-400 hover:text-slate-200 hover:border-slate-600/50'
                }`}
              >
                To Do
              </button>
              <button
                type="button"
                disabled={isChangingStatus}
                onClick={() => handleStatusClick('in_progress')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                  task.status === 'in_progress'
                    ? 'bg-blue-600/30 border-blue-400/50 text-blue-300 shadow-sm'
                    : 'bg-slate-700/20 border-slate-700/40 text-slate-400 hover:text-slate-200 hover:border-slate-600/50'
                }`}
              >
                In Progress
              </button>
              <button
                type="button"
                disabled={isChangingStatus}
                onClick={() => handleStatusClick('done')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                  task.status === 'done'
                    ? 'bg-emerald-600/30 border-emerald-400/50 text-emerald-300 shadow-sm'
                    : 'bg-slate-700/20 border-slate-700/40 text-slate-400 hover:text-slate-200 hover:border-slate-600/50'
                }`}
              >
                Done
              </button>
            </div>
          </div>

          {/* Daily Task specifics */}
          {dailyTask && (
            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Orario
              </label>
              <div className="flex items-center gap-2 text-sm text-slate-200 bg-slate-900/40 border border-slate-700/40 rounded-xl px-4 py-3">
                <Clock className="w-4 h-4 text-amber-400" />
                {dailyTask.dueTime ? `Entro le ${dailyTask.dueTime}` : 'Nessun orario specificato'}
              </div>
            </div>
          )}

          {/* Long Term Task specifics */}
          {ltTask && (
            <>
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Scadenza
                  </label>
                  <div className="flex items-center gap-2 text-sm text-slate-200 bg-slate-900/40 border border-slate-700/40 rounded-xl px-4 py-3">
                    <Calendar className="w-4 h-4 text-indigo-400" />
                    {formatDisplayDate(ltTask.dueDate)}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    {daysLabel}
                  </label>
                  <div className="text-sm bg-slate-900/40 border border-slate-700/40 rounded-xl px-4 py-3 text-center">
                    <span
                      className={`text-lg font-bold ${
                        isExpired
                          ? 'text-red-400'
                          : daysRemaining <= ltTask.advanceNoticeDays
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {positiveDays}
                    </span>
                    <span className="text-slate-400 ml-1">
                      {positiveDays === 1 ? 'giorno' : 'giorni'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="mb-5">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Status scadenza
                </label>
                <div
                  className={`inline-flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl border ${
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
                  <span className="font-medium">{ltTask.deadlineLabel}</span>
                  {ltTask.deadlineState === 'warning' && (
                    <span className="text-xs opacity-70 ml-1">
                      (preavviso: {ltTask.advanceNoticeDays} gg)
                    </span>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Note
            </label>
            <div className="text-sm text-slate-300 bg-slate-900/40 border border-slate-700/40 rounded-xl px-4 py-3 leading-relaxed whitespace-pre-wrap min-h-[70px]">
              {task.notes || <span className="text-slate-500 italic">Nessuna nota specificata</span>}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2 border-t border-slate-700/40">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-700/60 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl transition-colors text-sm border border-slate-600/40"
            >
              Chiudi
            </button>
            <button
              type="button"
              onClick={() => setShowConfirmDelete(true)}
              className="py-2.5 px-4 bg-red-500/15 hover:bg-red-500/25 text-red-400 font-semibold rounded-xl transition-colors text-sm border border-red-500/30 flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              Elimina
            </button>
          </div>
        </div>
      </div>

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </>
  );
}

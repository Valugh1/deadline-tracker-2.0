'use client';

import { useState } from 'react';
import { X, Clock, Calendar, Pencil, Trash2, Check, AlertCircle } from 'lucide-react';
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
  onUpdateDailyTask?: (id: string, data: { title: string; dueTime?: string; notes?: string }) => Promise<void>;
  onUpdateLongTermTask?: (id: string, data: { title: string; dueDate: string; advanceNoticeDays: number; notes?: string }) => Promise<void>;
}

export default function TaskDetailModal({
  task,
  viewType,
  onClose,
  onStatusChange,
  onDelete,
  onUpdateDailyTask,
  onUpdateLongTermTask,
}: TaskDetailModalProps) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const dailyTask = task.type === 'daily' ? task : null;
  const ltTask = task.type === 'longterm' ? task : null;

  // Form states initialized with current task values
  const [title, setTitle] = useState(task.title);
  const [dueTime, setDueTime] = useState(dailyTask?.dueTime || '12:00');
  const [dueDate, setDueDate] = useState(() => {
    if (ltTask?.dueDate) {
      const d = new Date(ltTask.dueDate);
      return d.toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  });
  const [advanceNoticeDays, setAdvanceNoticeDays] = useState(ltTask?.advanceNoticeDays ?? 7);
  const [notes, setNotes] = useState(task.notes || '');

  const isDaily = viewType === 'daily';
  const accentColor = isDaily ? 'amber' : 'indigo';

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

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setEditError('Il titolo è obbligatorio');
      return;
    }

    setIsSaving(true);
    setEditError(null);

    try {
      if (isDaily && onUpdateDailyTask) {
        await onUpdateDailyTask(task.id, {
          title: title.trim(),
          dueTime: dueTime.trim() || undefined,
          notes: notes.trim() || undefined,
        });
      } else if (!isDaily && onUpdateLongTermTask) {
        await onUpdateLongTermTask(task.id, {
          title: title.trim(),
          dueDate,
          advanceNoticeDays,
          notes: notes.trim() || undefined,
        });
      }
      setIsEditing(false);
    } catch (err: any) {
      console.error('Error updating task:', err);
      setEditError(err?.message || 'Errore durante il salvataggio delle modifiche');
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate days for long-term task
  let daysRemaining = 0;
  let isExpired = false;
  if (ltTask) {
    daysRemaining = calculateDaysRemaining(ltTask.dueDate);
    isExpired = daysRemaining <= 0;
  }

  // If task is expired: show "Scaduto da" without negative sign
  const daysLabel = isExpired ? 'Scaduto da' : 'Giorni rimanenti';
  const positiveDays = Math.abs(daysRemaining);

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget && !isSaving && !isDeleting) onClose();
        }}
      >
        <div className="bg-slate-800 border border-slate-700/60 rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="flex items-start justify-between mb-5 gap-3">
            <h2 className="text-xl font-bold text-white leading-snug">
              {isEditing ? (
                <span>Modifica Attività</span>
              ) : (
                task.title
              )}
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors shrink-0"
              aria-label="Chiudi finestra"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {editError && (
            <div className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-xs sm:text-sm text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{editError}</span>
            </div>
          )}

          {/* EDIT FORM MODE */}
          {isEditing ? (
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Titolo attività *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Nome dell'attività"
                  className={`w-full px-4 py-2.5 bg-slate-900/60 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-${accentColor}-500 focus:border-transparent transition-all text-sm`}
                />
              </div>

              {/* Daily Task specifics */}
              {isDaily && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Orario entro cui svolgerla
                  </label>
                  <input
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-sm"
                  />
                </div>
              )}

              {/* Long Term Task specifics */}
              {!isDaily && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Data di scadenza *
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Giorni di preavviso per la notifica
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        max={365}
                        value={advanceNoticeDays}
                        onChange={(e) => setAdvanceNoticeDays(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                        giorni prima
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* Notes field */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Note
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Dettagli aggiuntivi..."
                  className={`w-full px-4 py-2.5 bg-slate-900/60 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-${accentColor}-500 focus:border-transparent transition-all text-sm resize-none`}
                />
              </div>

              {/* Edit Mode Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-700/40">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2.5 bg-slate-700/60 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl transition-colors text-sm border border-slate-600/40"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`flex-1 py-2.5 text-white font-semibold rounded-xl shadow-lg transition-all text-sm flex items-center justify-center gap-1.5 ${
                    isDaily
                      ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/25'
                      : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/25'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>{isSaving ? 'Salvataggio...' : 'Salva Modifiche'}</span>
                </button>
              </div>
            </form>
          ) : (
            /* VIEW MODE */
            <>
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

              {/* Actions Footer: Modifica button replacing Chiudi + Elimina */}
              <div className="flex gap-3 pt-4 border-t border-slate-700/40">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className={`flex-1 py-2.5 text-white font-semibold rounded-xl transition-all text-sm flex items-center justify-center gap-2 shadow-md ${
                    isDaily
                      ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/25'
                      : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/25'
                  }`}
                >
                  <Pencil className="w-4 h-4" />
                  <span>Modifica</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(true)}
                  className="py-2.5 px-4 bg-red-500/15 hover:bg-red-500/25 text-red-400 font-semibold rounded-xl transition-colors text-sm border border-red-500/30 flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Elimina</span>
                </button>
              </div>
            </>
          )}
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

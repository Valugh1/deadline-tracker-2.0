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
        <div className="glass-elevated rounded-3xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="flex items-start justify-between mb-5 gap-3">
            <h2 className="text-xl font-extrabold leading-snug" style={{ color: 'var(--text-primary)' }}>
              {isEditing ? <span>Modifica Attività</span> : task.title}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-500/20 transition-colors shrink-0 cursor-pointer"
              style={{ color: 'var(--text-secondary)' }}
              aria-label="Chiudi finestra"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {editError && (
            <div className="mb-4 p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs sm:text-sm text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{editError}</span>
            </div>
          )}

          {/* EDIT FORM MODE */}
          {isEditing ? (
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Titolo attività *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Nome dell'attività"
                  className={`w-full px-4 py-2.5 kairon-input rounded-xl focus:outline-none focus:ring-2 ${
                    isDaily ? 'focus:ring-amber-500' : 'focus:ring-indigo-500'
                  } transition-all text-sm`}
                />
              </div>

              {/* Daily Task specifics */}
              {isDaily && (
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Orario entro cui svolgerla
                  </label>
                  <input
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="w-full px-4 py-2.5 kairon-input rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-sm"
                  />
                </div>
              )}

              {/* Long Term Task specifics */}
              {!isDaily && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                      Data di scadenza *
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 kairon-input rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                      Giorni di preavviso per la notifica
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        max={365}
                        value={advanceNoticeDays}
                        onChange={(e) => setAdvanceNoticeDays(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full px-4 py-2.5 kairon-input rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--text-muted)' }}>
                        giorni prima
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* Notes field */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Note
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Dettagli aggiuntivi..."
                  className={`w-full px-4 py-2.5 kairon-input rounded-xl focus:outline-none focus:ring-2 ${
                    isDaily ? 'focus:ring-amber-500' : 'focus:ring-indigo-500'
                  } transition-all text-sm resize-none`}
                />
              </div>

              {/* Edit Mode Buttons */}
              <div className="flex gap-3 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2.5 glass-surface hover:bg-slate-500/20 font-semibold rounded-xl transition-colors text-sm cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`flex-1 py-2.5 text-white font-bold rounded-xl shadow-lg transition-all text-sm flex items-center justify-center gap-1.5 cursor-pointer ${
                    isDaily
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 shadow-amber-500/25'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-500/25'
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
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Stato
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={isChangingStatus}
                    onClick={() => handleStatusClick('todo')}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      task.status === 'todo'
                        ? 'bg-slate-500/30 border-slate-400/60 shadow-sm'
                        : 'glass-surface opacity-70 hover:opacity-100'
                    }`}
                  >
                    To Do
                  </button>
                  <button
                    type="button"
                    disabled={isChangingStatus}
                    onClick={() => handleStatusClick('in_progress')}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      task.status === 'in_progress'
                        ? 'bg-sky-500/25 border-sky-400/60 text-sky-400 shadow-sm'
                        : 'glass-surface opacity-70 hover:opacity-100'
                    }`}
                  >
                    In Progress
                  </button>
                  <button
                    type="button"
                    disabled={isChangingStatus}
                    onClick={() => handleStatusClick('done')}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      task.status === 'done'
                        ? 'bg-emerald-500/25 border-emerald-400/60 text-emerald-400 shadow-sm'
                        : 'glass-surface opacity-70 hover:opacity-100'
                    }`}
                  >
                    Done
                  </button>
                </div>
              </div>

              {/* Daily Task specifics */}
              {dailyTask && (
                <div className="mb-5">
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Orario
                  </label>
                  <div className="flex items-center gap-2 text-sm glass-surface rounded-xl px-4 py-3">
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
                      <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                        Scadenza
                      </label>
                      <div className="flex items-center gap-2 text-sm glass-surface rounded-xl px-4 py-3">
                        <Calendar className="w-4 h-4 text-indigo-400" />
                        {formatDisplayDate(ltTask.dueDate)}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                        {daysLabel}
                      </label>
                      <div className="text-sm glass-surface rounded-xl px-4 py-3 text-center">
                        <span
                          className={`text-lg font-extrabold ${
                            isExpired
                              ? 'text-rose-400'
                              : daysRemaining <= ltTask.advanceNoticeDays
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {positiveDays}
                        </span>
                        <span className="ml-1" style={{ color: 'var(--text-secondary)' }}>
                          {positiveDays === 1 ? 'giorno' : 'giorni'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="mb-5">
                    <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Status scadenza
                    </label>
                    <div
                      className={`inline-flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl border ${
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
                      <span className="font-semibold">{ltTask.deadlineLabel}</span>
                      {ltTask.deadlineState === 'warning' && (
                        <span className="text-xs opacity-75 ml-1">
                          (preavviso: {ltTask.advanceNoticeDays} gg)
                        </span>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Notes */}
              <div className="mb-6">
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Note
                </label>
                <div className="text-sm glass-surface rounded-xl px-4 py-3 leading-relaxed whitespace-pre-wrap min-h-[70px]">
                  {task.notes || <span className="italic" style={{ color: 'var(--text-muted)' }}>Nessuna nota specificata</span>}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex gap-3 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className={`flex-1 py-2.5 text-white font-bold rounded-xl transition-all text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                    isDaily
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 shadow-amber-500/25'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-500/25'
                  }`}
                >
                  <Pencil className="w-4 h-4" />
                  <span>Modifica</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(true)}
                  className="py-2.5 px-4 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 font-bold rounded-xl transition-colors text-sm border border-rose-500/30 flex items-center gap-1.5 cursor-pointer"
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

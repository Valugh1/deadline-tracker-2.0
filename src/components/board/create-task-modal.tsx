'use client';

import { useState } from 'react';
import { X, Plus, Calendar, Clock, AlertCircle } from 'lucide-react';
import { ViewType } from '@/types';

interface CreateTaskModalProps {
  isOpen: boolean;
  viewType: ViewType;
  onClose: () => void;
  onCreateDaily: (data: { title: string; dueTime?: string; notes?: string }) => Promise<{ success?: boolean; error?: string }>;
  onCreateLongTerm: (data: { title: string; dueDate: string; advanceNoticeDays: number; notes?: string }) => Promise<{ success?: boolean; error?: string }>;
}

export default function CreateTaskModal({
  isOpen,
  viewType,
  onClose,
  onCreateDaily,
  onCreateLongTerm,
}: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [dueTime, setDueTime] = useState('12:00');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [advanceNoticeDays, setAdvanceNoticeDays] = useState(7);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isDaily = viewType === 'daily';
  const accentColor = isDaily ? 'amber' : 'indigo';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Il titolo è obbligatorio');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    let res;
    if (isDaily) {
      res = await onCreateDaily({
        title,
        dueTime,
        notes,
      });
    } else {
      res = await onCreateLongTerm({
        title,
        dueDate,
        advanceNoticeDays,
        notes,
      });
    }

    setIsSubmitting(false);

    if (res?.error) {
      setError(res.error);
    } else {
      // Reset form & close
      setTitle('');
      setNotes('');
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="bg-slate-800 border border-slate-700/60 rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>{isDaily ? '☀️' : '📅'}</span>
            <span>{isDaily ? 'Nuova Attività Giornaliera' : 'Nuova Attività Lungo Termine'}</span>
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-xs sm:text-sm text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Titolo attività *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isDaily ? 'es. Allenamento mattutino' : 'es. Rinnovo assicurazione auto'}
              required
              className={`w-full px-4 py-2.5 bg-slate-900/60 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-${accentColor}-500 focus:border-transparent transition-all text-sm`}
            />
          </div>

          {/* Daily field: Due Time */}
          {isDaily && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Orario entro cui svolgerla
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-sm"
                />
              </div>
            </div>
          )}

          {/* Long Term fields: Due Date & Notice Days */}
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
                <p className="text-xs text-slate-500 mt-1">
                  Esempio: impostando 10 giorni, l attività passerà &quot;in scadenza&quot; 10 giorni prima della data.
                </p>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Note (opzionale)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Dettagli o istruzioni aggiuntive..."
              className={`w-full px-4 py-2.5 bg-slate-900/60 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-${accentColor}-500 focus:border-transparent transition-all text-sm resize-none`}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 active:scale-[0.98] text-sm flex items-center justify-center gap-2 ${
              isDaily
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-500/25'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-500/25'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>{isSubmitting ? 'Creazione in corso...' : 'Crea Attività'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

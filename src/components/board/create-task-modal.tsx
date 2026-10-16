'use client';

import { useState } from 'react';
import { X, Plus, AlertCircle } from 'lucide-react';
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
      <div className="glass-elevated rounded-3xl shadow-2xl w-full max-w-lg p-6 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-extrabold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <span>{isDaily ? '☀️' : '📅'}</span>
            <span>{isDaily ? 'Nuova Attività Giornaliera' : 'Nuova Attività Lungo Termine'}</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-500/20 transition-colors cursor-pointer"
            style={{ color: 'var(--text-secondary)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs sm:text-sm text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Titolo attività *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isDaily ? 'es. Allenamento mattutino' : 'es. Rinnovo assicurazione auto'}
              required
              className={`w-full px-4 py-2.5 kairon-input rounded-xl focus:outline-none focus:ring-2 ${
                isDaily ? 'focus:ring-amber-500' : 'focus:ring-indigo-500'
              } transition-all text-sm`}
            />
          </div>

          {/* Daily field: Due Time */}
          {isDaily && (
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Orario entro cui svolgerla
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  className="w-full px-4 py-2.5 kairon-input rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-sm"
                />
              </div>
            </div>
          )}

          {/* Long Term fields: Due Date & Notice Days */}
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
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  Esempio: impostando 10 giorni, l&apos;attività passerà &quot;in scadenza&quot; 10 giorni prima della data.
                </p>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Note (opzionale)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Dettagli o istruzioni aggiuntive..."
              className={`w-full px-4 py-2.5 kairon-input rounded-xl focus:outline-none focus:ring-2 ${
                isDaily ? 'focus:ring-amber-500' : 'focus:ring-indigo-500'
              } transition-all text-sm resize-none`}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 text-white font-bold rounded-xl shadow-lg transition-all duration-200 active:scale-[0.98] text-sm flex items-center justify-center gap-2 cursor-pointer ${
              isDaily
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 shadow-amber-500/25'
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

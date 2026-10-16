'use client';

import { Trash2 } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  isDeleting = false,
}: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onClose();
      }}
    >
      <div className="glass-elevated rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center animate-in zoom-in-95 duration-200">
        <div className="w-14 h-14 mx-auto bg-rose-500/15 rounded-full flex items-center justify-center mb-4">
          <Trash2 className="w-7 h-7 text-rose-400" />
        </div>

        <h3 className="text-lg font-extrabold mb-2" style={{ color: 'var(--text-primary)' }}>
          Elimina attività
        </h3>
        
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          Vuoi eliminare definitivamente l&apos;attività?
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="flex-1 py-2.5 glass-surface hover:bg-slate-500/20 font-semibold rounded-xl transition-colors text-sm cursor-pointer"
          >
            Annulla
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold rounded-xl transition-colors text-sm shadow-lg shadow-rose-500/25 cursor-pointer"
          >
            {isDeleting ? 'Eliminazione...' : 'Elimina'}
          </button>
        </div>
      </div>
    </div>
  );
}

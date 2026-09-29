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
      <div className="bg-slate-800 border border-slate-700/60 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center animate-in zoom-in-95 duration-200">
        <div className="w-14 h-14 mx-auto bg-red-500/15 rounded-full flex items-center justify-center mb-4">
          <Trash2 className="w-7 h-7 text-red-400" />
        </div>

        <h3 className="text-lg font-bold text-white mb-2">Elimina attività</h3>
        
        {/* Exact text requested by user */}
        <p className="text-sm text-slate-400 mb-6">
          Vuoi eliminare definitivamente l&apos;attività?
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-700/60 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl transition-colors text-sm border border-slate-600/40"
          >
            Annulla
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors text-sm shadow-md shadow-red-500/20"
          >
            {isDeleting ? 'Eliminazione...' : 'Elimina'}
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff, BellRing, Share, PlusSquare, Loader2 } from 'lucide-react';
import {
  getPushSupport,
  getCurrentSubscription,
  enablePush,
  disablePush,
  PushSupport,
} from '@/lib/push-client';

type Status = 'loading' | 'enabled' | 'disabled' | 'denied';

export default function PushNotificationsPanel() {
  const [support, setSupport] = useState<PushSupport | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const s = getPushSupport();
    setSupport(s);
    if (s !== 'supported') {
      setStatus('disabled');
      return;
    }
    if (Notification.permission === 'denied') {
      setStatus('denied');
      return;
    }
    getCurrentSubscription()
      .then((sub) => setStatus(sub && Notification.permission === 'granted' ? 'enabled' : 'disabled'))
      .catch(() => setStatus('disabled'));
  }, []);

  const handleEnable = async () => {
    setBusy(true);
    setMessage(null);
    try {
      await enablePush();
      setStatus('enabled');
      setMessage({ type: 'success', text: 'Notifiche attivate su questo dispositivo.' });
    } catch (err) {
      if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
        setStatus('denied');
      }
      setMessage({ type: 'error', text: (err as Error).message || 'Attivazione non riuscita.' });
    } finally {
      setBusy(false);
    }
  };

  const handleDisable = async () => {
    setBusy(true);
    setMessage(null);
    try {
      await disablePush();
      setStatus('disabled');
      setMessage({ type: 'success', text: 'Notifiche disattivate su questo dispositivo.' });
    } catch {
      setMessage({ type: 'error', text: 'Impossibile disattivare le notifiche.' });
    } finally {
      setBusy(false);
    }
  };

  const handleTest = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch('/api/push/test', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: 'success', text: 'Notifica di prova inviata!' });
    } catch (err) {
      setMessage({ type: 'error', text: (err as Error).message || 'Invio non riuscito.' });
    } finally {
      setBusy(false);
    }
  };

  if (support === null) return null;

  return (
    <div className="p-4 rounded-2xl border border-indigo-500/25 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent space-y-3">
      <div className="flex items-start gap-3">
        <div
          className={`p-2 rounded-xl shrink-0 ${
            status === 'enabled' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-indigo-500/15 text-indigo-400'
          }`}
        >
          {status === 'enabled' ? <BellRing className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            Notifiche push su questo dispositivo
          </h4>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {status === 'enabled'
              ? 'Attive: riceverai avvisi anche ad app chiusa.'
              : 'Ricevi scadenze, orari superati e il riepilogo delle 9:00 anche ad app chiusa.'}
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`p-2.5 rounded-xl text-xs border ${
            message.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
          }`}
        >
          {message.text}
        </div>
      )}

      {support === 'ios-needs-install' && (
        <div className="p-3 rounded-xl glass-surface text-xs space-y-1.5" style={{ color: 'var(--text-secondary)' }}>
          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            Su iPhone/iPad installa prima Kairon:
          </p>
          <p className="flex items-center gap-1.5">
            1. Tocca <Share className="w-3.5 h-3.5 inline text-sky-400" /> <strong>Condividi</strong> in Safari
          </p>
          <p className="flex items-center gap-1.5">
            2. Scegli <PlusSquare className="w-3.5 h-3.5 inline text-sky-400" /> <strong>Aggiungi alla schermata Home</strong>
          </p>
          <p>3. Apri Kairon dall&apos;icona e attiva qui le notifiche (iOS 16.4+).</p>
        </div>
      )}

      {support === 'unsupported' && (
        <p className="text-xs text-amber-400">
          Questo browser non supporta le notifiche push. Usa Chrome su Android o installa l&apos;app su iOS.
        </p>
      )}

      {support === 'supported' && status === 'denied' && (
        <p className="text-xs text-amber-400">
          Le notifiche sono bloccate. Riabilitale dalle impostazioni del browser/dispositivo per Kairon, poi ricarica.
        </p>
      )}

      {support === 'supported' && status !== 'denied' && (
        <div className="flex gap-2">
          {status === 'enabled' ? (
            <>
              <button
                type="button"
                onClick={handleTest}
                disabled={busy}
                className="flex-1 py-2 rounded-xl text-xs font-semibold bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/30 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BellRing className="w-3.5 h-3.5" />}
                Invia prova
              </button>
              <button
                type="button"
                onClick={handleDisable}
                disabled={busy}
                className="py-2 px-3 rounded-xl text-xs font-semibold glass-surface hover:bg-rose-500/10 hover:text-rose-400 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                <BellOff className="w-3.5 h-3.5" />
                Disattiva
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleEnable}
              disabled={busy || status === 'loading'}
              className="flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/25 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
              Attiva notifiche push
            </button>
          )}
        </div>
      )}
    </div>
  );
}

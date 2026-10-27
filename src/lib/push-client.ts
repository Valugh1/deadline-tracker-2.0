'use client';

/** Client-side Web Push helpers (browser only). */

export type PushSupport =
  | 'supported'
  | 'unsupported'
  /** iOS Safari: push only works once the PWA is added to the Home Screen */
  | 'ios-needs-install';

export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    // iPadOS reports itself as Mac
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function getPushSupport(): PushSupport {
  if (typeof window === 'undefined') return 'unsupported';
  const hasApis = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  if (isIOS() && !isStandalone()) return 'ios-needs-install';
  return hasApis ? 'supported' : 'unsupported';
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; ++i) output[i] = raw.charCodeAt(i);
  return output;
}

export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration('/');
  if (existing) return existing;
  await navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' });
  return navigator.serviceWorker.ready;
}

async function saveSubscription(subscription: PushSubscription): Promise<void> {
  const res = await fetch('/api/push/subscription', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription: subscription.toJSON() }),
  });
  if (!res.ok) throw new Error('Impossibile salvare la sottoscrizione sul server.');
}

async function createSubscription(reg: ServiceWorkerRegistration): Promise<PushSubscription> {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) throw new Error('Chiave VAPID pubblica non configurata.');
  return reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });
}

export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (getPushSupport() !== 'supported') return null;
  const reg = await navigator.serviceWorker.getRegistration('/');
  return reg ? reg.pushManager.getSubscription() : null;
}

/** Must be called from a user gesture (required by iOS). */
export async function enablePush(): Promise<PushSubscription> {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error(
      permission === 'denied'
        ? 'Permesso negato. Abilita le notifiche per Kairon dalle impostazioni del dispositivo.'
        : 'Permesso non concesso.'
    );
  }
  const reg = await getServiceWorkerRegistration();
  const subscription = (await reg.pushManager.getSubscription()) ?? (await createSubscription(reg));
  await saveSubscription(subscription);
  return subscription;
}

export async function disablePush(): Promise<void> {
  const subscription = await getCurrentSubscription();
  if (!subscription) return;
  await fetch('/api/push/subscription', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  }).catch(() => undefined);
  await subscription.unsubscribe();
}

/**
 * Silent refresh on every app open: re-sends the subscription to the server (or recreates
 * it if the browser dropped it) so the device stays reachable after long inactivity.
 */
export async function syncPushSubscription(): Promise<void> {
  if (getPushSupport() !== 'supported' || Notification.permission !== 'granted') return;
  const reg = await getServiceWorkerRegistration();
  const subscription = (await reg.pushManager.getSubscription()) ?? (await createSubscription(reg));
  await saveSubscription(subscription);
}

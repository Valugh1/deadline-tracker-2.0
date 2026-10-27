'use client';

import { useEffect } from 'react';
import { syncPushSubscription } from '@/lib/push-client';

/**
 * Headless component mounted in the authenticated layout. Each time the app is opened
 * it refreshes the push subscription on the server, so devices remain reachable even
 * after long periods without using the app.
 */
export default function PushSync() {
  useEffect(() => {
    syncPushSubscription().catch((err) => {
      console.warn('[Kairon Push] Subscription sync failed:', err);
    });
  }, []);

  return null;
}

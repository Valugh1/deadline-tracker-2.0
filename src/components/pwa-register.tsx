'use client';

import { useEffect } from 'react';

export default function PwaRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('[Kairon PWA] Service Worker registered with scope:', reg.scope);
          })
          .catch((err) => {
            console.error('[Kairon PWA] Service Worker registration failed:', err);
          });
      });
    }
  }, []);

  return null;
}

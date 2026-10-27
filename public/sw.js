const CACHE_NAME = 'kairon-pwa-v1';
const STATIC_ASSETS = [
  '/',
  '/board',
  '/login',
  '/register',
  '/manifest.webmanifest',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip caching for auth routes and API calls
  if (url.pathname.startsWith('/api/')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// ────────────────────────── PUSH NOTIFICATIONS ──────────────────────────

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'Kairon';
  const options = {
    body: data.body || '',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    tag: data.tag || undefined,
    renotify: Boolean(data.tag),
    vibrate: [100, 50, 100],
    data: { url: data.url || '/board' },
  };

  // iOS/Safari require every push to show a visible notification
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || '/board', self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (new URL(client.url).origin === self.location.origin && 'focus' in client) {
          return client.focus().then((focused) =>
            focused && 'navigate' in focused ? focused.navigate(targetUrl) : focused
          );
        }
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});

// The browser may rotate the subscription (e.g. after long inactivity): re-subscribe
// and inform the server so notifications keep arriving without opening the app.
self.addEventListener('pushsubscriptionchange', (event) => {
  const oldEndpoint = event.oldSubscription ? event.oldSubscription.endpoint : undefined;
  const applicationServerKey = event.oldSubscription
    ? event.oldSubscription.options.applicationServerKey
    : undefined;

  event.waitUntil(
    (event.newSubscription
      ? Promise.resolve(event.newSubscription)
      : self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })
    ).then((subscription) =>
      fetch('/api/push/subscription', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: subscription.toJSON(), oldEndpoint }),
      })
    )
  );
});

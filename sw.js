// Release 447 — shared Web / Phone / Desktop service worker.
const CACHE_NAME = 'devilndove-shell-r447';
const CORE_ASSETS = [
  '/',
  '/offline.html',
  '/css/styles.css',
  '/js/main.js',
  '/public/js/pwa-platform.js',
  '/assets/logo-clear.png',
  '/assets/mark.png',
  '/assets/images/site/home-hero-products.webp',
  '/assets/icons/icon-180.png',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
  '/manifest.webmanifest',
  '/socials/',
  '/workshop-journal/'
];
const NO_CACHE_PATH_PREFIXES = ['/admin/', '/members/', '/login/', '/register/', '/account-help/', '/api/'];

function shouldBypassCache(url) {
  return NO_CACHE_PATH_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('push', (event) => {
  let payload = {};
  try { payload = event.data?.json?.() || {}; }
  catch {
    try { payload = { body: event.data?.text?.() || '' }; } catch { payload = {}; }
  }
  const title = String(payload.title || 'Devil n Dove');
  const options = {
    body: String(payload.body || 'There is something new at Devil n Dove.'),
    icon: String(payload.icon || '/assets/icons/icon-192.png'),
    badge: String(payload.badge || '/assets/icons/icon-180.png'),
    tag: String(payload.tag || 'dnd-update'),
    renotify: Boolean(payload.renotify),
    data: { url: String(payload.url || payload.data?.url || '/') },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  let target = '/';
  try {
    const candidate = new URL(String(event.notification.data?.url || '/'), self.location.origin);
    if (candidate.origin === self.location.origin) target = `${candidate.pathname}${candidate.search}${candidate.hash}`;
  } catch {}
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windows) {
      try {
        const current = new URL(client.url);
        if (current.origin === self.location.origin) {
          await client.focus();
          if ('navigate' in client) await client.navigate(target);
          return;
        }
      } catch {}
    }
    if (self.clients.openWindow) await self.clients.openWindow(target);
  })());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (shouldBypassCache(url)) {
    event.respondWith(
      fetch(event.request).catch(() => {
        if (url.pathname.startsWith('/api/')) {
          return new Response(JSON.stringify({ ok: false, error: 'offline' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
          });
        }
        return caches.match(event.request).then((cached) => cached || caches.match('/offline.html'));
      })
    );
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response?.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => null);
          }
          return response;
        })
        .catch(async () => (await caches.match(event.request)) || caches.match('/offline.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') return response;
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => null);
          return response;
        })
        .catch(() => caches.match('/offline.html'));
    })
  );
});

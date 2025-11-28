const CACHE_NAME = 'pnl-green-v1';
const OFFLINE_URL = '/offline.html';
const PRECACHE_URLS = [
  '/',
  OFFLINE_URL,
  '/favicon.ico',
  '/manifest.webmanifest',
  '/icons/icon-192x192.svg',
  '/icons/icon-256x256.svg',
  '/icons/icon-512x512.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
          return undefined;
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Cache-first for static assets
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    url.pathname.startsWith('/icons') ||
    url.pathname.startsWith('/_next/static')
  ) {
    event.respondWith(
      caches.match(request).then((cached) =>
        cached ||
        fetch(request)
          .then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return response;
          })
          .catch(() => caches.match(request))
      )
    );
    return;
  }

  // Network-first for navigation
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('/', clone));
          return response;
        })
        .catch(async () => {
          const cachedShell = await caches.match('/');
          if (cachedShell) return cachedShell;
          const offlinePage = await caches.match(OFFLINE_URL);
          if (offlinePage) return offlinePage;
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        })
    );
  }
});

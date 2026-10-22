const CACHE_NAME = 'local-ledger-pwa-v3';
const APP_BASE = new URL(self.registration.scope).pathname;
const APP_SHELL = [
  './',
  'manifest.webmanifest',
  'favicon.svg',
  'icons/icon-192.svg',
  'icons/icon-512.svg',
  'icons/icon-maskable.svg',
].map((path) => new URL(path, self.registration.scope).pathname);
const APP_ENTRY = new URL('./', self.registration.scope).pathname;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key.startsWith('local-ledger-pwa-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (
    request.method !== 'GET' ||
    url.origin !== self.location.origin ||
    !url.pathname.startsWith(APP_BASE)
  ) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);

    if (request.mode === 'navigate') {
      try {
        const response = await fetch(request);
        if (response.ok) await cache.put(APP_ENTRY, response.clone());
        return response;
      } catch {
        const fallback = await cache.match(APP_ENTRY);
        if (fallback) return fallback;
        throw new Error('Offline app shell is not cached yet.');
      }
    }

    const cached = await cache.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  })());
});

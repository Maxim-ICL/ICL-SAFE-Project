
const CACHE_NAME = 'icl-app-cache-v1';
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './offline.html',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(req).then(cached => {
        const fetchPromise = fetch(req).then(networkResp => {
          caches.open(CACHE_NAME).then(cache => cache.put(req, networkResp.clone()));
          return networkResp;
        }).catch(() => cached || caches.match('./offline.html'));
        return cached || fetchPromise;
      })
    );
    return;
  }

  event.respondWith(
    fetch(req).then(resp => {
      const copy = resp.clone();
      caches.open(CACHE_NAME).then(c => c.put(req, copy));
      return resp;
    }).catch(() => caches.match(req))
  );
});

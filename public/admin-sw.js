const CACHE_NAME = 'noteshub9-admin-cache-v1';
const urlsToCache = [
  '/noteshub9/admin.html',
  '/noteshub9/favicon.png',
  '/noteshub9/admin-manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached response if found, else fetch from network
        return response || fetch(event.request);
      })
  );
});

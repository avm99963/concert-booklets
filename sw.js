var CACHE_NAME = 'all-v1.1.11';
var urlsToCache = [
  '/',
  '/css/styles.css',
  '/img/logo.svg',
  '/img/logo-biblioteca.png',
  '/img/logo-ciba.png',
  '/img/cartells/cant2022.webp',
  '/js/script.js',
  '/concerts/nadal2020joves.json',
  '/concerts/nadal2020nens.json',
  '/concerts/ciba2021.json',
  '/concerts/cant2022.json',
];

self.addEventListener('install', event => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(keyList.map(key => {
        if (key !== CACHE_NAME)
          return caches.delete(key);
      }));
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return caches.match(event.request).then(response => {
        if (response) return response;
        return fetch(event.request);
      }).catch(() => {
        // Load a fallback version of the file if everything failed.
        return caches.match(event.request);
      });
    })
  );
});

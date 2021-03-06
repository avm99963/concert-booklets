var CACHE_NAME = 'all-v1.1.5';
var urlsToCache = [
  '/',
  '/css/styles.css',
  '/img/logo.svg',
  '/img/logo-ciba.png',
  '/js/script.js',
  '/concerts/nadal2020joves.json',
  '/concerts/nadal2020nens.json',
  '/concerts/ciba2021.json',
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
    caches.match(event.request).then(response => {
      if (response) return response;
      return fetch(event.request);
    })
  );
});

// Version: 1.1.1
var CACHE_NAME = 'all-v1';
var urlsToCache = [
  '/',
  '/css/styles.css',
  '/img/logo.svg',
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

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) return response;
      return fetch(event.request);
    })
  );
});

// DB AI Bot Service Worker — handles caching + version updates
var CACHE_NAME = 'db-ai-bot-v1.0.5';
var URLS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg'
];

// Install — cache app files
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(URLS);
    })
  );
  self.skipWaiting();
});

// Activate — delete old caches when new version is deployed
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(name) {
          return name !== CACHE_NAME;
        }).map(function(name) {
          return caches.delete(name);
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch — serve from cache, fallback to network, update cache
// Skip caching for API calls (Alpaca, etc.)
self.addEventListener('fetch', function(e) {
  if (e.request.url.indexOf('alpaca.markets') !== -1 ||
      e.request.url.indexOf('api.') !== -1) {
    e.respondWith(fetch(e.request));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      var fetched = fetch(e.request).then(function(response) {
        var copy = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, copy);
        });
        return response;
      }).catch(function() {
        return cached;
      });
      return cached || fetched;
    })
  );
});

// Listen for messages from app (e.g. skip waiting)
self.addEventListener('message', function(e) {
  if (e.data === 'skipWaiting') {
    self.skipWaiting();
  }
});

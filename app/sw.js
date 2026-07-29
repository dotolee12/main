var APP_CACHE = "giloa-app-shell-local-v27";
var TILE_CACHE = "giloa-map-tiles-v2";
var TILE_CACHE_MAX = 350;
var APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./config.js",
  "./style.css",
  "./script.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./vendor/leaflet.css",
  "./vendor/MarkerCluster.css",
  "./vendor/MarkerCluster.Default.css",
  "./vendor/leaflet.js",
  "./vendor/leaflet.markercluster.js",
  "./vendor/heic2any.min.js",
  "./vendor/tf.min.js",
  "./vendor/images/marker-icon.png",
  "./vendor/images/marker-icon-2x.png",
  "./vendor/images/marker-shadow.png"
];

self.addEventListener("install", function(event) {
  event.waitUntil(
    caches.open(APP_CACHE)
      .then(function(cache) { return cache.addAll(APP_SHELL); })
      .then(function() { return self.skipWaiting(); })
    // addAll 실패 시 install 자체를 실패시켜 기존(정상) SW를 유지한다.
    // 이전에는 실패를 삼키고 skipWaiting까지 진행해 불완전한 캐시로 활성화될 수 있었다.
  );
});

self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys()
      .then(function(keys) {
        return Promise.all(keys
          .filter(function(key) {
            return (key.indexOf("giloa-app-shell-") === 0 && key !== APP_CACHE) ||
              (key.indexOf("giloa-map-tiles-") === 0 && key !== TILE_CACHE);
          })
          .map(function(key) { return caches.delete(key); }));
      })
      .then(function() { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(event) {
  var url = new URL(event.request.url);
  var isTile =
    /basemaps\.cartocdn\.com$/.test(url.hostname) ||
    /tile\.openstreetmap\.org$/.test(url.hostname) ||
    /tile\.openstreetmap\.fr$/.test(url.hostname) ||
    /server\.arcgisonline\.com$/.test(url.hostname);

  if (isTile) {
    event.respondWith(
      caches.open(TILE_CACHE).then(function(cache) {
        return cache.match(event.request).then(function(cached) {
          return fetch(event.request).then(function(response) {
            if (response && response.ok) {
              cache.put(event.request, response.clone()).then(function() {
                cache.keys().then(function(keys) {
                  if (keys.length > TILE_CACHE_MAX) {
                    return Promise.all(keys.slice(0, keys.length - TILE_CACHE_MAX).map(function(key) { return cache.delete(key); }));
                  }
                });
              });
            }
            return response;
          }).catch(function() { return cached || Response.error(); });
        });
      })
    );
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request, { ignoreSearch: true }).then(function(cached) {
        return cached || fetch(event.request).then(function(response) {
          var copy = response.clone();
          caches.open(APP_CACHE).then(function(cache) { cache.put(event.request, copy); });
          return response;
        }).catch(function() { return cached; });
      })
    );
  }
});

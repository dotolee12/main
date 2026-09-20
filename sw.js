var APP_CACHE = "giloa-app-shell-v233";
var RUNTIME_CACHE = "giloa-runtime-v76";
var TILE_CACHE = "giloa-map-tiles-v5";
var TILE_CACHE_MAX = 300;
var RUNTIME_CACHE_MAX = 180;
// CORE_ASSETS는 "첫 화면을 그리는 데 반드시 필요한" 최소 셸만 담는다.
// 튜토리얼/스토리/지역 마스코트 이미지와 대용량 데이터(json/geojson)는 실제로
// 그 기능이 쓰일 때 RUNTIME_CACHE에 자동으로 채워지므로(아래 fetch 핸들러 참고)
// 설치 단계에서 미리 내려받을 필요가 없다. 이전에는 ~90개 파일을 설치 시점에
// 순차로 요청해 첫 실행/업데이트 시 체감 버퍼링이 커졌었다.
var CORE_ASSETS = [
  "./index.html", "./manifest.json", "./style.css", "./time-trace.css", "./tutorial.css", "./map-bootstrap.js",
  "./region-stay-core.js", "./script.js", "./time-trace.js", "./hidden-missions.obfuscated.js", "./tutorial.js", "./config.js",
  // HUD 아바타에 항상 즉시 표시되는 유일한 이미지이므로 core로 유지한다.
  "./gilo many appearance/gilo-tutorial-welcome-transparent.png",
  "./vendor/leaflet.css", "./vendor/MarkerCluster.css", "./vendor/MarkerCluster.Default.css",
  "./vendor/leaflet.js", "./vendor/leaflet.markercluster.js", "./vendor/heic2any.min.js", "./vendor/exifr.full.umd.js"
];

function trimCache(cacheName, maximum) {
  return caches.open(cacheName).then(function(cache) {
    return cache.keys().then(function(keys) {
      if (keys.length <= maximum) return;
      return Promise.all(keys.slice(0, keys.length - maximum).map(function(key) { return cache.delete(key); }));
    });
  });
}

function cacheCoreAssets(cache) {
  // Install sequentially so a weak connection is not saturated. Every asset
  // here is required: failure must reject install and preserve the active worker.
  return CORE_ASSETS.reduce(function(chain, asset) {
    return chain.then(function() {
      return cache.add(new Request(asset, { cache: "reload" }));
    });
  }, Promise.resolve());
}

function fetchWithTimeout(request, timeoutMs) {
  return new Promise(function(resolve, reject) {
    var settled = false;
    var timer = setTimeout(function() {
      if (settled) return;
      settled = true;
      reject(new Error("Network timeout"));
    }, timeoutMs);
    fetch(request).then(function(response) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(response);
    }).catch(function(error) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(error);
    });
  });
}

function requireSuccessfulResponse(response) {
  if (!response || !response.ok) throw new Error("Network response was not successful");
  return response;
}

function cachedResponseOrError(cached) {
  return cached || Response.error();
}

self.addEventListener("install", function(event) {
  event.waitUntil(caches.open(APP_CACHE).then(cacheCoreAssets).then(function() { return self.skipWaiting(); }));
});

self.addEventListener("activate", function(event) {
  // 선택 이미지와 대용량 데이터는 아래 fetch 핸들러가 실제 요청 시 캐시한다.
  // 활성화에는 네트워크 다운로드를 포함하지 않는다.
  event.waitUntil(caches.keys().then(function(keys) {
    return Promise.all(keys.filter(function(key) {
      return /^giloa-(app-shell|runtime|map-tiles)-/.test(key) && key !== APP_CACHE && key !== RUNTIME_CACHE && key !== TILE_CACHE;
    }).map(function(key) { return caches.delete(key); }));
  }).then(function() { return self.clients.claim(); }));
});

self.addEventListener("fetch", function(event) {
  if (event.request.method !== "GET") return;
  var url = new URL(event.request.url);
  var isTile = /(^|\.)cartocdn\.com$/.test(url.hostname) || /(^|\.)openstreetmap\.(org|fr)$/.test(url.hostname) || /(^|\.)arcgisonline\.com$/.test(url.hostname);

  if (isTile) {
    event.respondWith(caches.open(TILE_CACHE).then(function(cache) {
      return cache.match(event.request).then(function(cached) {
        var network = fetch(event.request).then(function(response) {
          // 타일은 교차 출처(no-cors) 요청이라 성공해도 response.type이 "opaque"이며,
          // opaque 응답은 스펙상 항상 response.ok === false 이다. 그래서 !response.ok만
          // 검사하면 정상적으로 받은 타일도 실패로 오판해 매번 캐시/에러로 빠지고,
          // 결국 모든 provider가 소진되어 "Map network unavailable"이 뜨는 버그가 있었다.
          // opaque면 fetch 자체가 reject되지 않은 것만으로 성공으로 간주한다.
          if (!response || (response.type !== "opaque" && !response.ok)) return cachedResponseOrError(cached);
          event.waitUntil(cache.put(event.request, response.clone()).then(function() { return trimCache(TILE_CACHE, TILE_CACHE_MAX); }));
          return response;
        }).catch(function() { return cachedResponseOrError(cached); });
        return cached || network;
      });
    }));
    return;
  }

  if (url.origin !== self.location.origin) return;
  if (event.request.mode === "navigate") {
    event.respondWith(caches.open(APP_CACHE).then(function(cache) {
      return fetchWithTimeout(event.request, 3500).then(function(response) {
        requireSuccessfulResponse(response);
        event.waitUntil(cache.put("./index.html", response.clone()));
        return response;
      }).catch(function() {
        return cache.match("./index.html", { ignoreSearch: true }).then(cachedResponseOrError);
      });
    }));
    return;
  }

  if (/\.(?:js|css)$/.test(url.pathname)) {
    event.respondWith(caches.open(APP_CACHE).then(function(cache) {
      return fetchWithTimeout(event.request, 3500).then(function(response) {
        requireSuccessfulResponse(response);
        event.waitUntil(cache.put(event.request, response.clone()));
        return response;
      }).catch(function() {
        return cache.match(event.request, { ignoreSearch: true }).then(cachedResponseOrError);
      });
    }));
    return;
  }

  event.respondWith(caches.open(APP_CACHE).then(function(appCache) {
    return appCache.match(event.request, { ignoreSearch: true }).then(function(appCached) {
      if (appCached) return appCached;
      return caches.open(RUNTIME_CACHE).then(function(runtimeCache) {
        return runtimeCache.match(event.request, { ignoreSearch: true }).then(function(cached) {
          var network = fetch(event.request).then(function(response) {
            if (response && response.ok) event.waitUntil(runtimeCache.put(event.request, response.clone()).then(function() { return trimCache(RUNTIME_CACHE, RUNTIME_CACHE_MAX); }));
            return response;
          }).catch(function() { return cachedResponseOrError(cached); });
          return cached || network;
        });
      });
    });
  }));
});

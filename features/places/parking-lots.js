function loadParkingBundle() {
    if (window.GILOA_PARKING_BUNDLE) return Promise.resolve(window.GILOA_PARKING_BUNDLE);
    if (parkingBundlePromise) return parkingBundlePromise;
    parkingBundlePromise = new Promise(function(resolve, reject) {
        var script = document.createElement("script");
        var timer = setTimeout(function() { finish(new Error("Parking bundle timeout")); }, 15000);
        var finished = false;
        function finish(error) {
            if (finished) return;
            finished = true;
            clearTimeout(timer);
            script.onload = script.onerror = null;
            script.remove();
            if (error) reject(error);
            else resolve(window.GILOA_PARKING_BUNDLE);
        }
        script.src = "./data/parking/bundle.js?v=1";
        script.onload = function() {
            var data = window.GILOA_PARKING_BUNDLE;
            finish(data && data.manifest && data.tiles ? null : new Error("Invalid parking bundle"));
        };
        script.onerror = function() { finish(new Error("Parking bundle load failed")); };
        document.head.appendChild(script);
    }).finally(function() { parkingBundlePromise = null; });
    return parkingBundlePromise;
}
function readParkingData(id) {
    function fromBundle() {
        return loadParkingBundle().then(function(bundle) {
            var data = id ? bundle.tiles[id] : bundle.manifest;
            if (!data) throw new Error("Parking bundle tile missing: " + id);
            return data;
        });
    }
    if (location.protocol === "file:" || window.GILOA_PARKING_BUNDLE) return fromBundle();
    var url = id ? "./data/parking/" + id + ".json" : PARKING_DATA_INDEX_URL;
    return fetch(url, { cache:"no-cache" }).then(function(response) {
        if (!response.ok) throw new Error("Parking data HTTP " + response.status);
        return response.json();
    }).then(function(data) {
        if (id ? !Array.isArray(data) : !Array.isArray(data && data.tiles)) throw new Error("Invalid parking data");
        return data;
    }).catch(function() { return fromBundle(); });
}
function getParkingText() {
    var all = {
        ko:{ label:"주차장", spaces:"주차면", fee:"요금", hours:"평일 운영", free:"무료", paid:"유료", minute:"분", won:"원" },
        en:{ label:"Parking", spaces:"Spaces", fee:"Fee", hours:"Weekday hours", free:"Free", paid:"Paid", minute:"min", won:"KRW" },
        ja:{ label:"駐車場", spaces:"駐車台数", fee:"料金", hours:"平日営業時間", free:"無料", paid:"有料", minute:"分", won:"ウォン" },
        zh:{ label:"停车场", spaces:"车位", fee:"费用", hours:"工作日营业", free:"免费", paid:"收费", minute:"分钟", won:"韩元" },
        es:{ label:"Aparcamiento", spaces:"Plazas", fee:"Tarifa", hours:"Horario laborable", free:"Gratis", paid:"De pago", minute:"min", won:"KRW" },
        fr:{ label:"Parking", spaces:"Places", fee:"Tarif", hours:"Horaires en semaine", free:"Gratuit", paid:"Payant", minute:"min", won:"KRW" }
    };
    return all[normalizeLang(currentLang)] || all.ko;
}
function clearParkingMarkers() {
    parkingMarkers = [];
    parkingLayerGroup.clearLayers();
}
function loadParkingManifest() {
    if (parkingManifest) return Promise.resolve(parkingManifest);
    if (parkingManifestPromise) return parkingManifestPromise;
    parkingManifestPromise = readParkingData().then(function(data) {
        var tiles = Array.isArray(data && data.tiles) ? data.tiles : [];
        parkingManifest = { scale:Number(data && data.scale) || 4, ids:new Set(tiles.map(function(tile) { return String(tile.id); })) };
        return parkingManifest;
    }).finally(function() { parkingManifestPromise = null; });
    return parkingManifestPromise;
}
function getParkingViewportTileIds(manifest) {
    if (!map || !map.getBounds || !manifest) return [];
    var bounds = map.getBounds().pad(0.12); var scale = manifest.scale; var center = map.getCenter(); var ids = [];
    var minLat = Math.floor(bounds.getSouth() * scale), maxLat = Math.floor(bounds.getNorth() * scale);
    var minLng = Math.floor(bounds.getWest() * scale), maxLng = Math.floor(bounds.getEast() * scale);
    for (var latKey = minLat; latKey <= maxLat; latKey += 1) {
        for (var lngKey = minLng; lngKey <= maxLng; lngKey += 1) {
            var id = latKey + "_" + lngKey;
            if (manifest.ids.has(id)) ids.push({ id:id, distance:center.distanceTo([(latKey + 0.5) / scale, (lngKey + 0.5) / scale]) });
        }
    }
    return ids.sort(function(a, b) { return a.distance - b.distance; }).slice(0, PARKING_TILE_REQUEST_LIMIT).map(function(tile) { return tile.id; });
}
function loadParkingTile(id) {
    if (parkingTileCache[id]) return Promise.resolve(parkingTileCache[id]);
    return readParkingData(id).then(function(items) { parkingTileCache[id] = Array.isArray(items) ? items : []; return parkingTileCache[id]; });
}
function showParkingPopup(item) {
    var text = getParkingText(); var address = item.a || ""; var details = [];
    if (item.s) details.push(text.spaces + " " + item.s);
    if (item.f) details.push(text.fee + " " + (item.f === "무료" ? text.free : item.f === "유료" ? text.paid : item.f));
    if (item.m && isFinite(item.p)) details.push(item.m + text.minute + " " + item.p.toLocaleString() + text.won);
    if (item.o || item.c) details.push(text.hours + " " + [item.o, item.c].filter(Boolean).join("–"));
    var tel = item.t ? "<br><a href='tel:" + escapeHtml(item.t) + "' style='color:#4ade80;font-size:12px;'>" + escapeHtml(item.t) + "</a>" : "";
    setSelectedDestination(item.y, item.x, item.n || text.label);
    var likeKey = getMapPlaceLikeKey("parking", [item.i || item.n, item.y, item.x]);
    var popup = L.popup({ className:"tour-popup" }).setLatLng([item.y, item.x]).setContent("<b>" + escapeHtml(item.n || text.label) + "</b><br><span class='tour-popup-tag' style='color:" + PARKING_COLOR + ";border-color:" + PARKING_COLOR + ";background:rgba(167,139,250,.18);'>" + escapeHtml(text.label) + "</span>" + (address ? "<br><small>" + escapeHtml(address) + "</small>" : "") + (details.length ? "<br><small>" + escapeHtml(details.join(" · ")) + "</small>" : "") + tel + buildMapPlaceLikeButton(likeKey)).openOn(map);
    trackPublicPlacePopup(popup, function() { showParkingPopup(item); });
}
function renderParkingMarkers(tileIds) {
    clearParkingMarkers();
    if (!mapLayerSettings.parking) return;
    var text = getParkingText(); var center = getMapSearchCenter(); var seen = new Set(); var items = [];
    (tileIds || []).forEach(function(id) { (parkingTileCache[id] || []).forEach(function(item) {
        var key = item.i || (item.y + "|" + item.x + "|" + item.n);
        if (seen.has(key) || !isWithinMapSearchCenter(Number(item.y), Number(item.x), getMapSearchRadius())) return;
        seen.add(key); item._distance = center.distanceTo([item.y, item.x]); items.push(item);
    }); });
    items.sort(function(a, b) { return a._distance - b._distance; }).slice(0, MAP_VIEWPORT_MARKER_LIMIT).forEach(function(item) {
        var likeKey = getMapPlaceLikeKey("parking", [item.i || item.n, item.y, item.x]);
        var icon = L.divIcon({ className:"library-map-marker-wrap parking-map-marker-wrap", html: mapPlaceSymbolHtml("parking", likedTourKeys.has(likeKey) ? "state-liked" : "", likeKey), iconSize:[28,28], iconAnchor:[14,14] });
        var marker = L.marker([item.y, item.x], { pane:"parkingPane", icon:icon, title:text.label + " - " + (item.n || "") }).addTo(parkingLayerGroup);
        marker.on("click", function() { showParkingPopup(item); }); parkingMarkers.push(marker);
    });
}
function fetchParkingFromKakao() {
    if (!mapLayerSettings.parking || navigator.onLine === false) return Promise.resolve([]);
    var center = getMapSearchCenter();
    var radius = Math.min(20000, getMapSearchRadius());
    return loadKakaoTrafficSdk().then(function() {
        if (!window.kakao.maps.services || !window.kakao.maps.services.Places) return [];
        return new Promise(function(resolve) {
            var results = [];
            var settled = false;
            var timer = setTimeout(function() { finish(); }, 7000);
            function finish() {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                resolve(results);
            }
            try {
                var places = new window.kakao.maps.services.Places();
                places.categorySearch("PK6", function(items, status, pagination) {
                    if (settled || !mapLayerSettings.parking) { finish(); return; }
                    if (status !== window.kakao.maps.services.Status.OK) { finish(); return; }
                    (items || []).forEach(function(place) {
                        results.push({
                            i:"kakao|" + place.id, n:place.place_name || "", a:place.road_address_name || place.address_name || "",
                            y:Number(place.y), x:Number(place.x), s:"", f:"", m:"", p:0, o:"", c:"", t:place.phone || ""
                        });
                    });
                    if (pagination && pagination.hasNextPage && results.length < 45) pagination.nextPage();
                    else finish();
                }, {
                    location:new window.kakao.maps.LatLng(center.lat, center.lng),
                    radius:radius,
                    size:15,
                    sort:window.kakao.maps.services.SortBy.DISTANCE
                });
            } catch (_) { finish(); }
        });
    }).catch(function(error) { console.warn("Kakao parking fallback failed", error && error.message); return []; });
}
function refreshParkingForMap() {
    if (!mapLayerSettings.parking) return Promise.resolve(false);
    var requestSeq = ++parkingRequestSeq;
    return loadParkingManifest().then(function(manifest) {
        var tileIds = getParkingViewportTileIds(manifest);
        return Promise.all(tileIds.map(function(id) { return loadParkingTile(id).catch(function(error) { console.warn("Parking tile load failed", id, error && error.message); return []; }); })).then(function() {
            if (requestSeq !== parkingRequestSeq || !mapLayerSettings.parking) return false;
            renderParkingMarkers(tileIds);
            if (parkingMarkers.length > 0) return true;
            return fetchParkingFromKakao().then(function(items) {
                if (requestSeq !== parkingRequestSeq || !mapLayerSettings.parking) return false;
                parkingTileCache.__kakao__ = items;
                renderParkingMarkers(["__kakao__"]);
                return items.length > 0;
            });
        });
    }).catch(function(error) {
        console.warn("Parking local data load failed; using Kakao fallback", error && error.message);
        return fetchParkingFromKakao().then(function(items) {
            if (requestSeq !== parkingRequestSeq || !mapLayerSettings.parking) return false;
            parkingTileCache.__kakao__ = items;
            renderParkingMarkers(["__kakao__"]);
            return items.length > 0;
        });
    });
}

// Ministry of the Interior and Safety nationwide fishing-spot layer.
// API records are cached in memory; only the current viewport is rendered.
var FISHING_API_ENDPOINT = "https://apis.data.go.kr/1741000/fishing_spot_info";
var FISHING_API_KEY = window.GILOA_FISHING_API_KEY || "";
var FISHING_COLOR = "#38bdf8";
var FISHING_PAGE_SIZE = 100;
var FISHING_MAX_PAGES = 12;
var fishingItems = null;
var fishingLoadPromise = null;
var fishingMarkers = [];
var fishingLayerGroup = L.layerGroup().addTo(map);
var fishingRequestSeq = 0;
var fishingMissingKeyWarned = false;

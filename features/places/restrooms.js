function loadRestroomGeoCache() {
    try { restroomGeoCache = JSON.parse(localStorage.getItem(RESTROOM_GEOCODE_CACHE_KEY) || "{}"); }
    catch (e) { restroomGeoCache = {}; }
}
function saveRestroomGeoCache() {
    try { localStorage.setItem(RESTROOM_GEOCODE_CACHE_KEY, JSON.stringify(restroomGeoCache)); }
    catch (e) { /* ???怨듦컙 遺議??깆? 臾댁떆 - ?ㅼ쓬 ?몄뀡???ㅼ떆 吏?ㅼ퐫?⑸맖 */ }
}
function extractGuFromAddress(addr) {
    if (!addr) return "";
    var clean = addr.replace(/^서울특별시\s*/, "").replace(/^서울\s*/, "");
    var tokens = clean.split(/\s+/);
    for (var i = 0; i < tokens.length; i++) {
        if (/^[가-힣]{2,5}구$/.test(tokens[i])) return tokens[i];
    }
    return "";
}
function cleanRestroomText(value) {
    var text = String(value || "").replace(/\|/g, " · ").replace(/\s*·\s*$/g, "").trim();
    return typeof isBrokenDisplayText === "function" && isBrokenDisplayText(text) ? "" : text;
}
function isValidRestroomCoordinate(lat, lng) {
    return isFinite(lat) && isFinite(lng) && lat >= 33 && lat <= 39 && lng >= 124 && lng <= 132;
}
function normalizeRestroomItem(row, source) {
    row = row || {};
    var lat = parseFloat(row.lat !== undefined ? row.lat : (row.COORD_Y !== undefined ? row.COORD_Y : row.y));
    var lng = parseFloat(row.lng !== undefined ? row.lng : (row.COORD_X !== undefined ? row.COORD_X : row.x));
    if (!isValidRestroomCoordinate(lat, lng)) return null;
    var id = row.id || row.OBJECTID || row._giloaKey || "";
    var name = cleanRestroomText(row.name || row.CONTS_NAME || row.place_name || getRestroomLabel());
    var addr = cleanRestroomText(row.addr || row.ADDR_NEW || row.ADDR_OLD || row.road_address_name || row.address_name || "");
    return {
        _giloaKey: String(source || row.source || "restroom") + "|" + String(id || (lat.toFixed(6) + "|" + lng.toFixed(6))),
        id: String(id || ""),
        name: name || getRestroomLabel(),
        addr: addr,
        tel: cleanRestroomText(row.tel || row.TEL_NO || row.phone || ""),
        hours: cleanRestroomText(row.hours || row.VALUE_02 || row.opening_hours || ""),
        openType: cleanRestroomText(row.openType || row.VALUE_01 || row.access || ""),
        lat: lat,
        lng: lng,
        source: source || row.source || "restroom"
    };
}
function dedupeRestroomItems(items) {
    var seen = {};
    return (items || []).map(function(item) { return normalizeRestroomItem(item, item && item.source); }).filter(function(item) {
        if (!item) return false;
        var key = item.lat.toFixed(5) + "|" + item.lng.toFixed(5) + "|" + item.name.toLowerCase();
        if (seen[key]) return false;
        seen[key] = true;
        return true;
    });
}
function getRestroomDistance(center, item) {
    return L.latLng(center.lat, center.lng).distanceTo(L.latLng(item.lat, item.lng));
}
function filterRestroomItemsForArea(items, center, radius) {
    var safeRadius = Math.max(300, Math.min(10000, Number(radius) || MAP_LAYER_RADIUS_M));
    return dedupeRestroomItems(items).map(function(item) {
        item._distance = getRestroomDistance(center, item);
        return item;
    }).filter(function(item) { return item._distance <= safeRadius; }).sort(function(a, b) { return a._distance - b._distance; }).slice(0, RESTROOM_MAX_MARKERS);
}
function isLikelySeoulArea(center) {
    return !!center && center.lat >= 37.40 && center.lat <= 37.72 && center.lng >= 126.73 && center.lng <= 127.23;
}
function getRestroomAreaCacheKey(center, radius) {
    return RESTROOM_AREA_CACHE_PREFIX + center.lat.toFixed(3) + ":" + center.lng.toFixed(3) + ":" + Math.round((Number(radius) || MAP_LAYER_RADIUS_M) / 300);
}
function readRestroomAreaCache(center, radius) {
    try {
        var saved = JSON.parse(localStorage.getItem(getRestroomAreaCacheKey(center, radius)) || "null");
        var age = saved ? Date.now() - Number(saved.savedAt || 0) : Infinity;
        if (!saved || age > RESTROOM_CACHE_STALE_MS || !Array.isArray(saved.items)) return null;
        return { items: filterRestroomItemsForArea(saved.items, center, radius), fresh: age <= RESTROOM_CACHE_FRESH_MS, savedAt: saved.savedAt };
    } catch (_) { return null; }
}
function trimRestroomAreaCaches() {
    try {
        var entries = [];
        for (var i = 0; i < localStorage.length; i++) {
            var key = localStorage.key(i);
            if (!key || key.indexOf(RESTROOM_AREA_CACHE_PREFIX) !== 0) continue;
            var saved = JSON.parse(localStorage.getItem(key) || "null");
            entries.push({ key: key, savedAt: Number(saved && saved.savedAt) || 0 });
        }
        entries.sort(function(a, b) { return b.savedAt - a.savedAt; });
        entries.slice(RESTROOM_MAX_AREA_CACHES).forEach(function(entry) { localStorage.removeItem(entry.key); });
    } catch (_) {}
}
function writeRestroomAreaCache(center, radius, items) {
    if (!items || !items.length) return;
    try {
        localStorage.setItem(getRestroomAreaCacheKey(center, radius), JSON.stringify({ savedAt: Date.now(), items: items.slice(0, RESTROOM_MAX_MARKERS) }));
        trimRestroomAreaCaches();
    } catch (_) { /* A full cache must never stop the map. */ }
}
function readSeoulRestroomCache() {
    try {
        var saved = JSON.parse(localStorage.getItem(RESTROOM_SEOUL_CACHE_KEY) || "null");
        if (!saved || !Array.isArray(saved.items) || Date.now() - Number(saved.savedAt || 0) > RESTROOM_CACHE_STALE_MS) return null;
        return { items: dedupeRestroomItems(saved.items), savedAt: Number(saved.savedAt) || 0 };
    } catch (_) { return null; }
}
function writeSeoulRestroomCache(items) {
    if (!items || items.length < 1000) return;
    try { localStorage.setItem(RESTROOM_SEOUL_CACHE_KEY, JSON.stringify({ savedAt: Date.now(), items: items })); }
    catch (_) { /* The bundled snapshot remains available when storage is full. */ }
}
function canUseSeoulRestroomApi() {
    if (!SEOUL_RESTROOM_API_KEY || navigator.onLine === false) return false;
    // Seoul Open Data currently exposes this dataset over HTTP. Browsers on an
    // HTTPS page must use the bundled snapshot/OSM instead of mixed content.
    var nativeAsset = location.protocol === "file:" || !!window.GiloaPhotoBridge;
    return location.protocol !== "https:" || nativeAsset;
}
function getSeoulRestroomPage(start, end, signal) {
    var url = SEOUL_RESTROOM_API_BASE + "/" + encodeURIComponent(SEOUL_RESTROOM_API_KEY) + "/json/" + SEOUL_RESTROOM_API_SERVICE + "/" + start + "/" + end + "/";
    return requestJsonWithRetry(url, {
        timeoutMs: RESTROOM_PROVIDER_TIMEOUT_MS,
        retries: 1,
        retryDelayMs: 500,
        signal: signal
    }).then(function(data) {
        var body = data && data[SEOUL_RESTROOM_API_SERVICE];
        var result = body && body.RESULT;
        if (!body || !Array.isArray(body.row)) {
            var error = new Error("Invalid Seoul restroom response");
            error.status = result && result.CODE === "INFO-200" ? 404 : 502;
            throw error;
        }
        return {
            total: Math.max(0, Number(body.list_total_count) || body.row.length),
            rows: body.row
        };
    });
}
function fetchSeoulRestroomData(options) {
    options = options || {};
    var cached = readSeoulRestroomCache();
    if (cached && !options.force && Date.now() - cached.savedAt <= RESTROOM_SEOUL_REFRESH_MS) return Promise.resolve(cached.items);
    if (!canUseSeoulRestroomApi()) return Promise.resolve(cached ? cached.items : restroomRawItems);
    if (!options.force && Date.now() - restroomSeoulLastAttemptAt < 5 * 60 * 1000) return Promise.resolve(cached ? cached.items : restroomRawItems);
    if (restroomSeoulRefreshPromise) return restroomSeoulRefreshPromise;

    restroomSeoulLastAttemptAt = Date.now();
    var signal = options.signal || null;
    var refreshPromise = getSeoulRestroomPage(1, SEOUL_RESTROOM_PAGE_SIZE, signal).then(function(firstPage) {
        var rows = firstPage.rows.slice();
        var total = firstPage.total;
        function nextPage(start) {
            if (start > total) return Promise.resolve(rows);
            return getSeoulRestroomPage(start, Math.min(total, start + SEOUL_RESTROOM_PAGE_SIZE - 1), signal).then(function(page) {
                rows = rows.concat(page.rows);
                return nextPage(start + SEOUL_RESTROOM_PAGE_SIZE);
            });
        }
        return nextPage(SEOUL_RESTROOM_PAGE_SIZE + 1);
    }).then(function(rows) {
        var items = dedupeRestroomItems(rows.map(function(row) { return normalizeRestroomItem(row, "seoul"); }).filter(Boolean));
        // Never replace a complete bundled/last-good dataset with a partial page.
        if (items.length < 1000) throw new Error("Incomplete Seoul restroom response");
        restroomRawItems = items;
        restroomRawLoaded = true;
        writeSeoulRestroomCache(items);
        return items;
    }).catch(function() {
        var fallback = readSeoulRestroomCache();
        return fallback ? fallback.items : restroomRawItems;
    }).finally(function() {
        if (restroomSeoulRefreshPromise === refreshPromise) restroomSeoulRefreshPromise = null;
    });
    restroomSeoulRefreshPromise = refreshPromise;
    return refreshPromise;
}
function fetchRestroomRawData() {
    if (restroomRawLoaded) return Promise.resolve(restroomRawItems);
    return requestJsonOnce(RESTROOM_DATA_URL, { timeoutMs: 5000, cache: "default" }).then(function(data) {
        restroomRawItems = dedupeRestroomItems(Array.isArray(data) ? data : []);
        restroomRawLoaded = true;
        return restroomRawItems;
    }).catch(function() {
        var cached = readSeoulRestroomCache();
        restroomRawItems = cached ? cached.items : [];
        restroomRawLoaded = restroomRawItems.length > 0;
        return restroomRawItems;
    });
}
function clearRestroomMarkers() {
    restroomMarkers.forEach(function(marker) {
        if (restroomMarkerLayer.hasLayer(marker)) restroomMarkerLayer.removeLayer(marker);
        else if (map.hasLayer(marker)) map.removeLayer(marker);
    });
    restroomMarkers = [];
    restroomMarkerLayer.clearLayers();
    var pane = map.getPane("restroomPane");
    if (pane) pane.querySelectorAll(".leaflet-marker-icon, .leaflet-marker-shadow").forEach(function(el) { el.remove(); });
}
function rememberRestroomItem(item) {
    var key = item._giloaKey || (String(item.addr || item.name || "") + "|" + item.lat + "|" + item.lng);
    var existing = restroomVisibleItems.findIndex(function(saved) {
        return saved._giloaKey === key;
    });
    item._giloaKey = key;
    if (existing >= 0) restroomVisibleItems[existing] = item;
    else restroomVisibleItems.push(item);
}
function createRestroomMarker(item) {
    if (!isValidRestroomCoordinate(Number(item.lat), Number(item.lng))) return;
    var label = getRestroomLabel();
    var likeKey = getMapPlaceLikeKey("restroom", [item._giloaKey || item.name || item.addr, item.lat, item.lng]);
    var icon = L.divIcon({
        className: "library-map-marker-wrap restroom-map-marker-wrap",
        html: mapPlaceSymbolHtml("restroom", likedTourKeys.has(likeKey) ? "state-liked" : "", likeKey), iconSize:[28,28], iconAnchor:[14,14]
    });
    var marker = L.marker([item.lat, item.lng], { pane: "restroomPane", icon: icon, title: label + " - " + (item.name || "") }).addTo(restroomMarkerLayer);
    marker.on("click", function() { showRestroomPopup(item); });
    restroomMarkers.push(marker);
}
function addRestroomMarker(item) {
    if (!isFinite(item.lat) || !isFinite(item.lng)) return;
    rememberRestroomItem(item);
    createRestroomMarker(item);
}
function renderRestroomMarkers() {
    clearRestroomMarkers();
    if (!mapLayerSettings.restroom) return;
    var center = getMapSearchCenter();
    var visible = filterRestroomItemsForArea(restroomVisibleItems, center, getMapSearchRadius()).filter(function(item) {
        return isWithinMapSearchCenter(Number(item.lat), Number(item.lng), getMapSearchRadius());
    });
    visible.slice(0, RESTROOM_MAX_MARKERS).forEach(createRestroomMarker);
}
function showRestroomPopup(item) {
    var label = getRestroomLabel();
    setSelectedDestination(item.lat, item.lng, item.name || label);
    var tag = "<span class='tour-popup-tag' style='color:" + RESTROOM_MARKER_COLOR + ";border-color:" + RESTROOM_MARKER_COLOR + ";background:rgba(163,230,53,0.18);'>" + escapeHtml(label) + "</span>";
    var tel = item.tel ? "<br><a href='tel:" + item.tel + "' style='color:#4ade80;font-size:12px;'>" + escapeHtml(getTourUiText().phone) + " " + escapeHtml(item.tel) + "</a>" : "";
    var openTypes = {"고객 이용":getTourUiText().customers,"유료":getTourUiText().paid,"공중화장실":getTourUiText().publicRestroom};
    var extra = [openTypes[item.openType] || item.openType, item.hours].filter(Boolean).join(" - ");
    var likeKey = getMapPlaceLikeKey("restroom", [item._giloaKey || item.name || item.addr, item.lat, item.lng]);
    var popup = L.popup({ className: "tour-popup" }).setLatLng([item.lat, item.lng]).setContent("<b>" + escapeHtml(item.name || label) + "</b><br>" + tag + "<br><small>" + escapeHtml(item.addr || "") + "</small>" + (extra ? "<br><small>" + escapeHtml(extra) + "</small>" : "") + tel + buildMapPlaceLikeButton(likeKey)).openOn(map);
    trackPublicPlacePopup(popup, function() { showRestroomPopup(item); });
}
// 二쇱냼 ?섎굹瑜?移댁뭅??吏?ㅼ퐫?붾줈 醫뚰몴 蹂??(Promise ?섑븨)
function geocodeAddress(addr) {
    return loadKakaoTrafficSdk().then(function() {
        return new Promise(function(resolve) {
            if (!window.kakao.maps.services) { resolve(null); return; }
            var geocoder = new window.kakao.maps.services.Geocoder();
            geocoder.addressSearch(addr, function(result, status) {
                if (status === window.kakao.maps.services.Status.OK && result && result[0]) {
                    resolve({ lat: parseFloat(result[0].y), lng: parseFloat(result[0].x) });
                } else {
                    resolve(null);
                }
            });
        });
    }).catch(function() { return null; });
}
function geocodeQueueSequential(items, onEach) {
    var i = 0;
    function step() {
        if (i >= items.length) { restroomGeocodeQueueBusy = false; saveRestroomGeoCache(); return; }
        var item = items[i++];
        geocodeAddress(item.addr).then(function(coord) {
            if (coord) {
                restroomGeoCache[item.addr] = coord;
                onEach(item, coord);
            }
            if (i % 20 === 0) saveRestroomGeoCache();
            setTimeout(step, 120);
        });
    }
    restroomGeocodeQueueBusy = true;
    step();
}
// 吏??以묒떖???꾩튂??"援?瑜??뚯븘?댁꽌, 洹?援ъ쓽 ?붿옣?ㅻ쭔 吏?ㅼ퐫??罹먯떆???녿뒗 寃껊쭔) + ?쒖떆
function fetchRestroomsFromLocalDataForCurrentArea(center, radius, requestSeq) {
    center = center || getMapSearchCenter();
    radius = radius || getMapSearchRadius();
    return fetchRestroomRawData().then(function(allItems) {
        var items = filterRestroomItemsForArea(allItems, center, radius);
        if (requestSeq && requestSeq !== restroomSearchSeq) return [];
        if (items.length && mapLayerSettings.restroom) {
            restroomVisibleItems = items;
            writeRestroomAreaCache(center, radius, items);
            renderRestroomMarkers();
        }
        return items;
    }).catch(function() { return []; });
}
function scheduleRestroomFetch() {
    if (!mapLayerSettings.restroom) return;
    if (restroomFetchTimer) clearTimeout(restroomFetchTimer);
    restroomFetchTimer = setTimeout(function() { restroomFetchTimer = null; fetchRestroomsForCurrentArea(); }, 700);
}
var restroomFetchTimer = null;
map.on("moveend", scheduleRestroomFetch);
loadRestroomGeoCache();


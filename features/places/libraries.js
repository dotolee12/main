function getLibraryLabel(lang) {
    var labels = { ko: "도서관", en: "Library", ja: "図書館", zh: "图书馆", es: "Biblioteca", fr: "Bibliothèque" };
    return labels[normalizeLang(lang)] || labels.ko;
}
function getRestroomLabel(lang) {
    var labels = { ko: "화장실", en: "Restroom", ja: "トイレ", zh: "卫生间", es: "Baño", fr: "Toilettes" };
    return labels[normalizeLang(lang)] || labels.ko;
}

function getLibraryDisplayName(item) { return (item && item._nameByLang && item._nameByLang[currentLang]) || (item && item.LBRRY_NAME) || ""; }
function getLibraryDisplayAddr(item) { return (item && item._addrByLang && item._addrByLang[currentLang]) || (item && item.ADRES) || ""; }

function clearLibraryMarkers() { var before = captureGpsIntegrity(); logGpsLayerChange("BEFORE library-clear", before); libraryMarkerLayer.clearLayers(); libraryMarkers = []; refreshGpsVisualsAfterPlaceLayerChange("library-clear", before); }

function refreshLibraryMarkerLabels(lang) {
    var label = getLibraryLabel(lang);
    document.querySelectorAll(".library-map-label").forEach(function(el) { el.textContent = label; });
}

function renderLibraryMarkers(lang) {
    var before = captureGpsIntegrity();
    logGpsLayerChange("BEFORE library-refresh", before);
    libraryMarkerLayer.clearLayers();
    libraryMarkers = [];
    var label = getLibraryLabel(lang);
    var center = getMapSearchCenter();
    libraryItems.map(function(item) {
        var lat = parseFloat(item.XCNTS); var lng = parseFloat(item.YDNTS);
        return { item:item, lat:lat, lng:lng, distance:isFinite(lat) && isFinite(lng) ? center.distanceTo([lat, lng]) : Infinity };
    }).filter(function(entry) {
        return isFinite(entry.lat) && isFinite(entry.lng) && isWithinMapSearchCenter(entry.lat, entry.lng, getMapSearchRadius());
    }).sort(function(a, b) { return a.distance - b.distance; }).slice(0, MAP_VIEWPORT_MARKER_LIMIT).forEach(function(entry) {
        var item = entry.item;
        var lat = entry.lat; var lng = entry.lng;
        var likeKey = getMapPlaceLikeKey("library", [item.LBRRY_SEQ_NO || item.LBRRY_NAME, lat, lng]);
        var icon = L.divIcon({
            className: "library-map-marker-wrap",
            html: mapPlaceSymbolHtml("library", likedTourKeys.has(likeKey) ? "state-liked" : "", likeKey), iconSize: [28,28], iconAnchor: [14,14]
        });
        var marker = L.marker([lat, lng], { pane: "libraryPane", icon: icon, title: label + " - " + getLibraryDisplayName(item) }).addTo(libraryMarkerLayer);
        marker.on("click", function() { showLibraryPopup(item); });
        libraryMarkers.push(marker);
    });
    refreshGpsVisualsAfterPlaceLayerChange("library-refresh", before);
    if (!libraryMarkers.length) fetchNearbyLibraryFallback();
}

function showLibraryPopup(item) {
    var lat = parseFloat(item.XCNTS); var lng = parseFloat(item.YDNTS);
    var name = getLibraryDisplayName(item);
    var addr = getLibraryDisplayAddr(item);
    var label = getLibraryLabel();
    setSelectedDestination(lat, lng, name || label);
    var tel = item.TEL_NO ? "<br><a href='tel:" + item.TEL_NO + "' style='color:#4ade80;font-size:12px;'>" + escapeHtml(getTourUiText().phone) + " " + escapeHtml(item.TEL_NO) + "</a>" : "";
    var time = item.OP_TIME ? "<br><small>" + escapeHtml(item.OP_TIME) + "</small>" : "";
    var tag = "<span class='tour-popup-tag' style='color:#60a5fa;border-color:rgba(37,99,235,0.75);background:rgba(37,99,235,0.22);'>" + escapeHtml(label) + "</span>";
    var likeKey = getMapPlaceLikeKey("library", [item.LBRRY_SEQ_NO || item.LBRRY_NAME, lat, lng]);
    var popup = L.popup({ className: "tour-popup" }).setLatLng([lat, lng]).setContent("<b>" + escapeHtml(name) + "</b><br>" + tag + "<br><small>" + escapeHtml(addr) + "</small>" + time + tel + buildMapPlaceLikeButton(likeKey)).openOn(map);
    trackPublicPlacePopup(popup, function() { showLibraryPopup(item); });
}

function translateLibraryItemsForLang(lang) {
    renderLibraryMarkers(lang);
    refreshLibraryMarkerLabels(lang);
    return Promise.resolve();
}

function fetchLibraryJson() {
    // Seoul's legacy endpoint has no usable TLS. Ship its public rows locally.
    if (window.GILOA_SEOUL_LIBRARY_BUNDLE && window.GILOA_SEOUL_LIBRARY_BUNDLE.SeoulPublicLibraryInfo) return Promise.resolve(window.GILOA_SEOUL_LIBRARY_BUNDLE);
    var cached = null;
    try {
        cached = JSON.parse(localStorage.getItem(SEOUL_LIBRARY_CACHE_KEY) || "null");
        if (!cached || !cached.data || Date.now() - Number(cached.savedAt || 0) > SEOUL_LIBRARY_CACHE_MS) cached = null;
    } catch (_) { cached = null; }
    var mixedContentBlocked = location.protocol === "https:" && !window.GiloaPhotoBridge;
    if (!SEOUL_LIBRARY_API_KEY || navigator.onLine === false || mixedContentBlocked) {
        return cached ? Promise.resolve(cached.data) : Promise.reject(new Error("Library data unavailable offline"));
    }
    return requestJsonWithRetry(SEOUL_LIBRARY_API_URL, { timeoutMs: RESTROOM_PROVIDER_TIMEOUT_MS, retries: 1 }).then(function(data) {
        var body = data && data.SeoulPublicLibraryInfo;
        if (!body || !Array.isArray(body.row)) throw new Error("Invalid library response");
        try { localStorage.setItem(SEOUL_LIBRARY_CACHE_KEY, JSON.stringify({ savedAt: Date.now(), data: data })); } catch (_) {}
        return data;
    }).catch(function(error) {
        if (cached) return cached.data;
        throw error;
    });
}

// Seoul's bundled catalogue remains authoritative; find libraries elsewhere when it has no nearby entries.
var nearbyLibraryArea = "", nearbyLibrarySeq = 0;
function fetchNearbyLibraryFallback() {
    if (!mapLayerSettings.library || navigator.onLine === false) return Promise.resolve(false);
    var center = getMapSearchCenter(), radius = getMapSearchRadius();
    var area = center.lat.toFixed(3) + ":" + center.lng.toFixed(3) + ":" + radius;
    if (nearbyLibraryArea === area) return Promise.resolve(false);
    nearbyLibraryArea = area;
    var seq = ++nearbyLibrarySeq;
    return loadKakaoTrafficSdk().then(function() {
        return new Promise(function(resolve) {
            var timer = setTimeout(function(){resolve([]);},9000);
            new kakao.maps.services.Places().keywordSearch("도서관",function(rows,status){
                clearTimeout(timer);
                resolve(status === kakao.maps.services.Status.OK ? rows || [] : []);
            },{location:new kakao.maps.LatLng(center.lat,center.lng),radius:radius,size:15,sort:kakao.maps.services.SortBy.DISTANCE});
        });
    }).then(function(rows) {
        if (seq !== nearbyLibrarySeq || !mapLayerSettings.library || getMapSearchCenter().distanceTo(center) > 150) return false;
        rows = rows.filter(function(row) { return /도서관/.test(String(row.category_name || "").split(">").pop()); });
        rows.forEach(function(row) {
            var lat = Number(row.y), lng = Number(row.x), id = "kakao-library-" + row.id;
            if (!row.id || !row.place_name || !isFinite(lat) || !isFinite(lng) || !isWithinMapSearchCenter(lat,lng,radius)) return;
            if (!libraryItems.some(function(item){return item.LBRRY_SEQ_NO === id;})) libraryItems.push({LBRRY_SEQ_NO:id,LBRRY_NAME:String(row.place_name),ADRES:String(row.road_address_name || row.address_name || ""),XCNTS:lat,YDNTS:lng,TEL_NO:String(row.phone || "")});
        });
        if (rows.length) renderLibraryMarkers(currentLang);
        return rows.length > 0;
    }).catch(function(){ nearbyLibraryArea = ""; return false; });
}
function fetchLibraries() {
    fetchLibraryJson().then(function(data) {
        var body = data && data.SeoulPublicLibraryInfo;
        var freshItems = body && Array.isArray(body.row) ? body.row : [];
        if (freshItems.length) libraryItems = freshItems.concat(libraryItems.filter(function(item){return String(item.LBRRY_SEQ_NO || "").indexOf("kakao-library-") === 0;}));
        librariesLoaded = true;
        if (mapLayerSettings.library) { renderLibraryMarkers(); translateLibraryItemsForLang(currentLang); }
    }).catch(function(err) { console.warn("?쒖슱 ?꾩꽌愿 API ?ㅻ쪟", err); });
}

// Nationwide parking data is split into 0.25-degree tiles. Only tiles that
// intersect the current viewport are fetched, with a hard request/marker cap.
var PARKING_DATA_INDEX_URL = "./data/parking/index.json";
var PARKING_TILE_REQUEST_LIMIT = 16;
var PARKING_COLOR = "#a78bfa";
var parkingManifestPromise = null;
var parkingManifest = null;
var parkingTileCache = {};
var parkingMarkers = [];
var parkingLayerGroup = L.layerGroup().addTo(map);
var parkingRequestSeq = 0;
var parkingBundlePromise = null;

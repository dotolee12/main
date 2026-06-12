// 위치 권한 준비
async function requestLocationPermission() {
    if (window.Capacitor && window.Capacitor.isNativePlatform()) {
        try {
            var plugins = window.Capacitor.Plugins || {};
            if (plugins.Geolocation && typeof plugins.Geolocation.requestPermissions === "function") await plugins.Geolocation.requestPermissions();
        } catch (e) { console.warn("위치 권한 요청 실패", e); }
    }
}
requestLocationPermission();

const STORAGE_KEY = "giloa-v7";
const FOG_ENABLED_KEY = "giloa-fog-enabled";
const GPX_SAVES_KEY = "giloa-gpx-saves";
const FOG_ALPHA_BASE = 0.40;
const FOG_ALPHA_PER_LV = 0;
function getFogAlpha() { return FOG_ALPHA_BASE; }
const FOG_RADIUS_M = 18;
const VISION_CONE_RADIUS_M = 70;
const VISION_CONE_SPREAD_DEG = 70;
const MIN_MOVE_M = 15;
const MAX_ACCURACY_M = 50;
const STAY_ACCURACY_FACTOR = 0.6;
const MAX_STAY_RADIUS_M = 36;
const SAVE_DELAY_MS = 800;
const SCREEN_AWAKE_MS = 8 * 60 * 60 * 1000;
const AUTO_RECORDING_MS = 8 * 60 * 60 * 1000;
const MERGE_DISTANCE_M = 6;
const MERGE_TIME_GAP_MS = 2 * 60 * 1000;
const MAX_PATH_POINTS = 5000;
const FULL_VISIBILITY_HOURS = 0;
const MIN_VISIBILITY_HOURS = 24;
const MIN_PATH_VISIBILITY = 0.4;
const THREE_DAYS_IN_DAYS = 3;
const ONE_MONTH_DAYS = 30;
const THREE_MONTHS_DAYS = 90;
const SIX_MONTHS_DAYS = 180;
const ONE_YEAR_DAYS = 365;
const SEDIMENT_LAYER_COLOR = "rgba(126, 112, 96, 0.24)";
const CLUSTER_ZOOM_THRESHOLD = 14;
const MARKER_MAX_SIZE = 40;
const MARKER_MIN_SIZE = 20;
const MARKER_MAX_ZOOM = 17;
const MARKER_MIN_ZOOM = 14;
const GAP_THRESHOLD_MS = 3 * 60 * 1000;
const PHOTO_STORE_PREVIEW = false;
const PHOTO_POPUP_MAX_SIZE = 720;
const PHOTO_POPUP_JPEG_QUALITY = 0.82;
const PHOTO_POPUP_MIN_QUALITY = 0.68;
const PHOTO_POPUP_TARGET_BYTES = 220 * 1024;
const PHOTO_THUMB_SIZE = 120;
const PHOTO_THUMB_JPEG_QUALITY = 0.74;
const PHOTO_THUMB_MIN_QUALITY = 0.58;
const PHOTO_THUMB_TARGET_BYTES = 24 * 1024;

const LEVEL_TABLE = [
{ level: 1, title: "길 없는 자", distKm: 0, memories: 0, photos: 0 },
{ level: 2, title: "흔적을 남긴 자", distKm: 1, memories: 0, photos: 0 },
{ level: 3, title: "탐험자", distKm: 10, memories: 1, photos: 0 },
{ level: 4, title: "길을 만든 자", distKm: 30, memories: 3, photos: 0 },
{ level: 5, title: "바람을 걷는 자", distKm: 60, memories: 5, photos: 3 },
{ level: 6, title: "기억을 수집하는 자", distKm: 100, memories: 8, photos: 5 },
{ level: 7, title: "두 바퀴의 여행자", distKm: 150, memories: 12, photos: 8 },
{ level: 8, title: "지도를 그리는 자", distKm: 220, memories: 18, photos: 12 },
{ level: 9, title: "길의 연대기", distKm: 300, memories: 25, photos: 18 },
{ level: 10, title: "개척자", distKm: 400, memories: 35, photos: 25 },
{ level: 11, title: "속도의 탐험가", distKm: 550, memories: 45, photos: 33 },
{ level: 12, title: "궤도를 달리는 자", distKm: 720, memories: 58, photos: 43 },
{ level: 13, title: "대륙을 가로지르는 자", distKm: 900, memories: 72, photos: 55 },
{ level: 14, title: "세계의 증인", distKm: 1100, memories: 88, photos: 68 },
{ level: 15, title: "세계의 기록자", distKm: 1350, memories: 107, photos: 84 },
];

const LEVEL_TITLE_I18N = {
    ko: ["길 없는 자", "흔적을 남긴 자", "탐험자", "길을 만든 자", "바람을 걷는 자", "기억을 수집하는 자", "두 바퀴의 여행자", "지도를 그리는 자", "길의 연대기", "개척자", "속도의 탐험가", "궤도를 달리는 자", "대륙을 가로지르는 자", "세계의 증인", "세계의 기록자"],
    en: ["Pathless One", "Trace Maker", "Explorer", "Path Builder", "Wind Walker", "Memory Collector", "Two-Wheel Traveler", "Map Maker", "Chronicle of Roads", "Pioneer", "Speed Explorer", "Orbit Rider", "Continent Crosser", "Witness of the World", "World Recorder"],
    ja: ["道なき者", "足跡を残す者", "探検者", "道を作る者", "風を歩く者", "記憶を集める者", "二輪の旅人", "地図を描く者", "道の年代記", "開拓者", "速度の探検家", "軌道を走る者", "大陸を横断する者", "世界の証人", "世界の記録者"],
    zh: ["无路之人", "留下足迹的人", "探索者", "开路者", "风中行者", "记忆收藏者", "双轮旅行者", "地图绘制者", "道路编年史", "开拓者", "速度探险家", "轨迹骑行者", "横跨大陆者", "世界见证者", "世界记录者"]
};
function getLevelTitle(row) { var list = LEVEL_TITLE_I18N[currentLang] || LEVEL_TITLE_I18N.ko; return list[(row.level || 1) - 1] || row.title; }
const SPEED_LIMIT_WALK = 7 / 3.6;
const SPEED_LIMIT_BIKE = 30 / 3.6;

// ���� IndexedDB ����
const IDB_NAME = "giloa-photos"; const IDB_VERSION = 1; const IDB_STORE = "images"; let idb = null;
function openIdb() { return new Promise(function(resolve, reject) { if (idb) { resolve(idb); return; } var req = indexedDB.open(IDB_NAME, IDB_VERSION); req.onupgradeneeded = function(e) { var db = e.target.result; if (!db.objectStoreNames.contains(IDB_STORE)) { db.createObjectStore(IDB_STORE, { keyPath: "id" }); } }; req.onsuccess = function(e) { idb = e.target.result; resolve(idb); }; req.onerror = function(e) { reject(e.target.error); }; }); }
function idbSavePhoto(id, photo, thumb) { return openIdb().then(function(db) { return new Promise(function(resolve, reject) { var tx = db.transaction(IDB_STORE, "readwrite"); tx.objectStore(IDB_STORE).put({ id: id, photo: photo, thumb: thumb }); tx.oncomplete = resolve; tx.onerror = function(e) { reject(e.target.error); }; }); }); }
function idbGetPhoto(id) { return openIdb().then(function(db) { return new Promise(function(resolve, reject) { var req = db.transaction(IDB_STORE, "readonly").objectStore(IDB_STORE).get(id); req.onsuccess = function(e) { resolve(e.target.result || null); }; req.onerror = function(e) { reject(e.target.error); }; }); }); }
function idbDeletePhoto(id) { return openIdb().then(function(db) { return new Promise(function(resolve, reject) { var tx = db.transaction(IDB_STORE, "readwrite"); tx.objectStore(IDB_STORE).delete(id); tx.oncomplete = resolve; tx.onerror = function(e) { reject(e.target.error); }; }); }); }
function idbGetAllPhotos() { return openIdb().then(function(db) { return new Promise(function(resolve, reject) { var req = db.transaction(IDB_STORE, "readonly").objectStore(IDB_STORE).getAll(); req.onsuccess = function(e) { resolve(e.target.result || []); }; req.onerror = function(e) { reject(e.target.error); }; }); }); }
function migratePhotosToThumbOnly() {
    if (PHOTO_STORE_PREVIEW) return Promise.resolve();
    return idbGetAllPhotos().then(function(list) {
        var tasks = [];
        list.forEach(function(row) {
            if (!row || !row.id || !row.thumb) return;
            if (row.photo && row.photo !== row.thumb) tasks.push(idbSavePhoto(row.id, "", row.thumb));
        });
        if (tasks.length === 0) return;
        return Promise.all(tasks);
    }).catch(function(e) { console.warn("���� �淮ȭ ����", e); });
}

// ���� ���� ���� ����
let isRecording = false; let photos = []; let isFogEnabled = true; let isHudExpanded = false;
let currentPos = null; let pathCoordinates = []; let memories = []; let totalDistance = 0;
let playerMarker = null; let playerHeading = null; let watchId = null; let backgroundWatchId = null; let saveTimer = null; let rafId = null;
let screenWakeLock = null; let screenWakeLockTimer = null; let screenAwakeUntil = 0; let autoRecordingTimer = null; let photoTapTimer = null; let activePhotoEditId = null;
const memoryMarkers = new Map();
let activeGpxId = null; let activeGpxLayers = []; let dialHours = 12;
const STAY_BONUS_MS = 30 * 60 * 1000; const STAY_BONUS_RADIUS_M = 50;
const IMAGE_MISSION_RADIUS_M = 120;
const AUTO_VISIT_RADIUS_M = 30;
let stayBonusStartTime = null; let stayBonusAnchor = null; let stayBonusLevelBoost = 0; let stayBonusPlaces = [];
let activeImageMission = null;
let lastPhotoMarkerSize = null;
let heicLoaderPromise = null;
const recBtn = document.getElementById("rec-btn");
const recStatusBox = document.getElementById("rec-status-box");

const TILE_CACHE_NAME = "giloa-map-tiles-v1";
const TILE_URL_TEMPLATE = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const TILE_SUBDOMAINS = ["a", "b", "c", "d"];

function buildTileUrl(coords) {
    var data = {
        s: TILE_SUBDOMAINS[Math.abs(coords.x + coords.y) % TILE_SUBDOMAINS.length],
        x: coords.x,
        y: coords.y,
        z: coords.z,
        r: L.Browser.retina ? "@2x" : ""
    };
    return L.Util.template(TILE_URL_TEMPLATE, data);
}

function setTileImage(tile, url, done) {
    tile.onload = function() { if (done) done(null, tile); };
    tile.onerror = function() { if (done) done(new Error("tile load failed"), tile); };
    tile.src = url;
}

var CachedTileLayer = L.TileLayer.extend({
    createTile: function(coords, done) {
        var tile = document.createElement("img");
        tile.alt = "";
        tile.setAttribute("role", "presentation");
        var url = buildTileUrl(coords);
        if (!("caches" in window) || !("fetch" in window) || !("URL" in window)) {
            setTileImage(tile, url, done);
            return tile;
        }
        caches.open(TILE_CACHE_NAME).then(function(cache) {
            return cache.match(url).then(function(cached) {
                if (!navigator.onLine && cached) return cached;
                return fetch(url, { mode: "cors", cache: "force-cache" }).then(function(response) {
                    if (response && response.ok) cache.put(url, response.clone()).catch(function() {});
                    return response && response.ok ? response : cached;
                }).catch(function() { return cached; });
            });
        }).then(function(response) {
            if (!response) {
                setTileImage(tile, url, done);
                return;
            }
            return response.blob().then(function(blob) {
                var objectUrl = URL.createObjectURL(blob);
                tile.onload = function() { URL.revokeObjectURL(objectUrl); if (done) done(null, tile); };
                tile.onerror = function() { URL.revokeObjectURL(objectUrl); setTileImage(tile, url, done); };
                tile.src = objectUrl;
            });
        }).catch(function() {
            setTileImage(tile, url, done);
        });
        return tile;
    }
});

function clearTileCache() {
    if (!("caches" in window)) return Promise.resolve(false);
    return caches.delete(TILE_CACHE_NAME);
}

// 지도 초기화
const map = L.map("map", { zoomControl: false, attributionControl: false }).setView([37.5665, 126.978], 16);
new CachedTileLayer(TILE_URL_TEMPLATE, { zIndex: 10, subdomains: TILE_SUBDOMAINS, crossOrigin: true, maxZoom: 20 }).addTo(map);

map.createPane("fogPane");
map.getPane("fogPane").style.zIndex = 450;
map.createPane("photoPane");
map.getPane("photoPane").style.zIndex = 630;
map.createPane("memoryPane");
map.getPane("memoryPane").style.zIndex = 640;
map.createPane("playerPane");
map.getPane("playerPane").style.zIndex = 650;
map.createPane("tourPane");
map.getPane("tourPane").style.zIndex = 660;
map.createPane("libraryPane");
map.getPane("libraryPane").style.zIndex = 665;
var tourRenderer = L.svg({ pane: "tourPane" });

var fogPane = map.getPane("fogPane");
fogPane.appendChild(document.getElementById("fog-canvas"));
fogPane.appendChild(document.getElementById("age-canvas"));
fogPane.appendChild(document.getElementById("stay-canvas"));

const photoClusterGroup = L.markerClusterGroup({
    clusterPane: "photoPane", maxClusterRadius: 60, disableClusteringAtZoom: CLUSTER_ZOOM_THRESHOLD + 1,
    iconCreateFunction: function(cluster) { var count = cluster.getChildCount(); return L.divIcon({ className: "photo-cluster-icon", html: '<div class="photo-cluster-inner">' + count + '</div>', iconSize: [36, 36] }); }
});
map.addLayer(photoClusterGroup);

const fogCanvas = document.getElementById("fog-canvas");
const ageCanvas = document.getElementById("age-canvas");
const stayCanvas = document.getElementById("stay-canvas");
const fogCtx = fogCanvas.getContext("2d");
const ageCtx = ageCanvas.getContext("2d");
const stayCtx = stayCanvas.getContext("2d");
const fogScratchCanvas = document.createElement("canvas");
const ageScratchCanvas = document.createElement("canvas");
const fogScratchCtx = fogScratchCanvas.getContext("2d");
const ageScratchCtx = ageScratchCanvas.getContext("2d");
let canvasTopLeft = L.point(0, 0);

function syncCanvasPosition() {
    canvasTopLeft = map.containerPointToLayerPoint([0, 0]);
    [fogCanvas, ageCanvas, stayCanvas].forEach(function(c) { L.DomUtil.setPosition(c, canvasTopLeft); });
}
function latLngToCanvasPoint(latlng) { return map.latLngToLayerPoint(latlng).subtract(canvasTopLeft); }

function resizeCanvas() {
    var mapEl = document.getElementById("map");
    var w = mapEl.clientWidth || window.innerWidth;
    var h = mapEl.clientHeight || window.innerHeight;
    [fogCanvas, ageCanvas, stayCanvas].forEach(function(c) { c.width = w; c.height = h; });
    [fogScratchCanvas, ageScratchCanvas].forEach(function(c) { c.width = w; c.height = h; });
    syncCanvasPosition();
    scheduleRender();
}

window.addEventListener("resize", resizeCanvas);
map.on("move zoom", scheduleRender);
map.on("zoomend", updatePhotoMarkerSizes);

function scheduleRender() { if (rafId !== null) return; rafId = requestAnimationFrame(function() { rafId = null; render(); }); }
function render() { syncCanvasPosition(); renderFog(); renderAgeTint(); renderStayTint(); }
function calcMpp() { var center = map.getCenter(); var pt = map.latLngToContainerPoint(center); var ll2 = map.containerPointToLatLng(L.point(pt.x + 10, pt.y)); return center.distanceTo(ll2) || 1; }
function metersToPixels(meters, mpp) { return (meters / mpp) * 10; }
function renderVisionFogClear(pos, mpp) {
    if (!isRecording || playerHeading === null) return;
    var radius = metersToPixels(VISION_CONE_RADIUS_M, mpp);
    var spread = VISION_CONE_SPREAD_DEG * Math.PI / 180;
    var heading = (playerHeading - 90) * Math.PI / 180;
    var start = heading - spread / 2;
    var end = heading + spread / 2;
    fogCtx.save();
    fogCtx.globalCompositeOperation = "destination-out";
    var grad = fogCtx.createRadialGradient(pos.x, pos.y, radius * 0.16, pos.x, pos.y, radius);
    grad.addColorStop(0, "rgba(0,0,0,0.95)");
    grad.addColorStop(0.62, "rgba(0,0,0,0.62)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    fogCtx.fillStyle = grad;
    fogCtx.beginPath();
    fogCtx.moveTo(pos.x, pos.y);
    fogCtx.arc(pos.x, pos.y, radius, start, end);
    fogCtx.closePath();
    fogCtx.fill();
    fogCtx.restore();
}

function renderFog() {
    var w = fogCanvas.width, h = fogCanvas.height; fogCtx.clearRect(0, 0, w, h);
    if (!isFogEnabled) return;
    fogCtx.fillStyle = "rgba(8, 10, 18, " + getFogAlpha() + ")";
    fogCtx.fillRect(0, 0, w, h);
    if (currentPos) {
        var mpp = calcMpp();
        var pos = latLngToCanvasPoint(currentPos);
        var playerRadius = metersToPixels(FOG_RADIUS_M * 1.5, mpp);
        fogCtx.save();
        fogCtx.globalCompositeOperation = "destination-out";
        var grad = fogCtx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, playerRadius);
        grad.addColorStop(0, "rgba(0,0,0,1)");
        grad.addColorStop(1, "rgba(0,0,0,0)");
        fogCtx.fillStyle = grad;
        fogCtx.beginPath();
        fogCtx.arc(pos.x, pos.y, playerRadius, 0, Math.PI * 2);
        fogCtx.fill();
        fogCtx.restore();
        renderVisionFogClear(pos, mpp);
    }
    if (pathCoordinates.length === 0) return;
    var now = Date.now(); var mpp = calcMpp(); var radius = metersToPixels(FOG_RADIUS_M, mpp);
    var BUCKET = 0.05; var buckets = new Map();
    var addToBucket = function(alpha, drawFn) { var key = Math.round(alpha / BUCKET) * BUCKET; if (!buckets.has(key)) buckets.set(key, []); buckets.get(key).push(drawFn); };
    for (var i = 0; i < pathCoordinates.length; i++) {
        (function(idx) {
            var point = pathCoordinates[idx];
            var ageHours = (now - point.startTime) / 3600000;
            var alpha = getPathVisibility(ageHours);
            var pos = latLngToCanvasPoint([point.lat, point.lng]);
            var stayMin = (point.endTime - point.startTime) / 60000;
            var stayR = metersToPixels(getStayRadiusMeters(stayMin), mpp);
            addToBucket(alpha, function(ctx) { ctx.beginPath(); ctx.arc(pos.x, pos.y, stayR, 0, Math.PI * 2); ctx.fill(); });
            if (idx > 0) {
                var prev = latLngToCanvasPoint([pathCoordinates[idx - 1].lat, pathCoordinates[idx - 1].lng]);
                var timeGap = point.startTime - pathCoordinates[idx - 1].endTime;
                if (timeGap <= GAP_THRESHOLD_MS) {
                    addToBucket(alpha, function(ctx) { ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(pos.x, pos.y); ctx.stroke(); });
                }
            }
        })(i);
    }
    var offCtx = fogScratchCtx;
    buckets.forEach(function(drawFns, alpha) {
        offCtx.clearRect(0, 0, w, h);
        offCtx.fillStyle = "rgba(0,0,0," + alpha + ")";
        offCtx.strokeStyle = "rgba(0,0,0," + alpha + ")";
        offCtx.lineWidth = radius * 2.2;
        offCtx.lineCap = "round"; offCtx.lineJoin = "round";
        drawFns.forEach(function(fn) { fn(offCtx); });
        fogCtx.save();
        fogCtx.globalCompositeOperation = "destination-out";
        fogCtx.drawImage(fogScratchCanvas, 0, 0);
        fogCtx.restore();
    });
}

function getPathVisibility(ageHours) { if (ageHours <= FULL_VISIBILITY_HOURS) return 1; if (ageHours >= MIN_VISIBILITY_HOURS) return MIN_PATH_VISIBILITY; return 1 - (1 - MIN_PATH_VISIBILITY) * (ageHours / MIN_VISIBILITY_HOURS); }

function renderAgeTint() {
    var w = ageCanvas.width, h = ageCanvas.height; ageCtx.clearRect(0, 0, w, h);
    if (pathCoordinates.length === 0) return;
    var now = Date.now(); var mpp = calcMpp(); var radius = metersToPixels(FOG_RADIUS_M, mpp);
    var buckets = new Map();
    pathCoordinates.forEach(function(point, i) {
        var ageDays = (now - point.startTime) / 86400000; var color = getAgeColor(ageDays); if (!color) return;
        if (!buckets.has(color)) buckets.set(color, []); var pos = latLngToCanvasPoint([point.lat, point.lng]);
        if (i > 0) { var timeGap = point.startTime - pathCoordinates[i - 1].endTime; if (timeGap <= GAP_THRESHOLD_MS) { var prev = latLngToCanvasPoint([pathCoordinates[i - 1].lat, pathCoordinates[i - 1].lng]); buckets.get(color).push({ x1: prev.x, y1: prev.y, x2: pos.x, y2: pos.y }); } }
    });
    var offCtx = ageScratchCtx;
    buckets.forEach(function(draws, color) {
        offCtx.clearRect(0, 0, w, h);
        offCtx.strokeStyle = color; offCtx.lineWidth = radius * 1.15; offCtx.lineCap = "round"; offCtx.lineJoin = "round"; offCtx.beginPath();
        draws.forEach(function(d) { offCtx.moveTo(d.x1, d.y1); offCtx.lineTo(d.x2, d.y2); }); offCtx.stroke(); ageCtx.drawImage(ageScratchCanvas, 0, 0);
    });
}

function getAgeColor(ageDays) { if (ageDays < THREE_DAYS_IN_DAYS) return null; if (ageDays < ONE_MONTH_DAYS) return "rgba(173, 255, 120, 0.16)"; if (ageDays < THREE_MONTHS_DAYS) return "rgba(60, 170, 80, 0.18)"; if (ageDays < SIX_MONTHS_DAYS) return "rgba(214, 176, 55, 0.18)"; if (ageDays < ONE_YEAR_DAYS) return "rgba(130, 92, 55, 0.20)"; return SEDIMENT_LAYER_COLOR; }

function renderStayTint() {
    var w = stayCanvas.width, h = stayCanvas.height; stayCtx.clearRect(0, 0, w, h);
    if (pathCoordinates.length === 0) return; var mpp = calcMpp();
    pathCoordinates.forEach(function(point) {
        var stayMin = (point.endTime - point.startTime) / 60000; if (stayMin < 10) return;
        var pos = latLngToCanvasPoint([point.lat, point.lng]); var radius = metersToPixels(getStayRadiusMeters(stayMin), mpp);
        var grad = stayCtx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, radius);
        grad.addColorStop(0, "rgba(255, 220, 100, 0.18)"); grad.addColorStop(0.6, "rgba(255, 220, 100, 0.08)"); grad.addColorStop(1, "rgba(255, 220, 100, 0)");
        stayCtx.fillStyle = grad; stayCtx.beginPath(); stayCtx.arc(pos.x, pos.y, radius, 0, Math.PI * 2); stayCtx.fill();
    });
}

function getStayRadiusMeters(stayMin) { if (stayMin < 10) return FOG_RADIUS_M; if (stayMin >= 180) return FOG_RADIUS_M * 2.0; return FOG_RADIUS_M * (1.0 + (stayMin - 10) / (180 - 10)); }
function getPhotoMarkerSize() { var zoom = map.getZoom(); if (zoom >= MARKER_MAX_ZOOM) return MARKER_MAX_SIZE; if (zoom <= MARKER_MIN_ZOOM) return MARKER_MIN_SIZE; var ratio = (zoom - MARKER_MIN_ZOOM) / (MARKER_MAX_ZOOM - MARKER_MIN_ZOOM); return Math.round(MARKER_MIN_SIZE + ratio * (MARKER_MAX_SIZE - MARKER_MIN_SIZE)); }
function buildPhotoMarkerIcon(src, size) { return L.divIcon({ className: "photo-marker", html: '<img src="' + src + '" style="width:' + size + 'px;height:' + size + 'px;object-fit:cover;border-radius:6px;border:2px solid #fff;" />', iconSize: [size, size], iconAnchor: [size / 2, size] }); }
function updatePhotoMarkerSizes() {
    var size = getPhotoMarkerSize();
    if (size === lastPhotoMarkerSize) return;
    lastPhotoMarkerSize = size;
    photoClusterGroup.eachLayer(function(marker) {
        if (marker._photoData) marker.setIcon(buildPhotoMarkerIcon(marker._photoData.thumb, size));
    });
}

function calcLevel() {
    var distKm = totalDistance / 1000; var memCount = photos.length; var photoCount = photos.length; var currentLevel = LEVEL_TABLE[0];
    for (var i = 0; i < LEVEL_TABLE.length; i++) { var row = LEVEL_TABLE[i]; if (distKm >= row.distKm && memCount >= row.memories && photoCount >= row.photos) { currentLevel = row; } else { break; } }
    var boostedLevel = Math.min(currentLevel.level + stayBonusLevelBoost, LEVEL_TABLE.length); return LEVEL_TABLE[boostedLevel - 1];
}

function updateHud() {
    var t = UI_TEXT[currentLang] || UI_TEXT.ko;
    var current = calcLevel(); var distKm = totalDistance / 1000; var todayDist = calcTodayDistance() / 1000; var photoCount = photos.length; var visitCount = visitStamps.length;
    var nextRow = LEVEL_TABLE.find(function(r) { return r.level === current.level + 1; });
    var titleEl = document.getElementById("hud-title-text"); var levelEl = document.getElementById("hud-level-num"); var subEl = document.getElementById("hud-subtitle-text");
    if (titleEl) titleEl.textContent = getLevelTitle(current); if (levelEl) levelEl.textContent = current.level; if (subEl) subEl.textContent = "오늘 " + todayDist.toFixed(2) + "km";
    var photoTotalEl = document.getElementById("hud-photo-total"); var visitTotalEl = document.getElementById("hud-visit-total");
    if (photoTotalEl) photoTotalEl.textContent = photoCount + t.unit_count;
    if (visitTotalEl) visitTotalEl.textContent = visitCount + ((currentLang === "en") ? " places" : "곳");
    var levelBar = document.getElementById("hud-level-bar");
    var progressValue = document.getElementById("hud-level-progress-value");
    var progressNext = document.getElementById("hud-level-progress-next");
    var progressLabel = document.getElementById("hud-level-progress-label");
    var levelPct = 100;
    var nextText = t.hud_max_level;
    if (nextRow) {
        var distPct = nextRow.distKm > current.distKm ? ((distKm - current.distKm) / (nextRow.distKm - current.distKm)) * 100 : 100;
        var photoPct = nextRow.photos > current.photos ? ((photoCount - current.photos) / (nextRow.photos - current.photos)) * 100 : 100;
        var visitPct = nextRow.memories > current.memories ? ((visitCount - current.memories) / (nextRow.memories - current.memories)) * 100 : 100;
        distPct = Math.max(0, Math.min(100, distPct));
        photoPct = Math.max(0, Math.min(100, photoPct));
        visitPct = Math.max(0, Math.min(100, visitPct));
        levelPct = Math.min(distPct, photoPct, visitPct);
        var remainDist = Math.max(0, nextRow.distKm - distKm);
        var remainPhoto = Math.max(0, nextRow.photos - photoCount);
        var remainVisit = Math.max(0, nextRow.memories - visitCount);
        var needs = [];
        if (remainDist > 0.01) needs.push(remainDist.toFixed(1) + "km");
        if (remainPhoto > 0) needs.push("사진 " + remainPhoto + t.unit_count);
        if (remainVisit > 0) needs.push("방문 " + remainVisit + "곳");
        nextText = needs.length ? t.hud_next + " " + needs.join(" · ") : t.hud_condition_met;
    }
    if (levelBar) levelBar.style.width = levelPct.toFixed(1) + "%";
    if (progressValue) progressValue.textContent = Math.round(levelPct) + "%";
    if (progressNext) progressNext.textContent = nextText;
    if (progressLabel) progressLabel.textContent = nextRow ? "LV " + nextRow.level + "까지" : t.hud_max_level;
}

function updateStats() {
    var todayDist = calcTodayDistance(); var distEl = document.getElementById("dist-val"); var todayEl = document.getElementById("today-dist-val"); var memEl = document.getElementById("memory-count-val"); var photoEl = document.getElementById("photo-count-val");
    if (distEl) distEl.innerHTML = (totalDistance / 1000).toFixed(2) + "<span>km</span>";
    if (todayEl) todayEl.innerHTML = (todayDist / 1000).toFixed(2) + "<span>km</span>";
    if (memEl) memEl.innerHTML = memories.length + "<span>개</span>";
    if (photoEl) photoEl.innerHTML = photos.length + "<span>개</span>";
    updateHud(); checkBadges();
}

function toggleHud() { applyHudLang(UI_TEXT[currentLang] || UI_TEXT.ko); isHudExpanded = !isHudExpanded; document.getElementById("hud").classList.toggle("expanded", isHudExpanded); document.getElementById("controls").classList.toggle("hud-open", isHudExpanded); document.getElementById("help-btn").classList.toggle("hud-open", isHudExpanded); if (isHudExpanded) { setTimeout(function() { document.addEventListener("click", handleHudOutsideClick); }, 0); } else { document.removeEventListener("click", handleHudOutsideClick); } }
function handleHudOutsideClick(event) { var hud = document.getElementById("hud"); if (!hud.contains(event.target)) { isHudExpanded = false; hud.classList.remove("expanded"); document.getElementById("controls").classList.remove("hud-open"); document.getElementById("help-btn").classList.remove("hud-open"); document.removeEventListener("click", handleHudOutsideClick); } }
function syncRecordingUI() { var t = UI_TEXT[currentLang] || UI_TEXT.ko; recBtn.classList.toggle("recording", isRecording); recStatusBox.textContent = isRecording ? t.rec_active : t.rec_idle; recStatusBox.classList.toggle("recording", isRecording); syncImageMissionUI(); }
function getImageMissionLatLng(item) {
    if (!item) return null;
    var lat = parseFloat(item.mapy !== undefined ? item.mapy : item.lat);
    var lng = parseFloat(item.mapx !== undefined ? item.mapx : item.lng);
    if (!isFinite(lat) || !isFinite(lng)) return null;
    return L.latLng(lat, lng);
}
function getImageMissionName(item) { return getTourDisplayTitle(item) || item.name || item.LBRRY_NAME || item.title || "미션 장소"; }
function getActiveImageMission() {
    if (!currentPos) return null;
    var sources = [];
    if (Array.isArray(tourItems)) sources = sources.concat(tourItems);
    if (Array.isArray(festivalItems)) sources = sources.concat(festivalItems);
    if (Array.isArray(libraryItems)) sources = sources.concat(libraryItems);
    var best = null;
    sources.forEach(function(item) {
        var latlng = getImageMissionLatLng(item);
        if (!latlng) return;
        var dist = currentPos.distanceTo(latlng);
        if (dist <= IMAGE_MISSION_RADIUS_M && (!best || dist < best.distance)) {
            best = { item: item, distance: dist, name: getImageMissionName(item) };
        }
    });
    return best;
}
function syncImageMissionUI() {
    var photoBtn = document.getElementById("photo-btn");
    if (!photoBtn) return;
    activeImageMission = getActiveImageMission();
    photoBtn.classList.toggle("mission-active", !!activeImageMission);
    photoBtn.setAttribute("title", activeImageMission ? activeImageMission.name + " 이미지 미션" : "갤러리에서 사진 불러오기");
}
function syncFogButton() { var t = UI_TEXT[currentLang] || UI_TEXT.ko; var toggleBtn = document.getElementById("fog-toggle-btn"); var toggleState = document.getElementById("fog-toggle-state"); if (!toggleBtn) return; toggleBtn.classList.toggle("on", isFogEnabled); toggleBtn.classList.toggle("off", !isFogEnabled); if (toggleState) { toggleState.textContent = isFogEnabled ? t.fog_on : t.fog_off; toggleState.classList.toggle("on", isFogEnabled); toggleState.classList.toggle("off", !isFogEnabled); } }
function toggleHelp() { applyHelpLang(UI_TEXT[currentLang] || UI_TEXT.ko); document.getElementById("help-popup").classList.toggle("show"); }
function handleHelpOverlayClick(event) { var box = document.getElementById("help-content-box"); if (!box.contains(event.target)) toggleHelp(); }
function switchHelpTab(tab) { applyHelpLang(UI_TEXT[currentLang] || UI_TEXT.ko); ["ask", "info"].forEach(function(t) { document.getElementById("htab-" + t).classList.toggle("active", t === tab); document.getElementById("hpanel-" + t).style.display = t === tab ? "" : "none"; }); }
function togglePhotoMenu() { triggerGallery(); }
function closePhotoMenu() { document.getElementById("photo-menu").classList.remove("open"); document.getElementById("photo-menu-overlay").classList.remove("show"); }

async function triggerCamera() {
    closePhotoMenu();
    if (window.Capacitor && window.Capacitor.isNativePlatform()) {
        try {
            var Camera = window.Capacitor.Plugins.Camera;
            var photo = await Camera.getPhoto({ quality: 95, resultType: "uri", source: "CAMERA" });
            var lat = currentPos ? currentPos.lat : map.getCenter().lat;
            var lng = currentPos ? currentPos.lng : map.getCenter().lng;
            var img = await loadImageFromUrl(photo.webPath || photo.path);
            processPhoto(img, new Date(), lat, lng, {
                sourceUri: photo.path || photo.webPath || "",
                sourceWebPath: photo.webPath || "",
                sourceType: "camera"
            });
            return;
        } catch (e) {
            console.warn("ī�޶� ����", e);
        }
    }
    document.getElementById("camera-input").click();
}

async function triggerGallery() {
    closePhotoMenu();
    if (window.Capacitor && window.Capacitor.isNativePlatform()) {
        try {
            var Camera = window.Capacitor.Plugins.Camera;
            var fallbackLat = currentPos ? currentPos.lat : map.getCenter().lat;
            var fallbackLng = currentPos ? currentPos.lng : map.getCenter().lng;
            if (Camera && typeof Camera.pickImages === "function") {
                var picked = await Camera.pickImages({ quality: 95 });
                var list = picked && Array.isArray(picked.photos) ? picked.photos : [];
                if (!list.length) return;
                for (var i = 0; i < list.length; i++) {
                    if (recStatusBox) recStatusBox.textContent = "���� ó�� �� " + (i + 1) + "/" + list.length;
                    var one = list[i];
                    var gpsOne = await getPhotoExifGps(one);
                    var coordOne = gpsOne || { lat: fallbackLat, lng: fallbackLng };
                    var imgOne = await loadImageFromUrl(one.webPath || one.path);
                    processPhoto(imgOne, new Date(), coordOne.lat, coordOne.lng, {
                        deferUi: true,
                        openPopup: list.length === 1,
                        sourceUri: one.path || one.webPath || "",
                        sourceWebPath: one.webPath || "",
                        sourceType: "gallery",
                        locationSource: gpsOne ? "exif" : "fallback"
                    });
                }
                updateStats();
                scheduleSave();
                updatePhotoList();
                syncRecordingUI();
                return;
            }
            var single = await Camera.getPhoto({ quality: 95, resultType: "uri", source: "PHOTOS" });
            var gpsSingle = await getPhotoExifGps(single);
            var coordSingle = gpsSingle || { lat: fallbackLat, lng: fallbackLng };
            var img = await loadImageFromUrl(single.webPath || single.path);
            processPhoto(img, new Date(), coordSingle.lat, coordSingle.lng, {
                sourceUri: single.path || single.webPath || "",
                sourceWebPath: single.webPath || "",
                sourceType: "gallery",
                locationSource: gpsSingle ? "exif" : "fallback"
            });
            return;
        } catch (e) {
            console.warn("������ �ҷ����� ����", e);
        }
    }
    document.getElementById("gallery-input").click();
}
async function openPhotoInGallery(data) {
    var sourceUri = data && (data.sourceUri || data.sourceWebPath);
    if (!sourceUri) {
        alert("���� ��� ������ ���� ��� �������� �ٷ� �� �� �����ϴ�.");
        return;
    }
    try {
        if (window.GiloaPhotoBridge && typeof window.GiloaPhotoBridge.openPhoto === "function") {
            var opened = window.GiloaPhotoBridge.openPhoto(sourceUri);
            if (opened) return;
        }
        if (window.Capacitor && window.Capacitor.isNativePlatform()) {
            var plugins = window.Capacitor.Plugins || {};
            if (plugins.Browser && typeof plugins.Browser.open === "function") {
                await plugins.Browser.open({ url: sourceUri });
                return;
            }
        }
        window.open(sourceUri, "_blank");
    } catch (e) {
        console.warn("���� ���� ����", e);
        try { window.open(sourceUri, "_blank"); }
        catch (_) { alert("���� ������ ���� ���߽��ϴ�."); }
    }
}

function findPhotoData(id) { return photos.find(function(p) { return p.id === id; }) || null; }
function getPhotoDisplaySrc(data) {
    if (!data) return "";
    return data.thumb || data.photo || data.sourceWebPath || data.sourceUri || "";
}
function openPhotoDetail(data) {
    if (!data) return;
    activePhotoEditId = data.id;
    var modal = document.getElementById("photo-detail-modal");
    var img = document.getElementById("photo-detail-img");
    var title = document.getElementById("photo-detail-name");
    var note = document.getElementById("photo-detail-note");
    var meta = document.getElementById("photo-detail-meta");
    if (!modal || !img || !title || !note) return;
    img.src = data.photo || getPhotoDisplaySrc(data);
    title.value = data.photoTitle || "";
    note.value = data.photoNote || "";
    if (meta) meta.textContent = (data.dateString || "") + " " + (data.timeString || "") + " · " + (data.locationSource === "exif" ? "EXIF 위치" : "현재 위치 기준");
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
}
function closePhotoDetail() {
    var modal = document.getElementById("photo-detail-modal");
    if (modal) { modal.classList.remove("show"); modal.setAttribute("aria-hidden", "true"); }
    activePhotoEditId = null;
}
function savePhotoDetail() {
    var data = findPhotoData(activePhotoEditId);
    if (!data) return;
    var title = document.getElementById("photo-detail-name");
    var note = document.getElementById("photo-detail-note");
    data.photoTitle = title ? title.value.trim() : "";
    data.photoNote = note ? note.value.trim() : "";
    var marker = findPhotoMarker(data.id);
    if (marker) {
        photoClusterGroup.removeLayer(marker);
        createPhotoMarker(data, false);
    }
    updatePhotoList();
    scheduleSave();
    closePhotoDetail();
}
function focusActivePhotoOnMap() {
    var data = findPhotoData(activePhotoEditId);
    if (!data) return;
    closePhotoDetail();
    focusPhotoOnMap(data);
}
function openActivePhotoOriginal() {
    var data = findPhotoData(activePhotoEditId);
    if (data) openPhotoInGallery(data);
}

function focusPhotoOnMap(data) {
    map.flyTo([data.lat, data.lng], 17);
    var markerLayer = findPhotoMarker(data.id);
    if (markerLayer) markerLayer.openPopup();
    toggleSidebar(false);
}
function canUseScreenWakeLock() { return !!(navigator.wakeLock && typeof navigator.wakeLock.request === "function"); }
function requestNativeScreenAwake() { try { if (window.GiloaScreenAwake && typeof window.GiloaScreenAwake.keepScreenOnFor === "function") window.GiloaScreenAwake.keepScreenOnFor(SCREEN_AWAKE_MS); } catch (e) { console.warn("����Ƽ�� ȭ�� ���� ����", e); } }
function releaseNativeScreenAwake() { try { if (window.GiloaScreenAwake && typeof window.GiloaScreenAwake.clearKeepScreenOn === "function") window.GiloaScreenAwake.clearKeepScreenOn(); } catch (e) { console.warn("����Ƽ�� ȭ�� ���� ���� ����", e); } }
async function requestScreenAwake() {
    screenAwakeUntil = Date.now() + SCREEN_AWAKE_MS;
    requestNativeScreenAwake();
    if (screenWakeLockTimer) clearTimeout(screenWakeLockTimer);
    screenWakeLockTimer = setTimeout(releaseScreenAwake, SCREEN_AWAKE_MS);
    if (!canUseScreenWakeLock() || document.visibilityState !== "visible") return;
    try {
        if (screenWakeLock && !screenWakeLock.released) return;
        screenWakeLock = await navigator.wakeLock.request("screen");
        screenWakeLock.addEventListener("release", function() {
            screenWakeLock = null;
            if (isRecording && Date.now() < screenAwakeUntil && document.visibilityState === "visible") {
                setTimeout(requestScreenAwake, 500);
            }
        });
    } catch (e) { console.warn("ȭ�� ���� ���� ����", e); }
}
function releaseScreenAwake() {
    screenAwakeUntil = 0;
    releaseNativeScreenAwake();
    if (screenWakeLockTimer) { clearTimeout(screenWakeLockTimer); screenWakeLockTimer = null; }
    var lock = screenWakeLock;
    screenWakeLock = null;
    if (lock && !lock.released) lock.release().catch(function(e) { console.warn("ȭ�� ���� ���� ����", e); });
}
document.addEventListener("visibilitychange", function() {
    if (isRecording && Date.now() < screenAwakeUntil && document.visibilityState === "visible") requestScreenAwake();
});
function clearAutoRecordingTimer() {
    if (autoRecordingTimer) { clearTimeout(autoRecordingTimer); autoRecordingTimer = null; }
}
function startAutoRecordingTimer() {
    clearAutoRecordingTimer();
    autoRecordingTimer = setTimeout(function() {
        autoRecordingTimer = null;
        if (!isRecording) return;
        stopRecording();
    }, AUTO_RECORDING_MS);
}
function stopRecording() {
    isRecording = false;
    clearAutoRecordingTimer();
    releaseScreenAwake();
    syncRecordingUI();
    stopTracking();
    compactPathData();
    scheduleSave();
}
function resetRecordingState() { stopRecording(); }
function toggleRecording() {
    if (isRecording) { stopRecording(); return; }
    isRecording = true;
    requestScreenAwake();
    startAutoRecordingTimer();
    syncRecordingUI();
    startTracking();
}
function dismissAutoRecordingNotice() {
    var overlay = document.getElementById("auto-recording-notice");
    if (overlay) overlay.classList.remove("show");
}
function showAutoRecordingNotice() {
    var overlay = document.getElementById("auto-recording-notice");
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "auto-recording-notice";
        overlay.innerHTML = '<div class="auto-recording-box" role="dialog" aria-modal="true" aria-label="자동 녹화 안내"><button class="auto-recording-close" type="button" aria-label="닫기">×</button><div class="auto-recording-title">자동 녹화가 시작됩니다</div><div class="auto-recording-copy">위치가 8시간 동안 녹화됩니다.<br>중지하려면 화면 오른쪽 아래의 녹화중지 버튼을 눌러주세요.</div></div>';
        overlay.addEventListener("click", function(e) { if (e.target === overlay) dismissAutoRecordingNotice(); });
        document.body.appendChild(overlay);
        var closeBtn = overlay.querySelector(".auto-recording-close");
        if (closeBtn) closeBtn.addEventListener("click", dismissAutoRecordingNotice);
    }
    overlay.classList.add("show");
}
function startAutoRecordingOnLaunch() {
    showAutoRecordingNotice();
    if (!isRecording) toggleRecording();
}
function toggleFog() { isFogEnabled = !isFogEnabled; localStorage.setItem(FOG_ENABLED_KEY, String(isFogEnabled)); syncFogButton(); scheduleRender(); }
function getBackgroundGeolocationPlugin() {
    return window.Capacitor && window.Capacitor.Plugins ? window.Capacitor.Plugins.BackgroundGeolocation : null;
}
function isNativeApp() {
    return !!(window.Capacitor && typeof window.Capacitor.isNativePlatform === "function" && window.Capacitor.isNativePlatform());
}
function toPositionFromBackground(location) {
    return {
        coords: {
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
            heading: location.bearing,
            speed: location.speed,
            altitude: location.altitude,
            altitudeAccuracy: location.altitudeAccuracy
        },
        timestamp: location.time || Date.now()
    };
}
function handleBackgroundLocation(location, error) {
    if (error) {
        console.warn("백그라운드 위치 오류", error);
        if (error.code === "NOT_AUTHORIZED") {
            recStatusBox.textContent = "위치 권한 필요";
            var bg = getBackgroundGeolocationPlugin();
            if (bg && typeof bg.openSettings === "function") bg.openSettings();
        }
        return;
    }
    if (!location || !isRecording) return;
    handlePosition(toPositionFromBackground(location));
}
function startBackgroundTracking() {
    var bg = getBackgroundGeolocationPlugin();
    if (!bg || typeof bg.addWatcher !== "function" || backgroundWatchId !== null) return Promise.resolve(false);
    return bg.addWatcher({
        backgroundMessage: "길로아가 경로를 기록하고 있어요",
        backgroundTitle: "길로아 위치 기록 중",
        requestPermissions: true,
        stale: false,
        distanceFilter: 10
    }, handleBackgroundLocation).then(function(id) {
        backgroundWatchId = id;
        return true;
    }).catch(function(error) {
        console.warn("백그라운드 위치 시작 실패", error);
        return false;
    });
}
function stopBackgroundTracking() {
    var bg = getBackgroundGeolocationPlugin();
    if (!bg || typeof bg.removeWatcher !== "function" || backgroundWatchId === null) return Promise.resolve();
    var id = backgroundWatchId;
    backgroundWatchId = null;
    return bg.removeWatcher({ id: id }).catch(function(error) { console.warn("백그라운드 위치 중지 실패", error); });
}
function startForegroundTracking() {
    if (!navigator.geolocation) { alert("이 브라우저는 위치 기록을 지원하지 않습니다."); resetRecordingState(); return; }
    if (!window.isSecureContext && location.hostname !== "localhost" && location.hostname !== "127.0.0.1" && !isNativeApp()) { alert("위치 기록은 HTTPS 또는 localhost에서만 사용할 수 있습니다."); resetRecordingState(); return; }
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    watchId = navigator.geolocation.watchPosition(handlePosition, handleLocationError, { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 });
}
function startTracking() {
    if (isNativeApp()) {
        startBackgroundTracking().then(function(started) {
            if (!started) startForegroundTracking();
        });
        return;
    }
    startForegroundTracking();
}
function stopTracking() {
    if (watchId !== null) { navigator.geolocation.clearWatch(watchId); watchId = null; }
    stopBackgroundTracking();
}

function handlePosition(position) {
    var accuracy = Number(position.coords.accuracy) || Infinity;
    var latlng = L.latLng(position.coords.latitude, position.coords.longitude);
    var heading = position.coords.heading;
    var prevPos = currentPos;
    if (isFinite(heading)) playerHeading = heading;
    else if (prevPos && prevPos.distanceTo(latlng) > 2) playerHeading = bearingBetween(prevPos, latlng);
    currentPos = latlng;
    if (!playerMarker) { playerMarker = L.marker(latlng, { pane: "playerPane", icon: L.divIcon({ className: "player-marker", iconSize: [18, 18] }) }).addTo(map); map.setView(latlng, 16); }
    else { playerMarker.setLatLng(latlng); }
    updateVisionCone(latlng);
    syncImageMissionUI();
    checkNearbyVisitPlaces(latlng);
    if (!isRecording) return;
    if (accuracy > 100) { recStatusBox.textContent = "GPS 정확도 낮음 (" + Math.round(accuracy) + "m)"; return; }
    var now = Number(position.timestamp) || Date.now(); recStatusBox.textContent = accuracy > MAX_ACCURACY_M ? "GPS 보정 중 (" + Math.round(accuracy) + "m)" : "기록 중";
    if (pathCoordinates.length === 0) { pathCoordinates.push(createPathPoint(latlng, now)); checkStayBonus(latlng, now); updateStats(); scheduleSave(); scheduleRender(); return; }
    var last = pathCoordinates[pathCoordinates.length - 1]; var dist = distanceToPoint(latlng, last); var stayThreshold = getDynamicStayThreshold(accuracy);
    if (dist <= stayThreshold) { last.endTime = now; last.visits = (last.visits || 1) + 1; last.lat += (latlng.lat - last.lat) * 0.3; last.lng += (latlng.lng - last.lng) * 0.3; }
    else { totalDistance += dist; pathCoordinates.push(createPathPoint(latlng, now)); if (pathCoordinates.length > MAX_PATH_POINTS) compactPathData(); }
    checkStayBonus(latlng, now); updateStats(); scheduleSave(); scheduleRender();
}

function handleLocationError(err) {
    var messages = { 1: "위치 권한이 거부되었습니다.", 2: "현재 위치를 확인할 수 없습니다.", 3: "위치 요청 시간이 초과되었습니다." };
    alert(messages[err.code] || "위치 정보를 가져오지 못했습니다.");
    resetRecordingState();
}
function createPathPoint(latlng, timestamp) { return { lat: latlng.lat, lng: latlng.lng, startTime: timestamp, endTime: timestamp, visits: 1 }; }
function distanceToPoint(latlng, point) { return latlng.distanceTo([point.lat, point.lng]); }
function getDynamicStayThreshold(accuracy) { return Math.max(MIN_MOVE_M, Math.min(MAX_STAY_RADIUS_M, accuracy * STAY_ACCURACY_FACTOR)); }

function checkStayBonus(latlng, now) {
    if (!stayBonusAnchor) { stayBonusAnchor = latlng; stayBonusStartTime = now; return; }
    if (latlng.distanceTo(stayBonusAnchor) > STAY_BONUS_RADIUS_M) { stayBonusAnchor = latlng; stayBonusStartTime = now; return; }
    if (stayBonusPlaces.some(function(p) { return latlng.distanceTo([p.lat, p.lng]) <= STAY_BONUS_RADIUS_M; })) return;
    var remaining = STAY_BONUS_MS - (now - stayBonusStartTime);
    if (remaining > 0) { recStatusBox.textContent = "기록 중 · 체류 보너스까지 " + Math.ceil(remaining / 60000) + "분"; return; }
    stayBonusPlaces.push({ lat: stayBonusAnchor.lat, lng: stayBonusAnchor.lng }); stayBonusLevelBoost += 1; saveBonusState(); updateStats();
    recStatusBox.textContent = "30분 체류 달성! 레벨 +1 보너스!";
    setTimeout(function() { if (isRecording) recStatusBox.textContent = "기록 중"; }, 4000);
}
function saveBonusState() { localStorage.setItem("giloa-stay-bonus", JSON.stringify({ boost: stayBonusLevelBoost, places: stayBonusPlaces })); }
function loadBonusState() { try { var raw = localStorage.getItem("giloa-stay-bonus"); if (!raw) return; var data = JSON.parse(raw); stayBonusLevelBoost = isFinite(data.boost) ? data.boost : 0; stayBonusPlaces = Array.isArray(data.places) ? data.places.filter(function(p) { return isFinite(p.lat) && isFinite(p.lng); }) : []; } catch (e) { console.warn("���ʽ� ���� ���� ����", e); } }
function calcTodayDistance() { var todayStartMs = new Date().setHours(0, 0, 0, 0); var dist = 0; for (var i = 1; i < pathCoordinates.length; i++) { if (pathCoordinates[i].startTime >= todayStartMs) { dist += L.latLng(pathCoordinates[i].lat, pathCoordinates[i].lng).distanceTo([pathCoordinates[i - 1].lat, pathCoordinates[i - 1].lng]); } } return dist; }

function compactPathData() {
    if (pathCoordinates.length <= 1) return; var merged = [];
    for (var i = 0; i < pathCoordinates.length; i++) { var point = pathCoordinates[i]; var last = merged[merged.length - 1]; if (!last) { merged.push(Object.assign({}, point)); continue; } var timeGap = point.startTime - last.endTime; var dist = L.latLng(point.lat, point.lng).distanceTo([last.lat, last.lng]); if (dist <= MERGE_DISTANCE_M && timeGap <= MERGE_TIME_GAP_MS) { var tv = (last.visits || 1) + (point.visits || 1); last.lat = ((last.lat * (last.visits || 1)) + (point.lat * (point.visits || 1))) / tv; last.lng = ((last.lng * (last.visits || 1)) + (point.lng * (point.visits || 1))) / tv; last.endTime = Math.max(last.endTime, point.endTime); last.visits = tv; } else { merged.push(Object.assign({}, point)); } }
    pathCoordinates = shrinkOldPoints(merged, MAX_PATH_POINTS);
}
function shrinkOldPoints(points, maxPoints) { if (points.length <= maxPoints) return points; var keepTail = Math.floor(maxPoints * 0.4); var tail = points.slice(-keepTail); var head = points.slice(0, points.length - keepTail); var ratio = Math.ceil(head.length / (maxPoints - keepTail)); var filtered = head.filter(function(_, i) { return i % ratio === 0; }); return filtered.concat(tail).slice(-maxPoints); }

function addMemoryAt(lat, lng, defaultName) {
    if (!isFinite(lat) || !isFinite(lng)) { alert("저장할 위치가 올바르지 않습니다."); return; }
    var input = prompt("이 기억의 이름을 입력하세요:", defaultName || "새로운 발걸음");
    if (input === null) return;
    var now = new Date();
    var data = {
        id: String(now.getTime()),
        lat: lat,
        lng: lng,
        name: escapeHtml(input.trim() || "이름 없는 기억"),
        time: now.getTime(),
        dateString: now.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" }),
        timeString: now.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
    };
    memories.push(data);
    createMemoryMarker(data, true);
    updatePhotoList();
    updateStats();
    scheduleSave();
}
function addMemory() {
    if (!currentPos) { alert("위치 정보가 아직 없습니다."); return; }
    addMemoryAt(currentPos.lat, currentPos.lng, "새로운 발걸음");
}
function addPhotoMemory(data) {
    if (!data) return;
    addMemoryAt(data.lat, data.lng, "사진의 기억");
}
function createMemoryMarker(data, openPopup) {
    var marker = L.marker([data.lat, data.lng], { pane: "memoryPane", icon: L.divIcon({ className: "memory-marker", html: "★", iconSize: [28, 28] }) }).addTo(map);
    var popupEl = document.createElement("div"); var title = document.createElement("b"); title.textContent = data.name;
    var info = document.createElement("small"); info.style.display = "block"; info.textContent = data.dateString + " " + (data.timeString || "");
    var delBtn = document.createElement("button"); delBtn.className = "popup-delete-btn"; delBtn.textContent = "삭제";
    delBtn.addEventListener("click", function() { deleteMemory(data.id); });
    popupEl.appendChild(title); popupEl.appendChild(document.createElement("br")); popupEl.appendChild(info); popupEl.appendChild(delBtn);
    marker.bindPopup(popupEl); memoryMarkers.set(data.id, marker); if (openPopup) marker.openPopup();
}
function deleteMemory(id) { memories = memories.filter(function(m) { return m.id !== id; }); var marker = memoryMarkers.get(id); if (marker) { map.removeLayer(marker); memoryMarkers.delete(id); } updateMemoryList(); updateStats(); scheduleSave(); }
function updateMemoryList() {
    var container = document.getElementById("memory-list-container");
    if (!container) return;
    if (memories.length === 0) { container.innerHTML = '<p class="empty-message">아직 기록이 없습니다.</p>'; return; }
    container.innerHTML = "";
    memories.slice().reverse().forEach(function(memo) {
        var item = document.createElement("div"); item.className = "memory-item";
        var name = document.createElement("span"); name.className = "item-name"; name.textContent = "★ " + memo.name;
        var date = document.createElement("span"); date.className = "item-date"; date.textContent = memo.dateString + " " + (memo.timeString || "");
        var actions = document.createElement("div"); actions.className = "memory-actions";
        var moveBtn = document.createElement("button"); moveBtn.className = "memory-action-btn move"; moveBtn.textContent = "이동";
        moveBtn.addEventListener("click", function(e) { e.stopPropagation(); map.flyTo([memo.lat, memo.lng], 17); });
        var delBtn = document.createElement("button"); delBtn.className = "memory-action-btn delete"; delBtn.textContent = "삭제";
        delBtn.addEventListener("click", function(e) { e.stopPropagation(); deleteMemory(memo.id); });
        actions.appendChild(moveBtn); actions.appendChild(delBtn); item.appendChild(name); item.appendChild(date); item.appendChild(actions);
        item.addEventListener("click", function() { map.flyTo([memo.lat, memo.lng], 17); toggleSidebar(false); });
        container.appendChild(item);
    });
}
// ��� �� (���6��) ���� ��ȯ
var ALL_TABS = ["photo", "gpx", "badge", "visit", "item"];
function switchAllTab(tab) {
    ALL_TABS.forEach(function(t) {
        var tabEl = document.getElementById("tab-" + t);
        var panelEl = document.getElementById("panel-" + t);
        if (tabEl) tabEl.classList.toggle("active", t === tab);
        if (panelEl) panelEl.style.display = t === tab ? "" : "none";
    });
    if (tab === "photo") updatePhotoList();
    if (tab === "gpx") updateGpxSavedList();
    if (tab === "badge") updateBadgeList();
    if (tab === "visit") updateVisitList();
    if (tab === "item") updateItemList();
}
function switchTab(tab) { switchAllTab(tab); }
function updateItemList() {
    var container = document.getElementById("item-list");
    if (!container) return;
    if (!items || items.length === 0) { container.innerHTML = '<p class="empty-message">아직 획득한 아이템이 없습니다.</p>'; return; }
    container.innerHTML = "";
    items.slice().reverse().forEach(function(item) {
        var el = document.createElement("div");
        el.className = "item-card";
        el.innerHTML = '<div class="item-icon">' + iconItem + '</div><div class="item-name">' + escapeHtml(item.name || "아이템") + '</div>';
        container.appendChild(el);
    });
}

function switchCollectionTab(tab) { switchAllTab(tab); }
function updatePhotoList() {
    var container = document.getElementById("photo-list-container");
    if (!container) return;
    if (photos.length === 0) { container.innerHTML = '<p class="empty-message" style="grid-column:1/-1">아직 사진이 없습니다.</p>'; return; }
    container.innerHTML = "";
    photos.slice().reverse().forEach(function(p) {
        var item = document.createElement("div"); item.className = "photo-list-item";
        var src = getPhotoDisplaySrc(p);
        if (src) {
            var img = document.createElement("img");
            img.src = src;
            img.onerror = function() { item.classList.add("photo-missing"); img.remove(); };
            item.appendChild(img);
        } else {
            item.classList.add("photo-missing");
        }
        var date = document.createElement("div"); date.className = "photo-list-date"; date.textContent = p.photoTitle || p.dateString;
        var meta = document.createElement("div"); meta.className = "photo-list-meta"; meta.textContent = p.photoNote ? p.photoNote : p.dateString;
        var edit = document.createElement("div"); edit.className = "photo-list-edit"; edit.textContent = "수정";
        var del = document.createElement("div"); del.className = "photo-list-del"; del.textContent = "x";
        del.addEventListener("click", function(e) { e.stopPropagation(); deletePhoto(p.id); updatePhotoList(); });
        item.addEventListener("click", function() { openPhotoDetail(p); });
        item.addEventListener("contextmenu", function(e) { e.preventDefault(); focusPhotoOnMap(p); });
        item.title = "사진 내용 수정";
        item.appendChild(date); item.appendChild(meta); item.appendChild(edit); item.appendChild(del); container.appendChild(item);
    });
}
function findPhotoMarker(id) { var found = null; photoClusterGroup.eachLayer(function(layer) { if (layer._photoData && layer._photoData.id === id) found = layer; }); return found; }
function adjustHourDial(dir) { var next = dialHours + dir; if (next < 1 || next > 20) return; dialHours = next; updateDialUI(); }
function updateDialUI() {
    var labelEl = document.getElementById("dial-hour-label");
    var infoEl = document.getElementById("gpx-range-info");
    if (labelEl) labelEl.textContent = dialHours + "시간";
    if (infoEl) infoEl.textContent = "오늘 기준 최근 " + dialHours + "시간 발걸음";
}
function exportGpx() {
    var sinceMs = Date.now() - dialHours * 60 * 60 * 1000;
    var filtered = pathCoordinates.filter(function(p) { return p.startTime >= sinceMs; });
    if (filtered.length === 0) { alert("해당 시간에 기록된 발걸음이 없습니다."); return; }
    var nameInput = document.getElementById("gpx-export-name").value.trim();
    var name = nameInput || "발걸음 최근" + dialHours + "시간";
    var trkpts = filtered.map(function(p) {
        var t = new Date(p.startTime).toISOString();
        return '    <trkpt lat="' + p.lat.toFixed(7) + '" lon="' + p.lng.toFixed(7) + '">\n      <time>' + t + '</time>\n    </trkpt>';
    }).join("\n");
    var gpxContent = '<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="Giloa - 걷기 기록"\n     xmlns="http://www.topografix.com/GPX/1/1">\n  <metadata><name>' + name + '</name><time>' + new Date().toISOString() + '</time></metadata>\n  <trk><name>' + name + '</name><trkseg>\n' + trkpts + '\n  </trkseg></trk>\n</gpx>';
    var saves = loadGpxSaves(); var id = String(Date.now());
    saves.push({ id: id, name: name, createdAt: Date.now(), pointCount: filtered.length, gpxContent: gpxContent });
    saveGpxSaves(saves); updateGpxSavedList();
    var blob = new Blob([gpxContent], { type: "application/gpx+xml" }); var url = URL.createObjectURL(blob); var a = document.createElement("a");
    a.href = url; a.download = "giloa_" + name + ".gpx"; a.click(); URL.revokeObjectURL(url);
    document.getElementById("gpx-export-name").value = "";
    document.getElementById("gpx-import-status").textContent = '✓ "' + name + '" 저장 완료';
}
function loadGpxSaves() { try { return JSON.parse(localStorage.getItem(GPX_SAVES_KEY) || "[]"); } catch(e) { return []; } }
function saveGpxSaves(saves) { localStorage.setItem(GPX_SAVES_KEY, JSON.stringify(saves)); }
function updateGpxSavedList() {
    var container = document.getElementById("gpx-saved-list");
    if (!container) return;
    var saves = loadGpxSaves();
    if (saves.length === 0) { container.innerHTML = '<p class="empty-message">저장된 발걸음이 없습니다.</p>'; return; }
    container.innerHTML = "";
    saves.slice().reverse().forEach(function(s) {
        var item = document.createElement("div"); item.className = "gpx-saved-item" + (s.id === activeGpxId ? " active-route" : "");
        var icon = document.createElement("span"); icon.className = "gpx-saved-icon"; icon.textContent = s.id === activeGpxId ? "✓" : "↗";
        var info = document.createElement("div"); info.className = "gpx-saved-info";
        var nameEl = document.createElement("div"); nameEl.className = "gpx-saved-name"; nameEl.textContent = s.name;
        var meta = document.createElement("div"); meta.className = "gpx-saved-meta"; meta.textContent = new Date(s.createdAt).toLocaleDateString("ko-KR") + " · " + s.pointCount + "개 지점";
        info.appendChild(nameEl); info.appendChild(meta);
        var del = document.createElement("div"); del.className = "gpx-saved-del"; del.textContent = "×";
        del.addEventListener("click", function(e) { e.stopPropagation(); deleteGpxSave(s.id); });
        item.appendChild(icon); item.appendChild(info); item.appendChild(del);
        item.addEventListener("click", function() { toggleGpxRoute(s); });
        container.appendChild(item);
    });
}
function deleteGpxSave(id) { if (id === activeGpxId) clearActiveGpxRoute(); saveGpxSaves(loadGpxSaves().filter(function(s) { return s.id !== id; })); updateGpxSavedList(); }
function toggleGpxRoute(save) { if (activeGpxId === save.id) { clearActiveGpxRoute(); updateGpxSavedList(); return; } clearActiveGpxRoute(); drawGpxRoute(save.gpxContent, save.id); updateGpxSavedList(); toggleSidebar(false); }
function clearActiveGpxRoute() { activeGpxLayers.forEach(function(l) { map.removeLayer(l); }); activeGpxLayers = []; activeGpxId = null; }
function drawGpxRoute(gpxContent, id) {
    var parser = new DOMParser(); var xmlDoc = parser.parseFromString(gpxContent, "application/xml"); var trkpts = xmlDoc.querySelectorAll("trkpt"); var latlngs = [];
    trkpts.forEach(function(pt) { var lat = parseFloat(pt.getAttribute("lat")); var lng = parseFloat(pt.getAttribute("lon")); if (isFinite(lat) && isFinite(lng)) latlngs.push([lat, lng]); });
    if (latlngs.length === 0) return;
    var polyline = L.polyline(latlngs, { color: "#4db8ff", weight: 4, opacity: 0.85, dashArray: "8, 6" }).addTo(map);
    var startM = L.circleMarker(latlngs[0], { radius: 7, color: "#4db8ff", fillColor: "#fff", fillOpacity: 1, weight: 2.5 }).addTo(map).bindTooltip("시작");
    var endM = L.circleMarker(latlngs[latlngs.length - 1], { radius: 7, color: "#ff6b6b", fillColor: "#fff", fillOpacity: 1, weight: 2.5 }).addTo(map).bindTooltip("끝");
    activeGpxLayers = [polyline, startM, endM]; activeGpxId = id; map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
}
function importGpxFile(event) {
    var file = event.target.files[0]; if (!file) return;
    var statusEl = document.getElementById("gpx-import-status"); statusEl.textContent = "읽는 중...";
    var reader = new FileReader();
    reader.onload = function(e) {
        try {
            var name = file.name.replace(".gpx", ""); var gpxContent = e.target.result;
            var trkpts = new DOMParser().parseFromString(gpxContent, "application/xml").querySelectorAll("trkpt");
            if (trkpts.length === 0) { statusEl.textContent = "경로 없음"; return; }
            var saves = loadGpxSaves(); var id = String(Date.now());
            saves.push({ id: id, name: name, createdAt: Date.now(), pointCount: trkpts.length, gpxContent: gpxContent });
            saveGpxSaves(saves); clearActiveGpxRoute(); drawGpxRoute(gpxContent, id); updateGpxSavedList();
            statusEl.textContent = '✓ "' + name + '" 불러오기 완료'; toggleSidebar(false);
        } catch (err) { statusEl.textContent = "파일을 읽지 못했습니다."; console.error(err); }
    };
    reader.readAsText(file); event.target.value = "";
}
function toggleSidebar(forceOpen) { var sidebar = document.getElementById("sidebar"); var overlay = document.getElementById("sidebar-overlay"); if (!sidebar || !overlay) return; var willOpen = typeof forceOpen === "boolean" ? forceOpen : !sidebar.classList.contains("open"); sidebar.classList.toggle("open", willOpen); overlay.classList.toggle("show", willOpen); }
function centerMap() { if (currentPos) map.panTo(currentPos); }
function scheduleSave() { if (saveTimer !== null) clearTimeout(saveTimer); saveTimer = setTimeout(function() { saveTimer = null; compactPathData(); persistState(); }, SAVE_DELAY_MS); }

function persistState() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            pathCoordinates: pathCoordinates.map(function(p) { return { lat: p.lat, lng: p.lng, startTime: p.startTime, endTime: p.endTime, visits: p.visits || 1 }; }),
            memories: memories.map(function(m) { return { id: m.id, lat: m.lat, lng: m.lng, name: m.name, time: m.time, dateString: m.dateString, timeString: m.timeString }; }),
            photos: photos.map(function(p) {
                return {
                    id: p.id,
                    lat: p.lat,
                    lng: p.lng,
                    time: p.time,
                    dateString: p.dateString,
                    timeString: p.timeString,
                    sourceUri: typeof p.sourceUri === "string" ? p.sourceUri : "",
                    sourceWebPath: typeof p.sourceWebPath === "string" ? p.sourceWebPath : "",
                    sourceType: typeof p.sourceType === "string" ? p.sourceType : "",
                    locationSource: typeof p.locationSource === "string" ? p.locationSource : "fallback",
                    photoTitle: typeof p.photoTitle === "string" ? p.photoTitle : "",
                    photoNote: typeof p.photoNote === "string" ? p.photoNote : ""
                };
            }),
            totalDistance: totalDistance
        }));
    } catch (e) {
        console.error("���� ����", e);
        if (e && e.name === "QuotaExceededError") alert("���� ������ �����մϴ�.");
    }
}

function loadState() {
    try {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        var saved = JSON.parse(raw);
        if (Array.isArray(saved.pathCoordinates)) {
            pathCoordinates = saved.pathCoordinates.filter(function(p) { return isFinite(p.lat) && isFinite(p.lng) && isFinite(p.startTime) && isFinite(p.endTime); }).map(function(p) { return { lat: p.lat, lng: p.lng, startTime: p.startTime, endTime: p.endTime, visits: isFinite(p.visits) ? p.visits : 1 }; });
        }
        if (Array.isArray(saved.memories)) {
            memories = saved.memories.filter(function(m) { return isFinite(m.lat) && isFinite(m.lng) && typeof m.name === "string"; }).map(function(m) { return { id: typeof m.id === "string" ? m.id : String(m.time), lat: m.lat, lng: m.lng, name: m.name, time: m.time, dateString: m.dateString, timeString: typeof m.timeString === "string" ? m.timeString : new Date(m.time).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }) }; });
        }
        if (isFinite(saved.totalDistance)) totalDistance = saved.totalDistance;
        if (Array.isArray(saved.photos)) {
            photos = saved.photos.filter(function(p) { return isFinite(p.lat) && isFinite(p.lng) && p.id; }).map(function(p) {
                return {
                    id: p.id,
                    lat: p.lat,
                    lng: p.lng,
                    time: p.time,
                    dateString: p.dateString,
                    timeString: p.timeString,
                    sourceUri: typeof p.sourceUri === "string" ? p.sourceUri : "",
                    sourceWebPath: typeof p.sourceWebPath === "string" ? p.sourceWebPath : "",
                    sourceType: typeof p.sourceType === "string" ? p.sourceType : "",
                    locationSource: typeof p.locationSource === "string" ? p.locationSource : "fallback",
                    photoTitle: typeof p.photoTitle === "string" ? p.photoTitle : "",
                    photoNote: typeof p.photoNote === "string" ? p.photoNote : ""
                };
            });
        }
        isFogEnabled = true;
        localStorage.setItem(FOG_ENABLED_KEY, "true");
        compactPathData();
    } catch (e) {
        console.error("���� ����", e);
    }
}

// ���� ���� ó�� ����
function processPhoto(img, now, lat, lng, options) {
    options = options || {};
    var thumb = resizeImage(img, { maxSize: PHOTO_THUMB_SIZE, quality: PHOTO_THUMB_JPEG_QUALITY, minQuality: PHOTO_THUMB_MIN_QUALITY, targetBytes: PHOTO_THUMB_TARGET_BYTES });
    var popup = PHOTO_STORE_PREVIEW
        ? resizeImage(img, { maxSize: PHOTO_POPUP_MAX_SIZE, quality: PHOTO_POPUP_JPEG_QUALITY, minQuality: PHOTO_POPUP_MIN_QUALITY, targetBytes: PHOTO_POPUP_TARGET_BYTES })
        : "";
    var previewSrc = popup || thumb;
    var id = String(now.getTime()) + Math.random().toString(36).slice(2);
    var data = {
        id: id, lat: lat, lng: lng, photo: previewSrc, thumb: thumb, time: now.getTime(),
        dateString: now.toLocaleDateString("ko-KR", { year:"numeric", month:"long", day:"numeric" }),
        timeString: now.toLocaleTimeString("ko-KR", { hour:"2-digit", minute:"2-digit" }),
        photoTitle: "",
        photoNote: "",
        sourceUri: typeof options.sourceUri === "string" ? options.sourceUri : "",
        sourceWebPath: typeof options.sourceWebPath === "string" ? options.sourceWebPath : "",
        sourceType: typeof options.sourceType === "string" ? options.sourceType : "",
        locationSource: typeof options.locationSource === "string" ? options.locationSource : "fallback"
    };
    photos.push(data);
    idbSavePhoto(id, popup, thumb).catch(function(e) { console.warn("IDB 저장 실패", e); });
    createPhotoMarker(data, options.openPopup !== false);
    if (!options.deferUi) {
        updateStats();
        scheduleSave();
        updatePhotoList();
        setTimeout(function() { openPhotoDetail(data); }, 60);
    }
    return data;
}
function parseExifCoord(value, ref) {
    if (value === null || value === undefined) return null;
    var result = null;
    if (typeof value === "number") result = value;
    else if (Array.isArray(value) && value.length >= 3) {
        var d = parseExifRational(value[0]);
        var m = parseExifRational(value[1]);
        var s = parseExifRational(value[2]);
        result = d + m / 60 + s / 3600;
    } else if (typeof value === "string") {
        var n = parseFloat(value);
        if (isFinite(n)) result = n;
    }
    if (!isFinite(result)) return null;
    ref = String(ref || "").toUpperCase();
    return ref === "S" || ref === "W" ? -Math.abs(result) : result;
}
function parseExifRational(value) {
    if (typeof value === "number") return value;
    if (Array.isArray(value) && value.length >= 2) return Number(value[0]) / Number(value[1] || 1);
    if (value && typeof value === "object") {
        if (isFinite(value.numerator) && isFinite(value.denominator)) return Number(value.numerator) / Number(value.denominator || 1);
        if (isFinite(value.num) && isFinite(value.den)) return Number(value.num) / Number(value.den || 1);
    }
    return parseFloat(value) || 0;
}
function gpsFromExifObject(exif) {
    if (!exif || typeof exif !== "object") return null;
    var lat = parseExifCoord(exif.GPSLatitude || exif.gpsLatitude || exif.latitude, exif.GPSLatitudeRef || exif.gpsLatitudeRef || exif.latitudeRef);
    var lng = parseExifCoord(exif.GPSLongitude || exif.gpsLongitude || exif.longitude, exif.GPSLongitudeRef || exif.gpsLongitudeRef || exif.longitudeRef);
    if (!isFinite(lat) || !isFinite(lng)) return null;
    return { lat: lat, lng: lng };
}
async function readUrlAsArrayBuffer(url) {
    if (!url) return null;
    var response = await fetch(url);
    if (!response || !response.ok) return null;
    return response.arrayBuffer();
}
async function getPhotoExifGps(photo) {
    var fromObject = gpsFromExifObject(photo && photo.exif);
    if (fromObject) return fromObject;
    var url = photo && (photo.webPath || photo.path || photo.uri);
    try {
        var buffer = await readUrlAsArrayBuffer(url);
        return buffer ? parseExifGps(buffer) : null;
    } catch (e) {
        console.warn("���� EXIF ��ġ �б� ����", e);
        return null;
    }
}
// EXIF GPS �Ľ� (���̺귯�� ���� ���� ���� - �� ������)
function parseExifGps(buffer) {
    try {
        var view = new DataView(buffer);
        if (view.getUint16(0) !== 0xFFD8) return null; // JPEG �ƴ�
        var offset = 2;
        while (offset < view.byteLength - 2) {
            var marker = view.getUint16(offset);
            if (marker === 0xFFE1) { // APP1 (EXIF)
                var segLen = view.getUint16(offset + 2);
                var exifHeader = "";
                for (var i = 0; i < 4; i++) exifHeader += String.fromCharCode(view.getUint8(offset + 4 + i));
                if (exifHeader !== "Exif") break;
                var tiffBase = offset + 10;
                var endian = view.getUint16(tiffBase);
                var le = (endian === 0x4949); // little endian
                var r16 = function(o) { return view.getUint16(tiffBase + o, le); };
                var r32 = function(o) { return view.getUint32(tiffBase + o, le); };
                var ifd0 = r32(4);
                var n = r16(ifd0);
                var gpsOffset = null;
                for (var j = 0; j < n; j++) {
                    var e = ifd0 + 2 + j * 12;
                    if (r16(e) === 0x8825) { gpsOffset = r32(e + 8); break; }
                }
                if (gpsOffset === null) return null;
                var gn = r16(gpsOffset);
                var latRef, lat, lngRef, lng;
                for (var k = 0; k < gn; k++) {
                    var ge = gpsOffset + 2 + k * 12;
                    var tag = r16(ge);
                    var voff = r32(ge + 8);
                    if (tag === 1) latRef = String.fromCharCode(view.getUint8(tiffBase + voff));
                    if (tag === 3) lngRef = String.fromCharCode(view.getUint8(tiffBase + voff));
                    if (tag === 2 || tag === 4) {
                        var d = r32(voff) / r32(voff + 4);
                        var m = r32(voff + 8) / r32(voff + 12);
                        var s = r32(voff + 16) / r32(voff + 20);
                        var val = d + m / 60 + s / 3600;
                        if (tag === 2) lat = val;
                        if (tag === 4) lng = val;
                    }
                }
                if (!isFinite(lat) || !isFinite(lng)) return null;
                return {
                    lat: latRef === "S" ? -lat : lat,
                    lng: lngRef === "W" ? -lng : lng
                };
            }
            if (marker === 0xFFDA) break; // SOS, EXIF ����
            offset += 2 + view.getUint16(offset + 2);
        }
    } catch(e) { console.warn("EXIF �Ľ� ����", e); }
    return null;
}

function estimateDataUrlBytes(dataUrl) {
    var commaIndex = dataUrl.indexOf(",");
    if (commaIndex < 0) return 0;
    var base64Length = dataUrl.length - commaIndex - 1;
    return Math.ceil(base64Length * 0.75);
}

function resizeImage(img, options) {
    options = options || {};
    var maxSize = options.maxSize || 1024;
    var quality = typeof options.quality === "number" ? options.quality : 0.85;
    var minQuality = typeof options.minQuality === "number" ? options.minQuality : quality;
    var targetBytes = typeof options.targetBytes === "number" ? options.targetBytes : 0;
    var canvas = document.createElement("canvas");
    var w = img.width;
    var h = img.height;
    if (w > h && w > maxSize) {
        h = Math.round(h * maxSize / w);
        w = maxSize;
    } else if (h > maxSize) {
        w = Math.round(w * maxSize / h);
        h = maxSize;
    }
    canvas.width = w;
    canvas.height = h;
    var ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, w, h);
    var dataUrl = canvas.toDataURL("image/jpeg", quality);
    if (targetBytes > 0) {
        var currentQuality = quality;
        while (estimateDataUrlBytes(dataUrl) > targetBytes && currentQuality > minQuality) {
            currentQuality = Math.max(minQuality, currentQuality - 0.06);
            dataUrl = canvas.toDataURL("image/jpeg", currentQuality);
            if (currentQuality === minQuality) break;
        }
    }
    return dataUrl;
}

function isJpegFile(file) { return /image\/jpe?g/i.test(file.type) || /\.(jpe?g)$/i.test(file.name); }
function isHeicFile(file) { return /image\/hei[cf]/i.test(file.type) || /\.(hei[cf])$/i.test(file.name); }

function readFileAsArrayBuffer(file) {
    return new Promise(function(resolve, reject) {
        var reader = new FileReader();
        reader.onload = function(e) { resolve(e.target.result); };
        reader.onerror = function() { reject(reader.error || new Error("���� �б� ����")); };
        reader.readAsArrayBuffer(file);
    });
}

function loadImageFromFile(file) {
    return new Promise(function(resolve, reject) {
        var url = URL.createObjectURL(file);
        var img = new Image();
        img.onload = function() { URL.revokeObjectURL(url); resolve(img); };
        img.onerror = function(err) { URL.revokeObjectURL(url); reject(err || new Error("�̹��� �ε� ����")); };
        img.src = url;
    });
}

function loadImageFromUrl(url) {
    return new Promise(function(resolve, reject) {
        if (!url) { reject(new Error("이미지 주소 없음")); return; }
        var img = new Image();
        img.onload = function() { resolve(img); };
        img.onerror = function(err) { reject(err || new Error("�̹��� �ε� ����")); };
        img.src = url;
    });
}

function ensureHeic2Any() {
    if (typeof window.heic2any === "function") return Promise.resolve(window.heic2any);
    if (heicLoaderPromise) return heicLoaderPromise;
    heicLoaderPromise = new Promise(function(resolve, reject) {
        var script = document.createElement("script");
        script.src = "./heic2any.min.js";
        script.async = true;
        script.onload = function() {
            if (typeof window.heic2any === "function") resolve(window.heic2any);
            else reject(new Error("heic2any �ε� ����"));
        };
        script.onerror = function() { reject(new Error("heic2any ��ũ��Ʈ �ε� ����")); };
        document.head.appendChild(script);
    }).catch(function(err) {
        heicLoaderPromise = null;
        throw err;
    });
    return heicLoaderPromise;
}

async function convertHeicToJpegFile(file) {
    if (!isHeicFile(file)) return file;
    var heic2any = await ensureHeic2Any();
    var converted = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.95 });
    var blob = Array.isArray(converted) ? converted[0] : converted;
    var name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    if (typeof File === "function") return new File([blob], name, { type: "image/jpeg", lastModified: Date.now() });
    blob.name = name;
    return blob;
}

async function handlePhotos(event) {
    var files = Array.from(event.target.files || []);
    if (!files.length) return;
    var loadedCount = 0;
    var failedCount = 0;
    var lastPhoto = null;
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        if (recStatusBox) recStatusBox.textContent = "���� ó�� �� " + (i + 1) + "/" + files.length;
        try {
            var gps = null;
            if (isJpegFile(file)) {
                try { gps = parseExifGps(await readFileAsArrayBuffer(file)); } catch (e) { console.warn("EXIF �б� ����:", file.name, e); }
            }
            var lat = gps ? gps.lat : (currentPos ? currentPos.lat : map.getCenter().lat);
            var lng = gps ? gps.lng : (currentPos ? currentPos.lng : map.getCenter().lng);
            var normalizedFile = await convertHeicToJpegFile(file);
            var img = await loadImageFromFile(normalizedFile);
            lastPhoto = processPhoto(img, new Date(), lat, lng, { deferUi: true, openPopup: files.length === 1, sourceType: "file-input", locationSource: gps ? "exif" : "fallback", mission: activeImageMission ? { name: activeImageMission.name } : null });
            loadedCount += 1;
        } catch (e) {
            failedCount += 1;
            console.warn("���� ó�� ����:", file.name, e);
        }
    }
    if (loadedCount > 0) {
        updateStats();
        scheduleSave();
        updatePhotoList();
        if (lastPhoto) setTimeout(function() { openPhotoDetail(lastPhoto); }, 80);
    }
    event.target.value = "";
    syncRecordingUI();
    if (failedCount > 0) alert("�Ϻ� ����(" + failedCount + "��)�� ó������ ���߽��ϴ�.");
}
function createPhotoMarker(data, openPopup) {
    var size = getPhotoMarkerSize();
    lastPhotoMarkerSize = size;
    var markerSrc = getPhotoDisplaySrc(data);
    if (!markerSrc) return;
    var marker = L.marker([data.lat, data.lng], { pane: "photoPane", icon: buildPhotoMarkerIcon(markerSrc, size) });
    marker._photoData = data;
    var popupEl = document.createElement("div");
    popupEl.className = "photo-popup";
    var img = document.createElement("img");
    img.src = data.photo || markerSrc;
    img.style.cssText = "width:72vw;max-width:280px;border-radius:8px;margin-bottom:8px;display:block;cursor:pointer;";
    img.title = "사진 내용 수정";
    img.addEventListener("click", function(e) { e.stopPropagation(); openPhotoDetail(data); });
    var info = document.createElement("div");
    info.style.cssText = "font-size:12px;color:rgba(255,255,255,0.72);text-align:center;margin:6px 0 8px;font-weight:600;";
    info.textContent = data.photoTitle || (data.dateString + " " + data.timeString);
    var note = document.createElement("div");
    note.style.cssText = "font-size:11px;color:rgba(255,255,255,0.52);text-align:center;margin:0 0 8px;line-height:1.5;";
    note.textContent = data.photoNote || ((data.locationSource === "exif" ? "EXIF 위치" : "현재 위치 기준") + " · 사진을 누르면 내용을 수정합니다");
    var delBtn = document.createElement("button");
    delBtn.className = "popup-delete-btn";
    delBtn.textContent = "사진 삭제";
    delBtn.addEventListener("click", function() { deletePhoto(data.id); marker.closePopup(); });
    popupEl.appendChild(img); popupEl.appendChild(info); popupEl.appendChild(note); popupEl.appendChild(delBtn);
    marker.bindPopup(popupEl);
    photoClusterGroup.addLayer(marker);
    if (openPopup) marker.openPopup();
}
function deletePhoto(id) {
    photos = photos.filter(function(p) { return p.id !== id; });
    if (activePhotoEditId === id) closePhotoDetail();
    var marker = findPhotoMarker(id);
    if (marker) photoClusterGroup.removeLayer(marker);
    idbDeletePhoto(id).catch(function(e) { console.warn("IDB 삭제 실패", e); });
    updateStats(); updatePhotoList(); scheduleSave();
}
function escapeHtml(value) { return String(value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"); }
function renderStoredMarkers() {}
async function restoreMissingPhotoImage(data) {
    if (!data || data.thumb || data.photo) return false;
    var source = data.sourceWebPath || data.sourceUri || "";
    if (!source) return false;
    try {
        var img = await loadImageFromUrl(source);
        var thumb = resizeImage(img, { maxSize: PHOTO_THUMB_SIZE, quality: PHOTO_THUMB_JPEG_QUALITY, minQuality: PHOTO_THUMB_MIN_QUALITY, targetBytes: PHOTO_THUMB_TARGET_BYTES });
        data.thumb = thumb;
        data.photo = thumb;
        await idbSavePhoto(data.id, "", thumb);
        return true;
    } catch (e) {
        console.warn("사진 썸네일 복구 실패", data.id, e);
        return false;
    }
}
function renderStoredPhotoMarkers() {
    if (photos.length === 0) return;
    idbGetAllPhotos().then(function(idbList) {
        var idbMap = new Map(idbList.map(function(r) { return [r.id, r]; }));
        var restoreTasks = [];
        photos.forEach(function(p) {
            var img = idbMap.get(p.id);
            if (img) {
                p.thumb = img.thumb || img.photo || p.thumb;
                p.photo = img.photo || p.thumb;
            } else {
                restoreTasks.push(restoreMissingPhotoImage(p));
            }
            var markerSrc = getPhotoDisplaySrc(p);
            if (markerSrc) {
                p.thumb = p.thumb || markerSrc;
                p.photo = p.photo || markerSrc;
                createPhotoMarker(p, false);
            }
        });
        updatePhotoList();
        if (restoreTasks.length) {
            Promise.all(restoreTasks).then(function(results) {
                if (!results.some(Boolean)) return;
                photoClusterGroup.clearLayers();
                photos.forEach(function(p) {
                    var markerSrc = getPhotoDisplaySrc(p);
                    if (!markerSrc) return;
                    p.thumb = p.thumb || markerSrc;
                    p.photo = p.photo || markerSrc;
                    createPhotoMarker(p, false);
                });
                updatePhotoList();
                scheduleSave();
            });
        }
    }).catch(function(e) { console.warn("IDB �ҷ����� ����", e); });
}
function initGpxDial() { dialHours = 12; updateDialUI(); }
function initHudTapTargets() {
    var photoItem = document.getElementById("hud-photo-link");
    var visitItem = document.getElementById("hud-visit-link");
    if (photoItem) { photoItem.style.cursor = "pointer"; photoItem.addEventListener("click", function() { toggleSidebar(true); switchTab("photo"); }); }
    if (visitItem) { visitItem.style.cursor = "pointer"; visitItem.addEventListener("click", function() { toggleSidebar(true); switchTab("visit"); }); }
}

function init() {
    resizeCanvas();
    loadState();
    loadBonusState();
    loadCollection();
    renderStoredMarkers();
    migratePhotosToThumbOnly().finally(function() { renderStoredPhotoMarkers(); });
    updateStats();
    updateMemoryList();
    syncRecordingUI();
    syncFogButton();
    applyUILang(currentLang);
    setTimeout(function() { render(); scheduleRender(); }, 100);
    initGpxDial();
    initHudTapTargets();
    setTimeout(startAutoRecordingOnLaunch, 800);
}
map.whenReady(function() { setTimeout(init, 0); });

// ���� TourAPI ������ ��õ ����
var TOUR_API_KEY = "c6995449e23f94083d88f198fe2617a8f957a2063bc6ac0d19816c9f27a0ed6c";
var TOUR_API_BASES = { ko: "KorService2", en: "EngService2", ja: "JpnService2", zh: "ChsService2" };
function getTourApiBase(lang) { return "https://apis.data.go.kr/B551011/" + (TOUR_API_BASES[lang || currentLang] || TOUR_API_BASES.ko); }
function getTourEndpoint(path, lang) { return getTourApiBase(lang) + "/" + path; }
function formatTourCount(count) { var suffix = ((UI_TEXT[currentLang] || UI_TEXT.ko).count_suffix); return currentLang === "ko" || currentLang === "ja" || currentLang === "zh" ? String(count) + suffix : String(count) + " " + suffix; }
var tourItems = []; var festivalItems = []; var tourExpanded = false;
var tourFetchTimer = null; var tourMarkers = []; var TOUR_VISIBLE_COUNT = 3;
var TOUR_TYPE_NAMES = {
    ko: { "12": "관광지", "14": "문화시설", "15": "축제/행사", "25": "여행코스", "28": "레포츠", "32": "숙박", "38": "쇼핑", "39": "음식점" },
    en: { "12": "Attraction", "14": "Culture", "15": "Festival", "25": "Course", "28": "Leports", "32": "Stay", "38": "Shopping", "39": "Food" },
    ja: { "12": "観光地", "14": "文化施設", "15": "祭り", "25": "旅行コース", "28": "レポーツ", "32": "宿泊", "38": "ショッピング", "39": "グルメ" },
    zh: { "12": "景点", "14": "文化设施", "15": "庆典", "25": "旅行路线", "28": "休闲运动", "32": "住宿", "38": "购物", "39": "美食" }
};
var TOUR_TYPE_LABELS = {
    ko: { "25": "여행", "28": "레포츠", "38": "쇼핑", "15": "축제", "12": "관광", "14": "문화", default: "관광" },
    en: { "25": "Course", "28": "Leports", "38": "Shop", "15": "Fest", "12": "Spot", "14": "Culture", default: "Spot" },
    ja: { "25": "コース", "28": "レポーツ", "38": "買物", "15": "祭り", "12": "観光", "14": "文化", default: "観光" },
    zh: { "25": "路线", "28": "运动", "38": "购物", "15": "庆典", "12": "景点", "14": "文化", default: "景点" }
};
function getTourTypeName(contentTypeId) { var names = TOUR_TYPE_NAMES[currentLang] || TOUR_TYPE_NAMES.ko; return names[String(contentTypeId)] || names["12"]; }
function getTourTypeLabel(contentTypeId) { var labels = TOUR_TYPE_LABELS[currentLang] || TOUR_TYPE_LABELS.ko; return labels[String(contentTypeId)] || labels.default; }
var TOUR_TYPE_META = {
    "25": { label: "여행", color: "#ef4444", fill: "rgba(239,68,68,0.18)", border: "rgba(239,68,68,0.55)" },
    "28": { label: "레포츠", color: "#38bdf8", fill: "rgba(56,189,248,0.18)", border: "rgba(56,189,248,0.55)" },
    "38": { label: "쇼핑", color: "#facc15", fill: "rgba(250,204,21,0.18)", border: "rgba(250,204,21,0.58)" },
    "15": { label: "축제", color: "#c084fc", fill: "rgba(192,132,252,0.18)", border: "rgba(192,132,252,0.58)" },
    "12": { label: "관광", color: "#fb923c", fill: "rgba(251,146,60,0.18)", border: "rgba(251,146,60,0.58)" },
    "14": { label: "문화", color: "#a78bfa", fill: "rgba(167,139,250,0.18)", border: "rgba(167,139,250,0.58)" },
    default: { label: "관광", color: "#fb923c", fill: "rgba(251,146,60,0.18)", border: "rgba(251,146,60,0.58)" }
};
function getTourTypeMeta(contentTypeId) { var meta = TOUR_TYPE_META[String(contentTypeId)] || TOUR_TYPE_META.default; return Object.assign({}, meta, { label: getTourTypeLabel(contentTypeId) }); }
function applyTourTypeVars(el, meta) { el.style.setProperty("--tour-color", meta.color); el.style.setProperty("--tour-fill", meta.fill); el.style.setProperty("--tour-border", meta.border); }

function getTodayString() {
    var d = new Date();
    var mm = String(d.getMonth() + 1).padStart(2, "0");
    var dd = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + mm + dd;
}

function fetchFestivals() {
    var center = map.getCenter();
    var today = getTodayString();
    var requestLang = currentLang;
    var buildUrl = function(lang) { return getTourEndpoint("searchFestival2", lang) + "?serviceKey=" + TOUR_API_KEY + "&eventStartDate=" + today + "&mapX=" + center.lng.toFixed(6) + "&mapY=" + center.lat.toFixed(6) + "&radius=50000" + "&numOfRows=20&pageNo=1&MobileOS=ETC&MobileApp=Giloa&_type=json&arrange=E"; };
    fetchTourJsonWithFallback(buildUrl, requestLang).then(function(data) {
        var body = data && data.response && data.response.body;
        var items = [];
        if (body && body.items && body.items.item) { items = Array.isArray(body.items.item) ? body.items.item : [body.items.item]; }
        festivalItems = items; markTourItemsSource(festivalItems, data._giloaSourceLang || requestLang); translateTourItemsForLang(currentLang, festivalItems);
        updateFestivalBadge();
        if (currentPos) checkNearbyVisitPlaces(currentPos);
        if (tourExpanded) renderFestivalStrip();
    }).catch(function(err) { console.warn("���� API ����", err); });
}

function updateFestivalBadge() {
    var badge = document.getElementById("tour-festival-badge");
    if (!badge) return;
    if (festivalItems.length > 0) { badge.textContent = (UI_TEXT[currentLang] || UI_TEXT.ko).festival_badge + " " + festivalItems.length; badge.classList.add("show"); }
    else { badge.classList.remove("show"); }
}

function renderFestivalStrip() {
    var label = document.getElementById("festival-strip-label");
    var strip = document.getElementById("festival-strip");
    if (!strip || !label) return;
    if (festivalItems.length === 0) { strip.classList.remove("show"); label.classList.remove("show"); return; }
    strip.innerHTML = "";
    var center = map.getCenter();
    festivalItems.forEach(function(item) {
        var card = document.createElement("div"); card.className = "festival-card"; applyTourTypeVars(card, getTourTypeMeta("15"));
        var typeEl = document.createElement("div"); typeEl.className = "tour-card-type"; typeEl.textContent = getTourTypeName("15");
        var nameEl = document.createElement("div"); nameEl.className = "festival-card-name"; nameEl.textContent = getTourDisplayTitle(item) || "?? ??";
        var dateEl = document.createElement("div"); dateEl.className = "festival-card-date";
        var start = item.eventstartdate || ""; var end = item.eventenddate || "";
        if (start.length === 8) start = start.slice(0,4) + "." + start.slice(4,6) + "." + start.slice(6,8);
        if (end.length === 8) end = end.slice(0,4) + "." + end.slice(4,6) + "." + end.slice(6,8);
        dateEl.textContent = start + (end && end !== start ? " ~ " + end : "");
        var distEl = document.createElement("div"); distEl.className = "festival-card-dist";
        var distM = center.distanceTo([parseFloat(item.mapy), parseFloat(item.mapx)]);
        distEl.textContent = distM < 1000 ? Math.round(distM) + "m" : (distM / 1000).toFixed(1) + "km";
        card.appendChild(typeEl); card.appendChild(nameEl); card.appendChild(dateEl); card.appendChild(distEl);
        card.addEventListener("click", function() {
            map.flyTo([parseFloat(item.mapy), parseFloat(item.mapx)], 15);
            var addr = getTourDisplayAddr(item);
            var tel = item.tel ? "<br><a href='tel:" + item.tel + "' style='color:#4db8ff;font-size:12px;'>?? " + escapeHtml(item.tel) + "</a>" : "";
            L.popup({ className: "tour-popup" }).setLatLng([parseFloat(item.mapy), parseFloat(item.mapx)]).setContent("<b>" + escapeHtml(getTourDisplayTitle(item) || "") + "</b><br><span class='tour-popup-tag' style='color:" + getTourTypeMeta("15").color + ";border-color:" + getTourTypeMeta("15").border + ";background:" + getTourTypeMeta("15").fill + ";'>" + escapeHtml(getTourTypeName("15")) + "</span><br><small>" + escapeHtml(addr) + "</small>" + tel).openOn(map);
        });
        strip.appendChild(card);
    });
    label.classList.add("show"); strip.classList.add("show");
}

function fetchTourSpots() {
    var bounds = map.getBounds(); var center = map.getCenter(); var ne = bounds.getNorthEast();
    var radiusM = Math.round(center.distanceTo(ne)); radiusM = Math.max(500, Math.min(radiusM, 20000));
    var listEl = document.getElementById("tour-list"); var loadingEl = document.getElementById("tour-loading");
    var emptyEl = document.getElementById("tour-empty"); var expandBtn = document.getElementById("tour-expand-btn"); var countEl = document.getElementById("tour-count");
    if (!listEl || !loadingEl || !emptyEl || !expandBtn || !countEl) return;
    loadingEl.style.display = tourExpanded ? "" : "none"; emptyEl.style.display = "none"; listEl.innerHTML = ""; expandBtn.style.display = "none";
    var requestLang = currentLang;
    var buildUrl = function(lang) { return getTourEndpoint("locationBasedList2", lang) + "?serviceKey=" + TOUR_API_KEY + "&mapX=" + center.lng.toFixed(6) + "&mapY=" + center.lat.toFixed(6) + "&radius=" + radiusM + "&numOfRows=20&pageNo=1&MobileOS=ETC&MobileApp=Giloa&_type=json&arrange=E"; };
    fetchTourJsonWithFallback(buildUrl, requestLang).then(function(data) {
        loadingEl.style.display = "none"; var body = data && data.response && data.response.body; var items = [];
        if (body && body.items && body.items.item) { items = Array.isArray(body.items.item) ? body.items.item : [body.items.item]; items = items.filter(function(item) { return item.contenttypeid !== "39" && item.contenttypeid !== "32"; }); }
        clearTourMarkers(); tourItems = items; markTourItemsSource(tourItems, data._giloaSourceLang || requestLang);
        if (items.length === 0) { emptyEl.style.display = tourExpanded ? "" : "none"; countEl.textContent = ""; return; }
        countEl.textContent = formatTourCount(items.length); renderTourCards(); translateTourItemsForLang(currentLang, tourItems);
        if (currentPos) checkNearbyVisitPlaces(currentPos);
    }).catch(function(err) { loadingEl.style.display = "none"; emptyEl.style.display = tourExpanded ? "" : "none"; emptyEl.textContent = (UI_TEXT[currentLang] || UI_TEXT.ko).empty_tour; countEl.textContent = ""; console.warn("TourAPI ??", err); });
}

function tourResponseHasItems(data) {
    var body = data && data.response && data.response.body;
    return !!(body && body.items && body.items.item);
}

function fetchTourJsonWithFallback(buildUrl, lang) {
    return fetch(buildUrl(lang)).then(function(res) { return res.json(); }).then(function(data) {
        if (lang === "ko" || tourResponseHasItems(data)) return data;
        return fetch(buildUrl("ko")).then(function(res) { return res.json(); }).then(function(fallbackData) { fallbackData._giloaSourceLang = "ko"; return fallbackData; }).catch(function() { return data; });
    }).catch(function(err) {
        if (lang === "ko") throw err;
        return fetch(buildUrl("ko")).then(function(res) { return res.json(); }).then(function(fallbackData) { fallbackData._giloaSourceLang = "ko"; return fallbackData; });
    });
}
function hideFestivalStrip() {
    var strip = document.getElementById("festival-strip");
    var label = document.getElementById("festival-strip-label");
    if (strip) strip.classList.remove("show");
    if (label) label.classList.remove("show");
}

function syncTourCloseButton() {
    var closeBtn = document.getElementById("tour-close-btn");
    if (closeBtn) closeBtn.style.display = tourExpanded ? "inline-flex" : "none";
}

function renderTourCards() {
    var listEl = document.getElementById("tour-list"); var expandBtn = document.getElementById("tour-expand-btn"); if (!listEl || !expandBtn) return;
    listEl.innerHTML = ""; var center = map.getCenter();
    var showCount = tourExpanded ? tourItems.length : 0;
    for (var i = 0; i < showCount; i++) {
        (function(item) {
            var meta = getTourTypeMeta(item.contenttypeid);
            var card = document.createElement("div"); card.className = "tour-card"; applyTourTypeVars(card, meta);
            var nameEl = document.createElement("div"); nameEl.className = "tour-card-name"; nameEl.textContent = getTourDisplayTitle(item) || "?? ??";
            var typeEl = document.createElement("div"); typeEl.className = "tour-card-type"; typeEl.textContent = getTourTypeName(item.contenttypeid) || meta.label;
            var distEl = document.createElement("div"); distEl.className = "tour-card-dist";
            var distM = center.distanceTo([parseFloat(item.mapy), parseFloat(item.mapx)]);
            distEl.textContent = distM < 1000 ? Math.round(distM) + "m" : (distM / 1000).toFixed(1) + "km";
            card.appendChild(nameEl); card.appendChild(typeEl); card.appendChild(distEl);
            card.addEventListener("click", function() { map.flyTo([parseFloat(item.mapy), parseFloat(item.mapx)], 17); showTourPopup(item); });
            listEl.appendChild(card);
        })(tourItems[i]);
    }
    expandBtn.style.display = "none";
    listEl.classList.toggle("expanded", tourItems.length > 0 && tourExpanded);
    syncTourCloseButton();
    addTourMarkers();
    if (tourExpanded) renderFestivalStrip();
    else hideFestivalStrip();
}

function collapseTourPanel() {
    var loadingEl = document.getElementById("tour-loading");
    var emptyEl = document.getElementById("tour-empty");
    if (loadingEl) loadingEl.style.display = "none";
    if (emptyEl) emptyEl.style.display = "none";
    if (!tourExpanded) { hideFestivalStrip(); syncTourCloseButton(); return; }
    tourExpanded = false;
    renderTourCards();
    map.closePopup();
}

function closeTourPanel(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    collapseTourPanel();
}

function toggleTourExpand() {
    if (tourExpanded) { collapseTourPanel(); return; }
    tourExpanded = true;
    renderTourCards();
}

function showTourPopup(item) {
    var lat = parseFloat(item.mapy); var lng = parseFloat(item.mapx);
    var typeName = getTourTypeName(item.contenttypeid);
    var meta = getTourTypeMeta(item.contenttypeid);
    var title = getTourDisplayTitle(item);
    var addr = getTourDisplayAddr(item);
    var tel = item.tel ? "<br><a href='tel:" + item.tel + "' style='color:#4db8ff;font-size:12px;'>전화 " + escapeHtml(item.tel) + "</a>" : "";
    var tag = "<span class='tour-popup-tag' style='color:" + meta.color + ";border-color:" + meta.border + ";background:" + meta.fill + ";'>" + escapeHtml(typeName) + "</span>";
    L.popup({ className: "tour-popup" }).setLatLng([lat, lng]).setContent("<b>" + escapeHtml(title) + "</b><br>" + tag + "<br><small>" + escapeHtml(addr) + "</small>" + tel).openOn(map);
}

function clearTourMarkers() { tourMarkers.forEach(function(m) { map.removeLayer(m); }); tourMarkers = []; }
function addTourMarkers() { clearTourMarkers(); tourItems.forEach(function(item) { var lat = parseFloat(item.mapy); var lng = parseFloat(item.mapx); if (!isFinite(lat) || !isFinite(lng)) return; var meta = getTourTypeMeta(item.contenttypeid); var icon = L.divIcon({ className: "tour-map-marker-wrap", html: "<div class='tour-map-marker' style='--tour-color:" + meta.color + ";--tour-fill:" + meta.fill + ";--tour-border:" + meta.border + ";'><span class='tour-map-dot'></span><span class='tour-map-label'>" + escapeHtml(meta.label) + "</span></div>", iconSize: [76, 28], iconAnchor: [10, 14] }); var marker = L.marker([lat, lng], { pane: "tourPane", icon: icon, title: (getTourTypeName(item.contenttypeid) || meta.label) + " - " + (getTourDisplayTitle(item) || "") }).addTo(map); marker.on("click", function() { showTourPopup(item); }); tourMarkers.push(marker); }); }


// ���� ���� ���������� ��ġ���� ����
var SEOUL_LIBRARY_API_KEY = "756b506d69646f7439356a526f5a47";
var SEOUL_LIBRARY_API_URL = "http://openapi.seoul.go.kr:8088/" + SEOUL_LIBRARY_API_KEY + "/json/SeoulPublicLibraryInfo/1/300/";
var libraryItems = [];
var libraryMarkers = [];
var LIBRARY_MARKER_COLOR = "#2563eb";

function getLibraryLabel() {
    var labels = { ko: "도서관", en: "Library", ja: "図書館", zh: "图书馆" };
    return labels[currentLang] || labels.ko;
}

function getLibraryDisplayName(item) { return (item && item._nameByLang && item._nameByLang[currentLang]) || (item && item.LBRRY_NAME) || ""; }
function getLibraryDisplayAddr(item) { return (item && item._addrByLang && item._addrByLang[currentLang]) || (item && item.ADRES) || ""; }

function clearLibraryMarkers() { libraryMarkers.forEach(function(marker) { map.removeLayer(marker); }); libraryMarkers = []; }

function renderLibraryMarkers() {
    clearLibraryMarkers();
    libraryItems.forEach(function(item) {
        var lat = parseFloat(item.XCNTS); var lng = parseFloat(item.YDNTS);
        if (!isFinite(lat) || !isFinite(lng)) return;
        var label = getLibraryLabel();
        var icon = L.divIcon({
            className: "library-map-marker-wrap",
            html: "<div class='library-map-marker'><span class='library-map-dot'></span><span class='library-map-label'>" + escapeHtml(label) + "</span></div>",
            iconSize: [92, 28], iconAnchor: [10, 14]
        });
        var marker = L.marker([lat, lng], { pane: "libraryPane", icon: icon, title: label + " - " + getLibraryDisplayName(item) }).addTo(map);
        marker.on("click", function() { showLibraryPopup(item); });
        libraryMarkers.push(marker);
    });
}

function showLibraryPopup(item) {
    var lat = parseFloat(item.XCNTS); var lng = parseFloat(item.YDNTS);
    var name = getLibraryDisplayName(item);
    var addr = getLibraryDisplayAddr(item);
    var label = getLibraryLabel();
    var tel = item.TEL_NO ? "<br><a href='tel:" + item.TEL_NO + "' style='color:#4ade80;font-size:12px;'>전화 " + escapeHtml(item.TEL_NO) + "</a>" : "";
    var time = item.OP_TIME ? "<br><small>" + escapeHtml(item.OP_TIME) + "</small>" : "";
    var tag = "<span class='tour-popup-tag' style='color:#60a5fa;border-color:rgba(37,99,235,0.75);background:rgba(37,99,235,0.22);'>" + escapeHtml(label) + "</span>";
    L.popup({ className: "tour-popup" }).setLatLng([lat, lng]).setContent("<b>" + escapeHtml(name) + "</b><br>" + tag + "<br><small>" + escapeHtml(addr) + "</small>" + time + tel).openOn(map);
}

function translateLibraryItemsForLang(lang) {
    if (lang === "ko") return Promise.resolve();
    var targetLang = getVarcoLang(lang);
    var tasks = [];
    libraryItems.forEach(function(item) {
        item._nameByLang = item._nameByLang || {};
        item._addrByLang = item._addrByLang || {};
        if (item.LBRRY_NAME && !item._nameByLang[lang] && hasHangul(item.LBRRY_NAME)) {
            tasks.push(varcoTranslate(item.LBRRY_NAME, "ko", targetLang).then(function(translated) { item._nameByLang[lang] = translated; }));
        }
        if (item.ADRES && !item._addrByLang[lang] && hasHangul(item.ADRES)) {
            tasks.push(varcoTranslate(item.ADRES, "ko", targetLang).then(function(translated) { item._addrByLang[lang] = translated; }));
        }
    });
    if (tasks.length === 0) return Promise.resolve();
    return Promise.all(tasks).then(renderLibraryMarkers);
}

function fetchLibraryJson() {
    return fetch(SEOUL_LIBRARY_API_URL).then(function(res) { return res.json(); }).catch(function(err) {
        var plugins = window.Capacitor && window.Capacitor.Plugins;
        var http = plugins && plugins.CapacitorHttp;
        if (!http || !http.get) throw err;
        return http.get({ url: SEOUL_LIBRARY_API_URL }).then(function(result) {
            return typeof result.data === "string" ? JSON.parse(result.data) : result.data;
        });
    });
}

function fetchLibraries() {
    fetchLibraryJson().then(function(data) {
        var body = data && data.SeoulPublicLibraryInfo;
        libraryItems = body && Array.isArray(body.row) ? body.row : [];
        renderLibraryMarkers();
        translateLibraryItemsForLang(currentLang);
        if (currentPos) checkNearbyVisitPlaces(currentPos);
    }).catch(function(err) { console.warn("���� ������ API ����", err); });
}
function scheduleTourFetch() { if (tourFetchTimer) clearTimeout(tourFetchTimer); tourFetchTimer = setTimeout(function() { tourFetchTimer = null; tourExpanded = false; fetchTourSpots(); fetchFestivals(); }, 1200); }
map.on("moveend", scheduleTourFetch);
map.on("click", function() { collapseTourPanel(); });
scheduleTourFetch();
fetchLibraries();

// ���� VARCO ���� ����
var VARCO_API_KEY = "9yUWJoapaQfdiYdq9Hd1knN4IMbOFO0w";
var VARCO_TRANSLATE_URL = "https://api.varco.ai/mt/chat-content/v1/translate";
var currentLang = "ko";

function getVarcoLang(lang) { return ({ ko: "ko", en: "en", ja: "ja", zh: "zh" })[lang] || "en"; }
function getGoogleLang(lang) { return ({ ko: "ko", en: "en", ja: "ja", zh: "zh-CN" })[lang] || "en"; }

function googleTranslate(text, sourceLang, targetLang) {
    var url = "https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&sl=" + encodeURIComponent(sourceLang || "ko") + "&tl=" + encodeURIComponent(getGoogleLang(targetLang)) + "&q=" + encodeURIComponent(text);
    return fetch(url).then(function(res) { return res.json(); }).then(function(data) {
        if (Array.isArray(data) && Array.isArray(data[0])) return data[0].map(function(part) { return part && part[0] ? part[0] : ""; }).join("") || text;
        return text;
    });
}

function varcoTranslate(text, sourceLang, targetLang) {
    return fetch(VARCO_TRANSLATE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "openapi_key": VARCO_API_KEY },
        body: JSON.stringify({ TID: "giloa-" + Date.now(), svc: "varco-translation", provider: "content", source_lang: sourceLang, source_text: text, target_lang: targetLang })
    }).then(function(res) { return res.text(); }).then(function(raw) {
        if (/^\s*</.test(raw)) throw new Error("VARCO returned HTML");
        var data = JSON.parse(raw);
        return data.target_text || (data.result && data.result.target_text) || (data.data && data.data.target_text) || (data.output && data.output.text) || text;
    }).catch(function() { return googleTranslate(text, sourceLang, targetLang).catch(function() { return text; }); });
}

var UI_TEXT = {
    ko: { sidebar_title: "나의 기록들", fog_label: "어둠 효과", fog_on: "켜짐", fog_off: "꺼짐", tab_memory: "기억", tab_photo: "사진", tab_gpx: "발걸음", tab_badge: "뱃지", tab_visit: "방문", tab_item: "아이템", rec_idle: "대기 중", rec_active: "기록 중", empty_memory: "아직 기록이 없습니다.", empty_photo: "아직 사진이 없습니다.", tour_title: "주변 관광지", festival_label: "주변 축제", festival_badge: "축제", loading: "검색 중...", empty_tour: "이 지도에 관광지가 없어요", close: "닫기", count_suffix: "곳", unit_count: " 개", hud_title_label: "현재 칭호", hud_level_label: "LV", hud_dist_label: "이동 거리", hud_memory_label: "기억 개수", hud_photo_label: "사진 개수", hud_next: "다음까지", hud_condition_met: "조건 충족!", hud_no_condition: "조건 없음", hud_max: "최고!", hud_max_level: "최고 레벨 달성!", help_tab_ask: "? 문의하기", help_tab_info: "! 설명보기", help_ask_copy: "사용 중 불편한 점이나 건의사항은<br>카카오톡 오픈채팅으로 들려주세요", help_notice: "현재 저장된 GPX 데이터는 서버로 전송되지 않아요.<br>모든 기록은 <b>오직 이 기기 안에서만</b> 저장되고 보여져요.", help_link: "카카오톡 오픈채팅 문의", help_record_title: "녹화 버튼", help_record_desc: "누르면 GPS 경로 기록 시작. 다시 누르면 중지.", help_photo_title: "사진 버튼", help_photo_desc: "갤러리에서 사진을 불러와 저장해요. 의미 있는 장소를 쓰려면 지도에 찍힌 사진을 두 번 눌러 입력해 주세요.", help_memory_title: "별표 버튼", help_memory_desc: "현재 위치에 이름을 붙여 기억으로 남겨요.", help_location_title: "현재 위치 버튼", help_location_desc: "조준점 아이콘이에요. 지도를 내 현재 위치로 다시 이동시켜요.", help_status_title: "상태 버튼", help_status_desc: "사람 아이콘이에요. 내 현재 칭호, 레벨, 진행 상태를 확인할 수 있어요.", help_menu_title: "메뉴 버튼 (상단 왼쪽)", help_menu_desc: "햄버거 아이콘이에요. 기억, 사진, 발걸음, 뱃지, 방문, 아이템 목록을 열어볼 수 있어요." },
    en: { sidebar_title: "My Records", fog_label: "Fog Effect", fog_on: "On", fog_off: "Off", tab_memory: "Memory", tab_photo: "Photo", tab_gpx: "Steps", tab_badge: "Badges", tab_visit: "Visits", tab_item: "Items", rec_idle: "Standby", rec_active: "Recording", empty_memory: "No records yet.", empty_photo: "No photos yet.", tour_title: "Nearby Places", festival_label: "Nearby Festivals", festival_badge: "Festivals", loading: "Searching...", empty_tour: "No nearby places", close: "Close", count_suffix: "places", unit_count: "", hud_title_label: "Current Title", hud_level_label: "LV", hud_dist_label: "Distance", hud_memory_label: "Memories", hud_photo_label: "Photos", hud_next: "Next", hud_condition_met: "Met!", hud_no_condition: "No condition", hud_max: "Max!", hud_max_level: "Max level reached!", help_tab_ask: "? Contact", help_tab_info: "! Guide", help_ask_copy: "Tell us about issues or suggestions<br>through KakaoTalk open chat.", help_notice: "Saved GPX data is not sent to the server.<br>All records are stored and shown <b>only on this device</b>.", help_link: "KakaoTalk Open Chat", help_record_title: "Record Button", help_record_desc: "Tap to start GPS route recording. Tap again to stop.", help_photo_title: "Photo Button", help_photo_desc: "Import photos from your gallery. Double tap a mapped photo to save it as a meaningful place.", help_memory_title: "Star Button", help_memory_desc: "Name your current location and save it as a memory.", help_location_title: "Current Location Button", help_location_desc: "The crosshair icon moves the map back to your current location.", help_status_title: "Status Button", help_status_desc: "The person icon shows your current title, level, and progress.", help_menu_title: "Menu Button (Top Left)", help_menu_desc: "The hamburger icon opens memories, photos, steps, badges, visits, and items." },
    ja: { sidebar_title: "記録", fog_label: "霧効果", fog_on: "オン", fog_off: "オフ", tab_memory: "記憶", tab_photo: "写真", tab_gpx: "足跡", tab_badge: "バッジ", tab_visit: "訪問", tab_item: "アイテム", rec_idle: "待機中", rec_active: "記録中", empty_memory: "記録はまだありません。", empty_photo: "写真はまだありません。", tour_title: "周辺スポット", festival_label: "周辺の祭り", festival_badge: "祭り", loading: "検索中...", empty_tour: "周辺スポットがありません", close: "閉じる", count_suffix: "件", unit_count: "件", hud_title_label: "現在の称号", hud_level_label: "LV", hud_dist_label: "移動距離", hud_memory_label: "記憶数", hud_photo_label: "写真数", hud_next: "次まで", hud_condition_met: "条件達成!", hud_no_condition: "条件なし", hud_max: "最高!", hud_max_level: "最高レベル達成!", help_tab_ask: "? お問い合わせ", help_tab_info: "! ガイド", help_ask_copy: "ご意見を KakaoTalk オープンチャットでお聞かせください。", help_notice: "保存された GPX データはサーバーへ送信されません。", help_link: "KakaoTalk オープンチャット", help_record_title: "録画ボタン", help_record_desc: "タップするとGPS経路記録を開始。もう一度タップすると停止します。", help_photo_title: "写真ボタン", help_photo_desc: "ギャラリーから写真を読み込んで保存します。", help_memory_title: "星ボタン", help_memory_desc: "現在地に名前を付けて記憶として残します。", help_location_title: "現在地ボタン", help_location_desc: "照準アイコンで地図を現在地へ戻します。", help_status_title: "ステータスボタン", help_status_desc: "現在の称号と進行状況を確認できます。", help_menu_title: "メニューボタン", help_menu_desc: "記憶、写真、足跡などを開きます。" },
    zh: { sidebar_title: "我的记录", fog_label: "雾效", fog_on: "开", fog_off: "关", tab_memory: "记忆", tab_photo: "照片", tab_gpx: "足迹", tab_badge: "徽章", tab_visit: "访问", tab_item: "物品", rec_idle: "待机中", rec_active: "记录中", empty_memory: "还没有记录。", empty_photo: "还没有照片。", tour_title: "附近景点", festival_label: "附近庆典", festival_badge: "庆典", loading: "搜索中...", empty_tour: "附近没有景点", close: "关闭", count_suffix: "处", unit_count: "个", hud_title_label: "当前称号", hud_level_label: "LV", hud_dist_label: "移动距离", hud_memory_label: "记忆数量", hud_photo_label: "照片数量", hud_next: "距离下一步", hud_condition_met: "条件已达成!", hud_no_condition: "无条件", hud_max: "最高!", hud_max_level: "已达最高等级!", help_tab_ask: "? 咨询", help_tab_info: "! 指南", help_ask_copy: "请通过 KakaoTalk 开放聊天告诉我们。", help_notice: "已保存的 GPX 数据不会发送到服务器。", help_link: "KakaoTalk 开放聊天", help_record_title: "记录按钮", help_record_desc: "点击开始 GPS 路径记录，再次点击停止。", help_photo_title: "照片按钮", help_photo_desc: "从相册导入照片并保存。", help_memory_title: "星标按钮", help_memory_desc: "为当前位置命名并保存为记忆。", help_location_title: "当前位置按钮", help_location_desc: "准星图标会将地图移回当前位置。", help_status_title: "状态按钮", help_status_desc: "查看当前称号和进度。", help_menu_title: "菜单按钮", help_menu_desc: "打开记忆、照片、足迹等列表。" }
};

function setText(id, value) { var el = document.getElementById(id); if (el) el.textContent = value; }
function setHtml(id, value) { var el = document.getElementById(id); if (el) el.innerHTML = value; }
function applyHelpLang(t) {
    setText("htab-ask", t.help_tab_ask);
    setText("htab-info", t.help_tab_info);
    setHtml("help-ask-copy", t.help_ask_copy);
    setHtml("help-notice", t.help_notice);
    setText("help-link", t.help_link);
    var titles = [t.help_record_title, t.help_photo_title, t.help_location_title, t.help_status_title, t.help_menu_title];
    var descs = [t.help_record_desc, t.help_photo_desc, t.help_location_desc, t.help_status_desc, t.help_menu_desc];
    document.querySelectorAll(".help-guide-text").forEach(function(box, idx) {
        var title = box.querySelector("b"); var desc = box.querySelector("span");
        if (title && titles[idx]) title.textContent = titles[idx];
        if (desc && descs[idx]) desc.textContent = descs[idx];
    });
}
function applyHudLang(t) {
    setText("hud-title-label", t.hud_title_label);
    setText("hud-level-label", t.hud_level_label);
    updateHud();
}
function applyUILang(lang) {
    currentLang = lang;
    var t = UI_TEXT[lang] || UI_TEXT["ko"];
    var el = function(id) { return document.getElementById(id); };
    if (el("sidebar-title")) el("sidebar-title").textContent = t.sidebar_title;
    if (el("fog-toggle-label-el")) el("fog-toggle-label-el").textContent = t.fog_label;
    if (el("fog-toggle-state")) el("fog-toggle-state").textContent = isFogEnabled ? t.fog_on : t.fog_off;
    var tabMemory = document.querySelector("#tab-memory .sidebar-tab-text");
    var tabPhoto = document.querySelector("#tab-photo .sidebar-tab-text");
    var tabGpx = document.querySelector("#tab-gpx .sidebar-tab-text");
    var tabBadge = document.querySelector("#tab-badge .sidebar-tab-text");
    var tabVisit = document.querySelector("#tab-visit .sidebar-tab-text");
    var tabItem = document.querySelector("#tab-item .sidebar-tab-text");
    if (tabMemory) tabMemory.textContent = t.tab_memory;
    if (tabPhoto) tabPhoto.textContent = t.tab_photo;
    if (tabGpx) tabGpx.textContent = t.tab_gpx;
    if (tabBadge) tabBadge.textContent = t.tab_badge;
    if (tabVisit) tabVisit.textContent = t.tab_visit;
    if (tabItem) tabItem.textContent = t.tab_item;
    if (el("tour-title")) el("tour-title").textContent = t.tour_title;
    if (el("festival-strip-label")) el("festival-strip-label").textContent = t.festival_label;
    if (el("tour-loading")) el("tour-loading").textContent = t.loading;
    if (el("tour-empty")) el("tour-empty").textContent = t.empty_tour;
    if (el("tour-close-btn")) el("tour-close-btn").setAttribute("aria-label", t.close);
    syncFogButton();
    if (!isRecording) { if (el("rec-status-box")) el("rec-status-box").textContent = t.rec_idle; }
    document.querySelectorAll(".lang-btn").forEach(function(btn) { btn.classList.toggle("active", btn.dataset.lang === lang); });
    applyHelpLang(t);
    applyHudLang(t);
    renderTourCards();
    renderFestivalStrip();
    translateTourItemsForLang(lang, tourItems);
    translateTourItemsForLang(lang, festivalItems);
    renderLibraryMarkers();
    translateLibraryItemsForLang(lang);
}

function toggleLang(lang) {
    if (currentLang === lang) return;
    currentLang = lang;
    applyUILang(lang);
    clearTourMarkers();
    tourItems = [];
    festivalItems = [];
    fetchTourSpots();
    fetchFestivals();
}

function markTourItemsSource(items, sourceLang) {
    (items || []).forEach(function(item) { item._sourceLang = sourceLang || currentLang; });
}

function hasHangul(text) {
    return /[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(String(text || ""));
}

function translateTourItemsForLang(lang, items) {
    items = items || tourItems;
    if (lang === "ko") return Promise.resolve();
    var targetLang = getVarcoLang(lang);
    var tasks = [];
    items.forEach(function(item) {
        if (!item) return;
        item._titleByLang = item._titleByLang || {};
        item._addrByLang = item._addrByLang || {};
        if (item.title && !item._titleByLang[lang] && (item._sourceLang === "ko" || hasHangul(item.title))) {
            tasks.push(varcoTranslate(item.title, "ko", targetLang).then(function(translated) { item._titleByLang[lang] = translated; }));
        }
        if (item.addr1 && !item._addrByLang[lang] && (item._sourceLang === "ko" || hasHangul(item.addr1))) {
            tasks.push(varcoTranslate(item.addr1, "ko", targetLang).then(function(translated) { item._addrByLang[lang] = translated; }));
        }
    });
    if (tasks.length === 0) return Promise.resolve();
    return Promise.all(tasks).then(function() { renderTourCards(); if (tourExpanded) renderFestivalStrip(); });
}

function getTourDisplayTitle(item) { return (item && item._titleByLang && item._titleByLang[currentLang]) || (item && item.title) || ""; }
function getTourDisplayAddr(item) { return (item && item._addrByLang && item._addrByLang[currentLang]) || (item && item.addr1) || ""; }


var iconRoute = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19c4-7 10-7 14-14"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="5" r="2"/><path d="M9 15l3 3 3-6"/></svg>';
var iconBadge = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"/><path d="M8.6 12.2 7 22l5-3 5 3-1.6-9.8"/></svg>';
var iconVisit = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-5.3 7-12a7 7 0 0 0-14 0c0 6.7 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg>';
var iconItem = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4 7.5 8 4.5 8-4.5"/><path d="M12 12v9"/></svg>';

// ���� ������ ����
var COLLECTION_KEY = "giloa-collection";
var badges = []; var visitStamps = []; var items = [];

var BADGE_DEFS = [
    { id: "first_memory", icon: "★", name: "첫 기억", desc: "첫 번째 기억을 남겼어요" },
    { id: "first_photo", icon: "사진", name: "첫 사진", desc: "첫 번째 사진을 저장했어요" },
    { id: "first_10km", icon: "10", name: "10km 달성", desc: "누적 10km를 걸었어요" },
    { id: "first_50km", icon: "50", name: "50km 달성", desc: "누적 50km를 걸었어요" },
    { id: "early_bird", icon: "새벽", name: "새벽 탐험가", desc: "새벽 5시 이전에 기록했어요" },
    { id: "memory_5", icon: "기억", name: "기억 수집가", desc: "기억을 5개 남겼어요" },
    { id: "photo_10", icon: "사진", name: "사진작가", desc: "사진을 10장 저장했어요" },
    { id: "tour_visit", icon: "관광", name: "관광 탐험가", desc: "관광지를 처음 방문했어요" },
    { id: "festival_visit", icon: "축제", name: "축제 마니아", desc: "축제를 처음 방문했어요" },
];

function loadCollection() {
    try {
        var raw = localStorage.getItem(COLLECTION_KEY);
        if (!raw) { updateBadgeList(); updateVisitList(); updateItemList(); return; }
        var data = JSON.parse(raw);
        badges = Array.isArray(data.badges) ? data.badges : [];
        visitStamps = Array.isArray(data.visitStamps) ? data.visitStamps : [];
        items = Array.isArray(data.items) ? data.items : [];
        updateBadgeList();
        updateVisitList();
        updateItemList();
    } catch(e) { console.warn("컬렉션 불러오기 실패", e); }
}

function saveCollection() {
    localStorage.setItem(COLLECTION_KEY, JSON.stringify({ badges: badges, visitStamps: visitStamps, items: items }));
}

function makeVisitKey(type, name, lat, lng, sourceId) {
    if (sourceId) return String(type || "") + ":" + String(sourceId);
    return String(type || "") + ":" + String(name || "") + ":" + Number(lat).toFixed(5) + ":" + Number(lng).toFixed(5);
}

function hasVisitStamp(placeKey, name, type, lat, lng) {
    return visitStamps.some(function(v) {
        if (placeKey && v.placeKey === placeKey) return true;
        if (v.name === name && v.type === type && isFinite(v.lat) && isFinite(v.lng)) {
            return L.latLng(v.lat, v.lng).distanceTo([lat, lng]) <= AUTO_VISIT_RADIUS_M;
        }
        return false;
    });
}

function earnBadge(badgeId) {
    if (badges.some(function(b) { return b.id === badgeId; })) return;
    var def = BADGE_DEFS.find(function(d) { return d.id === badgeId; });
    if (!def) return;
    var now = new Date();
    badges.push({ id: badgeId, earnedAt: now.getTime(), dateString: now.toLocaleDateString("ko-KR") });
    saveCollection();
    updateBadgeList();
    showCollectionToast(def.icon + " 뱃지 획득! " + def.name);
}

function addVisitStamp(name, type, lat, lng, placeKey) {
    if (!name || !isFinite(lat) || !isFinite(lng)) return false;
    placeKey = placeKey || makeVisitKey(type, name, lat, lng);
    if (hasVisitStamp(placeKey, name, type, lat, lng)) return false;
    var now = new Date();
    visitStamps.push({ name: name, type: type, lat: lat, lng: lng, placeKey: placeKey, visitedAt: now.getTime(), dateString: now.toLocaleDateString("ko-KR") });
    saveCollection();
    updateVisitList();
    if (type === "관광지" || type === "문화시설") earnBadge("tour_visit");
    if (type === "축제" || type === "축제/행사") earnBadge("festival_visit");
    showCollectionToast(name + " 방문 기록!");
    updateHud();
    return true;
}

function getTourVisitCandidate(item, forcedTypeId) {
    if (!item) return null;
    var lat = parseFloat(item.mapy);
    var lng = parseFloat(item.mapx);
    if (!isFinite(lat) || !isFinite(lng)) return null;
    var typeId = forcedTypeId || item.contenttypeid;
    var type = getTourTypeName(typeId);
    return {
        name: getTourDisplayTitle(item) || item.title || "이름 없는 장소",
        type: type,
        lat: lat,
        lng: lng,
        key: makeVisitKey(type, item.title || getTourDisplayTitle(item), lat, lng, item.contentid || item.fldgubun)
    };
}

function getLibraryVisitCandidate(item) {
    if (!item) return null;
    var lat = parseFloat(item.XCNTS);
    var lng = parseFloat(item.YDNTS);
    if (!isFinite(lat) || !isFinite(lng)) return null;
    var type = getLibraryLabel();
    return {
        name: getLibraryDisplayName(item) || item.LBRRY_NAME || "도서관",
        type: type,
        lat: lat,
        lng: lng,
        key: makeVisitKey(type, item.LBRRY_NAME || getLibraryDisplayName(item), lat, lng, item.LBRRY_SEQ_NO || item.CODE_VALUE)
    };
}

function tryAutoVisit(candidate, latlng) {
    if (!candidate) return false;
    if (hasVisitStamp(candidate.key, candidate.name, candidate.type, candidate.lat, candidate.lng)) return false;
    if (latlng.distanceTo([candidate.lat, candidate.lng]) > AUTO_VISIT_RADIUS_M) return false;
    return addVisitStamp(candidate.name, candidate.type, candidate.lat, candidate.lng, candidate.key);
}

function checkNearbyVisitPlaces(latlng) {
    if (!latlng) return;
    var found = false;
    (festivalItems || []).forEach(function(item) { if (tryAutoVisit(getTourVisitCandidate(item, "15"), latlng)) found = true; });
    (tourItems || []).forEach(function(item) { if (tryAutoVisit(getTourVisitCandidate(item), latlng)) found = true; });
    (libraryItems || []).forEach(function(item) { if (tryAutoVisit(getLibraryVisitCandidate(item), latlng)) found = true; });
    if (found) updateStats();
}

function checkBadges() {
    var distKm = totalDistance / 1000;
    if (distKm >= 10) earnBadge("first_10km");
    if (distKm >= 50) earnBadge("first_50km");
    if (memories.length >= 1) earnBadge("first_memory");
    if (memories.length >= 5) earnBadge("memory_5");
    if (photos.length >= 1) earnBadge("first_photo");
    if (photos.length >= 10) earnBadge("photo_10");
    var hour = new Date().getHours();
    if (isRecording && hour < 5) earnBadge("early_bird");
}

function updateBadgeList() {
    var container = document.getElementById("badge-list");
    if (!container) return;
    if (badges.length === 0) { container.innerHTML = '<p class="empty-message">아직 획득한 뱃지가 없습니다.</p>'; return; }
    container.innerHTML = "";
    badges.slice().reverse().forEach(function(b) {
        var def = BADGE_DEFS.find(function(d) { return d.id === b.id; });
        if (!def) return;
        var item = document.createElement("div");
        item.className = "badge-item";
        item.innerHTML = '<div class="badge-icon">' + def.icon + '</div><div class="badge-name">' + def.name + '</div><div class="badge-date">' + b.dateString + '</div>';
        container.appendChild(item);
    });
}

function updateVisitList() {
    var container = document.getElementById("visit-list");
    if (!container) return;
    if (visitStamps.length === 0) { container.innerHTML = '<p class="empty-message">아직 방문한 장소가 없습니다.</p>'; return; }
    container.innerHTML = "";
    visitStamps.slice().sort(function(a,b){ return b.visitedAt - a.visitedAt; }).forEach(function(v) {
        var typeIcons = { "관광지": iconVisit, "문화시설": iconVisit, "축제": iconBadge, "레포츠": iconRoute, "여행코스": iconRoute };
        var icon = typeIcons[v.type] || iconVisit;
        var el = document.createElement("div");
        el.className = "visit-item";
        el.innerHTML = '<div class="visit-icon">' + icon + '</div><div class="visit-info"><div class="visit-name">' + escapeHtml(v.name) + '</div><div class="visit-date">' + v.dateString + '</div></div>';
        el.addEventListener("click", function() { map.flyTo([v.lat, v.lng], 17); toggleSidebar(false); });
        container.appendChild(el);
    });
}

function switchCollectionTab(tab) {
    ["badge", "visit", "item"].forEach(function(t) {
        document.getElementById("ctab-" + t).classList.toggle("active", t === tab);
        document.getElementById("cpanel-" + t).style.display = t === tab ? "" : "none";
    });
}

function showCollectionToast(msg) {
    var toast = document.createElement("div");
    toast.style.cssText = "position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:rgba(20,20,35,0.95);border:1px solid rgba(255,255,255,0.2);color:#fff;padding:10px 18px;border-radius:20px;font-size:13px;font-weight:600;z-index:9999;white-space:nowrap;backdrop-filter:blur(10px);";
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(function() { toast.remove(); }, 2500);
}

// ���� �þ߰� ��ä�� ����
var visionCone = null;
var visionLine = null;
function updateVisionCone(latlng) {
    if (visionCone) { map.removeLayer(visionCone); visionCone = null; }
    if (visionLine) { map.removeLayer(visionLine); visionLine = null; }
    scheduleRender();
}
function bearingBetween(from, to) {
    var lat1 = from.lat * Math.PI / 180; var lat2 = to.lat * Math.PI / 180;
    var dLng = (to.lng - from.lng) * Math.PI / 180;
    var y = Math.sin(dLng) * Math.cos(lat2);
    var x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}
function destPoint(center, angleDeg, distanceM) {
    var R = 6371000; var lat1 = center[0] * Math.PI / 180; var lng1 = center[1] * Math.PI / 180; var brng = angleDeg * Math.PI / 180; var d = distanceM / R;
    var lat2 = Math.asin(Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(brng));
    var lng2 = lng1 + Math.atan2(Math.sin(brng) * Math.sin(d) * Math.cos(lat1), Math.cos(d) - Math.sin(lat1) * Math.sin(lat2));
    return [lat2 * 180 / Math.PI, lng2 * 180 / Math.PI];
}









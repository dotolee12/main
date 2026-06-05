// ¦¡¦¡ ¾Û ½ÃÀÛ ½Ã À§Ä¡ ±ÇÇÑ ¿äÃ» ¦¡¦¡
async function requestLocationPermission() {
    if (window.Capacitor && window.Capacitor.isNativePlatform()) {
        try {
            const { Geolocation } = window.Capacitor.Plugins;
            await Geolocation.requestPermissions();
            const { BackgroundGeolocation } = window.Capacitor.Plugins;
            if (BackgroundGeolocation) {
                await BackgroundGeolocation.addWatcher({
                    backgroundMessage: "±æ·Î¾Æ°¡ °æ·Î¸¦ ±â·ÏÇÏ°í ÀÖ¾î¿ä",
                    backgroundTitle: "±æ·Î¾Æ À§Ä¡ ±â·Ï Áß",
                    requestPermissions: true, stale: false, distanceFilter: 10
                }, function(location, error) {
                    if (error) { console.warn("BG À§Ä¡ ¿¡·¯", error); return; }
                    if (location && isRecording) { handlePosition({ coords: { latitude: location.latitude, longitude: location.longitude, accuracy: location.accuracy } }); }
                });
            }
        } catch (e) { console.warn("±ÇÇÑ ¿äÃ» ½ÇÆÐ", e); }
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
{ level: 1, title: "±æ ¾ø´Â ÀÚ", distKm: 0, memories: 0, photos: 0 },
{ level: 2, title: "ÈçÀûÀ» ³²±ä ÀÚ", distKm: 1, memories: 0, photos: 0 },
{ level: 3, title: "Å½ÇèÀÚ", distKm: 10, memories: 1, photos: 0 },
{ level: 4, title: "±æÀ» ¸¸µç ÀÚ", distKm: 30, memories: 3, photos: 0 },
{ level: 5, title: "¹Ù¶÷À» °È´Â ÀÚ", distKm: 60, memories: 5, photos: 3 },
{ level: 6, title: "±â¾ïÀ» ¼öÁýÇÏ´Â ÀÚ", distKm: 100, memories: 8, photos: 5 },
{ level: 7, title: "µÎ ¹ÙÄûÀÇ ¿©ÇàÀÚ", distKm: 150, memories: 12, photos: 8 },
{ level: 8, title: "Áöµµ¸¦ ±×¸®´Â ÀÚ", distKm: 220, memories: 18, photos: 12 },
{ level: 9, title: "±æÀÇ ¿¬´ë±â", distKm: 300, memories: 25, photos: 18 },
{ level: 10, title: "°³Ã´ÀÚ", distKm: 400, memories: 35, photos: 25 },
{ level: 11, title: "¼ÓµµÀÇ Å½Çè°¡", distKm: 550, memories: 45, photos: 33 },
{ level: 12, title: "±Ëµµ¸¦ ´Þ¸®´Â ÀÚ", distKm: 720, memories: 58, photos: 43 },
{ level: 13, title: "´ë·úÀ» °¡·ÎÁö¸£´Â ÀÚ", distKm: 900, memories: 72, photos: 55 },
{ level: 14, title: "¼¼°èÀÇ ÁõÀÎ", distKm: 1100, memories: 88, photos: 68 },
{ level: 15, title: "¼¼°èÀÇ ±â·ÏÀÚ", distKm: 1350, memories: 107, photos: 84 },
];

const LEVEL_TITLE_I18N = {
    ko: ["±æ ¾ø´Â ÀÚ", "ÈçÀûÀ» ³²±ä ÀÚ", "Å½ÇèÀÚ", "±æÀ» ¸¸µç ÀÚ", "¹Ù¶÷À» °È´Â ÀÚ", "±â¾ïÀ» ¼öÁýÇÏ´Â ÀÚ", "µÎ ¹ÙÄûÀÇ ¿©ÇàÀÚ", "Áöµµ¸¦ ±×¸®´Â ÀÚ", "±æÀÇ ¿¬´ë±â", "°³Ã´ÀÚ", "¼ÓµµÀÇ Å½Çè°¡", "±Ëµµ¸¦ ´Þ¸®´Â ÀÚ", "´ë·úÀ» °¡·ÎÁö¸£´Â ÀÚ", "¼¼°èÀÇ ÁõÀÎ", "¼¼°èÀÇ ±â·ÏÀÚ"],
    en: ["Pathless One", "Trace Maker", "Explorer", "Path Builder", "Wind Walker", "Memory Collector", "Two-Wheel Traveler", "Map Maker", "Chronicle of Roads", "Pioneer", "Speed Explorer", "Orbit Rider", "Continent Crosser", "Witness of the World", "World Recorder"],
    ja: ["Ô³ªÊª­íº", "ðëîæªò?ª¹íº", "÷®?íº", "Ô³ªòíÂªëíº", "ù¦ªò?ª¯íº", "ÑÀåãªòó¢ªáªëíº", "ì£×ÇªÎÕéìÑ", "ò¢?ªòÙÚª¯íº", "Ô³ªÎÒ´ÓÛÑÀ", "ËÒô¬íº", "áÜÓøªÎ÷®?Ê«", "ÏùÔ³ªòñËªëíº", "ÓÞ×Áªò??ª¹ªëíº", "á¦Í£ªÎ?ìÑ", "á¦Í£ªÎÑÀ?íº"],
    zh: ["ÙéÖØñýìÑ", "×ºù»ðëîéîÜìÑ", "÷®ßãíº", "?ÖØíº", "?ñéú¼íº", "??â¥íúíº", "??Õéú¼íº", "ò¢??ð¤íº", "Ô³ÖØ?Ò´ÞÈ", "?ô¬íº", "áÜÓø÷®?Ê«", "?îé?ú¼íº", "?Î¥ÓÞ?íº", "á¦Í£??íº", "á¦Í£??íº"]
};
function getLevelTitle(row) { var list = LEVEL_TITLE_I18N[currentLang] || LEVEL_TITLE_I18N.ko; return list[(row.level || 1) - 1] || row.title; }
const SPEED_LIMIT_WALK = 7 / 3.6;
const SPEED_LIMIT_BIKE = 30 / 3.6;

// ¦¡¦¡ IndexedDB ¦¡¦¡
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
    }).catch(function(e) { console.warn("»çÁø °æ·®È­ ½ÇÆÐ", e); });
}

// ¦¡¦¡ »óÅÂ º¯¼ö ¦¡¦¡
let isRecording = false; let photos = []; let isFogEnabled = true; let isHudExpanded = false;
let currentPos = null; let pathCoordinates = []; let memories = []; let totalDistance = 0;
let playerMarker = null; let playerHeading = null; let watchId = null; let saveTimer = null; let rafId = null;
let screenWakeLock = null; let screenWakeLockTimer = null; let screenAwakeUntil = 0; let autoRecordingTimer = null; let photoTapTimer = null;
const memoryMarkers = new Map();
let activeGpxId = null; let activeGpxLayers = []; let dialHours = 12;
const STAY_BONUS_MS = 30 * 60 * 1000; const STAY_BONUS_RADIUS_M = 50;
const IMAGE_MISSION_RADIUS_M = 120;
let stayBonusStartTime = null; let stayBonusAnchor = null; let stayBonusLevelBoost = 0; let stayBonusPlaces = [];
let activeImageMission = null;
let lastPhotoMarkerSize = null;
let heicLoaderPromise = null;
const recBtn = document.getElementById("rec-btn");
const recStatusBox = document.getElementById("rec-status-box");

// ¦¡¦¡ Áöµµ ÃÊ±âÈ­ ¦¡¦¡
const map = L.map("map", { zoomControl: false, attributionControl: false }).setView([37.5665, 126.978], 16);
L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", { zIndex: 10 }).addTo(map);

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
    var distKm = totalDistance / 1000; var memCount = memories.length; var photoCount = photos.length; var currentLevel = LEVEL_TABLE[0];
    for (var i = 0; i < LEVEL_TABLE.length; i++) { var row = LEVEL_TABLE[i]; if (distKm >= row.distKm && memCount >= row.memories && photoCount >= row.photos) { currentLevel = row; } else { break; } }
    var boostedLevel = Math.min(currentLevel.level + stayBonusLevelBoost, LEVEL_TABLE.length); return LEVEL_TABLE[boostedLevel - 1];
}

function updateHud() {
    var t = UI_TEXT[currentLang] || UI_TEXT.ko;
    var current = calcLevel(); var distKm = totalDistance / 1000; var memCount = memories.length; var photoCount = photos.length;
    var nextRow = LEVEL_TABLE.find(function(r) { return r.level === current.level + 1; });
    var titleEl = document.getElementById("hud-title-text"); var levelEl = document.getElementById("hud-level-num");
    if (titleEl) titleEl.textContent = getLevelTitle(current); if (levelEl) levelEl.textContent = current.level;
    var distCurEl = document.getElementById("prog-dist-cur"); var distBarEl = document.getElementById("prog-dist-bar"); var distNextEl = document.getElementById("prog-dist-next");
    if (distCurEl) distCurEl.textContent = distKm.toFixed(2) + " km";
    if (distBarEl && distNextEl) { if (!nextRow) { distBarEl.style.width = "100%"; distNextEl.textContent = t.hud_max_level; } else { var pct = nextRow.distKm > current.distKm ? Math.min(100, ((distKm - current.distKm) / (nextRow.distKm - current.distKm)) * 100) : 100; distBarEl.style.width = pct.toFixed(1) + "%"; var remain = Math.max(0, nextRow.distKm - distKm); distNextEl.textContent = remain > 0.01 ? t.hud_next + " " + remain.toFixed(1) + "km" : t.hud_condition_met; } }
    var memCurEl = document.getElementById("prog-mem-cur"); var memBarEl = document.getElementById("prog-mem-bar"); var memNextEl = document.getElementById("prog-mem-next");
    if (memCurEl) memCurEl.textContent = memCount + t.unit_count;
    if (memBarEl && memNextEl) { if (!nextRow || nextRow.memories === 0) { memBarEl.style.width = "100%"; memNextEl.textContent = nextRow ? t.hud_no_condition : t.hud_max; } else { var pct2 = nextRow.memories > current.memories ? Math.min(100, ((memCount - current.memories) / (nextRow.memories - current.memories)) * 100) : 100; memBarEl.style.width = pct2.toFixed(1) + "%"; var remain2 = Math.max(0, nextRow.memories - memCount); distNextEl; memNextEl.textContent = remain2 > 0 ? t.hud_next + " " + remain2 + t.unit_count : t.hud_condition_met; } }
    var photoCurEl = document.getElementById("prog-photo-cur"); var photoBarEl = document.getElementById("prog-photo-bar"); var photoNextEl = document.getElementById("prog-photo-next");
    if (photoCurEl) photoCurEl.textContent = photoCount + t.unit_count;
    if (photoBarEl && photoNextEl) { if (!nextRow || nextRow.photos === 0) { photoBarEl.style.width = "100%"; photoNextEl.textContent = nextRow ? t.hud_no_condition : t.hud_max; } else { var pct3 = nextRow.photos > current.photos ? Math.min(100, ((photoCount - current.photos) / (nextRow.photos - current.photos)) * 100) : 100; photoBarEl.style.width = pct3.toFixed(1) + "%"; var remain3 = Math.max(0, nextRow.photos - photoCount); photoNextEl.textContent = remain3 > 0 ? t.hud_next + " " + remain3 + t.unit_count : t.hud_condition_met; } }
}

function updateStats() { var todayDist = calcTodayDistance(); var distEl = document.getElementById("dist-val"); var todayEl = document.getElementById("today-dist-val"); var memEl = document.getElementById("memory-count-val"); var photoEl = document.getElementById("photo-count-val"); if (distEl) distEl.innerHTML = (totalDistance / 1000).toFixed(2) + "<span>km</span>"; if (todayEl) todayEl.innerHTML = (todayDist / 1000).toFixed(2) + "<span>km</span>"; if (memEl) memEl.innerHTML = memories.length + "<span>°³</span>"; if (photoEl) photoEl.innerHTML = photos.length + "<span>°³</span>"; updateHud(); checkBadges(); }

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
function getImageMissionName(item) { return getTourDisplayTitle(item) || item.name || item.LBRRY_NAME || item.title || "¹Ì¼Ç Àå¼Ò"; }
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
    photoBtn.setAttribute("title", activeImageMission ? activeImageMission.name + " ÀÌ¹ÌÁö ¹Ì¼Ç" : "°¶·¯¸®¿¡¼­ »çÁø ºÒ·¯¿À±â");
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
            console.warn("Ä«¸Þ¶ó ½ÇÆÐ", e);
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
                    if (recStatusBox) recStatusBox.textContent = "»çÁø Ã³¸® Áß " + (i + 1) + "/" + list.length;
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
            console.warn("°¶·¯¸® ºÒ·¯¿À±â ½ÇÆÐ", e);
        }
    }
    document.getElementById("gallery-input").click();
}
async function openPhotoInGallery(data) {
    var sourceUri = data && (data.sourceUri || data.sourceWebPath);
    if (!sourceUri) {
        alert("¿øº» °æ·Î Á¤º¸°¡ ¾ø¾î ±â±â °¶·¯¸®·Î ¹Ù·Î ¿­ ¼ö ¾ø½À´Ï´Ù.");
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
        console.warn("¿øº» ¿­±â ½ÇÆÐ", e);
        try { window.open(sourceUri, "_blank"); }
        catch (_) { alert("¿øº» »çÁøÀ» ¿­Áö ¸øÇß½À´Ï´Ù."); }
    }
}
function focusPhotoOnMap(data) {
    map.flyTo([data.lat, data.lng], 17);
    var markerLayer = findPhotoMarker(data.id);
    if (markerLayer) markerLayer.openPopup();
    toggleSidebar(false);
}
function canUseScreenWakeLock() { return !!(navigator.wakeLock && typeof navigator.wakeLock.request === "function"); }
function requestNativeScreenAwake() { try { if (window.GiloaScreenAwake && typeof window.GiloaScreenAwake.keepScreenOnFor === "function") window.GiloaScreenAwake.keepScreenOnFor(SCREEN_AWAKE_MS); } catch (e) { console.warn("³×ÀÌÆ¼ºê È­¸é À¯Áö ½ÇÆÐ", e); } }
function releaseNativeScreenAwake() { try { if (window.GiloaScreenAwake && typeof window.GiloaScreenAwake.clearKeepScreenOn === "function") window.GiloaScreenAwake.clearKeepScreenOn(); } catch (e) { console.warn("³×ÀÌÆ¼ºê È­¸é À¯Áö ÇØÁ¦ ½ÇÆÐ", e); } }
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
    } catch (e) { console.warn("È­¸é ÄÑÁü À¯Áö ½ÇÆÐ", e); }
}
function releaseScreenAwake() {
    screenAwakeUntil = 0;
    releaseNativeScreenAwake();
    if (screenWakeLockTimer) { clearTimeout(screenWakeLockTimer); screenWakeLockTimer = null; }
    var lock = screenWakeLock;
    screenWakeLock = null;
    if (lock && !lock.released) lock.release().catch(function(e) { console.warn("È­¸é ÄÑÁü ÇØÁ¦ ½ÇÆÐ", e); });
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
        overlay.innerHTML = '<div class="auto-recording-box" role="dialog" aria-modal="true" aria-label="ÀÚµ¿ ³ìÈ­ ¾È³»"><button class="auto-recording-close" type="button" aria-label="´Ý±â">¡¿</button><div class="auto-recording-title">ÀÚµ¿ ³ìÈ­°¡ ½ÃÀÛµË´Ï´Ù</div><div class="auto-recording-copy">À§Ä¡°¡ 8½Ã°£ µ¿¾È ³ìÈ­µË´Ï´Ù.<br>²ô°í ½ÍÀ¸½Ã´Ù¸é ¿À¸¥ÂÊ ÇÏ´ÜÀÇ ³ìÈ­ÁßÁö ¹öÆ°À» ´­·¯ÁÖ¼¼¿ä.</div></div>';
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
function startTracking() { if (!navigator.geolocation) { alert("ÀÌ ºê¶ó¿ìÀú´Â À§Ä¡ ÃßÀûÀ» Áö¿øÇÏÁö ¾Ê½À´Ï´Ù."); resetRecordingState(); return; } if (!window.isSecureContext && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") { alert("À§Ä¡ ÃßÀûÀº HTTPS ¶Ç´Â localhost¿¡¼­¸¸ µ¿ÀÛÇÕ´Ï´Ù."); resetRecordingState(); return; } watchId = navigator.geolocation.watchPosition(handlePosition, handleLocationError, { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 }); }
function stopTracking() { if (watchId !== null) { navigator.geolocation.clearWatch(watchId); watchId = null; } }

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
    if (!isRecording) return;
    if (accuracy > 100) { recStatusBox.textContent = "GPS ³Ê¹« ¾àÇÔ (" + Math.round(accuracy) + "m)"; return; }
    var now = Date.now(); recStatusBox.textContent = accuracy > MAX_ACCURACY_M ? "GPS ¾àÇÔ (" + Math.round(accuracy) + "m)" : "±â·Ï Áß";
    if (pathCoordinates.length === 0) { pathCoordinates.push(createPathPoint(latlng, now)); checkStayBonus(latlng, now); updateStats(); scheduleSave(); scheduleRender(); return; }
    var last = pathCoordinates[pathCoordinates.length - 1]; var dist = distanceToPoint(latlng, last); var stayThreshold = getDynamicStayThreshold(accuracy);
    if (dist <= stayThreshold) { last.endTime = now; last.visits = (last.visits || 1) + 1; last.lat += (latlng.lat - last.lat) * 0.3; last.lng += (latlng.lng - last.lng) * 0.3; }
    else { totalDistance += dist; pathCoordinates.push(createPathPoint(latlng, now)); if (pathCoordinates.length > MAX_PATH_POINTS) compactPathData(); }
    checkStayBonus(latlng, now); updateStats(); scheduleSave(); scheduleRender();
}

function handleLocationError(err) { var messages = { 1: "À§Ä¡ ±ÇÇÑÀÌ °ÅºÎµÇ¾ú½À´Ï´Ù.", 2: "ÇöÀç À§Ä¡¸¦ È®ÀÎÇÒ ¼ö ¾ø½À´Ï´Ù.", 3: "À§Ä¡ ¿äÃ» ½Ã°£ÀÌ ÃÊ°úµÇ¾ú½À´Ï´Ù." }; alert(messages[err.code] || "À§Ä¡ Á¤º¸¸¦ °¡Á®¿ÀÁö ¸øÇß½À´Ï´Ù."); resetRecordingState(); }
function createPathPoint(latlng, timestamp) { return { lat: latlng.lat, lng: latlng.lng, startTime: timestamp, endTime: timestamp, visits: 1 }; }
function distanceToPoint(latlng, point) { return latlng.distanceTo([point.lat, point.lng]); }
function getDynamicStayThreshold(accuracy) { return Math.max(MIN_MOVE_M, Math.min(MAX_STAY_RADIUS_M, accuracy * STAY_ACCURACY_FACTOR)); }

function checkStayBonus(latlng, now) {
    if (!stayBonusAnchor) { stayBonusAnchor = latlng; stayBonusStartTime = now; return; }
    if (latlng.distanceTo(stayBonusAnchor) > STAY_BONUS_RADIUS_M) { stayBonusAnchor = latlng; stayBonusStartTime = now; return; }
    if (stayBonusPlaces.some(function(p) { return latlng.distanceTo([p.lat, p.lng]) <= STAY_BONUS_RADIUS_M; })) return;
    var remaining = STAY_BONUS_MS - (now - stayBonusStartTime);
    if (remaining > 0) { recStatusBox.textContent = "±â·Ï Áß ¡¤ Ã¼·ù º¸³Ê½º±îÁö " + Math.ceil(remaining / 60000) + "ºÐ"; return; }
    stayBonusPlaces.push({ lat: stayBonusAnchor.lat, lng: stayBonusAnchor.lng }); stayBonusLevelBoost += 1; saveBonusState(); updateStats();
    recStatusBox.textContent = "30ºÐ Ã¼·ù ´Þ¼º! ·¹º§ +1 º¸³Ê½º!"; setTimeout(function() { if (isRecording) recStatusBox.textContent = "±â·Ï Áß"; }, 4000);
}
function saveBonusState() { localStorage.setItem("giloa-stay-bonus", JSON.stringify({ boost: stayBonusLevelBoost, places: stayBonusPlaces })); }
function loadBonusState() { try { var raw = localStorage.getItem("giloa-stay-bonus"); if (!raw) return; var data = JSON.parse(raw); stayBonusLevelBoost = isFinite(data.boost) ? data.boost : 0; stayBonusPlaces = Array.isArray(data.places) ? data.places.filter(function(p) { return isFinite(p.lat) && isFinite(p.lng); }) : []; } catch (e) { console.warn("º¸³Ê½º »óÅÂ º¹¿ø ½ÇÆÐ", e); } }
function calcTodayDistance() { var todayStartMs = new Date().setHours(0, 0, 0, 0); var dist = 0; for (var i = 1; i < pathCoordinates.length; i++) { if (pathCoordinates[i].startTime >= todayStartMs) { dist += L.latLng(pathCoordinates[i].lat, pathCoordinates[i].lng).distanceTo([pathCoordinates[i - 1].lat, pathCoordinates[i - 1].lng]); } } return dist; }

function compactPathData() {
    if (pathCoordinates.length <= 1) return; var merged = [];
    for (var i = 0; i < pathCoordinates.length; i++) { var point = pathCoordinates[i]; var last = merged[merged.length - 1]; if (!last) { merged.push(Object.assign({}, point)); continue; } var timeGap = point.startTime - last.endTime; var dist = L.latLng(point.lat, point.lng).distanceTo([last.lat, last.lng]); if (dist <= MERGE_DISTANCE_M && timeGap <= MERGE_TIME_GAP_MS) { var tv = (last.visits || 1) + (point.visits || 1); last.lat = ((last.lat * (last.visits || 1)) + (point.lat * (point.visits || 1))) / tv; last.lng = ((last.lng * (last.visits || 1)) + (point.lng * (point.visits || 1))) / tv; last.endTime = Math.max(last.endTime, point.endTime); last.visits = tv; } else { merged.push(Object.assign({}, point)); } }
    pathCoordinates = shrinkOldPoints(merged, MAX_PATH_POINTS);
}
function shrinkOldPoints(points, maxPoints) { if (points.length <= maxPoints) return points; var keepTail = Math.floor(maxPoints * 0.4); var tail = points.slice(-keepTail); var head = points.slice(0, points.length - keepTail); var ratio = Math.ceil(head.length / (maxPoints - keepTail)); var filtered = head.filter(function(_, i) { return i % ratio === 0; }); return filtered.concat(tail).slice(-maxPoints); }

function addMemoryAt(lat, lng, defaultName) {
    if (!isFinite(lat) || !isFinite(lng)) { alert("±â¾ïÀ¸·Î ³²±æ À§Ä¡°¡ ¾ø½À´Ï´Ù."); return; }
    var input = prompt("ÀÌ Àå¼ÒÀÇ ÀÌ¸§À» ÀÔ·ÂÇÏ¼¼¿ä:", defaultName || "»õ·Î¿î ¹ß°ß");
    if (input === null) return;
    var now = new Date();
    var data = {
        id: String(now.getTime()),
        lat: lat,
        lng: lng,
        name: escapeHtml(input.trim() || "±â¾ïÀÇ ÁöÁ¡"),
        time: now.getTime(),
        dateString: now.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" }),
        timeString: now.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
    };
    memories.push(data);
    createMemoryMarker(data, true);
    updateMemoryList();
    updateStats();
    scheduleSave();
}
function addMemory() {
    if (!currentPos) { alert("À§Ä¡ Á¤º¸¸¦ ¼ö½Å ÁßÀÔ´Ï´Ù."); return; }
    addMemoryAt(currentPos.lat, currentPos.lng, "»õ·Î¿î ¹ß°ß");
}
function addPhotoMemory(data) {
    if (!data) return;
    addMemoryAt(data.lat, data.lng, "»çÁøÀÇ ±â¾ï");
}
function createMemoryMarker(data, openPopup) { var marker = L.marker([data.lat, data.lng], { pane: "memoryPane", icon: L.divIcon({ className: "memory-marker", html: "¡Ú", iconSize: [28, 28] }) }).addTo(map); var popupEl = document.createElement("div"); var title = document.createElement("b"); title.textContent = data.name; var info = document.createElement("small"); info.style.display = "block"; info.textContent = data.dateString + " " + (data.timeString || ""); var delBtn = document.createElement("button"); delBtn.className = "popup-delete-btn"; delBtn.textContent = "»èÁ¦"; delBtn.addEventListener("click", function() { deleteMemory(data.id); }); popupEl.appendChild(title); popupEl.appendChild(document.createElement("br")); popupEl.appendChild(info); popupEl.appendChild(delBtn); marker.bindPopup(popupEl); memoryMarkers.set(data.id, marker); if (openPopup) marker.openPopup(); }
function deleteMemory(id) { memories = memories.filter(function(m) { return m.id !== id; }); var marker = memoryMarkers.get(id); if (marker) { map.removeLayer(marker); memoryMarkers.delete(id); } updateMemoryList(); updateStats(); scheduleSave(); }
function updateMemoryList() { var container = document.getElementById("memory-list-container"); if (!container) return; if (memories.length === 0) { container.innerHTML = '<p class="empty-message">¾ÆÁ÷ ±â·ÏÀÌ ¾ø½À´Ï´Ù.</p>'; return; } container.innerHTML = ""; memories.slice().reverse().forEach(function(memo) { var item = document.createElement("div"); item.className = "memory-item"; var name = document.createElement("span"); name.className = "item-name"; name.textContent = "¡Ú " + memo.name; var date = document.createElement("span"); date.className = "item-date"; date.textContent = memo.dateString + " " + (memo.timeString || ""); var actions = document.createElement("div"); actions.className = "memory-actions"; var moveBtn = document.createElement("button"); moveBtn.className = "memory-action-btn move"; moveBtn.textContent = "ÀÌµ¿"; moveBtn.addEventListener("click", function(e) { e.stopPropagation(); map.flyTo([memo.lat, memo.lng], 17); }); var delBtn = document.createElement("button"); delBtn.className = "memory-action-btn delete"; delBtn.textContent = "»èÁ¦"; delBtn.addEventListener("click", function(e) { e.stopPropagation(); deleteMemory(memo.id); }); actions.appendChild(moveBtn); actions.appendChild(delBtn); item.appendChild(name); item.appendChild(date); item.appendChild(actions); item.addEventListener("click", function() { map.flyTo([memo.lat, memo.lng], 17); toggleSidebar(false); }); container.appendChild(item); }); }
// ¸ðµç ÅÇ (»ó´Ü6°³) ÅëÇÕ ÀüÈ¯
var ALL_TABS = ["memory", "photo", "gpx", "badge", "visit", "item"];
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
}
function switchTab(tab) { switchAllTab(tab); }
function switchCollectionTab(tab) { switchAllTab(tab); }
function updatePhotoList() { var container = document.getElementById("photo-list-container"); if (!container) return; if (photos.length === 0) { container.innerHTML = '<p class="empty-message" style="grid-column:1/-1">¾ÆÁ÷ »çÁøÀÌ ¾ø½À´Ï´Ù.</p>'; return; } container.innerHTML = ""; photos.slice().reverse().forEach(function(p) { var item = document.createElement("div"); item.className = "photo-list-item"; var img = document.createElement("img"); img.src = p.thumb || p.photo; var date = document.createElement("div"); date.className = "photo-list-date"; date.textContent = p.dateString; var del = document.createElement("div"); del.className = "photo-list-del"; del.textContent = "?"; del.addEventListener("click", function(e) { e.stopPropagation(); deletePhoto(p.id); updatePhotoList(); }); item.addEventListener("click", function() { if (p.sourceUri || p.sourceWebPath) openPhotoInGallery(p); else focusPhotoOnMap(p); }); item.addEventListener("contextmenu", function(e) { e.preventDefault(); focusPhotoOnMap(p); }); item.title = (p.sourceUri || p.sourceWebPath) ? "¿øº» »çÁø ¿­±â" : "Áöµµ¿¡¼­ º¸±â"; item.appendChild(img); item.appendChild(date); item.appendChild(del); container.appendChild(item); }); }
function findPhotoMarker(id) { var found = null; photoClusterGroup.eachLayer(function(layer) { if (layer._photoData && layer._photoData.id === id) found = layer; }); return found; }
function adjustHourDial(dir) { var next = dialHours + dir; if (next < 1 || next > 20) return; dialHours = next; updateDialUI(); }
function updateDialUI() { var labelEl = document.getElementById("dial-hour-label"); var infoEl = document.getElementById("gpx-range-info"); if (labelEl) labelEl.textContent = dialHours + "½Ã°£"; if (infoEl) infoEl.textContent = "¿À´Ã ±âÁØ ÃÖ±Ù " + dialHours + "½Ã°£ ¹ß°ÉÀ½"; }
function exportGpx() { var sinceMs = Date.now() - dialHours * 60 * 60 * 1000; var filtered = pathCoordinates.filter(function(p) { return p.startTime >= sinceMs; }); if (filtered.length === 0) { alert("ÇØ´ç ½Ã°£¿¡ ±â·ÏµÈ ¹ß°ÉÀ½ÀÌ ¾ø½À´Ï´Ù."); return; } var nameInput = document.getElementById("gpx-export-name").value.trim(); var name = nameInput || "¹ß°ÉÀ½ ÃÖ±Ù" + dialHours + "½Ã°£"; var trkpts = filtered.map(function(p) { var t = new Date(p.startTime).toISOString(); return '    <trkpt lat="' + p.lat.toFixed(7) + '" lon="' + p.lng.toFixed(7) + '">\n      <time>' + t + '</time>\n    </trkpt>'; }).join("\n"); var gpxContent = '<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="Giloa - ³ªÀÇ ´ëµ¿¿©Áöµµ"\n     xmlns="http://www.topografix.com/GPX/1/1">\n  <metadata><name>' + name + '</name><time>' + new Date().toISOString() + '</time></metadata>\n  <trk><name>' + name + '</name><trkseg>\n' + trkpts + '\n  </trkseg></trk>\n</gpx>'; var saves = loadGpxSaves(); var id = String(Date.now()); saves.push({ id: id, name: name, createdAt: Date.now(), pointCount: filtered.length, gpxContent: gpxContent }); saveGpxSaves(saves); updateGpxSavedList(); var blob = new Blob([gpxContent], { type: "application/gpx+xml" }); var url = URL.createObjectURL(blob); var a = document.createElement("a"); a.href = url; a.download = "giloa_" + name + ".gpx"; a.click(); URL.revokeObjectURL(url); document.getElementById("gpx-export-name").value = ""; document.getElementById("gpx-import-status").textContent = '? "' + name + '" ÀúÀå ¿Ï·á'; }
function loadGpxSaves() { try { return JSON.parse(localStorage.getItem(GPX_SAVES_KEY) || "[]"); } catch(e) { return []; } }
function saveGpxSaves(saves) { localStorage.setItem(GPX_SAVES_KEY, JSON.stringify(saves)); }
function updateGpxSavedList() { var container = document.getElementById("gpx-saved-list"); if (!container) return; var saves = loadGpxSaves(); if (saves.length === 0) { container.innerHTML = '<p class="empty-message">ÀúÀåµÈ ¹ß°ÉÀ½ÀÌ ¾ø½À´Ï´Ù.</p>'; return; } container.innerHTML = ""; saves.slice().reverse().forEach(function(s) { var item = document.createElement("div"); item.className = "gpx-saved-item" + (s.id === activeGpxId ? " active-route" : ""); var icon = document.createElement("span"); icon.className = "gpx-saved-icon"; icon.textContent = s.id === activeGpxId ? "??" : "??"; var info = document.createElement("div"); info.className = "gpx-saved-info"; var nameEl = document.createElement("div"); nameEl.className = "gpx-saved-name"; nameEl.textContent = s.name; var meta = document.createElement("div"); meta.className = "gpx-saved-meta"; meta.textContent = new Date(s.createdAt).toLocaleDateString("ko-KR") + " ¡¤ " + s.pointCount + "°³ Æ÷ÀÎÆ®"; info.appendChild(nameEl); info.appendChild(meta); var del = document.createElement("div"); del.className = "gpx-saved-del"; del.textContent = "?"; del.addEventListener("click", function(e) { e.stopPropagation(); deleteGpxSave(s.id); }); item.appendChild(icon); item.appendChild(info); item.appendChild(del); item.addEventListener("click", function() { toggleGpxRoute(s); }); container.appendChild(item); }); }
function deleteGpxSave(id) { if (id === activeGpxId) clearActiveGpxRoute(); saveGpxSaves(loadGpxSaves().filter(function(s) { return s.id !== id; })); updateGpxSavedList(); }
function toggleGpxRoute(save) { if (activeGpxId === save.id) { clearActiveGpxRoute(); updateGpxSavedList(); return; } clearActiveGpxRoute(); drawGpxRoute(save.gpxContent, save.id); updateGpxSavedList(); toggleSidebar(false); }
function clearActiveGpxRoute() { activeGpxLayers.forEach(function(l) { map.removeLayer(l); }); activeGpxLayers = []; activeGpxId = null; }
function drawGpxRoute(gpxContent, id) { var parser = new DOMParser(); var xmlDoc = parser.parseFromString(gpxContent, "application/xml"); var trkpts = xmlDoc.querySelectorAll("trkpt"); var latlngs = []; trkpts.forEach(function(pt) { var lat = parseFloat(pt.getAttribute("lat")); var lng = parseFloat(pt.getAttribute("lon")); if (isFinite(lat) && isFinite(lng)) latlngs.push([lat, lng]); }); if (latlngs.length === 0) return; var polyline = L.polyline(latlngs, { color: "#4db8ff", weight: 4, opacity: 0.85, dashArray: "8, 6" }).addTo(map); var startM = L.circleMarker(latlngs[0], { radius: 7, color: "#4db8ff", fillColor: "#fff", fillOpacity: 1, weight: 2.5 }).addTo(map).bindTooltip("Ãâ¹ß"); var endM = L.circleMarker(latlngs[latlngs.length - 1], { radius: 7, color: "#ff6b6b", fillColor: "#fff", fillOpacity: 1, weight: 2.5 }).addTo(map).bindTooltip("µµÂø"); activeGpxLayers = [polyline, startM, endM]; activeGpxId = id; map.fitBounds(polyline.getBounds(), { padding: [50, 50] }); }
function importGpxFile(event) { var file = event.target.files[0]; if (!file) return; var statusEl = document.getElementById("gpx-import-status"); statusEl.textContent = "ÀÐ´Â Áß..."; var reader = new FileReader(); reader.onload = function(e) { try { var name = file.name.replace(".gpx", ""); var gpxContent = e.target.result; var trkpts = new DOMParser().parseFromString(gpxContent, "application/xml").querySelectorAll("trkpt"); if (trkpts.length === 0) { statusEl.textContent = "°æ·Î ¾øÀ½"; return; } var saves = loadGpxSaves(); var id = String(Date.now()); saves.push({ id: id, name: name, createdAt: Date.now(), pointCount: trkpts.length, gpxContent: gpxContent }); saveGpxSaves(saves); clearActiveGpxRoute(); drawGpxRoute(gpxContent, id); updateGpxSavedList(); statusEl.textContent = '? "' + name + '" ºÒ·¯¿À±â ¿Ï·á'; toggleSidebar(false); } catch (err) { statusEl.textContent = "ÆÄÀÏÀ» ÀÐÁö ¸øÇß½À´Ï´Ù."; console.error(err); } }; reader.readAsText(file); event.target.value = ""; }
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
                    locationSource: typeof p.locationSource === "string" ? p.locationSource : "fallback"
                };
            }),
            totalDistance: totalDistance
        }));
    } catch (e) {
        console.error("ÀúÀå ½ÇÆÐ", e);
        if (e && e.name === "QuotaExceededError") alert("ÀúÀå °ø°£ÀÌ ºÎÁ·ÇÕ´Ï´Ù.");
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
                    locationSource: typeof p.locationSource === "string" ? p.locationSource : "fallback"
                };
            });
        }
        isFogEnabled = true;
        localStorage.setItem(FOG_ENABLED_KEY, "true");
        compactPathData();
    } catch (e) {
        console.error("º¹¿ø ½ÇÆÐ", e);
    }
}

// ¦¡¦¡ »çÁø Ã³¸® ¦¡¦¡
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
        sourceUri: typeof options.sourceUri === "string" ? options.sourceUri : "",
        sourceWebPath: typeof options.sourceWebPath === "string" ? options.sourceWebPath : "",
        sourceType: typeof options.sourceType === "string" ? options.sourceType : "",
        locationSource: typeof options.locationSource === "string" ? options.locationSource : "fallback"
    };
    photos.push(data);
    idbSavePhoto(id, popup, thumb).catch(function(e) { console.warn("IDB ÀúÀå ½ÇÆÐ", e); });
    createPhotoMarker(data, options.openPopup !== false);
    if (!options.deferUi) {
        updateStats();
        scheduleSave();
        updatePhotoList();
    }
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
        console.warn("»çÁø EXIF À§Ä¡ ÀÐ±â ½ÇÆÐ", e);
        return null;
    }
}
// EXIF GPS ÆÄ½Ì (¶óÀÌºê·¯¸® ¾øÀÌ Á÷Á¢ ±¸Çö - ´õ ¾ÈÁ¤Àû)
function parseExifGps(buffer) {
    try {
        var view = new DataView(buffer);
        if (view.getUint16(0) !== 0xFFD8) return null; // JPEG ¾Æ´Ô
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
            if (marker === 0xFFDA) break; // SOS, EXIF ¾øÀ½
            offset += 2 + view.getUint16(offset + 2);
        }
    } catch(e) { console.warn("EXIF ÆÄ½Ì ¿À·ù", e); }
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
        reader.onerror = function() { reject(reader.error || new Error("ÆÄÀÏ ÀÐ±â ½ÇÆÐ")); };
        reader.readAsArrayBuffer(file);
    });
}

function loadImageFromFile(file) {
    return new Promise(function(resolve, reject) {
        var url = URL.createObjectURL(file);
        var img = new Image();
        img.onload = function() { URL.revokeObjectURL(url); resolve(img); };
        img.onerror = function(err) { URL.revokeObjectURL(url); reject(err || new Error("ÀÌ¹ÌÁö ·Îµå ½ÇÆÐ")); };
        img.src = url;
    });
}

function loadImageFromUrl(url) {
    return new Promise(function(resolve, reject) {
        var img = new Image();
        img.onload = function() { resolve(img); };
        img.onerror = function(err) { reject(err || new Error("ÀÌ¹ÌÁö ·Îµå ½ÇÆÐ")); };
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
            else reject(new Error("heic2any ·Îµå ½ÇÆÐ"));
        };
        script.onerror = function() { reject(new Error("heic2any ½ºÅ©¸³Æ® ·Îµå ½ÇÆÐ")); };
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
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        if (recStatusBox) recStatusBox.textContent = "»çÁø Ã³¸® Áß " + (i + 1) + "/" + files.length;
        try {
            var gps = null;
            if (isJpegFile(file)) {
                try { gps = parseExifGps(await readFileAsArrayBuffer(file)); } catch (e) { console.warn("EXIF ÀÐ±â ½ÇÆÐ:", file.name, e); }
            }
            var lat = gps ? gps.lat : (currentPos ? currentPos.lat : map.getCenter().lat);
            var lng = gps ? gps.lng : (currentPos ? currentPos.lng : map.getCenter().lng);
            var normalizedFile = await convertHeicToJpegFile(file);
            var img = await loadImageFromFile(normalizedFile);
            processPhoto(img, new Date(), lat, lng, { deferUi: true, openPopup: files.length === 1, sourceType: "file-input", locationSource: gps ? "exif" : "fallback", mission: activeImageMission ? { name: activeImageMission.name } : null });
            loadedCount += 1;
        } catch (e) {
            failedCount += 1;
            console.warn("»çÁø Ã³¸® ½ÇÆÐ:", file.name, e);
        }
    }
    if (loadedCount > 0) {
        updateStats();
        scheduleSave();
        updatePhotoList();
    }
    event.target.value = "";
    syncRecordingUI();
    if (failedCount > 0) alert("ÀÏºÎ »çÁø(" + failedCount + "°³)Àº Ã³¸®ÇÏÁö ¸øÇß½À´Ï´Ù.");
}
function createPhotoMarker(data, openPopup) {
    var size = getPhotoMarkerSize();
    lastPhotoMarkerSize = size;
    var marker = L.marker([data.lat, data.lng], { pane: "photoPane", icon: buildPhotoMarkerIcon(data.thumb, size) });
    marker._photoData = data;
    var popupEl = document.createElement("div");
    popupEl.className = "photo-popup";
    var img = document.createElement("img");
    img.src = data.photo || data.thumb;
    img.style.cssText = "width:72vw;max-width:280px;border-radius:8px;margin-bottom:8px;display:block;cursor:pointer;";
    img.title = "ÇÑ ¹ø ÅÇÇÏ¸é ±â¾ï ÀúÀå, µÎ ¹ø ÅÇÇÏ¸é °¶·¯¸® ¿­±â";
    img.addEventListener("click", function(e) {
        e.stopPropagation();
        if (photoTapTimer) {
            clearTimeout(photoTapTimer);
            photoTapTimer = null;
            openPhotoInGallery(data);
            return;
        }
        photoTapTimer = setTimeout(function() {
            photoTapTimer = null;
            addPhotoMemory(data);
        }, 280);
    });
    var info = document.createElement("div");
    info.style.cssText = "font-size:12px;color:rgba(255,255,255,0.6);text-align:center;margin:6px 0 8px;";
    info.textContent = data.dateString + " " + data.timeString;
    var delBtn = document.createElement("button");
    delBtn.className = "popup-delete-btn";
    delBtn.textContent = "»çÁø »èÁ¦";
    delBtn.addEventListener("click", function() { deletePhoto(data.id); marker.closePopup(); });
    popupEl.appendChild(img);
    popupEl.appendChild(info);
    var hasSource = !!(data.sourceUri || data.sourceWebPath);
    var note = document.createElement("div");
    note.style.cssText = "font-size:11px;color:rgba(255,255,255,0.52);text-align:center;margin:0 0 8px;";
    var locationLabel = data.locationSource === "exif" ? "EXIF ÃÔ¿µ À§Ä¡" : "ÇöÀç À§Ä¡ ±âÁØ";
    note.textContent = locationLabel + " ¡¤ ÇÑ ¹ø ÅÇÇÏ¸é ±â¾ï ÀúÀå, µÎ ¹ø ÅÇÇÏ¸é °¶·¯¸®¿¡¼­ ¿±´Ï´Ù";
    popupEl.appendChild(note);
    popupEl.appendChild(delBtn);
    marker.bindPopup(popupEl);
    photoClusterGroup.addLayer(marker);
    if (openPopup) marker.openPopup();
}
function deletePhoto(id) { photos = photos.filter(function(p) { return p.id !== id; }); var marker = findPhotoMarker(id); if (marker) photoClusterGroup.removeLayer(marker); idbDeletePhoto(id).catch(function(e) { console.warn("IDB »èÁ¦ ½ÇÆÐ", e); }); updateStats(); scheduleSave(); }
function escapeHtml(value) { return String(value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"); }
function renderStoredMarkers() { memories.forEach(function(m) { createMemoryMarker(m, false); }); }
function renderStoredPhotoMarkers() {
    if (photos.length === 0) return;
    idbGetAllPhotos().then(function(idbList) {
        var idbMap = new Map(idbList.map(function(r) { return [r.id, r]; }));
        photos.forEach(function(p) {
            var img = idbMap.get(p.id);
            if (!img) return;
            p.thumb = img.thumb || img.photo || p.thumb;
            p.photo = img.photo || p.thumb;
            if (p.thumb) createPhotoMarker(p, false);
        });
    }).catch(function(e) { console.warn("IDB ºÒ·¯¿À±â ½ÇÆÐ", e); });
}
function initGpxDial() { dialHours = 12; updateDialUI(); }
function initHudTapTargets() { var distItem = document.querySelector(".hud-prog-item:nth-child(1)"); var memItem = document.querySelector(".hud-prog-item:nth-child(2)"); var photoItem = document.querySelector(".hud-prog-item:nth-child(3)"); if (distItem) { distItem.style.cursor = "pointer"; distItem.addEventListener("click", function() { toggleSidebar(true); switchTab("gpx"); }); } if (memItem) { memItem.style.cursor = "pointer"; memItem.addEventListener("click", function() { toggleSidebar(true); switchTab("memory"); }); } if (photoItem) { photoItem.style.cursor = "pointer"; photoItem.addEventListener("click", function() { toggleSidebar(true); switchTab("photo"); }); } }

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

// ¦¡¦¡ TourAPI °ü±¤Áö ÃßÃµ ¦¡¦¡
var TOUR_API_KEY = "c6995449e23f94083d88f198fe2617a8f957a2063bc6ac0d19816c9f27a0ed6c";
var TOUR_API_BASES = { ko: "KorService2", en: "EngService2", ja: "JpnService2", zh: "ChsService2" };
function getTourApiBase(lang) { return "https://apis.data.go.kr/B551011/" + (TOUR_API_BASES[lang || currentLang] || TOUR_API_BASES.ko); }
function getTourEndpoint(path, lang) { return getTourApiBase(lang) + "/" + path; }
function formatTourCount(count) { var suffix = ((UI_TEXT[currentLang] || UI_TEXT.ko).count_suffix); return currentLang === "ko" || currentLang === "ja" || currentLang === "zh" ? String(count) + suffix : String(count) + " " + suffix; }
var tourItems = []; var festivalItems = []; var tourExpanded = false;
var tourFetchTimer = null; var tourMarkers = []; var TOUR_VISIBLE_COUNT = 3;
var TOUR_TYPE_NAMES = {
    ko: { "12": "°ü±¤Áö", "14": "¹®È­½Ã¼³", "15": "ÃàÁ¦/Çà»ç", "25": "¿©ÇàÄÚ½º", "28": "·¹Æ÷Ã÷", "32": "¼÷¹Ú", "38": "¼îÇÎ", "39": "À½½ÄÁ¡" },
    en: { "12": "Attraction", "14": "Culture", "15": "Festival", "25": "Course", "28": "Leports", "32": "Stay", "38": "Shopping", "39": "Food" },
    ja: { "12": "?ÎÃò¢", "14": "Ùþûùã¿àâ", "15": "ð®ªê", "25": "Õéú¼«³?«¹", "28": "«ì«Ý?«Ä", "32": "âÖÚÕ", "38": "«·«ç«Ã«Ô«ó«°", "39": "«°«ë«á" },
    zh: { "12": "ÌØïÃ", "14": "Ùþûù?ã¿", "15": "?îð", "25": "Õéú¼ÖØ?", "28": "ýÌ???", "32": "ñ¬âÖ", "38": "?Úª", "39": "Ú¸ãÝ" }
};
var TOUR_TYPE_LABELS = {
    ko: { "25": "¿©Çà", "28": "·¹Æ÷Ã÷", "38": "¼îÇÎ", "15": "ÃàÁ¦", "12": "°ü±¤", "14": "¹®È­", default: "°ü±¤" },
    en: { "25": "Course", "28": "Leports", "38": "Shop", "15": "Fest", "12": "Spot", "14": "Culture", default: "Spot" },
    ja: { "25": "«³?«¹", "28": "«ì«Ý?«Ä", "38": "ØâÚª", "15": "ð®ªê", "12": "?ÎÃ", "14": "Ùþûù", default: "?ÎÃ" },
    zh: { "25": "ÖØ?", "28": "??", "38": "?Úª", "15": "?îð", "12": "ÌØïÃ", "14": "Ùþûù", default: "ÌØïÃ" }
};
function getTourTypeName(contentTypeId) { var names = TOUR_TYPE_NAMES[currentLang] || TOUR_TYPE_NAMES.ko; return names[String(contentTypeId)] || names["12"]; }
function getTourTypeLabel(contentTypeId) { var labels = TOUR_TYPE_LABELS[currentLang] || TOUR_TYPE_LABELS.ko; return labels[String(contentTypeId)] || labels.default; }
var TOUR_TYPE_META = {
    "25": { label: "¿©Çà", color: "#ef4444", fill: "rgba(239,68,68,0.18)", border: "rgba(239,68,68,0.55)" },
    "28": { label: "·¹Æ÷Ã÷", color: "#38bdf8", fill: "rgba(56,189,248,0.18)", border: "rgba(56,189,248,0.55)" },
    "38": { label: "¼îÇÎ", color: "#facc15", fill: "rgba(250,204,21,0.18)", border: "rgba(250,204,21,0.58)" },
    "15": { label: "ÃàÁ¦", color: "#c084fc", fill: "rgba(192,132,252,0.18)", border: "rgba(192,132,252,0.58)" },
    "12": { label: "°ü±¤", color: "#fb923c", fill: "rgba(251,146,60,0.18)", border: "rgba(251,146,60,0.58)" },
    "14": { label: "¹®È­", color: "#a78bfa", fill: "rgba(167,139,250,0.18)", border: "rgba(167,139,250,0.58)" },
    default: { label: "°ü±¤", color: "#fb923c", fill: "rgba(251,146,60,0.18)", border: "rgba(251,146,60,0.58)" }
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
        if (tourExpanded) renderFestivalStrip();
    }).catch(function(err) { console.warn("ÃàÁ¦ API ¿¡·¯", err); });
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
        var nameEl = document.createElement("div"); nameEl.className = "festival-card-name"; nameEl.textContent = getTourDisplayTitle(item) || "ÃàÁ¦";
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
            addVisitStamp(item.title, getTourTypeName("15"), parseFloat(item.mapy), parseFloat(item.mapx));
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
    }).catch(function(err) { loadingEl.style.display = "none"; emptyEl.style.display = tourExpanded ? "" : "none"; emptyEl.textContent = (UI_TEXT[currentLang] || UI_TEXT.ko).empty_tour; countEl.textContent = ""; console.warn("TourAPI ¿¡·¯", err); });
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
            var nameEl = document.createElement("div"); nameEl.className = "tour-card-name"; nameEl.textContent = getTourDisplayTitle(item) || "ÀÌ¸§ ¾øÀ½";
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
    var tel = item.tel ? "<br><a href='tel:" + item.tel + "' style='color:#4db8ff;font-size:12px;'>?? " + escapeHtml(item.tel) + "</a>" : "";
    var tag = "<span class='tour-popup-tag' style='color:" + meta.color + ";border-color:" + meta.border + ";background:" + meta.fill + ";'>" + escapeHtml(typeName) + "</span>";
    addVisitStamp(item.title, typeName, lat, lng);
    L.popup({ className: "tour-popup" }).setLatLng([lat, lng]).setContent("<b>" + escapeHtml(title) + "</b><br>" + tag + "<br><small>" + escapeHtml(addr) + "</small>" + tel).openOn(map);
}

function clearTourMarkers() { tourMarkers.forEach(function(m) { map.removeLayer(m); }); tourMarkers = []; }
function addTourMarkers() { clearTourMarkers(); tourItems.forEach(function(item) { var lat = parseFloat(item.mapy); var lng = parseFloat(item.mapx); if (!isFinite(lat) || !isFinite(lng)) return; var meta = getTourTypeMeta(item.contenttypeid); var icon = L.divIcon({ className: "tour-map-marker-wrap", html: "<div class='tour-map-marker' style='--tour-color:" + meta.color + ";--tour-fill:" + meta.fill + ";--tour-border:" + meta.border + ";'><span class='tour-map-dot'></span><span class='tour-map-label'>" + escapeHtml(meta.label) + "</span></div>", iconSize: [76, 28], iconAnchor: [10, 14] }); var marker = L.marker([lat, lng], { pane: "tourPane", icon: icon, title: (getTourTypeName(item.contenttypeid) || meta.label) + " - " + (getTourDisplayTitle(item) || "") }).addTo(map); marker.on("click", function() { showTourPopup(item); }); tourMarkers.push(marker); }); }


// ¦¡¦¡ ¼­¿ï °ø°øµµ¼­°ü À§Ä¡Á¤º¸ ¦¡¦¡
var SEOUL_LIBRARY_API_KEY = "756b506d69646f7439356a526f5a47";
var SEOUL_LIBRARY_API_URL = "http://openapi.seoul.go.kr:8088/" + SEOUL_LIBRARY_API_KEY + "/json/SeoulPublicLibraryInfo/1/300/";
var libraryItems = [];
var libraryMarkers = [];
var LIBRARY_MARKER_COLOR = "#2563eb";

function getLibraryLabel() {
    var labels = { ko: "µµ¼­°ü", en: "Library", ja: "?ßöÎ½", zh: "???" };
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
    var tel = item.TEL_NO ? "<br><a href='tel:" + item.TEL_NO + "' style='color:#4ade80;font-size:12px;'>?? " + escapeHtml(item.TEL_NO) + "</a>" : "";
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
    }).catch(function(err) { console.warn("¼­¿ï µµ¼­°ü API ¿¡·¯", err); });
}
function scheduleTourFetch() { if (tourFetchTimer) clearTimeout(tourFetchTimer); tourFetchTimer = setTimeout(function() { tourFetchTimer = null; tourExpanded = false; fetchTourSpots(); fetchFestivals(); }, 1200); }
map.on("moveend", scheduleTourFetch);
map.on("click", function() { collapseTourPanel(); });
scheduleTourFetch();
fetchLibraries();

// ¦¡¦¡ VARCO ¹ø¿ª ¦¡¦¡
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
    ko: { sidebar_title: "³ªÀÇ ±â·Ïµé", fog_label: "¾îµÒ È¿°ú", fog_on: "ÄÑÁü", fog_off: "²¨Áü", tab_memory: "±â¾ï", tab_photo: "»çÁø", tab_gpx: "¹ß°ÉÀ½", tab_badge: "¹îÁö", tab_visit: "¹æ¹®", tab_item: "¾ÆÀÌÅÛ", rec_idle: "´ë±â Áß", rec_active: "±â·Ï Áß", empty_memory: "¾ÆÁ÷ ±â·ÏÀÌ ¾ø½À´Ï´Ù.", empty_photo: "¾ÆÁ÷ »çÁøÀÌ ¾ø½À´Ï´Ù.", tour_title: "?? ÁÖº¯ °ü±¤Áö", festival_label: "?? ÁÖº¯ ÃàÁ¦", festival_badge: "?? ÃàÁ¦", loading: "°Ë»ö Áß...", empty_tour: "ÀÌ Áöµµ¿¡ °ü±¤Áö°¡ ¾ø¾î¿ä", close: "´Ý±â", count_suffix: "°÷", unit_count: " °³", hud_title_label: "ÇöÀç ÄªÈ£", hud_level_label: "LV", hud_dist_label: "ÀÌµ¿ °Å¸®", hud_memory_label: "±â¾ï °³¼ö", hud_photo_label: "»çÁø °³¼ö", hud_next: "´ÙÀ½±îÁö", hud_condition_met: "Á¶°Ç ÃæÁ·!", hud_no_condition: "Á¶°Ç ¾øÀ½", hud_max: "ÃÖ°í!", hud_max_level: "ÃÖ°í ·¹º§ ´Þ¼º!", help_tab_ask: "? ¹®ÀÇÇÏ±â", help_tab_info: "! ¼³¸íº¸±â", help_ask_copy: "»ç¿ë Áß ºÒÆíÇÑ Á¡ÀÌ³ª °ÇÀÇ»çÇ×Àº<br>Ä«Ä«¿ÀÅå ¿ÀÇÂÃ¤ÆÃÀ¸·Î µé·ÁÁÖ¼¼¿ä", help_notice: "ÇöÀç ÀúÀåµÈ GPX µ¥ÀÌÅÍ´Â ¼­¹ö·Î Àü¼ÛµÇÁö ¾Ê¾Æ¿ä.<br>¸ðµç ±â·ÏÀº <b>¿ÀÁ÷ ÀÌ ±â±â ¾È¿¡¼­¸¸</b> ÀúÀåµÇ°í º¸¿©Á®¿ä.", help_link: "?? Ä«Ä«¿ÀÅå ¿ÀÇÂÃ¤ÆÃ ¹®ÀÇ", help_record_title: "³ìÈ­ ¹öÆ°", help_record_desc: "´©¸£¸é GPS °æ·Î ±â·Ï ½ÃÀÛ. ´Ù½Ã ´©¸£¸é ÁßÁö.", help_photo_title: "»çÁø ¹öÆ°", help_photo_desc: "°¶·¯¸®¿¡¼­ »çÁøÀ» ºÒ·¯¿Í ÀúÀåÇØ¿ä. ÀÇ¹Ì ÀÖ´Â Àå¼Ò¸¦ ¾²·Á¸é Áöµµ¿¡ ÂïÈù »çÁøÀ» µÎ ¹ø ´­·¯ ÀÔ·ÂÇØ ÁÖ¼¼¿ä.", help_memory_title: "º°Ç¥ ¹öÆ°", help_memory_desc: "ÇöÀç À§Ä¡¿¡ ÀÌ¸§À» ºÙ¿© ±â¾ïÀ¸·Î ³²°Ü¿ä.", help_location_title: "ÇöÀç À§Ä¡ ¹öÆ°", help_location_desc: "Á¶ÁØÁ¡ ¾ÆÀÌÄÜÀÌ¿¡¿ä. Áöµµ¸¦ ³» ÇöÀç À§Ä¡·Î ´Ù½Ã ÀÌµ¿½ÃÄÑ¿ä.", help_status_title: "»óÅÂ ¹öÆ°", help_status_desc: "»ç¶÷ ¾ÆÀÌÄÜÀÌ¿¡¿ä. ³» ÇöÀç ÄªÈ£, ·¹º§, ÁøÇà »óÅÂ¸¦ È®ÀÎÇÒ ¼ö ÀÖ¾î¿ä.", help_menu_title: "¸Þ´º ¹öÆ° (»ó´Ü ¿ÞÂÊ)", help_menu_desc: "ÇÜ¹ö°Å ¾ÆÀÌÄÜÀÌ¿¡¿ä. ±â¾ï, »çÁø, ¹ß°ÉÀ½, ¹îÁö, ¹æ¹®, ¾ÆÀÌÅÛ ¸ñ·ÏÀ» ¿­¾îº¼ ¼ö ÀÖ¾î¿ä." },
    en: { sidebar_title: "My Records", fog_label: "Fog Effect", fog_on: "On", fog_off: "Off", tab_memory: "Memory", tab_photo: "Photo", tab_gpx: "Steps", tab_badge: "Badges", tab_visit: "Visits", tab_item: "Items", rec_idle: "Standby", rec_active: "Recording", empty_memory: "No records yet.", empty_photo: "No photos yet.", tour_title: "?? Nearby Places", festival_label: "?? Nearby Festivals", festival_badge: "?? Festivals", loading: "Searching...", empty_tour: "No nearby places", close: "Close", count_suffix: "places", unit_count: "", hud_title_label: "Current Title", hud_level_label: "LV", hud_dist_label: "Distance", hud_memory_label: "Memories", hud_photo_label: "Photos", hud_next: "Next", hud_condition_met: "Met!", hud_no_condition: "No condition", hud_max: "Max!", hud_max_level: "Max level reached!", help_tab_ask: "? Contact", help_tab_info: "! Guide", help_ask_copy: "Tell us about issues or suggestions<br>through KakaoTalk open chat.", help_notice: "Saved GPX data is not sent to the server.<br>All records are stored and shown <b>only on this device</b>.", help_link: "?? KakaoTalk Open Chat", help_record_title: "Record Button", help_record_desc: "Tap to start GPS route recording. Tap again to stop.", help_photo_title: "Photo Button", help_photo_desc: "Take a photo now or import one from your gallery.", help_memory_title: "Star Button", help_memory_desc: "Name your current location and save it as a memory.", help_location_title: "Current Location Button", help_location_desc: "Move the map back to your current location.", help_status_title: "Status Button (Bottom Center)", help_status_desc: "Check your current title and progress.", help_menu_title: "Menu Button (Top Left)", help_menu_desc: "View your memories, photos, and step records." },
    ja: { sidebar_title: "ÑÀ?", fog_label: "Ùö?Íý", fog_on: "«ª«ó", fog_off: "«ª«Õ", tab_memory: "ÑÀåã", tab_photo: "??", tab_gpx: "ðëîæ", tab_badge: "«Ð«Ã«¸", tab_visit: "Û¾Ùý", tab_item: "«¢«¤«Æ«à", rec_idle: "ÓâÑ¦ñé", rec_active: "ÑÀ?ñé", empty_memory: "ÑÀ?ªÏªÞªÀª¢ªêªÞª»ªó¡£", empty_photo: "??ªÏªÞªÀª¢ªêªÞª»ªó¡£", tour_title: "?? ñ²?«¹«Ý«Ã«È", festival_label: "?? ñ²?ªÎð®ªê", festival_badge: "?? ð®ªê", loading: "?ßãñé...", empty_tour: "ñ²?«¹«Ý«Ã«Èª¬ª¢ªêªÞª»ªó", close: "øÍª¸ªë", count_suffix: "Ëì", unit_count: "Ëì", hud_title_label: "úÞî¤ªÎ??", hud_level_label: "LV", hud_dist_label: "ì¹ÔÑËå×î", hud_memory_label: "ÑÀåã?", hud_photo_label: "???", hud_next: "ó­ªÞªÇ", hud_condition_met: "?ËìÓ¹à÷!", hud_no_condition: "?ËìªÊª·", hud_max: "õÌÍÔ!", hud_max_level: "õÌÍÔ«ì«Ù«ëÓ¹à÷!", help_tab_ask: "? ªªÙýª¤ùêªïª»", help_tab_info: "! «¬«¤«É", help_ask_copy: "ª´××éÄñéªÎÜôøµªÊïÃªäª´ëòÌ¸ªò<br>KakaoTalk«ª?«×«ó«Á«ã«Ã«ÈªÇªªÚ¤ª«ª»ª¯ªÀªµª¤¡£", help_notice: "ÜÁðíªµªìª¿GPX«Ç?«¿ªÏ«µ?«Ð?ªØáêãáªµªìªÞª»ªó¡£<br>ª¹ªÙªÆªÎÑÀ?ªÏ<b>ª³ªÎÓ®ØÇ?ªÀª±</b>ªËÜÁðí?øúãÆªµªìªÞª¹¡£", help_link: "?? KakaoTalk«ª?«×«ó«Á«ã«Ã«È", help_record_title: "??«Ü«¿«ó", help_record_desc: "«¿«Ã«×ª¹ªëªÈGPS?ÖØÑÀ?ªòËÒã·¡£ªâª¦ìéÓø«¿«Ã«×ª¹ªëªÈïÎò­ª·ªÞª¹¡£", help_photo_title: "??«Ü«¿«ó", help_photo_desc: "ÐÑõÉç¯ª¹ªëª«¡¢«®«ã«é«ê?ª«ªé??ªò?ªß?ªóªÇÜÁðíª·ªÞª¹¡£", help_memory_title: "àø«Ü«¿«ó", help_memory_desc: "úÞî¤ò¢ªËÙ£îñªòÜõª±ªÆÑÀåãªÈª·ªÆ?ª·ªÞª¹¡£", help_location_title: "úÞî¤ò¢«Ü«¿«ó", help_location_desc: "ò¢?ªòúÞî¤ò¢ªØ?ª·ªÞª¹¡£", help_status_title: "«¹«Æ?«¿«¹«Ü«¿«ó£¨ù»Ý»ñéäç£©", help_status_desc: "úÞî¤ªÎ??ªÈòäú¼?üÏªòü¬ìãªÇª­ªÞª¹¡£", help_menu_title: "«á«Ë«å?«Ü«¿«ó£¨ñ§ß¾£©", help_menu_desc: "ÑÀåã¡¢??¡¢ðëîæªÎìé?ªòÌ¸ªéªìªÞª¹¡£" },
    zh: { sidebar_title: "ä²îÜ??", fog_label: "?üù", fog_on: "?", fog_off: "?", tab_memory: "??", tab_photo: "ðÎø¸", tab_gpx: "ðëîé", tab_badge: "ýÅíñ", tab_visit: "??", tab_item: "Úªù¡", rec_idle: "ÓâÏõñé", rec_active: "??ñé", empty_memory: "??êó??¡£", empty_photo: "??êóðÎø¸¡£", tour_title: "?? Ý¾ÐÎÌØïÃ", festival_label: "?? Ý¾ÐÎ?îð", festival_badge: "?? ?îð", loading: "â¤ßãñé...", empty_tour: "Ý¾ÐÎ?êóÌØïÃ", close: "??", count_suffix: "?", unit_count: "?", hud_title_label: "?îñ??", hud_level_label: "LV", hud_dist_label: "ì¹?Ëå?", hud_memory_label: "???Õá", hud_photo_label: "ðÎø¸?Õá", hud_next: "Ëå?ù»ìéÜÆ", hud_condition_met: "?Ëìì«?à÷!", hud_no_condition: "Ùé?Ëì", hud_max: "õÌÍÔ!", hud_max_level: "ì«?õÌÍÔÔõ?!", help_tab_ask: "? íª?", help_tab_info: "! ò¦Ñõ", help_ask_copy: "ÞÅéÄñééçÓðÜôøµûäêóËï??<br>?÷×? KakaoTalk ?Û¯Öýô¸Í±?ä²?¡£", help_notice: "ì«ÜÁðíîÜ GPX ?ËßÜô??áêÓðÜ×?Ðï¡£<br>á¶êó??<b>ñþ?ÜÁðíî¤Üâ??ñé</b>??ãÆ¡£", help_link: "?? KakaoTalk ?Û¯Öýô¸", help_record_title: "??äÎ?", help_record_desc: "ïÃ??ã· GPS ÖØ???£¬î¢ó­ïÃ?ïÎò­¡£", help_photo_title: "ðÎø¸äÎ?", help_photo_desc: "Ø¡?ÚÐðÎûä?ßÓ??ìýðÎø¸?ÜÁðí¡£", help_memory_title: "àø?äÎ?", help_memory_desc: "??îñêÈöÇÙ¤Ù£?ÜÁðí???¡£", help_location_title: "?îñêÈöÇäÎ?", help_location_desc: "?ò¢?ì¹üÞ?îñêÈöÇ¡£", help_status_title: "??äÎ?£¨î¼Ý»ñéäç£©", help_status_desc: "?Ê×?îñ??ûú?Óø¡£", help_menu_title: "óø?äÎ?£¨ñ§ß¾ÊÇ£©", help_menu_desc: "?Ê×??¡¢ðÎø¸ûúðëîéÖªøú¡£" }
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
    var labels = document.querySelectorAll(".hud-prog-label");
    if (labels[0]) labels[0].textContent = t.hud_dist_label;
    if (labels[1]) labels[1].textContent = t.hud_memory_label;
    if (labels[2]) labels[2].textContent = t.hud_photo_label;
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
    return /[¤¡-¤¾¤¿-¤Ó°¡-ÆR]/.test(String(text || ""));
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

// ¦¡¦¡ ¼öÁýÇÔ ¦¡¦¡
var COLLECTION_KEY = "giloa-collection";
var badges = []; var visitStamps = []; var items = [];

var BADGE_DEFS = [
    { id: "first_memory", icon: "¡Ú", name: "Ã¹ ±â¾ï", desc: "Ã¹ ¹øÂ° ±â¾ïÀ» ³²°å¾î¿ä" },
    { id: "first_photo", icon: "??", name: "Ã¹ »çÁø", desc: "Ã¹ ¹øÂ° »çÁøÀ» Âï¾ú¾î¿ä" },
    { id: "first_10km", icon: "??", name: "10km ´Þ¼º", desc: "´©Àû 10km¸¦ °É¾ú¾î¿ä" },
    { id: "first_50km", icon: "??", name: "50km ´Þ¼º", desc: "´©Àû 50km¸¦ °É¾ú¾î¿ä" },
    { id: "early_bird", icon: "??", name: "»õº® Å½Çè°¡", desc: "»õº® 5½Ã ÀÌÀü¿¡ ±â·ÏÇß¾î¿ä" },
    { id: "memory_5", icon: "??", name: "±â¾ï ¼öÁý°¡", desc: "±â¾ïÀ» 5°³ ³²°å¾î¿ä" },
    { id: "photo_10", icon: "??", name: "»çÁøÀÛ°¡", desc: "»çÁøÀ» 10Àå Âï¾ú¾î¿ä" },
    { id: "tour_visit", icon: "??", name: "°ü±¤ Å½Çè°¡", desc: "°ü±¤Áö¸¦ Ã³À½ ¹æ¹®Çß¾î¿ä" },
    { id: "festival_visit", icon: "??", name: "ÃàÁ¦ ¸¶´Ï¾Æ", desc: "ÃàÁ¦¸¦ Ã³À½ ¹æ¹®Çß¾î¿ä" },
];

function loadCollection() {
    try {
        var raw = localStorage.getItem(COLLECTION_KEY);
        if (!raw) return;
        var data = JSON.parse(raw);
        badges = Array.isArray(data.badges) ? data.badges : [];
        visitStamps = Array.isArray(data.visitStamps) ? data.visitStamps : [];
        items = Array.isArray(data.items) ? data.items : [];
        updateBadgeList();
        updateVisitList();
    } catch(e) { console.warn("¼öÁýÇÔ º¹¿ø ½ÇÆÐ", e); }
}

function saveCollection() {
    localStorage.setItem(COLLECTION_KEY, JSON.stringify({ badges: badges, visitStamps: visitStamps, items: items }));
}

function earnBadge(badgeId) {
    if (badges.some(function(b) { return b.id === badgeId; })) return;
    var def = BADGE_DEFS.find(function(d) { return d.id === badgeId; });
    if (!def) return;
    var now = new Date();
    badges.push({ id: badgeId, earnedAt: now.getTime(), dateString: now.toLocaleDateString("ko-KR") });
    saveCollection();
    updateBadgeList();
    showCollectionToast(def.icon + " ¹îÁö È¹µæ! " + def.name);
}

function addVisitStamp(name, type, lat, lng) {
    var now = new Date();
    visitStamps.push({ name: name, type: type, lat: lat, lng: lng, visitedAt: now.getTime(), dateString: now.toLocaleDateString("ko-KR") });
    saveCollection();
    updateVisitList();
    if (type === "°ü±¤Áö" || type === "¹®È­½Ã¼³") earnBadge("tour_visit");
    if (type === "ÃàÁ¦") earnBadge("festival_visit");
    showCollectionToast("?? " + name + " ¹æ¹® ±â·Ï!");
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
    if (badges.length === 0) { container.innerHTML = '<p class="empty-message">¾ÆÁ÷ È¹µæÇÑ ¹îÁö°¡ ¾ø½À´Ï´Ù.</p>'; return; }
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
    if (visitStamps.length === 0) { container.innerHTML = '<p class="empty-message">¾ÆÁ÷ ¹æ¹®ÇÑ Àå¼Ò°¡ ¾ø½À´Ï´Ù.</p>'; return; }
    container.innerHTML = "";
    visitStamps.slice().sort(function(a,b){ return b.visitedAt - a.visitedAt; }).forEach(function(v) {
        var typeIcons = { "°ü±¤Áö": "??", "¹®È­½Ã¼³": "??", "ÃàÁ¦": "??", "·¹Æ÷Ã÷": "?", "¿©ÇàÄÚ½º": "??" };
        var icon = typeIcons[v.type] || "??";
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

// ¦¡¦¡ ½Ã¾ß°¢ ºÎÃ¤²Ã ¦¡¦¡
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









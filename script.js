// ── 앱 시작 시 위치 권한 요청 ──
async function requestLocationPermission() {
    if (window.Capacitor && window.Capacitor.isNativePlatform()) {
        try {
            const { Geolocation } = window.Capacitor.Plugins;
            await Geolocation.requestPermissions();
            const { BackgroundGeolocation } = window.Capacitor.Plugins;
            if (BackgroundGeolocation) {
                await BackgroundGeolocation.addWatcher({
                    backgroundMessage: "길로아가 경로를 기록하고 있어요",
                    backgroundTitle: "길로아 위치 기록 중",
                    requestPermissions: true, stale: false, distanceFilter: 10
                }, function(location, error) {
                    if (error) { console.warn("BG 위치 에러", error); return; }
                    if (location && isRecording) { handlePosition({ coords: { latitude: location.latitude, longitude: location.longitude, accuracy: location.accuracy } }); }
                });
            }
        } catch (e) { console.warn("권한 요청 실패", e); }
    }
}
requestLocationPermission();

const STORAGE_KEY = "giloa-v7";
const FOG_ENABLED_KEY = "giloa-fog-enabled";
const GPX_SAVES_KEY = "giloa-gpx-saves";
const FOG_ALPHA_BASE = 0.80;
const FOG_ALPHA_PER_LV = 0.01;
function getFogAlpha() { const lv = calcLevel().level; return Math.max(0, FOG_ALPHA_BASE - (lv - 1) * FOG_ALPHA_PER_LV); }
const FOG_RADIUS_M = 18;
const MIN_MOVE_M = 15;
const MAX_ACCURACY_M = 50;
const STAY_ACCURACY_FACTOR = 0.6;
const MAX_STAY_RADIUS_M = 36;
const SAVE_DELAY_MS = 800;
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

const SPEED_LIMIT_WALK = 7 / 3.6;
const SPEED_LIMIT_BIKE = 30 / 3.6;

// ── IndexedDB ──
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
    }).catch(function(e) { console.warn("사진 경량화 실패", e); });
}

// ── 상태 변수 ──
let isRecording = false; let photos = []; let isFogEnabled = true; let isHudExpanded = false;
let currentPos = null; let pathCoordinates = []; let memories = []; let totalDistance = 0;
let playerMarker = null; let playerHeading = null; let watchId = null; let saveTimer = null; let rafId = null;
const memoryMarkers = new Map();
let activeGpxId = null; let activeGpxLayers = []; let dialHours = 12;
const STAY_BONUS_MS = 30 * 60 * 1000; const STAY_BONUS_RADIUS_M = 50;
let stayBonusStartTime = null; let stayBonusAnchor = null; let stayBonusLevelBoost = 0; let stayBonusPlaces = [];
let lastPhotoMarkerSize = null;
let heicLoaderPromise = null;
const recBtn = document.getElementById("rec-btn");
const recStatusBox = document.getElementById("rec-status-box");

// ── 지도 초기화 ──
const map = L.map("map", { zoomControl: false, attributionControl: false }).setView([37.5665, 126.978], 16);
L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", { zIndex: 10 }).addTo(map);

map.createPane("fogPane");
map.getPane("fogPane").style.zIndex = 410;
map.createPane("photoPane");
map.getPane("photoPane").style.zIndex = 630;
map.createPane("memoryPane");
map.getPane("memoryPane").style.zIndex = 640;
map.createPane("playerPane");
map.getPane("playerPane").style.zIndex = 660;

var mapWrap = document.getElementById("map-wrap");
mapWrap.appendChild(document.getElementById("fog-canvas"));
mapWrap.appendChild(document.getElementById("age-canvas"));
mapWrap.appendChild(document.getElementById("stay-canvas"));

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

function resizeCanvas() {
    var mapEl = document.getElementById("map");
    var w = mapEl.clientWidth || window.innerWidth;
    var h = mapEl.clientHeight || window.innerHeight;
    [fogCanvas, ageCanvas, stayCanvas].forEach(function(c) { c.width = w; c.height = h; });
    [fogScratchCanvas, ageScratchCanvas].forEach(function(c) { c.width = w; c.height = h; });
    scheduleRender();
}

window.addEventListener("resize", resizeCanvas);
map.on("move zoom", scheduleRender);
map.on("zoomend", updatePhotoMarkerSizes);

function scheduleRender() { if (rafId !== null) return; rafId = requestAnimationFrame(function() { rafId = null; render(); }); }
function render() { renderFog(); renderAgeTint(); renderStayTint(); }
function calcMpp() { var center = map.getCenter(); var pt = map.latLngToContainerPoint(center); var ll2 = map.containerPointToLatLng(L.point(pt.x + 10, pt.y)); return center.distanceTo(ll2) || 1; }
function metersToPixels(meters, mpp) { return (meters / mpp) * 10; }

function renderFog() {
    var w = fogCanvas.width, h = fogCanvas.height; fogCtx.clearRect(0, 0, w, h);
    if (!isFogEnabled) return;
    fogCtx.fillStyle = "rgba(8, 10, 18, " + getFogAlpha() + ")";
    fogCtx.fillRect(0, 0, w, h);
    if (currentPos) {
        var mpp = calcMpp();
        var pos = map.latLngToContainerPoint(currentPos);
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
            var pos = map.latLngToContainerPoint([point.lat, point.lng]);
            var stayMin = (point.endTime - point.startTime) / 60000;
            var stayR = metersToPixels(getStayRadiusMeters(stayMin), mpp);
            addToBucket(alpha, function(ctx) { ctx.beginPath(); ctx.arc(pos.x, pos.y, stayR, 0, Math.PI * 2); ctx.fill(); });
            if (idx > 0) {
                var prev = map.latLngToContainerPoint([pathCoordinates[idx - 1].lat, pathCoordinates[idx - 1].lng]);
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
        if (!buckets.has(color)) buckets.set(color, []); var pos = map.latLngToContainerPoint([point.lat, point.lng]);
        if (i > 0) { var timeGap = point.startTime - pathCoordinates[i - 1].endTime; if (timeGap <= GAP_THRESHOLD_MS) { var prev = map.latLngToContainerPoint([pathCoordinates[i - 1].lat, pathCoordinates[i - 1].lng]); buckets.get(color).push({ x1: prev.x, y1: prev.y, x2: pos.x, y2: pos.y }); } }
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
        var pos = map.latLngToContainerPoint([point.lat, point.lng]); var radius = metersToPixels(getStayRadiusMeters(stayMin), mpp);
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
    var current = calcLevel(); var distKm = totalDistance / 1000; var memCount = memories.length; var photoCount = photos.length;
    var nextRow = LEVEL_TABLE.find(function(r) { return r.level === current.level + 1; });
    var titleEl = document.getElementById("hud-title-text"); var levelEl = document.getElementById("hud-level-num");
    if (titleEl) titleEl.textContent = current.title; if (levelEl) levelEl.textContent = current.level;
    var distCurEl = document.getElementById("prog-dist-cur"); var distBarEl = document.getElementById("prog-dist-bar"); var distNextEl = document.getElementById("prog-dist-next");
    if (distCurEl) distCurEl.textContent = distKm.toFixed(2) + " km";
    if (distBarEl && distNextEl) { if (!nextRow) { distBarEl.style.width = "100%"; distNextEl.textContent = "최고 레벨 달성!"; } else { var pct = nextRow.distKm > current.distKm ? Math.min(100, ((distKm - current.distKm) / (nextRow.distKm - current.distKm)) * 100) : 100; distBarEl.style.width = pct.toFixed(1) + "%"; var remain = Math.max(0, nextRow.distKm - distKm); distNextEl.textContent = remain > 0.01 ? "다음까지 " + remain.toFixed(1) + "km" : "조건 충족!"; } }
    var memCurEl = document.getElementById("prog-mem-cur"); var memBarEl = document.getElementById("prog-mem-bar"); var memNextEl = document.getElementById("prog-mem-next");
    if (memCurEl) memCurEl.textContent = memCount + " 개";
    if (memBarEl && memNextEl) { if (!nextRow || nextRow.memories === 0) { memBarEl.style.width = "100%"; memNextEl.textContent = nextRow ? "조건 없음" : "최고!"; } else { var pct2 = nextRow.memories > current.memories ? Math.min(100, ((memCount - current.memories) / (nextRow.memories - current.memories)) * 100) : 100; memBarEl.style.width = pct2.toFixed(1) + "%"; var remain2 = Math.max(0, nextRow.memories - memCount); memNextEl.textContent = remain2 > 0 ? "다음까지 " + remain2 + "개" : "조건 충족!"; } }
    var photoCurEl = document.getElementById("prog-photo-cur"); var photoBarEl = document.getElementById("prog-photo-bar"); var photoNextEl = document.getElementById("prog-photo-next");
    if (photoCurEl) photoCurEl.textContent = photoCount + " 개";
    if (photoBarEl && photoNextEl) { if (!nextRow || nextRow.photos === 0) { photoBarEl.style.width = "100%"; photoNextEl.textContent = nextRow ? "조건 없음" : "최고!"; } else { var pct3 = nextRow.photos > current.photos ? Math.min(100, ((photoCount - current.photos) / (nextRow.photos - current.photos)) * 100) : 100; photoBarEl.style.width = pct3.toFixed(1) + "%"; var remain3 = Math.max(0, nextRow.photos - photoCount); photoNextEl.textContent = remain3 > 0 ? "다음까지 " + remain3 + "개" : "조건 충족!"; } }
}

function updateStats() { var todayDist = calcTodayDistance(); var distEl = document.getElementById("dist-val"); var todayEl = document.getElementById("today-dist-val"); var memEl = document.getElementById("memory-count-val"); var photoEl = document.getElementById("photo-count-val"); if (distEl) distEl.innerHTML = (totalDistance / 1000).toFixed(2) + "<span>km</span>"; if (todayEl) todayEl.innerHTML = (todayDist / 1000).toFixed(2) + "<span>km</span>"; if (memEl) memEl.innerHTML = memories.length + "<span>개</span>"; if (photoEl) photoEl.innerHTML = photos.length + "<span>개</span>"; updateHud(); checkBadges(); }

function toggleHud() { isHudExpanded = !isHudExpanded; document.getElementById("hud").classList.toggle("expanded", isHudExpanded); document.getElementById("controls").classList.toggle("hud-open", isHudExpanded); document.getElementById("help-btn").classList.toggle("hud-open", isHudExpanded); if (isHudExpanded) { setTimeout(function() { document.addEventListener("click", handleHudOutsideClick); }, 0); } else { document.removeEventListener("click", handleHudOutsideClick); } }
function handleHudOutsideClick(event) { var hud = document.getElementById("hud"); if (!hud.contains(event.target)) { isHudExpanded = false; hud.classList.remove("expanded"); document.getElementById("controls").classList.remove("hud-open"); document.getElementById("help-btn").classList.remove("hud-open"); document.removeEventListener("click", handleHudOutsideClick); } }
function syncRecordingUI() { recBtn.classList.toggle("recording", isRecording); recStatusBox.textContent = isRecording ? "기록 중" : "대기 중"; recStatusBox.classList.toggle("recording", isRecording); }
function syncFogButton() { var toggleBtn = document.getElementById("fog-toggle-btn"); var toggleState = document.getElementById("fog-toggle-state"); if (!toggleBtn) return; toggleBtn.classList.toggle("on", isFogEnabled); toggleBtn.classList.toggle("off", !isFogEnabled); if (toggleState) { toggleState.textContent = isFogEnabled ? "켜짐" : "꺼짐"; toggleState.classList.toggle("on", isFogEnabled); toggleState.classList.toggle("off", !isFogEnabled); } }
function toggleHelp() { document.getElementById("help-popup").classList.toggle("show"); }
function handleHelpOverlayClick(event) { var box = document.getElementById("help-content-box"); if (!box.contains(event.target)) toggleHelp(); }
function switchHelpTab(tab) { ["ask", "info"].forEach(function(t) { document.getElementById("htab-" + t).classList.toggle("active", t === tab); document.getElementById("hpanel-" + t).style.display = t === tab ? "" : "none"; }); }
function togglePhotoMenu() { var menu = document.getElementById("photo-menu"); var overlay = document.getElementById("photo-menu-overlay"); if (menu.classList.contains("open")) { closePhotoMenu(); } else { menu.classList.add("open"); overlay.classList.add("show"); } }
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
            console.warn("카메라 실패", e);
        }
    }
    document.getElementById("camera-input").click();
}

async function triggerGallery() {
    closePhotoMenu();
    if (window.Capacitor && window.Capacitor.isNativePlatform()) {
        try {
            var Camera = window.Capacitor.Plugins.Camera;
            var lat = currentPos ? currentPos.lat : map.getCenter().lat;
            var lng = currentPos ? currentPos.lng : map.getCenter().lng;
            if (Camera && typeof Camera.pickImages === "function") {
                var picked = await Camera.pickImages({ quality: 95 });
                var list = picked && Array.isArray(picked.photos) ? picked.photos : [];
                if (!list.length) return;
                for (var i = 0; i < list.length; i++) {
                    if (recStatusBox) recStatusBox.textContent = "사진 처리 중 " + (i + 1) + "/" + list.length;
                    var one = list[i];
                    var imgOne = await loadImageFromUrl(one.webPath || one.path);
                    processPhoto(imgOne, new Date(), lat, lng, {
                        deferUi: true,
                        openPopup: list.length === 1,
                        sourceUri: one.path || one.webPath || "",
                        sourceWebPath: one.webPath || "",
                        sourceType: "gallery"
                    });
                }
                updateStats();
                scheduleSave();
                updatePhotoList();
                syncRecordingUI();
                return;
            }
            var single = await Camera.getPhoto({ quality: 95, resultType: "uri", source: "PHOTOS" });
            var img = await loadImageFromUrl(single.webPath || single.path);
            processPhoto(img, new Date(), lat, lng, {
                sourceUri: single.path || single.webPath || "",
                sourceWebPath: single.webPath || "",
                sourceType: "gallery"
            });
            return;
        } catch (e) {
            console.warn("갤러리 불러오기 실패", e);
        }
    }
    document.getElementById("gallery-input").click();
}

async function openPhotoInGallery(data) {
    var sourceUri = data && (data.sourceUri || data.sourceWebPath);
    if (!sourceUri) {
        alert("원본 경로 정보가 없어 기기 갤러리로 바로 열 수 없습니다.");
        return;
    }
    try {
        if (window.Capacitor && window.Capacitor.isNativePlatform()) {
            var plugins = window.Capacitor.Plugins || {};
            if (plugins.Browser && typeof plugins.Browser.open === "function") {
                await plugins.Browser.open({ url: sourceUri });
                return;
            }
        }
        window.open(sourceUri, "_blank");
    } catch (e) {
        console.warn("원본 열기 실패", e);
        try { window.open(sourceUri, "_blank"); }
        catch (_) { alert("원본 사진을 열지 못했습니다."); }
    }
}
function resetRecordingState() { isRecording = false; syncRecordingUI(); stopTracking(); }
function toggleRecording() { if (isRecording) { isRecording = false; syncRecordingUI(); stopTracking(); compactPathData(); scheduleSave(); return; } isRecording = true; syncRecordingUI(); startTracking(); }
function toggleFog() { isFogEnabled = !isFogEnabled; localStorage.setItem(FOG_ENABLED_KEY, String(isFogEnabled)); syncFogButton(); scheduleRender(); }
function startTracking() { if (!navigator.geolocation) { alert("이 브라우저는 위치 추적을 지원하지 않습니다."); resetRecordingState(); return; } if (!window.isSecureContext && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") { alert("위치 추적은 HTTPS 또는 localhost에서만 동작합니다."); resetRecordingState(); return; } watchId = navigator.geolocation.watchPosition(handlePosition, handleLocationError, { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 }); }
function stopTracking() { if (watchId !== null) { navigator.geolocation.clearWatch(watchId); watchId = null; } }

function handlePosition(position) {
    var accuracy = Number(position.coords.accuracy) || Infinity;
    var latlng = L.latLng(position.coords.latitude, position.coords.longitude);
    var heading = position.coords.heading;
    if (isFinite(heading)) playerHeading = heading;
    currentPos = latlng;
    if (!playerMarker) { playerMarker = L.marker(latlng, { pane: "playerPane", icon: L.divIcon({ className: "player-marker", iconSize: [18, 18] }) }).addTo(map); map.setView(latlng, 16); }
    else { playerMarker.setLatLng(latlng); }
    updateVisionCone(latlng);
    if (!isRecording) return;
    if (accuracy > 100) { recStatusBox.textContent = "GPS 너무 약함 (" + Math.round(accuracy) + "m)"; return; }
    var now = Date.now(); recStatusBox.textContent = accuracy > MAX_ACCURACY_M ? "GPS 약함 (" + Math.round(accuracy) + "m)" : "기록 중";
    if (pathCoordinates.length === 0) { pathCoordinates.push(createPathPoint(latlng, now)); checkStayBonus(latlng, now); updateStats(); scheduleSave(); scheduleRender(); return; }
    var last = pathCoordinates[pathCoordinates.length - 1]; var dist = distanceToPoint(latlng, last); var stayThreshold = getDynamicStayThreshold(accuracy);
    if (dist <= stayThreshold) { last.endTime = now; last.visits = (last.visits || 1) + 1; last.lat += (latlng.lat - last.lat) * 0.3; last.lng += (latlng.lng - last.lng) * 0.3; }
    else { totalDistance += dist; pathCoordinates.push(createPathPoint(latlng, now)); if (pathCoordinates.length > MAX_PATH_POINTS) compactPathData(); }
    checkStayBonus(latlng, now); updateStats(); scheduleSave(); scheduleRender();
}

function handleLocationError(err) { var messages = { 1: "위치 권한이 거부되었습니다.", 2: "현재 위치를 확인할 수 없습니다.", 3: "위치 요청 시간이 초과되었습니다." }; alert(messages[err.code] || "위치 정보를 가져오지 못했습니다."); resetRecordingState(); }
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
    recStatusBox.textContent = "30분 체류 달성! 레벨 +1 보너스!"; setTimeout(function() { if (isRecording) recStatusBox.textContent = "기록 중"; }, 4000);
}
function saveBonusState() { localStorage.setItem("giloa-stay-bonus", JSON.stringify({ boost: stayBonusLevelBoost, places: stayBonusPlaces })); }
function loadBonusState() { try { var raw = localStorage.getItem("giloa-stay-bonus"); if (!raw) return; var data = JSON.parse(raw); stayBonusLevelBoost = isFinite(data.boost) ? data.boost : 0; stayBonusPlaces = Array.isArray(data.places) ? data.places.filter(function(p) { return isFinite(p.lat) && isFinite(p.lng); }) : []; } catch (e) { console.warn("보너스 상태 복원 실패", e); } }
function calcTodayDistance() { var todayStartMs = new Date().setHours(0, 0, 0, 0); var dist = 0; for (var i = 1; i < pathCoordinates.length; i++) { if (pathCoordinates[i].startTime >= todayStartMs) { dist += L.latLng(pathCoordinates[i].lat, pathCoordinates[i].lng).distanceTo([pathCoordinates[i - 1].lat, pathCoordinates[i - 1].lng]); } } return dist; }

function compactPathData() {
    if (pathCoordinates.length <= 1) return; var merged = [];
    for (var i = 0; i < pathCoordinates.length; i++) { var point = pathCoordinates[i]; var last = merged[merged.length - 1]; if (!last) { merged.push(Object.assign({}, point)); continue; } var timeGap = point.startTime - last.endTime; var dist = L.latLng(point.lat, point.lng).distanceTo([last.lat, last.lng]); if (dist <= MERGE_DISTANCE_M && timeGap <= MERGE_TIME_GAP_MS) { var tv = (last.visits || 1) + (point.visits || 1); last.lat = ((last.lat * (last.visits || 1)) + (point.lat * (point.visits || 1))) / tv; last.lng = ((last.lng * (last.visits || 1)) + (point.lng * (point.visits || 1))) / tv; last.endTime = Math.max(last.endTime, point.endTime); last.visits = tv; } else { merged.push(Object.assign({}, point)); } }
    pathCoordinates = shrinkOldPoints(merged, MAX_PATH_POINTS);
}
function shrinkOldPoints(points, maxPoints) { if (points.length <= maxPoints) return points; var keepTail = Math.floor(maxPoints * 0.4); var tail = points.slice(-keepTail); var head = points.slice(0, points.length - keepTail); var ratio = Math.ceil(head.length / (maxPoints - keepTail)); var filtered = head.filter(function(_, i) { return i % ratio === 0; }); return filtered.concat(tail).slice(-maxPoints); }

function addMemory() { if (!currentPos) { alert("위치 정보를 수신 중입니다."); return; } var input = prompt("이 장소의 이름을 입력하세요:", "새로운 발견"); if (input === null) return; var now = new Date(); var data = { id: String(now.getTime()), lat: currentPos.lat, lng: currentPos.lng, name: escapeHtml(input.trim() || "기억의 지점"), time: now.getTime(), dateString: now.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" }), timeString: now.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }) }; memories.push(data); createMemoryMarker(data, true); updateMemoryList(); updateStats(); scheduleSave(); }
function createMemoryMarker(data, openPopup) { var marker = L.marker([data.lat, data.lng], { pane: "memoryPane", icon: L.divIcon({ className: "memory-marker", html: "★", iconSize: [28, 28] }) }).addTo(map); var popupEl = document.createElement("div"); var title = document.createElement("b"); title.textContent = data.name; var info = document.createElement("small"); info.style.display = "block"; info.textContent = data.dateString + " " + (data.timeString || ""); var delBtn = document.createElement("button"); delBtn.className = "popup-delete-btn"; delBtn.textContent = "삭제"; delBtn.addEventListener("click", function() { deleteMemory(data.id); }); popupEl.appendChild(title); popupEl.appendChild(document.createElement("br")); popupEl.appendChild(info); popupEl.appendChild(delBtn); marker.bindPopup(popupEl); memoryMarkers.set(data.id, marker); if (openPopup) marker.openPopup(); }
function deleteMemory(id) { memories = memories.filter(function(m) { return m.id !== id; }); var marker = memoryMarkers.get(id); if (marker) { map.removeLayer(marker); memoryMarkers.delete(id); } updateMemoryList(); updateStats(); scheduleSave(); }
function updateMemoryList() { var container = document.getElementById("memory-list-container"); if (!container) return; if (memories.length === 0) { container.innerHTML = '<p class="empty-message">아직 기록이 없습니다.</p>'; return; } container.innerHTML = ""; memories.slice().reverse().forEach(function(memo) { var item = document.createElement("div"); item.className = "memory-item"; var name = document.createElement("span"); name.className = "item-name"; name.textContent = "★ " + memo.name; var date = document.createElement("span"); date.className = "item-date"; date.textContent = memo.dateString + " " + (memo.timeString || ""); var actions = document.createElement("div"); actions.className = "memory-actions"; var moveBtn = document.createElement("button"); moveBtn.className = "memory-action-btn move"; moveBtn.textContent = "이동"; moveBtn.addEventListener("click", function(e) { e.stopPropagation(); map.flyTo([memo.lat, memo.lng], 17); }); var delBtn = document.createElement("button"); delBtn.className = "memory-action-btn delete"; delBtn.textContent = "삭제"; delBtn.addEventListener("click", function(e) { e.stopPropagation(); deleteMemory(memo.id); }); actions.appendChild(moveBtn); actions.appendChild(delBtn); item.appendChild(name); item.appendChild(date); item.appendChild(actions); item.addEventListener("click", function() { map.flyTo([memo.lat, memo.lng], 17); toggleSidebar(false); }); container.appendChild(item); }); }
// 모든 탭 (상단6개) 통합 전환
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
function updatePhotoList() { var container = document.getElementById("photo-list-container"); if (!container) return; if (photos.length === 0) { container.innerHTML = '<p class="empty-message" style="grid-column:1/-1">아직 사진이 없습니다.</p>'; return; } container.innerHTML = ""; photos.slice().reverse().forEach(function(p) { var item = document.createElement("div"); item.className = "photo-list-item"; var img = document.createElement("img"); img.src = p.thumb || p.photo; var date = document.createElement("div"); date.className = "photo-list-date"; date.textContent = p.dateString; var del = document.createElement("div"); del.className = "photo-list-del"; del.textContent = "✕"; del.addEventListener("click", function(e) { e.stopPropagation(); deletePhoto(p.id); updatePhotoList(); }); item.addEventListener("click", function() { map.flyTo([p.lat, p.lng], 17); var markerLayer = findPhotoMarker(p.id); if (markerLayer) markerLayer.openPopup(); toggleSidebar(false); }); item.appendChild(img); item.appendChild(date); item.appendChild(del); container.appendChild(item); }); }
function findPhotoMarker(id) { var found = null; photoClusterGroup.eachLayer(function(layer) { if (layer._photoData && layer._photoData.id === id) found = layer; }); return found; }
function adjustHourDial(dir) { var next = dialHours + dir; if (next < 1 || next > 20) return; dialHours = next; updateDialUI(); }
function updateDialUI() { var labelEl = document.getElementById("dial-hour-label"); var infoEl = document.getElementById("gpx-range-info"); if (labelEl) labelEl.textContent = dialHours + "시간"; if (infoEl) infoEl.textContent = "오늘 기준 최근 " + dialHours + "시간 발걸음"; }
function exportGpx() { var sinceMs = Date.now() - dialHours * 60 * 60 * 1000; var filtered = pathCoordinates.filter(function(p) { return p.startTime >= sinceMs; }); if (filtered.length === 0) { alert("해당 시간에 기록된 발걸음이 없습니다."); return; } var nameInput = document.getElementById("gpx-export-name").value.trim(); var name = nameInput || "발걸음 최근" + dialHours + "시간"; var trkpts = filtered.map(function(p) { var t = new Date(p.startTime).toISOString(); return '    <trkpt lat="' + p.lat.toFixed(7) + '" lon="' + p.lng.toFixed(7) + '">\n      <time>' + t + '</time>\n    </trkpt>'; }).join("\n"); var gpxContent = '<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="Giloa - 나의 대동여지도"\n     xmlns="http://www.topografix.com/GPX/1/1">\n  <metadata><name>' + name + '</name><time>' + new Date().toISOString() + '</time></metadata>\n  <trk><name>' + name + '</name><trkseg>\n' + trkpts + '\n  </trkseg></trk>\n</gpx>'; var saves = loadGpxSaves(); var id = String(Date.now()); saves.push({ id: id, name: name, createdAt: Date.now(), pointCount: filtered.length, gpxContent: gpxContent }); saveGpxSaves(saves); updateGpxSavedList(); var blob = new Blob([gpxContent], { type: "application/gpx+xml" }); var url = URL.createObjectURL(blob); var a = document.createElement("a"); a.href = url; a.download = "giloa_" + name + ".gpx"; a.click(); URL.revokeObjectURL(url); document.getElementById("gpx-export-name").value = ""; document.getElementById("gpx-import-status").textContent = '✓ "' + name + '" 저장 완료'; }
function loadGpxSaves() { try { return JSON.parse(localStorage.getItem(GPX_SAVES_KEY) || "[]"); } catch(e) { return []; } }
function saveGpxSaves(saves) { localStorage.setItem(GPX_SAVES_KEY, JSON.stringify(saves)); }
function updateGpxSavedList() { var container = document.getElementById("gpx-saved-list"); if (!container) return; var saves = loadGpxSaves(); if (saves.length === 0) { container.innerHTML = '<p class="empty-message">저장된 발걸음이 없습니다.</p>'; return; } container.innerHTML = ""; saves.slice().reverse().forEach(function(s) { var item = document.createElement("div"); item.className = "gpx-saved-item" + (s.id === activeGpxId ? " active-route" : ""); var icon = document.createElement("span"); icon.className = "gpx-saved-icon"; icon.textContent = s.id === activeGpxId ? "🔵" : "👣"; var info = document.createElement("div"); info.className = "gpx-saved-info"; var nameEl = document.createElement("div"); nameEl.className = "gpx-saved-name"; nameEl.textContent = s.name; var meta = document.createElement("div"); meta.className = "gpx-saved-meta"; meta.textContent = new Date(s.createdAt).toLocaleDateString("ko-KR") + " · " + s.pointCount + "개 포인트"; info.appendChild(nameEl); info.appendChild(meta); var del = document.createElement("div"); del.className = "gpx-saved-del"; del.textContent = "✕"; del.addEventListener("click", function(e) { e.stopPropagation(); deleteGpxSave(s.id); }); item.appendChild(icon); item.appendChild(info); item.appendChild(del); item.addEventListener("click", function() { toggleGpxRoute(s); }); container.appendChild(item); }); }
function deleteGpxSave(id) { if (id === activeGpxId) clearActiveGpxRoute(); saveGpxSaves(loadGpxSaves().filter(function(s) { return s.id !== id; })); updateGpxSavedList(); }
function toggleGpxRoute(save) { if (activeGpxId === save.id) { clearActiveGpxRoute(); updateGpxSavedList(); return; } clearActiveGpxRoute(); drawGpxRoute(save.gpxContent, save.id); updateGpxSavedList(); toggleSidebar(false); }
function clearActiveGpxRoute() { activeGpxLayers.forEach(function(l) { map.removeLayer(l); }); activeGpxLayers = []; activeGpxId = null; }
function drawGpxRoute(gpxContent, id) { var parser = new DOMParser(); var xmlDoc = parser.parseFromString(gpxContent, "application/xml"); var trkpts = xmlDoc.querySelectorAll("trkpt"); var latlngs = []; trkpts.forEach(function(pt) { var lat = parseFloat(pt.getAttribute("lat")); var lng = parseFloat(pt.getAttribute("lon")); if (isFinite(lat) && isFinite(lng)) latlngs.push([lat, lng]); }); if (latlngs.length === 0) return; var polyline = L.polyline(latlngs, { color: "#4db8ff", weight: 4, opacity: 0.85, dashArray: "8, 6" }).addTo(map); var startM = L.circleMarker(latlngs[0], { radius: 7, color: "#4db8ff", fillColor: "#fff", fillOpacity: 1, weight: 2.5 }).addTo(map).bindTooltip("출발"); var endM = L.circleMarker(latlngs[latlngs.length - 1], { radius: 7, color: "#ff6b6b", fillColor: "#fff", fillOpacity: 1, weight: 2.5 }).addTo(map).bindTooltip("도착"); activeGpxLayers = [polyline, startM, endM]; activeGpxId = id; map.fitBounds(polyline.getBounds(), { padding: [50, 50] }); }
function importGpxFile(event) { var file = event.target.files[0]; if (!file) return; var statusEl = document.getElementById("gpx-import-status"); statusEl.textContent = "읽는 중..."; var reader = new FileReader(); reader.onload = function(e) { try { var name = file.name.replace(".gpx", ""); var gpxContent = e.target.result; var trkpts = new DOMParser().parseFromString(gpxContent, "application/xml").querySelectorAll("trkpt"); if (trkpts.length === 0) { statusEl.textContent = "경로 없음"; return; } var saves = loadGpxSaves(); var id = String(Date.now()); saves.push({ id: id, name: name, createdAt: Date.now(), pointCount: trkpts.length, gpxContent: gpxContent }); saveGpxSaves(saves); clearActiveGpxRoute(); drawGpxRoute(gpxContent, id); updateGpxSavedList(); statusEl.textContent = '✓ "' + name + '" 불러오기 완료'; toggleSidebar(false); } catch (err) { statusEl.textContent = "파일을 읽지 못했습니다."; console.error(err); } }; reader.readAsText(file); event.target.value = ""; }
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
                    sourceType: typeof p.sourceType === "string" ? p.sourceType : ""
                };
            }),
            totalDistance: totalDistance
        }));
    } catch (e) {
        console.error("저장 실패", e);
        if (e && e.name === "QuotaExceededError") alert("저장 공간이 부족합니다.");
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
                    sourceType: typeof p.sourceType === "string" ? p.sourceType : ""
                };
            });
        }
        var savedFog = localStorage.getItem(FOG_ENABLED_KEY);
        if (savedFog !== null) isFogEnabled = savedFog === "true";
        compactPathData();
    } catch (e) {
        console.error("복원 실패", e);
    }
}

// ── 사진 처리 ──
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
        sourceType: typeof options.sourceType === "string" ? options.sourceType : ""
    };
    photos.push(data);
    idbSavePhoto(id, popup, thumb).catch(function(e) { console.warn("IDB 저장 실패", e); });
    createPhotoMarker(data, options.openPopup !== false);
    if (!options.deferUi) {
        updateStats();
        scheduleSave();
        updatePhotoList();
    }
}
// EXIF GPS 파싱 (라이브러리 없이 직접 구현 - 더 안정적)
function parseExifGps(buffer) {
    try {
        var view = new DataView(buffer);
        if (view.getUint16(0) !== 0xFFD8) return null; // JPEG 아님
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
            if (marker === 0xFFDA) break; // SOS, EXIF 없음
            offset += 2 + view.getUint16(offset + 2);
        }
    } catch(e) { console.warn("EXIF 파싱 오류", e); }
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
        reader.onerror = function() { reject(reader.error || new Error("파일 읽기 실패")); };
        reader.readAsArrayBuffer(file);
    });
}

function loadImageFromFile(file) {
    return new Promise(function(resolve, reject) {
        var url = URL.createObjectURL(file);
        var img = new Image();
        img.onload = function() { URL.revokeObjectURL(url); resolve(img); };
        img.onerror = function(err) { URL.revokeObjectURL(url); reject(err || new Error("이미지 로드 실패")); };
        img.src = url;
    });
}

function loadImageFromUrl(url) {
    return new Promise(function(resolve, reject) {
        var img = new Image();
        img.onload = function() { resolve(img); };
        img.onerror = function(err) { reject(err || new Error("이미지 로드 실패")); };
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
            else reject(new Error("heic2any 로드 실패"));
        };
        script.onerror = function() { reject(new Error("heic2any 스크립트 로드 실패")); };
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
        if (recStatusBox) recStatusBox.textContent = "사진 처리 중 " + (i + 1) + "/" + files.length;
        try {
            var gps = null;
            if (isJpegFile(file)) {
                try { gps = parseExifGps(await readFileAsArrayBuffer(file)); } catch (e) { console.warn("EXIF 읽기 실패:", file.name, e); }
            }
            var lat = gps ? gps.lat : (currentPos ? currentPos.lat : map.getCenter().lat);
            var lng = gps ? gps.lng : (currentPos ? currentPos.lng : map.getCenter().lng);
            var normalizedFile = await convertHeicToJpegFile(file);
            var img = await loadImageFromFile(normalizedFile);
            processPhoto(img, new Date(), lat, lng, { deferUi: true, openPopup: files.length === 1, sourceType: "file-input" });
            loadedCount += 1;
        } catch (e) {
            failedCount += 1;
            console.warn("사진 처리 실패:", file.name, e);
        }
    }
    if (loadedCount > 0) {
        updateStats();
        scheduleSave();
        updatePhotoList();
    }
    event.target.value = "";
    syncRecordingUI();
    if (failedCount > 0) alert("일부 사진(" + failedCount + "개)은 처리하지 못했습니다.");
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
    img.title = "탭해서 원본 사진 보기";
    img.addEventListener("click", function(e) { e.stopPropagation(); openPhotoInGallery(data); });
    var info = document.createElement("div");
    info.style.cssText = "font-size:12px;color:rgba(255,255,255,0.6);text-align:center;margin:6px 0 8px;";
    info.textContent = data.dateString + " " + data.timeString;
    var delBtn = document.createElement("button");
    delBtn.className = "popup-delete-btn";
    delBtn.textContent = "사진 삭제";
    delBtn.addEventListener("click", function() { deletePhoto(data.id); marker.closePopup(); });
    popupEl.appendChild(img);
    popupEl.appendChild(info);
    var hasSource = !!(data.sourceUri || data.sourceWebPath);
    var note = document.createElement("div");
    note.style.cssText = "font-size:11px;color:rgba(255,255,255,0.52);text-align:center;margin:0 0 8px;";
    note.textContent = hasSource ? "이미지를 탭하면 원본을 엽니다" : "원본 경로가 없는 사진입니다";
    popupEl.appendChild(note);
    popupEl.appendChild(delBtn);
    marker.bindPopup(popupEl);
    photoClusterGroup.addLayer(marker);
    if (openPopup) marker.openPopup();
}
function deletePhoto(id) { photos = photos.filter(function(p) { return p.id !== id; }); var marker = findPhotoMarker(id); if (marker) photoClusterGroup.removeLayer(marker); idbDeletePhoto(id).catch(function(e) { console.warn("IDB 삭제 실패", e); }); updateStats(); scheduleSave(); }
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
    }).catch(function(e) { console.warn("IDB 불러오기 실패", e); });
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
    setTimeout(function() { render(); scheduleRender(); }, 100);
    initGpxDial();
    initHudTapTargets();
    // 언어 모달 미리 빌드, 저장된 언어 적용
    buildLangModal();
    applyUILang(currentLang);
    setTimeout(function() { if (!isRecording) toggleRecording(); }, 5000);
}
map.whenReady(function() { init(); });

// ── TourAPI 관광지 추천 ──
var TOUR_API_KEY = "c6995449e23f94083d88f198fe2617a8f957a2063bc6ac0d19816c9f27a0ed6c";
var TOUR_ENDPOINT = "https://apis.data.go.kr/B551011/KorService2/locationBasedList2";
var FESTIVAL_ENDPOINT = "https://apis.data.go.kr/B551011/KorService2/searchFestival2";
var tourItems = []; var festivalItems = []; var tourExpanded = false;
var tourFetchTimer = null; var tourMarkers = []; var TOUR_VISIBLE_COUNT = 3;
var TOUR_TYPE_NAMES = { "12": "관광지", "14": "문화시설", "15": "축제/행사", "25": "여행코스", "28": "레포츠", "32": "숙박", "38": "쇼핑", "39": "음식점" };

function getTodayString() {
    var d = new Date();
    var mm = String(d.getMonth() + 1).padStart(2, "0");
    var dd = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + mm + dd;
}

function fetchFestivals() {
    var center = map.getCenter();
    var today = getTodayString();
    var url = FESTIVAL_ENDPOINT + "?serviceKey=" + TOUR_API_KEY + "&eventStartDate=" + today + "&mapX=" + center.lng.toFixed(6) + "&mapY=" + center.lat.toFixed(6) + "&radius=50000" + "&numOfRows=20&pageNo=1&MobileOS=ETC&MobileApp=Giloa&_type=json&arrange=E";
    fetch(url).then(function(res) { return res.json(); }).then(function(data) {
        var body = data && data.response && data.response.body;
        var items = [];
        if (body && body.items && body.items.item) { items = Array.isArray(body.items.item) ? body.items.item : [body.items.item]; }
        festivalItems = items;
        updateFestivalBadge();
        if (tourExpanded) renderFestivalStrip();
    }).catch(function(err) { console.warn("축제 API 에러", err); });
}

function updateFestivalBadge() {
    var badge = document.getElementById("tour-festival-badge");
    if (!badge) return;
    if (festivalItems.length > 0) { badge.textContent = "🎪 축제 " + festivalItems.length; badge.classList.add("show"); }
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
        var card = document.createElement("div"); card.className = "festival-card";
        var nameEl = document.createElement("div"); nameEl.className = "festival-card-name"; nameEl.textContent = item.title || "축제";
        var dateEl = document.createElement("div"); dateEl.className = "festival-card-date";
        var start = item.eventstartdate || ""; var end = item.eventenddate || "";
        if (start.length === 8) start = start.slice(0,4) + "." + start.slice(4,6) + "." + start.slice(6,8);
        if (end.length === 8) end = end.slice(0,4) + "." + end.slice(4,6) + "." + end.slice(6,8);
        dateEl.textContent = start + (end && end !== start ? " ~ " + end : "");
        var distEl = document.createElement("div"); distEl.className = "festival-card-dist";
        var distM = center.distanceTo([parseFloat(item.mapy), parseFloat(item.mapx)]);
        distEl.textContent = distM < 1000 ? Math.round(distM) + "m" : (distM / 1000).toFixed(1) + "km";
        card.appendChild(nameEl); card.appendChild(dateEl); card.appendChild(distEl);
        card.addEventListener("click", function() {
            map.flyTo([parseFloat(item.mapy), parseFloat(item.mapx)], 15);
            var addr = item.addr1 || "";
            var tel = item.tel ? "<br><a href='tel:" + item.tel + "' style='color:#4db8ff;font-size:12px;'>📞 " + escapeHtml(item.tel) + "</a>" : "";
            L.popup({ className: "tour-popup" }).setLatLng([parseFloat(item.mapy), parseFloat(item.mapx)]).setContent("<b>" + escapeHtml(item.title || "") + "</b><br><small style='color:#4db8ff;'>🎪 축제</small><br><small>" + escapeHtml(addr) + "</small>" + tel).openOn(map);
            addVisitStamp(item.title, "축제", parseFloat(item.mapy), parseFloat(item.mapx));
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
    var url = TOUR_ENDPOINT + "?serviceKey=" + TOUR_API_KEY + "&mapX=" + center.lng.toFixed(6) + "&mapY=" + center.lat.toFixed(6) + "&radius=" + radiusM + "&numOfRows=20&pageNo=1&MobileOS=ETC&MobileApp=Giloa&_type=json&arrange=E";
    fetch(url).then(function(res) { return res.json(); }).then(function(data) {
        loadingEl.style.display = "none"; var body = data && data.response && data.response.body; var items = [];
        if (body && body.items && body.items.item) { items = Array.isArray(body.items.item) ? body.items.item : [body.items.item]; items = items.filter(function(item) { return item.contenttypeid !== "39" && item.contenttypeid !== "32"; }); }
        clearTourMarkers(); tourItems = items;
        if (items.length === 0) { emptyEl.style.display = tourExpanded ? "" : "none"; countEl.textContent = ""; return; }
        countEl.textContent = items.length + "곳"; renderTourCards();
    }).catch(function(err) { loadingEl.style.display = "none"; emptyEl.style.display = tourExpanded ? "" : "none"; emptyEl.textContent = "불러오기 실패"; countEl.textContent = ""; console.warn("TourAPI 에러", err); });
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
        (function(item) { var card = document.createElement("div"); card.className = "tour-card"; var nameEl = document.createElement("div"); nameEl.className = "tour-card-name"; nameEl.textContent = item.title || "이름 없음"; var typeEl = document.createElement("div"); typeEl.className = "tour-card-type"; typeEl.textContent = TOUR_TYPE_NAMES[item.contenttypeid] || "관광"; var distEl = document.createElement("div"); distEl.className = "tour-card-dist"; var distM = center.distanceTo([parseFloat(item.mapy), parseFloat(item.mapx)]); distEl.textContent = distM < 1000 ? Math.round(distM) + "m" : (distM / 1000).toFixed(1) + "km"; card.appendChild(nameEl); card.appendChild(typeEl); card.appendChild(distEl); card.addEventListener("click", function() { map.flyTo([parseFloat(item.mapy), parseFloat(item.mapx)], 17); showTourPopup(item); }); listEl.appendChild(card); })(tourItems[i]);
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
    var typeName = TOUR_TYPE_NAMES[item.contenttypeid] || "관광";
    var title = getTourDisplayTitle(item);
    var addr = getTourDisplayAddr(item);
    var tel = item.tel ? "<br><a href='tel:" + item.tel + "' style='color:#4db8ff;font-size:12px;'>📞 " + escapeHtml(item.tel) + "</a>" : "";
    addVisitStamp(item.title, typeName, lat, lng);
    L.popup({ className: "tour-popup" }).setLatLng([lat, lng]).setContent("<b>" + escapeHtml(title) + "</b><br><small style='color:rgba(120,220,140,0.9);'>" + typeName + "</small><br><small>" + escapeHtml(addr) + "</small>" + tel).openOn(map);
}

function clearTourMarkers() { tourMarkers.forEach(function(m) { map.removeLayer(m); }); tourMarkers = []; }
function addTourMarkers() { clearTourMarkers(); tourItems.forEach(function(item) { var lat = parseFloat(item.mapy); var lng = parseFloat(item.mapx); if (!isFinite(lat) || !isFinite(lng)) return; var marker = L.circleMarker([lat, lng], { radius: 5, color: "#78dc8c", fillColor: "#78dc8c", fillOpacity: 0.7, weight: 1.5, opacity: 0.9, pane: "memoryPane" }).addTo(map); marker.on("click", function() { showTourPopup(item); }); tourMarkers.push(marker); }); }

function scheduleTourFetch() { if (tourFetchTimer) clearTimeout(tourFetchTimer); tourFetchTimer = setTimeout(function() { tourFetchTimer = null; tourExpanded = false; fetchTourSpots(); fetchFestivals(); }, 1200); }
map.on("moveend", scheduleTourFetch);
map.on("click", function() { collapseTourPanel(); });
scheduleTourFetch();

// ── VARCO 번역 + 다국어 ──
var VARCO_API_KEY = "9yUWJoapaQfdiYdq9Hd1knN4IMbOFO0w";
var VARCO_TRANSLATE_URL = "https://api.varco.ai/mt/chat-content/v1/translate";
var currentLang = localStorage.getItem("giloa-ui-lang") || "ko";

// 지원 언어 목록
var LANG_LIST = [
    { code: "ko",   flag: "🇰🇷", label: "한국어",   varco: null    },
    { code: "en",   flag: "🇺🇸", label: "English",  varco: "en"    },
    { code: "ja",   flag: "🇯🇵", label: "日本語",    varco: "ja"    },
    { code: "zh_s", flag: "🇨🇳", label: "简体中文",  varco: "zh-CN" },
    { code: "zh_t", flag: "🇹🇼", label: "繁體中文",  varco: "zh-TW" }
];

var UI_TEXT = {
    ko:   { sidebar_title: "나의 기록들",  fog_label: "어둠 효과",  fog_on: "켜짐",  fog_off: "꺼짐",  tab_memory: "기억",   tab_photo: "사진",  tab_gpx: "발걸음", rec_idle: "대기 중",  rec_active: "기록 중",   empty_memory: "아직 기록이 없습니다.",  empty_photo: "아직 사진이 없습니다.",  tour_title: "📍 주변 관광지",      festival_label: "🎪 주변 축제"       },
    en:   { sidebar_title: "My Records",   fog_label: "Fog Effect",  fog_on: "On",    fog_off: "Off",   tab_memory: "Memory",  tab_photo: "Photo", tab_gpx: "Steps",  rec_idle: "Standby",  rec_active: "Recording",  empty_memory: "No records yet.",      empty_photo: "No photos yet.",        tour_title: "📍 Nearby Places",     festival_label: "🎪 Nearby Festivals" },
    ja:   { sidebar_title: "私の記録",      fog_label: "霧エフェクト", fog_on: "オン",  fog_off: "オフ",  tab_memory: "記憶",    tab_photo: "写真",  tab_gpx: "足跡",   rec_idle: "待機中",   rec_active: "記録中",     empty_memory: "まだ記録がありません。", empty_photo: "まだ写真がありません。", tour_title: "📍 周辺観光地",        festival_label: "🎪 周辺イベント"    },
    zh_s: { sidebar_title: "我的记录",      fog_label: "迷雾效果",    fog_on: "开启",  fog_off: "关闭",  tab_memory: "记忆",    tab_photo: "照片",  tab_gpx: "足迹",   rec_idle: "待机中",   rec_active: "记录中",     empty_memory: "暂无记录。",          empty_photo: "暂无照片。",            tour_title: "📍 附近景点",          festival_label: "🎪 附近节日"        },
    zh_t: { sidebar_title: "我的記錄",      fog_label: "迷霧效果",    fog_on: "開啟",  fog_off: "關閉",  tab_memory: "記憶",    tab_photo: "照片",  tab_gpx: "足跡",   rec_idle: "待機中",   rec_active: "記錄中",     empty_memory: "暫無記錄。",          empty_photo: "暫無照片。",            tour_title: "📍 附近景點",          festival_label: "🎪 附近節日"        }
};

function varcoTranslate(text, sourceLang, targetLang) {
    return fetch(VARCO_TRANSLATE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "openapi_key": VARCO_API_KEY },
        body: JSON.stringify({ TID: "giloa-" + Date.now(), svc: "varco-translation", provider: "content", source_lang: sourceLang, source_text: text, target_lang: targetLang })
    }).then(function(res) { return res.json(); }).then(function(data) { return data.target_text || text; }).catch(function() { return text; });
}

function applyUILang(lang) {
    currentLang = lang;
    localStorage.setItem("giloa-ui-lang", lang);
    var t = UI_TEXT[lang] || UI_TEXT["ko"];
    var el = function(id) { return document.getElementById(id); };
    if (el("sidebar-title"))       el("sidebar-title").textContent       = t.sidebar_title;
    if (el("fog-toggle-label-el"))  el("fog-toggle-label-el").textContent  = t.fog_label;
    if (el("fog-toggle-state"))     el("fog-toggle-state").textContent     = isFogEnabled ? t.fog_on : t.fog_off;
    var tabMemory = document.querySelector("#tab-memory .sidebar-tab-text");
    var tabPhoto  = document.querySelector("#tab-photo .sidebar-tab-text");
    var tabGpx    = document.querySelector("#tab-gpx .sidebar-tab-text");
    if (tabMemory) tabMemory.textContent = t.tab_memory;
    if (tabPhoto)  tabPhoto.textContent  = t.tab_photo;
    if (tabGpx)    tabGpx.textContent    = t.tab_gpx;
    if (el("tour-title"))          el("tour-title").textContent          = t.tour_title;
    if (el("festival-strip-label")) el("festival-strip-label").textContent = t.festival_label;
    if (!isRecording && el("rec-status-box")) el("rec-status-box").textContent = t.rec_idle;
    // 모달 내 체크 표시 갱신
    LANG_LIST.forEach(function(l) {
        var chk = document.getElementById("lang-modal-check-" + l.code);
        var btn = document.getElementById("lang-modal-btn-"  + l.code);
        if (chk) chk.style.display = l.code === lang ? "block" : "none";
        if (btn) {
            btn.style.background   = l.code === lang ? "rgba(77,184,255,0.18)" : "rgba(255,255,255,0.05)";
            btn.style.borderColor  = l.code === lang ? "rgba(77,184,255,0.55)" : "rgba(255,255,255,0.1)";
        }
    });
    // 헤더 언어 버튼 라벨 갱신
    var headerBtn = document.getElementById("header-lang-flag");
    if (headerBtn) { var cur = LANG_LIST.find(function(l){ return l.code === lang; }); if (cur) headerBtn.textContent = cur.flag; }
}

// index.html의 KO/EN 버튼 대신 모달 열기로 연결
function toggleLang(lang) { openLangModal(); }

// ── 언어 선택 모달 ──
function buildLangModal() {
    if (document.getElementById("lang-modal-overlay")) return;
    var overlay = document.createElement("div");
    overlay.id = "lang-modal-overlay";
    overlay.style.cssText = "display:none;position:fixed;inset:0;z-index:3500;background:rgba(0,0,0,0.62);align-items:center;justify-content:center;";
    overlay.addEventListener("click", function(e) { if (e.target === overlay) closeLangModal(); });

    var box = document.createElement("div");
    box.style.cssText = "background:rgba(18,18,30,0.98);border:1px solid rgba(255,255,255,0.15);border-radius:20px;padding:22px 20px 16px;width:290px;color:#fff;backdrop-filter:blur(20px);box-shadow:0 10px 50px rgba(0,0,0,0.7);";

    var title = document.createElement("div");
    title.style.cssText = "font-size:15px;font-weight:800;margin-bottom:14px;color:#fff;letter-spacing:-0.01em;";
    title.textContent = "🌐 언어 선택 / Language";
    box.appendChild(title);

    LANG_LIST.forEach(function(lang) {
        var btn = document.createElement("button");
        btn.id = "lang-modal-btn-" + lang.code;
        var isActive = currentLang === lang.code;
        btn.style.cssText = "display:flex;align-items:center;gap:12px;width:100%;padding:11px 14px;margin-bottom:8px;" +
            "background:" + (isActive ? "rgba(77,184,255,0.18)" : "rgba(255,255,255,0.05)") + ";" +
            "border:1px solid " + (isActive ? "rgba(77,184,255,0.55)" : "rgba(255,255,255,0.1)") + ";" +
            "border-radius:12px;color:#fff;font-size:14px;font-weight:600;cursor:pointer;text-align:left;transition:background 0.15s;";

        var flagEl = document.createElement("span"); flagEl.style.fontSize = "22px"; flagEl.textContent = lang.flag;
        var nameEl = document.createElement("span"); nameEl.textContent = lang.label;
        var chk    = document.createElement("span");
        chk.id = "lang-modal-check-" + lang.code;
        chk.style.cssText = "margin-left:auto;color:#4db8ff;font-size:15px;display:" + (isActive ? "block" : "none") + ";";
        chk.textContent = "✓";

        btn.appendChild(flagEl); btn.appendChild(nameEl); btn.appendChild(chk);
        btn.addEventListener("click", function() { selectLang(lang.code); });
        box.appendChild(btn);
    });

    var closeBtn = document.createElement("button");
    closeBtn.style.cssText = "width:100%;margin-top:4px;padding:10px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:rgba(255,255,255,0.5);font-size:13px;cursor:pointer;";
    closeBtn.textContent = "닫기";
    closeBtn.addEventListener("click", closeLangModal);
    box.appendChild(closeBtn);

    overlay.appendChild(box);
    document.body.appendChild(overlay);
}

function openLangModal() {
    buildLangModal();
    var overlay = document.getElementById("lang-modal-overlay");
    if (overlay) overlay.style.display = "flex";
}

function closeLangModal() {
    var overlay = document.getElementById("lang-modal-overlay");
    if (overlay) overlay.style.display = "none";
}

function selectLang(code) {
    closeLangModal();
    applyUILang(code);
    // 관광지 번역 (한국어 외 언어 선택 시)
    var langObj = LANG_LIST.find(function(l) { return l.code === code; });
    if (langObj && langObj.varco && tourItems.length > 0) translateTourItems(langObj.varco);
    else if (code === "ko" && tourItems.length > 0) renderTourCards(); // 원문 복원
}

function translateTourItems(varcoTarget) {
    tourItems.forEach(function(item) {
        var cacheKey = "_title_" + currentLang;
        if (item[cacheKey]) return;
        varcoTranslate(item.title, "ko", varcoTarget).then(function(translated) {
            item[cacheKey] = translated;
            if (tourExpanded) renderTourCards();
        });
        if (item.addr1) {
            var addrKey = "_addr_" + currentLang;
            varcoTranslate(item.addr1, "ko", varcoTarget).then(function(translated) { item[addrKey] = translated; });
        }
    });
}

function getTourDisplayTitle(item) {
    if (currentLang === "ko") return item.title || "";
    return item["_title_" + currentLang] || item.title || "";
}
function getTourDisplayAddr(item) {
    if (currentLang === "ko") return item.addr1 || "";
    return item["_addr_" + currentLang] || item.addr1 || "";
}

// ── 수집함 ──
var COLLECTION_KEY = "giloa-collection";
var badges = []; var visitStamps = []; var items = [];

var BADGE_DEFS = [
    { id: "first_memory", icon: "★", name: "첫 기억", desc: "첫 번째 기억을 남겼어요" },
    { id: "first_photo", icon: "📸", name: "첫 사진", desc: "첫 번째 사진을 찍었어요" },
    { id: "first_10km", icon: "🏃", name: "10km 달성", desc: "누적 10km를 걸었어요" },
    { id: "first_50km", icon: "🚶", name: "50km 달성", desc: "누적 50km를 걸었어요" },
    { id: "early_bird", icon: "🌅", name: "새벽 탐험가", desc: "새벽 5시 이전에 기록했어요" },
    { id: "memory_5", icon: "🗺", name: "기억 수집가", desc: "기억을 5개 남겼어요" },
    { id: "photo_10", icon: "🎞", name: "사진작가", desc: "사진을 10장 찍었어요" },
    { id: "tour_visit", icon: "🏛", name: "관광 탐험가", desc: "관광지를 처음 방문했어요" },
    { id: "festival_visit", icon: "🎪", name: "축제 마니아", desc: "축제를 처음 방문했어요" },
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
    } catch(e) { console.warn("수집함 복원 실패", e); }
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
    showCollectionToast(def.icon + " 뱃지 획득! " + def.name);
}

function addVisitStamp(name, type, lat, lng) {
    var now = new Date();
    visitStamps.push({ name: name, type: type, lat: lat, lng: lng, visitedAt: now.getTime(), dateString: now.toLocaleDateString("ko-KR") });
    saveCollection();
    updateVisitList();
    if (type === "관광지" || type === "문화시설") earnBadge("tour_visit");
    if (type === "축제") earnBadge("festival_visit");
    showCollectionToast("📍 " + name + " 방문 기록!");
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
        var typeIcons = { "관광지": "🏛", "문화시설": "🎨", "축제": "🎪", "레포츠": "⛹", "여행코스": "🗺" };
        var icon = typeIcons[v.type] || "📍";
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

// ── 시야각 부채꼴 ──
var visionCone = null;
function updateVisionCone(latlng) {
    if (visionCone) { map.removeLayer(visionCone); visionCone = null; }
    if (playerHeading === null) return;
    var center = [latlng.lat, latlng.lng]; var radiusM = 40; var spreadDeg = 60;
    var startAngle = playerHeading - spreadDeg / 2; var endAngle = playerHeading + spreadDeg / 2;
    var points = [center];
    for (var a = startAngle; a <= endAngle; a += 3) { points.push(destPoint(center, a, radiusM)); }
    points.push(destPoint(center, endAngle, radiusM)); points.push(center);
    visionCone = L.polygon(points, { color: "rgba(77, 184, 255, 0.3)", fillColor: "rgba(77, 184, 255, 0.15)", fillOpacity: 1, weight: 0, pane: "playerPane" }).addTo(map);
}
function destPoint(center, angleDeg, distanceM) {
    var R = 6371000; var lat1 = center[0] * Math.PI / 180; var lng1 = center[1] * Math.PI / 180; var brng = angleDeg * Math.PI / 180; var d = distanceM / R;
    var lat2 = Math.asin(Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(brng));
    var lng2 = lng1 + Math.atan2(Math.sin(brng) * Math.sin(d) * Math.cos(lat1), Math.cos(d) - Math.sin(lat1) * Math.sin(lat2));
    return [lat2 * 180 / Math.PI, lng2 * 180 / Math.PI];
}

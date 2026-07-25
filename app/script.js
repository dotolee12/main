// ???占쎌옉 ???占쎌튂 沅뚰븳 ?占쎌껌
async function requestLocationPermission() {
    if (window.Capacitor && window.Capacitor.isNativePlatform()) {
        try {
            const { Geolocation } = window.Capacitor.Plugins;
            await Geolocation.requestPermissions();
            const { BackgroundGeolocation } = window.Capacitor.Plugins;
            if (BackgroundGeolocation) {
                await BackgroundGeolocation.addWatcher({
                    backgroundMessage: "Giloa is recording your route.",
                    backgroundTitle: "Giloa location recording",
                    requestPermissions: true, stale: false, distanceFilter: 10
                }, function(location, error) {
                    if (error) { console.warn("BG ?占쎌튂 ?占쎈쪟", error); return; }
                    if (location && isRecording) { handlePosition({ coords: { latitude: location.latitude, longitude: location.longitude, accuracy: location.accuracy } }); }
                });
            }
        } catch (e) { console.warn("沅뚰븳 ?占쎌껌 ?占쏀뙣", e); }
    }
}
requestLocationPermission();

const STORAGE_KEY = "giloa-v7";
const USER_ID_KEY = "giloa-user-id";
const FOG_ENABLED_KEY = "giloa-fog-enabled";
const MAP_LAYER_KEY = "giloa-map-layers";
const MAP_LAYER_RADIUS_M = 100;
const GPX_SAVES_KEY = "giloa-gpx-saves";
const TUTORIAL_DONE_KEY = "giloa-guide-tutorial-done-v2";
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
const PHOTO_REMOTE_MAX_SIZE = 1920;
const PHOTO_REMOTE_JPEG_QUALITY = 0.9;
const IMAGE_CLASSIFIER_MODEL_URL = "./tm-my-image-model/model.json";
const IMAGE_CLASSIFIER_METADATA_URL = "./tm-my-image-model/metadata.json";
const IMAGE_CLASSIFIER_THRESHOLD = 0.8;
const IMAGE_CLASS_BADGES = {
    "Hyundai Fountain": "image_hyundai_fountain",
    "Heendy": "image_heendy",
    "Hanam Bangul": "image_hanam_bangul",
    "Dasan Street": "image_dasan_street"
};

const LEVEL_TABLE = [
{ level: 1, title: "Wanderer", distKm: 0, memories: 0, photos: 0 },
{ level: 2, title: "Trace Maker", distKm: 1, memories: 0, photos: 0 },
{ level: 3, title: "Explorer", distKm: 10, memories: 1, photos: 0 },
{ level: 4, title: "Path Builder", distKm: 30, memories: 3, photos: 0 },
{ level: 5, title: "Wind Walker", distKm: 60, memories: 5, photos: 3 },
{ level: 6, title: "Memory Collector", distKm: 100, memories: 8, photos: 5 },
{ level: 7, title: "Two-Wheel Traveler", distKm: 150, memories: 12, photos: 8 },
{ level: 8, title: "Map Maker", distKm: 220, memories: 18, photos: 12 },
{ level: 9, title: "Road Chronicler", distKm: 300, memories: 25, photos: 18 },
{ level: 10, title: "Pioneer", distKm: 400, memories: 35, photos: 25 },
{ level: 11, title: "Speed Explorer", distKm: 550, memories: 45, photos: 33 },
{ level: 12, title: "Orbit Rider", distKm: 720, memories: 58, photos: 43 },
{ level: 13, title: "Continent Crosser", distKm: 900, memories: 72, photos: 55 },
{ level: 14, title: "World Witness", distKm: 1100, memories: 88, photos: 68 },
{ level: 15, title: "World Recorder", distKm: 1350, memories: 107, photos: 84 },
];

const LEVEL_TITLE_I18N = {
    ko: LEVEL_TABLE.map(function(row) { return row.title; }),
    en: LEVEL_TABLE.map(function(row) { return row.title; }),
    ja: LEVEL_TABLE.map(function(row) { return row.title; }),
    zh: LEVEL_TABLE.map(function(row) { return row.title; })
};
function getLevelTitle(current) {
    var titles = LEVEL_TITLE_I18N[currentLang] || LEVEL_TITLE_I18N.ko;
    var idx = Math.max(0, (current && current.level ? current.level : 1) - 1);
    return titles[idx] || titles[titles.length - 1] || "";
}
const SPEED_LIMIT_WALK = 7 / 3.6;
const SPEED_LIMIT_BIKE = 30 / 3.6;

// IndexedDB ?占?占쎌냼
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
    }).catch(function(e) { console.warn("?占쎌쭊 寃쎈웾???占쏀뙣", e); });
}

// ???占쏀깭 蹂??
let isRecording = false; let photos = []; let isFogEnabled = true; let isHudExpanded = false;
var MAP_LAYER_DEFAULTS = { library: true, restaurant: false, lodging: false, restroom: false, community: false };
var MAP_LAYER_UNAVAILABLE = { community: true };
function loadMapLayerSettings() {
    try {
        var raw = localStorage.getItem(MAP_LAYER_KEY);
        var saved = raw ? JSON.parse(raw) : {};
        return Object.assign({}, MAP_LAYER_DEFAULTS, saved);
    } catch (e) { return Object.assign({}, MAP_LAYER_DEFAULTS); }
}
var mapLayerSettings = loadMapLayerSettings();
var librariesLoaded = false;
function saveMapLayerSettings() { localStorage.setItem(MAP_LAYER_KEY, JSON.stringify(mapLayerSettings)); }
let currentPos = null; let pathCoordinates = []; let memories = []; let totalDistance = 0;
let currentUserId = "";
let playerMarker = null; let playerHeading = null; let watchId = null; let saveTimer = null; let rafId = null;
let screenWakeLock = null; let screenWakeLockTimer = null; let screenAwakeUntil = 0; let autoRecordingTimer = null; let trackingRetryTimer = null; let photoTapTimer = null;
let autoRecordingNoticePending = false;
const memoryMarkers = new Map();
let activeGpxId = null; let activeGpxLayers = []; let dialHours = 8;
const STAY_BONUS_MS = 30 * 60 * 1000; const STAY_BONUS_RADIUS_M = 50;
const IMAGE_MISSION_RADIUS_M = 120;
let stayBonusStartTime = null; let stayBonusAnchor = null; let stayBonusLevelBoost = 0; let stayBonusPlaces = [];
let activeImageMission = null;
let selectedDestination = null;
let lastPhotoMarkerSize = null;
let heicLoaderPromise = null;
const recBtn = document.getElementById("loc-btn");
const recStatusBox = document.getElementById("rec-status-box");

// 吏??珥덇린??
const map = L.map("map", { zoomControl: false, attributionControl: false }).setView([37.5665, 126.978], 16);
const BASE_TILE_LAYERS = [
    {
        url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        options: { zIndex: 10, maxZoom: 20 }
    },
    {
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        options: { maxZoom: 19, zIndex: 10, attribution: '&copy; OpenStreetMap contributors' }
    },
    {
        url: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
        options: { zIndex: 10, maxZoom: 19 }
    },
    {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
        options: { zIndex: 10, maxZoom: 19 }
    }
];
let currentBaseTileLayer = null;
let currentBaseTileIndex = 0;
let baseTileErrorCount = 0;
let baseTileLoadTimer = null;

function setBaseTileLayer(index) {
    var meta = BASE_TILE_LAYERS[index] || BASE_TILE_LAYERS[0];
    var mapWrap = document.getElementById("map-wrap");
    if (mapWrap) {
        mapWrap.classList.remove("tiles-ready");
        mapWrap.classList.remove("tiles-error");
    }
    if (currentBaseTileLayer) map.removeLayer(currentBaseTileLayer);
    currentBaseTileIndex = index;
    baseTileErrorCount = 0;
    currentBaseTileLayer = L.tileLayer(meta.url, meta.options).addTo(map);
    if (baseTileLoadTimer !== null) clearTimeout(baseTileLoadTimer);
    baseTileLoadTimer = setTimeout(function() {
        if (mapWrap && !mapWrap.classList.contains("tiles-ready")) {
            if (currentBaseTileIndex < BASE_TILE_LAYERS.length - 1) {
                setBaseTileLayer(currentBaseTileIndex + 1);
            } else {
                mapWrap.classList.add("tiles-error");
            }
        }
    }, 4500);
    currentBaseTileLayer.on("tileload", function() {
        if (baseTileLoadTimer !== null) {
            clearTimeout(baseTileLoadTimer);
            baseTileLoadTimer = null;
        }
        if (mapWrap) {
            mapWrap.classList.add("tiles-ready");
            mapWrap.classList.remove("tiles-error");
        }
    });
    currentBaseTileLayer.on("tileerror", function() {
        baseTileErrorCount += 1;
        if (baseTileErrorCount >= 3 && currentBaseTileIndex < BASE_TILE_LAYERS.length - 1) {
            setBaseTileLayer(currentBaseTileIndex + 1);
        } else if (baseTileErrorCount >= 3 && mapWrap) {
            mapWrap.classList.add("tiles-error");
        }
    });
}
setBaseTileLayer(0);
setTimeout(function() { map.invalidateSize(); }, 250);

let kakaoTrafficMap = null;
let kakaoTrafficLoading = null;

function getKakaoJsKey() {
    return (window.GILOA_KAKAO_JS_KEY || "").trim();
}

function leafletZoomToKakaoLevel(zoom) {
    return Math.max(1, Math.min(14, 19 - Math.round(zoom || 16)));
}

function loadKakaoTrafficSdk() {
    if (kakaoTrafficLoading) return kakaoTrafficLoading;
    kakaoTrafficLoading = new Promise(function(resolve, reject) {
        if (window.kakao && window.kakao.maps) {
            window.kakao.maps.load(resolve);
            return;
        }
        var appKey = getKakaoJsKey();
        if (!appKey) {
            reject(new Error("Kakao JavaScript key is missing."));
            return;
        }
        var script = document.createElement("script");
        script.src = "https://dapi.kakao.com/v2/maps/sdk.js?appkey=" + encodeURIComponent(appKey) + "&libraries=services&autoload=false";
        script.async = true;
        script.onload = function() {
            if (window.kakao && window.kakao.maps) window.kakao.maps.load(resolve);
            else reject(new Error("Kakao Maps SDK is unavailable."));
        };
        script.onerror = function() { reject(new Error("Kakao Maps SDK failed to load.")); };
        document.head.appendChild(script);
    });
    return kakaoTrafficLoading;
}

function syncKakaoTrafficMap() {
    if (!kakaoTrafficMap || !window.kakao || !window.kakao.maps) return;
    var center = map.getCenter();
    if (typeof kakaoTrafficMap.relayout === "function") kakaoTrafficMap.relayout();
    kakaoTrafficMap.setCenter(new window.kakao.maps.LatLng(center.lat, center.lng));
    kakaoTrafficMap.setLevel(leafletZoomToKakaoLevel(map.getZoom()));
}

function toggleKakaoTraffic(force) {
    var wrap = document.getElementById("kakao-traffic-wrap");
    var btn = document.getElementById("traffic-btn");
    if (!wrap) return;
    var next = typeof force === "boolean" ? force : !wrap.classList.contains("show");
    if (!next) {
        wrap.classList.remove("show");
        wrap.setAttribute("aria-hidden", "true");
        if (btn) btn.classList.remove("active");
        return;
    }
    loadKakaoTrafficSdk().then(function() {
        wrap.classList.add("show");
        wrap.setAttribute("aria-hidden", "false");
        if (btn) btn.classList.add("active");
        var center = map.getCenter();
        var el = document.getElementById("kakao-traffic-map");
        if (!kakaoTrafficMap) {
            kakaoTrafficMap = new window.kakao.maps.Map(el, {
                center: new window.kakao.maps.LatLng(center.lat, center.lng),
                level: leafletZoomToKakaoLevel(map.getZoom())
            });
            kakaoTrafficMap.addOverlayMapTypeId(window.kakao.maps.MapTypeId.TRAFFIC);
        }
        setTimeout(syncKakaoTrafficMap, 0);
    }).catch(function(error) {
        alert("移댁뭅??援먰넻 吏?占쏙옙? 遺덈윭?占쏙옙? 紐삵뻽?占쎈땲?? config.js??JavaScript ?占쏙옙? ?占쎈찓???占쎌젙???占쎌씤??二쇱꽭??");
        console.warn(error);
    });
}
function openKakaoDirections() {
    if (!currentPos) {
        alert("?占쎌옱 ?占쎌튂占??占쎌씤????湲몄갼湲곤옙? ?????占쎌뒿?占쎈떎.");
        centerMap();
        return;
    }
    var mapCenter = map.getCenter();
    var dest = selectedDestination || (mapCenter ? { lat: mapCenter.lat, lng: mapCenter.lng, name: "紐⑹쟻吏" } : null);
    if (!dest || !isFinite(dest.lat) || !isFinite(dest.lng)) {
        alert("紐⑹쟻吏占??占쎌씤?????占쎌뒿?占쎈떎.");
        return;
    }
    if (currentPos.distanceTo([dest.lat, dest.lng]) < 15) {
        alert("?占쎌옱 ?占쎌튂?占?紐⑹쟻吏媛 ?占쎈Т 媛源앹뒿?占쎈떎. ?占쎌갑??怨녹쓣 ?占쏀깮??二쇱꽭??");
        return;
    }
    var startName = "?占쎌옱 ?占쎌튂";
    var destName = dest.name || "紐⑹쟻吏";
    var url = "https://map.kakao.com/link/from/" + encodeURIComponent(startName) + "," + currentPos.lat.toFixed(6) + "," + currentPos.lng.toFixed(6) + "/to/" + encodeURIComponent(destName) + "," + dest.lat.toFixed(6) + "," + dest.lng.toFixed(6);
    try {
        window.open(url, "_blank");
    } catch (e) {
        location.href = url;
    }
}
function setSelectedDestination(lat, lng, name) {
    if (!isFinite(lat) || !isFinite(lng)) return;
    selectedDestination = {
        lat: lat,
        lng: lng,
        name: String(name || "紐⑹쟻吏").trim() || "紐⑹쟻吏"
    };
}

map.on("moveend zoomend", function() {
    var wrap = document.getElementById("kakao-traffic-wrap");
    if (wrap && wrap.classList.contains("show")) syncKakaoTrafficMap();
});

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
map.createPane("restroomPane");
map.getPane("restroomPane").style.zIndex = 667;
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
    var gameLineEl = document.getElementById("hud-game-line");
    var miniLineEl = document.getElementById("hud-mini-line");
    var xpDistEl = document.getElementById("hud-xp-dist");
    var xpMemEl = document.getElementById("hud-xp-memory");
    var xpPhotoEl = document.getElementById("hud-xp-photo");
    var miniDistEl = document.getElementById("hud-mini-dist");
    var miniMemEl = document.getElementById("hud-mini-memory");
    var miniPhotoEl = document.getElementById("hud-mini-photo");
    var distPct = 100, memPct = 100, photoPct = 100, avgPct = 100;
    if (nextRow) {
        distPct = nextRow.distKm > current.distKm ? Math.max(0, Math.min(100, ((distKm - current.distKm) / (nextRow.distKm - current.distKm)) * 100)) : 100;
        memPct = nextRow.memories > current.memories ? Math.max(0, Math.min(100, ((memCount - current.memories) / (nextRow.memories - current.memories)) * 100)) : 100;
        photoPct = nextRow.photos > current.photos ? Math.max(0, Math.min(100, ((photoCount - current.photos) / (nextRow.photos - current.photos)) * 100)) : 100;
        avgPct = Math.round((distPct + memPct + photoPct) / 3);
    }
    var hudLine = (isRecording ? "기록 중" : "중단됨") + " · LV " + current.level + " · 다음 " + avgPct + "%";
    if (gameLineEl) gameLineEl.textContent = hudLine;
    if (miniLineEl) miniLineEl.textContent = hudLine;
    if (xpDistEl) xpDistEl.style.width = (distPct / 3).toFixed(2) + "%";
    if (xpMemEl) xpMemEl.style.width = (memPct / 3).toFixed(2) + "%";
    if (xpPhotoEl) xpPhotoEl.style.width = (photoPct / 3).toFixed(2) + "%";
    if (miniDistEl) miniDistEl.style.width = (distPct / 3).toFixed(2) + "%";
    if (miniMemEl) miniMemEl.style.width = (memPct / 3).toFixed(2) + "%";
    if (miniPhotoEl) miniPhotoEl.style.width = (photoPct / 3).toFixed(2) + "%";
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

function updateStats() { var todayDist = calcTodayDistance(); var distEl = document.getElementById("dist-val"); var todayEl = document.getElementById("today-dist-val"); var memEl = document.getElementById("memory-count-val"); var photoEl = document.getElementById("photo-count-val"); if (distEl) distEl.innerHTML = (totalDistance / 1000).toFixed(2) + "<span>km</span>"; if (todayEl) todayEl.innerHTML = (todayDist / 1000).toFixed(2) + "<span>km</span>"; if (memEl) memEl.innerHTML = memories.length + "<span>개</span>"; if (photoEl) photoEl.innerHTML = photos.length + "<span>장</span>"; updateHud(); checkBadges(); }

function toggleHud() { applyHudLang(UI_TEXT[currentLang] || UI_TEXT.ko); isHudExpanded = !isHudExpanded; document.getElementById("hud").classList.toggle("expanded", isHudExpanded); document.getElementById("controls").classList.toggle("hud-open", isHudExpanded); document.getElementById("help-btn").classList.toggle("hud-open", isHudExpanded); if (isHudExpanded) { setTimeout(function() { document.addEventListener("click", handleHudOutsideClick); }, 0); } else { document.removeEventListener("click", handleHudOutsideClick); } }
function handleHudOutsideClick(event) { var hud = document.getElementById("hud"); if (!hud.contains(event.target)) { isHudExpanded = false; hud.classList.remove("expanded"); document.getElementById("controls").classList.remove("hud-open"); document.getElementById("help-btn").classList.remove("hud-open"); document.removeEventListener("click", handleHudOutsideClick); } }
function getStatusText(key, value) {
    var t = UI_TEXT[currentLang] || UI_TEXT.en || UI_TEXT.ko;
    var text = t[key] || (UI_TEXT.en && UI_TEXT.en[key]) || key;
    return typeof value === "undefined" ? text : text.replace("{value}", value);
}
function syncRecordingUI() { recBtn.classList.toggle("recording", isRecording); recStatusBox.textContent = isRecording ? "기록 중" : "중단됨"; recStatusBox.classList.toggle("recording", isRecording); updateHud(); syncImageMissionUI(); }
function getImageMissionLatLng(item) {
    if (!item) return null;
    var lat = parseFloat(item.mapy !== undefined ? item.mapy : item.lat);
    var lng = parseFloat(item.mapx !== undefined ? item.mapx : item.lng);
    if (!isFinite(lat) || !isFinite(lng)) return null;
    return L.latLng(lat, lng);
}
function getImageMissionName(item) { return getTourDisplayTitle(item) || item.name || item.LBRRY_NAME || item.title || "誘몄뀡 ?占쎌냼"; }
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
    photoBtn.setAttribute("title", activeImageMission ? activeImageMission.name + " ?占쏙옙?吏 誘몄뀡" : "媛ㅻ윭由ъ뿉???占쎌쭊 遺덈윭?占쎄린");
}
function syncFogButton() { var t = UI_TEXT[currentLang] || UI_TEXT.ko; var toggleBtn = document.getElementById("fog-toggle-btn"); var toggleState = document.getElementById("fog-toggle-state"); if (!toggleBtn) return; toggleBtn.classList.toggle("on", isFogEnabled); toggleBtn.classList.toggle("off", !isFogEnabled); if (toggleState) { toggleState.textContent = isFogEnabled ? t.fog_on : t.fog_off; toggleState.classList.toggle("on", isFogEnabled); toggleState.classList.toggle("off", !isFogEnabled); } }
function toggleHelp() { applyHelpLang(UI_TEXT[currentLang] || UI_TEXT.ko); document.getElementById("help-popup").classList.toggle("show"); }
function handleHelpOverlayClick(event) { var box = document.getElementById("help-content-box"); if (!box.contains(event.target)) toggleHelp(); }
function switchHelpTab(tab) { applyHelpLang(UI_TEXT[currentLang] || UI_TEXT.ko); ["ask", "info"].forEach(function(t) { document.getElementById("htab-" + t).classList.toggle("active", t === tab); document.getElementById("hpanel-" + t).style.display = t === tab ? "" : "none"; }); }
function replayGiloaTutorial() { var helpPopup = document.getElementById("help-popup"); if (helpPopup) helpPopup.classList.remove("show"); localStorage.removeItem(TUTORIAL_DONE_KEY); openGiloaTutorial(true); }
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
                originalUrl: photo.webPath || photo.path || "",
                sourceUri: photo.path || photo.webPath || "",
                sourceWebPath: photo.webPath || "",
                sourceType: "camera"
            });
            return;
        } catch (e) {
            console.warn("移대찓???占쏀뙣", e);
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
                var lastImportedPhoto = null;
                for (var i = 0; i < list.length; i++) {
                    if (recStatusBox) recStatusBox.textContent = "?占쎌쭊 泥섎━ 占?" + (i + 1) + "/" + list.length;
                    var one = list[i];
                    var gpsOne = await getPhotoExifGps(one);
                    var coordOne = gpsOne || { lat: fallbackLat, lng: fallbackLng };
                    var imgOne = await loadImageFromUrl(one.webPath || one.path);
                    lastImportedPhoto = processPhoto(imgOne, new Date(), coordOne.lat, coordOne.lng, {
                        deferUi: true,
                        openPopup: list.length === 1,
                        originalUrl: one.webPath || one.path || "",
                        sourceUri: one.path || one.webPath || "",
                        sourceWebPath: one.webPath || "",
                        sourceType: "gallery",
                        locationSource: gpsOne ? "exif" : "fallback"
                    });
                }
                updateStats();
                scheduleSave();
                updatePhotoList();
                if (lastImportedPhoto) focusPhotoOnMap(lastImportedPhoto);
                syncRecordingUI();
                return;
            }
            var single = await Camera.getPhoto({ quality: 95, resultType: "uri", source: "PHOTOS" });
            var gpsSingle = await getPhotoExifGps(single);
            var coordSingle = gpsSingle || { lat: fallbackLat, lng: fallbackLng };
            var img = await loadImageFromUrl(single.webPath || single.path);
            var importedSingle = processPhoto(img, new Date(), coordSingle.lat, coordSingle.lng, {
                originalUrl: single.webPath || single.path || "",
                sourceUri: single.path || single.webPath || "",
                sourceWebPath: single.webPath || "",
                sourceType: "gallery",
                locationSource: gpsSingle ? "exif" : "fallback"
            });
            if (importedSingle) focusPhotoOnMap(importedSingle);
            return;
        } catch (e) {
            console.warn("媛ㅻ윭占?遺덈윭?占쎄린 ?占쏀뙣", e);
        }
    }
    document.getElementById("gallery-input").click();
}
async function openPhotoInGallery(data) {
    var sourceUri = data && (data.remotePhotoUrl || data.sourceUri || data.sourceWebPath);
    if (!sourceUri) {
        alert("?占쎈낯 ?占쎌쭊 寃쎈줈 ?占쎈낫媛 ?占쎌뼱 湲곌린 媛ㅻ윭由ъ뿉??諛붾줈 ?????占쎌뒿?占쎈떎.");
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
        console.warn("?占쎈낯 ?占쎄린 ?占쏀뙣", e);
        try { window.open(sourceUri, "_blank"); }
        catch (_) { alert("?占쎈낯 ?占쎌쭊???占쏙옙? 紐삵뻽?占쎈땲??"); }
    }
}
function focusPhotoOnMap(data) {
    setSelectedDestination(data.lat, data.lng, data.dateString || "?占쎌쭊 ?占쎌튂");
    map.flyTo([data.lat, data.lng], 17);
    var markerLayer = findPhotoMarker(data.id);
    if (markerLayer) markerLayer.openPopup();
    toggleSidebar(false);
}
function canUseScreenWakeLock() { return !!(navigator.wakeLock && typeof navigator.wakeLock.request === "function"); }
function requestNativeScreenAwake() { try { if (window.GiloaScreenAwake && typeof window.GiloaScreenAwake.keepScreenOnFor === "function") window.GiloaScreenAwake.keepScreenOnFor(SCREEN_AWAKE_MS); } catch (e) { console.warn("?占쎌씠?占쎈툕 ?占쎈㈃ ?占쏙옙? ?占쏀뙣", e); } }
function releaseNativeScreenAwake() { try { if (window.GiloaScreenAwake && typeof window.GiloaScreenAwake.clearKeepScreenOn === "function") window.GiloaScreenAwake.clearKeepScreenOn(); } catch (e) { console.warn("?占쎌씠?占쎈툕 ?占쎈㈃ ?占쏙옙? ?占쎌젣 ?占쏀뙣", e); } }
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
    } catch (e) { console.warn("?占쎈㈃ 耳쒖쭚 ?占쏙옙? ?占쏀뙣", e); }
}
function releaseScreenAwake() {
    screenAwakeUntil = 0;
    releaseNativeScreenAwake();
    if (screenWakeLockTimer) { clearTimeout(screenWakeLockTimer); screenWakeLockTimer = null; }
    var lock = screenWakeLock;
    screenWakeLock = null;
    if (lock && !lock.released) lock.release().catch(function(e) { console.warn("?占쎈㈃ 耳쒖쭚 ?占쎌젣 ?占쏀뙣", e); });
}
document.addEventListener("visibilitychange", function() {
    if (isRecording && Date.now() < screenAwakeUntil && document.visibilityState === "visible") requestScreenAwake();
});
function clearAutoRecordingTimer() {
    if (autoRecordingTimer) { clearTimeout(autoRecordingTimer); autoRecordingTimer = null; }
}
function clearTrackingRetryTimer() {
    if (trackingRetryTimer) { clearTimeout(trackingRetryTimer); trackingRetryTimer = null; }
}
function startAutoRecordingTimer() {
    clearAutoRecordingTimer();
    autoRecordingTimer = setTimeout(function() {
        autoRecordingTimer = null;
        if (isRecording) stopRecording();
    }, AUTO_RECORDING_MS);
}
function stopRecording() {
    isRecording = false;
    clearAutoRecordingTimer();
    clearTrackingRetryTimer();
    releaseScreenAwake();
    syncRecordingUI();
    stopTracking();
    compactPathData();
    scheduleSave();
}
function resetRecordingState() { stopRecording(); }
function focusCurrentLocation() {
    if (currentPos) {
        map.panTo(currentPos);
        return;
    }
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(function(position) {
        handlePosition(position);
        if (currentPos) map.setView(currentPos, Math.max(map.getZoom(), 16));
    }, function() {}, { enableHighAccuracy: true, maximumAge: 3000, timeout: 8000 });
}
function toggleRecording() {
    if (isRecording) { stopRecording(); return; }
    focusCurrentLocation();
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
var AUTO_RECORDING_NOTICE_TEXT = {
    ko: {
        title: "8시간 자동 기록을 시작합니다",
        copy: "앱을 켜면 현재 위치 기록이 바로 시작되고, 8시간 뒤 자동으로 중단됩니다.",
        copy2: "직접 멈추려면 오른쪽 아래 기록 버튼을 눌러주세요.",
        close: "닫기"
    },
    en: {
        title: "8-hour recording started",
        copy: "Location recording starts when the app opens and stops automatically after 8 hours.",
        copy2: "To stop it yourself, tap the record button at the bottom right.",
        close: "Close"
    },
    ja: {
        title: "8時間の自動記録を開始します",
        copy: "アプリを開くと位置記録が始まり、8時間後に自動で停止します。",
        copy2: "手動で停止するには、右下の記録ボタンを押してください。",
        close: "閉じる"
    },
    zh: {
        title: "开始8小时自动记录",
        copy: "打开应用后会立即开始记录位置，并在8小时后自动停止。",
        copy2: "如需手动停止，请点击右下角的记录按钮。",
        close: "关闭"
    }
};
function applyAutoRecordingNoticeLang() {
    var overlay = document.getElementById("auto-recording-notice");
    if (!overlay) return;
    var text = AUTO_RECORDING_NOTICE_TEXT[currentLang] || AUTO_RECORDING_NOTICE_TEXT.ko;
    var box = overlay.querySelector(".auto-recording-box");
    var closeBtn = overlay.querySelector(".auto-recording-close");
    var title = overlay.querySelector(".auto-recording-title");
    var copy = overlay.querySelector(".auto-recording-copy");
    if (box) box.setAttribute("aria-label", text.title);
    if (closeBtn) closeBtn.setAttribute("aria-label", text.close);
    if (title) title.textContent = text.title;
    if (copy) {
        copy.textContent = "";
        copy.appendChild(document.createTextNode(text.copy));
        copy.appendChild(document.createElement("br"));
        copy.appendChild(document.createTextNode(text.copy2));
    }
}
function showAutoRecordingNotice() {
    var overlay = document.getElementById("auto-recording-notice");
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "auto-recording-notice";
        var box = document.createElement("div");
        box.className = "auto-recording-box";
        box.setAttribute("role", "dialog");
        box.setAttribute("aria-modal", "true");
        var closeBtn = document.createElement("button");
        closeBtn.className = "auto-recording-close";
        closeBtn.type = "button";
        closeBtn.textContent = "\u00d7";
        var title = document.createElement("div");
        title.className = "auto-recording-title";
        var copy = document.createElement("div");
        copy.className = "auto-recording-copy";
        box.appendChild(closeBtn);
        box.appendChild(title);
        box.appendChild(copy);
        overlay.appendChild(box);
        overlay.addEventListener("click", function(e) { if (e.target === overlay) dismissAutoRecordingNotice(); });
        document.body.appendChild(overlay);
        closeBtn.addEventListener("click", dismissAutoRecordingNotice);
    }
    applyAutoRecordingNoticeLang();
    overlay.classList.add("show");
}
function startAutoRecordingOnLaunch() {
    if (!isRecording) toggleRecording();
    var tutorial = document.getElementById("giloa-tutorial");
    if (tutorial && tutorial.classList.contains("show")) {
        autoRecordingNoticePending = true;
        return;
    }
    showAutoRecordingNotice();
}
function toggleFog() { isFogEnabled = !isFogEnabled; localStorage.setItem(FOG_ENABLED_KEY, String(isFogEnabled)); syncFogButton(); scheduleRender(); }
function startTracking() {
    clearTrackingRetryTimer();
    if (!navigator.geolocation) {
        if (recStatusBox) recStatusBox.textContent = "Location unavailable";
        return;
    }
    if (!window.isSecureContext && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") {
        if (recStatusBox) recStatusBox.textContent = "HTTPS ?꾩슂";
        return;
    }
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    watchId = navigator.geolocation.watchPosition(handlePosition, handleLocationError, { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 });
    if (recStatusBox && isRecording) recStatusBox.textContent = "Waiting for location";
}
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
    if (accuracy > 100) { recStatusBox.textContent = getStatusText("gps_very_weak", Math.round(accuracy)); return; }
    var now = Date.now(); recStatusBox.textContent = accuracy > MAX_ACCURACY_M ? getStatusText("gps_weak", Math.round(accuracy)) : getStatusText("rec_active");
    if (pathCoordinates.length === 0) { pathCoordinates.push(createPathPoint(latlng, now)); checkStayBonus(latlng, now); updateStats(); scheduleSave(); scheduleRender(); return; }
    var last = pathCoordinates[pathCoordinates.length - 1]; var dist = distanceToPoint(latlng, last); var stayThreshold = getDynamicStayThreshold(accuracy);
    if (dist <= stayThreshold) { last.endTime = now; last.visits = (last.visits || 1) + 1; last.lat += (latlng.lat - last.lat) * 0.3; last.lng += (latlng.lng - last.lng) * 0.3; }
    else { totalDistance += dist; pathCoordinates.push(createPathPoint(latlng, now)); if (pathCoordinates.length > MAX_PATH_POINTS) compactPathData(); }
    checkStayBonus(latlng, now); updateStats(); scheduleSave(); scheduleRender();
}

function handleLocationError(err) {
    var messages = { 1: "Location permission needed", 2: "Checking location", 3: "Location timeout" };
    if (recStatusBox) recStatusBox.textContent = messages[err && err.code] || "Waiting for location";
    if (!isRecording || (err && err.code === 1)) return;
    clearTrackingRetryTimer();
    trackingRetryTimer = setTimeout(function() {
        trackingRetryTimer = null;
        if (isRecording) startTracking();
    }, 15000);
}
function createPathPoint(latlng, timestamp) { return { lat: latlng.lat, lng: latlng.lng, startTime: timestamp, endTime: timestamp, visits: 1 }; }
function distanceToPoint(latlng, point) { return latlng.distanceTo([point.lat, point.lng]); }
function getDynamicStayThreshold(accuracy) { return Math.max(MIN_MOVE_M, Math.min(MAX_STAY_RADIUS_M, accuracy * STAY_ACCURACY_FACTOR)); }

function checkStayBonus(latlng, now) {
    if (!stayBonusAnchor) { stayBonusAnchor = latlng; stayBonusStartTime = now; return; }
    if (latlng.distanceTo(stayBonusAnchor) > STAY_BONUS_RADIUS_M) { stayBonusAnchor = latlng; stayBonusStartTime = now; return; }
    if (stayBonusPlaces.some(function(p) { return latlng.distanceTo([p.lat, p.lng]) <= STAY_BONUS_RADIUS_M; })) return;
    var remaining = STAY_BONUS_MS - (now - stayBonusStartTime);
    if (remaining > 0) { recStatusBox.textContent = getStatusText("stay_bonus_wait", Math.ceil(remaining / 60000)); return; }
    stayBonusPlaces.push({ lat: stayBonusAnchor.lat, lng: stayBonusAnchor.lng }); stayBonusLevelBoost += 1; saveBonusState(); updateStats();
    recStatusBox.textContent = getStatusText("stay_bonus_done"); setTimeout(function() { if (isRecording) recStatusBox.textContent = getStatusText("rec_active"); }, 4000);
}
function saveBonusState() { localStorage.setItem("giloa-stay-bonus", JSON.stringify({ boost: stayBonusLevelBoost, places: stayBonusPlaces })); }
function loadBonusState() { try { var raw = localStorage.getItem("giloa-stay-bonus"); if (!raw) return; var data = JSON.parse(raw); stayBonusLevelBoost = isFinite(data.boost) ? data.boost : 0; stayBonusPlaces = Array.isArray(data.places) ? data.places.filter(function(p) { return isFinite(p.lat) && isFinite(p.lng); }) : []; } catch (e) { console.warn("沅뚰븳 ?占쎌껌 ?占쏀뙣", e); } }
function calcTodayDistance() { var todayStartMs = new Date().setHours(0, 0, 0, 0); var dist = 0; for (var i = 1; i < pathCoordinates.length; i++) { if (pathCoordinates[i].startTime >= todayStartMs) { dist += L.latLng(pathCoordinates[i].lat, pathCoordinates[i].lng).distanceTo([pathCoordinates[i - 1].lat, pathCoordinates[i - 1].lng]); } } return dist; }

function compactPathData() {
    if (pathCoordinates.length <= 1) return; var merged = [];
    for (var i = 0; i < pathCoordinates.length; i++) { var point = pathCoordinates[i]; var last = merged[merged.length - 1]; if (!last) { merged.push(Object.assign({}, point)); continue; } var timeGap = point.startTime - last.endTime; var dist = L.latLng(point.lat, point.lng).distanceTo([last.lat, last.lng]); if (dist <= MERGE_DISTANCE_M && timeGap <= MERGE_TIME_GAP_MS) { var tv = (last.visits || 1) + (point.visits || 1); last.lat = ((last.lat * (last.visits || 1)) + (point.lat * (point.visits || 1))) / tv; last.lng = ((last.lng * (last.visits || 1)) + (point.lng * (point.visits || 1))) / tv; last.endTime = Math.max(last.endTime, point.endTime); last.visits = tv; } else { merged.push(Object.assign({}, point)); } }
    pathCoordinates = shrinkOldPoints(merged, MAX_PATH_POINTS);
}
function shrinkOldPoints(points, maxPoints) { if (points.length <= maxPoints) return points; var keepTail = Math.floor(maxPoints * 0.4); var tail = points.slice(-keepTail); var head = points.slice(0, points.length - keepTail); var ratio = Math.ceil(head.length / (maxPoints - keepTail)); var filtered = head.filter(function(_, i) { return i % ratio === 0; }); return filtered.concat(tail).slice(-maxPoints); }

function addMemoryAt(lat, lng, defaultName) {
    if (!isFinite(lat) || !isFinite(lng)) { alert("湲곗뼲?占쎈줈 ?占쎄만 ?占쎌튂媛 ?占쎌뒿?占쎈떎."); return; }
    var input = prompt("???占쎌냼???占쎈쫫???占쎈젰?占쎌꽭??", defaultName || "?占쎈줈??諛쒓껄");
    if (input === null) return;
    var now = new Date();
    var data = {
        id: String(now.getTime()),
        lat: lat,
        lng: lng,
        name: escapeHtml(input.trim() || "Memory point"),
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
    if (!currentPos) { alert("?占쎌튂 ?占쎈낫占??占쎌떊 以묒엯?占쎈떎."); return; }
    addMemoryAt(currentPos.lat, currentPos.lng, "?占쎈줈??諛쒓껄");
}
function addPhotoMemory(data) {
    if (!data) return;
    addMemoryAt(data.lat, data.lng, "?占쎌쭊??湲곗뼲");
}
function createMemoryMarker(data, openPopup) { var marker = L.marker([data.lat, data.lng], { pane: "memoryPane", icon: L.divIcon({ className: "memory-marker", html: "*", iconSize: [28, 28] }) }).addTo(map); var popupEl = document.createElement("div"); var title = document.createElement("b"); title.textContent = data.name; var info = document.createElement("small"); info.style.display = "block"; info.textContent = data.dateString + " " + (data.timeString || ""); var delBtn = document.createElement("button"); delBtn.className = "popup-delete-btn"; delBtn.textContent = "Delete"; delBtn.addEventListener("click", function() { deleteMemory(data.id); }); popupEl.appendChild(title); popupEl.appendChild(document.createElement("br")); popupEl.appendChild(info); popupEl.appendChild(delBtn); marker.bindPopup(popupEl); marker.on("click", function() { setSelectedDestination(data.lat, data.lng, data.name || "Memory point"); }); memoryMarkers.set(data.id, marker); if (openPopup) { setSelectedDestination(data.lat, data.lng, data.name || "Memory point"); marker.openPopup(); } }
function deleteMemory(id) { memories = memories.filter(function(m) { return m.id !== id; }); var marker = memoryMarkers.get(id); if (marker) { map.removeLayer(marker); memoryMarkers.delete(id); } updateMemoryList(); updateStats(); scheduleSave(); }
function updateMemoryList() { var container = document.getElementById("memory-list-container"); if (!container) return; if (memories.length === 0) { container.innerHTML = '<p class="empty-message">?占쎌쭅 湲곕줉???占쎌뒿?占쎈떎.</p>'; return; } container.innerHTML = ""; memories.slice().reverse().forEach(function(memo) { var item = document.createElement("div"); item.className = "memory-item"; var name = document.createElement("span"); name.className = "item-name"; name.textContent = memo.name; var date = document.createElement("span"); date.className = "item-date"; date.textContent = memo.dateString + " " + (memo.timeString || ""); var actions = document.createElement("div"); actions.className = "memory-actions"; var moveBtn = document.createElement("button"); moveBtn.className = "memory-action-btn move"; moveBtn.textContent = "?占쎈룞"; moveBtn.addEventListener("click", function(e) { e.stopPropagation(); setSelectedDestination(memo.lat, memo.lng, memo.name || "湲곗뼲???μ냼"); map.flyTo([memo.lat, memo.lng], 17); }); var delBtn = document.createElement("button"); delBtn.className = "memory-action-btn delete"; delBtn.textContent = "??占쏙옙"; delBtn.addEventListener("click", function(e) { e.stopPropagation(); deleteMemory(memo.id); }); actions.appendChild(moveBtn); actions.appendChild(delBtn); item.appendChild(name); item.appendChild(date); item.appendChild(actions); item.addEventListener("click", function() { setSelectedDestination(memo.lat, memo.lng, memo.name || "湲곗뼲???μ냼"); map.flyTo([memo.lat, memo.lng], 17); toggleSidebar(false); }); container.appendChild(item); }); }
// 紐⑤뱺 ???占쏀솚
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
function updatePhotoList() { var container = document.getElementById("photo-list-container"); if (!container) return; if (photos.length === 0) { container.innerHTML = '<p class="empty-message" style="grid-column:1/-1">아직 저장된 사진이 없습니다.</p>'; return; } container.innerHTML = ""; photos.slice().reverse().forEach(function(p) { var item = document.createElement("div"); item.className = "photo-list-item"; var img = document.createElement("img"); img.src = p.thumb || p.photo || p.remoteThumbUrl || p.remotePhotoUrl; var date = document.createElement("div"); date.className = "photo-list-date"; date.textContent = p.dateString; var del = document.createElement("div"); del.className = "photo-list-del"; del.textContent = "×"; del.addEventListener("click", function(e) { e.stopPropagation(); deletePhoto(p.id); updatePhotoList(); }); item.addEventListener("click", function() { focusPhotoOnMap(p); }); item.addEventListener("dblclick", function(e) { e.preventDefault(); openPhotoInGallery(p); }); item.addEventListener("contextmenu", function(e) { e.preventDefault(); focusPhotoOnMap(p); }); item.title = "지도에서 보기"; item.appendChild(img); item.appendChild(date); item.appendChild(del); container.appendChild(item); }); }
function findPhotoMarker(id) { var found = null; photoClusterGroup.eachLayer(function(layer) { if (layer._photoData && layer._photoData.id === id) found = layer; }); return found; }
function adjustHourDial(dir) { var next = dialHours + dir; if (next < 1 || next > 8) return; dialHours = next; updateDialUI(); }
function updateDialUI() { var labelEl = document.getElementById("dial-hour-label"); var infoEl = document.getElementById("gpx-range-info"); if (labelEl) labelEl.textContent = dialHours + "h"; if (infoEl) infoEl.textContent = "Recent " + dialHours + " hour route"; }
function buildGpxContent(name, points) { var trkpts = points.map(function(p) { var t = new Date(p.startTime).toISOString(); return '    <trkpt lat="' + p.lat.toFixed(7) + '" lon="' + p.lng.toFixed(7) + '">\n      <time>' + t + '</time>\n    </trkpt>'; }).join("\n"); return '<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="Giloa"\n     xmlns="http://www.topografix.com/GPX/1/1">\n  <metadata><name>' + escapeXml(name) + '</name><time>' + new Date().toISOString() + '</time></metadata>\n  <trk><name>' + escapeXml(name) + '</name><trkseg>\n' + trkpts + '\n  </trkseg></trk>\n</gpx>'; }
function escapeXml(value) { return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;"); }
function saveGpxRecord(name, points, options) { options = options || {}; if (!Array.isArray(points) || points.length === 0) return null; var gpxContent = buildGpxContent(name, points); var saves = loadGpxSaves(); var id = String(Date.now()) + Math.random().toString(36).slice(2); saves.push({ id: id, name: name, createdAt: Date.now(), pointCount: points.length, gpxContent: gpxContent }); saveGpxSaves(saves); updateGpxSavedList(); if (options.download) { var blob = new Blob([gpxContent], { type: "application/gpx+xml" }); var url = URL.createObjectURL(blob); var a = document.createElement("a"); a.href = url; a.download = "giloa_" + name + ".gpx"; a.click(); URL.revokeObjectURL(url); } return id; }
function exportGpx() { var sinceMs = Date.now() - dialHours * 60 * 60 * 1000; var filtered = pathCoordinates.filter(function(p) { return p.startTime >= sinceMs; }); if (filtered.length === 0) { alert("해당 시간에 기록된 경로가 없습니다."); return; } var nameInput = document.getElementById("gpx-export-name").value.trim(); var name = nameInput || "최근 " + dialHours + "시간 경로"; saveGpxRecord(name, filtered, { download: true }); document.getElementById("gpx-export-name").value = ""; document.getElementById("gpx-import-status").textContent = '"' + name + '" 저장 완료'; }
function loadGpxSaves() { try { return JSON.parse(localStorage.getItem(GPX_SAVES_KEY) || "[]"); } catch(e) { return []; } }
function saveGpxSaves(saves) { localStorage.setItem(GPX_SAVES_KEY, JSON.stringify(saves)); }
function updateGpxSavedList() { var container = document.getElementById("gpx-saved-list"); if (!container) return; var saves = loadGpxSaves(); if (saves.length === 0) { container.innerHTML = '<p class="empty-message">저장된 경로가 없습니다.</p>'; return; } container.innerHTML = ""; saves.slice().reverse().forEach(function(s) { var item = document.createElement("div"); item.className = "gpx-saved-item" + (s.id === activeGpxId ? " active-route" : ""); var icon = document.createElement("span"); icon.className = "gpx-saved-icon"; icon.textContent = s.id === activeGpxId ? "표시 중" : "경로"; var info = document.createElement("div"); info.className = "gpx-saved-info"; var nameEl = document.createElement("div"); nameEl.className = "gpx-saved-name"; nameEl.textContent = s.name; var meta = document.createElement("div"); meta.className = "gpx-saved-meta"; meta.textContent = new Date(s.createdAt).toLocaleDateString("ko-KR") + " · " + s.pointCount + "개 지점"; info.appendChild(nameEl); info.appendChild(meta); var del = document.createElement("div"); del.className = "gpx-saved-del"; del.textContent = "삭제"; del.addEventListener("click", function(e) { e.stopPropagation(); deleteGpxSave(s.id); }); item.appendChild(icon); item.appendChild(info); item.appendChild(del); item.addEventListener("click", function() { toggleGpxRoute(s); }); container.appendChild(item); }); }
function deleteGpxSave(id) { if (id === activeGpxId) clearActiveGpxRoute(); saveGpxSaves(loadGpxSaves().filter(function(s) { return s.id !== id; })); updateGpxSavedList(); }
function toggleGpxRoute(save) { if (activeGpxId === save.id) { clearActiveGpxRoute(); updateGpxSavedList(); return; } clearActiveGpxRoute(); drawGpxRoute(save.gpxContent, save.id); updateGpxSavedList(); toggleSidebar(false); }
function clearActiveGpxRoute() { activeGpxLayers.forEach(function(l) { map.removeLayer(l); }); activeGpxLayers = []; activeGpxId = null; }
function drawGpxRoute(gpxContent, id) { var parser = new DOMParser(); var xmlDoc = parser.parseFromString(gpxContent, "application/xml"); var trkpts = xmlDoc.querySelectorAll("trkpt"); var latlngs = []; trkpts.forEach(function(pt) { var lat = parseFloat(pt.getAttribute("lat")); var lng = parseFloat(pt.getAttribute("lon")); if (isFinite(lat) && isFinite(lng)) latlngs.push([lat, lng]); }); if (latlngs.length === 0) return; var polyline = L.polyline(latlngs, { color: "#4db8ff", weight: 4, opacity: 0.85, dashArray: "8, 6" }).addTo(map); var startM = L.circleMarker(latlngs[0], { radius: 7, color: "#4db8ff", fillColor: "#fff", fillOpacity: 1, weight: 2.5 }).addTo(map).bindTooltip("출발"); var endM = L.circleMarker(latlngs[latlngs.length - 1], { radius: 7, color: "#ff6b6b", fillColor: "#fff", fillOpacity: 1, weight: 2.5 }).addTo(map).bindTooltip("도착"); activeGpxLayers = [polyline, startM, endM]; activeGpxId = id; map.fitBounds(polyline.getBounds(), { padding: [50, 50] }); }
function importGpxFile(event) { var file = event.target.files[0]; if (!file) return; var statusEl = document.getElementById("gpx-import-status"); statusEl.textContent = "불러오는 중..."; var reader = new FileReader(); reader.onload = function(e) { try { var name = file.name.replace(".gpx", ""); var gpxContent = e.target.result; var trkpts = new DOMParser().parseFromString(gpxContent, "application/xml").querySelectorAll("trkpt"); if (trkpts.length === 0) { statusEl.textContent = "경로 없음"; return; } var saves = loadGpxSaves(); var id = String(Date.now()); saves.push({ id: id, name: name, createdAt: Date.now(), pointCount: trkpts.length, gpxContent: gpxContent }); saveGpxSaves(saves); clearActiveGpxRoute(); drawGpxRoute(gpxContent, id); updateGpxSavedList(); statusEl.textContent = '"' + name + '" 불러오기 완료'; toggleSidebar(false); } catch (err) { statusEl.textContent = "파일을 읽지 못했습니다."; console.error(err); } }; reader.readAsText(file); event.target.value = ""; }
function toggleSidebar(forceOpen) { var sidebar = document.getElementById("sidebar"); var overlay = document.getElementById("sidebar-overlay"); if (!sidebar || !overlay) return; var willOpen = typeof forceOpen === "boolean" ? forceOpen : !sidebar.classList.contains("open"); sidebar.classList.toggle("open", willOpen); overlay.classList.toggle("show", willOpen); }
function centerMap() { focusCurrentLocation(); }
function scheduleSave() { if (saveTimer !== null) clearTimeout(saveTimer); saveTimer = setTimeout(function() { saveTimer = null; compactPathData(); persistState(); }, SAVE_DELAY_MS); }
function getLocalStorageKey() { return currentUserId ? STORAGE_KEY + ":" + currentUserId : STORAGE_KEY; }
function dataUrlToBlob(dataUrl) {
    var parts = String(dataUrl || "").split(",");
    if (parts.length < 2) return new Blob([], { type: "image/jpeg" });
    var match = parts[0].match(/data:([^;]+);base64/i);
    var mime = match ? match[1] : "image/jpeg";
    var binary = atob(parts[1]);
    var len = binary.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
}
function getPhotoStoragePath(photoId, kind) {
    return "giloaUsers/" + encodeURIComponent(currentUserId) + "/photos/" + encodeURIComponent(photoId) + "/" + kind + ".jpg";
}
async function fetchBlobFromUrl(url) {
    if (!url) return null;
    var response = await fetch(url);
    if (!response.ok) throw new Error("?占쎌쭊 ?占쎌씪???占쎌쓣 ???占쎌뒿?占쎈떎.");
    return await response.blob();
}
async function uploadPhotoRemote(data, options) {
    return Promise.resolve();
}
function deleteRemotePhotoFiles(photo) {
    return;
}
function normalizeUserId(value) { return String(value || "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 64); }
function userIdToAuthEmail(userId) { return normalizeUserId(userId) + "@giloa.app"; }
function authEmailToUserId(email) {
    var value = String(email || "").toLowerCase();
    var suffix = "@giloa.app";
    return value.endsWith(suffix) ? normalizeUserId(value.slice(0, -suffix.length)) : "";
}
function getAuthErrorMessage(error) {
    var code = error && error.code;
    if (code === "auth/wrong-password" || code === "auth/invalid-credential") return "鍮꾬옙?踰덊샇媛 留욑옙? ?占쎌뒿?占쎈떎.";
    if (code === "auth/invalid-email") return "?占쎌씠???占쎌떇??留욑옙? ?占쎌뒿?占쎈떎. ?占쎈Ц, ?占쎌옄, _, - 占??占쎌슜??二쇱꽭??";
    if (code === "auth/network-request-failed") return "?占쏀듃?占쏀겕 ?占쎄껐???占쎌씤??二쇱꽭??";
    if (code === "auth/weak-password") return "鍮꾬옙?踰덊샇??6???占쎌긽?占쎈줈 ?占쎈젰??二쇱꽭??";
    if (code === "auth/operation-not-allowed") return "濡쒓렇??湲곕뒫???占쎌옱 濡쒖뺄 ?占?占쎈쭔 ?占쎌슜?占쎈땲??";
    if (code === "auth/too-many-requests") return "?占쎈룄媛 ?占쎈Т 留롮뒿?占쎈떎. ?占쎌떆 ???占쎌떆 ?占쎈룄??二쇱꽭??";
    return "濡쒓렇?占쎌뿉 ?占쏀뙣?占쎌뒿?占쎈떎. ?占쎌씠?占쏙옙? 鍮꾬옙?踰덊샇占??占쎌씤??二쇱꽭??";
}
function getAuthDebugMessage(error) {
    var code = error && error.code ? error.code : "unknown";
    var message = error && error.message ? error.message : String(error || "");
    return getAuthErrorMessage(error) + "\n\n?占쎈쪟 肄붾뱶: " + code + "\n" + message;
}
async function signInWithGiloaId(userId, password) {
    currentUserId = normalizeUserId(userId) || "local";
    localStorage.setItem(USER_ID_KEY, currentUserId);
    syncUserIdUI();
}
function waitForAuthReady() {
    return Promise.resolve(null);
}
function askUserId(defaultValue) {
    return new Promise(function(resolve) {
        var modal = document.getElementById("user-id-modal");
        var input = document.getElementById("user-id-input");
        var passwordInput = document.getElementById("user-password-input");
        var errorEl = document.getElementById("user-id-error");
        var submit = document.getElementById("user-id-submit");
        if (!modal || !input || !passwordInput || !submit) {
            resolve({ userId: defaultValue || "", password: "" });
            return;
        }
        input.value = defaultValue || "";
        passwordInput.value = "";
        passwordInput.style.display = "none";
        if (errorEl) errorEl.textContent = "";
        modal.classList.add("show");
        setTimeout(function() { input.focus(); input.select(); }, 60);
        function done() {
            var value = normalizeUserId(input.value);
            if (!value) {
                input.focus();
                return;
            }
            submit.removeEventListener("click", done);
            input.removeEventListener("keydown", onKeyDown);
            passwordInput.removeEventListener("keydown", onKeyDown);
            modal.classList.remove("show");
            resolve({ userId: value, password: "" });
        }
        function onKeyDown(e) {
            if (e.key === "Enter") done();
        }
        submit.addEventListener("click", done);
        input.addEventListener("keydown", onKeyDown);
        passwordInput.addEventListener("keydown", onKeyDown);
    });
}
async function ensureUserId() {
    var saved = normalizeUserId(localStorage.getItem(USER_ID_KEY));
    if (saved) {
        currentUserId = saved;
        localStorage.setItem(USER_ID_KEY, currentUserId);
        syncUserIdUI();
        return;
    }
    while (!currentUserId) {
        var credentials = await askUserId(saved || "");
        try {
            await signInWithGiloaId(credentials.userId, credentials.password);
        } catch (error) {
            alert(getAuthDebugMessage(error));
        }
    }
}
function syncUserIdUI() {
    var idEl = document.getElementById("hud-user-id");
    if (idEl) idEl.textContent = currentUserId || "?占쎌씠???占쎌쓬";
}
async function changeUserId() {
    var credentials = await askUserId(currentUserId || "");
    var nextId = normalizeUserId(credentials.userId);
    if (!nextId || nextId === currentUserId) return;
    try {
        await signInWithGiloaId(nextId, credentials.password);
    } catch (error) {
        alert(getAuthDebugMessage(error));
        return;
    }
    currentUserId = nextId;
    localStorage.setItem(USER_ID_KEY, currentUserId);
    syncUserIdUI();
    pathCoordinates = [];
    memories = [];
    photos = [];
    totalDistance = 0;
    memoryMarkers.forEach(function(marker) { map.removeLayer(marker); });
    memoryMarkers.clear();
    if (photoClusterGroup) photoClusterGroup.clearLayers();
    clearActiveGpxRoute();
    loadState();
    renderStoredMarkers();
    renderStoredPhotoMarkers();
    updateStats();
    updateMemoryList();
    updatePhotoList();
    scheduleRender();
}
function buildStatePayload() {
    return {
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
                remotePhotoUrl: typeof p.remotePhotoUrl === "string" ? p.remotePhotoUrl : "",
                remoteThumbUrl: typeof p.remoteThumbUrl === "string" ? p.remoteThumbUrl : "",
                storagePath: typeof p.storagePath === "string" ? p.storagePath : "",
                thumbStoragePath: typeof p.thumbStoragePath === "string" ? p.thumbStoragePath : "",
                imagePrediction: p.imagePrediction && typeof p.imagePrediction === "object" ? {
                    label: typeof p.imagePrediction.label === "string" ? p.imagePrediction.label : "",
                    probability: isFinite(p.imagePrediction.probability) ? p.imagePrediction.probability : 0,
                    percent: isFinite(p.imagePrediction.percent) ? p.imagePrediction.percent : 0,
                    accepted: !!p.imagePrediction.accepted,
                    badgeId: typeof p.imagePrediction.badgeId === "string" ? p.imagePrediction.badgeId : ""
                } : null
            };
        }),
        totalDistance: totalDistance
    };
}
function applyStatePayload(saved) {
    if (!saved || typeof saved !== "object") return false;
    if (Array.isArray(saved.pathCoordinates)) {
        pathCoordinates = saved.pathCoordinates.filter(function(p) { return isFinite(p.lat) && isFinite(p.lng) && isFinite(p.startTime) && isFinite(p.endTime); }).map(function(p) { return { lat: p.lat, lng: p.lng, startTime: p.startTime, endTime: p.endTime, visits: isFinite(p.visits) ? p.visits : 1 }; });
    }
    if (Array.isArray(saved.memories)) {
        memories = saved.memories.filter(function(m) { return isFinite(m.lat) && isFinite(m.lng) && typeof m.name === "string"; }).map(function(m) { return { id: typeof m.id === "string" ? m.id : String(m.time), lat: m.lat, lng: m.lng, name: m.name, time: m.time, dateString: m.dateString, timeString: typeof m.timeString === "string" ? m.timeString : new Date(m.time).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }) }; });
    }
    totalDistance = isFinite(saved.totalDistance) ? saved.totalDistance : 0;
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
                remotePhotoUrl: typeof p.remotePhotoUrl === "string" ? p.remotePhotoUrl : "",
                remoteThumbUrl: typeof p.remoteThumbUrl === "string" ? p.remoteThumbUrl : "",
                storagePath: typeof p.storagePath === "string" ? p.storagePath : "",
                thumbStoragePath: typeof p.thumbStoragePath === "string" ? p.thumbStoragePath : "",
                imagePrediction: p.imagePrediction && typeof p.imagePrediction === "object" ? {
                    label: typeof p.imagePrediction.label === "string" ? p.imagePrediction.label : "",
                    probability: isFinite(p.imagePrediction.probability) ? p.imagePrediction.probability : 0,
                    percent: isFinite(p.imagePrediction.percent) ? p.imagePrediction.percent : 0,
                    accepted: !!p.imagePrediction.accepted,
                    badgeId: typeof p.imagePrediction.badgeId === "string" ? p.imagePrediction.badgeId : ""
                } : null
            };
        });
    }
    isFogEnabled = true;
    localStorage.setItem(FOG_ENABLED_KEY, "true");
    compactPathData();
    return true;
}
function persistState() {
    try {
        localStorage.setItem(getLocalStorageKey(), JSON.stringify(buildStatePayload()));
    } catch (e) {
        console.error("?占???占쏀뙣", e);
        if (e && e.name === "QuotaExceededError") alert("?占??怨듦컙??遺議깊빀?占쎈떎.");
    }
}

function loadState() {
    try {
        var raw = localStorage.getItem(getLocalStorageKey()) || localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        applyStatePayload(JSON.parse(raw));
    } catch (e) {
        console.error("蹂듭썝 ?占쏀뙣", e);
    }
}

var imageClassifierPromise = null;
var imageClassifierMeta = null;
function ensureTf() {
    if (window.tf) return Promise.resolve(window.tf);
    return new Promise(function(resolve, reject) {
        var script = document.createElement("script");
        script.src = "./vendor/tf.min.js";
        script.async = true;
        script.onload = function() { window.tf ? resolve(window.tf) : reject(new Error("TensorFlow.js 濡쒕뱶 ?占쏀뙣")); };
        script.onerror = function() { reject(new Error("TensorFlow.js ?占쎌씪??遺덈윭?占쏙옙? 紐삵뻽?占쎈땲??")); };
        document.head.appendChild(script);
    });
}
async function loadImageClassifier() {
    if (imageClassifierPromise) return imageClassifierPromise;
    imageClassifierPromise = Promise.all([
        ensureTf(),
        fetch(IMAGE_CLASSIFIER_METADATA_URL).then(function(res) {
            if (!res.ok) throw new Error("?占쏙옙?吏 紐⑤뜽 硫뷂옙??占쎌씠??濡쒕뱶 ?占쏀뙣");
            return res.json();
        })
    ]).then(function(result) {
        var tf = result[0];
        imageClassifierMeta = result[1] || {};
        return tf.loadLayersModel(IMAGE_CLASSIFIER_MODEL_URL).then(function(model) {
            return {
                model: model,
                labels: Array.isArray(imageClassifierMeta.labels) ? imageClassifierMeta.labels : [],
                imageSize: imageClassifierMeta.imageSize || 224
            };
        });
    }).catch(function(e) {
        imageClassifierPromise = null;
        throw e;
    });
    return imageClassifierPromise;
}
async function classifyImportedImage(img) {
    try {
        var bundle = await loadImageClassifier();
        var tf = window.tf;
        var input = tf.tidy(function() {
            return tf.browser.fromPixels(img)
                .resizeBilinear([bundle.imageSize, bundle.imageSize])
                .toFloat()
                .div(127.5)
                .sub(1)
                .expandDims(0);
        });
        var prediction = bundle.model.predict(input);
        var values = Array.from(await prediction.data());
        input.dispose();
        prediction.dispose();
        var bestIndex = 0;
        for (var i = 1; i < values.length; i++) {
            if (values[i] > values[bestIndex]) bestIndex = i;
        }
        var label = getReadableImagePredictionLabel(bundle.labels[bestIndex]);
        var probability = values[bestIndex] || 0;
        return {
            label: label,
            probability: probability,
            percent: Math.round(probability * 1000) / 10,
            accepted: probability >= IMAGE_CLASSIFIER_THRESHOLD,
            badgeId: probability >= IMAGE_CLASSIFIER_THRESHOLD ? IMAGE_CLASS_BADGES[label] || "" : ""
        };
    } catch (e) {
        console.warn("?占쏙옙?吏 ?占쎈퀎 ?占쏀뙣", e);
        return null;
    }
}
function awardImagePredictionBadge(prediction) {
    if (!prediction || !prediction.accepted || !prediction.badgeId) return false;
    earnBadge(prediction.badgeId);
    return true;
}

// ?占쎌쭊 泥섎━
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
        locationSource: typeof options.locationSource === "string" ? options.locationSource : "fallback",
        remotePhotoUrl: "",
        remoteThumbUrl: "",
        storagePath: "",
        thumbStoragePath: "",
        imagePrediction: options.imagePrediction || null
    };
    if (data.imagePrediction) awardImagePredictionBadge(data.imagePrediction);
    photos.push(data);
    idbSavePhoto(id, popup, thumb).catch(function(e) { console.warn("IDB ?占???占쏀뙣", e); });
    uploadPhotoRemote(data, { img: img, originalBlob: options.originalBlob || null, originalUrl: options.originalUrl || "" });
    createPhotoMarker(data, options.openPopup !== false);
    if (!options.deferUi) {
        updateStats();
        scheduleSave();
        updatePhotoList();
    }
    return data;
}
var exifrLoaderPromise = null;
function ensureExifr() {
    if (window.exifr) return Promise.resolve(window.exifr);
    if (exifrLoaderPromise) return exifrLoaderPromise;
    exifrLoaderPromise = new Promise(function(resolve, reject) {
        var script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/exifr/dist/lite.umd.js";
        script.async = true;
        script.onload = function() {
            if (window.exifr) resolve(window.exifr);
            else reject(new Error("exifr 濡쒕뱶 ?占쏀뙣"));
        };
        script.onerror = function() { reject(new Error("exifr ?占쏀겕由쏀듃 濡쒕뱶 ?占쏀뙣")); };
        document.head.appendChild(script);
    }).catch(function(err) {
        exifrLoaderPromise = null;
        throw err;
    });
    return exifrLoaderPromise;
}
async function getPhotoExifGps(photoOrFile) {
    try {
        var exifr = await ensureExifr();
        var gps = null;
        if (photoOrFile instanceof File || photoOrFile instanceof Blob) {
            gps = await exifr.gps(photoOrFile).catch(function() { return null; });
        } else {
            var fromObject = photoOrFile && photoOrFile.exif;
            if (fromObject) gps = await exifr.gps(fromObject).catch(function() { return null; });
            if (!gps) {
                var url = photoOrFile && (photoOrFile.webPath || photoOrFile.path || photoOrFile.uri);
                if (!url) return null;
                var response = await fetch(url);
                if (!response || !response.ok) return null;
                gps = await exifr.gps(await response.arrayBuffer()).catch(function() { return null; });
            }
        }
        if (!gps || !isFinite(gps.latitude) || !isFinite(gps.longitude)) return null;
        return { lat: gps.latitude, lng: gps.longitude };
    } catch (e) {
        console.warn("EXIF GPS 異붿텧 ?占쏀뙣", e);
        return null;
    }
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
        reader.onerror = function() { reject(reader.error || new Error("?占쎌씪 ?占쎄린 ?占쏀뙣")); };
        reader.readAsArrayBuffer(file);
    });
}

function loadImageFromFile(file) {
    return new Promise(function(resolve, reject) {
        var url = URL.createObjectURL(file);
        var img = new Image();
        img.onload = function() { URL.revokeObjectURL(url); resolve(img); };
        img.onerror = function(err) { URL.revokeObjectURL(url); reject(err || new Error("??占?筌왖 嚥≪뮆占???占쎈솭")); };
        img.src = url;
    });
}

function loadImageFromUrl(url) {
    return new Promise(function(resolve, reject) {
        var img = new Image();
        img.onload = function() { resolve(img); };
        img.onerror = function(err) { reject(err || new Error("??占?筌왖 嚥≪뮆占???占쎈솭")); };
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
            else reject(new Error("heic2any 嚥≪뮆占???占쎈솭"));
        };
        script.onerror = function() { reject(new Error("heic2any ??占쎄쾿?占쏙옙???嚥≪뮆占???占쎈솭")); };
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
        if (recStatusBox) recStatusBox.textContent = "?占쎌쭊 泥섎━ 占?" + (i + 1) + "/" + files.length;
        try {
            var gps = null;
            if (isJpegFile(file)) {
                try { gps = await getPhotoExifGps(file); } catch (e) { console.warn("EXIF GPS ?占쎄린 ?占쏀뙣:", file.name, e); }
            }
            var lat = gps ? gps.lat : (currentPos ? currentPos.lat : map.getCenter().lat);
            var lng = gps ? gps.lng : (currentPos ? currentPos.lng : map.getCenter().lng);
            var normalizedFile = await convertHeicToJpegFile(file);
            var img = await loadImageFromFile(normalizedFile);
            var imagePrediction = await classifyImportedImage(img);
            var importedPhoto = processPhoto(img, new Date(), lat, lng, { deferUi: true, openPopup: files.length === 1, originalBlob: normalizedFile, sourceType: "file-input", locationSource: gps ? "exif" : "fallback", imagePrediction: imagePrediction, mission: activeImageMission ? { name: activeImageMission.name } : null });
            if (importedPhoto) setSelectedDestination(importedPhoto.lat, importedPhoto.lng, importedPhoto.dateString || "?占쎌쭊 ?占쎌튂");
            loadedCount += 1;
        } catch (e) {
            failedCount += 1;
            console.warn("?占쎌쭊 泥섎━ ?占쏀뙣:", file.name, e);
        }
    }
    if (loadedCount > 0) {
        updateStats();
        scheduleSave();
        updatePhotoList();
        if (photos.length) focusPhotoOnMap(photos[photos.length - 1]);
    }
    event.target.value = "";
    syncRecordingUI();
    if (failedCount > 0) alert("?占쏙옙? ?占쎌쭊(" + failedCount + "占???泥섎━?占쏙옙? 紐삵뻽?占쎈땲??");
}
function createPhotoMarker(data, openPopup) {
    var size = getPhotoMarkerSize();
    lastPhotoMarkerSize = size;
    var marker = L.marker([data.lat, data.lng], { pane: "photoPane", icon: buildPhotoMarkerIcon(data.thumb || data.remoteThumbUrl || data.remotePhotoUrl, size) });
    marker._photoData = data;
    var popupEl = document.createElement("div");
    popupEl.className = "photo-popup";
    var img = document.createElement("img");
    img.src = data.photo || data.thumb || data.remotePhotoUrl || data.remoteThumbUrl;
    img.style.cssText = "width:72vw;max-width:280px;border-radius:8px;margin-bottom:8px;display:block;cursor:pointer;";
    img.title = "한 번 누르면 기억으로 저장, 두 번 누르면 원본 보기";
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
    var predictionInfo = null;
    if (false && data.imagePrediction && data.imagePrediction.label) {
        var predictionLabel = getReadableImagePredictionLabel(data.imagePrediction.label);
        predictionInfo = document.createElement("div");
        predictionInfo.className = data.imagePrediction.accepted ? "photo-ai-result accepted" : "photo-ai-result";
        predictionInfo.textContent = predictionLabel + " " + (data.imagePrediction.percent || 0) + "%";
    }
    var delBtn = document.createElement("button");
    delBtn.className = "popup-delete-btn";
    delBtn.textContent = "사진 삭제";
    delBtn.addEventListener("click", function() { deletePhoto(data.id); marker.closePopup(); });
    popupEl.appendChild(img);
    popupEl.appendChild(info);
    if (predictionInfo) popupEl.appendChild(predictionInfo);
    var hasSource = !!(data.remotePhotoUrl || data.sourceUri || data.sourceWebPath);
    var note = document.createElement("div");
    note.style.cssText = "font-size:11px;color:rgba(255,255,255,0.52);text-align:center;margin:0 0 8px;";
    var locationLabel = data.locationSource === "exif" ? "사진 촬영 위치" : "현재 위치 기준";
    note.textContent = locationLabel + " · 한 번 누르면 기억으로 저장, 두 번 누르면 원본을 엽니다.";
    popupEl.appendChild(note);
    popupEl.appendChild(delBtn);
    marker.bindPopup(popupEl);
    photoClusterGroup.addLayer(marker);
    if (openPopup) marker.openPopup();
}
function deletePhoto(id) { var photo = photos.find(function(p) { return p.id === id; }); deleteRemotePhotoFiles(photo); photos = photos.filter(function(p) { return p.id !== id; }); var marker = findPhotoMarker(id); if (marker) photoClusterGroup.removeLayer(marker); idbDeletePhoto(id).catch(function(e) { console.warn("IDB ??占쏙옙 ?占쏀뙣", e); }); updateStats(); scheduleSave(); }
function escapeHtml(value) { return String(value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"); }
function getReadableImagePredictionLabel(label) {
    var text = String(label || "").trim();
    if (!text || /[^\w\s가-힣%-]/.test(text)) return "사진 분석";
    return "사진 분석";
}
function renderStoredMarkers() { memories.forEach(function(m) { createMemoryMarker(m, false); }); }
function renderStoredPhotoMarkers() {
    if (photos.length === 0) return;
    idbGetAllPhotos().then(function(idbList) {
        var idbMap = new Map(idbList.map(function(r) { return [r.id, r]; }));
        photos.forEach(function(p) {
            var img = idbMap.get(p.id);
            if (img) {
                p.thumb = img.thumb || img.photo || p.thumb;
                p.photo = img.photo || p.thumb;
            } else {
                p.thumb = p.thumb || p.remoteThumbUrl || "";
                p.photo = p.photo || p.remotePhotoUrl || p.remoteThumbUrl || "";
            }
            if (p.thumb || p.photo || p.remoteThumbUrl || p.remotePhotoUrl) createPhotoMarker(p, false);
        });
    }).catch(function(e) { console.warn("IDB 遺덈윭?占쎄린 ?占쏀뙣", e); });
}
function initGpxDial() { dialHours = 8; updateDialUI(); }
function initHudTapTargets() { var hud = document.getElementById("hud"); var handle = document.getElementById("hud-handle"); var distItem = document.querySelector(".hud-prog-item:nth-child(1)"); var memItem = document.querySelector(".hud-prog-item:nth-child(2)"); var photoItem = document.querySelector(".hud-prog-item:nth-child(3)"); if (hud && !hud.dataset.stopBound) { hud.dataset.stopBound = "1"; ["click", "pointerdown"].forEach(function(type) { hud.addEventListener(type, function(e) { e.stopPropagation(); }, { passive: true }); }); } if (handle) { handle.style.cursor = "pointer"; } if (distItem) { distItem.style.cursor = "pointer"; distItem.addEventListener("click", function() { toggleSidebar(true); switchTab("gpx"); }); } if (memItem) { memItem.style.cursor = "pointer"; memItem.addEventListener("click", function() { toggleSidebar(true); switchTab("memory"); }); } if (photoItem) { photoItem.style.cursor = "pointer"; photoItem.addEventListener("click", function() { toggleSidebar(true); switchTab("photo"); }); } }

var tutorialStepIndex = 0;
var tutorialStepsByLang = {
    ko: [
        { target: "", title: "길로아 시작", copy: "기록은 이 기기 안에만 저장돼.", pose: "hello" },
        { target: "#ham-btn", title: "메뉴 버튼", copy: "내 기록 다시 보기", pose: "peek" },
        { target: "#tour-header", title: "주변 관광지", copy: "누르면 접기 / 펼치기", pose: "point-right" },
        { target: "#lang-btn-en", title: "번역 버튼", copy: "언어를 바꿔서 보기", pose: "point-right" },
        { target: "#loc-btn", title: "기록 버튼", copy: "경로 기록 시작 / 중단", pose: "focus" },
        { target: "#photo-btn", title: "사진 버튼", copy: "사진을 지도에 저장", pose: "point-left" },
        { target: "#traffic-btn", title: "길찾기 버튼", copy: "선택한 곳까지 길찾기", pose: "point-left" },
        { target: "#hud", title: "상태창", copy: "레벨과 진행도 확인", pose: "cheer" }
    ],
    en: [
        { target: "", title: "Start Giloa", copy: "Records stay only on this device.", pose: "hello" },
        { target: "#ham-btn", title: "Menu", copy: "Open your saved records.", pose: "peek" },
        { target: "#tour-header", title: "Nearby Places", copy: "Tap to fold / unfold.", pose: "point-right" },
        { target: "#lang-btn-en", title: "Language", copy: "Switch the app language.", pose: "point-right" },
        { target: "#loc-btn", title: "Record", copy: "Start / stop route recording.", pose: "focus" },
        { target: "#photo-btn", title: "Photos", copy: "Save photos on the map.", pose: "point-left" },
        { target: "#traffic-btn", title: "Directions", copy: "Find a route to a selected place.", pose: "point-left" },
        { target: "#hud", title: "Status", copy: "Check level and progress.", pose: "cheer" }
    ],
    ja: [
        { target: "", title: "ギロア開始", copy: "記録はこの端末だけに保存されます。", pose: "hello" },
        { target: "#ham-btn", title: "メニュー", copy: "保存した記録を確認します。", pose: "peek" },
        { target: "#tour-header", title: "周辺観光地", copy: "タップで折りたたみ / 展開。", pose: "point-right" },
        { target: "#lang-btn-ja", title: "翻訳ボタン", copy: "表示言語を切り替えます。", pose: "point-right" },
        { target: "#loc-btn", title: "記録ボタン", copy: "経路記録を開始 / 停止。", pose: "focus" },
        { target: "#photo-btn", title: "写真ボタン", copy: "写真を地図に保存します。", pose: "point-left" },
        { target: "#traffic-btn", title: "ルート案内", copy: "選んだ場所まで案内します。", pose: "point-left" },
        { target: "#hud", title: "ステータス", copy: "レベルと進行度を確認。", pose: "cheer" }
    ],
    zh: [
        { target: "", title: "开始 Giloa", copy: "记录只保存在这台设备中。", pose: "hello" },
        { target: "#ham-btn", title: "菜单", copy: "查看保存的记录。", pose: "peek" },
        { target: "#tour-header", title: "周边景点", copy: "点击可收起 / 展开。", pose: "point-right" },
        { target: "#lang-btn-zh", title: "翻译按钮", copy: "切换显示语言。", pose: "point-right" },
        { target: "#loc-btn", title: "记录按钮", copy: "开始 / 停止路线记录。", pose: "focus" },
        { target: "#photo-btn", title: "照片按钮", copy: "把照片保存到地图上。", pose: "point-left" },
        { target: "#traffic-btn", title: "路线按钮", copy: "前往选中的地点。", pose: "point-left" },
        { target: "#hud", title: "状态栏", copy: "查看等级和进度。", pose: "cheer" }
    ]
};
function getTutorialSteps() { return tutorialStepsByLang[currentLang] || tutorialStepsByLang.ko; }

function clearTutorialPlacement(card) {
    if (!card) return;
    card.className = "giloa-tutorial-card";
    card.style.left = "";
    card.style.top = "";
    card.style.right = "";
    card.style.bottom = "";
}

function placeTutorialCard(step) {
    var card = document.querySelector(".giloa-tutorial-card");
    if (!card) return;
    clearTutorialPlacement(card);
    card.classList.add("pose-" + (step.pose || "hello"));
    if (!step.target) {
        card.classList.add("intro");
        return;
    }
    var target = document.querySelector(step.target);
    if (!target) {
        card.classList.add("intro");
        return;
    }
    var rect = target.getBoundingClientRect();
    var width = Math.min(330, window.innerWidth - 24);
    var height = 132;
    var gap = 14;
    var left = rect.right + gap;
    var top = rect.top + rect.height / 2 - height / 2;
    var side = "right";
    if (left + width > window.innerWidth - 10) {
        left = rect.left - width - gap;
        side = "left";
    }
    if (left < 10) {
        left = Math.max(10, Math.min(window.innerWidth - width - 10, rect.left));
        top = rect.bottom + gap;
        side = "bottom";
    }
    if (top + height > window.innerHeight - 90) top = window.innerHeight - height - 90;
    if (top < 10) top = 10;
    card.style.left = left + "px";
    card.style.top = top + "px";
    card.classList.add("near-" + side);
}

function removeTutorialTarget() {
    document.querySelectorAll(".tutorial-target").forEach(function(el) {
        el.classList.remove("tutorial-target");
    });
}

function renderTutorialStep() {
    var wrap = document.getElementById("giloa-tutorial");
    if (!wrap) return;
    var tutorialSteps = getTutorialSteps();
    var step = tutorialSteps[tutorialStepIndex] || tutorialSteps[0];
    var title = document.getElementById("giloa-tutorial-title");
    var copy = document.getElementById("giloa-tutorial-copy");
    var prev = document.getElementById("giloa-tutorial-prev");
    var next = document.getElementById("giloa-tutorial-next");
    var progress = document.getElementById("giloa-tutorial-progress");
    var text = UI_TEXT[currentLang] || UI_TEXT.ko;
    if (title) title.textContent = step.title;
    if (copy) copy.textContent = step.copy;
    if (prev) prev.style.visibility = tutorialStepIndex === 0 ? "hidden" : "visible";
    if (prev) prev.textContent = text.previous || "이전";
    if (next) next.textContent = tutorialStepIndex === tutorialSteps.length - 1 ? (text.start || "시작") : (text.next || "다음");
    if (progress) {
        progress.innerHTML = tutorialSteps.map(function(_, idx) {
            return '<span class="giloa-tutorial-dot' + (idx === tutorialStepIndex ? " active" : "") + '"></span>';
        }).join("");
    }
    removeTutorialTarget();
    if (step.target) {
        var target = document.querySelector(step.target);
        if (target) target.classList.add("tutorial-target");
    }
    placeTutorialCard(step);
}

function closeGiloaTutorial(markDone) {
    var wrap = document.getElementById("giloa-tutorial");
    if (wrap) {
        wrap.classList.remove("show");
        wrap.setAttribute("aria-hidden", "true");
    }
    removeTutorialTarget();
    if (markDone) localStorage.setItem(TUTORIAL_DONE_KEY, "1");
    if (autoRecordingNoticePending) {
        autoRecordingNoticePending = false;
        setTimeout(showAutoRecordingNotice, 120);
    }
}

function openGiloaTutorial(force) {
    var wrap = document.getElementById("giloa-tutorial");
    if (!wrap) return;
    if (!force && localStorage.getItem(TUTORIAL_DONE_KEY) === "1") return;
    tutorialStepIndex = 0;
    wrap.classList.add("show");
    wrap.setAttribute("aria-hidden", "false");
    renderTutorialStep();
}

function initGiloaTutorial() {
    var wrap = document.getElementById("giloa-tutorial");
    if (!wrap || wrap.dataset.bound === "1") return;
    wrap.dataset.bound = "1";
    var prev = document.getElementById("giloa-tutorial-prev");
    var next = document.getElementById("giloa-tutorial-next");
    var skip = document.getElementById("giloa-tutorial-skip");
    if (prev) prev.addEventListener("click", function() {
        tutorialStepIndex = Math.max(0, tutorialStepIndex - 1);
        renderTutorialStep();
    });
    if (next) next.addEventListener("click", function() {
        var tutorialSteps = getTutorialSteps();
        if (tutorialStepIndex >= tutorialSteps.length - 1) {
            closeGiloaTutorial(true);
            return;
        }
        tutorialStepIndex += 1;
        renderTutorialStep();
    });
    if (skip) skip.addEventListener("click", function() { closeGiloaTutorial(true); });
    window.addEventListener("resize", function() {
        if (wrap.classList.contains("show")) renderTutorialStep();
    });
    prepareGuideCharacterImage();
    setTimeout(function() { openGiloaTutorial(false); }, 650);
}

function prepareGuideCharacterImage() {
    return;
    var img = document.getElementById("giloa-guide-image");
    if (!img || img.dataset.chroma === "1") return;
    function process() {
        try {
            var canvas = document.createElement("canvas");
            var w = img.naturalWidth || img.width;
            var h = img.naturalHeight || img.height;
            if (!w || !h) return;
            canvas.width = w;
            canvas.height = h;
            var ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, w, h);
            var imageData = ctx.getImageData(0, 0, w, h);
            var data = imageData.data;
            for (var i = 0; i < data.length; i += 4) {
                var r = data[i], g = data[i + 1], b = data[i + 2];
                if (g > 135 && g > r * 1.45 && g > b * 1.45) {
                    var greenStrength = Math.min(255, Math.max(0, g - Math.max(r, b)));
                    data[i + 3] = greenStrength > 105 ? 0 : Math.min(data[i + 3], 90);
                }
            }
            ctx.putImageData(imageData, 0, 0);
            img.src = canvas.toDataURL("image/png");
            img.dataset.chroma = "1";
        } catch (e) {
            console.warn("Guide character chroma key failed", e);
        }
    }
    if (img.complete) process();
    else img.addEventListener("load", process, { once: true });
}

async function init() {
    resizeCanvas();
    await ensureUserId();
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
    initGiloaTutorial();
    setTimeout(startAutoRecordingOnLaunch, 800);
}
map.whenReady(function() { setTimeout(init, 0); });

// TourAPI 愿愿묕옙? 異붿쿇
var TOUR_API_KEY = window.GILOA_TOUR_API_KEY || "";
var TOUR_API_BASES = { ko: "KorService2", en: "EngService2", ja: "JpnService2", zh: "ChsService2" };
function getTourApiBase(lang) { return "https://apis.data.go.kr/B551011/" + (TOUR_API_BASES[lang || currentLang] || TOUR_API_BASES.ko); }
function getTourEndpoint(path, lang) { return getTourApiBase(lang) + "/" + path; }
function formatTourCount(count) { var suffix = ((UI_TEXT[currentLang] || UI_TEXT.ko).count_suffix); return currentLang === "ko" || currentLang === "ja" || currentLang === "zh" ? String(count) + suffix : String(count) + " " + suffix; }
var tourItems = []; var festivalItems = []; var tourExpanded = false; var tourPanelOpen = false;
var tourFetchTimer = null; var tourMarkers = []; var TOUR_VISIBLE_COUNT = 3;
var tourRequestSeq = 0; var festivalRequestSeq = 0; var tourTranslationRenderTimer = null;
var TOUR_TYPE_NAMES = {
    ko: { "12": "관광지", "14": "문화시설", "15": "축제", "25": "여행코스", "28": "레포츠", "32": "숙박", "38": "쇼핑", "39": "음식점" },
    en: { "12": "Attraction", "14": "Culture", "15": "Festival", "25": "Course", "28": "Leports", "32": "Stay", "38": "Shopping", "39": "Food" },
    ja: { "12": "観光地", "14": "文化施設", "15": "祭り", "25": "コース", "28": "レポーツ", "32": "宿泊", "38": "ショッピング", "39": "グルメ" },
    zh: { "12": "景点", "14": "文化设施", "15": "庆典", "25": "路线", "28": "休闲运动", "32": "住宿", "38": "购物", "39": "美食" }
};
var TOUR_TYPE_LABELS = {
    ko: { "25": "코스", "28": "레포츠", "38": "쇼핑", "15": "축제", "12": "관광", "14": "문화", "32": "숙박", "39": "음식", default: "관광" },
    en: { "25": "Course", "28": "Leports", "38": "Shop", "15": "Fest", "12": "Spot", "14": "Culture", "32": "Stay", "39": "Food", default: "Spot" },
    ja: { "25": "コース", "28": "レポーツ", "38": "買物", "15": "祭り", "12": "観光", "14": "文化", "32": "宿泊", "39": "食事", default: "観光" },
    zh: { "25": "路线", "28": "运动", "38": "购物", "15": "庆典", "12": "景点", "14": "文化", "32": "住宿", "39": "美食", default: "景点" }
};
function getTourTypeName(contentTypeId) { var names = TOUR_TYPE_NAMES[currentLang] || TOUR_TYPE_NAMES.ko; return names[String(contentTypeId)] || names["12"]; }
function getTourTypeLabel(contentTypeId) { var labels = TOUR_TYPE_LABELS[currentLang] || TOUR_TYPE_LABELS.ko; return labels[String(contentTypeId)] || labels.default; }
var TOUR_TYPE_META = {
    "25": { label: "Course", color: "#ef4444", fill: "rgba(239,68,68,0.18)", border: "rgba(239,68,68,0.55)" },
    "28": { label: "Leports", color: "#38bdf8", fill: "rgba(56,189,248,0.18)", border: "rgba(56,189,248,0.55)" },
    "38": { label: "Shop", color: "#facc15", fill: "rgba(250,204,21,0.18)", border: "rgba(250,204,21,0.58)" },
    "15": { label: "Fest", color: "#c084fc", fill: "rgba(192,132,252,0.18)", border: "rgba(192,132,252,0.58)" },
    "12": { label: "Spot", color: "#fb923c", fill: "rgba(251,146,60,0.18)", border: "rgba(251,146,60,0.58)" },
    "14": { label: "Culture", color: "#a78bfa", fill: "rgba(167,139,250,0.18)", border: "rgba(167,139,250,0.58)" },
    "32": { label: "Stay", color: "#2dd4bf", fill: "rgba(45,212,191,0.18)", border: "rgba(45,212,191,0.58)" },
    "39": { label: "Food", color: "#fb7185", fill: "rgba(251,113,133,0.18)", border: "rgba(251,113,133,0.58)" },
    default: { label: "Spot", color: "#fb923c", fill: "rgba(251,146,60,0.18)", border: "rgba(251,146,60,0.58)" }
};
function getTourTypeMeta(contentTypeId) { var meta = TOUR_TYPE_META[String(contentTypeId)] || TOUR_TYPE_META.default; return Object.assign({}, meta, { label: getTourTypeLabel(contentTypeId) }); }
function isTourItemVisible(item) {
    var typeId = String(item && item.contenttypeid);
    if (typeId === "39") return !!mapLayerSettings.restaurant;
    if (typeId === "32") return !!mapLayerSettings.lodging;
    return true;
}
function getVisibleTourItems() { return tourItems.filter(isTourItemVisible); }
function isWithinMapSearchCenter(lat, lng, radiusM) {
    if (!map || !isFinite(lat) || !isFinite(lng)) return false;
    return map.getCenter().distanceTo([lat, lng]) <= (radiusM || MAP_LAYER_RADIUS_M);
}
function isNearbyMapLayerTourItem(item) {
    return isWithinMapSearchCenter(parseFloat(item && item.mapy), parseFloat(item && item.mapx), MAP_LAYER_RADIUS_M);
}
function applyTourTypeVars(el, meta) { el.style.setProperty("--tour-color", meta.color); el.style.setProperty("--tour-fill", meta.fill); el.style.setProperty("--tour-border", meta.border); }function getTodayString() {
    var d = new Date();
    var mm = String(d.getMonth() + 1).padStart(2, "0");
    var dd = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + mm + dd;
}

function fetchFestivals(options) {
    options = options || {};
    var center = map.getCenter();
    var today = getTodayString();
    var requestLang = currentLang;
    var requestSeq = ++festivalRequestSeq;
    var buildUrl = function(lang) { return getTourEndpoint("searchFestival2", lang) + "?serviceKey=" + TOUR_API_KEY + "&eventStartDate=" + today + "&mapX=" + center.lng.toFixed(6) + "&mapY=" + center.lat.toFixed(6) + "&radius=" + MAP_LAYER_RADIUS_M + "&numOfRows=20&pageNo=1&MobileOS=ETC&MobileApp=Giloa&_type=json&arrange=E"; };
    fetchTourJsonWithFallback(buildUrl, requestLang).then(function(data) {
        if (requestSeq !== festivalRequestSeq || requestLang !== currentLang) return;
        var body = data && data.response && data.response.body;
        var items = [];
        if (body && body.items && body.items.item) { items = Array.isArray(body.items.item) ? body.items.item : [body.items.item]; }
        festivalItems = items; markTourItemsSource(festivalItems, data._giloaSourceLang || requestLang); translateTourItemsForLang(currentLang, festivalItems);
        updateFestivalBadge();
        if (tourExpanded) renderFestivalStrip();
    }).catch(function(err) { if (requestSeq !== festivalRequestSeq || requestLang !== currentLang) return; console.warn("異뺤젣 API ?占쎈쪟", err); });
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
        var nameEl = document.createElement("div"); nameEl.className = "festival-card-name"; nameEl.textContent = getTourDisplayTitle(item) || "異뺤젣";
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
            showTourPopup(item);
        });
        strip.appendChild(card);
    });
    label.classList.add("show"); strip.classList.add("show");
}

function fetchTourSpots(options) {
    options = options || {};
    var center = map.getCenter();
    var radiusM = MAP_LAYER_RADIUS_M;
    var listEl = document.getElementById("tour-list"); var loadingEl = document.getElementById("tour-loading");
    var emptyEl = document.getElementById("tour-empty"); var expandBtn = document.getElementById("tour-expand-btn"); var countEl = document.getElementById("tour-count");
    if (!listEl || !loadingEl || !emptyEl || !expandBtn || !countEl) return;
    loadingEl.style.display = options.keepExisting ? "none" : "";
    emptyEl.style.display = "none";
    if (!options.keepExisting) listEl.innerHTML = "";
    expandBtn.style.display = "none";
    var requestLang = currentLang;
    var requestSeq = ++tourRequestSeq;
    var buildUrl = function(lang) { return getTourEndpoint("locationBasedList2", lang) + "?serviceKey=" + TOUR_API_KEY + "&mapX=" + center.lng.toFixed(6) + "&mapY=" + center.lat.toFixed(6) + "&radius=" + radiusM + "&numOfRows=20&pageNo=1&MobileOS=ETC&MobileApp=Giloa&_type=json&arrange=E"; };
    fetchTourJsonWithFallback(buildUrl, requestLang).then(function(data) {
        if (requestSeq !== tourRequestSeq || requestLang !== currentLang) return;
        loadingEl.style.display = "none"; var body = data && data.response && data.response.body; var items = [];
        if (body && body.items && body.items.item) { items = Array.isArray(body.items.item) ? body.items.item : [body.items.item]; }
        clearTourMarkers(); tourItems = items; markTourItemsSource(tourItems, data._giloaSourceLang || requestLang);
        var visibleItems = getVisibleTourItems();
        if (visibleItems.length === 0) { emptyEl.style.display = ""; countEl.textContent = ""; renderTourCards(); return; }
        countEl.textContent = formatTourCount(visibleItems.length); renderTourCards(); translateTourItemsForLang(currentLang, tourItems);
    }).catch(function(err) { if (requestSeq !== tourRequestSeq || requestLang !== currentLang) return; loadingEl.style.display = "none"; emptyEl.style.display = ""; emptyEl.textContent = (UI_TEXT[currentLang] || UI_TEXT.ko).empty_tour; countEl.textContent = ""; console.warn("TourAPI ?ㅻ쪟", err); });
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
function getTourApiItem(data) {
    var body = data && data.response && data.response.body;
    var raw = body && body.items && body.items.item;
    return Array.isArray(raw) ? raw[0] : (raw || null);
}
function stripTourHtml(value) {
    var box = document.createElement("div");
    box.innerHTML = String(value || "").replace(/<br\s*\/?>/gi, "\n");
    return (box.textContent || box.innerText || "").replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
function fetchTourDetail(item) {
    if (!item || !item.contentid) return Promise.resolve(null);
    if (item._detailPromise) return item._detailPromise;
    var lang = currentLang;
    var contentId = encodeURIComponent(item.contentid);
    var contentTypeId = encodeURIComponent(item.contenttypeid || "");
    var commonUrl = function(requestLang) { return getTourEndpoint("detailCommon2", requestLang) + "?serviceKey=" + TOUR_API_KEY + "&contentId=" + contentId + "&MobileOS=ETC&MobileApp=Giloa&_type=json&defaultYN=Y&firstImageYN=Y&addrinfoYN=Y&mapinfoYN=Y&overviewYN=Y"; };
    var introUrl = function(requestLang) { return getTourEndpoint("detailIntro2", requestLang) + "?serviceKey=" + TOUR_API_KEY + "&contentId=" + contentId + "&contentTypeId=" + contentTypeId + "&MobileOS=ETC&MobileApp=Giloa&_type=json"; };
    item._detailPromise = Promise.all([
        fetchTourJsonWithFallback(commonUrl, lang).catch(function() { return null; }),
        fetchTourJsonWithFallback(introUrl, lang).catch(function() { return null; })
    ]).then(function(results) {
        var common = getTourApiItem(results[0]) || {};
        var intro = getTourApiItem(results[1]) || {};
        var sourceLang = normalizeLang((results[0] && results[0]._giloaSourceLang) || item._sourceLang || (hasHangul(common.overview || item.title || item.addr1) ? "ko" : lang));
        var detail = Object.assign({}, common, intro);
        detail._sourceLang = sourceLang;
        item._detail = detail;
        return detail;
    });
    return item._detailPromise;
}
function getTourDetailLines(detail) {
    if (!detail) return [];
    var lines = [];
    var overview = cleanTourText(stripTourHtml(detail.overview), "");
    if (overview) lines.push({ key: "overview", text: overview });
    var labelsByLang = {
        ko: { eventstartdate: "Starts", eventenddate: "Ends", playtime: "Time", eventplace: "Place", sponsor1: "Host", usetimefestival: "Fee", infocenter: "Contact", restdate: "Closed", usetime: "Hours" },
        en: { eventstartdate: "Starts", eventenddate: "Ends", playtime: "Time", eventplace: "Place", sponsor1: "Host", usetimefestival: "Fee", infocenter: "Contact", restdate: "Closed", usetime: "Hours" },
        ja: { eventstartdate: "Starts", eventenddate: "Ends", playtime: "Time", eventplace: "Place", sponsor1: "Host", usetimefestival: "Fee", infocenter: "Contact", restdate: "Closed", usetime: "Hours" },
        zh: { eventstartdate: "Starts", eventenddate: "Ends", playtime: "Time", eventplace: "Place", sponsor1: "Host", usetimefestival: "Fee", infocenter: "Contact", restdate: "Closed", usetime: "Hours" }
    };
    var labels = labelsByLang[currentLang] || labelsByLang.ko;
    [
        "eventstartdate",
        "eventenddate",
        "playtime",
        "eventplace",
        "sponsor1",
        "usetimefestival",
        "infocenter",
        "restdate",
        "usetime"
    ].forEach(function(key) {
        var value = cleanTourText(stripTourHtml(detail[key]), "");
        if (value) lines.push({ key: key, text: (labels[key] || key) + ": " + value });
    });
    return lines;
}
function translateTourDetailLines(item, detail) {
    var lang = currentLang;
    var sourceLang = normalizeLang((detail && detail._sourceLang) || item._sourceLang || (hasHangul(detail && detail.overview) ? "ko" : lang));
    var lines = getTourDetailLines(detail);
    if (sourceLang === lang) {
        return Promise.resolve(lines.map(function(line) {
            return cleanTourText(line.text, "");
        }).filter(Boolean));
    }
    return Promise.all(lines.map(function(line) {
        return varcoTranslate(line.text, getVarcoLang(sourceLang), getVarcoLang(lang));
    })).then(function(translatedLines) {
        return translatedLines.map(function(line) {
            return cleanTourText(line, "");
        }).filter(Boolean);
    });
}
function buildTourPopupHtml(item, detailLines, isLoading) {
    var typeName = getTourTypeName(item.contenttypeid);
    var meta = getTourTypeMeta(item.contenttypeid);
    var title = getTourDisplayTitle(item);
    var addr = getTourDisplayAddr(item);
    var telLabel = currentLang === "en" ? "Tel" : "전화";
    var loadingText = currentLang === "en" ? "Loading details..." : "상세 정보를 불러오는 중...";
    var noDetailText = currentLang === "en" ? "No details available." : "상세 정보가 없습니다.";
    var tel = item.tel ? "<br><a href='tel:" + item.tel + "' style='color:#4db8ff;font-size:12px;'>" + telLabel + " " + escapeHtml(item.tel) + "</a>" : "";
    var tag = "<span class='tour-popup-tag' style='color:" + meta.color + ";border-color:" + meta.border + ";background:" + meta.fill + ";'>" + escapeHtml(typeName) + "</span>";
    var detailHtml = "";
    if (isLoading) detailHtml = "<div class='tour-popup-detail loading'>" + escapeHtml(loadingText) + "</div>";
    else if (detailLines && detailLines.length) {
        var readableLines = detailLines.map(function(line) {
            return cleanTourText(line, "");
        }).filter(Boolean);
        detailHtml = readableLines.length
            ? "<div class='tour-popup-detail'>" + readableLines.map(function(line) { return "<p>" + escapeHtml(line) + "</p>"; }).join("") + "</div>"
            : "<div class='tour-popup-detail muted'>" + escapeHtml(noDetailText) + "</div>";
    }
    else detailHtml = "<div class='tour-popup-detail muted'>" + escapeHtml(noDetailText) + "</div>";
    return "<b>" + escapeHtml(title) + "</b><br>" + tag + "<br><small>" + escapeHtml(addr) + "</small>" + tel + detailHtml;
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
    var visibleItems = getVisibleTourItems();
    var panel = document.getElementById("tour-panel");
    if (panel) panel.classList.toggle("collapsed", !tourPanelOpen);
    if (!tourPanelOpen) {
        expandBtn.style.display = "none";
        listEl.classList.remove("expanded");
        hideFestivalStrip();
        syncTourCloseButton();
        addTourMarkers();
        return;
    }
    var showCount = tourExpanded ? visibleItems.length : Math.min(visibleItems.length, TOUR_VISIBLE_COUNT);
    for (var i = 0; i < showCount; i++) {
        (function(item) {
            var meta = getTourTypeMeta(item.contenttypeid);
            var card = document.createElement("div"); card.className = "tour-card"; applyTourTypeVars(card, meta);
            var nameEl = document.createElement("div"); nameEl.className = "tour-card-name"; nameEl.textContent = getTourDisplayTitle(item) || (UI_TEXT[currentLang] || UI_TEXT.ko).empty_tour;
            var typeEl = document.createElement("div"); typeEl.className = "tour-card-type"; typeEl.textContent = getTourTypeName(item.contenttypeid) || meta.label;
            var addrEl = document.createElement("div"); addrEl.className = "tour-card-addr"; addrEl.textContent = getTourDisplayAddr(item) || "";
            var distEl = document.createElement("div"); distEl.className = "tour-card-dist";
            var distM = center.distanceTo([parseFloat(item.mapy), parseFloat(item.mapx)]);
            distEl.textContent = distM < 1000 ? Math.round(distM) + "m" : (distM / 1000).toFixed(1) + "km";
            card.appendChild(nameEl); card.appendChild(typeEl); if (addrEl.textContent) card.appendChild(addrEl); card.appendChild(distEl);
            card.addEventListener("click", function() { map.flyTo([parseFloat(item.mapy), parseFloat(item.mapx)], 17); showTourPopup(item); });
            listEl.appendChild(card);
        })(visibleItems[i]);
    }
    expandBtn.style.display = visibleItems.length > TOUR_VISIBLE_COUNT ? "" : "none";
    var expandIcon = document.getElementById("tour-expand-icon");
    var expandText = document.getElementById("tour-expand-text");
    if (expandIcon) expandIcon.textContent = tourExpanded ? "-" : "+";
    if (expandText) expandText.textContent = tourExpanded ? ((UI_TEXT[currentLang] || UI_TEXT.ko).close || "Close") : ((UI_TEXT[currentLang] || UI_TEXT.ko).more || "More");
    listEl.classList.toggle("expanded", visibleItems.length > 0 && tourExpanded);
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
    tourPanelOpen = false;
    tourExpanded = false;
    renderTourCards();
    map.closePopup();
}

function closeTourPanel(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    collapseTourPanel();
}

function toggleTourExpand() {
    tourPanelOpen = !tourPanelOpen;
    if (!tourPanelOpen) tourExpanded = false;
    renderTourCards();
}

function toggleTourMore(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    tourPanelOpen = true;
    tourExpanded = !tourExpanded;
    renderTourCards();
}

function showTourPopup(item) {
    var lat = parseFloat(item.mapy); var lng = parseFloat(item.mapx);
    var typeName = getTourTypeName(item.contenttypeid);
    var title = getTourDisplayTitle(item);
    setSelectedDestination(lat, lng, title || typeName || "愿愿묒?");
    addVisitStamp(title || item.title, typeName, lat, lng);
    var popup = L.popup({ className: "tour-popup" })
        .setLatLng([lat, lng])
        .setContent(buildTourPopupHtml(item, null, true))
        .openOn(map);
    fetchTourDetail(item).then(function(detail) {
        return translateTourDetailLines(item, detail);
    }).then(function(lines) {
        if (map.hasLayer(popup)) popup.setContent(buildTourPopupHtml(item, lines, false));
    }).catch(function() {
        if (map.hasLayer(popup)) popup.setContent(buildTourPopupHtml(item, [], false));
    });
}

function clearTourMarkers() { tourMarkers.forEach(function(m) { map.removeLayer(m); }); tourMarkers = []; }
function addTourMarkers() { clearTourMarkers(); getVisibleTourItems().filter(isNearbyMapLayerTourItem).forEach(function(item) { var lat = parseFloat(item.mapy); var lng = parseFloat(item.mapx); if (!isFinite(lat) || !isFinite(lng)) return; var meta = getTourTypeMeta(item.contenttypeid); var icon = L.divIcon({ className: "tour-map-marker-wrap", html: "<div class='tour-map-marker' style='--tour-color:" + meta.color + ";--tour-fill:" + meta.fill + ";--tour-border:" + meta.border + ";'><span class='tour-map-dot'></span><span class='tour-map-label'>" + escapeHtml(meta.label) + "</span></div>", iconSize: [76, 28], iconAnchor: [10, 14] }); var marker = L.marker([lat, lng], { pane: "tourPane", icon: icon, title: (getTourTypeName(item.contenttypeid) || meta.label) + " - " + (getTourDisplayTitle(item) || "") }).addTo(map); marker.on("click", function() { showTourPopup(item); }); tourMarkers.push(marker); }); }


// ?쒖슱 怨듦났?꾩꽌愿 ?꾩튂?뺣낫
var SEOUL_LIBRARY_API_KEY = window.GILOA_SEOUL_LIBRARY_API_KEY || "";
var SEOUL_LIBRARY_API_URL = "http://openapi.seoul.go.kr:8088/" + SEOUL_LIBRARY_API_KEY + "/json/SeoulPublicLibraryInfo/1/300/";
var libraryItems = [];
var libraryMarkers = [];
var LIBRARY_MARKER_COLOR = "#2563eb";

// 怨듭쨷?붿옣???꾩튂?뺣낫 (data.go.kr ?꾧뎅?쒖??곗씠?? ?쒖슱留?異붾젮 ?깆뿉 ?댁옣 + 移댁뭅??吏?ㅼ퐫?⑹쑝濡??ㅼ떆媛?醫뚰몴 蹂??
var RESTROOM_DATA_URL = "./data/restrooms_seoul.json";
var RESTROOM_GEOCODE_CACHE_KEY = "giloa-restroom-geocode-cache";
var restroomRawItems = [];      // ?쒖슱 ?꾩껜 ?붿옣??(?대쫫+二쇱냼, 醫뚰몴 ?놁쓬)
var restroomRawLoaded = false;
var restroomGeoCache = {};      // { 二쇱냼: {lat, lng} } - localStorage???곴뎄 罹먯떆
var restroomVisibleItems = [];  // 醫뚰몴媛 ?뺣낫?섏뼱 ?ㅼ젣濡??쒖떆 以묒씤 ??ぉ
var restroomMarkers = [];
var restroomGuFetched = {};     // ?대? 吏?ㅼ퐫?⑹쓣 ?쒕룄??援??대쫫 吏묓빀 (以묐났 諛⑹?)
var restroomGeocodeQueueBusy = false;
var RESTROOM_MARKER_COLOR = "#a3e635";

function normalizeLang(lang) {
    return ({ ko: "ko", en: "en", ja: "ja", jp: "ja", zh: "zh", cn: "zh", "zh-cn": "zh", "zh_cn": "zh" })[String(lang || currentLang || "ko").toLowerCase()] || "ko";
}
function getLibraryLabel(lang) {
    var labels = { ko: "도서관", en: "Library", ja: "図書館", zh: "图书馆" };
    return labels[normalizeLang(lang)] || labels.ko;
}
function getRestroomLabel(lang) {
    var labels = { ko: "화장실", en: "Restroom", ja: "トイレ", zh: "卫生间" };
    return labels[normalizeLang(lang)] || labels.ko;
}

function getLibraryDisplayName(item) { return (item && item._nameByLang && item._nameByLang[currentLang]) || (item && item.LBRRY_NAME) || ""; }
function getLibraryDisplayAddr(item) { return (item && item._addrByLang && item._addrByLang[currentLang]) || (item && item.ADRES) || ""; }

function clearLibraryMarkers() { libraryMarkers.forEach(function(marker) { map.removeLayer(marker); }); libraryMarkers = []; var pane = map.getPane("libraryPane"); if (pane) pane.querySelectorAll(".library-map-marker-wrap").forEach(function(el) { el.remove(); }); }

function refreshLibraryMarkerLabels(lang) {
    var label = getLibraryLabel(lang);
    document.querySelectorAll(".library-map-label").forEach(function(el) { el.textContent = label; });
}

function renderLibraryMarkers(lang) {
    clearLibraryMarkers();
    var label = getLibraryLabel(lang);
    libraryItems.forEach(function(item) {
        var lat = parseFloat(item.XCNTS); var lng = parseFloat(item.YDNTS);
        if (!isWithinMapSearchCenter(lat, lng, MAP_LAYER_RADIUS_M)) return;
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
    setSelectedDestination(lat, lng, name || label);
    var tel = item.TEL_NO ? "<br><a href='tel:" + item.TEL_NO + "' style='color:#4ade80;font-size:12px;'>?占쏀솕 " + escapeHtml(item.TEL_NO) + "</a>" : "";
    var time = item.OP_TIME ? "<br><small>" + escapeHtml(item.OP_TIME) + "</small>" : "";
    var tag = "<span class='tour-popup-tag' style='color:#60a5fa;border-color:rgba(37,99,235,0.75);background:rgba(37,99,235,0.22);'>" + escapeHtml(label) + "</span>";
    L.popup({ className: "tour-popup" }).setLatLng([lat, lng]).setContent("<b>" + escapeHtml(name) + "</b><br>" + tag + "<br><small>" + escapeHtml(addr) + "</small>" + time + tel).openOn(map);
}

function translateLibraryItemsForLang(lang) {
    renderLibraryMarkers(lang);
    refreshLibraryMarkerLabels(lang);
    return Promise.resolve();
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
        librariesLoaded = true;
        if (mapLayerSettings.library) { renderLibraryMarkers(); translateLibraryItemsForLang(currentLang); }
    }).catch(function(err) { console.warn("?쒖슱 ?꾩꽌愿 API ?ㅻ쪟", err); });
}

// ---- 怨듭쨷?붿옣??(?댁옣 ?쒖슱 ?곗씠??+ 移댁뭅??吏?ㅼ퐫?? ----
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
function fetchRestroomRawData() {
    if (restroomRawLoaded) return Promise.resolve(restroomRawItems);
    return fetch(RESTROOM_DATA_URL).then(function(res) { return res.json(); }).then(function(data) {
        restroomRawItems = Array.isArray(data) ? data : [];
        restroomRawLoaded = true;
        return restroomRawItems;
    }).catch(function(err) { console.warn("?붿옣???곗씠??濡쒕뱶 ?ㅻ쪟", err); return []; });
}
function clearRestroomMarkers() { restroomMarkers.forEach(function(marker) { map.removeLayer(marker); }); restroomMarkers = []; }
function rememberRestroomItem(item) {
    var key = String(item.addr || item.name || "") + "|" + item.lat + "|" + item.lng;
    var existing = restroomVisibleItems.findIndex(function(saved) {
        return saved._giloaKey === key;
    });
    item._giloaKey = key;
    if (existing >= 0) restroomVisibleItems[existing] = item;
    else restroomVisibleItems.push(item);
}
function createRestroomMarker(item) {
    if (!isFinite(item.lat) || !isFinite(item.lng)) return;
    if (!isWithinMapSearchCenter(item.lat, item.lng, MAP_LAYER_RADIUS_M)) return;
    var label = getRestroomLabel();
    var icon = L.divIcon({
        className: "library-map-marker-wrap",
        html: "<div class='library-map-marker' style='--tour-color:" + RESTROOM_MARKER_COLOR + ";'><span class='library-map-dot' style='background:" + RESTROOM_MARKER_COLOR + ";'></span><span class='library-map-label'>" + escapeHtml(label) + "</span></div>",
        iconSize: [76, 28], iconAnchor: [10, 14]
    });
    var marker = L.marker([item.lat, item.lng], { pane: "restroomPane", icon: icon, title: label + " - " + (item.name || "") }).addTo(map);
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
    restroomVisibleItems.forEach(createRestroomMarker);
}
function showRestroomPopup(item) {
    var label = getRestroomLabel();
    setSelectedDestination(item.lat, item.lng, item.name || label);
    var tag = "<span class='tour-popup-tag' style='color:" + RESTROOM_MARKER_COLOR + ";border-color:" + RESTROOM_MARKER_COLOR + ";background:rgba(163,230,53,0.18);'>" + escapeHtml(label) + "</span>";
    var tel = item.tel ? "<br><a href='tel:" + item.tel + "' style='color:#4ade80;font-size:12px;'>Call " + escapeHtml(item.tel) + "</a>" : "";
    var extra = [item.openType, item.hours].filter(Boolean).join(" - ");
    L.popup({ className: "tour-popup" }).setLatLng([item.lat, item.lng]).setContent("<b>" + escapeHtml(item.name || "Restroom") + "</b><br>" + tag + "<br><small>" + escapeHtml(item.addr || "") + "</small>" + (extra ? "<br><small>" + escapeHtml(extra) + "</small>" : "") + tel).openOn(map);
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
        if (i >= items.length) { restroomGeocodeQueueBusy = false; return; }
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
function fetchRestroomsForCurrentArea() {
    if (!mapLayerSettings.restroom) return;
    fetchRestroomRawData().then(function(allItems) {
        if (!allItems.length) return;
        return loadKakaoTrafficSdk().then(function() {
            var center = map.getCenter();
            var geocoder = new window.kakao.maps.services.Geocoder();
            geocoder.coord2RegionCode(center.lng, center.lat, function(result, status) {
                if (status !== window.kakao.maps.services.Status.OK || !result || !result.length) return;
                var guName = "";
                for (var i = 0; i < result.length; i++) {
                    if (result[i].region_type === "H" || result[i].region_type === "B") {
                        guName = result[i].region_2depth_name;
                        if (guName) break;
                    }
                }
                if (!guName || restroomGuFetched[guName]) return;
                restroomGuFetched[guName] = true;
                var guItems = allItems.filter(function(it) { return extractGuFromAddress(it.addr) === guName; });
                var toGeocode = [];
                guItems.forEach(function(it) {
                    var cached = restroomGeoCache[it.addr];
                    if (cached) {
                        var placed = Object.assign({}, it, cached);
                        addRestroomMarker(placed);
                    } else {
                        toGeocode.push(it);
                    }
                });
                if (toGeocode.length && !restroomGeocodeQueueBusy) {
                    geocodeQueueSequential(toGeocode, function(item, coord) {
                        if (!mapLayerSettings.restroom) return; // 吏?ㅼ퐫???꾩쨷 ?좉???爰쇱죱?쇰㈃ 留덉빱 異붽? 以묐떒
                        addRestroomMarker(Object.assign({}, item, coord));
                    });
                }
            });
        });
    }).catch(function(err) { console.warn("?붿옣??吏?ㅼ퐫???ㅻ쪟", err); });
}
function scheduleRestroomFetch() {
    if (!mapLayerSettings.restroom) return;
    if (restroomFetchTimer) clearTimeout(restroomFetchTimer);
    restroomFetchTimer = setTimeout(function() { restroomFetchTimer = null; fetchRestroomsForCurrentArea(); }, 1200);
}
var restroomFetchTimer = null;
map.on("moveend", scheduleRestroomFetch);
loadRestroomGeoCache();

function scheduleTourFetch() { if (tourFetchTimer) clearTimeout(tourFetchTimer); tourFetchTimer = setTimeout(function() { tourFetchTimer = null; tourExpanded = false; fetchTourSpots(); fetchFestivals(); }, 1200); }
map.on("moveend", scheduleTourFetch);
map.on("moveend", refreshMapCenteredLayerMarkers);
map.on("click", function() { collapseTourPanel(); });
scheduleTourFetch();
if (mapLayerSettings.library) fetchLibraries();

// 吏???쒖떆 ?덉씠???좉? (?ъ씠?쒕컮 "吏???쒖떆" ?⑤꼸)
function toggleMapLayerPanel() {
    var panel = document.getElementById("map-layer-panel");
    var caret = document.getElementById("map-layer-caret");
    if (!panel) return;
    panel.classList.toggle("expanded");
    if (caret) caret.classList.toggle("open");
}
function syncMapLayerToggleUI(key) {
    var sw = document.getElementById("layer-toggle-" + key);
    if (!sw) return;
    var on = !!mapLayerSettings[key];
    sw.classList.toggle("on", on);
    sw.classList.toggle("off", !on);
}
function applyMapLayerChange(key) {
    if (key === "library") {
        if (mapLayerSettings.library) {
            if (librariesLoaded) { renderLibraryMarkers(); translateLibraryItemsForLang(currentLang); }
            else fetchLibraries();
        } else {
            clearLibraryMarkers();
        }
    } else if (key === "restroom") {
        if (mapLayerSettings.restroom) {
            fetchRestroomsForCurrentArea();
        } else {
            clearRestroomMarkers();
            restroomGuFetched = {}; // ?ㅼ떆 耳곗쓣 ???꾩옱 蹂댁씠??援щ? ?ы룊媛?섎룄濡?珥덇린??(吏?ㅼ퐫??罹먯떆???좎??섏뼱 ?ы샇異쒖? ????
        }
    } else if (key === "restaurant" || key === "lodging") {
        renderTourCards();
        addTourMarkers();
    }
    // community: ?꾩쭅 ?곌껐???곗씠???뚯뒪媛 ?놁뼱 ?곹깭留???ν빀?덈떎 (以鍮?以?.
}
function toggleMapLayer(key) {
    if (MAP_LAYER_UNAVAILABLE[key]) return;
    mapLayerSettings[key] = !mapLayerSettings[key];
    saveMapLayerSettings();
    syncMapLayerToggleUI(key);
    applyMapLayerChange(key);
}
function refreshMapCenteredLayerMarkers() {
    if (mapLayerSettings.library && librariesLoaded) renderLibraryMarkers(currentLang);
    if (mapLayerSettings.restroom) {
        renderRestroomMarkers();
    }
    addTourMarkers();
}
function initMapLayerUI() {
    Object.keys(MAP_LAYER_DEFAULTS).forEach(function(key) { syncMapLayerToggleUI(key); });
}
initMapLayerUI();

// VARCO 踰덉뿭
var VARCO_API_KEY = window.GILOA_VARCO_API_KEY || "";
var VARCO_TRANSLATE_URL = "https://api.varco.ai/mt/chat-content/v1/translate";
var currentLang = "ko";

function getVarcoLang(lang) { return ({ ko: "ko", en: "en", ja: "ja", zh: "zh" })[lang] || "en"; }
function getGoogleLang(lang) { return ({ ko: "ko", en: "en", ja: "ja", zh: "zh-CN" })[lang] || "en"; }

function googleTranslate(text, sourceLang, targetLang) {
    if (!text) return Promise.resolve("");
    if (normalizeLang(sourceLang) === normalizeLang(targetLang)) return Promise.resolve(text);
    var url = "https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&sl=" + encodeURIComponent(sourceLang || "ko") + "&tl=" + encodeURIComponent(getGoogleLang(targetLang)) + "&q=" + encodeURIComponent(text);
    return fetch(url).then(function(res) { return res.json(); }).then(function(data) {
        if (Array.isArray(data) && Array.isArray(data[0])) return data[0].map(function(part) { return part && part[0] ? part[0] : ""; }).join("") || text;
        return text;
    });
}

var translateMemoryCache = {};
function getTranslateCacheKey(text, sourceLang, targetLang) {
    return [sourceLang || "ko", targetLang || "en", text || ""].join("|");
}
function varcoTranslate(text, sourceLang, targetLang) {
    if (!text) return Promise.resolve("");
    if (normalizeLang(sourceLang) === normalizeLang(targetLang)) return Promise.resolve(text);
    var cacheKey = getTranslateCacheKey(text, sourceLang, targetLang);
    if (translateMemoryCache[cacheKey]) return Promise.resolve(translateMemoryCache[cacheKey]);
    return googleTranslate(text, sourceLang, targetLang).then(function(translated) {
        translateMemoryCache[cacheKey] = translated;
        return translated;
    }).catch(function() {
        if (!VARCO_API_KEY) return text;
        return fetch(VARCO_TRANSLATE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "openapi_key": VARCO_API_KEY },
        body: JSON.stringify({ TID: "giloa-" + Date.now(), svc: "varco-translation", provider: "content", source_lang: sourceLang, source_text: text, target_lang: targetLang })
        }).then(function(res) { return res.text(); }).then(function(raw) {
            if (/^\s*</.test(raw)) throw new Error("VARCO returned HTML");
            var data = JSON.parse(raw);
            var translated = data.target_text || (data.result && data.result.target_text) || (data.data && data.data.target_text) || (data.output && data.output.text) || text;
            translateMemoryCache[cacheKey] = translated;
            return translated;
        }).catch(function() { return text; });
    });
}

var UI_TEXT = {
    ko: { sidebar_title: "나의 기록", fog_label: "안개 효과", fog_on: "켜짐", fog_off: "꺼짐", tab_memory: "기억", tab_photo: "사진", tab_gpx: "경로", tab_badge: "뱃지", tab_visit: "방문", tab_item: "아이템", rec_idle: "중단됨", rec_active: "기록중", gps_weak: "GPS 약함 ({value}m)", gps_very_weak: "GPS 매우 약함 ({value}m)", stay_bonus_wait: "기록중 - 체류 보너스까지 {value}분", stay_bonus_done: "30분 체류 완료! 레벨 +1 보너스!", empty_memory: "아직 기록이 없습니다.", empty_photo: "아직 사진이 없습니다.", tour_title: "주변 관광지", tour_place_fallback: "관광지", festival_label: "주변 축제", festival_badge: "축제", loading: "검색 중...", empty_tour: "주변 장소가 없습니다", close: "닫기", more: "더보기", next: "다음", start: "시작", previous: "이전", count_suffix: "곳", unit_count: "개", hud_title_label: "현재 칭호", hud_level_label: "LV", hud_dist_label: "이동 거리", hud_memory_label: "기억", hud_photo_label: "사진", hud_next: "다음까지", hud_condition_met: "달성!", hud_no_condition: "조건 없음", hud_max: "최고!", hud_max_level: "최고 레벨!", help_tab_ask: "문의하기", help_tab_info: "설명보기", help_tutorial_replay: "튜토리얼 다시 보기", help_ask_copy: "사용 중 불편한 점이나 건의사항은<br>카카오톡 오픈채팅으로 알려주세요.", help_notice: "저장된 GPX 데이터는 서버로 전송되지 않습니다.<br>모든 기록은 <b>이 기기 안에만</b> 저장되고 보여집니다.", help_link: "카카오톡 오픈채팅", help_record_title: "기록 버튼", help_record_desc: "누르면 GPS 경로 기록을 시작하고 다시 누르면 중단합니다.", help_photo_title: "사진 버튼", help_photo_desc: "갤러리에서 사진을 불러옵니다.", help_memory_title: "기억 버튼", help_memory_desc: "현재 위치에 이름을 붙여 기억으로 저장합니다.", help_location_title: "현재 위치 버튼", help_location_desc: "지도를 현재 위치로 이동합니다.", help_status_title: "상태 버튼", help_status_desc: "칭호와 진행 상태를 확인합니다.", help_menu_title: "메뉴 버튼", help_menu_desc: "기억, 사진, 경로 기록을 확인합니다." },
    en: { sidebar_title: "My Records", fog_label: "Fog Effect", fog_on: "On", fog_off: "Off", tab_memory: "Memory", tab_photo: "Photo", tab_gpx: "Route", tab_badge: "Badges", tab_visit: "Visits", tab_item: "Items", rec_idle: "Stopped", rec_active: "Recording", gps_weak: "Weak GPS ({value}m)", gps_very_weak: "Very weak GPS ({value}m)", stay_bonus_wait: "Recording - stay bonus in {value} min", stay_bonus_done: "30 min stay complete! Level +1 bonus!", empty_memory: "No records yet.", empty_photo: "No photos yet.", tour_title: "Nearby Places", tour_place_fallback: "Place", festival_label: "Nearby Festivals", festival_badge: "Festivals", loading: "Searching...", empty_tour: "No nearby places", close: "Close", more: "More", next: "Next", start: "Start", previous: "Back", count_suffix: "places", unit_count: "", hud_title_label: "Current Title", hud_level_label: "LV", hud_dist_label: "Distance", hud_memory_label: "Memories", hud_photo_label: "Photos", hud_next: "Next", hud_condition_met: "Met!", hud_no_condition: "No condition", hud_max: "Max!", hud_max_level: "Max level reached!", help_tab_ask: "Contact", help_tab_info: "Guide", help_tutorial_replay: "Replay Tutorial", help_ask_copy: "Tell us about issues or suggestions<br>through KakaoTalk open chat.", help_notice: "Saved GPX data is not sent to the server.<br>All records are stored and shown <b>only on this device</b>.", help_link: "KakaoTalk Open Chat", help_record_title: "Record Button", help_record_desc: "Tap to start GPS route recording. Tap again to stop.", help_photo_title: "Photo Button", help_photo_desc: "Import photos from your gallery.", help_memory_title: "Memory Button", help_memory_desc: "Name your current location and save it as a memory.", help_location_title: "Current Location Button", help_location_desc: "Move the map back to your current location.", help_status_title: "Status Button", help_status_desc: "Check your title and progress.", help_menu_title: "Menu Button", help_menu_desc: "View memories, photos, and route records." },
    ja: {},
    zh: {}
};
UI_TEXT.ja = Object.assign({}, UI_TEXT.en);
UI_TEXT.zh = Object.assign({}, UI_TEXT.en);
Object.assign(UI_TEXT.ja, {
    sidebar_title: "私の記録", fog_label: "霧の効果", fog_on: "オン", fog_off: "オフ",
    tab_memory: "記憶", tab_photo: "写真", tab_gpx: "ルート", tab_badge: "バッジ", tab_visit: "訪問", tab_item: "アイテム",
    rec_idle: "停止中", rec_active: "記録中", gps_weak: "GPSが弱い ({value}m)", gps_very_weak: "GPSが非常に弱い ({value}m)",
    stay_bonus_wait: "記録中 - 滞在ボーナスまで{value}分", stay_bonus_done: "30分滞在完了！レベル+1ボーナス！",
    empty_memory: "まだ記録がありません。", empty_photo: "まだ写真がありません。",
    tour_title: "周辺観光地", tour_place_fallback: "観光地", festival_label: "周辺の祭り", festival_badge: "祭り",
    loading: "検索中...", empty_tour: "周辺の場所がありません", close: "閉じる", more: "もっと見る",
    next: "次へ", start: "開始", previous: "戻る", count_suffix: "件", unit_count: "個",
    hud_title_label: "現在の称号", hud_level_label: "LV", hud_dist_label: "移動距離", hud_memory_label: "記憶",
    hud_photo_label: "写真", hud_next: "次まで", hud_condition_met: "達成！", hud_no_condition: "条件なし",
    hud_max: "最高！", hud_max_level: "最高レベル！",
    help_tab_ask: "お問い合わせ", help_tab_info: "使い方", help_tutorial_replay: "チュートリアルをもう一度見る",
    help_ask_copy: "ご不便な点やご意見は<br>KakaoTalkオープンチャットでお知らせください。",
    help_notice: "保存されたGPXデータはサーバーへ送信されません。<br>すべての記録は<b>この端末内だけ</b>に保存・表示されます。",
    help_link: "KakaoTalkオープンチャット",
    help_record_title: "記録ボタン", help_record_desc: "押すとGPSルート記録を開始し、もう一度押すと停止します。",
    help_photo_title: "写真ボタン", help_photo_desc: "ギャラリーから写真を読み込みます。",
    help_memory_title: "記憶ボタン", help_memory_desc: "現在地に名前を付けて記憶として保存します。",
    help_location_title: "現在地ボタン", help_location_desc: "地図を現在地へ移動します。",
    help_status_title: "ステータスボタン", help_status_desc: "称号と進行状況を確認します。",
    help_menu_title: "メニューボタン", help_menu_desc: "記憶、写真、ルート記録を確認します。"
});
Object.assign(UI_TEXT.zh, {
    sidebar_title: "我的记录", fog_label: "迷雾效果", fog_on: "开启", fog_off: "关闭",
    tab_memory: "记忆", tab_photo: "照片", tab_gpx: "路线", tab_badge: "徽章", tab_visit: "访问", tab_item: "物品",
    rec_idle: "已停止", rec_active: "记录中", gps_weak: "GPS信号较弱 ({value}m)", gps_very_weak: "GPS信号很弱 ({value}m)",
    stay_bonus_wait: "记录中 - 距离停留奖励还有{value}分钟", stay_bonus_done: "停留30分钟完成！等级+1奖励！",
    empty_memory: "还没有记录。", empty_photo: "还没有照片。",
    tour_title: "周边景点", tour_place_fallback: "景点", festival_label: "周边庆典", festival_badge: "庆典",
    loading: "搜索中...", empty_tour: "附近没有地点", close: "关闭", more: "更多",
    next: "下一步", start: "开始", previous: "返回", count_suffix: "处", unit_count: "个",
    hud_title_label: "当前称号", hud_level_label: "LV", hud_dist_label: "移动距离", hud_memory_label: "记忆",
    hud_photo_label: "照片", hud_next: "距离下一级", hud_condition_met: "已达成！", hud_no_condition: "无条件",
    hud_max: "最高！", hud_max_level: "已达最高等级！",
    help_tab_ask: "联系我们", help_tab_info: "使用说明", help_tutorial_replay: "重新查看教程",
    help_ask_copy: "使用中如有不便或建议，<br>请通过KakaoTalk开放聊天告诉我们。",
    help_notice: "保存的GPX数据不会发送到服务器。<br>所有记录<b>只会保存在此设备中</b>并在此显示。",
    help_link: "KakaoTalk开放聊天",
    help_record_title: "记录按钮", help_record_desc: "点击开始记录GPS路线，再次点击即可停止。",
    help_photo_title: "照片按钮", help_photo_desc: "从相册导入照片。",
    help_memory_title: "记忆按钮", help_memory_desc: "为当前位置命名并保存为记忆。",
    help_location_title: "当前位置按钮", help_location_desc: "将地图移回当前位置。",
    help_status_title: "状态按钮", help_status_desc: "查看称号和进度。",
    help_menu_title: "菜单按钮", help_menu_desc: "查看记忆、照片和路线记录。"
});
Object.assign(UI_TEXT.ko, {
    map_layer_title: "지도 표시", map_layer_library: "도서관", map_layer_restaurant: "음식점",
    map_layer_lodging: "숙박", map_layer_restroom: "화장실", map_layer_community: "주민회관",
    map_layer_coming_soon: "준비중"
});
Object.assign(UI_TEXT.en, {
    map_layer_title: "Map Display", map_layer_library: "Library", map_layer_restaurant: "Restaurant",
    map_layer_lodging: "Lodging", map_layer_restroom: "Restroom", map_layer_community: "Community Center",
    map_layer_coming_soon: "Coming soon"
});
Object.assign(UI_TEXT.ja, {
    map_layer_title: "地図表示", map_layer_library: "図書館", map_layer_restaurant: "飲食店",
    map_layer_lodging: "宿泊", map_layer_restroom: "トイレ", map_layer_community: "住民センター",
    map_layer_coming_soon: "準備中"
});
Object.assign(UI_TEXT.zh, {
    map_layer_title: "地图显示", map_layer_library: "图书馆", map_layer_restaurant: "餐厅",
    map_layer_lodging: "住宿", map_layer_restroom: "卫生间", map_layer_community: "社区中心",
    map_layer_coming_soon: "即将推出"
});
function setText(id, value) { var el = document.getElementById(id); if (el) el.textContent = value; }
function setHtml(id, value) { var el = document.getElementById(id); if (el) el.innerHTML = value; }
function applyHelpLang(t) {
    setText("htab-ask", t.help_tab_ask);
    setText("htab-info", t.help_tab_info);
    setText("help-tutorial-replay", t.help_tutorial_replay);
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
    lang = normalizeLang(lang);
    currentLang = lang;
    document.documentElement.lang = lang;
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
    if (el("map-layer-title")) el("map-layer-title").textContent = t.map_layer_title;
    if (el("map-layer-name-library")) el("map-layer-name-library").textContent = t.map_layer_library;
    if (el("map-layer-name-restaurant")) el("map-layer-name-restaurant").textContent = t.map_layer_restaurant;
    if (el("map-layer-name-lodging")) el("map-layer-name-lodging").textContent = t.map_layer_lodging;
    if (el("map-layer-name-restroom")) el("map-layer-name-restroom").textContent = t.map_layer_restroom;
    if (el("map-layer-name-community")) el("map-layer-name-community").textContent = t.map_layer_community;
    if (el("map-layer-coming-soon")) el("map-layer-coming-soon").textContent = t.map_layer_coming_soon;
    syncFogButton();
    syncRecordingUI();
    syncLanguageButtons(lang);
    applyHelpLang(t);
    applyHudLang(t);
    renderTourCards();
    renderFestivalStrip();
    translateTourItemsForLang(lang, tourItems);
    translateTourItemsForLang(lang, festivalItems);
    if (mapLayerSettings.library) {
        translateLibraryItemsForLang(lang);
        refreshLibraryMarkerLabels(lang);
    } else {
        clearLibraryMarkers();
    }
    if (mapLayerSettings.restroom) renderRestroomMarkers();
}

function toggleLang(lang) {
    lang = normalizeLang(lang);
    currentLang = lang;
    syncLanguageButtons(lang);
    applyUILang(lang);
    applyAutoRecordingNoticeLang();
    var tutorialWrap = document.getElementById("giloa-tutorial");
    if (tutorialWrap && tutorialWrap.classList.contains("show")) {
        tutorialStepIndex = Math.min(tutorialStepIndex, getTutorialSteps().length - 1);
        renderTutorialStep();
    }
    refreshLibraryMarkerLabels(lang);
    fetchTourSpots({ keepExisting: true });
    fetchFestivals({ keepExisting: true });
    setTimeout(function() { refreshLibraryMarkerLabels(lang); }, 50);
}

function syncLanguageButtons(lang) {
    lang = normalizeLang(lang);
    document.querySelectorAll(".lang-btn").forEach(function(btn) {
        btn.classList.toggle("active", normalizeLang(btn.dataset.lang) === lang);
        btn.setAttribute("aria-pressed", normalizeLang(btn.dataset.lang) === lang ? "true" : "false");
    });
}

function markTourItemsSource(items, sourceLang) {
    (items || []).forEach(function(item) {
        var detected = hasHangul((item && item.title) || "") || hasHangul((item && item.addr1) || "") ? "ko" : sourceLang;
        item._sourceLang = normalizeLang(detected || currentLang);
    });
}

function hasHangul(text) {
    return /[\uAC00-\uD7A3]/.test(String(text || ""));
}

function isBrokenDisplayText(text) {
    var value = String(text || "").trim();
    if (!value) return true;
    if (/[占�]/.test(value)) return true;
    if (/\?{2,}/.test(value)) return true;
    if ((value.match(/\?/g) || []).length >= 2) return true;
    if (/[湲濡쒖댁媛諛遺嫄吏占쎈]/.test(value)) return true;
    return false;
}

function cleanTourText(text, fallback) {
    var value = String(text || "").replace(/<[^>]*>/g, "").trim();
    return isBrokenDisplayText(value) ? fallback : value;
}

function translateTourItemsForLang(lang, items) {
    lang = normalizeLang(lang);
    items = items || tourItems;
    var targetLang = getVarcoLang(lang);
    var tasks = [];
    function scheduleTranslatedRender() {
        if (lang !== currentLang) return;
        if (tourTranslationRenderTimer !== null) return;
        tourTranslationRenderTimer = setTimeout(function() {
            tourTranslationRenderTimer = null;
            renderTourCards();
            addTourMarkers();
            if (tourExpanded) renderFestivalStrip();
        }, 80);
    }
    items.forEach(function(item) {
        if (!item) return;
        item._titleByLang = item._titleByLang || {};
        item._addrByLang = item._addrByLang || {};
        var sourceLang = normalizeLang(item._sourceLang || (hasHangul(item.title || item.addr1) ? "ko" : "en"));
        if (sourceLang === lang) return;
        if (item.title && !item._titleByLang[lang]) {
            tasks.push(varcoTranslate(item.title, getVarcoLang(sourceLang), targetLang).then(function(translated) { item._titleByLang[lang] = translated; scheduleTranslatedRender(); }));
        }
        if (item.addr1 && !item._addrByLang[lang]) {
            tasks.push(varcoTranslate(item.addr1, getVarcoLang(sourceLang), targetLang).then(function(translated) { item._addrByLang[lang] = translated; scheduleTranslatedRender(); }));
        }
    });
    if (tasks.length === 0) return Promise.resolve();
    return Promise.all(tasks).then(function() { renderTourCards(); addTourMarkers(); if (tourExpanded) renderFestivalStrip(); });
}

function getTourDisplayTitle(item) {
    var fallback = (UI_TEXT[currentLang] || UI_TEXT.ko).tour_place_fallback || getTourTypeName(item && item.contenttypeid);
    return cleanTourText((item && item._titleByLang && item._titleByLang[currentLang]) || (item && item.title), fallback);
}
function getTourDisplayAddr(item) {
    return cleanTourText((item && item._addrByLang && item._addrByLang[currentLang]) || (item && item.addr1), "");
}

// Collection items
var COLLECTION_KEY = "giloa-collection";
var badges = []; var visitStamps = []; var items = [];

var BADGE_DEFS = [
    { id: "first_memory", icon: "M", name: "First Memory", desc: "Saved your first memory." },
    { id: "first_photo", icon: "P", name: "First Photo", desc: "Saved your first photo." },
    { id: "first_10km", icon: "10", name: "10km", desc: "Walked 10km in total." },
    { id: "first_50km", icon: "50", name: "50km", desc: "Walked 50km in total." },
    { id: "early_bird", icon: "AM", name: "Early Bird", desc: "Recorded before 5 AM." },
    { id: "memory_5", icon: "M5", name: "Memory Collector", desc: "Saved 5 memories." },
    { id: "photo_10", icon: "P10", name: "Photo Collector", desc: "Saved 10 photos." },
    { id: "tour_visit", icon: "T", name: "Explorer", desc: "Visited a place." },
    { id: "festival_visit", icon: "F", name: "Festival Visitor", desc: "Visited a festival." },
    { id: "image_hyundai_fountain", icon: makeImageBadgeIcon("fountain"), name: "Fountain Friend", desc: "Recognized the fountain." },
    { id: "image_heendy", icon: makeImageBadgeIcon("heendy"), name: "Heendy Friend", desc: "Recognized Heendy." },
    { id: "image_hanam_bangul", icon: makeImageBadgeIcon("duo"), name: "Bangul Friend", desc: "Recognized Bangul." },
    { id: "image_dasan_street", icon: makeImageBadgeIcon("street"), name: "Street Explorer", desc: "Recognized Dasan Street." },
];

function makeImageBadgeIcon(type) {
    var faces = {
        fountain: '<span class="badge-face badge-fountain"><span class="badge-splash"></span><span class="badge-eyes"></span></span>',
        heendy: '<span class="badge-face badge-heendy"><span class="badge-ears"></span><span class="badge-eyes"></span></span>',
        duo: '<span class="badge-duo"><span class="badge-face badge-hanam"><span class="badge-eyes"></span></span><span class="badge-face badge-bangul"><span class="badge-eyes"></span></span></span>',
        street: '<span class="badge-face badge-street"><span class="badge-sign"></span><span class="badge-eyes"></span></span>'
    };
    return '<span class="character-badge" aria-hidden="true">' + (faces[type] || faces.street) + '</span>';
}

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
    } catch(e) { console.warn("?占쎌쭛 ?占쎈낫 蹂듭썝 ?占쏀뙣", e); }
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
    showCollectionToast(def.icon + " 諭껓옙? ?占쎈뱷! " + def.name);
}

function addVisitStamp(name, type, lat, lng) {
    var now = new Date();
    visitStamps.push({ name: name, type: type, lat: lat, lng: lng, visitedAt: now.getTime(), dateString: now.toLocaleDateString("ko-KR") });
    saveCollection();
    updateVisitList();
    if (type === "愿愿묕옙?" || type === "臾명솕?占쎌꽕") earnBadge("tour_visit");
    if (type === "異뺤젣") earnBadge("festival_visit");
    showCollectionToast(name + " 諛⑸Ц 湲곕줉!");
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
    if (badges.length === 0) { container.innerHTML = '<p class="empty-message">?占쎌쭅 ?占쎈뱷???占쏙옙?媛 ?占쎌뒿?占쎈떎.</p>'; return; }
    container.innerHTML = "";
    badges.slice().reverse().forEach(function(b) {
        var def = BADGE_DEFS.find(function(d) { return d.id === b.id; });
        if (!def) return;
        var item = document.createElement("div");
        item.className = "badge-item";
        item.innerHTML = '<div class="badge-icon">' + def.icon + '</div><div class="badge-name">' + def.name + '</div><div class="badge-date">' + b.dateString + '</div>';
        item.title = def.desc || def.name;
        container.appendChild(item);
    });
}

function updateVisitList() {
    var container = document.getElementById("visit-list");
    if (!container) return;
    if (visitStamps.length === 0) { container.innerHTML = '<p class="empty-message">?占쎌쭅 諛⑸Ц???占쎌냼媛 ?占쎌뒿?占쎈떎.</p>'; return; }
    container.innerHTML = "";
    visitStamps.slice().sort(function(a,b){ return b.visitedAt - a.visitedAt; }).forEach(function(v) {
        var typeIcons = { "Attraction": "Spot", "Culture": "Culture", "Festival": "Fest", "Leports": "Sport", "Course": "Route" };
        var icon = typeIcons[v.type] || "Place";
        var el = document.createElement("div");
        el.className = "visit-item";
        el.innerHTML = '<div class="visit-icon">' + icon + '</div><div class="visit-info"><div class="visit-name">' + escapeHtml(v.name) + '</div><div class="visit-date">' + v.dateString + '</div></div>';
        el.addEventListener("click", function() { setSelectedDestination(v.lat, v.lng, v.name || "諛⑸Ц ?占쎌냼"); map.flyTo([v.lat, v.lng], 17); toggleSidebar(false); });
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

// ?占쎌빞 諛⑺뼢 遺梨꾧섦 ?占쎌떆var visionCone = null;
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

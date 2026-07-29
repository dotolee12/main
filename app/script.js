// 앱 시작 시 위치 권한 요청
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
                    if (error) { console.warn("BG 위치 오류", error); return; }
                    if (location && isRecording) { handlePosition({ coords: { latitude: location.latitude, longitude: location.longitude, accuracy: location.accuracy } }); }
                });
            }
        } catch (e) { console.warn("권한 요청 실패", e); }
    }
}
var locationPermissionPromise = requestLocationPermission();

const STORAGE_KEY = "giloa-v7";
const USER_ID_KEY = "giloa-user-id";
const FOG_ENABLED_KEY = "giloa-fog-enabled";
const MAP_LAYER_KEY = "giloa-map-layers";
const GPX_SAVES_KEY = "giloa-gpx-saves";
const AUTO_RECORD_CONSENT_KEY = "giloa-auto-record-consent-v1";
const TUTORIAL_SEEN_KEY = "giloa-overview-tutorial-seen-v1";
const TUTORIAL_HELP_KNOWN_KEY = "giloa-tutorial-help-known-v1";
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
LEVEL_TITLE_I18N.ko = ["길 없는 자", "흔적을 남긴 자", "탐험자", "길을 만든 자", "바람을 걷는 자", "기억을 수집하는 자", "두 바퀴의 여행자", "지도를 그리는 자", "길의 연대기", "개척자", "속도의 탐험가", "궤도를 달리는 자", "대륙을 가로지르는 자", "세계의 증인", "세계의 기록자"];
LEVEL_TITLE_I18N.ja = ["道なき者", "痕跡を残す者", "探検者", "道を作る者", "風を歩く者", "記憶を集める者", "二輪の旅人", "地図を描く者", "道の年代記", "開拓者", "速度の探検家", "軌道を走る者", "大陸を横断する者", "世界の証人", "世界の記録者"];
LEVEL_TITLE_I18N.zh = ["无路之人", "留下足迹的人", "探索者", "造路者", "风中行者", "记忆收集者", "双轮旅人", "绘制地图的人", "道路编年史", "开拓者", "速度探索家", "轨道骑行者", "横跨大陆的人", "世界见证者", "世界记录者"];
function getLevelTitle(current) {
    var titles = LEVEL_TITLE_I18N[currentLang] || LEVEL_TITLE_I18N.ko;
    var idx = Math.max(0, (current && current.level ? current.level : 1) - 1);
    return titles[idx] || titles[titles.length - 1] || "";
}
const SPEED_LIMIT_WALK = 7 / 3.6;
const SPEED_LIMIT_BIKE = 30 / 3.6;

// IndexedDB 저장소
const IDB_NAME = "giloa-photos"; const IDB_VERSION = 1; const IDB_STORE = "images"; let idb = null;
function openIdb() { return new Promise(function(resolve, reject) { if (idb) { resolve(idb); return; } var req = indexedDB.open(IDB_NAME, IDB_VERSION); req.onupgradeneeded = function(e) { var db = e.target.result; if (!db.objectStoreNames.contains(IDB_STORE)) { db.createObjectStore(IDB_STORE, { keyPath: "id" }); } }; req.onsuccess = function(e) { idb = e.target.result; resolve(idb); }; req.onerror = function(e) { reject(e.target.error); }; }); }
function idbSavePhoto(id, photo, thumb) { return openIdb().then(function(db) { return new Promise(function(resolve, reject) { var tx = db.transaction(IDB_STORE, "readwrite"); tx.objectStore(IDB_STORE).put({ id: id, photo: photo, thumb: thumb }); tx.oncomplete = resolve; tx.onerror = function(e) { reject(e.target.error); }; }); }); }
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

// 앱 상태 변수
let isRecording = false; let photos = []; let isFogEnabled = true; let isHudExpanded = false;
var MAP_LAYER_DEFAULTS = { library: true, restaurant: false, lodging: false, restroom: false, community: false };
var MAP_LAYER_UNAVAILABLE = {}; // 준비 중 레이어가 생기면 { key: true } 형태로 추가
function loadMapLayerSettings() {
    MAP_LAYER_UNAVAILABLE = { community: true };
    try {
        var raw = localStorage.getItem(MAP_LAYER_KEY);
        var saved = raw ? JSON.parse(raw) : {};
        var settings = Object.assign({}, MAP_LAYER_DEFAULTS, saved);
        Object.keys(MAP_LAYER_UNAVAILABLE).forEach(function(key) { settings[key] = false; });
        return settings;
    } catch (e) { return Object.assign({}, MAP_LAYER_DEFAULTS); }
}
var mapLayerSettings = loadMapLayerSettings();
var librariesLoaded = false;
function saveMapLayerSettings() { localStorage.setItem(MAP_LAYER_KEY, JSON.stringify(mapLayerSettings)); }
let currentPos = null; let pathCoordinates = []; let memories = []; let totalDistance = 0;
let currentUserId = "";
let playerMarker = null; let playerHeading = null; let watchId = null; let saveTimer = null; let rafId = null;
let screenWakeLock = null; let screenWakeLockTimer = null; let screenAwakeUntil = 0; let autoRecordingTimer = null; let trackingRetryTimer = null;
const memoryMarkers = new Map();
let activeGpxId = null; let activeGpxLayers = []; let dialHours = 8;
const STAY_BONUS_MS = 30 * 60 * 1000; const STAY_BONUS_RADIUS_M = 50;
const IMAGE_MISSION_RADIUS_M = 120;
let stayBonusStartTime = null; let stayBonusAnchor = null; let stayBonusLevelBoost = 0; let stayBonusPlaces = [];
let activeImageMission = null;
const NEARBY_RADIUS_M = 300;
const DAILY_TASK_KEY = "giloa-daily-tasks-v1";
const SPECIAL_PIN_KEY = "giloa-special-pins-v1";
let specialPins = [];
let specialPinMarkers = [];
let dailyTaskPanelOpen = false;
let selectedDestination = null;
let lastPhotoMarkerSize = null;
let heicLoaderPromise = null;
const recBtn = document.getElementById("loc-btn");
const recStatusBox = document.getElementById("rec-status-box");

function getNearbyCenter() { return currentPos || map.getCenter(); }
function isWithinNearbyRadius(lat, lng) {
    var center = getNearbyCenter();
    return !!center && center.distanceTo([lat, lng]) <= NEARBY_RADIUS_M;
}
function loadSpecialPins() {
    try { specialPins = JSON.parse(localStorage.getItem(SPECIAL_PIN_KEY) || "[]"); }
    catch (e) { specialPins = []; }
    renderSpecialPins();
}
function saveSpecialPins() { localStorage.setItem(SPECIAL_PIN_KEY, JSON.stringify(specialPins)); }
var SPECIAL_PIN_I18N = {
    ko: { label:"특별한 장소", title:"특별 장소 저장", copy:"현재 위치에 대한 내용을 입력하세요.", placeholder:"장소 이름 또는 메모", cancel:"취소", confirm:"확인" },
    en: { label:"Special Place", title:"Save Special Place", copy:"Add a name or note for your current location.", placeholder:"Place name or note", cancel:"Cancel", confirm:"Save" },
    ja: { label:"特別な場所", title:"特別な場所を保存", copy:"現在地の名前やメモを入力してください。", placeholder:"場所の名前またはメモ", cancel:"キャンセル", confirm:"保存" },
    zh: { label:"特别地点", title:"保存特别地点", copy:"请输入当前位置的名称或备注。", placeholder:"地点名称或备注", cancel:"取消", confirm:"保存" }
};
function applySpecialPinLanguage() {
    var copy = SPECIAL_PIN_I18N[currentLang] || SPECIAL_PIN_I18N.ko;
    setText("special-pin-dialog-title", copy.title);
    setText("special-pin-dialog-copy", copy.copy);
    setText("special-pin-cancel", copy.cancel);
    setText("special-pin-confirm", copy.confirm);
    var input = document.getElementById("special-pin-dialog-input");
    if (input) input.placeholder = copy.placeholder;
}
function renderSpecialPins() {
    specialPinMarkers.forEach(function(marker) { map.removeLayer(marker); });
    specialPinMarkers = [];
    specialPins.forEach(function(pin) {
        var marker = L.marker([pin.lat, pin.lng], { icon: L.divIcon({ className: "", html: '<span class="special-pin-marker"></span>', iconSize:[30,38], iconAnchor:[15,34] }) }).addTo(map);
        var copy = SPECIAL_PIN_I18N[currentLang] || SPECIAL_PIN_I18N.ko;
        marker.bindPopup("<b>" + escapeHtml(copy.label) + "</b><br>" + escapeHtml(pin.note || ""));
        specialPinMarkers.push(marker);
    });
}
function createSpecialPinAtCurrentLocation() {
    if (!currentPos) return;
    applySpecialPinLanguage();
    var dialog = document.getElementById("special-pin-dialog");
    var input = document.getElementById("special-pin-dialog-input");
    if (!dialog || !input) return;
    input.value = "";
    dialog.classList.add("open");
    dialog.setAttribute("aria-hidden","false");
    setTimeout(function() { input.focus(); }, 0);
}
function closeSpecialPinDialog() {
    var dialog = document.getElementById("special-pin-dialog");
    if (dialog) { dialog.classList.remove("open"); dialog.setAttribute("aria-hidden","true"); }
}
function saveSpecialPinFromDialog() {
    var input = document.getElementById("special-pin-dialog-input");
    var note = input ? input.value.trim() : "";
    if (!currentPos || !note) { if (input) input.focus(); return; }
    specialPins.push({ id:String(Date.now()), lat:currentPos.lat, lng:currentPos.lng, note:note, createdAt:Date.now() });
    saveSpecialPins();
    renderSpecialPins();
    closeSpecialPinDialog();
    specialPinMarkers[specialPinMarkers.length - 1].openPopup();
}
function getDailyDateKey() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
}
function loadDailyTaskState() {
    var date = getDailyDateKey();
    try {
        var saved = JSON.parse(localStorage.getItem(DAILY_TASK_KEY) || "null");
        if (saved && saved.date === date) return saved;
    } catch (e) {}
    var state = { date:date, startDistance:totalDistance, startPhotos:photos.length };
    localStorage.setItem(DAILY_TASK_KEY, JSON.stringify(state));
    return state;
}
var DAILY_TASK_I18N = {
    ko: { tag:"할 일", kicker:"오늘의 길로아", title:"오늘의 할 일", description:"가볍게 걸으며 오늘의 길을 남겨보세요.", reset:"매일 자정 초기화", complete:"완료", close:"닫기", newRoad:"새로운 길 100m 가기", walk:"1km 걷기", photo:"사진 1장 찍기", photoUnit:"장" },
    en: { tag:"To-do", kicker:"Today's Giloa", title:"Daily Tasks", description:"Take a light walk and leave today's path.", reset:"Resets daily at midnight", complete:"done", close:"Close", newRoad:"Explore 100m of new paths", walk:"Walk 1 km", photo:"Take 1 photo", photoUnit:"photo" },
    ja: { tag:"やること", kicker:"今日のギロア", title:"今日のタスク", description:"気軽に歩いて、今日の道を残しましょう。", reset:"毎日0時にリセット", complete:"完了", close:"閉じる", newRoad:"新しい道を100m進む", walk:"1km歩く", photo:"写真を1枚撮る", photoUnit:"枚" },
    zh: { tag:"待办", kicker:"今日 Giloa", title:"今日任务", description:"轻松走走，留下今天的道路。", reset:"每天午夜重置", complete:"完成", close:"关闭", newRoad:"探索100米新道路", walk:"步行1公里", photo:"拍摄1张照片", photoUnit:"张" }
};
function updateDailyMissions() {
    var list = document.getElementById("daily-task-list");
    if (!list) return;
    var copy = DAILY_TASK_I18N[currentLang] || DAILY_TASK_I18N.ko;
    var state = loadDailyTaskState();
    var walked = Math.max(0,totalDistance-Number(state.startDistance||0));
    var photoCount = Math.max(0,photos.length-Number(state.startPhotos||0));
    var tasks = [
        {icon:"↗",name:copy.newRoad,now:walked,target:100,value:Math.min(Math.round(walked),100)+"/100m"},
        {icon:"✦",name:copy.walk,now:walked,target:1000,value:(Math.min(walked,1000)/1000).toFixed(1)+"/1km"},
        {icon:"◇",name:copy.photo,now:photoCount,target:1,value:Math.min(photoCount,1)+"/1 "+copy.photoUnit}
    ];
    var complete = tasks.filter(function(t){return t.now>=t.target;}).length;
    list.innerHTML = tasks.map(function(t){
        var pct=Math.min(100,Math.round(t.now/t.target*100)), done=pct>=100;
        return '<div class="daily-task-item'+(done?' done':'')+'"><div class="daily-task-icon">'+(done?'✓':t.icon)+'</div><div><div class="daily-task-name">'+t.name+'</div><div class="daily-task-track"><div class="daily-task-fill" style="width:'+pct+'%"></div></div></div><div class="daily-task-value">'+t.value+'</div></div>';
    }).join("");
    setText("daily-task-tag-label",copy.tag);
    setText("daily-task-kicker",copy.kicker);
    setText("daily-task-title",copy.title);
    setText("daily-task-description",copy.description);
    setText("daily-task-reset",copy.reset);
    var closeButton = document.getElementById("daily-task-close");
    if (closeButton) closeButton.setAttribute("aria-label",copy.close);
    setText("daily-task-tag-count",complete+"/3");
    setText("daily-task-summary",complete+"/3 "+copy.complete);
}
function toggleDailyTasks(force) {
    dailyTaskPanelOpen = typeof force === "boolean" ? force : !dailyTaskPanelOpen;
    var panel=document.getElementById("daily-task-panel"), tag=document.getElementById("daily-task-tag");
    if(panel){panel.classList.toggle("open",dailyTaskPanelOpen);panel.setAttribute("aria-hidden",dailyTaskPanelOpen?"false":"true");}
    if(tag)tag.setAttribute("aria-expanded",dailyTaskPanelOpen?"true":"false");
    if(dailyTaskPanelOpen)updateDailyMissions();
}

// 지??초기??
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
    }, 1500);
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
        if (baseTileErrorCount >= 1 && currentBaseTileIndex < BASE_TILE_LAYERS.length - 1) {
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
        alert("카카오 교통 지도를 불러오지 못했습니다. config.js의 JavaScript 키와 도메인 설정을 확인해 주세요.");
        console.warn(error);
    });
}
function openKakaoDirections() {
    if (!currentPos) {
        alert("현재 위치를 확인한 후 길찾기를 할 수 있습니다.");
        centerMap();
        return;
    }
    var mapCenter = map.getCenter();
    var dest = selectedDestination || (mapCenter ? { lat: mapCenter.lat, lng: mapCenter.lng, name: "목적지" } : null);
    if (!dest || !isFinite(dest.lat) || !isFinite(dest.lng)) {
        alert("목적지를 확인할 수 없습니다.");
        return;
    }
    if (currentPos.distanceTo([dest.lat, dest.lng]) < 15) {
        alert("현재 위치와 목적지가 너무 가깝습니다. 도착할 곳을 선택해 주세요.");
        return;
    }
    var startName = "현재 위치";
    var destName = dest.name || "목적지";
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
        name: String(name || "목적지").trim() || "목적지"
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
map.createPane("communityPane");
map.getPane("communityPane").style.zIndex = 668;
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

const ROUTINE_GRID_M = 10;
const ROUTINE_VISIT_THRESHOLD = 10;
const ROUTINE_PATH_COLOR = "rgba(8, 8, 12, 0.78)";
var routineVisitCache = { signature: "", counts: new Map() };

function getRoutineGridKey(lat, lng) {
    // 위도·경도를 Web Mercator 미터 좌표로 바꿔 실제 10m 격자를 만든다.
    var earthRadius = 6378137;
    var safeLat = Math.max(-85, Math.min(85, lat));
    var x = earthRadius * lng * Math.PI / 180;
    var y = earthRadius * Math.log(Math.tan(Math.PI / 4 + safeLat * Math.PI / 360));
    return Math.floor(x / ROUTINE_GRID_M) + "," + Math.floor(y / ROUTINE_GRID_M);
}

function getSegmentRoutineKeys(from, to) {
    var distance = L.latLng(from.lat, from.lng).distanceTo([to.lat, to.lng]);
    var steps = Math.max(1, Math.ceil(distance / (ROUTINE_GRID_M / 2)));
    var keys = [];
    var lastKey = "";
    for (var i = 0; i <= steps; i++) {
        var ratio = i / steps;
        var key = getRoutineGridKey(
            from.lat + (to.lat - from.lat) * ratio,
            from.lng + (to.lng - from.lng) * ratio
        );
        if (key !== lastKey) { keys.push(key); lastKey = key; }
    }
    return keys;
}

function buildRoutineVisitCounts() {
    var counts = new Map();
    var sessionCells = new Set();
    for (var i = 0; i < pathCoordinates.length; i++) {
        var point = pathCoordinates[i];
        var prev = i > 0 ? pathCoordinates[i - 1] : null;
        var isContinuous = prev && point.startTime - prev.endTime <= GAP_THRESHOLD_MS;
        if (!isContinuous) sessionCells = new Set();
        var keys = isContinuous ? getSegmentRoutineKeys(prev, point) : [getRoutineGridKey(point.lat, point.lng)];
        keys.forEach(function(key) {
            // 같은 연속 이동 중 같은 구간을 여러 GPS 점이 찍어도 방문 1회로 계산한다.
            if (sessionCells.has(key)) return;
            sessionCells.add(key);
            counts.set(key, (counts.get(key) || 0) + 1);
        });
    }
    return counts;
}

function getRoutineVisitCounts() {
    var first = pathCoordinates[0];
    var last = pathCoordinates[pathCoordinates.length - 1];
    var signature = (currentUserId || "local") + "|" + pathCoordinates.length + "|" +
        (first ? [first.lat, first.lng, first.startTime].join("|") : "") + "|" +
        (last ? [last.lat, last.lng, last.startTime, last.endTime].join("|") : "");
    if (routineVisitCache.signature !== signature) {
        routineVisitCache = { signature: signature, counts: buildRoutineVisitCounts() };
    }
    return routineVisitCache.counts;
}

function renderAgeTint() {
    var w = ageCanvas.width, h = ageCanvas.height; ageCtx.clearRect(0, 0, w, h);
    if (pathCoordinates.length === 0) return;
    var now = Date.now(); var mpp = calcMpp(); var radius = metersToPixels(FOG_RADIUS_M, mpp);
    var buckets = new Map();
    var routineCounts = getRoutineVisitCounts();
    pathCoordinates.forEach(function(point, i) {
        if (i === 0) return;
        var previous = pathCoordinates[i - 1];
        var timeGap = point.startTime - previous.endTime;
        if (timeGap > GAP_THRESHOLD_MS) return;
        var segmentKeys = getSegmentRoutineKeys(previous, point);
        var routine = segmentKeys.length > 0 && segmentKeys.every(function(key) {
            return (routineCounts.get(key) || 0) >= ROUTINE_VISIT_THRESHOLD;
        });
        var ageDays = (now - point.startTime) / 86400000;
        var color = routine ? ROUTINE_PATH_COLOR : getAgeColor(ageDays);
        if (!color) return;
        if (!buckets.has(color)) buckets.set(color, []);
        var pos = latLngToCanvasPoint([point.lat, point.lng]);
        var prev = latLngToCanvasPoint([previous.lat, previous.lng]);
        buckets.get(color).push({ x1: prev.x, y1: prev.y, x2: pos.x, y2: pos.y });
    });
    var offCtx = ageScratchCtx;
    buckets.forEach(function(draws, color) {
        offCtx.clearRect(0, 0, w, h);
        offCtx.strokeStyle = color;
        offCtx.lineWidth = color === ROUTINE_PATH_COLOR ? radius * 1.35 : radius * 1.15;
        offCtx.lineCap = "round"; offCtx.lineJoin = "round"; offCtx.beginPath();
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
    var hudLine = (isRecording ? t.rec_active : t.rec_idle) + " · LV " + current.level + " · " + (t.hud_next_level || t.hud_next || "Next") + " " + avgPct + "%";
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

function updateStats() { var todayDist = calcTodayDistance(); var distEl = document.getElementById("dist-val"); var todayEl = document.getElementById("today-dist-val"); var memEl = document.getElementById("memory-count-val"); var photoEl = document.getElementById("photo-count-val"); if (distEl) distEl.innerHTML = (totalDistance / 1000).toFixed(2) + "<span>km</span>"; if (todayEl) todayEl.innerHTML = (todayDist / 1000).toFixed(2) + "<span>km</span>"; if (memEl) memEl.innerHTML = memories.length + "<span>개</span>"; if (photoEl) photoEl.innerHTML = photos.length + "<span>개</span>"; updateHud(); updateDailyMissions(); checkBadges(); }

function toggleHud() { applyHudLang(UI_TEXT[currentLang] || UI_TEXT.ko); isHudExpanded = !isHudExpanded; document.getElementById("hud").classList.toggle("expanded", isHudExpanded); document.getElementById("controls").classList.toggle("hud-open", isHudExpanded); document.getElementById("help-btn").classList.toggle("hud-open", isHudExpanded); if (isHudExpanded) { setTimeout(function() { document.addEventListener("click", handleHudOutsideClick); }, 0); } else { document.removeEventListener("click", handleHudOutsideClick); } }
function handleHudOutsideClick(event) { var hud = document.getElementById("hud"); if (!hud.contains(event.target)) { isHudExpanded = false; hud.classList.remove("expanded"); document.getElementById("controls").classList.remove("hud-open"); document.getElementById("help-btn").classList.remove("hud-open"); document.removeEventListener("click", handleHudOutsideClick); } }
function getStatusText(key, value) {
    var t = UI_TEXT[currentLang] || UI_TEXT.en || UI_TEXT.ko;
    var text = t[key] || (UI_TEXT.en && UI_TEXT.en[key]) || key;
    return typeof value === "undefined" ? text : text.replace("{value}", value);
}
function syncRecordingUI() { var t = UI_TEXT[currentLang] || UI_TEXT.ko; recBtn.classList.toggle("recording", isRecording); recStatusBox.textContent = isRecording ? t.rec_active : t.rec_idle; recStatusBox.classList.toggle("recording", isRecording); updateHud(); syncImageMissionUI(); }
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
function toggleHelp() {
    var popup = document.getElementById("help-popup");
    if (!popup) return;
    var opening = !popup.classList.contains("show");
    if (opening) {
        localStorage.setItem(TUTORIAL_HELP_KNOWN_KEY, "yes");
        syncTutorialHelpHint();
        var sidebar = document.getElementById("sidebar");
        helpGuidePage = sidebar && sidebar.classList.contains("open") ? "menu" : "main";
    }
    applyHelpLang(UI_TEXT[currentLang] || UI_TEXT.ko);
    popup.classList.toggle("show", opening);
    document.body.classList.toggle("help-open", opening);
    if (opening) {
        switchHelpTab("info");
        requestAnimationFrame(function() {
            var content = document.getElementById("help-content-box");
            if (content) content.scrollTop = 0;
        });
    }
}
function handleHelpOverlayClick(event) { var box = document.getElementById("help-content-box"); if (box && !box.contains(event.target)) toggleHelp(); }
var activeHelpTab = "ask";
var localMarketPriceData = { regionName:"현재 지역", sourceName:"공공데이터", updatedAt:null, items:{ meal:10500,cafe:4800,necessities:2500,transport:4800 } };
async function fetchLocalMarketPrices(latitude,longitude) { void latitude; void longitude; return localMarketPriceData; }
function formatLocalPrice(value,lang) { var n=Number(value); if(!isFinite(n))return ""; var text=Math.round(n).toLocaleString(lang==="ko"?"ko-KR":"en-US"); return lang==="ko"?text+"원":"₩"+text; }
function renderLocalMarketPrices(data) {
    var content=document.getElementById("local-market-content"), t=UI_TEXT[currentLang]||UI_TEXT.ko;
    if(!content||!data||!data.items){if(content)content.innerHTML='<div class="local-market-state">'+t.market_empty+'</div>';return;}
    var defs=[["meal","🍽",t.market_meal],["cafe","☕",t.market_cafe],["necessities","▣",t.market_necessities],["transport","↔",t.market_transport]];
    var valid=defs.filter(function(d){return isFinite(Number(data.items[d[0]]));});
    if(!valid.length){content.innerHTML='<div class="local-market-state">'+t.market_empty+'</div>';return;}
    content.innerHTML='<div class="local-market-list">'+valid.map(function(d){return '<div class="local-market-item"><div class="local-market-icon">'+d[1]+'</div><div class="local-market-name">'+d[2]+'</div><div class="local-market-price">'+formatLocalPrice(data.items[d[0]],currentLang)+'</div></div>';}).join("")+'</div>';
}
async function renderLocalMarketPriceTab(){
    var content=document.getElementById("local-market-content"),t=UI_TEXT[currentLang]||UI_TEXT.ko;
    if(content)content.innerHTML='<div class="local-market-state">'+t.market_loading+'</div>';
    try{var data=await fetchLocalMarketPrices(currentPos&&currentPos.lat,currentPos&&currentPos.lng);if(activeHelpTab==="market")renderLocalMarketPrices(data);}catch(e){if(content)content.innerHTML='<div class="local-market-state">'+t.market_empty+'</div>';}
}
function updateLocalMarketPriceLanguage(){
    var t=UI_TEXT[currentLang]||UI_TEXT.ko;
    setText("htab-market",t.help_tab_market);setText("local-market-title",t.market_title);setText("local-market-description",t.market_description);setText("local-market-source",t.market_source);
    if(activeHelpTab==="market")renderLocalMarketPrices(localMarketPriceData);
}
function switchHelpTab(tab) {
    activeHelpTab=["ask","info","market"].indexOf(tab)>=0?tab:"ask";
    applyHelpLang(UI_TEXT[currentLang] || UI_TEXT.ko);
    ["ask","info","market"].forEach(function(name){var a=document.getElementById("htab-"+name),p=document.getElementById("hpanel-"+name);if(a)a.classList.toggle("active",name===activeHelpTab);if(p)p.style.display=name===activeHelpTab?"":"none";});
    if(activeHelpTab==="market")renderLocalMarketPriceTab();
}
function togglePhotoMenu() { triggerGallery(); }

async function triggerGallery() {
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
                    if (recStatusBox) recStatusBox.textContent = "사진 처리 중 " + (i + 1) + "/" + list.length;
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
            console.warn("갤러리 불러오기 실패", e);
        }
    }
    document.getElementById("gallery-input").click();
}
async function openPhotoInGallery(data) {
    var sourceUri = data && (data.remotePhotoUrl || data.sourceUri || data.sourceWebPath);
    if (!sourceUri) {
        alert("원본 사진 경로 정보가 없어 기기 갤러리에서 바로 열 수 없습니다.");
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
        console.warn("원본 열기 실패", e);
        try { window.open(sourceUri, "_blank"); }
        catch (_) { alert("원본 사진을 열지 못했습니다."); }
    }
}
function focusPhotoOnMap(data) {
    setSelectedDestination(data.lat, data.lng, data.dateString || "사진 위치");
    map.flyTo([data.lat, data.lng], 17);
    var markerLayer = findPhotoMarker(data.id);
    if (markerLayer) markerLayer.openPopup();
    toggleSidebar(false);
}
function canUseScreenWakeLock() { return !!(navigator.wakeLock && typeof navigator.wakeLock.request === "function"); }
function requestNativeScreenAwake() { try { if (window.GiloaScreenAwake && typeof window.GiloaScreenAwake.keepScreenOnFor === "function") window.GiloaScreenAwake.keepScreenOnFor(SCREEN_AWAKE_MS); } catch (e) { console.warn("네이티브 화면 유지 실패", e); } }
function releaseNativeScreenAwake() { try { if (window.GiloaScreenAwake && typeof window.GiloaScreenAwake.clearKeepScreenOn === "function") window.GiloaScreenAwake.clearKeepScreenOn(); } catch (e) { console.warn("네이티브 화면 유지 해제 실패", e); } }
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
    } catch (e) { console.warn("화면 켜짐 유지 실패", e); }
}
function releaseScreenAwake() {
    screenAwakeUntil = 0;
    releaseNativeScreenAwake();
    if (screenWakeLockTimer) { clearTimeout(screenWakeLockTimer); screenWakeLockTimer = null; }
    var lock = screenWakeLock;
    screenWakeLock = null;
    if (lock && !lock.released) lock.release().catch(function(e) { console.warn("화면 켜짐 해제 실패", e); });
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
    beginRecording();
}
function beginRecording() {
    if (isRecording) return;
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
function showAutoRecordingNotice() {
    var t = UI_TEXT[currentLang] || UI_TEXT.ko;
    var overlay = document.getElementById("auto-recording-notice");
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "auto-recording-notice";
        overlay.innerHTML = '<div class="auto-recording-box" role="dialog" aria-modal="true"><button class="auto-recording-close" type="button">×</button><div class="auto-recording-title"></div><div class="auto-recording-copy"></div></div>';
        overlay.addEventListener("click", function(e) { if (e.target === overlay) dismissAutoRecordingNotice(); });
        document.body.appendChild(overlay);
        var closeBtn = overlay.querySelector(".auto-recording-close");
        if (closeBtn) closeBtn.addEventListener("click", dismissAutoRecordingNotice);
    }
    overlay.querySelector(".auto-recording-box").setAttribute("aria-label", t.auto_record_title);
    overlay.querySelector(".auto-recording-close").setAttribute("aria-label", t.close);
    overlay.querySelector(".auto-recording-title").textContent = t.auto_record_title;
    overlay.querySelector(".auto-recording-copy").innerHTML = t.auto_record_copy;
    overlay.classList.add("show");
}
function startAutoRecordingOnLaunch() {
    var t = UI_TEXT[currentLang] || UI_TEXT.ko;
    localStorage.setItem(AUTO_RECORD_CONSENT_KEY, "yes");
    showAutoRecordingNotice();
    beginRecording();
}
function toggleFog() { isFogEnabled = !isFogEnabled; localStorage.setItem(FOG_ENABLED_KEY, String(isFogEnabled)); syncFogButton(); scheduleRender(); }
function startTracking() {
    clearTrackingRetryTimer();
    if (!navigator.geolocation) {
        if (recStatusBox) recStatusBox.textContent = (UI_TEXT[currentLang] || UI_TEXT.ko).location_unsupported;
        return;
    }
    if (!window.isSecureContext && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") {
        if (recStatusBox) recStatusBox.textContent = (UI_TEXT[currentLang] || UI_TEXT.ko).https_required;
        return;
    }
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    watchId = navigator.geolocation.watchPosition(handlePosition, handleLocationError, { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 });
    if (recStatusBox && isRecording) recStatusBox.textContent = (UI_TEXT[currentLang] || UI_TEXT.ko).location_waiting;
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
    if (!playerMarker) {
        playerMarker = L.marker(latlng, { pane: "playerPane", icon: L.divIcon({ className: "player-marker", iconSize: [18, 18] }) }).addTo(map);
        playerMarker.on("click", createSpecialPinAtCurrentLocation);
        playerMarker.bindTooltip("현재 위치 · 눌러서 특별한 장소 저장");
        map.setView(latlng, 16);
    }
    else { playerMarker.setLatLng(latlng); }
    updateVisionCone(latlng);
    syncImageMissionUI();
    if (mapLayerSettings.library && librariesLoaded) renderLibraryMarkers(currentLang);
    if (mapLayerSettings.restroom) scheduleRestroomFetch();
    if (typeof tourItems !== "undefined" && Array.isArray(tourItems)) addTourMarkers();
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
    var t = UI_TEXT[currentLang] || UI_TEXT.ko;
    var messages = { 1: t.location_permission, 2: t.location_checking, 3: t.location_retry };
    if (recStatusBox) recStatusBox.textContent = messages[err && err.code] || t.location_waiting;
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
function loadBonusState() { try { var raw = localStorage.getItem("giloa-stay-bonus"); if (!raw) return; var data = JSON.parse(raw); stayBonusLevelBoost = isFinite(data.boost) ? data.boost : 0; stayBonusPlaces = Array.isArray(data.places) ? data.places.filter(function(p) { return isFinite(p.lat) && isFinite(p.lng); }) : []; } catch (e) { console.warn("체류 보너스 복원 실패", e); } }
function calcTodayDistance() { var todayStartMs = new Date().setHours(0, 0, 0, 0); var dist = 0; for (var i = 1; i < pathCoordinates.length; i++) { if (pathCoordinates[i].startTime >= todayStartMs) { dist += L.latLng(pathCoordinates[i].lat, pathCoordinates[i].lng).distanceTo([pathCoordinates[i - 1].lat, pathCoordinates[i - 1].lng]); } } return dist; }

function compactPathData() {
    if (pathCoordinates.length <= 1) return; var merged = [];
    for (var i = 0; i < pathCoordinates.length; i++) { var point = pathCoordinates[i]; var last = merged[merged.length - 1]; if (!last) { merged.push(Object.assign({}, point)); continue; } var timeGap = point.startTime - last.endTime; var dist = L.latLng(point.lat, point.lng).distanceTo([last.lat, last.lng]); if (dist <= MERGE_DISTANCE_M && timeGap <= MERGE_TIME_GAP_MS) { var tv = (last.visits || 1) + (point.visits || 1); last.lat = ((last.lat * (last.visits || 1)) + (point.lat * (point.visits || 1))) / tv; last.lng = ((last.lng * (last.visits || 1)) + (point.lng * (point.visits || 1))) / tv; last.endTime = Math.max(last.endTime, point.endTime); last.visits = tv; } else { merged.push(Object.assign({}, point)); } }
    pathCoordinates = shrinkOldPoints(merged, MAX_PATH_POINTS);
}
function shrinkOldPoints(points, maxPoints) { if (points.length <= maxPoints) return points; var keepTail = Math.floor(maxPoints * 0.4); var tail = points.slice(-keepTail); var head = points.slice(0, points.length - keepTail); var ratio = Math.ceil(head.length / (maxPoints - keepTail)); var filtered = head.filter(function(_, i) { return i % ratio === 0; }); return filtered.concat(tail).slice(-maxPoints); }

function createMemoryMarker(data, openPopup) { var marker = L.marker([data.lat, data.lng], { pane: "memoryPane", icon: L.divIcon({ className: "memory-marker", html: "*", iconSize: [28, 28] }) }).addTo(map); var popupEl = document.createElement("div"); var title = document.createElement("b"); title.textContent = data.name; var info = document.createElement("small"); info.style.display = "block"; info.textContent = data.dateString + " " + (data.timeString || ""); var delBtn = document.createElement("button"); delBtn.className = "popup-delete-btn"; delBtn.textContent = "Delete"; delBtn.addEventListener("click", function() { deleteMemory(data.id); }); popupEl.appendChild(title); popupEl.appendChild(document.createElement("br")); popupEl.appendChild(info); popupEl.appendChild(delBtn); marker.bindPopup(popupEl); marker.on("click", function() { setSelectedDestination(data.lat, data.lng, data.name || "Memory point"); }); memoryMarkers.set(data.id, marker); if (openPopup) { setSelectedDestination(data.lat, data.lng, data.name || "Memory point"); marker.openPopup(); } }
function deleteMemory(id) { if (!confirmDelete("memory")) return; memories = memories.filter(function(m) { return m.id !== id; }); var marker = memoryMarkers.get(id); if (marker) { map.removeLayer(marker); memoryMarkers.delete(id); } updateMemoryList(); updateStats(); scheduleSave(); }
function updateMemoryList() { var container = document.getElementById("memory-list-container"); if (!container) return; var t = UI_TEXT[currentLang] || UI_TEXT.ko; if (memories.length === 0) { container.innerHTML = '<p class="empty-message">' + t.empty_memory + '</p>'; return; } container.innerHTML = ""; memories.slice().reverse().forEach(function(memo) { var item = document.createElement("div"); item.className = "memory-item"; var name = document.createElement("span"); name.className = "item-name"; name.textContent = memo.name; var date = document.createElement("span"); date.className = "item-date"; date.textContent = memo.dateString + " " + (memo.timeString || ""); var actions = document.createElement("div"); actions.className = "memory-actions"; var moveBtn = document.createElement("button"); moveBtn.className = "memory-action-btn move"; moveBtn.textContent = t.move || "이동"; moveBtn.addEventListener("click", function(e) { e.stopPropagation(); setSelectedDestination(memo.lat, memo.lng, memo.name || "기억한 장소"); map.flyTo([memo.lat, memo.lng], 17); }); var delBtn = document.createElement("button"); delBtn.className = "memory-action-btn delete"; delBtn.textContent = t.delete || "삭제"; delBtn.addEventListener("click", function(e) { e.stopPropagation(); deleteMemory(memo.id); }); actions.appendChild(moveBtn); actions.appendChild(delBtn); item.appendChild(name); item.appendChild(date); item.appendChild(actions); item.addEventListener("click", function() { setSelectedDestination(memo.lat, memo.lng, memo.name || "기억한 장소"); map.flyTo([memo.lat, memo.lng], 17); toggleSidebar(false); }); container.appendChild(item); }); }
// 모든 탭 전환
var ALL_TABS = ["photo", "gpx", "visit", "item"];
function switchAllTab(tab) {
    if (tab === "badge") tab = "item";
    ALL_TABS.forEach(function(t) {
        var tabEl = document.getElementById("tab-" + t);
        var panelEl = document.getElementById("panel-" + t);
        if (tabEl) tabEl.classList.toggle("active", t === tab);
        if (panelEl) panelEl.style.display = t === tab ? "" : "none";
    });
    if (tab === "photo") updatePhotoList();
    if (tab === "gpx") updateGpxSavedList();
    if (tab === "visit") updateVisitList();
    if (tab === "item") updateItemList();
}
function switchTab(tab) { switchAllTab(tab); }
function updatePhotoList() { var container = document.getElementById("photo-list-container"); if (!container) return; var t = UI_TEXT[currentLang] || UI_TEXT.ko; if (photos.length === 0) { container.innerHTML = '<p class="empty-message" style="grid-column:1/-1">' + t.empty_photo + '</p>'; return; } container.innerHTML = ""; photos.slice().reverse().forEach(function(p) { var item = document.createElement("div"); item.className = "photo-list-item"; var img = document.createElement("img"); img.src = p.thumb || p.photo || p.remoteThumbUrl || p.remotePhotoUrl; var date = document.createElement("div"); date.className = "photo-list-date"; date.textContent = p.dateString; var del = document.createElement("div"); del.className = "photo-list-del"; del.textContent = "×"; del.addEventListener("click", function(e) { e.stopPropagation(); deletePhoto(p.id); updatePhotoList(); }); item.addEventListener("click", function() { focusPhotoOnMap(p); }); item.addEventListener("dblclick", function(e) { e.preventDefault(); openPhotoInGallery(p); }); item.addEventListener("contextmenu", function(e) { e.preventDefault(); focusPhotoOnMap(p); }); item.title = t.view_on_map || "지도에서 보기"; item.appendChild(img); item.appendChild(date); item.appendChild(del); container.appendChild(item); }); }
function findPhotoMarker(id) { var found = null; photoClusterGroup.eachLayer(function(layer) { if (layer._photoData && layer._photoData.id === id) found = layer; }); return found; }
function adjustHourDial(dir) { var next = dialHours + dir; if (next < 1 || next > 8) return; dialHours = next; updateDialUI(); }
function updateDialUI() { var labelEl = document.getElementById("dial-hour-label"); var infoEl = document.getElementById("gpx-range-info"); if (labelEl) labelEl.textContent = dialHours + "h"; if (infoEl) infoEl.textContent = "Recent " + dialHours + " hour route"; }
function buildGpxContent(name, points) { var trkpts = points.map(function(p) { var t = new Date(p.startTime).toISOString(); return '    <trkpt lat="' + p.lat.toFixed(7) + '" lon="' + p.lng.toFixed(7) + '">\n      <time>' + t + '</time>\n    </trkpt>'; }).join("\n"); return '<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="Giloa"\n     xmlns="http://www.topografix.com/GPX/1/1">\n  <metadata><name>' + escapeXml(name) + '</name><time>' + new Date().toISOString() + '</time></metadata>\n  <trk><name>' + escapeXml(name) + '</name><trkseg>\n' + trkpts + '\n  </trkseg></trk>\n</gpx>'; }
function escapeXml(value) { return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;"); }
function saveGpxRecord(name, points, options) { options = options || {}; if (!Array.isArray(points) || points.length === 0) return null; var gpxContent = buildGpxContent(name, points); var saves = loadGpxSaves(); var id = String(Date.now()) + Math.random().toString(36).slice(2); saves.push({ id: id, name: name, createdAt: Date.now(), pointCount: points.length, gpxContent: gpxContent }); saveGpxSaves(saves); updateGpxSavedList(); if (options.download) { var blob = new Blob([gpxContent], { type: "application/gpx+xml" }); var url = URL.createObjectURL(blob); var a = document.createElement("a"); a.href = url; a.download = "giloa_" + name + ".gpx"; a.click(); URL.revokeObjectURL(url); } return id; }
function loadGpxSaves() { try { return JSON.parse(localStorage.getItem(GPX_SAVES_KEY) || "[]"); } catch(e) { return []; } }
function saveGpxSaves(saves) { try { localStorage.setItem(GPX_SAVES_KEY, JSON.stringify(saves)); } catch (e) { console.error("발걸음 저장 실패", e); if (e && e.name === "QuotaExceededError") alert("저장 공간이 부족해 발걸음을 저장하지 못했습니다. 오래된 발걸음을 삭제해 주세요."); } }
function deleteGpxSave(id) { if (!confirmDelete("gpx")) return; if (id === activeGpxId) clearActiveGpxRoute(); saveGpxSaves(loadGpxSaves().filter(function(s) { return s.id !== id; })); updateGpxSavedList(); }
function toggleGpxRoute(save) { if (activeGpxId === save.id) { clearActiveGpxRoute(); updateGpxSavedList(); return; } clearActiveGpxRoute(); drawGpxRoute(save.gpxContent, save.id); updateGpxSavedList(); toggleSidebar(false); }
function clearActiveGpxRoute() { activeGpxLayers.forEach(function(l) { map.removeLayer(l); }); activeGpxLayers = []; activeGpxId = null; }
function getGpxText() {
    var lang = normalizeLang(currentLang);
    var map = {
        ko: { empty: "저장된 발걸음이 없습니다.", showing: "표시 중", route: "경로", point: "개 지점", deleteText: "삭제", noPoints: "해당 시간에 기록된 발걸음이 없습니다.", defaultName: "최근 {hours}시간 발걸음", saved: "\"{name}\" 저장 완료", reading: "읽는 중...", noRoute: "경로 없음", imported: "\"{name}\" 불러오기 완료", readFailed: "파일을 읽지 못했습니다.", start: "출발", end: "도착" },
        en: { empty: "No saved routes yet.", showing: "Showing", route: "Route", point: " points", deleteText: "Delete", noPoints: "No steps were recorded in this time range.", defaultName: "Recent {hours} hour route", saved: "\"{name}\" saved", reading: "Reading...", noRoute: "No route found", imported: "\"{name}\" imported", readFailed: "Could not read the file.", start: "Start", end: "End" },
        ja: { empty: "保存した足跡はまだありません。", showing: "表示中", route: "経路", point: "地点", deleteText: "削除", noPoints: "この時間帯に記録された足跡はありません。", defaultName: "最近{hours}時間の足跡", saved: "\"{name}\" を保存しました", reading: "読み込み中...", noRoute: "経路がありません", imported: "\"{name}\" を読み込みました", readFailed: "ファイルを読み込めませんでした。", start: "出発", end: "到着" },
        zh: { empty: "还没有保存的足迹。", showing: "显示中", route: "路线", point: "个地点", deleteText: "删除", noPoints: "这个时间段没有记录足迹。", defaultName: "最近{hours}小时足迹", saved: "\"{name}\" 已保存", reading: "读取中...", noRoute: "没有路线", imported: "\"{name}\" 已导入", readFailed: "无法读取文件。", start: "出发", end: "到达" }
    };
    return map[lang] || map.ko;
}
function formatGpxText(template, values) {
    return String(template || "").replace(/\{(\w+)\}/g, function(_, key) { return values && values[key] != null ? values[key] : ""; });
}
function exportGpx() {
    var g = getGpxText();
    var sinceMs = Date.now() - dialHours * 60 * 60 * 1000;
    var filtered = pathCoordinates.filter(function(p) { return p.startTime >= sinceMs; });
    if (filtered.length === 0) { alert(g.noPoints); return; }
    var input = document.getElementById("gpx-export-name");
    var status = document.getElementById("gpx-import-status");
    var nameInput = input ? input.value.trim() : "";
    var name = nameInput || formatGpxText(g.defaultName, { hours: dialHours });
    saveGpxRecord(name, filtered, { download: true });
    if (input) input.value = "";
    if (status) status.textContent = formatGpxText(g.saved, { name: name });
}
function updateGpxSavedList() {
    var container = document.getElementById("gpx-saved-list");
    if (!container) return;
    var g = getGpxText();
    var saves = loadGpxSaves();
    if (saves.length === 0) {
        container.innerHTML = '<p class="empty-message">' + g.empty + '</p>';
        return;
    }
    container.innerHTML = "";
    saves.slice().reverse().forEach(function(s) {
        var item = document.createElement("div");
        item.className = "gpx-saved-item" + (s.id === activeGpxId ? " active-route" : "");
        var icon = document.createElement("span");
        icon.className = "gpx-saved-icon";
        icon.textContent = s.id === activeGpxId ? g.showing : g.route;
        var info = document.createElement("div");
        info.className = "gpx-saved-info";
        var nameEl = document.createElement("div");
        nameEl.className = "gpx-saved-name";
        nameEl.textContent = s.name;
        var meta = document.createElement("div");
        meta.className = "gpx-saved-meta";
        meta.textContent = new Date(s.createdAt).toLocaleDateString() + " · " + s.pointCount + g.point;
        info.appendChild(nameEl);
        info.appendChild(meta);
        var del = document.createElement("div");
        del.className = "gpx-saved-del";
        del.textContent = g.deleteText;
        del.addEventListener("click", function(e) { e.stopPropagation(); deleteGpxSave(s.id); });
        item.appendChild(icon);
        item.appendChild(info);
        item.appendChild(del);
        item.addEventListener("click", function() { toggleGpxRoute(s); });
        container.appendChild(item);
    });
}
function drawGpxRoute(gpxContent, id) {
    var g = getGpxText();
    var parser = new DOMParser();
    var xmlDoc = parser.parseFromString(gpxContent, "application/xml");
    var trkpts = xmlDoc.querySelectorAll("trkpt");
    var latlngs = [];
    trkpts.forEach(function(pt) {
        var lat = parseFloat(pt.getAttribute("lat"));
        var lng = parseFloat(pt.getAttribute("lon"));
        if (isFinite(lat) && isFinite(lng)) latlngs.push([lat, lng]);
    });
    if (latlngs.length === 0) return;
    var polyline = L.polyline(latlngs, { color: "#4db8ff", weight: 4, opacity: 0.85, dashArray: "8, 6" }).addTo(map);
    var startM = L.circleMarker(latlngs[0], { radius: 7, color: "#4db8ff", fillColor: "#fff", fillOpacity: 1, weight: 2.5 }).addTo(map).bindTooltip(g.start);
    var endM = L.circleMarker(latlngs[latlngs.length - 1], { radius: 7, color: "#ff6b6b", fillColor: "#fff", fillOpacity: 1, weight: 2.5 }).addTo(map).bindTooltip(g.end);
    activeGpxLayers = [polyline, startM, endM];
    activeGpxId = id;
    map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
}
function importGpxFile(event) {
    var file = event.target.files[0];
    if (!file) return;
    var g = getGpxText();
    var statusEl = document.getElementById("gpx-import-status");
    if (statusEl) statusEl.textContent = g.reading;
    var reader = new FileReader();
    reader.onload = function(e) {
        try {
            var name = file.name.replace(/\.gpx$/i, "");
            var gpxContent = e.target.result;
            var trkpts = new DOMParser().parseFromString(gpxContent, "application/xml").querySelectorAll("trkpt");
            if (trkpts.length === 0) {
                if (statusEl) statusEl.textContent = g.noRoute;
                return;
            }
            var saves = loadGpxSaves();
            var id = String(Date.now());
            saves.push({ id: id, name: name, createdAt: Date.now(), pointCount: trkpts.length, gpxContent: gpxContent });
            saveGpxSaves(saves);
            clearActiveGpxRoute();
            drawGpxRoute(gpxContent, id);
            updateGpxSavedList();
            if (statusEl) statusEl.textContent = formatGpxText(g.imported, { name: name });
            toggleSidebar(false);
        } catch (err) {
            if (statusEl) statusEl.textContent = g.readFailed;
            console.error(err);
        }
    };
    reader.readAsText(file);
    event.target.value = "";
}
function toggleSidebar(forceOpen) { var sidebar = document.getElementById("sidebar"); var overlay = document.getElementById("sidebar-overlay"); if (!sidebar || !overlay) return; var willOpen = typeof forceOpen === "boolean" ? forceOpen : !sidebar.classList.contains("open"); sidebar.classList.toggle("open", willOpen); overlay.classList.toggle("show", willOpen); }
function centerMap() { focusCurrentLocation(); }
function scheduleSave() { if (saveTimer !== null) clearTimeout(saveTimer); saveTimer = setTimeout(function() { saveTimer = null; compactPathData(); persistState(); }, SAVE_DELAY_MS); }
function getLocalStorageKey() { return currentUserId ? STORAGE_KEY + ":" + currentUserId : STORAGE_KEY; }
async function uploadPhotoRemote(data, options) {
    return Promise.resolve();
}
function deleteRemotePhotoFiles(photo) {
    return;
}
function normalizeUserId(value) { return String(value || "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 64); }
// 사용자 프로필 (로컬 전용)
// 로그인 모달은 제거됨. 저장된 아이디가 있으면 그대로 쓰고, 없으면 "local"로 시작한다.
// 아이디는 localStorage 기록의 네임스페이스(giloa-v7:아이디)로만 쓰인다.
async function ensureUserId() {
    var saved = normalizeUserId(localStorage.getItem(USER_ID_KEY));
    currentUserId = saved || "local";
    localStorage.setItem(USER_ID_KEY, currentUserId);
    syncUserIdUI();
}
function syncUserIdUI() {
    var idEl = document.getElementById("hud-user-id");
    if (idEl) idEl.textContent = currentUserId || "아이디 없음";
}
async function changeUserId() {
    var input = prompt("사용할 아이디를 입력하세요. (영문, 숫자, _, - / 기록은 아이디별로 이 기기 안에 저장됩니다)", currentUserId || "");
    if (input === null) return;
    var nextId = normalizeUserId(input);
    if (!nextId || nextId === currentUserId) return;
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
        console.error("저장 실패", e);
        if (e && e.name === "QuotaExceededError") alert("저장 공간이 부족합니다.");
    }
}

function loadState() {
    try {
        var raw = localStorage.getItem(getLocalStorageKey()) || localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        applyStatePayload(JSON.parse(raw));
    } catch (e) {
        console.error("복원 실패", e);
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
        script.onload = function() { window.tf ? resolve(window.tf) : reject(new Error("TensorFlow.js 로드 실패")); };
        script.onerror = function() { reject(new Error("TensorFlow.js 파일을 불러오지 못했습니다.")); };
        document.head.appendChild(script);
    });
}
async function loadImageClassifier() {
    if (imageClassifierPromise) return imageClassifierPromise;
    imageClassifierPromise = Promise.all([
        ensureTf(),
        fetch(IMAGE_CLASSIFIER_METADATA_URL).then(function(res) {
            if (!res.ok) throw new Error("이미지 모델 메타데이터 로드 실패");
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
        var label = bundle.labels[bestIndex] || "알 수 없음";
        var probability = values[bestIndex] || 0;
        return {
            label: label,
            probability: probability,
            percent: Math.round(probability * 1000) / 10,
            accepted: probability >= IMAGE_CLASSIFIER_THRESHOLD,
            badgeId: probability >= IMAGE_CLASSIFIER_THRESHOLD ? IMAGE_CLASS_BADGES[label] || "" : ""
        };
    } catch (e) {
        console.warn("이미지 식별 실패", e);
        return null;
    }
}
function awardImagePredictionBadge(prediction) {
    if (!prediction || !prediction.accepted || !prediction.badgeId) return false;
    earnBadge(prediction.badgeId);
    return true;
}

// 사진 처리
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
    idbSavePhoto(id, popup, thumb).catch(function(e) { console.warn("IDB 저장 실패", e); });
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
            else reject(new Error("exifr 로드 실패"));
        };
        script.onerror = function() { reject(new Error("exifr 스크립트 로드 실패")); };
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
        console.warn("EXIF GPS 추출 실패", e);
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
        script.src = "./vendor/heic2any.min.js";
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
                try { gps = await getPhotoExifGps(file); } catch (e) { console.warn("EXIF GPS 읽기 실패:", file.name, e); }
            }
            var lat = gps ? gps.lat : (currentPos ? currentPos.lat : map.getCenter().lat);
            var lng = gps ? gps.lng : (currentPos ? currentPos.lng : map.getCenter().lng);
            var normalizedFile = await convertHeicToJpegFile(file);
            var img = await loadImageFromFile(normalizedFile);
            var imagePrediction = await classifyImportedImage(img);
            var importedPhoto = processPhoto(img, new Date(), lat, lng, { deferUi: true, openPopup: files.length === 1, originalBlob: normalizedFile, sourceType: "file-input", locationSource: gps ? "exif" : "fallback", imagePrediction: imagePrediction, mission: activeImageMission ? { name: activeImageMission.name } : null });
            if (importedPhoto) setSelectedDestination(importedPhoto.lat, importedPhoto.lng, importedPhoto.dateString || "사진 위치");
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
        if (photos.length) focusPhotoOnMap(photos[photos.length - 1]);
    }
    event.target.value = "";
    syncRecordingUI();
    if (failedCount > 0) alert("일부 사진(" + failedCount + "개)을 처리하지 못했습니다.");
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
    img.title = "누르면 원본 사진 열기";
    img.addEventListener("click", function(e) {
        e.stopPropagation();
        openPhotoInGallery(data);
    });
    var info = document.createElement("div");
    info.style.cssText = "font-size:12px;color:rgba(255,255,255,0.6);text-align:center;margin:6px 0 8px;";
    info.textContent = data.dateString + " " + data.timeString;
    var predictionInfo = null;
    if (data.imagePrediction && data.imagePrediction.label) {
        predictionInfo = document.createElement("div");
        predictionInfo.className = data.imagePrediction.accepted ? "photo-ai-result accepted" : "photo-ai-result";
        predictionInfo.textContent = data.imagePrediction.label + " " + (data.imagePrediction.percent || 0) + "%";
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
    var locationLabel = data.locationSource === "exif" ? "EXIF 촬영 위치" : "현재 위치 기준";
    note.textContent = locationLabel + " · 사진을 누르면 갤러리에서 열립니다.";
    popupEl.appendChild(note);
    popupEl.appendChild(delBtn);
    marker.bindPopup(popupEl);
    photoClusterGroup.addLayer(marker);
    if (openPopup) marker.openPopup();
}
function deletePhoto(id) { if (!confirmDelete("photo")) return; var photo = photos.find(function(p) { return p.id === id; }); deleteRemotePhotoFiles(photo); photos = photos.filter(function(p) { return p.id !== id; }); var marker = findPhotoMarker(id); if (marker) photoClusterGroup.removeLayer(marker); idbDeletePhoto(id).catch(function(e) { console.warn("IDB 삭제 실패", e); }); updateStats(); updatePhotoList(); scheduleSave(); }
function escapeHtml(value) { return String(value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"); }
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
    }).catch(function(e) { console.warn("IDB 불러오기 실패", e); });
}
function initGpxDial() { dialHours = 8; updateDialUI(); }
function initHudTapTargets() { var hud = document.getElementById("hud"); var handle = document.getElementById("hud-handle"); var distItem = document.querySelector(".hud-prog-item:nth-child(1)"); var photoItem = document.querySelector(".hud-prog-item:nth-child(3)"); if (hud && !hud.dataset.stopBound) { hud.dataset.stopBound = "1"; ["click", "pointerdown"].forEach(function(type) { hud.addEventListener(type, function(e) { e.stopPropagation(); }, { passive: true }); }); } if (handle) { handle.style.cursor = "pointer"; } if (distItem) { distItem.style.cursor = "pointer"; distItem.addEventListener("click", function() { toggleSidebar(true); switchTab("gpx"); }); } if (photoItem) { photoItem.style.cursor = "pointer"; photoItem.addEventListener("click", function() { toggleSidebar(true); switchTab("photo"); }); } }

async function init() {
    resizeCanvas();
    await locationPermissionPromise.catch(function() {});
    await ensureUserId();
    loadState();
    loadBonusState();
    loadCollection();
    loadSpecialPins();
    renderStoredMarkers();
    migratePhotosToThumbOnly().finally(function() { renderStoredPhotoMarkers(); });
    updateStats();
    updateDailyMissions();
    updateMemoryList();
    syncRecordingUI();
    syncFogButton();
    applyUILang(currentLang);
    setTimeout(function() { render(); scheduleRender(); }, 100);
    initGpxDial();
    initHudTapTargets();
    startAutoRecordingOnLaunch();
    setTimeout(function() {
        if (localStorage.getItem(TUTORIAL_SEEN_KEY) !== "yes") startTutorial();
        syncTutorialHelpHint();
    }, 1000);
}
map.whenReady(function() { setTimeout(init, 0); });

// TourAPI 관광지 추천
var TOUR_API_KEY = window.GILOA_TOUR_API_KEY || "";
var TOUR_API_BASES = { ko: "KorService2", en: "EngService2", ja: "JpnService2", zh: "ChsService2" };
function getTourApiBase(lang) { return "https://apis.data.go.kr/B551011/" + (TOUR_API_BASES[lang || currentLang] || TOUR_API_BASES.ko); }
function getTourEndpoint(path, lang) { return getTourApiBase(lang) + "/" + path; }
function formatTourCount(count) { var suffix = ((UI_TEXT[currentLang] || UI_TEXT.ko).count_suffix); return currentLang === "ko" || currentLang === "ja" || currentLang === "zh" ? String(count) + suffix : String(count) + " " + suffix; }
var tourItems = []; var festivalItems = []; var tourExpanded = false;
var tourFetchTimer = null; var tourMarkers = []; var TOUR_VISIBLE_COUNT = 3;
var tourRequestSeq = 0; var festivalRequestSeq = 0;

function needsTourTranslation(items, lang) {
    lang = normalizeLang(lang);
    if (lang === "ko") return false;
    return (items || []).some(function(item) {
        if (!item) return false;
        var sourceLang = normalizeLang(item._sourceLang || (hasHangul(item.title || item.addr1) ? "ko" : "en"));
        if (sourceLang === lang) return false;
        return !!((item.title && !(item._titleByLang && item._titleByLang[lang])) ||
            (item.addr1 && !(item._addrByLang && item._addrByLang[lang])));
    });
}
var TOUR_TYPE_NAMES = {
    ko: { "12": "관광지", "14": "문화시설", "15": "축제", "25": "여행코스", "28": "레포츠", "32": "숙박", "38": "쇼핑", "39": "음식점" },
    en: { "12": "Attraction", "14": "Culture", "15": "Festival", "25": "Course", "28": "Leports", "32": "Stay", "38": "Shopping", "39": "Food" },
    ja: { "12": "観光地", "14": "文化施設", "15": "祭り", "25": "旅行コース", "28": "レポーツ", "32": "宿泊", "38": "ショッピング", "39": "グルメ" },
    zh: { "12": "景点", "14": "文化设施", "15": "节庆", "25": "旅行路线", "28": "休闲运动", "32": "住宿", "38": "购物", "39": "美食" }
};
var TOUR_TYPE_LABELS = {
    ko: { "25": "코스", "28": "레포츠", "38": "쇼핑", "15": "축제", "12": "관광", "14": "문화", "32": "숙박", "39": "음식", default: "장소" },
    en: { "25": "Course", "28": "Leports", "38": "Shop", "15": "Fest", "12": "Spot", "14": "Culture", "32": "Stay", "39": "Food", default: "Spot" },
    ja: { "25": "コース", "28": "レポーツ", "38": "買い物", "15": "祭り", "12": "観光", "14": "文化", "32": "宿泊", "39": "グルメ", default: "場所" },
    zh: { "25": "路线", "28": "运动", "38": "购物", "15": "节庆", "12": "景点", "14": "文化", "32": "住宿", "39": "美食", default: "地点" }
};
function getTourTypeName(contentTypeId) { var names = TOUR_TYPE_NAMES[currentLang] || TOUR_TYPE_NAMES.ko; return names[String(contentTypeId)] || names["12"]; }
function getTourTypeLabel(contentTypeId) { var labels = TOUR_TYPE_LABELS[currentLang] || TOUR_TYPE_LABELS.ko; return labels[String(contentTypeId)] || labels.default; }
var TOUR_TYPE_META = {
    "25": { label: "코스", color: "#ef4444", fill: "rgba(239,68,68,0.18)", border: "rgba(239,68,68,0.55)" },
    "28": { label: "레포츠", color: "#38bdf8", fill: "rgba(56,189,248,0.18)", border: "rgba(56,189,248,0.55)" },
    "38": { label: "쇼핑", color: "#facc15", fill: "rgba(250,204,21,0.18)", border: "rgba(250,204,21,0.58)" },
    "15": { label: "축제", color: "#c084fc", fill: "rgba(192,132,252,0.18)", border: "rgba(192,132,252,0.58)" },
    "12": { label: "관광", color: "#fb923c", fill: "rgba(251,146,60,0.18)", border: "rgba(251,146,60,0.58)" },
    "14": { label: "문화", color: "#a78bfa", fill: "rgba(167,139,250,0.18)", border: "rgba(167,139,250,0.58)" },
    "32": { label: "숙박", color: "#2dd4bf", fill: "rgba(45,212,191,0.18)", border: "rgba(45,212,191,0.58)" },
    "39": { label: "음식", color: "#f472b6", fill: "rgba(244,114,182,0.18)", border: "rgba(244,114,182,0.58)" },
    default: { label: "Spot", color: "#fb923c", fill: "rgba(251,146,60,0.18)", border: "rgba(251,146,60,0.58)" }
};
function getTourTypeMeta(contentTypeId) { var meta = TOUR_TYPE_META[String(contentTypeId)] || TOUR_TYPE_META.default; return Object.assign({}, meta, { label: getTourTypeLabel(contentTypeId) }); }
function isTourItemVisible(item) {
    var typeId = String(item && item.contenttypeid);
    if (typeId === "39") return !!mapLayerSettings.restaurant;
    if (typeId === "32") return !!mapLayerSettings.lodging;
    return true;
}
function getVisibleTourItems() {
    return tourItems.filter(function(item) {
        return isTourItemVisible(item) && isWithinNearbyRadius(item.mapy, item.mapx);
    });
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
    var buildUrl = function(lang) { return getTourEndpoint("searchFestival2", lang) + "?serviceKey=" + TOUR_API_KEY + "&eventStartDate=" + today + "&mapX=" + center.lng.toFixed(6) + "&mapY=" + center.lat.toFixed(6) + "&radius=50000" + "&numOfRows=20&pageNo=1&MobileOS=ETC&MobileApp=Giloa&_type=json&arrange=E"; };
    fetchTourJsonWithFallback(buildUrl, requestLang).then(function(data) {
        if (requestSeq !== festivalRequestSeq || requestLang !== currentLang) return;
        var body = data && data.response && data.response.body;
        var items = [];
        if (body && body.items && body.items.item) { items = Array.isArray(body.items.item) ? body.items.item : [body.items.item]; }
        festivalItems = items; markTourItemsSource(festivalItems, data._giloaSourceLang || requestLang); translateTourItemsForLang(currentLang, festivalItems);
        updateFestivalBadge();
        if (tourExpanded) renderFestivalStrip();
    }).catch(function(err) { if (requestSeq !== festivalRequestSeq || requestLang !== currentLang) return; showAppNotice((UI_TEXT[currentLang] || UI_TEXT.ko).festival_api_error, "error"); console.warn("축제 API 오류", err); });
}

function updateFestivalBadge() {
    var badge = document.getElementById("tour-festival-badge");
    if (!badge) return;
    var nearbyCount = festivalItems.filter(function(item) { return isWithinNearbyRadius(item.mapy, item.mapx); }).length;
    if (nearbyCount > 0) { badge.textContent = (UI_TEXT[currentLang] || UI_TEXT.ko).festival_badge + " " + nearbyCount; badge.classList.add("show"); }
    else { badge.classList.remove("show"); }
}

function renderFestivalStrip() {
    var label = document.getElementById("festival-strip-label");
    var strip = document.getElementById("festival-strip");
    if (!strip || !label) return;
    var nearbyFestivalItems = festivalItems.filter(function(item) { return isWithinNearbyRadius(item.mapy, item.mapx); });
    if (nearbyFestivalItems.length === 0) { strip.classList.remove("show"); label.classList.remove("show"); return; }
    strip.innerHTML = "";
    var center = map.getCenter();
    nearbyFestivalItems.forEach(function(item) {
        var card = document.createElement("div"); card.className = "festival-card"; applyTourTypeVars(card, getTourTypeMeta("15"));
        var typeEl = document.createElement("div"); typeEl.className = "tour-card-type"; typeEl.textContent = getTourTypeName("15");
        var nameEl = document.createElement("div"); nameEl.className = "festival-card-name"; nameEl.textContent = getTourDisplayTitle(item) || "축제";
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
    var bounds = map.getBounds(); var center = map.getCenter(); var ne = bounds.getNorthEast();
    var radiusM = Math.round(center.distanceTo(ne)); radiusM = Math.max(500, Math.min(radiusM, 20000));
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
    }).catch(function(err) { if (requestSeq !== tourRequestSeq || requestLang !== currentLang) return; loadingEl.style.display = "none"; emptyEl.style.display = ""; emptyEl.textContent = (UI_TEXT[currentLang] || UI_TEXT.ko).tour_api_error; countEl.textContent = ""; console.warn("TourAPI 오류", err); });
}

function fetchTourJsonWithFallback(buildUrl, lang) {
    // 항상 한국어(KorService2)로 1회만 요청하고 앱에서 배치 번역한다.
    // 외국어 엔드포인트는 데이터가 적어 "빈 응답 → 한국어 재요청"의 이중 왕복이 자주 생겨
    // 언어 전환이 느려지는 주원인이었다.
    lang = normalizeLang(lang);
    function request(requestLang) {
        return fetch(buildUrl(requestLang)).then(function(res) {
            if (!res.ok) throw new Error("TourAPI HTTP " + res.status);
            return res.json();
        }).then(function(data) {
            if (data && typeof data === "object") data._giloaSourceLang = requestLang;
            return data;
        });
    }
    if (lang === "ko") return request("ko");
    return request(lang).catch(function() { return request("ko"); });
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
    var overview = stripTourHtml(detail.overview);
    if (overview) lines.push({ key: "overview", text: overview });
    var labelsByLang = {
        ko: { eventstartdate: "행사 시작", eventenddate: "행사 종료", playtime: "시간", eventplace: "장소", sponsor1: "주최", usetimefestival: "요금", infocenter: "문의", restdate: "휴무", usetime: "이용시간" },
        en: { eventstartdate: "Starts", eventenddate: "Ends", playtime: "Time", eventplace: "Place", sponsor1: "Host", usetimefestival: "Fee", infocenter: "Contact", restdate: "Closed", usetime: "Hours" },
        ja: { eventstartdate: "開始日", eventenddate: "終了日", playtime: "時間", eventplace: "場所", sponsor1: "主催", usetimefestival: "料金", infocenter: "問い合わせ", restdate: "休業日", usetime: "利用時間" },
        zh: { eventstartdate: "开始日期", eventenddate: "结束日期", playtime: "时间", eventplace: "地点", sponsor1: "主办", usetimefestival: "费用", infocenter: "咨询", restdate: "休息日", usetime: "开放时间" }
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
        var value = stripTourHtml(detail[key]);
        if (value) lines.push({ key: key, text: (labels[key] || key) + ": " + value });
    });
    return lines;
}
function translateTourDetailLines(item, detail) {
    var lang = currentLang;
    var sourceLang = normalizeLang((detail && detail._sourceLang) || item._sourceLang || (hasHangul(detail && detail.overview) ? "ko" : lang));
    var lines = getTourDetailLines(detail);
    if (sourceLang === lang) return Promise.resolve(lines.map(function(line) { return line.text; }));
    return translateTexts(lines.map(function(line) { return line.text; }), getTranslateLang(sourceLang), getTranslateLang(lang));
}
function getTourPopupText() {
    var lang = normalizeLang(currentLang);
    var map = {
        ko: { tel: "전화", loading: "상세 정보를 불러오는 중...", none: "상세 정보가 없습니다." },
        en: { tel: "Tel", loading: "Loading details...", none: "No details available." },
        ja: { tel: "電話", loading: "詳細情報を読み込み中...", none: "詳細情報がありません。" },
        zh: { tel: "电话", loading: "正在加载详细信息...", none: "没有详细信息。" }
    };
    return map[lang] || map.ko;
}
function buildTourPopupHtml(item, detailLines, isLoading) {
    var text = getTourPopupText();
    var typeName = getTourTypeName(item.contenttypeid);
    var meta = getTourTypeMeta(item.contenttypeid);
    var title = getTourDisplayTitle(item);
    var addr = getTourDisplayAddr(item);
    var tel = item.tel ? "<br><a href='tel:" + escapeHtml(item.tel) + "' style='color:#4db8ff;font-size:12px;'>" + text.tel + " " + escapeHtml(item.tel) + "</a>" : "";
    var tag = "<span class='tour-popup-tag' style='color:" + meta.color + ";border-color:" + meta.border + ";background:" + meta.fill + ";'>" + escapeHtml(typeName) + "</span>";
    var detailHtml = "";
    if (isLoading) detailHtml = "<div class='tour-popup-detail loading'>" + escapeHtml(text.loading) + "</div>";
    else if (detailLines && detailLines.length) detailHtml = "<div class='tour-popup-detail'>" + detailLines.map(function(line) { return "<p>" + escapeHtml(line) + "</p>"; }).join("") + "</div>";
    else detailHtml = "<div class='tour-popup-detail muted'>" + escapeHtml(text.none) + "</div>";
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
function syncTourPanelState() {
    var panel = document.getElementById("tour-panel");
    var header = document.getElementById("tour-header");
    if (panel) panel.classList.toggle("expanded", tourExpanded);
    if (header) header.setAttribute("aria-expanded", tourExpanded ? "true" : "false");
    syncTourCloseButton();
}

function renderTourCards() {
    var listEl = document.getElementById("tour-list"); var expandBtn = document.getElementById("tour-expand-btn"); if (!listEl || !expandBtn) return;
    syncTourPanelState();
    listEl.innerHTML = ""; var center = map.getCenter();
    var visibleItems = getVisibleTourItems();
    var showCount = tourExpanded ? visibleItems.length : 0;
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
    expandBtn.style.display = tourExpanded && visibleItems.length > TOUR_VISIBLE_COUNT ? "" : "none";
    var expandIcon = document.getElementById("tour-expand-icon");
    var expandText = document.getElementById("tour-expand-text");
    if (expandIcon) expandIcon.textContent = tourExpanded ? "▲" : "▼";
    if (expandText) expandText.textContent = tourExpanded ? ((UI_TEXT[currentLang] || UI_TEXT.ko).close || "닫기") : ((UI_TEXT[currentLang] || UI_TEXT.ko).more || "더보기");
    listEl.classList.toggle("expanded", visibleItems.length > 0 && tourExpanded);
    syncTourPanelState();
    addTourMarkers();
    if (tourExpanded) renderFestivalStrip();
    else hideFestivalStrip();
}

function collapseTourPanel() {
    var loadingEl = document.getElementById("tour-loading");
    var emptyEl = document.getElementById("tour-empty");
    if (loadingEl) loadingEl.style.display = "none";
    if (emptyEl) emptyEl.style.display = "none";
    if (!tourExpanded) { hideFestivalStrip(); syncTourPanelState(); return; }
    tourExpanded = false;
    syncTourPanelState();
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
    syncTourPanelState();
    renderTourCards();
}

function showTourPopup(item) {
    var lat = parseFloat(item.mapy); var lng = parseFloat(item.mapx);
    if (!isFinite(lat) || !isFinite(lng)) return;
    if (tourExpanded) {
        tourExpanded = false;
        syncTourPanelState();
        renderTourCards();
    }
    var typeName = getTourTypeName(item.contenttypeid);
    var title = getTourDisplayTitle(item);
    setSelectedDestination(lat, lng, title || typeName || "관광지");
    addVisitStamp(title || item.title, typeName, lat, lng);
    var popup = L.popup({ className: "tour-popup", autoPan: true, keepInView: true, offset: L.point(0, -12), maxWidth: 300 })
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
function addTourMarkers() { clearTourMarkers(); getVisibleTourItems().forEach(function(item) { var lat = parseFloat(item.mapy); var lng = parseFloat(item.mapx); if (!isFinite(lat) || !isFinite(lng) || !isWithinNearbyRadius(lat,lng)) return; var meta = getTourTypeMeta(item.contenttypeid); var icon = L.divIcon({ className: "tour-map-marker-wrap", html: "<div class='tour-map-marker' style='--tour-color:" + meta.color + ";--tour-fill:" + meta.fill + ";--tour-border:" + meta.border + ";'><span class='tour-map-dot'></span><span class='tour-map-label'>" + escapeHtml(meta.label) + "</span></div>", iconSize: [76, 28], iconAnchor: [10, 14] }); var marker = L.marker([lat, lng], { pane: "tourPane", icon: icon, title: (getTourTypeName(item.contenttypeid) || meta.label) + " - " + (getTourDisplayTitle(item) || "") }).addTo(map); marker.on("click", function() { showTourPopup(item); }); tourMarkers.push(marker); }); }


// 서울 공공도서관 위치정보
var SEOUL_LIBRARY_API_KEY = window.GILOA_SEOUL_LIBRARY_API_KEY || "";
var SEOUL_LIBRARY_API_BASE = window.GILOA_SEOUL_LIBRARY_API_BASE || "http://openapi.seoul.go.kr:8088";
var SEOUL_LIBRARY_API_URL = SEOUL_LIBRARY_API_BASE.replace(/\/$/, "") + "/" + SEOUL_LIBRARY_API_KEY + "/json/SeoulPublicLibraryInfo/1/300/";
var libraryItems = [];
var libraryMarkers = [];
var LIBRARY_MARKER_COLOR = "#2563eb";

// 서울 열린데이터광장 공중화장실 위치정보(mgisToiletPoi, WGS84 좌표)
var SEOUL_RESTROOM_API_KEY = window.GILOA_SEOUL_RESTROOM_API_KEY || "";
var SEOUL_RESTROOM_API_BASE = window.GILOA_SEOUL_RESTROOM_API_BASE || "http://openapi.seoul.go.kr:8088";
var SEOUL_RESTROOM_API_SERVICE = "mgisToiletPoi";
var SEOUL_RESTROOM_PAGE_SIZE = 1000;
var RESTROOM_GEOCODE_CACHE_KEY = "giloa-restroom-geocode-cache";
var restroomRawItems = [];      // 서울 전체 화장실 (이름+주소, 좌표 없음)
var restroomRawLoaded = false;
var restroomGeoCache = {};      // { 주소: {lat, lng} } - localStorage에 영구 캐시
var restroomVisibleItems = [];  // 좌표가 확보되어 실제로 표시 중인 항목
var restroomMarkers = [];
var restroomGuFetched = {};     // 이미 지오코딩을 시도한 구 이름 집합 (중복 방지)
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
    var labels = { ko: "화장실", en: "Restroom", ja: "トイレ", zh: "洗手间" };
    return labels[normalizeLang(lang)] || labels.ko;
}
function getCommunityLabel(lang) {
    var labels = { ko: "주민센터", en: "Center", ja: "住民センター", zh: "社区中心" };
    return labels[normalizeLang(lang)] || labels.ko;
}

function getLibraryDisplayName(item) { return (item && item._nameByLang && item._nameByLang[currentLang]) || (item && item.LBRRY_NAME) || ""; }
function getLibraryDisplayAddr(item) { return (item && item._addrByLang && item._addrByLang[currentLang]) || (item && item.ADRES) || ""; }

function clearLibraryMarkers() { libraryMarkers.forEach(function(marker) { map.removeLayer(marker); }); libraryMarkers = []; var pane = map.getPane("libraryPane"); if (pane) pane.querySelectorAll(".library-map-marker-wrap").forEach(function(el) { el.remove(); }); }

function refreshPaneMarkerLabels(paneName, label) {
    // pane 범위로 한정하지 않으면 같은 클래스를 쓰는 다른 레이어(화장실, 주민센터)의
    // 라벨까지 전부 덮어써 버린다.
    var pane = map.getPane(paneName);
    if (pane) pane.querySelectorAll(".library-map-label").forEach(function(el) { el.textContent = label; });
}
function refreshLibraryMarkerLabels(lang) {
    refreshPaneMarkerLabels("libraryPane", getLibraryLabel(lang));
}
function refreshRestroomMarkerLabels(lang) {
    refreshPaneMarkerLabels("restroomPane", getRestroomLabel(lang));
}
function refreshCommunityMarkerLabels(lang) {
    refreshPaneMarkerLabels("communityPane", getCommunityLabel(lang));
}

function renderLibraryMarkers(lang) {
    clearLibraryMarkers();
    var label = getLibraryLabel(lang);
    libraryItems.forEach(function(item) {
        var lat = parseFloat(item.XCNTS); var lng = parseFloat(item.YDNTS);
        if (!isFinite(lat) || !isFinite(lng) || !isWithinNearbyRadius(lat,lng)) return;
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
    var tel = item.TEL_NO ? "<br><a href='tel:" + escapeHtml(item.TEL_NO) + "' style='color:#4ade80;font-size:12px;'>전화 " + escapeHtml(item.TEL_NO) + "</a>" : "";
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
    var isNative = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
    if (location.protocol === "https:" && /^http:\/\//i.test(SEOUL_LIBRARY_API_URL) && !isNative) {
        return Promise.reject(new Error("mixed-content-library-api"));
    }
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
    }).catch(function(err) { showAppNotice((UI_TEXT[currentLang] || UI_TEXT.ko).library_api_error, "error"); console.warn("서울 도서관 API 오류", err); });
}

// ---- 공중화장실 (내장 서울 데이터 + 카카오 지오코딩) ----
function loadRestroomGeoCache() {
    try { restroomGeoCache = JSON.parse(localStorage.getItem(RESTROOM_GEOCODE_CACHE_KEY) || "{}"); }
    catch (e) { restroomGeoCache = {}; }
}
function saveRestroomGeoCache() {
    try { localStorage.setItem(RESTROOM_GEOCODE_CACHE_KEY, JSON.stringify(restroomGeoCache)); }
    catch (e) { /* 저장 공간 부족 등은 무시 - 다음 세션에 다시 지오코딩됨 */ }
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
    if (!SEOUL_RESTROOM_API_KEY) return Promise.reject(new Error("missing-restroom-api-key"));
    function fetchPage(start, end) {
        var url = SEOUL_RESTROOM_API_BASE.replace(/\/$/, "") + "/" + SEOUL_RESTROOM_API_KEY + "/json/" + SEOUL_RESTROOM_API_SERVICE + "/" + start + "/" + end + "/";
        var isNative = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
        var request;
        if (location.protocol === "https:" && /^http:\/\//i.test(url) && !isNative) {
            request = Promise.reject(new Error("mixed-content-restroom-api"));
        } else {
            request = fetch(url).then(function(res) {
                if (!res.ok) throw new Error("restroom-http-" + res.status);
                return res.json();
            }).catch(function(err) {
                var http = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.CapacitorHttp;
                if (!http || !http.get) throw err;
                return http.get({ url: url }).then(function(result) { return typeof result.data === "string" ? JSON.parse(result.data) : result.data; });
            });
        }
        return request.then(function(data) {
            var body = data && data[SEOUL_RESTROOM_API_SERVICE];
            if (!body || !Array.isArray(body.row)) {
                var message = body && body.RESULT && body.RESULT.MESSAGE;
                throw new Error(message || "invalid-restroom-response");
            }
            return { total: Number(body.list_total_count) || body.row.length, rows: body.row };
        });
    }
    return fetchPage(1, SEOUL_RESTROOM_PAGE_SIZE).then(function(first) {
        var tasks = [];
        for (var start = SEOUL_RESTROOM_PAGE_SIZE + 1; start <= first.total; start += SEOUL_RESTROOM_PAGE_SIZE) {
            tasks.push(fetchPage(start, Math.min(start + SEOUL_RESTROOM_PAGE_SIZE - 1, first.total)));
        }
        return Promise.all(tasks).then(function(pages) {
            var rows = first.rows.slice();
            pages.forEach(function(page) { rows = rows.concat(page.rows); });
            restroomRawItems = rows.map(function(row) {
                return {
                    id: row.OBJECTID,
                    name: String(row.CONTS_NAME || "").trim(),
                    addr: String(row.ADDR_NEW || row.ADDR_OLD || "").trim(),
                    lat: parseFloat(row.COORD_Y),
                    lng: parseFloat(row.COORD_X),
                    tel: String(row.TEL_NO || "").trim(),
                    openType: String(row.VALUE_01 || "").replace(/\|/g, " · ").replace(/\s*·\s*$/, "").trim(),
                    hours: String(row.VALUE_02 || "").replace(/\|/g, " · ").replace(/\s*·\s*$/, "").trim()
                };
            }).filter(function(item) { return isFinite(item.lat) && isFinite(item.lng); });
            restroomRawLoaded = true;
            return restroomRawItems;
        });
    });
}
function clearRestroomMarkers() { restroomMarkers.forEach(function(marker) { map.removeLayer(marker); }); restroomMarkers = []; }
function addRestroomMarker(item) {
    if (!isFinite(item.lat) || !isFinite(item.lng)) return;
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
function showRestroomPopup(item) {
    var t = UI_TEXT[currentLang] || UI_TEXT.ko;
    var label = getRestroomLabel();
    setSelectedDestination(item.lat, item.lng, item.name || label);
    var tag = "<span class='tour-popup-tag' style='color:" + RESTROOM_MARKER_COLOR + ";border-color:" + RESTROOM_MARKER_COLOR + ";background:rgba(163,230,53,0.18);'>" + escapeHtml(label) + "</span>";
    var tel = item.tel ? "<br><a href='tel:" + escapeHtml(item.tel) + "' style='color:#4ade80;font-size:12px;'>" + escapeHtml(t.phone_label) + " " + escapeHtml(item.tel) + "</a>" : "";
    var extra = [item.openType, item.hours].filter(Boolean).join(" · ");
    L.popup({ className: "tour-popup" }).setLatLng([item.lat, item.lng]).setContent("<b>" + escapeHtml(item.name || "화장실") + "</b><br>" + tag + "<br><small>" + escapeHtml(item.addr || "") + "</small>" + (extra ? "<br><small>" + escapeHtml(extra) + "</small>" : "") + tel).openOn(map);
}
// 주소 하나를 카카오 지오코더로 좌표 변환 (Promise 래핑)
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
// 큐에 쌓인 주소들을 카카오 API 과호출 방지를 위해 약간의 간격을 두고 순차 지오코딩
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
            if (i % 20 === 0) saveRestroomGeoCache(); // 20건마다 캐시 저장
            setTimeout(step, 120); // 초당 약 8건, 카카오 클라이언트 호출 과부하 방지
        });
    }
    restroomGeocodeQueueBusy = true;
    step();
}
// 지도 중심이 위치한 "구"를 알아내서, 그 구의 화장실만 지오코딩(캐시에 없는 것만) + 표시
function fetchRestroomsForCurrentArea() {
    if (!mapLayerSettings.restroom) return;
    fetchRestroomRawData().then(function(allItems) {
        clearRestroomMarkers();
        allItems.filter(function(item) { return isWithinNearbyRadius(item.lat,item.lng); }).slice(0, 100).forEach(addRestroomMarker);
    }).catch(function(err) {
        showAppNotice((UI_TEXT[currentLang] || UI_TEXT.ko).restroom_api_error, "error");
        console.warn("화장실 API 오류", err);
    });
}
function scheduleRestroomFetch() {
    if (!mapLayerSettings.restroom) return;
    if (restroomFetchTimer) clearTimeout(restroomFetchTimer);
    restroomFetchTimer = setTimeout(function() { restroomFetchTimer = null; fetchRestroomsForCurrentArea(); }, 1200);
}
var restroomFetchTimer = null;
map.on("moveend", scheduleRestroomFetch);
loadRestroomGeoCache();

// ---- 읍면동 주민센터 (행정안전부 하부행정기관 현황, 앱 내장 + 카카오 지오코딩) ----
// data/community_centers.json: [{ n: 명칭, s: 시도(축약), g: 시군구, a: 주소 }] 전국 3,556건
var COMMUNITY_DATA_URL = "./data/community_centers.json";
var COMMUNITY_GEOCODE_CACHE_KEY = "giloa-community-geocode-cache";
var communityRawItems = [];
var communityRawLoaded = false;
var communityGeoCache = {};        // { 주소: {lat, lng} } - localStorage에 영구 캐시
var communityMarkers = [];
var communityRegionFetched = {};   // "시도|시군구" 단위로 지오코딩 시도 여부 기록 (중복 방지)
var communityGeocodeQueueBusy = false;
var COMMUNITY_MARKER_COLOR = "#94a3b8";
// 카카오 지오코더의 region_1depth_name(정식 시도명) → 데이터의 축약 시도명
var SIDO_SHORT_NAMES = {
    "서울특별시": "서울", "부산광역시": "부산", "대구광역시": "대구", "인천광역시": "인천",
    "광주광역시": "광주", "대전광역시": "대전", "울산광역시": "울산", "세종특별자치시": "세종",
    "경기도": "경기", "강원특별자치도": "강원", "강원도": "강원",
    "충청북도": "충북", "충청남도": "충남",
    "전북특별자치도": "전북", "전라북도": "전북", "전라남도": "전남",
    "경상북도": "경북", "경상남도": "경남", "제주특별자치도": "제주"
};

function loadCommunityGeoCache() {
    try { communityGeoCache = JSON.parse(localStorage.getItem(COMMUNITY_GEOCODE_CACHE_KEY) || "{}"); }
    catch (e) { communityGeoCache = {}; }
}
function saveCommunityGeoCache() {
    try { localStorage.setItem(COMMUNITY_GEOCODE_CACHE_KEY, JSON.stringify(communityGeoCache)); }
    catch (e) { /* 저장 공간 부족 등은 무시 - 다음 세션에 다시 지오코딩됨 */ }
}
function fetchCommunityRawData() {
    if (communityRawLoaded) return Promise.resolve(communityRawItems);
    return fetch(COMMUNITY_DATA_URL).then(function(res) { return res.json(); }).then(function(data) {
        communityRawItems = Array.isArray(data) ? data : [];
        communityRawLoaded = true;
        return communityRawItems;
    }).catch(function(err) { console.warn("주민센터 데이터 로드 오류", err); return []; });
}
function clearCommunityMarkers() { communityMarkers.forEach(function(marker) { map.removeLayer(marker); }); communityMarkers = []; }
function addCommunityMarker(item) {
    if (!isFinite(item.lat) || !isFinite(item.lng)) return;
    var label = getCommunityLabel();
    var icon = L.divIcon({
        className: "library-map-marker-wrap",
        html: "<div class='library-map-marker' style='--tour-color:" + COMMUNITY_MARKER_COLOR + ";'><span class='library-map-dot' style='background:" + COMMUNITY_MARKER_COLOR + ";'></span><span class='library-map-label'>" + escapeHtml(label) + "</span></div>",
        iconSize: [76, 28], iconAnchor: [10, 14]
    });
    var marker = L.marker([item.lat, item.lng], { pane: "communityPane", icon: icon, title: label + " - " + (item.n || "") }).addTo(map);
    marker.on("click", function() { showCommunityPopup(item); });
    communityMarkers.push(marker);
}
function showCommunityPopup(item) {
    var label = getCommunityLabel();
    setSelectedDestination(item.lat, item.lng, item.n || label);
    var tag = "<span class='tour-popup-tag' style='color:" + COMMUNITY_MARKER_COLOR + ";border-color:rgba(148,163,184,0.6);background:rgba(148,163,184,0.18);'>" + escapeHtml(label) + "</span>";
    L.popup({ className: "tour-popup" }).setLatLng([item.lat, item.lng]).setContent("<b>" + escapeHtml(item.n || label) + "</b><br>" + tag + "<br><small>" + escapeHtml(item.a || "") + "</small>").openOn(map);
}
function communityGeocodeQueueSequential(items) {
    var i = 0;
    function step() {
        if (i >= items.length) { communityGeocodeQueueBusy = false; saveCommunityGeoCache(); return; }
        var item = items[i++];
        geocodeAddress(item.a).then(function(coord) {
            if (coord) {
                communityGeoCache[item.a] = coord;
                if (mapLayerSettings.community) addCommunityMarker(Object.assign({}, item, coord));
            }
            if (i % 20 === 0) saveCommunityGeoCache(); // 20건마다 캐시 저장
            setTimeout(step, 120); // 초당 약 8건, 카카오 클라이언트 호출 과부하 방지
        });
    }
    communityGeocodeQueueBusy = true;
    step();
}
// 지도 중심의 시도+시군구를 알아내 그 지역 주민센터만 지오코딩(캐시에 없는 것만) + 표시
function fetchCommunityForCurrentArea() {
    if (!mapLayerSettings.community) return;
    fetchCommunityRawData().then(function(allItems) {
        if (!allItems.length) return;
        return loadKakaoTrafficSdk().then(function() {
            var center = map.getCenter();
            var geocoder = new window.kakao.maps.services.Geocoder();
            geocoder.coord2RegionCode(center.lng, center.lat, function(result, status) {
                if (status !== window.kakao.maps.services.Status.OK || !result || !result.length) return;
                var sidoFull = ""; var sigungu = "";
                for (var i = 0; i < result.length; i++) {
                    if (result[i].region_type === "H" || result[i].region_type === "B") {
                        sidoFull = result[i].region_1depth_name || "";
                        sigungu = (result[i].region_2depth_name || "").replace(/\s+/g, " ").trim();
                        if (sidoFull) break;
                    }
                }
                if (!sidoFull) return;
                var sidoShort = SIDO_SHORT_NAMES[sidoFull] || sidoFull.slice(0, 2);
                var regionKey = sidoShort + "|" + sigungu;
                if (communityRegionFetched[regionKey]) return;
                communityRegionFetched[regionKey] = true;
                // "북구"처럼 시군구 이름이 여러 시도에 있으므로 반드시 시도까지 함께 매칭한다.
                var regionItems = allItems.filter(function(it) {
                    if (it.s !== sidoShort) return false;
                    if (sidoShort === "세종") return true; // 세종은 시군구가 없음
                    return it.g === sigungu;
                });
                var toGeocode = [];
                regionItems.forEach(function(it) {
                    var cached = communityGeoCache[it.a];
                    if (cached) addCommunityMarker(Object.assign({}, it, cached));
                    else toGeocode.push(it);
                });
                if (toGeocode.length && !communityGeocodeQueueBusy) {
                    communityGeocodeQueueSequential(toGeocode);
                }
            });
        });
    }).catch(function(err) { console.warn("주민센터 지오코딩 오류", err); });
}
function scheduleCommunityFetch() {
    if (!mapLayerSettings.community) return;
    if (communityFetchTimer) clearTimeout(communityFetchTimer);
    communityFetchTimer = setTimeout(function() { communityFetchTimer = null; fetchCommunityForCurrentArea(); }, 1200);
}
var communityFetchTimer = null;
map.on("moveend", scheduleCommunityFetch);
loadCommunityGeoCache();
if (mapLayerSettings.community) fetchCommunityForCurrentArea();

function scheduleTourFetch() { if (tourFetchTimer) clearTimeout(tourFetchTimer); tourFetchTimer = setTimeout(function() { tourFetchTimer = null; tourExpanded = false; fetchTourSpots(); fetchFestivals(); }, 1200); }
map.on("moveend", scheduleTourFetch);
map.on("click", function() { collapseTourPanel(); });
scheduleTourFetch();
if (mapLayerSettings.library) fetchLibraries();

// 지도 표시 레이어 토글 (사이드바 "지도 표시" 패널)
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
    if (MAP_LAYER_UNAVAILABLE[key]) return;
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
            restroomGuFetched = {}; // 다시 켰을 때 현재 보이는 구를 재평가하도록 초기화 (지오코딩 캐시는 유지되어 재호출은 안 함)
        }
    } else if (key === "restaurant" || key === "lodging") {
        // 카드 목록뿐 아니라 지도 위 마커와 개수 표시도 함께 갱신한다.
        renderTourCards();
        addTourMarkers();
        var tourCountEl = document.getElementById("tour-count");
        if (tourCountEl) tourCountEl.textContent = formatTourCount(getVisibleTourItems().length);
    } else if (key === "community") {
        if (mapLayerSettings.community) {
            fetchCommunityForCurrentArea();
        } else {
            clearCommunityMarkers();
            communityRegionFetched = {}; // 다시 켰을 때 현재 지역을 재평가 (지오코딩 캐시는 유지)
        }
    }
}
function toggleMapLayer(key) {
    if (MAP_LAYER_UNAVAILABLE[key]) return; // 준비 중인 레이어는 토글 비활성
    mapLayerSettings[key] = !mapLayerSettings[key];
    saveMapLayerSettings();
    syncMapLayerToggleUI(key);
    applyMapLayerChange(key);
}
function initMapLayerUI() {
    Object.keys(MAP_LAYER_DEFAULTS).forEach(function(key) {
        var row = document.getElementById("map-layer-" + key);
        if (row && MAP_LAYER_UNAVAILABLE[key]) row.style.display = "none";
        syncMapLayerToggleUI(key);
    });
}
initMapLayerUI();

// 상세 콘텐츠 번역
var LANGUAGE_STORAGE_KEY = "giloa-ui-language";
var currentLang = (function() {
    try {
        var saved = normalizeLang(localStorage.getItem(LANGUAGE_STORAGE_KEY) || "ko");
        return ["ko", "en", "ja", "zh"].indexOf(saved) >= 0 ? saved : "ko";
    } catch (_) { return "ko"; }
})();

function getTranslateLang(lang) { return ({ ko: "ko", en: "en", ja: "ja", zh: "zh" })[lang] || "en"; }
function getGoogleLang(lang) { return ({ ko: "ko", en: "en", ja: "ja", zh: "zh-CN" })[lang] || "en"; }
function isClearlyUntranslated(sourceText, translatedText, targetLang) {
    sourceText = String(sourceText || "").trim();
    translatedText = String(translatedText || "").trim();
    targetLang = normalizeLang(targetLang);
    if (!translatedText) return true;
    if ((targetLang === "ja" || targetLang === "zh") && hasHangul(translatedText)) return true;
    return sourceText === translatedText && hasHangul(sourceText) && targetLang !== "ko";
}
function myMemoryTranslateSingle(text, sourceLang, targetLang) {
    var langPair = getGoogleLang(sourceLang || "ko") + "|" + getGoogleLang(targetLang);
    var url = "https://api.mymemory.translated.net/get?q=" + encodeURIComponent(text) + "&langpair=" + encodeURIComponent(langPair);
    return fetch(url).then(function(res) {
        if (!res.ok) throw new Error("MyMemory HTTP " + res.status);
        return res.json();
    }).then(function(data) {
        var translated = data && data.responseData && data.responseData.translatedText;
        if (isClearlyUntranslated(text, translated, targetLang)) throw new Error("MyMemory untranslated");
        return translated;
    });
}

// ---- 번역 엔진 ----
// 문장을 하나씩 요청하면 20개 항목 기준 최대 40회의 HTTP 왕복이 생겨 매우 느리다.
// translate_a/t 배치 엔드포인트로 여러 문장을 한 번에 보내 요청 수를 1~2회로 줄인다.
function googleTranslateSingle(text, sourceLang, targetLang) {
    var url = "https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&sl=" + encodeURIComponent(sourceLang || "ko") + "&tl=" + encodeURIComponent(getGoogleLang(targetLang)) + "&q=" + encodeURIComponent(text);
    return fetch(url).then(function(res) {
        if (!res.ok) throw new Error("Google Translate HTTP " + res.status);
        return res.json();
    }).then(function(data) {
        var translated = Array.isArray(data) && Array.isArray(data[0]) ? data[0].map(function(part) { return part && part[0] ? part[0] : ""; }).join("") : "";
        if (isClearlyUntranslated(text, translated, targetLang)) throw new Error("Google Translate untranslated");
        return translated;
    });
}
function googleTranslateBatch(texts, sourceLang, targetLang) {
    var url = "https://translate.googleapis.com/translate_a/t?client=gtx&sl=" + encodeURIComponent(sourceLang || "ko") + "&tl=" + encodeURIComponent(getGoogleLang(targetLang));
    texts.forEach(function(t) { url += "&q=" + encodeURIComponent(t); });
    return fetch(url).then(function(res) {
        if (!res.ok) throw new Error("배치 번역 실패 " + res.status);
        return res.json();
    }).then(function(data) {
        // 응답: ["번역1","번역2",...] 또는 [["번역","감지언어"],...] 또는 문자열 하나
        var list;
        if (typeof data === "string") list = [data];
        else if (Array.isArray(data)) list = data.map(function(entry) {
            if (typeof entry === "string") return entry;
            if (Array.isArray(entry) && typeof entry[0] === "string") return entry[0];
            return "";
        });
        else throw new Error("배치 번역 응답 형식 오류");
        if (list.length !== texts.length) throw new Error("배치 번역 개수 불일치");
        if (list.some(function(translated, index) { return isClearlyUntranslated(texts[index], translated, targetLang); })) {
            throw new Error("배치 번역 결과가 원문과 동일함");
        }
        return list;
    });
}

var TRANSLATE_CACHE_KEY = "giloa-translation-cache-v2";
var TRANSLATE_BATCH_URL_MAX = 7000; // URL 길이 제한을 넘지 않도록 분할
var TRANSLATE_CACHE_MAX = 1200;
var translateMemoryCache = (function() {
    try { return JSON.parse(localStorage.getItem(TRANSLATE_CACHE_KEY) || "{}"); }
    catch (_) { return {}; }
})();
var translatePersistTimer = null;
function getTranslateCacheKey(text, sourceLang, targetLang) {
    return [sourceLang || "ko", targetLang || "en", text || ""].join("|");
}
function rememberTranslation(cacheKey, translated) {
    translateMemoryCache[cacheKey] = translated;
    // 번역이 한꺼번에 수십 개 완료될 때마다 localStorage에 전체 캐시를 다시 쓰면
    // 메인 스레드가 멈추므로, 500ms 뒤 한 번만 저장한다.
    if (translatePersistTimer) clearTimeout(translatePersistTimer);
    translatePersistTimer = setTimeout(function() {
        translatePersistTimer = null;
        try {
            var keys = Object.keys(translateMemoryCache);
            if (keys.length > TRANSLATE_CACHE_MAX) keys.slice(0, keys.length - TRANSLATE_CACHE_MAX).forEach(function(key) { delete translateMemoryCache[key]; });
            localStorage.setItem(TRANSLATE_CACHE_KEY, JSON.stringify(translateMemoryCache));
        } catch (_) {}
    }, 500);
    return translated;
}
// 여러 문장을 캐시 확인 후 배치로 번역한다. 입력 순서 그대로 결과 배열을 돌려준다.
function translateTexts(texts, sourceLang, targetLang) {
    texts = (texts || []).map(function(t) { return String(t || ""); });
    if (!texts.length) return Promise.resolve([]);
    if (normalizeLang(sourceLang) === normalizeLang(targetLang)) return Promise.resolve(texts.slice());
    var results = new Array(texts.length);
    var missing = []; // { text, cacheKey, indices: [...] }
    var missingByKey = {};
    texts.forEach(function(text, i) {
        if (!text) { results[i] = ""; return; }
        var cacheKey = getTranslateCacheKey(text, sourceLang, targetLang);
        if (translateMemoryCache[cacheKey]) { results[i] = translateMemoryCache[cacheKey]; return; }
        var slot = missingByKey[cacheKey];
        if (!slot) { slot = { text: text, cacheKey: cacheKey, indices: [] }; missingByKey[cacheKey] = slot; missing.push(slot); }
        slot.indices.push(i);
    });
    if (!missing.length) return Promise.resolve(results);
    // URL 길이 기준으로 청크 분할 (긴 문장은 단독 청크로 전송)
    var chunks = []; var chunk = []; var chunkLen = 0;
    missing.forEach(function(slot) {
        var encLen = encodeURIComponent(slot.text).length + 3;
        if (chunk.length && chunkLen + encLen > TRANSLATE_BATCH_URL_MAX) { chunks.push(chunk); chunk = []; chunkLen = 0; }
        chunk.push(slot); chunkLen += encLen;
    });
    if (chunk.length) chunks.push(chunk);
    var tasks = chunks.map(function(group) {
        var groupTexts = group.map(function(slot) { return slot.text; });
        var run = group.length === 1
            ? googleTranslateSingle(groupTexts[0], sourceLang, targetLang).then(function(t) { return [t]; })
            : googleTranslateBatch(groupTexts, sourceLang, targetLang);
        return run.catch(function() {
            // 배치 실패 시 문장별 개별 번역으로 폴백 (그래도 실패하면 원문 유지)
            return Promise.all(groupTexts.map(function(text) {
                return googleTranslateSingle(text, sourceLang, targetLang)
                    .catch(function() { return myMemoryTranslateSingle(text, sourceLang, targetLang); })
                    .catch(function() { return text; });
            }));
        }).then(function(translations) {
            group.forEach(function(slot, idx) {
                var translated = translations[idx] || slot.text;
                if (!isClearlyUntranslated(slot.text, translated, targetLang)) rememberTranslation(slot.cacheKey, translated);
                slot.indices.forEach(function(i) { results[i] = translated; });
            });
        });
    });
    return Promise.all(tasks).then(function() {
        return results.map(function(r, i) { return r === undefined ? texts[i] : r; });
    });
}
function translateText(text, sourceLang, targetLang) {
    return translateTexts([text], sourceLang, targetLang).then(function(list) { return list[0] || ""; });
}

var UI_TEXT = {
    ko: { sidebar_title: "나의 기록들", fog_label: "어둠 효과", fog_on: "켜짐", fog_off: "꺼짐", tab_memory: "기억", tab_photo: "사진", tab_gpx: "경로", tab_badge: "뱃지", tab_visit: "방문", tab_item: "아이템", rec_idle: "중단됨", rec_active: "기록중", gps_weak: "GPS 약함 ({value}m)", gps_very_weak: "GPS 매우 약함 ({value}m)", stay_bonus_wait: "기록중 - 체류 보너스까지 {value}분", stay_bonus_done: "30분 체류 완료! 레벨 +1 보너스!", empty_memory: "아직 기록이 없습니다.", empty_photo: "아직 사진이 없습니다.", empty_gpx: "저장된 발걸음이 없습니다.", empty_tour: "주변 장소가 없습니다.", tour_title: "주변 관광지", festival_label: "주변 축제", festival_badge: "축제", loading: "검색 중...", close: "닫기", more: "더보기", count_suffix: "곳", unit_count: " 개", point_suffix: "개 지점", route: "경로", showing: "표시 중", move: "이동", delete: "삭제", view_on_map: "지도에서 보기", hud_title_label: "현재 칭호", hud_level_label: "LV", hud_dist_label: "이동 거리", hud_memory_label: "기억", hud_photo_label: "사진", hud_next: "다음까지", hud_next_level: "다음", hud_condition_met: "달성!", hud_no_condition: "조건 없음", hud_max: "최고!", hud_max_level: "최고 레벨!", help_tab_ask: "문의하기", help_tab_info: "설명보기", help_ask_copy: "사용 중 불편한 점이나 건의사항은<br>카카오톡 오픈채팅으로 들려주세요.", help_notice: "저장된 GPX 데이터는 서버로 전송되지 않아요.<br>모든 기록은 <b>오직 이 기기 안에서만</b> 저장되고 보여져요.", help_link: "카카오톡 오픈채팅", help_record_title: "기록 버튼", help_record_desc: "누르면 GPS 경로 기록을 시작하고 다시 누르면 중단합니다.", help_photo_title: "사진 버튼", help_photo_desc: "갤러리에서 사진을 불러옵니다.", help_memory_title: "별표 버튼", help_memory_desc: "현재 위치에 이름을 붙여 기억으로 남깁니다.", help_location_title: "현재 위치 버튼", help_location_desc: "지도를 내 현재 위치로 이동합니다.", help_status_title: "상태 버튼", help_status_desc: "칭호와 진행 상태를 확인합니다.", help_menu_title: "메뉴 버튼", help_menu_desc: "기억, 사진, 경로 기록을 확인합니다." },
    en: { sidebar_title: "My Records", fog_label: "Fog Effect", fog_on: "On", fog_off: "Off", tab_memory: "Memory", tab_photo: "Photo", tab_gpx: "Route", tab_badge: "Badges", tab_visit: "Visits", tab_item: "Items", rec_idle: "Stopped", rec_active: "Recording", gps_weak: "Weak GPS ({value}m)", gps_very_weak: "Very weak GPS ({value}m)", stay_bonus_wait: "Recording - stay bonus in {value} min", stay_bonus_done: "30 min stay complete! Level +1 bonus!", empty_memory: "No records yet.", empty_photo: "No photos yet.", empty_gpx: "No saved steps yet.", empty_tour: "No nearby places.", tour_title: "Nearby Places", festival_label: "Nearby Festivals", festival_badge: "Festivals", loading: "Searching...", close: "Close", more: "More", count_suffix: "places", unit_count: "", point_suffix: " points", route: "Route", showing: "Showing", move: "Move", delete: "Delete", view_on_map: "View on map", hud_title_label: "Current Title", hud_level_label: "LV", hud_dist_label: "Distance", hud_memory_label: "Memories", hud_photo_label: "Photos", hud_next: "Next", hud_next_level: "Next", hud_condition_met: "Met!", hud_no_condition: "No condition", hud_max: "Max!", hud_max_level: "Max level reached!", help_tab_ask: "Contact", help_tab_info: "Guide", help_ask_copy: "Tell us about issues or suggestions<br>through KakaoTalk open chat.", help_notice: "Saved GPX data is not sent to the server.<br>All records are stored and shown <b>only on this device</b>.", help_link: "KakaoTalk Open Chat", help_record_title: "Record Button", help_record_desc: "Tap to start GPS route recording. Tap again to stop.", help_photo_title: "Photo Button", help_photo_desc: "Import photos from your gallery.", help_memory_title: "Star Button", help_memory_desc: "Name your current location and save it as a memory.", help_location_title: "Current Location Button", help_location_desc: "Move the map back to your current location.", help_status_title: "Status Button", help_status_desc: "Check your title and progress.", help_menu_title: "Menu Button", help_menu_desc: "View memories, photos, and route records." },
    ja: { sidebar_title: "記録", fog_label: "霧効果", fog_on: "オン", fog_off: "オフ", tab_memory: "記憶", tab_photo: "写真", tab_gpx: "ルート", tab_badge: "バッジ", tab_visit: "訪問", tab_item: "アイテム", rec_idle: "停止中", rec_active: "記録中", gps_weak: "GPSが弱い ({value}m)", gps_very_weak: "GPSが非常に弱い ({value}m)", stay_bonus_wait: "記録中 - 滞在ボーナスまで{value}分", stay_bonus_done: "30分滞在完了！レベル+1ボーナス！", empty_memory: "まだ記録がありません。", empty_photo: "まだ写真がありません。", empty_gpx: "保存された足跡はありません。", empty_tour: "周辺スポットがありません。", tour_title: "周辺スポット", festival_label: "周辺イベント", festival_badge: "イベント", loading: "検索中...", close: "閉じる", more: "もっと見る", count_suffix: "件", unit_count: "件", point_suffix: "地点", route: "ルート", showing: "表示中", move: "移動", delete: "削除", view_on_map: "地図で見る", hud_title_label: "現在の称号", hud_level_label: "LV", hud_dist_label: "移動距離", hud_memory_label: "記憶", hud_photo_label: "写真", hud_next: "次まで", hud_next_level: "次", hud_condition_met: "達成！", hud_no_condition: "条件なし", hud_max: "最高！", hud_max_level: "最高レベル！", help_tab_ask: "問い合わせ", help_tab_info: "ガイド", help_ask_copy: "不便な点やご意見は<br>KakaoTalkオープンチャットでお知らせください。", help_notice: "保存されたGPXデータはサーバーへ送信されません。<br>すべての記録は<b>この端末内だけ</b>に保存されます。", help_link: "KakaoTalkオープンチャット", help_record_title: "記録ボタン", help_record_desc: "タップするとGPSルート記録を開始し、もう一度タップすると停止します。", help_photo_title: "写真ボタン", help_photo_desc: "ギャラリーから写真を読み込みます。", help_memory_title: "星ボタン", help_memory_desc: "現在地に名前を付けて記憶として保存します。", help_location_title: "現在地ボタン", help_location_desc: "地図を現在地へ移動します。", help_status_title: "ステータスボタン", help_status_desc: "称号と進行状況を確認します。", help_menu_title: "メニューボタン", help_menu_desc: "記憶、写真、ルート記録を確認します。" },
    zh: { sidebar_title: "我的记录", fog_label: "迷雾效果", fog_on: "开", fog_off: "关", tab_memory: "记忆", tab_photo: "照片", tab_gpx: "路线", tab_badge: "徽章", tab_visit: "访问", tab_item: "道具", rec_idle: "已停止", rec_active: "记录中", gps_weak: "GPS较弱 ({value}m)", gps_very_weak: "GPS很弱 ({value}m)", stay_bonus_wait: "记录中 - 距离停留奖励{value}分钟", stay_bonus_done: "停留30分钟完成！等级+1奖励！", empty_memory: "还没有记录。", empty_photo: "还没有照片。", empty_gpx: "还没有保存的足迹。", empty_tour: "附近没有地点。", tour_title: "附近地点", festival_label: "附近活动", festival_badge: "活动", loading: "搜索中...", close: "关闭", more: "更多", count_suffix: "处", unit_count: "个", point_suffix: "个地点", route: "路线", showing: "显示中", move: "移动", delete: "删除", view_on_map: "在地图上查看", hud_title_label: "当前称号", hud_level_label: "LV", hud_dist_label: "移动距离", hud_memory_label: "记忆", hud_photo_label: "照片", hud_next: "距离下一级", hud_next_level: "下一级", hud_condition_met: "已达成！", hud_no_condition: "无条件", hud_max: "最高！", hud_max_level: "已达最高等级！", help_tab_ask: "联系", help_tab_info: "指南", help_ask_copy: "如有不便或建议，<br>请通过KakaoTalk开放聊天告诉我们。", help_notice: "保存的GPX数据不会发送到服务器。<br>所有记录<b>只保存在此设备内</b>。", help_link: "KakaoTalk开放聊天", help_record_title: "记录按钮", help_record_desc: "点击开始GPS路线记录，再次点击停止。", help_photo_title: "照片按钮", help_photo_desc: "从图库导入照片。", help_memory_title: "星标按钮", help_memory_desc: "为当前位置命名并保存为记忆。", help_location_title: "当前位置按钮", help_location_desc: "将地图移动到当前位置。", help_status_title: "状态按钮", help_status_desc: "查看称号和进度。", help_menu_title: "菜单按钮", help_menu_desc: "查看记忆、照片和路线记录。" }
};
Object.assign(UI_TEXT.ko,{help_tab_market:"주변 시세",market_title:"이 지역의 주변 시세",market_description:"현재 지역에서 일반적으로 형성된 가격을 참고용으로 보여줍니다.",market_meal:"식사",market_cafe:"카페",market_necessities:"생필품",market_transport:"교통",market_source:"공공데이터를 바탕으로 한 참고 가격입니다.",market_loading:"주변 시세를 불러오는 중입니다.",market_empty:"현재 지역의 시세 정보가 없습니다."});
Object.assign(UI_TEXT.en,{help_tab_market:"Local Prices",market_title:"Local Price Guide",market_description:"This shows typical prices in the current area for reference.",market_meal:"Meals",market_cafe:"Cafes",market_necessities:"Daily necessities",market_transport:"Transportation",market_source:"Reference prices based on public data.",market_loading:"Loading local price information.",market_empty:"Price information is not available for this area."});
Object.assign(UI_TEXT.ja,{help_tab_market:"周辺相場",market_title:"この地域の周辺相場",market_description:"現在の地域で一般的に形成されている価格を参考として表示します。",market_meal:"食事",market_cafe:"カフェ",market_necessities:"生活必需品",market_transport:"交通",market_source:"公共データに基づく参考価格です。",market_loading:"周辺相場を読み込んでいます。",market_empty:"現在の地域の相場情報はありません。"});
Object.assign(UI_TEXT.zh,{help_tab_market:"周边行情",market_title:"当前地区的周边行情",market_description:"显示当前地区通常形成的价格，仅供参考。",market_meal:"餐饮",market_cafe:"咖啡",market_necessities:"生活必需品",market_transport:"交通",market_source:"基于公共数据的参考价格。",market_loading:"正在加载周边行情。",market_empty:"当前地区暂无行情信息。"});
UI_TEXT.ko.empty_badge = "아직 획득한 뱃지가 없습니다.";
UI_TEXT.ko.empty_visit = "아직 방문한 장소가 없습니다.";
UI_TEXT.en.empty_badge = "No badges earned yet.";
UI_TEXT.en.empty_visit = "No visits yet.";
UI_TEXT.ja.empty_badge = "まだ獲得したバッジはありません。";
UI_TEXT.ja.empty_visit = "まだ訪問した場所はありません。";
UI_TEXT.zh.empty_badge = "还没有获得徽章。";
UI_TEXT.zh.empty_visit = "还没有访问地点。";
UI_TEXT.ko.tutorial_restarted = "튜토리얼을 처음부터 다시 시작했습니다.";
UI_TEXT.en.tutorial_restarted = "The tutorial has restarted from the beginning.";
UI_TEXT.ja.tutorial_restarted = "チュートリアルを最初から再開しました。";
UI_TEXT.zh.tutorial_restarted = "教程已从头重新开始。";
UI_TEXT.ko.restroom_api_error = "화장실 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."; UI_TEXT.ko.phone_label = "전화";
UI_TEXT.en.restroom_api_error = "Unable to load restroom information. Please try again later."; UI_TEXT.en.phone_label = "Phone";
UI_TEXT.ja.restroom_api_error = "トイレ情報を読み込めませんでした。しばらくしてから再試行してください。"; UI_TEXT.ja.phone_label = "電話";
UI_TEXT.zh.restroom_api_error = "无法加载洗手间信息，请稍后重试。"; UI_TEXT.zh.phone_label = "电话";
Object.assign(UI_TEXT.ko, { auto_record_consent: "앱을 열 때 GPS 위치 기록을 자동으로 시작할까요? 기록은 최대 8시간 유지되며 언제든 기록 버튼으로 중단할 수 있습니다.", auto_record_declined: "자동 기록을 사용하지 않습니다. 기록 버튼을 누르면 직접 시작할 수 있습니다.", auto_record_title: "8시간 자동 기록을 시작합니다", auto_record_copy: "위치 기록이 시작되었으며 8시간 뒤 자동으로 중단됩니다.<br>직접 멈추려면 오른쪽 아래 기록 버튼을 눌러주세요.", location_unsupported: "위치 미지원", https_required: "HTTPS 필요", location_waiting: "위치 대기", location_permission: "위치 권한 필요", location_checking: "위치 확인 중", location_retry: "위치 재시도", tour_api_error: "관광 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.", festival_api_error: "축제 정보를 불러오지 못했습니다.", library_api_error: "도서관 정보를 불러오지 못했습니다.", offline_notice: "오프라인 상태입니다. 저장된 지도와 기록은 계속 사용할 수 있습니다.", online_notice: "인터넷 연결이 복구되었습니다.", delete_memory_confirm: "이 기억을 삭제할까요? 삭제 후 복구할 수 없습니다.", delete_photo_confirm: "이 사진을 삭제할까요? 삭제 후 복구할 수 없습니다.", delete_gpx_confirm: "이 경로를 삭제할까요? 삭제 후 복구할 수 없습니다." });
Object.assign(UI_TEXT.en, { auto_record_consent: "Automatically start GPS location recording when the app opens? Recording lasts up to 8 hours and can be stopped anytime with the record button.", auto_record_declined: "Automatic recording is off. Use the record button to start manually.", auto_record_title: "Starting 8-hour automatic recording", auto_record_copy: "Location recording has started and will stop automatically after 8 hours.<br>Use the record button at the bottom right to stop earlier.", location_unsupported: "Location unavailable", https_required: "HTTPS required", location_waiting: "Waiting for location", location_permission: "Location permission required", location_checking: "Checking location", location_retry: "Retrying location", tour_api_error: "Unable to load nearby places. Please try again later.", festival_api_error: "Unable to load festival information.", library_api_error: "Unable to load library information.", offline_notice: "You are offline. Saved maps and records remain available.", online_notice: "Internet connection restored.", delete_memory_confirm: "Delete this memory? This cannot be undone.", delete_photo_confirm: "Delete this photo? This cannot be undone.", delete_gpx_confirm: "Delete this route? This cannot be undone." });
Object.assign(UI_TEXT.ja, { auto_record_consent: "アプリを開いたときにGPS位置記録を自動で開始しますか？記録は最大8時間続き、記録ボタンでいつでも停止できます。", auto_record_declined: "自動記録はオフです。記録ボタンから手動で開始できます。", auto_record_title: "8時間の自動記録を開始します", auto_record_copy: "位置記録を開始しました。8時間後に自動で停止します。<br>早く停止する場合は右下の記録ボタンを押してください。", location_unsupported: "位置情報非対応", https_required: "HTTPSが必要", location_waiting: "位置情報を待機中", location_permission: "位置情報の許可が必要", location_checking: "位置情報を確認中", location_retry: "位置情報を再試行中", tour_api_error: "周辺スポットを読み込めませんでした。しばらくしてから再試行してください。", festival_api_error: "イベント情報を読み込めませんでした。", library_api_error: "図書館情報を読み込めませんでした。", offline_notice: "オフラインです。保存済みの地図と記録は引き続き利用できます。", online_notice: "インターネット接続が復旧しました。", delete_memory_confirm: "この記憶を削除しますか？削除後は元に戻せません。", delete_photo_confirm: "この写真を削除しますか？削除後は元に戻せません。", delete_gpx_confirm: "このルートを削除しますか？削除後は元に戻せません。" });
Object.assign(UI_TEXT.zh, { auto_record_consent: "打开应用时自动开始GPS位置记录吗？记录最长持续8小时，也可以随时使用记录按钮停止。", auto_record_declined: "自动记录已关闭。可使用记录按钮手动开始。", auto_record_title: "开始8小时自动记录", auto_record_copy: "位置记录已开始，并将在8小时后自动停止。<br>如需提前停止，请点击右下角的记录按钮。", location_unsupported: "不支持位置服务", https_required: "需要HTTPS", location_waiting: "等待位置信息", location_permission: "需要位置权限", location_checking: "正在确认位置", location_retry: "正在重试定位", tour_api_error: "无法加载附近地点，请稍后重试。", festival_api_error: "无法加载活动信息。", library_api_error: "无法加载图书馆信息。", offline_notice: "当前处于离线状态，已保存的地图和记录仍可使用。", online_notice: "网络连接已恢复。", delete_memory_confirm: "要删除这条记忆吗？删除后无法恢复。", delete_photo_confirm: "要删除这张照片吗？删除后无法恢复。", delete_gpx_confirm: "要删除这条路线吗？删除后无法恢复。" });

function confirmDelete(kind) {
    var t = UI_TEXT[currentLang] || UI_TEXT.ko;
    return window.confirm(t["delete_" + kind + "_confirm"] || t.delete);
}
function showAppNotice(message, type) {
    if (!message) return;
    var notice = document.getElementById("app-status-notice");
    if (!notice) {
        notice = document.createElement("div");
        notice.id = "app-status-notice";
        notice.setAttribute("role", "status");
        notice.setAttribute("aria-live", "polite");
        document.body.appendChild(notice);
    }
    notice.textContent = message;
    notice.className = "show " + (type || "info");
    clearTimeout(showAppNotice.timer);
    showAppNotice.timer = setTimeout(function() { notice.classList.remove("show"); }, 5000);
}
window.addEventListener("offline", function() { showAppNotice((UI_TEXT[currentLang] || UI_TEXT.ko).offline_notice, "error"); });
window.addEventListener("online", function() { showAppNotice((UI_TEXT[currentLang] || UI_TEXT.ko).online_notice, "success"); });
// 지도 표시 레이어
UI_TEXT.ko.map_layer_title = "지도 표시"; UI_TEXT.ko.layer_library = "도서관"; UI_TEXT.ko.layer_restaurant = "음식점"; UI_TEXT.ko.layer_lodging = "숙박"; UI_TEXT.ko.layer_restroom = "화장실"; UI_TEXT.ko.layer_community = "주민센터";
UI_TEXT.en.map_layer_title = "Map Layers"; UI_TEXT.en.layer_library = "Libraries"; UI_TEXT.en.layer_restaurant = "Restaurants"; UI_TEXT.en.layer_lodging = "Lodging"; UI_TEXT.en.layer_restroom = "Restrooms"; UI_TEXT.en.layer_community = "Community Centers";
UI_TEXT.ja.map_layer_title = "地図表示"; UI_TEXT.ja.layer_library = "図書館"; UI_TEXT.ja.layer_restaurant = "飲食店"; UI_TEXT.ja.layer_lodging = "宿泊"; UI_TEXT.ja.layer_restroom = "トイレ"; UI_TEXT.ja.layer_community = "住民センター";
UI_TEXT.zh.map_layer_title = "地图显示"; UI_TEXT.zh.layer_library = "图书馆"; UI_TEXT.zh.layer_restaurant = "餐厅"; UI_TEXT.zh.layer_lodging = "住宿"; UI_TEXT.zh.layer_restroom = "洗手间"; UI_TEXT.zh.layer_community = "社区中心";
// 뱃지 공통 문구
UI_TEXT.ko.badge_earned = "뱃지 획득!"; UI_TEXT.ko.badge_progress = "획득";
UI_TEXT.en.badge_earned = "Badge earned!"; UI_TEXT.en.badge_progress = "earned";
UI_TEXT.ja.badge_earned = "バッジ獲得！"; UI_TEXT.ja.badge_progress = "獲得";
UI_TEXT.zh.badge_earned = "获得徽章！"; UI_TEXT.zh.badge_progress = "已获得";
function setText(id, value) { var el = document.getElementById(id); if (el) el.textContent = value; }
function setHtml(id, value) { var el = document.getElementById(id); if (el) el.innerHTML = value; }
var helpGuidePage = "main";
var HELP_GUIDE_REPLAY_LABELS = { ko: "튜토리얼 다시 보기", en: "Restart tutorial", ja: "チュートリアルをもう一度見る", zh: "重新查看教程" };
var INTERACTIVE_TUTORIAL_LABELS = {
    ko: { back: "이전", next: "다음", done: "완료", close: "튜토리얼 닫기", step: "단계" },
    en: { back: "Back", next: "Next", done: "Done", close: "Close tutorial", step: "Step" },
    ja: { back: "前へ", next: "次へ", done: "完了", close: "チュートリアルを閉じる", step: "ステップ" },
    zh: { back: "上一步", next: "下一步", done: "完成", close: "关闭教程", step: "步骤" }
};
var OVERVIEW_TUTORIAL_COPY = {
    ko: { done: "확인했어요", menu: ["메뉴", "사진·경로·뱃지와 지도 표시 설정"], language: ["언어", "한국어·영어·일본어·중국어 변경"], tour: ["주변 관광지", "눌러서 주변 장소 목록 열기"], photo: ["사진", "사진을 불러와 지도에 기록"], route: ["길찾기", "선택한 장소로 카카오맵 길찾기"], record: ["기록 / 현재 위치", "접속 시 기록 시작 · 다시 누르면 중지"], status: ["상태", "칭호·레벨·거리·사진 진행 확인"], help: ["도움말", "언제든 튜토리얼 다시 보기"] },
    en: { done: "Got it", menu: ["Menu", "Photos, routes, badges and map display"], language: ["Language", "Switch Korean, English, Japanese or Chinese"], tour: ["Nearby places", "Tap to open nearby place listings"], photo: ["Photos", "Import photos and save them on the map"], route: ["Directions", "Open Kakao Map directions to a selected place"], record: ["Record / Location", "Starts on launch · tap again to stop"], status: ["Status", "View title, level, distance and photo progress"], help: ["Help", "Replay this tutorial anytime"] },
    ja: { done: "確認しました", menu: ["メニュー", "写真・経路・バッジ・地図表示設定"], language: ["言語", "韓国語・英語・日本語・中国語を切り替え"], tour: ["周辺スポット", "タップして周辺スポット一覧を開く"], photo: ["写真", "写真を読み込み地図に記録"], route: ["ルート", "選択した場所へのカカオマップ経路検索"], record: ["記録 / 現在地", "起動時に記録開始・再タップで停止"], status: ["状態", "称号・レベル・距離・写真の進行を確認"], help: ["ヘルプ", "いつでもチュートリアルを再表示"] },
    zh: { done: "知道了", menu: ["菜单", "照片、路线、徽章和地图显示设置"], language: ["语言", "切换韩语、英语、日语或中文"], tour: ["附近地点", "点击打开附近地点列表"], photo: ["照片", "导入照片并记录在地图上"], route: ["路线", "打开所选地点的 Kakao 地图导航"], record: ["记录 / 当前位置", "启动时自动记录，再次点击停止"], status: ["状态", "查看称号、等级、距离和照片进度"], help: ["帮助", "随时重新播放本教程"] }
};
var interactiveTutorialSteps = [];
var interactiveTutorialIndex = 0;
var HELP_GUIDE_COPY = {
    ko: {
        main: "기본 버튼", menu: "메뉴 안", heading_main: "기본 화면 버튼", heading_menu: "메뉴 안의 기능",
        main_items: [
            ["●", "기록 버튼", "GPS 이동 경로 기록을 시작하거나 멈춥니다."],
            ["▣", "사진 버튼", "갤러리에서 사진을 불러와 지도에 남깁니다."],
            ["⌖", "현재 위치와 특별 장소", "파란 현재 위치 점을 누르면 메모와 함께 특별 장소 핀을 저장합니다."],
            ["↗", "길찾기", "선택한 장소 이름으로 카카오맵 길찾기를 엽니다."],
            ["◉", "상태", "현재 칭호, 레벨, 이동·사진 진행 상태를 확인합니다."],
            ["한", "언어", "한·EN·あ·中 버튼으로 화면 언어를 바로 바꿉니다."],
            ["☰", "메뉴", "사진, 경로, 뱃지 등 기록 메뉴를 엽니다."],
            ["?", "도움말", "이 사용 안내를 언제든 다시 엽니다."]
        ],
        menu_items: [
            ["▣", "사진", "저장한 사진을 보고 지도 위치로 이동합니다."],
            ["⌁", "발걸음", "최근 경로를 GPX로 저장하거나 GPX 파일을 불러옵니다."],
            ["⌖", "방문", "지나간 관광지와 장소의 방문 기록을 봅니다."],
            ["□", "아이템", "뱃지와 이벤트·조건으로 얻은 아이템을 함께 확인합니다."],
            ["◌", "지도 표시", "도서관, 음식점, 숙박 등 지도에 보일 정보를 켜거나 끕니다."]
        ]
    },
    en: {
        main: "Main controls", menu: "In the menu", heading_main: "Main screen controls", heading_menu: "Features in the menu",
        main_items: [["●","Record","Starts or stops GPS route recording."],["▣","Photos","Imports photos from your gallery and saves them on the map."],["⌖","Current location & special places","Tap the blue location dot to save a special-place pin with a note."],["↗","Route","Opens Kakao Map route search for the selected place."],["◉","Status","Shows your title, level, distance and photo progress."],["EN","Language","Switches the screen language with 한, EN, あ or 中."],["☰","Menu","Opens photos, routes, items and other records."],["?","Help","Opens this guide again anytime."]],
        menu_items: [["▣","Photos","View saved photos and move to their map location."],["⌁","Routes","Save recent routes as GPX or import a GPX file."],["♜","Badges","View badges earned through photos, distance and visits."],["⌖","Visits","View places and attractions you have visited."],["□","Items","View items earned from events or conditions."],["◌","Map display","Turn map information such as libraries, restaurants and lodging on or off."]]
    },
    ja: {
        main: "基本ボタン", menu: "メニュー内", heading_main: "メイン画面のボタン", heading_menu: "メニュー内の機能",
        main_items: [["●","記録","GPSの移動経路の記録を開始・停止します。"],["▣","写真","ギャラリーから写真を読み込み、地図に残します。"],["⌖","現在地","現在地へ移動し、位置記録を操作します。"],["↗","ルート","選択した場所をカカオマップで検索します。"],["◉","状態","称号、レベル、距離、写真の進行状況を確認します。"],["あ","言語","한・EN・あ・中で表示言語を切り替えます。"],["☰","メニュー","写真、経路、バッジなどの記録を開きます。"],["?","ヘルプ","この案内をいつでも開けます。"]],
        menu_items: [["▣","写真","保存した写真を見て、地図上の場所へ移動します。"],["⌁","足跡","最近の経路をGPXに保存、またはGPXを読み込みます。"],["♜","バッジ","写真、距離、訪問で獲得したバッジを確認します。"],["⌖","訪問","通過した場所や観光地の記録を見ます。"],["□","アイテム","イベントなどで得たアイテムを確認します。"],["◌","地図表示","図書館、飲食店、宿泊などの表示を切り替えます。"]]
    },
    zh: {
        main: "主要按钮", menu: "菜单功能", heading_main: "主页面按钮", heading_menu: "菜单中的功能",
        main_items: [["●","记录","开始或停止 GPS 路线记录。"],["▣","照片","从相册导入照片并保存在地图上。"],["⌖","当前位置","移动到当前位置并控制位置记录。"],["↗","路线","在 Kakao 地图中搜索所选地点的路线。"],["◉","状态","查看称号、等级、距离和照片进度。"],["中","语言","用 한、EN、あ、中切换显示语言。"],["☰","菜单","打开照片、路线、徽章等记录。"],["?","帮助","随时再次打开本指南。"]],
        menu_items: [["▣","照片","查看已保存的照片并移动到地图位置。"],["⌁","足迹","将最近路线保存为 GPX 或导入 GPX 文件。"],["♜","徽章","查看通过照片、距离和访问获得的徽章。"],["⌖","访问","查看经过的地点和景点记录。"],["□","道具","查看活动或条件获得的道具。"],["◌","地图显示","开关图书馆、餐厅、住宿等地图信息。"]]
    }
};
function startTutorial() {
    dismissAutoRecordingNotice();
    var popup = document.getElementById("help-popup");
    if (popup) popup.classList.remove("show");
    document.body.classList.remove("help-open");
    toggleSidebar(false);
    ensureOverviewTutorial();
    document.getElementById("overview-tutorial").classList.add("show");
    localStorage.setItem(TUTORIAL_SEEN_KEY, "yes");
    requestAnimationFrame(function() {
        renderOverviewTutorial();
        showAppNotice((UI_TEXT[currentLang] || UI_TEXT.ko).tutorial_restarted, "success");
    });
}
function ensureOverviewTutorial() {
    if (document.getElementById("overview-tutorial")) return;
    var root = document.createElement("div"); root.id = "overview-tutorial"; root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true");
    root.innerHTML = '<svg class="overview-tutorial-lines" aria-hidden="true"><defs><marker id="overview-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z"></path></marker></defs></svg><div class="overview-tutorial-labels"></div><button type="button" class="overview-tutorial-close">×</button><button type="button" class="overview-tutorial-done"></button>';
    document.body.appendChild(root);
    root.addEventListener("click", finishOverviewTutorial);
    window.addEventListener("resize", function() { if (root.classList.contains("show")) renderOverviewTutorial(); });
}
function renderOverviewTutorial() {
    var root = document.getElementById("overview-tutorial"); if (!root) return;
    var copy = OVERVIEW_TUTORIAL_COPY[currentLang] || OVERVIEW_TUTORIAL_COPY.ko;
    var defs = [
        { selector: "#ham-btn", key: "menu", place: "callout-left" }, { selector: "#lang-toggle", key: "language", place: "callout-center" },
        { selector: "#tour-header", key: "tour", place: "callout-right" }, { selector: "#photo-btn", key: "photo", place: "left" },
        { selector: "#traffic-btn", key: "route", place: "left" }, { selector: "#loc-btn", key: "record", place: "left" },
        { selector: "#hud-handle", key: "status", place: "above" }, { selector: "#help-btn", key: "help", place: "right" }
    ];
    var layer = root.querySelector(".overview-tutorial-labels"); var svg = root.querySelector(".overview-tutorial-lines");
    layer.innerHTML = ""; while (svg.lastChild && svg.lastChild.nodeName.toLowerCase() !== "defs") svg.removeChild(svg.lastChild);
    svg.setAttribute("viewBox", "0 0 " + window.innerWidth + " " + window.innerHeight);
    var labelWidth = Math.min(148, Math.max(118, Math.floor(window.innerWidth * 0.39)));
    defs.forEach(function(def) {
        var target = document.querySelector(def.selector); if (!target) return;
        var rect = target.getBoundingClientRect(); var centerX = rect.left + rect.width / 2; var centerY = rect.top + rect.height / 2;
        var label = document.createElement("div"); label.className = "overview-tutorial-label " + def.place;
        label.style.width = labelWidth + "px"; label.innerHTML = "<b>" + escapeHtml(copy[def.key][0]) + "</b><span>" + escapeHtml(copy[def.key][1]) + "</span>"; layer.appendChild(label);
        var height = label.offsetHeight || 48; var gap = 12; var left; var top; var startX; var startY;
        var calloutBase = Math.max(112, Math.min(180, window.innerHeight * 0.22));
        if (def.place === "callout-left") { left = 8; top = calloutBase; startX = left + labelWidth / 2; startY = top; }
        else if (def.place === "callout-center") { left = (window.innerWidth - labelWidth) / 2; top = calloutBase + height + 12; startX = left + labelWidth / 2; startY = top; }
        else if (def.place === "callout-right") { left = window.innerWidth - labelWidth - 8; top = calloutBase; startX = left + labelWidth / 2; startY = top; }
        else if (def.place === "left") { left = rect.left - labelWidth - gap; top = centerY - height / 2; startX = left + labelWidth; startY = top + height / 2; }
        else if (def.place === "right") { left = rect.right + gap; top = centerY - height / 2; startX = left; startY = top + height / 2; }
        else if (def.place === "above") { left = centerX - labelWidth / 2; top = rect.top - height - gap; startX = left + labelWidth / 2; startY = top + height; }
        else { left = centerX - labelWidth / 2; top = rect.bottom + gap; startX = left + labelWidth / 2; startY = top; }
        left = Math.max(8, Math.min(window.innerWidth - labelWidth - 8, left)); top = Math.max(54, Math.min(window.innerHeight - height - 58, top));
        if (def.place.indexOf("callout-") === 0) { startX = left + labelWidth / 2; startY = top; }
        else if (def.place === "left") { startX = left + labelWidth; startY = top + height / 2; } else if (def.place === "right") { startX = left; startY = top + height / 2; } else if (def.place === "above") { startX = left + labelWidth / 2; startY = top + height; } else { startX = left + labelWidth / 2; startY = top; }
        label.style.left = left + "px"; label.style.top = top + "px";
        var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", startX); line.setAttribute("y1", startY); line.setAttribute("x2", centerX); line.setAttribute("y2", centerY); line.setAttribute("marker-end", "url(#overview-arrow)"); svg.appendChild(line);
        var ring = document.createElement("div"); ring.className = "overview-tutorial-ring"; ring.style.left = (rect.left - 5) + "px"; ring.style.top = (rect.top - 5) + "px"; ring.style.width = (rect.width + 10) + "px"; ring.style.height = (rect.height + 10) + "px"; layer.appendChild(ring);
    });
    root.querySelector(".overview-tutorial-done").textContent = copy.done;
    root.querySelector(".overview-tutorial-close").setAttribute("aria-label", (UI_TEXT[currentLang] || UI_TEXT.ko).close);
}
function finishOverviewTutorial() { var root = document.getElementById("overview-tutorial"); if (root) root.classList.remove("show"); beginRecording(); syncTutorialHelpHint(); }
function syncTutorialHelpHint() {
    var btn = document.getElementById("help-btn"); if (!btn) return;
    var known = localStorage.getItem(TUTORIAL_HELP_KNOWN_KEY) === "yes"; var copy = OVERVIEW_TUTORIAL_COPY[currentLang] || OVERVIEW_TUTORIAL_COPY.ko;
    btn.classList.toggle("tutorial-hint", !known); btn.setAttribute("data-tutorial-label", copy.help[0]);
}
function ensureInteractiveTutorial() {
    if (document.getElementById("interactive-tutorial")) return;
    var root = document.createElement("div"); root.id = "interactive-tutorial"; root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true");
    root.innerHTML = '<div class="interactive-tutorial-shade"></div><div class="interactive-tutorial-focus"></div><div class="interactive-tutorial-tip"><button type="button" class="interactive-tutorial-close">×</button><div class="interactive-tutorial-progress"></div><div class="interactive-tutorial-title"></div><div class="interactive-tutorial-desc"></div><div class="interactive-tutorial-actions"><button type="button" class="interactive-tutorial-back"></button><button type="button" class="interactive-tutorial-next"></button></div></div>';
    document.body.appendChild(root);
    root.querySelector(".interactive-tutorial-close").addEventListener("click", finishInteractiveTutorial);
    root.querySelector(".interactive-tutorial-back").addEventListener("click", function() { if (interactiveTutorialIndex > 0) { interactiveTutorialIndex--; renderInteractiveTutorialStep(); } });
    root.querySelector(".interactive-tutorial-next").addEventListener("click", function() { if (interactiveTutorialIndex >= interactiveTutorialSteps.length - 1) finishInteractiveTutorial(); else { interactiveTutorialIndex++; renderInteractiveTutorialStep(); } });
    window.addEventListener("resize", function() { if (root.classList.contains("show")) renderInteractiveTutorialStep(); });
}
function renderInteractiveTutorialStep() {
    var root = document.getElementById("interactive-tutorial");
    var step = interactiveTutorialSteps[interactiveTutorialIndex];
    if (!root || !step) return;
    if (step.page === "menu") {
        toggleSidebar(true);
        if (interactiveTutorialIndex === 8) switchAllTab("photo");
    } else toggleSidebar(false);
    requestAnimationFrame(function() {
        var target = document.querySelector(step.selector);
        if (!target) { if (interactiveTutorialIndex < interactiveTutorialSteps.length - 1) { interactiveTutorialIndex++; renderInteractiveTutorialStep(); } return; }
        var rect = target.getBoundingClientRect();
        var pad = 7;
        var focus = root.querySelector(".interactive-tutorial-focus");
        focus.style.left = Math.max(4, rect.left - pad) + "px";
        focus.style.top = Math.max(4, rect.top - pad) + "px";
        focus.style.width = Math.min(window.innerWidth - 8, rect.width + pad * 2) + "px";
        focus.style.height = Math.min(window.innerHeight - 8, rect.height + pad * 2) + "px";
        var labels = INTERACTIVE_TUTORIAL_LABELS[currentLang] || INTERACTIVE_TUTORIAL_LABELS.ko;
        var tip = root.querySelector(".interactive-tutorial-tip");
        root.querySelector(".interactive-tutorial-close").setAttribute("aria-label", labels.close);
        root.querySelector(".interactive-tutorial-progress").textContent = labels.step + " " + (interactiveTutorialIndex + 1) + " / " + interactiveTutorialSteps.length;
        root.querySelector(".interactive-tutorial-title").textContent = step.title;
        root.querySelector(".interactive-tutorial-desc").textContent = step.desc;
        var back = root.querySelector(".interactive-tutorial-back"); var next = root.querySelector(".interactive-tutorial-next");
        back.textContent = labels.back; back.disabled = interactiveTutorialIndex === 0;
        next.textContent = interactiveTutorialIndex === interactiveTutorialSteps.length - 1 ? labels.done : labels.next;
        tip.style.left = "12px"; tip.style.right = "12px"; tip.style.top = "auto"; tip.style.bottom = "auto";
        var placeBelow = rect.bottom + 190 < window.innerHeight;
        tip.classList.toggle("below", placeBelow); tip.classList.toggle("above", !placeBelow);
        if (placeBelow) tip.style.top = Math.min(window.innerHeight - 180, rect.bottom + 22) + "px";
        else tip.style.bottom = Math.max(12, window.innerHeight - rect.top + 22) + "px";
        var center = Math.max(22, Math.min(window.innerWidth - 22, rect.left + rect.width / 2));
        var tipRect = tip.getBoundingClientRect();
        tip.style.setProperty("--tutorial-arrow-x", Math.max(22, Math.min(tipRect.width - 22, center - tipRect.left)) + "px");
    });
}
function finishInteractiveTutorial() {
    var root = document.getElementById("interactive-tutorial");
    if (root) root.classList.remove("show");
    toggleSidebar(false);
}
function switchHelpGuidePage(page) {
    helpGuidePage = page === "menu" ? "menu" : "main";
    if (helpGuidePage === "menu") {
        // The menu guide must reveal the real menu, not merely describe it.
        var popup = document.getElementById("help-popup");
        if (popup) popup.classList.remove("show");
        toggleSidebar(true);
        switchAllTab("photo");
        return;
    }
    toggleSidebar(false);
    renderHelpGuide();
}
function getTutorialControlSelector(page, index) {
    var main = ["#loc-btn", "#photo-btn", "#loc-btn", "#traffic-btn", "#hud-handle", "#lang-toggle", "#ham-btn", "#help-btn"];
    var menu = ["#tab-photo", "#tab-gpx", "#tab-visit", "#tab-item", "#map-layer-header"];
    return (page === "menu" ? menu : main)[index] || "";
}
function createTutorialVisual(page, index, fallback) {
    var visual = document.createElement("span");
    visual.className = "tutorial-guide-icon";
    // HUD 핸들을 통째로 복제하면 내부의 absolute 진행 막대가 도움말 전체로
    // 늘어날 수 있으므로 상태 버튼은 전용 심볼로 표시한다.
    if (page === "main" && (index === 0 || index === 2 || index === 4 || index === 6)) {
        if (index === 4) {
            visual.classList.add("tutorial-symbol", "status");
            visual.textContent = "♙";
            return visual;
        }
        visual.classList.add("tutorial-symbol", index === 0 ? "record" : index === 2 ? "location" : "menu");
        if (index === 6) visual.innerHTML = "<i></i><i></i><i></i>";
        return visual;
    }
    var source = document.querySelector(getTutorialControlSelector(page, index));
    if (!source) { visual.textContent = fallback; return visual; }
    var copy = source.cloneNode(true);
    copy.removeAttribute("id");
    copy.removeAttribute("onclick");
    copy.removeAttribute("title");
    copy.removeAttribute("aria-label");
    copy.className = "tutorial-control-copy";
    copy.removeAttribute("style");
    copy.querySelectorAll("[id], [onclick], [style]").forEach(function(el) {
        el.removeAttribute("id");
        el.removeAttribute("onclick");
        el.removeAttribute("style");
    });
    visual.classList.add("real-control");
    visual.appendChild(copy);
    return visual;
}
function renderHelpGuide() {
    var panel = document.getElementById("hpanel-info");
    if (!panel) return;
    var copy = HELP_GUIDE_COPY[currentLang] || HELP_GUIDE_COPY.ko;
    var items = helpGuidePage === "menu" ? copy.menu_items : copy.main_items;
    panel.innerHTML = "";
    var nav = document.createElement("div"); nav.className = "help-guide-nav";
    [["main", copy.main], ["menu", copy.menu]].forEach(function(entry) {
        var button = document.createElement("button"); button.type = "button"; button.className = "help-guide-page-btn" + (helpGuidePage === entry[0] ? " active" : ""); button.textContent = entry[1];
        button.addEventListener("click", function() { switchHelpGuidePage(entry[0]); }); nav.appendChild(button);
    });
    var heading = document.createElement("h3"); heading.className = "help-guide-heading"; heading.textContent = helpGuidePage === "menu" ? copy.heading_menu : copy.heading_main;
    var list = document.createElement("div"); list.className = "tutorial-guide-list";
    items.forEach(function(item, index) {
        var row = document.createElement("div"); row.className = "tutorial-guide-item";
        var icon = createTutorialVisual(helpGuidePage, index, item[0]);
        var text = document.createElement("div"); text.className = "tutorial-guide-text";
        var title = document.createElement("b"); title.textContent = item[1];
        var desc = document.createElement("span"); desc.textContent = item[2];
        text.appendChild(title); text.appendChild(desc); row.appendChild(icon); row.appendChild(text); list.appendChild(row);
    });
    var replay = document.createElement("button");
    replay.type = "button";
    replay.className = "tutorial-replay-btn";
    replay.textContent = HELP_GUIDE_REPLAY_LABELS[currentLang] || HELP_GUIDE_REPLAY_LABELS.ko;
    replay.addEventListener("click", function() {
        startTutorial();
    });
    panel.appendChild(replay); panel.appendChild(nav); panel.appendChild(heading); panel.appendChild(list);
}
function applyHelpLang(t) {
    setText("htab-ask", t.help_tab_ask);
    setText("htab-info", t.help_tab_info);
    setHtml("help-ask-copy", t.help_ask_copy);
    setHtml("help-notice", t.help_notice);
    setText("help-link", t.help_link);
    renderHelpGuide();
    updateLocalMarketPriceLanguage();
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
    var tabPhoto = document.querySelector("#tab-photo .sidebar-tab-text");
    var tabGpx = document.querySelector("#tab-gpx .sidebar-tab-text");
    var tabBadge = document.querySelector("#tab-badge .sidebar-tab-text");
    var tabVisit = document.querySelector("#tab-visit .sidebar-tab-text");
    var tabItem = document.querySelector("#tab-item .sidebar-tab-text");
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
    setText("map-layer-title", t.map_layer_title);
    setText("layer-name-library", t.layer_library);
    setText("layer-name-restaurant", t.layer_restaurant);
    setText("layer-name-lodging", t.layer_lodging);
    setText("layer-name-restroom", t.layer_restroom);
    setText("layer-name-community", t.layer_community);
    syncFogButton();
    syncRecordingUI();
    syncLanguageButtons(lang);
    renderTourCards();
    renderFestivalStrip();
    translateTourItemsForLang(lang, tourItems);
    translateTourItemsForLang(lang, festivalItems);
    updateBadgeList();
    applyHelpLang(t);
    applyHudLang(t);
    renderLibraryMarkers(lang);
    translateLibraryItemsForLang(lang);
    refreshLibraryMarkerLabels(lang);
    refreshRestroomMarkerLabels(lang);
    refreshCommunityMarkerLabels(lang);
    updatePhotoList();
    updateGpxSavedList();
    updateBadgeList();
    updateVisitList();
    updateDailyMissions();
    applySpecialPinLanguage();
    renderSpecialPins();
    syncTutorialHelpHint();
}

function toggleLang(lang) {
    lang = normalizeLang(lang);
    currentLang = lang;
    try { localStorage.setItem(LANGUAGE_STORAGE_KEY, lang); } catch (_) {}
    syncLanguageButtons(lang);
    try {
        applyUILang(lang);
    } catch (error) {
        console.error("Language UI update failed", error);
        syncRecordingUI();
        renderTourCards();
        renderFestivalStrip();
        translateTourItemsForLang(lang, tourItems);
        translateTourItemsForLang(lang, festivalItems);
    }
    try { refreshLibraryMarkerLabels(lang); } catch (error) { console.warn("Library language refresh failed", error); }
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

function translateTourItemsForLang(lang, items) {
    lang = normalizeLang(lang);
    items = items || tourItems;
    var targetLang = getTranslateLang(lang);
    // 번역이 필요한 텍스트를 출발 언어별로 모아 한 번에 배치 번역한다.
    var jobsBySource = {};
    items.forEach(function(item) {
        if (!item) return;
        item._titleByLang = item._titleByLang || {};
        item._addrByLang = item._addrByLang || {};
        var sourceLang = normalizeLang(item._sourceLang || (hasHangul(item.title || item.addr1) ? "ko" : "en"));
        if (sourceLang === lang) return;
        var bucket = jobsBySource[sourceLang] || (jobsBySource[sourceLang] = []);
        if (item.title && !item._titleByLang[lang]) bucket.push({ item: item, field: "_titleByLang", text: item.title });
        if (item.addr1 && !item._addrByLang[lang]) bucket.push({ item: item, field: "_addrByLang", text: item.addr1 });
    });
    var sources = Object.keys(jobsBySource);
    if (!sources.length) return Promise.resolve();
    var tasks = sources.map(function(sourceLang) {
        var bucket = jobsBySource[sourceLang];
        return translateTexts(bucket.map(function(job) { return job.text; }), getTranslateLang(sourceLang), targetLang).then(function(translations) {
            bucket.forEach(function(job, idx) {
                var translated = translations[idx] || "";
                if (!isClearlyUntranslated(job.text, translated, lang)) job.item[job.field][lang] = translated;
            });
        });
    });
    return Promise.all(tasks).then(function() {
        if (lang !== currentLang) return;
        renderTourCards();
        addTourMarkers();
        if (tourExpanded) renderFestivalStrip();
    });
}

function getTourDisplayTitle(item) { return (item && item._titleByLang && item._titleByLang[currentLang]) || (item && item.title) || ""; }
function getTourDisplayAddr(item) { return (item && item._addrByLang && item._addrByLang[currentLang]) || (item && item.addr1) || ""; }

// Collection items
var COLLECTION_KEY = "giloa-collection";
var badges = []; var visitStamps = []; var items = [];

function badgeGlyph(kind) {
    var P = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">';
    var glyphs = {
        star: P + '<path d="M12 3.2l2.6 5.4 5.9.8-4.3 4.1 1.1 5.8L12 16.6l-5.3 2.7 1.1-5.8-4.3-4.1 5.9-.8z"/></svg>',
        camera: P + '<rect x="3" y="6" width="18" height="14" rx="2.5"/><circle cx="12" cy="13" r="4"/><path d="M8.5 6l1.2-2h4.6l1.2 2"/></svg>',
        footprints: P + '<ellipse cx="8" cy="7.5" rx="2.6" ry="3.6"/><path d="M6.6 12.4h2.8v1.8a1.4 1.4 0 0 1-2.8 0z" fill="currentColor" stroke="none"/><ellipse cx="16" cy="13.5" rx="2.6" ry="3.6"/><path d="M14.6 18.4h2.8v1.8a1.4 1.4 0 0 1-2.8 0z" fill="currentColor" stroke="none"/></svg>',
        mountain: P + '<path d="M3 19.5L9.5 8l3.4 6 2.1-3.4L21 19.5z"/><path d="M15 4.5v4.2"/><path d="M15 4.5l3.6 1.2L15 6.9"/></svg>',
        sunrise: P + '<path d="M4 17.5h16"/><path d="M7 17.5a5 5 0 0 1 10 0"/><path d="M12 6.2v2.3M5.4 9.6l1.6 1.6M18.6 9.6L17 11.2M3 13.4h2.3M18.7 13.4H21"/></svg>',
        sparkles: P + '<path d="M10 4.5l1.5 3.7 3.7 1.5-3.7 1.5L10 14.9l-1.5-3.7-3.7-1.5 3.7-1.5z"/><path d="M17.5 13l.9 2.2 2.2.9-2.2.9-.9 2.2-.9-2.2-2.2-.9 2.2-.9z"/></svg>',
        photostack: P + '<rect x="6.5" y="3.5" width="14" height="11" rx="2" transform="rotate(6 13.5 9)"/><rect x="3.5" y="8" width="14" height="11" rx="2"/><circle cx="7.5" cy="12" r="1.4"/><path d="M3.5 16.5l3.6-3.4a1.5 1.5 0 0 1 2.1 0l2 1.9 2.6-3.1a1.5 1.5 0 0 1 2.3 0l1.4 1.7"/></svg>',
        compass: P + '<circle cx="12" cy="12" r="8.5"/><path d="M15.5 8.5l-2.1 5-5 2.1 2.1-5z" fill="currentColor" stroke="none"/></svg>',
        fireworks: P + '<circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><path d="M12 3.5v3.6M12 16.9v3.6M3.5 12h3.6M16.9 12h3.6M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18"/><circle cx="12" cy="3.5" r=".7" fill="currentColor" stroke="none"/><circle cx="20.5" cy="12" r=".7" fill="currentColor" stroke="none"/><circle cx="3.5" cy="12" r=".7" fill="currentColor" stroke="none"/><circle cx="12" cy="20.5" r=".7" fill="currentColor" stroke="none"/></svg>'
    };
    return glyphs[kind] || glyphs.star;
}
var BADGE_DEFS = [
    { id: "first_memory", color: "#ffd84d", icon: badgeGlyph("star"),
      name: { ko: "첫 기억", en: "First Memory", ja: "初めての記憶", zh: "第一个记忆" },
      desc: { ko: "첫 번째 기억을 남겨보세요", en: "Save your first memory", ja: "最初の記憶を残そう", zh: "保存你的第一个记忆" } },
    { id: "first_photo", color: "#a78bfa", icon: badgeGlyph("camera"),
      name: { ko: "첫 사진", en: "First Photo", ja: "初めての写真", zh: "第一张照片" },
      desc: { ko: "첫 번째 사진을 지도에 남겨보세요", en: "Save your first photo", ja: "最初の写真を残そう", zh: "保存你的第一张照片" } },
    { id: "first_10km", color: "#4db8ff", icon: badgeGlyph("footprints"),
      name: { ko: "10km 걷기", en: "10km Walker", ja: "10km歩行", zh: "步行10公里" },
      desc: { ko: "누적 10km를 걸어보세요", en: "Walk 10km in total", ja: "累計10km歩こう", zh: "累计步行10公里" } },
    { id: "first_50km", color: "#34d399", icon: badgeGlyph("mountain"),
      name: { ko: "50km 정복", en: "50km Trekker", ja: "50km踏破", zh: "征服50公里" },
      desc: { ko: "누적 50km를 걸어보세요", en: "Walk 50km in total", ja: "累計50km歩こう", zh: "累计步行50公里" } },
    { id: "early_bird", color: "#fb923c", icon: badgeGlyph("sunrise"),
      name: { ko: "새벽의 기록자", en: "Early Bird", ja: "夜明けの記録者", zh: "黎明记录者" },
      desc: { ko: "새벽 5시 이전에 기록해 보세요", en: "Record before 5 AM", ja: "朝5時前に記録しよう", zh: "凌晨5点前记录" } },
    { id: "memory_5", color: "#f472b6", icon: badgeGlyph("sparkles"),
      name: { ko: "기억 수집가", en: "Memory Collector", ja: "記憶コレクター", zh: "记忆收藏家" },
      desc: { ko: "기억 5개를 모아보세요", en: "Save 5 memories", ja: "記憶を5つ集めよう", zh: "收集5个记忆" } },
    { id: "photo_10", color: "#8b5cf6", icon: badgeGlyph("photostack"),
      name: { ko: "사진 수집가", en: "Photo Collector", ja: "写真コレクター", zh: "照片收藏家" },
      desc: { ko: "사진 10장을 모아보세요", en: "Save 10 photos", ja: "写真を10枚集めよう", zh: "收集10张照片" } },
    { id: "tour_visit", color: "#2dd4bf", icon: badgeGlyph("compass"),
      name: { ko: "탐험가", en: "Explorer", ja: "探検家", zh: "探险家" },
      desc: { ko: "관광지나 문화시설을 방문해 보세요", en: "Visit an attraction", ja: "観光地を訪れよう", zh: "参观景点或文化设施" } },
    { id: "festival_visit", color: "#f87171", icon: badgeGlyph("fireworks"),
      name: { ko: "축제의 손님", en: "Festival Visitor", ja: "祭りの客人", zh: "节日访客" },
      desc: { ko: "축제 현장을 방문해 보세요", en: "Visit a festival", ja: "祭りを訪れよう", zh: "参观节日现场" } },
    { id: "image_hyundai_fountain", color: "#38bdf8", icon: makeImageBadgeIcon("fountain"), character: true,
      name: { ko: "분수 친구", en: "Fountain Friend", ja: "噴水の友", zh: "喷泉朋友" },
      desc: { ko: "현대 분수를 사진으로 찾아보세요", en: "Recognize the fountain", ja: "噴水を写真で見つけよう", zh: "用照片找到喷泉" } },
    { id: "image_heendy", color: "#f9a8d4", icon: makeImageBadgeIcon("heendy"), character: true,
      name: { ko: "흰디 친구", en: "Heendy Friend", ja: "ヒンディの友", zh: "Heendy朋友" },
      desc: { ko: "흰디를 사진으로 찾아보세요", en: "Recognize Heendy", ja: "ヒンディを写真で見つけよう", zh: "用照片找到Heendy" } },
    { id: "image_hanam_bangul", color: "#fbbf24", icon: makeImageBadgeIcon("duo"), character: true,
      name: { ko: "방울이 친구", en: "Bangul Friend", ja: "バンウルの友", zh: "Bangul朋友" },
      desc: { ko: "하남이와 방울이를 사진으로 찾아보세요", en: "Recognize Bangul", ja: "バンウルを写真で見つけよう", zh: "用照片找到Bangul" } },
    { id: "image_dasan_street", color: "#a3e635", icon: makeImageBadgeIcon("street"), character: true,
      name: { ko: "거리 탐방가", en: "Street Explorer", ja: "通りの探訪者", zh: "街道探索者" },
      desc: { ko: "다산 거리를 사진으로 찾아보세요", en: "Recognize Dasan Street", ja: "茶山通りを写真で見つけよう", zh: "用照片找到茶山街" } },
];
function getBadgeName(def) { return (def.name && (def.name[currentLang] || def.name.ko)) || ""; }
function getBadgeDesc(def) { return (def.desc && (def.desc[currentLang] || def.desc.ko)) || ""; }

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
    } catch(e) { console.warn("수집 정보 복원 실패", e); }
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
    var t = UI_TEXT[currentLang] || UI_TEXT.ko;
    showCollectionToast("\uD83C\uDFC5 " + (t.badge_earned || "뱃지 획득!") + " " + getBadgeName(def));
}

function addVisitStamp(name, type, lat, lng) {
    var now = new Date();
    visitStamps.push({ name: name, type: type, lat: lat, lng: lng, visitedAt: now.getTime(), dateString: now.toLocaleDateString("ko-KR") });
    saveCollection();
    updateVisitList();
    if (type === "관광지" || type === "문화시설") earnBadge("tour_visit");
    if (type === "축제") earnBadge("festival_visit");
    showCollectionToast(name + " 방문 기록!");
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
    var container = document.getElementById("item-list");
    if (!container) return;
    var t = UI_TEXT[currentLang] || UI_TEXT.ko;
    container.innerHTML = "";
    var earnedMap = {};
    badges.forEach(function(b) { earnedMap[b.id] = b; });
    var earnedCount = BADGE_DEFS.filter(function(d) { return earnedMap[d.id]; }).length;
    // 진행도 헤더 — 수집 현황을 한눈에
    var head = document.createElement("div");
    head.className = "badge-progress-row";
    head.innerHTML = '<span class="badge-progress-count"><b>' + earnedCount + '</b> / ' + BADGE_DEFS.length + ' ' + escapeHtml(t.badge_progress || "획득") + '</span>'
        + '<span class="badge-progress-track"><span class="badge-progress-fill" style="width:' + Math.round(earnedCount / BADGE_DEFS.length * 100) + '%"></span></span>';
    container.appendChild(head);
    // 획득한 뱃지를 앞으로, 미획득은 실루엣으로 뒤에
    var sorted = BADGE_DEFS.slice().sort(function(a, b) {
        var ea = earnedMap[a.id] ? 1 : 0, eb = earnedMap[b.id] ? 1 : 0;
        if (ea !== eb) return eb - ea;
        if (ea && eb) return earnedMap[b.id].earnedAt - earnedMap[a.id].earnedAt;
        return 0;
    });
    sorted.forEach(function(def) {
        var earned = earnedMap[def.id];
        var item = document.createElement("div");
        item.className = "badge-medal" + (earned ? " earned" : " locked") + (def.character ? " character" : "");
        item.style.setProperty("--badge-c", def.color || "#ffd84d");
        var coin = document.createElement("div");
        coin.className = "badge-coin";
        coin.innerHTML = def.icon;
        var name = document.createElement("div");
        name.className = "badge-name";
        name.textContent = getBadgeName(def);
        var sub = document.createElement("div");
        sub.className = earned ? "badge-date" : "badge-hint";
        sub.textContent = earned ? earned.dateString : getBadgeDesc(def);
        item.appendChild(coin);
        item.appendChild(name);
        item.appendChild(sub);
        item.title = getBadgeDesc(def);
        container.appendChild(item);
    });
}
function updateItemList() { updateBadgeList(); }

function updateVisitList() {
    var container = document.getElementById("visit-list");
    if (!container) return;
    var t = UI_TEXT[currentLang] || UI_TEXT.ko;
    if (visitStamps.length === 0) { container.innerHTML = '<p class="empty-message">' + (t.empty_visit || "아직 방문한 장소가 없습니다.") + '</p>'; return; }
    container.innerHTML = "";
    visitStamps.slice().sort(function(a,b){ return b.visitedAt - a.visitedAt; }).forEach(function(v) {
        var typeIcons = { "Attraction": "Spot", "Culture": "Culture", "Festival": "Fest", "Leports": "Sport", "Course": "Route" };
        var icon = typeIcons[v.type] || "Place";
        var el = document.createElement("div");
        el.className = "visit-item";
        el.innerHTML = '<div class="visit-icon">' + icon + '</div><div class="visit-info"><div class="visit-name">' + escapeHtml(v.name) + '</div><div class="visit-date">' + v.dateString + '</div></div>';
        el.addEventListener("click", function() { setSelectedDestination(v.lat, v.lng, v.name || "방문 장소"); map.flyTo([v.lat, v.lng], 17); toggleSidebar(false); });
        container.appendChild(el);
    });
}

function showCollectionToast(msg) {
    var toast = document.createElement("div");
    toast.style.cssText = "position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:rgba(20,20,35,0.95);border:1px solid rgba(255,255,255,0.2);color:#fff;padding:10px 18px;border-radius:20px;font-size:13px;font-weight:600;z-index:9999;white-space:nowrap;backdrop-filter:blur(10px);";
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(function() { toast.remove(); }, 2500);
}

// 시야 방향 부채꼴 표시
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
/*
 * PROJECT GILOA — OPEN LETTER
 *
 * 우리는 혼자 살아갈 수 없습니다.
 * 오늘 내가 만든 것은 나 혼자만의 결과가 아닙니다.
 * 부모님, 친구, 선생님, 대한민국, 그리고 이름도 모르는 수많은 사람들의
 * 사랑과 노력 위에서 만들어졌습니다.
 *
 * 그 모든 만남과 배움의 뒤에는 나를 인도하시고 이 길을 허락하신
 * 하나님의 은혜가 있었다고 믿습니다.
 *
 * 길로아는 단지 ‘내가 만든 지도’가 아니라, 하나님께서 우리에게 허락하신
 * 세상과 ‘우리 모두가 이어온 길’을 기억하기 위해 만들어졌습니다.
 *
 * 저는 예수 그리스도를 믿는 사람으로서 사랑, 감사, 정직, 섬김,
 * 그리고 소망의 가치를 세상에 전하고 싶습니다. 이 믿음을 강요하기보다
 * 길로아가 사람을 돕고, 지역을 사랑하며, 서로의 발걸음을 존중하는 모습을
 * 통해 하나님의 사랑이 조금이나마 전해지기를 바랍니다.
 *
 * 누군가 이 아이디어를 발전시켜 사람을 살리고 더 좋은 세상을 만든다면,
 * 그 또한 하나님께서 이어 가시는 길이자 길로아가 걸어간 길의 일부라고
 * 믿습니다. 당신의 발걸음이 누군가에게 사랑과 소망을 전하고,
 * 세상의 새로운 길이 되기를 바랍니다.
 *
 * 길로아는 한 사람이 홀로 완성할 수 없습니다. 티처블 머신 학습, 현실 장소
 * 마킹, 지역의 새로운 길을 발견하는 일에는 많은 사람의 참여가 필요합니다.
 * 추후 공식 참여 방법과 기준을 안내하여 누구나 기여할 수 있도록 하되,
 * 현실의 발걸음과 온라인의 기록이 하나의 공동 세계로 이어질 수 있도록
 * 기여 결과는 여러 플랫폼으로 흩어지지 않고 공식 길로아 안에 모이기를
 * 바랍니다.
 *
 * We cannot live alone. What I have created today is not the result of my
 * efforts alone. It was built upon the love and hard work of my parents,
 * friends, teachers, the Republic of Korea, and countless people whose names
 * I may never know.
 *
 * Behind every encounter and lesson, I believe there has been the grace of
 * God—guiding me and allowing me to walk this path. GILOA is not simply
 * “a map I created.” It was made to remember the world God has entrusted to us
 * and “the paths we have all continued together.”
 *
 * As a believer in Jesus Christ, I hope to share the Gospel’s values of love,
 * gratitude, honesty, service, and hope. Rather than forcing this faith upon
 * anyone, I hope God’s love may be conveyed through the way GILOA helps people,
 * cares for local communities, and respects each person’s footsteps.
 *
 * If someone develops this idea further to save lives and build a better world,
 * I believe that, too, will be a path God continues—and part of the path GILOA
 * has walked. May your footsteps bring love and hope to someone and become a
 * new path for the world.
 *
 * GILOA cannot be completed by one person alone. Training Teachable Machine
 * models, marking real-world places, and discovering local paths require many
 * people. Future official contribution guidelines will explain how anyone can
 * participate. Contributions should come together within the official GILOA
 * platform so that real footsteps and online records remain one shared world,
 * rather than becoming fragmented across separate platforms.
 *
 * Project GILOA
 * Jeremy Lee
 *
 * Full bilingual letter: OPEN_LETTER.md
 * Copyright (c) 2026 Jeremy Lee. All rights reserved.
 */

const STORAGE_KEY = "giloa-v7";
const STORAGE_BACKUP_KEY = STORAGE_KEY + "-backup";
const STORAGE_CORRUPT_KEY = STORAGE_KEY + "-corrupt";
const STORAGE_TEMP_KEY = STORAGE_KEY + "-pending";
const FOG_ENABLED_KEY = "giloa-fog-enabled";
const MAP_LAYER_KEY = "giloa-map-layers";
const MAP_LAYER_ORDER_KEY = "giloa-map-layer-order-v1";
const MAP_LAYER_RADIUS_M = 300;
const GPX_SAVES_KEY = "giloa-gpx-saves";
const GPX_IMPORT_MAX_BYTES = 10 * 1024 * 1024;
const TUTORIAL_DONE_KEY = "giloa-tutorial-completed";
const INTRO_STORY_SEEN_KEY = "giloa_intro_story_seen_v5";
// v2 forces the redesigned first-run language screen to appear once for
// users who had already selected a language in an older build.
const LANGUAGE_SELECTED_KEY = "giloa-language-selected-v2";
const LANGUAGE_PREFERENCE_KEY = "giloa-language-v1";
const FIRST_MEETING_DONE_KEY = "giloa-first-meeting-done-v1";
const GILOA_UPDATE_VERSION = "1.4.27";
const GILOA_UPDATE_SEEN_KEY = "giloa-update-seen-" + GILOA_UPDATE_VERSION;
const FOG_ALPHA_BASE = 0.40;
const FOG_ALPHA_PER_LV = 0;
function getFogAlpha() { return FOG_ALPHA_BASE; }
const FOG_RADIUS_M = 18;
const VISION_CONE_RADIUS_M = 70;
const VISION_CONE_SPREAD_DEG = 70;
const MIN_MOVE_M = 15;
// Raw fixes up to 100 m are useful route evidence. Display smoothing and
// implausible-jump rejection happen after the raw point has been persisted.
const MAX_ACCURACY_M = 100;
// Keep the live marker responsive, but never turn a short GPS jump into
// travelled distance or a long fog-clearing line. Samples faster than normal
// road movement are rejected as likely cell/Wi-Fi jumps.
const MAX_PATH_SPEED_MPS = 15;
// A fix received less than a minute after the previous one must remain within
// a fast bicycle pace. This prevents brief cell/Wi-Fi jumps from drawing rays
// while leaving the less strict rule available for longer, real GPS gaps.
const PATH_SHORT_GAP_MAX_SPEED_MPS = 8.5;
const PATH_JUMP_BASE_TOLERANCE_M = 25;
const PATH_SPIKE_WINDOW_MS = 2 * 60 * 1000;
const PATH_SPIKE_MIN_EXCURSION_M = 45;
const STAY_ACCURACY_FACTOR = 1.5;
const MAX_STAY_RADIUS_M = 75;
const SAVE_DELAY_MS = 800;
const CHECKPOINT_INTERVAL_MS = 20000;
const GILOA_PERSISTENCE_DEBUG = false;
const GILOA_DEBUG = false;
const NETWORK_TIMEOUT_MS = 12000;
const NETWORK_RETRY_DELAY_MS = 450;
function waitForNetworkDelay(delay) {
    return new Promise(function(resolve) { setTimeout(resolve, Math.max(0, delay || 0)); });
}
function createHttpError(status) {
    var error = new Error("HTTP " + status);
    error.status = Number(status) || 0;
    return error;
}
function requestJsonByXhr(url, timeoutMs, externalSignal) {
    return new Promise(function(resolve, reject) {
        if (typeof XMLHttpRequest !== "function") { reject(new Error("No supported network transport")); return; }
        var xhr = new XMLHttpRequest();
        var settled = false;
        function finish(error, value) {
            if (settled) return;
            settled = true;
            if (externalSignal && typeof externalSignal.removeEventListener === "function") externalSignal.removeEventListener("abort", abortRequest);
            error ? reject(error) : resolve(value);
        }
        function abortRequest() { try { xhr.abort(); } catch (_) {} finish(new Error("Request aborted")); }
        if (externalSignal && externalSignal.aborted) { finish(new Error("Request aborted")); return; }
        if (externalSignal && typeof externalSignal.addEventListener === "function") externalSignal.addEventListener("abort", abortRequest);
        xhr.open("GET", url, true);
        xhr.timeout = timeoutMs;
        xhr.onreadystatechange = function() {
            if (xhr.readyState !== 4 || settled) return;
            if (xhr.status < 200 || xhr.status >= 300) { finish(createHttpError(xhr.status)); return; }
            try { finish(null, JSON.parse(xhr.responseText || "null")); }
            catch (_) { finish(new Error("Invalid JSON response")); }
        };
        xhr.onerror = function() { finish(new Error("Network request failed")); };
        xhr.ontimeout = function() { finish(new Error("Network request timed out")); };
        xhr.onabort = function() { finish(new Error("Request aborted")); };
        try { xhr.send(); } catch (error) { finish(error); }
    });
}
function requestJsonOnce(url, options) {
    options = options || {};
    var timeoutMs = Math.max(1000, Number(options.timeoutMs) || NETWORK_TIMEOUT_MS);
    var externalSignal = options.signal || null;
    if (navigator.onLine === false && /^https?:/i.test(url)) return Promise.reject(new Error("Device is offline"));
    if (typeof fetch !== "function") return requestJsonByXhr(url, timeoutMs, externalSignal);
    return new Promise(function(resolve, reject) {
        var settled = false;
        var controller = typeof AbortController === "function" ? new AbortController() : null;
        function finish(error, value) {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            if (externalSignal && typeof externalSignal.removeEventListener === "function") externalSignal.removeEventListener("abort", abortRequest);
            error ? reject(error) : resolve(value);
        }
        function abortRequest() { if (controller) controller.abort(); finish(new Error("Request aborted")); }
        if (externalSignal && externalSignal.aborted) { reject(new Error("Request aborted")); return; }
        if (externalSignal && typeof externalSignal.addEventListener === "function") externalSignal.addEventListener("abort", abortRequest);
        var timer = setTimeout(function() { if (controller) controller.abort(); finish(new Error("Network request timed out")); }, timeoutMs);
        fetch(url, controller ? { signal: controller.signal, cache: options.cache || "no-store" } : { cache: options.cache || "no-store" }).then(function(response) {
            if (!response.ok) throw createHttpError(response.status);
            return response.text();
        }).then(function(text) {
            try { finish(null, JSON.parse(text || "null")); }
            catch (_) { finish(new Error("Invalid JSON response")); }
        }).catch(function(error) { finish(error); });
    });
}
function requestJsonWithRetry(url, options) {
    options = options || {};
    var retries = Math.max(0, Number(options.retries) || 0);
    function attempt(remaining) {
        return requestJsonOnce(url, options).catch(function(error) {
            var status = Number(error && error.status) || 0;
            var retryable = !status || status === 408 || status === 429 || status >= 500;
            if (!retryable || remaining <= 0 || navigator.onLine === false || (options.signal && options.signal.aborted)) throw error;
            var delay = (Number(options.retryDelayMs) || NETWORK_RETRY_DELAY_MS) * Math.pow(2, retries - remaining) + Math.floor(Math.random() * 180);
            return waitForNetworkDelay(delay).then(function() { return attempt(remaining - 1); });
        });
    }
    return attempt(retries);
}
const SCREEN_AWAKE_MS = 8 * 60 * 60 * 1000;
const AUTO_RECORDING_MS = 8 * 60 * 60 * 1000;
const MERGE_DISTANCE_M = 6;
const MERGE_TIME_GAP_MS = 2 * 60 * 1000;
// Eight hours at the native five-second sampling interval is about 5,760
// samples. Leave room for foreground/native overlap without thinning bends.
const MAX_PATH_POINTS = 12000;
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
// Never infer a route through missing GPS evidence, even within one session.
// Use fix timestamps so delayed native samples can reconnect measured legs.
const PATH_MAX_FIX_GAP_MS = 60 * 1000;
const PATH_MID_GAP_MAX_MS = 15 * 60 * 1000;
const PATH_LONG_GAP_MAX_MS = 60 * 60 * 1000;
const PATH_MID_GAP_MAX_SPEED_MPS = 8;
const PATH_LONG_GAP_MAX_SPEED_MPS = 3.5;
const PATH_LONG_GAP_MAX_DISTANCE_M = 5000;
const PATH_CONNECT_MAX_ACCURACY_M = 100;
const PHOTO_STORE_PREVIEW = true;
// Compress display previews only; retain original bytes and EXIF separately.
const PHOTO_POPUP_MAX_SIZE = 1600;
const PHOTO_POPUP_JPEG_QUALITY = 0.82;
const PHOTO_POPUP_MIN_QUALITY = 0.70;
const PHOTO_POPUP_TARGET_BYTES = 600 * 1024;
const PHOTO_THUMB_SIZE = 120;
const PHOTO_THUMB_JPEG_QUALITY = 0.74;
const PHOTO_THUMB_MIN_QUALITY = 0.58;
const PHOTO_THUMB_TARGET_BYTES = 24 * 1024;
const PHOTO_ORIGINAL_MAX_BYTES = 32 * 1024 * 1024;
const PHOTO_LOCATION_GOOD_ACCURACY_M = 80;
const PHOTO_LOCATION_MAX_ROUTE_TIME_MS = 15 * 60 * 1000;
const PHOTO_REMOTE_MAX_SIZE = 1920;
const PHOTO_REMOTE_JPEG_QUALITY = 0.9;
const IMAGE_CLASSIFIER_MODEL_URL = "./tm-my-image-model/model.json";
const IMAGE_CLASSIFIER_METADATA_URL = "./tm-my-image-model/metadata.json";
const IMAGE_CLASSIFIER_THRESHOLD = 0.8;
const IMAGE_CLASS_BADGES = {
    "Hyundai Fountain": "image_hyundai_fountain",
    "Heendy": "image_heendy",
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
    zh: LEVEL_TABLE.map(function(row) { return row.title; }),
    es: ["Caminante","Creador de Huellas","Explorador","Constructor de Caminos","Caminante del Viento","Coleccionista de Recuerdos","Viajero sobre Ruedas","Cartógrafo","Cronista de Caminos","Pionero","Explorador Veloz","Viajero Orbital","Viajero Continental","Testigo del Mundo","Cronista del Mundo"],
    fr: ["Promeneur","Traceur de chemins","Explorateur","Bâtisseur de chemins","Marcheur du vent","Collectionneur de souvenirs","Voyageur à deux roues","Cartographe","Chroniqueur des routes","Pionnier","Explorateur éclair","Voyageur des horizons","Traverseur de continents","Témoin du monde","Gardien du monde"]
};
function getLevelTitle(current) {
    // Compatibility for older callers: official HUD titles now come from RPG growth.
    if (typeof loadRpgGrowth === "function") return getRpgTrait(loadRpgGrowth()).name;
    var titles = LEVEL_TITLE_I18N[currentLang] || LEVEL_TITLE_I18N.ko;
    var idx = Math.max(0, (current && current.level ? current.level : 1) - 1);
    return titles[idx] || titles[titles.length - 1] || "";
}
const SPEED_LIMIT_WALK = 7 / 3.6;
const SPEED_LIMIT_BIKE = 30 / 3.6;

// IndexedDB ?占?占쎌냼

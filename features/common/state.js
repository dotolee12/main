let isRecording = false; let photos = []; let isFogEnabled = true; let isHudExpanded = false;
// Blob URLs are session-only display handles. They are deliberately kept out
// of localStorage so a restored journey never overwrites durable photo data.
var photoDisplayObjectUrls = new Map();
var recordingSessionId = null;
var recordingSessionStartedAt = 0;
// A clean install starts with destinations only. Once the user changes a
// switch, the complete selection is restored from localStorage on later runs.
var MAP_LAYER_DEFAULTS = { tourism: true, library: false, restaurant: false, shopping: false, lodging: false, restroom: false, parking: false, fishing: false, durunubi: false, community: false };
var MAP_LAYER_UNAVAILABLE = { community: true };
var MAP_VIEWPORT_MARKER_LIMIT = 100;
var MAP_VIEWPORT_ROUTE_LIMIT = 60;
var MAP_VIEWPORT_MAX_RADIUS_M = 20000;
function loadMapLayerSettings() {
    try {
        var raw = localStorage.getItem(MAP_LAYER_KEY);
        var saved = raw ? JSON.parse(raw) : {};
        // Before shopping became its own layer, it followed the tourism switch.
        // Keep each existing user's visibility choice when migrating that setting.
        if (raw && !Object.prototype.hasOwnProperty.call(saved, "shopping")) saved.shopping = !!saved.tourism;
        // Either old shop selection enables the single combined shopping tile.
        saved.shopping = !!(saved.shopping || saved.localshops);
        saved.localshops = saved.shopping;
        return Object.assign({}, MAP_LAYER_DEFAULTS, saved);
    } catch (e) { return Object.assign({}, MAP_LAYER_DEFAULTS); }
}
var mapLayerSettings = loadMapLayerSettings();
var librariesLoaded = false;
function saveMapLayerSettings() {
    try { localStorage.setItem(MAP_LAYER_KEY, JSON.stringify(mapLayerSettings)); }
    catch (error) { console.warn("Map layer settings could not be saved", error); }
}
let currentPos = null; let rawGpsPoints = []; let pathCoordinates = []; let memories = []; let specialPlacePins = []; let totalDistance = 0;
// Only explicit user deletions are recorded here; absent entries are not deletions.
var deletedJourneyRecords = { memories: [], photos: [] };
let currentAccuracy = Infinity;
let currentPositionTimestamp = 0;
let currentUserId = "local";
let playerMarker = null; let playerAccuracyCircle = null; let playerHeading = null; let watchId = null; let backgroundWatchId = null; let backgroundWatchStartPromise = null; let trackingRequested = false; let saveTimer = null; let rafId = null;
let screenWakeLock = null; let screenWakeLockTimer = null; let screenAwakeUntil = 0; let autoRecordingTimer = null; let trackingRetryTimer = null; let photoTapTimer = null;
let autoRecordingNoticePending = false;
let pendingRecordingStartAfterRestore = false;
const memoryMarkers = new Map();
const specialPlaceMarkers = new Map();
let specialPlaceEditorCoords = null; let activeSpecialPlaceMarker = null; let activeSpecialPlacePin = null; let specialPlacePopupTimer = null;
let activeGpxId = null; let activeGpxLayers = []; let dialHours = 8;
const STAY_BONUS_MS = 30 * 60 * 1000; const STAY_BONUS_RADIUS_M = 50;
const IMAGE_MISSION_RADIUS_M = 120;
const AUTO_VISIT_REQUIRED_MS = 30 * 60 * 1000;
const AUTO_VISIT_RADIUS_M = 50;
let stayBonusStartTime = null; let stayBonusAnchor = null; let stayBonusLevelBoost = 0; let stayBonusPlaces = [];
let activeImageMission = null;
var visitCandidate = { contentId: "", enteredAt: 0, item: null };
var completedVisitKeys = new Set();
// Nearby results follow the visible map area; a stale GPS position must not
// drive the list after the user pans elsewhere.
var tourSearchMode = "map";

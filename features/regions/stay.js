var REGION_STAY_KEY = "giloa-region-stay-v2";
// Bumped with every region-stay change. The atlas prints this on screen so a
// stale Capacitor bundle can be spotted without any developer tooling.
var GILOA_REGION_STAY_BUILD = "rs-2026-09-06b-heicgps";
var REGION_STAY_REQUIRED_MS = 60 * 60 * 1000;
var REGION_STAY_MAX_SAMPLE_GAP_MS = 2 * 60 * 1000;
var REGION_STAY_MAX_ACCURACY_M = 100;
var REGION_STAY_STALE_FIX_MS = 3 * 60 * 1000;
var REGION_STAY_TICK_MS = 10 * 1000;
var regionStayState = null;
var regionStayLastLiveUpdateAt = 0;
var REGION_STAY_LIVE_UPDATE_MS = 5000;
var regionStayAsyncRecalculationRunning = false;
var regionStayAsyncRecalculationQueued = false;
var REGION_STAY_TARGETS = {
    "김포시": "region_gimpo_1h",
    "하남시": "region_hanam_1h",
    "고양시": "region_goyang_1h"
};

// Coarse municipal outlines, [lng, lat]. These are only consulted when
// data/admin-districts.geojson is missing, still loading, or names the
// district in a way the name lookup cannot resolve. Bounding boxes were not
// usable here: 고양시 and 김포시 face each other across the 한강, so their
// boxes overlap and the river has to be traced as the shared edge.
var REGION_STAY_FALLBACK_SHAPES = [
    { city:"고양시", ring:[
        [126.700,37.720],[126.760,37.745],[126.870,37.740],[126.945,37.690],[126.975,37.640],
        [126.930,37.600],[126.860,37.585],[126.790,37.600],[126.745,37.640],[126.720,37.680]
    ] },
    { city:"김포시", ring:[
        [126.700,37.720],[126.720,37.680],[126.745,37.640],[126.790,37.600],[126.815,37.585],
        [126.800,37.565],[126.700,37.555],[126.590,37.565],[126.500,37.620],[126.440,37.680],
        [126.470,37.750],[126.560,37.790],[126.640,37.760]
    ] },
    { city:"하남시", ring:[
        [127.135,37.560],[127.180,37.585],[127.240,37.590],[127.290,37.555],
        [127.280,37.500],[127.230,37.455],[127.175,37.470],[127.140,37.510]
    ] }
];

var regionStayPointCityCache = Object.create(null);
var regionStayTickTimer = null;
var regionStayLastTickAt = 0;
var regionStayLastTickCity = "";
var regionStayLastFix = null;
var regionStayLastResolution = { city:"", source:"none", districtTitle:"", at:0 };

function loadRegionStayState() {
    if (regionStayState) return regionStayState;
    try { regionStayState = JSON.parse(localStorage.getItem(REGION_STAY_KEY) || "{}"); }
    catch (_) { regionStayState = {}; }
    if (!regionStayState || typeof regionStayState !== "object") regionStayState = {};
    Object.keys(REGION_STAY_TARGETS).forEach(function(city) {
        var entry = regionStayState[city];
        if (!entry || typeof entry !== "object") entry = {};
        // Migrate the v1/v2 shape (accumulatedMs only) into the split
        // path/live counters without losing the minutes already earned.
        var legacy = Math.max(0, Number(entry.accumulatedMs) || 0);
        entry.pathMs = Math.max(0, Number(entry.pathMs) || 0);
        entry.liveMs = Math.max(0, Number(entry.liveMs) || 0, legacy);
        entry.accumulatedMs = Math.max(entry.pathMs, entry.liveMs);
        regionStayState[city] = entry;
    });
    return regionStayState;
}

function saveRegionStayState() {
    try { localStorage.setItem(REGION_STAY_KEY, JSON.stringify(loadRegionStayState())); }
    catch (error) { console.warn("[GILOA REGION STAY] save failed", error); }
}

function normalizeRegionName(name) {
    return String(name == null ? "" : name).replace(/\s+/g, "");
}

// Administrative boundary sets label 고양시 in several different ways
// ("고양시", "고양시덕양구", "경기도 고양시 일산서구", ...). Matching on a
// flattened substring keeps every one of those spellings pointing at the
// same badge target.
function getMunicipalityName(districtName) {
    var flat = normalizeRegionName(districtName);
    if (!flat) return "";
    var keys = Object.keys(REGION_STAY_TARGETS);
    for (var i = 0; i < keys.length; i += 1) {
        if (flat.indexOf(keys[i]) >= 0) return keys[i];
    }
    return "";
}

var ADMIN_TITLE_KEYS = ["title", "name", "adm_nm", "ADM_NM", "SIG_KOR_NM", "sig_kor_nm", "SIGUNGU_NM", "sigungu_nm", "full_nm", "NAME"];

function getAdminFeatureTitle(feature) {
    var properties = feature && feature.properties;
    if (!properties) return "";
    for (var i = 0; i < ADMIN_TITLE_KEYS.length; i += 1) {
        var value = properties[ADMIN_TITLE_KEYS[i]];
        if (typeof value === "string" && value) return value;
    }
    return "";
}

function findAdminDistrictAt(latlng) {
    if (!latlng || !adminDistrictFeatures.length) return null;
    return adminDistrictFeatures.find(function(feature) { return adminFeatureContains(feature, latlng); }) || null;
}

function getRegionStayFallbackCity(lat, lng) {
    if (!isFinite(lat) || !isFinite(lng)) return "";
    for (var i = 0; i < REGION_STAY_FALLBACK_SHAPES.length; i += 1) {
        var shape = REGION_STAY_FALLBACK_SHAPES[i];
        if (pointInAdminRing(lng, lat, shape.ring)) return shape.city;
    }
    return "";
}

// Resolves a coordinate to one of the badge cities and records how the
// answer was reached so the on-device diagnostic can explain a zero count.
function resolveRegionStayCity(lat, lng, options) {
    options = options || {};
    var result = { city:"", source:"none", districtTitle:"" };
    if (!isFinite(lat) || !isFinite(lng)) return result;
    if (adminDistrictFeatures.length) {
        var feature = findAdminDistrictAt(L.latLng(lat, lng));
        if (feature) {
            result.districtTitle = getAdminFeatureTitle(feature);
            var matched = getMunicipalityName(result.districtTitle);
            if (matched) {
                result.city = matched;
                result.source = "geojson";
                if (options.remember !== false) regionStayLastResolution = { city:result.city, source:result.source, districtTitle:result.districtTitle, at:Date.now() };
                return result;
            }
        }
    }
    var fallback = getRegionStayFallbackCity(lat, lng);
    if (fallback) {
        result.city = fallback;
        result.source = adminDistrictFeatures.length ? "fallback-polygon (geojson miss)" : "fallback-polygon (geojson not loaded)";
    }
    if (options.remember !== false) regionStayLastResolution = { city:result.city, source:result.source, districtTitle:result.districtTitle, at:Date.now() };
    return result;
}

function getRegionStayCityForPoint(point) {
    if (!point) return "";
    return resolveRegionStayCity(Number(point.lat), Number(point.lng), { remember:false }).city;
}

// Point-in-polygon over every administrative feature is expensive and this
// runs on each save, so the answer is memoised per GPS point id. The cache is
// dropped whenever the boundary set changes.
function getCachedRegionStayCity(point) {
    if (!point) return "";
    var key = point.id || (point.timestamp + ":" + point.lat + ":" + point.lng);
    var cached = regionStayPointCityCache[key];
    if (cached !== undefined) return cached;
    var city = getRegionStayCityForPoint(point);
    regionStayPointCityCache[key] = city;
    return city;
}

function invalidateRegionStayCache() {
    regionStayPointCityCache = Object.create(null);
}

// Replays the recorded GPS trail and sums the time spent inside each target
// city. Only consecutive samples closer together than the gap limit count, so
// a long break in recording never inflates the total.
function calculateRegionStayFromPoints(points) {
    var totals = {};
    Object.keys(REGION_STAY_TARGETS).forEach(function(city) { totals[city] = 0; });
    var sorted = (points || []).filter(function(point) {
        return point && isFinite(point.lat) && isFinite(point.lng) && isFinite(Number(point.timestamp || point.startTime))
            && isFinite(Number(point.accuracy)) && Number(point.accuracy) <= REGION_STAY_MAX_ACCURACY_M;
    }).slice().sort(function(a, b) {
        return Number(a.timestamp || a.startTime) - Number(b.timestamp || b.startTime);
    });
    for (var i = 1; i < sorted.length; i += 1) {
        var previous = sorted[i - 1], current = sorted[i];
        var gap = Number(current.timestamp || current.startTime) - Number(previous.timestamp || previous.startTime);
        if (!isFinite(gap) || gap <= 0 || gap > REGION_STAY_MAX_SAMPLE_GAP_MS) continue;
        var previousCity = getCachedRegionStayCity(previous);
        if (!previousCity || previousCity !== getCachedRegionStayCity(current)) continue;
        totals[previousCity] += gap;
    }
    return totals;
}

function grantEarnedRegionBadges(state) {
    Object.keys(REGION_STAY_TARGETS).forEach(function(city) {
        var entry = state[city];
        if (entry && entry.accumulatedMs >= REGION_STAY_REQUIRED_MS && typeof earnBadge === "function") earnBadge(REGION_STAY_TARGETS[city]);
    });
}

function recalculateRegionStayFromPath() {
    var state = loadRegionStayState();
    var totals = calculateRegionStayFromPoints(rawGpsPoints);
    Object.keys(REGION_STAY_TARGETS).forEach(function(city) {
        var entry = state[city];
        entry.pathMs = Math.max(0, Number(totals[city]) || 0);
        entry.accumulatedMs = Math.max(entry.pathMs, entry.liveMs);
        entry.recalculatedAt = Date.now();
        entry.source = entry.pathMs >= entry.liveMs ? "rawGpsPoints" : "liveTick";
    });
    saveRegionStayState();
    grantEarnedRegionBadges(state);
    return true;
}

// Replaying thousands of native GPS samples through administrative polygons can
// monopolise a slower Android WebView for many seconds. Keep the exact same
// calculation, but yield between small batches so the map and buttons remain
// responsive while the cached city lookup is warmed in the background.
function scheduleRegionStayRecalculation() {
    if (regionStayAsyncRecalculationRunning || regionStayAsyncRecalculationQueued) return;
    regionStayAsyncRecalculationQueued = true;
    var begin = function() {
        regionStayAsyncRecalculationQueued = false;
        var state = loadRegionStayState();
        var totals = {};
        Object.keys(REGION_STAY_TARGETS).forEach(function(city) { totals[city] = 0; });
        var sorted = (rawGpsPoints || []).filter(function(point) {
            return point && isFinite(point.lat) && isFinite(point.lng) && isFinite(Number(point.timestamp || point.startTime))
                && isFinite(Number(point.accuracy)) && Number(point.accuracy) <= REGION_STAY_MAX_ACCURACY_M;
        }).slice().sort(function(a, b) {
            return Number(a.timestamp || a.startTime) - Number(b.timestamp || b.startTime);
        });
        var index = 1;
        regionStayAsyncRecalculationRunning = true;
        function runBatch() {
            var startedAt = typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
            var processed = 0;
            while (index < sorted.length && processed < 16) {
                var previous = sorted[index - 1], current = sorted[index];
                var gap = Number(current.timestamp || current.startTime) - Number(previous.timestamp || previous.startTime);
                if (isFinite(gap) && gap > 0 && gap <= REGION_STAY_MAX_SAMPLE_GAP_MS) {
                    var previousCity = getCachedRegionStayCity(previous);
                    if (previousCity && previousCity === getCachedRegionStayCity(current)) totals[previousCity] += gap;
                }
                index += 1;
                processed += 1;
                var now = typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
                if (now - startedAt >= 8) break;
            }
            if (index < sorted.length) { setTimeout(runBatch, 0); return; }
            Object.keys(REGION_STAY_TARGETS).forEach(function(city) {
                var entry = state[city];
                entry.pathMs = Math.max(0, Number(totals[city]) || 0);
                entry.accumulatedMs = Math.max(entry.pathMs, entry.liveMs);
                entry.recalculatedAt = Date.now();
                entry.source = entry.pathMs >= entry.liveMs ? "rawGpsPoints" : "liveTick";
            });
            saveRegionStayState();
            grantEarnedRegionBadges(state);
            regionStayAsyncRecalculationRunning = false;
            refreshRegionBadgeAtlasIfOpen();
        }
        setTimeout(runBatch, 0);
    };
    if (typeof requestIdleCallback === "function") requestIdleCallback(begin, { timeout:1200 });
    else setTimeout(begin, 250);
}

// Returns the position the live ticker should judge, preferring the live
// watchPosition fix. In the APK the foreground fix can go quiet while the
// native background service keeps writing samples, so the newest recorded
// point is used as a fallback rather than stalling the counter.
function getRegionStayLiveFix(now) {
    if (currentPos && isFinite(currentAccuracy) && Number(currentAccuracy) <= REGION_STAY_MAX_ACCURACY_M) {
        var age = isFinite(currentPositionTimestamp) ? now - Number(currentPositionTimestamp) : 0;
        if (age <= REGION_STAY_STALE_FIX_MS) {
            return { lat:currentPos.lat, lng:currentPos.lng, accuracy:Number(currentAccuracy), age:age, source:"watchPosition" };
        }
    }
    var newest = null;
    for (var i = rawGpsPoints.length - 1; i >= 0 && rawGpsPoints.length - i <= 40; i -= 1) {
        var point = rawGpsPoints[i];
        if (!point || !isFinite(point.lat) || !isFinite(point.lng)) continue;
        var stamp = Number(point.timestamp || point.endTime || point.startTime);
        if (!isFinite(stamp)) continue;
        if (!newest || stamp > newest.stamp) newest = { point:point, stamp:stamp };
    }
    if (!newest) return null;
    var newestAge = now - newest.stamp;
    if (newestAge > REGION_STAY_STALE_FIX_MS) return null;
    if (!isFinite(newest.point.accuracy) || Number(newest.point.accuracy) > REGION_STAY_MAX_ACCURACY_M) return null;
    return { lat:newest.point.lat, lng:newest.point.lng, accuracy:Number(newest.point.accuracy), age:newestAge, source:"rawGpsPoint" };
}

// Wall-clock accrual. The trail replay alone cannot count a stay while the
// device is stationary and the browser throttles GPS callbacks, so time is
// also credited directly from the clock whenever the live fix is fresh,
// accurate and inside the same city as the previous tick.
function tickRegionStayLive() {
    var now = Date.now();
    // The anchor is only moved on a tick that actually produced a fix. Moving
    // it unconditionally meant every GPS dropout wiped the previous city, so
    // the next good tick had nothing to compare against and the two-minute
    // tolerance never applied - roughly half the stay was thrown away when
    // fixes arrived on alternate ticks.
    var previousTickAt = regionStayLastTickAt;
    var previousCity = regionStayLastTickCity;

    var fix = getRegionStayLiveFix(now);
    regionStayLastFix = fix;
    if (!fix) return false;

    var city = resolveRegionStayCity(fix.lat, fix.lng).city;
    updateRegionEdgeFrame(fix);
    regionStayLastTickAt = now;
    regionStayLastTickCity = city;
    if (!city || city !== previousCity || !previousTickAt) return false;

    var delta = Math.min(now - previousTickAt, REGION_STAY_MAX_SAMPLE_GAP_MS);
    if (!isFinite(delta) || delta <= 0) return false;

    var state = loadRegionStayState();
    var entry = state[city];
    entry.liveMs = Math.max(0, Number(entry.liveMs) || 0) + delta;
    entry.accumulatedMs = Math.max(entry.pathMs, entry.liveMs);
    entry.lastTickAt = now;
    saveRegionStayState();
    grantEarnedRegionBadges(state);
    refreshRegionBadgeAtlasIfOpen();
    return true;
}

// --- Regional edge frame -----------------------------------------------
// A 3px border around the whole viewport, tinted for whichever municipality
// the current GPS fix falls inside. Works for every district in
// admin-districts.geojson, not just the badge targets.

// Requested palette: 빨 주 노 초 파 남 보 흰 검. Black sits on a dark UI and is
// nearly invisible, so it is kept last and only reached by hashing.
var REGION_EDGE_PALETTE = ["#e5484d", "#f76b15", "#f5c518", "#39b54a", "#2e7dd1", "#2b3f9e", "#8b46c8", "#f2f2f2", "#1a1a1a"];

// Municipal colours take priority over the palette. These three are
// placeholders picked to be distinguishable - replace them with the official
// CI colours once confirmed with each 지자체.
var REGION_EDGE_COLORS = {
    "고양시": "#f5c518",
    "김포시": "#2e7dd1",
    "하남시": "#39b54a"
};

// "고양시덕양구" and "고양시일산서구" must share one colour, so the name is
// trimmed at the first 시/군 boundary.
function getRegionColorKey(districtTitle) {
    var flat = normalizeRegionName(districtTitle);
    if (!flat) return "";
    var match = flat.match(/^(.*?[시군])/);
    return (match && match[1]) || flat;
}

function getRegionEdgeColor(districtTitle) {
    var key = getRegionColorKey(districtTitle);
    if (!key) return "";
    if (REGION_EDGE_COLORS[key]) return REGION_EDGE_COLORS[key];
    var hash = 0;
    for (var i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    return REGION_EDGE_PALETTE[hash % REGION_EDGE_PALETTE.length];
}

var activeRegionEdgeKey = null;

function updateRegionEdgeFrame(fix) {
    var frame = document.getElementById("region-edge-frame");
    if (!frame) return;

    // 지역 미션(REGION_STAY_TARGETS)이 있는 시에서만 테두리를 켠다.
    // 이전에는 아무 행정구역이나 해시 팔레트 색으로 테두리를 쳐서, 미션이 없는
    // 지역에서도 빨간 테두리 등이 보였다. 또 "경기도 고양시 …"처럼 도 이름이
    // 앞에 붙으면 키가 "경기도고양시"가 되어 미션 지역을 놓칠 수 있었다.
    // 체류 뱃지 판정과 같은 resolveRegionStayCity를 써서 두 로직을 일치시킨다.
    var city = "";
    if (fix && isFinite(fix.lat) && isFinite(fix.lng)) {
        city = resolveRegionStayCity(Number(fix.lat), Number(fix.lng), { remember:false }).city || "";
    }

    var badgeId = city ? REGION_STAY_TARGETS[city] : "";
    var completed =
        !!badgeId &&
        Array.isArray(badges) &&
        badges.some(function(badge) {
            return badge && badge.id === badgeId;
        });

    var frameState = (badgeId ? city : "") + (completed ? ":completed" : ":active");
    if (frameState === activeRegionEdgeKey) return;
    activeRegionEdgeKey = frameState;

    if (!badgeId || completed) {
        frame.hidden = true;
        frame.style.borderColor = "transparent";
        frame.style.boxShadow = "none";
        frame.removeAttribute("data-region");
        return;
    }

    var color = REGION_EDGE_COLORS[city] || getRegionEdgeColor(city);
    frame.style.borderColor = color;
    frame.style.boxShadow = "inset 0 0 18px " + color + "40";
    frame.setAttribute("data-region", city);
    frame.hidden = false;
}

function refreshRegionBadgeAtlasIfOpen() {
    var atlas = document.getElementById("region-badge-atlas");
    if (!atlas || atlas.hidden) return;
    if (typeof renderRegionBadgeAtlas !== "function") return;
    renderRegionBadgeAtlas();
}

function startRegionStayTicker() {
    if (regionStayTickTimer) return;
    regionStayLastTickAt = 0;
    regionStayLastTickCity = "";
    regionStayTickTimer = setInterval(tickRegionStayLive, REGION_STAY_TICK_MS);
}

document.addEventListener("visibilitychange", function() {
    // A backgrounded tab stops producing fixes. Resetting the anchor prevents
    // the whole hidden period from being credited on the next tick.
    if (document.visibilityState === "visible") {
        regionStayLastTickAt = 0;
        regionStayLastTickCity = "";
    }
});

startRegionStayTicker();

function updateRegionStayProgress() {
    if (!rawGpsPoints.length) return false;
    var now = Date.now();
    // Repainted here as well as on the ticker so crossing a boundary while
    // walking recolours the frame at GPS rate rather than up to 10s later.
    updateRegionEdgeFrame(getRegionStayLiveFix(now));
    if (now - regionStayLastLiveUpdateAt < REGION_STAY_LIVE_UPDATE_MS) return false;
    regionStayLastLiveUpdateAt = now;
    scheduleRegionStayRecalculation();
    return false;
}

window.recalculateGiloaRegionStay = recalculateRegionStayFromPath;

window.getGiloaRegionStayProgress = function() {
    var state = loadRegionStayState();
    var result = {};
    Object.keys(REGION_STAY_TARGETS).forEach(function(city) {
        result[city] = Math.min(60, Math.floor((Number(state[city] && state[city].accumulatedMs) || 0) / 60000));
    });
    return result;
};

window.getGiloaRegionStayDetail = function() {
    var state = loadRegionStayState();
    var detail = {};
    Object.keys(REGION_STAY_TARGETS).forEach(function(city) {
        var entry = state[city] || {};
        detail[city] = {
            minutes: Math.floor((Number(entry.accumulatedMs) || 0) / 60000),
            pathMinutes: Math.floor((Number(entry.pathMs) || 0) / 60000),
            liveMinutes: Math.floor((Number(entry.liveMs) || 0) / 60000),
            earned: typeof getEarnedBadge === "function" ? !!getEarnedBadge(REGION_STAY_TARGETS[city]) : false
        };
    });
    return detail;
};

// On-device diagnostic. The APK has no DevTools and a WebView can swallow
// alert(), so the report is written into the atlas itself and only falls back
// to alert() when that element is missing.
window.giloaRegionStayDiagnostic = function() {
    var now = Date.now();
    var lines = [];
    lines.push("[" + earlyUiText("regionDiagnostic") + "]");
    lines.push(earlyUiText("build") + ": " + GILOA_REGION_STAY_BUILD);
    lines.push(earlyUiText("environment") + ": " + (typeof isNativeApp === "function" && isNativeApp() ? "APK (Capacitor)" : earlyUiText("browser")) + " · " + location.protocol);
    lines.push(earlyUiText("adminPolygons") + ": " + adminDistrictFeatures.length);
    lines.push(earlyUiText("geojsonPath") + ": " + adminBoundaryLoadStatus.url);
    lines.push(earlyUiText("geojsonStatus") + ": " + adminBoundaryLoadStatus.state + (adminBoundaryLoadStatus.detail ? " · " + adminBoundaryLoadStatus.detail : ""));
    if (adminDistrictFeatures.length) {
        lines.push(earlyUiText("sampleNames") + ": " + adminDistrictFeatures.slice(0, 3).map(getAdminFeatureTitle).join(" / "));
        var propertyKeys = Object.keys((adminDistrictFeatures[0] && adminDistrictFeatures[0].properties) || {});
        lines.push(earlyUiText("propertyKeys") + ": " + (propertyKeys.join(", ") || earlyUiText("none")));
    } else {
        lines.push(earlyUiText("sampleNames") + ": " + earlyUiText("fallbackPolygons"));
    }

    var fix = getRegionStayLiveFix(now);
    if (fix) {
        lines.push(earlyUiText("evaluationCoordinates") + ": " + fix.lat.toFixed(5) + ", " + fix.lng.toFixed(5) + " (" + fix.source + ")");
        lines.push(earlyUiText("accuracy") + ": " + Math.round(fix.accuracy) + "m / ≤ " + REGION_STAY_MAX_ACCURACY_M + "m");
        lines.push(earlyUiText("freshness") + ": " + earlyUiText("secondsAgo", { seconds:Math.round(fix.age / 1000) }) + " / ≤ " + Math.round(REGION_STAY_STALE_FIX_MS / 1000) + "s");
        var resolved = resolveRegionStayCity(fix.lat, fix.lng, { remember:false });
        lines.push(earlyUiText("resolvedRegion") + ": " + (resolved.city || earlyUiText("none")));
        lines.push(earlyUiText("resolutionSource") + ": " + resolved.source + (resolved.districtTitle ? " · " + resolved.districtTitle : ""));
    } else if (currentPos) {
        lines.push(earlyUiText("evaluationCoordinates") + ": " + earlyUiText("staleCoordinates"));
        lines.push(earlyUiText("lastCoordinates") + ": " + currentPos.lat.toFixed(5) + ", " + currentPos.lng.toFixed(5)
            + " · " + earlyUiText("accuracy") + " " + (isFinite(currentAccuracy) ? Math.round(currentAccuracy) + "m" : earlyUiText("unknown"))
            + " · " + (isFinite(currentPositionTimestamp) ? earlyUiText("secondsAgo", { seconds:Math.round((now - currentPositionTimestamp) / 1000) }) : earlyUiText("unknown")));
    } else {
        lines.push(earlyUiText("evaluationCoordinates") + ": " + earlyUiText("waitingGps"));
    }

    var recent = rawGpsPoints.filter(function(point) {
        var stamp = Number(point && (point.timestamp || point.startTime));
        return isFinite(stamp) && now - stamp <= 10 * 60 * 1000;
    }).length;
    lines.push(earlyUiText("rawGpsCounts", { total:rawGpsPoints.length, recent:recent }));
    lines.push(earlyUiText("recordingStatus") + ": " + earlyUiText(typeof isRecording !== "undefined" && isRecording ? "recording" : "stopped"));
    lines.push(earlyUiText("stayTimer") + ": " + earlyUiText(regionStayTickTimer ? "running" : "stopped") + " · " + earlyUiText("lastTickRegion") + " " + (regionStayLastTickCity || earlyUiText("none")));
    lines.push(earlyUiText("lastResolution") + ": " + (regionStayLastResolution.city || earlyUiText("none")) + " · " + regionStayLastResolution.source);

    var detail = window.getGiloaRegionStayDetail();
    Object.keys(detail).forEach(function(city) {
        var row = detail[city];
        lines.push(city + ": " + earlyUiText("stayMinutes", { minutes:row.minutes, path:row.pathMinutes, live:row.liveMinutes }) + (row.earned ? " · " + earlyUiText("earned") : ""));
    });

    try {
        var photoReport = window.giloaPhotoDiagnostic ? window.giloaPhotoDiagnostic(true) : null;
        if (photoReport) {
            lines.push("");
            lines.push("[" + earlyUiText("photoDiagnostic") + "]");
            lines.push(earlyUiText("totalPhotos") + " " + photoReport.summary.total + " · " + earlyUiText("mapMarkers") + " " + photoReport.summary.markers);
            lines.push(earlyUiText("located") + " " + photoReport.summary.located + " · " + earlyUiText("unlocated") + " " + photoReport.summary.unlocated + " · " + earlyUiText("missingImage") + " " + photoReport.summary.missingImage);
        }
    } catch (_) {}

    var text = lines.join("\n");
    console.info(text);
    var panel = document.getElementById("region-badge-atlas-diagnostic");
    var wrap = document.getElementById("region-badge-atlas-diagnostic-wrap");
    if (panel && wrap) {
        panel.textContent = text;
        wrap.hidden = false;
        // The atlas card scrolls, so the report is pulled into view instead of
        // leaving it below the fold where it was easy to miss.
        if (wrap.scrollIntoView) wrap.scrollIntoView({ block:"start" });
    } else {
        showGiloaDiagnosticReport(text, earlyUiText("regionDiagnostic"));
    }
    return text;
};

function toggleRegionStayDiagnostic() {
    var wrap = document.getElementById("region-badge-atlas-diagnostic-wrap");
    if (wrap && !wrap.hidden) { wrap.hidden = true; return; }
    window.giloaRegionStayDiagnostic();
}


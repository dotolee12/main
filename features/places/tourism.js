var TOUR_API_KEY = window.GILOA_TOUR_API_KEY || "";

// TourAPI has no French endpoint. French cards use English data.
var TOUR_API_BASES = {
    ko: "KorService2",
    en: "EngService2",
    ja: "JpnService2",
    zh: "ChsService2",
    es: "EngService2",
    fr: "EngService2"
};

function getTourApiBase(lang) {
    return "https://apis.data.go.kr/B551011/" +
        (TOUR_API_BASES[lang || currentLang] || TOUR_API_BASES.ko);
}

function getTourEndpoint(path, lang) {
    return getTourApiBase(lang) + "/" + path;
}

function formatTourCount(count) {
    var suffix = (UI_TEXT[currentLang] || UI_TEXT.ko).count_suffix;
    return currentLang === "ko" ||
        currentLang === "ja" ||
        currentLang === "zh"
        ? String(count) + suffix
        : String(count) + " " + suffix;
}

var tourItems = [];
var festivalItems = [];
var tourExpanded = false;
var tourPanelOpen = false;
var tourFetchTimer = null;
var tourMarkers = [];
var tourMarkerLayer = L.layerGroup().addTo(map);
var TOUR_VISIBLE_COUNT = 3;
var tourRequestSeq = 0;
var festivalRequestSeq = 0;
var tourTranslationRenderTimer = null;
var TOUR_CACHE_PREFIX = "giloa-tour-location-v2:";
var TOUR_LAST_CACHE_PREFIX = "giloa-tour-last-v4:";
var TOUR_FESTIVAL_CACHE_PREFIX = "giloa-tour-festivals-v4:";
var TOUR_LIKED_STORAGE_KEY = "giloa-tour-liked-v1";
var likedTourKeys = loadLikedTourKeys();
function loadLikedTourKeys() {
    try {
        var saved = JSON.parse(localStorage.getItem(TOUR_LIKED_STORAGE_KEY) || "[]");
        return new Set(Array.isArray(saved) ? saved.filter(function(key) { return typeof key === "string" && key.length > 0; }) : []);
    } catch (error) {
        console.warn("여행지 관심 표시를 불러오지 못했습니다.", error);
        return new Set();
    }
}
function getTourLikeKey(item) {
    if (!item) return "";
    if (item.contentid != null && String(item.contentid)) return "content:" + String(item.contentid);
    return "place:" + [item.mapy, item.mapx, item.title || item._displayTitle || ""].map(function(value) { return String(value == null ? "" : value).trim(); }).join("|");
}
function isTourLiked(item) { return likedTourKeys.has(getTourLikeKey(item)); }
function getMapPlaceLikeKey(kind, parts) {
    return String(kind || "place") + ":" + (parts || []).map(function(value) { return String(value == null ? "" : value).trim(); }).join("|");
}
function getTourLikeText(liked) {
    var labels = {
        ko: liked ? "마음에 든 장소" : "마음에 들어요",
        en: liked ? "Liked place" : "Mark as liked",
        ja: liked ? "お気に入りの場所" : "気に入った",
        zh: liked ? "喜欢的地点" : "标记为喜欢",
        es: liked ? "Lugar favorito" : "Me gusta",
        fr: liked ? "Lieu favori" : "J’aime"
    };
    return labels[currentLang] || labels.ko;
}
function saveLikedTourKeys() {
    try { localStorage.setItem(TOUR_LIKED_STORAGE_KEY, JSON.stringify(Array.from(likedTourKeys))); }
    catch (error) { console.warn("여행지 관심 표시를 저장하지 못했습니다.", error); }
}
function buildMapPlaceLikeButton(key) {
    var liked = likedTourKeys.has(key);
    return "<button type='button' class='tour-like-button" + (liked ? " is-liked" : "") + "' data-tour-like-key='" + escapeHtml(key) + "' aria-pressed='" + String(liked) + "'><span aria-hidden='true'>" + (liked ? "★" : "☆") + "</span> " + escapeHtml(getTourLikeText(liked)) + "</button>";
}
function updateMapPlaceLikedDom(key) {
    var liked = likedTourKeys.has(key);
    document.querySelectorAll("[data-place-like-key]").forEach(function(element) {
        if (element.getAttribute("data-place-like-key") === key) element.classList.toggle("state-liked", liked);
    });
    document.querySelectorAll(".tour-like-button[data-tour-like-key]").forEach(function(button) {
        if (button.getAttribute("data-tour-like-key") !== key) return;
        button.classList.toggle("is-liked", liked);
        button.setAttribute("aria-pressed", String(liked));
        button.innerHTML = "<span aria-hidden='true'>" + (liked ? "★" : "☆") + "</span> " + escapeHtml(getTourLikeText(liked));
    });
}
document.addEventListener("click", function(event) {
    var button = event.target.closest && event.target.closest(".tour-like-button[data-tour-like-key]");
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    var key = button.getAttribute("data-tour-like-key") || "";
    if (!key) return;
    if (likedTourKeys.has(key)) likedTourKeys.delete(key); else likedTourKeys.add(key);
    saveLikedTourKeys();
    updateMapPlaceLikedDom(key);
    if (key.indexOf("content:") === 0 || key.indexOf("place:") === 0) { renderTourCards(); addTourMarkers(); }
}, true);
function toggleTourLiked(item) {
    var key = getTourLikeKey(item);
    if (!key) return;
    if (likedTourKeys.has(key)) likedTourKeys.delete(key); else likedTourKeys.add(key);
    saveLikedTourKeys();
    renderTourCards();
    addTourMarkers();
}
// 지도 이동 후 보이는 영역을 놓치지 않도록 충분히 짧게 유지한다.
var TOUR_SEARCH_MOVE_M = 120;
var TOUR_REVALIDATE_MS = 24 * 60 * 60 * 1000;
var TOUR_FESTIVAL_REVALIDATE_MS = 15 * 60 * 1000;
var TOUR_AREA_CACHE_PREFIX = "giloa-api-area-v1:";
var tourAreaMemoryCache = {};
var festivalRefreshPromiseByLang = {};
var tourSearchStateByLang = {};
var tourRefreshPromiseByLang = {};
var tourHydratedByLang = {};
var giloLoadingActiveRequests = 0;
var giloLoadingShowTimer = null;
var giloLoadingSlowTimer = null;
var giloLoadingStopTimer = null;
var giloLoadingHideTimer = null;
var giloLoadingShownAt = 0;
var giloLoadingMessageKey = "nearby";
var GILO_LOADING_DELAY_MS = 400;
var GILO_LOADING_MIN_VISIBLE_MS = 600;
var GILO_LOADING_SLOW_MS = 5000;
var GILO_LOADING_MESSAGES = {
    nearby: {
        ko: "길로가 주변 정보를 모으고 있어요",
        en: "Gilo is gathering nearby information",
        ja: "ギロが周辺情報を集めています",
        zh: "Gilo 正在收集附近信息"
        ,es: "Gilo está reuniendo información cercana"
    },
    slow: {
        ko: "주변 정보를 조금 더 살펴보고 있어요",
        en: "Gilo is looking a little further around",
        ja: "周辺情報をもう少し詳しく調べています",
        zh: "正在进一步查看附近信息"
        ,es: "Gilo está buscando un poco más alrededor"
    }
};
function getGiloLoadingElement() {
    return document.getElementById("gilo-tour-loading");
}
function updateGiloLoadingMessage(messageKey) {
    giloLoadingMessageKey = messageKey || giloLoadingMessageKey || "nearby";
    var messageEl = document.getElementById("gilo-loading-message");
    var messages = GILO_LOADING_MESSAGES[giloLoadingMessageKey] || GILO_LOADING_MESSAGES.nearby;
    if (messageEl) messageEl.textContent = messages[normalizeLang(currentLang || "ko")] || messages.ko;
}
function positionGiloLoading() {
    var loadingEl = getGiloLoadingElement();
    if (!loadingEl) return;
    var viewportWidth = Math.max(280, window.innerWidth || document.documentElement.clientWidth || 360);
    var viewportHeight = Math.max(480, window.innerHeight || document.documentElement.clientHeight || 640);
    var hud = document.getElementById("hud");
    var hudHeight = hud ? hud.offsetHeight : 70;
    var baseX = viewportWidth * 0.5;
    var topClearance = Math.min(140, viewportHeight * 0.26);
    var bottomClearance = viewportHeight - hudHeight - 20;
    var minBaseY = topClearance + 36;
    var maxBaseY = Math.max(minBaseY, bottomClearance - 88);
    var baseY = Math.max(minBaseY, Math.min(viewportHeight * 0.43, maxBaseY));
    var rangeX = Math.max(18, Math.min(viewportWidth * 0.11, baseX - 58, viewportWidth - baseX - 58));
    var rangeY = Math.max(0, Math.min(viewportHeight * 0.1, baseY - topClearance - 36, bottomClearance - baseY - 36));
    loadingEl.style.setProperty("--gilo-base-x", Math.round(baseX) + "px");
    loadingEl.style.setProperty("--gilo-base-y", Math.round(baseY) + "px");
    loadingEl.style.setProperty("--gilo-x1", Math.round(-rangeX) + "px");
    loadingEl.style.setProperty("--gilo-y1", Math.round(-rangeY * 0.25) + "px");
    loadingEl.style.setProperty("--gilo-x2", Math.round(rangeX) + "px");
    loadingEl.style.setProperty("--gilo-y2", Math.round(-rangeY) + "px");
    loadingEl.style.setProperty("--gilo-x3", Math.round(rangeX * 0.15) + "px");
    loadingEl.style.setProperty("--gilo-y3", Math.round(rangeY) + "px");
}
function startGiloLoading(messageKey) {
    if (giloLoadingActiveRequests <= 0) return;
    var loadingEl = getGiloLoadingElement();
    if (!loadingEl) return;
    positionGiloLoading();
    updateGiloLoadingMessage(messageKey || "nearby");
    loadingEl.classList.remove("completing");
    loadingEl.classList.add("visible");
    loadingEl.setAttribute("aria-hidden", "false");
    giloLoadingShownAt = Date.now();
}
function finishGiloLoadingHide() {
    var loadingEl = getGiloLoadingElement();
    if (!loadingEl || giloLoadingActiveRequests > 0) return;
    loadingEl.classList.add("completing");
    giloLoadingHideTimer = setTimeout(function() {
        if (giloLoadingActiveRequests > 0) return;
        loadingEl.classList.remove("visible", "completing");
        loadingEl.setAttribute("aria-hidden", "true");
        giloLoadingShownAt = 0;
        giloLoadingHideTimer = null;
    }, 260);
}
function stopGiloLoading() {
    if (giloLoadingShowTimer) { clearTimeout(giloLoadingShowTimer); giloLoadingShowTimer = null; }
    if (giloLoadingSlowTimer) { clearTimeout(giloLoadingSlowTimer); giloLoadingSlowTimer = null; }
    var loadingEl = getGiloLoadingElement();
    if (!loadingEl || !loadingEl.classList.contains("visible")) return;
    var remaining = Math.max(0, GILO_LOADING_MIN_VISIBLE_MS - (Date.now() - giloLoadingShownAt));
    if (giloLoadingStopTimer) clearTimeout(giloLoadingStopTimer);
    giloLoadingStopTimer = setTimeout(function() {
        giloLoadingStopTimer = null;
        finishGiloLoadingHide();
    }, remaining);
}
function beginTourApiLoading() {
    var wasIdle = giloLoadingActiveRequests === 0;
    giloLoadingActiveRequests += 1;
    if (!wasIdle) return;
    if (giloLoadingStopTimer) { clearTimeout(giloLoadingStopTimer); giloLoadingStopTimer = null; }
    if (giloLoadingHideTimer) { clearTimeout(giloLoadingHideTimer); giloLoadingHideTimer = null; }
    var loadingEl = getGiloLoadingElement();
    if (loadingEl) loadingEl.classList.remove("completing");
    updateGiloLoadingMessage("nearby");
    positionGiloLoading();
    if (!loadingEl || !loadingEl.classList.contains("visible")) {
        giloLoadingShowTimer = setTimeout(function() {
            giloLoadingShowTimer = null;
            startGiloLoading("nearby");
        }, GILO_LOADING_DELAY_MS);
    }
    giloLoadingSlowTimer = setTimeout(function() {
        giloLoadingSlowTimer = null;
        if (giloLoadingActiveRequests > 0) updateGiloLoadingMessage("slow");
    }, GILO_LOADING_SLOW_MS);
}
function endTourApiLoading() {
    giloLoadingActiveRequests = Math.max(0, giloLoadingActiveRequests - 1);
    if (giloLoadingActiveRequests === 0) stopGiloLoading();
}
window.addEventListener("resize", function() {
    var loadingEl = getGiloLoadingElement();
    if (loadingEl && loadingEl.classList.contains("visible")) positionGiloLoading();
});
var giloLoadingImageEl = document.querySelector(".gilo-loading-character");
if (giloLoadingImageEl) {
    giloLoadingImageEl.addEventListener("error", function() {
        var halo = giloLoadingImageEl.parentNode;
        if (halo) halo.classList.add("image-missing");
    });
}
var TOUR_TYPE_NAMES = {
    ko: { "12": "관광지", "14": "문화시설", "15": "축제", "25": "여행코스", "28": "레포츠", "32": "숙박", "38": "쇼핑", "39": "음식점" },
    en: { "12": "Attraction", "14": "Culture", "15": "Festival", "25": "Course", "28": "Leports", "32": "Stay", "38": "Shopping", "39": "Food" },
    ja: { "12": "観光地", "14": "文化施設", "15": "祭り", "25": "コース", "28": "レポーツ", "32": "宿泊", "38": "ショッピング", "39": "グルメ" },
    zh: { "12": "景点", "14": "文化设施", "15": "庆典", "25": "路线", "28": "休闲运动", "32": "住宿", "38": "购物", "39": "美食" }
    ,es: { "12": "Atracción", "14": "Cultura", "15": "Festival", "25": "Ruta", "28": "Deportes", "32": "Alojamiento", "38": "Compras", "39": "Gastronomía" }
    ,fr: { "12": "Attraction", "14": "Culture", "15": "Festival", "25": "Itinéraire", "28": "Loisirs sportifs", "32": "Hébergement", "38": "Shopping", "39": "Restauration" }
};
var TOUR_TYPE_LABELS = {
    ko: { "25": "코스", "28": "레포츠", "38": "쇼핑", "15": "축제", "12": "관광", "14": "문화", "32": "숙박", "39": "음식", default: "관광" },
    en: { "25": "Course", "28": "Leports", "38": "Shop", "15": "Fest", "12": "Spot", "14": "Culture", "32": "Stay", "39": "Food", default: "Spot" },
    ja: { "25": "コース", "28": "レポーツ", "38": "買物", "15": "祭り", "12": "観光", "14": "文化", "32": "宿泊", "39": "食事", default: "観光" },
    zh: { "25": "路线", "28": "运动", "38": "购物", "15": "庆典", "12": "景点", "14": "文化", "32": "住宿", "39": "美食", default: "景点" }
    ,es: { "25": "Ruta", "28": "Deporte", "38": "Compras", "15": "Festival", "12": "Lugar", "14": "Cultura", "32": "Hotel", "39": "Comida", default: "Lugar" }
    ,fr: { "25": "Itinéraire", "28": "Sport", "38": "Boutiques", "15": "Festival", "12": "Lieu", "14": "Culture", "32": "Hôtel", "39": "Restaurant", default: "Lieu" }
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
    return typeId !== "39" && typeId !== "32";
}
function getVisibleTourItems() {
    var center = getMapSearchCenter();
    return tourItems.filter(isTourItemVisible).filter(isNearbyMapLayerTourItem).sort(function(a, b) {
        return center.distanceTo([parseFloat(a.mapy), parseFloat(a.mapx)]) - center.distanceTo([parseFloat(b.mapy), parseFloat(b.mapx)]);
    }).slice(0, MAP_VIEWPORT_MARKER_LIMIT);
}
function getVisibleTourMarkerItems() {
    var center = getMapSearchCenter();
    return tourItems.filter(function(item) {
        var typeId = String(item && item.contenttypeid);
        if (typeId === "39") return !!mapLayerSettings.restaurant;
        if (typeId === "38") return !!mapLayerSettings.shopping;
        if (typeId === "32") return !!mapLayerSettings.lodging;
        return !!mapLayerSettings.tourism;
    }).filter(isNearbyMapLayerTourItem).sort(function(a, b) {
        return center.distanceTo([parseFloat(a.mapy), parseFloat(a.mapx)]) - center.distanceTo([parseFloat(b.mapy), parseFloat(b.mapx)]);
    }).slice(0, MAP_VIEWPORT_MARKER_LIMIT);
}
function getMapSearchCenter() {
    // Search around the map area the user is actively browsing.
    return getMapBrowseCenter();
}
function getUserExperienceCenter() { return currentPos || map.getCenter(); }
function getMapBrowseCenter() { return map.getCenter(); }
function getMapSearchRadius() {
    if (!map || !map.getBounds || !map.getCenter) return MAP_LAYER_RADIUS_M;
    var bounds = map.getBounds();
    var center = map.getCenter();
    var corners = [bounds.getNorthEast(), bounds.getNorthWest(), bounds.getSouthEast(), bounds.getSouthWest()];
    var viewportRadius = corners.reduce(function(maxDistance, corner) {
        return Math.max(maxDistance, center.distanceTo(corner));
    }, MAP_LAYER_RADIUS_M);
    return Math.round(Math.max(MAP_LAYER_RADIUS_M, Math.min(MAP_VIEWPORT_MAX_RADIUS_M, viewportRadius * 1.12)));
}
function normalizeTourImageUrl(url) {
    if (!url) return "";
    var normalized = String(url).trim();
    // TourAPI can still return legacy HTTP image URLs. Android WebView and
    // installed HTTPS PWAs block those URLs even when they work in a browser.
    if (/^http:\/\//i.test(normalized)) normalized = normalized.replace(/^http:\/\//i, "https://");
    return /^https:\/\//i.test(normalized) ? normalized : "";
}
function getTourImage(item) {
    if (!item) return "";
    return normalizeTourImageUrl(item.firstimage) || normalizeTourImageUrl(item.firstimage2);
}
function getLastTourCacheKey(lang) {
    return TOUR_LAST_CACHE_PREFIX + (lang || currentLang || "ko");
}
function writeApiCacheStorage(key, serialized) {
    // Bound optional API caches independently of permanent journey storage.
    if (serialized.length > 256 * 1024) return false;
    try {
        var entries = [];
        var total = serialized.length;
        for (var i = 0; i < localStorage.length; i++) {
            var otherKey = localStorage.key(i);
            if (!otherKey || otherKey === key || (otherKey.indexOf(TOUR_AREA_CACHE_PREFIX) !== 0 && otherKey !== TRANSLATE_CACHE_KEY)) continue;
            var value = localStorage.getItem(otherKey) || "";
            var savedAt = 0;
            try {
                var rows = JSON.parse(value);
                if (Array.isArray(rows) && rows.length) savedAt = Number(rows[rows.length - 1].savedAt) || 0;
            } catch (_) {}
            entries.push({ key:otherKey, length:value.length, savedAt:savedAt });
            total += value.length;
        }
        entries.sort(function(a, b) { return a.savedAt - b.savedAt; });
        while (total > 512 * 1024 && entries.length) {
            var removed = entries.shift();
            localStorage.removeItem(removed.key);
            total -= removed.length;
        }
        while (true) {
            try { localStorage.setItem(key, serialized); return true; }
            catch (_) {
                if (!entries.length) return false;
                localStorage.removeItem(entries.shift().key);
            }
        }
    } catch (_) { return false; }
}
function readTourAreaRecords(kind, lang) {
    var key = TOUR_AREA_CACHE_PREFIX + kind + ":" + lang;
    if (tourAreaMemoryCache[key]) return tourAreaMemoryCache[key];
    try {
        var saved = JSON.parse(localStorage.getItem(key) || "[]");
        tourAreaMemoryCache[key] = Array.isArray(saved) ? saved.filter(function(record) {
            return normalizeTourCacheRecord(record) && Number(record.radius) > 0 &&
                record.items.every(function(item) { return item && typeof item === "object"; });
        }).slice(-24) : [];
    } catch (_) { tourAreaMemoryCache[key] = []; }
    return tourAreaMemoryCache[key];
}
function readTourAreaCache(kind, center, lang, radius) {
    var maxAge = kind === "festival" ? TOUR_FESTIVAL_REVALIDATE_MS : TOUR_REVALIDATE_MS;
    var records = readTourAreaRecords(kind, lang);
    for (var i = records.length - 1; i >= 0; i--) {
        var record = records[i];
        var age = Date.now() - Number(record.lastFetchedAt);
        if (!isFinite(age) || age < 0 || age >= maxAge || Number(record.radius) < radius) continue;
        if (kind === "festival" && record.day !== getTodayString()) continue;
        if (getTourSearchDistance(center, record.center) >= TOUR_SEARCH_MOVE_M) continue;
        return record;
    }
    return null;
}
function writeTourAreaCache(kind, center, lang, radius, items, fetchedAt) {
    var key = TOUR_AREA_CACHE_PREFIX + kind + ":" + lang;
    var records = readTourAreaRecords(kind, lang).filter(function(record) {
        return getTourSearchDistance(center, record.center) >= TOUR_SEARCH_MOVE_M || Number(record.radius) !== radius;
    });
    records.push({ center:{ lat:center.lat, lng:center.lng }, radius:radius,
        savedAt:Date.now(), lastFetchedAt:fetchedAt || Date.now(), day:getTodayString(), items:items });
    tourAreaMemoryCache[key] = records.slice(-24);
    var serialized = JSON.stringify(tourAreaMemoryCache[key]);
    while (serialized.length > 256 * 1024 && tourAreaMemoryCache[key].length > 1) {
        tourAreaMemoryCache[key].shift();
        serialized = JSON.stringify(tourAreaMemoryCache[key]);
    }
    writeApiCacheStorage(key, serialized);
}
function applyTourAreaCache(record, lang) {
    tourItems = record.items;
    markTourItemsSource(tourItems.filter(function(item) { return !item._sourceLang; }), lang);
    tourSearchStateByLang[lang] = { center:record.center, radius:record.radius,
        lastFetchedAt:record.lastFetchedAt, itemCount:record.items.length };
    renderTourCards();
    updateTourSummary();
    addTourMarkers();
    translateTourItemsForLang(lang, tourItems);
}
function normalizeTourCacheRecord(record) {
    if (!record || !Array.isArray(record.items)) return null;
    var center = record.center;
    if (!center || !isFinite(parseFloat(center.lat)) || !isFinite(parseFloat(center.lng))) return null;
    return {
        center: { lat: parseFloat(center.lat), lng: parseFloat(center.lng) },
        savedAt: Number(record.savedAt) || 0,
        lastFetchedAt: Number(record.lastFetchedAt || record.savedAt) || 0,
        items: record.items
    };
}
function readLegacyTourCache(lang) {
    var newest = null;
    var prefix = TOUR_CACHE_PREFIX + (lang || currentLang || "ko") + ":";
    try {
        for (var i = 0; i < localStorage.length; i++) {
            var key = localStorage.key(i);
            if (!key || key.indexOf(prefix) !== 0) continue;
            var parts = key.slice(prefix.length).split(":");
            var cached = JSON.parse(localStorage.getItem(key) || "null");
            if (!cached || !Array.isArray(cached.items) || parts.length < 2) continue;
            var record = normalizeTourCacheRecord({
                center: { lat: parseFloat(parts[0]), lng: parseFloat(parts[1]) },
                savedAt: cached.savedAt,
                lastFetchedAt: cached.savedAt,
                items: cached.items
            });
            if (record && (!newest || record.savedAt > newest.savedAt)) newest = record;
        }
    } catch (e) { return null; }
    return newest;
}
function readLastTourCache(lang) {
    try {
        var record = normalizeTourCacheRecord(JSON.parse(localStorage.getItem(getLastTourCacheKey(lang)) || "null"));
        if (record) return record;
        return readLegacyTourCache(lang);
    } catch (e) { return null; }
}
function writeTourCache(center, lang, items, fetchedAt) {
    var record = {
        center: { lat: center.lat, lng: center.lng },
        savedAt: Date.now(),
        lastFetchedAt: fetchedAt || Date.now(),
        items: items
    };
    try {
        localStorage.setItem(getLastTourCacheKey(lang), JSON.stringify(record));
    } catch (e) { /* Storage can be unavailable or full; live results still work. */ }
    return record;
}
function readFestivalCache(lang) {
    try {
        return normalizeTourCacheRecord(JSON.parse(localStorage.getItem(TOUR_FESTIVAL_CACHE_PREFIX + lang) || "null"));
    } catch (e) { return null; }
}
function writeFestivalCache(center, lang, items) {
    try {
        localStorage.setItem(TOUR_FESTIVAL_CACHE_PREFIX + lang, JSON.stringify({
            center: { lat: center.lat, lng: center.lng },
            savedAt: Date.now(),
            lastFetchedAt: Date.now(),
            items: items
        }));
    } catch (e) { /* Keep live festival data even when storage is unavailable. */ }
}
function hydrateTourItemsFromCache(lang, force) {
    lang = lang || currentLang || "ko";
    if (tourHydratedByLang[lang] && !force) return false;
    tourHydratedByLang[lang] = true;
    var cached = readLastTourCache(lang);
    if (!cached) return false;
    tourSearchStateByLang[lang] = {
        center: cached.center,
        lastFetchedAt: cached.lastFetchedAt,
        itemCount: cached.items.length
    };
    tourItems = cached.items;
    markTourItemsSource(tourItems, lang);
    var cachedFestivals = readFestivalCache(lang);
    if (cachedFestivals) {
        festivalItems = cachedFestivals.items;
        markTourItemsSource(festivalItems, lang);
        updateFestivalBadge();
    }
    renderTourCards();
    updateTourSummary();
    translateTourItemsForLang(lang, tourItems);
    return true;
}
function updateTourSummary() {
    var countEl = document.getElementById("tour-count");
    var emptyEl = document.getElementById("tour-empty");
    var visibleItems = getVisibleTourItems();
    if (countEl) countEl.textContent = visibleItems.length ? formatTourCount(visibleItems.length) : "";
    if (emptyEl) {
        emptyEl.style.display = visibleItems.length ? "none" : "";
        if (!visibleItems.length) emptyEl.textContent = (UI_TEXT[currentLang] || UI_TEXT.ko).empty_tour;
    }
}
function setTourRefreshing(refreshing) {
    var panel = document.getElementById("tour-panel");
    if (panel) panel.classList.toggle("refreshing", !!refreshing);
}
function makeTourImage(item, className) {
    var src = getTourImage(item);
    var wrap = document.createElement("div");
    wrap.className = className || "tour-card-image";
    if (!src) { wrap.classList.add("fallback"); wrap.setAttribute("aria-label", getTourUiText().noImage); return wrap; }
    var img = document.createElement("img");
    img.alt = ""; img.loading = "lazy"; img.decoding = "async"; img.referrerPolicy = "no-referrer";
    wrap.classList.add("loading");
    img.addEventListener("load", function() { wrap.classList.remove("loading"); });
    img.addEventListener("error", function() { img.remove(); wrap.classList.remove("loading"); wrap.classList.add("fallback"); });
    wrap.appendChild(img);
    var loadImage = function() { if (img.isConnected) img.src = src; };
    if (typeof requestAnimationFrame === "function") requestAnimationFrame(loadImage);
    else setTimeout(loadImage, 0);
    return wrap;
}
function isWithinMapSearchCenter(lat, lng, radiusM) {
    if (!map || !isFinite(lat) || !isFinite(lng)) return false;
    if (map.getBounds) return map.getBounds().pad(0.12).contains([lat, lng]);
    return getMapSearchCenter().distanceTo([lat, lng]) <= (radiusM || getMapSearchRadius());
}
function isNearbyMapLayerTourItem(item) {
    return isWithinMapSearchCenter(parseFloat(item && item.mapy), parseFloat(item && item.mapx), getMapSearchRadius());
}
function getNearbyFestivalItems() {
    return festivalItems.filter(isNearbyMapLayerTourItem);
}
function applyTourTypeVars(el, meta) { el.style.setProperty("--tour-color", meta.color); el.style.setProperty("--tour-fill", meta.fill); el.style.setProperty("--tour-border", meta.border); }function getTodayString() {
    var d = new Date();
    var mm = String(d.getMonth() + 1).padStart(2, "0");
    var dd = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + mm + dd;
}

function fetchFestivals(options) {
    options = options || {};
    var center = options.center || getMapSearchCenter();
    var today = getTodayString();
    var requestLang = currentLang;
    var radiusM = options.radius || getMapSearchRadius();
    var cached = !options.force && readTourAreaCache("festival", center, requestLang, radiusM);
    if (cached) {
        festivalItems = cached.items;
        markTourItemsSource(festivalItems.filter(function(item) { return !item._sourceLang; }), requestLang);
        translateTourItemsForLang(requestLang, festivalItems);
        updateFestivalBadge();
        if (tourPanelOpen) renderFestivalStrip();
        return Promise.resolve();
    }
    if (festivalRefreshPromiseByLang[requestLang]) return festivalRefreshPromiseByLang[requestLang];
    var requestSeq = ++festivalRequestSeq;
    var buildUrl = function(lang) { return getTourEndpoint("searchFestival2", lang) + "?serviceKey=" + TOUR_API_KEY + "&eventStartDate=" + today + "&numOfRows=1000&pageNo=1&MobileOS=ETC&MobileApp=Giloa&_type=json&arrange=A"; };
    beginTourApiLoading();
    var festivalRequest;
    try {
        festivalRequest = fetchTourJsonWithFallback(buildUrl, requestLang);
    } catch (error) {
        endTourApiLoading();
        return Promise.reject(error);
    }
    var pending = festivalRequest.then(function(data) {
        if (requestSeq !== festivalRequestSeq || requestLang !== currentLang) return;
        var body = data && data.response && data.response.body;
        var header = data && data.response && data.response.header;
        if (!body || (header && header.resultCode && header.resultCode !== "0000")) throw new Error("Festival API returned an invalid response");
        var items = [];
        if (body && body.items && body.items.item) { items = Array.isArray(body.items.item) ? body.items.item : [body.items.item]; }
        festivalItems = items; markTourItemsSource(festivalItems, data._giloaSourceLang || requestLang); translateTourItemsForLang(currentLang, festivalItems);
        writeFestivalCache(center, requestLang, festivalItems);
        writeTourAreaCache("festival", center, requestLang, radiusM, festivalItems, Date.now());
        updateFestivalBadge();
        if (tourPanelOpen) renderFestivalStrip();
    }).catch(function(err) {
        if (requestSeq !== festivalRequestSeq || requestLang !== currentLang) return;
        console.warn("Festival API request failed");
        throw err;
    }).finally(function() {
        endTourApiLoading();
        if (festivalRefreshPromiseByLang[requestLang] === pending) delete festivalRefreshPromiseByLang[requestLang];
    });
    festivalRefreshPromiseByLang[requestLang] = pending;
    return pending;
}

function updateFestivalBadge() {
    var badge = document.getElementById("tour-festival-badge");
    if (!badge) return;
    var nearbyItems = getNearbyFestivalItems();
    if (nearbyItems.length > 0) { badge.textContent = (UI_TEXT[currentLang] || UI_TEXT.ko).festival_badge + " " + nearbyItems.length; badge.classList.add("show"); }
    else { badge.classList.remove("show"); }
}

function renderFestivalStrip() {
    var gpsBefore = captureGpsIntegrity();
    logGpsLayerChange("BEFORE festival-refresh", gpsBefore);
    var label = document.getElementById("festival-strip-label");
    var strip = document.getElementById("festival-strip");
    if (!strip || !label) { refreshGpsVisualsAfterPlaceLayerChange("festival-refresh", gpsBefore); return; }
    var nearbyItems = getNearbyFestivalItems();
    if (nearbyItems.length === 0) { strip.classList.remove("show"); label.classList.remove("show"); refreshGpsVisualsAfterPlaceLayerChange("festival-refresh", gpsBefore); return; }
    strip.innerHTML = "";
    var center = getMapSearchCenter();
    nearbyItems.forEach(function(item) {
        var card = document.createElement("div"); card.className = "festival-card"; applyTourTypeVars(card, getTourTypeMeta("15"));
        var typeEl = document.createElement("div"); typeEl.className = "tour-card-type"; typeEl.textContent = getTourTypeName("15");
        var nameEl = document.createElement("div"); nameEl.className = "festival-card-name"; nameEl.textContent = getTourDisplayTitle(item) || getTourTypeName("15");
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
            focusTourItemBelowPanel(item);
        });
        strip.appendChild(card);
    });
    label.classList.add("show"); strip.classList.add("show");
    refreshGpsVisualsAfterPlaceLayerChange("festival-refresh", gpsBefore);
}

function fetchTourSpots(options) {
    options = options || {};
    var center = options.center || getMapSearchCenter();
    var radiusM = options.radius || getMapSearchRadius();
    var listEl = document.getElementById("tour-list"); var loadingEl = document.getElementById("tour-loading");
    var emptyEl = document.getElementById("tour-empty"); var expandBtn = document.getElementById("tour-expand-btn"); var countEl = document.getElementById("tour-count");
    if (!listEl || !loadingEl || !emptyEl || !expandBtn || !countEl) return;
    var hasExistingItems = tourItems.length > 0;
    loadingEl.style.display = hasExistingItems ? "none" : "";
    emptyEl.style.display = "none";
    expandBtn.style.display = "none";
    var requestLang = currentLang;
    var requestSeq = ++tourRequestSeq;
    // Dense Korean datasets contain many restaurants and lodging entries.
    // Fetch a broad page before separating tourism cards from optional map layers.
    var buildUrl = function(lang) { return getTourEndpoint("locationBasedList2", lang) + "?serviceKey=" + TOUR_API_KEY + "&mapX=" + center.lng.toFixed(6) + "&mapY=" + center.lat.toFixed(6) + "&radius=" + radiusM + "&numOfRows=1000&pageNo=1&MobileOS=ETC&MobileApp=Giloa&_type=json&arrange=E"; };
    beginTourApiLoading();
    var tourRequest;
    try {
        tourRequest = fetchTourJsonWithFallback(buildUrl, requestLang);
    } catch (error) {
        endTourApiLoading();
        return Promise.reject(error);
    }
    return tourRequest.then(function(data) {
        if (requestSeq !== tourRequestSeq || requestLang !== currentLang) return false;
        loadingEl.style.display = "none"; var body = data && data.response && data.response.body; var items = [];
        var header = data && data.response && data.response.header;
        if (!body || (header && header.resultCode && header.resultCode !== "0000")) throw new Error("TourAPI returned an invalid response");
        if (body && body.items && body.items.item) { items = Array.isArray(body.items.item) ? body.items.item : [body.items.item]; }
        var nextItems = items.filter(function(item) {
            return item && item.contentid && isFinite(parseFloat(item.mapx)) && isFinite(parseFloat(item.mapy));
        }).map(function(item) {
            return {
                contentid: item.contentid, title: item.title || "", mapx: item.mapx, mapy: item.mapy,
                addr1: item.addr1 || "", contenttypeid: item.contenttypeid || "12",
                firstimage: item.firstimage || "", firstimage2: item.firstimage2 || ""
            };
        });
        if (nextItems.length || !options.keepExisting) tourItems = nextItems;
        markTourItemsSource(tourItems, data._giloaSourceLang || requestLang);
        if (nextItems.length) {
            writeTourCache(center, requestLang, tourItems, Date.now());
            writeTourAreaCache("spots", center, requestLang, radiusM, tourItems, Date.now());
        }
        var visibleItems = getVisibleTourItems();
        if (visibleItems.length === 0) { emptyEl.style.display = ""; countEl.textContent = ""; renderTourCards(); return nextItems.length > 0; }
        countEl.textContent = formatTourCount(visibleItems.length); renderTourCards(); translateTourItemsForLang(currentLang, tourItems);
        return nextItems.length > 0;
    }).catch(function(err) {
        if (requestSeq !== tourRequestSeq || requestLang !== currentLang) return;
        loadingEl.style.display = "none";
        if (!tourItems.length) {
            emptyEl.style.display = "";
            emptyEl.textContent = getTourUiText().loadFailed;
            countEl.textContent = "";
        } else {
            emptyEl.style.display = "none";
            updateTourSummary();
        }
        console.warn("TourAPI request failed");
        throw err;
    }).finally(endTourApiLoading);
}

function tourResponseHasItems(data) {
    var body = data && data.response && data.response.body;
    return !!(body && body.items && body.items.item);
}

function fetchTourJsonWithFallback(buildUrl, lang) {
    lang = normalizeLang(lang);
    // French is rendered through translation, but the official TourAPI only
    // publishes Korean/English/Japanese/Chinese services.
    var apiRequestLang = lang === "fr" ? "en" : lang;
    var languageOrder = [apiRequestLang];
    if (languageOrder.indexOf("ko") < 0) languageOrder.push("ko");
    if (languageOrder.indexOf("en") < 0) languageOrder.push("en");
    var lastValidResponse = null;
    function waitForRetry() { return new Promise(function(resolve) { setTimeout(resolve, NETWORK_RETRY_DELAY_MS); }); }
    function fetchJson(url, retryCount) {
        var controller = typeof AbortController === "function" ? new AbortController() : null;
        var timer = setTimeout(function() { if (controller) controller.abort(); }, NETWORK_TIMEOUT_MS);
        return fetch(url, controller ? { signal: controller.signal, cache: "no-store" } : { cache: "no-store" }).then(function(res) {
            if (!res.ok) {
                var httpError = new Error("TourAPI HTTP " + res.status);
                httpError.status = res.status;
                throw httpError;
            }
            return res.json();
        }).catch(function(error) {
            var status = Number(error && error.status) || 0;
            var retryable = status === 0 || status === 408 || status === 429 || status >= 500;
            if (retryCount > 0 && retryable && navigator.onLine !== false) return waitForRetry().then(function() { return fetchJson(url, retryCount - 1); });
            throw error;
        }).finally(function() { clearTimeout(timer); });
    }
    function requestAt(index) {
        if (index >= languageOrder.length) {
            if (lastValidResponse) return Promise.resolve(lastValidResponse);
            return Promise.reject(new Error("TourAPI request failed in every supported fallback language"));
        }
        var sourceLang = languageOrder[index];
        return fetchJson(buildUrl(sourceLang), 1).then(function(data) {
            data._giloaSourceLang = sourceLang;
            var header = data && data.response && data.response.header;
            if (!header || !header.resultCode || header.resultCode === "0000") lastValidResponse = data;
            if (tourResponseHasItems(data)) return data;
            return requestAt(index + 1);
        }, function() { return requestAt(index + 1); });
    }
    return requestAt(0);
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
        ko: { eventstartdate: "시작일", eventenddate: "종료일", playtime: "시간", eventplace: "장소", sponsor1: "주최", usetimefestival: "이용요금", infocenter: "문의", restdate: "휴무일", usetime: "운영시간" },
        en: { eventstartdate: "Starts", eventenddate: "Ends", playtime: "Time", eventplace: "Place", sponsor1: "Host", usetimefestival: "Fee", infocenter: "Contact", restdate: "Closed", usetime: "Hours" },
        ja: { eventstartdate: "開始日", eventenddate: "終了日", playtime: "時間", eventplace: "場所", sponsor1: "主催", usetimefestival: "料金", infocenter: "お問い合わせ", restdate: "休業日", usetime: "営業時間" },
        zh: { eventstartdate: "开始日期", eventenddate: "结束日期", playtime: "时间", eventplace: "地点", sponsor1: "主办方", usetimefestival: "费用", infocenter: "咨询", restdate: "休息日", usetime: "营业时间" },
        es: { eventstartdate: "Inicio", eventenddate: "Fin", playtime: "Horario", eventplace: "Lugar", sponsor1: "Organiza", usetimefestival: "Precio", infocenter: "Contacto", restdate: "Cerrado", usetime: "Horario" },
        fr: { eventstartdate: "Début", eventenddate: "Fin", playtime: "Horaire", eventplace: "Lieu", sponsor1: "Organisateur", usetimefestival: "Tarif", infocenter: "Contact", restdate: "Fermeture", usetime: "Horaires" }
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
        if (value) lines.push({ key: key, label: labels[key] || key, text: value });
    });
    return lines;
}
function translateTourDetailLines(item, detail) {
    var lang = currentLang;
    var sourceLang = normalizeLang((detail && detail._sourceLang) || item._sourceLang || (hasHangul(detail && detail.overview) ? "ko" : lang));
    var lines = getTourDetailLines(detail);
    return Promise.all(lines.map(function(line) {
        var lineSource = hasHangul(line.text) ? "ko" : sourceLang;
        var translated = lineSource === lang ? Promise.resolve(line.text) : varcoTranslate(line.text, getVarcoLang(lineSource), getVarcoLang(lang));
        return translated.then(function(value) {
            var text = cleanTourText(value, "");
            return text ? (line.label ? line.label + ": " : "") + text : "";
        });
    })).then(function(translatedLines) { return translatedLines.filter(Boolean); });
}
var TOUR_UI_I18N = {
    ko:{phone:"전화",loading:"상세 정보를 불러오는 중...",noDetails:"상세 정보가 없습니다.",noImage:"이미지 없음",credit:"출처: ⓒ한국관광공사",loadFailed:"관광지 정보를 불러오지 못했어요. 지도를 다시 이동해 주세요.",customers:"고객 이용",paid:"유료",publicRestroom:"공중화장실",diagnostic:"두루누비 진단",stage:"단계",courses:"코스 정보",routes:"경로",points:"총 좌표",drawn:"그린 경로",error:"오류",none:"없음",waiting:"대기",loaded:"내장 경로 파일 로드됨",loadingRoutes:"경로 파일 불러오는 중",failedRoutes:"경로 파일 실패",off:"꺼짐",visibleRoutes:"주변 경로 표시됨",noRoutes:"주변 경로 없음"},
    en:{phone:"Phone",loading:"Loading details...",noDetails:"No details available.",noImage:"No image",credit:"Source: ⓒKorea Tourism Organization",loadFailed:"Unable to load nearby places. Move the map to retry.",customers:"Customers only",paid:"Paid",publicRestroom:"Public restroom",diagnostic:"Durunubi diagnostics",stage:"Stage",courses:"Courses",routes:"Routes",points:"Total coordinates",drawn:"Routes drawn",error:"Error",none:"None",waiting:"Waiting",loaded:"Bundled routes loaded",loadingRoutes:"Loading route file",failedRoutes:"Route file failed",off:"Off",visibleRoutes:"Nearby routes shown",noRoutes:"No nearby routes"},
    ja:{phone:"電話",loading:"詳細情報を読み込み中...",noDetails:"詳細情報はありません。",noImage:"画像なし",credit:"出典: ⓒ韓国観光公社",loadFailed:"周辺のスポットを読み込めませんでした。地図を動かして再試行してください。",customers:"利用客専用",paid:"有料",publicRestroom:"公衆トイレ",diagnostic:"ドゥルヌビ診断",stage:"状態",courses:"コース情報",routes:"経路",points:"座標の総数",drawn:"表示中の経路",error:"エラー",none:"なし",waiting:"待機中",loaded:"内蔵経路を読み込みました",loadingRoutes:"経路ファイルを読み込み中",failedRoutes:"経路ファイルの読み込み失敗",off:"オフ",visibleRoutes:"周辺の経路を表示中",noRoutes:"周辺の経路なし"},
    zh:{phone:"电话",loading:"正在加载详细信息...",noDetails:"暂无详细信息。",noImage:"暂无图片",credit:"来源: ⓒ韩国观光公社",loadFailed:"无法加载附近地点。请移动地图后重试。",customers:"仅限顾客",paid:"收费",publicRestroom:"公共卫生间",diagnostic:"Durunubi 诊断",stage:"状态",courses:"路线信息",routes:"路径",points:"坐标总数",drawn:"已显示路径",error:"错误",none:"无",waiting:"等待中",loaded:"已加载内置路径",loadingRoutes:"正在加载路径文件",failedRoutes:"路径文件加载失败",off:"关闭",visibleRoutes:"已显示附近路径",noRoutes:"附近没有路径"},
    es:{phone:"Teléfono",loading:"Cargando información...",noDetails:"No hay información disponible.",noImage:"Sin imagen",credit:"Fuente: ⓒOrganización de Turismo de Corea",loadFailed:"No se pudieron cargar los lugares cercanos. Mueve el mapa para intentarlo de nuevo.",customers:"Solo clientes",paid:"De pago",publicRestroom:"Baño público",diagnostic:"Diagnóstico de Durunubi",stage:"Estado",courses:"Información de rutas",routes:"Recorridos",points:"Coordenadas totales",drawn:"Recorridos mostrados",error:"Error",none:"Ninguno",waiting:"En espera",loaded:"Rutas incluidas cargadas",loadingRoutes:"Cargando archivo de rutas",failedRoutes:"Error del archivo de rutas",off:"Desactivado",visibleRoutes:"Rutas cercanas visibles",noRoutes:"Sin rutas cercanas"},
    fr:{phone:"Téléphone",loading:"Chargement des détails...",noDetails:"Aucun détail disponible.",noImage:"Aucune image",credit:"Source : ⓒOffice du tourisme de Corée",loadFailed:"Impossible de charger les lieux à proximité. Déplacez la carte pour réessayer.",customers:"Réservé aux clients",paid:"Payant",publicRestroom:"Toilettes publiques",diagnostic:"Diagnostic de Durunubi",stage:"État",courses:"Informations sur les itinéraires",routes:"Parcours",points:"Total des coordonnées",drawn:"Parcours affichés",error:"Erreur",none:"Aucune",waiting:"En attente",loaded:"Parcours intégrés chargés",loadingRoutes:"Chargement du fichier des parcours",failedRoutes:"Échec du fichier des parcours",off:"Désactivé",visibleRoutes:"Parcours proches affichés",noRoutes:"Aucun parcours proche"}
};
function getTourUiText() { return TOUR_UI_I18N[normalizeLang(currentLang)] || TOUR_UI_I18N.en; }
// Only provider-supplied place popups use this translator. Saved memories and
// photo notes never enter this path, and translations are not written to records.
var activePublicPlacePopup = null;
function translatePublicPlacePopup(popup) {
    var language = normalizeLang(currentLang);
    var root = popup && popup.getElement && popup.getElement();
    if (language === "ko" || !root || navigator.onLine === false) return Promise.resolve();
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    var entries = [], node;
    while ((node = walker.nextNode())) {
        if (hasHangul(node.nodeValue) && node.nodeValue.trim()) entries.push({node:node, text:node.nodeValue});
    }
    return entries.reduce(function(chain, entry) {
        return chain.then(function() {
            if (language !== normalizeLang(currentLang) || !entry.node.isConnected || !map.hasLayer(popup)) return;
            return varcoTranslate(entry.text, "ko", getVarcoLang(language)).then(function(translated) {
                if (language === normalizeLang(currentLang) && entry.node.isConnected && map.hasLayer(popup) && translated) entry.node.nodeValue = translated;
            });
        });
    }, Promise.resolve()).catch(function() { /* Keep the original public information when offline. */ });
}
function trackPublicPlacePopup(popup, refresh) {
    activePublicPlacePopup = {popup:popup, refresh:refresh};
    translatePublicPlacePopup(popup);
    return popup;
}
function refreshPublicPlacePopupLanguage() {
    var active = activePublicPlacePopup;
    if (active && map.hasLayer(active.popup)) active.refresh();
}
function buildTourPopupHtml(item, detailLines, isLoading) {
    var typeName = getTourTypeName(item.contenttypeid);
    var meta = getTourTypeMeta(item.contenttypeid);
    var title = getTourDisplayTitle(item);
    var addr = getTourDisplayAddr(item);
    var words = getTourUiText();
    var telLabel = words.phone;
    var loadingText = words.loading;
    var noDetailText = words.noDetails;
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
    var image = getTourImage(item);
    var imageHtml = image
        ? "<div class='tour-popup-image'><img src='" + escapeHtml(image) + "' alt='' referrerpolicy='no-referrer' onerror=\"this.parentNode.classList.add('fallback');this.remove()\"></div>"
        : "<div class='tour-popup-image fallback' aria-label='" + escapeHtml(words.noImage) + "'></div>";
    var liked = isTourLiked(item);
    var likeButton = buildMapPlaceLikeButton(getTourLikeKey(item));
    return imageHtml + "<b class='tour-popup-title'>" + escapeHtml(title) + "</b><br>" + tag + "<br><small>" + escapeHtml(addr) + "</small>" + tel + detailHtml + likeButton + "<small class='tour-popup-credit'>" + escapeHtml(words.credit) + "</small>";
}
function hideFestivalStrip() {
    var strip = document.getElementById("festival-strip");
    var label = document.getElementById("festival-strip-label");
    if (strip) strip.classList.remove("show");
    if (label) label.classList.remove("show");
}

function syncTourCloseButton() {
    var closeBtn = document.getElementById("tour-close-btn");
    if (closeBtn) closeBtn.style.display = "none";
    var header = document.getElementById("tour-header");
    if (header) header.setAttribute("aria-expanded", String(tourPanelOpen));
    var toggleIcon = document.getElementById("tour-toggle-icon");
    if (toggleIcon) toggleIcon.classList.toggle("open", tourPanelOpen);
}

function renderTourCards() {
    var listEl = document.getElementById("tour-list"); var expandBtn = document.getElementById("tour-expand-btn"); if (!listEl || !expandBtn) return;
    var previousScrollTop = listEl.scrollTop;
    listEl.innerHTML = ""; var center = getMapSearchCenter();
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
    var showCount = visibleItems.length;
    for (var i = 0; i < showCount; i++) {
        (function(item) {
            var meta = getTourTypeMeta(item.contenttypeid);
            var card = document.createElement("div"); card.className = "tour-card" + (isTourLiked(item) ? " is-liked" : ""); card.setAttribute("data-place-like-key", getTourLikeKey(item)); card.tabIndex = 0; card.setAttribute("role", "button"); applyTourTypeVars(card, meta);
            var imageEl = makeTourImage(item, "tour-card-image");
            var infoEl = document.createElement("div"); infoEl.className = "tour-card-info";
            var nameEl = document.createElement("div"); nameEl.className = "tour-card-name"; nameEl.textContent = getTourDisplayTitle(item) || (UI_TEXT[currentLang] || UI_TEXT.ko).empty_tour;
            var typeEl = document.createElement("div"); typeEl.className = "tour-card-type"; typeEl.textContent = getTourTypeName(item.contenttypeid) || meta.label;
            var addrEl = document.createElement("div"); addrEl.className = "tour-card-addr"; addrEl.textContent = getTourDisplayAddr(item) || "";
            var distEl = document.createElement("div"); distEl.className = "tour-card-dist";
            var distM = center.distanceTo([parseFloat(item.mapy), parseFloat(item.mapx)]);
            distEl.textContent = distM < 1000 ? Math.round(distM) + "m" : (distM / 1000).toFixed(1) + "km";
            infoEl.appendChild(nameEl); infoEl.appendChild(typeEl); infoEl.appendChild(distEl);
            card.appendChild(imageEl); card.appendChild(infoEl);
            var openItem = function() { focusTourItemBelowPanel(item); };
            card.addEventListener("click", openItem);
            card.addEventListener("keydown", function(event) { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openItem(); } });
            listEl.appendChild(card);
        })(visibleItems[i]);
    }
    expandBtn.style.display = "none";
    var expandIcon = document.getElementById("tour-expand-icon");
    var expandText = document.getElementById("tour-expand-text");
    if (expandIcon) expandIcon.textContent = tourExpanded ? "-" : "+";
    if (expandText) expandText.textContent = tourExpanded ? ((UI_TEXT[currentLang] || UI_TEXT.ko).close || "Close") : ((UI_TEXT[currentLang] || UI_TEXT.ko).more || "More");
    listEl.classList.toggle("expanded", visibleItems.length > 0 && tourPanelOpen);
    if (previousScrollTop > 0) {
        requestAnimationFrame(function() { listEl.scrollTop = previousScrollTop; });
    }
    syncTourCloseButton();
    addTourMarkers();
    if (tourPanelOpen) renderFestivalStrip();
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
    if (tourPanelOpen) {
        tourPanelOpen = false;
        tourExpanded = false;
    } else {
        tourPanelOpen = true;
        tourExpanded = false;
        updateTourSummary();
        // 사용자가 패널을 열면 캐시 상태와 관계없이 현재 경험 중심을 확인한다.
        refreshTourData({ forceHydrate: false, force: true });
    }
    renderTourCards();
}

function toggleTourMore(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    tourPanelOpen = true;
    tourExpanded = !tourExpanded;
    renderTourCards();
}
var tourHeaderEl = document.getElementById("tour-header");
if (tourHeaderEl) {
    tourHeaderEl.addEventListener("click", function(event) { event.stopPropagation(); toggleTourExpand(); });
    tourHeaderEl.addEventListener("keydown", function(event) {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.stopPropagation(); toggleTourExpand(); }
    });
}
var tourListInteractionEl = document.getElementById("tour-list");
if (tourListInteractionEl) {
    if (window.L && L.DomEvent) {
        L.DomEvent.disableClickPropagation(tourListInteractionEl);
        L.DomEvent.disableScrollPropagation(tourListInteractionEl);
    }
    ["touchstart", "touchmove", "pointerdown", "wheel"].forEach(function(eventName) {
        tourListInteractionEl.addEventListener(eventName, function(event) {
            event.stopPropagation();
        }, { passive: true });
    });
}
var hamButtonEl = document.getElementById("ham-btn");
if (hamButtonEl) {
    hamButtonEl.addEventListener("keydown", function(event) {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggleSidebar();
        }
    });
}

var tourFocusSequence = 0;
function focusTourItemBelowPanel(item) {
    var lat = parseFloat(item && item.mapy);
    var lng = parseFloat(item && item.mapx);
    if (!isFinite(lat) || !isFinite(lng)) return;
    var sequence = ++tourFocusSequence;
    var destination = L.latLng(lat, lng);
    var adjusted = false;
    function openSelectedPopup() {
        if (sequence !== tourFocusSequence) return;
        showTourPopup(item);
    }
    function adjustSelectedPosition() {
        if (adjusted || sequence !== tourFocusSequence) return;
        adjusted = true;
        map.off("moveend", adjustSelectedPosition);
        var mapContainer = map.getContainer();
        var mapRect = mapContainer.getBoundingClientRect();
        var mapHeight = mapContainer.clientHeight || mapRect.height;
        var mapWidth = mapContainer.clientWidth || mapRect.width;
        var panel = document.getElementById("tour-panel");
        var panelBottom = 0;
        if (panel && tourPanelOpen) {
            var panelRect = panel.getBoundingClientRect();
            panelBottom = Math.max(0, panelRect.bottom - mapRect.top);
        }
        var minTargetY = mapHeight * 0.68;
        var maxTargetY = mapHeight * 0.75;
        var popupClearance = Math.min(180, mapHeight * 0.24);
        var targetY = Math.max(mapHeight * 0.70, panelBottom + popupClearance);
        targetY = Math.max(minTargetY, Math.min(maxTargetY, targetY));
        var hud = document.getElementById("hud");
        var hudHeight = hud ? hud.offsetHeight : 70;
        targetY = Math.min(targetY, mapHeight - hudHeight - 36);
        var targetX = mapWidth * 0.5;
        var currentPoint = map.latLngToContainerPoint(destination);
        var panOffset = L.point(currentPoint.x - targetX, currentPoint.y - targetY);
        var popupOpened = false;
        function openOnce() {
            if (popupOpened || sequence !== tourFocusSequence) return;
            popupOpened = true;
            map.off("moveend", openOnce);
            openSelectedPopup();
        }
        if (Math.abs(panOffset.x) > 1 || Math.abs(panOffset.y) > 1) {
            map.once("moveend", openOnce);
            map.panBy(panOffset, { animate: true, duration: 0.28 });
            setTimeout(openOnce, 420);
        } else {
            openOnce();
        }
    }
    map.once("moveend", adjustSelectedPosition);
    map.flyTo(destination, Math.max(map.getZoom(), 17), { animate: true, duration: 0.38 });
    setTimeout(adjustSelectedPosition, 700);
}

function showTourPopup(item) {
    var lat = parseFloat(item.mapy); var lng = parseFloat(item.mapx);
    var typeName = getTourTypeName(item.contenttypeid);
    var title = getTourDisplayTitle(item);
    setSelectedDestination(lat, lng, title || typeName || getTourUiText().noDetails);
    var popup = L.popup({
        className: "tour-popup",
        autoPan: false,
        keepInView: false,
        maxWidth: 280,
        offset: L.point(0, -6)
    })
        .setLatLng([lat, lng])
        .setContent(buildTourPopupHtml(item, null, true))
        .openOn(map);
    trackPublicPlacePopup(popup, function() { showTourPopup(item); });
    var popupLanguage = normalizeLang(currentLang);
    fetchTourDetail(item).then(function(detail) {
        if (popupLanguage !== normalizeLang(currentLang) || !map.hasLayer(popup)) return [];
        return translateTourDetailLines(item, detail);
    }).then(function(lines) {
        if (popupLanguage !== normalizeLang(currentLang) || !map.hasLayer(popup)) return;
        item._translatedDetailLines = lines;
        popup.setContent(buildTourPopupHtml(item, lines, false));
        translatePublicPlacePopup(popup);
    }).catch(function() {
        if (popupLanguage === normalizeLang(currentLang) && map.hasLayer(popup)) {
            popup.setContent(buildTourPopupHtml(item, [], false));
            translatePublicPlacePopup(popup);
        }
    });
}

function clearTourMarkers() {
    var before = captureGpsIntegrity();
    logGpsLayerChange("BEFORE tour-clear", before);
    tourMarkerLayer.clearLayers();
    tourMarkers = [];
    refreshGpsVisualsAfterPlaceLayerChange("tour-clear", before);
}
function addTourMarkers() {
    var before = captureGpsIntegrity();
    logGpsLayerChange("BEFORE tour-refresh", before);
    tourMarkerLayer.clearLayers();
    tourMarkers = [];
    getVisibleTourMarkerItems().forEach(function(item, index) { var lat = parseFloat(item.mapy); var lng = parseFloat(item.mapx); if (!isFinite(lat) || !isFinite(lng)) return; var meta = getTourTypeMeta(item.contenttypeid); var state = getTourMarkerState(item, index); var liked = isTourLiked(item); var likeKey = getTourLikeKey(item); var classes = [state.visited ? "state-visited" : "", state.selected ? "state-selected" : "", state.nearby ? "state-nearby" : "", state.discoverable ? "state-discoverable" : "", liked ? "state-liked" : ""].filter(Boolean).join(" "); var badge = liked ? "★" : state.visited ? "✓" : state.missionAvailable ? "📷" : state.discoverable ? "◎" : ""; var icon = L.divIcon({ className: "tour-map-marker-wrap", html: mapPlaceSymbolHtml(({"39":restaurantCoverage.iconForName(item.title, ""),"38":"shopping","32":"lodging","25":"activity","28":"activity"})[String(item.contenttypeid)] || "discovery", classes, likeKey, meta.color), iconSize: [28,28], iconAnchor: [14,14] }); var marker = L.marker([lat, lng], { pane: "tourPane", icon: icon, title: (getTourTypeName(item.contenttypeid) || meta.label) + " - " + (getTourDisplayTitle(item) || "") }).addTo(tourMarkerLayer); marker._tourItem = item; marker.on("click", function() { focusTourItemBelowPanel(item); }); tourMarkers.push(marker); });
    refreshGpsVisualsAfterPlaceLayerChange("tour-refresh", before);
    restaurantCoverage.refresh();
}


// ?쒖슱 怨듦났?꾩꽌愿 ?꾩튂?뺣낫
var SEOUL_LIBRARY_API_KEY = window.GILOA_SEOUL_LIBRARY_API_KEY || "";
var SEOUL_LIBRARY_API_URL = "https://openapi.seoul.go.kr/" + SEOUL_LIBRARY_API_KEY + "/json/SeoulPublicLibraryInfo/1/300/";
var SEOUL_LIBRARY_CACHE_KEY = "giloa-library-seoul-v1";
var SEOUL_LIBRARY_CACHE_MS = 30 * 24 * 60 * 60 * 1000;
var libraryItems = [];
var libraryMarkers = [];
var libraryMarkerLayer = L.layerGroup().addTo(map);
var LIBRARY_MARKER_COLOR = "#2563eb";

// Public restroom data: bundled coordinates first, then short background
// refreshes from Seoul Open Data / OSM. Last-known data remains usable offline.
var SEOUL_RESTROOM_API_KEY = window.GILOA_SEOUL_RESTROOM_API_KEY || "";
var SEOUL_RESTROOM_API_BASE = window.GILOA_SEOUL_RESTROOM_API_BASE || "https://openapi.seoul.go.kr";
var SEOUL_RESTROOM_API_SERVICE = "mgisToiletPoi";
var SEOUL_RESTROOM_PAGE_SIZE = 1000;
var RESTROOM_DATA_URL = "./data/restrooms_seoul.json";
var RESTROOM_GEOCODE_CACHE_KEY = "giloa-restroom-geocode-cache";
var RESTROOM_SEOUL_CACHE_KEY = "giloa-restroom-seoul-v2";
var RESTROOM_AREA_CACHE_PREFIX = "giloa-restroom-area-v2:";
var RESTROOM_CACHE_FRESH_MS = 6 * 60 * 60 * 1000;
var RESTROOM_CACHE_STALE_MS = 30 * 24 * 60 * 60 * 1000;
var RESTROOM_SEOUL_REFRESH_MS = 24 * 60 * 60 * 1000;
var RESTROOM_PROVIDER_TIMEOUT_MS = 6500;
var RESTROOM_MAX_MARKERS = 100;
var RESTROOM_MAX_AREA_CACHES = 12;
var RESTROOM_OSM_ENDPOINTS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];
var restroomRawItems = [];      // ?쒖슱 ?꾩껜 ?붿옣??(?대쫫+二쇱냼, 醫뚰몴 ?놁쓬)
var restroomRawLoaded = false;
var restroomGeoCache = {};      // { 二쇱냼: {lat, lng} } - localStorage???곴뎄 罹먯떆
var restroomVisibleItems = [];  // 醫뚰몴媛 ?뺣낫?섏뼱 ?ㅼ젣濡??쒖떆 以묒씤 ??ぉ
var restroomMarkers = [];
var restroomMarkerLayer = L.layerGroup().addTo(map);
var restroomSearchSeq = 0;
var restroomSearchPromise = null;
var restroomSearchKey = "";
var restroomAbortController = null;
var restroomSeoulRefreshPromise = null;
var restroomSeoulLastAttemptAt = 0;
var restroomGuFetched = {};     // ?대? 吏?ㅼ퐫?⑹쓣 ?쒕룄??援??대쫫 吏묓빀 (以묐났 諛⑹?)
var restroomGeocodeQueueBusy = false;
var RESTROOM_MARKER_COLOR = "#a3e635";

function normalizeLang(lang) {
    return ({ ko: "ko", en: "en", ja: "ja", jp: "ja", zh: "zh", cn: "zh", "zh-cn": "zh", "zh_cn": "zh", es: "es", "es-es": "es", "es_mx": "es", "es-mx": "es", fr: "fr", "fr-fr": "fr", "fr_ca": "fr", "fr-ca": "fr" })[String(lang || currentLang || "ko").toLowerCase()] || "ko";
}

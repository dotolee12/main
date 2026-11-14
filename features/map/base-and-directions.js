const map = window.giloaMapBootstrap || L.map("map", { zoomControl: false, attributionControl: true }).setView([37.5665, 126.978], 16);
const DEFAULT_CARTO_TILE_URL = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const BASE_TILE_LAYERS = [
    {
        url: window.GILOA_CARTO_TILE_URL || DEFAULT_CARTO_TILE_URL,
        options: {
            zIndex: 10,
            maxZoom: 20,
            crossOrigin: true,
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, ' +
                '&copy; <a href="https://carto.com/attributions">CARTO</a>'
        }
    },
    {
        url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        options: {
            zIndex: 10,
            maxZoom: 19,
            crossOrigin: true,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }
    }
];
let currentBaseTileLayer = window.giloaInitialBaseTileLayer || null;
let lastReadyBaseTileLayer = null;
const BASE_TILE_PROVIDER_KEY = "giloa-map-tile-provider-v4";
let currentBaseTileIndex = 0;
let baseTileErrorCount = 0;
let baseTileLoadTimer = null;

try {
    var savedTileProvider = parseInt(localStorage.getItem(BASE_TILE_PROVIDER_KEY), 10);
    if (isFinite(savedTileProvider) && savedTileProvider >= 0 && savedTileProvider < BASE_TILE_LAYERS.length) currentBaseTileIndex = savedTileProvider;
} catch (_) {}

function setBaseTileLayer(index) {
    var meta = BASE_TILE_LAYERS[index] || BASE_TILE_LAYERS[0];
    var mapWrap = document.getElementById("map-wrap");
    if (mapWrap) {
        if (!lastReadyBaseTileLayer) mapWrap.classList.remove("tiles-ready");
        mapWrap.classList.remove("tiles-error");
    }
    if (currentBaseTileLayer && currentBaseTileLayer !== lastReadyBaseTileLayer) map.removeLayer(currentBaseTileLayer);
    currentBaseTileIndex = index;
    baseTileErrorCount = 0;
    var tileLayer = L.tileLayer(meta.url, meta.options).addTo(map);
    currentBaseTileLayer = tileLayer;
    if (baseTileLoadTimer !== null) clearTimeout(baseTileLoadTimer);
    baseTileLoadTimer = setTimeout(function() {
        if (tileLayer !== currentBaseTileLayer) return;
        if (mapWrap && !mapWrap.classList.contains("tiles-ready")) {
            if (currentBaseTileIndex < BASE_TILE_LAYERS.length - 1) {
                setBaseTileLayer(currentBaseTileIndex + 1);
            } else {
                mapWrap.classList.add("tiles-error");
            }
        }
    }, 9000);
    tileLayer.on("tileload", function() {
        if (tileLayer !== currentBaseTileLayer) return;
        if (baseTileLoadTimer !== null) {
            clearTimeout(baseTileLoadTimer);
            baseTileLoadTimer = null;
        }
        if (mapWrap) {
            mapWrap.classList.add("tiles-ready");
            mapWrap.classList.remove("tiles-error");
        }
        if (lastReadyBaseTileLayer && lastReadyBaseTileLayer !== tileLayer && map.hasLayer(lastReadyBaseTileLayer)) map.removeLayer(lastReadyBaseTileLayer);
        lastReadyBaseTileLayer = tileLayer;
        try { localStorage.setItem(BASE_TILE_PROVIDER_KEY, String(currentBaseTileIndex)); } catch (_) {}
        scheduleRender();
    });
    tileLayer.on("tileerror", function() {
        if (tileLayer !== currentBaseTileLayer) return;
        baseTileErrorCount += 1;
        if (baseTileErrorCount >= 6 && currentBaseTileIndex < BASE_TILE_LAYERS.length - 1) {
            setBaseTileLayer(currentBaseTileIndex + 1);
        } else if (baseTileErrorCount >= 6 && mapWrap) {
            mapWrap.classList.add("tiles-error");
        }
    });
}
setBaseTileLayer(currentBaseTileIndex);
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
        var settled = false;
        var script = null;
        var timer = setTimeout(function() { fail(new Error("Kakao Maps SDK timed out.")); }, 8000);
        function succeed() {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            resolve();
        }
        function fail(error) {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            if (script && script.parentNode) script.parentNode.removeChild(script);
            kakaoTrafficLoading = null;
            reject(error);
        }
        if (window.kakao && window.kakao.maps) {
            try { window.kakao.maps.load(succeed); } catch (error) { fail(error); }
            return;
        }
        var appKey = getKakaoJsKey();
        if (!appKey) {
            fail(new Error("Kakao JavaScript key is missing."));
            return;
        }
        script = document.createElement("script");
        script.src = "https://dapi.kakao.com/v2/maps/sdk.js?appkey=" + encodeURIComponent(appKey) + "&libraries=services&autoload=false";
        script.async = true;
        script.onload = function() {
            if (window.kakao && window.kakao.maps) {
                try { window.kakao.maps.load(succeed); } catch (error) { fail(error); }
            } else fail(new Error("Kakao Maps SDK is unavailable."));
        };
        script.onerror = function() { fail(new Error("Kakao Maps SDK failed to load.")); };
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
        alert(earlyUiText("trafficFailed"));
        console.warn(error);
    });
}
function openKakaoDirections() {
    if (!currentPos) {
        alert(earlyUiText("locationBeforeDirections"));
        centerMap();
        return;
    }
    var mapCenter = map.getCenter();
    var dest = selectedDestination || (mapCenter ? { lat: mapCenter.lat, lng: mapCenter.lng, name: earlyUiText("destination") } : null);
    if (!dest || !isFinite(dest.lat) || !isFinite(dest.lng)) {
        alert(earlyUiText("selectDestination"));
        return;
    }
    if (currentPos.distanceTo([dest.lat, dest.lng]) < 15) {
        alert(earlyUiText("destinationTooClose"));
        return;
    }
    var startName = earlyUiText("currentLocation");
    var destName = dest.name || earlyUiText("destination");
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
        name: String(name || earlyUiText("destination")).trim() || earlyUiText("destination")
    };
}

map.on("moveend zoomend", function() {
    var wrap = document.getElementById("kakao-traffic-wrap");
    if (wrap && wrap.classList.contains("show")) syncKakaoTrafficMap();
});

map.createPane("colorRevealPane");
map.getPane("colorRevealPane").style.zIndex = 205;
map.getPane("colorRevealPane").style.pointerEvents = "none";
map.createPane("fogPane");
map.getPane("fogPane").style.zIndex = 450;
// Imported GPX stays above recorded paths (625), below photos (630).
map.createPane("gpxRoutePane");
map.getPane("gpxRoutePane").style.zIndex = 628;
map.createPane("photoPane");
map.getPane("photoPane").style.zIndex = 630;
map.createPane("memoryPane");
map.getPane("memoryPane").style.zIndex = 640;
map.createPane("playerPane");
// The live GPS marker and accuracy circle must stay above every map-data pane.
map.getPane("playerPane").style.zIndex = 690;
map.createPane("tourPane");
map.getPane("tourPane").style.zIndex = 660;
map.createPane("adminBoundaryPane");
// Administrative borders stay below route lines and the exploration fog.
map.getPane("adminBoundaryPane").style.zIndex = 430;
map.getPane("adminBoundaryPane").style.pointerEvents = "auto";
map.createPane("durunubiPane");
// Keep official routes above the base map but below the exploration fog.
// Cleared areas reveal the route naturally together with the map.
map.getPane("durunubiPane").style.zIndex = 440;
map.getPane("durunubiPane").style.pointerEvents = "auto";
map.createPane("libraryPane");
map.getPane("libraryPane").style.zIndex = 665;
map.createPane("specialPlacePane");
map.getPane("specialPlacePane").style.zIndex = 670;
map.createPane("visitedPlacePane");
map.getPane("visitedPlacePane").style.zIndex = 675;
map.createPane("restroomPane");
map.getPane("restroomPane").style.zIndex = 667;
map.createPane("parkingPane");
map.getPane("parkingPane").style.zIndex = 668;
map.createPane("fishingPane");
map.getPane("fishingPane").style.zIndex = 669;
var tourRenderer = L.svg({ pane: "tourPane" });
var durunubiRenderer = L.canvas({ pane: "durunubiPane", padding: 1 });
var durunubiLayerGroup = L.featureGroup().addTo(map);

var adminBoundaryLayer = null;
var adminDistrictFeatures = [];
var activeAdminBoundaryLayer = null;
var activeAdminDistrictName = "";
var ADMIN_REGION_TEXT = {
    ko: "지도 중심", en: "Map center", ja: "地図の中心", zh: "地图中心",
    es: "Centro del mapa", fr: "Centre de la carte"
};

function adminBoundaryStyle(feature) {
    var selected = feature && feature.properties && feature.properties.title === activeAdminDistrictName;
    return {
        pane: "adminBoundaryPane",
        color: selected ? "#8be7ff" : "#4fc3f7",
        weight: selected ? 2.6 : 1.2,
        opacity: selected ? 0.95 : 0.62,
        fillColor: "#4fc3f7",
        fillOpacity: selected ? 0.1 : 0.018,
        lineCap: "round",
        lineJoin: "round"
    };
}

function makeAdminRegionLabel() {
    var wrap = document.getElementById("map-wrap");
    if (!wrap) return null;
    var label = document.getElementById("admin-region-label");
    if (!label) {
        label = document.createElement("button");
        label.type = "button";
        label.id = "admin-region-label";
        label.className = "admin-region-label";
        label.hidden = true;
        label.addEventListener("click", function() {
            if (activeAdminBoundaryLayer && activeAdminBoundaryLayer.getBounds) {
                map.fitBounds(activeAdminBoundaryLayer.getBounds(), { padding:[32,32], maxZoom:12 });
            }
        });
        wrap.appendChild(label);
    }
    return label;
}

function pointInAdminRing(lng, lat, ring) {
    var inside = false;
    for (var i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        var xi = Number(ring[i][0]), yi = Number(ring[i][1]);
        var xj = Number(ring[j][0]), yj = Number(ring[j][1]);
        if (((yi > lat) !== (yj > lat)) && lng < (xj - xi) * (lat - yi) / ((yj - yi) || 1e-12) + xi) inside = !inside;
    }
    return inside;
}

function pointInAdminPolygon(lng, lat, polygon) {
    if (!polygon || !polygon.length || !pointInAdminRing(lng, lat, polygon[0])) return false;
    for (var i = 1; i < polygon.length; i += 1) if (pointInAdminRing(lng, lat, polygon[i])) return false;
    return true;
}

function adminFeatureContains(feature, latlng) {
    var bbox = feature._giloaBbox;
    if (!bbox || latlng.lng < bbox[0] || latlng.lat < bbox[1] || latlng.lng > bbox[2] || latlng.lat > bbox[3]) return false;
    var geometry = feature.geometry || {};
    if (geometry.type === "Polygon") return pointInAdminPolygon(latlng.lng, latlng.lat, geometry.coordinates);
    if (geometry.type === "MultiPolygon") return geometry.coordinates.some(function(polygon) { return pointInAdminPolygon(latlng.lng, latlng.lat, polygon); });
    return false;
}

function getAdminFeatureBbox(feature) {
    var bbox = [Infinity, Infinity, -Infinity, -Infinity];
    function walk(value) {
        if (!Array.isArray(value)) return;
        if (value.length >= 2 && typeof value[0] === "number" && typeof value[1] === "number") {
            bbox[0] = Math.min(bbox[0], value[0]); bbox[1] = Math.min(bbox[1], value[1]);
            bbox[2] = Math.max(bbox[2], value[0]); bbox[3] = Math.max(bbox[3], value[1]);
        } else value.forEach(walk);
    }
    walk(feature.geometry && feature.geometry.coordinates);
    return bbox;
}

function updateAdminRegionForMap() {
    if (!adminBoundaryLayer || !adminDistrictFeatures.length) return;
    var center = map.getCenter();
    var feature = adminDistrictFeatures.find(function(candidate) { return adminFeatureContains(candidate, center); }) || null;
    var name = feature && feature.properties ? String(feature.properties.title || "") : "";
    if (name === activeAdminDistrictName) return;
    activeAdminDistrictName = name;
    if (adminBoundaryLayer.resetStyle) adminBoundaryLayer.resetStyle();
    activeAdminBoundaryLayer = null;
    if (feature && feature._giloaLayer) {
        activeAdminBoundaryLayer = feature._giloaLayer;
        activeAdminBoundaryLayer.setStyle(adminBoundaryStyle(feature));
        if (activeAdminBoundaryLayer.bringToFront) activeAdminBoundaryLayer.bringToFront();
    }
    var label = makeAdminRegionLabel();
    if (label) {
        label.hidden = !name;
        var municipalityName = getMunicipalityName(name) || name;
        label.dataset.municipality = municipalityName;
        label.textContent = name ? ((ADMIN_REGION_TEXT[currentLang] || ADMIN_REGION_TEXT.ko) + " · " + municipalityName) : "";
        label.setAttribute("aria-label", label.textContent);
    }
}

var ADMIN_BOUNDARY_ASSET_URL = "./data/admin-districts.geojson";
var ADMIN_BOUNDARY_URL = ADMIN_BOUNDARY_ASSET_URL + "?v=2020-sgis-1";
// The boundary fetch used to fail into a console warning only, which is
// invisible on a phone. The outcome is recorded so the atlas diagnostic can
// say whether the file is missing, malformed or simply still downloading.
var adminBoundaryLoadStatus = { state:"idle", detail:"", url:ADMIN_BOUNDARY_URL, at:0 };

function setAdminBoundaryStatus(state, detail) {
    adminBoundaryLoadStatus = { state:state, detail:String(detail || ""), url:ADMIN_BOUNDARY_URL, at:Date.now() };
}

function loadAdminBoundaryJsonByXhr(url) {
    return new Promise(function(resolve, reject) {
        if (typeof XMLHttpRequest !== "function") { reject(new Error("XMLHttpRequest unavailable")); return; }
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.timeout = 15000;
        xhr.onload = function() {
            // Android file:///android_asset responses commonly report status 0.
            if (xhr.status !== 0 && (xhr.status < 200 || xhr.status >= 300)) { reject(new Error("XHR HTTP " + xhr.status)); return; }
            try { resolve(JSON.parse(xhr.responseText)); }
            catch (error) { reject(new Error("GeoJSON parse failed: " + error.message)); }
        };
        xhr.onerror = function() { reject(new Error("GeoJSON XHR failed")); };
        xhr.ontimeout = function() { reject(new Error("GeoJSON XHR timeout")); };
        try { xhr.send(); } catch (error) { reject(error); }
    });
}

function loadAdminBoundaryJson() {
    var isAndroidAsset = location.protocol === "file:" || (typeof isNativeApp === "function" && isNativeApp());
    // A query string on file:///android_asset can make WebView fetch() fail
    // even though the bundled file exists. XHR with the plain asset path is
    // reliable there; browsers retain network-first cache-busted loading.
    if (isAndroidAsset) return loadAdminBoundaryJsonByXhr(ADMIN_BOUNDARY_ASSET_URL);
    return fetch(ADMIN_BOUNDARY_URL).then(function(response) {
        if (!response.ok) throw new Error("HTTP " + response.status + " " + (response.statusText || ""));
        return response.json();
    }).catch(function(fetchError) {
        return loadAdminBoundaryJsonByXhr(ADMIN_BOUNDARY_ASSET_URL).catch(function(xhrError) {
            throw new Error((fetchError && fetchError.message ? fetchError.message : "fetch failed") + " / " + xhrError.message);
        });
    });
}

function loadAdminDistrictBoundaries() {
    setAdminBoundaryStatus("loading", "");
    return loadAdminBoundaryJson().then(function(data) {
        adminDistrictFeatures = Array.isArray(data && data.features) ? data.features : [];
        if (typeof registerRegionStayMunicipalities === "function") registerRegionStayMunicipalities(adminDistrictFeatures);
        adminDistrictFeatures.forEach(function(feature) { feature._giloaBbox = getAdminFeatureBbox(feature); });
        adminBoundaryLayer = L.geoJSON(data, {
            pane:"adminBoundaryPane",
            style:adminBoundaryStyle,
            onEachFeature:function(feature, layer) {
                feature._giloaLayer = layer;
                var name = feature.properties && feature.properties.title;
                if (name) layer.bindTooltip(escapeHtml(name), { sticky:true, direction:"top", className:"admin-boundary-tooltip" });
            }
        }).addTo(map);
        updateAdminRegionForMap();
        // Any city resolved before the polygons arrived came from the fallback
        // boxes, so the memoised answers have to be thrown away here.
        invalidateRegionStayCache();
        scheduleRegionStayRecalculation();
        if (adminDistrictFeatures.length) setAdminBoundaryStatus("ok", String(adminDistrictFeatures.length));
        else setAdminBoundaryStatus("empty", earlyUiText("featuresEmpty"));
        if (GILOA_DEBUG) console.info("[GILOA ADMIN BOUNDARY]", adminDistrictFeatures.length, "districts loaded",
            adminDistrictFeatures.slice(0, 3).map(getAdminFeatureTitle));
        refreshRegionBadgeAtlasIfOpen();
    }).catch(function(error) {
        setAdminBoundaryStatus("failed", (error && (error.message || error.name)) || String(error));
        console.warn("[GILOA ADMIN BOUNDARY] load failed", error);
    });
}

map.on("moveend", updateAdminRegionForMap);
loadAdminDistrictBoundaries();


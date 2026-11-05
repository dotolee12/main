var colorRevealPane = map.getPane("colorRevealPane");
colorRevealPane.appendChild(document.getElementById("color-reveal-canvas"));
var fogPane = map.getPane("fogPane");
fogPane.appendChild(document.getElementById("fog-canvas"));
fogPane.appendChild(document.getElementById("fog-shade-canvas"));
fogPane.appendChild(document.getElementById("age-canvas"));
fogPane.appendChild(document.getElementById("stay-canvas"));

const photoClusterGroup = L.markerClusterGroup({
    clusterPane: "photoPane", maxClusterRadius: 60, disableClusteringAtZoom: CLUSTER_ZOOM_THRESHOLD + 1,
    iconCreateFunction: function(cluster) { var count = cluster.getChildCount(); return L.divIcon({ className: "photo-cluster-icon", html: '<div class="photo-cluster-inner">' + count + '</div>', iconSize: [36, 36] }); }
});
map.addLayer(photoClusterGroup);

const colorRevealCanvas = document.getElementById("color-reveal-canvas");
const fogCanvas = document.getElementById("fog-canvas");
const fogShadeCanvas = document.getElementById("fog-shade-canvas");
const ageCanvas = document.getElementById("age-canvas");
const stayCanvas = document.getElementById("stay-canvas");
const colorRevealCtx = colorRevealCanvas.getContext("2d");
const fogCtx = fogCanvas.getContext("2d");
const fogShadeCtx = fogShadeCanvas.getContext("2d");
const ageCtx = ageCanvas.getContext("2d");
const stayCtx = stayCanvas.getContext("2d");
const colorRevealMaskCanvas = document.createElement("canvas");
const fogScratchCanvas = document.createElement("canvas");
const ageScratchCanvas = document.createElement("canvas");
const colorRevealMaskCtx = colorRevealMaskCanvas.getContext("2d");
const fogScratchCtx = fogScratchCanvas.getContext("2d");
const ageScratchCtx = ageScratchCanvas.getContext("2d");
let colorRevealDrawWarningShown = false;
let canvasTopLeft = L.point(0, 0);

function syncCanvasPosition() {
    canvasTopLeft = map.containerPointToLayerPoint([0, 0]);
    [colorRevealCanvas, fogCanvas, fogShadeCanvas, ageCanvas, stayCanvas].forEach(function(c) { L.DomUtil.setPosition(c, canvasTopLeft); });
}
// The canvas is visually pinned to the map container.  Drawing in container
// coordinates keeps the fog aligned with Leaflet markers while the map pane is
// being translated (especially on Android WebView during a touch pan).
function latLngToCanvasPoint(latlng) { return map.latLngToContainerPoint(latlng); }

function resizeCanvas() {
    var mapEl = document.getElementById("map");
    var w = mapEl.clientWidth || window.innerWidth;
    var h = mapEl.clientHeight || window.innerHeight;
    [colorRevealCanvas, fogCanvas, fogShadeCanvas, ageCanvas, stayCanvas].forEach(function(c) { c.width = w; c.height = h; });
    [colorRevealMaskCanvas, fogScratchCanvas, ageScratchCanvas].forEach(function(c) { c.width = w; c.height = h; });
    syncCanvasPosition();
    scheduleRender();
}

window.addEventListener("resize", resizeCanvas);
map.on("resize", resizeCanvas);
map.on("move zoom", scheduleRender);
map.on("zoomend", updatePhotoMarkerSizes);

if (typeof ResizeObserver === "function") {
    new ResizeObserver(function() { resizeCanvas(); }).observe(document.getElementById("map"));
}

function scheduleRender() { if (rafId !== null) return; rafId = requestAnimationFrame(function() { rafId = null; render(); }); }
function getPersistedGpsPointCount() {
    try {
        var saved = JSON.parse(localStorage.getItem(getLocalStorageKey()) || "{}");
        return Array.isArray(saved.rawGpsPoints) ? saved.rawGpsPoints.length : (Array.isArray(saved.pathCoordinates) ? saved.pathCoordinates.length : 0);
    } catch (_) { return -1; }
}
function captureGpsIntegrity() {
    return {
        rawCount:Array.isArray(rawGpsPoints) ? rawGpsPoints.length : -1,
        displayCount:Array.isArray(pathCoordinates) ? pathCoordinates.length : -1,
        distance:Number(totalDistance) || 0,
        persistedCount:getPersistedGpsPointCount()
    };
}
function logGpsLayerChange(stage, snapshot) {
    var current = captureGpsIntegrity();
    if (GILOA_DEBUG) console.log("GPS " + stage, current.displayCount, current.distance, {
        rawPoints:current.rawCount,
        persistedPoints:current.persistedCount
    });
    if (snapshot && (current.rawCount !== snapshot.rawCount || current.displayCount !== snapshot.displayCount || current.persistedCount !== snapshot.persistedCount)) {
        console.error("[GILOA GPS INTEGRITY] Place-layer update changed GPS data", { before:snapshot, after:current });
    }
    return current;
}
function refreshGpsVisualsAfterPlaceLayerChange(label, before) {
    logGpsLayerChange("AFTER " + label, before);
    // Place markers live in independent Leaflet groups. Repaint every GPS
    // canvas from the persisted in-memory source after their DOM work ends.
    scheduleRender();
    setTimeout(scheduleRender, 0);
}
function render() {
    syncCanvasPosition();
    var mapWrap = document.getElementById("map-wrap");
    if (mapWrap) mapWrap.classList.toggle("fog-disabled", !isFogEnabled);
    renderFog();
    renderColorReveal();
    renderFogShade();
    renderTransportPaths();
    renderStayTint();
}
function calcMpp() { var center = map.getCenter(); var pt = map.latLngToContainerPoint(center); var ll2 = map.containerPointToLatLng(L.point(pt.x + 10, pt.y)); var mpp = center.distanceTo(ll2) / 10; return isFinite(mpp) && mpp > 0 ? mpp : 1; }
function metersToPixels(meters, mpp) { return meters / Math.max(mpp || 1, 0.01); }

function renderColorReveal() {
    var w = colorRevealCanvas.width, h = colorRevealCanvas.height;
    colorRevealCtx.clearRect(0, 0, w, h);
    if (!isFogEnabled || !w || !h) return;
    var mapElement = map.getContainer();
    var mapRect = mapElement.getBoundingClientRect();
    var tilePane = map.getPane("tilePane");
    var tiles = tilePane ? tilePane.querySelectorAll("img.leaflet-tile-loaded") : [];
    colorRevealCtx.save();
    colorRevealCtx.globalCompositeOperation = "source-over";
    colorRevealCtx.imageSmoothingEnabled = true;
    for (var tileIndex = 0; tileIndex < tiles.length; tileIndex++) {
        var tile = tiles[tileIndex];
        if (!tile.naturalWidth || !tile.naturalHeight) continue;
        var rect = tile.getBoundingClientRect();
        var x = rect.left - mapRect.left;
        var y = rect.top - mapRect.top;
        if (x >= w || y >= h || x + rect.width <= 0 || y + rect.height <= 0) continue;
        try {
            colorRevealCtx.drawImage(tile, x, y, rect.width, rect.height);
        } catch (error) {
            if (!colorRevealDrawWarningShown) {
                console.warn("Color map reveal tile draw failed.", error);
                colorRevealDrawWarningShown = true;
            }
        }
    }
    colorRevealCtx.restore();

    // fogCanvas is an invisible opaque mask. Inverting it leaves only the
    // current-position circle and the GPS path available for the colour map.
    colorRevealMaskCtx.clearRect(0, 0, w, h);
    colorRevealMaskCtx.save();
    colorRevealMaskCtx.fillStyle = "#000";
    colorRevealMaskCtx.fillRect(0, 0, w, h);
    colorRevealMaskCtx.globalCompositeOperation = "destination-out";
    colorRevealMaskCtx.drawImage(fogCanvas, 0, 0);
    colorRevealMaskCtx.restore();
    colorRevealCtx.save();
    colorRevealCtx.globalCompositeOperation = "destination-in";
    colorRevealCtx.drawImage(colorRevealMaskCanvas, 0, 0);
    colorRevealCtx.restore();
}

function renderFogShade() {
    var w = fogShadeCanvas.width, h = fogShadeCanvas.height;
    fogShadeCtx.clearRect(0, 0, w, h);
    if (!isFogEnabled || !w || !h) return;
    fogShadeCtx.save();
    fogShadeCtx.fillStyle = "rgba(8, 10, 18, " + getFogAlpha() + ")";
    fogShadeCtx.fillRect(0, 0, w, h);
    fogShadeCtx.globalCompositeOperation = "destination-in";
    fogShadeCtx.drawImage(fogCanvas, 0, 0);
    fogShadeCtx.restore();
}

function renderVisionFogClear(pos, mpp) {
    if (playerHeading === null) return;
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
    fogCtx.fillStyle = "#000";
    fogCtx.fillRect(0, 0, w, h);
    // Read back the rendered marker position when available so the visible
    // current-location dot and the clear area always use the same coordinates.
    var fogPosition = playerMarker && typeof playerMarker.getLatLng === "function" ? playerMarker.getLatLng() : currentPos;
    if (fogPosition) {
        var mpp = calcMpp();
        var pos = latLngToCanvasPoint(fogPosition);
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
                if (shouldConnectStoredPathPoints(pathCoordinates[idx - 1], point)) {
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

// Display-only estimates: never write inferred travel modes into saved GPS records.
function getTransportSegmentStyle(fromPoint, toPoint, now) {
    if (!fromPoint || !toPoint) return null;
    var fromSession = String(fromPoint.recordingSessionId || "");
    var toSession = String(toPoint.recordingSessionId || "");
    if (fromSession && toSession && fromSession !== toSession) return null;
    var coordinates = [fromPoint.lat, fromPoint.lng, toPoint.lat, toPoint.lng];
    if (coordinates.some(function(value) { return value == null || !isFinite(Number(value)); })) return null;
    if (Math.abs(Number(fromPoint.lat)) > 90 || Math.abs(Number(toPoint.lat)) > 90 || Math.abs(Number(fromPoint.lng)) > 180 || Math.abs(Number(toPoint.lng)) > 180) return null;
    if ([fromPoint, toPoint].some(function(point) { return point.accuracy != null && (!isFinite(Number(point.accuracy)) || Number(point.accuracy) < 0 || Number(point.accuracy) > MAX_ACCURACY_M); })) return null;
    var fromTime = Number(fromPoint.timestamp || fromPoint.startTime);
    var toTime = Number(toPoint.timestamp || toPoint.startTime);
    var elapsedMs = toTime - fromTime;
    if (!isFinite(fromTime) || !isFinite(toTime) || fromTime <= 0 || elapsedMs <= 0 || elapsedMs > PATH_MAX_FIX_GAP_MS) return null;
    var distance = L.latLng(Number(fromPoint.lat), Number(fromPoint.lng)).distanceTo([Number(toPoint.lat), Number(toPoint.lng)]);
    var speed = distance / (elapsedMs / 1000);
    // Retain the existing gap/session rules without treating ordinary vehicle speeds as GPS jumps.
    if (!isFinite(speed) || speed > 250 / 3.6) return null;
    var mode = speed <= SPEED_LIMIT_WALK ? "walk" : speed <= SPEED_LIMIT_BIKE ? "bike" : "vehicle";
    var color = mode === "walk" ? "#43C98B" : mode === "bike" ? "#FFB454" : "#64A8FF";
    return { mode:mode, color:color, opacity:getPathVisibility(Math.max(0, (now - toTime) / 3600000)), timestamp:toTime };
}
function renderTransportPaths() {
    var w = ageCanvas.width, h = ageCanvas.height;
    ageCtx.clearRect(0, 0, w, h);
    if (!pathCoordinates.length) return;
    var now = Date.now(), mpp = calcMpp();
    var radius = metersToPixels(FOG_RADIUS_M, mpp);
    var buckets = new Map();
    function bucketFor(style) {
        var key = style.color + ":" + (Math.round(style.opacity * 100) / 100);
        if (!buckets.has(key)) buckets.set(key, { style:style, segments:[], points:[] });
        return buckets.get(key);
    }
    for (var i = 0; i < pathCoordinates.length; i++) {
        var point = pathCoordinates[i];
        var style = i > 0 ? getTransportSegmentStyle(pathCoordinates[i - 1], point, now) : null;
        if (style) bucketFor(style).segments.push([pathCoordinates[i - 1], point]);
        var pointStyle = style || (i + 1 < pathCoordinates.length ? getTransportSegmentStyle(point, pathCoordinates[i + 1], now) : null);
        var pointTime = Number(point.timestamp || point.startTime);
        if (!pointStyle) pointStyle = { color:"#43C98B" };
        bucketFor({ color:pointStyle.color, opacity:getPathVisibility(Math.max(0, (now - pointTime) / 3600000)) }).points.push(point);
    }
    var offCtx = ageScratchCtx;
    ageCtx.save();
    buckets.forEach(function(bucket) {
        // Paint the union opaquely first: repeated fixes in one bucket must
        // not accumulate opacity. Only the finished ribbon is faded.
        offCtx.clearRect(0, 0, w, h);
        offCtx.strokeStyle = bucket.style.color;
        offCtx.fillStyle = bucket.style.color;
        offCtx.lineWidth = radius * 2.2;
        offCtx.lineCap = "round";
        offCtx.lineJoin = "round";
        offCtx.setLineDash([]);
        offCtx.beginPath();
        bucket.segments.forEach(function(segment) {
            var from = latLngToCanvasPoint([segment[0].lat, segment[0].lng]);
            var to = latLngToCanvasPoint([segment[1].lat, segment[1].lng]);
            offCtx.moveTo(from.x, from.y);
            offCtx.lineTo(to.x, to.y);
        });
        offCtx.stroke();
        bucket.points.forEach(function(point) {
            var pos = latLngToCanvasPoint([point.lat, point.lng]);
            var stayMin = (point.endTime - point.startTime) / 60000;
            var stayRadius = metersToPixels(getStayRadiusMeters(stayMin), mpp);
            offCtx.beginPath();
            offCtx.arc(pos.x, pos.y, stayRadius, 0, Math.PI * 2);
            offCtx.fill();
        });
        ageCtx.globalAlpha = 0.25 * bucket.style.opacity;
        ageCtx.drawImage(ageScratchCanvas, 0, 0);
    });
    ageCtx.restore();
}
// Refresh fading even when no new location or map movement arrives.
setInterval(function() { if (document.visibilityState === "visible") scheduleRender(); }, 60000);

function renderAgeTint() {
    var w = ageCanvas.width, h = ageCanvas.height; ageCtx.clearRect(0, 0, w, h);
    if (pathCoordinates.length === 0) return;
    var now = Date.now(); var mpp = calcMpp(); var radius = metersToPixels(FOG_RADIUS_M, mpp);
    var buckets = new Map();
    pathCoordinates.forEach(function(point, i) {
        var ageDays = (now - point.startTime) / 86400000; var color = getAgeColor(ageDays); if (!color) return;
        if (!buckets.has(color)) buckets.set(color, []); var pos = latLngToCanvasPoint([point.lat, point.lng]);
        if (i > 0 && shouldConnectStoredPathPoints(pathCoordinates[i - 1], point)) { var prev = latLngToCanvasPoint([pathCoordinates[i - 1].lat, pathCoordinates[i - 1].lng]); buckets.get(color).push({ x1: prev.x, y1: prev.y, x2: pos.x, y2: pos.y }); }
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
        // A stay is a radius, not a color overlay.  Keep the map and fog
        // readable by drawing only soft concentric rings (1x to 2x radius).
        var ratio = Math.max(0, Math.min(1, (stayMin - 10) / 170));
        var inner = radius * Math.max(.42, .66 - ratio * .18);
        stayCtx.save();
        stayCtx.strokeStyle = "rgba(79, 195, 247, " + (0.18 + ratio * 0.16).toFixed(2) + ")";
        stayCtx.lineWidth = Math.max(1.25, radius * .035);
        stayCtx.setLineDash([Math.max(3, radius * .13), Math.max(3, radius * .10)]);
        stayCtx.beginPath(); stayCtx.arc(pos.x, pos.y, inner, 0, Math.PI * 2); stayCtx.stroke();
        stayCtx.setLineDash([]);
        stayCtx.strokeStyle = "rgba(79, 195, 247, " + (0.28 + ratio * 0.20).toFixed(2) + ")";
        stayCtx.lineWidth = Math.max(1.5, radius * .045);
        stayCtx.beginPath(); stayCtx.arc(pos.x, pos.y, radius, 0, Math.PI * 2); stayCtx.stroke();
        stayCtx.restore();
    });
}

function getStayRadiusMeters(stayMin) { if (stayMin < 10) return FOG_RADIUS_M; if (stayMin >= 180) return FOG_RADIUS_M * 2.0; return FOG_RADIUS_M * (1.0 + (stayMin - 10) / (180 - 10)); }
function getPhotoMarkerSize() { var zoom = map.getZoom(); if (zoom >= MARKER_MAX_ZOOM) return MARKER_MAX_SIZE; if (zoom <= MARKER_MIN_ZOOM) return MARKER_MIN_SIZE; var ratio = (zoom - MARKER_MIN_ZOOM) / (MARKER_MAX_ZOOM - MARKER_MIN_ZOOM); return Math.round(MARKER_MIN_SIZE + ratio * (MARKER_MAX_SIZE - MARKER_MIN_SIZE)); }
function buildPhotoMarkerIcon(src, size, data) { var badges = data && (data.memo || data.missionId) ? '<span class="photo-memory-badge">' + (data.missionId ? "★" : "✎") + '</span>' : ""; return L.divIcon({ className: "photo-marker", html: '<span class="photo-polaroid"><img src="' + src + '" style="width:' + size + 'px;height:' + size + 'px;object-fit:cover;" />' + badges + '</span>', iconSize: [size, size], iconAnchor: [size / 2, size] }); }
function updatePhotoMarkerSizes() {
    var size = getPhotoMarkerSize();
    if (size === lastPhotoMarkerSize) return;
    lastPhotoMarkerSize = size;
    photoClusterGroup.eachLayer(function(marker) {
        if (marker._photoData) marker.setIcon(buildPhotoMarkerIcon(marker._photoData.thumb, size, marker._photoData));
    });
}

function calcLevel() {
    var state = loadRpgGrowth();
    return { level:getRpgLevel(getRpgTotal(state.stats)), title:getRpgTrait(state).name };
}

function updateHud() { updateRpgGrowthUI(loadRpgGrowth()); }


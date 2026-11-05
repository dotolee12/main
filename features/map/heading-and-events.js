var visionCone = null;
var visionLine = null;
function updateVisionCone(latlng) {
    if (visionCone) { map.removeLayer(visionCone); visionCone = null; }
    if (visionLine) { map.removeLayer(visionLine); visionLine = null; }
    // Position updates also request this repaint, so compare sensor jitter
    // against the latest requested direction rather than an older sensor value.
    deviceHeadingLastRendered = typeof playerHeading === "number" && isFinite(playerHeading) ? playerHeading : null;
    deviceHeadingLastRenderTime = performance.now();
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

// Independent, read-only facing UI. Do not feed this heading into playerHeading,
// updateVisionCone or renderVisionFogClear: those also affect photos and fog.
(function initGiloaViewConeUI() {
    "use strict";
    if (window.giloaViewConeUI) return;
    const VIEW_CONE_ANGLE = 70; // Degrees; adjustable independently of fog vision.
    const VIEW_CONE_DISTANCE_M = 90;
    const VIEW_CONE_MIN_PX = 24;
    const VIEW_CONE_MAX_PX = 135;
    const VIEW_CONE_FRAME_MS = 1000 / 15;
    const VIEW_CONE_SMOOTH_MS = 100;
    const VIEW_CONE_HEADING_TTL_MS = 10000;
    var coneMap, coneCanvas, viewConeLayer, observedMarker;
    // location-ready currently has no independent GPS course/speed. Do not use
    // the shared playerHeading or invent a bearing from noisy position deltas.
    var sample = null, displayedHeading = null, lastFrameTime = 0;
    var frameId = 0, frameTimer = 0, staleTimer = 0;
    var sensorAttached = false, disposed = false;
    var diagnosticError = null, displayIssue = null, lastHeadingAt = null, headingExpired = false;

    function getStatus() {
        var status, reason, hasLocation = false;
        var age = lastHeadingAt === null ? null : Math.max(0, performance.now() - lastHeadingAt);
        try { hasLocation = !!(coneMap && readMarkerPosition()); }
        catch (error) { return Object.freeze({ status: "error", reason: "marker-unavailable", visible: false }); }
        if (diagnosticError) { status = "error"; reason = diagnosticError; }
        else if (disposed) { status = "hidden"; reason = "disposed"; }
        else if (!coneMap || !window.L) { status = "unsupported"; reason = "map-unavailable"; }
        else if (!window.DeviceOrientationEvent) { status = "unsupported"; reason = "orientation-unavailable"; }
        else if (document.hidden) { status = "hidden"; reason = "document-hidden"; }
        else if (!hasLocation) { status = "waiting-location"; reason = "current-marker-unavailable"; }
        else if (headingExpired || (age !== null && age >= VIEW_CONE_HEADING_TTL_MS)) { status = "stale"; reason = "heading-expired"; }
        else if (!sample) { status = "waiting-heading"; reason = "absolute-heading-required"; }
        else if (displayIssue) { status = "error"; reason = displayIssue; }
        else if (!coneCanvas || coneCanvas.hidden || !viewConeLayer || !coneMap.hasLayer(viewConeLayer)) { status = "hidden"; reason = "awaiting-frame"; }
        else { status = "visible"; reason = "ready"; }
        return Object.freeze({
            status: status, reason: reason, visible: status === "visible",
            sensorSupported: !!window.DeviceOrientationEvent, sensorAttached: sensorAttached,
            permissionRequired: !!(window.DeviceOrientationEvent && typeof window.DeviceOrientationEvent.requestPermission === "function"),
            hasLocation: hasLocation, headingAgeMs: age
        });
    }

    function finiteNumber(value) {
        return typeof value === "number" && Number.isFinite(value);
    }
    function wrapAngle(value) { return (value % 360 + 360) % 360; }
    function shortestTurn(from, to) { return (to - from + 540) % 360 - 180; }
    function screenAngle() {
        var angle = window.screen && window.screen.orientation && window.screen.orientation.angle;
        return finiteNumber(angle) ? angle : (finiteNumber(window.orientation) ? window.orientation : 0);
    }
    function safely(fn) {
        return function() {
            if (disposed) return;
            try { return fn.apply(null, arguments); }
            catch (error) {
                diagnosticError = String(error && error.message || "facing-ui-error");
                dispose();
                console.warn("GILOA facing UI unavailable", error);
            }
        };
    }
    function clearPendingFrames() {
        if (frameId) cancelAnimationFrame(frameId);
        if (frameTimer) clearTimeout(frameTimer);
        frameId = frameTimer = 0;
    }
    function hideCone() {
        if (coneCanvas) coneCanvas.hidden = true;
        displayedHeading = null;
        lastFrameTime = 0;
        clearPendingFrames();
    }
    function readMarkerPosition() {
        if (!observedMarker || !coneMap.hasLayer(observedMarker)) return null;
        var point = observedMarker.getLatLng();
        return point && finiteNumber(point.lat) && finiteNumber(point.lng) ? point : null;
    }
    function makeConeCanvas() {
        var canvas = document.createElement("canvas");
        canvas.className = "giloa-view-cone";
        canvas.hidden = true;
        canvas.setAttribute("aria-hidden", "true");
        canvas.width = canvas.height = 384;
        var context = canvas.getContext("2d");
        if (!context) throw new Error("Facing canvas unavailable");
        var radius = canvas.width / 2;
        var gradient = context.createRadialGradient(radius, radius, 0, radius, radius, radius);
        gradient.addColorStop(0, "rgba(79,195,247,0.14)");
        gradient.addColorStop(0.5, "rgba(79,195,247,0.08)");
        gradient.addColorStop(0.82, "rgba(79,195,247,0.02)");
        gradient.addColorStop(1, "rgba(79,195,247,0)");
        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);
        // Feather both angular edges, not just the far edge. Build the small
        // bitmap once; sensor updates only rotate/position this canvas.
        var pixels = context.getImageData(0, 0, canvas.width, canvas.height);
        for (var y = 0; y < canvas.height; y++) {
            for (var x = 0; x < canvas.width; x++) {
                var angle = Math.abs(Math.atan2(x + 0.5 - radius, radius - y - 0.5) * 180 / Math.PI);
                var fade = Math.max(0, Math.min(1, (VIEW_CONE_ANGLE / 2 - angle) / 8));
                pixels.data[(y * canvas.width + x) * 4 + 3] *= fade * fade * (3 - 2 * fade);
            }
        }
        context.putImageData(pixels, 0, 0);
        return canvas;
    }
    function positionCone() {
        displayIssue = null;
        var point = readMarkerPosition();
        if (!point) { hideCone(); return false; }
        if (!coneCanvas) coneCanvas = makeConeCanvas();
        if (!viewConeLayer) {
            var pane = coneMap.getPane("viewConePane") || coneMap.createPane("viewConePane");
            pane.style.zIndex = "590"; // fog 450 < cone < default markers 600 / photos 630 / player 690
            pane.style.pointerEvents = "none";
            viewConeLayer = L.marker(point, {
                pane: "viewConePane", interactive: false, keyboard: false,
                icon: L.divIcon({ className: "giloa-view-cone-anchor", html: coneCanvas, iconSize: [0, 0], iconAnchor: [0, 0] })
            }).addTo(coneMap);
        } else {
            viewConeLayer.setLatLng(point);
        }
        var center = coneMap.latLngToContainerPoint(point);
        var next = coneMap.containerPointToLatLng(L.point(center.x + 1, center.y));
        var metersPerPixel = coneMap.distance(point, next);
        if (!finiteNumber(metersPerPixel) || metersPerPixel <= 0) { displayIssue = "invalid-map-scale"; hideCone(); return false; }
        var radius = Math.max(VIEW_CONE_MIN_PX, Math.min(VIEW_CONE_MAX_PX, VIEW_CONE_DISTANCE_M / metersPerPixel));
        coneCanvas.style.width = coneCanvas.style.height = (radius * 2) + "px";
        coneCanvas.style.left = coneCanvas.style.top = (-radius) + "px";
        return true;
    }
    function queueFrame() {
        if (disposed || document.hidden || frameId || frameTimer) return;
        var delay = Math.max(0, VIEW_CONE_FRAME_MS - (performance.now() - lastFrameTime));
        frameTimer = setTimeout(safely(function() {
            frameTimer = 0;
            frameId = requestAnimationFrame(drawFrame);
        }), delay);
    }
    var drawFrame = safely(function(time) {
        frameId = 0;
        if (document.hidden || !sample || performance.now() - sample.time > VIEW_CONE_HEADING_TTL_MS || !readMarkerPosition()) {
            hideCone(); return;
        }
        if (!coneCanvas || !viewConeLayer || displayIssue) { if (!positionCone()) return; }
        var delta = displayedHeading === null ? 0 : shortestTurn(wrapAngle(displayedHeading), sample.heading);
        if (displayedHeading === null) displayedHeading = sample.heading;
        else {
            var elapsed = Math.max(1, time - lastFrameTime);
            displayedHeading += delta * (1 - Math.exp(-elapsed / VIEW_CONE_SMOOTH_MS));
            if (Math.abs(delta) < 0.15) displayedHeading += shortestTurn(wrapAngle(displayedHeading), sample.heading);
        }
        lastFrameTime = time;
        coneCanvas.style.transform = "rotate(" + displayedHeading + "deg)";
        coneCanvas.hidden = false;
        if (Math.abs(shortestTurn(wrapAngle(displayedHeading), sample.heading)) >= 0.15) queueFrame();
    });
    var expireHeading = safely(function() {
        staleTimer = 0;
        if (!sample || document.hidden) return;
        var remaining = VIEW_CONE_HEADING_TTL_MS - (performance.now() - sample.time);
        if (remaining > 0) staleTimer = setTimeout(expireHeading, remaining + 1);
        else { headingExpired = true; sample = null; hideCone(); }
    });
    var onHeading = safely(function(event) {
        if (document.hidden) return;
        var heading;
        if (finiteNumber(event.webkitCompassHeading)) {
            if (finiteNumber(event.webkitCompassAccuracy) && (event.webkitCompassAccuracy < 0 || event.webkitCompassAccuracy > 50)) return;
            heading = event.webkitCompassHeading + screenAngle();
        } else if ((event.absolute === true || event.type === "deviceorientationabsolute") && finiteNumber(event.alpha)) {
            heading = 360 - event.alpha + screenAngle();
        } else return; // Relative alpha, null and NaN are not a north heading.
        sample = { heading: wrapAngle(heading), time: performance.now() };
        lastHeadingAt = sample.time;
        headingExpired = false;
        if (!staleTimer) staleTimer = setTimeout(expireHeading, VIEW_CONE_HEADING_TTL_MS + 1);
        queueFrame();
    });
    function attachSensor() {
        if (sensorAttached || document.hidden || !window.DeviceOrientationEvent) return;
        // Listening itself never prompts. iOS permission is already requested
        // by the existing recording-button flow; do not request it a second time.
        window.addEventListener("deviceorientationabsolute", onHeading, { passive: true });
        window.addEventListener("deviceorientation", onHeading, { passive: true });
        sensorAttached = true;
    }
    function detachSensor() {
        window.removeEventListener("deviceorientationabsolute", onHeading);
        window.removeEventListener("deviceorientation", onHeading);
        sensorAttached = false;
    }
    var onMarkerMove = safely(function() {
        if (document.hidden) return;
        if (positionCone()) queueFrame();
    });
    var onLocationReady = safely(function() {
        var marker = typeof playerMarker !== "undefined" ? playerMarker : null;
        if (marker !== observedMarker) {
            if (observedMarker) observedMarker.off("move add remove", onMarkerMove);
            observedMarker = marker;
            if (observedMarker) observedMarker.on("move add remove", onMarkerMove);
        }
        onMarkerMove();
    });
    var onResume = safely(function() {
        sample = null;
        lastHeadingAt = null;
        headingExpired = false;
        if (staleTimer) clearTimeout(staleTimer);
        staleTimer = 0;
        hideCone();
        if (document.hidden) detachSensor();
        else { attachSensor(); onLocationReady(); } // Wait for a fresh sensor reading.
    });
    function dispose() {
        if (disposed) return;
        disposed = true;
        // Only this UI's listeners/timers/layer are removed. Never touch GPS.
        try {
            hideCone();
            if (staleTimer) clearTimeout(staleTimer);
            detachSensor();
            if (observedMarker) observedMarker.off("move add remove", onMarkerMove);
            if (coneMap) {
                coneMap.off("zoomend resize", onMarkerMove);
                coneMap.off("unload", dispose);
                if (viewConeLayer) coneMap.removeLayer(viewConeLayer);
            }
            window.removeEventListener("giloa:location-ready", onLocationReady);
            window.removeEventListener("giloa:app-resume", onResume);
            window.removeEventListener("orientationchange", onResume);
            window.removeEventListener("pageshow", onResume);
            document.removeEventListener("visibilitychange", onResume);
        } catch (_) { /* A display failure must never escape into the app. */ }
    }
    try {
        coneMap = typeof map !== "undefined" ? map : null;
        window.giloaViewConeUI = { dispose: dispose, getStatus: getStatus };
        if (!coneMap || !window.L) return;
        coneMap.on("zoomend resize", onMarkerMove);
        coneMap.on("unload", dispose);
        window.addEventListener("giloa:location-ready", onLocationReady);
        window.addEventListener("giloa:app-resume", onResume);
        window.addEventListener("orientationchange", onResume);
        window.addEventListener("pageshow", onResume);
        document.addEventListener("visibilitychange", onResume);
        attachSensor();
        onLocationReady();
    } catch (error) {
        diagnosticError = String(error && error.message || "facing-ui-initialization-error");
        dispose();
        console.warn("GILOA facing UI initialization skipped", error);
    }
})();

// Supplemental static copy. Keep text nodes separate from icons, controls and stored content.

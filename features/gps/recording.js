function canUseScreenWakeLock() { return !!(navigator.wakeLock && typeof navigator.wakeLock.request === "function"); }
function requestNativeScreenAwake() { try { if (window.GiloaScreenAwake && typeof window.GiloaScreenAwake.keepScreenOnFor === "function") window.GiloaScreenAwake.keepScreenOnFor(SCREEN_AWAKE_MS); } catch (e) { console.warn("네이티브 화면 켜짐 유지 실패", e); } }
function releaseNativeScreenAwake() { try { if (window.GiloaScreenAwake && typeof window.GiloaScreenAwake.clearKeepScreenOn === "function") window.GiloaScreenAwake.clearKeepScreenOn(); } catch (e) { console.warn("네이티브 화면 켜짐 유지 해제 실패", e); } }
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
    if (lock && !lock.released) lock.release().catch(function(e) { console.warn("화면 켜짐 유지 해제 실패", e); });
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
    var endAt = (Number(recordingSessionStartedAt) || Date.now()) + AUTO_RECORDING_MS;
    try {
        var native = getNativeRouteTrackingBridge();
        if (native && typeof native.getRouteTrackingStopAt === "function" && typeof native.getRouteTrackingSessionId === "function" && native.getRouteTrackingSessionId() === recordingSessionId) {
            var nativeEndAt = Number(native.getRouteTrackingStopAt());
            if (isFinite(nativeEndAt) && nativeEndAt > 0) endAt = nativeEndAt;
        }
    } catch (_) { }
    autoRecordingTimer = setTimeout(function() {
        autoRecordingTimer = null;
        if (isRecording) stopRecording();
    }, Math.max(0, endAt - Date.now()));
}
function createRecordingSessionId(startedAt) {
    return "session:" + Number(startedAt || Date.now()) + ":" + Math.random().toString(36).slice(2, 10);
}
function ensureRecordingSession() {
    if (!recordingSessionId) {
        recordingSessionStartedAt = Date.now();
        recordingSessionId = createRecordingSessionId(recordingSessionStartedAt);
    }
    return recordingSessionId;
}
function stopRecording() {
    isRecording = false;
    clearAutoRecordingTimer();
    clearTrackingRetryTimer();
    releaseScreenAwake();
    syncRecordingUI();
    stopTracking();
    recordingSessionId = null;
    recordingSessionStartedAt = 0;
    compactPathData();
    scheduleSave();
}
function resetRecordingState() { stopRecording(); }
// 현재 위치 재동기화
// 예전에는 currentPos 가 한 번이라도 잡히면 그 값으로 panTo 만 하고 끝났다.
// 그래서 처음 들어온 부정확한 좌표(Wi-Fi/기지국 기반)가 계속 남아 실제 위치와
// 어긋난 채 고정됐다. 이제 버튼을 누를 때마다 새 측위를 강제로 다시 받는다.
const POSITION_STALE_MS = 30000;      // 이 시간이 지난 좌표는 정확도와 무관하게 교체
const POSITION_WORSE_FACTOR = 3;      // 기존 대비 3배 넘게 나빠지면 무시
const POSITION_WORSE_FLOOR_M = 100;   // 단, 100m 이내면 그냥 받아들인다
const RESYNC_TARGET_ACCURACY_M = 20;  // 이 정확도에 도달하면 즉시 종료
const RESYNC_DURATION_MS = 9000;      // 최대 대기 시간

function shouldIgnorePositionSample(accuracy, timestamp) {
    if (!currentPos || !isFinite(currentAccuracy)) return false;
    if (timestamp - currentPositionTimestamp > POSITION_STALE_MS) return false;
    if (accuracy <= POSITION_WORSE_FLOOR_M) return false;
    return accuracy > currentAccuracy * POSITION_WORSE_FACTOR;
}


function showLocationToast(message, holdMs) {
    var toast = document.getElementById("giloa-location-toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "giloa-location-toast";
        toast.className = "giloa-location-toast";
        document.body.appendChild(toast);
    }
    if (toast._hideTimer) { clearTimeout(toast._hideTimer); toast._hideTimer = null; }
    if (!message) { toast.classList.remove("show"); return; }
    toast.textContent = message;
    toast.classList.add("show");
    if (holdMs) toast._hideTimer = setTimeout(function() { toast.classList.remove("show"); toast._hideTimer = null; }, holdMs);
}

// 한 번의 getCurrentPosition 은 캐시된 거친 좌표를 돌려주는 일이 잦다.
// 몇 초간 표본을 모아 가장 정확한 것을 고른다.
function acquireBestPosition(options) {
    options = options || {};
    var durationMs = options.durationMs || RESYNC_DURATION_MS;
    var target = options.targetAccuracy || RESYNC_TARGET_ACCURACY_M;
    return new Promise(function(resolve, reject) {
        if (!navigator.geolocation) { reject(new Error("Geolocation unavailable")); return; }
        var best = null, watch = null, timer = null, settled = false;
        function accuracyOf(position) { return Number(position && position.coords && position.coords.accuracy) || Infinity; }
        function finish(error) {
            if (settled) return;
            settled = true;
            if (timer) clearTimeout(timer);
            if (watch !== null) { try { navigator.geolocation.clearWatch(watch); } catch (e) {} }
            if (best) resolve(best); else reject(error || new Error("No position fix"));
        }
        function onSample(position) {
            if (settled) return;
            if (accuracyOf(position) >= accuracyOf(best)) return;
            best = position;
            if (typeof options.onImproved === "function") options.onImproved(position);
            if (accuracyOf(position) <= target) finish();
        }
        timer = setTimeout(function() { finish(); }, durationMs);
        try {
            watch = navigator.geolocation.watchPosition(onSample, function(error) { if (!best) finish(error); }, { enableHighAccuracy: true, maximumAge: 0, timeout: durationMs });
        } catch (e) { /* 워치가 실패해도 아래 단발 호출로 시도한다 */ }
        navigator.geolocation.getCurrentPosition(onSample, function(error) { if (!best && watch === null) finish(error); }, { enableHighAccuracy: true, maximumAge: 0, timeout: durationMs });
    });
}

var locationResyncPending = false;
var locationResyncPromise = null;
var startupLocationRequested = false;
function focusStartupLocation(options) {
    options = options || {};
    // Restore saved journeys first; explicit startup consent may precede the intro.
    // This is a one-time map lookup per launch; recording keeps its own consent flow.
    if (startupLocationRequested || !giloaPersistentStateReady ||
        (!options.beforeIntro && (!hasSavedIntroLanguage() || safeStorageGet(INTRO_STORY_SEEN_KEY) !== "true"))) {
        return Promise.resolve(false);
    }
    startupLocationRequested = true;
    return Promise.resolve().then(function() {
        return window.GiloaPrivacy ? window.GiloaPrivacy.requestLocationConsent() : false;
    }).then(function(consented) {
        if (!consented) return false;
        return Promise.resolve(requestLocationPermission()).then(function() { return focusCurrentLocation(); });
    }).catch(function() {
        showLocationToast(earlyUiText("locationFailed"), 4000);
        return false;
    });
}
function getDisplayedCurrentPosition() {
    if (playerMarker && typeof playerMarker.getLatLng === "function") return playerMarker.getLatLng();
    return currentPos;
}
function hasValidCurrentLocation() {
    var position = getDisplayedCurrentPosition();
    if (!position) return false;
    var lat = Number(position.lat);
    var lng = Number(position.lng);
    return isFinite(lat) && isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 && !(lat === 0 && lng === 0);
}
window.hasValidCurrentLocation = hasValidCurrentLocation;
function focusCurrentLocation() {
    var displayedPosition = getDisplayedCurrentPosition();
    if (displayedPosition) map.panTo(displayedPosition); // 먼저 반응부터 보여준다
    if (!navigator.geolocation) return Promise.resolve(false);
    // Startup, the location button and tutorial must await the same GPS result.
    if (locationResyncPending) return locationResyncPromise;
    locationResyncPending = true;
    showLocationToast(earlyUiText("locating"));
    locationResyncPromise = acquireBestPosition({
        onImproved: function(position) {
            handlePosition(position, { force: true });   // 더 정확한 값이 올 때마다 마커를 옮긴다
            var improvedPosition = getDisplayedCurrentPosition();
            if (improvedPosition) map.panTo(improvedPosition, { animate: true });
        }
    }).then(function(position) {
        handlePosition(position, { force: true });
        var accuracy = Math.round(Number(position.coords.accuracy) || 0);
        var finalPosition = getDisplayedCurrentPosition();
        if (finalPosition) map.setView(finalPosition, Math.max(map.getZoom(), 16));
        if (accuracy > POSITION_WORSE_FLOOR_M) showLocationToast(earlyUiText("locationImprecise", { accuracy:accuracy }), 5000);
        else showLocationToast(earlyUiText("locationUpdated", { accuracy:accuracy }), 2200);
        return true;
    }).catch(function(error) {
        showLocationToast(earlyUiText("locationFailed"), 4000);
        if (typeof window.onGiloaTutorialLocationError === "function") window.onGiloaTutorialLocationError(error);
        return false;
    }).then(function(result) {
        locationResyncPending = false;
        locationResyncPromise = null;
        if (trackingRequested || isRecording) startForegroundTracking();   // 워치를 새로 걸어 캐시된 좌표를 버린다
        return result;
    });
    return locationResyncPromise;
}
function normalizeHeading(value) { return (Number(value) % 360 + 360) % 360; }
function screenOrientationAngle() {
    if (screen.orientation && isFinite(screen.orientation.angle)) return Number(screen.orientation.angle);
    return isFinite(window.orientation) ? Number(window.orientation) : 0;
}
var deviceHeadingRenderTimer = null;
var deviceHeadingLastRenderTime = -Infinity;
var deviceHeadingLastRendered = null;
function renderDeviceHeading() {
    deviceHeadingRenderTimer = null;
    if (!currentPos || typeof playerHeading !== "number" || !isFinite(playerHeading)) return;
    if (deviceHeadingLastRendered !== null && Math.abs((playerHeading - deviceHeadingLastRendered + 540) % 360 - 180) < 1) return;
    updateVisionCone(currentPos);
}
function handleDeviceHeading(event) {
    var heading = event && typeof event.webkitCompassHeading === "number" ? event.webkitCompassHeading : NaN;
    if (!isFinite(heading) && event && event.absolute && typeof event.alpha === "number" && isFinite(event.alpha)) {
        heading = 360 - Number(event.alpha) + screenOrientationAngle();
    }
    if (!isFinite(heading)) return;
    playerHeading = normalizeHeading(heading);
    // Keep the shared heading current for photos; only throttle fog repainting.
    if (!currentPos || deviceHeadingRenderTimer !== null) return;
    if (deviceHeadingLastRendered !== null && Math.abs((playerHeading - deviceHeadingLastRendered + 540) % 360 - 180) < 1) return;
    var delay = 80 - (performance.now() - deviceHeadingLastRenderTime);
    if (delay <= 0) renderDeviceHeading();
    else deviceHeadingRenderTimer = setTimeout(renderDeviceHeading, delay);
}
function enableDeviceHeading() {
    var orientation = window.DeviceOrientationEvent;
    if (!orientation) return Promise.resolve(false);
    var attach = function() {
        window.removeEventListener("deviceorientationabsolute", handleDeviceHeading, true);
        window.removeEventListener("deviceorientation", handleDeviceHeading, true);
        window.addEventListener("deviceorientationabsolute", handleDeviceHeading, true);
        window.addEventListener("deviceorientation", handleDeviceHeading, true);
        return true;
    };
    if (typeof orientation.requestPermission !== "function") return Promise.resolve(attach());
    return orientation.requestPermission().then(function(result) { return result === "granted" ? attach() : false; }).catch(function() { return false; });
}
function toggleRecording() {
    if (!giloaPersistentStateReady) {
        pendingRecordingStartAfterRestore = true;

        showLocationToast(
            earlyUiText("restoringBeforeRecord"),
            1800
        );

        return;
    }

    pendingRecordingStartAfterRestore = false;
    if (isRecording) { stopRecording(); return; }
    focusCurrentLocation();
    ensureRecordingSession();
    isRecording = true;
    enableDeviceHeading();
    requestScreenAwake();
    startAutoRecordingTimer();
    syncRecordingUI();
    startTracking();
    scheduleSave();

window.dispatchEvent(
    new Event("giloa:recording-started")
);
}
function dismissAutoRecordingNotice() {
    var overlay =
        document.getElementById("auto-recording-notice");

    if (!overlay) {
        return;
    }

    overlay.classList.remove("show");
    overlay.setAttribute("aria-hidden", "true");
}
var LOCATION_RECORDING_DISCLOSURE_TEXT = {
    ko: {
        title: "위치 기록을 시작할까요?",
        copy: "길로아는 사용자가 걸은 길을 지도에 기록하기 위해 위치정보를 사용합니다.",
        background: "기록을 시작하면 화면이 꺼지거나 다른 앱을 사용하는 동안에도 최대 8시간 동안 위치정보가 계속 기록됩니다.",
        privacy: "위치 기록은 먼저 이 기기에 저장됩니다. 사용자가 로그인한 경우에만 본인 전용 서버 공간에 동기화되며 제3자와 공유되지 않습니다. 오른쪽 아래 기록 버튼이나 Android 알림에서 언제든지 기록을 중단할 수 있습니다.",
        start: "8시간 기록 시작",
        cancel: "나중에"
    },

    en: {
        title: "Start location recording?",
        copy: "GILOA uses your location to save the path you walk on your map.",
        background: "After you start recording, your location will continue to be recorded for up to 8 hours while the screen is off or while you use another app.",
        privacy: "Location records are saved on this device first. Only signed-in users sync them to their private server space; they are not shared with third parties. You can stop recording at any time using the record button or the Android notification.",
        start: "Start 8-hour recording",
        cancel: "Not now"
    },

    ja: {
        title: "位置記録を開始しますか？",
        copy: "GILOAは、歩いた道を地図に記録するために位置情報を使用します。",
        background: "記録を開始すると、画面が消えている間や他のアプリを使用している間も、最大8時間位置情報の記録が続きます。",
        privacy: "位置記録はまずこの端末に保存されます。ログインした場合のみ本人専用のサーバー領域へ同期され、第三者には共有されません。記録ボタンまたはAndroid通知からいつでも停止できます。",
        start: "8時間の記録を開始",
        cancel: "後で"
    },

    zh: {
        title: "开始记录位置吗？",
        copy: "GILOA使用你的位置信息，在地图上记录你走过的路线。",
        background: "开始记录后，即使屏幕关闭或正在使用其他应用，位置信息也会继续记录，最长为8小时。",
        privacy: "位置记录会先保存在此设备。仅在用户登录后同步到其个人服务器空间，不会与第三方共享。你可以随时通过记录按钮或 Android 通知停止记录。",
        start: "开始8小时记录",
        cancel: "暂不"
    },

    es: {
        title: "¿Quieres iniciar el registro de ubicación?",
        copy: "GILOA utiliza tu ubicación para guardar en el mapa el camino que recorres.",
        background: "Después de iniciar el registro, tu ubicación continuará registrándose durante un máximo de 8 horas aunque la pantalla esté apagada o utilices otra aplicación.",
        privacy: "Los registros se guardan primero en este dispositivo. Solo se sincronizan con el espacio privado del usuario cuando inicia sesión y no se comparten con terceros. Puedes detener el registro en cualquier momento.",
        start: "Iniciar registro de 8 horas",
        cancel: "Ahora no"
    },

    fr: {
        title: "Démarrer l’enregistrement de la position ?",
        copy: "GILOA utilise votre position pour enregistrer sur la carte le chemin que vous parcourez.",
        background: "Après le démarrage, votre position continuera à être enregistrée pendant 8 heures maximum, même lorsque l’écran est éteint ou que vous utilisez une autre application.",
        privacy: "Les données sont d’abord enregistrées sur cet appareil. Elles ne sont synchronisées avec l’espace serveur privé qu’après connexion et ne sont pas partagées avec des tiers. Vous pouvez arrêter l’enregistrement à tout moment.",
        start: "Démarrer l’enregistrement de 8 heures",
        cancel: "Plus tard"
    }
};
// Keep the recording disclosure consistent with the paused-sync policy.
Object.keys(LOCATION_RECORDING_DISCLOSURE_TEXT).forEach(function(lang) {
    if (!window.GiloaPrivacy) return;
    var notice = window.GiloaPrivacy.recordingText(lang);
    LOCATION_RECORDING_DISCLOSURE_TEXT[lang].copy = notice[0];
    LOCATION_RECORDING_DISCLOSURE_TEXT[lang].privacy = notice[1];
    LOCATION_RECORDING_DISCLOSURE_TEXT[lang].start = notice[2];
});
function startRecordingAfterDisclosure() {
    dismissAutoRecordingNotice();

    Promise.resolve(requestLocationPermission())
        .then(function() {
            if (!isRecording) {
                toggleRecording();
            }
        })
        .catch(function(error) {
            console.warn(
                "Location permission request failed",
                error
            );

            showLocationToast(
                earlyUiText("locationPermission"),
                3500
            );
        });
}
function applyAutoRecordingNoticeLang() {
    var overlay =
        document.getElementById("auto-recording-notice");

    if (!overlay) {
        return;
    }

    var text =
        LOCATION_RECORDING_DISCLOSURE_TEXT[currentLang] ||
        LOCATION_RECORDING_DISCLOSURE_TEXT.ko;

    var box =
        overlay.querySelector(".auto-recording-box");

    var closeButton =
        overlay.querySelector(".auto-recording-close");

    var title =
        overlay.querySelector(".auto-recording-title");

    var copy =
        overlay.querySelector(".auto-recording-copy");

    var background =
        overlay.querySelector(".auto-recording-background");

    var privacy =
        overlay.querySelector(".auto-recording-privacy");

    var startButton =
        overlay.querySelector(".auto-recording-start");

    var cancelButton =
        overlay.querySelector(".auto-recording-cancel");

    if (box) {
        box.setAttribute("aria-label", text.title);
    }

    if (closeButton) {
        closeButton.setAttribute(
            "aria-label",
            text.cancel
        );
    }

    if (title) {
        title.textContent = text.title;
    }

    if (copy) {
        copy.textContent = text.copy;
    }

    if (background) {
        background.textContent = text.background;
    }

    if (privacy) {
        privacy.textContent = text.privacy;
    }

    if (startButton) {
        startButton.textContent = text.start;
    }

    if (cancelButton) {
        cancelButton.textContent = text.cancel;
    }
}
function showAutoRecordingNotice() {
    var overlay =
        document.getElementById("auto-recording-notice");

    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "auto-recording-notice";
        overlay.setAttribute("aria-hidden", "true");

        var box = document.createElement("div");
        box.className = "auto-recording-box";
        box.setAttribute("role", "dialog");
        box.setAttribute("aria-modal", "true");

        var closeButton = document.createElement("button");
        closeButton.className = "auto-recording-close";
        closeButton.type = "button";
        closeButton.textContent = "\u00d7";

        var title = document.createElement("div");
        title.className = "auto-recording-title";

        var copy = document.createElement("p");
        copy.className = "auto-recording-copy";

        var background = document.createElement("p");
        background.className = "auto-recording-background";

        var privacy = document.createElement("p");
        privacy.className = "auto-recording-privacy";

        var actions = document.createElement("div");
        actions.className = "auto-recording-actions";

        var cancelButton = document.createElement("button");
        cancelButton.className =
            "auto-recording-action auto-recording-cancel";
        cancelButton.type = "button";

        var startButton = document.createElement("button");
        startButton.className =
            "auto-recording-action auto-recording-start";
        startButton.type = "button";

        actions.appendChild(cancelButton);
        actions.appendChild(startButton);

        box.appendChild(closeButton);
        box.appendChild(title);
        box.appendChild(copy);
        box.appendChild(background);
        box.appendChild(privacy);
        box.appendChild(actions);

        overlay.appendChild(box);
        document.body.appendChild(overlay);

        overlay.addEventListener("click", function(event) {
            if (event.target === overlay) {
                dismissAutoRecordingNotice();
            }
        });

        closeButton.addEventListener(
            "click",
            dismissAutoRecordingNotice
        );

        cancelButton.addEventListener(
            "click",
            dismissAutoRecordingNotice
        );

        startButton.addEventListener(
            "click",
            startRecordingAfterDisclosure
        );
    }

    applyAutoRecordingNoticeLang();

    overlay.classList.add("show");
    overlay.setAttribute("aria-hidden", "false");

    var startButton =
        overlay.querySelector(".auto-recording-start");

    if (startButton) {
        setTimeout(function() {
            startButton.focus();
        }, 0);
    }
}

function toggleFog() { isFogEnabled = !isFogEnabled; safeStorageSet(FOG_ENABLED_KEY, String(isFogEnabled)); syncFogButton(); scheduleRender(); }
function getBackgroundGeolocationPlugin() {
    return window.Capacitor && window.Capacitor.Plugins ? window.Capacitor.Plugins.BackgroundGeolocation : null;
}
function getNativeRouteTrackingBridge() {
    return window.GiloaPhotoBridge && typeof window.GiloaPhotoBridge.startRouteTracking === "function" ? window.GiloaPhotoBridge : null;
}
function isNativeRouteTrackingAvailable() { return !!getNativeRouteTrackingBridge(); }
function isNativeRouteTrackingActive() {
    var bridge = getNativeRouteTrackingBridge();
    if (!bridge || typeof bridge.isRouteTrackingActive !== "function") return false;
    try { return bridge.isRouteTrackingActive() === true; } catch (_) { return false; }
}
function startNativeRouteTracking() {
    var bridge = getNativeRouteTrackingBridge();
    if (!bridge || !isRecording) return false;
    var sessionId = ensureRecordingSession();
    try {
        var remaining = AUTO_RECORDING_MS - Math.max(0, Date.now() - Number(recordingSessionStartedAt || Date.now()));
        if (remaining <= 0) return false;
        if (typeof bridge.startRouteTrackingSession === "function") return bridge.startRouteTrackingSession(remaining, sessionId) === true;
        return bridge.startRouteTracking(remaining) === true;
    }
    catch (error) { console.warn("Native route tracking start failed", error); return false; }
}
function stopNativeRouteTracking() {
    var bridge = getNativeRouteTrackingBridge();
    if (!bridge || typeof bridge.stopRouteTracking !== "function") return;
    try { bridge.stopRouteTracking(); } catch (error) { console.warn("Native route tracking stop failed", error); }
}
function mergeNativeRouteTrackingPoints(list) {
    if (!Array.isArray(list) || !list.length) return 0;
    var imported = list.map(function(point) {
        var lat = Number(point && point.lat);
        var lng = Number(point && point.lng);
        var accuracy = Number(point && point.accuracy);
        var time = Number(point && point.time) || Date.now();
        var sessionId = String(point && point.recordingSessionId || recordingSessionId || "");
        if (!isFinite(lat) || !isFinite(lng) || !isValidPhotoCoordinate(lat, lng)) return null;
        if (!isFinite(accuracy) || accuracy > MAX_ACCURACY_M) return null;
        return { lat:lat, lng:lng, startTime:time, endTime:time, timestamp:time, visits:1, accuracy:accuracy, recordingSessionId:sessionId || null, source:"native" };
    }).filter(Boolean);
    if (!imported.length) return 0;

    // Native tracking continues while the WebView is backgrounded or rebuilt.
    // Merge those samples directly instead of routing them through
    // handlePosition(), which intentionally ignores samples while the JS UI is
    // not yet marked as recording.
    rawGpsPoints = mergeJourneyPointLists([
    rawGpsPoints,
    imported
], true);

imported.forEach(function(point) {
    idbSaveGpsPoint(point).catch(function(error) {
        console.warn(
            "Native GPS durable save failed",
            error && error.name
        );
    });
});
    var combined = (pathCoordinates || []).map(function(point) { return Object.assign({}, point); }).concat(imported);
    combined.sort(function(a, b) { return Number(a.startTime) - Number(b.startTime); });
    var deduplicated = [];
    combined.forEach(function(point) {
        var previous = deduplicated[deduplicated.length - 1];
        if (previous) {
            var timeGap = Math.abs(Number(point.startTime) - Number(previous.startTime));
            var distance = L.latLng(previous.lat, previous.lng).distanceTo([point.lat, point.lng]);
            // Foreground and native trackers can report the same fix. Keep one
            // copy, but never simplify distinct bends in the recorded route.
            if (timeGap <= 15000 && distance < 5) {
                previous.endTime = Math.max(Number(previous.endTime) || 0, Number(point.endTime) || Number(point.startTime));
                previous.visits = Math.max(Number(previous.visits) || 1, Number(point.visits) || 1);
                return;
            }
        }
        deduplicated.push(point);
    });
    pathCoordinates = shrinkOldPoints(deduplicated, MAX_PATH_POINTS);
    var restoredDistance = totalDistance;
    totalDistance = 0;
    for (var i = 1; i < pathCoordinates.length; i++) {
        if (shouldConnectStoredPathPoints(pathCoordinates[i - 1], pathCoordinates[i])) {
            totalDistance += L.latLng(pathCoordinates[i - 1].lat, pathCoordinates[i - 1].lng).distanceTo([pathCoordinates[i].lat, pathCoordinates[i].lng]);
        }
    }
    totalDistance = Math.max(restoredDistance, totalDistance);
    return imported.length;
}
function restoreNativeRecordingSession() {
    var bridge = getNativeRouteTrackingBridge();
    if (!bridge || typeof bridge.getRouteTrackingSessionId !== "function") return recordingSessionId;
    try {
        var nativeSessionId = String(bridge.getRouteTrackingSessionId() || "").trim();
        if (nativeSessionId) {
            recordingSessionId = nativeSessionId;
            var parts = nativeSessionId.split(":");
            if (!recordingSessionStartedAt && isFinite(parts[1])) recordingSessionStartedAt = Number(parts[1]);
        }
    } catch (error) { console.warn("Native recording session restore failed", error); }
    return recordingSessionId;
}
function acknowledgeNativeRouteTrackingPoints(bridge, throughTime) {
    if (!bridge || !throughTime || typeof bridge.acknowledgeRouteTrackingPoints !== "function") return false;
    try { return bridge.acknowledgeRouteTrackingPoints(throughTime) === true; }
    catch (error) { console.warn("Native route tracking acknowledgement failed", error); return false; }
}
function consumeNativeRouteTrackingPoints(options) {
    options = options || {};
    var bridge = getNativeRouteTrackingBridge();
    if (!bridge) return Promise.resolve({ count:0, throughTime:0, canAcknowledge:false });
    var canAcknowledge = typeof bridge.loadRouteTrackingPoints === "function" && typeof bridge.acknowledgeRouteTrackingPoints === "function";
    if (!canAcknowledge && typeof bridge.consumeRouteTrackingPoints !== "function") return Promise.resolve({ count:0, throughTime:0, canAcknowledge:false });
    var raw;
    try { raw = canAcknowledge ? bridge.loadRouteTrackingPoints() : bridge.consumeRouteTrackingPoints(); }
    catch (error) { console.warn("Native route tracking read failed", error); return Promise.resolve({ count:0, throughTime:0, canAcknowledge:canAcknowledge }); }
    var list;
    try { list = JSON.parse(raw || "[]"); } catch (_) { return Promise.resolve({ count:0, throughTime:0, canAcknowledge:canAcknowledge }); }
    if (!Array.isArray(list) || !list.length) return Promise.resolve({ count:0, throughTime:0, canAcknowledge:canAcknowledge });
    list.sort(function(a, b) { return (Number(a.time) || 0) - (Number(b.time) || 0); });
    var count = mergeNativeRouteTrackingPoints(list);
    var throughTime = list.reduce(function(latest, point) { return Math.max(latest, Number(point && point.time) || 0); }, 0);
    if (!count) return Promise.resolve({ count:0, throughTime:throughTime, canAcknowledge:canAcknowledge });
    compactPathData();
    markJourneyStateDirty();
    if (!options.deferPersist) {
        var saved = persistState();
        if (saved && canAcknowledge) acknowledgeNativeRouteTrackingPoints(bridge, throughTime);
    }
    return Promise.resolve({ count:count, throughTime:throughTime, canAcknowledge:canAcknowledge });
}
function isNativeApp() {
    return !!(
        isNativeRouteTrackingAvailable() ||
        (
            window.Capacitor &&
            typeof window.Capacitor.isNativePlatform === "function" &&
            window.Capacitor.isNativePlatform()
        )
    );
}
function toPositionFromBackground(location) {
    return {
        coords: {
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
            heading: location.bearing,
            speed: location.speed,
            altitude: location.altitude,
            altitudeAccuracy: location.altitudeAccuracy
        },
        timestamp: location.time || Date.now()
    };
}
function handleBackgroundLocation(location, error) {
    if (error) {
        console.warn("Background location error", error);
        if (error.code === "NOT_AUTHORIZED" && recStatusBox) recStatusBox.textContent = "Location permission required";
        return;
    }
    if (location && trackingRequested && isRecording) handlePosition(toPositionFromBackground(location), { source:"background" });
}
function startBackgroundTracking() {
    var background = getBackgroundGeolocationPlugin();
    if (!background || typeof background.addWatcher !== "function") return Promise.resolve(false);
    if (backgroundWatchId !== null) return Promise.resolve(true);
    if (backgroundWatchStartPromise) return backgroundWatchStartPromise;
    backgroundWatchStartPromise = background.addWatcher({
        backgroundMessage: "Giloa is recording your route.",
        backgroundTitle: "Giloa location recording",
        requestPermissions: true,
        stale: false,
        distanceFilter: 10
    }, handleBackgroundLocation).then(function(id) {
        backgroundWatchStartPromise = null;
        if (!trackingRequested) {
            return background.removeWatcher({ id: id }).catch(function(error) {
                console.warn("Background location cleanup failed", error);
            }).then(function() { return false; });
        }
        backgroundWatchId = id;
        return true;
    }).catch(function(error) {
        backgroundWatchStartPromise = null;
        console.warn("Background location start failed", error);
        return false;
    });
    return backgroundWatchStartPromise;
}
function stopBackgroundTracking() {
    var background = getBackgroundGeolocationPlugin();
    if (!background || typeof background.removeWatcher !== "function" || backgroundWatchId === null) return Promise.resolve();
    var id = backgroundWatchId;
    backgroundWatchId = null;
    return background.removeWatcher({ id: id }).catch(function(error) {
        console.warn("Background location stop failed", error);
    });
}
function startForegroundTracking() {
    if (!navigator.geolocation) {
        if (recStatusBox) recStatusBox.textContent = "Location unavailable";
        return;
    }
    if (!window.isSecureContext && location.hostname !== "localhost" && location.hostname !== "127.0.0.1" && !isNativeApp()) {
        if (recStatusBox) recStatusBox.textContent = "HTTPS required";
        return;
    }
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    watchId = navigator.geolocation.watchPosition(handlePosition, handleLocationError, { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 });
    if (recStatusBox && isRecording) recStatusBox.textContent = "Waiting for location";
}
function startTracking() {
    clearTrackingRetryTimer();
    trackingRequested = true;
    if (isNativeRouteTrackingAvailable()) {
        startNativeRouteTracking();
        startForegroundTracking();
        return;
    }
    if (isNativeApp()) {
        startBackgroundTracking().then(function(started) {
            if (!started && trackingRequested && isRecording) startForegroundTracking();
        });
        return;
    }
    startForegroundTracking();
}
function stopTracking() {
    trackingRequested = false;
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
    stopNativeRouteTracking();
    stopBackgroundTracking();
}

function handlePosition(position, options) {
    options = options || {};
    if (!position || !position.coords || !isValidPhotoCoordinate(position.coords.latitude, position.coords.longitude)) return;
        /*
     * 최초 네이티브 서비스 시작 시 위치 권한이 아직 승인되지 않았다면
     * startNativeRouteTracking()이 실패할 수 있다.
     * 첫 번째 정상 위치가 들어온 시점에는 권한 승인이 끝났으므로
     * 네이티브 백그라운드 기록 서비스를 다시 시작한다.
     */
    if (
        trackingRequested &&
        isRecording &&
        isNativeRouteTrackingAvailable() &&
        !isNativeRouteTrackingActive()
    ) {
        startNativeRouteTracking();
    }
    var accuracy = Number(position.coords.accuracy) || Infinity;
    var timestamp = Number(position.timestamp) || Date.now();
    // A single coarse Wi-Fi/cell fix must not drag the player marker hundreds of
    // metres away from a good GPS fix taken moments ago.  Skip a sample only when
    // it is dramatically worse than the fix we are already showing.
    if (!options.force && shouldIgnorePositionSample(accuracy, timestamp)) {
        if (recStatusBox && isRecording) recStatusBox.textContent = getStatusText("gps_weak", Math.round(accuracy));
        return;
    }
    currentAccuracy = accuracy;
    currentPositionTimestamp = timestamp;
    var latlng = L.latLng(position.coords.latitude, position.coords.longitude);
    var heading = position.coords.heading;
    var prevPos = currentPos;
    if (typeof heading === "number" && isFinite(heading)) playerHeading = heading;
    else if (prevPos && prevPos.distanceTo(latlng) > 2) playerHeading = bearingBetween(prevPos, latlng);
    currentPos = latlng;
    if (!playerMarker) {
        playerMarker = L.marker(latlng, {
            pane: "playerPane", keyboard: true,
            title: (UI_TEXT[currentLang] || UI_TEXT.ko).special_place,
            icon: L.divIcon({ className: "player-marker", html: '<span class="player-marker-dot"></span>', iconSize: [44, 44], iconAnchor: [22, 22] })
        }).addTo(map);
        playerMarker.on("click", function(e) {
            if (e && e.originalEvent) L.DomEvent.stop(e.originalEvent);
            var displayedPosition = getDisplayedCurrentPosition();
            if (displayedPosition) openSpecialPlaceEditor(displayedPosition.lat, displayedPosition.lng);
        });
        map.setView(latlng, 16);
    }
    else { playerMarker.setLatLng(latlng); }
    // The visible marker is the canonical current position used by the rest of
    // the map. This keeps the blue dot, map centering and fog opening identical.
    currentPos = playerMarker.getLatLng();
    latlng = currentPos;
    if (!playerAccuracyCircle) {
        playerAccuracyCircle = L.circle(latlng, { pane: "playerPane", radius: Math.max(accuracy, 3), interactive: false, color: "#4db8ff", weight: 1, opacity: 0.55, fillColor: "#4db8ff", fillOpacity: 0.09 }).addTo(map);
    } else {
        playerAccuracyCircle.setLatLng(latlng);
        playerAccuracyCircle.setRadius(Math.max(accuracy, 3));
    }
    // `handlePosition` is the single approval point used by the map, marker,
    // accuracy circle and tutorial. A late geolocation timeout must not undo
    // this accepted position in the tutorial UI.
    if (hasValidCurrentLocation()) {
        if (GILOA_DEBUG) console.log("[GILOA LOCATION READY]", currentPos);
        window.dispatchEvent(new CustomEvent("giloa:location-ready", { detail:{ lat:currentPos.lat, lng:currentPos.lng, accuracy:currentAccuracy } }));
        updateRegionStayProgress(currentPos, currentAccuracy, currentPositionTimestamp);
    }
    refreshMapCenteredLayerMarkers();
    if (!prevPos) {
        scheduleRestroomFetch();
        delete tourSearchStateByLang[currentLang || "ko"];
        scheduleTourFetch({ immediate: true });
    }
    // The player marker moves even when recording is paused.  Repaint now so
    // the fog opening cannot remain at the previous GPS point.
    scheduleRender();
    updateVisionCone(latlng);
    syncImageMissionUI();
    if (window.GiloaHiddenMissions) {
        window.GiloaHiddenMissions.onPosition({
            lat: latlng.lat,
            lng: latlng.lng,
            accuracy: accuracy,
            timestamp: currentPositionTimestamp,
            recording: isRecording
        });
    }
    if (!isRecording) return;
    if (accuracy > MAX_ACCURACY_M) { recStatusBox.textContent = getStatusText("gps_very_weak", Math.round(accuracy)); return; }
    // Preserve the GPS sample time. Using Date.now() here collapsed delayed
    // background samples into the moment the app was reopened, breaking the
    // selected 1–8 hour export range.
    var now = timestamp; recStatusBox.textContent = accuracy > 50 ? getStatusText("gps_weak", Math.round(accuracy)) : getStatusText("rec_active");
    checkNearbyVisitCompletion({ method: "stay" });
    var rawPoint = createPathPoint(latlng, now, accuracy, ensureRecordingSession(), options.source || "foreground");
    if (!appendRawGpsPoint(rawPoint)) return;
    updateRegionStayProgress();
    if (pathCoordinates.length === 0) { pathCoordinates.push(rawPoint); checkStayBonus(latlng, now); updateStats(); scheduleSave(); scheduleCompletedOfficialRouteRefresh(); scheduleRender(); return; }
    // Keep every accepted fix in RAW storage, but remove an isolated out-and-
    // back GPS excursion from DISPLAY once the following real fix proves it was
    // noise. No synthetic coordinate is created and no stored fix is deleted.
    if (pathCoordinates.length >= 2 && isIsolatedGpsSpike(pathCoordinates[pathCoordinates.length - 2], pathCoordinates[pathCoordinates.length - 1], rawPoint)) pathCoordinates.pop();
    var last = pathCoordinates[pathCoordinates.length - 1]; var dist = distanceToPoint(latlng, last); var stayThreshold = getDynamicStayThreshold(accuracy);
    var connected = shouldConnectPath(last, rawPoint);
    // MIN_MOVE is a display/statistics hint only. Every accepted raw fix is
    // retained, and the second valid fix can draw A-to-B immediately.
    pathCoordinates.push(rawPoint);
    if (connected && dist > stayThreshold) { totalDistance += dist; triggerRecentPathPulse(latlng.lat, latlng.lng); }
    else if (!connected && Number(rawPoint.startTime) - Number(last.endTime || last.startTime) <= GAP_THRESHOLD_MS) recStatusBox.textContent = getStatusText("gps_weak", Math.round(accuracy));
    if (pathCoordinates.length > MAX_PATH_POINTS) compactPathData();
    checkStayBonus(latlng, now); updateStats(); scheduleSave(); scheduleCompletedOfficialRouteRefresh(); scheduleRender();
}

function handleLocationError(err) {
    var messages = { 1: "Location permission needed", 2: "Checking location", 3: "Location timeout" };
    if (recStatusBox) recStatusBox.textContent = messages[err && err.code] || "Waiting for location";
    if (!isRecording) return;
    if (err && err.code === 1) { stopRecording(); showLocationToast(earlyUiText("locationPermission"), 5000); return; }
    clearTrackingRetryTimer();
    trackingRetryTimer = setTimeout(function() {
        trackingRetryTimer = null;
        if (isRecording) startTracking();
    }, 15000);
}
function createPathPoint(latlng, timestamp, accuracy, sessionId, source) { return { lat: latlng.lat, lng: latlng.lng, startTime: timestamp, endTime: timestamp, timestamp: timestamp, visits: 1, accuracy: isFinite(accuracy) ? Number(accuracy) : null, recordingSessionId:sessionId || null, source:source || "foreground" }; }
var rawGpsPointIds = new Set();
var rawGpsPointIndexSource = null;
function getRawGpsPointId(point) {
    return String(point.id || (Number(point.timestamp) + ":" + Number(point.lat).toFixed(7) + ":" + Number(point.lng).toFixed(7)));
}
function rebuildRawGpsPointIndex() {
    rawGpsPointIds.clear();
    rawGpsPoints.forEach(function(point) {
        if (!point || !isFinite(point.timestamp) || !isFinite(point.lat) || !isFinite(point.lng)) return;
        point.id = getRawGpsPointId(point);
        rawGpsPointIds.add(point.id);
    });
    rawGpsPointIndexSource = rawGpsPoints;
}
function ensureRawGpsPointIndex() {
    if (rawGpsPointIndexSource !== rawGpsPoints || (rawGpsPoints.length && !rawGpsPointIds.size)) rebuildRawGpsPointIndex();
}
function findRawGpsPointIndex(timestamp, afterEqual) {
    var low = 0;
    var high = rawGpsPoints.length;
    while (low < high) {
        var middle = (low + high) >>> 1;
        var middleTimestamp = Number(rawGpsPoints[middle].timestamp);
        if (middleTimestamp < timestamp || (afterEqual && middleTimestamp === timestamp)) low = middle + 1;
        else high = middle;
    }
    return low;
}
function appendRawGpsPoint(point) {
    if (!point || !isFinite(point.lat) || !isFinite(point.lng) || !isFinite(point.timestamp) || !isFinite(point.accuracy) || point.accuracy > MAX_ACCURACY_M) return false;
    point = Object.assign({}, point, { startTime:Number(point.startTime || point.timestamp), endTime:Number(point.endTime || point.timestamp), timestamp:Number(point.timestamp), accuracy:Number(point.accuracy), recordingSessionId:point.recordingSessionId ? String(point.recordingSessionId) : null, source:point.source ? String(point.source) : "unknown" });
    point.id = getRawGpsPointId(point);
    ensureRawGpsPointIndex();
    if (rawGpsPointIds.has(point.id)) return false;
    var duplicateWindowStart = findRawGpsPointIndex(point.timestamp - 15000, false);
    for (var i = duplicateWindowStart; i < rawGpsPoints.length; i++) {
        var existing = rawGpsPoints[i];
        var timeGap = Math.abs(Number(existing.timestamp) - point.timestamp);
        if (Number(existing.timestamp) > point.timestamp + 15000) break;
        var distance = L.latLng(existing.lat, existing.lng).distanceTo([point.lat, point.lng]);
        if ((timeGap <= 1000 && distance < 1) || (existing.source !== point.source && timeGap <= 15000 && distance < 5)) return false;
    }
    var insertionIndex = findRawGpsPointIndex(point.timestamp, true);
    if (insertionIndex === rawGpsPoints.length) rawGpsPoints.push(point);
    else rawGpsPoints.splice(insertionIndex, 0, point);
    rawGpsPointIds.add(point.id);
    markJourneyStateDirty();
    idbSaveGpsPoint(point).catch(function(error) { console.warn("GPS point durable save failed", error && error.name); });
    return true;
}
function restoreRawGpsPoints() {
    return idbGetAllGpsPoints().then(function(points) {
        var beforeCount = rawGpsPoints.length;

        // 한 점씩 some()과 sort()를 반복하지 않고 한 번에 병합한다.
        rawGpsPoints = mergeJourneyPointLists([
            rawGpsPoints,
            Array.isArray(points) ? points : []
        ], true);

        if (!rawGpsPoints.length && pathCoordinates.length) {
            rawGpsPoints = mergeJourneyPointLists([
                pathCoordinates
            ], true);
        }

        if (rawGpsPoints.length) {
            pathCoordinates = buildDisplayPath(
                mergeJourneyPointLists([
                    pathCoordinates,
                    rawGpsPoints
                ], false)
            );

            totalDistance = Math.max(
                totalDistance,
                calculateRecordedDistance(pathCoordinates, 0)
            );

            updateStats();
            scheduleRender();
        }

        return {
            count: rawGpsPoints.length,
            added: Math.max(0, rawGpsPoints.length - beforeCount),
            failed: false
        };
    }).catch(function(error) {
        console.warn("GPS point restore failed", error && error.name);

        return {
            count: rawGpsPoints.length,
            added: 0,
            failed: true
        };
    });
}
function buildDisplayPath(points) {
    var display = [];
    (points || []).slice().sort(function(a, b) { return Number(a.timestamp) - Number(b.timestamp); }).forEach(function(point) {
        var next = Object.assign({}, point, { visits:Number(point.visits) || 1 });
        if (display.length >= 2 && isIsolatedGpsSpike(display[display.length - 2], display[display.length - 1], next)) display.pop();
        display.push(next);
    });
    return shrinkOldPoints(display, MAX_PATH_POINTS);
}
function distanceToPoint(latlng, point) { return latlng.distanceTo([point.lat, point.lng]); }
function getDynamicStayThreshold(accuracy) { return Math.max(MIN_MOVE_M, Math.min(MAX_STAY_RADIUS_M, accuracy * STAY_ACCURACY_FACTOR)); }
function isIsolatedGpsSpike(previous, candidate, next) {
    if (!previous || !candidate || !next) return false;
    var previousSession = String(previous.recordingSessionId || "");
    var candidateSession = String(candidate.recordingSessionId || "");
    var nextSession = String(next.recordingSessionId || "");
    if ((previousSession || candidateSession || nextSession) && (!previousSession || previousSession !== candidateSession || candidateSession !== nextSession)) return false;
    var previousTime = Number(previous.startTime || previous.timestamp);
    var candidateTime = Number(candidate.startTime || candidate.timestamp);
    var nextTime = Number(next.startTime || next.timestamp);
    if (!isFinite(previousTime) || !isFinite(candidateTime) || !isFinite(nextTime) || candidateTime <= previousTime || nextTime <= candidateTime || nextTime - previousTime > PATH_SPIKE_WINDOW_MS) return false;
    var accuracies = [previous.accuracy, candidate.accuracy, next.accuracy].map(function(value) { return isFinite(value) ? Number(value) : MAX_ACCURACY_M; });
    if (accuracies.some(function(value) { return value < 0 || value > PATH_CONNECT_MAX_ACCURACY_M; })) return false;
    var previousToCandidate = L.latLng(previous.lat, previous.lng).distanceTo([candidate.lat, candidate.lng]);
    var candidateToNext = L.latLng(candidate.lat, candidate.lng).distanceTo([next.lat, next.lng]);
    var previousToNext = L.latLng(previous.lat, previous.lng).distanceTo([next.lat, next.lng]);
    if (![previousToCandidate, candidateToNext, previousToNext].every(isFinite)) return false;
    var returnRadius = Math.max(30, Math.min(75, (accuracies[0] + accuracies[2]) * 1.25));
    var excursion = Math.min(previousToCandidate, candidateToNext);
    var detour = previousToCandidate + candidateToNext;
    var outboundSpeed = previousToCandidate / Math.max(1, (candidateTime - previousTime) / 1000);
    var returnSpeed = candidateToNext / Math.max(1, (nextTime - candidateTime) / 1000);
    var candidateAccuracyIsWorse = accuracies[1] >= Math.max(25, Math.max(accuracies[0], accuracies[2]) * 1.8);
    return previousToNext <= returnRadius && excursion >= Math.max(PATH_SPIKE_MIN_EXCURSION_M, previousToNext * 2.5) && detour >= Math.max(100, previousToNext * 4) && (Math.max(outboundSpeed, returnSpeed) > PATH_SHORT_GAP_MAX_SPEED_MPS || candidateAccuracyIsWorse);
}
function isPlausiblePathSegment(fromPoint, toLatLng, timestamp, accuracy) {
    if (!fromPoint || !toLatLng) return true;
    return shouldConnectPath(fromPoint, {
        lat:toLatLng.lat, lng:toLatLng.lng, startTime:Number(timestamp), endTime:Number(timestamp), timestamp:Number(timestamp),
        accuracy:isFinite(accuracy) ? Number(accuracy) : MAX_ACCURACY_M,
        recordingSessionId:fromPoint.recordingSessionId || recordingSessionId || null
    });
}
function shouldConnectPath(fromPoint, toPoint) {
    if (!fromPoint || !toPoint) return false;

    var fromSession = String(fromPoint.recordingSessionId || "");
    var toSession = String(toPoint.recordingSessionId || "");
    if (fromSession && toSession && fromSession !== toSession) return false;
    var sameSession =
        !!fromSession &&
        !!toSession &&
        fromSession === toSession;

    var fromAccuracy = isFinite(fromPoint.accuracy)
        ? Number(fromPoint.accuracy)
        : MAX_ACCURACY_M;

    var toAccuracy = isFinite(toPoint.accuracy)
        ? Number(toPoint.accuracy)
        : MAX_ACCURACY_M;

    if (
        fromAccuracy < 0 ||
        toAccuracy < 0 ||
        fromAccuracy > PATH_CONNECT_MAX_ACCURACY_M ||
        toAccuracy > PATH_CONNECT_MAX_ACCURACY_M
    ) {
        return false;
    }

 var fromFixTime = Number(
    fromPoint.timestamp || fromPoint.startTime
);
var toFixTime = Number(
    toPoint.timestamp || toPoint.startTime
);

if (
    !isFinite(fromFixTime) ||
    !isFinite(toFixTime) ||
    toFixTime <= fromFixTime
) return false;

// endTime can represent a merged stay; it is not evidence of a new GPS fix.
if (toFixTime - fromFixTime > PATH_MAX_FIX_GAP_MS) return false;

var fromEndTime = Number(fromPoint.endTime);
var departureTime =
    isFinite(fromEndTime) &&
    fromEndTime >= fromFixTime &&
    fromEndTime < toFixTime
        ? fromEndTime
        : fromFixTime;

var elapsedMs = toFixTime - departureTime;
    var distance = L.latLng(
        fromPoint.lat,
        fromPoint.lng
    ).distanceTo([
        toPoint.lat,
        toPoint.lng
    ]);

    if (!isFinite(distance)) return false;

    var elapsedSeconds = Math.max(1, elapsedMs / 1000);
    var speed = distance / elapsedSeconds;

    var accuracyAllowance = Math.min(
        100,
        Math.max(0, fromAccuracy + toAccuracy)
    );

    if (elapsedMs <= GAP_THRESHOLD_MS) {
        var speedLimit =
            elapsedMs <= 60 * 1000
                ? PATH_SHORT_GAP_MAX_SPEED_MPS
                : MAX_PATH_SPEED_MPS;

        var allowedDistance =
            PATH_JUMP_BASE_TOLERANCE_M +
            accuracyAllowance +
            elapsedSeconds * speedLimit;

        return (
            speed <= speedLimit &&
            distance <= allowedDistance
        );
    }

    if (!sameSession) return false;

    if (elapsedMs <= PATH_MID_GAP_MAX_MS) {
        return (
            speed <= PATH_MID_GAP_MAX_SPEED_MPS &&
            distance <= PATH_LONG_GAP_MAX_DISTANCE_M
        );
    }

    if (elapsedMs <= PATH_LONG_GAP_MAX_MS) {
        return (
            speed <= PATH_LONG_GAP_MAX_SPEED_MPS &&
            distance <= PATH_LONG_GAP_MAX_DISTANCE_M
        );
    }

    return distance <= Math.max(
        250,
        accuracyAllowance * 2
    );
}
function shouldConnectStoredPathPoints(fromPoint, toPoint) { return shouldConnectPath(fromPoint, toPoint); }

function checkStayBonus(latlng, now) {
    if (!stayBonusAnchor) { stayBonusAnchor = latlng; stayBonusStartTime = now; return; }
    if (latlng.distanceTo(stayBonusAnchor) > STAY_BONUS_RADIUS_M) { stayBonusAnchor = latlng; stayBonusStartTime = now; return; }
    if (stayBonusPlaces.some(function(p) { return latlng.distanceTo([p.lat, p.lng]) <= STAY_BONUS_RADIUS_M; })) return;
    var remaining = STAY_BONUS_MS - (now - stayBonusStartTime);
    if (remaining > 0) { recStatusBox.textContent = getStatusText("stay_bonus_wait", Math.ceil(remaining / 60000)); return; }
    stayBonusPlaces.push({ lat: stayBonusAnchor.lat, lng: stayBonusAnchor.lng }); stayBonusLevelBoost += 1; saveBonusState(); updateStats();
    recStatusBox.textContent = getStatusText("stay_bonus_done"); setTimeout(function() { if (isRecording) recStatusBox.textContent = getStatusText("rec_active"); }, 4000);
}
function saveBonusState() { safeStorageSet("giloa-stay-bonus", JSON.stringify({ boost: stayBonusLevelBoost, places: stayBonusPlaces })); }
function loadBonusState() { try { var raw = localStorage.getItem("giloa-stay-bonus"); if (!raw) return; var data = JSON.parse(raw); stayBonusLevelBoost = isFinite(data.boost) ? data.boost : 0; stayBonusPlaces = Array.isArray(data.places) ? data.places.filter(function(p) { return isFinite(p.lat) && isFinite(p.lng); }) : []; } catch (e) { console.warn("보너스 상태 불러오기 실패", e); } }
function calculateRecordedDistance(points, sinceMs) { var dist = 0; for (var i = 1; i < points.length; i++) { if ((!sinceMs || Number(points[i].startTime) >= sinceMs) && shouldConnectStoredPathPoints(points[i - 1], points[i])) dist += L.latLng(points[i].lat, points[i].lng).distanceTo([points[i - 1].lat, points[i - 1].lng]); } return dist; }
function calcTodayDistance() { return calculateRecordedDistance(pathCoordinates, new Date().setHours(0, 0, 0, 0)); }

function compactPathData() {
    // Never compact the source log. The display path only removes impossible
    // jumps and old overflow; small, legitimate A-to-B movement stays visible.
    // Legacy display points can predate the durable RAW log. Preserve both.
    var displayByFix = new Map();
    pathCoordinates.forEach(function(point) {
        displayByFix.set(journeyPointKey(point), point);
    });
    var combined = mergeJourneyPointLists([rawGpsPoints, pathCoordinates], false);
    combined.forEach(function(point) {
        var displayed = displayByFix.get(journeyPointKey(point));
        if (!displayed) return;
        // RAW owns fix/session metadata; keep accumulated stays from display data.
        point.endTime = Math.max(Number(point.endTime) || 0, Number(displayed.endTime) || 0);
        point.visits = Math.max(Number(point.visits) || 1, Number(displayed.visits) || 1);
    });
    pathCoordinates = buildDisplayPath(combined);
}
function shrinkOldPoints(points, maxPoints) { if (points.length <= maxPoints) return points; var keepTail = Math.floor(maxPoints * 0.4); var tail = points.slice(-keepTail); var head = points.slice(0, points.length - keepTail); var ratio = Math.ceil(head.length / (maxPoints - keepTail)); var filtered = head.filter(function(_, i) { return i % ratio === 0; }); return filtered.concat(tail).slice(-maxPoints); }


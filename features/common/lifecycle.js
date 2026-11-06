var giloaStartupChoicePromise = null;
function requestGiloaStartupEntryChoice() {
    if (giloaStartupChoicePromise) return giloaStartupChoicePromise;
    if (!window.GiloaPrivacy) return Promise.resolve(false);
    if (typeof hasSavedIntroLanguage === "function" && hasSavedIntroLanguage()) currentLang = normalizeLang(safeStorageGet(LANGUAGE_PREFERENCE_KEY));
    else if (typeof normalizeLang === "function") currentLang = normalizeLang(navigator.language || currentLang);
    giloaStartupChoicePromise = window.GiloaPrivacy.requestLocationConsent({force:true,startup:true,onChoice:function(agreed) {
        if (window.GiloaStartupMusic) window.GiloaStartupMusic.start({force:true});
        if (agreed) {
            startupLocationRequested = true;
            runInitStep("startup recording", startRecordingAfterDisclosure);
        }
    }});
    if (window.GiloaBoot && typeof window.GiloaBoot.hide === "function") window.GiloaBoot.hide();
    return giloaStartupChoicePromise;
}
function beginGiloaStartupEntry() {
    return requestGiloaStartupEntryChoice().then(function(agreed) {
        var firstMeetingShown = false;
        runInitStep("first launch experience", function(){firstMeetingShown=startFirstLaunchExperience();return firstMeetingShown;});
        if (!firstMeetingShown) setTimeout(showGiloaUpdateNoticeIfNeeded,450);
        return agreed;
    });
}
function startFirstLaunchExperience() {
    // 저장된 언어가 없으면 언어 선택 온보딩부터 표시한다.
    if (!hasSavedIntroLanguage()) {
        return showGiloaOnboarding();
    }

    currentLang = normalizeLang(
        safeStorageGet(LANGUAGE_PREFERENCE_KEY)
    );
    applyUILang(currentLang);

    // 언어는 선택했지만 인트로를 아직 완료하지 않은 경우
    if (safeStorageGet(INTRO_STORY_SEEN_KEY) !== "true") {
        return showGiloaOnboarding();
    }

    // 인트로 완료 후 지도 사용법 튜토리얼로 연결
    if (typeof window.startGiloaTutorialIfNeeded === "function") {
        return window.startGiloaTutorialIfNeeded();
    }

    return false;
}
window.showGiloaOnboarding=showGiloaOnboarding;window.showGiloStory=showGiloStory;window.closeGiloStory=closeGiloStory;window.startMapTutorial=startMapTutorial;
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

function runInitStep(name, action) {
    try {
        var result = action();
        if (result && typeof result.catch === "function") return result.catch(function(error) { console.error("Init step failed: " + name, error); });
        return Promise.resolve(result);
    } catch (error) {
        console.error("Init step failed: " + name, error);
        return Promise.resolve();
    }
}
function runJourneyDataIntegrityCheck() {
    var invalidPath = (pathCoordinates || []).filter(function(point) { return !isValidJourneyPoint(point, false); }).length;
    var invalidRaw = (rawGpsPoints || []).filter(function(point) { return !isValidJourneyPoint(point, true); }).length;
    var rpg = loadRpgGrowth();
    var rpgStats = rpg && rpg.stats ? rpg.stats : rpg;
    var invalidRpg = RPG_STAT_KEYS.some(function(key) { return !isFinite(rpgStats && rpgStats[key]) || Number(rpgStats[key]) < 0; });
    var report = {
        path:pathCoordinates.length, rawGps:rawGpsPoints.length, invalidPath:invalidPath, invalidRaw:invalidRaw,
        distance:totalDistance, photos:photos.length, memories:memories.length,
        visits:Array.isArray(visitStamps) ? visitStamps.length : 0, invalidRpg:invalidRpg
    };
    if (invalidPath || invalidRaw || !isFinite(totalDistance) || totalDistance < 0 || invalidRpg) console.warn("[GILOA RESTORE] integrity warning " + JSON.stringify(report));
    else if (GILOA_PERSISTENCE_DEBUG) console.log("[GILOA RESTORE] integrity " + JSON.stringify(report));
    return report;
}
async function initializePersistentJourneyState() {
    if (GILOA_PERSISTENCE_DEBUG) console.log("[GILOA RESTORE] start");
    // Fast phase: Android durable mirror + localStorage are synchronous/local and
    // can be restored before the first usable frame. Do not wait for IndexedDB
    // or the native GPS bridge before letting the user see and pan the map.
   var localLoaded =
    pathCoordinates.length > 0 ||
    rawGpsPoints.length > 0;
    if (window.GiloaBoot && typeof window.GiloaBoot.setStatus === "function") window.GiloaBoot.setStatus(earlyUiText("restoring"));
    var localPathCount = pathCoordinates.length;
    var durablePathCount = localPathCount;
    var indexedDbResult = await restoreRawGpsPoints();
        if (isNativeRouteTrackingActive()) {
     restoreNativeRecordingSession();
}
    var nativeResult = await consumeNativeRouteTrackingPoints({ deferPersist:true });
    var recoveredOrphanedPhotos = await recoverOrphanedPhotoRows();
    var mergedBefore = Math.max(localPathCount, indexedDbResult.count, nativeResult.count, durablePathCount);
    var mergedCount = Math.max(pathCoordinates.length, rawGpsPoints.length);
    if (GILOA_PERSISTENCE_DEBUG) {
        console.log("[GILOA RESTORE] " + JSON.stringify({ localStoragePath:localPathCount, indexedDBGps:indexedDbResult.count, nativeGps:nativeResult.count, durableBackupPath:durablePathCount }));
        console.log("[GILOA RESTORE] " + JSON.stringify({ mergedGps:mergedCount, duplicateRemoved:Math.max(0, localPathCount + indexedDbResult.count + nativeResult.count - mergedCount), invalidRemoved:0, recoveredPhotos:recoveredOrphanedPhotos }));
    }
    var saved = persistState({ restoreCommit:true });
    if (saved && nativeResult.canAcknowledge && nativeResult.throughTime) acknowledgeNativeRouteTrackingPoints(getNativeRouteTrackingBridge(), nativeResult.throughTime);
    giloaPersistentStateReady = true;
    if (
    pendingRecordingStartAfterRestore &&
    !isRecording
) {
    pendingRecordingStartAfterRestore = false;

    setTimeout(function() {
        if (!isRecording) {
            toggleRecording();
        }
    }, 0);
}
    runJourneyDataIntegrityCheck();
    if (GILOA_PERSISTENCE_DEBUG) console.log("[GILOA RESTORE] " + JSON.stringify({ distance:(totalDistance / 1000).toFixed(2) + "km", photos:photos.length, memories:memories.length, visits:Array.isArray(visitStamps) ? visitStamps.length : 0, sourceMaximum:mergedBefore }));
    if (GILOA_PERSISTENCE_DEBUG) console.log("[GILOA RESTORE] COMPLETE");
    return localLoaded || mergedCount > 0;
}
async function init() {
    runInitStep("startup consent", requestGiloaStartupEntryChoice);
    await runInitStep("canvas", resizeCanvas);
    // Make the shell responsive immediately. The map, menu, help and map panning
    // do not need to wait for IndexedDB/native route merging.
    await runInitStep("local user", ensureUserId);
    await runInitStep("durable state restore fast", restoreDurableStorageSnapshot);
    var fastStateLoaded = loadState();
    runInitStep("recording UI fast", syncRecordingUI);
    runInitStep("fog UI fast", syncFogButton);
    runInitStep("language UI fast", function() { applyUILang(currentLang); });
    runInitStep("statistics fast", updateStats);
    runInitStep("map render fast", function() { render(); scheduleRender(); map.invalidateSize(); });
    
    // Heavy recovery continues after the first usable frame. It merges IndexedDB
    // and native background GPS points without forcing the user to stare at a
    // frozen map. initializePersistentJourneyState() remains the source of truth.
    await new Promise(function(resolve) { setTimeout(resolve, 0); });
    await runInitStep("saved journey", initializePersistentJourneyState);
    runInitStep("cloud sync", function() { return window.GiloaCloud && window.GiloaCloud.init ? window.GiloaCloud.init() : null; });
    if (isNativeRouteTrackingActive()) {
        restoreNativeRecordingSession();
        isRecording = true;
        trackingRequested = true;
        startAutoRecordingTimer();
        startNativeRouteTracking();
    }
    runInitStep("stay bonus", loadBonusState);
    runInitStep("collection", function() {
        loadCollection();
        scheduleRegionStayRecalculation();});
    runInitStep("memory markers", renderStoredMarkers);
    runInitStep("saved places", renderSavedSpecialPlacePins);
    runInitStep("photo migration", function() { return migratePhotosToThumbOnly().finally(function() { runInitStep("photo markers", renderStoredPhotoMarkers); }); });
    runInitStep("statistics", updateStats);
    runInitStep("memory list", updateMemoryList);
    runInitStep("recording UI", syncRecordingUI);
    runInitStep("fog UI", syncFogButton);
    runInitStep("language UI", function() { applyUILang(currentLang); });
    runInitStep("RPG UI", function() { updateRpgGrowthUI(loadRpgGrowth()); });
    setTimeout(function() { runInitStep("map render", function() { render(); scheduleRender(); }); }, 100);
    runInitStep("GPX", initGpxDial);
    runInitStep("HUD", initHudTapTargets);
    // The first-run state machine lives in tutorial.js. Legacy guide/prologue
    // initializers remain inert for backward-compatible function references.
    // startFirstLaunchExperience()만 유일하게 runInitStep 보호 없이 호출되고 있었다.
    // 이 함수 내부(온보딩 표시/언어 텍스트 렌더링 등)에서 예외가 나면 다른 init 단계처럼
    // 조용히 넘어가지 못하고 init() 전체가 여기서 멈춰버려, 이후의 위치 권한 요청/자동
    // 기록 시작(6867~6870줄)까지 실행되지 않는 문제가 있었다. 다른 모든 init 단계와
    // 동일하게 runInitStep으로 감싸 예외를 흡수하고 나머지 init이 계속 진행되게 한다.
    runInitStep("startup entry", beginGiloaStartupEntry);
    runInitStep("atmosphere", updateTimeAtmosphere);
    setInterval(updateTimeAtmosphere, 10 * 60 * 1000);
    var specialEditor = document.getElementById("special-place-editor");
    if (specialEditor) specialEditor.addEventListener("click", function(e) { if (e.target === specialEditor) closeSpecialPlaceEditor(); });
    document.addEventListener("keydown", function(e) {
        if (e.key === "Escape" && specialEditor && specialEditor.classList.contains("show")) closeSpecialPlaceEditor();
    });

if (
    window.GiloaBoot &&
    typeof window.GiloaBoot.markInteractive === "function"
) {
    window.GiloaBoot.markInteractive();
}
    document.documentElement.dataset.giloaReady = "true";
    window.dispatchEvent(new Event("giloa:ready"));
}
window.addEventListener("pagehide", function() {
    persistState();
});
var giloaPersistentStateReady = false;
var giloaLastHiddenAt = 0;
var giloaResumeRefreshTimer = null;
var giloaResumeMergePromise = null;
function performRefreshAfterAppResume() {
    // Android/WebView can return with a stale/black compositor surface.
    requestAnimationFrame(function() {
        try {
            map.invalidateSize({ pan:false, animate:false });
        } catch (_) {}

        scheduleRender();

        requestAnimationFrame(function() {
            try {
                map.invalidateSize({ pan:false, animate:false });
            } catch (_) {}

            scheduleRender();
        });
    });

    if (giloaPersistentStateReady) {
        /*
         * 앱이 잠금 화면이나 다른 앱에서 돌아왔을 때
         * 네이티브 서비스가 사용하던 동일한 기록 세션을 먼저 복원한다.
         */
        if (isNativeRouteTrackingActive()) {
            restoreNativeRecordingSession();
        }

        if (giloaResumeMergePromise) return;
        giloaResumeMergePromise = consumeNativeRouteTrackingPoints().then(function(result) {
            if (!result || !result.count) return;

            compactPathData();
            updateStats();
            scheduleRender();
        }).catch(function(error) {
            console.warn("Resume route merge failed", error);
        }).finally(function() {
            giloaResumeMergePromise = null;
        });
    }
}
function refreshAfterAppResume() {
    // pageshow, focus and visibilitychange normally arrive together. Coalesce
    // them so route recovery and map repaint run once instead of racing 2–3 times.
    if (giloaResumeRefreshTimer !== null) return;
    giloaResumeRefreshTimer = setTimeout(function() {
        giloaResumeRefreshTimer = null;
        performRefreshAfterAppResume();
    }, 120);
}

window.addEventListener("giloa:app-resume", refreshAfterAppResume);

window.addEventListener("pageshow", function() { refreshAfterAppResume(); });
window.addEventListener("focus", function() { if (document.visibilityState === "visible") refreshAfterAppResume(); });
document.addEventListener("visibilitychange", function() {
    if (document.visibilityState === "visible") refreshAfterAppResume();
    if (document.visibilityState === "hidden") {
    giloaLastHiddenAt = Date.now();
    persistState();
}
});
setInterval(function() {
    if (!giloaPersistentStateReady || !persistentStateDirty) return;
    compactPathData();
    persistState();
}, CHECKPOINT_INTERVAL_MS);
window.addEventListener("online", function() {
    if (typeof scheduleTourFetch === "function") scheduleTourFetch({ immediate: true });
    if (mapLayerSettings.restroom && typeof fetchRestroomsForCurrentArea === "function") fetchRestroomsForCurrentArea({ force: true });
    if (mapLayerSettings.library && typeof fetchLibraries === "function") fetchLibraries();
});
(function scheduleGiloaInitialization() {
    var domReady = document.readyState !== "loading";
    var mapReady = false;
    var started = false;
    function maybeStart() {
        if (started || !domReady || !mapReady) return;
        started = true;
        // DOMContentLoaded fires only after every deferred script in index.html
        // has run, so tutorial and auxiliary modules are now consistently ready.
        setTimeout(function() {
            init().catch(function(error) {
                console.error("GILOA initialization failed", error);
                if (window.GiloaBoot && typeof window.GiloaBoot.hide === "function") window.GiloaBoot.hide();
            });
        }, 0);
    }
    if (!domReady) document.addEventListener("DOMContentLoaded", function() { domReady = true; maybeStart(); }, { once:true });
    try {
        map.whenReady(function() { mapReady = true; maybeStart(); });
    } catch (error) {
        console.error("Map readiness check failed", error);
        mapReady = true;
    }
    maybeStart();
})();

// TourAPI 愿愿묕옙? 異붿쿇

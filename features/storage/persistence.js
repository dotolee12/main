var persistentStateDirty = false;
var lastCheckpointAt = 0;
function markJourneyStateDirty() { persistentStateDirty = true; }
function scheduleSave(options) {
    options = options || {};
    markJourneyStateDirty();
    if (options.immediate) {
        if (saveTimer !== null) { clearTimeout(saveTimer); saveTimer = null; }
        if (!giloaPersistentStateReady) return;
        compactPathData();
        persistState();
        return;
    }
    if (saveTimer !== null) return;
    var delay = Math.max(SAVE_DELAY_MS, CHECKPOINT_INTERVAL_MS - Math.max(0, Date.now() - lastCheckpointAt));
    saveTimer = setTimeout(function() {
        saveTimer = null;
        if (!persistentStateDirty || !giloaPersistentStateReady) return;
        compactPathData();
        persistState();
    }, delay);
}
function getLocalStorageKey() { return STORAGE_KEY; }
function dataUrlToBlob(dataUrl) {
    var parts = String(dataUrl || "").split(",");
    if (parts.length < 2) return new Blob([], { type: "image/jpeg" });
    var match = parts[0].match(/data:([^;]+);base64/i);
    var mime = match ? match[1] : "image/jpeg";
    var binary = atob(parts[1]);
    var len = binary.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
}
function blobToDataUrl(blob) {
    return new Promise(function(resolve, reject) {
        if (!blob) { reject(new Error("Missing photo blob")); return; }
        var reader = new FileReader();
        reader.onload = function() { resolve(String(reader.result || "")); };
        reader.onerror = function() { reject(reader.error || new Error("Could not read photo")); };
        reader.readAsDataURL(blob);
    });
}
function getPhotoStoragePath(photoId, kind) {
    return "giloaUsers/" + encodeURIComponent(currentUserId) + "/photos/" + encodeURIComponent(photoId) + "/" + kind + ".jpg";
}
async function fetchBlobFromUrl(url) {
    if (!url) return null;
    try {
        var response = await fetch(url);
        if (response.ok) return await response.blob();
    } catch (_) { }
    var viaXhr = await xhrBlobFromUrl(url);
    if (viaXhr) return viaXhr;
    throw new Error(earlyUiText("photoFileMissing"));
}
async function uploadPhotoRemote(data, options) {
    return Promise.resolve();
}
function deleteRemotePhotoFiles(photo) {
    return;
}
function normalizeUserId(value) { return String(value || "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 64); }
function userIdToAuthEmail(userId) { return normalizeUserId(userId) + "@giloa.app"; }
function authEmailToUserId(email) {
    var value = String(email || "").toLowerCase();
    var suffix = "@giloa.app";
    return value.endsWith(suffix) ? normalizeUserId(value.slice(0, -suffix.length)) : "";
}
function getAuthErrorMessage(error) {
    var code = error && error.code;
    if (code === "auth/wrong-password" || code === "auth/invalid-credential") return earlyUiText("authPassword");
    if (code === "auth/invalid-email") return earlyUiText("authId");
    if (code === "auth/network-request-failed") return earlyUiText("authNetwork");
    if (code === "auth/weak-password") return earlyUiText("authWeak");
    if (code === "auth/operation-not-allowed") return earlyUiText("authUnavailable");
    if (code === "auth/too-many-requests") return earlyUiText("authTooMany");
    return earlyUiText("authFailed");
}
function getAuthDebugMessage(error) {
    var code = error && error.code ? error.code : "unknown";
    var message = error && error.message ? error.message : String(error || "");
    return getAuthErrorMessage(error) + "\n\n" + earlyUiText("errorCode") + ": " + code + "\n" + message;
}
async function signInWithGiloaId(userId, password) {
    currentUserId = normalizeUserId(userId) || "local";
    localStorage.setItem(USER_ID_KEY, currentUserId);
    syncUserIdUI();
}
function waitForAuthReady() {
    return Promise.resolve(null);
}
function askUserId(defaultValue) {
    return new Promise(function(resolve) {
        var modal = document.getElementById("user-id-modal");
        var input = document.getElementById("user-id-input");
        var passwordInput = document.getElementById("user-password-input");
        var errorEl = document.getElementById("user-id-error");
        var submit = document.getElementById("user-id-submit");
        if (!modal || !input || !passwordInput || !submit) {
            resolve({ userId: defaultValue || "", password: "" });
            return;
        }
        input.value = defaultValue || "";
        passwordInput.value = "";
        passwordInput.style.display = "none";
        if (errorEl) errorEl.textContent = "";
        modal.classList.add("show");
        setTimeout(function() { input.focus(); input.select(); }, 60);
        function done() {
            var value = normalizeUserId(input.value);
            if (!value) {
                input.focus();
                return;
            }
            submit.removeEventListener("click", done);
            input.removeEventListener("keydown", onKeyDown);
            passwordInput.removeEventListener("keydown", onKeyDown);
            modal.classList.remove("show");
            resolve({ userId: value, password: "" });
        }
        function onKeyDown(e) {
            if (e.key === "Enter") done();
        }
        submit.addEventListener("click", done);
        input.addEventListener("keydown", onKeyDown);
        passwordInput.addEventListener("keydown", onKeyDown);
    });
}
async function ensureUserId() {
    currentUserId = "local";
}
function syncUserIdUI() {
    var idEl = document.getElementById("hud-user-id");
    if (idEl) idEl.textContent = currentUserId || earlyUiText("noId");
}
async function changeUserId() {
    var credentials = await askUserId(currentUserId || "");
    var nextId = normalizeUserId(credentials.userId);
    if (!nextId || nextId === currentUserId) return;
    try {
        await signInWithGiloaId(nextId, credentials.password);
    } catch (error) {
        alert(getAuthDebugMessage(error));
        return;
    }
    currentUserId = nextId;
    localStorage.setItem(USER_ID_KEY, currentUserId);
    syncUserIdUI();
    pathCoordinates = [];
    rawGpsPoints = [];
    memories = [];
    specialPlacePins = [];
    photos = [];
    deletedJourneyRecords = { memories: [], photos: [] };
    totalDistance = 0;
    memoryMarkers.forEach(function(marker) { map.removeLayer(marker); });
    memoryMarkers.clear();
    specialPlaceMarkers.forEach(function(marker) { map.removeLayer(marker); });
    specialPlaceMarkers.clear();
    closeSpecialPlacePopup();
    if (photoClusterGroup) { photoClusterGroup.clearLayers(); clearPhotoMarkerIndex(); }
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
        deletedJourneyRecords: mergeJourneyDeletionRecords([deletedJourneyRecords]),
        rawGpsPoints: rawGpsPoints.map(function(p) { return { id:p.id, lat:p.lat, lng:p.lng, startTime:p.startTime, endTime:p.endTime, timestamp:Number(p.timestamp || p.startTime), visits:p.visits || 1, accuracy:Number(p.accuracy), recordingSessionId:typeof p.recordingSessionId === "string" ? p.recordingSessionId : null, source:typeof p.source === "string" ? p.source : null }; }),
        pathCoordinates: pathCoordinates.map(function(p) { return { lat: p.lat, lng: p.lng, startTime: p.startTime, endTime: p.endTime, timestamp: Number(p.timestamp || p.startTime), visits: p.visits || 1, accuracy: p.accuracy == null ? null : (isFinite(p.accuracy) ? Number(p.accuracy) : null), recordingSessionId:typeof p.recordingSessionId === "string" ? p.recordingSessionId : null, source:typeof p.source === "string" ? p.source : null }; }),
        memories: memories.map(function(m) { return { id: m.id, lat: m.lat, lng: m.lng, name: m.name, time: m.time, dateString: m.dateString, timeString: m.timeString }; }),
        specialPlacePins: specialPlacePins.map(function(pin) { return { id: pin.id, latitude: pin.latitude, longitude: pin.longitude, note: pin.note, createdAt: pin.createdAt }; }),
        photos: photos.map(function(p) {
            var hasLocation = isValidPhotoCoordinate(p.lat, p.lng);
            return {
                id: p.id,
                lat: hasLocation ? Number(p.lat) : null,
                lng: hasLocation ? Number(p.lng) : null,
                time: p.time,
                dateString: p.dateString,
                timeString: p.timeString,
                memo: typeof p.memo === "string" ? p.memo : "",
                emotion: typeof p.emotion === "string" ? p.emotion : "",
                missionId: typeof p.missionId === "string" ? p.missionId : "",
                placeId: typeof p.placeId === "string" ? p.placeId : "",
                sourceUri: typeof p.sourceUri === "string" ? p.sourceUri : "",
                sourceWebPath: typeof p.sourceWebPath === "string" ? p.sourceWebPath : "",
                sourceType: typeof p.sourceType === "string" ? p.sourceType : "",
                locationSource: normalizePhotoLocationSource(p.locationSource, hasLocation),
                locationAccuracy: typeof p.locationAccuracy === "number" && isFinite(p.locationAccuracy) ? Number(p.locationAccuracy) : null,
                heading: isFinite(p.heading) ? normalizeHeading(p.heading) : null,
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
        totalDistance: totalDistance,
        recordingSessionId: isRecording && typeof recordingSessionId === "string" ? recordingSessionId : null,
        recordingSessionStartedAt: isRecording && isFinite(recordingSessionStartedAt) ? Number(recordingSessionStartedAt) : 0,
        recordingSessionActive: !!isRecording
    };
}
function isValidJourneyPoint(point, requireAccuracy) {
    if (!point || !isFinite(point.lat) || !isFinite(point.lng)) return false;
    var lat = Number(point.lat), lng = Number(point.lng);
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
    var timestamp = Number(point.timestamp || point.startTime);
    if (!isFinite(timestamp) || timestamp <= 0) return false;
    if (requireAccuracy && (!isFinite(point.accuracy) || Number(point.accuracy) < 0 || Number(point.accuracy) > MAX_ACCURACY_M)) return false;
    return true;
}
function journeyPointKey(point) {
    return Number(point.timestamp || point.startTime) + ":" + Number(point.lat).toFixed(6) + ":" + Number(point.lng).toFixed(6);
}
function mergeJourneyPointLists(lists, requireAccuracy) {
    var merged = [];
    var seen = {};
    (lists || []).forEach(function(list) {
        (Array.isArray(list) ? list : []).forEach(function(point) {
            if (!isValidJourneyPoint(point, requireAccuracy)) return;
            var timestamp = Number(point.timestamp || point.startTime);
            var key = journeyPointKey(point);
            if (seen[key]) return;
            seen[key] = true;
            merged.push(Object.assign({}, point, {
                lat:Number(point.lat), lng:Number(point.lng),
                startTime:Number(point.startTime || timestamp), endTime:Number(point.endTime || timestamp), timestamp:timestamp,
                visits:isFinite(point.visits) ? Number(point.visits) : 1,
                accuracy:isFinite(point.accuracy) ? Number(point.accuracy) : null,
                recordingSessionId:typeof point.recordingSessionId === "string" && point.recordingSessionId ? point.recordingSessionId : null,
                source:typeof point.source === "string" && point.source ? point.source : null
            }));
        });
    });
    merged.sort(function(a, b) { return a.timestamp - b.timestamp; });
    return merged;
}
function mergeJourneyEntities(lists) {
    var result = [];
    var seen = {};
    (lists || []).forEach(function(list) {
        (Array.isArray(list) ? list : []).forEach(function(item) {
            if (!item || typeof item !== "object") return;
            var key = String(item.id || item.visitKey || item.createdAt || item.time || JSON.stringify(item));
            if (seen[key]) return;
            seen[key] = true;
            result.push(item);
        });
    });
    return result;
}
function journeyPayloadPointCount(payload) {
    if (!payload || typeof payload !== "object") return 0;
    return Math.max(Array.isArray(payload.rawGpsPoints) ? payload.rawGpsPoints.length : 0, Array.isArray(payload.pathCoordinates) ? payload.pathCoordinates.length : 0);
}
function journeyPayloadRecordCounts(payload) {
    payload = payload || {};
    return {
        points:journeyPayloadPointCount(payload),
        memories:Array.isArray(payload.memories) ? payload.memories.length : 0,
        photos:Array.isArray(payload.photos) ? payload.photos.length : 0,
        specialPlaces:Array.isArray(payload.specialPlacePins) ? payload.specialPlacePins.length : 0
    };
}
function mergeJourneyDeletionRecords(records) {
    var merged = { memories: [], photos: [] };
    Object.keys(merged).forEach(function(kind) {
        var seen = new Set();
        (records || []).forEach(function(record) {
            var ids = record && Array.isArray(record[kind]) ? record[kind] : [];
            ids.forEach(function(id) {
                if (typeof id !== "string" || !id || seen.has(id)) return;
                seen.add(id); merged[kind].push(id);
            });
        });
    });
    return merged;
}
function journeyEntityId(item, kind) {
    if (!item) return null;
    // Match applyStatePayload's legacy memory ID migration before comparison.
    if (kind === "memories") return typeof item.id === "string" ? item.id : String(item.time);
    return item.id == null ? null : String(item.id);
}
function filterDeletedJourneyEntities(items, ids, kind) {
    var deleted = new Set(ids || []);
    return (Array.isArray(items) ? items : []).filter(function(item) {
        return !deleted.has(journeyEntityId(item, kind));
    });
}
function commitJourneyDeletion(kind, id) {
    if (kind !== "memories" && kind !== "photos") return false;
    var before = kind === "photos" ? photos : memories;
    if (!before.some(function(item) { return item.id === id; })) return false;
    var beforeDeletion = buildStatePayload();
    var previousDeletions = deletedJourneyRecords;
    var previousPending = safeStorageGet(STORAGE_TEMP_KEY);
    deletedJourneyRecords = mergeJourneyDeletionRecords([previousDeletions]);
    deletedJourneyRecords[kind].push(String(id));
    var remaining = before.filter(function(item) { return item.id !== id; });
    if (kind === "photos") photos = remaining; else memories = remaining;
    // Commit the specific deletion before touching any original image or marker.
    if (persistState({ beforeExplicitDeletion: beforeDeletion })) return true;
    if (kind === "photos") photos = before; else memories = before;
    deletedJourneyRecords = previousDeletions;
    if (safeStorageGet(STORAGE_TEMP_KEY) !== previousPending) {
        safeStorageSet(STORAGE_TEMP_KEY, previousPending || "");
    }
    alert((UI_TEXT[currentLang] || UI_TEXT.ko).journey_delete_save_failed);
    return false;
}
function hasJourneyRecordRegression(previous, next) {
    var before = journeyPayloadRecordCounts(previous);
    var after = journeyPayloadRecordCounts(next);
    if (after.points < before.points || after.specialPlaces < before.specialPlaces) return true;
    var oldRaw = Array.isArray(previous.rawGpsPoints) ? previous.rawGpsPoints : [];
    var newRaw = Array.isArray(next.rawGpsPoints) ? next.rawGpsPoints : [];
    if (newRaw.length < oldRaw.length) {
        var rawKeys = new Set(newRaw.filter(function(point) { return isValidJourneyPoint(point, true); }).map(journeyPointKey));
        if (oldRaw.some(function(point) { return isValidJourneyPoint(point, true) && !rawKeys.has(journeyPointKey(point)); })) return true;
    }
    var deletions = mergeJourneyDeletionRecords([next && next.deletedJourneyRecords]);
    return ["memories", "photos"].some(function(kind) {
        var oldItems = Array.isArray(previous[kind]) ? previous[kind] : [];
        var newItems = Array.isArray(next[kind]) ? next[kind] : [];
        var remaining = new Set(newItems.map(function(item) { return journeyEntityId(item, kind); }));
        var deleted = new Set(deletions[kind]);
        var intentional = 0;
        var unexpected = oldItems.some(function(item) {
            var id = journeyEntityId(item, kind);
            if (id === null || remaining.has(id)) return false;
            if (!deleted.has(id)) return true;
            intentional += 1;
            return false;
        });
        return unexpected || after[kind] < before[kind] - intentional;
    });
}
function mergeJourneyStatePayloads(payloads) {
    var valid = (payloads || []).filter(function(payload) { return payload && typeof payload === "object" && !Array.isArray(payload); });
    if (!valid.length) return null;
    valid.sort(function(a, b) {
        var countDiff = journeyPayloadPointCount(b) - journeyPayloadPointCount(a);
        if (countDiff) return countDiff;
        return (Number(b.totalDistance) || 0) - (Number(a.totalDistance) || 0);
    });
    var merged = Object.assign({}, valid[0]);
    merged.pathCoordinates = mergeJourneyPointLists(valid.map(function(p) { return p.pathCoordinates; }), false);
    merged.rawGpsPoints = mergeJourneyPointLists(valid.map(function(p) { return p.rawGpsPoints; }), true);
    merged.memories = mergeJourneyEntities(valid.map(function(p) { return p.memories; }));
    merged.specialPlacePins = mergeJourneyEntities(valid.map(function(p) { return p.specialPlacePins; }));
    merged.photos = mergeJourneyEntities(valid.map(function(p) { return p.photos; }));
    merged.deletedJourneyRecords = mergeJourneyDeletionRecords(valid.map(function(p) { return p.deletedJourneyRecords; }));
    merged.memories = filterDeletedJourneyEntities(merged.memories, merged.deletedJourneyRecords.memories, "memories");
    merged.photos = filterDeletedJourneyEntities(merged.photos, merged.deletedJourneyRecords.photos, "photos");
    merged.totalDistance = valid.reduce(function(maximum, payload) {
        var value = Number(payload.totalDistance);
        return isFinite(value) && value >= 0 ? Math.max(maximum, value) : maximum;
    }, 0);
    return merged;
}
function applyStatePayload(saved) {
    if (!saved || typeof saved !== "object") return false;
    deletedJourneyRecords = mergeJourneyDeletionRecords([saved.deletedJourneyRecords]);
    saved = Object.assign({}, saved);
    if (Array.isArray(saved.memories)) saved.memories = filterDeletedJourneyEntities(saved.memories, deletedJourneyRecords.memories, "memories");
    if (Array.isArray(saved.photos)) saved.photos = filterDeletedJourneyEntities(saved.photos, deletedJourneyRecords.photos, "photos");
    if (Array.isArray(saved.pathCoordinates)) {
        pathCoordinates = saved.pathCoordinates.filter(function(p) { return isFinite(p.lat) && isFinite(p.lng) && isFinite(p.startTime) && isFinite(p.endTime); }).map(function(p) { return { lat: Number(p.lat), lng: Number(p.lng), startTime: Number(p.startTime), endTime: Number(p.endTime), timestamp: Number(p.timestamp || p.startTime), visits: isFinite(p.visits) ? Number(p.visits) : 1, accuracy: p.accuracy == null ? null : (isFinite(p.accuracy) ? Number(p.accuracy) : null), recordingSessionId:typeof p.recordingSessionId === "string" && p.recordingSessionId ? p.recordingSessionId : null, source:typeof p.source === "string" && p.source ? p.source : null }; });
    }
    rawGpsPoints = mergeJourneyPointLists([saved.rawGpsPoints], true).map(function(p) { p.id = String(p.id || (p.timestamp + ":" + p.lat.toFixed(7) + ":" + p.lng.toFixed(7))); return p; });
    if (saved.recordingSessionActive === true && typeof saved.recordingSessionId === "string" && saved.recordingSessionId) recordingSessionId = saved.recordingSessionId;
    if (saved.recordingSessionActive === true && isFinite(saved.recordingSessionStartedAt) && Number(saved.recordingSessionStartedAt) > 0) recordingSessionStartedAt = Number(saved.recordingSessionStartedAt);
    if (Array.isArray(saved.memories)) {
        memories = saved.memories.filter(function(m) { return isFinite(m.lat) && isFinite(m.lng) && typeof m.name === "string"; }).map(function(m) { return { id: typeof m.id === "string" ? m.id : String(m.time), lat: m.lat, lng: m.lng, name: m.name, time: m.time, dateString: m.dateString, timeString: typeof m.timeString === "string" ? m.timeString : new Date(m.time).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }) }; });
    }
    if (Array.isArray(saved.specialPlacePins)) specialPlacePins = saved.specialPlacePins.filter(function(pin) {
        return pin && typeof pin.id === "string" && isFinite(pin.latitude) && isFinite(pin.longitude) &&
            typeof pin.note === "string" && pin.note.trim() && !isNaN(Date.parse(pin.createdAt));
    }).map(function(pin) {
        return { id: pin.id, latitude: Number(pin.latitude), longitude: Number(pin.longitude), note: pin.note, createdAt: pin.createdAt };
    });
    var calculatedDistance = calculateRecordedDistance(pathCoordinates, 0);
    var savedDistance = Number(saved.totalDistance);
    totalDistance = isFinite(savedDistance) && savedDistance >= 0 ? Math.max(savedDistance, calculatedDistance) : calculatedDistance;
    if (Array.isArray(saved.photos)) {
        photos = saved.photos.filter(function(p) { return p && p.id; }).map(function(p) {
            var hasLocation = isValidPhotoCoordinate(p.lat, p.lng);
            return {
                id: p.id,
                lat: hasLocation ? Number(p.lat) : null,
                lng: hasLocation ? Number(p.lng) : null,
                time: p.time,
                dateString: p.dateString,
                timeString: p.timeString,
                memo: typeof p.memo === "string" ? p.memo : "",
                emotion: typeof p.emotion === "string" ? p.emotion : "",
                missionId: typeof p.missionId === "string" ? p.missionId : "",
                placeId: typeof p.placeId === "string" ? p.placeId : "",
                sourceUri: typeof p.sourceUri === "string" ? p.sourceUri : "",
                sourceWebPath: typeof p.sourceWebPath === "string" ? p.sourceWebPath : "",
                sourceType: typeof p.sourceType === "string" ? p.sourceType : "",
                locationSource: normalizePhotoLocationSource(p.locationSource, hasLocation),
                locationAccuracy: typeof p.locationAccuracy === "number" && isFinite(p.locationAccuracy) ? Number(p.locationAccuracy) : null,
                heading: isFinite(p.heading) ? normalizeHeading(p.heading) : null,
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
    compactPathData();
    scheduleCompletedOfficialRouteRefresh();
    return true;
}
function safeStorageGet(key) {
    try { return localStorage.getItem(key); }
    catch (error) { console.warn("Local storage read failed", error && error.name); return null; }
}
function safeStorageSet(key, value) {
    try { localStorage.setItem(key, value); return true; }
    catch (error) { console.warn("Local storage write failed", error && error.name); return false; }
}
function storedValueRichness(raw) {
    if (!raw || typeof raw !== "string") return 0;
    try {
        var value = JSON.parse(raw);
        function score(item) {
            if (Array.isArray(item)) return item.length + item.reduce(function(total, child) { return total + score(child); }, 0);
            if (item && typeof item === "object") return Object.keys(item).reduce(function(total, key) { return total + score(item[key]); }, 0);
            if (typeof item === "number") return isFinite(item) && item > 0 ? item : 0;
            return typeof item === "string" && item ? 1 : 0;
        }
        return score(value);
    } catch (_) { return 0; }
}
function getDurableStorageKeys() {
    var exact = [
        STORAGE_KEY, STORAGE_BACKUP_KEY, STORAGE_CORRUPT_KEY, GPX_SAVES_KEY,
        TUTORIAL_DONE_KEY, INTRO_STORY_SEEN_KEY, LANGUAGE_SELECTED_KEY,
        LANGUAGE_PREFERENCE_KEY, FIRST_MEETING_DONE_KEY, FOG_ENABLED_KEY,
        DAILY_TASK_KEY, RPG_GROWTH_KEY, COLLECTION_KEY, "giloa-stay-bonus", GILOA_UPDATE_SEEN_KEY,
        "giloa-prelaunch-tester-2026-v1"
    ];
    var keys = [];
    exact.forEach(function(key) { if (key && keys.indexOf(key) < 0) keys.push(key); });
    for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (key && /^giloa-(?:daily-growth|region-stay|user)/.test(key) && keys.indexOf(key) < 0) keys.push(key);
    }
    return keys;
}
function buildDurableStorageSnapshot() {
    var values = {};
    getDurableStorageKeys().forEach(function(key) {
        var value = safeStorageGet(key);
        if (value !== null) values[key] = value;
    });
    return JSON.stringify({ version:1, savedAt:Date.now(), values:values });
}
function persistDurableStorageSnapshot() {
    var bridge = window.GiloaPhotoBridge;
    if (!bridge || typeof bridge.saveDurableState !== "function") return false;
    try { return bridge.saveDurableState(buildDurableStorageSnapshot()) === true; }
    catch (error) { console.warn("Durable state backup failed", error && error.message); return false; }
}
function restoreDurableStorageSnapshot() {
    var bridge = window.GiloaPhotoBridge;
    if (!bridge || typeof bridge.loadDurableState !== "function") return false;
    try {
        var raw = bridge.loadDurableState();
        if (!raw) return false;
        var snapshot = JSON.parse(raw);
        var values = snapshot && snapshot.values;
        if (!values || typeof values !== "object" || Array.isArray(values)) return false;
        var restored = false;
        Object.keys(values).forEach(function(key) {
            if (typeof values[key] !== "string") return;
            var current = safeStorageGet(key);
            // The normal case is an exact mirror of localStorage. Avoid parsing
            // and merging the same multi-megabyte journey JSON on every launch.
            if (current === values[key]) return;
            if (key === STORAGE_KEY || key === STORAGE_BACKUP_KEY) {
                var candidates = [];
                [current, values[key]].forEach(function(rawState) {
                    try { var parsed = parseStoredState(rawState); if (parsed) candidates.push(parsed); } catch (_) { }
                });
                var merged = mergeJourneyStatePayloads(candidates);
                if (merged && safeStorageSet(key, JSON.stringify(merged))) restored = true;
                return;
            }
            if (/^(?:giloa-rpg-growth|giloa-collection|giloa-stay-bonus|giloa-daily-growth|giloa-region-stay)/.test(key) && storedValueRichness(values[key]) > storedValueRichness(current)) {
                if (safeStorageSet(key, values[key])) restored = true;
                return;
            }
            if (current === null && safeStorageSet(key, values[key])) restored = true;
        });
        return restored;
    } catch (error) {
        console.warn("Durable state restore failed", error && error.message);
        return false;
    }
}
function parseStoredState(raw) {
    if (!raw || typeof raw !== "string") return null;
    var parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Invalid saved state");
    return parsed;
}
function persistState(options) {
    options = options || {};
    if (!giloaPersistentStateReady && !options.restoreCommit) {
        console.warn("[GILOA CHECKPOINT] blocked before restore completed");
        return false;
    }
    try {
        scheduleRegionStayRecalculation();
        var payload = buildStatePayload();
        var serialized = JSON.stringify(payload);
        var current = safeStorageGet(getLocalStorageKey());
        var currentPayload = null;
        try { currentPayload = parseStoredState(current); } catch (_) { }
        if (!options.userReset && currentPayload && hasJourneyRecordRegression(currentPayload, payload)) {
            console.error("[GILOA CHECKPOINT] blocked record-count regression", journeyPayloadRecordCounts(currentPayload), journeyPayloadRecordCounts(payload));
            return false;
        }
        // An uncommitted deletion must not enter recovery through TEMP. Until
        // PRIMARY commits, retain the pre-deletion checkpoint, including originals.
        var pendingPayload = options.beforeExplicitDeletion || payload;
        var pendingSerialized = options.beforeExplicitDeletion ? JSON.stringify(pendingPayload) : serialized;
        if (!safeStorageSet(STORAGE_TEMP_KEY, pendingSerialized)) throw new Error("Temporary storage write rejected");
        var verified = parseStoredState(safeStorageGet(STORAGE_TEMP_KEY));
        if (!verified || journeyPayloadPointCount(verified) !== journeyPayloadPointCount(pendingPayload)) throw new Error("Temporary storage verification failed");
        if (current && !safeStorageSet(STORAGE_BACKUP_KEY, current)) throw new Error("Backup storage write rejected");
        if (!safeStorageSet(getLocalStorageKey(), serialized)) throw new Error("Storage write rejected");
        safeStorageSet(STORAGE_TEMP_KEY, "");
        var durableSaved = persistDurableStorageSnapshot();
        persistentStateDirty = false;
        lastCheckpointAt = Date.now();
        if (window.GiloaCloud && typeof window.GiloaCloud.scheduleSync === "function") window.GiloaCloud.scheduleSync();
        if (GILOA_PERSISTENCE_DEBUG) console.log("[GILOA CHECKPOINT] " + JSON.stringify({ path:pathCoordinates.length, rawGps:rawGpsPoints.length, distance:totalDistance, photos:photos.length, timestamp:lastCheckpointAt, durable:durableSaved }));
        return true;
    } catch (e) {
        console.error("저장 실패", e);
        if (e && e.name === "QuotaExceededError") alert(earlyUiText("storageFull"));
        return false;
    }
}

function loadStateLegacy() {
    try {
        var raw = localStorage.getItem(getLocalStorageKey()) || localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        applyStatePayload(JSON.parse(raw));
    } catch (e) {
        console.error("복원 실패", e);
    }
}

function loadState() {
    var primary = safeStorageGet(getLocalStorageKey()) || safeStorageGet(STORAGE_KEY);
    var backup = safeStorageGet(STORAGE_BACKUP_KEY);
    var pending = safeStorageGet(STORAGE_TEMP_KEY);
    var candidates = [];
    [primary, backup, pending].forEach(function(raw, index) {
        try { var parsed = parseStoredState(raw); if (parsed) candidates.push(parsed); }
        catch (error) {
            if (index === 0 && raw) {
                console.warn("Primary state was damaged; preserving it and trying recovery", error && error.message);
                safeStorageSet(STORAGE_CORRUPT_KEY, raw.slice(0, 200000));
            }
        }
    });
    var merged = mergeJourneyStatePayloads(candidates);
    if (!merged || !applyStatePayload(merged)) {
        if (candidates.length) console.error("State recovery failed: no valid journey state");
        else if (GILOA_PERSISTENCE_DEBUG) console.log("[GILOA RESTORE] no previous journey state");
        return false;
    }
    return true;
}


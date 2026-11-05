function togglePhotoMenu() {
    var menu = document.getElementById("photo-menu"); var overlay = document.getElementById("photo-menu-overlay");
    if (!menu || !overlay) { triggerGallery(); return; }
    menu.classList.toggle("open"); overlay.classList.toggle("show", menu.classList.contains("open"));
}
function closePhotoMenu() { document.getElementById("photo-menu").classList.remove("open"); document.getElementById("photo-menu-overlay").classList.remove("show"); }

function requestPhotoLocationPermission() {
    var bridge = window.GiloaPhotoBridge;
    if (!bridge || typeof bridge.hasPhotoLocationPermission !== "function" || typeof bridge.requestPhotoLocationPermission !== "function") return Promise.resolve(true);
    try { if (bridge.hasPhotoLocationPermission()) return Promise.resolve(true); }
    catch (_) { return Promise.resolve(false); }
    if (photoLocationPermissionPromise) return photoLocationPermissionPromise;
    photoLocationPermissionPromise = new Promise(function(resolve) {
        var settled = false;
        var finish = function(granted) {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            window.onGiloaPhotoLocationPermissionResult = null;
            photoLocationPermissionPromise = null;
            resolve(!!granted);
        };
        window.onGiloaPhotoLocationPermissionResult = finish;
        var timer = setTimeout(function() {
            var granted = false;
            try { granted = bridge.hasPhotoLocationPermission(); } catch (_) {}
            finish(granted);
        }, 15000);
        try { bridge.requestPhotoLocationPermission(); }
        catch (_) { finish(false); }
    });
    return photoLocationPermissionPromise;
}

function promiseWithTimeout(promise, timeoutMs, label) {
    return new Promise(function(resolve, reject) {
        var settled = false;
        var timer = setTimeout(function() {
            if (settled) return;
            settled = true;
            reject(new Error((label || "Operation") + " timed out"));
        }, timeoutMs);
        Promise.resolve(promise).then(function(value) {
            if (settled) return;
            settled = true; clearTimeout(timer); resolve(value);
        }, function(error) {
            if (settled) return;
            settled = true; clearTimeout(timer); reject(error);
        });
    });
}

function isValidPhotoCoordinate(lat, lng) {
    lat = Number(lat); lng = Number(lng);
    return isFinite(lat) && isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 && !(lat === 0 && lng === 0);
}
var PHOTO_PLACEHOLDER_THUMB = "data:image/svg+xml;charset=utf-8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="12" fill="#1a2035"/><rect x="0.5" y="0.5" width="95" height="95" rx="11.5" fill="none" stroke="#4db8ff" stroke-opacity="0.45"/><circle cx="35" cy="36" r="7" fill="#4db8ff" fill-opacity="0.7"/><path d="M16 72l20-22 13 14 11-10 20 18z" fill="#4db8ff" fill-opacity="0.45"/></svg>');
function photoHasImageData(photo) {
    return !!(photo && (photo.thumb || photo.photo || photo.remoteThumbUrl || photo.remotePhotoUrl));
}
function getPhotoDisplaySrc(photo) {
    if (!photo) return PHOTO_PLACEHOLDER_THUMB;
    return photo._displayObjectUrl || photo.thumb || photo.photo || photo.remoteThumbUrl || photo.remotePhotoUrl || PHOTO_PLACEHOLDER_THUMB;
}
function parsePhotoDateValue(value) {
    if (value instanceof Date && !isNaN(value.getTime())) return value;
    if (typeof value === "number" && isFinite(value) && value > 0) {
        var numericDate = new Date(value);
        if (!isNaN(numericDate.getTime())) return numericDate;
    }
    if (typeof value !== "string" || !value.trim()) return null;
    var match = value.match(/(\d{4})[:\-](\d{2})[:\-](\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
    if (match) {
        var exifDate = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4]), Number(match[5]), Number(match[6]) || 0);
        if (!isNaN(exifDate.getTime())) return exifDate;
    }
    var parsedTime = Date.parse(value);
    return isNaN(parsedTime) ? null : new Date(parsedTime);
}
function getPhotoTakenDate(photoOrFile, fallbackDate) {
    var exif = photoOrFile && photoOrFile.exif;
    var value = exif && (exif.DateTimeOriginal || exif.CreateDate || exif.ModifyDate || exif.DateTimeDigitized || exif.DateTime || exif.dateTimeOriginal);
    var parsed = parsePhotoDateValue(value);
    if (parsed) return parsed;
    if (photoOrFile && isFinite(photoOrFile.lastModified) && photoOrFile.lastModified > 0) return new Date(photoOrFile.lastModified);
    return fallbackDate instanceof Date && !isNaN(fallbackDate.getTime()) ? fallbackDate : null;
}
function getRoutePhotoLocation(timestamp) {
    if (!isFinite(timestamp) || !Array.isArray(pathCoordinates) || !pathCoordinates.length) return null;
    var best = null;
    pathCoordinates.forEach(function(point) {
        if (!point || !isValidPhotoCoordinate(point.lat, point.lng)) return;
        var start = Number(point.startTime) || 0;
        var end = Number(point.endTime) || start;
        var delta = timestamp < start ? start - timestamp : timestamp > end ? timestamp - end : 0;
        if (!best || delta < best.delta) best = { lat: Number(point.lat), lng: Number(point.lng), delta: delta };
    });
    if (!best || best.delta > PHOTO_LOCATION_MAX_ROUTE_TIME_MS) return null;
    return { lat: best.lat, lng: best.lng, source: "route", accuracy: null };
}
function getCurrentPhotoLocation() {
    var currentFallback = currentPos && isValidPhotoCoordinate(currentPos.lat, currentPos.lng) &&
        isFinite(currentAccuracy) && currentAccuracy <= PHOTO_LOCATION_GOOD_ACCURACY_M &&
        Date.now() - currentPositionTimestamp <= 120000
        ? { lat: currentPos.lat, lng: currentPos.lng, source: "current", accuracy: Number(currentAccuracy) }
        : null;
    if (currentFallback && Date.now() - currentPositionTimestamp <= 20000) return Promise.resolve(currentFallback);
    if (!navigator.geolocation) return Promise.resolve(currentFallback);
    return new Promise(function(resolve) {
        var settled = false;
        var best = currentFallback;
        var watch = null;
        var finish = function(value) {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            if (watch !== null && typeof navigator.geolocation.clearWatch === "function") navigator.geolocation.clearWatch(watch);
            resolve(value || best || null);
        };
        var onPosition = function(position) {
            var coords = position && position.coords;
            var accuracy = coords && Number(coords.accuracy);
            if (!coords || !isValidPhotoCoordinate(coords.latitude, coords.longitude) || !isFinite(accuracy)) return;
            var candidate = { lat: Number(coords.latitude), lng: Number(coords.longitude), source: "current", accuracy: accuracy };
            if (!best || accuracy < best.accuracy) best = candidate;
            currentAccuracy = accuracy;
            currentPositionTimestamp = Number(position.timestamp) || Date.now();
            if (accuracy <= 30) finish(candidate);
        };
        var timeout = setTimeout(function() {
            finish(best && best.accuracy <= PHOTO_LOCATION_GOOD_ACCURACY_M ? best : null);
        }, 10000);
        try {
            watch = navigator.geolocation.watchPosition(onPosition, function(error) {
                if (error && error.code === 1) finish(currentFallback);
            }, { enableHighAccuracy: true, maximumAge: 0, timeout: 9000 });
        } catch (_) {
            navigator.geolocation.getCurrentPosition(onPosition, function() { finish(currentFallback); }, { enableHighAccuracy: true, maximumAge: 0, timeout: 9000 });
        }
    });
}
function snapshotCurrentPhotoLocation() {
    if (!currentPos || !isValidPhotoCoordinate(currentPos.lat, currentPos.lng)) return null;
    if (!isFinite(currentAccuracy) || currentAccuracy > PHOTO_LOCATION_GOOD_ACCURACY_M) return null;
    if (!isFinite(currentPositionTimestamp) || Date.now() - currentPositionTimestamp > 120000) return null;
    return { lat:Number(currentPos.lat), lng:Number(currentPos.lng), source:"current", accuracy:Number(currentAccuracy) };
}
async function resolvePhotoLocation(photoOrFile, exifGps, sourceType, photoDate, capturedLocation) {
    if (exifGps === undefined) exifGps = await getPhotoExifGps(photoOrFile);
    if (exifGps && isValidPhotoCoordinate(exifGps.lat, exifGps.lng)) {
        return { lat: Number(exifGps.lat), lng: Number(exifGps.lng), source: "exif", accuracy: null };
    }
    if (sourceType === "camera" && capturedLocation && isValidPhotoCoordinate(capturedLocation.lat, capturedLocation.lng)) {
        return { lat:Number(capturedLocation.lat), lng:Number(capturedLocation.lng), source:"current", accuracy:isFinite(capturedLocation.accuracy) ? Number(capturedLocation.accuracy) : null };
    }
    return null;
}
async function inspectPhotoLocation(photoOrFile, sourceType, cameraFallbackDate, capturedLocation) {
    var metadata = await Promise.all([getPhotoExifGps(photoOrFile), getPhotoExifDate(photoOrFile)]);
    var gps = metadata[0];
    var exifDate = metadata[1];
    var routeDate = exifDate;
    if (!routeDate && sourceType === "camera") routeDate = cameraFallbackDate instanceof Date ? cameraFallbackDate : new Date();
    var photoLocation = await resolvePhotoLocation(photoOrFile, gps, sourceType, routeDate, capturedLocation);
    var fileName = photoOrFile && (photoOrFile.name || photoOrFile.path || photoOrFile.webPath || photoOrFile.uri) || "";
    var mimeType = photoOrFile && photoOrFile.type || "";
    if (GILOA_DEBUG) console.log("[GILOA PHOTO LOCATION]", {
        fileName: String(fileName),
        mimeType: String(mimeType),
        exifGps: gps,
        exifDate: exifDate,
        resolvedLocation: photoLocation
    });
    return { gps: gps, photoDate: exifDate, routeDate: routeDate, location: photoLocation };
}
function consumeNativePhotoUri(index) {
    var list = window.__giloaNativePhotoUris;
    if ((!Array.isArray(list) || !list.length) && window.GiloaPhotoBridge && typeof window.GiloaPhotoBridge.consumeSelectedUris === "function") {
        try {
            var parsed = JSON.parse(window.GiloaPhotoBridge.consumeSelectedUris() || "[]");
            if (Array.isArray(parsed)) {
                list = parsed;
                window.__giloaNativePhotoUris = parsed;
            }
        } catch (_) {}
    }
    if (!Array.isArray(list)) return "";
    return typeof list[index] === "string" ? list[index] : "";
}
function clearNativePhotoUris() {
    try { window.__giloaNativePhotoUris = []; } catch (_) {}
    try {
        if (window.GiloaPhotoBridge && typeof window.GiloaPhotoBridge.consumeSelectedUris === "function") window.GiloaPhotoBridge.consumeSelectedUris();
    } catch (_) {}
}

function describeNativePhotoUri(uri) {
    if (!uri) return "";
    try {
        var parsed = new URL(uri);
        return parsed.protocol.replace(":", "") + "://" + (parsed.host || "local") + "/…";
    } catch (_) { return String(uri).split(":")[0] + "://…"; }
}
var GILOA_NATIVE_READ_TRACE = [];
function nativeReadTrace(step, detail) {
    try {
        GILOA_NATIVE_READ_TRACE.push("· " + step + (detail === undefined || detail === null ? "" : ": " + detail));
        if (GILOA_NATIVE_READ_TRACE.length > 40) GILOA_NATIVE_READ_TRACE.shift();
    } catch (_) {}
}
// A Capacitor WebView served from file:// blocks fetch(), so XHR is kept as a
// second route. Either one alone silently fails on some builds.
function xhrBlobFromUrl(url) {
    return new Promise(function(resolve) {
        try {
            var request = new XMLHttpRequest();
            request.open("GET", url, true);
            request.responseType = "blob";
            request.onload = function() {
                var body = request.response;
                resolve(body && body.size ? body : null);
            };
            request.onerror = function() { resolve(null); };
            request.ontimeout = function() { resolve(null); };
            request.timeout = 20000;
            request.send();
        } catch (_) { resolve(null); }
    });
}
async function readBlobFromAnyUrl(url, label) {
    if (!url) return null;
    try {
        var response = await fetch(url);
        if (response.ok) {
            var body = await response.blob();
            if (body && body.size) { nativeReadTrace(label + " fetch", Math.round(body.size / 1024) + "KB"); return body; }
        }
        nativeReadTrace(label + " fetch", "응답 " + response.status);
    } catch (error) { nativeReadTrace(label + " fetch 실패", error && error.message); }
    var viaXhr = await xhrBlobFromUrl(url);
    if (viaXhr) { nativeReadTrace(label + " XHR", Math.round(viaXhr.size / 1024) + "KB"); return viaXhr; }
    nativeReadTrace(label + " XHR", "실패");
    return null;
}
function base64ToUint8Array(value) {
    var binary = atob(String(value || ""));
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}
// Pulls the file across the JS bridge in pieces. A single 6MB base64 string can
// be dropped by the WebView, which looked exactly like "the file is unreadable".
async function readNativePhotoInChunks(bridge, uri) {
    if (typeof bridge.getPhotoSize !== "function" || typeof bridge.getPhotoChunk !== "function") return null;
    var total = Number(bridge.getPhotoSize(uri));
    if (!isFinite(total) || total <= 0) { nativeReadTrace("청크 크기", "0"); return null; }
    var chunkSize = 524288;
    var pieces = [];
    for (var offset = 0; offset < total; offset += chunkSize) {
        var encoded = bridge.getPhotoChunk(uri, offset, Math.min(chunkSize, total - offset));
        if (!encoded) { nativeReadTrace("청크 읽기", "offset " + offset + " 실패"); return null; }
        pieces.push(base64ToUint8Array(encoded));
        await new Promise(function(resolve) { setTimeout(resolve, 0); });
    }
    var blob = new Blob(pieces, { type: (typeof bridge.getPhotoMimeType === "function" && bridge.getPhotoMimeType(uri)) || "image/jpeg" });
    nativeReadTrace("청크 전송", Math.round(blob.size / 1024) + "KB");
    return blob.size ? blob : null;
}
async function readNativePhotoBlob(uri) {
    GILOA_NATIVE_READ_TRACE = [];
    var bridge = window.GiloaPhotoBridge;
    if (!bridge || !uri) { nativeReadTrace("브릿지", "없음"); return null; }
    nativeReadTrace("URI", describeNativePhotoUri(uri));

    if (typeof bridge.copyPhotoToCache === "function") {
        try {
            var cacheUrl = bridge.copyPhotoToCache(uri);
            nativeReadTrace("copyPhotoToCache", cacheUrl ? String(cacheUrl).slice(0, 60) : "빈 문자열");
            var cached = await readBlobFromAnyUrl(cacheUrl, "캐시 URL");
            if (cached) return cached;
        } catch (error) { nativeReadTrace("copyPhotoToCache 오류", error && error.message); }
    }

    // The URL scheme a Capacitor build serves local files under varies, so each
    // known form is tried against the same cached file before giving up.
    if (typeof bridge.copyPhotoToCachePath === "function") {
        try {
            var path = bridge.copyPhotoToCachePath(uri);
            nativeReadTrace("캐시 경로", path ? String(path).slice(0, 60) : "빈 문자열");
            if (path) {
                var forms = ["https://localhost/_capacitor_file_" + path, "file://" + path];
                for (var i = 0; i < forms.length; i++) {
                    var found = await readBlobFromAnyUrl(forms[i], "경로형식" + (i + 1));
                    if (found) return found;
                }
            }
        } catch (error) { nativeReadTrace("copyPhotoToCachePath 오류", error && error.message); }
    }

    if (typeof bridge.getPhotoData === "function") {
        try {
            var dataUrl = bridge.getPhotoData(uri);
            nativeReadTrace("getPhotoData", dataUrl ? Math.round(String(dataUrl).length / 1024) + "KB 문자열" : "빈 문자열");
            var dataBlob = dataUrl ? dataUrlToBlob(dataUrl) : null;
            if (dataBlob && dataBlob.size) return dataBlob;
        } catch (error) { nativeReadTrace("getPhotoData 오류", error && error.message); }
    }

    try {
        var chunked = await readNativePhotoInChunks(bridge, uri);
        if (chunked) return chunked;
    } catch (error) { nativeReadTrace("청크 오류", error && error.message); }

    if (typeof bridge.lastError === "function") {
        try { nativeReadTrace("네이티브 오류", bridge.lastError() || "없음"); } catch (_) {}
    }
    return null;
}
async function getOriginalPhotoBlob(nativeUri, pickerPhoto) {
    if (nativeUri) {
        var nativeBlob = await readNativePhotoBlob(nativeUri);
        if (nativeBlob && nativeBlob.size) return nativeBlob;
    }
    var candidates = pickerPhoto ? [pickerPhoto.path, pickerPhoto.uri, pickerPhoto.webPath] : [];
    for (var i = 0; i < candidates.length; i++) {
        if (!candidates[i]) continue;
        var blob = await fetchBlobFromUrl(candidates[i]).catch(function() { return null; });
        if (blob && blob.size) return blob;
    }
    return null;
}

async function triggerCamera() {
    closePhotoMenu();
    var cameraStartedAt = new Date();
    var cameraCaptureLocation = snapshotCurrentPhotoLocation();
    pendingCameraCaptureDate = cameraStartedAt;
    pendingCameraCaptureLocation = cameraCaptureLocation;
    var Camera = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Camera;
    if (Camera && typeof Camera.getPhoto === "function") {
        try {
            var photo = await Camera.getPhoto({ quality: 95, resultType: "uri", source: "CAMERA", saveToGallery: true, correctOrientation: true });
            await showPhotoImportProgress(1, 1);
            var photoUrl = photo.webPath || photo.path || photo.uri || "";
            var originalBlob = await fetchBlobFromUrl(photoUrl).catch(function() { return null; });
            var cameraInspection = await inspectPhotoLocation(originalBlob || photo, "camera", cameraStartedAt, cameraCaptureLocation);
            var takenDate = cameraInspection.photoDate || cameraStartedAt;
            var location = cameraInspection.location;
            var img = await loadImageFromUrl(photoUrl);
            await processPhoto(img, takenDate, location && location.lat, location && location.lng, {
                originalBlob: originalBlob,
                originalUrl: photoUrl,
                sourceUri: photo.path || photo.webPath || "",
                sourceWebPath: photo.webPath || "",
                sourceType: "camera",
                locationSource: location ? location.source : "unknown",
                locationAccuracy: location ? location.accuracy : null
            });
            pendingCameraCaptureDate = null;
            pendingCameraCaptureLocation = null;
            return;
        } catch (e) {
            console.warn("카메라 처리 실패", e);
        } finally {
            hidePhotoImportProgress();
        }
    }
    document.getElementById("camera-input").click();
}

function hasNativePhotoPicker() {
    var bridge = window.GiloaPhotoBridge;
    return !!(bridge && typeof bridge.pickPhotos === "function" && typeof bridge.copyPhotoToCache === "function");
}
// The cached copy comes back as application/octet-stream, which made HEIC files
// look like JPEG and capped the EXIF read at 1MB. The content resolver knows the
// real type, so it is asked directly.
function resolveNativePhotoMime(uri, blob) {
    var blobType = String(blob && blob.type || "").toLowerCase();
    if (/^image\/(?!$)/.test(blobType) && blobType.indexOf("octet") < 0) return blobType;
    var bridge = window.GiloaPhotoBridge;
    if (bridge && typeof bridge.getPhotoMimeType === "function") {
        try {
            var declared = String(bridge.getPhotoMimeType(uri) || "").toLowerCase();
            if (declared.indexOf("image/") === 0) return declared;
        } catch (_) { }
    }
    return blobType || "";
}
function nativeUriToFileName(uri, mimeType) {
    var base = String(uri || "photo").split("/").pop().split("?")[0] || "photo";
    var type = String(mimeType || "").toLowerCase();
    // A .jpg suffix on a real HEIC defeats the HEIC branch downstream, so the
    // resolved type wins over an extension that happens to be in the URI.
    if (type.indexOf("hei") >= 0) return base.replace(/\.[a-z0-9]{2,5}$/i, "") + ".heic";
    if (/\.[a-z0-9]{2,5}$/i.test(base)) return base;
    var ext = type.indexOf("hei") >= 0 ? ".heic" : type.indexOf("png") >= 0 ? ".png" : ".jpg";
    return base + ext;
}
function blobAsNamedFile(blob, name, mimeType) {
    if (!blob) return null;
    var type = mimeType || blob.type || "image/jpeg";
    if (typeof File === "function") {
        try { return new File([blob], name, { type: type, lastModified: Date.now() }); }
        catch (_) { }
    }
    try { blob.name = name; } catch (_) { }
    return blob;
}
// Imports photos handed over as content:// URIs by the native picker. Those
// bytes come through MediaStore.setRequireOriginal(), so unlike the system
// photo picker the GPS values are intact rather than zeroed out.
async function importPhotosFromNativeUris(uris) {
    var list = Array.isArray(uris) ? uris.filter(Boolean) : [];
    if (!list.length) { syncRecordingUI(); return; }
    var loadedCount = 0;
    var failedCount = 0;
    var lastLocatedPhoto = null;
    try {
        for (var i = 0; i < list.length; i++) {
            await showPhotoImportProgress(i + 1, list.length);
            try {
                var uri = list[i];
                var originalBlob = await getOriginalPhotoBlob(uri, null);
                if (!originalBlob || !originalBlob.size) throw new Error("원본 바이트를 읽지 못했습니다");
                var realMime = resolveNativePhotoMime(uri, originalBlob);
                var named = blobAsNamedFile(originalBlob, nativeUriToFileName(uri, realMime), realMime);
                var inspection = await inspectPhotoLocation(named, "gallery", null, null);
                var takenDate = inspection.photoDate || new Date();
                var location = inspection.location;
                if (GILOA_DEBUG) console.log("[GILOA EXIF DEBUG native]", {
                    uri: describeNativePhotoUri(uri),
                    mimeType: originalBlob.type || "",
                    size: originalBlob.size,
                    exifGps: inspection.gps,
                    locationSource: location && location.source || "unknown"
                });
                var displayFile = await convertHeicToJpegFile(named);
                var img = await loadImageFromFile(displayFile);
                var importedPhoto = await processPhoto(img, takenDate, location && location.lat, location && location.lng, {
                    deferUi: true,
                    openPopup: list.length === 1,
                    originalBlob: originalBlob,
                    sourceUri: uri,
                    sourceType: "gallery",
                    locationSource: location ? location.source : "unknown",
                    locationAccuracy: location ? location.accuracy : null,
                    deferImageAnalysis: true
                });
                if (importedPhoto) {
                    loadedCount += 1;
                    if (isValidPhotoCoordinate(importedPhoto.lat, importedPhoto.lng)) lastLocatedPhoto = importedPhoto;
                }
            } catch (error) {
                failedCount += 1;
                console.warn("네이티브 사진 처리 실패", error);
            }
        }
    } finally {
        hidePhotoImportProgress();
        clearNativePhotoUris();
        syncRecordingUI();
    }
    if (loadedCount > 0) {
        updateStats();
        scheduleSave();
        updatePhotoList();
        if (lastLocatedPhoto) focusPhotoOnMap(lastLocatedPhoto);
    }
    if (failedCount > 0) showCollectionToast(earlyUiText("photoFailed", { count:failedCount }));
}
window.onGiloaPhotosPicked = function(payload) {
    var uris = [];
    try { uris = typeof payload === "string" ? JSON.parse(payload || "[]") : (payload || []); }
    catch (_) { uris = []; }
    if (giloaExifDiagnosticPending) {
        giloaExifDiagnosticPending = false;
        clearNativePhotoUris();
        if (uris.length) giloaDiagnoseNativeUri(uris[0]);
        return;
    }
    importPhotosFromNativeUris(uris);
};
async function triggerGallery() {
    closePhotoMenu();
    await requestPhotoLocationPermission();
    // The system photo picker (used by Capacitor Camera and by <input type=file>)
    // always returns zeroed GPS values, so the native ACTION_OPEN_DOCUMENT bridge
    // is preferred whenever the APK provides it.
    if (hasNativePhotoPicker()) {
        try { window.GiloaPhotoBridge.pickPhotos(); return; }
        catch (error) { console.warn("네이티브 사진 선택 실패, 기본 경로로 대체합니다", error); }
    }
    var Camera = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Camera;
    if (Camera && (typeof Camera.pickImages === "function" || typeof Camera.getPhoto === "function")) {
        try {
            if (Camera && typeof Camera.pickImages === "function") {
                var picked = await Camera.pickImages({ quality: 95, limit: 20 });
                var list = picked && Array.isArray(picked.photos) ? picked.photos : [];
                if (!list.length) return;
                var lastLocatedPhoto = null;
                for (var i = 0; i < list.length; i++) {
                    await showPhotoImportProgress(i + 1, list.length);
                    var one = list[i];
                    var nativeUri = consumeNativePhotoUri(i);
                    var oneUrl = one.webPath || one.path || one.uri || "";
                    var oneBlob = await getOriginalPhotoBlob(nativeUri, one);
                    var oneInspection = await inspectPhotoLocation(oneBlob || one, "gallery", null, null);
                    var oneDate = oneInspection.photoDate || new Date();
                    var oneLocation = oneInspection.location;
                    var imgOne = await loadImageFromUrl(oneUrl);
                    var importedPhoto = await processPhoto(imgOne, oneDate, oneLocation && oneLocation.lat, oneLocation && oneLocation.lng, {
                        deferUi: true,
                        openPopup: list.length === 1,
                        originalBlob: oneBlob,
                        originalUrl: oneUrl,
                        sourceUri: nativeUri || one.path || one.webPath || "",
                        sourceWebPath: one.webPath || "",
                        sourceType: "gallery",
                        locationSource: oneLocation ? oneLocation.source : "unknown",
                        locationAccuracy: oneLocation ? oneLocation.accuracy : null
                    });
                    if (importedPhoto && isValidPhotoCoordinate(importedPhoto.lat, importedPhoto.lng)) lastLocatedPhoto = importedPhoto;
                }
                updateStats();
                scheduleSave();
                updatePhotoList();
                if (lastLocatedPhoto) focusPhotoOnMap(lastLocatedPhoto);
                syncRecordingUI();
                return;
            }
            var single = await Camera.getPhoto({ quality: 95, resultType: "uri", source: "PHOTOS" });
            await showPhotoImportProgress(1, 1);
            var singleUrl = single.webPath || single.path || single.uri || "";
            // Capacitor may expose a display-only webPath whose EXIF has already
            // been stripped. Prefer the original path/URI bytes, as the multi-
            // select flow does, before falling back to the preview URL.
            var singleBlob = await getOriginalPhotoBlob("", single) || await fetchBlobFromUrl(singleUrl).catch(function() { return null; });
            var singleInspection = await inspectPhotoLocation(singleBlob || single, "gallery", null, null);
            var singleDate = singleInspection.photoDate || new Date();
            var singleLocation = singleInspection.location;
            var img = await loadImageFromUrl(singleUrl);
            var importedSingle = await processPhoto(img, singleDate, singleLocation && singleLocation.lat, singleLocation && singleLocation.lng, {
                originalBlob: singleBlob,
                originalUrl: singleUrl,
                sourceUri: single.path || single.webPath || "",
                sourceWebPath: single.webPath || "",
                sourceType: "gallery",
                locationSource: singleLocation ? singleLocation.source : "unknown",
                locationAccuracy: singleLocation ? singleLocation.accuracy : null
            });
            if (importedSingle && isValidPhotoCoordinate(importedSingle.lat, importedSingle.lng)) focusPhotoOnMap(importedSingle);
            return;
        } catch (e) {
            console.warn("갤러리 불러오기 실패", e);
        } finally {
            hidePhotoImportProgress();
        }
    }
    document.getElementById("gallery-input").click();
}
async function openPhotoInGallery(data) {
    if (!data) return;
    var bridge = window.GiloaPhotoBridge;
    var browserWindow = !bridge ? window.open("", "_blank") : null;
    try {
        var stored = data.id ? await idbGetPhoto(data.id).catch(function() { return null; }) : null;
        var sourceUri = data.sourceUri || data.sourceWebPath || data.remotePhotoUrl || "";
        if (bridge && typeof bridge.openPhoto === "function" && sourceUri) {
            if (bridge.openPhoto(sourceUri)) return;
        }
        var fullImage = stored && stored.originalBlob ? stored.originalBlob : (stored && stored.photo) || data.photo || data.remotePhotoUrl || data.thumb || "";
        if (bridge && typeof bridge.openPhotoData === "function" && fullImage) {
            var fullDataUrl = typeof fullImage === "string" ? fullImage : await blobToDataUrl(fullImage);
            if (bridge.openPhotoData(fullDataUrl, data.id || "photo")) return;
        }
        if (window.Capacitor && typeof window.Capacitor.isNativePlatform === "function" && window.Capacitor.isNativePlatform()) {
            var plugins = window.Capacitor.Plugins || {};
            if (sourceUri && plugins.Browser && typeof plugins.Browser.open === "function") {
                if (browserWindow) browserWindow.close();
                await plugins.Browser.open({ url: sourceUri });
                return;
            }
        }
        if (!fullImage && sourceUri) fullImage = sourceUri;
        if (!fullImage) throw new Error("No photo source");
        var objectUrlCreated = false;
        var externalUrl;
        if (typeof fullImage === "string" && fullImage.indexOf("data:image/") === 0) {
            externalUrl = URL.createObjectURL(dataUrlToBlob(fullImage));
            objectUrlCreated = true;
        } else if (typeof fullImage === "string") externalUrl = fullImage;
        else {
            externalUrl = URL.createObjectURL(fullImage);
            objectUrlCreated = true;
        }
        if (browserWindow) browserWindow.location.href = externalUrl;
        else window.open(externalUrl, "_blank");
        if (objectUrlCreated) setTimeout(function() { URL.revokeObjectURL(externalUrl); }, 60000);
    } catch (e) {
        if (browserWindow) browserWindow.close();
        console.warn("사진 외부 열기 실패", e);
        alert(earlyUiText("photoOpenFailed"));
    }
}
function getPhotoInteractionText() {
    var all = {
        ko: {
            mapView: "지도에서 촬영 위치 보기",
            importProgress: "사진을 지도에 붙이는 중 {current}/{total}",
            locationUnavailable: "이 사진의 촬영 위치를 확인할 수 없습니다.",
            originalOpen: "원본 사진을 휴대폰 앱에서 열기",
            originalHint: "지도 사진을 누르면 휴대폰의 원본을 엽니다.",
            mapLocation: "이전 버전에서 저장된 위치",
            exifLocation: "사진 촬영 위치",
            routeLocation: "이동 기록으로 위치 추정",
            currentLocation: "촬영 당시 현재 위치",
            manualLocation: "직접 지정한 위치",
            unknownLocation: "위치 정보 없음",
            chooseTitle: "이 사진의 촬영 위치를 찾지 못했어요.",
            chooseDescription: "촬영 위치를 직접 지정하거나 위치 없이 보관할 수 있어요.",
            chooseMap: "지도에서 위치 선택",
            chooseCurrent: "현재 위치 사용",
            currentUnavailable: "현재 위치를 확인할 수 없습니다. 지도에서 선택하거나 위치 없이 보관해 주세요.",
            keepWithout: "위치 없이 보관",
            cancel: "취소",
            tapMap: "지도에서 사진을 촬영한 위치를 눌러 주세요.",
            stopPicking: "위치 선택 취소",
            assignLocation: "촬영 위치 지정",
            memoPlaceholder: "왜 이 사진을 남겼나요?",
            memoSave: "메모 저장",
            memoSaved: "사진 메모를 저장했습니다.",
            deletePhoto: "사진 삭제",
            photoAnalysis: "사진 분석",
            analysisAccepted: "인식 성공",
            analysisRetry: "다시 찍어보세요",
            emptyPhotos: "아직 저장된 사진이 없습니다.",
            photoAlt: "여행 사진",
            locationNeeded: "촬영 위치 확인 필요",
            locationRestored: "사진 촬영 위치를 복구했어요.",
            rereadLocation: "사진 위치 다시 읽기",
            rereadFailed: "사진에서 GPS 정보를 찾지 못했어요.",
            originalMissing: "원본 사진이 없어 위치를 다시 읽을 수 없어요."
        },
        en: {
            mapView: "Show where this photo was taken",
            importProgress: "Adding photos to the map {current}/{total}",
            locationUnavailable: "This photo does not have a usable location.",
            originalOpen: "Open the original photo on this device",
            originalHint: "Tap the map photo to open the original on this device.",
            mapLocation: "Location saved by an earlier version",
            exifLocation: "Photo capture location",
            routeLocation: "Estimated from your travel route",
            currentLocation: "Current location when captured",
            manualLocation: "Location selected manually",
            unknownLocation: "No location information",
            chooseTitle: "We couldn't find where this photo was taken.",
            chooseDescription: "Choose a place on the map or keep the photo without a location.",
            chooseMap: "Choose on map",
            chooseCurrent: "Use current location",
            currentUnavailable: "Current location is unavailable. Choose on the map or keep the photo without a location.",
            keepWithout: "Keep without location",
            cancel: "Cancel",
            tapMap: "Tap the place where this photo was taken.",
            stopPicking: "Stop choosing",
            assignLocation: "Set capture location",
            memoPlaceholder: "Why are you keeping this photo?",
            memoSave: "Save note",
            memoSaved: "Photo note saved.",
            deletePhoto: "Delete photo",
            photoAnalysis: "Photo analysis",
            analysisAccepted: "Recognized",
            analysisRetry: "Try another photo",
            emptyPhotos: "No saved photos yet.",
            photoAlt: "Travel photo",
            locationNeeded: "Location needed",
            locationRestored: "Photo location restored.",
            rereadLocation: "Re-read photo location",
            rereadFailed: "No GPS data was found in this photo.",
            originalMissing: "The original file is unavailable, so the location cannot be re-read."
        },
        ja: {
            mapView: "写真の撮影場所を地図で見る",
            importProgress: "写真を地図に追加中 {current}/{total}",
            locationUnavailable: "この写真の撮影場所を確認できません。",
            originalOpen: "端末で元の写真を開く",
            originalHint: "地図上の写真をタップすると端末の元画像を開きます。",
            mapLocation: "以前のバージョンで保存された位置",
            exifLocation: "写真の撮影位置",
            routeLocation: "移動記録から位置を推定",
            currentLocation: "撮影時の現在位置",
            manualLocation: "手動で指定した位置",
            unknownLocation: "位置情報なし",
            chooseTitle: "この写真の撮影場所が見つかりませんでした。",
            chooseDescription: "地図で場所を指定するか、位置情報なしで保存できます。",
            chooseMap: "地図で位置を選ぶ",
            chooseCurrent: "現在地を使用",
            currentUnavailable: "現在地を確認できません。地図で選ぶか、位置情報なしで保存してください。",
            keepWithout: "位置情報なしで保存",
            cancel: "キャンセル",
            tapMap: "写真を撮影した場所を地図でタップしてください。",
            stopPicking: "位置選択をやめる",
            assignLocation: "撮影位置を指定",
            memoPlaceholder: "この写真を残した理由は？",
            memoSave: "メモを保存",
            memoSaved: "写真のメモを保存しました。",
            deletePhoto: "写真を削除",
            photoAnalysis: "写真を分析",
            analysisAccepted: "認識成功",
            analysisRetry: "もう一度撮ってみよう",
            emptyPhotos: "保存した写真はまだありません。",
            photoAlt: "旅の写真",
            locationNeeded: "撮影場所の確認が必要",
            locationRestored: "写真の撮影位置を復元しました。",
            rereadLocation: "撮影位置を再読み込み",
            rereadFailed: "この写真からGPS情報を見つけられませんでした。",
            originalMissing: "元の写真がないため位置を再読み込みできません。"
        },
        zh: {
            mapView: "在地图上查看拍摄位置",
            importProgress: "正在将照片添加到地图 {current}/{total}",
            locationUnavailable: "无法确认这张照片的拍摄位置。",
            originalOpen: "在手机中打开原始照片",
            originalHint: "点击地图上的照片即可打开手机中的原图。",
            mapLocation: "旧版本保存的位置",
            exifLocation: "照片拍摄位置",
            routeLocation: "根据移动记录推测位置",
            currentLocation: "拍摄时的当前位置",
            manualLocation: "手动指定的位置",
            unknownLocation: "无位置信息",
            chooseTitle: "未能找到这张照片的拍摄位置。",
            chooseDescription: "可以在地图上指定位置，或不带位置保存。",
            chooseMap: "在地图上选择位置",
            chooseCurrent: "使用当前位置",
            currentUnavailable: "无法获取当前位置。请在地图上选择，或不带位置保存。",
            keepWithout: "不带位置保存",
            cancel: "取消",
            tapMap: "请在地图上点击照片的拍摄位置。",
            stopPicking: "取消位置选择",
            assignLocation: "设置拍摄位置",
            memoPlaceholder: "为什么留下这张照片？",
            memoSave: "保存备注",
            memoSaved: "照片备注已保存。",
            deletePhoto: "删除照片",
            photoAnalysis: "照片分析",
            analysisAccepted: "识别成功",
            analysisRetry: "请再拍一次",
            emptyPhotos: "尚无已保存的照片。",
            photoAlt: "旅行照片",
            locationNeeded: "需要确认拍摄位置",
            locationRestored: "已恢复照片的拍摄位置。",
            rereadLocation: "重新读取照片位置",
            rereadFailed: "未在照片中找到GPS信息。",
            originalMissing: "没有原图，无法重新读取位置。"
        },
        es: {
            mapView: "Ver en el mapa dónde se tomó esta foto",
            importProgress: "Añadiendo fotos al mapa {current}/{total}",
            locationUnavailable: "Esta foto no tiene una ubicación válida.",
            originalOpen: "Abrir la foto original en este dispositivo",
            originalHint: "Toca la foto del mapa para abrir el original.",
            mapLocation: "Ubicación guardada por una versión anterior",
            exifLocation: "Lugar de captura de la foto",
            routeLocation: "Ubicación estimada desde tu ruta",
            currentLocation: "Ubicación actual al tomarla",
            manualLocation: "Ubicación elegida manualmente",
            unknownLocation: "Sin información de ubicación",
            chooseTitle: "No pudimos encontrar dónde se tomó esta foto.",
            chooseDescription: "Elige un lugar en el mapa o guarda la foto sin ubicación.",
            chooseMap: "Elegir en el mapa",
            chooseCurrent: "Usar ubicación actual",
            currentUnavailable: "No se pudo obtener la ubicación actual. Elige en el mapa o guarda sin ubicación.",
            keepWithout: "Guardar sin ubicación",
            cancel: "Cancelar",
            tapMap: "Toca en el mapa dónde se tomó la foto.",
            stopPicking: "Cancelar selección",
            assignLocation: "Definir lugar de captura",
            memoPlaceholder: "¿Por qué guardas esta foto?",
            memoSave: "Guardar nota",
            memoSaved: "Nota de la foto guardada.",
            deletePhoto: "Eliminar foto",
            photoAnalysis: "Análisis de foto",
            analysisAccepted: "Reconocida",
            analysisRetry: "Inténtalo con otra foto",
            emptyPhotos: "Aún no hay fotos guardadas.",
            photoAlt: "Foto de viaje",
            locationNeeded: "Ubicación necesaria",
            locationRestored: "Se restauró la ubicación de la foto.",
            rereadLocation: "Volver a leer la ubicación",
            rereadFailed: "No se encontraron datos GPS en esta foto.",
            originalMissing: "No hay archivo original, no se puede releer la ubicación."
        },
        fr: {
            mapView: "Voir le lieu de prise de vue sur la carte",
            locationUnavailable: "Cette photo n’a pas de position exploitable.",
            originalOpen: "Ouvrir la photo originale sur cet appareil",
            originalHint: "Touchez la photo sur la carte pour ouvrir l’original.",
            mapLocation: "Position enregistrée par une ancienne version",
            exifLocation: "Lieu de prise de vue",
            routeLocation: "Position estimée depuis votre parcours",
            currentLocation: "Position actuelle au moment de la prise",
            manualLocation: "Position choisie manuellement",
            unknownLocation: "Aucune information de position",
            chooseTitle: "Nous n’avons pas trouvé où cette photo a été prise.",
            chooseDescription: "Choisissez un lieu sur la carte ou conservez la photo sans position.",
            chooseMap: "Choisir sur la carte",
            chooseCurrent: "Utiliser la position actuelle",
            currentUnavailable: "Position actuelle indisponible. Choisissez sur la carte ou conservez sans position.",
            keepWithout: "Conserver sans position",
            cancel: "Annuler",
            tapMap: "Touchez sur la carte le lieu où cette photo a été prise.",
            stopPicking: "Arrêter la sélection",
            assignLocation: "Définir le lieu de prise de vue",
            memoPlaceholder: "Pourquoi garder cette photo ?",
            memoSave: "Enregistrer la note",
            memoSaved: "Note de la photo enregistrée.",
            deletePhoto: "Supprimer la photo",
            photoAnalysis: "Analyse de la photo",
            analysisAccepted: "Reconnaissance réussie",
            analysisRetry: "Essayez une autre photo",
            emptyPhotos: "Aucune photo enregistrée.",
            photoAlt: "Photo de voyage",
            locationNeeded: "Localisation requise",
            locationRestored: "Position de la photo restaurée.",
            rereadLocation: "Relire la position de la photo",
            rereadFailed: "Aucune donnée GPS trouvée dans cette photo.",
            originalMissing: "Fichier original indisponible, impossible de relire la position."
        }
    };
    return all[currentLang] || all.ko;
}
function normalizePhotoLocationSource(source, hasLocation) {
    source = String(source || "").toLowerCase();
    if (source === "gps") source = "current";
    if (source === "exif" || source === "route" || source === "current" || source === "manual") return source;
    if (source === "unknown" || !hasLocation) return "unknown";
    return "unknown";
}
function syncPhotoLocationDialogText() {
    var text = getPhotoInteractionText();
    var title = document.getElementById("photo-location-title");
    var description = document.getElementById("photo-location-description");
    var mapButton = document.getElementById("photo-location-map");
    var currentButton = document.getElementById("photo-location-current");
    var keepButton = document.getElementById("photo-location-keep");
    var cancelButton = document.getElementById("photo-location-cancel");
    var hint = document.getElementById("photo-location-pick-hint");
    var pickCancel = document.getElementById("photo-location-pick-cancel");
    if (title) title.textContent = text.chooseTitle;
    if (description) description.textContent = text.chooseDescription;
    if (mapButton) mapButton.textContent = text.chooseMap;
    if (currentButton) currentButton.textContent = text.chooseCurrent;
    if (keepButton) keepButton.textContent = text.keepWithout;
    if (cancelButton) cancelButton.textContent = text.cancel;
    if (hint) hint.textContent = text.tapMap;
    if (pickCancel) pickCancel.textContent = text.stopPicking;
}
function removePendingPhotoMapClick() {
    if (pendingPhotoMapClickHandler && map && typeof map.off === "function") map.off("click", pendingPhotoMapClickHandler);
    pendingPhotoMapClickHandler = null;
}
function setPhotoLocationPickingMode(picking) {
    var dialog = document.getElementById("photo-location-dialog");
    if (!dialog) return;
    dialog.classList.toggle("is-picking", !!picking);
    var decisionNodes = dialog.querySelectorAll(".photo-location-decision");
    Array.prototype.forEach.call(decisionNodes, function(node) { node.hidden = !!picking; });
    var hint = document.getElementById("photo-location-pick-hint");
    var pickCancel = document.getElementById("photo-location-pick-cancel");
    if (hint) hint.hidden = !picking;
    if (pickCancel) pickCancel.hidden = !picking;
    var card = dialog.querySelector(".photo-location-card");
    if (card) card.setAttribute("aria-modal", picking ? "false" : "true");
}
function closePhotoLocationDialog(result) {
    var pending = pendingPhotoLocationChoice;
    if (!pending) return;
    removePendingPhotoMapClick();
    pendingPhotoLocationChoice = null;
    var dialog = document.getElementById("photo-location-dialog");
    if (dialog) {
        dialog.classList.remove("show", "is-picking");
        dialog.setAttribute("aria-hidden", "true");
    }
    setPhotoLocationPickingMode(false);
    pending.resolve(result);
}
function requestMissingPhotoLocation(data, options) {
    options = options || {};
    if (!data) return Promise.resolve("cancel");
    if (pendingPhotoLocationChoice) return Promise.resolve("cancel");
    syncPhotoLocationDialogText();
    var dialog = document.getElementById("photo-location-dialog");
    if (!dialog) return Promise.resolve("unknown");
    var currentButton = document.getElementById("photo-location-current");
    if (currentButton) currentButton.disabled = false;
    return new Promise(function(resolve) {
        pendingPhotoLocationChoice = { photo: data, isNewImport: !!options.isNewImport, resolve: resolve };
        setPhotoLocationPickingMode(false);
        dialog.classList.add("show");
        dialog.setAttribute("aria-hidden", "false");
        setTimeout(function() {
            var first = document.getElementById("photo-location-map");
            if (first && typeof first.focus === "function") first.focus();
        }, 0);
    });
}
function beginPhotoLocationMapPick() {
    if (!pendingPhotoLocationChoice) return;
    removePendingPhotoMapClick();
    closePhotoMenu();
    toggleSidebar(false);
    setPhotoLocationPickingMode(true);
    pendingPhotoMapClickHandler = function(event) {
        var latlng = event && event.latlng;
        var pending = pendingPhotoLocationChoice;
        if (!pending || !latlng || !isValidPhotoCoordinate(latlng.lat, latlng.lng)) return;
        pending.photo.lat = Number(latlng.lat);
        pending.photo.lng = Number(latlng.lng);
        pending.photo.locationSource = "manual";
        pending.photo.locationAccuracy = null;
        createPhotoMarker(pending.photo, false);
        updatePhotoList();
        scheduleSave();
        closePhotoLocationDialog("manual");
    };
    setTimeout(function() {
        if (pendingPhotoMapClickHandler && pendingPhotoLocationChoice) map.once("click", pendingPhotoMapClickHandler);
    }, 40);
}
function stopPhotoLocationMapPick() {
    if (!pendingPhotoLocationChoice) return;
    removePendingPhotoMapClick();
    setPhotoLocationPickingMode(false);
    var first = document.getElementById("photo-location-map");
    if (first && typeof first.focus === "function") first.focus();
}
async function useCurrentPhotoLocation() {
    if (!pendingPhotoLocationChoice) return;
    var button = document.getElementById("photo-location-current");
    var description = document.getElementById("photo-location-description");
    if (button) button.disabled = true;
    var location = await getCurrentPhotoLocation().catch(function() { return null; });
    if (!pendingPhotoLocationChoice) return;
    if (!location || !isValidPhotoCoordinate(location.lat, location.lng)) {
        if (button) button.disabled = false;
        if (description) description.textContent = getPhotoInteractionText().currentUnavailable;
        return;
    }
    pendingPhotoLocationChoice.photo.lat = Number(location.lat);
    pendingPhotoLocationChoice.photo.lng = Number(location.lng);
    pendingPhotoLocationChoice.photo.locationSource = "current";
    pendingPhotoLocationChoice.photo.locationAccuracy = isFinite(location.accuracy) ? Number(location.accuracy) : null;
    closePhotoLocationDialog("current");
}
function keepPhotoWithoutLocation() {
    if (!pendingPhotoLocationChoice) return;
    pendingPhotoLocationChoice.photo.lat = null;
    pendingPhotoLocationChoice.photo.lng = null;
    pendingPhotoLocationChoice.photo.locationSource = "unknown";
    pendingPhotoLocationChoice.photo.locationAccuracy = null;
    closePhotoLocationDialog("unknown");
}
function cancelPhotoLocationChoice() { closePhotoLocationDialog("cancel"); }
function focusPhotoOnMap(data) {
    var photoText = getPhotoInteractionText();
    if (!data || !isValidPhotoCoordinate(data.lat, data.lng)) {
        if (data) {
            // Try to recover the real capture location before asking the user.
            // The current position must never be stamped onto an old photo.
            recoverPhotoLocationFromExif(data).then(function(restored) {
                if (restored) {
                    persistState();
                    updatePhotoList();
                    showCollectionToast(getPhotoInteractionText().locationRestored);
                    focusPhotoOnMap(data);
                    return;
                }
                requestMissingPhotoLocation(data, { isNewImport: false }).then(function(result) {
                    if (result === "manual") focusPhotoOnMap(data);
                });
            });
        } else alert(photoText.locationUnavailable);
        return;
    }
    var lat = Number(data.lat);
    var lng = Number(data.lng);
    toggleSidebar(false);
    setSelectedDestination(lat, lng, earlyMemoryDateText(data, true) || photoText.mapView);
    map.whenReady(function() {
        var markerLayer = findPhotoMarker(data.id);
        // A marker depends on coordinates only. Missing thumbnails must never hide a memory.
        if (!markerLayer) markerLayer = createPhotoMarker(data, false);
        var revealFinished = false;
        var revealPhoto = function() {
            if (revealFinished) return;
            revealFinished = true;
            map.off("moveend", revealPhoto);
            if (!markerLayer) return;
            if (photoClusterGroup && typeof photoClusterGroup.zoomToShowLayer === "function") {
                photoClusterGroup.zoomToShowLayer(markerLayer, function() { markerLayer.openPopup(); });
            } else {
                markerLayer.openPopup();
            }
        };
        map.once("moveend", revealPhoto);
        map.flyTo([lat, lng], Math.min(17, map.getMaxZoom()), { animate: true, duration: 0.65 });
        setTimeout(revealPhoto, 1000);
    });
}

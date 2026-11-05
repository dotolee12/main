function createPhotoMarker(data, openPopup) {
    if (!data || !isValidPhotoCoordinate(data.lat, data.lng)) return null;
    var existingMarker = findPhotoMarker(data.id);
    if (existingMarker) {
        if (openPopup) existingMarker.openPopup();
        return existingMarker;
    }
    var size = getPhotoMarkerSize();
    lastPhotoMarkerSize = size;
    var marker = L.marker([data.lat, data.lng], { pane: "photoPane", icon: buildPhotoMarkerIcon(getPhotoDisplaySrc(data), size, data) });
    marker._photoData = data;
    var popupEl = document.createElement("div");
    popupEl.className = "photo-popup";
    var img = document.createElement("img");
    img.src = getPhotoDisplaySrc(data);
    marker._photoImageElement = img;
    img.style.cssText = "width:72vw;max-width:280px;border-radius:8px;margin-bottom:8px;display:block;cursor:pointer;";
    var photoText = getPhotoInteractionText();
    img.title = photoText.originalOpen;
    img.tabIndex = 0;
    img.setAttribute("role", "button");
    img.setAttribute("aria-label", photoText.originalOpen);
    var openOriginalPhoto = function(e) {
        if (e) e.stopPropagation();
        openPhotoInGallery(data);
    };
    img.addEventListener("click", openOriginalPhoto);
    img.addEventListener("keydown", function(e) {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        openOriginalPhoto(e);
    });
    var info = document.createElement("div");
    info.style.cssText = "font-size:12px;color:rgba(255,255,255,0.6);text-align:center;margin:6px 0 8px;";
    info.textContent = earlyMemoryDateText(data);
    var predictionInfo = document.createElement("div");
    renderPhotoImagePrediction(predictionInfo, data);
    marker._photoPredictionElement = predictionInfo;
    var delBtn = document.createElement("button");
    delBtn.className = "popup-delete-btn";
    delBtn.textContent = photoText.deletePhoto;
    delBtn.addEventListener("click", function() { deletePhoto(data.id); marker.closePopup(); });
    popupEl.appendChild(img);
    popupEl.appendChild(info);
    if (predictionInfo) popupEl.appendChild(predictionInfo);
    var memoInput = document.createElement("textarea");
    memoInput.className = "photo-memo-input";
    memoInput.placeholder = photoText.memoPlaceholder;
    memoInput.value = data.memo || "";
    var memoSave = document.createElement("button");
    memoSave.className = "photo-memo-save";
    memoSave.type = "button";
    memoSave.textContent = photoText.memoSave;
    memoSave.addEventListener("click", function() { data.memo = memoInput.value.trim(); scheduleSave(); updatePhotoList(); showCollectionToast(getPhotoInteractionText().memoSaved); showGiloReaction("memory", "", { force:true }); });
    popupEl.appendChild(memoInput);
    popupEl.appendChild(memoSave);
    var note = document.createElement("div");
    note.style.cssText = "font-size:11px;color:rgba(255,255,255,0.52);text-align:center;margin:0 0 8px;";
    var normalizedSource = normalizePhotoLocationSource(data.locationSource, isValidPhotoCoordinate(data.lat, data.lng));
    var locationLabel = photoText.unknownLocation;
    if (normalizedSource === "exif") locationLabel = photoText.exifLocation;
    else if (normalizedSource === "route") locationLabel = photoText.routeLocation;
    else if (normalizedSource === "current") locationLabel = photoText.currentLocation + (typeof data.locationAccuracy === "number" && isFinite(data.locationAccuracy) ? " · ±" + Math.round(data.locationAccuracy) + "m" : "");
    else if (normalizedSource === "manual") locationLabel = photoText.manualLocation;
    note.textContent = locationLabel + " · " + photoText.originalHint;
    popupEl.appendChild(note);
    var rereadBtn = document.createElement("button");
    rereadBtn.type = "button";
    rereadBtn.className = "photo-memo-save";
    rereadBtn.textContent = photoText.rereadLocation;
    rereadBtn.addEventListener("click", function() { reReadPhotoLocation(data); });
    popupEl.appendChild(rereadBtn);
    popupEl.appendChild(delBtn);
    marker.bindPopup(popupEl);
    photoClusterGroup.addLayer(marker);
    indexPhotoMarker(data.id, marker);
    if (openPopup) marker.openPopup();
    return marker;
}
function refreshPhotoMarkerImage(photo) {
    if (!photo) return;
    var marker = findPhotoMarker(photo.id);
    if (!marker) return;
    var src = getPhotoDisplaySrc(photo);
    if (typeof marker.setIcon === "function") marker.setIcon(buildPhotoMarkerIcon(src, getPhotoMarkerSize(), photo));
    if (marker._photoImageElement) marker._photoImageElement.src = src;
}
function rememberPhotoDisplayObjectUrl(photo, blob) {
    if (!photo || !blob || typeof URL === "undefined" || typeof URL.createObjectURL !== "function") return false;
    var oldUrl = photoDisplayObjectUrls.get(photo.id);
    if (oldUrl && typeof URL.revokeObjectURL === "function") { try { URL.revokeObjectURL(oldUrl); } catch (_) {} }
    try {
        var url = URL.createObjectURL(blob);
        photoDisplayObjectUrls.set(photo.id, url);
        photo._displayObjectUrl = url;
        // Keep the normal display fields populated too, so marker resizing and
        // photo lists use the recovered image instead of falling back to SVG.
        if (!photo.thumb) photo.thumb = url;
        if (!photo.photo) photo.photo = url;
        refreshPhotoMarkerImage(photo);
        return true;
    } catch (_) { return false; }
}
var photoPreviewRecoveryQueue = Promise.resolve();
var photoPreviewRecoveryPending = new Map();
function queuePhotoPreviewRecovery(photo, row) {
    if (!photo || !photo.id || photoHasImageData(photo)) return Promise.resolve(false);
    var pending = photoPreviewRecoveryPending.get(photo.id);
    if (pending) return pending;
    var task = photoPreviewRecoveryQueue.then(async function() {
        while (typeof document !== "undefined" && document.hidden) {
            await new Promise(function(resolve) { setTimeout(resolve, 5000); });
        }
        // A photo deleted while waiting must not recreate its durable image row.
        if (photos.indexOf(photo) === -1 || photoHasImageData(photo)) return false;
        return hydratePhotoImageFromOriginal(photo, row);
    }).catch(function(error) {
        console.warn("Photo preview recovery failed", error);
        return false;
    }).then(function(recovered) {
        photoPreviewRecoveryPending.delete(photo.id);
        if (recovered) { updatePhotoList(); scheduleSave(); }
        return recovered;
    });
    photoPreviewRecoveryPending.set(photo.id, task);
    photoPreviewRecoveryQueue = task.catch(function(error) {
        console.warn("Photo preview refresh failed", error);
    }).then(function() {
        return new Promise(function(resolve) { setTimeout(resolve, 1000); });
    });
    return task;
}
async function hydratePhotoImageFromOriginal(photo, row) {
    if (!photo || photoHasImageData(photo)) return false;
    var original = row && row.originalBlob && row.originalBlob.size ? row.originalBlob : null;
    // sourceUri only resolves through the Android bridge. On the web build the
    // image can still live behind sourceWebPath or a remote URL, so the shared
    // lookup is used instead of the native-only one.
    if (!original) original = await getPhotoRecoveryBlob(photo).catch(function() { return null; });
    if (!original || !original.size) return false;
    // A JPEG/PNG can be displayed immediately while a compressed preview is
    // generated. This removes the placeholder even if canvas conversion fails.
    rememberPhotoDisplayObjectUrl(photo, original);
    try {
        var file = isHeicLikeBlob(original) ? await convertHeicToJpegFile(original) : original;
        var image = await loadImageFromFile(file);
        var thumb = resizeImage(image, { maxSize: PHOTO_THUMB_SIZE, quality: PHOTO_THUMB_JPEG_QUALITY, minQuality: PHOTO_THUMB_MIN_QUALITY, targetBytes: PHOTO_THUMB_TARGET_BYTES });
        var popup = PHOTO_STORE_PREVIEW ? resizeImage(image, { maxSize: PHOTO_POPUP_MAX_SIZE, quality: PHOTO_POPUP_JPEG_QUALITY, minQuality: PHOTO_POPUP_MIN_QUALITY, targetBytes: PHOTO_POPUP_TARGET_BYTES }) : "";
        photo.thumb = thumb || photo.thumb;
        photo.photo = popup || photo.photo || photo.thumb;
        var temporaryUrl = photoDisplayObjectUrls.get(photo.id);
        if (temporaryUrl && typeof URL !== "undefined" && typeof URL.revokeObjectURL === "function") {
            try { URL.revokeObjectURL(temporaryUrl); } catch (_) {}
        }
        photoDisplayObjectUrls.delete(photo.id);
        delete photo._displayObjectUrl;
        refreshPhotoMarkerImage(photo);
        // Repair the durable preview row so this photo is fast on the next run.
        await idbSavePhoto(photo.id, popup || photo.photo, thumb || photo.thumb, original, original.type || "image/jpeg").catch(function(error) {
            console.warn("Recovered photo preview could not be cached", error);
        });
        return true;
    } catch (error) {
        console.warn("Recovered photo preview conversion failed", error);
        return true;
    }
}
async function getPhotoRecoveryBlob(photo) {
    if (!photo || !photo.id) return null;
    var stored = await idbGetPhoto(photo.id).catch(function() { return null; });
    if (stored && stored.originalBlob && stored.originalBlob.size) return stored.originalBlob;
    if (photo.sourceUri) {
        var nativeBlob = await getOriginalPhotoBlob(photo.sourceUri, null).catch(function() { return null; });
        if (nativeBlob && nativeBlob.size) return nativeBlob;
    }
    var candidates = [photo.sourceWebPath, photo.remotePhotoUrl].filter(Boolean);
    for (var i = 0; i < candidates.length; i++) {
        var blob = await fetchBlobFromUrl(candidates[i]).catch(function() { return null; });
        if (blob && blob.size) return blob;
    }
    return null;
}
// Restores the true capture position from the original file. Returns true only when
// a real EXIF coordinate was found; it never falls back to the current position.
async function recoverPhotoLocationFromExif(photo, options) {
    options = options || {};
    if (!photo || !photo.id) return false;
    if (!options.force && isValidPhotoCoordinate(photo.lat, photo.lng)) return true;
    if (!options.force && photo._exifRecoveryTried) return false;
    photo._exifRecoveryTried = true;
    var blob = await getPhotoRecoveryBlob(photo).catch(function() { return null; });
    if (!blob) {
        if (!options.silent) showCollectionToast(getPhotoInteractionText().originalMissing);
        return false;
    }
    var gps = await getPhotoExifGps(blob).catch(function() { return null; });
    if (!gps || !isValidPhotoCoordinate(gps.lat, gps.lng)) {
        if (!options.silent) showCollectionToast(getPhotoInteractionText().rereadFailed);
        return false;
    }
    photo.lat = Number(gps.lat);
    photo.lng = Number(gps.lng);
    photo.locationSource = "exif";
    photo.locationAccuracy = null;
    var existing = findPhotoMarker(photo.id);
    if (existing) { photoClusterGroup.removeLayer(existing); forgetPhotoMarker(photo.id); }
    createPhotoMarker(photo, false);
    if (!options.deferSave) scheduleSave();
    return true;
}
async function reReadPhotoLocation(photo) {
    if (!photo || !photo.id) return;
    var restored = await recoverPhotoLocationFromExif(photo, { force: true });
    if (!restored) return;
    persistState();
    updatePhotoList();
    showCollectionToast(getPhotoInteractionText().locationRestored);
    setSelectedDestination(photo.lat, photo.lng, earlyMemoryDateText(photo, true) || getPhotoInteractionText().exifLocation);
    map.flyTo([photo.lat, photo.lng], Math.min(17, map.getMaxZoom()));
    var marker = findPhotoMarker(photo.id);
    if (marker && typeof marker.openPopup === "function") setTimeout(function() { marker.openPopup(); }, 700);
}
function deletePhoto(id) {
    var photo = photos.find(function(p) { return p.id === id; });
    if (!photo || !commitJourneyDeletion("photos", id)) return;
    deleteRemotePhotoFiles(photo);
    var marker = findPhotoMarker(id);
    if (marker) { photoClusterGroup.removeLayer(marker); forgetPhotoMarker(id); }
    idbDeletePhoto(id).catch(function(e) { console.warn("IDB 삭제 실패", e); });
    try { window.dispatchEvent(new CustomEvent("giloa:photo-deleted", { detail:{ photoId:id } })); } catch (_) {}
    updateStats();
}
function escapeHtml(value) { return String(value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"); }
function getReadableImagePredictionLabel(label) {
    var text = String(label || "").trim();
    var photoText = getPhotoInteractionText();
    if (!text || /[^\w\s가-힣%-]/.test(text)) return photoText.photoAnalysis;
    return photoText.photoAnalysis;
}
function renderStoredMarkers() { memories.forEach(function(m) { createMemoryMarker(m, false); }); }
// Read-only route-date lookup; no continuous work or changes to stored GPS.
function findRouteDatesAt(latlng) {
    var hits = [], nearest = Infinity;
    var press = map.latLngToContainerPoint(latlng);
    var projected = new WeakMap();
    function project(point) {
        var cached = projected.get(point);
        if (!cached) { cached = map.latLngToContainerPoint([point.lat,point.lng]); projected.set(point,cached); }
        return cached;
    }
    [pathCoordinates, rawGpsPoints].forEach(function(points) {
        (points || []).forEach(function(point, index) {
            if (!point || !isValidPhotoCoordinate(point.lat, point.lng)) return;
            var b = project(point), a = b;
            var previous = index ? points[index - 1] : null;
            if (previous && isValidPhotoCoordinate(previous.lat, previous.lng)) a = project(previous);
            else previous = null;
            // Reject distant segments before GPS distance/session checks.
            if (press.x < Math.min(a.x,b.x)-14 || press.x > Math.max(a.x,b.x)+14 ||
                press.y < Math.min(a.y,b.y)-14 || press.y > Math.max(a.y,b.y)+14) return;
            if (previous && !shouldConnectStoredPathPoints(previous,point)) { a = b; previous = null; }
            var dx = b.x-a.x, dy = b.y-a.y, length = dx*dx+dy*dy;
            var t = length ? Math.max(0,Math.min(1,((press.x-a.x)*dx+(press.y-a.y)*dy)/length)) : 0;
            var x = a.x+dx*t, y = a.y+dy*t;
            if (Math.hypot(press.x-x,press.y-y) > 14) return;
            var distance = map.distance(latlng,map.containerPointToLatLng([x,y]));
            if (!isFinite(distance) || distance > 35) return;
            nearest = Math.min(nearest,distance);
            hits.push({distance:distance, start:Number(previous ? (previous.endTime || previous.timestamp || previous.startTime) : (point.startTime || point.timestamp)), end:Number(point.endTime || point.timestamp || point.startTime)});
        });
    });
    var days = new Map();
    hits.forEach(function(hit) {
        if (hit.distance > nearest+5) return;
        var valid = false;
        [hit.start,hit.end].forEach(function(stamp) {
            if (!isFinite(stamp) || stamp <= 0) return;
            var date = new Date(stamp);
            if (isNaN(date.getTime())) return;
            valid = true;
            var key = date.getFullYear()+"-"+date.getMonth()+"-"+date.getDate();
            if (!days.has(key)) days.set(key,stamp);
        });
        if (!valid) days.set("unknown",null);
    });
    return Array.from(days.values()).sort(function(a,b) { return (b || 0)-(a || 0); });
}
function showRouteDatesAt(latlng) {
    if (typeof pendingPhotoLocationChoice !== "undefined" && pendingPhotoLocationChoice) return false;
    var dates = findRouteDatesAt(latlng);
    if (!dates.length) return false;
    var words = {ko:["이 길을 지난 날짜","날짜 정보 없음"],en:["Dates on this route","Date unavailable"],ja:["この道を通った日","日付情報なし"],zh:["经过这条路的日期","无日期信息"],es:["Fechas en esta ruta","Fecha no disponible"],fr:["Dates de passage","Date indisponible"]};
    var lang = typeof currentLang === "string" ? currentLang : "ko", text = words[lang] || words.ko;
    var box = document.createElement("div"); box.className = "route-dates-popup";
    var title = document.createElement("strong"); title.textContent = text[0]; box.appendChild(title);
    var list = document.createElement("ul");
    dates.forEach(function(stamp) {
        var item = document.createElement("li");
        item.textContent = stamp === null ? text[1] : new Date(stamp).toLocaleDateString(lang,{year:"numeric",month:"2-digit",day:"2-digit"});
        list.appendChild(item);
    });
    box.appendChild(list);
    L.popup({closeButton:true,closeOnClick:true,maxWidth:280}).setLatLng(latlng).setContent(box).openOn(map);
    return true;
}
function initRouteDatesLongPress() {
    var container = map.getContainer();
    if (container.dataset.routeDatesBound === "1") return;
    container.dataset.routeDatesBound = "1";
    var timer = null, origin = null, held = false, suppressUntil = 0;
    function cancel() { if (timer !== null) clearTimeout(timer); timer = null; origin = null; }
    function excluded(target) { return target && target.closest && target.closest(".leaflet-marker-icon,.leaflet-control,.leaflet-popup,.leaflet-interactive,button,input,a"); }
    container.addEventListener("pointerdown",function(event) {
        if (event.isPrimary === false) { cancel(); return; }
        cancel(); held = false; suppressUntil = 0;
        if (event.button !== 0 || excluded(event.target)) return;
        if (typeof pendingPhotoLocationChoice !== "undefined" && pendingPhotoLocationChoice) return;
        origin = {x:event.clientX,y:event.clientY,id:event.pointerId};
        var latlng = map.mouseEventToLatLng(event);
        timer = setTimeout(function() { timer = null; held = showRouteDatesAt(latlng); if (held) suppressUntil = Date.now()+1500; },650);
    },{passive:true});
    window.addEventListener("pointermove",function(event) {
        if (origin && event.pointerId === origin.id && Math.hypot(event.clientX-origin.x,event.clientY-origin.y) > 10) cancel();
    },{passive:true});
    window.addEventListener("pointerup",function() { if (held) suppressUntil = Date.now()+450; held = false; cancel(); },{passive:true});
    window.addEventListener("pointercancel",function() { held = false; cancel(); },{passive:true});
    window.addEventListener("blur",cancel);
    map.on("dragstart zoomstart",cancel);
    container.addEventListener("click",function(event) {
        if (Date.now() < suppressUntil && !excluded(event.target)) { event.preventDefault(); event.stopImmediatePropagation(); suppressUntil = 0; }
    },true);
    container.addEventListener("contextmenu",function(event) {
        if (excluded(event.target)) return;
        if (origin || held) { event.preventDefault(); return; }
        if (showRouteDatesAt(map.mouseEventToLatLng(event))) { event.preventDefault(); event.stopPropagation(); }
    });
}
initRouteDatesLongPress();
var PHOTO_LOCATION_MIGRATION_KEY = "giloa-photo-location-migration-v1";
var PHOTO_LOCATION_RECOVERY_BATCH = 3;
var photoLocationRecoveryRunning = false;
var photoLocationRecoveryTimer = null;
function scheduleDeferredPhotoLocationRecovery() {
    if (photoLocationRecoveryRunning || photoLocationRecoveryTimer !== null) return;
    if (!photos.some(function(p) { return p && !isValidPhotoCoordinate(p.lat, p.lng) && !p._exifRecoveryTried; })) return;
    // Start after first paint; inspect all pending photos in yielding batches.
    photoLocationRecoveryTimer = setTimeout(function() {
        photoLocationRecoveryTimer = null;
        migratePhotoLocations();
    }, 5000);
}
async function migratePhotoLocations(options) {
    options = options || {};
    if (photoLocationRecoveryRunning) return 0;
    // A past migration flag cannot describe photos imported since that migration.
    photoLocationRecoveryRunning = true;
    var recovered = 0;
    var dirty = false;
    try {
        var targets = photos.filter(function(p) { return p && !isValidPhotoCoordinate(p.lat, p.lng) && (options.force || !p._exifRecoveryTried); });
        var limit = targets.length;
        for (var i = 0; i < limit; i++) {
            // Photo repair can wait while the app is hidden; GPS recording is independent.
            while (typeof document !== "undefined" && document.hidden) {
                await new Promise(function(resolve) { setTimeout(resolve, 5000); });
            }
            if (photos.indexOf(targets[i]) === -1) continue;
            var restored = false;
            try {
                restored = await recoverPhotoLocationFromExif(targets[i], { silent: true, force: !!options.force, deferSave: true });
            } catch (photoError) {
                console.warn("Photo location recovery skipped a failed photo", photoError);
            }
            if (restored) { recovered += 1; dirty = true; }
            var batchEnd = (i + 1) % PHOTO_LOCATION_RECOVERY_BATCH === 0;
            if (batchEnd && dirty) { persistState(); updatePhotoList(); dirty = false; }
            if (i + 1 < limit) {
                await new Promise(function(resolve) { setTimeout(resolve, batchEnd ? 5000 : 1000); });
            }
        }
        if (targets.length <= limit) safeStorageSet(PHOTO_LOCATION_MIGRATION_KEY, "done");
    } catch (error) {
        console.warn("\uc0ac\uc9c4 \uc704\uce58 \ubcf5\uad6c \uc2e4\ud328", error);
    } finally {
        try {
            if (dirty) { persistState(); updatePhotoList(); }
        } finally {
            photoLocationRecoveryRunning = false;
        }
    }
    return recovered;
}
function renderStoredPhotoMarkers() {
    if (!Array.isArray(photos) || photos.length === 0) return;
    var applyStoredPhotos = function(idbList) {
        var idbMap = new Map((idbList || []).map(function(r) { return [r.id, r]; }));
        var fingerprintAdded = false;
        var mapped = 0;
        var unlocated = 0;
        photos.forEach(function(p) {
            var img = idbMap.get(p.id);
            if (img) {
                p.thumb = img.thumb || img.photo || p.thumb || "";
                p.photo = img.photo || p.thumb || "";
                p.hasOriginalBlob = !!img.originalBlob;
            } else {
                p.thumb = p.thumb || p.remoteThumbUrl || "";
                p.photo = p.photo || p.remotePhotoUrl || p.remoteThumbUrl || "";
            }
            if (!p.contentFingerprint && p.thumb) {
                p.contentFingerprint = getPhotoContentFingerprint(p.thumb);
                fingerprintAdded = true;
            }
            // The marker depends on the coordinate alone. Image data that failed to load
            // must not remove the memory from the map, and the photo is never deleted.
            if (isValidPhotoCoordinate(p.lat, p.lng)) { createPhotoMarker(p, false); mapped += 1; }
            else unlocated += 1;
            if (!photoHasImageData(p)) {
                // Preview recovery must not depend on the photo having coordinates.
                // A located photo showed its image while an unlocated one was stuck
                // with the placeholder forever, even though both can be repaired.
                queuePhotoPreviewRecovery(p, img).catch(function(error) {
                    console.warn("Photo preview update failed", error);
                });
            }
        });
        if (fingerprintAdded) scheduleSave();
        updatePhotoList();
        console.log("[GILOA PHOTO] " + JSON.stringify({ total: photos.length, mapped: mapped, unlocated: unlocated, idbRows: idbMap.size }));
        if (unlocated > 0) scheduleDeferredPhotoLocationRecovery();
    };
    idbGetAllPhotos().then(applyStoredPhotos).catch(function(e) {
        // Even with no image store at all the coordinates alone rebuild every marker.
        console.warn("IDB \ubd88\ub7ec\uc624\uae30 \uc2e4\ud328 - \uc88c\ud45c\ub85c\ub9cc \uc0ac\uc9c4 \ub9c8\ucee4\ub97c \ubcf5\uc6d0\ud569\ub2c8\ub2e4", e);
        applyStoredPhotos([]);
    });
}
window.giloaPhotoDiagnostic = function(silent) {
    var summary = { total: photos.length, located: 0, unlocated: 0, exif: 0, manual: 0, current: 0, route: 0, map: 0, unknown: 0, markers: 0, missingImage: 0 };
    if (photoClusterGroup) photoClusterGroup.eachLayer(function() { summary.markers += 1; });
    var rows = photos.map(function(p) {
        var has = isValidPhotoCoordinate(p.lat, p.lng);
        var source = normalizePhotoLocationSource(p.locationSource, has);
        if (has) summary.located += 1; else summary.unlocated += 1;
        if (typeof summary[source] === "number") summary[source] += 1;
        if (!photoHasImageData(p)) summary.missingImage += 1;
        return {
            id: p.id, dateString: p.dateString,
            lat: has ? Number(p.lat) : null, lng: has ? Number(p.lng) : null,
            locationSource: source, sourceType: p.sourceType || "",
            image: photoHasImageData(p), marker: !!findPhotoMarker(p.id)
        };
    });
    console.log("[\uc0ac\uc9c4 \uc704\uce58 \uc9c4\ub2e8]", summary);
    if (!silent && summary.missingImage > 0 && window.giloaPhotoStorageDiagnostic) {
        setTimeout(function() { window.giloaPhotoStorageDiagnostic(); }, 400);
    }
    if (typeof console.table === "function") console.table(rows); else console.log(rows);
    var photoWords = getPhotoInteractionText();
    var text = "[" + earlyUiText("photoDiagnostic") + "]\n\n"
        + earlyUiText("totalPhotos") + ": " + summary.total + "\n"
        + earlyUiText("located") + ": " + summary.located + "\n"
        + earlyUiText("unlocated") + ": " + summary.unlocated + "\n"
        + earlyUiText("mapMarkers") + ": " + summary.markers + "\n"
        + earlyUiText("missingImage") + ": " + summary.missingImage + "\n\n"
        + photoWords.exifLocation + ": " + summary.exif + "\n"
        + photoWords.manualLocation + ": " + summary.manual + "\n"
        + photoWords.currentLocation + ": " + summary.current + "\n"
        + photoWords.routeLocation + ": " + summary.route + "\n"
        + earlyUiText("unknown") + ": " + (summary.unknown + summary.map);
    if (!silent) {
        // The APK has no DevTools and its WebView can swallow alert(), so the
        // report is written into the existing on-screen diagnostic panel first.
        showGiloaDiagnosticReport(text, earlyUiText("photoDiagnostic"));
    }
    return { summary: summary, photos: rows, text: text };
};
// Answers the one question the photo diagnostic could not: is the image row
// absent entirely, present but previewless, or present with an original that
// recovery should have used?
window.giloaPhotoStorageDiagnostic = async function() {
    var lines = ["[" + earlyUiText("storageDiagnostic") + "]", ""];
    lines.push(earlyUiText("address") + ": " + (location.origin || "file://"));
    lines.push(earlyUiText("totalPhotos") + ": " + photos.length);
    var rows = [];
    try {
        rows = await idbGetAllPhotos();
    } catch (error) {
        lines.push(earlyUiText("idbReadFailed") + ": " + (error && error.message));
        return showGiloaDiagnosticReport(lines.join("\n"), earlyUiText("storageDiagnostic"));
    }
    var byId = new Map((rows || []).map(function(r) { return [r.id, r]; }));
    var counts = { noRow: 0, rowNoImage: 0, rowWithOriginal: 0, ok: 0 };
    var samples = [];
    photos.forEach(function(p) {
        var row = byId.get(p.id);
        var state;
        if (photoHasImageData(p)) { state = "imageOk"; counts.ok += 1; }
        else if (!row) { state = "idbMissing"; counts.noRow += 1; }
        else if (row.originalBlob && row.originalBlob.size) { state = "originalOnly"; counts.rowWithOriginal += 1; }
        else { state = "rowWithoutImage"; counts.rowNoImage += 1; }
        if (state !== "imageOk" && samples.length < 8) {
            samples.push("  " + (p.dateString || p.id) + " → " + earlyUiText(state)
                + " | thumb " + ((p.thumb || "").length)
                + " | sourceUri " + earlyUiText(p.sourceUri ? "present" : "none")
                + " | remote " + earlyUiText(p.remoteThumbUrl || p.remotePhotoUrl ? "present" : "none"));
        }
    });
    lines.push(earlyUiText("idbRows") + ": " + byId.size);
    lines.push("");
    lines.push(earlyUiText("imagesOk") + ": " + counts.ok);
    lines.push(earlyUiText("idbMissing") + ": " + counts.noRow);
    lines.push(earlyUiText("rowWithoutImage") + ": " + counts.rowNoImage);
    lines.push(earlyUiText("recoverableOriginal") + ": " + counts.rowWithOriginal);
    if (samples.length) {
        lines.push("");
        lines.push("--- " + earlyUiText("problemPhotos") + " ---");
        lines = lines.concat(samples);
    }
    return showGiloaDiagnosticReport(lines.join("\n"), earlyUiText("storageDiagnostic"));
};
window.giloaRecoverPhotoLocations = function() { return migratePhotoLocations({ force: true }); };
function initGpxDial() { dialHours = 8; updateDialUI(); }
function initHudTapTargets() { var hud = document.getElementById("hud"); var handle = document.getElementById("hud-handle"); var distItem = document.querySelector(".hud-prog-item:nth-child(1)"); var photoItem = document.querySelector(".hud-prog-item:nth-child(3)"); if (hud && !hud.dataset.stopBound) { hud.dataset.stopBound = "1"; ["click", "pointerdown"].forEach(function(type) { hud.addEventListener(type, function(e) { e.stopPropagation(); }, { passive: true }); }); } if (handle) { handle.style.cursor = "pointer"; } if (distItem) { distItem.style.cursor = "pointer"; distItem.addEventListener("click", function() { toggleSidebar(true); switchTab("gpx"); }); } if (photoItem) { photoItem.style.cursor = "pointer"; photoItem.addEventListener("click", function() { toggleSidebar(true); switchTab("photo"); }); } }


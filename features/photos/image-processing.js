function ensureTf() {
    if (window.tf) return Promise.resolve(window.tf);
    return new Promise(function(resolve, reject) {
        var script = document.createElement("script");
        script.src = "./vendor/tf.min.js";
        script.async = true;
        script.onload = function() { window.tf ? resolve(window.tf) : reject(new Error("TensorFlow.js 로드 실패")); };
        script.onerror = function() { reject(new Error("TensorFlow.js 파일을 불러오지 못했습니다.")); };
        document.head.appendChild(script);
    });
}
async function loadImageClassifier() {
    if (imageClassifierPromise) return imageClassifierPromise;
    imageClassifierPromise = Promise.all([
        ensureTf(),
        fetch(IMAGE_CLASSIFIER_METADATA_URL).then(function(res) {
            if (!res.ok) throw new Error("이미지 모델 메타데이터 로드 실패");
            return res.json();
        })
    ]).then(function(result) {
        var tf = result[0];
        imageClassifierMeta = result[1] || {};
        return tf.loadLayersModel(IMAGE_CLASSIFIER_MODEL_URL).then(function(model) {
            return {
                model: model,
                labels: Array.isArray(imageClassifierMeta.labels) ? imageClassifierMeta.labels : [],
                imageSize: imageClassifierMeta.imageSize || 224
            };
        });
    }).catch(function(e) {
        imageClassifierPromise = null;
        throw e;
    });
    return imageClassifierPromise;
}
async function classifyImportedImage(img) {
    var input = null;
    var prediction = null;
    try {
        var bundle = await promiseWithTimeout(loadImageClassifier(), 15000, "Image model load");
        var tf = window.tf;
        input = tf.tidy(function() {
            return tf.browser.fromPixels(img)
                .resizeBilinear([bundle.imageSize, bundle.imageSize])
                .toFloat()
                .div(127.5)
                .sub(1)
                .expandDims(0);
        });
        prediction = bundle.model.predict(input);
        var values = Array.from(await prediction.data());
        var bestIndex = 0;
        for (var i = 1; i < values.length; i++) {
            if (values[i] > values[bestIndex]) bestIndex = i;
        }
        var label = getReadableImagePredictionLabel(bundle.labels[bestIndex]);
        var probability = values[bestIndex] || 0;
        return {
            label: label,
            probability: probability,
            percent: Math.round(probability * 1000) / 10,
            accepted: probability >= IMAGE_CLASSIFIER_THRESHOLD,
            badgeId: probability >= IMAGE_CLASSIFIER_THRESHOLD ? IMAGE_CLASS_BADGES[label] || "" : ""
        };
    } catch (e) {
        console.warn("이미지 분석 실패", e);
        return null;
    } finally {
        if (prediction) prediction.dispose();
        if (input) input.dispose();
    }
}
function awardImagePredictionBadge(prediction) {
    if (!prediction || !prediction.accepted || !prediction.badgeId) return false;
    earnBadge(prediction.badgeId);
    return true;
}

// ?占쎌쭊 泥섎━
function showPhotoImportProgress(current, total) {
    var progress = document.getElementById("photo-import-progress");
    if (!progress) {
        progress = document.createElement("div");
        progress.id = "photo-import-progress";
        progress.setAttribute("role", "status");
        progress.setAttribute("aria-live", "polite");
        document.body.appendChild(progress);
    }
    var text = getPhotoInteractionText().importProgress || getPhotoInteractionText().photoAnalysis;
    progress.textContent = text.replace("{current}", current).replace("{total}", total);
    progress.hidden = false;
    // Paint the map after the native picker, before bridge reads or canvas work.
    return new Promise(function(resolve) { setTimeout(resolve, 32); });
}
function hidePhotoImportProgress() {
    var progress = document.getElementById("photo-import-progress");
    if (progress) progress.hidden = true;
}
function awardPhotoImagePrediction(data, mission) {
    if (!mission || !data.imagePrediction || !data.imagePrediction.accepted) return;
    var targetText = (mission.name + " " + (mission.item && mission.item.imageLabel || "")).toLowerCase();
    var labelText = String(data.imagePrediction.label || "").toLowerCase();
    if (labelText && targetText.indexOf(labelText) >= 0) awardImagePredictionBadge(data.imagePrediction);
}
function renderPhotoImagePrediction(element, data) {
    var prediction = data.imagePrediction;
    element.hidden = !(prediction && prediction.label);
    if (element.hidden) return;
    var text = getPhotoInteractionText();
    element.className = prediction.accepted ? "photo-ai-result accepted" : "photo-ai-result";
    element.textContent = getReadableImagePredictionLabel(prediction.label) + " " + (prediction.percent || 0) + "% · " + (prediction.accepted ? text.analysisAccepted : text.analysisRetry);
}
var photoImageAnalysisQueue = Promise.resolve();
function schedulePhotoImageAnalysis(data, img, mission) {
    // Retain only model-sized pixels, never a batch of decoded camera originals.
    var input = document.createElement("canvas");
    input.width = input.height = imageClassifierMeta && imageClassifierMeta.imageSize || 224;
    var context = input.getContext("2d");
    context.drawImage(img, 0, 0, input.width, input.height);
    photoImageAnalysisQueue = photoImageAnalysisQueue.then(async function() {
        await new Promise(function(resolve) { setTimeout(resolve, 32); });
        if (photos.indexOf(data) < 0) return;
        var prediction = await classifyImportedImage(input);
        // Deleting a photo while analysis runs must not resurrect it.
        if (!prediction || photos.indexOf(data) < 0) return;
        data.imagePrediction = prediction;
        awardPhotoImagePrediction(data, mission);
        var marker = findPhotoMarker(data.id);
        if (marker && marker._photoPredictionElement) {
            renderPhotoImagePrediction(marker._photoPredictionElement, data);
            if (marker.isPopupOpen()) marker.getPopup().update();
        }
        scheduleSave();
    }).catch(function(error) {
        console.warn("Deferred photo analysis failed", error);
    }).finally(function() {
        input.width = input.height = 0;
    });
}

async function processPhoto(img, now, lat, lng, options) {
    options = options || {};
    var imageMission = activeImageMission;
    if (!(now instanceof Date) || isNaN(now.getTime())) now = new Date();
    var hasLocation = isValidPhotoCoordinate(lat, lng);
    lat = hasLocation ? Number(lat) : null;
    lng = hasLocation ? Number(lng) : null;
    var thumb = resizeImage(img, { maxSize: PHOTO_THUMB_SIZE, quality: PHOTO_THUMB_JPEG_QUALITY, minQuality: PHOTO_THUMB_MIN_QUALITY, targetBytes: PHOTO_THUMB_TARGET_BYTES });
    var popup = PHOTO_STORE_PREVIEW
        ? resizeImage(img, { maxSize: PHOTO_POPUP_MAX_SIZE, quality: PHOTO_POPUP_JPEG_QUALITY, minQuality: PHOTO_POPUP_MIN_QUALITY, targetBytes: PHOTO_POPUP_TARGET_BYTES })
        : "";
    var previewSrc = popup || thumb;
    var contentFingerprint = getPhotoContentFingerprint(thumb);
    var duplicate = photos.find(function(photo) { return photo && photo.contentFingerprint && photo.contentFingerprint === contentFingerprint; });
    if (duplicate) return duplicate;
    var id = String(now.getTime()) + Math.random().toString(36).slice(2);
    var data = {
        id: id, lat: lat, lng: lng, photo: previewSrc, thumb: thumb, time: now.getTime(),
        dateString: now.toLocaleDateString("ko-KR", { year:"numeric", month:"long", day:"numeric" }),
        timeString: now.toLocaleTimeString("ko-KR", { hour:"2-digit", minute:"2-digit" }),
        memo: "",
        emotion: "",
        missionId: options.mission && (options.mission.id || options.mission.targetId) || "",
        placeId: options.mission && options.mission.targetId || "",
        sourceUri: typeof options.sourceUri === "string" ? options.sourceUri : "",
        sourceWebPath: typeof options.sourceWebPath === "string" ? options.sourceWebPath : "",
        sourceType: typeof options.sourceType === "string" ? options.sourceType : "",
        locationSource: normalizePhotoLocationSource(options.locationSource, hasLocation),
        locationAccuracy: typeof options.locationAccuracy === "number" && isFinite(options.locationAccuracy) ? Number(options.locationAccuracy) : null,
        remotePhotoUrl: "",
        remoteThumbUrl: "",
        storagePath: "",
        thumbStoragePath: "",
        imagePrediction: options.imagePrediction || null,
        heading: isFinite(options.heading) ? normalizeHeading(options.heading) : (options.sourceType === "camera" && isFinite(playerHeading) ? normalizeHeading(playerHeading) : null),
        contentFingerprint: contentFingerprint
    };
    await idbSavePhoto(id, popup, thumb, options.originalBlob || null, options.originalBlob && options.originalBlob.type || "image/jpeg");
    photos.push(data);
    if (!hasLocation) {
        var locationChoice = await requestMissingPhotoLocation(data, { isNewImport: true });
        if (locationChoice === "cancel") {
            photos = photos.filter(function(photo) { return photo.id !== data.id; });
            await idbDeletePhoto(data.id).catch(function(error) { console.warn("Cancelled photo cleanup failed", error); });
            if (!options.deferUi) {
                updateStats();
                scheduleSave();
                updatePhotoList();
            }
            return null;
        }
        hasLocation = isValidPhotoCoordinate(data.lat, data.lng);
    }
    // Commit photo metadata immediately. Large camera images can make Android
    // reclaim the WebView before the normal delayed checkpoint runs.
    scheduleSave({ immediate:true });
    awardPhotoImagePrediction(data, imageMission);
    showGiloReaction("photo");
    if (window.GiloaHiddenMissions) window.GiloaHiddenMissions.onPhoto(data);
    if (data.sourceType === "camera" && hasLocation) checkNearbyVisitCompletion({ method: "photo", photo: data });
    uploadPhotoRemote(data, { img: img, originalBlob: options.originalBlob || null, originalUrl: options.originalUrl || "" }).catch(function(e) { console.warn("Remote photo upload failed", e); });
    if (hasLocation) createPhotoMarker(data, options.openPopup !== false);
    if (!options.deferUi) {
        updateStats();
        scheduleSave({ immediate:true });
        updatePhotoList();
    }
    try {
        window.dispatchEvent(new CustomEvent("giloa:photo-saved", { detail:{ photo:data } }));
    } catch (timeTraceError) { console.warn("Time Trace photo hook failed", timeTraceError); }
    if (options.deferImageAnalysis && !data.imagePrediction) {
        try { schedulePhotoImageAnalysis(data, img, imageMission); }
        catch (analysisError) { console.warn("Photo analysis scheduling failed", analysisError); }
    }
    return data;
}

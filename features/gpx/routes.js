function adjustHourDial(dir) { var next = dialHours + dir; if (next < 1 || next > 8) return; dialHours = next; updateDialUI(); }
function updateDialUI() { var t = UI_TEXT[currentLang] || UI_TEXT.ko; var labelEl = document.getElementById("dial-hour-label"); var infoEl = document.getElementById("gpx-range-info"); if (labelEl) labelEl.textContent = dialHours + t.gpx_hour_short; if (infoEl) infoEl.textContent = t.gpx_recent_route.replace("{hours}", dialHours); }
function splitRecordedPathSegments(points) {
    var sorted = (points || []).filter(function(point) {
        return point && isFinite(point.lat) && isFinite(point.lng) && isFinite(Number(point.startTime));
    }).slice().sort(function(a, b) { return Number(a.startTime) - Number(b.startTime); });
    var segments = [];
    sorted.forEach(function(point) {
        var segment = segments[segments.length - 1];
        var previous = segment && segment[segment.length - 1];
        if (!segment || !getTransportSegmentStyle(previous, point, Date.now())) {
            segment = [];
            segments.push(segment);
        }
        segment.push(point);
    });
    return segments.filter(function(segment) { return segment.length > 0; });
}
function buildGpxContent(name, points) {
    var segmentXml = splitRecordedPathSegments(points).map(function(segment) {
        var trkpts = segment.map(function(point) {
            var time = new Date(Number(point.startTime)).toISOString();
            var accuracyXml = isFinite(point.accuracy) ? '\n        <extensions><giloa:accuracy>' + Number(point.accuracy).toFixed(1) + '</giloa:accuracy></extensions>' : '';
            return '      <trkpt lat="' + Number(point.lat).toFixed(7) + '" lon="' + Number(point.lng).toFixed(7) + '">\n        <time>' + time + '</time>' + accuracyXml + '\n      </trkpt>';
        }).join("\n");
        return '    <trkseg>\n' + trkpts + '\n    </trkseg>';
    }).join("\n");
    return '<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="Giloa"\n     xmlns="http://www.topografix.com/GPX/1/1" xmlns:giloa="https://giloa.kr/gpx/1">\n  <metadata><name>' + escapeXml(name) + '</name><time>' + new Date().toISOString() + '</time></metadata>\n  <trk><name>' + escapeXml(name) + '</name>\n' + segmentXml + '\n  </trk>\n</gpx>';
}
function escapeXml(value) { return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;"); }
function saveGpxRecord(name, points, options) {
    if (!window.GiloaGpxAccess || !window.GiloaGpxAccess.requireAccess()) return;
    options = options || {};
    if (!Array.isArray(points) || points.length === 0) return null;
    var gpxContent = buildGpxContent(name, points);
    var saves = loadGpxSaves();
    var id = String(Date.now()) + Math.random().toString(36).slice(2);
    saves.push({ id:id, name:name, createdAt:Date.now(), pointCount:points.length, gpxContent:gpxContent });
    var savedLocally = saveGpxSaves(saves);
    if (savedLocally) updateGpxSavedList();
    // Internal storage failure must not prevent exporting the existing route.
    if (!savedLocally && !options.download) return null;
    var nativeDownload = false;
    if (options.download && window.GiloaPhotoBridge && typeof window.GiloaPhotoBridge.saveGpxFile === "function") {
        if (window.GiloaPhotoBridge.saveGpxFile("giloa_" + name + ".gpx", gpxContent) !== true) throw new Error("Native GPX export unavailable or busy");
        nativeDownload = true;
    } else if (options.download) {
        var blob = new Blob([gpxContent], { type:"application/gpx+xml" });
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        try {
            a.href = url;
            a.download = "giloa_" + name + ".gpx";
            a.style.display = "none";
            document.body.appendChild(a);
            a.click();
        } finally {
            if (a.parentNode) a.parentNode.removeChild(a);
            setTimeout(function() { URL.revokeObjectURL(url); }, 60000);
        }
    }
    return { id:id, savedLocally:savedLocally, nativeDownload:nativeDownload };
}
var gpxNativeSaveState = null;
window.giloaHandleGpxSaveResult = function(success, cancelled) {
    var result = gpxNativeSaveState;
    gpxNativeSaveState = null;
    var status = document.getElementById("gpx-import-status");
    if (!status) return;
    var key = cancelled ? "gpxSaveCancelled" : !success ? "gpxDownloadFailed" : result && result.savedLocally ? "gpxSaved" : "gpxFileSavedOnly";
    status.textContent = earlyUiText(key, { name:result ? result.name : "GPX", count:result ? result.count : "" });
};
function exportGpx() {
    if (!window.GiloaGpxAccess || !window.GiloaGpxAccess.requireAccess()) return;
    if (gpxNativeSaveState) return;
    // Drain the foreground service first so points recorded while the screen
    // was off are included in the selected historical window.
    consumeNativeRouteTrackingPoints();
    var now = Date.now();
    var sinceMs = now - dialHours * 60 * 60 * 1000;
    var filtered = rawGpsPoints.filter(function(point) {
        var start = Number(point.startTime);
        var end = Number(point.endTime || point.startTime);
        return isFinite(start) && isFinite(end) && end >= sinceMs && start <= now;
    }).sort(function(a, b) { return Number(a.startTime) - Number(b.startTime); });
    if (filtered.length < 2) {
        alert(earlyUiText(filtered.length ? "gpxTooFew" : "gpxNoRoute"));
        return;
    }
    var nameInput = document.getElementById("gpx-export-name").value.trim();
    var name = nameInput || earlyUiText("recentRoute", { hours:dialHours });
    var result;
    try { result = saveGpxRecord(name, filtered, { download:true }); }
    catch (error) {
        console.warn("GPX download failed", error && error.name);
        document.getElementById("gpx-import-status").textContent = earlyUiText("gpxDownloadFailed");
        return;
    }
    if (!result) return;
    document.getElementById("gpx-export-name").value = "";
    if (result.nativeDownload) gpxNativeSaveState = { name:name, count:filtered.length, savedLocally:result.savedLocally };
    document.getElementById("gpx-import-status").textContent = earlyUiText(result.nativeDownload ? "gpxChooseLocation" : result.savedLocally ? "gpxSaved" : "gpxDownloadOnly", { name:name, count:filtered.length });
}
function loadGpxSaves() { try { return JSON.parse(localStorage.getItem(GPX_SAVES_KEY) || "[]"); } catch(e) { return []; } }
function saveGpxSaves(saves) {
    try { localStorage.setItem(GPX_SAVES_KEY, JSON.stringify(saves)); return true; }
    catch (error) { console.warn("GPX save failed", error && error.name); return false; }
}
function isImportedGpxSave(save) {
    // Earlier imports used a timestamp ID, while exports included a random suffix.
    return save.source === "import" || (save.source === undefined && /^\d{13}$/.test(save.id));
}
function updateGpxSavedList() { var container = document.getElementById("gpx-saved-list"); if (!container) return; var t = UI_TEXT[currentLang] || UI_TEXT.ko; var saves = loadGpxSaves(); if (!window.GiloaGpxAccess || !window.GiloaGpxAccess.isAuthorized()) saves = saves.filter(isImportedGpxSave); if (saves.length === 0) { container.innerHTML = '<p class="empty-message">' + escapeHtml(t.gpx_empty) + '</p>'; return; } container.innerHTML = ""; saves.slice().reverse().forEach(function(s) { var item = document.createElement("div"); item.className = "gpx-saved-item" + (s.id === activeGpxId ? " active-route" : ""); var icon = document.createElement("span"); icon.className = "gpx-saved-icon"; icon.textContent = s.id === activeGpxId ? t.gpx_showing : t.gpx_route; var info = document.createElement("div"); info.className = "gpx-saved-info"; var nameEl = document.createElement("div"); nameEl.className = "gpx-saved-name"; nameEl.textContent = s.name; var meta = document.createElement("div"); meta.className = "gpx-saved-meta"; meta.textContent = new Date(s.createdAt).toLocaleDateString(currentLang) + " · " + s.pointCount + " " + t.gpx_points; info.appendChild(nameEl); info.appendChild(meta); var del = document.createElement("div"); del.className = "gpx-saved-del"; del.textContent = t.gpx_delete; del.addEventListener("click", function(e) { e.stopPropagation(); deleteGpxSave(s.id); }); item.appendChild(icon); item.appendChild(info); item.appendChild(del); item.addEventListener("click", function() { toggleGpxRoute(s); }); container.appendChild(item); }); }
function deleteGpxSave(id) { if (id === activeGpxId) clearActiveGpxRoute(); saveGpxSaves(loadGpxSaves().filter(function(s) { return s.id !== id; })); updateGpxSavedList(); }
function requireGpxViewAccess(imported) {
    var access = window.GiloaGpxAccess;
    return !!access && ((imported && access.canImport()) || access.requireAccess());
}
function toggleGpxRoute(save) {
    var imported = isImportedGpxSave(save);
    if (!requireGpxViewAccess(imported)) return;
    if (activeGpxId === save.id) { clearActiveGpxRoute(); updateGpxSavedList(); return; }
    clearActiveGpxRoute();
    drawGpxRoute(save.gpxContent, save.id, imported);
    updateGpxSavedList();
    toggleSidebar(false);
}
function clearActiveGpxRoute() { activeGpxLayers.forEach(function(l) { map.removeLayer(l); }); activeGpxLayers = []; activeGpxId = null; if (window.GiloaTrip) window.GiloaTrip.close(); }
function drawGpxRoute(gpxContent, id, imported) {
    if (!requireGpxViewAccess(imported)) return;
    var xmlDoc = new DOMParser().parseFromString(gpxContent, "application/xml");
    var segmentNodes = Array.from(xmlDoc.querySelectorAll("trkseg"));
    if (!segmentNodes.length) segmentNodes = [xmlDoc];
    var segmentLatLngs = segmentNodes.map(function(segmentNode) {
        return Array.from(segmentNode.querySelectorAll("trkpt, rtept")).map(function(point) {
            var lat = parseFloat(point.getAttribute("lat"));
            var lng = parseFloat(point.getAttribute("lon"));
            return isFinite(lat) && isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 ? [lat, lng] : null;
        }).filter(Boolean);
    }).filter(function(segment) { return segment.length > 0; });
    if (!segmentLatLngs.length) return;
    var layers = [];
    segmentLatLngs.forEach(function(latlngs) {
        if (latlngs.length > 1) layers.push(L.polyline(latlngs, { pane:"gpxRoutePane", color:"#B388FF", weight:4, opacity:1, lineCap:"round", lineJoin:"round" }).addTo(map));
    });
    var first = segmentLatLngs[0][0];
    var lastSegment = segmentLatLngs[segmentLatLngs.length - 1];
    var last = lastSegment[lastSegment.length - 1];
    layers.push(L.circleMarker(first, { pane:"gpxRoutePane", radius:7, color:"#4db8ff", fillColor:"#fff", fillOpacity:1, weight:2.5 }).addTo(map).bindTooltip(earlyUiText("departure")));
    layers[layers.length - 1].giloaRouteEndpoint = "departure";
    layers.push(L.circleMarker(last, { pane:"gpxRoutePane", radius:7, color:"#ff6b6b", fillColor:"#fff", fillOpacity:1, weight:2.5 }).addTo(map).bindTooltip(earlyUiText("arrival")));
    layers[layers.length - 1].giloaRouteEndpoint = "arrival";
    activeGpxLayers = layers;
    activeGpxId = id;
    var bounds = L.latLngBounds([]);
    segmentLatLngs.forEach(function(segment) { segment.forEach(function(latlng) { bounds.extend(latlng); }); });
    if (bounds.isValid()) map.fitBounds(bounds, { padding:[50, 50] });
    if (window.GiloaTrip && window.GiloaGpxAccess.isAuthorized()) window.GiloaTrip.open(gpxContent, id);
}
function getGpxImportText() {
    var text = {
        ko:{ previewOnly:"내부 목록에 저장하지 못해 지도에서만 열었습니다. 원본 GPX 파일과 기존 기록은 유지됩니다.", loading:"불러오는 중...", tooLarge:"GPX 파일은 10MB 이하만 불러올 수 있습니다.", invalid:"올바른 GPX 경로 파일이 아닙니다.", noRoute:"경로 좌표가 없습니다.", storage:"저장 공간이 부족해 GPX를 저장하지 못했습니다.", done:"불러오기 완료", read:"파일을 읽지 못했습니다." },
        en:{ previewOnly:"Opened on the map without adding to the saved list. The original GPX file and existing records are preserved.", loading:"Importing...", tooLarge:"GPX files must be 10MB or smaller.", invalid:"This is not a valid GPX route file.", noRoute:"No route coordinates were found.", storage:"Not enough storage to save this GPX file.", done:"Import complete", read:"Could not read the file." },
        ja:{ previewOnly:"一覧に保存できなかったため地図上でのみ開きました。元のGPXファイルと既存の記録は保持されています。", loading:"読み込み中...", tooLarge:"GPXファイルは10MB以下にしてください。", invalid:"有効なGPXルートファイルではありません。", noRoute:"ルート座標がありません。", storage:"保存容量が不足してGPXを保存できません。", done:"読み込み完了", read:"ファイルを読み込めませんでした。" },
        zh:{ previewOnly:"未能保存到列表，已在地图上打开。原始GPX文件和已有记录均保留。", loading:"正在导入...", tooLarge:"GPX文件必须小于或等于10MB。", invalid:"这不是有效的GPX路线文件。", noRoute:"未找到路线坐标。", storage:"存储空间不足，无法保存GPX。", done:"导入完成", read:"无法读取文件。" },
        es:{ previewOnly:"Abierto en el mapa sin añadirlo a la lista. El GPX original y los registros existentes se conservan.", loading:"Importando...", tooLarge:"El archivo GPX debe tener 10 MB o menos.", invalid:"No es un archivo de ruta GPX válido.", noRoute:"No se encontraron coordenadas de ruta.", storage:"No hay espacio suficiente para guardar el GPX.", done:"Importación completada", read:"No se pudo leer el archivo." },
        fr:{ previewOnly:"Ouvert sur la carte sans ajout à la liste. Le fichier GPX original et les données existantes sont conservés.", loading:"Importation...", tooLarge:"Le fichier GPX doit faire 10 Mo maximum.", invalid:"Ce fichier de parcours GPX n’est pas valide.", noRoute:"Aucune coordonnée de parcours trouvée.", storage:"Espace insuffisant pour enregistrer le GPX.", done:"Importation terminée", read:"Impossible de lire le fichier." }
    };
    return text[currentLang] || text.ko;
}
function chooseGpxFile() {
    if (!requireGpxViewAccess(true)) return;
    document.getElementById("gpx-file-input").click();
}
function importGpxFile(event) {
    if (!requireGpxViewAccess(true)) return;
    var file = event.target.files[0]; if (!file) return;
    var statusEl = document.getElementById("gpx-import-status"); var text = getGpxImportText();
    if (file.size > GPX_IMPORT_MAX_BYTES) { statusEl.textContent = text.tooLarge; event.target.value = ""; return; }
    statusEl.textContent = text.loading;
    var reader = new FileReader();
    reader.onload = function(e) {
        if (!window.GiloaGpxAccess || !window.GiloaGpxAccess.canImport()) return;
        try {
            var name = file.name.replace(/\.gpx$/i, ""); var gpxContent = String(e.target.result || "");
            var xmlDoc = new DOMParser().parseFromString(gpxContent, "application/xml");
            if (xmlDoc.querySelector("parsererror") || !xmlDoc.documentElement || String(xmlDoc.documentElement.localName).toLowerCase() !== "gpx") { statusEl.textContent = text.invalid; return; }
            var routePoints = Array.from(xmlDoc.querySelectorAll("trkpt, rtept")).filter(function(point) {
                var lat = parseFloat(point.getAttribute("lat")); var lng = parseFloat(point.getAttribute("lon"));
                return isFinite(lat) && isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
            });
            if (!routePoints.length) { statusEl.textContent = text.noRoute; return; }
            var saves = loadGpxSaves(); var id = String(Date.now());
            saves.push({ id:id, name:name, createdAt:Date.now(), pointCount:routePoints.length, gpxContent:gpxContent, source:"import" });
            var savedLocally = saveGpxSaves(saves);
            // Opening an existing file must work even when the app list is full.
            clearActiveGpxRoute(); drawGpxRoute(gpxContent, savedLocally ? id : null, true); updateGpxSavedList();
            statusEl.textContent = savedLocally ? '"' + name + '" ' + text.done : text.previewOnly;
            toggleSidebar(false);
            if (!savedLocally && typeof showLocationToast === "function") showLocationToast(text.previewOnly, 5000);
        } catch (err) { statusEl.textContent = text.read; console.error(err); }
    };
    reader.onerror = function() { statusEl.textContent = text.read; };
    reader.readAsText(file); event.target.value = "";
}

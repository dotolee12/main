function addMemoryAt(lat, lng, defaultName) {
    if (!isFinite(lat) || !isFinite(lng)) { alert(earlyUiText("noMemoryLocation")); return; }
    var input = prompt(earlyUiText("memoryPrompt"), defaultName || earlyUiText("newDiscovery"));
    if (input === null) return;
    var now = new Date();
    var data = {
        id: String(now.getTime()),
        lat: lat,
        lng: lng,
        name: escapeHtml(input.trim() || "Memory point"),
        time: now.getTime(),
        dateString: now.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" }),
        timeString: now.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
    };
    memories.push(data);
    createMemoryMarker(data, true);
    updateMemoryList();
    updateStats();
    scheduleSave();
}
function addMemory() {
    if (!currentPos) { alert(earlyUiText("checkingLocation")); return; }
    addMemoryAt(currentPos.lat, currentPos.lng, earlyUiText("newDiscovery"));
}
function addPhotoMemory(data) {
    if (!data) return;
    addMemoryAt(data.lat, data.lng, earlyUiText("photoMemory"));
}
function createMemoryMarker(data, openPopup) { var marker = L.marker([data.lat, data.lng], { pane: "memoryPane", icon: L.divIcon({ className: "memory-marker", html: "*", iconSize: [28, 28] }) }).addTo(map); var popupEl = document.createElement("div"); var title = document.createElement("b"); title.textContent = data.name; var info = document.createElement("small"); info.style.display = "block"; info.textContent = earlyMemoryDateText(data); var delBtn = document.createElement("button"); delBtn.className = "popup-delete-btn"; delBtn.textContent = earlyUiText("delete"); delBtn.addEventListener("click", function() { deleteMemory(data.id); }); popupEl.appendChild(title); popupEl.appendChild(document.createElement("br")); popupEl.appendChild(info); popupEl.appendChild(delBtn); marker.bindPopup(popupEl); marker.on("click", function() { setSelectedDestination(data.lat, data.lng, data.name || earlyUiText("memoryPlace")); }); memoryMarkers.set(data.id, marker); if (openPopup) { setSelectedDestination(data.lat, data.lng, data.name || earlyUiText("memoryPlace")); marker.openPopup(); } }
function deleteMemory(id) {
    if (!commitJourneyDeletion("memories", id)) return;
    var marker = memoryMarkers.get(id);
    if (marker) { map.removeLayer(marker); memoryMarkers.delete(id); }
    updateMemoryList(); updateStats();
}
function updateMemoryList() { var container = document.getElementById("memory-list-container"); if (!container) return; if (memories.length === 0) { container.innerHTML = '<p class="empty-message">' + escapeHtml(earlyUiText("emptyMemories")) + '</p>'; return; } container.innerHTML = ""; memories.slice().reverse().forEach(function(memo) { var item = document.createElement("div"); item.className = "memory-item"; var name = document.createElement("span"); name.className = "item-name"; name.textContent = memo.name; var date = document.createElement("span"); date.className = "item-date"; date.textContent = earlyMemoryDateText(memo); var actions = document.createElement("div"); actions.className = "memory-actions"; var moveBtn = document.createElement("button"); moveBtn.className = "memory-action-btn move"; moveBtn.textContent = earlyUiText("move"); moveBtn.addEventListener("click", function(e) { e.stopPropagation(); setSelectedDestination(memo.lat, memo.lng, memo.name || earlyUiText("memoryPlace")); map.flyTo([memo.lat, memo.lng], 17); }); var delBtn = document.createElement("button"); delBtn.className = "memory-action-btn delete"; delBtn.textContent = earlyUiText("delete"); delBtn.addEventListener("click", function(e) { e.stopPropagation(); deleteMemory(memo.id); }); actions.appendChild(moveBtn); actions.appendChild(delBtn); item.appendChild(name); item.appendChild(date); item.appendChild(actions); item.addEventListener("click", function() { setSelectedDestination(memo.lat, memo.lng, memo.name || earlyUiText("memoryPlace")); map.flyTo([memo.lat, memo.lng], 17); toggleSidebar(false); }); container.appendChild(item); }); }
// 紐⑤뱺 ???占쏀솚
var ALL_TABS = ["photo", "gpx", "visit", "item"];
function switchAllTab(tab) {
    if (tab === "memory") tab = "photo";
    if (tab === "badge") tab = "item";
    ALL_TABS.forEach(function(t) {
        var tabEl = document.getElementById("tab-" + t);
        var panelEl = document.getElementById("panel-" + t);
        if (tabEl) tabEl.classList.toggle("active", t === tab);
        if (panelEl) panelEl.style.display = t === tab ? "" : "none";
    });
    if (tab === "photo") updatePhotoList();
    if (tab === "gpx") updateGpxSavedList();
    if (tab === "visit") updateVisitList();
    if (tab === "item") updateItemList();
}
function switchTab(tab) { switchAllTab(tab); }
function updatePhotoList() {
    var container = document.getElementById("photo-list-container");
    if (!container) return;
    var photoText = getPhotoInteractionText();
    if (photos.length === 0) {
        container.innerHTML = '<p class="empty-message" style="grid-column:1/-1">' + escapeHtml(photoText.emptyPhotos) + '</p>';
        return;
    }
    container.innerHTML = "";
    // Appending each tile straight into the container forced a layout pass per
    // photo; the fragment collapses that into a single one.
    var listFragment = document.createDocumentFragment();
    photos.slice().reverse().forEach(function(p) {
        var item = document.createElement("div");
        item.className = "photo-list-item";
        item.tabIndex = 0;
        item.setAttribute("role", "button");
        var hasPhotoLocation = isValidPhotoCoordinate(p.lat, p.lng);
        item.setAttribute("aria-label", hasPhotoLocation ? photoText.mapView : photoText.assignLocation);
        var img = document.createElement("img");
        img.loading = "lazy";
        img.decoding = "async";
        img.src = getPhotoDisplaySrc(p);
        img.alt = earlyMemoryDateText(p, true) || photoText.photoAlt;
        var date = document.createElement("div");
        date.className = "photo-list-date";
        date.textContent = earlyMemoryDateText(p, true);
        item.appendChild(img);
        item.appendChild(date);
        var badge = document.createElement("div");
        badge.className = hasPhotoLocation ? "photo-location-ok" : "photo-location-missing";
        badge.textContent = hasPhotoLocation ? "\ud83d\udccd " + photoText.exifLocation : "\ud83d\udccd " + photoText.locationNeeded;
        item.appendChild(badge);
        if (p.memo) {
            var memo = document.createElement("div");
            memo.className = "photo-list-memo";
            memo.textContent = p.memo;
            item.appendChild(memo);
        }
        var del = document.createElement("button");
        del.type = "button";
        del.className = "photo-list-del";
        del.textContent = "×";
        del.setAttribute("aria-label", photoText.deletePhoto);
        del.addEventListener("click", function(e) { e.stopPropagation(); deletePhoto(p.id); updatePhotoList(); });
        item.addEventListener("click", function() { focusPhotoOnMap(p); });
        item.addEventListener("keydown", function(e) {
            if (e.target !== item || (e.key !== "Enter" && e.key !== " ")) return;
            e.preventDefault();
            focusPhotoOnMap(p);
        });
        item.title = hasPhotoLocation ? photoText.mapView : photoText.assignLocation;
        item.appendChild(del);
        listFragment.appendChild(item);
    });
    container.appendChild(listFragment);
}
// A full cluster scan per lookup made startup cost grow with the square of the
// photo count, because createPhotoMarker checks for an existing marker on every
// photo. hasLayer keeps the index honest if a marker is removed elsewhere.
var photoMarkerIndex = new Map();
function indexPhotoMarker(id, marker) { if (id && marker) photoMarkerIndex.set(id, marker); }
function forgetPhotoMarker(id) { if (id) photoMarkerIndex.delete(id); }
function clearPhotoMarkerIndex() { photoMarkerIndex.clear(); }
function findPhotoMarker(id) {
    if (!id) return null;
    var cached = photoMarkerIndex.get(id);
    if (!cached) return null;
    if (photoClusterGroup && typeof photoClusterGroup.hasLayer === "function" && !photoClusterGroup.hasLayer(cached)) {
        photoMarkerIndex.delete(id);
        return null;
    }
    return cached;
}
function refreshPhotoMarkersForLanguage() {
    if (!photoClusterGroup) return;
    var openPhotoIds = [];
    photoClusterGroup.eachLayer(function(layer) {
        if (layer && layer._photoData && typeof layer.isPopupOpen === "function" && layer.isPopupOpen()) openPhotoIds.push(layer._photoData.id);
    });
    photoClusterGroup.clearLayers();
    clearPhotoMarkerIndex();
    photos.forEach(function(photo) {
        if (photo && isValidPhotoCoordinate(photo.lat, photo.lng)) createPhotoMarker(photo, false);
    });
    openPhotoIds.forEach(function(id) {
        var marker = findPhotoMarker(id);
        if (!marker) return;
        if (typeof photoClusterGroup.zoomToShowLayer === "function") photoClusterGroup.zoomToShowLayer(marker, function() { marker.openPopup(); });
        else marker.openPopup();
    });
}

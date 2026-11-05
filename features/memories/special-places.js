function getSpecialPlaceText() { return UI_TEXT[currentLang] || UI_TEXT.ko; }
function createSpecialPlaceId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
    return "special-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
}
function applySpecialPlaceLang() {
    var t = getSpecialPlaceText();
    setText("special-place-title", t.special_place);
    var note = document.getElementById("special-place-note");
    var save = document.getElementById("special-place-save");
    var cancel = document.getElementById("special-place-cancel");
    if (note) note.placeholder = t.special_place_placeholder;
    if (save) { save.textContent = t.save_pin; save.setAttribute("aria-label", t.save_pin); }
    if (cancel) { cancel.textContent = t.cancel_pin; cancel.setAttribute("aria-label", t.cancel_pin); }
    if (playerMarker && playerMarker.getElement()) playerMarker.getElement().setAttribute("aria-label", t.special_place);
    if (activeSpecialPlaceMarker && activeSpecialPlacePin) openSpecialPlacePopup(activeSpecialPlaceMarker, activeSpecialPlacePin, true);
}
function openSpecialPlaceEditor(latitude, longitude) {
    var editor = document.getElementById("special-place-editor");
    var note = document.getElementById("special-place-note");
    if (!editor || !note || !isFinite(latitude) || !isFinite(longitude)) return;
    specialPlaceEditorCoords = { latitude: Number(latitude), longitude: Number(longitude) };
    applySpecialPlaceLang();
    document.getElementById("special-place-error").textContent = "";
    note.value = "";
    editor.classList.add("show");
    editor.setAttribute("aria-hidden", "false");
    setTimeout(function() { note.focus(); }, 50);
}
function closeSpecialPlaceEditor() {
    var editor = document.getElementById("special-place-editor");
    if (!editor) return;
    editor.classList.remove("show");
    editor.setAttribute("aria-hidden", "true");
    specialPlaceEditorCoords = null;
    var error = document.getElementById("special-place-error");
    if (error) error.textContent = "";
}
function saveSpecialPlacePin() {
    var noteEl = document.getElementById("special-place-note");
    var note = noteEl ? noteEl.value.trim() : "";
    var t = getSpecialPlaceText();
    if (!note) {
        var error = document.getElementById("special-place-error");
        if (error) error.textContent = t.empty_pin_note;
        if (noteEl) noteEl.focus();
        return;
    }
    if (!specialPlaceEditorCoords) return;
    var pin = specialPlaceEditorCoords.pendingPin || {
        id: createSpecialPlaceId(),
        latitude: specialPlaceEditorCoords.latitude,
        longitude: specialPlaceEditorCoords.longitude,
        note: note,
        createdAt: new Date().toISOString()
    };
    // A cloud repaint may have recreated the pending pin object meanwhile.
    pin = specialPlacePins.find(function(saved) { return saved.id === pin.id; }) || pin;
    pin.note = note;
    specialPlaceEditorCoords.pendingPin = pin;
    if (!specialPlacePins.some(function(saved) { return saved.id === pin.id; })) specialPlacePins.push(pin);
    markJourneyStateDirty();
    if (!persistState()) {
        var saveError = document.getElementById("special-place-error");
        if (saveError) saveError.textContent = t.pin_save_failed;
        return;
    }
    createSpecialPlaceMarker(pin);
    closeSpecialPlaceEditor();
    showCollectionToast(t.pin_saved);
    showGiloReaction("memory", "", { force:true });
}
function createSpecialPlaceMarker(pinData) {
    if (!pinData || specialPlaceMarkers.has(pinData.id)) return specialPlaceMarkers.get(pinData && pinData.id);
    var marker = L.marker([pinData.latitude, pinData.longitude], {
        pane: "specialPlacePane", keyboard: true, title: getSpecialPlaceText().special_place,
        icon: L.divIcon({ className: "special-place-marker-wrap", html: '<div class="special-place-marker"><span>★</span></div>', iconSize: [30, 34], iconAnchor: [15, 30] })
    }).addTo(map);
    marker.on("click", function(e) {
        if (e && e.originalEvent) L.DomEvent.stop(e.originalEvent);
        if (activeSpecialPlaceMarker === marker) closeSpecialPlacePopup();
        else openSpecialPlacePopup(marker, pinData);
    });
    specialPlaceMarkers.set(pinData.id, marker);
    return marker;
}
function renderSavedSpecialPlacePins() {
    specialPlacePins.forEach(function(pin) { createSpecialPlaceMarker(pin); });
}
function buildSpecialPlacePopup(pinData) {
    var t = getSpecialPlaceText();
    var wrap = document.createElement("div"); wrap.className = "special-place-popup";
    var title = document.createElement("div"); title.className = "special-place-popup-title"; title.textContent = t.special_place;
    var note = document.createElement("div"); note.className = "special-place-popup-note"; note.textContent = pinData.note;
    var time = document.createElement("div"); time.className = "special-place-popup-time";
    time.textContent = new Date(pinData.createdAt).toLocaleString(currentLang, { dateStyle: "medium", timeStyle: "short" });
    wrap.appendChild(title); wrap.appendChild(note); wrap.appendChild(time);
    return wrap;
}
function openSpecialPlacePopup(marker, pinData, keepTimer) {
    if (!marker || !pinData) return;
    if (activeSpecialPlaceMarker && activeSpecialPlaceMarker !== marker) closeSpecialPlacePopup();
    marker.bindPopup(buildSpecialPlacePopup(pinData), { closeButton: false, autoClose: false, closeOnClick: false, offset: [0, -24] }).openPopup();
    activeSpecialPlaceMarker = marker;
    activeSpecialPlacePin = pinData;
    if (!keepTimer) scheduleSpecialPlacePopupClose();
}
function closeSpecialPlacePopup() {
    clearSpecialPlacePopupTimer();
    if (activeSpecialPlaceMarker) activeSpecialPlaceMarker.closePopup();
    activeSpecialPlaceMarker = null;
    activeSpecialPlacePin = null;
}
function scheduleSpecialPlacePopupClose() {
    clearSpecialPlacePopupTimer();
    specialPlacePopupTimer = setTimeout(closeSpecialPlacePopup, 3000);
}
function clearSpecialPlacePopupTimer() {
    if (specialPlacePopupTimer !== null) clearTimeout(specialPlacePopupTimer);
    specialPlacePopupTimer = null;
}

var imageClassifierPromise = null;
var imageClassifierMeta = null;

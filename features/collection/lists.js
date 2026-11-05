function updateItemList() {
    var container = document.getElementById("item-list");
    if (!container) return;
    container.innerHTML = "";
    var regionCount = REGION_BADGE_ATLAS_ENTRIES.filter(function(entry) { return !!getEarnedBadge(entry.id); }).length;
    var regionCard = document.createElement("button");
    regionCard.type = "button"; regionCard.className = "region-badge-entry-card";
    regionCard.innerHTML = '<span class="region-badge-entry-icon"><i></i></span><span><b>' + escapeHtml(collectionUiText("regional_badges")) + '</b><small>' + escapeHtml(collectionUiText("regional_hint")) + '</small></span><em>' + regionCount + '/' + REGION_BADGE_ATLAS_ENTRIES.length + '</em><strong aria-hidden="true">›</strong>';
    regionCard.addEventListener("click", openRegionBadgeAtlas); container.appendChild(regionCard);
    var wardrobe = document.createElement("section");
    wardrobe.className = "gilo-wardrobe-summary";
    var equipped = loadGiloEquipment().slots || {};
    var equippedCount = GILO_WEARABLE_SLOTS.filter(function(slot) { return !!equipped[slot]; }).length;
    var unlockedCount = items.filter(function(savedItem) { return savedItem && savedItem.wearable; }).length;
    var wardrobeText = getGiloWardrobeText();
    wardrobe.innerHTML = '<div><b>' + escapeHtml(wardrobeText.title) + '</b><small>' + escapeHtml((wardrobeText.equipped + " ") + equippedCount + "/10 · " + (wardrobeText.unlocked + " ") + unlockedCount + "/100") + '</small></div><button type="button">' + escapeHtml(wardrobeText.missions) + '</button>';
    wardrobe.querySelector("button").addEventListener("click", function() { wardrobe.classList.toggle("show-missions"); });
    var missionGrid = document.createElement("div"); missionGrid.className = "gilo-wardrobe-missions";
    GILO_WEARABLE_CATALOG.forEach(function(def) {
        var hasItem = items.some(function(savedItem) { return savedItem && savedItem.id === def.id; });
        var text = getWearableMissionText(def); var current = getWearableMetricValue(def);
        var mission = document.createElement("div"); mission.className = "gilo-wardrobe-mission" + (hasItem ? " earned" : "");
        mission.innerHTML = getWearableVisualHtml(def, "gilo-wearable-list-sprite") + '<span><b>' + escapeHtml(text.name) + '</b><small>' + escapeHtml(text.mission + " · " + Math.min(current, def.target) + "/" + def.target + (def.metric === "distance" ? "m" : "")) + '</small></span>';
        missionGrid.appendChild(mission);
    });
    wardrobe.appendChild(missionGrid); container.appendChild(wardrobe);
    if (badges.length === 0 && items.length === 0) {
        var empty = document.createElement("p"); empty.className = "empty-message region-badge-empty"; empty.textContent = collectionUiText("empty_items"); container.appendChild(empty);
    }
    items.slice().reverse().forEach(function(savedItem) {
        var item = document.createElement("button");
        item.type = "button";
        item.className = "badge-item item-card";
        var wearable = !!savedItem.wearable;
        var itemText = wearable ? getWearableItemText(savedItem) : getCollectionItemText(savedItem);
        var name = itemText.name;
        var date = formatCollectionDate(savedItem.earnedAt, savedItem.dateString);
        var savedVisual = { image: savedItem.image || savedItem.imageUrl || DEFAULT_COLLECTION_IMAGE, imagePosition: savedItem.imagePosition || "center 35%" };
        var equipped = wearable && loadGiloEquipment().slots && loadGiloEquipment().slots[savedItem.slot] === String(savedItem.id);
        item.classList.toggle("is-equipped", equipped); item.classList.toggle("is-wearable", wearable);
        item.setAttribute("aria-pressed", String(equipped));
        var visual = wearable ? getWearableVisualHtml(getWearableDefinition(savedItem.id), "gilo-wearable-list-sprite") : getCollectionVisualHtml(savedVisual, "✦");
        var action = wearable ? getGiloEquipmentLabel(equipped, savedItem.slot) : "";
        item.innerHTML = visual + '<div class="badge-name">' + escapeHtml(name) + '</div><div class="badge-date">' + escapeHtml(wearable ? ((GILO_WEARABLE_SLOT_I18N[normalizeLang(currentLang)] || GILO_WEARABLE_SLOT_I18N.en)[savedItem.slot]) : date) + '</div>' + (wearable ? '<span class="item-equip-state">' + escapeHtml(action) + '</span>' : '');
        item.title = wearable ? (itemText.mission + " · " + action) : itemText.description;
        if (wearable) item.addEventListener("click", function() { toggleGiloEquipment(savedItem.id); });
        else item.disabled = true;
        container.appendChild(item);
    });
    badges.slice().reverse().filter(function(b) { return !isRegionBadgeId(b.id); }).forEach(function(b) {
        var def = BADGE_DEFS.find(function(d) { return d.id === b.id; });
        if (!def) return;
        var item = document.createElement("div");
        item.className = "badge-item";
        var badgeText = getBadgeText(def);
        item.innerHTML = getCollectionVisualHtml(def, def.icon) + '<div class="badge-name">' + escapeHtml(badgeText.name) + '</div><div class="badge-date">' + escapeHtml(formatCollectionDate(b.earnedAt, b.dateString)) + '</div>';
        item.title = badgeText.desc || badgeText.name;
        container.appendChild(item);
    });
}

function updateVisitList() {
    var container = document.getElementById("visit-list");
    if (!container) return;
    if (visitStamps.length === 0) { container.innerHTML = '<p class="empty-message">' + escapeHtml(collectionUiText("empty_visits")) + '</p>'; return; }
    container.innerHTML = "";
    visitStamps.slice().sort(function(a,b){ return b.visitedAt - a.visitedAt; }).forEach(function(v) {
        var icon = getVisitTypeLabel(v);
        var el = document.createElement("div");
        el.className = "visit-item";
        el.innerHTML = '<div class="visit-icon">' + escapeHtml(icon) + '</div><div class="visit-info"><div class="visit-name">' + escapeHtml(getVisitDisplayName(v)) + '</div><div class="visit-date">' + escapeHtml(formatCollectionDate(v.visitedAt, v.dateString)) + '</div></div>';
        el.addEventListener("click", function() { focusVisitedPlace(v); });
        container.appendChild(el);
    });
}

function focusVisitedPlace(visit) {
    if (!visit || !isFinite(Number(visit.lat)) || !isFinite(Number(visit.lng))) return;
    var lat = Number(visit.lat);
    var lng = Number(visit.lng);
    var name = String(getVisitDisplayName(visit));
    setSelectedDestination(lat, lng, name);
    if (selectedVisitMarker) map.removeLayer(selectedVisitMarker);
    selectedVisitMarker = L.marker([lat, lng], {
        pane: "visitedPlacePane",
        keyboard: true,
        title: name,
        zIndexOffset: 40,
        icon: L.divIcon({
            className: "visited-place-marker",
            html: '<span class="visited-place-marker-pulse"></span><span class="visited-place-marker-core"></span>',
            iconSize: [38, 38],
            iconAnchor: [19, 19]
        })
    }).addTo(map).bindTooltip(name, { direction:"top", offset:[0, -17], className:"visited-place-tooltip" });
    selectedVisitMarker.openTooltip();
    map.flyTo([lat, lng], 17, { animate:true, duration:0.65 });
    toggleSidebar(false);
}

function switchCollectionTab(tab) { switchAllTab(tab === "badge" ? "item" : tab); }

function refreshCollectionLanguageUI() {
    updateItemList();
    updateVisitList();
    var atlas = document.getElementById("region-badge-atlas");
    if (atlas && !atlas.hidden) renderRegionBadgeAtlas();
    var reload = document.getElementById("region-badge-atlas-reload-boundary");
    if (reload) reload.textContent = collectionUiText(reload.disabled ? "boundary_loading" : "boundary_reload");
    var recap = document.getElementById("journey-recap");
    if (recap && recap.classList.contains("open")) renderTodayJourneyRecap();
    var discovery = document.getElementById("discovery-toast");
    if (discovery && discovery.classList.contains("show")) renderDiscoveryRewardText();
    refreshGiloDialogueLanguage();
}

function showCollectionToast(msg) {
    var toast = document.createElement("div");
    toast.style.cssText = "position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:rgba(20,20,35,0.95);border:1px solid rgba(255,255,255,0.2);color:#fff;padding:10px 18px;border-radius:20px;font-size:13px;font-weight:600;z-index:9999;white-space:nowrap;backdrop-filter:blur(10px);";
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(function() { toast.remove(); }, 2500);
}

// Bottom Gilo dialogue (kept independent from the tutorial/prologue systems).

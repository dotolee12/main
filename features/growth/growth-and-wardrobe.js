function getRpgMetrics() {
    var daily = loadDailyTaskState();
    return {
        distanceUnits: Math.floor(Math.max(0, Number(totalDistance) || 0) / 100),
        visits: Array.isArray(visitStamps) ? visitStamps.length : 0,
        photos: Array.isArray(photos) ? photos.length : 0,
        memories: Array.isArray(memories) ? memories.length : 0,
        stayPlaces: Array.isArray(stayBonusPlaces) ? stayBonusPlaces.length : 0,
        badges: Array.isArray(badges) ? badges.length : 0,
        dailyTasks: daily && Array.isArray(daily.rewarded) ? daily.rewarded.length : 0
    };
}
function seedRpgStats(metrics) {
    return {
        exploration: metrics.distanceUnits,
        experience: metrics.visits * 3,
        memory: metrics.photos * 2 + metrics.memories * 2 + metrics.stayPlaces * 3,
        connection: 0,
        growth: metrics.badges * 4 + metrics.dailyTasks * 4
    };
}
function loadRpgGrowth() {
    var metrics = getRpgMetrics();
    try {
        var saved = JSON.parse(localStorage.getItem(RPG_GROWTH_KEY) || "null");
        if (saved && saved.stats && saved.metrics) {
            RPG_STAT_KEYS.forEach(function(key) { saved.stats[key] = Math.max(0, Number(saved.stats[key]) || 0); });
            saved.version = Math.max(2, Number(saved.version) || 1);
            saved.metrics = Object.assign({}, metrics, saved.metrics || {});
            return saved;
        }
    } catch (e) { console.warn("여행 성장 기록을 복원하지 못했습니다.", e); }
    return { version:2, stats:seedRpgStats(metrics), metrics:metrics, traitKey:"", updatedAt:Date.now() };
}
function saveRpgGrowth(state) {
    state.updatedAt = Date.now();
    try { localStorage.setItem(RPG_GROWTH_KEY, JSON.stringify(state)); }
    catch (e) { console.warn("여행 성장 기록을 저장하지 못했습니다.", e); }
}
function getRpgTotal(stats) { return RPG_STAT_KEYS.reduce(function(sum, key) { return sum + (Number(stats[key]) || 0); }, 0); }
function getRpgLevel(total) { return Math.min(30, Math.max(1, Math.floor(total / RPG_POINTS_PER_LEVEL) + 1)); }
function getGiloLevelImage(level) {
    var safeLevel = Math.min(30, Math.max(1, Math.floor(Number(level)) || 1));
    return GILO_LEVEL_IMAGE_BASE + "gilo-level-" + String(safeLevel).padStart(2, "0") + ".png";
}
function loadGiloEquipment() {
    try {
        var saved = JSON.parse(localStorage.getItem(GILO_EQUIPMENT_KEY) || "null");
        if (saved && saved.slots && typeof saved.slots === "object") return { slots:Object.assign({}, saved.slots) };
        var legacy = JSON.parse(localStorage.getItem(GILO_EQUIPMENT_LEGACY_KEY) || "null");
        var migrated = { slots:{} };
        if (legacy && typeof legacy.itemId === "string" && legacy.itemId) migrated.slots.relic = legacy.itemId;
        if (Object.keys(migrated.slots).length) saveGiloEquipment(migrated);
        return migrated;
    } catch (e) { return { slots:{} }; }
}
function saveGiloEquipment(equipment) {
    try { localStorage.setItem(GILO_EQUIPMENT_KEY, JSON.stringify({ slots:Object.assign({}, (equipment && equipment.slots) || {}) })); }
    catch (e) { console.warn("길로 장착 아이템을 저장하지 못했습니다.", e); }
}
function getEquippedGiloItems() {
    var equipment = loadGiloEquipment();
    if (!Array.isArray(items)) return [];
    return GILO_WEARABLE_SLOTS.map(function(slot) {
        var itemId = equipment.slots && equipment.slots[slot];
        return items.find(function(item) { return item && String(item.id) === String(itemId) && item.wearable && item.slot === slot; }) || null;
    }).filter(Boolean);
}
function getGiloEquipmentLabel(equipped, slot) {
    var labels = {
        ko: equipped ? "장착 중" : "장착하기",
        en: equipped ? "Equipped" : "Equip",
        ja: equipped ? "装着中" : "装着する",
        zh: equipped ? "已装备" : "装备"
    };
    var label = labels[normalizeLang(currentLang)] || labels.en;
    return slot ? ((GILO_WEARABLE_SLOT_I18N[normalizeLang(currentLang)] || GILO_WEARABLE_SLOT_I18N.en)[slot] + " · " + label) : label;
}
function getWearableDefinition(itemId) { return GILO_WEARABLE_CATALOG.find(function(def) { return def.id === String(itemId); }) || null; }
function getWearableMetricValue(def) {
    var metrics = getRpgMetrics();
    if (def.metric === "distance") return Math.floor(Math.max(0, Number(totalDistance) || 0));
    if (def.metric === "level") return getRpgLevel(getRpgTotal(loadRpgGrowth().stats));
    if (def.metric === "dailyTasks") return Math.max(0, Number(safeStorageGet(DAILY_TASK_TOTAL_KEY)) || 0);
    return Math.max(0, Number(metrics[def.metric === "stays" ? "stayPlaces" : def.metric]) || 0);
}
function getWearableMissionText(def) {
    var lang = normalizeLang(currentLang);
    var metricName = (GILO_WEARABLE_METRIC_I18N[lang] || GILO_WEARABLE_METRIC_I18N.en)[def.metric];
    var suffix = def.metric === "distance" ? "m" : "";
    var names = { ko:def.name, en:(GILO_WEARABLE_SLOT_I18N.en[def.slot] + " reward " + (def.sheetIndex + 1)), ja:(GILO_WEARABLE_SLOT_I18N.ja[def.slot] + "報酬 " + (def.sheetIndex + 1)), zh:(GILO_WEARABLE_SLOT_I18N.zh[def.slot] + "奖励 " + (def.sheetIndex + 1)) };
    var templates = { ko:metricName + " " + def.target + suffix + " 달성", en:"Reach " + def.target + suffix + " " + metricName, ja:metricName + "を" + def.target + suffix + "達成", zh:"达成" + metricName + " " + def.target + suffix };
    return { name:names[lang] || names.en, mission:templates[lang] || templates.en };
}
function getWearableVisualHtml(def, className) {
    if (!def) return '<span class="gilo-wearable-sprite" aria-hidden="true">✦</span>';
    var x = def.sheetIndex % 5, y = Math.floor(def.sheetIndex / 5);
    return '<span class="gilo-wearable-sprite ' + (className || "") + '" style="--wearable-sheet:url(\'' + escapeHtml(GILO_FITTED_WEARABLE_SHEETS[def.sheet] || (GILO_WEARABLE_SHEET_BASE + def.sheet)) + '\');--wearable-x:' + x + ';--wearable-y:' + y + '" aria-hidden="true"></span>';
}
function getWearableItemText(item) {
    var def = getWearableDefinition(item && item.id);
    return def ? getWearableMissionText(def) : getCollectionItemText(item);
}
function updateGiloAppearance(level) {
    var image = getGiloLevelImage(level);
    var equippedItems = getEquippedGiloItems();
    document.querySelectorAll(".my-gilo-avatar").forEach(function(avatar) {
        var character = avatar.querySelector(".my-gilo-character");
        if (character && character.getAttribute("src") !== image) character.src = image;
        var legacySlot = avatar.querySelector(".my-gilo-equipped-item"); if (legacySlot) legacySlot.hidden = true;
        avatar.querySelectorAll(".gilo-wearable-on-avatar").forEach(function(el) { el.remove(); });
        equippedItems.forEach(function(item) {
            var def = getWearableDefinition(item.id); if (!def) return;
            var piece = document.createElement("span"); piece.className = "gilo-wearable-on-avatar slot-" + def.slot;
            piece.style.setProperty("--wearable-sheet", "url('" + (GILO_FITTED_WEARABLE_SHEETS[def.sheet] || (GILO_WEARABLE_SHEET_BASE + def.sheet)) + "')");
            piece.style.setProperty("--wearable-x", def.sheetIndex % 5); piece.style.setProperty("--wearable-y", Math.floor(def.sheetIndex / 5));
            piece.title = getWearableMissionText(def).name; avatar.appendChild(piece);
        });
        avatar.classList.toggle("has-equipped-item", equippedItems.length > 0);
    });
}
function toggleGiloEquipment(itemId) {
    var item = Array.isArray(items) && items.find(function(candidate) { return candidate && String(candidate.id) === String(itemId); });
    if (!item || !item.wearable || !item.slot) return false;
    var equipment = loadGiloEquipment();
    equipment.slots = equipment.slots || {};
    equipment.slots[item.slot] = equipment.slots[item.slot] === String(itemId) ? "" : String(itemId);
    saveGiloEquipment(equipment);
    updateItemList();
    updateRpgGrowthUI(loadRpgGrowth());
    return true;
}
function openGiloWardrobe() {
    toggleSidebar(true);
    switchAllTab("item");
    var container = document.getElementById("item-list");
    if (container) container.scrollIntoView({ behavior:"smooth", block:"start" });
}
function getGiloWardrobeText() {
    var text = {
        ko:{title:"길로 옷장 미션",equipped:"장착",unlocked:"획득",missions:"미션 보기",open:"길로 옷장 열기"},
        en:{title:"Gilo Wardrobe Missions",equipped:"Equipped",unlocked:"Unlocked",missions:"View missions",open:"Open Gilo wardrobe"},
        ja:{title:"ギロのクローゼットミッション",equipped:"装着",unlocked:"獲得",missions:"ミッションを見る",open:"ギロのクローゼットを開く"},
        zh:{title:"Gilo衣橱任务",equipped:"装备",unlocked:"已获得",missions:"查看任务",open:"打开Gilo衣橱"},
        es:{title:"Misiones del vestuario de Gilo",equipped:"Equipados",unlocked:"Obtenidos",missions:"Ver misiones",open:"Abrir vestuario de Gilo"},
        fr:{title:"Missions de la garde-robe de Gilo",equipped:"Équipés",unlocked:"Obtenus",missions:"Voir les missions",open:"Ouvrir la garde-robe de Gilo"}
    };
    return text[normalizeLang(currentLang)] || text.en;
}
function bindGiloWardrobeTrigger() {
    var avatar = document.getElementById("hud-main-gilo");
    if (!avatar) return;
    avatar.removeAttribute("aria-hidden");
    avatar.setAttribute("aria-label", getGiloWardrobeText().open);
    if (avatar.dataset.wardrobeBound) return;
    avatar.dataset.wardrobeBound = "true";
    avatar.setAttribute("role", "button"); avatar.setAttribute("tabindex", "0");

    avatar.addEventListener("click", function(event) { event.stopPropagation(); openGiloWardrobe(); });
    avatar.addEventListener("keydown", function(event) { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openGiloWardrobe(); } });
}
function getRpgStage(level) { return level <= 10 ? "learning" : level <= 20 ? "forming" : "seasoned"; }
function resolveRpgTraitKey(state) {
    var stats = state.stats || state;
    var topValue = Math.max.apply(null, RPG_STAT_KEYS.map(function(key) { return Number(stats[key]) || 0; }));
    var tied = RPG_STAT_KEYS.filter(function(key) { return (Number(stats[key]) || 0) === topValue; });
    var previous = state && state.traitKey;
    var key = tied.indexOf(previous) >= 0 ? previous : RPG_STAT_KEYS.find(function(candidate) { return tied.indexOf(candidate) >= 0; });
    if (state && state.stats) state.traitKey = key;
    return key || RPG_STAT_KEYS[0];
}
function getRpgTrait(state) {
    var stats = state && state.stats ? state.stats : state;
    var level = getRpgLevel(getRpgTotal(stats)); var words = getRpgText(); var hud = getRpgHudText();
    if (level < 30) { var stage = getRpgStage(level); return { key:stage, name:hud[stage][0], copy:hud[stage][1], official:false }; }
    var key = resolveRpgTraitKey(state && state.stats ? state : { stats:stats });
    return { key:key, name:words.traits[key][0], copy:words.traits[key][1], official:true };
}
function updateMyGiloAura(state, level) {
    var stats = state.stats || {}; var total = getRpgTotal(stats);
    var ratios = {};
    RPG_STAT_KEYS.forEach(function(key) { ratios[key] = total > 0 ? Math.max(0, Number(stats[key]) || 0) / total : 0; });
    var intensity = level >= 30 ? 1 : Math.max(.22, Math.min(.9, level / 30));
    document.querySelectorAll(".my-gilo-avatar").forEach(function(avatar) {
        avatar.style.setProperty("--aura-exploration", ratios.exploration.toFixed(3));
        avatar.style.setProperty("--aura-experience", ratios.experience.toFixed(3));
        avatar.style.setProperty("--aura-memory", ratios.memory.toFixed(3));
        avatar.style.setProperty("--aura-connection", ratios.connection.toFixed(3));
        avatar.style.setProperty("--aura-growth", ratios.growth.toFixed(3));
        avatar.style.setProperty("--aura-strength", intensity.toFixed(3));
        avatar.classList.toggle("aura-level-10", level >= 10);
        avatar.classList.toggle("aura-level-20", level >= 20);
        avatar.classList.toggle("aura-level-max", level >= 30);
    });
}
function showGiloGrowthReaction(title, detail, type) {
    var words = getRpgText();
    var toast = document.getElementById("discovery-toast");
    if (!toast) return;
    setDiscoveryGiloImage(type || "mission");
    var kicker = toast.querySelector(".discovery-kicker");
    if (kicker) kicker.textContent = words.toastKicker || earlyUiText("toastKicker");
    document.getElementById("discovery-place-name").textContent = title;
    document.getElementById("discovery-method").textContent = detail || words.toastGrowing || earlyUiText("toastGrowing");
    document.getElementById("discovery-reward").textContent = words.toastReward || earlyUiText("toastReward");
    if (discoveryRewardTimer) clearTimeout(discoveryRewardTimer);
    toast.classList.remove("show"); void toast.offsetWidth; toast.classList.add("show"); toast.setAttribute("aria-hidden", "false");
    discoveryRewardTimer = setTimeout(function() { toast.classList.remove("show"); toast.setAttribute("aria-hidden", "true"); discoveryRewardTimer = null; }, 5200);
}
function updateRpgGrowthUI(state) {
    if (!state) state = loadRpgGrowth();
    var total = getRpgTotal(state.stats); var level = getRpgLevel(total); var trait = getRpgTrait(state); var words = getRpgText(); var hud = getRpgHudText();
    var maxStat = Math.max(1, state.stats.exploration, state.stats.experience, state.stats.memory, state.stats.connection, state.stats.growth);
    RPG_STAT_KEYS.forEach(function(key) {
        var value = document.getElementById("rpg-stat-" + key); var bar = document.getElementById("rpg-bar-" + key);
        var ratioPercent = total > 0 ? Math.round((state.stats[key] / total) * 100) : 0;
        if (value) { value.textContent = ratioPercent + "%"; value.title = String(state.stats[key]); }
        if (bar) bar.style.width = Math.round((state.stats[key] / maxStat) * 100) + "%";
        var label = document.querySelector(".rpg-stat." + key + " span"); if (label) label.textContent = words.stats[key];
    });
    var traitName = document.getElementById("rpg-trait-name"); var traitCopy = document.getElementById("rpg-trait-copy");
    var levelEl = document.getElementById("rpg-level"); var nextLabel = document.getElementById("rpg-next-label");
    var nextValue = document.getElementById("rpg-next-value"); var progress = document.getElementById("rpg-level-progress");
    if (traitName) traitName.textContent = trait.official ? trait.name : trait.name;
    if (traitCopy) traitCopy.textContent = trait.copy;
    if (levelEl) levelEl.textContent = level;
    var isMax = level >= 30; var inLevel = total % RPG_POINTS_PER_LEVEL; var remaining = isMax ? 0 : RPG_POINTS_PER_LEVEL - inLevel;
    var progressPct = isMax ? 100 : Math.round(inLevel / RPG_POINTS_PER_LEVEL * 100);
    if (nextLabel) nextLabel.textContent = isMax ? hud.max : hud.next;
    if (nextValue) nextValue.textContent = isMax ? "MAX" : remaining;
    if (progress) progress.style.width = progressPct + "%";
    var maxBadge = document.getElementById("rpg-level-max"); if (maxBadge) maxBadge.hidden = !isMax;
    var myGiloTitle = document.getElementById("rpg-my-gilo-title"); if (myGiloTitle) myGiloTitle.textContent = hud.myGilo;
    var colorTitle = document.getElementById("rpg-color-title"); if (colorTitle) colorTitle.textContent = hud.myTravelColor;
    updateMyGiloAura(state, level);
    updateGiloAppearance(level);
    bindGiloWardrobeTrigger();
    var mini = document.getElementById("hud-mini-line"); var miniProgress = document.getElementById("hud-mini-progress");
    var summary = getTodayJourneySummary(); var daily = getDailyTaskProgress(); var completed = daily.filter(function(task) { return task.current >= task.target; }).length;
    var status = trait.name + " · LV " + level + (isMax ? " · MAX" : " · " + progressPct + "%");
    if (mini) mini.textContent = status + " · " + (summary.distance / 1000).toFixed(1) + "km";
    if (miniProgress) miniProgress.style.width = progressPct + "%";
    var kicker = document.getElementById("rpg-growth-kicker"); if (kicker) kicker.textContent = trait.official ? hud.identity : "REAL-WORLD TRAVEL RPG";
    var setToday = function(id, label, value) { var el = document.getElementById(id); if (el) { el.textContent = label + " " + value; el.setAttribute("aria-label", label + " " + value); el.title = label; } };
    setToday("rpg-today-distance", hud.distance, (summary.distance / 1000).toFixed(1) + "km");
    setToday("rpg-today-visits", hud.discoveries, summary.visits.length);
    setToday("rpg-today-photos", hud.photos, summary.photos.length);
    setToday("rpg-today-missions", hud.missions, completed + "/" + daily.length);
    var recapOpen = document.getElementById("journey-recap-open"); if (recapOpen) recapOpen.textContent = earlyUiText("journeyMap");
    var details = document.getElementById("rpg-stat-details"); var toggle = document.getElementById("rpg-details-toggle");
    if (details) details.hidden = !rpgDetailsOpen;
    if (toggle) { toggle.textContent = rpgDetailsOpen ? hud.detailHide : hud.detailShow; toggle.setAttribute("aria-expanded", rpgDetailsOpen ? "true" : "false"); }
}
function toggleRpgDetails(forceOpen) {
    rpgDetailsOpen = typeof forceOpen === "boolean" ? forceOpen : !rpgDetailsOpen;
    updateRpgGrowthUI(loadRpgGrowth());
    if (rpgDetailsOpen) {
        var details = document.getElementById("rpg-stat-details");
        if (details && typeof details.scrollIntoView === "function") {
            setTimeout(function() { details.scrollIntoView({ behavior:"smooth", block:"nearest" }); }, 0);
        }
    }
}
function closeRpgHudForLinkedView() {
    if (isHudExpanded) toggleHud();
}
function openRpgJourneyView(view) {
    if (view === "photos") {
        closeRpgHudForLinkedView(); switchAllTab("photo"); toggleSidebar(true); return;
    }
    if (view === "visits") {
        closeRpgHudForLinkedView(); switchAllTab("visit"); toggleSidebar(true); return;
    }
    if (view === "missions") { closeRpgHudForLinkedView(); toggleDailyTasks(true); return; }
    if (view !== "distance") return;
    closeRpgHudForLinkedView();
    if (!map || pathCoordinates.length < 2) { switchAllTab("gpx"); toggleSidebar(true); return; }
    var latlngs = pathCoordinates.filter(function(point) { return isFinite(point.lat) && isFinite(point.lng); }).map(function(point) { return [point.lat, point.lng]; });
    if (latlngs.length < 2) return;
    // The fog reveal is the travel history.  Do not add a synthetic straight
    // blue route here: sparse GPS samples can misleadingly cut across the map.
    clearActiveGpxRoute();
    map.fitBounds(L.latLngBounds(latlngs), { padding:[52, 52] });
}
function syncRpgGrowth() {
    var state = loadRpgGrowth(); var beforeLevel = getRpgLevel(getRpgTotal(state.stats)); var beforeTrait = getRpgTrait(state).key;
    var current = getRpgMetrics(); var added = { exploration:0, experience:0, memory:0, connection:0, growth:0 };
    added.exploration = Math.max(0, current.distanceUnits - (state.metrics.distanceUnits || 0));
    added.experience = Math.max(0, current.visits - (state.metrics.visits || 0)) * 3;
    added.memory = Math.max(0, current.photos - (state.metrics.photos || 0)) * 2 + Math.max(0, current.memories - (state.metrics.memories || 0)) * 2 + Math.max(0, current.stayPlaces - (state.metrics.stayPlaces || 0)) * 3;
    added.growth = Math.max(0, current.badges - (state.metrics.badges || 0)) * 4 + Math.max(0, current.dailyTasks - (state.metrics.dailyTasks || 0)) * 4;
    RPG_STAT_KEYS.forEach(function(key) { state.stats[key] += added[key]; });
    recordTodayGrowth(added);
    Object.keys(current).forEach(function(key) { state.metrics[key] = Math.max(Number(state.metrics[key]) || 0, current[key]); });
    saveRpgGrowth(state); updateRpgGrowthUI(state);
    var gained = getRpgTotal(added); if (!gained) return;
    var level = getRpgLevel(getRpgTotal(state.stats)); var trait = getRpgTrait(state);
    var words = getRpgText();
    if (level > beforeLevel) showGiloGrowthReaction(String(words.levelReached || earlyUiText("levelReached")).replace("{level}", level), words.newStage || earlyUiText("newStage"), "level");
    else if (trait.key !== beforeTrait) showGiloGrowthReaction(String(words.traitChanged || earlyUiText("traitChanged")).replace("{trait}", trait.name), trait.copy, "badge");
    else { var top = RPG_STAT_KEYS.slice().sort(function(a,b) { return added[b] - added[a]; })[0]; showGiloGrowthReaction(String(words.statGained || earlyUiText("statGained")).replace("{stat}", words.stats[top] || RPG_STAT_LABELS[top]).replace("{amount}", added[top]), words.actionBecameSkill || earlyUiText("actionBecameSkill"), "mission"); }
}
function rewardConnection(points, source) {
    var state = loadRpgGrowth(); var amount = Math.max(0, Math.floor(Number(points) || 0)); if (!amount) return;
    state.stats.connection += amount; recordTodayGrowth({ connection:amount }); saveRpgGrowth(state); updateRpgGrowthUI(state);
    var words = getRpgText();
    showGiloGrowthReaction(String(words.connectionGained || earlyUiText("connectionGained")).replace("{amount}", amount), source || words.connectionDetail || earlyUiText("connectionDetail"));
}
function updateStats() { var todayDist = calcTodayDistance(); var distEl = document.getElementById("dist-val"); var todayEl = document.getElementById("today-dist-val"); var memEl = document.getElementById("memory-count-val"); var photoEl = document.getElementById("photo-count-val"); if (distEl) distEl.innerHTML = (totalDistance / 1000).toFixed(2) + "<span>km</span>"; if (todayEl) todayEl.innerHTML = (todayDist / 1000).toFixed(2) + "<span>km</span>"; if (memEl) memEl.innerHTML = memories.length + "<span>" + escapeHtml(earlyUiText("memoryUnit")) + "</span>"; if (photoEl) photoEl.innerHTML = photos.length + "<span>" + escapeHtml(earlyUiText("photoUnit")) + "</span>"; updateHud(); updateDailyMissions(); checkBadges(); syncRpgGrowth(); }

function toggleHud() { applyHudLang(UI_TEXT[currentLang] || UI_TEXT.ko); isHudExpanded = !isHudExpanded; document.getElementById("hud").classList.toggle("expanded", isHudExpanded); document.getElementById("controls").classList.toggle("hud-open", isHudExpanded); document.getElementById("help-btn").classList.toggle("hud-open", isHudExpanded); setTimeout(positionGiloLoading, 310); if (isHudExpanded) { setTimeout(function() { document.addEventListener("click", handleHudOutsideClick); }, 0); } else { document.removeEventListener("click", handleHudOutsideClick); } }
function handleHudOutsideClick(event) { var hud = document.getElementById("hud"); if (!hud.contains(event.target)) { isHudExpanded = false; hud.classList.remove("expanded"); document.getElementById("controls").classList.remove("hud-open"); document.getElementById("help-btn").classList.remove("hud-open"); document.removeEventListener("click", handleHudOutsideClick); setTimeout(positionGiloLoading, 310); } }
function getStatusText(key, value) {
    var t = UI_TEXT[currentLang] || UI_TEXT.en || UI_TEXT.ko;
    var text = t[key] || (UI_TEXT.en && UI_TEXT.en[key]) || key;
    return typeof value === "undefined" ? text : text.replace("{value}", value);
}
function syncRecordingUI() {
    var t = UI_TEXT[currentLang] || UI_TEXT.ko;
    var permissionBlocked = !isRecording && recordingLocationPermissionBlocked;
    var status = isRecording ? t.rec_active : permissionBlocked ? earlyUiText("recordingPermissionRequired") : t.rec_idle;
    recBtn.classList.toggle("recording", isRecording);
    recBtn.setAttribute("aria-pressed", String(isRecording));
    recBtn.setAttribute("aria-label", status);
    recStatusBox.textContent = status;
    recStatusBox.classList.toggle("recording", isRecording);
    recStatusBox.classList.toggle("permission-required", permissionBlocked);
    updateHud();
    syncImageMissionUI();
}
function getImageMissionLatLng(item) {
    if (!item) return null;
    var lat = parseFloat(item.mapy !== undefined ? item.mapy : item.lat);
    var lng = parseFloat(item.mapx !== undefined ? item.mapx : item.lng);
    if (!isFinite(lat) || !isFinite(lng)) return null;
    return L.latLng(lat, lng);
}
function getImageMissionName(item) { return getTourDisplayTitle(item) || item.name || item.LBRRY_NAME || item.title || earlyUiText("missionPlace"); }
function getActiveImageMission() {
    if (!currentPos) return null;
    var sources = [];
    if (Array.isArray(tourItems)) sources = sources.concat(tourItems);
    if (Array.isArray(festivalItems)) sources = sources.concat(festivalItems);
    if (Array.isArray(libraryItems)) sources = sources.concat(libraryItems);
    var best = null;
    sources.forEach(function(item) {
        var latlng = getImageMissionLatLng(item);
        if (!latlng) return;
        var dist = currentPos.distanceTo(latlng);
        if (dist <= IMAGE_MISSION_RADIUS_M && (!best || dist < best.distance)) {
            best = { item: item, distance: dist, name: getImageMissionName(item) };
        }
    });
    return best;
}
function syncImageMissionUI() {
    var photoBtn = document.getElementById("photo-btn");
    if (!photoBtn) return;
    activeImageMission = getActiveImageMission();
    photoBtn.classList.toggle("mission-active", !!activeImageMission);
    photoBtn.setAttribute("title", activeImageMission ? earlyUiText("photoMission", { name:activeImageMission.name }) : earlyUiText("importPhotos"));
}
function syncFogButton() { var t = UI_TEXT[currentLang] || UI_TEXT.ko; var toggleBtn = document.getElementById("fog-toggle-btn"); var toggleState = document.getElementById("fog-toggle-state"); if (!toggleBtn) return; toggleBtn.classList.toggle("on", isFogEnabled); toggleBtn.classList.toggle("off", !isFogEnabled); if (toggleState) { toggleState.textContent = isFogEnabled ? t.fog_on : t.fog_off; toggleState.classList.toggle("on", isFogEnabled); toggleState.classList.toggle("off", !isFogEnabled); } }

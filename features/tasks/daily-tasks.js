function getDailyTaskDate() {
    var now = new Date();
    return now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
}
function loadTodayGrowth() {
    var today = getDailyTaskDate();
    try {
        var saved = JSON.parse(localStorage.getItem(DAILY_GROWTH_KEY) || "null");
        if (saved && saved.date === today && saved.stats) return saved;
    } catch (_) {}
    return { date:today, stats:{ exploration:0, experience:0, memory:0, connection:0, growth:0 } };
}
function recordTodayGrowth(added) {
    var state = loadTodayGrowth();
    RPG_STAT_KEYS.forEach(function(key) { state.stats[key] = Math.max(0, Number(state.stats[key]) || 0) + Math.max(0, Number(added[key]) || 0); });
    safeStorageSet(DAILY_GROWTH_KEY, JSON.stringify(state));
}
function loadDailyTaskState() {
    var today = getDailyTaskDate();
    try {
        var saved = JSON.parse(localStorage.getItem(DAILY_TASK_KEY) || "null");
        if (saved && saved.date === today) {
            // 거리 미션이 두 개였던 이전 일일 미션은 같은 날에도 즉시 교체한다.
            // 사용자가 직접 남기는 기록 행동을 하나 넣어 걷기 미션과 겹치지 않게 한다.
            var hasReplaceableMission = Array.isArray(saved.missions) && saved.missions.some(function(mission) { return mission && (mission.id === "walk_100" || mission.id === "pin_1"); });
            if (hasReplaceableMission) {
                saved.missions = saved.missions.map(function(mission) {
                    return mission && (mission.id === "walk_100" || mission.id === "pin_1")
                        ? { id: "share_giloa", type: "share", icon: "↗", name: "길로아 알리기", target: 1 }
                        : mission;
                });
                safeStorageSet(DAILY_TASK_KEY, JSON.stringify(saved));
            }
            return saved;
        }
    } catch (e) {}
    // 매일 어떤 지역에서도 같은 세 가지 여행 행동을 제시한다.
    // 주변 장소 검색 상태에 따라 1km 걷기 미션이 사라지지 않게 한다.
    var missions = [
        { id: "share_giloa", type: "share", icon: "↗", name: "길로아 알리기", target: 1 },
        { id: "walk_1000", type: "distance", icon: "✦", name: "1km 걷기", target: 1000 },
        { id: "photo_1", type: "photo", icon: "◇", name: "사진 1장 남기기", target: 1 }
    ];
    var fresh = { date: today, startDistance: totalDistance, startPhotos: photos.length, missions: missions.slice(0, 3) };
    safeStorageSet(DAILY_TASK_KEY, JSON.stringify(fresh));
    return fresh;
}
function getDailyTaskProgress() {
    var state = loadDailyTaskState();
    var walked = Math.max(0, totalDistance - Number(state.startDistance || 0));
    var photoCount = Math.max(0, photos.length - Number(state.startPhotos || 0));
    return (state.missions || []).map(function(mission) {
        var current = 0;
        if (mission.type === "distance") current = Math.min(walked, mission.target);
        else if (mission.type === "photo") current = Math.min(photoCount, 1);
        else if (mission.type === "share") current = safeStorageGet(DAILY_SHARE_KEY) === state.date ? 1 : 0;
        else if (mission.type === "photo_place") current = photos.some(function(p) { return p.placeId === mission.targetId || (p.lat && L.latLng(p.lat, p.lng).distanceTo([mission.targetLat, mission.targetLng]) <= 80); }) ? 1 : 0;
        else if (mission.type === "visit_place") current = visitStamps.some(function(v) { return v.visitKey && v.visitKey.indexOf(mission.targetId + ":") === 0; }) ? 1 : 0;
        return Object.assign({}, mission, { current: current, value: mission.type === "distance" ? Math.round(current) + "/" + mission.target + "m" : current + "/1" });
    });
}
function getDailyMissionName(mission) {
    var t = UI_TEXT[currentLang] || UI_TEXT.ko;
    if (mission.type === "distance") {
        var meters = Number(mission.target) || 0;
        var distance = meters >= 1000 ? (meters / 1000) + "km" : meters + "m";
        return String(t.daily_mission_walk || "{distance} 걷기").replace("{distance}", distance);
    }
    if (mission.type === "photo") return t.daily_mission_photo;
    if (mission.type === "share") return (DAILY_SHARE_TEXT[currentLang] || DAILY_SHARE_TEXT.ko).mission;
    var item = (tourItems || []).concat(festivalItems || []).find(function(candidate) { return getTourItemId(candidate) === String(mission.targetId || ""); });
    var place = item ? getImageMissionName(item) : t.daily_nearby_place;
    if (mission.type === "visit_place") return String(t.daily_mission_visit || "{place} 방문하기").replace("{place}", place);
    if (mission.type === "photo_place") return String(t.daily_mission_photo_place || "{place}에서 사진 남기기").replace("{place}", place);
    return mission.name || "";
}
function updateDailyMissions() {
    var listEl = document.getElementById("daily-task-list");
    if (!listEl) return;
    var tasks = getDailyTaskProgress();
    var completed = tasks.filter(function(task) { return task.current >= task.target; }).length;
    listEl.innerHTML = tasks.map(function(task) {
        var pct = Math.min(100, Math.round((task.current / task.target) * 100));
        var done = pct >= 100;
        var effect = done && completeDailyTask(task.id, 30) ? ' just-completed' : '';
        var shareAction = task.type === "share" && !done ? '<button type="button" class="daily-share-action" onclick="shareGiloaToday()">' + escapeHtml((DAILY_SHARE_TEXT[currentLang] || DAILY_SHARE_TEXT.ko).action) + '</button>' : '';
        return '<div class="daily-task-item daily-task-action' + (done ? ' done' : '') + effect + '" data-task-id="' + escapeHtml(task.id) + '" data-task-type="' + escapeHtml(task.type) + '" role="button" tabindex="0"><div class="daily-task-icon">' + (done ? "✓" : task.icon) + '</div><div><div class="daily-task-name">' + escapeHtml(getDailyMissionName(task)) + '</div><div class="daily-task-track"><div class="daily-task-fill" style="width:' + pct + '%"></div></div></div><div class="daily-task-value">' + task.value + shareAction + '</div></div>';
    }).join("");
    listEl.querySelectorAll(".daily-task-action").forEach(function(item) {
        var activate = function(event) {
            if (event && event.target && event.target.closest && event.target.closest(".daily-share-action")) return;
            handleDailyTaskAction(item.dataset.taskType, event);
        };
        item.addEventListener("click", activate);
        item.addEventListener("keydown", function(event) {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            activate(event);
        });
    });
    var tagCount = document.getElementById("daily-task-tag-count");
    var summary = document.getElementById("daily-task-summary");
    var tag = document.getElementById("daily-task-tag");
    if (tagCount) tagCount.textContent = completed + "/3";
    if (summary) summary.textContent = completed + "/3 " + ((UI_TEXT[currentLang] || UI_TEXT.ko).daily_completed || "완료");
    if (tag) tag.classList.toggle("all-done", completed === 3);
}
function handleDailyTaskAction(taskType, event) {
    if (event) event.stopPropagation();
    if (taskType === "photo" || taskType === "photo_place") {
        toggleDailyTasks(false);
        triggerCamera();
        return;
    }
    if (taskType === "distance") showTodayWalkingRoute();
}
function showTodayWalkingRoute() {
    var todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    var points = (pathCoordinates || []).filter(function(point) {
        return point && isFinite(point.lat) && isFinite(point.lng) && Number(point.endTime || point.startTime) >= todayStart.getTime();
    }).sort(function(a, b) { return Number(a.startTime) - Number(b.startTime); });
    if (!points.length) {
        showCollectionToast(earlyUiText("noRouteToday"));
        return;
    }
    toggleDailyTasks(false);
    if (!map.getPane("dailyRoutePane")) {
        map.createPane("dailyRoutePane");
        map.getPane("dailyRoutePane").style.zIndex = 625;
        map.getPane("dailyRoutePane").style.pointerEvents = "none";
    }
    if (dailyRouteLayer) dailyRouteLayer.clearLayers();
    else dailyRouteLayer = L.layerGroup().addTo(map);
    // The canvas already shows the full route ribbon; do not add a centerline.
    var bounds = L.latLngBounds(points.map(function(point) { return [point.lat, point.lng]; }));
    if (bounds.isValid() && points.length > 1) map.fitBounds(bounds, { padding:[42, 110], maxZoom:18, animate:true });
    else map.setView([points[0].lat, points[0].lng], 17, { animate:true });
}
function shareGiloaToday() {
    var copy = DAILY_SHARE_TEXT[currentLang] || DAILY_SHARE_TEXT.ko;
    var url = "https://giloa.kr/";
    var message = copy.text + "\n" + url;
    var complete = function() {
        safeStorageSet(DAILY_SHARE_KEY, getDailyTaskDate());
        updateDailyMissions();
    };
    if (navigator.share) {
        navigator.share({ title: "Giloa", text: copy.text, url: url }).then(complete).catch(function() {});
        return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(message).then(complete).catch(function() {
            window.prompt(copy.action, message);
            complete();
        });
        return;
    }
    window.prompt(copy.action, message);
    complete();
}
function toggleDailyTasks(forceOpen) {
    dailyTaskPanelOpen = typeof forceOpen === "boolean" ? forceOpen : !dailyTaskPanelOpen;
    var panel = document.getElementById("daily-task-panel");
    var tag = document.getElementById("daily-task-tag");
    if (panel) {
        panel.classList.toggle("open", dailyTaskPanelOpen);
        panel.setAttribute("aria-hidden", dailyTaskPanelOpen ? "false" : "true");
    }
    if (tag) tag.setAttribute("aria-expanded", dailyTaskPanelOpen ? "true" : "false");
    if (dailyTaskPanelOpen) updateDailyMissions();
}

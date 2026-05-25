// ── 앱 시작 시 위치 권한 요청 ──
async function requestLocationPermission() {
    if (window.Capacitor && window.Capacitor.isNativePlatform()) {
        try {
            const { Geolocation } = window.Capacitor.Plugins;
            await Geolocation.requestPermissions();

            const { BackgroundGeolocation } = window.Capacitor.Plugins;
            if (BackgroundGeolocation) {
                await BackgroundGeolocation.addWatcher({
                    backgroundMessage: "길로아가 경로를 기록하고 있어요",
                    backgroundTitle: "길로아 위치 기록 중",
                    requestPermissions: true,
                    stale: false,
                    distanceFilter: 10
                }, function(location, error) {
                    if (error) { console.warn("BG 위치 에러", error); return; }
                    if (location && isRecording) {
                        handlePosition({
                            coords: {
                                latitude: location.latitude,
                                longitude: location.longitude,
                                accuracy: location.accuracy
                            }
                        });
                    }
                });
            }
        } catch (e) {
            console.warn("권한 요청 실패", e);
        }
    }
}
requestLocationPermission();

const STORAGE_KEY        = "giloa-v7";
const FOG_ENABLED_KEY    = "giloa-fog-enabled";
const GPX_SAVES_KEY      = "giloa-gpx-saves";
const FOG_ALPHA_BASE     = 0.80;
const FOG_ALPHA_PER_LV   = 0.01;
function getFogAlpha() {
    const lv = calcLevel().level;
    return Math.max(0, FOG_ALPHA_BASE - (lv - 1) * FOG_ALPHA_PER_LV);
}
const FOG_RADIUS_M       = 18;
const MIN_MOVE_M         = 15;
const MAX_ACCURACY_M     = 50;
const STAY_ACCURACY_FACTOR = 0.6;
const MAX_STAY_RADIUS_M  = 36;
const SAVE_DELAY_MS      = 800;
const MERGE_DISTANCE_M   = 6;
const MERGE_TIME_GAP_MS  = 2 * 60 * 1000;
const MAX_PATH_POINTS    = 5000;

const FULL_VISIBILITY_HOURS = 0;
const MIN_VISIBILITY_HOURS  = 24;
const MIN_PATH_VISIBILITY   = 0.4;

const THREE_DAYS_IN_DAYS   = 3;
const ONE_MONTH_DAYS       = 30;
const THREE_MONTHS_DAYS    = 90;
const SIX_MONTHS_DAYS      = 180;
const ONE_YEAR_DAYS        = 365;
const SEDIMENT_LAYER_COLOR = "rgba(126, 112, 96, 0.24)";

const CLUSTER_ZOOM_THRESHOLD = 14;
const MARKER_MAX_SIZE = 40;
const MARKER_MIN_SIZE = 20;
const MARKER_MAX_ZOOM = 17;
const MARKER_MIN_ZOOM = 14;

const GAP_THRESHOLD_MS = 3 * 60 * 1000;

const LEVEL_TABLE = [
{ level: 1,  title: "길 없는 자",           distKm: 0,    memories: 0,  photos: 0   },
{ level: 2,  title: "흔적을 남긴 자",       distKm: 1,    memories: 0,  photos: 0   },
{ level: 3,  title: "탐험자",               distKm: 10,   memories: 1,  photos: 0   },
{ level: 4,  title: "길을 만든 자",         distKm: 30,   memories: 3,  photos: 0   },
{ level: 5,  title: "바람을 걷는 자",       distKm: 60,   memories: 5,  photos: 3   },
{ level: 6,  title: "기억을 수집하는 자",   distKm: 100,  memories: 8,  photos: 5   },
{ level: 7,  title: "두 바퀴의 여행자",     distKm: 150,  memories: 12, photos: 8   },
{ level: 8,  title: "지도를 그리는 자",     distKm: 220,  memories: 18, photos: 12  },
{ level: 9,  title: "길의 연대기",          distKm: 300,  memories: 25, photos: 18  },
{ level: 10, title: "개척자",               distKm: 400,  memories: 35, photos: 25  },
{ level: 11, title: "속도의 탐험가",        distKm: 550,  memories: 45, photos: 33  },
{ level: 12, title: "궤도를 달리는 자",     distKm: 720,  memories: 58, photos: 43  },
{ level: 13, title: "대륙을 가로지르는 자", distKm: 900,  memories: 72, photos: 55  },
{ level: 14, title: "세계의 증인",          distKm: 1100, memories: 88, photos: 68  },
{ level: 15, title: "세계의 기록자",        distKm: 1350, memories: 107, photos: 84 },
];

const SPEED_LIMIT_WALK   = 7  / 3.6;
const SPEED_LIMIT_BIKE   = 30 / 3.6;

// ── IndexedDB (사진 이미지 전용) ──
const IDB_NAME    = "giloa-photos";
const IDB_VERSION = 1;
const IDB_STORE   = "images";
// ── IndexedDB (사진 이미지 + GPX 콘텐츠 전용) ──
const IDB_NAME      = "giloa-photos";
const IDB_VERSION   = 2;          // ✅ 수정: 1 → 2 (gpx store 추가)
const IDB_STORE     = "images";
const IDB_GPX_STORE = "gpx";      // ✅ 추가
let idb = null;

function openIdb() {
@@ -107,12 +108,17 @@
            if (!db.objectStoreNames.contains(IDB_STORE)) {
                db.createObjectStore(IDB_STORE, { keyPath: "id" });
            }
            // ✅ 추가: GPX 전용 store
            if (!db.objectStoreNames.contains(IDB_GPX_STORE)) {
                db.createObjectStore(IDB_GPX_STORE, { keyPath: "id" });
            }
        };
        req.onsuccess  = function(e) { idb = e.target.result; resolve(idb); };
        req.onerror    = function(e) { reject(e.target.error); };
    });
}

// ── 사진 IDB 헬퍼 ──
function idbSavePhoto(id, photo, thumb) {
    return openIdb().then(function(db) {
        return new Promise(function(resolve, reject) {
@@ -155,6 +161,42 @@
    });
}

// ✅ 추가: GPX IDB 헬퍼 ──
function idbSaveGpx(id, gpxContent) {
    return openIdb().then(function(db) {
        return new Promise(function(resolve, reject) {
            var tx = db.transaction(IDB_GPX_STORE, "readwrite");
            tx.objectStore(IDB_GPX_STORE).put({ id: id, gpxContent: gpxContent });
            tx.oncomplete = resolve;
            tx.onerror = function(e) { reject(e.target.error); };
        });
    });
}

function idbGetGpx(id) {
    return openIdb().then(function(db) {
        return new Promise(function(resolve, reject) {
            var req = db.transaction(IDB_GPX_STORE, "readonly")
                        .objectStore(IDB_GPX_STORE).get(id);
            req.onsuccess = function(e) {
                resolve(e.target.result ? e.target.result.gpxContent : null);
            };
            req.onerror = function(e) { reject(e.target.error); };
        });
    });
}

function idbDeleteGpx(id) {
    return openIdb().then(function(db) {
        return new Promise(function(resolve, reject) {
            var tx = db.transaction(IDB_GPX_STORE, "readwrite");
            tx.objectStore(IDB_GPX_STORE).delete(id);
            tx.oncomplete = resolve;
            tx.onerror = function(e) { reject(e.target.error); };
        });
    });
}

// ── 상태 변수 ──
let isRecording     = false;
let photos          = [];
@@ -704,12 +746,12 @@
    var now = Date.now();
    recStatusBox.textContent = accuracy > MAX_ACCURACY_M ? "GPS 약함 (" + Math.round(accuracy) + "m)" : "기록 중";

  if (pathCoordinates.length === 0) {
    pathCoordinates.push(createPathPoint(latlng, now));
    checkStayBonus(latlng, now);
    checkLocationMissions(latlng, now);
    updateStats(); scheduleSave(); scheduleRender();
    return; // ← 추가!
    if (pathCoordinates.length === 0) {
        pathCoordinates.push(createPathPoint(latlng, now));
        checkStayBonus(latlng, now);
        checkLocationMissions(latlng, now);
        updateStats(); scheduleSave(); scheduleRender();
        return;
    }

    var last          = pathCoordinates[pathCoordinates.length - 1];
@@ -902,10 +944,14 @@
    });
}

// ✅ 수정: game1/2/3 탭 포함하도록 ALL_TABS 통합
function switchTab(tab) {
    ["memory", "photo", "gpx"].forEach(function(t) {
        document.getElementById("tab-" + t).classList.toggle("active", t === tab);
        document.getElementById("panel-" + t).style.display = t === tab ? "" : "none";
    var ALL_TABS = ["memory", "photo", "gpx", "game1", "game2", "game3"];
    ALL_TABS.forEach(function(t) {
        var tabEl   = document.getElementById("tab-" + t);
        var panelEl = document.getElementById("panel-" + t);
        if (tabEl)   tabEl.classList.toggle("active", t === tab);
        if (panelEl) panelEl.style.display = t === tab ? "" : "none";
    });
    if (tab === "photo") updatePhotoList();
    if (tab === "gpx")   updateGpxSavedList();
@@ -952,6 +998,7 @@
    if (infoEl)  infoEl.textContent  = "오늘 기준 최근 " + dialHours + "시간 발걸음";
}

// ✅ 수정: GPX 콘텐츠를 IDB에 저장, localStorage에는 메타데이터만
function exportGpx() {
    var sinceMs  = Date.now() - dialHours * 60 * 60 * 1000;
    var filtered = pathCoordinates.filter(function(p) { return p.startTime >= sinceMs; });
@@ -964,21 +1011,47 @@
    }).join("\n");
    var gpxContent =
'<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="Giloa - 나의 대동여지도"\n     xmlns="http://www.topografix.com/GPX/1/1">\n  <metadata><name>' + name + '</name><time>' + new Date().toISOString() + '</time></metadata>\n  <trk><name>' + name + '</name><trkseg>\n' + trkpts + '\n  </trkseg></trk>\n</gpx>';

    var id = String(Date.now());
    var saves = loadGpxSaves();
    var id    = String(Date.now());
    saves.push({ id: id, name: name, createdAt: Date.now(), pointCount: filtered.length, gpxContent: gpxContent });
    saveGpxSaves(saves); updateGpxSavedList();
    // ✅ gpxContent 제외한 메타데이터만 localStorage에 저장
    saves.push({ id: id, name: name, createdAt: Date.now(), pointCount: filtered.length });
    saveGpxSaves(saves);

    // ✅ GPX 콘텐츠는 IDB에 저장
    idbSaveGpx(id, gpxContent)
        .then(function() {
            updateGpxSavedList();
            document.getElementById("gpx-import-status").textContent = '✓ "' + name + '" 저장 완료';
        })
        .catch(function(e) {
            console.error("GPX IDB 저장 실패", e);
            document.getElementById("gpx-import-status").textContent = "저장 실패: " + e.message;
        });

    // 파일 다운로드
    var blob = new Blob([gpxContent], { type: "application/gpx+xml" });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement("a");
    a.href = url; a.download = "giloa_" + name + ".gpx"; a.click();
    URL.revokeObjectURL(url);
    document.getElementById("gpx-export-name").value = "";
    document.getElementById("gpx-import-status").textContent = '✓ "' + name + '" 저장 완료';
}

function loadGpxSaves() { try { return JSON.parse(localStorage.getItem(GPX_SAVES_KEY) || "[]"); } catch(e) { return []; } }
function saveGpxSaves(saves) { localStorage.setItem(GPX_SAVES_KEY, JSON.stringify(saves)); }
// ✅ 수정: localStorage에서 gpxContent 제거 (메타만 저장)
function loadGpxSaves() {
    try {
        return JSON.parse(localStorage.getItem(GPX_SAVES_KEY) || "[]");
    } catch(e) { return []; }
}

function saveGpxSaves(saves) {
    // ✅ gpxContent 필드가 실수로 들어오지 않도록 메타만 추출해서 저장
    var meta = saves.map(function(s) {
        return { id: s.id, name: s.name, createdAt: s.createdAt, pointCount: s.pointCount };
    });
    localStorage.setItem(GPX_SAVES_KEY, JSON.stringify(meta));
}

function updateGpxSavedList() {
    var container = document.getElementById("gpx-saved-list");
@@ -1007,12 +1080,26 @@
function deleteGpxSave(id) {
    if (id === activeGpxId) clearActiveGpxRoute();
    saveGpxSaves(loadGpxSaves().filter(function(s) { return s.id !== id; }));
    // ✅ IDB에서도 삭제
    idbDeleteGpx(id).catch(function(e) { console.warn("GPX IDB 삭제 실패", e); });
    updateGpxSavedList();
}

// ✅ 수정: IDB에서 GPX 콘텐츠를 비동기로 읽어서 지도에 표시
function toggleGpxRoute(save) {
    if (activeGpxId === save.id) { clearActiveGpxRoute(); updateGpxSavedList(); return; }
    clearActiveGpxRoute(); drawGpxRoute(save.gpxContent, save.id); updateGpxSavedList(); toggleSidebar(false);
    clearActiveGpxRoute();
    idbGetGpx(save.id)
        .then(function(gpxContent) {
            if (!gpxContent) { alert("GPX 데이터를 찾을 수 없습니다."); return; }
            drawGpxRoute(gpxContent, save.id);
            updateGpxSavedList();
            toggleSidebar(false);
        })
        .catch(function(e) {
            console.error("GPX IDB 읽기 실패", e);
            alert("GPX 데이터를 불러오지 못했습니다.");
        });
}

function clearActiveGpxRoute() {
@@ -1038,6 +1125,7 @@
    map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
}

// ✅ 수정: 불러온 GPX 파일도 IDB에 저장
function importGpxFile(event) {
    var file = event.target.files[0]; if (!file) return;
    var statusEl = document.getElementById("gpx-import-status");
@@ -1049,11 +1137,24 @@
            var gpxContent = e.target.result;
            var trkpts = new DOMParser().parseFromString(gpxContent, "application/xml").querySelectorAll("trkpt");
            if (trkpts.length === 0) { statusEl.textContent = "경로 없음"; return; }
            var saves = loadGpxSaves(); var id = String(Date.now());
            saves.push({ id: id, name: name, createdAt: Date.now(), pointCount: trkpts.length, gpxContent: gpxContent });
            var id = String(Date.now());
            var saves = loadGpxSaves();
            // ✅ 메타데이터만 localStorage에
            saves.push({ id: id, name: name, createdAt: Date.now(), pointCount: trkpts.length });
            saveGpxSaves(saves);
            clearActiveGpxRoute(); drawGpxRoute(gpxContent, id); updateGpxSavedList();
            statusEl.textContent = '✓ "' + name + '" 불러오기 완료'; toggleSidebar(false);
            // ✅ 콘텐츠는 IDB에
            idbSaveGpx(id, gpxContent)
                .then(function() {
                    clearActiveGpxRoute();
                    drawGpxRoute(gpxContent, id);
                    updateGpxSavedList();
                    statusEl.textContent = '✓ "' + name + '" 불러오기 완료';
                    toggleSidebar(false);
                })
                .catch(function(err) {
                    statusEl.textContent = "저장 실패: " + err.message;
                    console.error(err);
                });
        } catch (err) { statusEl.textContent = "파일을 읽지 못했습니다."; console.error(err); }
    };
    reader.readAsText(file); event.target.value = "";
@@ -1306,7 +1407,7 @@
    resizeCanvas();
    loadState();
    loadBonusState();
    loadMissionState(); // ← 먼저 복원
    loadMissionState();
    renderStoredMarkers();
    renderStoredPhotoMarkers();
    updateStats();
@@ -1317,7 +1418,7 @@
    initGpxDial();
    initHudTapTargets();
    initCompass();
    renderMissionMarkers(); // ← 복원 후 렌더링
    renderMissionMarkers();
    setTimeout(function() {
        if (!isRecording) toggleRecording();
    }, 5000);
@@ -1463,7 +1564,7 @@
    }

    LOCATION_MISSIONS.forEach(function(mission) {
        if (mission.achieved) return; // 달성한 건 숨김
        if (mission.achieved) return;

        var marker = L.marker([mission.lat, mission.lng], {
            pane: "missionPane",
@@ -1512,36 +1613,32 @@
        var dist = latlng.distanceTo([mission.lat, mission.lng]);

        if (dist <= mission.radius) {
            // 반경 안에 있음
            if (!mission.stayStart) {
                mission.stayStart = now;
                // 상태바 표시
                recStatusBox.textContent = "기록 중 · " + mission.name + " 미션 진행 중";
            } else {
                var elapsed = now - mission.stayStart;
                var remaining = 30 * 60 * 1000 - elapsed; // 30분
                var remaining = 30 * 60 * 1000 - elapsed;
                if (remaining <= 0) {
                    // 미션 달성!
                    mission.achieved = true;
                    mission.stayStart = null;
                    saveMissionState();
                    renderMissionMarkers(); // 달성한 마커 제거
                    renderMissionMarkers();
                    showMissionReward(mission);
                } else {
                    var mins = Math.ceil(remaining / 60000);
                    recStatusBox.textContent = "기록 중 · " + mission.name + " " + mins + "분 남음";
                }
            }
        } else {
            // 반경 밖으로 나감
            if (mission.stayStart) {
                mission.stayStart = null;
                recStatusBox.textContent = "기록 중";
            }
        }
    });
}
// 미션 마커 펄스 애니메이션

if (!document.getElementById("mission-marker-style")) {
    var mStyle = document.createElement("style");
    mStyle.id = "mission-marker-style";
@@ -1552,7 +1649,6 @@
    document.head.appendChild(mStyle);
}

// ── 미션 저장/복원 ──
var MISSION_STORAGE_KEY = "giloa-missions";

function loadMissionState() {
@@ -1566,6 +1662,11 @@
    } catch(e) {}
}

function saveMissionState() {
    var data = {};
    LOCATION_MISSIONS.forEach(function(m) { data[m.id] = m.achieved; });
    localStorage.setItem(MISSION_STORAGE_KEY, JSON.stringify(data));
}

// ── TourAPI 관광지 추천 ──
var TOUR_API_KEY = "c6995449e23f94083d88f198fe2617a8f957a2063bc6ac0d19816c9f27a0ed6c";
@@ -1605,7 +1706,6 @@

    if (!listEl || !loadingEl || !emptyEl || !expandBtn || !countEl) return;

    // 패널이 닫혀있으면 데이터만 받고 렌더링 안 함
    listEl.innerHTML = "";
    expandBtn.style.display = "none";
    emptyEl.style.display = "none";
@@ -1660,7 +1760,7 @@
    listEl.innerHTML = "";

    var center = map.getCenter();
    var showCount = tourItems.length;  // 패널 열리면 전체 표시
    var showCount = tourItems.length;

    for (var i = 0; i < showCount; i++) {
        (function(item, idx) {
@@ -1680,11 +1780,11 @@

            var nameEl = document.createElement("div");
            nameEl.className = "tour-card-name";
            nameEl.textContent = getTourTitle(item) || "이름 없음";  // ← 수정
            nameEl.textContent = getTourTitle(item) || "이름 없음";

            var typeEl = document.createElement("div");
            typeEl.className = "tour-card-type";
            typeEl.textContent = TOUR_TYPE_NAMES[item.contenttypeid] || "관광";  // 이건 이미 OK
            typeEl.textContent = TOUR_TYPE_NAMES[item.contenttypeid] || "관광";

            var distEl = document.createElement("div");
            distEl.className = "tour-card-dist";
@@ -1703,7 +1803,6 @@
                var lng = parseFloat(item.mapx);
                map.flyTo([lat, lng], 17);
                showTourPopup(item, color);
                // 해당 마커 강조
                if (tourMarkers[idx]) {
                    tourMarkers[idx].setRadius(13);
                    setTimeout(function() {
@@ -1716,7 +1815,6 @@
        })(tourItems[i], i);
    }


    addTourMarkers();
}

@@ -1730,7 +1828,7 @@
    if (tourPanelOpen) {
        headerEl.style.borderBottomLeftRadius = "0";
        headerEl.style.borderBottomRightRadius = "0";
        if (!tourItems || tourItems.length === 0) { // ← 방어 코드
        if (!tourItems || tourItems.length === 0) {
            if (emptyEl) emptyEl.style.display = "";
        } else {
            renderTourCards();
@@ -1741,9 +1839,10 @@
        if (expandBtn) expandBtn.style.display = "none";
        headerEl.style.borderBottomLeftRadius = "10px";
        headerEl.style.borderBottomRightRadius = "10px";
        if (typeof tourMarkers !== "undefined") clearTourMarkers(); // ← 방어 코드
        if (typeof tourMarkers !== "undefined") clearTourMarkers();
    }
}

function showTourPopup(item, color) {
    var lat = parseFloat(item.mapy);
    var lng = parseFloat(item.mapx);
@@ -1768,21 +1867,19 @@

function addTourMarkers() {
    clearTourMarkers();
   
    // 관광지 전용 pane이 없으면 생성 (안개 위, z-index 620)

    if (!map.getPane("tourPane")) {
        map.createPane("tourPane");
        map.getPane("tourPane").style.zIndex = "620";
        map.getPane("tourPane").style.pointerEvents = "auto";
    }

    
    tourItems.forEach(function(item, idx) {
        var lat = parseFloat(item.mapy);
        var lng = parseFloat(item.mapx);
        if (!isFinite(lat) || !isFinite(lng)) return;
        var color = TOUR_COLORS[idx % TOUR_COLORS.length];
        item._color = color;  // 카드 렌더링 때 참조
        item._color = color;
        var marker = L.circleMarker([lat, lng], {
            pane: "tourPane",
            radius: 7,
@@ -1794,7 +1891,6 @@
        }).addTo(map);
        marker._tourIdx = idx;
        marker.on("click", function() { showTourPopup(item, color); });
        // 호버 시 마커 강조
        marker.on("mouseover", function() { marker.setRadius(11); });
        marker.on("mouseout",  function() { marker.setRadius(7);  });
        tourMarkers.push(marker);
@@ -1863,21 +1959,20 @@
    if (!text || targetLang === "ko") return Promise.resolve(text);
    var cacheKey = targetLang + "::" + text;
    if (translateCache[cacheKey]) return Promise.resolve(translateCache[cacheKey]);
    
    // URL에 API 키를 쿼리 파라미터로 넣어서 헤더 없이 시도

    var url = "https://corsproxy.io/?https://api.varco.ai/mt/chat-content/v1/translate";
    

    return fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" }, // openapi_key 헤더 제거
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            TID: "giloa-" + Date.now(),
            svc: "varco-translation",
            provider: "content",
            source_lang: "ko",
            source_text: text,
            target_lang: targetLang,
            openapi_key: VARCO_API_KEY  // ← body에 넣기
            openapi_key: VARCO_API_KEY
        })
    })
    .then(function(res) { return res.json(); })
@@ -1888,6 +1983,7 @@
    })
    .catch(function() { return text; });
}

function translateTourItems(lang) {
    if (lang === "ko") { renderTourCards(); return; }
    if (tourItems.length === 0) { renderTourCards(); return; }
@@ -1897,7 +1993,7 @@

    function check() {
        done++;
        if (done >= total) renderTourCards(); // 모두 완료 후 한번만 렌더
        if (done >= total) renderTourCards();
    }

    tourItems.forEach(function(item) {
@@ -1936,19 +2032,16 @@
    var activeBtn = document.querySelector('.lang-btn[onclick="setLang(\'' + lang + '\')"]');
    if (activeBtn) activeBtn.classList.add("active");
    applyLang();
    
    // 관광지 번역

    if (lang === "ko") {
        if (tourPanelOpen) renderTourCards();
    } else {
        // 번역 먼저 완료 후 카드 그리기
        translateTourItems(lang);
    }
}

function applyLang() {
    var L = LANG[currentLang]; if (!L) return;
    if (typeof TOUR_TYPE_NAMES === "undefined") return; // ← 추가
    var appTitle = document.querySelector(".sidebar-header h2");
    if (appTitle) appTitle.textContent = L.appTitle;
    var fogLabel = document.querySelector(".fog-toggle-label");
@@ -1976,9 +2069,9 @@
    if (hudLabels[2]) hudLabels[2].textContent = L.hudPhoto;
    var hudTitleLabel = document.getElementById("hud-title-label");
    if (hudTitleLabel) hudTitleLabel.textContent = L.hudTitle;
    if (L.tourTypes && typeof TOUR_TYPE_NAMES !== "undefined") {
    if (L.tourTypes) {
        Object.keys(L.tourTypes).forEach(function(k) { TOUR_TYPE_NAMES[k] = L.tourTypes[k]; });
        if (typeof tourPanelOpen !== "undefined" && tourPanelOpen) renderTourCards();
        if (tourPanelOpen) renderTourCards();
    }
    if (L.levelTitles) {
        L.levelTitles.forEach(function(title, i) { if (LEVEL_TABLE[i]) LEVEL_TABLE[i].title = title; });
@@ -1989,12 +2082,6 @@
map.on("moveend", scheduleTourFetch);
scheduleTourFetch();

function saveMissionState() {
    var data = {};
    LOCATION_MISSIONS.forEach(function(m) { data[m.id] = m.achieved; });
    localStorage.setItem(MISSION_STORAGE_KEY, JSON.stringify(data));
}

function showMissionReward(mission) {
    var descPromise   = currentLang !== "ko" ? varcoTranslate(mission.desc,   currentLang) : Promise.resolve(mission.desc);
    var rewardPromise = currentLang !== "ko" ? varcoTranslate(mission.reward, currentLang) : Promise.resolve(mission.reward);
@@ -2108,13 +2195,12 @@
var compassCtx       = null;

function initCompass() {
    // 나침반 캔버스 생성
    compassCanvas = document.createElement("canvas");
    compassCanvas.id = "compass-canvas";
    compassCanvas.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1050;";
compassCanvas.width  = window.innerWidth;
compassCanvas.height = window.innerHeight;
document.body.appendChild(compassCanvas);
    compassCanvas.width  = window.innerWidth;
    compassCanvas.height = window.innerHeight;
    document.body.appendChild(compassCanvas);
    compassCtx = compassCanvas.getContext("2d");

    window.addEventListener("resize", function() {
@@ -2123,10 +2209,8 @@
        renderCompassOverlay();
    });

    // 기기 나침반 이벤트
    if (window.DeviceOrientationEvent) {
        if (typeof DeviceOrientationEvent.requestPermission === "function") {
            // iOS 13+
            DeviceOrientationEvent.requestPermission().then(function(state) {
                if (state === "granted") {
                    window.addEventListener("deviceorientation", handleOrientation);
@@ -2166,13 +2250,11 @@
    var h = compassCanvas.height;
    compassCtx.clearRect(0, 0, w, h);

    // 이동 방향 계산 (나침반 없을 때 대체)
    var heading = compassHeading !== null ? compassHeading : calcMovingHeading();

    // ── 시야각 부채꼴 ──
    if (currentPos && heading !== null) {
        var center = map.latLngToContainerPoint(currentPos);
        var fovAngle  = 70;  // 시야각 70도
        var fovAngle  = 70;
        var fovRadius = Math.min(w, h) * 0.28;
        var startAngle = (heading - fovAngle / 2 - 90) * Math.PI / 180;
        var endAngle   = (heading + fovAngle / 2 - 90) * Math.PI / 180;
@@ -2192,7 +2274,6 @@
        compassCtx.fillStyle = grad;
        compassCtx.fill();

        // 부채꼴 테두리
        compassCtx.beginPath();
        compassCtx.moveTo(center.x, center.y);
        compassCtx.arc(center.x, center.y, fovRadius, startAngle, endAngle);
@@ -2202,14 +2283,13 @@
        compassCtx.stroke();
    }

    // ── 동서남북 UI ──
    renderNSEW(w, h, heading);
}

function renderNSEW(w, h, heading) {
    var cx = w / 2;
    var cy = h / 2;
    var r  = Math.min(w, h) * 0.44; // 화면 가장자리에 배치
    var r  = Math.min(w, h) * 0.44;

    var dirs = [
        { label: "N", angle: 0,   color: "#ff4444" },
@@ -2218,20 +2298,16 @@
        { label: "W", angle: 270, color: "rgba(255,255,255,0.7)" }
    ];

    // 나침반이 있으면 지도 회전과 무관하게 실제 방위 표시
    var mapBearing = heading !== null ? heading : 0;

    dirs.forEach(function(d) {
        var rad = (d.angle - mapBearing) * Math.PI / 180;
        // 화면 중앙 기준 가장자리 위치 계산
        var tx = cx + Math.sin(rad) * r;
        var ty = cy - Math.cos(rad) * r;

        // 화면 안으로 클리핑
        tx = Math.max(20, Math.min(w - 20, tx));
        ty = Math.max(20, Math.min(h - 20, ty));

        // 배경 원
        compassCtx.beginPath();
        compassCtx.arc(tx, ty, 14, 0, Math.PI * 2);
        compassCtx.fillStyle = d.label === "N"
@@ -2244,12 +2320,10 @@
        compassCtx.lineWidth = 1;
        compassCtx.stroke();

        // 텍스트
        compassCtx.font = "bold 11px 'Apple SD Gothic Neo', sans-serif";
        compassCtx.fillStyle = d.color;
        compassCtx.textAlign = "center";
        compassCtx.textBaseline = "middle";
        compassCtx.fillText(d.label, tx, ty);
    });
}

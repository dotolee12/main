var DURUNUBI_ENDPOINT = "https://apis.data.go.kr/B551011/Durunubi";
var DURUNUBI_API_KEY = window.GILOA_DURUNUBI_API_KEY || TOUR_API_KEY || "";
var durunubiCourses = [];
var durunubiCoursesPromise = null;
var durunubiGpxCache = {};
var durunubiLocalBundlePromise = null;
var durunubiRouteLayers = [];
var completedOfficialLayerGroup = L.layerGroup().addTo(map);
var renderedOfficialRoutes = [];
var completedOfficialRefreshTimer = null;
var completedOfficialMatchCache = new WeakMap();
var durunubiCanvas = document.getElementById("durunubi-canvas");
var durunubiCanvasContext = durunubiCanvas ? durunubiCanvas.getContext("2d") : null;
var durunubiVisibleBundle = null;
var durunubiRefreshTimer = null;
var durunubiRequestSeq = 0;
var durunubiLastRegion = "";
var durunubiDiagnostics = { stage:"대기", courses:0, routes:0, points:0, drawn:0, error:"" };
var DURUNUBI_TEXT = {
    ko:{ route:"공식 탐방로", easy:"쉬움", normal:"보통", hard:"어려움", difficulty:"난이도", hour:"시간", minute:"분", durunubiSource:"한국관광공사 두루누비", forestSource:"한국등산·트레킹지원센터 국가숲길", officialTrailSource:"한국등산·트레킹지원센터", failed:"탐방로 데이터 실패 · 눌러서 확인" },
    en:{ route:"Official walking route", easy:"Easy", normal:"Moderate", hard:"Hard", difficulty:"Difficulty", hour:"hr", minute:"min", durunubiSource:"Korea Tourism Organization · Durunubi", forestSource:"Korea Mountaineering Support Center · National Forest Trails", officialTrailSource:"Korea Mountaineering Support Center", failed:"Durunubi failed · Tap to check" },
    ja:{ route:"公式トレイル", easy:"やさしい", normal:"普通", hard:"難しい", difficulty:"難易度", hour:"時間", minute:"分", durunubiSource:"韓国観光公社・ドゥルヌビ", forestSource:"韓国登山・トレッキング支援センター・国家森林道", officialTrailSource:"韓国登山・トレッキング支援センター", failed:"ドゥルヌビの読込失敗 · タップして確認" },
    zh:{ route:"官方步道", easy:"简单", normal:"普通", hard:"困难", difficulty:"难度", hour:"小时", minute:"分钟", durunubiSource:"韩国观光公社 Durunubi", forestSource:"韩国登山徒步支援中心·国家森林步道", officialTrailSource:"韩国登山徒步支援中心", failed:"Durunubi 加载失败 · 点击查看" },
    es:{ route:"Ruta oficial", easy:"Fácil", normal:"Moderada", hard:"Difícil", difficulty:"Dificultad", hour:"h", minute:"min", durunubiSource:"Organización de Turismo de Corea · Durunubi", forestSource:"Centro Coreano de Montañismo · Senderos forestales nacionales", officialTrailSource:"Centro Coreano de Montañismo", failed:"Error de Durunubi · Toca para comprobar" },
    fr:{ route:"Itinéraire officiel", easy:"Facile", normal:"Modéré", hard:"Difficile", difficulty:"Difficulté", hour:"h", minute:"min", durunubiSource:"Office du tourisme de Corée · Durunubi", forestSource:"Centre coréen de randonnée · Sentiers forestiers nationaux", officialTrailSource:"Centre coréen de randonnée", failed:"Échec de Durunubi · Touchez pour vérifier" }
};
function getDurunubiText() { return DURUNUBI_TEXT[currentLang] || DURUNUBI_TEXT.ko; }

var OFFICIAL_ROUTE_STYLES = {
    nationalForestTrail:{ color:"#25e6ad", weight:7, minZoom:7 },
    majorPeak:{ color:"#a78bfa", weight:5, minZoom:11 },
    mountain100:{ color:"#fb923c", weight:6, minZoom:9 },
    ridge9:{ color:"#38bdf8", weight:6, minZoom:6 },
    baekduDaegan:{ color:"#ef4444", weight:7, minZoom:6 },
    fiveSensesTrail:{ color:"#f472b6", weight:6, minZoom:8 },
    durunubi:{ color:"#ffd21f", weight:6, minZoom:7 }
};

function setDurunubiBadge(text, tone) {
    var badge = document.getElementById("durunubi-loaded-badge");
    if (!badge) return;
    if (!text) { badge.hidden = true; return; }
    badge.textContent = text;
    badge.dataset.tone = tone || "ok";
    badge.hidden = false;
}
function describeDurunubiState() {
    var t = getTourUiText();
    var stages = {"대기":t.waiting,"내장 경로 파일 로드됨":t.loaded,"경로 파일 불러오는 중":t.loadingRoutes,"경로 파일 실패":t.failedRoutes,"꺼짐":t.off,"주변 경로 표시됨":t.visibleRoutes,"주변 경로 없음":t.noRoutes};
    return ["[" + t.diagnostic + "]", t.stage + ": " + (stages[durunubiDiagnostics.stage] || durunubiDiagnostics.stage),
        t.courses + ": " + durunubiDiagnostics.courses,
        t.routes + ": " + durunubiDiagnostics.routes,
        t.points + ": " + durunubiDiagnostics.points,
        t.drawn + ": " + durunubiDiagnostics.drawn,
        t.error + ": " + (durunubiDiagnostics.error || t.none)].join("\n");
}
window.giloaDurunubiDebug = function() { alert(describeDurunubiState()); return durunubiDiagnostics; };

function getDurunubiItems(data) {
    var list = data && data.response && data.response.body && data.response.body.items && data.response.body.items.item;
    return !list ? [] : (Array.isArray(list) ? list : [list]);
}
function stripDurunubiHtml(value) {
    var div = document.createElement("div");
    div.innerHTML = String(value || "").replace(/<br\s*\/?>/gi, " ");
    return (div.textContent || "").replace(/\s+/g, " ").trim();
}
function durunubiMinutesLabel(value) {
    var minutes = Math.max(0, Number(value) || 0), hours = Math.floor(minutes / 60), rest = minutes % 60;
    var t = getDurunubiText();
    return hours ? hours + t.hour + (rest ? " " + rest + t.minute : "") : rest + t.minute;
}
function fetchDurunubiCourses() {
    if (durunubiCourses.length) return Promise.resolve(durunubiCourses);
    if (durunubiCoursesPromise) return durunubiCoursesPromise;
    if (!DURUNUBI_API_KEY) return Promise.reject(new Error("Durunubi service key is missing"));
    var url = DURUNUBI_ENDPOINT + "/courseList?serviceKey=" + encodeURIComponent(DURUNUBI_API_KEY) + "&numOfRows=500&pageNo=1&MobileOS=ETC&MobileApp=Giloa&_type=json";
    durunubiCoursesPromise = requestJsonOnce(url, { timeoutMs:15000 }).then(function(data) {
        var header = data && data.response && data.response.header;
        if (!header || header.resultCode !== "0000") throw new Error((header && header.resultMsg) || "Durunubi response error");
        durunubiCourses = getDurunubiItems(data);
        return durunubiCourses;
    }).finally(function() { durunubiCoursesPromise = null; });
    return durunubiCoursesPromise;
}
function normalizeDurunubiRegion(value) {
    return String(value || "").replace(/특별자치시|특별자치도|특별시|광역시|도$/g, "").replace(/\s+/g, "").trim();
}
function getDurunubiMapRegion() {
    return loadKakaoTrafficSdk().then(function() {
        return new Promise(function(resolve, reject) {
            if (!window.kakao || !window.kakao.maps.services) { reject(new Error("Kakao geocoder unavailable")); return; }
            var center = map.getCenter();
            new window.kakao.maps.services.Geocoder().coord2RegionCode(center.lng, center.lat, function(result, status) {
                if (status !== window.kakao.maps.services.Status.OK || !result || !result.length) { reject(new Error("Region lookup failed")); return; }
                var row = result.find(function(item) { return item.region_type === "H"; }) || result[0];
                resolve({ primary:normalizeDurunubiRegion(row.region_1depth_name), secondary:normalizeDurunubiRegion(row.region_2depth_name) });
            });
        });
    });
}
function parseDurunubiGpx(text) {
    var xml = new DOMParser().parseFromString(text, "application/xml");
    if (xml.querySelector("parsererror")) throw new Error("GPX parse error");
    return Array.from(xml.querySelectorAll("trkpt, rtept")).map(function(point) {
        return [Number(point.getAttribute("lat")), Number(point.getAttribute("lon"))];
    }).filter(function(point) { return isFinite(point[0]) && isFinite(point[1]); });
}
function loadDurunubiLocalScriptBundle() {
    // file:// cannot fetch the JSON bundle; load the packaged JS only on demand.
    return new Promise(function(resolve, reject) {
        var script = document.createElement("script");
        function finish(error) {
            script.onload = script.onerror = null;
            script.remove();
            if (error) reject(error);
            else resolve(window.GILOA_DURUNUBI_BUNDLE);
        }
        script.src = "./data/durunubi-routes.js";
        script.async = true;
        script.onload = function() {
            var bundle = window.GILOA_DURUNUBI_BUNDLE;
            finish(bundle && Object.keys(bundle.routes || {}).length ? null : new Error("경로 파일에 사용할 좌표가 없습니다"));
        };
        script.onerror = function() { finish(new Error("경로 파일을 불러오지 못했습니다 (data/durunubi-routes.js 배포 확인)")); };
        document.head.appendChild(script);
    });
}
function loadDurunubiLocalBundle() {
    if (window.GILOA_DURUNUBI_BUNDLE && Object.keys(window.GILOA_DURUNUBI_BUNDLE.routes || {}).length) {
        var embedded = window.GILOA_DURUNUBI_BUNDLE;
        var embeddedRoutes = embedded.routes || {};
        var embeddedIds = Object.keys(embeddedRoutes);
        var embeddedPoints = embeddedIds.reduce(function(total, id) { return total + (Array.isArray(embeddedRoutes[id]) ? embeddedRoutes[id].length : 0); }, 0);
        durunubiDiagnostics.courses = (embedded.courses || []).length;
        durunubiDiagnostics.routes = embeddedIds.length;
        durunubiDiagnostics.points = embeddedPoints;
        durunubiDiagnostics.error = "";
        durunubiDiagnostics.stage = "내장 경로 파일 로드됨";
        return Promise.resolve(embedded);
    }
    if (durunubiLocalBundlePromise) return durunubiLocalBundlePromise;
    durunubiDiagnostics.stage = "경로 파일 불러오는 중";
    var load = window.location.protocol === "file:" ? loadDurunubiLocalScriptBundle() : fetch("./data/durunubi-routes.json", { cache:"no-store" }).then(function(response) {
        if (!response.ok) throw new Error("경로 파일 HTTP " + response.status + " (data/durunubi-routes.json 배포 확인)");
        return response.json();
    });
    durunubiLocalBundlePromise = load.then(function(data) {
        var bundle = data || {}, routes = bundle.routes || {}, ids = Object.keys(routes);
        if (!ids.length) throw new Error("경로 파일에 사용할 좌표가 없습니다");
        var points = ids.reduce(function(total, id) { return total + (Array.isArray(routes[id]) ? routes[id].length : 0); }, 0);
        durunubiDiagnostics.courses = (bundle.courses || []).length;
        durunubiDiagnostics.routes = ids.length;
        durunubiDiagnostics.points = points;
        durunubiDiagnostics.error = "";
        return bundle;
    }).catch(function(error) {
        durunubiLocalBundlePromise = null;
        durunubiDiagnostics.stage = "경로 파일 실패";
        durunubiDiagnostics.error = error && error.message ? error.message : String(error);
        throw error;
    });
    return durunubiLocalBundlePromise;
}
function fetchDurunubiGpx(course) {
    var id = course.crsIdx || course.gpxpath;
    if (durunubiGpxCache[id]) return Promise.resolve(durunubiGpxCache[id]);
    if (!course.gpxpath) return Promise.resolve([]);
    return loadDurunubiLocalBundle().then(function(bundle) {
        var routes = bundle.routes || {};
        if (routes[id] && routes[id].length > 1) {
            durunubiGpxCache[id] = routes[id];
            return routes[id];
        }
        return fetch(normalizeTourImageUrl(course.gpxpath), { cache:"force-cache" }).then(function(response) {
            if (!response.ok) throw new Error("GPX HTTP " + response.status);
            return response.text();
        }).then(parseDurunubiGpx).then(function(points) {
            durunubiGpxCache[id] = points;
            return points;
        });
    });
}
function clearDurunubiRoutes() {
    durunubiRequestSeq += 1;
    durunubiLayerGroup.clearLayers();
    completedOfficialLayerGroup.clearLayers();
    renderedOfficialRoutes = [];
    durunubiRouteLayers = [];
    durunubiVisibleBundle = null;
    clearDurunubiCanvas();
    durunubiDiagnostics.drawn = 0;
    durunubiDiagnostics.stage = "꺼짐";
    setDurunubiBadge("");
}
function resizeDurunubiCanvas() {
    if (!durunubiCanvas || !durunubiCanvasContext) return;
    var size = map.getSize();
    var ratio = Math.min(2, window.devicePixelRatio || 1);
    var width = Math.max(1, Math.round(size.x * ratio));
    var height = Math.max(1, Math.round(size.y * ratio));
    if (durunubiCanvas.width !== width || durunubiCanvas.height !== height) {
        durunubiCanvas.width = width;
        durunubiCanvas.height = height;
        durunubiCanvas.style.width = size.x + "px";
        durunubiCanvas.style.height = size.y + "px";
    }
    durunubiCanvasContext.setTransform(ratio, 0, 0, ratio, 0, 0);
}
function clearDurunubiCanvas() {
    if (!durunubiCanvas || !durunubiCanvasContext) return;
    resizeDurunubiCanvas();
    var size = map.getSize();
    durunubiCanvasContext.clearRect(0, 0, size.x, size.y);
    var badge = document.getElementById("durunubi-loaded-badge");
    if (badge) badge.hidden = true;
}
function drawDurunubiCanvas() {
    clearDurunubiCanvas();
    if (!mapLayerSettings.durunubi || !durunubiVisibleBundle || !durunubiCanvasContext) return;
    var routes = durunubiVisibleBundle.routes || {};
    var visibleBounds = map.getBounds().pad(.25);
    var ctx = durunubiCanvasContext;
    var visibleCount = 0;
    Object.keys(routes).forEach(function(routeId) {
        var points = routes[routeId];
        if (!points || points.length < 2 || !L.latLngBounds(points).intersects(visibleBounds)) return;
        visibleCount += 1;
        ctx.beginPath();
        points.forEach(function(latlng, index) {
            var point = map.latLngToContainerPoint(latlng);
            if (index === 0) ctx.moveTo(point.x, point.y); else ctx.lineTo(point.x, point.y);
        });
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = "rgba(17,24,39,.9)";
        ctx.lineWidth = 11;
        ctx.stroke();
        ctx.strokeStyle = "#ffd21f";
        ctx.lineWidth = 6;
        ctx.stroke();
    });
    setDurunubiBadge("");
}
function buildDurunubiPopupHtml(course) {
    var isForestTrail = course.sourceType === "nationalForestTrail";
    var dt = getDurunubiText();
    var level = course.crsLevel ? (({ "1":dt.easy, "2":dt.normal, "3":dt.hard })[String(course.crsLevel)] || dt.difficulty + " " + course.crsLevel) : "";
    var sourceLabel = course.sourceName || (isForestTrail ? dt.forestSource : (course.sourceType ? dt.officialTrailSource : dt.durunubiSource));
    var meta = [course.sigun || "", course.crsDstnc ? course.crsDstnc + "km" : "", course.crsTotlRqrmHour ? durunubiMinutesLabel(course.crsTotlRqrmHour) : "", level].filter(Boolean).join(" · ");
    return "<b>" + escapeHtml(course.crsKorNm || dt.route) + "</b>" + (meta ? "<br><small>" + escapeHtml(meta) + "</small>" : "") + "<p>" + escapeHtml(stripDurunubiHtml(course.crsSummary || course.crsContents)).slice(0, 260) + "</p><small>" + escapeHtml(sourceLabel) + "</small>";
}
function drawDurunubiCourse(course, points) {
    if (points.length < 2) return false;
    var style = OFFICIAL_ROUTE_STYLES[course.sourceType] || OFFICIAL_ROUTE_STYLES.durunubi;
    var casing = L.polyline(points, { renderer:durunubiRenderer, pane:"durunubiPane", color:"#111827", weight:style.weight + 4, opacity:0.28, interactive:false, lineCap:"round", lineJoin:"round" });
    var line = L.polyline(points, { renderer:durunubiRenderer, pane:"durunubiPane", color:style.color, weight:style.weight, opacity:0.4, interactive:true, lineCap:"round", lineJoin:"round" });
    line.bindTooltip(escapeHtml(course.crsKorNm || getDurunubiText().route), { sticky:true, className:"durunubi-route-tooltip" });
    line.on("tooltipopen", function(event) {
        event.tooltip.setContent(escapeHtml(course.crsKorNm || getDurunubiText().route));
        translatePublicPlacePopup(event.tooltip);
    });
    line.bindPopup(buildDurunubiPopupHtml(course));
    line.on("popupopen", function(event) {
        var popup = event.popup;
        function refresh() {
            popup.setContent(buildDurunubiPopupHtml(course));
            translatePublicPlacePopup(popup);
        }
        popup.setContent(buildDurunubiPopupHtml(course));
        trackPublicPlacePopup(popup, refresh);
    });
    durunubiLayerGroup.addLayer(casing);
    durunubiLayerGroup.addLayer(line);
    durunubiRouteLayers.push(casing, line);
    renderedOfficialRoutes.push({ id:String(course.crsIdx || ""), points:points, sourceType:course.sourceType || "durunubi" });
    return true;
}

function projectPointToOfficialSegment(point, a, b) {
    var latScale = 111320;
    var lngScale = Math.max(1, 111320 * Math.cos(point.lat * Math.PI / 180));
    var ax = (a[1] - point.lng) * lngScale, ay = (a[0] - point.lat) * latScale;
    var bx = (b[1] - point.lng) * lngScale, by = (b[0] - point.lat) * latScale;
    var dx = bx - ax, dy = by - ay, lengthSq = dx * dx + dy * dy;
    var t = lengthSq ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / lengthSq)) : 0;
    var x = ax + t * dx, y = ay + t * dy;
    return { distance:Math.sqrt(x * x + y * y), point:[a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t] };
}
function findOfficialRouteMatch(pathPoint) {
    var best = null, threshold = 30;
    for (var r = renderedOfficialRoutes.length - 1; r >= 0; r -= 1) {
        var route = renderedOfficialRoutes[r], points = route.points;
        for (var i = 1; i < points.length; i += 1) {
            var hit = projectPointToOfficialSegment(pathPoint, points[i - 1], points[i]);
            if (hit.distance <= threshold && (!best || hit.distance < best.distance)) best = { id:route.id, distance:hit.distance, point:hit.point };
        }
    }
    return best;
}
function renderCompletedOfficialRoutes() {
    completedOfficialLayerGroup.clearLayers();
    if (!mapLayerSettings.durunubi || renderedOfficialRoutes.length === 0 || pathCoordinates.length < 2) return;
    var matches = pathCoordinates.map(function(point) {
        if (completedOfficialMatchCache.has(point)) return completedOfficialMatchCache.get(point);
        var match = findOfficialRouteMatch(point);
        completedOfficialMatchCache.set(point, match);
        return match;
    }), run = [], runDistance = 0;
    function flushRun() {
        if (runDistance >= 100 && run.length > 1) {
            L.polyline(run, { pane:"durunubiPane", color:"#ffffff", weight:7, opacity:0.92, interactive:false, lineCap:"round", lineJoin:"round" }).addTo(completedOfficialLayerGroup);
        }
        run = []; runDistance = 0;
    }
    for (var i = 0; i < matches.length; i += 1) {
        var match = matches[i];
        if (!match) { flushRun(); continue; }
        if (i > 0 && matches[i - 1] && matches[i - 1].id === match.id) {
            var step = map.distance(L.latLng(matches[i - 1].point[0], matches[i - 1].point[1]), L.latLng(match.point[0], match.point[1]));
            if (step <= 150) { if (!run.length) run.push(matches[i - 1].point); run.push(match.point); runDistance += step; continue; }
        }
        flushRun();
        run = [match.point];
    }
    flushRun();
}
function scheduleCompletedOfficialRouteRefresh() {
    if (completedOfficialRefreshTimer) clearTimeout(completedOfficialRefreshTimer);
    completedOfficialRefreshTimer = setTimeout(function() { completedOfficialRefreshTimer = null; renderCompletedOfficialRoutes(); }, 800);
}
function isDurunubiRouteInViewport(points, bounds) {
    if (!bounds || !points || !points.length) return false;
    for (var i = 0; i < points.length; i++) {
        if (bounds.contains([Number(points[i][0]), Number(points[i][1])])) return true;
    }
    return false;
}
function isDurunubiBoundsInViewport(routeBounds, bounds) {
    if (!routeBounds || routeBounds.length < 4 || !bounds) return true;
    return routeBounds[2] >= bounds.getSouth() && routeBounds[0] <= bounds.getNorth() &&
        routeBounds[3] >= bounds.getWest() && routeBounds[1] <= bounds.getEast();
}
function renderNearbyDurunubiRoutes() {
    if (!durunubiVisibleBundle || !mapLayerSettings.durunubi) return 0;
    durunubiLayerGroup.clearLayers();
    completedOfficialLayerGroup.clearLayers();
    durunubiRouteLayers = [];
    renderedOfficialRoutes = [];
    completedOfficialMatchCache = new WeakMap();
    var courses = durunubiVisibleBundle.courses || [], routes = durunubiVisibleBundle.routes || {}, routeBounds = durunubiVisibleBundle.routeBounds || {}, courseById = {};
    courses.forEach(function(course) { courseById[String(course.crsIdx)] = course; });
    var viewportBounds = map.getBounds().pad(0.15);
    var currentZoom = map.getZoom();
    var drawn = 0;
    var overlapPriority = { fiveSensesTrail:1, ridge9:2, mountain100:3, majorPeak:4 };
    Object.keys(routes).sort(function(a, b) {
        var aCourse = courseById[String(a)] || {}, bCourse = courseById[String(b)] || {};
        return (overlapPriority[aCourse.sourceType] || 0) - (overlapPriority[bCourse.sourceType] || 0);
    }).forEach(function(routeId) {
        if (drawn >= MAP_VIEWPORT_ROUTE_LIMIT) return;
        var course = courseById[String(routeId)] || { crsIdx:routeId, crsKorNm:getDurunubiText().route };
        var routeStyle = OFFICIAL_ROUTE_STYLES[course.sourceType] || OFFICIAL_ROUTE_STYLES.durunubi;
        if (currentZoom < routeStyle.minZoom) return;
        if (!isDurunubiBoundsInViewport(routeBounds[routeId], viewportBounds)) return;
        if (!isDurunubiRouteInViewport(routes[routeId], viewportBounds)) return;
        if (drawDurunubiCourse(course, routes[routeId])) drawn += 1;
    });
    durunubiDiagnostics.drawn = drawn;
    durunubiDiagnostics.stage = drawn ? "주변 경로 표시됨" : "주변 경로 없음";
    setDurunubiBadge("");
    renderCompletedOfficialRoutes();
    return drawn;
}
function refreshDurunubiForMap(force) {
    if (!mapLayerSettings.durunubi) return Promise.resolve(false);
    if (durunubiRouteLayers.length && !force) return Promise.resolve(true);
    var requestSeq = ++durunubiRequestSeq;
    setDurunubiBadge("");
    return loadDurunubiLocalBundle().then(function(bundle) {
        var localCourses = bundle.courses || [];
        if (localCourses.length) return { courses:localCourses, routes:bundle.routes || {}, routeBounds:bundle.routeBounds || {} };
        return fetchDurunubiCourses().then(function(courses) { return { courses:courses || [], routes:bundle.routes || {}, routeBounds:bundle.routeBounds || {} }; });
    }).then(function(values) {
        if (requestSeq !== durunubiRequestSeq || !mapLayerSettings.durunubi) return false;
        var courses = values.courses, localRoutes = values.routes;
        durunubiVisibleBundle = { courses:courses, routes:localRoutes, routeBounds:values.routeBounds || {} };
        clearDurunubiCanvas();
        renderNearbyDurunubiRoutes();
        return true;
    }).catch(function(error) {
        console.warn("Durunubi map routes failed", error);
        durunubiDiagnostics.error = error && error.message ? error.message : String(error);
        setDurunubiBadge(getDurunubiText().failed, "error");
        return false;
    });
}
function focusNearestDurunubiRoute() {
    if (!durunubiVisibleBundle) { alert(describeDurunubiState()); return; }
    var center = map.getCenter(), best = null, bestDistance = Infinity;
    Object.keys(durunubiVisibleBundle.routes || {}).forEach(function(id) {
        var track = durunubiVisibleBundle.routes[id];
        if (!track || !track.length) return;
        var point = track[Math.floor(track.length / 2)];
        var distance = map.distance(center, L.latLng(point[0], point[1]));
        if (distance < bestDistance) { bestDistance = distance; best = track; }
    });
    if (best) map.fitBounds(L.latLngBounds(best), { padding:[40, 40] });
}
(function bindDurunubiBadge() {
    var badge = document.getElementById("durunubi-loaded-badge");
    if (!badge) return;
    badge.addEventListener("click", function() {
        if (durunubiDiagnostics.error) alert(describeDurunubiState());
        else focusNearestDurunubiRoute();
    });
})();
if (mapLayerSettings.durunubi) refreshDurunubiForMap(true);
function scheduleDurunubiViewportRefresh() {
    if (!mapLayerSettings.durunubi || !durunubiVisibleBundle) return;
    if (durunubiRefreshTimer) clearTimeout(durunubiRefreshTimer);
    durunubiRefreshTimer = setTimeout(function() {
        durunubiRefreshTimer = null;
        renderNearbyDurunubiRoutes();
    }, 180);
}
map.on("moveend zoomend", scheduleDurunubiViewportRefresh);

// VARCO 踰덉뿭
var VARCO_API_KEY = window.GILOA_VARCO_API_KEY || "";
var VARCO_TRANSLATE_URL = "https://api.varco.ai/mt/chat-content/v1/translate";

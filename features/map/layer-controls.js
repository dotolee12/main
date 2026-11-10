function getTourSearchDistance(centerA, centerB) {
    if (!centerA || !centerB) return Infinity;
    return L.latLng(centerA.lat, centerA.lng).distanceTo(L.latLng(centerB.lat, centerB.lng));
}
function shouldRefreshTourData(center, lang, radius) {
    var state = tourSearchStateByLang[lang];
    if (!state || !state.center || !state.lastFetchedAt) return true;
    // Never keep a transient empty response as a fresh result for 15 minutes.
    if (state.itemCount === 0) return true;
    if (getTourSearchDistance(center, state.center) >= TOUR_SEARCH_MOVE_M) return true;
    if (radius > (state.radius || MAP_LAYER_RADIUS_M) * 1.12) return true;
    return Date.now() - state.lastFetchedAt >= TOUR_REVALIDATE_MS;
}
function refreshTourData(options) {
    options = options || {};
    var lang = currentLang || "ko";
    hydrateTourItemsFromCache(lang, !!options.forceHydrate);
    // The Android app runs from file:///android_asset. Its WebView explicitly
    // allows HTTPS requests from file URLs, and TourAPI accepts the null origin.
    // Do not stop the core tourism refresh solely because the page is local.
    if (tourRefreshPromiseByLang[lang]) return tourRefreshPromiseByLang[lang];
    var center = getMapSearchCenter();
    var radius = getMapSearchRadius();
    var areaCache = !options.force && readTourAreaCache("spots", center, lang, radius);
    if (areaCache && tourItems !== areaCache.items) applyTourAreaCache(areaCache, lang);
    if (!options.force && !shouldRefreshTourData(center, lang, radius)) {
        updateTourSummary();
        renderTourCards();
        return fetchFestivals({ center:center, radius:radius }).then(function() { return false; }).catch(function() { return false; });
    }
    var requestCenter = { lat: center.lat, lng: center.lng };
    setTourRefreshing(true);
    var spotsPromise = fetchTourSpots({ center: requestCenter, radius:radius, keepExisting: true }).then(function(hasFreshItems) {
        tourSearchStateByLang[lang] = { center: requestCenter, radius:radius, lastFetchedAt: Date.now(), itemCount: hasFreshItems ? tourItems.length : 0 };
        return !!hasFreshItems;
    }).catch(function() { return false; });
    var festivalsPromise = fetchFestivals({ center: requestCenter, radius:radius, keepExisting: true, force:options.force }).then(function() {
        return true;
    }).catch(function() { return false; });
    var refreshPromise = Promise.all([spotsPromise, festivalsPromise]).then(function(results) {
        return results[0];
    }).finally(function() {
        if (tourRefreshPromiseByLang[lang] === refreshPromise) delete tourRefreshPromiseByLang[lang];
        if (lang === currentLang) setTourRefreshing(false);
        var latestCenter = getMapSearchCenter();
        var latestRadius = getMapSearchRadius();
        if (lang === currentLang && (getTourSearchDistance(latestCenter, requestCenter) >= TOUR_SEARCH_MOVE_M || latestRadius > radius * 1.12)) {
            scheduleTourFetch({ immediate: true });
        }
    });
    tourRefreshPromiseByLang[lang] = refreshPromise;
    return refreshPromise;
}
function scheduleTourFetch(options) {
    options = options || {};
    if (tourFetchTimer) clearTimeout(tourFetchTimer);
    tourFetchTimer = setTimeout(function() {
        tourFetchTimer = null;
        hydrateTourItemsFromCache(currentLang || "ko");
        refreshTourData();
    }, options.immediate === true ? 0 : 350);
}
map.on("moveend", scheduleTourFetch);
map.on("moveend", refreshMapCenteredLayerMarkers);
function closeMapTransientPanels() {
    var sidebar = document.getElementById("sidebar");
    if (sidebar && sidebar.classList.contains("open")) toggleSidebar(false);
    if (isHudExpanded) toggleHud();
    if (dailyTaskPanelOpen) toggleDailyTasks(false);
    if (tourPanelOpen) collapseTourPanel();
    var dialogue = document.getElementById("gilo-dialogue-layer");
    if (dialogue && dialogue.classList.contains("is-open")) hideGiloDialogue();
    var help = document.getElementById("help-popup");
    if (help && help.classList.contains("show")) help.classList.remove("show");
    var photoMenu = document.getElementById("photo-menu");
    if (photoMenu && photoMenu.classList.contains("open")) closePhotoMenu();
    closeSpecialPlacePopup();
}

function bindOutsidePanelDismissals() {
    if (document.documentElement.dataset.outsidePanelDismissBound === "1") return;
    document.documentElement.dataset.outsidePanelDismissBound = "1";
    document.addEventListener("click", function(event) {
        var target = event.target;
        var dailyPanel = document.getElementById("daily-task-panel");
        var dailyTag = document.getElementById("daily-task-tag");
        if (dailyTaskPanelOpen && dailyPanel && !dailyPanel.contains(target) && (!dailyTag || !dailyTag.contains(target))) toggleDailyTasks(false);

        var tourPanel = document.getElementById("tour-panel");
        if (tourPanelOpen && tourPanel && !tourPanel.contains(target)) collapseTourPanel();

        var dialogue = document.getElementById("gilo-dialogue-layer");
        var dialogueBox = document.getElementById("gilo-dialogue-box");
        if (dialogue && dialogue.classList.contains("is-open") && dialogueBox && !dialogueBox.contains(target)) hideGiloDialogue();

        var help = document.getElementById("help-popup");
        var helpBox = document.getElementById("help-content-box");
        var helpButton = document.getElementById("help-btn");
        if (help && help.classList.contains("show") && helpBox && !helpBox.contains(target) && (!helpButton || !helpButton.contains(target))) help.classList.remove("show");

        var photoMenu = document.getElementById("photo-menu");
        var photoButton = document.getElementById("photo-btn");
        if (photoMenu && photoMenu.classList.contains("open") && !photoMenu.contains(target) && (!photoButton || !photoButton.contains(target))) closePhotoMenu();
    });
}

bindOutsidePanelDismissals();
map.on("click", closeMapTransientPanels);
scheduleTourFetch({ immediate: true });
if (mapLayerSettings.library) fetchLibraries();

// 吏???쒖떆 ?덉씠???좉? (?ъ씠?쒕컮 "吏???쒖떆" ?⑤꼸)
function toggleMapLayerPanel() {
    var panel = document.getElementById("map-layer-panel");
    var caret = document.getElementById("map-layer-caret");
    if (!panel) return;
    panel.classList.toggle("expanded");
    if (caret) caret.classList.toggle("open");
}
// Sidebar grouping only: the existing per-layer settings and actions remain authoritative.
var MAP_LAYER_GROUPS = {
    discovery: ["tourism"],
    food: ["restaurant", "shopping"],
    convenience: ["restroom", "parking", "library", "lodging", "community"],
    activity: ["durunubi", "fishing"]
};
var MAP_LAYER_MENU_ICONS = {
    discovery: '<path d="M3 9l9-6 9 6H3zm2 3v7m5-7v7m4-7v7m5-7v7M3 21h18"/>',
    food: '<path d="M3 12h18M5 12v3a5 5 0 0 0 5 5h4a5 5 0 0 0 5-5v-3M3 15h2m14 0h2M6 12a6 6 0 0 1 12 0M10 6V4h4v2"/>',
    coffee: '<path d="M4 8h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Zm13 1h2a2.5 2.5 0 0 1 0 5h-2M3 21h17M8 5V3m5 2V3"/>',
    convenience: '<path d="M4 10v10h16V10M3 10l2-6h14l2 6M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M9 4l-1 6m7-6 1 6m-6 10v-6h4v6"/>',
    fastFood: '<path d="M2 18h20l-2 3H4l-2-3Zm2-4h10m-9-2a4 4 0 0 1 8 0H5Zm0 4h8m3-9h6l-1 9h-4l-1-9Zm1 0 1-3h3"/>',
    convenience: '<rect x="4" y="5" width="16" height="16" rx="3"/><path d="M9 5V3h6v2m-3 5v6m-3-3h6"/>',
    activity: '<path d="M3 20l6-12 4 7 3-5 5 10H3zM16 3v3m-2-1h4"/>',
    restroom: '<circle cx="7" cy="5" r="2"/><circle cx="17" cy="5" r="2"/><path d="M4 10h6v6H4zm2 6v5m3-5v5m8-11l-4 7h8l-4-7zm-1 7v4m3-4v4"/>',
    parking: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 18V7h4a3 3 0 010 6H9"/>',
    library: '<path d="M12 6C8 3 5 4 3 5v15c3-2 6-1 9 1 3-2 6-3 9-1V5c-2-1-5-2-9 1zm0 0v15"/>',
    shopping: '<path d="M5 7h14l-1 14H6L5 7zm3 0a4 4 0 018 0M9 12h.01M15 12h.01"/>',
    lodging: '<path d="M3 21V4m0 12h18v5m-18-9h18v4M7 12V8h5v4m0 0V8h6v4"/>',
    fishing: '<path d="M4 21L15 3h5v10a3 3 0 01-6 0m0 0v-2"/>',
    community: '<path d="M3 10l9-7 9 7v11H3V10zm6 11v-7h6v7"/>'
};
var MAP_LAYER_TILE_KEYS = ["hospital", "pharmacy", "tourism", "restaurant", "shopping", "restroom", "parking", "library", "lodging", "durunubi", "fishing", "community"];
var mapLayerOrderEditing = false;
function loadMapLayerTileOrder() {
    var known = [];
    try {
        var saved = JSON.parse(localStorage.getItem(MAP_LAYER_ORDER_KEY) || "[]");
        if (Array.isArray(saved)) saved.forEach(function(key) {
            if (MAP_LAYER_TILE_KEYS.indexOf(key) >= 0 && known.indexOf(key) < 0) known.push(key);
        });
    } catch (e) {}
    MAP_LAYER_TILE_KEYS.forEach(function(key) { if (known.indexOf(key) < 0) known.push(key); });
    return known;
}
function getMapLayerOrderText() {
    var texts = {
        ko:["편집", "완료", "위로 이동", "아래로 이동", "순서를 저장하지 못했습니다. 저장 공간을 확인하고 다시 시도해 주세요."],
        en:["Edit", "Done", "Move up", "Move down", "Could not save the order. Check storage and try again."],
        ja:["編集", "完了", "上へ移動", "下へ移動", "順序を保存できませんでした。保存領域を確認して再試行してください。"],
        zh:["编辑", "完成", "上移", "下移", "无法保存顺序。请检查存储空间后重试。"],
        es:["Editar", "Listo", "Subir", "Bajar", "No se pudo guardar el orden. Comprueba el almacenamiento e inténtalo de nuevo."],
        fr:["Modifier", "Terminé", "Monter", "Descendre", "Impossible d’enregistrer l’ordre. Vérifiez le stockage et réessayez."]
    };
    return texts[normalizeLang(currentLang)] || texts.en;
}
function renderMapLayerTileOrder() {
    var panel = document.getElementById("map-layer-panel");
    if (!panel) return;
    var order = loadMapLayerTileOrder(), text = getMapLayerOrderText();
    order.forEach(function(key, index) {
        var toggle = document.getElementById("layer-toggle-" + key);
        var row = toggle && toggle.closest(".map-layer-item");
        if (!row) return;
        panel.appendChild(row);
        var controls = row.querySelector(".map-layer-order-controls");
        if (!controls) {
            controls = document.createElement("span");
            controls.className = "map-layer-order-controls";
            [-1, 1].forEach(function(direction) {
                var button = document.createElement("button");
                button.type = "button";
                button.textContent = direction < 0 ? "↑" : "↓";
                button.addEventListener("click", function(event) {
                    event.stopPropagation();
                    moveMapLayerTile(key, direction);
                });
                // Keep Enter/Space away from the tile's layer-toggle handler.
                button.addEventListener("keydown", function(event) { event.stopPropagation(); });
                controls.appendChild(button);
            });
            row.appendChild(controls);
        }
        syncMapLayerItemUI(key);
        if (mapLayerOrderEditing) {
            row.setAttribute("role", "group");
            row.removeAttribute("aria-disabled");
            row.removeAttribute("aria-pressed");
            row.setAttribute("tabindex", "-1");
        }
        controls.hidden = !mapLayerOrderEditing;
        var name = row.querySelector(".map-layer-name");
        [0, 1].forEach(function(i) {
            controls.children[i].setAttribute("aria-label", (name ? name.textContent + ": " : "") + text[i + 2]);
            controls.children[i].disabled = i === 0 ? index === 0 : index === order.length - 1;
        });
    });
    panel.classList.toggle("is-order-editing", mapLayerOrderEditing);
    var edit = document.getElementById("map-layer-order-edit");
    if (edit) {
        edit.textContent = text[mapLayerOrderEditing ? 1 : 0];
        edit.setAttribute("aria-pressed", String(mapLayerOrderEditing));
    }
}
function moveMapLayerTile(key, direction) {
    if (direction !== -1 && direction !== 1) return;
    var order = loadMapLayerTileOrder(), index = order.indexOf(key), next = index + direction;
    if (index < 0 || next < 0 || next >= order.length) return;
    order[index] = order[next]; order[next] = key;
    try { localStorage.setItem(MAP_LAYER_ORDER_KEY, JSON.stringify(order)); }
    catch (e) { window.alert(getMapLayerOrderText()[4]); return; }
    renderMapLayerTileOrder();
    var toggle = document.getElementById("layer-toggle-" + key);
    var row = toggle && toggle.closest(".map-layer-item");
    var button = row && row.querySelectorAll(".map-layer-order-controls button")[direction < 0 ? 0 : 1];
    if (button && !button.disabled) button.focus();
}
function toggleMapLayerOrderEdit() {
    mapLayerOrderEditing = !mapLayerOrderEditing;
    var panel = document.getElementById("map-layer-panel"), caret = document.getElementById("map-layer-caret");
    if (mapLayerOrderEditing && panel) { panel.classList.add("expanded"); if (caret) caret.classList.add("open"); }
    renderMapLayerTileOrder();
}
window.toggleMapLayerOrderEdit = toggleMapLayerOrderEdit;
// Optional modules call this after inserting their dynamic tiles.
window.refreshMapLayerTileOrder = renderMapLayerTileOrder;
// Visual symbols share the sidebar artwork; data, popups and recording are unchanged.
function mapPlaceSymbolHtml(key, classes, likeKey, color) {
    var row = document.getElementById("layer-toggle-" + key);
    var parent = row && row.closest(".map-layer-item");
    var icon = parent && parent.querySelector(".map-layer-menu-icon");
    var artwork = icon && icon.querySelector("svg");
    var svg = artwork ? artwork.outerHTML : mapLayerMenuIcon(key);
    return '<span class="map-place-symbol ' + escapeHtml(classes || "") + '" data-place-like-key="' + escapeHtml(likeKey || "") + '" style="--tour-color:' + escapeHtml(color || "#86daff") + '">' + svg + '<span class="place-liked-star">★</span></span>';
}
function mapLayerMenuIcon(key) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (MAP_LAYER_MENU_ICONS[key] || MAP_LAYER_MENU_ICONS.discovery) + '</svg>';
}
function getMapLayerGroupKeys(group) {
    return (MAP_LAYER_GROUPS[group] || []).filter(function(key) {
        return Object.prototype.hasOwnProperty.call(mapLayerSettings, key) && !MAP_LAYER_UNAVAILABLE[key];
    });
}
function getMapLayerGroupState(group) {
    var keys = getMapLayerGroupKeys(group);
    var count = keys.filter(function(key) { return !!mapLayerSettings[key]; }).length;
    return count === 0 ? "off" : count === keys.length ? "on" : "mixed";
}
function toggleMapLayerGroup(group) {
    var turnOn = getMapLayerGroupState(group) !== "on";
    getMapLayerGroupKeys(group).forEach(function(key) {
        if (!!mapLayerSettings[key] !== turnOn) toggleMapLayer(key);
    });
    syncMapLayerGroupUI();
}
function syncMapLayerGroupUI() {
    if (!UI_TEXT) return;
    var text = UI_TEXT[currentLang] || UI_TEXT.ko;
    Object.keys(MAP_LAYER_GROUPS).forEach(function(group) {
        var card = document.getElementById("map-layer-group-" + group);
        if (!card) return;
        var state = getMapLayerGroupState(group);
        var name = text["map_group_" + group];
        card.dataset.state = state;
        card.querySelector(".map-layer-group-name").textContent = name;
        card.querySelector(".map-layer-group-state").textContent = text["map_group_" + state];
        card.querySelector(".map-layer-group-toggle").setAttribute("aria-checked", state === "mixed" ? "mixed" : String(state === "on"));
        card.querySelector(".map-layer-group-expand").setAttribute("aria-label", name);
    });
}
function syncMapLayerItemUI(key) {
    var toggle = document.getElementById("layer-toggle-" + key);
    var row = toggle && toggle.closest(".map-layer-item");
    if (!row) return;
    var unavailable = row.classList.contains("unavailable") || !!MAP_LAYER_UNAVAILABLE[key];
    row.setAttribute("role", "button");
    row.setAttribute("tabindex", unavailable ? "-1" : "0");
    row.setAttribute("aria-disabled", String(unavailable));
    row.setAttribute("aria-pressed", String(!unavailable && !!mapLayerSettings[key]));
    var source = row.querySelector(".map-layer-source");
    if (source) row.title = source.textContent;
    if (!row.dataset.keyboardBound) {
        row.dataset.keyboardBound = "true";
        row.addEventListener("keydown", function(event) {
            if (event.target !== row) return;
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                if (row.getAttribute("aria-disabled") !== "true") row.click();
            }
        });
    }
}
function initMapLayerGroups() {
    var panel = document.getElementById("map-layer-panel");
    if (!panel) return;
    if (panel.dataset.grouped === "true") { renderMapLayerTileOrder(); return; }
    panel.dataset.grouped = "true";
    panel.classList.add("map-layer-icon-grid");
    var keys = MAP_LAYER_TILE_KEYS;
    keys.forEach(function(key) {
        var toggle = document.getElementById("layer-toggle-" + key);
        var row = toggle && toggle.closest(".map-layer-item");
        if (!row) return;
        var dot = row.querySelector(".map-layer-dot");
        if (dot) {
            dot.className = "map-layer-menu-icon";
            dot.innerHTML = mapLayerMenuIcon(key === "tourism" ? "discovery" : key === "restaurant" ? "food" : key === "durunubi" ? "activity" : key);
        }
        panel.appendChild(row);
        syncMapLayerItemUI(key);
    });
    renderMapLayerTileOrder();
}
function syncMapLayerToggleUI(key) {
    var sw = document.getElementById("layer-toggle-" + key);
    if (!sw) return;
    var on = !!mapLayerSettings[key];
    sw.classList.toggle("on", on);
    sw.classList.toggle("off", !on);
    syncMapLayerItemUI(key);
    syncMapLayerGroupUI();
}
function applyMapLayerChange(key) {
    var gpsBefore = captureGpsIntegrity();
    logGpsLayerChange("BEFORE layer-" + key, gpsBefore);
    if (key === "tourism") {
        addTourMarkers();
        if (mapLayerSettings.tourism) refreshTourData();
    } else if (key === "library") {
        if (mapLayerSettings.library) {
            if (librariesLoaded) { renderLibraryMarkers(); translateLibraryItemsForLang(currentLang); }
            else fetchLibraries();
        } else {
            clearLibraryMarkers();
        }
    } else if (key === "restroom") {
        if (mapLayerSettings.restroom) {
            fetchRestroomsForCurrentArea();
        } else {
            restroomSearchSeq += 1;
            if (restroomAbortController) restroomAbortController.abort();
            restroomAbortController = null;
            restroomSearchPromise = null;
            restroomSearchKey = "";
            clearRestroomMarkers();
            restroomGuFetched = {}; // ?ㅼ떆 耳곗쓣 ???꾩옱 蹂댁씠??援щ? ?ы룊媛?섎룄濡?珥덇린??(吏?ㅼ퐫??罹먯떆???좎??섏뼱 ?ы샇異쒖? ????
        }
    } else if (key === "parking") {
        if (mapLayerSettings.parking) refreshParkingForMap();
        else { parkingRequestSeq += 1; clearParkingMarkers(); }
    } else if (key === "fishing") {
        if (mapLayerSettings.fishing) refreshFishingForMap();
        else { fishingRequestSeq += 1; clearFishingMarkers(); }
    } else if (key === "restaurant" || key === "shopping" || key === "lodging") {
        addTourMarkers();
        if (mapLayerSettings[key]) refreshTourData();
    } else if (key === "durunubi") {
        if (mapLayerSettings.durunubi) refreshDurunubiForMap(true);
        else clearDurunubiRoutes();
    }
    // community: ?꾩쭅 ?곌껐???곗씠???뚯뒪媛 ?놁뼱 ?곹깭留???ν빀?덈떎 (以鍮?以?.
    refreshGpsVisualsAfterPlaceLayerChange("layer-" + key, gpsBefore);
}
function toggleMapLayer(key) {
    if (MAP_LAYER_UNAVAILABLE[key]) return;
    mapLayerSettings[key] = !mapLayerSettings[key];
    if (key === "shopping") mapLayerSettings.localshops = mapLayerSettings.shopping;
    saveMapLayerSettings();
    syncMapLayerToggleUI(key);
    applyMapLayerChange(key);
    if (key === "shopping") window.dispatchEvent(new CustomEvent("giloa:shopping-layer-change"));
}
function fetchRestroomsFromKakaoForCurrentArea(center, radius, requestSeq) {
    if (!mapLayerSettings.restroom || navigator.onLine === false) return Promise.resolve([]);
    center = center || getMapSearchCenter();
    radius = radius || getMapSearchRadius();
    return loadKakaoTrafficSdk().then(function() {
        if (requestSeq !== restroomSearchSeq || !mapLayerSettings.restroom) return [];
        if (!window.kakao.maps.services || !window.kakao.maps.services.Places) return [];
        return new Promise(function(resolve) {
            var settled = false;
            var timer = setTimeout(function() { finish([]); }, RESTROOM_PROVIDER_TIMEOUT_MS);
            function finish(items) {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                resolve(items || []);
            }
            try {
                var places = new window.kakao.maps.services.Places();
                places.keywordSearch("화장실", function(results, status) {
                    if (requestSeq !== restroomSearchSeq || !mapLayerSettings.restroom) { finish([]); return; }
                    if (status !== window.kakao.maps.services.Status.OK) { finish([]); return; }
                    var items = (results || []).map(function(place) {
                        return normalizeRestroomItem({
                            id: place.id,
                            name: place.place_name,
                            addr: place.road_address_name || place.address_name,
                            tel: place.phone,
                            lat: place.y,
                            lng: place.x
                        }, "kakao");
                    }).filter(Boolean);
                    finish(filterRestroomItemsForArea(items, center, radius));
                }, {
                    location: new window.kakao.maps.LatLng(center.lat, center.lng),
                    radius: radius,
                    size: 15,
                    sort: window.kakao.maps.services.SortBy.DISTANCE
                });
            } catch (_) { finish([]); }
        });
    }).catch(function() { return []; });
}
function fetchRestroomsFromOsm(center, radius, options) {
    options = options || {};
    var cached = readRestroomAreaCache(center, radius);
    if (cached && cached.fresh && !options.force) return Promise.resolve(cached.items);
    if (navigator.onLine === false) return Promise.reject(new Error("Device is offline"));
    var queryRadius = Math.max(300, Math.min(10000, Math.round(radius)));
    var query = '[out:json][timeout:7];nwr["amenity"="toilets"](around:' + queryRadius + ',' + center.lat.toFixed(6) + ',' + center.lng.toFixed(6) + ');out center tags 100;';
    return new Promise(function(resolve, reject) {
        var settled = false;
        var failures = 0;
        var secondTimer = null;
        function finish(error, data) {
            if (settled) return;
            if (error) {
                failures += 1;
                if (failures < RESTROOM_OSM_ENDPOINTS.length) return;
            }
            settled = true;
            if (secondTimer !== null) clearTimeout(secondTimer);
            error ? reject(error) : resolve(data);
        }
        function startProvider(index) {
            var url = RESTROOM_OSM_ENDPOINTS[index] + "?data=" + encodeURIComponent(query);
            requestJsonOnce(url, { timeoutMs: RESTROOM_PROVIDER_TIMEOUT_MS, signal: options.signal }).then(function(data) {
                finish(null, data);
            }).catch(function(error) { finish(error); });
        }
        startProvider(0);
        secondTimer = setTimeout(function() { startProvider(1); }, 650);
    }).then(function(data) {
        var items = (data && Array.isArray(data.elements) ? data.elements : []).map(function(element) {
            var tags = element.tags || {};
            return normalizeRestroomItem({
                id: element.type + "|" + element.id,
                name: tags.name || tags["name:ko"] || getRestroomLabel(),
                addr: [tags["addr:city"], tags["addr:district"], tags["addr:street"], tags["addr:housenumber"]].filter(Boolean).join(" "),
                tel: tags.phone || tags["contact:phone"] || "",
                hours: tags.opening_hours || "",
                openType: tags.access === "customers" ? "고객 이용" : (tags.fee === "yes" ? "유료" : "공중화장실"),
                lat: isFinite(element.lat) ? Number(element.lat) : Number(element.center && element.center.lat),
                lng: isFinite(element.lon) ? Number(element.lon) : Number(element.center && element.center.lon)
            }, "osm");
        }).filter(Boolean);
        items = filterRestroomItemsForArea(items, center, radius);
        if (items.length) writeRestroomAreaCache(center, radius, items);
        return items;
    });
}
function fetchRestroomsForCurrentArea(options) {
    options = options || {};
    if (!mapLayerSettings.restroom) return Promise.resolve(false);
    var center = getMapSearchCenter();
    var radius = getMapSearchRadius();
    var areaKey = getRestroomAreaCacheKey(center, radius);
    if (!options.force && restroomSearchPromise && restroomSearchKey === areaKey) return restroomSearchPromise;

    restroomSearchSeq += 1;
    var requestSeq = restroomSearchSeq;
    if (restroomAbortController) restroomAbortController.abort();
    var controller = typeof AbortController === "function" ? new AbortController() : null;
    restroomAbortController = controller;
    var cached = readRestroomAreaCache(center, radius);
    if (cached && cached.items.length) {
        restroomVisibleItems = cached.items;
        renderRestroomMarkers();
    }

    function applyItems(items) {
        if (requestSeq !== restroomSearchSeq || !mapLayerSettings.restroom) return false;
        var visible = filterRestroomItemsForArea(items, center, radius);
        if (!visible.length) return false;
        restroomVisibleItems = visible;
        writeRestroomAreaCache(center, radius, visible);
        renderRestroomMarkers();
        return true;
    }
    function refreshSeoulInBackground() {
        return fetchSeoulRestroomData({ force: !!options.force }).then(function(items) { return applyItems(items); });
    }
    function fetchOnlineFallbacks() {
        if (navigator.onLine === false) return Promise.resolve(!!(cached && cached.items.length));
        // Start both providers together so slow OSM requests never delay Kakao markers.
        var kakaoResult = fetchRestroomsFromKakaoForCurrentArea(center, radius, requestSeq).then(applyItems).catch(function(){return false;});
        var osmResult = fetchRestroomsFromOsm(center, radius, { force: !!options.force, signal: controller && controller.signal }).then(applyItems).catch(function(){return false;});
        return Promise.all([kakaoResult,osmResult]).then(function(results){return results.some(Boolean);});
    }

    var isSeoul = isLikelySeoulArea(center);
    var work = (isSeoul ? fetchRestroomsFromLocalDataForCurrentArea(center, radius, requestSeq) : Promise.resolve([])).then(function(localItems) {
        var hasLocal = applyItems(localItems);
        if (hasLocal) {
            refreshSeoulInBackground();
            return true;
        }
        if (cached && cached.fresh && cached.items.length && !options.force) return true;
        if (isSeoul) return refreshSeoulInBackground().then(function(hasFresh) { return hasFresh || fetchOnlineFallbacks(); });
        return fetchOnlineFallbacks();
    }).catch(function() {
        return !!(cached && cached.items.length);
    }).finally(function() {
        if (restroomSearchPromise === work) {
            restroomSearchPromise = null;
            restroomSearchKey = "";
        }
        if (restroomAbortController === controller) restroomAbortController = null;
    });
    restroomSearchKey = areaKey;
    restroomSearchPromise = work;
    return work;
}
function refreshMapCenteredLayerMarkers() {
    if (mapLayerSettings.library && librariesLoaded) renderLibraryMarkers(currentLang);
    if (mapLayerSettings.restroom) {
        renderRestroomMarkers();
    }
    if (mapLayerSettings.parking) refreshParkingForMap();
    if (mapLayerSettings.fishing) refreshFishingForMap();
    updateFestivalBadge();
    renderTourCards();
}
function initMapLayerUI() {
    Object.keys(MAP_LAYER_DEFAULTS).forEach(function(key) { syncMapLayerToggleUI(key); });
    if (mapLayerSettings.parking) refreshParkingForMap();
    if (mapLayerSettings.fishing) refreshFishingForMap();
    addTourMarkers();
}
initMapLayerUI();

// Korea Tourism Organization Durunubi routes, drawn automatically below fog.

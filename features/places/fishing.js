function getFishingText() {
    var all = {
        ko:{ label:"낚시터", address:"주소", type:"유형", species:"주요어종", capacity:"최대수용인원", fee:"이용요금", area:"수면적", phone:"전화번호", people:"명" },
        en:{ label:"Fishing spot", address:"Address", type:"Type", species:"Main species", capacity:"Maximum capacity", fee:"Fee", area:"Surface area", phone:"Phone", people:" people" },
        ja:{ label:"釣り場", address:"住所", type:"種類", species:"主な魚種", capacity:"最大収容人数", fee:"利用料金", area:"水面積", phone:"電話番号", people:"名" },
        zh:{ label:"钓鱼场", address:"地址", type:"类型", species:"主要鱼种", capacity:"最大容纳人数", fee:"使用费", area:"水面面积", phone:"电话", people:"人" },
        es:{ label:"Zona de pesca", address:"Dirección", type:"Tipo", species:"Especies principales", capacity:"Aforo máximo", fee:"Tarifa", area:"Superficie acuática", phone:"Teléfono", people:" personas" },
        fr:{ label:"Site de pêche", address:"Adresse", type:"Type", species:"Espèces principales", capacity:"Capacité maximale", fee:"Tarif", area:"Surface d'eau", phone:"Téléphone", people:" personnes" }
    };
    return all[normalizeLang(currentLang)] || all.ko;
}
function normalizeFishingFieldName(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9가-힣]/g, "");
}
function firstFishingField(record, aliases) {
    if (!record || typeof record !== "object") return "";
    for (var i = 0; i < aliases.length; i += 1) {
        if (record[aliases[i]] !== undefined && record[aliases[i]] !== null && record[aliases[i]] !== "") return record[aliases[i]];
    }
    var wanted = aliases.map(normalizeFishingFieldName);
    var keys = Object.keys(record);
    for (var k = 0; k < keys.length; k += 1) {
        if (wanted.indexOf(normalizeFishingFieldName(keys[k])) >= 0 && record[keys[k]] !== "") return record[keys[k]];
    }
    return "";
}
function extractFishingRows(data) {
    var candidates = [
        data && data.response && data.response.body && data.response.body.items && data.response.body.items.item,
        data && data.response && data.response.body && data.response.body.items,
        data && data.body && data.body.items && data.body.items.item,
        data && data.body && data.body.items,
        data && data.fishing_spot_info && data.fishing_spot_info.row,
        data && data.fishingSpotInfo && data.fishingSpotInfo.row,
        data && data.items && data.items.item,
        data && data.items,
        data && data.row
    ];
    for (var i = 0; i < candidates.length; i += 1) {
        if (Array.isArray(candidates[i])) return candidates[i];
        if (candidates[i] && typeof candidates[i] === "object") return [candidates[i]];
    }
    var servicePayload = data && (data.fishing_spot_info || data.fishingSpotInfo);
    if (Array.isArray(servicePayload)) {
        for (var p = 0; p < servicePayload.length; p += 1) {
            if (servicePayload[p] && Array.isArray(servicePayload[p].row)) return servicePayload[p].row;
        }
    }
    return [];
}
function extractFishingTotal(data, fallback) {
    var body = data && data.response && data.response.body ? data.response.body : (data && data.body ? data.body : data);
    var total = Number(body && (body.totalCount || body.total || body.totalCnt));
    if (isFinite(total) && total > 0) return total;
    var servicePayload = data && (data.fishing_spot_info || data.fishingSpotInfo);
    if (Array.isArray(servicePayload) && servicePayload[0] && Array.isArray(servicePayload[0].head)) {
        for (var h = 0; h < servicePayload[0].head.length; h += 1) {
            total = Number(servicePayload[0].head[h] && (servicePayload[0].head[h].list_total_count || servicePayload[0].head[h].totalCount));
            if (isFinite(total) && total > 0) return total;
        }
    }
    return fallback;
}
function normalizeFishingItem(record) {
    var lat = Number(firstFishingField(record, ["위도", "latitude", "lat", "LAT", "REFINE_WGS84_LAT", "WGS84_LAT"]));
    var lng = Number(firstFishingField(record, ["경도", "longitude", "lng", "lon", "LON", "LOT", "REFINE_WGS84_LOGT", "WGS84_LON", "WGS84_LOT"]));
    if (!isFinite(lat) || !isFinite(lng) || lat < 30 || lat > 40 || lng < 120 || lng > 132) return null;
    var roadAddress = firstFishingField(record, ["소재지도로명주소", "도로명주소", "roadNameAddress", "roadAddress", "RDNMADR", "ROAD_NM_ADDR", "LCTN_ROAD_NM_ADDR"]);
    var lotAddress = firstFishingField(record, ["소재지지번주소", "지번주소", "lotNumberAddress", "address", "LNMADR", "LOTNO_ADDR", "LCTN_LOTNO_ADDR"]);
    return {
        name:String(firstFishingField(record, ["낚시터명", "fishingSpotName", "FISHING_SPOT_NAME", "FSHLC_NM", "FSHNGSPT_NM", "fcltyNm", "name"]) || ""),
        address:String(roadAddress || lotAddress || ""),
        type:String(firstFishingField(record, ["낚시터유형", "fishingSpotType", "FISHING_SPOT_TYPE", "FSHLC_TYPE", "FSHNGSPT_TYPE", "type"]) || ""),
        species:String(firstFishingField(record, ["주요어종", "mainFishSpecies", "MAIN_FISH_SPECIES", "MAJOR_FISH", "MAIN_FSHSPC", "fishSpecies"]) || ""),
        capacity:String(firstFishingField(record, ["최대수용인원", "maximumCapacity", "MAXIMUM_CAPACITY", "MAX_CAPACITY", "MAX_ACTC_PERNE"]) || ""),
        fee:String(firstFishingField(record, ["이용요금", "usageFee", "USE_FEE", "FEE", "UTZTN_CRG"]) || ""),
        area:String(firstFishingField(record, ["수면적", "waterArea", "WATER_AREA", "SURFACE_AREA", "WTRAREA"]) || ""),
        phone:String(firstFishingField(record, ["낚시터전화번호", "fishingSpotPhoneNumber", "PHONE_NUMBER", "FSHLC_TELNO", "FSHNGSPT_TELNO", "phone", "관리기관전화번호", "MNG_INST_TELNO"]) || ""),
        lat:lat, lng:lng
    };
}
function buildFishingRequestUrl(pageNo) {
    var key = String(FISHING_API_KEY || "").trim();
    var encodedKey = /%[0-9a-f]{2}/i.test(key) ? key : encodeURIComponent(key);
    return FISHING_API_ENDPOINT + "/info?serviceKey=" + encodedKey + "&pageNo=" + pageNo + "&numOfRows=" + FISHING_PAGE_SIZE + "&returnType=json";
}
function fetchFishingPage(pageNo) {
    return fetch(buildFishingRequestUrl(pageNo), { cache:"no-store" }).then(function(response) {
        if (!response.ok) throw new Error("Fishing API HTTP " + response.status);
        return response.json();
    });
}
function normalizeFishingRows(rows) {
    var seen = new Set();
    return (rows || []).map(normalizeFishingItem).filter(function(item) {
        if (!item) return false;
        var id = item.lat.toFixed(6) + "|" + item.lng.toFixed(6) + "|" + item.name;
        if (seen.has(id)) return false;
        seen.add(id); return true;
    });
}
function loadFishingFallbackData() {
    return fetch("./data/fishing-spots.json", { cache:"no-cache" }).then(function(response) {
        if (!response.ok) throw new Error("Fishing fallback HTTP " + response.status);
        return response.json();
    }).then(function(payload) {
        var rows = Array.isArray(payload) ? payload : (payload && Array.isArray(payload.items) ? payload.items : []);
        fishingItems = normalizeFishingRows(rows);
        return fishingItems;
    });
}
function loadFishingData() {
    if (Array.isArray(fishingItems)) return Promise.resolve(fishingItems);
    if (fishingLoadPromise) return fishingLoadPromise;
    if (!FISHING_API_KEY) {
        if (!fishingMissingKeyWarned) console.info("Fishing API key is not configured; using the bundled official dataset.");
        fishingMissingKeyWarned = true;
        fishingLoadPromise = loadFishingFallbackData().finally(function() { fishingLoadPromise = null; });
        return fishingLoadPromise;
    }
    fishingLoadPromise = fetchFishingPage(1).then(function(firstPage) {
        var rows = extractFishingRows(firstPage);
        var total = extractFishingTotal(firstPage, rows.length < FISHING_PAGE_SIZE ? rows.length : FISHING_PAGE_SIZE * FISHING_MAX_PAGES);
        var pageCount = Math.min(FISHING_MAX_PAGES, Math.max(1, Math.ceil(total / FISHING_PAGE_SIZE)));
        var requests = [];
        for (var page = 2; page <= pageCount; page += 1) requests.push(fetchFishingPage(page).then(extractFishingRows));
        return Promise.all(requests).then(function(extraPages) {
            extraPages.forEach(function(pageRows) { rows = rows.concat(pageRows); });
            fishingItems = normalizeFishingRows(rows);
            if (fishingItems.length === 0) throw new Error("Fishing API returned no usable records");
            return fishingItems;
        });
    }).catch(function(error) {
        console.warn("Fishing API load failed; using bundled official dataset", error && error.message);
        return loadFishingFallbackData();
    }).finally(function() { fishingLoadPromise = null; });
    return fishingLoadPromise;
}
function clearFishingMarkers() {
    fishingMarkers = [];
    fishingLayerGroup.clearLayers();
}
function showFishingPopup(item) {
    var text = getFishingText(); var details = [];
    if (item.address) details.push([text.address, item.address]);
    if (item.type) details.push([text.type, item.type]);
    if (item.species) details.push([text.species, item.species]);
    if (item.capacity) details.push([text.capacity, item.capacity + text.people]);
    if (item.fee) details.push([text.fee, item.fee]);
    if (item.area) details.push([text.area, item.area]);
    var detailHtml = details.map(function(detail) { return "<br><small><b>" + escapeHtml(detail[0]) + ":</b> " + escapeHtml(detail[1]) + "</small>"; }).join("");
    var tel = item.phone ? "<br><small><b>" + escapeHtml(text.phone) + ":</b> <a href='tel:" + escapeHtml(item.phone) + "' style='color:" + FISHING_COLOR + ";'>" + escapeHtml(item.phone) + "</a></small>" : "";
    setSelectedDestination(item.lat, item.lng, item.name || text.label);
    var likeKey = getMapPlaceLikeKey("fishing", [item.name, item.lat, item.lng]);
    var popup = L.popup({ className:"tour-popup" }).setLatLng([item.lat, item.lng]).setContent("<b>" + escapeHtml(item.name || text.label) + "</b><br><span class='tour-popup-tag' style='color:" + FISHING_COLOR + ";border-color:" + FISHING_COLOR + ";background:rgba(56,189,248,.18);'>🎣 " + escapeHtml(text.label) + "</span>" + detailHtml + tel + buildMapPlaceLikeButton(likeKey)).openOn(map);
    trackPublicPlacePopup(popup, function() { showFishingPopup(item); });
}
function renderFishingMarkers() {
    clearFishingMarkers();
    if (!mapLayerSettings.fishing || !Array.isArray(fishingItems)) return;
    var text = getFishingText(); var center = getMapSearchCenter(); var bounds = map.getBounds().pad(0.12);
    fishingItems.filter(function(item) {
        return bounds.contains([item.lat, item.lng]) && isWithinMapSearchCenter(item.lat, item.lng, getMapSearchRadius());
    }).map(function(item) {
        item._distance = center.distanceTo([item.lat, item.lng]); return item;
    }).sort(function(a, b) { return a._distance - b._distance; }).slice(0, MAP_VIEWPORT_MARKER_LIMIT).forEach(function(item) {
        var hookSvg = "<svg viewBox='0 0 24 24' aria-hidden='true'><circle cx='8' cy='4.5' r='2.5'></circle><path d='M8 7v8.1a5.4 5.4 0 0 0 10.8 0v-4.4l-3.8 4.1'></path></svg>";
        var likeKey = getMapPlaceLikeKey("fishing", [item.name, item.lat, item.lng]);
        var icon = L.divIcon({ className:"library-map-marker-wrap fishing-map-marker-wrap", html: mapPlaceSymbolHtml("fishing", likedTourKeys.has(likeKey) ? "state-liked" : "", likeKey), iconSize:[28,28], iconAnchor:[14,14] });
        var marker = L.marker([item.lat, item.lng], { pane:"fishingPane", icon:icon, title:text.label + " - " + (item.name || "") }).addTo(fishingLayerGroup);
        marker.on("click", function() { showFishingPopup(item); }); fishingMarkers.push(marker);
    });
}
function refreshFishingForMap() {
    if (!mapLayerSettings.fishing) return Promise.resolve(false);
    var requestSeq = ++fishingRequestSeq;
    return loadFishingData().then(function() {
        if (requestSeq !== fishingRequestSeq || !mapLayerSettings.fishing) return false;
        renderFishingMarkers(); return true;
    }).catch(function(error) { console.warn("Fishing data load failed", error && error.message); return false; });
}

// ---- 怨듭쨷?붿옣??(?댁옣 ?쒖슱 ?곗씠??+ 移댁뭅??吏?ㅼ퐫?? ----

var REGION_BADGE_ATLAS_ENTRIES = [
    { id:"region_gimpo_1h", city:"김포시", x:18, y:36 },
    { id:"region_goyang_1h", city:"고양시", x:30, y:24 }
];
var activeRegionBadgeEntryId = "region_gimpo_1h";
function isRegionBadgeId(id) { return /^region_.*_1h$/.test(String(id || "")); }
function getEarnedBadge(id) { return badges.find(function(b) { return b.id === id; }) || null; }
var REGION_BADGE_ATLAS_I18N = {
    ko: {
        cities:{
            region_gimpo_1h:"김포시",
            region_goyang_1h:"고양시",
            region_hanam_1h:"하남시"
        },
        accumulating:"{city} 적립 중 · 정확도 {accuracy}",
        currentCity:"현재 {city}에 있어요",
        outside:"현재 위치가 {city} 밖이에요",
        accuracy:"정확도 {accuracy} · 100m 이내여야 적립",
        waiting:"GPS 위치를 기다리는 중",
        requirement:"{city}에서 정확도 100m 이내의 GPS 기록을 누적 1시간 모으면 획득해요.",
        earned:"획득 완료 · {date}",
        progress:"진행 {minutes}/60분",
        ariaEarned:"획득 완료",
        ariaLocked:"미획득"
    },

    en: {
        cities:{
            region_gimpo_1h:"Gimpo",
            region_goyang_1h:"Goyang",
            region_hanam_1h:"Hanam"
        },
        accumulating:"Recording in {city} · accuracy {accuracy}",
        currentCity:"You are currently in {city}",
        outside:"Your current location is outside {city}",
        accuracy:"Accuracy {accuracy} · must be within 100 m",
        waiting:"Waiting for GPS location",
        requirement:"Collect 1 hour of GPS records within 100 m accuracy in {city}.",
        earned:"Earned · {date}",
        progress:"Progress {minutes}/60 min",
        ariaEarned:"earned",
        ariaLocked:"not earned"
    },

    ja: {
        cities:{
            region_gimpo_1h:"金浦市",
            region_goyang_1h:"高陽市",
            region_hanam_1h:"河南市"
        },
        accumulating:"{city}で記録中 · 精度 {accuracy}",
        currentCity:"現在地は{city}です",
        outside:"現在地は{city}の外です",
        accuracy:"精度 {accuracy} · 100m以内で記録されます",
        waiting:"GPS位置を待っています",
        requirement:"{city}で精度100m以内のGPS記録を合計1時間集めると獲得できます。",
        earned:"獲得済み · {date}",
        progress:"進行 {minutes}/60分",
        ariaEarned:"獲得済み",
        ariaLocked:"未獲得"
    },

    zh: {
        cities:{
            region_gimpo_1h:"金浦市",
            region_goyang_1h:"高阳市",
            region_hanam_1h:"河南市"
        },
        accumulating:"正在{city}记录 · 精度 {accuracy}",
        currentCity:"当前位置在{city}",
        outside:"当前位置不在{city}范围内",
        accuracy:"精度 {accuracy} · 需在100米以内",
        waiting:"正在等待GPS位置",
        requirement:"在{city}累计收集1小时精度在100米以内的GPS记录即可获得。",
        earned:"已获得 · {date}",
        progress:"进度 {minutes}/60分钟",
        ariaEarned:"已获得",
        ariaLocked:"未获得"
    },

    es: {
        cities:{
            region_gimpo_1h:"Gimpo",
            region_goyang_1h:"Goyang",
            region_hanam_1h:"Hanam"
        },
        accumulating:"Registrando en {city} · precisión {accuracy}",
        currentCity:"Actualmente estás en {city}",
        outside:"Tu ubicación actual está fuera de {city}",
        accuracy:"Precisión {accuracy} · debe estar dentro de 100 m",
        waiting:"Esperando la ubicación GPS",
        requirement:"Acumula 1 hora de registros GPS con una precisión de 100 m en {city}.",
        earned:"Conseguida · {date}",
        progress:"Progreso {minutes}/60 min",
        ariaEarned:"conseguida",
        ariaLocked:"no conseguida"
    },

    fr: {
        cities:{
            region_gimpo_1h:"Gimpo",
            region_goyang_1h:"Goyang",
            region_hanam_1h:"Hanam"
        },
        accumulating:"Enregistrement à {city} · précision {accuracy}",
        currentCity:"Vous êtes actuellement à {city}",
        outside:"Votre position actuelle est en dehors de {city}",
        accuracy:"Précision {accuracy} · doit être inférieure à 100 m",
        waiting:"En attente de la position GPS",
        requirement:"Cumulez 1 heure de données GPS avec une précision de 100 m à {city}.",
        earned:"Obtenu · {date}",
        progress:"Progression {minutes}/60 min",
        ariaEarned:"obtenu",
        ariaLocked:"non obtenu"
    }
};

function getRegionBadgeAtlasText() {
    return REGION_BADGE_ATLAS_I18N[normalizeLang(currentLang)]
        || REGION_BADGE_ATLAS_I18N.ko;
}

function formatRegionBadgeAtlasText(template, values) {
    return String(template || "").replace(/\{([a-zA-Z]+)\}/g, function(match, key) {
        return values[key] !== undefined ? String(values[key]) : match;
    });
}

function getRegionBadgeCityLabel(entry, text) {
    if (!entry) return "";
    return text.cities[entry.id] || entry.city;
}

function getRegionBadgeCityLabelFromName(city, text) {
    var entry = REGION_BADGE_ATLAS_ENTRIES.find(function(item) {
        return item.city === city;
    });
    return entry ? getRegionBadgeCityLabel(entry, text) : city;
}
function setRegionBadgeAtlasDetail(entry) {
    var detail = document.getElementById("region-badge-atlas-detail");
    if (!entry) return;

    activeRegionBadgeEntryId = entry.id;

    var def = BADGE_DEFS.find(function(d) {
        return d.id === entry.id;
    });

    if (!detail || !def) return;

    var earned = getEarnedBadge(entry.id);
    var badgeText = getBadgeText(def);
    var atlasText = getRegionBadgeAtlasText();
    var cityLabel = getRegionBadgeCityLabel(entry, atlasText);

    var progress =
        typeof window.getGiloaRegionStayProgress === "function"
            ? window.getGiloaRegionStayProgress()
            : {};

    var minutes = Math.max(
        0,
        Math.min(60, Number(progress[entry.city]) || 0)
    );

    var status = "";

    if (!earned) {
        var fix = getRegionStayLiveFix(Date.now());

        if (regionStayLastTickCity === entry.city) {
            status = formatRegionBadgeAtlasText(
                atlasText.accumulating,
                {
                    city: cityLabel,
                    accuracy: fix
                        ? Math.round(fix.accuracy) + "m"
                        : "-"
                }
            );
        } else if (regionStayLastTickCity) {
            status = formatRegionBadgeAtlasText(
                atlasText.currentCity,
                {
                    city: getRegionBadgeCityLabelFromName(
                        regionStayLastTickCity,
                        atlasText
                    )
                }
            );
        } else if (fix) {
            status = formatRegionBadgeAtlasText(
                atlasText.outside,
                {
                    city: cityLabel
                }
            );
        } else if (
            currentPos &&
            isFinite(currentAccuracy) &&
            Number(currentAccuracy) > REGION_STAY_MAX_ACCURACY_M
        ) {
            status = formatRegionBadgeAtlasText(
                atlasText.accuracy,
                {
                    accuracy: Math.round(currentAccuracy) + "m"
                }
            );
        } else {
            status = atlasText.waiting;
        }
    }

    var requirementText = formatRegionBadgeAtlasText(
        atlasText.requirement,
        {
            city: cityLabel
        }
    );

    var progressText;

    if (earned) {
        progressText = formatRegionBadgeAtlasText(
            atlasText.earned,
            {
                date: formatCollectionDate(earned.earnedAt, earned.dateString)
            }
        );
    } else {
        progressText = formatRegionBadgeAtlasText(
            atlasText.progress,
            {
                minutes: minutes
            }
        );
    }

    detail.innerHTML =
        "<strong>" +
        escapeHtml(badgeText.name) +
        "</strong>" +
        "<span>" +
        escapeHtml(requirementText) +
        "</span>" +
        "<em>" +
        escapeHtml(progressText) +
        "</em>" +
        (
            status
                ? '<small class="region-badge-atlas-status">' +
                  escapeHtml(status) +
                  "</small>"
                : ""
        );
}

var regionStayDiagnosticTaps = 0;
var regionStayDiagnosticTimer = null;
function bindRegionStayDiagnosticGesture() {
    var stamp = document.getElementById("region-badge-atlas-build");
    if (stamp) stamp.textContent = "build " + GILOA_REGION_STAY_BUILD;

    var button = document.getElementById("region-badge-atlas-diagnose");
    if (button && !button._giloaDiagnosticBound) {
        button._giloaDiagnosticBound = true;
        button.addEventListener("click", toggleRegionStayDiagnostic);
    }

    var dismiss = document.getElementById("region-badge-atlas-diagnostic-close");
    if (dismiss && !dismiss._giloaDiagnosticBound) {
        dismiss._giloaDiagnosticBound = true;
        dismiss.addEventListener("click", function() {
            var wrap = document.getElementById("region-badge-atlas-diagnostic-wrap");
            if (wrap) wrap.hidden = true;
        });
    }

    var reload = document.getElementById("region-badge-atlas-reload-boundary");
    if (reload && !reload._giloaDiagnosticBound) {
        reload._giloaDiagnosticBound = true;
        reload.addEventListener("click", function() {
            reload.disabled = true;
            reload.textContent = collectionUiText("boundary_loading");
            loadAdminDistrictBoundaries().then(function() {
                reload.disabled = false;
                reload.textContent = collectionUiText("boundary_reload");
                window.giloaRegionStayDiagnostic();
            });
        });
    }

    var title = document.getElementById("region-badge-atlas-title");
    if (!title || title._giloaDiagnosticBound) return;
    title._giloaDiagnosticBound = true;
    title.addEventListener("click", function() {
        regionStayDiagnosticTaps += 1;
        clearTimeout(regionStayDiagnosticTimer);
        regionStayDiagnosticTimer = setTimeout(function() { regionStayDiagnosticTaps = 0; }, 1200);
        if (regionStayDiagnosticTaps < 5) return;
        regionStayDiagnosticTaps = 0;
        toggleRegionStayDiagnostic();
    });
}
document.addEventListener("DOMContentLoaded", bindRegionStayDiagnosticGesture);
function getRegionSymbolMunicipality(feature) {
    var title = getAdminFeatureTitle(feature);
    if (!title) return "";
    var tokens = String(title).match(/[가-힣]+/g) || [];
    var specialCity = tokens.find(function(token) {
        return token === "세종특별자치시";
    });
    if (specialCity) return specialCity;
    var municipality = tokens.find(function(token) {
        return /[시군구]$/.test(token) &&
            !/(특별시|광역시|특별자치시)$/.test(token);
    });
    return municipality || "";
}

// 지역별 상징은 지자체 공식 안내 등으로 확인된 정보만 사용한다.
// 공식 마스코트 이미지의 무단 복제 대신 문자·이모지로 자체 배지 형태를 만든다.
var REGION_SYMBOL_DATA = {
    "강남구": {
        mark: "🐦‍⬛",
        title: "까치",
        description: "강남구를 상징하는 새",
        category: "공식 상징물",
        source: "https://www.gangnam.go.kr/contents/hello/3/view.do?mid=ID06_040401"
    }
};
function getRegionSymbolData(city) {
    return REGION_SYMBOL_DATA[city] || {
        mark: "🔎",
        title: "상징 조사 중",
        description: "이 지역의 공식 마스코트 또는 대표 특산품을 확인하고 있어요.",
        category: "정보 확인 중",
        source: ""
    };
}
function getRegionSymbolMark(city) {
    return getRegionSymbolData(city).mark;
}

function hasVisitedRegionSymbolCity(city) {
    var features = typeof adminDistrictFeatures !== "undefined" && Array.isArray(adminDistrictFeatures)
        ? adminDistrictFeatures
        : [];
    var visits = typeof visitStamps !== "undefined" && Array.isArray(visitStamps)
        ? visitStamps
        : [];
    if (!features.length || !visits.length) return false;
    var cityFeatures = features.filter(function(feature) {
        return getRegionSymbolMunicipality(feature) === city;
    });
    if (!cityFeatures.length) return false;
    return visits.some(function(visit) {
        var lat = Number(visit && visit.lat);
        var lng = Number(visit && visit.lng);
        if (!isFinite(lat) || !isFinite(lng)) return false;
        var point = L.latLng(lat, lng);
        return cityFeatures.some(function(feature) {
            return typeof adminFeatureContains === "function" && adminFeatureContains(feature, point);
        });
    });
}

function getRegionSymbolEntries() {
    var features = typeof adminDistrictFeatures !== "undefined" && Array.isArray(adminDistrictFeatures)
        ? adminDistrictFeatures
        : [];
    var officialCities = Object.create(null);
    REGION_BADGE_ATLAS_ENTRIES.forEach(function(entry) {
        officialCities[entry.city] = true;
    });
    var cities = Object.create(null);
    features.forEach(function(feature) {
        var city = getRegionSymbolMunicipality(feature);
        if (city && !officialCities[city]) cities[city] = true;
    });
    return Object.keys(cities).sort(function(a, b) {
        return a.localeCompare(b, "ko");
    }).map(function(city) {
        return {
            id:"region_symbol_" + encodeURIComponent(city),
            city:city,
            symbol:getRegionSymbolMark(city),
            symbolData:getRegionSymbolData(city),
            earned:hasVisitedRegionSymbolCity(city)
        };
    });
}

function renderRegionSymbolBadges() {
    var grid = document.getElementById("region-badge-symbol-grid");
    if (!grid) return;
    var entries = getRegionSymbolEntries();
    grid.innerHTML = "";
    if (!entries.length) {
        grid.innerHTML = '<p class="region-badge-symbol-empty">전국 행정구역 정보를 불러오면 지역상징배지가 표시돼요.</p>';
        return;
    }
    entries.forEach(function(entry) {
        var button = document.createElement("button");
        button.type = "button";
        button.className = "region-badge-symbol-slot" + (entry.earned ? " earned" : " locked");
        button.setAttribute("aria-label", entry.city + " " + entry.symbolData.title + " 배지 " + (entry.earned ? "획득" : "미획득"));
        button.innerHTML =
            '<span class="region-badge-symbol-art" aria-hidden="true">' + entry.symbol + '</span>' +
            '<b>' + escapeHtml(entry.city) + '</b>' +
            '<small>' + escapeHtml(entry.symbolData.title) + '</small>' +
            '<small>' + (entry.earned ? '획득 완료' : '미획득') + '</small>';
        button.addEventListener("click", function() {
            var detail = document.getElementById("region-badge-atlas-detail");
            if (!detail) return;
            detail.innerHTML =
                '<strong>' + escapeHtml(entry.city) + ' · ' + escapeHtml(entry.symbolData.title) + '</strong>' +
                '<span>' + escapeHtml(entry.symbolData.description) + '</span>' +
                '<em>' + escapeHtml(entry.symbolData.category) + ' · ' +
                (entry.earned ? '방문 기록 확인 · 배지 획득 완료' : '이 지역에서 방문 기록을 남기면 배지를 획득해요.') +
                '</em>' +
                (entry.symbolData.source ? '<small><a href="' + escapeHtml(entry.symbolData.source) + '" target="_blank" rel="noopener noreferrer">공식 출처 확인</a></small>' : '');
        });
        grid.appendChild(button);
    });
}

function renderRegionBadgeAtlas() {
    var slots = document.getElementById("region-badge-map-slots");
    if (!slots) return;

    var atlasText = getRegionBadgeAtlasText();
    slots.innerHTML = "";

    REGION_BADGE_ATLAS_ENTRIES.forEach(function(entry) {
        var def = BADGE_DEFS.find(function(d) {
            return d.id === entry.id;
        });

        if (!def) return;

        var earned = getEarnedBadge(entry.id);
        var badgeText = getBadgeText(def);
        var cityLabel = getRegionBadgeCityLabel(entry, atlasText);

        var slot = document.createElement("button");
        slot.type = "button";
        slot.className =
            "region-badge-slot" +
            (earned ? " earned" : " locked");

        slot.dataset.badgeId = entry.id;
        slot.style.left = entry.x + "%";
        slot.style.top = entry.y + "%";

        slot.setAttribute(
            "aria-label",
            cityLabel +
            " " +
            badgeText.name +
            " " +
            (
                earned
                    ? atlasText.ariaEarned
                    : atlasText.ariaLocked
            )
        );

        slot.innerHTML =
            '<span class="region-badge-brass-frame">' +
            (
                earned
                    ? getCollectionVisualHtml(def, def.icon)
                    : "<i>?</i>"
            ) +
            "</span>" +
            "<b>" +
            escapeHtml(cityLabel) +
            "</b>";

        slot.addEventListener("click", function() {
            setRegionBadgeAtlasDetail(entry);
        });

        slots.appendChild(slot);
    });

    var selected =
        REGION_BADGE_ATLAS_ENTRIES.find(function(entry) {
            return entry.id === activeRegionBadgeEntryId;
        }) || REGION_BADGE_ATLAS_ENTRIES[0];

    setRegionBadgeAtlasDetail(selected);
    renderRegionSymbolBadges();
}
function openRegionBadgeAtlas() {
    var atlas = document.getElementById("region-badge-atlas"); if (!atlas) return;
    bindRegionStayDiagnosticGesture();
    tickRegionStayLive();
    recalculateRegionStayFromPath();
    renderRegionBadgeAtlas(); atlas.hidden = false; atlas.setAttribute("aria-hidden", "false"); document.body.classList.add("region-badge-atlas-open");
    var close = document.getElementById("region-badge-atlas-close"); if (close) close.focus();
}
function closeRegionBadgeAtlas() {
    var atlas = document.getElementById("region-badge-atlas"); if (!atlas) return;
    atlas.hidden = true; atlas.setAttribute("aria-hidden", "true"); document.body.classList.remove("region-badge-atlas-open");
}
window.openRegionBadgeAtlas = openRegionBadgeAtlas;
window.closeRegionBadgeAtlas = closeRegionBadgeAtlas;
document.addEventListener("click", function(event) {
    var atlas = document.getElementById("region-badge-atlas");
    if (!atlas || atlas.hidden || !event.target) return;
    if (event.target === atlas || (event.target.closest && event.target.closest("[data-region-atlas-close]"))) closeRegionBadgeAtlas();
});
document.addEventListener("keydown", function(event) { if (event.key === "Escape") closeRegionBadgeAtlas(); });


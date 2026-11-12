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
    // 강남구 까치는 구의 공식 상징물(구새)로 확인된 항목이다.
    "강남구": {
        mark: "🐦‍⬛",
        title: "까치",
        description: "강남구를 상징하는 새",
        category: "공식 상징물 · 구새",
        source: "https://www.gangnam.go.kr/contents/hello/3/view.do?mid=ID06_040401"
    },

    // 아래 24개는 공식 마스코트가 아닌 길로아의 창작 캐릭터 시안이다.
    // 지역의 장소·문화에서 착안했으며, 공식 상징물로 오인되지 않도록 분류를 명시한다.
    "종로구": { mark:"🏯", title:"궁궐 수호대", description:"궁궐과 오래된 골목의 이야기를 지키는 길로아 창작 캐릭터", category:"길로아 창작 캐릭터 · 역사 모티프", source:"" },
    "중구": { mark:"⭐", title:"남산 별빛 요정", description:"남산의 밤과 도심의 빛에서 착안한 길로아 창작 캐릭터", category:"길로아 창작 캐릭터 · 장소 모티프", source:"" },
    "용산구": { mark:"🧭", title:"박물관 탐험가", description:"박물관과 여러 문화가 만나는 동네에서 착안한 길로아 창작 캐릭터", category:"길로아 창작 캐릭터 · 문화 모티프", source:"" },
    "성동구": { mark:"👞", title:"수제화 장인", description:"성수동 수제화 거리와 장인 정신에서 착안한 길로아 창작 캐릭터", category:"길로아 창작 캐릭터 · 산업문화 모티프", source:"" },
    "광진구": { mark:"🐿️", title:"아차산 숲 친구", description:"아차산의 숲과 자연을 모티프로 만든 길로아 창작 캐릭터", category:"길로아 창작 캐릭터 · 자연 모티프", source:"" },
    "동대문구": { mark:"🌿", title:"약초 요정", description:"약령시의 한약재 문화를 모티프로 만든 길로아 창작 캐릭터", category:"길로아 창작 캐릭터 · 지역문화 모티프", source:"" },
    "중랑구": { mark:"🌹", title:"장미 요정", description:"장미와 산책길을 모티프로 만든 길로아 창작 캐릭터", category:"길로아 창작 캐릭터 · 자연 모티프", source:"" },
    "성북구": { mark:"🧱", title:"성곽 수호자", description:"한양도성과 성북동의 역사 공간에서 착안한 길로아 창작 캐릭터", category:"길로아 창작 캐릭터 · 역사 모티프", source:"" },
    "강북구": { mark:"🥾", title:"북한산 탐험가", description:"북한산의 산길과 숲을 모티프로 만든 길로아 창작 캐릭터", category:"길로아 창작 캐릭터 · 자연 모티프", source:"" },
    "도봉구": { mark:"🦕", title:"도봉산 공룡 친구", description:"도봉산의 산세에서 착안한 오리지널 공룡형 길로아 창작 캐릭터", category:"길로아 창작 캐릭터 · 자연 모티프", source:"" },
    "노원구": { mark:"🍂", title:"은행잎 요정", description:"가을 은행잎을 모티프로 만든 길로아 창작 캐릭터", category:"길로아 창작 캐릭터 · 식물 모티프", source:"" },
    "은평구": { mark:"🏡", title:"한옥 여행자", description:"은평한옥마을과 북한산 자락의 풍경에서 착안한 길로아 창작 캐릭터", category:"길로아 창작 캐릭터 · 장소 모티프", source:"" },
    "서대문구": { mark:"🕯️", title:"기억의 등불", description:"독립과 민주주의의 역사를 기억하는 길로아 창작 캐릭터", category:"길로아 창작 캐릭터 · 역사 모티프", source:"" },
    "마포구": { mark:"🎧", title:"거리 음악가", description:"홍대와 지역 음악문화에서 착안한 길로아 창작 캐릭터", category:"길로아 창작 캐릭터 · 문화 모티프", source:"" },
    "양천구": { mark:"🕊️", title:"하늘새 친구", description:"도심의 공원과 하늘을 모티프로 만든 길로아 창작 캐릭터", category:"길로아 창작 캐릭터 · 자연 모티프", source:"" },
    "강서구": { mark:"🌱", title:"약초 탐험가", description:"허준박물관과 전통 의약문화를 모티프로 만든 길로아 창작 캐릭터", category:"길로아 창작 캐릭터 · 문화 모티프", source:"" },
    "구로구": { mark:"🤖", title:"디지털 로봇", description:"디지털 산업과 기술의 이미지를 모티프로 만든 길로아 창작 캐릭터", category:"길로아 창작 캐릭터 · 산업 모티프", source:"" },
    "금천구": { mark:"🌳", title:"초록 은행나무", description:"도심 속 자연과 성장의 이미지를 모티프로 만든 길로아 창작 캐릭터", category:"길로아 창작 캐릭터 · 자연 모티프", source:"" },
    "영등포구": { mark:"🌸", title:"봄꽃 요정", description:"여의도 봄꽃 풍경에서 착안한 길로아 창작 캐릭터", category:"길로아 창작 캐릭터 · 계절 모티프", source:"" },
    "동작구": { mark:"🐟", title:"노량진 물고기", description:"노량진 수산시장과 물길의 이미지를 모티프로 만든 길로아 창작 캐릭터", category:"길로아 창작 캐릭터 · 지역문화 모티프", source:"" },
    "관악구": { mark:"🛡️", title:"산성 수호 장군", description:"관악산과 강감찬 장군의 역사에서 착안한 길로아 창작 캐릭터", category:"길로아 창작 캐릭터 · 역사 모티프", source:"" },
    "서초구": { mark:"🎨", title:"예술의 요정", description:"예술의전당과 문화예술 공간에서 착안한 길로아 창작 캐릭터", category:"길로아 창작 캐릭터 · 문화 모티프", source:"" },
    "송파구": { mark:"🎭", title:"탈춤 광대", description:"송파산대놀이의 전통 탈춤에서 착안한 길로아 창작 캐릭터", category:"길로아 창작 캐릭터 · 무형문화 모티프", source:"" },
    "강동구": { mark:"🪨", title:"선사시대 탐험가", description:"암사동 선사유적의 역사에서 착안한 길로아 창작 캐릭터", category:"길로아 창작 캐릭터 · 역사 모티프", source:"" }
};
// 전국 시·군·구 중 공식 상징 확인이 끝나지 않은 지역을 위한
// 길로아 창작 모티프. 지자체 공식 마스코트로 표시하지 않는다.
var REGION_SYMBOL_THEME_GROUPS = [
    { names:["춘천시","원주시","강릉시","동해시","태백시","속초시","삼척시","홍천군","횡성군","영월군","평창군","정선군","철원군","화천군","양구군","인제군","고성군","양양군"], mark:"🏔️", title:"산바람 탐험가", motif:"산맥과 숲, 호수와 바다를 여행하는 강원권 자연 모티프" },
    { names:["청주시","충주시","제천시","보은군","옥천군","영동군","증평군","진천군","괴산군","음성군","단양군"], mark:"🌿", title:"초록 들판 수호자", motif:"산과 들, 호수의 풍경에서 착안한 충북권 자연 모티프" },
    { names:["천안시","공주시","보령시","아산시","서산시","논산시","계룡시","당진시","금산군","부여군","서천군","청양군","홍성군","예산군","태안군"], mark:"🌾", title:"백제 들꽃 여행자", motif:"백제 역사와 서해 들판에서 착안한 충남권 역사·자연 모티프" },
    { names:["전주시","군산시","익산시","정읍시","남원시","김제시","완주군","진안군","무주군","장수군","임실군","순창군","고창군","부안군"], mark:"🍚", title:"풍요로운 들녘 친구", motif:"넓은 들과 음식문화에서 착안한 전북권 생활문화 모티프" },
    { names:["목포시","여수시","순천시","나주시","광양시","담양군","곡성군","구례군","고흥군","보성군","화순군","장흥군","강진군","해남군","영암군","무안군","함평군","영광군","장성군","완도군","진도군","신안군"], mark:"🐚", title:"남도 바다 탐험가", motif:"섬과 갯벌, 남도의 바다와 먹거리에서 착안한 전남권 해양 모티프" },
    { names:["포항시","경주시","김천시","안동시","구미시","영주시","영천시","상주시","문경시","경산시","의성군","청송군","영양군","영덕군","청도군","고령군","성주군","칠곡군","예천군","봉화군","울진군","울릉군"], mark:"🍎", title:"산과 과수원 탐험가", motif:"유서 깊은 고장과 산촌, 과수원에서 착안한 경북권 지역 모티프" },
    { names:["창원시","진주시","통영시","사천시","김해시","밀양시","거제시","양산시","의령군","함안군","창녕군","고성군","남해군","하동군","산청군","함양군","거창군","합천군"], mark:"🦀", title:"남해안 바다 친구", motif:"남해안과 섬, 산과 농촌의 풍경에서 착안한 경남권 자연 모티프" },
    { names:["제주시","서귀포시"], mark:"🍊", title:"오름 귤빛 여행자", motif:"오름과 바다, 감귤에서 착안한 제주 자연 모티프" },
    { names:["수원시","성남시","의정부시","안양시","부천시","광명시","평택시","동두천시","안산시","고양시","과천시","구리시","남양주시","오산시","시흥시","군포시","의왕시","하남시","용인시","파주시","이천시","안성시","김포시","화성시","광주시","양주시","포천시","여주시","연천군","가평군","양평군"], mark:"🌳", title:"도시숲 길잡이", motif:"도시와 자연이 이어지는 경기권 생활·자연 모티프" },
    { names:["부산광역시","부산진구","해운대구","수영구","남구","동구","서구","중구","영도구","동래구","금정구","연제구","사하구","강서구","북구","사상구","기장군"], mark:"🐦", title:"갈매기 바다지기", motif:"항구와 바다, 해안 산책길에서 착안한 부산권 해양 모티프" },
    { names:["대구광역시","중구","동구","서구","남구","북구","수성구","달서구","달성군","군위군"], mark:"🌼", title:"팔공산 꽃바람 친구", motif:"팔공산과 도심의 꽃에서 착안한 대구권 자연 모티프" },
    { names:["인천광역시","중구","동구","미추홀구","연수구","남동구","부평구","계양구","서구","강화군","옹진군"], mark:"🪽", title:"섬바람 두루미", motif:"갯벌과 섬, 철새에서 착안한 인천권 해양·생태 모티프" },
    { names:["광주광역시","동구","서구","남구","북구","광산구"], mark:"🕊️", title:"무등산 평화새", motif:"무등산과 민주·예술 문화에서 착안한 광주권 모티프" },
    { names:["대전광역시","동구","중구","서구","유성구","대덕구"], mark:"🔬", title:"과학도시 발명가", motif:"과학기술과 연구도시의 이미지에서 착안한 대전권 모티프" },
    { names:["울산광역시","중구","남구","동구","북구","울주군"], mark:"🐳", title:"고래바다 탐험가", motif:"고래와 바다, 대나무 숲에서 착안한 울산권 모티프" },
    { names:["세종특별자치시"], mark:"🌱", title:"행복도시 새싹이", motif:"정원과 미래도시의 이미지에서 착안한 세종 모티프" }
];
function getRegionSymbolTheme(city) {
    for (var i = 0; i < REGION_SYMBOL_THEME_GROUPS.length; i++) {
        if (REGION_SYMBOL_THEME_GROUPS[i].names.indexOf(city) >= 0) return REGION_SYMBOL_THEME_GROUPS[i];
    }
    return { mark:"🧭", title:"길로아 탐험가", motif:"지역 고유의 역사·자연·생활문화를 찾아가는 전국 공통 창작 모티프" };
}
function getRegionSymbolData(city) {
    if (REGION_SYMBOL_DATA[city]) return REGION_SYMBOL_DATA[city];
    var theme = getRegionSymbolTheme(city);
    return {
        mark: theme.mark,
        title: city + " " + theme.title,
        description: theme.motif + "를 바탕으로 만든 길로아 오리지널 캐릭터예요. 해당 지자체의 공식 마스코트가 아니며, 공식 상징물 자료를 확인하면 별도로 갱신해요.",
        category: "길로아 창작 캐릭터 · 지역 모티프 시안",
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


var COLLECTION_KEY = "giloa-collection";
var badges = []; var visitStamps = []; var items = []; var collectionLoaded = false;
var TESTER_SPROUT_ITEM_ID = "tester_sprout_2026";
var TESTER_SPROUT_IMAGE = "./assets/items/giloa-tester-sprout.png";
var TESTER_ELIGIBILITY_KEY = "giloa-prelaunch-tester-2026-v1";

var COLLECTION_UI_I18N = {
    ko: {
        regional_badges:"지역 뱃지", regional_hint:"전국 지도에서 지역별 뱃지를 확인하세요", empty_items:"아직 획득한 아이템이 없습니다.", empty_visits:"아직 방문한 장소가 없습니다.", item:"아이템", place:"장소", nearby_place:"주변 장소", visited_place:"방문 장소", new_place:"새로운 장소", new_region:"새로운 지역",
        visit_recorded:"{place} 방문을 기록했습니다.", gift_arrived:"선물 도착! 길로아의 새싹을 지켜봐줘서 고마워요 🌱", sprout_name:"길로아의 새싹", sprout_description:"출시 전부터 길로아의 새싹을 지켜봐 준 테스터에게 드리는 한정 증표예요.", discovery:"새로운 장소 발견", photo_complete:"사진으로 방문 완료", stay_complete:"체류로 방문 완료", experience_reward:"경험 +3", travel_stamp:"여행 스탬프 획득", boundary_loading:"불러오는 중...", boundary_reload:"행정경계 다시 불러오기",
        recap_exploration:"오늘도 새로운 길을 열어 나만의 지도를 넓혔어.", recap_experience:"오늘 만난 장소들이 특별한 여행 경험이 되었어.", recap_memory:"오늘 남긴 사진과 기억이 오래 빛날 거야.", recap_connection:"오늘 사람과 지역을 잇는 새로운 연결을 만들었어.", recap_growth:"오늘의 도전이 다음 모험을 위한 힘이 되었어.",
        badge_encounter:"{city}에서의 시간이 새로운 만남이 되었어. {name}를 얻었어!", badge_view:"아이템의 지역 뱃지 지도에서 방금 얻은 {name}를 확인해 봐."
    },
    en: {
        regional_badges:"Regional badges", regional_hint:"Explore regional badges on the nationwide map", empty_items:"No items earned yet.", empty_visits:"No places visited yet.", item:"Item", place:"Place", nearby_place:"Nearby place", visited_place:"Visited place", new_place:"New place", new_region:"a new region",
        visit_recorded:"Visit to {place} recorded.", gift_arrived:"A gift has arrived! Thank you for watching Giloa grow 🌱", sprout_name:"Giloa's Sprout", sprout_description:"A limited token for testers who supported Giloa before launch.", discovery:"New place discovered", photo_complete:"Visit completed with a photo", stay_complete:"Visit completed by staying", experience_reward:"Experience +3", travel_stamp:"Travel stamp earned", boundary_loading:"Loading...", boundary_reload:"Reload administrative boundaries",
        recap_exploration:"You opened new paths and expanded your own map today.", recap_experience:"Today's places became special travel experiences.", recap_memory:"Today's photos and memories will shine for a long time.", recap_connection:"You made new connections with people and places today.", recap_growth:"Today's challenges gave you strength for your next adventure.",
        badge_encounter:"Your time in {city} became a new encounter. You earned {name}!", badge_view:"Open Items → Regional Badge Atlas to see your new {name}."
    },
    ja: {
        regional_badges:"地域バッジ", regional_hint:"全国地図で地域ごとのバッジを確認できます", empty_items:"まだ獲得したアイテムはありません。", empty_visits:"まだ訪れた場所はありません。", item:"アイテム", place:"場所", nearby_place:"近くの場所", visited_place:"訪れた場所", new_place:"新しい場所", new_region:"新しい地域",
        visit_recorded:"{place}への訪問を記録しました。", gift_arrived:"プレゼントが届いたよ！ギロアの成長を見守ってくれてありがとう 🌱", sprout_name:"ギロアの若芽", sprout_description:"リリース前からギロアを見守ってくれたテスターへの限定の証です。", discovery:"新しい場所を発見", photo_complete:"写真で訪問完了", stay_complete:"滞在で訪問完了", experience_reward:"経験 +3", travel_stamp:"旅のスタンプを獲得", boundary_loading:"読み込み中...", boundary_reload:"行政区域の境界を再読み込み",
        recap_exploration:"今日も新しい道を開き、自分だけの地図が広がったね。", recap_experience:"今日訪れた場所が、特別な旅の経験になったね。", recap_memory:"今日の写真と思い出は、いつまでも輝くよ。", recap_connection:"今日は人と地域をつなぐ、新しい出会いがあったね。", recap_growth:"今日の挑戦が、次の冒険への力になったね。",
        badge_encounter:"{city}で過ごした時間が新しい出会いになったよ。{name}を獲得したよ！", badge_view:"アイテムの地域バッジ地図で、獲得した{name}を確認してみて。"
    },
    zh: {
        regional_badges:"地区徽章", regional_hint:"在全国地图上查看各地区徽章", empty_items:"还没有获得物品。", empty_visits:"还没有访问过的地点。", item:"物品", place:"地点", nearby_place:"附近地点", visited_place:"已访问地点", new_place:"新地点", new_region:"新地区",
        visit_recorded:"已记录对{place}的访问。", gift_arrived:"礼物到了！感谢你一直守护Giloa的成长 🌱", sprout_name:"Giloa的嫩芽", sprout_description:"送给在正式发布前就支持Giloa的测试者的限定纪念品。", discovery:"发现新地点", photo_complete:"通过照片完成访问", stay_complete:"通过停留完成访问", experience_reward:"体验 +3", travel_stamp:"获得旅行印章", boundary_loading:"正在加载...", boundary_reload:"重新加载行政区边界",
        recap_exploration:"今天又开辟了新的道路，让自己的地图更广阔了。", recap_experience:"今天到访的地点成为了特别的旅行体验。", recap_memory:"今天留下的照片与回忆，会长久闪耀。", recap_connection:"今天与人们和地区建立了新的联系。", recap_growth:"今天的挑战，为下一次冒险积蓄了力量。",
        badge_encounter:"你在{city}度过的时光带来了新的相遇。获得了{name}！", badge_view:"请在“物品”的地区徽章地图中查看刚获得的{name}。"
    },
    es: {
        regional_badges:"Insignias regionales", regional_hint:"Consulta las insignias regionales en el mapa nacional", empty_items:"Todavía no has conseguido objetos.", empty_visits:"Todavía no has visitado ningún lugar.", item:"Objeto", place:"Lugar", nearby_place:"Lugar cercano", visited_place:"Lugar visitado", new_place:"Nuevo lugar", new_region:"una nueva región",
        visit_recorded:"Visita a {place} registrada.", gift_arrived:"¡Ha llegado un regalo! Gracias por acompañar el crecimiento de Giloa 🌱", sprout_name:"El brote de Giloa", sprout_description:"Un recuerdo exclusivo para quienes probaron y apoyaron Giloa antes de su lanzamiento.", discovery:"Nuevo lugar descubierto", photo_complete:"Visita completada con una foto", stay_complete:"Visita completada por estancia", experience_reward:"Experiencia +3", travel_stamp:"Sello de viaje conseguido", boundary_loading:"Cargando...", boundary_reload:"Recargar límites administrativos",
        recap_exploration:"Hoy abriste nuevos caminos y ampliaste tu propio mapa.", recap_experience:"Los lugares de hoy se convirtieron en experiencias de viaje especiales.", recap_memory:"Las fotos y los recuerdos de hoy brillarán durante mucho tiempo.", recap_connection:"Hoy creaste nuevos vínculos con personas y lugares.", recap_growth:"Los retos de hoy te dieron fuerzas para tu próxima aventura.",
        badge_encounter:"Tu tiempo en {city} se convirtió en un nuevo encuentro. ¡Conseguiste {name}!", badge_view:"Mira tu nuevo {name} en Objetos → Atlas de insignias regionales."
    },
    fr: {
        regional_badges:"Badges régionaux", regional_hint:"Consultez les badges régionaux sur la carte nationale", empty_items:"Aucun objet obtenu pour le moment.", empty_visits:"Aucun lieu visité pour le moment.", item:"Objet", place:"Lieu", nearby_place:"Lieu à proximité", visited_place:"Lieu visité", new_place:"Nouveau lieu", new_region:"une nouvelle région",
        visit_recorded:"Visite de {place} enregistrée.", gift_arrived:"Un cadeau est arrivé ! Merci d'avoir accompagné la croissance de Giloa 🌱", sprout_name:"La pousse de Giloa", sprout_description:"Un souvenir exclusif pour les testeurs qui ont soutenu Giloa avant son lancement.", discovery:"Nouveau lieu découvert", photo_complete:"Visite validée avec une photo", stay_complete:"Visite validée par un séjour", experience_reward:"Expérience +3", travel_stamp:"Tampon de voyage obtenu", boundary_loading:"Chargement...", boundary_reload:"Recharger les limites administratives",
        recap_exploration:"Vous avez ouvert de nouveaux chemins et agrandi votre carte aujourd'hui.", recap_experience:"Les lieux d'aujourd'hui sont devenus des expériences de voyage uniques.", recap_memory:"Les photos et souvenirs d'aujourd'hui brilleront longtemps.", recap_connection:"Vous avez créé de nouveaux liens avec les personnes et les lieux aujourd'hui.", recap_growth:"Les défis d'aujourd'hui vous ont donné des forces pour votre prochaine aventure.",
        badge_encounter:"Le temps passé à {city} est devenu une nouvelle rencontre. Vous avez obtenu {name} !", badge_view:"Retrouvez {name} dans Objets → Atlas des badges régionaux."
    }
};
function collectionUiText(key, values, language) {
    var text = COLLECTION_UI_I18N[normalizeLang(language || currentLang)] || COLLECTION_UI_I18N.en;
    return formatUiTemplate(text[key] || COLLECTION_UI_I18N.en[key] || "", values || {});
}
function formatCollectionDate(timestamp, fallback) {
    var date = timestamp !== undefined && timestamp !== null && timestamp !== "" ? new Date(Number(timestamp)) : null;
    if (!date || isNaN(date.getTime())) {
        var parts = String(fallback || "").match(/^(\d{4})\s*(?:년|\.)\s*(\d{1,2})\s*(?:월|\.)\s*(\d{1,2})\s*(?:일|\.)?\s*$/);
        if (parts) date = new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]));
    }
    return date && !isNaN(date.getTime()) ? date.toLocaleDateString(normalizeLang(currentLang)) : String(fallback || "");
}
function getCollectionItemText(savedItem) {
    // Resolve built-in labels only at display time; keep all saved records intact.
    if (savedItem.id === TESTER_SPROUT_ITEM_ID) return { name:collectionUiText("sprout_name"), description:collectionUiText("sprout_description") };
    var name = savedItem.name || savedItem.title || collectionUiText("item");
    return { name:name, description:savedItem.description || name };
}
function getVisitTypeLabel(visit) {
    var savedType = String(visit.type || "");
    var typeId = String(visit.contenttypeid || visit.contentTypeId || "");
    Object.keys(TOUR_TYPE_NAMES).some(function(lang) {
        return Object.keys(TOUR_TYPE_NAMES[lang]).some(function(id) {
            if (savedType !== TOUR_TYPE_NAMES[lang][id] && savedType !== id) return false;
            typeId = id;
            return true;
        });
    });
    return typeId ? getTourTypeLabel(typeId) : collectionUiText("place");
}
function getVisitDisplayName(visit) {
    var id = visit.visitKey ? String(visit.visitKey).replace(/:\d{4}-\d{2}-\d{2}$/, "") : "";
    var source = id ? (tourItems || []).concat(festivalItems || []).find(function(item) { return getTourItemId(item) === id; }) : null;
    return source ? getTourDisplayTitle(source) : (visit.name ? getRegionBadgeCityLabelFromName(visit.name, getRegionBadgeAtlasText()) : collectionUiText("visited_place"));
}
var activeDiscoveryRewardOptions = null;

function getCollectionImage(fileName) {
    return encodeURI("./gilo many appearance/" + fileName);
}
function getProvinceAsset(path) { return encodeURI("./assets/province/" + path); }
var DEFAULT_COLLECTION_IMAGE = getCollectionImage("gilo-tutorial-thumbs-transparent.png");

var BADGE_DEFS = [
    { id: "first_memory", icon: "M", image: getCollectionImage("gilo-tutorial-heartfelt-transparent.png"), imagePosition: "center 34%", name: "First Memory", desc: "Saved your first memory." },
    { id: "first_photo", icon: "P", image: getCollectionImage("giloa-tutorial-photo-nature.png"), imagePosition: "center 48%", name: "First Photo", desc: "Saved your first photo." },
    { id: "first_10km", icon: "10", image: getCollectionImage("gilo-tutorial-thumbs-transparent.png"), imagePosition: "center 35%", name: "10km", desc: "Walked 10km in total." },
    { id: "first_50km", icon: "50", image: getCollectionImage("gilo-tutorial-stars-transparent.png"), imagePosition: "center 38%", name: "50km", desc: "Walked 50km in total." },
    { id: "early_bird", icon: "AM", image: getCollectionImage("gilo-tutorial-curious-transparent.png"), imagePosition: "center 28%", name: "Early Bird", desc: "Recorded before 5 AM." },
    { id: "memory_5", icon: "M5", image: getCollectionImage("gilo-emotions-transparent/14-love-transparent.png"), imagePosition: "center 38%", name: "Memory Collector", desc: "Saved 5 memories." },
    { id: "photo_10", icon: "P10", image: getCollectionImage("gilo-tutorial-welcome-transparent.png"), imagePosition: "center 36%", name: "Photo Collector", desc: "Saved 10 photos." },
    { id: "tour_visit", icon: "T", image: getCollectionImage("ChatGPT Image Aug 3, 2026, 09_16_54 AM.png"), imagePosition: "center 50%", name: "Explorer", desc: "Visited a place." },
    { id: "festival_visit", icon: "F", image: getCollectionImage("gilo-actions-transparent/04-dancing-transparent.png"), imagePosition: "center 35%", name: "Festival Visitor", desc: "Visited a festival." },
    { id: "image_hyundai_fountain", icon: makeImageBadgeIcon("fountain"), name: "Fountain Friend", desc: "Recognized the fountain." },
    { id: "image_heendy", icon: makeImageBadgeIcon("heendy"), name: "Heendy Friend", desc: "Recognized Heendy." },
    { id: "image_dasan_street", icon: makeImageBadgeIcon("street"), name: "Street Explorer", desc: "Recognized Dasan Street." },
    { id: "region_gimpo_1h", icon: "GP", image: getProvinceAsset("김포시 - 포미, 포수/01_png/기본형01.png"), imageFit:"contain", imagePosition:"center", name:"김포 포미·포수", desc:"김포시에서 확인된 GPS로 1시간 머물렀어요." },
    { id: "region_goyang_1h", icon: "GY", image: getProvinceAsset("고양시 - 고양고양이/고양시 - 고양고양이.png"), imageFit:"contain", imagePosition:"center", name:"고양고양이", desc:"고양시에서 확인된 GPS로 1시간 머물렀어요." },
];

var BADGE_TEXT_I18N = {
    ko: {
        first_memory:{name:"첫 기억",desc:"첫 번째 기억을 저장했어요."},
        first_photo:{name:"첫 사진",desc:"첫 번째 사진을 저장했어요."},
        first_10km:{name:"10km",desc:"총 10km를 걸었어요."},
        first_50km:{name:"50km",desc:"총 50km를 걸었어요."},
        early_bird:{name:"얼리버드",desc:"오전 5시 전에 기록했어요."},
        memory_5:{name:"기억 수집가",desc:"기억 5개를 저장했어요."},
        photo_10:{name:"사진 수집가",desc:"사진 10장을 저장했어요."},
        tour_visit:{name:"탐험가",desc:"새로운 장소를 방문했어요."},
        festival_visit:{name:"축제 방문자",desc:"축제를 방문했어요."},
        image_hyundai_fountain:{name:"분수 친구",desc:"분수를 인식했어요."},
        image_heendy:{name:"흰디 친구",desc:"흰디를 인식했어요."},
        image_hanam_bangul:{name:"방울이 친구",desc:"방울이를 인식했어요."},
        image_dasan_street:{name:"거리 탐험가",desc:"다산 거리를 인식했어요."},
        region_gimpo_1h:{name:"김포 포미·포수",desc:"김포시에서 1시간 머문 방문 뱃지예요."},
        region_hanam_1h:{name:"하남이와 방울이",desc:"하남시에서 1시간 머문 방문 뱃지예요."},
        region_goyang_1h:{name:"고양고양이",desc:"고양시에서 1시간 머문 방문 뱃지예요."}
    },

    en: {
        first_memory:{name:"First Memory",desc:"Saved your first memory."},
        first_photo:{name:"First Photo",desc:"Saved your first photo."},
        first_10km:{name:"10 km",desc:"Walked 10 km in total."},
        first_50km:{name:"50 km",desc:"Walked 50 km in total."},
        early_bird:{name:"Early Bird",desc:"Recorded a journey before 5 AM."},
        memory_5:{name:"Memory Collector",desc:"Saved 5 memories."},
        photo_10:{name:"Photo Collector",desc:"Saved 10 photos."},
        tour_visit:{name:"Explorer",desc:"Visited a new place."},
        festival_visit:{name:"Festival Visitor",desc:"Visited a festival."},
        image_hyundai_fountain:{name:"Fountain Friend",desc:"Recognized the fountain."},
        image_heendy:{name:"Heendy Friend",desc:"Recognized Heendy."},
        image_hanam_bangul:{name:"Bangul Friend",desc:"Recognized Bangul."},
        image_dasan_street:{name:"Street Explorer",desc:"Recognized Dasan Street."},
        region_gimpo_1h:{name:"Gimpo Pomi & Posu",desc:"Stayed in Gimpo for one verified hour."},
        region_hanam_1h:{name:"Hanam-i & Bangul-i",desc:"Stayed in Hanam for one verified hour."},
        region_goyang_1h:{name:"Goyang Cat",desc:"Stayed in Goyang for one verified hour."}
    },

    ja: {
        first_memory:{name:"初めての思い出",desc:"初めての思い出を保存しました。"},
        first_photo:{name:"初めての写真",desc:"初めての写真を保存しました。"},
        first_10km:{name:"10km",desc:"合計10km歩きました。"},
        first_50km:{name:"50km",desc:"合計50km歩きました。"},
        early_bird:{name:"早起きの旅人",desc:"午前5時前に記録しました。"},
        memory_5:{name:"思い出コレクター",desc:"思い出を5件保存しました。"},
        photo_10:{name:"写真コレクター",desc:"写真を10枚保存しました。"},
        tour_visit:{name:"探検家",desc:"新しい場所を訪れました。"},
        festival_visit:{name:"フェスティバル訪問者",desc:"フェスティバルを訪れました。"},
        image_hyundai_fountain:{name:"噴水の友達",desc:"噴水を認識しました。"},
        image_heendy:{name:"ヒンディの友達",desc:"ヒンディを認識しました。"},
        image_hanam_bangul:{name:"バンウリの友達",desc:"バンウリを認識しました。"},
        image_dasan_street:{name:"通りの探検家",desc:"茶山通りを認識しました。"},
        region_gimpo_1h:{name:"金浦 ポミ・ポス",desc:"金浦市に確認済みの1時間滞在。"},
        region_hanam_1h:{name:"河南 ハナミとバンウリ",desc:"河南市に確認済みの1時間滞在。"},
        region_goyang_1h:{name:"高陽ネコ",desc:"高陽市に確認済みの1時間滞在。"}
    },

    zh: {
        first_memory:{name:"第一份回忆",desc:"保存了第一份回忆。"},
        first_photo:{name:"第一张照片",desc:"保存了第一张照片。"},
        first_10km:{name:"10公里",desc:"累计步行了10公里。"},
        first_50km:{name:"50公里",desc:"累计步行了50公里。"},
        early_bird:{name:"早起旅行者",desc:"在清晨5点前完成了记录。"},
        memory_5:{name:"回忆收藏家",desc:"保存了5份回忆。"},
        photo_10:{name:"照片收藏家",desc:"保存了10张照片。"},
        tour_visit:{name:"探索者",desc:"访问了一个新地点。"},
        festival_visit:{name:"节庆访客",desc:"访问了一个节庆活动。"},
        image_hyundai_fountain:{name:"喷泉之友",desc:"识别出了喷泉。"},
        image_heendy:{name:"Heendy之友",desc:"识别出了Heendy。"},
        image_hanam_bangul:{name:"Bangul之友",desc:"识别出了Bangul。"},
        image_dasan_street:{name:"街道探索者",desc:"识别出了茶山街道。"},
        region_gimpo_1h:{name:"金浦 Pomi与Posu",desc:"在金浦市完成1小时有效停留。"},
        region_hanam_1h:{name:"河南 Hanam-i与Bangul-i",desc:"在河南市完成1小时有效停留。"},
        region_goyang_1h:{name:"高阳猫",desc:"在高阳市完成1小时有效停留。"}
    },

    es: {
        first_memory:{name:"Primer recuerdo",desc:"Guardaste tu primer recuerdo."},
        first_photo:{name:"Primera foto",desc:"Guardaste tu primera foto."},
        first_10km:{name:"10 km",desc:"Caminaste 10 km en total."},
        first_50km:{name:"50 km",desc:"Caminaste 50 km en total."},
        early_bird:{name:"Madrugador",desc:"Registraste un recorrido antes de las 5 a. m."},
        memory_5:{name:"Coleccionista de recuerdos",desc:"Guardaste 5 recuerdos."},
        photo_10:{name:"Coleccionista de fotos",desc:"Guardaste 10 fotos."},
        tour_visit:{name:"Explorador",desc:"Visitaste un lugar nuevo."},
        festival_visit:{name:"Visitante de festivales",desc:"Visitaste un festival."},
        image_hyundai_fountain:{name:"Amigo de la fuente",desc:"Reconociste la fuente."},
        image_heendy:{name:"Amigo de Heendy",desc:"Reconociste a Heendy."},
        image_hanam_bangul:{name:"Amigo de Bangul",desc:"Reconociste a Bangul."},
        image_dasan_street:{name:"Explorador de calles",desc:"Reconociste la calle Dasan."},
        region_gimpo_1h:{name:"Gimpo: Pomi y Posu",desc:"Una hora verificada en Gimpo."},
        region_hanam_1h:{name:"Hanam-i y Bangul-i",desc:"Una hora verificada en Hanam."},
        region_goyang_1h:{name:"Gato de Goyang",desc:"Una hora verificada en Goyang."}
    },

    fr: {
        first_memory:{name:"Premier souvenir",desc:"Vous avez enregistré votre premier souvenir."},
        first_photo:{name:"Première photo",desc:"Vous avez enregistré votre première photo."},
        first_10km:{name:"10 km",desc:"Vous avez parcouru 10 km au total."},
        first_50km:{name:"50 km",desc:"Vous avez parcouru 50 km au total."},
        early_bird:{name:"Lève-tôt",desc:"Vous avez enregistré un trajet avant 5 h."},
        memory_5:{name:"Collectionneur de souvenirs",desc:"Vous avez enregistré 5 souvenirs."},
        photo_10:{name:"Collectionneur de photos",desc:"Vous avez enregistré 10 photos."},
        tour_visit:{name:"Explorateur",desc:"Vous avez visité un nouveau lieu."},
        festival_visit:{name:"Visiteur de festival",desc:"Vous avez visité un festival."},
        image_hyundai_fountain:{name:"Ami de la fontaine",desc:"Vous avez reconnu la fontaine."},
        image_heendy:{name:"Ami de Heendy",desc:"Vous avez reconnu Heendy."},
        image_hanam_bangul:{name:"Ami de Bangul",desc:"Vous avez reconnu Bangul."},
        image_dasan_street:{name:"Explorateur de rue",desc:"Vous avez reconnu la rue Dasan."},
        region_gimpo_1h:{name:"Gimpo : Pomi et Posu",desc:"Une heure vérifiée à Gimpo."},
        region_hanam_1h:{name:"Hanam-i et Bangul-i",desc:"Une heure vérifiée à Hanam."},
        region_goyang_1h:{name:"Chat de Goyang",desc:"Une heure vérifiée à Goyang."}
    }
};
function getBadgeText(def) {
    var local = BADGE_TEXT_I18N[normalizeLang(currentLang)] || {};
    return local[def.id] || { name:def.name, desc:def.desc };
}

function makeImageBadgeIcon(type) {
    var faces = {
        fountain: '<span class="badge-face badge-fountain"><span class="badge-splash"></span><span class="badge-eyes"></span></span>',
        heendy: '<span class="badge-face badge-heendy"><span class="badge-ears"></span><span class="badge-eyes"></span></span>',
        street: '<span class="badge-face badge-street"><span class="badge-sign"></span><span class="badge-eyes"></span></span>'
    };
    return '<span class="character-badge" aria-hidden="true">' + (faces[type] || faces.street) + '</span>';
}

function getCollectionVisualHtml(def, fallbackIcon) {
    if (def && def.image) {
        var imagePosition = def.imagePosition || "center";
        var imageFit = def.imageFit || "cover";
        return '<div class="badge-art" style="--badge-image-position:' + escapeHtml(imagePosition) + ';--badge-image-fit:' + escapeHtml(imageFit) + '"><span class="badge-art-fallback" aria-hidden="true">✦</span><img src="' + escapeHtml(def.image) + '" alt="" loading="lazy" decoding="async" draggable="false" onerror="this.remove()"></div>';
    }
    return '<div class="badge-icon">' + (fallbackIcon || "✦") + '</div>';
}

function loadCollection() {
    try {
        var raw = localStorage.getItem(COLLECTION_KEY);
        if (raw) {
            var data = JSON.parse(raw);
            badges = Array.isArray(data.badges) ? data.badges : [];
            visitStamps = Array.isArray(data.visitStamps) ? data.visitStamps : [];
            items = Array.isArray(data.items) ? data.items : [];
        }
        enrollPrelaunchTesterIfOpen();
        grantTesterSproutGift();
        collectionLoaded = true;
        checkWearableMissions();
        updateBadgeList();
        updateVisitList();
    } catch(e) { console.warn("수집 정보 복원 실패", e); }
}

function saveCollection() {
    safeStorageSet(COLLECTION_KEY, JSON.stringify({ badges: badges, visitStamps: visitStamps, items: items }));
}

function earnBadge(badgeId) {
    if (badges.some(function(b) { return b.id === badgeId; })) return;
    var def = BADGE_DEFS.find(function(d) { return d.id === badgeId; });
    if (!def) return;
    var now = new Date();
    badges.push({ id: badgeId, earnedAt: now.getTime(), dateString: now.toLocaleDateString("ko-KR") });
    saveCollection();
    updateBadgeList();
    var regionAtlas = document.getElementById("region-badge-atlas");
    if (isRegionBadgeId(badgeId) && regionAtlas && !regionAtlas.hidden) renderRegionBadgeAtlas();
    var badgeText = getBadgeText(def);
    var ui = UI_TEXT[currentLang] || UI_TEXT.ko;
    showCollectionToast((ui.badge_earned || "뱃지 획득!") + " " + badgeText.name);
   if (isRegionBadgeId(badgeId)) {
    animateRegionBadgeToMenu(badgeId);
}
else {
    showGiloReaction("badge", "", {
        force:true,
        reward:badgeText.name
    });
}
}

function animateRegionBadgeToMenu(badgeId) {
    var menuButton = document.getElementById("ham-btn");
    if (!menuButton) return;
    var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
        menuButton.classList.remove("region-badge-received");
        void menuButton.offsetWidth;
        menuButton.classList.add("region-badge-received");
        setTimeout(function() { menuButton.classList.remove("region-badge-received"); }, 900);
        return;
    }
    var source = document.querySelector('.region-badge-slot[data-badge-id="' + badgeId + '"] .region-badge-brass-frame');
    var sourceRect = source ? source.getBoundingClientRect() : null;
    var targetRect = menuButton.getBoundingClientRect();
    var startX = sourceRect ? sourceRect.left + sourceRect.width / 2 : window.innerWidth / 2;
    var startY = sourceRect ? sourceRect.top + sourceRect.height / 2 : window.innerHeight * 0.42;
    var endX = targetRect.left + targetRect.width / 2;
    var endY = targetRect.top + targetRect.height / 2;
    var def = BADGE_DEFS.find(function(item) { return item.id === badgeId; });
    var flight = document.createElement("div");
    flight.className = "region-badge-menu-flight";
    flight.setAttribute("aria-hidden", "true");
    flight.style.left = startX + "px";
    flight.style.top = startY + "px";
    flight.style.setProperty("--badge-flight-x", (endX - startX) + "px");
    flight.style.setProperty("--badge-flight-y", (endY - startY) + "px");
    flight.style.setProperty("--badge-flight-mid-x", ((endX - startX) * 0.72) + "px");
    flight.style.setProperty("--badge-flight-mid-y", (((endY - startY) * 0.72) - 34) + "px");
    flight.innerHTML = '<span class="region-badge-menu-flight-frame">' + getCollectionVisualHtml(def, def && def.icon) + '</span>';
    document.body.appendChild(flight);
    var finish = function() {
        if (flight.parentNode) flight.parentNode.removeChild(flight);
        menuButton.classList.remove("region-badge-received");
        void menuButton.offsetWidth;
        menuButton.classList.add("region-badge-received");
        setTimeout(function() { menuButton.classList.remove("region-badge-received"); }, 900);
    };
    flight.addEventListener("animationend", finish, { once:true });
    setTimeout(function() { if (flight.parentNode) finish(); }, 1500);
}

function showRegionBadgeEarnedDialogue(badgeId, badgeText) {
    var region = REGION_BADGE_ATLAS_ENTRIES.find(function(entry) { return entry.id === badgeId; });
    var encounter = {}, view = {};
    Object.keys(COLLECTION_UI_I18N).forEach(function(lang) {
        var translatedBadge = BADGE_TEXT_I18N[lang] && BADGE_TEXT_I18N[lang][badgeId];
        var name = translatedBadge ? translatedBadge.name : collectionUiText("regional_badges", {}, lang);
        var city = region ? getRegionBadgeCityLabel(region, REGION_BADGE_ATLAS_I18N[lang]) : collectionUiText("new_region", {}, lang);
        encounter[lang] = collectionUiText("badge_encounter", { city:city, name:name }, lang);
        view[lang] = collectionUiText("badge_view", { name:name }, lang);
    });
    showGiloDialogue({
        image:GILO_DIALOG_IMAGE,
        name:"Gilo",
        pages:[encounter, view]
    });
}

function addVisitStamp(name, type, lat, lng) {
    var now = new Date();
    visitStamps.push({ name: name, type: type, lat: lat, lng: lng, visitedAt: now.getTime(), dateString: now.toLocaleDateString("ko-KR") });
    saveCollection();
    updateVisitList();
    if (type === "愿愿묕옙?" || type === "臾명솕?占쎌꽕") earnBadge("tour_visit");
    if (type === "異뺤젣") earnBadge("festival_visit");
    showCollectionToast(collectionUiText("visit_recorded", { place:name }));
}

function checkBadges() {
    var distKm = totalDistance / 1000;
    if (distKm >= 10) earnBadge("first_10km");
    if (distKm >= 50) earnBadge("first_50km");
    if (memories.length >= 1) earnBadge("first_memory");
    if (memories.length >= 5) earnBadge("memory_5");
    if (photos.length >= 1) earnBadge("first_photo");
    if (photos.length >= 10) earnBadge("photo_10");
    var hour = new Date().getHours();
    if (isRecording && hour < 5) earnBadge("early_bird");
    checkWearableMissions();
}

function checkWearableMissions() {
    if (!collectionLoaded || !Array.isArray(items)) return 0;
    var unlocked = [];
    GILO_WEARABLE_CATALOG.forEach(function(def) {
        if (items.some(function(item) { return item && String(item.id) === def.id; })) return;
        if (getWearableMetricValue(def) < def.target) return;
        var now = new Date();
        items.push({
            id:def.id, wearable:true, slot:def.slot, sheet:def.sheet, sheetIndex:def.sheetIndex,
            earnedAt:now.getTime(), dateString:now.toLocaleDateString("ko-KR"), source:"gilo-wearable-mission-v1",
            missionMetric:def.metric, missionTarget:def.target
        });
        unlocked.push(def);
    });
    if (!unlocked.length) return 0;
    saveCollection(); updateItemList();
    var first = getWearableMissionText(unlocked[0]);
    var suffix = unlocked.length > 1 ? " +" + (unlocked.length - 1) : "";
    showCollectionToast(first.name + suffix);
    showGiloReaction("item", "", { force:true, reward:first.name + suffix });
    return unlocked.length;
}

function updateBadgeList() {
    updateItemList();
}

function grantTesterSproutGift() {
    if (items.some(function(item) { return item && item.id === TESTER_SPROUT_ITEM_ID; })) return false;
    if (!safeStorageGet(TESTER_ELIGIBILITY_KEY)) return false;
    var now = new Date();
    items.push({
        id: TESTER_SPROUT_ITEM_ID,
        name: "길로아의 새싹",
        description: "출시 전부터 길로아의 새싹을 지켜봐 준 테스터에게 드리는 한정 증표예요.",
        image: TESTER_SPROUT_IMAGE,
        imagePosition: "center",
        earnedAt: now.getTime(),
        dateString: now.toLocaleDateString("ko-KR"),
        source: "prelaunch-tester",
        limited: true
    });
    saveCollection();
    setTimeout(function() {
        showCollectionToast(collectionUiText("gift_arrived"));
        showGiloReaction("item", "", { force:true, reward:collectionUiText("sprout_name") });
    }, 1400);
    return true;
}

function enrollPrelaunchTesterIfOpen() {
    if (window.GILOA_TESTER_ENROLLMENT_OPEN !== true) return false;
    if (safeStorageGet(TESTER_ELIGIBILITY_KEY)) return true;
    safeStorageSet(TESTER_ELIGIBILITY_KEY, JSON.stringify({ enrolledAt:Date.now(), cohort:"prelaunch-2026" }));
    persistDurableStorageSnapshot();
    return true;
}

function getTourItemId(item) {
    return String(item && (item.contentid || item.contentId || item.id || item.title) || "");
}
function getVisitDateKey() { return getDailyTaskDate(); }
function completeExperience(item, method) {
    if (!item) return false;
    var id = getTourItemId(item);
    var key = id + ":" + getVisitDateKey();
    if (!id || completedVisitKeys.has(key) || visitStamps.some(function(v) { return v.visitKey === key; })) return false;
    var lat = parseFloat(item.mapy !== undefined ? item.mapy : item.lat);
    var lng = parseFloat(item.mapx !== undefined ? item.mapx : item.lng);
    var title = getTourDisplayTitle(item) || item.title || collectionUiText("nearby_place");
    var now = new Date();
    visitStamps.push({ name: title, type: getTourTypeName(item.contenttypeid), lat: lat, lng: lng, visitedAt: now.getTime(), dateString: now.toLocaleDateString("ko-KR"), visitKey: key, method: method });
    completedVisitKeys.add(key);
    saveCollection(); updateVisitList(); earnBadge("tour_visit"); updateDailyMissions(); syncRpgGrowth();
    showCollectionToast(collectionUiText("visit_recorded", { place:title }));
    showDiscoveryReward({ placeName: title, placeSource: item, method: method, rewardTextKey: "experience_reward", itemNameKey: "travel_stamp" });
    updateJourneyHud();
    return true;
}
function checkNearbyVisitCompletion(options) {
    options = options || {};
    if (!currentPos || currentAccuracy > 50) return false;
    var nearby = (tourItems || []).concat(festivalItems || []).filter(function(item) {
        var point = getImageMissionLatLng(item);
        return point && currentPos.distanceTo(point) <= AUTO_VISIT_RADIUS_M;
    }).sort(function(a, b) { return currentPos.distanceTo(getImageMissionLatLng(a)) - currentPos.distanceTo(getImageMissionLatLng(b)); })[0];
    if (!nearby) { visitCandidate = { contentId: "", enteredAt: 0, item: null }; return false; }
    var id = getTourItemId(nearby);
    if (visitCandidate.contentId !== id) visitCandidate = { contentId: id, enteredAt: Date.now(), item: nearby };
    var stayedLongEnough = Date.now() - visitCandidate.enteredAt >= AUTO_VISIT_REQUIRED_MS;
    if (options.method === "photo" || stayedLongEnough) return completeExperience(nearby, options.method === "photo" ? "photo" : "stay");
    return false;
}

function showDiscoveryReward(options) {
    options = options || {};
    var toast = document.getElementById("discovery-toast");
    if (!toast) return;
    setDiscoveryGiloImage("discovery");
    if (discoveryRewardTimer) { clearTimeout(discoveryRewardTimer); discoveryRewardTimer = null; }
    activeDiscoveryRewardOptions = options;
    renderDiscoveryRewardText();
    toast.classList.remove("show"); void toast.offsetWidth; toast.classList.add("show"); toast.setAttribute("aria-hidden", "false");
    discoveryRewardTimer = setTimeout(function() { toast.classList.remove("show"); toast.setAttribute("aria-hidden", "true"); discoveryRewardTimer = null; }, 5200);
}
function renderDiscoveryRewardText() {
    var options = activeDiscoveryRewardOptions || {};
    var toast = document.getElementById("discovery-toast");
    if (!toast) return;
    var kicker = toast.querySelector(".discovery-kicker");
    if (kicker) kicker.textContent = collectionUiText("discovery");
    document.getElementById("discovery-place-name").textContent = options.placeSource ? getTourDisplayTitle(options.placeSource) : (options.placeName || collectionUiText("new_place"));
    document.getElementById("discovery-method").textContent = collectionUiText(options.method === "photo" ? "photo_complete" : "stay_complete");
    document.getElementById("discovery-reward").textContent = [options.rewardTextKey ? collectionUiText(options.rewardTextKey) : options.rewardText, options.itemNameKey ? collectionUiText(options.itemNameKey) : options.itemName].filter(Boolean).join(" · ");
}
function getTourMarkerState(item, nearbyIndex) {
    var id = getTourItemId(item); var todayPrefix = id + ":";
    var visited = visitStamps.some(function(v) { return v.visitKey && v.visitKey.indexOf(todayPrefix) === 0; });
    var point = getImageMissionLatLng(item); var distance = currentPos && point ? currentPos.distanceTo(point) : Infinity;
    var selected = !!selectedDestination && point && L.latLng(selectedDestination.lat, selectedDestination.lng).distanceTo(point) < 2;
    return { visited: visited, selected: selected, nearby: !visited && nearbyIndex < 3 && distance <= 300, discoverable: !visited && distance <= 80, missionAvailable: !!activeImageMission && activeImageMission.item === item };
}
function triggerRecentPathPulse(lat, lng) {
    recentDiscoveryPulse = { startedAt: Date.now(), lat: lat, lng: lng };
    var point = map.latLngToContainerPoint([lat, lng]); var pulse = document.createElement("div"); pulse.className = "recent-path-pulse"; pulse.style.left = (point.x - 6) + "px"; pulse.style.top = (point.y - 6) + "px"; document.getElementById("map-wrap").appendChild(pulse); setTimeout(function() { pulse.remove(); }, 1050); scheduleRender();
}
function getLocalDateKey(value) {
    var date = new Date(Number(value));
    if (isNaN(date.getTime())) return "";
    return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
}
function getTodayJourneySummary() {
    var today = getDailyTaskDate(); var todayVisits = visitStamps.filter(function(v) { return getLocalDateKey(v.visitedAt) === today; });
    var todayPhotos = photos.filter(function(p) { return getLocalDateKey(p.time) === today; });
    var todayMemories = memories.filter(function(m) { return getLocalDateKey(m.time) === today; });
    return { distance: calcTodayDistance(), visits: todayVisits, photos: todayPhotos, memories:todayMemories, latest: todayVisits.length ? todayVisits.slice().sort(function(a,b){return b.visitedAt-a.visitedAt;})[0] : null };
}
function renderTodayJourneyRecap() {
    var recap = document.getElementById("journey-recap"); if (!recap) return;
    var summary = getTodayJourneySummary(); var growth = loadTodayGrowth(); var words = getRpgText();
    var topKey = RPG_STAT_KEYS.slice().sort(function(a,b) { return Number(growth.stats[b] || 0) - Number(growth.stats[a] || 0); })[0];
    var topAmount = Number(growth.stats[topKey]) || 0;
    document.getElementById("journey-recap-distance").textContent = (summary.distance / 1000).toFixed(1) + " km";
    document.getElementById("journey-recap-visits").textContent = summary.visits.length;
    document.getElementById("journey-recap-photos").textContent = summary.photos.length;
    document.getElementById("journey-recap-memories").textContent = summary.memories.length;
    document.getElementById("journey-recap-date").textContent = new Date().toLocaleDateString(currentLang || "ko", { year:"numeric", month:"long", day:"numeric", weekday:"long" });
    document.getElementById("journey-recap-trait").textContent = (words.stats[topKey] || RPG_STAT_LABELS[topKey]) + " +" + topAmount;
    document.getElementById("journey-recap-message").textContent = collectionUiText("recap_" + topKey);
    var image = document.getElementById("journey-recap-gilo"); if (image) image.src = encodeURI(GILO_SCENE_IMAGES.trip_end);
}
function showTodayJourneyRecap() {
    var recap = document.getElementById("journey-recap"); if (!recap) return;
    renderTodayJourneyRecap();
    recap.classList.add("open"); recap.setAttribute("aria-hidden", "false"); document.body.classList.add("journey-recap-opened");
    if (isHudExpanded) toggleHud();
}
function hideTodayJourneyRecap() { var recap = document.getElementById("journey-recap"); if (!recap) return; recap.classList.remove("open"); recap.setAttribute("aria-hidden", "true"); document.body.classList.remove("journey-recap-opened"); }
function openTodayRouteFromRecap() { hideTodayJourneyRecap(); showTodayWalkingRoute(); }
function getExplorationStreak() {
    var days = new Set(visitStamps.map(function(v) { return new Date(v.visitedAt).toISOString().slice(0,10); })); var streak = 0; var day = new Date();
    while (days.has(day.toISOString().slice(0,10))) { streak += 1; day.setDate(day.getDate() - 1); } return streak;
}
function updateJourneyHud() {
    var summary = getTodayJourneySummary(); var stats = document.getElementById("journey-hud-stats"); var latest = document.getElementById("journey-hud-latest"); var t = UI_TEXT[currentLang] || UI_TEXT.ko;
    var kicker = document.querySelector(".journey-hud-kicker"); if (kicker) kicker.textContent = t.journey_kicker;
    if (stats) stats.textContent = formatUiTemplate(t.journey_stats, {distance:(summary.distance / 1000).toFixed(1),visits:summary.visits.length,photos:summary.photos.length,streak:getExplorationStreak()});
    if (latest) latest.textContent = summary.latest ? formatUiTemplate(t.journey_latest,{place:getVisitDisplayName(summary.latest)}) : t.journey_empty;
    renderDailyTravelLog(summary);
}
function renderDailyTravelLog(summary) {
    var card = document.getElementById("daily-travel-log"); if (!card) return; var hasData = summary.distance > 0 || summary.visits.length || summary.photos.length; card.hidden = !hasData; if (!hasData) return;
    var t = UI_TEXT[currentLang] || UI_TEXT.ko;
    document.getElementById("daily-travel-log-date").textContent = new Date().toLocaleDateString(currentLang, { year:"numeric", month:"long", day:"numeric" });
    document.getElementById("daily-travel-log-stats").textContent = formatUiTemplate(t.journey_log_stats,{distance:(summary.distance/1000).toFixed(1),visits:summary.visits.length,photos:summary.photos.length,stays:stayBonusPlaces.length});
    document.getElementById("daily-travel-log-places").textContent = summary.visits.length ? formatUiTemplate(t.journey_log_places,{places:summary.visits.slice(0,3).map(getVisitDisplayName).join(" · ")}) : t.journey_log_wait;
}
function completeDailyTask(taskId, reward) {
    var state = loadDailyTaskState(); state.rewarded = state.rewarded || []; if (state.rewarded.indexOf(taskId) >= 0) return false; state.rewarded.push(taskId); safeStorageSet(DAILY_TASK_KEY, JSON.stringify(state));
    // 누적값은 새 장비 미션용 보조 기록이다. 기존 하루치 미션 상태는 그대로 유지한다.
    safeStorageSet(DAILY_TASK_TOTAL_KEY, String(Math.max(0, Number(safeStorageGet(DAILY_TASK_TOTAL_KEY)) || 0) + 1));
    completedTaskEffects.add(taskId); setTimeout(function(){ completedTaskEffects.delete(taskId); }, 1200); showGiloReaction(state.rewarded.length >= 3 ? "daily" : "mission", "", { force:true, reward:"+" + reward + " EXP" }); checkWearableMissions(); return true;
}
function updateTimeAtmosphere() {
    var overlay = document.getElementById("time-atmosphere"); if (!overlay) return; var hour = new Date().getHours(); var period = hour >= 4 && hour < 7 ? "dawn" : hour >= 7 && hour < 17 ? "day" : hour >= 17 && hour < 20 ? "sunset" : "night"; overlay.className = period;
}


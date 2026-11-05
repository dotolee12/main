const RPG_GROWTH_KEY = "giloa-rpg-growth-v1";
// 장비 상태는 기존 수집함(giloa-collection)과 분리한다. v1의 단일 장착값은
// 최초 로드할 때 v2의 relic 슬롯으로 안전하게 옮겨 기존 사용자의 선택을 보존한다.
const GILO_EQUIPMENT_KEY = "giloa-gilo-equipment-v2";
const GILO_EQUIPMENT_LEGACY_KEY = "giloa-gilo-equipment-v1";
const GILO_LEVEL_IMAGE_BASE = "./gilo%20many%20appearance/";
const GILO_WEARABLE_SHEET_BASE = "./assets/gilo-wearables/sheets/";
const GILO_FITTED_WEARABLE_SHEETS = {
    "01-footwear-10.png":"./assets/gilo-wearables/fitted/01-footwear-fitted-v2.png",
    "02-bottoms-10.png":"./assets/gilo-wearables/fitted/02-bottoms-fitted-v2.png",
    "03-tops-10.png":"./assets/gilo-wearables/fitted/03-tops-fitted-v2.png",
    "04-headwear-10.png":"./assets/gilo-wearables/fitted/04-headwear-fitted-v2.png",
    "05-wrist-and-hand-10.png":"./assets/gilo-wearables/fitted/05-wrist-fitted-v2.png",
    "06-eyewear-10.png":"./assets/gilo-wearables/fitted/06-eyewear-fitted-v2.png"
};
const GILO_WEARABLE_SLOTS = ["footwear", "bottoms", "tops", "headwear", "wrist", "eyewear", "bags", "cape", "neck", "relic"];
const GILO_WEARABLE_SLOT_I18N = {
    ko:{footwear:"신발",bottoms:"하의",tops:"상의",headwear:"모자",wrist:"팔찌",eyewear:"안경",bags:"가방",cape:"망토",neck:"목걸이",relic:"여행 소품"},
    en:{footwear:"Footwear",bottoms:"Bottoms",tops:"Tops",headwear:"Headwear",wrist:"Wrist",eyewear:"Eyewear",bags:"Bags",cape:"Capes",neck:"Neckwear",relic:"Travel gear"},
    ja:{footwear:"くつ",bottoms:"ボトムス",tops:"トップス",headwear:"帽子",wrist:"ブレスレット",eyewear:"メガネ",bags:"バッグ",cape:"マント",neck:"ネックレス",relic:"旅の小物"},
    zh:{footwear:"鞋子",bottoms:"下装",tops:"上装",headwear:"帽子",wrist:"手链",eyewear:"眼镜",bags:"包",cape:"斗篷",neck:"颈饰",relic:"旅行小物"}
};
const GILO_WEARABLE_METRIC_I18N = {
    ko:{distance:"걸음",photos:"사진",memories:"기억",visits:"장소 방문",stays:"머문 장소",badges:"뱃지",level:"길로 레벨",dailyTasks:"일일 미션"},
    en:{distance:"walking",photos:"photos",memories:"memories",visits:"place visits",stays:"stayed places",badges:"badges",level:"Gilo level",dailyTasks:"daily missions"},
    ja:{distance:"歩き",photos:"写真",memories:"思い出",visits:"場所訪問",stays:"滞在した場所",badges:"バッジ",level:"ギロレベル",dailyTasks:"デイリーミッション"},
    zh:{distance:"步行",photos:"照片",memories:"回忆",visits:"地点访问",stays:"停留地点",badges:"徽章",level:"Gilo等级",dailyTasks:"每日任务"}
};
const GILO_WEARABLE_GROUPS = [
    { slot:"footwear", sheet:"01-footwear-10.png", metric:"distance", values:[500,1000,2000,3500,5000,8000,12000,20000,35000,50000], names:["별빛 산책화","이슬길 운동화","지도길 부츠","노을 트레킹화","숲길 샌들","바다빛 워커","달빛 등산화","구름 러너","혜성 장화","대장정 부츠"] },
    { slot:"bottoms", sheet:"02-bottoms-10.png", metric:"photos", values:[1,2,3,5,8,12,18,25,35,50], names:["첫 기록 하의","프레임 반바지","풍경 조거팬츠","엽서 치마","탐험 카고팬츠","필름 데님","숲빛 레깅스","노을 와이드팬츠","별무늬 팬츠","여행가 바지"] },
    { slot:"tops", sheet:"03-tops-10.png", metric:"memories", values:[1,2,3,5,8,12,18,25,35,50], names:["첫 이야기 셔츠","기억 조끼","낙서 맨투맨","우체국 재킷","책갈피 가디건","지도 후드","밤하늘 니트","여행 셔츠","별자리 재킷","기록가 코트"] },
    { slot:"headwear", sheet:"04-headwear-10.png", metric:"visits", values:[1,2,3,5,8,12,18,25,35,50], names:["첫 발걸음 모자","골목 캡","공원 버킷햇","시장 베레모","전망대 모자","박물관 페도라","축제 화관","산책 탐험모","별빛 왕관","대동여지도 모자"] },
    { slot:"wrist", sheet:"05-wrist-and-hand-10.png", metric:"dailyTasks", values:[1,2,3,5,8,12,18,25,35,50], names:["약속 팔찌","한 걸음 밴드","사진가 손목띠","기억 매듭","여행 시계","친구 팔찌","탐험가 장갑","별조각 팔찌","나침반 커프","모험 완주 팔찌"] },
    { slot:"eyewear", sheet:"06-eyewear-10.png", metric:"stays", values:[1,2,3,4,5,6,8,10,12,15], names:["쉬어가는 안경","카페 투명 안경","창가 선글라스","도서관 안경","비오는날 고글","야경 안경","풍경 렌즈","여행 필터 안경","별빛 고글","머무름 단안경"] },
    { slot:"bags", sheet:"07-bags-and-back-10.png", metric:"badges", values:[1,2,3,5,8,12,18,25,35,50], names:["첫 여행 가방","스탬프 파우치","지도 크로스백","사진가 백팩","시장 장바구니","산길 배낭","기억 보관함","별가루 가방","도시 탐험 배낭","대여정 트렁크"] },
    { slot:"cape", sheet:"08-capes-and-tail-10.png", metric:"level", values:[2,4,6,8,10,13,16,20,25,30], names:["새내기 망토","길잡이 숄","산들바람 망토","노을 케이프","여행자 망토","별빛 케이프","푸른 혜성 망토","수호자 망토","전설의 망토","길로아 대망토"] },
    { slot:"neck", sheet:"09-neck-and-chest-10.png", metric:"visits", values:[2,4,6,9,13,18,24,32,42,60], names:["첫 만남 펜던트","골목 목도리","산책 스카프","기록 리본","우정 목걸이","여행 나침반","기억 로켓","밤하늘 브로치","별자리 메달","대동여지도 훈장"] },
    { slot:"relic", sheet:"10-place-rewards-10.png", metric:"distance", values:[1000,3000,6000,10000,15000,25000,40000,60000,80000,100000], names:["출발의 지도","골목 나침반","숲속 랜턴","바다 조개","도시 엽서","산 정상 깃발","축제 리본","별빛 병","여행자의 열쇠","전설의 대동여지도"] }
];
const GILO_WEARABLE_CATALOG = GILO_WEARABLE_GROUPS.reduce(function(all, group) {
    group.names.forEach(function(name, index) {
        all.push({ id:"wearable_" + group.slot + "_" + String(index + 1).padStart(2, "0"), slot:group.slot, sheet:group.sheet, sheetIndex:index, name:name, metric:group.metric, target:group.values[index] });
    });
    return all;
}, []);
const RPG_POINTS_PER_LEVEL = 40;
const RPG_STAT_KEYS = ["exploration", "experience", "memory", "connection", "growth"];
const RPG_STAT_LABELS = { exploration:"탐험", experience:"경험", memory:"기억", connection:"연결", growth:"성장" };
const RPG_TEXT = {
    ko:{stats:{exploration:"탐험",experience:"경험",memory:"기억",connection:"연결",growth:"성장"},beginner:["길을 배우는 여행자","조금씩 나만의 여행 성향을 만들어 가는 중"],traits:{exploration:["개척자","새로운 길과 미지의 장소를 즐기는 여행자"],experience:["문화 여행가","지역의 문화와 경험을 깊게 만나는 여행자"],memory:["세계의 기록자","순간과 이야기를 오래 남기는 여행자"],connection:["길잡이","사람과 지역을 이어 주는 여행자"],growth:["모험가","미션과 도전을 즐기며 전진하는 여행자"]},forming:"성향 형성 중",job:"직업 활성화",next:"다음 레벨까지",max:"최고 레벨 달성",local:"이 기기에 저장된 기록"},
    en:{stats:{exploration:"Exploration",experience:"Experience",memory:"Memory",connection:"Connection",growth:"Growth"},beginner:["Learning Traveler","Your travel style is beginning to take shape"],traits:{exploration:["Pioneer","A traveler drawn to new paths and unknown places"],experience:["Culture Traveler","A traveler who dives into local culture and experiences"],memory:["World Recorder","A traveler who preserves moments and stories"],connection:["Guide","A traveler who connects people and places"],growth:["Adventurer","A traveler who moves forward through missions and challenges"]},forming:"Style forming",job:"Class active",next:"Until next level",max:"Max level reached",local:"Records saved on this device"},
    ja:{stats:{exploration:"探索",experience:"体験",memory:"記憶",connection:"つながり",growth:"成長"},beginner:["旅を学ぶ人","自分らしい旅のスタイルを少しずつ育てています"],traits:{exploration:["開拓者","新しい道と未知の場所を楽しむ旅人"],experience:["文化の旅人","地域の文化と体験を深く味わう旅人"],memory:["世界の記録者","瞬間と物語を長く残す旅人"],connection:["道しるべ","人と地域をつなぐ旅人"],growth:["冒険者","ミッションと挑戦を楽しむ旅人"]},forming:"傾向を形成中",job:"クラス解放",next:"次のレベルまで",max:"最高レベル達成",local:"この端末に保存された記録"},
    zh:{stats:{exploration:"探索",experience:"体验",memory:"记忆",connection:"连接",growth:"成长"},beginner:["学习旅行的人","正在慢慢形成属于自己的旅行风格"],traits:{exploration:["开拓者","喜欢新道路和未知地点的旅行者"],experience:["文化旅行家","深入体验当地文化的旅行者"],memory:["世界记录者","长久保存瞬间与故事的旅行者"],connection:["引路人","连接人与地区的旅行者"],growth:["冒险家","通过任务与挑战不断前进的旅行者"]},forming:"风格形成中",job:"职业已启用",next:"距离下一级",max:"已达到最高等级",local:"保存在此设备上的记录"},
    es:{stats:{exploration:"Exploración",experience:"Experiencia",memory:"Recuerdos",connection:"Conexión",growth:"Crecimiento"},beginner:["Viajero aprendiz","Tu estilo de viaje empieza a tomar forma"],traits:{exploration:["Pionero","Un viajero atraído por caminos nuevos y lugares desconocidos"],experience:["Viajero cultural","Un viajero que se sumerge en la cultura y las experiencias locales"],memory:["Cronista del mundo","Un viajero que conserva momentos e historias"],connection:["Guía","Un viajero que conecta personas y lugares"],growth:["Aventurero","Un viajero que avanza mediante misiones y desafíos"]},forming:"Estilo en formación",job:"Clase activa",next:"Para el siguiente nivel",max:"Nivel máximo alcanzado",local:"Registros guardados en este dispositivo"},
    fr:{stats:{exploration:"Exploration",experience:"Expérience",memory:"Souvenirs",connection:"Lien",growth:"Progression"},beginner:["Voyageur en devenir","Votre style de voyage prend doucement forme"],traits:{exploration:["Pionnier","Un voyageur attiré par les nouveaux chemins et les lieux inconnus"],experience:["Voyageur culturel","Un voyageur qui s’immerge dans la culture et les expériences locales"],memory:["Gardien des souvenirs","Un voyageur qui conserve les instants et les histoires"],connection:["Éclaireur","Un voyageur qui relie les personnes et les lieux"],growth:["Aventurier","Un voyageur qui avance grâce aux missions et aux défis"]},forming:"Style en formation",job:"Classe active",next:"Jusqu’au niveau suivant",max:"Niveau maximum atteint",local:"Souvenirs enregistrés sur cet appareil",toastKicker:"UN MOT DE GILO",toastGrowing:"Votre voyage continue de grandir.",toastReward:"Chaque découverte vécue devient un souvenir.",levelReached:"Niveau {level} atteint !",newStage:"Une nouvelle étape de voyage s’ouvre.",traitChanged:"Style de voyage : {trait}",statGained:"{stat} +{amount}",actionBecameSkill:"Ce que vous venez de faire est devenu une compétence de voyage.",connectionGained:"Lien +{amount}",connectionDetail:"Vous avez rapproché des personnes et des lieux."}
};
function getRpgText() { return RPG_TEXT[currentLang] || RPG_TEXT.ko; }
// The HUD has one official progression model.  Legacy distance/photo levels are
// retained only for old saved data compatibility and are never rendered.
var rpgDetailsOpen = false;
var RPG_HUD_TEXT = {
    ko:{learning:["여행을 배우는 길로","첫 걸음마다 나만의 지도를 채우고 있어요."],forming:["길을 만들어 가는 길로","좋아하는 여행의 모습이 조금씩 드러나고 있어요."],seasoned:["여행색을 찾아가는 길로","나만의 여행 방식이 단단해지고 있어요."],identity:"나만의 여행 정체성",myGilo:"나의 길로",myTravelColor:"나의 여행색",today:"오늘의 여정",distance:"거리",discoveries:"발견",photos:"사진",missions:"미션",detailShow:"자세한 여행색 보기",detailHide:"자세한 여행색 접기",next:"다음 레벨까지",max:"여행 정체성 완성",local:"이 기기에 안전하게 저장됩니다."},
    en:{learning:["Gilo learning to travel","Every first step is filling in your own map."],forming:["Gilo making new paths","The kind of travel you love is beginning to appear."],seasoned:["Gilo finding its travel colors","Your own way of traveling is growing stronger."],identity:"Your travel identity",myGilo:"My Gilo",myTravelColor:"My travel colors",today:"Today’s journey",distance:"Distance",discoveries:"Discoveries",photos:"Photos",missions:"Missions",detailShow:"View travel colors",detailHide:"Hide travel colors",next:"Until next level",max:"Travel identity complete",local:"Saved safely on this device."},
    ja:{learning:["旅を学ぶギロ","最初の一歩から、自分だけの地図が広がります。"],forming:["道をつくるギロ","好きな旅のかたちが少しずつ見えてきます。"],seasoned:["旅の色を探すギロ","自分らしい旅のスタイルが育っています。"],identity:"あなたの旅のアイデンティティ",myGilo:"私のギロ",myTravelColor:"私の旅色",today:"今日の旅",distance:"距離",discoveries:"発見",photos:"写真",missions:"ミッション",detailShow:"旅色の詳細を見る",detailHide:"旅色の詳細を閉じる",next:"次のレベルまで",max:"旅のアイデンティティ完成",local:"この端末に安全に保存されます。"},
    zh:{learning:["学习旅行的 Gilo","每一次迈步都在填满属于你的地图。"],forming:["正在开拓道路的 Gilo","你喜欢的旅行方式正慢慢显现。"],seasoned:["寻找旅行色彩的 Gilo","属于你的旅行方式正变得坚定。"],identity:"你的旅行身份",myGilo:"我的 Gilo",myTravelColor:"我的旅行色彩",today:"今天的旅程",distance:"距离",discoveries:"发现",photos:"照片",missions:"任务",detailShow:"查看旅行色彩",detailHide:"收起旅行色彩",next:"距离下一级",max:"旅行身份已完成",local:"已安全保存在此设备中。"},
    es:{learning:["Gilo aprende a viajar","Cada primer paso llena tu propio mapa."],forming:["Gilo abre nuevos caminos","La forma de viajar que amas empieza a aparecer."],seasoned:["Gilo busca sus colores viajeros","Tu propia manera de viajar se fortalece."],identity:"Tu identidad viajera",myGilo:"Mi Gilo",myTravelColor:"Mis colores de viaje",today:"El viaje de hoy",distance:"Distancia",discoveries:"Descubrimientos",photos:"Fotos",missions:"Misiones",detailShow:"Ver colores de viaje",detailHide:"Ocultar colores de viaje",next:"Hasta el siguiente nivel",max:"Identidad viajera completada",local:"Guardado de forma segura en este dispositivo."},
    fr:{learning:["Gilo apprend à voyager","Chaque premier pas remplit votre propre carte."],forming:["Gilo crée de nouveaux chemins","La manière de voyager que vous aimez commence à apparaître."],seasoned:["Gilo cherche ses couleurs de voyage","Votre façon de voyager se renforce."],identity:"Votre identité de voyage",myGilo:"Mon Gilo",myTravelColor:"Mes couleurs de voyage",today:"Le voyage d’aujourd’hui",distance:"Distance",discoveries:"Découvertes",photos:"Photos",missions:"Missions",detailShow:"Voir les couleurs de voyage",detailHide:"Masquer les couleurs de voyage",next:"Jusqu’au niveau suivant",max:"Identité de voyage accomplie",local:"Enregistré en toute sécurité sur cet appareil."}
};
function getRpgHudText() { return RPG_HUD_TEXT[currentLang] || RPG_HUD_TEXT.ko; }
let dailyTaskPanelOpen = false;
let dailyRouteLayer = null;
let selectedDestination = null;
let selectedVisitMarker = null;
var discoveryRewardTimer = null;
var giloLastReactionAt = 0;

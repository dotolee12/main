var GILO_30_SCENE_BASE = "./gilo many appearance/";
// The 30-scene folder (길로_장면별_30장_PNG) is not in the project yet.
// Each scene number points to an image that exists in "gilo many appearance".
// When the 30 scene images are added later, restore:
//   GILO_30_SCENE_BASE + "길로_장면별_30장_PNG/gilo_scene_" + NN + ".png"
var GILO_30_SCENE_FILES = [
    "gilo-scenes-transparent/01-first-meeting-transparent.png", // 1 first_meeting / welcome_back
    "gilo-actions-transparent/10-map-transparent.png", // 2 find_location
    "gilo-actions-transparent/01-walking-transparent.png", // 3 start_recording
    "gilo-actions-transparent/02-running-transparent.png", // 4 first_walk
    "gilo-emotions-transparent/12-surprised-transparent.png", // 5 first_path_reveal
    "gilo-emotions-transparent/11-curious-transparent.png", // 6 free_exploration
    "gilo-emotions-transparent/22-happy-transparent.png", // 7 place_discovered
    "gilo-actions-transparent/09-explaining-transparent.png", // 8 destination_suggested
    "gilo-actions-transparent/03-jumping-transparent.png", // 9 approaching_place
    "gilo-actions-transparent/05-clapping-transparent.png", // 10 place_arrived
    "gilo-actions-transparent/11-photo-transparent.png", // 11 photo_suggest
    "gilo-emotions-transparent/05-wink-transparent.png", // 12 photo_saved
    "gilo-actions-transparent/16-memo-transparent.png", // 13 memory_saved
    "gilo-actions-transparent/22-coffee-transparent.png", // 14 long_stay
    "gilo-scenes-transparent/03-special-scene-transparent.png", // 15 mission_found
    "gilo-actions-transparent/06-thumbs-up-transparent.png", // 16 mission_complete
    "gilo-daily-transparent/25-v-pose-transparent.png", // 17 daily_complete
    "gilo-actions-transparent/12-pickup-item-transparent.png", // 18 item_discovered
    "gilo-actions-transparent/14-give-gift-transparent.png", // 19 treasure_open
    "gilo-actions-transparent/13-store-item-transparent.png", // 20 item_obtained
    "gilo-emotions-transparent/23-hopeful-transparent.png", // 21 hidden_mission_found
    "gilo-emotions-transparent/04-burst-laugh-transparent.png", // 22 hidden_mission_complete
    "gilo-emotions-transparent/17-confident-transparent.png", // 23 level_up
    "gilo-emotions-transparent/08-moved-transparent.png", // 24 badge_obtained
    "gilo-daily-transparent/14-window-view-transparent.png", // 25 rainy_day
    "gilo-daily-transparent/21-snowman-transparent.png", // 26 snow_day
    "gilo-scenes-transparent/02-loading-transparent.png", // 27 night_exploration
    "gilo-emotions-transparent/21-worried-transparent.png", // 28 lost_direction
    "gilo-actions-transparent/24-resting-transparent.png", // 29 rest_break
    "gilo-emotions-transparent/24-grateful-transparent.png" // 30 trip_end / thank_you
];
function getGilo30Scene(number) { return GILO_30_SCENE_BASE + (GILO_30_SCENE_FILES[number - 1] || GILO_30_SCENE_FILES[0]); }
// Scene assets progressively replace the legacy random reaction pool. A missing
// scene is never substituted with another illustration.
var GILO_SCENE_IMAGES = {
    first_meeting:getGilo30Scene(1), find_location:getGilo30Scene(2), start_recording:getGilo30Scene(3), first_walk:getGilo30Scene(4), first_path_reveal:getGilo30Scene(5),
    free_exploration:getGilo30Scene(6), place_discovered:getGilo30Scene(7), destination_suggested:getGilo30Scene(8), approaching_place:getGilo30Scene(9), place_arrived:getGilo30Scene(10),
    photo_suggest:getGilo30Scene(11), photo_saved:getGilo30Scene(12), memory_saved:getGilo30Scene(13), long_stay:getGilo30Scene(14), mission_found:getGilo30Scene(15), mission_complete:getGilo30Scene(16), daily_complete:getGilo30Scene(17),
    item_discovered:getGilo30Scene(18), treasure_open:getGilo30Scene(19), item_obtained:getGilo30Scene(20), hidden_mission_found:getGilo30Scene(21), hidden_mission_complete:getGilo30Scene(22), level_up:getGilo30Scene(23), badge_obtained:getGilo30Scene(24),
    rainy_day:getGilo30Scene(25), snow_day:getGilo30Scene(26), night_exploration:getGilo30Scene(27), lost_direction:getGilo30Scene(28), rest_break:getGilo30Scene(29), trip_end:getGilo30Scene(30), welcome_back:getGilo30Scene(1), thank_you:getGilo30Scene(30)
};
var GILO_REACTION_SCENES = {
    photo:["photo_suggest","photo_saved","memory_saved"], memory:["memory_saved","long_stay","rest_break"],
    mission:["mission_found","mission_complete","item_obtained"], daily:["daily_complete","level_up","trip_end"],
    discovery:["free_exploration","place_discovered","approaching_place","place_arrived"], item:["item_discovered","treasure_open","item_obtained"], badge:["item_discovered","treasure_open","badge_obtained"],
    level:["level_up","badge_obtained","thank_you"], welcome:["first_meeting","welcome_back","free_exploration"]
};
var giloReactionSceneIndex = {};
var giloMissingSceneWarnings = {};
var GILO_REACTION_TEXT = {
    ko:{photo:["사진을 남겼구나!","이 순간도 여행의 기억이 됐어."],memory:["기억 하나가 더 생겼어!","나중에 다시 보면 분명 반가울 거야."],mission:["미션 완료!","오늘도 한 걸음 성장했어."],daily:["오늘의 할 일 완료!","정말 멋져. 오늘의 여행을 모두 채웠어!"],badge:["새로운 업적이야!","네 여행이 특별한 기록을 만들었어."],level:["레벨 업!","함께 걸어온 길이 이렇게 커졌어."],discovery:["새로운 곳을 발견했어!","지도에 또 하나의 이야기가 생겼어."],welcome:["다시 만나서 반가워!","오늘은 어떤 길을 만나게 될까?"]},
    en:{photo:["Photo saved!","This moment is now part of your journey."],memory:["A new memory!","It will be wonderful to revisit someday."],mission:["Mission complete!","You grew another step today."],daily:["Today's tasks complete!","Wonderful—you filled today's journey."],badge:["A new achievement!","Your travels created something special."],level:["Level up!","Look how far our journey has grown."],discovery:["A new discovery!","Your map has another story."],welcome:["Great to see you again!","What path will we find today?"]},
    ja:{photo:["写真を残したね！","この瞬間も旅の記憶になったよ。"],memory:["新しい記憶が増えたよ！","いつか見返すのが楽しみだね。"],mission:["ミッション完了！","今日も一歩成長したね。"],daily:["今日のタスク完了！","すごい！今日の旅を全部満たしたよ。"],badge:["新しい実績だよ！","君の旅が特別な記録を作ったね。"],level:["レベルアップ！","一緒に歩いた道がこんなに広がったよ。"],discovery:["新しい場所を発見！","地図にまた物語が増えたよ。"],welcome:["また会えてうれしい！","今日はどんな道に出会えるかな？"]},
    zh:{photo:["照片保存好了！","这一刻也成为旅行记忆了。"],memory:["又多了一份记忆！","以后再看一定会很开心。"],mission:["任务完成！","今天也向前成长了一步。"],daily:["今日任务全部完成！","太棒了，今天的旅程已经填满！"],badge:["获得新成就！","你的旅行留下了特别的记录。"],level:["升级了！","我们一起走过的路越来越长了。"],discovery:["发现了新地点！","地图上又多了一个故事。"],welcome:["很高兴再次见到你！","今天会遇见怎样的道路呢？"]},
    es:{photo:["¡Foto guardada!","Este momento ya forma parte de tu viaje."],memory:["¡Un recuerdo nuevo!","Será bonito volver a verlo algún día."],mission:["¡Misión completada!","Hoy has crecido un paso más."],daily:["¡Tareas de hoy completadas!","Genial: has llenado el viaje de hoy."],badge:["¡Nuevo logro!","Tu viaje ha creado un recuerdo especial."],level:["¡Subiste de nivel!","Mira cuánto ha crecido nuestro viaje."],discovery:["¡Nuevo lugar descubierto!","Tu mapa tiene una historia más."],welcome:["¡Qué alegría volver a verte!","¿Qué camino encontraremos hoy?"]},
    fr:{
        photo:["Photo enregistrée !","Ce moment fait désormais partie de votre voyage."],
        memory:["Un nouveau souvenir !","Ce sera un plaisir de le revoir un jour."],
        mission:["Mission accomplie !","Vous avez encore progressé aujourd’hui."],
        daily:["Les tâches du jour sont terminées !","Bravo, vous avez accompli le voyage d’aujourd’hui."],
        badge:["Un nouveau succès !","Votre voyage a créé un souvenir exceptionnel."],
        level:["Niveau supérieur !","Regardez tout le chemin parcouru ensemble."],
        discovery:["Un nouveau lieu découvert !","Votre carte compte une nouvelle histoire."],
        welcome:["Ravi de vous revoir !","Quel chemin allons-nous découvrir aujourd’hui ?"]
    }
};
function setGiloSceneImage(image, sceneId) {
    if (!image) return false;
    var source = GILO_SCENE_IMAGES[sceneId];
    image.onerror = function() {
        image.hidden = true; image.removeAttribute("src");
        if (!giloMissingSceneWarnings[sceneId]) { console.warn("Missing Gilo scene image:", source || sceneId); giloMissingSceneWarnings[sceneId] = true; }
    };
    if (!source) { image.onerror(); return false; }
    image.hidden = false; image.src = encodeURI(source); image.dataset.scene = sceneId;
    return true;
}
function setDiscoveryGiloImage(type) {
    var image = document.getElementById("discovery-gilo");
    var choices = GILO_REACTION_SCENES[type] || ["free_exploration"];
    if (!Array.isArray(choices)) choices = [choices];
    var index = Number(giloReactionSceneIndex[type]) || 0;
    var sceneId = choices[index % choices.length];
    giloReactionSceneIndex[type] = index + 1;
    return setGiloSceneImage(image, sceneId);
}
function showGiloReaction(type, detail, options) {
    options = options || {}; var now = Date.now();
    if (!options.force && now - giloLastReactionAt < 900) return false;
    giloLastReactionAt = now;
    var toast = document.getElementById("discovery-toast"); if (!toast) return false;
    var words = (GILO_REACTION_TEXT[currentLang] || GILO_REACTION_TEXT.ko)[type] || (GILO_REACTION_TEXT[currentLang] || GILO_REACTION_TEXT.ko).mission;
    setDiscoveryGiloImage(type);
    var kicker = toast.querySelector(".discovery-kicker"); if (kicker) kicker.textContent = earlyUiText("giloEncouragement");
    document.getElementById("discovery-place-name").textContent = options.title || words[0];
    document.getElementById("discovery-method").textContent = detail || words[1];
    document.getElementById("discovery-reward").textContent = options.reward || "";
    if (discoveryRewardTimer) clearTimeout(discoveryRewardTimer);
    toast.classList.remove("show"); void toast.offsetWidth; toast.classList.add("show"); toast.setAttribute("aria-hidden", "false");
    discoveryRewardTimer = setTimeout(function() { toast.classList.remove("show"); toast.setAttribute("aria-hidden", "true"); discoveryRewardTimer = null; }, options.duration || 5200);
    return true;
}
function preloadGiloReactionImages() { preloadGiloSceneImages(); }
function preloadGiloSceneImages() { Object.keys(GILO_SCENE_IMAGES).forEach(function(sceneId) { var image = new Image(); image.onerror = function() { if (!giloMissingSceneWarnings[sceneId]) { console.warn("Missing Gilo scene image:", GILO_SCENE_IMAGES[sceneId]); giloMissingSceneWarnings[sceneId] = true; } }; image.src = encodeURI(GILO_SCENE_IMAGES[sceneId]); }); }
var recentDiscoveryPulse = { startedAt: 0, lat: null, lng: null };
var completedTaskEffects = new Set();
let lastPhotoMarkerSize = null;
let heicLoaderPromise = null;
var pendingPhotoLocationChoice = null;
var pendingPhotoMapClickHandler = null;
var photoLocationPermissionPromise = null;
var pendingCameraCaptureLocation = null;
var pendingCameraCaptureDate = null;
const recBtn = document.getElementById("rec-btn");
const recStatusBox = document.getElementById("rec-status-box");

// 吏??珥덇린??

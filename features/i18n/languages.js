var currentLang = "ko";

function getVarcoLang(lang) { return ({ ko: "ko", en: "en", ja: "ja", zh: "zh", es: "es", fr: "fr" })[lang] || "en"; }
function getGoogleLang(lang) { return ({ ko: "ko", en: "en", ja: "ja", zh: "zh-CN", es: "es", fr: "fr" })[lang] || "en"; }

function googleTranslate(text, sourceLang, targetLang) {
    if (!text) return Promise.resolve("");
    if (normalizeLang(sourceLang) === normalizeLang(targetLang)) return Promise.resolve(text);
    var url = "https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&sl=" + encodeURIComponent(sourceLang || "ko") + "&tl=" + encodeURIComponent(getGoogleLang(targetLang)) + "&q=" + encodeURIComponent(text);
    return fetch(url).then(function(res) { return res.json(); }).then(function(data) {
        if (Array.isArray(data) && Array.isArray(data[0])) return data[0].map(function(part) { return part && part[0] ? part[0] : ""; }).join("") || text;
        return text;
    });
}

var translateMemoryCache = Object.create(null);
var translatePendingCache = Object.create(null);
var TRANSLATE_CACHE_KEY = "giloa-api-translations-v1";
var TRANSLATE_CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
var translateSavedRecords = null;
function loadTranslateCache() {
    if (translateSavedRecords) return;
    try {
        var saved = JSON.parse(localStorage.getItem(TRANSLATE_CACHE_KEY) || "[]");
        translateSavedRecords = Array.isArray(saved) ? saved.filter(function(row) {
            var age = row && Date.now() - Number(row.savedAt);
            return row && typeof row.key === "string" && typeof row.value === "string" && row.value && age >= 0 && age < TRANSLATE_CACHE_MAX_AGE_MS;
        }).slice(-500) : [];
    } catch (_) { translateSavedRecords = []; }
    translateSavedRecords.forEach(function(row) { translateMemoryCache[row.key] = row.value; });
}
function saveTranslateCache(key, value) {
    translateMemoryCache[key] = value;
    translateSavedRecords = translateSavedRecords.filter(function(row) { return row.key !== key; });
    translateSavedRecords.push({ key:key, value:value, savedAt:Date.now() });
    if (translateSavedRecords.length > 500) {
        var removed = translateSavedRecords.shift();
        delete translateMemoryCache[removed.key];
    }
    var serialized = JSON.stringify(translateSavedRecords);
    while (serialized.length > 128 * 1024 && translateSavedRecords.length > 1) {
        delete translateMemoryCache[translateSavedRecords.shift().key];
        serialized = JSON.stringify(translateSavedRecords);
    }
    writeApiCacheStorage(TRANSLATE_CACHE_KEY, serialized);
}
function getTranslateCacheKey(text, sourceLang, targetLang) {
    return [sourceLang || "ko", targetLang || "en", text || ""].join("|");
}
function varcoTranslate(text, sourceLang, targetLang) {
    if (!text) return Promise.resolve("");
    if (normalizeLang(sourceLang) === normalizeLang(targetLang)) return Promise.resolve(text);
    loadTranslateCache();
    var cacheKey = getTranslateCacheKey(text, sourceLang, targetLang);
    var saved = translateSavedRecords.find(function(row) { return row.key === cacheKey; });
    if (saved && Date.now() - saved.savedAt >= TRANSLATE_CACHE_MAX_AGE_MS) delete translateMemoryCache[cacheKey];
    if (translateMemoryCache[cacheKey]) return Promise.resolve(translateMemoryCache[cacheKey]);
    if (translatePendingCache[cacheKey]) return translatePendingCache[cacheKey];
    var pending = requestVarcoTranslation(text, sourceLang, targetLang).then(function(translated) {
        if (typeof translated === "string" && translated && translated !== text) saveTranslateCache(cacheKey, translated);
        return translated;
    }).finally(function() { delete translatePendingCache[cacheKey]; });
    translatePendingCache[cacheKey] = pending;
    return pending;
}
function requestVarcoTranslation(text, sourceLang, targetLang) {
    return googleTranslate(text, sourceLang, targetLang).then(function(translated) {
        return translated;
    }).catch(function() {
        if (!VARCO_API_KEY) return text;
        return fetch(VARCO_TRANSLATE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "openapi_key": VARCO_API_KEY },
        body: JSON.stringify({ TID: "giloa-" + Date.now(), svc: "varco-translation", provider: "content", source_lang: sourceLang, source_text: text, target_lang: targetLang })
        }).then(function(res) { return res.text(); }).then(function(raw) {
            if (/^\s*</.test(raw)) throw new Error("VARCO returned HTML");
            var data = JSON.parse(raw);
            var translated = data.target_text || (data.result && data.result.target_text) || (data.data && data.data.target_text) || (data.output && data.output.text) || text;
            return translated;
        }).catch(function() { return text; });
    });
}

var UI_TEXT = {
    ko: { sidebar_title: "나의 기록", fog_label: "안개 효과", fog_on: "켜짐", fog_off: "꺼짐", tab_memory: "기억", tab_photo: "사진", tab_gpx: "경로", tab_badge: "뱃지", tab_visit: "방문", tab_item: "아이템", rec_idle: "중단됨", rec_active: "기록중", gps_weak: "GPS 약함 ({value}m)", gps_very_weak: "GPS 매우 약함 ({value}m)", stay_bonus_wait: "기록중 - 체류 보너스까지 {value}분", stay_bonus_done: "30분 체류 완료! 레벨 +1 보너스!", empty_memory: "아직 기록이 없습니다.", empty_photo: "아직 사진이 없습니다.", tour_title: "주변 관광지", tour_place_fallback: "관광지", festival_label: "주변 축제", festival_badge: "축제", loading: "검색 중...", empty_tour: "주변 장소가 없습니다", close: "닫기", more: "더보기", next: "다음", start: "시작", previous: "이전", count_suffix: "곳", unit_count: "개", hud_title_label: "현재 칭호", hud_level_label: "LV", hud_dist_label: "이동 거리", hud_memory_label: "기억", hud_photo_label: "사진", hud_next: "다음까지", hud_condition_met: "달성!", hud_no_condition: "조건 없음", hud_max: "최고!", hud_max_level: "최고 레벨!", help_tab_ask: "문의하기", help_tab_info: "설명보기", help_tutorial_replay: "튜토리얼 다시 보기", help_ask_copy: "사용 중 불편한 점이나 건의사항은<br>카카오톡 오픈채팅으로 알려주세요.", help_notice: "저장된 GPX 데이터는 서버로 전송되지 않습니다.<br>모든 기록은 <b>이 기기 안에만</b> 저장되고 보여집니다.", help_link: "카카오톡 오픈채팅", help_record_title: "기록 버튼", help_record_desc: "누르면 GPS 경로 기록을 시작하고 다시 누르면 중단합니다.", help_photo_title: "사진 버튼", help_photo_desc: "갤러리에서 사진을 불러옵니다.", help_memory_title: "기억 버튼", help_memory_desc: "현재 위치에 이름을 붙여 기억으로 저장합니다.", help_location_title: "현재 위치와 특별 장소", help_location_desc: "지도 위 파란 현재 위치 점을 누르면 메모와 함께 특별 장소 핀을 저장할 수 있습니다.", help_status_title: "상태 버튼", help_status_desc: "칭호와 진행 상태를 확인합니다.", help_menu_title: "메뉴 버튼", help_menu_desc: "기억, 사진, 경로 기록을 확인합니다." },
    en: { sidebar_title: "My Records", fog_label: "Fog Effect", fog_on: "On", fog_off: "Off", tab_memory: "Memory", tab_photo: "Photo", tab_gpx: "Route", tab_badge: "Badges", tab_visit: "Visits", tab_item: "Items", rec_idle: "Stopped", rec_active: "Recording", gps_weak: "Weak GPS ({value}m)", gps_very_weak: "Very weak GPS ({value}m)", stay_bonus_wait: "Recording - stay bonus in {value} min", stay_bonus_done: "30 min stay complete! Level +1 bonus!", empty_memory: "No records yet.", empty_photo: "No photos yet.", tour_title: "Nearby Places", tour_place_fallback: "Place", festival_label: "Nearby Festivals", festival_badge: "Festivals", loading: "Searching...", empty_tour: "No nearby places", close: "Close", more: "More", next: "Next", start: "Start", previous: "Back", count_suffix: "places", unit_count: "", hud_title_label: "Current Title", hud_level_label: "LV", hud_dist_label: "Distance", hud_memory_label: "Memories", hud_photo_label: "Photos", hud_next: "Next", hud_condition_met: "Met!", hud_no_condition: "No condition", hud_max: "Max!", hud_max_level: "Max level reached!", help_tab_ask: "Contact", help_tab_info: "Guide", help_tutorial_replay: "Replay Tutorial", help_ask_copy: "Tell us about issues or suggestions<br>through KakaoTalk open chat.", help_notice: "Saved GPX data is not sent to the server.<br>All records are stored and shown <b>only on this device</b>.", help_link: "KakaoTalk Open Chat", help_record_title: "Record Button", help_record_desc: "Tap to start GPS route recording. Tap again to stop.", help_photo_title: "Photo Button", help_photo_desc: "Import photos from your gallery.", help_memory_title: "Memory Button", help_memory_desc: "Name your current location and save it as a memory.", help_location_title: "Current Location & Special Places", help_location_desc: "Tap the blue current-location dot on the map to save a special-place pin with a note.", help_status_title: "Status Button", help_status_desc: "Check your title and progress.", help_menu_title: "Menu Button", help_menu_desc: "View memories, photos, and route records." },
    ja: {},
    zh: {},
    es: {}
};
UI_TEXT.ja = Object.assign({}, UI_TEXT.en);
UI_TEXT.zh = Object.assign({}, UI_TEXT.en);
UI_TEXT.es = Object.assign({}, UI_TEXT.en);
Object.assign(UI_TEXT.ja, {
    sidebar_title: "私の記録", fog_label: "霧の効果", fog_on: "オン", fog_off: "オフ",
    tab_memory: "記憶", tab_photo: "写真", tab_gpx: "ルート", tab_badge: "バッジ", tab_visit: "訪問", tab_item: "アイテム",
    rec_idle: "停止中", rec_active: "記録中", gps_weak: "GPSが弱い ({value}m)", gps_very_weak: "GPSが非常に弱い ({value}m)",
    stay_bonus_wait: "記録中 - 滞在ボーナスまで{value}分", stay_bonus_done: "30分滞在完了！レベル+1ボーナス！",
    empty_memory: "まだ記録がありません。", empty_photo: "まだ写真がありません。",
    tour_title: "周辺観光地", tour_place_fallback: "観光地", festival_label: "周辺の祭り", festival_badge: "祭り",
    loading: "検索中...", empty_tour: "周辺の場所がありません", close: "閉じる", more: "もっと見る",
    next: "次へ", start: "開始", previous: "戻る", count_suffix: "件", unit_count: "個",
    hud_title_label: "現在の称号", hud_level_label: "LV", hud_dist_label: "移動距離", hud_memory_label: "記憶",
    hud_photo_label: "写真", hud_next: "次まで", hud_condition_met: "達成！", hud_no_condition: "条件なし",
    hud_max: "最高！", hud_max_level: "最高レベル！",
    help_tab_ask: "お問い合わせ", help_tab_info: "使い方", help_tutorial_replay: "チュートリアルをもう一度見る",
    help_ask_copy: "ご不便な点やご意見は<br>KakaoTalkオープンチャットでお知らせください。",
    help_notice: "保存されたGPXデータはサーバーへ送信されません。<br>すべての記録は<b>この端末内だけ</b>に保存・表示されます。",
    help_link: "KakaoTalkオープンチャット",
    help_record_title: "記録ボタン", help_record_desc: "押すとGPSルート記録を開始し、もう一度押すと停止します。",
    help_photo_title: "写真ボタン", help_photo_desc: "ギャラリーから写真を読み込みます。",
    help_memory_title: "記憶ボタン", help_memory_desc: "現在地に名前を付けて記憶として保存します。",
    help_location_title: "現在地と特別な場所", help_location_desc: "地図上の青い現在地の点をタップすると、メモ付きの特別な場所のピンを保存できます。",
    help_status_title: "ステータスボタン", help_status_desc: "称号と進行状況を確認します。",
    help_menu_title: "メニューボタン", help_menu_desc: "記憶、写真、ルート記録を確認します。"
});
Object.assign(UI_TEXT.zh, {
    sidebar_title: "我的记录", fog_label: "迷雾效果", fog_on: "开启", fog_off: "关闭",
    tab_memory: "记忆", tab_photo: "照片", tab_gpx: "路线", tab_badge: "徽章", tab_visit: "访问", tab_item: "物品",
    rec_idle: "已停止", rec_active: "记录中", gps_weak: "GPS信号较弱 ({value}m)", gps_very_weak: "GPS信号很弱 ({value}m)",
    stay_bonus_wait: "记录中 - 距离停留奖励还有{value}分钟", stay_bonus_done: "停留30分钟完成！等级+1奖励！",
    empty_memory: "还没有记录。", empty_photo: "还没有照片。",
    tour_title: "周边景点", tour_place_fallback: "景点", festival_label: "周边庆典", festival_badge: "庆典",
    loading: "搜索中...", empty_tour: "附近没有地点", close: "关闭", more: "更多",
    next: "下一步", start: "开始", previous: "返回", count_suffix: "处", unit_count: "个",
    hud_title_label: "当前称号", hud_level_label: "LV", hud_dist_label: "移动距离", hud_memory_label: "记忆",
    hud_photo_label: "照片", hud_next: "距离下一级", hud_condition_met: "已达成！", hud_no_condition: "无条件",
    hud_max: "最高！", hud_max_level: "已达最高等级！",
    help_tab_ask: "联系我们", help_tab_info: "使用说明", help_tutorial_replay: "重新查看教程",
    help_ask_copy: "使用中如有不便或建议，<br>请通过KakaoTalk开放聊天告诉我们。",
    help_notice: "保存的GPX数据不会发送到服务器。<br>所有记录<b>只会保存在此设备中</b>并在此显示。",
    help_link: "KakaoTalk开放聊天",
    help_record_title: "记录按钮", help_record_desc: "点击开始记录GPS路线，再次点击即可停止。",
    help_photo_title: "照片按钮", help_photo_desc: "从相册导入照片。",
    help_memory_title: "记忆按钮", help_memory_desc: "为当前位置命名并保存为记忆。",
    help_location_title: "当前位置与特别地点", help_location_desc: "点击地图上的蓝色当前位置圆点，即可保存带备注的特别地点标记。",
    help_status_title: "状态按钮", help_status_desc: "查看称号和进度。",
    help_menu_title: "菜单按钮", help_menu_desc: "查看记忆、照片和路线记录。"
});
Object.assign(UI_TEXT.es, { map_layer_durunubi:"Rutas oficiales", map_layer_durunubi_source:"Organización de Turismo de Corea · Centro Coreano de Montañismo" });
Object.assign(UI_TEXT.ko, {
    hud_next_short: "다음", daily_tag: "할 일", daily_title: "오늘의 할 일", daily_close: "할 일 닫기", daily_kicker:"오늘의 길로아", daily_copy:"가볍게 걸으며 오늘의 길을 남겨보세요.", daily_reset:"매일 자정에 새로 시작", daily_completed:"완료", daily_mission_walk:"새로운 길 {distance} 걷기", daily_mission_photo:"사진 1장 남기기", daily_mission_visit:"{place} 방문하기", daily_mission_photo_place:"{place}에서 사진 남기기", daily_nearby_place:"주변 장소", journey_kicker:"오늘의 여정", journey_stats:"{distance}km · 발견 {visits}곳 · 사진 {photos}장 · 연속 {streak}일", journey_latest:"최근 발견: {place}", journey_empty:"아직 오늘의 발견이 없어요. 주변에서 새로운 경험을 찾아보세요.", journey_log_stats:"이동 {distance}km · 장소 {visits}곳 · 사진 {photos}장 · 머문 장소 {stays}곳", journey_log_places:"오늘의 발견 · {places}", journey_log_wait:"오늘의 발견을 기다리고 있어요.",
    gpx_format: "GPX", gpx_export: "발걸음 추출", gpx_time: "시간", gpx_recent: "최근", gpx_hour_short: "시간",
    gpx_recent_route: "오늘 기준 최근 {hours}시간 발걸음", gpx_name_placeholder: "발걸음 이름 (예: 한강 산책)",
    gpx_save: "이 발걸음 저장하기", gpx_saved: "저장된 발걸음 열기", gpx_import: "파일에서 불러오기", gpx_empty: "저장된 발걸음이 없습니다.", gpx_showing: "표시 중", gpx_route: "경로", gpx_points: "개 지점", gpx_delete: "삭제"
});
Object.assign(UI_TEXT.en, {
    hud_next_short: "Next", daily_tag: "Tasks", daily_title: "Today's Tasks", daily_close: "Close tasks", daily_kicker:"TODAY WITH GILO", daily_copy:"Take a light walk and leave today's path behind.", daily_reset:"Resets every day at midnight", daily_completed:"complete", daily_mission_walk:"Walk a new {distance} path", daily_mission_photo:"Save 1 photo", daily_mission_visit:"Visit {place}", daily_mission_photo_place:"Take a photo at {place}", daily_nearby_place:"a nearby place", journey_kicker:"Today's Journey", journey_stats:"{distance}km · {visits} discoveries · {photos} photos · {streak}-day streak", journey_latest:"Latest discovery: {place}", journey_empty:"No discoveries today yet. Look around for a new experience.", journey_log_stats:"Distance {distance}km · {visits} places · {photos} photos · {stays} stays", journey_log_places:"Today's discoveries · {places}", journey_log_wait:"Waiting for today's first discovery.",
    gpx_format: "GPX", gpx_export: "Export Route", gpx_time: "Time", gpx_recent: "Recent", gpx_hour_short: "h",
    gpx_recent_route: "Route from the last {hours} hours", gpx_name_placeholder: "Route name (e.g. Riverside walk)",
    gpx_save: "Save This Route", gpx_saved: "Open Saved Routes", gpx_import: "Import from File", gpx_empty: "No saved routes.", gpx_showing: "Shown", gpx_route: "Route", gpx_points: "points", gpx_delete: "Delete"
});
Object.assign(UI_TEXT.ja, {
    hud_next_short: "次まで", daily_tag: "タスク", daily_title: "今日のタスク", daily_close: "タスクを閉じる", daily_kicker:"今日のギロ", daily_copy:"気軽に歩いて、今日の道を残してみよう。", daily_reset:"毎日0時にリセット", daily_completed:"完了", daily_mission_walk:"新しい道を{distance}歩く", daily_mission_photo:"写真を1枚残す", daily_mission_visit:"{place}を訪れる", daily_mission_photo_place:"{place}で写真を残す", daily_nearby_place:"周辺の場所", journey_kicker:"今日の旅", journey_stats:"{distance}km · 発見 {visits}か所 · 写真 {photos}枚 · 連続 {streak}日", journey_latest:"最近の発見：{place}", journey_empty:"今日はまだ発見がありません。周辺で新しい体験を探してみよう。", journey_log_stats:"移動 {distance}km · 場所 {visits}か所 · 写真 {photos}枚 · 滞在 {stays}か所", journey_log_places:"今日の発見 · {places}", journey_log_wait:"今日の発見を待っています。",
    gpx_format: "GPX", gpx_export: "ルートを書き出す", gpx_time: "時間", gpx_recent: "最近", gpx_hour_short: "時間",
    gpx_recent_route: "直近{hours}時間のルート", gpx_name_placeholder: "ルート名（例：川沿いの散歩）",
    gpx_save: "このルートを保存", gpx_saved: "保存したルートを開く", gpx_import: "ファイルから読み込む", gpx_empty: "保存したルートはありません。", gpx_showing: "表示中", gpx_route: "ルート", gpx_points: "地点", gpx_delete: "削除"
});
Object.assign(UI_TEXT.zh, {
    hud_next_short: "下一级", daily_tag: "任务", daily_title: "今日任务", daily_close: "关闭任务", daily_kicker:"今日吉路", daily_copy:"轻松走一走，留下今天的足迹吧。", daily_reset:"每天午夜重新开始", daily_completed:"完成", daily_mission_walk:"探索新的{distance}路线", daily_mission_photo:"记录1张照片", daily_mission_visit:"访问{place}", daily_mission_photo_place:"在{place}拍照", daily_nearby_place:"附近地点", journey_kicker:"今日旅程", journey_stats:"{distance}km · 发现 {visits}处 · 照片 {photos}张 · 连续 {streak}天", journey_latest:"最近发现：{place}", journey_empty:"今天还没有发现。去周边寻找新的体验吧。", journey_log_stats:"移动 {distance}km · 地点 {visits}处 · 照片 {photos}张 · 停留 {stays}处", journey_log_places:"今日发现 · {places}", journey_log_wait:"等待今天的发现。",
    gpx_format: "GPX", gpx_export: "导出路线", gpx_time: "时间", gpx_recent: "最近", gpx_hour_short: "小时",
    gpx_recent_route: "最近{hours}小时的路线", gpx_name_placeholder: "路线名称（例：河边散步）",
    gpx_save: "保存此路线", gpx_saved: "打开已保存路线", gpx_import: "从文件导入", gpx_empty: "没有已保存的路线。", gpx_showing: "显示中", gpx_route: "路线", gpx_points: "个地点", gpx_delete: "删除"
});
Object.assign(UI_TEXT.ko, {
    map_layer_title: "지도 표시", map_layer_library: "도서관", map_layer_restaurant: "음식점",
    map_layer_lodging: "숙박", map_layer_restroom: "화장실", map_layer_parking: "주차장", map_layer_fishing:"낚시터", map_layer_community: "주민회관",
    map_layer_durunubi:"공식 탐방로", map_layer_durunubi_source:"한국관광공사 · 한국등산·트레킹지원센터", map_layer_coming_soon: "준비중"
});
Object.assign(UI_TEXT.en, {
    map_layer_title: "Map Display", map_layer_library: "Library", map_layer_restaurant: "Restaurant",
    map_layer_lodging: "Lodging", map_layer_restroom: "Restroom", map_layer_parking: "Parking", map_layer_fishing:"Fishing spot", map_layer_community: "Community Center",
    map_layer_durunubi:"Official Trails", map_layer_durunubi_source:"Korea Tourism Organization · Korea Mountaineering Support Center", map_layer_coming_soon: "Coming soon"
});
Object.assign(UI_TEXT.ja, {
    map_layer_title: "地図表示", map_layer_library: "図書館", map_layer_restaurant: "飲食店",
    map_layer_lodging: "宿泊", map_layer_restroom: "トイレ", map_layer_parking: "駐車場", map_layer_fishing:"釣り場", map_layer_community: "住民センター",
    map_layer_durunubi:"公式トレイル", map_layer_durunubi_source:"韓国観光公社・韓国登山トレッキング支援センター", map_layer_coming_soon: "準備中"
});
Object.assign(UI_TEXT.zh, {
    map_layer_title: "地图显示", map_layer_library: "图书馆", map_layer_restaurant: "餐厅",
    map_layer_lodging: "住宿", map_layer_restroom: "卫生间", map_layer_parking: "停车场", map_layer_fishing:"钓鱼场", map_layer_community: "社区中心",
    map_layer_durunubi:"官方步道", map_layer_durunubi_source:"韩国观光公社 · 韩国登山徒步支援中心", map_layer_coming_soon: "即将推出"
});
Object.assign(UI_TEXT.ko, {
    special_place: "특별한 장소", special_place_placeholder: "이 장소에 대한 내용을 입력하세요",
    save_pin: "저장", cancel_pin: "취소", empty_pin_note: "내용을 입력해 주세요.", pin_saved: "특별한 장소가 저장되었습니다."
});
Object.assign(UI_TEXT.en, {
    special_place: "Special Place", special_place_placeholder: "Write something about this place",
    save_pin: "Save", cancel_pin: "Cancel", empty_pin_note: "Please enter a note.", pin_saved: "Special place saved."
});
Object.assign(UI_TEXT.ja, {
    special_place: "特別な場所", special_place_placeholder: "この場所について入力してください",
    save_pin: "保存", cancel_pin: "キャンセル", empty_pin_note: "内容を入力してください。", pin_saved: "特別な場所を保存しました。"
});
Object.assign(UI_TEXT.zh, {
    special_place: "特别地点", special_place_placeholder: "请输入关于这个地点的内容",
    save_pin: "保存", cancel_pin: "取消", empty_pin_note: "请输入内容。", pin_saved: "特别地点已保存。"
});
Object.assign(UI_TEXT.ko, {
    help_tab_market: "주변 시세", help_tab_settings:"설정", help_language_title:"언어", focus_location:"현재 위치로 이동", photo_camera:"카메라로 촬영", photo_gallery:"내 기기 사진에서 선택", market_title: "이 지역의 주변 시세",
    market_description: "현재는 예시 가격을 보여주는 시범 기능입니다.",
    market_meal: "식사", market_cafe: "카페", market_necessities: "생필품", market_transport: "교통",
    market_source: "실제 지역별 공공데이터 연동은 추후 적용 예정입니다.",
    market_loading: "주변 시세를 불러오는 중입니다.", market_empty: "현재 지역의 시세 정보가 없습니다.",
    market_updated: "업데이트 날짜", market_current_area: "현재 지역"
});
Object.assign(UI_TEXT.en, {
    help_tab_market: "Local Prices", help_tab_settings:"Settings", help_language_title:"Language", focus_location:"Move to current location", photo_camera:"Take a photo", photo_gallery:"Choose from gallery", market_title: "Local Price Guide",
    market_description: "This shows typical prices in the current area for reference.",
    market_meal: "Meals", market_cafe: "Cafes", market_necessities: "Daily necessities", market_transport: "Transportation",
    market_source: "Reference prices based on public data.",
    market_loading: "Loading local price information.", market_empty: "Price information is not available for this area.",
    market_updated: "Updated", market_current_area: "Current area"
});
Object.assign(UI_TEXT.ja, {
    help_tab_market: "周辺相場", help_tab_settings:"設定", help_language_title:"言語", focus_location:"現在地へ移動", photo_camera:"カメラで撮影", photo_gallery:"アルバムから選択", market_title: "この地域の周辺相場",
    market_description: "現在の地域で一般的に形成されている価格を参考として表示します。",
    market_meal: "食事", market_cafe: "カフェ", market_necessities: "生活必需品", market_transport: "交通",
    market_source: "公共データに基づく参考価格です。",
    market_loading: "周辺相場を読み込んでいます。", market_empty: "現在の地域の相場情報はありません。",
    market_updated: "更新日", market_current_area: "現在の地域"
});
Object.assign(UI_TEXT.zh, {
    help_tab_market: "周边行情", help_tab_settings:"设置", help_language_title:"语言", focus_location:"移动到当前位置", photo_camera:"拍照", photo_gallery:"从相册选择", market_title: "当前地区的周边行情",
    market_description: "显示当前地区通常形成的价格，仅供参考。",
    market_meal: "餐饮", market_cafe: "咖啡", market_necessities: "生活必需品", market_transport: "交通",
    market_source: "基于公共数据的参考价格。",
    market_loading: "正在加载周边行情。", market_empty: "当前地区暂无行情信息。",
    market_updated: "更新日期", market_current_area: "当前地区"
});
Object.assign(UI_TEXT.es, {
    sidebar_title:"Mis registros", fog_label:"Efecto de niebla", fog_on:"Activado", fog_off:"Desactivado", tab_memory:"Recuerdos", tab_photo:"Fotos", tab_gpx:"Ruta", tab_badge:"Insignias", tab_visit:"Visitas", tab_item:"Objetos",
    rec_idle:"Detenido", rec_active:"Grabando", gps_weak:"GPS débil ({value}m)", gps_very_weak:"GPS muy débil ({value}m)", stay_bonus_wait:"Grabando: faltan {value} min para la bonificación por estancia", stay_bonus_done:"¡30 min de estancia! ¡Bonificación de nivel +1!",
    empty_memory:"Aún no hay recuerdos.", empty_photo:"Aún no hay fotos.", tour_title:"Lugares cercanos", tour_place_fallback:"Lugar turístico", festival_label:"Festivales cercanos", festival_badge:"Festivales", loading:"Buscando...", empty_tour:"No hay lugares cercanos",
    close:"Cerrar", more:"Ver más", next:"Siguiente", start:"Empezar", previous:"Atrás", count_suffix:"lugares", unit_count:"", hud_title_label:"Título actual", hud_level_label:"NV", hud_dist_label:"Distancia", hud_memory_label:"Recuerdos", hud_photo_label:"Fotos", hud_next:"Siguiente", hud_condition_met:"¡Cumplido!", hud_no_condition:"Sin condición", hud_max:"¡Máximo!", hud_max_level:"¡Nivel máximo!",
    help_tab_ask:"Contacto", help_tab_info:"Guía", help_tutorial_replay:"Repetir tutorial", help_ask_copy:"Cuéntanos tus problemas o sugerencias<br>mediante el chat abierto de KakaoTalk.", help_notice:"Los datos GPX guardados no se envían al servidor.<br>Todos los registros se guardan y muestran <b>solo en este dispositivo</b>.", help_link:"Chat abierto de KakaoTalk",
    help_record_title:"Botón Grabar", help_record_desc:"Toca para iniciar el registro de la ruta GPS y vuelve a tocar para detenerlo.", help_photo_title:"Botón Foto", help_photo_desc:"Importa fotos desde la galería.", help_memory_title:"Botón Recuerdo", help_memory_desc:"Pon nombre a tu ubicación y guárdala como recuerdo.", help_location_title:"Ubicación actual y lugares especiales", help_location_desc:"Toca el punto azul de tu ubicación para guardar un lugar especial con una nota.", help_status_title:"Botón Estado", help_status_desc:"Consulta tu título y progreso.", help_menu_title:"Botón Menú", help_menu_desc:"Consulta recuerdos, fotos y rutas.",
    hud_next_short:"Siguiente", daily_tag:"Tareas", daily_title:"Tareas de hoy", daily_close:"Cerrar tareas", daily_kicker:"HOY CON GILO", daily_copy:"Da un paseo tranquilo y deja la huella de hoy.", daily_reset:"Se reinicia cada día a medianoche", daily_completed:"completadas", daily_mission_walk:"Recorre {distance} por un camino nuevo", daily_mission_photo:"Guarda 1 foto", daily_mission_visit:"Visita {place}", daily_mission_photo_place:"Haz una foto en {place}", daily_nearby_place:"un lugar cercano",
    journey_kicker:"Viaje de hoy", journey_stats:"{distance}km · {visits} descubrimientos · {photos} fotos · racha de {streak} días", journey_latest:"Último descubrimiento: {place}", journey_empty:"Todavía no hay descubrimientos hoy. Busca una experiencia nueva a tu alrededor.", journey_log_stats:"Distancia {distance}km · {visits} lugares · {photos} fotos · {stays} estancias", journey_log_places:"Descubrimientos de hoy · {places}", journey_log_wait:"Esperando el primer descubrimiento de hoy.",
    gpx_format:"GPX", gpx_export:"Exportar ruta", gpx_time:"Tiempo", gpx_recent:"Reciente", gpx_hour_short:"h", gpx_recent_route:"Ruta de las últimas {hours} horas", gpx_name_placeholder:"Nombre de la ruta (p. ej., paseo junto al río)", gpx_save:"Guardar esta ruta", gpx_saved:"Abrir rutas guardadas", gpx_import:"Importar archivo", gpx_empty:"No hay rutas guardadas.", gpx_showing:"Visible", gpx_route:"Ruta", gpx_points:"puntos", gpx_delete:"Eliminar",
    map_layer_title:"Capas del mapa", map_layer_library:"Biblioteca", map_layer_restaurant:"Restaurante", map_layer_lodging:"Alojamiento", map_layer_restroom:"Baño", map_layer_parking:"Aparcamiento", map_layer_fishing:"Zona de pesca", map_layer_community:"Centro comunitario", map_layer_coming_soon:"Próximamente", special_place:"Lugar especial", special_place_placeholder:"Escribe algo sobre este lugar", save_pin:"Guardar", cancel_pin:"Cancelar", empty_pin_note:"Escribe una nota.", pin_saved:"Lugar especial guardado.",
    help_tab_market:"Precios locales", help_tab_settings:"Ajustes", help_language_title:"Idioma", focus_location:"Ir a mi ubicación", photo_camera:"Hacer una foto", photo_gallery:"Elegir de la galería", market_title:"Guía de precios locales", market_description:"Muestra precios habituales de la zona como referencia.", market_meal:"Comidas", market_cafe:"Cafés", market_necessities:"Productos básicos", market_transport:"Transporte", market_source:"Precios de referencia basados en datos públicos.", market_loading:"Cargando precios locales.", market_empty:"No hay información de precios para esta zona.", market_updated:"Actualizado", market_current_area:"Zona actual"
});
UI_TEXT.fr = {
    sidebar_title:"Mes souvenirs", fog_label:"Effet de brume", fog_on:"Activé", fog_off:"Désactivé", tab_memory:"Souvenirs", tab_photo:"Photos", tab_gpx:"Parcours", tab_badge:"Badges", tab_visit:"Visites", tab_item:"Objets",
    rec_idle:"Arrêté", rec_active:"Enregistrement", gps_weak:"GPS faible ({value}m)", gps_very_weak:"GPS très faible ({value}m)", stay_bonus_wait:"Enregistrement — bonus d’arrêt dans {value} min", stay_bonus_done:"30 min sur place ! Bonus de niveau +1 !",
    empty_memory:"Aucun souvenir pour le moment.", empty_photo:"Aucune photo pour le moment.", tour_title:"Lieux à proximité", tour_place_fallback:"Lieu", festival_label:"Festivals à proximité", festival_badge:"Festivals", loading:"Recherche en cours…", empty_tour:"Aucun lieu à proximité",
    close:"Fermer", more:"Voir plus", next:"Suivant", start:"Commencer", previous:"Retour", count_suffix:"lieux", unit_count:"", hud_title_label:"Titre actuel", hud_level_label:"NV", hud_dist_label:"Distance", hud_memory_label:"Souvenirs", hud_photo_label:"Photos", hud_next:"Suivant", hud_condition_met:"Atteint !", hud_no_condition:"Aucune condition", hud_max:"Maximum !", hud_max_level:"Niveau maximum atteint !",
    help_tab_ask:"Contact", help_tab_info:"Guide", help_tutorial_replay:"Revoir le tutoriel", help_ask_copy:"Partagez vos problèmes ou suggestions<br>sur le chat ouvert KakaoTalk.", help_notice:"Les données GPX enregistrées ne sont pas envoyées au serveur.<br>Tous les souvenirs restent <b>sur cet appareil</b>.", help_link:"Chat ouvert KakaoTalk",
    help_record_title:"Bouton d’enregistrement", help_record_desc:"Touchez pour commencer l’enregistrement GPS, puis touchez à nouveau pour l’arrêter.", help_photo_title:"Bouton photo", help_photo_desc:"Importez des photos depuis votre galerie.", help_memory_title:"Bouton souvenir", help_memory_desc:"Nommez votre position actuelle et enregistrez-la comme souvenir.", help_location_title:"Position actuelle et lieux spéciaux", help_location_desc:"Touchez le point bleu de votre position sur la carte pour enregistrer un lieu spécial avec une note.", help_status_title:"Bouton de statut", help_status_desc:"Consultez votre titre et votre progression.", help_menu_title:"Bouton menu", help_menu_desc:"Consultez souvenirs, photos et parcours.",
    hud_next_short:"Suivant", daily_tag:"Tâches", daily_title:"Tâches du jour", daily_close:"Fermer les tâches", daily_kicker:"AUJOURD’HUI AVEC GILO", daily_copy:"Faites une petite marche et laissez la trace d’aujourd’hui.", daily_reset:"Réinitialisation chaque jour à minuit", daily_completed:"terminées", daily_mission_walk:"Parcourir {distance} sur un nouveau chemin", daily_mission_photo:"Enregistrer 1 photo", daily_mission_visit:"Visiter {place}", daily_mission_photo_place:"Prendre une photo à {place}", daily_nearby_place:"un lieu proche", badge_earned:"Badge obtenu !",
    journey_kicker:"Voyage du jour", journey_stats:"{distance}km · {visits} découvertes · {photos} photos · série de {streak} jours", journey_latest:"Dernière découverte : {place}", journey_empty:"Aucune découverte aujourd’hui. Cherchez une nouvelle expérience autour de vous.", journey_log_stats:"Distance {distance}km · {visits} lieux · {photos} photos · {stays} arrêts", journey_log_places:"Découvertes du jour · {places}", journey_log_wait:"En attente de la première découverte du jour.",
    gpx_format:"GPX", gpx_export:"Exporter le parcours", gpx_time:"Temps", gpx_recent:"Récent", gpx_hour_short:"h", gpx_recent_route:"Parcours des {hours} dernières heures", gpx_name_placeholder:"Nom du parcours (ex. promenade au bord de l’eau)", gpx_save:"Enregistrer ce parcours", gpx_saved:"Ouvrir les parcours enregistrés", gpx_import:"Importer un fichier", gpx_empty:"Aucun parcours enregistré.", gpx_showing:"Affiché", gpx_route:"Parcours", gpx_points:"points", gpx_delete:"Supprimer",
    map_layer_title:"Couches de carte", map_layer_library:"Bibliothèque", map_layer_restaurant:"Restaurant", map_layer_lodging:"Hébergement", map_layer_restroom:"Toilettes", map_layer_parking:"Parking", map_layer_fishing:"Site de pêche", map_layer_community:"Centre communautaire", map_layer_coming_soon:"Bientôt", special_place:"Lieu spécial", special_place_placeholder:"Écrivez quelque chose sur ce lieu", save_pin:"Enregistrer", cancel_pin:"Annuler", empty_pin_note:"Écrivez une note.", pin_saved:"Lieu spécial enregistré.",
    help_tab_market:"Prix locaux", help_tab_settings:"Réglages", help_language_title:"Langue", focus_location:"Aller à ma position", photo_camera:"Prendre une photo", photo_gallery:"Choisir dans la galerie", market_title:"Guide des prix locaux", market_description:"Affiche des prix habituels dans cette zone à titre indicatif.", market_meal:"Repas", market_cafe:"Cafés", market_necessities:"Produits essentiels", market_transport:"Transport", market_source:"Prix de référence basés sur des données publiques.", market_loading:"Chargement des prix locaux.", market_empty:"Aucune information de prix pour cette zone.", market_updated:"Mis à jour", market_current_area:"Zone actuelle"
};
Object.assign(UI_TEXT.fr, { map_layer_durunubi:"Itinéraires officiels", map_layer_durunubi_source:"Office du tourisme de Corée · Centre coréen de randonnée" });
Object.assign(UI_TEXT.ko, { map_layer_shopping:"쇼핑·동네가게" });
Object.assign(UI_TEXT.en, { map_layer_shopping:"Shopping & local shops" });
Object.assign(UI_TEXT.ja, { map_layer_shopping:"買い物・近所のお店" });
Object.assign(UI_TEXT.zh, { map_layer_shopping:"购物·附近商店" });
Object.assign(UI_TEXT.es, { map_layer_shopping:"Compras y tiendas locales" });
Object.assign(UI_TEXT.fr, { map_layer_shopping:"Shopping et commerces" });
Object.assign(UI_TEXT.ko, { map_group_discovery:"볼거리", map_group_food:"먹고·쇼핑", map_group_convenience:"여행 편의", map_group_activity:"활동", map_group_mixed:"일부", map_group_on:"켜짐", map_group_off:"꺼짐" });
Object.assign(UI_TEXT.en, { map_group_discovery:"See & Discover", map_group_food:"Eat & Shop", map_group_convenience:"Travel Essentials", map_group_activity:"Activities", map_group_mixed:"Some", map_group_on:"On", map_group_off:"Off" });
Object.assign(UI_TEXT.ja, { map_group_discovery:"見どころ", map_group_food:"食事・ショッピング", map_group_convenience:"旅行の便利情報", map_group_activity:"アクティビティ", map_group_mixed:"一部", map_group_on:"オン", map_group_off:"オフ" });
Object.assign(UI_TEXT.zh, { map_group_discovery:"景点", map_group_food:"餐饮与购物", map_group_convenience:"旅行便利", map_group_activity:"活动", map_group_mixed:"部分", map_group_on:"开启", map_group_off:"关闭" });
Object.assign(UI_TEXT.es, { map_group_discovery:"Lugares para descubrir", map_group_food:"Comer y comprar", map_group_convenience:"Servicios para viajeros", map_group_activity:"Actividades", map_group_mixed:"Parcial", map_group_on:"Activado", map_group_off:"Desactivado" });
Object.assign(UI_TEXT.fr, { map_group_discovery:"À découvrir", map_group_food:"Manger et shopping", map_group_convenience:"Services pratiques", map_group_activity:"Activités", map_group_mixed:"Partiel", map_group_on:"Activé", map_group_off:"Désactivé" });
Object.assign(UI_TEXT.ko, { map_layer_tourism:"여행지" });
Object.assign(UI_TEXT.en, { map_layer_tourism:"Destinations" });
Object.assign(UI_TEXT.ja, { map_layer_tourism:"観光スポット" });
Object.assign(UI_TEXT.zh, { map_layer_tourism:"旅游景点" });
Object.assign(UI_TEXT.es, { map_layer_tourism:"Destinos" });
Object.assign(UI_TEXT.fr, { map_layer_tourism:"Destinations" });
Object.assign(UI_TEXT.ko, { pin_save_failed:"저장하지 못했습니다. 입력한 내용은 유지됩니다. 다시 저장해 주세요." });
Object.assign(UI_TEXT.en, { pin_save_failed:"Could not save. Your note is kept. Please try saving again." });
Object.assign(UI_TEXT.ja, { pin_save_failed:"保存できませんでした。入力内容は保持されています。もう一度保存してください。" });
Object.assign(UI_TEXT.zh, { pin_save_failed:"无法保存。输入内容已保留，请重试。" });
Object.assign(UI_TEXT.es, { pin_save_failed:"No se pudo guardar. Se conserva tu nota. Intenta guardar de nuevo." });
Object.assign(UI_TEXT.fr, { pin_save_failed:"Enregistrement impossible. Votre note est conservée. Réessayez." });
Object.assign(UI_TEXT.ko, { journey_delete_save_failed:"삭제를 저장하지 못했습니다. 원본은 유지됩니다. 저장 공간을 확인한 뒤 다시 시도해 주세요." });
Object.assign(UI_TEXT.en, { journey_delete_save_failed:"The deletion could not be saved. The original is kept. Check available storage and try again." });
Object.assign(UI_TEXT.ja, { journey_delete_save_failed:"削除を保存できませんでした。元のデータは保持されます。空き容量を確認して再試行してください。" });
Object.assign(UI_TEXT.zh, { journey_delete_save_failed:"无法保存删除操作。原始数据已保留。请检查存储空间后重试。" });
Object.assign(UI_TEXT.es, { journey_delete_save_failed:"No se pudo guardar la eliminación. Se conserva el original. Comprueba el espacio disponible e inténtalo de nuevo." });
Object.assign(UI_TEXT.fr, { journey_delete_save_failed:"La suppression n’a pas pu être enregistrée. L’original est conservé. Vérifiez l’espace disponible et réessayez." });
Object.assign(UI_TEXT.ko, { help_tutorial_replay:"키 설명" });
Object.assign(UI_TEXT.en, { help_tutorial_replay:"Button Guide" });
Object.assign(UI_TEXT.ja, { help_tutorial_replay:"ボタンの説明" });
Object.assign(UI_TEXT.zh, { help_tutorial_replay:"按钮说明" });
Object.assign(UI_TEXT.es, { help_tutorial_replay:"Guía de botones" });
Object.assign(UI_TEXT.fr, { help_tutorial_replay:"Guide des boutons" });
Object.assign(UI_TEXT.ko, { help_story_replay:"길로아 이야기 다시 보기" });
Object.assign(UI_TEXT.en, { help_story_replay:"Replay the GILOA Story" });
Object.assign(UI_TEXT.ja, { help_story_replay:"GILOAの物語をもう一度見る" });
Object.assign(UI_TEXT.zh, { help_story_replay:"重温 GILOA 的故事" });
Object.assign(UI_TEXT.es, { help_story_replay:"Volver a ver la historia de GILOA" });
Object.assign(UI_TEXT.fr, { help_story_replay:"Revoir l’histoire de GILOA" });
Object.assign(UI_TEXT.ko, { help_ask_copy:"불편한 점이나 건의사항은<br>편한 문의 방법을 선택해 알려주세요.", help_link:"카카오톡 1:1 문의", help_google_link:"Google 문의 양식 / Global Contact Form" });
Object.assign(UI_TEXT.en, { help_ask_copy:"Choose any convenient contact method<br>to send questions or feedback.", help_link:"KakaoTalk 1:1 Chat", help_google_link:"Google Contact Form" });
Object.assign(UI_TEXT.ja, { help_ask_copy:"ご都合のよいお問い合わせ方法を選び、<br>ご質問やご意見をお送りください。", help_link:"KakaoTalk 1対1チャット", help_google_link:"Googleお問い合わせフォーム" });
Object.assign(UI_TEXT.zh, { help_ask_copy:"请选择方便的联系方式，<br>向我们发送问题或建议。", help_link:"KakaoTalk一对一咨询", help_google_link:"Google咨询表单" });
Object.assign(UI_TEXT.es, { help_ask_copy:"Elige el medio de contacto que prefieras<br>para enviar preguntas o comentarios.", help_link:"Chat 1 a 1 de KakaoTalk", help_google_link:"Formulario de Google" });
Object.assign(UI_TEXT.fr, { help_ask_copy:"Choisissez le moyen de contact qui vous convient<br>pour envoyer vos questions ou suggestions.", help_link:"Discussion KakaoTalk individuelle", help_google_link:"Formulaire Google" });
var SUPPORT_EMAIL_LABELS={ko:"이메일 문의",en:"Email support",ja:"メールで問い合わせ",zh:"邮件咨询",es:"Consulta por correo",fr:"Contact par e-mail"};
Object.keys(SUPPORT_EMAIL_LABELS).forEach(function(lang){if(UI_TEXT[lang])UI_TEXT[lang].help_google_link=SUPPORT_EMAIL_LABELS[lang];});
function setText(id, value) { var el = document.getElementById(id); if (el) el.textContent = value; }
function setHtml(id, value) { var el = document.getElementById(id); if (el) el.innerHTML = value; }
function formatUiTemplate(template, values) { return String(template || "").replace(/\{(\w+)\}/g, function(_, key) { return values && values[key] !== undefined ? values[key] : ""; }); }
function applyHelpLang(t) {
    setText("htab-ask", t.help_tab_ask);
    setText("htab-info", t.help_tab_info);
    setText("htab-market", t.help_tab_market);
    setText("htab-settings-label", t.help_language_title);
    var languageTab = document.getElementById("htab-settings");
    if (languageTab) languageTab.setAttribute("aria-label", t.help_language_title === "Language" ? "Language" : t.help_language_title + " · Language");
    setText("help-tutorial-replay", t.help_tutorial_replay);
    setText("help-story-replay", t.help_story_replay);
    setHtml("help-ask-copy", t.help_ask_copy);
    setHtml("help-notice", t.help_notice);
    setText("help-link", t.help_link);
    setText("help-link-google", t.help_google_link);
    document.querySelectorAll("[data-settings-lang]").forEach(function(button) {
        var active = normalizeLang(button.dataset.settingsLang) === currentLang;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", active ? "true" : "false");
    });
    var titles = [t.help_record_title, t.help_photo_title, t.help_location_title, t.help_status_title, t.help_menu_title];
    var descs = [t.help_record_desc, t.help_photo_desc, t.help_location_desc, t.help_status_desc, t.help_menu_desc];
    document.querySelectorAll(".help-guide-text").forEach(function(box, idx) {
        var title = box.querySelector("b"); var desc = box.querySelector("span");
        if (title && titles[idx]) title.textContent = titles[idx];
        if (desc && descs[idx]) desc.textContent = descs[idx];
    });
    updateLocalMarketPriceLanguage();
}
function applyHudLang(t) {
    setText("hud-title-label", t.hud_title_label);
    setText("hud-level-label", t.hud_level_label);
    var labels = document.querySelectorAll(".hud-prog-label");
    if (labels[0]) labels[0].textContent = t.hud_dist_label;
    if (labels[1]) labels[1].textContent = t.hud_memory_label;
    if (labels[2]) labels[2].textContent = t.hud_photo_label;
    updateHud();
}
function applyUILang(lang) {
    lang = normalizeLang(lang);
    currentLang = lang;
    document.documentElement.lang = lang;
    var t = UI_TEXT[lang] || UI_TEXT["ko"];
    initMapLayerGroups();
    syncMapLayerGroupUI();
    var el = function(id) { return document.getElementById(id); };
    if (el("sidebar-title")) el("sidebar-title").textContent = t.sidebar_title;
    if (el("fog-toggle-label-el")) el("fog-toggle-label-el").textContent = t.fog_label;
    if (el("fog-toggle-state")) el("fog-toggle-state").textContent = isFogEnabled ? t.fog_on : t.fog_off;
    var tabMemory = document.querySelector("#tab-memory .sidebar-tab-text");
    var tabPhoto = document.querySelector("#tab-photo .sidebar-tab-text");
    var tabGpx = document.querySelector("#tab-gpx .sidebar-tab-text");
    var tabBadge = document.querySelector("#tab-badge .sidebar-tab-text");
    var tabVisit = document.querySelector("#tab-visit .sidebar-tab-text");
    var tabItem = document.querySelector("#tab-item .sidebar-tab-text");
    if (tabMemory) tabMemory.textContent = t.tab_memory;
    if (tabPhoto) tabPhoto.textContent = t.tab_photo;
    if (tabGpx) tabGpx.textContent = t.tab_gpx;
    if (tabBadge) tabBadge.textContent = t.tab_badge;
    if (tabVisit) tabVisit.textContent = t.tab_visit;
    if (tabItem) tabItem.textContent = t.tab_item;
    setText("daily-task-tag-label", t.daily_tag);
    setText("daily-task-title", t.daily_title);
    setText("daily-task-kicker", t.daily_kicker);
    setText("daily-task-copy", t.daily_copy);
    setText("daily-task-reset", t.daily_reset);
    var dailyClose = el("daily-task-panel") && el("daily-task-panel").querySelector(".daily-task-close");
    if (dailyClose) dailyClose.setAttribute("aria-label", t.daily_close);
    setText("gpx-tab-icon", t.gpx_format);
    setText("gpx-export-label", t.gpx_export);
    setText("gpx-time-label", t.gpx_time);
    setText("gpx-recent-label", t.gpx_recent);
    setText("gpx-save-btn", t.gpx_save);
    setText("gpx-saved-label", t.gpx_saved);
    setText("gpx-import-btn", t.gpx_import);
    if (el("gpx-export-name")) el("gpx-export-name").placeholder = t.gpx_name_placeholder;
    updateDialUI();
    updateGpxSavedList();
    if (el("tour-title")) el("tour-title").textContent = t.tour_title;
    if (el("festival-strip-label")) el("festival-strip-label").textContent = t.festival_label;
    if (el("tour-loading")) el("tour-loading").textContent = t.loading;
    if (el("tour-empty")) el("tour-empty").textContent = t.empty_tour;
    if (el("tour-close-btn")) el("tour-close-btn").setAttribute("aria-label", t.close);
    if (el("map-layer-title")) el("map-layer-title").textContent = t.map_layer_title;
    if (el("map-layer-name-tourism")) el("map-layer-name-tourism").textContent = t.map_layer_tourism;
    if (el("map-layer-name-library")) el("map-layer-name-library").textContent = t.map_layer_library;
    if (el("map-layer-name-restaurant")) el("map-layer-name-restaurant").textContent = t.map_layer_restaurant;
    if (el("map-layer-name-shopping")) el("map-layer-name-shopping").textContent = t.map_layer_shopping;
    if (el("map-layer-name-lodging")) el("map-layer-name-lodging").textContent = t.map_layer_lodging;
    if (el("map-layer-name-restroom")) el("map-layer-name-restroom").textContent = t.map_layer_restroom;
    if (el("map-layer-name-parking")) el("map-layer-name-parking").textContent = t.map_layer_parking;
    if (el("map-layer-name-fishing")) el("map-layer-name-fishing").textContent = t.map_layer_fishing;
    if (el("map-layer-name-durunubi")) el("map-layer-name-durunubi").textContent = t.map_layer_durunubi;
    if (el("map-layer-source-durunubi")) el("map-layer-source-durunubi").textContent = t.map_layer_durunubi_source;
    if (el("map-layer-name-community")) el("map-layer-name-community").textContent = t.map_layer_community;
    if (el("map-layer-coming-soon")) el("map-layer-coming-soon").textContent = t.map_layer_coming_soon;
    setText("photo-camera-label", t.photo_camera);
    setText("photo-gallery-label", t.photo_gallery);
    var recordingControl = el("rec-btn");
    if (recordingControl) {
        var recordingLabel = (t.focus_location || "") + " · " + (isRecording ? t.rec_active : t.rec_idle);
        recordingControl.title = recordingLabel;
        recordingControl.setAttribute("aria-label", recordingLabel);
    }
    var photoControl = el("photo-btn");
    if (photoControl) {
        photoControl.title = t.tab_photo;
        photoControl.setAttribute("aria-label", t.tab_photo);
    }
    syncFogButton();
    syncRecordingUI();
    syncLanguageButtons(lang);
    updatePhotoList();
    refreshPhotoMarkersForLanguage();
    syncPhotoLocationDialogText();
    applyInfoLinkLanguage(lang);
    applyHelpLang(t);
    applyHudLang(t);
    applySpecialPlaceLang();
    var adminRegionLabel = document.getElementById("admin-region-label");
    if (adminRegionLabel && activeAdminDistrictName) {
        var municipalityName = getMunicipalityName(activeAdminDistrictName) || activeAdminDistrictName;
        adminRegionLabel.dataset.municipality = municipalityName;
        adminRegionLabel.textContent = (ADMIN_REGION_TEXT[lang] || ADMIN_REGION_TEXT.ko) + " · " + municipalityName;
        adminRegionLabel.setAttribute("aria-label", adminRegionLabel.textContent);
    }
    renderTourCards();
    renderFestivalStrip();
    translateTourItemsForLang(lang, tourItems);
    translateTourItemsForLang(lang, festivalItems);
    if (mapLayerSettings.library) {
        translateLibraryItemsForLang(lang);
        refreshLibraryMarkerLabels(lang);
    } else {
        clearLibraryMarkers();
    }
    if (mapLayerSettings.restroom) renderRestroomMarkers();
    if (mapLayerSettings.parking) renderParkingMarkers(Object.keys(parkingTileCache));
    if (mapLayerSettings.fishing) renderFishingMarkers();
    if (mapLayerSettings.durunubi && durunubiVisibleBundle) renderNearbyDurunubiRoutes();
    updateDailyMissions();
    refreshGiloDialogueLanguage();
    if (typeof applySupplementalStaticLanguage === "function") applySupplementalStaticLanguage();
    if (typeof refreshEarlyLanguageUI === "function") refreshEarlyLanguageUI();
    if (typeof refreshCollectionLanguageUI === "function") refreshCollectionLanguageUI();
    if (window.GiloaCloud && typeof window.GiloaCloud.applyLanguage === "function") window.GiloaCloud.applyLanguage();
    if (window.GiloaPrivacy) window.GiloaPrivacy.applyLanguage();
    if (window.GiloaTrip) window.GiloaTrip.refresh();
    if (window.GiloaGpxAccess) window.GiloaGpxAccess.refresh();
    if (typeof ONBOARDING_I18N !== "undefined" && ONBOARDING_I18N) renderGiloaOnboarding();
    if (typeof introStoryState !== "undefined" && introStoryState && introStoryState.active && introStoryState.mode === "story") renderIntroStory();
    refreshPublicPlacePopupLanguage();
}

function toggleLang(lang) {
    lang = normalizeLang(lang);
    currentLang = lang;
    safeStorageSet(LANGUAGE_PREFERENCE_KEY, lang);
    updateGiloLoadingMessage(giloLoadingMessageKey);
    syncLanguageButtons(lang);
    applyUILang(lang);
    applyAutoRecordingNoticeLang();
    var tutorialWrap = document.getElementById("giloa-tutorial");
    if (tutorialWrap && tutorialWrap.classList.contains("show")) {
        tutorialStepIndex = Math.min(tutorialStepIndex, getTutorialSteps().length - 1);
        renderTutorialStep();
    }
    refreshLibraryMarkerLabels(lang);
    hydrateTourItemsFromCache(lang, true);
    // Existing French cache entries from before the translation-source fix may
    // be labelled as French while their titles are English. Re-run translation
    // immediately; the network refresh below will then replace them safely.
    if (lang === "fr") {
        translateTourItemsForLang("fr", tourItems);
        translateTourItemsForLang("fr", festivalItems);
    }
    refreshTourData({ forceHydrate:true });
    setTimeout(function() { refreshLibraryMarkerLabels(lang); }, 50);
}

function syncLanguageButtons(lang) {
    lang = normalizeLang(lang);
    document.querySelectorAll(".lang-btn").forEach(function(btn) {
        btn.classList.toggle("active", normalizeLang(btn.dataset.lang) === lang);
        btn.setAttribute("aria-pressed", normalizeLang(btn.dataset.lang) === lang ? "true" : "false");
    });
}

function markTourItemsSource(items, sourceLang) {
    (items || []).forEach(function(item) {
        var detected = hasHangul((item && item.title) || "") || hasHangul((item && item.addr1) || "") ? "ko" : sourceLang;
        item._sourceLang = normalizeLang(detected || currentLang);
    });
}

function hasHangul(text) {
    return /[\uAC00-\uD7A3]/.test(String(text || ""));
}

function isBrokenDisplayText(text) {
    var value = String(text || "").trim();
    if (!value) return true;
    if (/[占�]/.test(value)) return true;
    if (/\?{2,}/.test(value)) return true;
    if ((value.match(/\?/g) || []).length >= 2) return true;
    if (/[湲濡쒖댁媛諛遺嫄吏占쎈]/.test(value)) return true;
    return false;
}

function cleanTourText(text, fallback) {
    var value = String(text || "").replace(/<[^>]*>/g, "").trim();
    return isBrokenDisplayText(value) ? fallback : value;
}

function translateTourItemsForLang(lang, items) {
    lang = normalizeLang(lang);
    items = items || tourItems;
    var targetLang = getVarcoLang(lang);
    var tasks = [];
    function scheduleTranslatedRender() {
        if (lang !== currentLang) return;
        if (tourTranslationRenderTimer !== null) return;
        tourTranslationRenderTimer = setTimeout(function() {
            tourTranslationRenderTimer = null;
            renderTourCards();
            addTourMarkers();
            if (tourPanelOpen) renderFestivalStrip();
        }, 80);
    }
    items.forEach(function(item) {
        if (!item) return;
        item._titleByLang = item._titleByLang || {};
        item._addrByLang = item._addrByLang || {};
        var sourceLang = normalizeLang(item._sourceLang || (hasHangul(item.title || item.addr1) ? "ko" : "en"));
        // A stale cache from the first French implementation could have been
        // marked as fr even though it contains TourAPI English text. Treat it
        // as English so it is translated rather than shown unchanged.
        if (lang === "fr" && sourceLang === "fr") sourceLang = "en";
        if (sourceLang === lang) return;
        if (item.title && !item._titleByLang[lang]) {
            tasks.push(varcoTranslate(item.title, getVarcoLang(sourceLang), targetLang).then(function(translated) { item._titleByLang[lang] = translated; scheduleTranslatedRender(); }));
        }
        if (item.addr1 && !item._addrByLang[lang]) {
            tasks.push(varcoTranslate(item.addr1, getVarcoLang(sourceLang), targetLang).then(function(translated) { item._addrByLang[lang] = translated; scheduleTranslatedRender(); }));
        }
    });
    if (tasks.length === 0) return Promise.resolve();
    return Promise.all(tasks).then(function() { renderTourCards(); addTourMarkers(); if (tourPanelOpen) renderFestivalStrip(); });
}

function getTourDisplayTitle(item) {
    var fallback = (UI_TEXT[currentLang] || UI_TEXT.ko).tour_place_fallback || getTourTypeName(item && item.contenttypeid);
    return cleanTourText((item && item._titleByLang && item._titleByLang[currentLang]) || (item && item.title), fallback);
}
function getTourDisplayAddr(item) {
    return cleanTourText((item && item._addrByLang && item._addrByLang[currentLang]) || (item && item.addr1), "");
}

// Collection items

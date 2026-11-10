function toggleSidebar(forceOpen) { var sidebar = document.getElementById("sidebar"); var overlay = document.getElementById("sidebar-overlay"); if (!sidebar || !overlay) return; var willOpen = typeof forceOpen === "boolean" ? forceOpen : !sidebar.classList.contains("open"); sidebar.classList.toggle("open", willOpen); overlay.classList.toggle("show", willOpen); }
function openGiloaSources(event) {
    if (event) event.preventDefault();
    var modal = document.getElementById("giloa-sources");
    if (!modal) return false;
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    toggleSidebar(false);
    var closeButton = modal.querySelector(".giloa-sources-head button");
    if (closeButton) setTimeout(function() { closeButton.focus(); }, 0);
    return false;
}
function closeGiloaSources() {
    var modal = document.getElementById("giloa-sources");
    if (!modal) return;
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
}
document.addEventListener("keydown", function(event) { if (event.key === "Escape") { closeGiloaSources(); closeGiloaInfoPage(); } });
function openGiloaInfoPage(key, event) {
    if (event) event.preventDefault();
    if (key === "about") return openGiloaStoryHub(event);
    if (key === "privacy" && window.GiloaPrivacy) return window.GiloaPrivacy.open(currentLang);
    var modal = document.getElementById("giloa-info");
    if (!modal || (key !== "account" && key !== "privacy")) return false;
    var lang = normalizeLang(currentLang);
    var copy = (GILOA_INFO_COPY[lang] || GILOA_INFO_COPY.ko)[key];
    document.getElementById("giloa-info-kicker").textContent = copy.kicker;
    document.getElementById("giloa-info-title").textContent = copy.title;
    document.getElementById("giloa-info-intro").textContent = copy.intro;
    var list = document.getElementById("giloa-info-list");
    list.innerHTML = "";
    copy.items.forEach(function(item) {
        var article = document.createElement("article");
        var title = document.createElement("strong");
        var body = document.createElement("span");
        title.textContent = item[0]; body.textContent = item[1];
        article.appendChild(title); article.appendChild(body); list.appendChild(article);
    });
    toggleSidebar(false);
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    var closeButton = modal.querySelector("button");
    if (closeButton) setTimeout(function() { closeButton.focus(); }, 0);
    return false;
}
var GILOA_INFO_COPY = Object.freeze({
    ko: { account: { kicker: "ACCOUNT SAFETY", title: "계정 보호", intro: "길로아는 별도 회원 계정을 만들거나 로그인하지 않아도 사용할 수 있습니다.", items: [["기록은 내 기기에", "사진, 기억, 이동 경로와 성장 기록은 기본적으로 이 기기에 저장됩니다."], ["기기 잠금", "다른 사람이 기기를 함께 사용한다면 휴대폰의 화면 잠금과 운영체제 보안 기능을 사용해 주세요."], ["공유 전 확인", "화면·사진·GPX 파일을 다른 사람에게 보내기 전에는 위치와 개인 메모가 포함되는지 확인해 주세요."]] }, privacy: { kicker: "PRIVACY", title: "프라이버시", intro: "길로아는 사용자가 자신의 기록과 위치 사용을 직접 통제할 수 있도록 설계되었습니다.", items: [["위치 기록", "GPS 경로 기록은 사용자가 시작과 중단을 직접 선택할 수 있으며, 기록은 이 기기에 저장됩니다."], ["사진과 기억", "사진 촬영 위치와 개인 메모는 지도 기록에 사용될 수 있으므로 공유 전에 내용을 확인해 주세요."], ["주변 정보 조회", "주변 장소와 지도 정보를 표시하기 위해 현재 지도 범위 또는 위치와 관련된 공개 데이터 조회가 이루어질 수 있습니다."]] } },
    en: { account: { kicker: "ACCOUNT SAFETY", title: "Account Safety", intro: "Giloa can be used without creating a separate member account or signing in.", items: [["Records stay on your device", "Photos, memories, routes and growth records are stored on this device by default."], ["Device lock", "If others use your device, protect it with your phone's screen lock and operating-system security."], ["Check before sharing", "Before sharing a screen, photo or GPX file, check whether it includes location or personal notes."]] }, privacy: { kicker: "PRIVACY", title: "Privacy", intro: "Giloa is designed to let you control how your records and location are used.", items: [["Location records", "You choose when GPS recording starts and stops, and the record is stored on this device."], ["Photos and memories", "Photo locations and personal notes can appear in map records, so review them before sharing."], ["Nearby information", "Public-data requests may use the current map area or location to show nearby places and map information."]] } },
    ja: { account: { kicker: "ACCOUNT SAFETY", title: "アカウント保護", intro: "Giloaは、別途会員アカウントの作成やログインなしで利用できます。", items: [["記録は端末内に保存", "写真、思い出、移動経路、成長記録は基本的にこの端末に保存されます。"], ["端末のロック", "他の人と端末を共有する場合は、画面ロックとOSのセキュリティ機能を利用してください。"], ["共有前の確認", "画面、写真、GPXファイルを共有する前に、位置情報や個人メモが含まれていないか確認してください。"]] }, privacy: { kicker: "PRIVACY", title: "プライバシー", intro: "Giloaは、記録と位置情報の利用をユーザー自身が管理できるよう設計されています。", items: [["位置記録", "GPS記録の開始と停止はユーザーが選択し、記録はこの端末に保存されます。"], ["写真と思い出", "写真の位置と個人メモは地図記録に表示されることがあるため、共有前に確認してください。"], ["周辺情報の検索", "周辺の場所と地図情報を表示するため、現在の地図範囲または位置に関する公開データ照会が行われることがあります。"]] } },
    zh: { account: { kicker: "ACCOUNT SAFETY", title: "账户保护", intro: "无需创建单独的会员账户或登录即可使用 Giloa。", items: [["记录保存在设备上", "照片、记忆、行程和成长记录默认保存在此设备上。"], ["设备锁定", "若他人会使用您的设备，请使用手机屏幕锁和操作系统安全功能。"], ["分享前确认", "分享屏幕、照片或 GPX 文件前，请确认其中是否包含位置或个人备注。"]] }, privacy: { kicker: "PRIVACY", title: "隐私", intro: "Giloa 的设计让您能够自行控制记录和位置的使用方式。", items: [["位置记录", "您可以自行选择开始或停止 GPS 记录，记录将保存在此设备上。"], ["照片和记忆", "照片位置和个人备注可能显示在地图记录中，分享前请先确认。"], ["附近信息", "为了显示附近地点和地图信息，公开数据查询可能会使用当前地图范围或位置。"]] } }
});
function closeGiloaInfoPage() {
    var modal = document.getElementById("giloa-info");
    if (!modal) return;
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
}
function openGiloaStoryHub(event) {
    if (event) event.preventDefault();
    var hub = document.getElementById("giloa-story-hub");
    if (!hub) return false;
    toggleSidebar(false);
    renderGiloaStoryChapters();
    hub.hidden = false;
    hub.setAttribute("aria-hidden", "false");
    var closeButton = hub.querySelector("header button");
    if (closeButton) setTimeout(function() { closeButton.focus(); }, 0);
    return false;
}
function closeGiloaStoryHub() {
    var hub = document.getElementById("giloa-story-hub");
    if (!hub) return;
    hub.hidden = true;
    hub.setAttribute("aria-hidden", "true");
}
document.addEventListener("keydown", function(event) {
    if (event.key !== "Escape") return;
    closeGiloaStoryHub();
    dismissGiloaUpdateNotice();
});

function dismissGiloaUpdateNotice() {
    var notice = document.getElementById("giloa-update-notice");
    if (!notice || notice.hidden) return;
    safeStorageSet(GILOA_UPDATE_SEEN_KEY, "1");
    notice.hidden = true;
    notice.setAttribute("aria-hidden", "true");
    document.body.classList.remove("giloa-update-open");
    persistDurableStorageSnapshot();
}
function showGiloaUpdateNoticeIfNeeded() {
    if (safeStorageGet(GILOA_UPDATE_SEEN_KEY) === "1") return false;
    if (safeStorageGet(INTRO_STORY_SEEN_KEY) !== "true") return false;
    var notice = document.getElementById("giloa-update-notice");
    if (!notice) return false;
    notice.hidden = false;
    notice.setAttribute("aria-hidden", "false");
    document.body.classList.add("giloa-update-open");
    return true;
}
function applyInfoLinkLanguage(lang) {
    var labels = {
        ko: { account: "계정 보호", privacy: "프라이버시", about: "길로아 이야기" },
        en: { account: "Account Safety", privacy: "Privacy", about: "About Giloa" },
        ja: { account: "アカウント保護", privacy: "プライバシー", about: "ギロアについて" },
        zh: { account: "账户保护", privacy: "隐私", about: "关于 Giloa" },
        es: { account: "Seguridad de la cuenta", privacy: "Privacidad", about: "Acerca de Giloa" },
        fr: { account: "Sécurité du compte", privacy: "Confidentialité", about: "À propos de Giloa" }
    };
    var text = labels[normalizeLang(lang)] || labels.ko;
    Object.keys(text).forEach(function(key) {
        var link = document.getElementById("info-link-" + key);
        if (!link) return;
        link.textContent = text[key];
        link.setAttribute("aria-label", text[key]);
    });
}
function centerMap() { focusCurrentLocation(); }
// 위치 버튼을 길게 누르면 기록 상태는 건드리지 않고 위치만 다시 맞춘다.
var suppressRecToggle = false;
function toggleLocationRecording() {
    if (suppressRecToggle) {
        suppressRecToggle = false;
        return;
    }

    /*
     * 기록 중이면 즉시 중단한다.
     */
    if (isRecording) {
        toggleRecording();
        return;
    }

    /*
     * 새 기록은 안내창에서 사용자가
     * 시작을 선택한 뒤에만 실행한다.
     */
    showAutoRecordingNotice();
}

(function bindLocationLongPress() {
    var button = document.getElementById("rec-btn");
    if (!button) return;
    var timer = null;
    function cancel() { if (timer) { clearTimeout(timer); timer = null; } }
    button.addEventListener("pointerdown", function() {
        cancel();
        timer = setTimeout(function() {
            timer = null;
            suppressRecToggle = true;
            if (navigator.vibrate) { try { navigator.vibrate(20); } catch (e) {} }
            focusCurrentLocation();
        }, 600);
    });
    ["pointerup", "pointerleave", "pointercancel"].forEach(function(name) { button.addEventListener(name, cancel); });
})();

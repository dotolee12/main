const GILO_DIALOG_IMAGE = encodeURI("./gilo many appearance/gilo-tutorial-welcome-transparent.png");
const GILO_DIALOG_PAGE_IMAGES = [
    GILO_DIALOG_IMAGE,
    encodeURI("./gilo many appearance/gilo-tutorial-thumbs-transparent.png"),
    encodeURI("./gilo many appearance/gilo-tutorial-curious-transparent.png")
];
var giloDialogueState = { pages: [], index: 0, data: null, closeTimer: null };
var GILO_DIALOGUE_TEXT = {
    ko: { next: "다음 >", start: "시작하기", close: "대화 닫기" },
    en: { next: "Next >", start: "Start", close: "Close dialogue" },
    ja: { next: "次へ >", start: "はじめる", close: "会話を閉じる" },
    zh: { next: "下一步 >", start: "开始", close: "关闭对话" },
    es: { next: "Siguiente >", start: "Empezar", close: "Cerrar diálogo" },
    fr: { next: "Suivant >", start: "Commencer", close: "Fermer le dialogue" }
};
function getGiloDialogueLang() { var lang = typeof currentLang === "string" ? currentLang : document.documentElement.lang; lang = String(lang || "ko").toLowerCase().split("-")[0]; return GILO_DIALOGUE_TEXT[lang] ? lang : "en"; }
function resolveGiloDialogueValue(value) { if (value === null || value === undefined) return ""; if (typeof value !== "object") return String(value); var lang = getGiloDialogueLang(); return String(value[lang] || value.ko || value.en || value.ja || value.zh || ""); }
function updateGiloDialogueClearance() {
    var layer = document.getElementById("gilo-dialogue-layer"), controls = document.getElementById("controls");
    if (!layer || !controls) return;
    var rect = controls.getBoundingClientRect();
    layer.style.setProperty("--gilo-dialogue-controls-clearance", Math.max(90, Math.ceil(window.innerWidth - rect.left + 12)) + "px");
}
function renderGiloDialoguePage() {
    var state = giloDialogueState, data = state.data || {}, copy = document.getElementById("gilo-dialogue-copy"), name = document.getElementById("gilo-dialogue-name"), next = document.getElementById("gilo-dialogue-next"), close = document.getElementById("gilo-dialogue-close"), progress = document.getElementById("gilo-dialogue-progress"), image = document.getElementById("gilo-dialogue-character"), box = document.getElementById("gilo-dialogue-box");
    if (!copy || !next) return;
    var labels = GILO_DIALOGUE_TEXT[getGiloDialogueLang()];
    name.textContent = resolveGiloDialogueValue(data.name || "Gilo");
    copy.textContent = resolveGiloDialogueValue(state.pages[state.index]);
    next.textContent = resolveGiloDialogueValue(state.index >= state.pages.length - 1 ? (data.finalLabel || labels.start) : (data.nextLabel || labels.next));
    next.setAttribute("aria-label", next.textContent.replace(" >", ""));
    close.setAttribute("aria-label", resolveGiloDialogueValue(data.closeLabel || labels.close));
    progress.textContent = state.pages.length > 1 ? (state.index + 1) + " / " + state.pages.length : "";
    if (image && Array.isArray(data.images) && data.images.length) {
        image.onload = function() { if (box) box.classList.remove("image-fallback"); };
        image.onerror = function() { if (box) box.classList.add("image-fallback"); };
        image.src = data.images[state.index] || data.images[data.images.length - 1] || GILO_DIALOG_IMAGE;
    }
}
function showGiloDialogue(dialogueData) {
    var layer = document.getElementById("gilo-dialogue-layer"), box = document.getElementById("gilo-dialogue-box"), image = document.getElementById("gilo-dialogue-character"), hud = document.getElementById("hud");
    if (!layer || !box || !image) return;
    var data = dialogueData || {}, pages = Array.isArray(data.pages) ? data.pages.slice() : [];
    if (!pages.length) pages = [data.text || ""];
    if (giloDialogueState.closeTimer) clearTimeout(giloDialogueState.closeTimer);
    giloDialogueState = { pages: pages, index: 0, data: data, closeTimer: null };
    box.classList.remove("image-fallback");
    image.onerror = function() { box.classList.add("image-fallback"); image.removeAttribute("src"); };
    image.onload = function() { box.classList.remove("image-fallback"); };
    image.src = data.image || GILO_DIALOG_IMAGE;
    renderGiloDialoguePage(); updateGiloDialogueClearance();
    layer.setAttribute("aria-hidden", "false");
    if (hud) hud.classList.add("gilo-dialogue-hud-hidden");
    requestAnimationFrame(function() { layer.classList.add("is-open"); });
}
function hideGiloDialogue() {
    var layer = document.getElementById("gilo-dialogue-layer"), hud = document.getElementById("hud");
    if (!layer) return;
    layer.classList.remove("is-open"); layer.setAttribute("aria-hidden", "true");
    if (hud) hud.classList.remove("gilo-dialogue-hud-hidden");
    giloDialogueState.closeTimer = setTimeout(function() { giloDialogueState.closeTimer = null; }, 250);
}
function nextGiloDialogue(event) {
    // Inline handling keeps this action reliable even if a map/UI listener
    // is registered after the dialogue module.
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    var pageCount = giloDialogueState.pages.length;
    if (!pageCount || giloDialogueState.index >= pageCount - 1) {
        var onComplete = giloDialogueState.data && giloDialogueState.data.onComplete;
        hideGiloDialogue();
        if (typeof onComplete === "function") setTimeout(function() { try { onComplete(); } catch (error) { console.warn("Gilo dialogue completion failed", error); } }, 260);
        return false;
    }
    giloDialogueState.index = Math.min(giloDialogueState.index + 1, pageCount - 1);
    renderGiloDialoguePage();
    return false;
}
function refreshGiloDialogueLanguage() { var layer = document.getElementById("gilo-dialogue-layer"); if (layer && layer.classList.contains("is-open")) renderGiloDialoguePage(); }
(function initGiloDialogue() {
    var close = document.getElementById("gilo-dialogue-close"), next = document.getElementById("gilo-dialogue-next"), box = document.getElementById("gilo-dialogue-box");
    if (!close || !next) return;
    // The dialogue sits over the map and the combined location/record control.
    // Keep its button interactions inside the dialogue so a tap cannot also
    // trigger a map click or location refresh behind it.
    function consumeDialogueEvent(event) {
        if (!event) return;
        event.preventDefault();
        event.stopPropagation();
    }
    if (box) {
        box.addEventListener("pointerdown", function(event) { event.stopPropagation(); });
        box.addEventListener("click", function(event) { event.stopPropagation(); });
    }
close.addEventListener("click", function(event) {
    consumeDialogueEvent(event);
    hideGiloDialogue();
});

window.addEventListener("resize", updateGiloDialogueClearance);
window.addEventListener("orientationchange", updateGiloDialogueClearance);

setTimeout(function() {
    showGiloDialogue({
        image: GILO_DIALOG_IMAGE,
        images: GILO_DIALOG_PAGE_IMAGES,
        name: "Gilo",
        pages: [
            {
                ko: "안녕! 나는 길로야.",
                en: "Hi! I'm Gilo.",
                ja: "こんにちは！ぼくはギロだよ。",
                zh: "你好！我是Gilo。",
                es: "¡Hola! Soy Gilo.",
                fr: "Bonjour ! Je suis Gilo."
            },
            {
                ko: "오늘은 어떤 모험이 기다리고 있을까?",
                en: "What kind of adventure awaits us today?",
                ja: "今日はどんな冒険が待っているかな？",
                zh: "今天会有什么样的冒险等着我们呢？",
                es: "¿Qué aventura nos espera hoy?",
                fr: "Quelle aventure nous attend aujourd’hui ?"
            },
            {
                ko: "지도를 탐험하며 새로운 장소를 찾아보자!",
                en: "Let's explore the map and discover new places!",
                ja: "地図を探検して、新しい場所を見つけよう！",
                zh: "一起探索地图，发现新的地点吧！",
                es: "¡Exploremos el mapa y descubramos nuevos lugares!",
                fr: "Explorons la carte et découvrons de nouveaux lieux !"
            }
        ]
    });
}, 450);

})();

// 방향 부채꼴 표시

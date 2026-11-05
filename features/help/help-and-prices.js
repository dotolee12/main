const localMarketPriceData = {
    demo: true,
    regionName: "current",
    sourceName: "publicData",
    updatedAt: null,
    items: { meal: 10500, cafe: 4800, necessities: 2500, transport: 4800 }
};
const marketCategoryMap = {
    meal: [], cafe: [], necessities: [], transport: []
    // 추후 품목별 단위와 조사 기준을 확인한 뒤 카테고리 대표가격 산정 방식 적용 필요
};
let activeHelpTab = "ask";
async function fetchLocalMarketPrices(latitude, longitude) {
    // 추후 공공데이터 API 또는 CSV 연동 위치. 좌표는 연동 시 지역 판별에 사용한다.
    void latitude; void longitude; void marketCategoryMap;
    return localMarketPriceData;
}
function getCurrentCoordinates() {
    return currentPos ? { latitude: currentPos.lat, longitude: currentPos.lng } : { latitude: null, longitude: null };
}
function formatLocalPrice(value, language) {
    var amount = Number(value);
    if (!isFinite(amount) || amount < 0) return "";
    var formatted = Math.round(amount).toLocaleString(language === "ko" ? "ko-KR" : "en-US");
    return language === "ko" ? formatted + "원" : "₩" + formatted;
}
function showLocalMarketPriceLoading() {
    var content = document.getElementById("local-market-content");
    var t = UI_TEXT[currentLang] || UI_TEXT.ko;
    if (content) content.innerHTML = '<div class="local-market-state local-market-loading">' + t.market_loading + '</div>';
}
function showLocalMarketPriceEmpty() {
    var content = document.getElementById("local-market-content");
    var t = UI_TEXT[currentLang] || UI_TEXT.ko;
    if (content) content.innerHTML = '<div class="local-market-state">' + t.market_empty + '</div>';
}
function renderLocalMarketPrices(data) {
    var t = UI_TEXT[currentLang] || UI_TEXT.ko;
    var content = document.getElementById("local-market-content");
    if (!content || !data || !data.items) { showLocalMarketPriceEmpty(); return; }
    var definitions = [
        { key: "meal", icon: "🍽", label: t.market_meal },
        { key: "cafe", icon: "☕", label: t.market_cafe },
        { key: "necessities", icon: "▣", label: t.market_necessities },
        { key: "transport", icon: "↔", label: t.market_transport }
    ];
    var validItems = definitions.filter(function(item) {
        var value = Number(data.items[item.key]);
        return isFinite(value) && value >= 0;
    });
    if (!validItems.length) { showLocalMarketPriceEmpty(); return; }
    content.innerHTML = '<div class="local-market-list">' + validItems.map(function(item) {
        return '<div class="local-market-item"><div class="local-market-icon" aria-hidden="true">' + item.icon + '</div><div class="local-market-name">' + item.label + '</div><div class="local-market-price">' + formatLocalPrice(data.items[item.key], currentLang) + '</div></div>';
    }).join("") + '</div>';
    setText("local-market-region", t.market_current_area);
    var updated = document.getElementById("local-market-updated");
    if (updated) {
        updated.hidden = !!data.demo || !data.updatedAt;
        updated.textContent = !data.demo && data.updatedAt ? t.market_updated + " " + data.updatedAt : "";
    }
}
async function renderLocalMarketPriceTab() {
    showLocalMarketPriceLoading();
    var coords = getCurrentCoordinates();
    try {
        var data = await fetchLocalMarketPrices(coords.latitude, coords.longitude);
        if (activeHelpTab === "market") renderLocalMarketPrices(data);
    } catch (e) {
        if (activeHelpTab === "market") showLocalMarketPriceEmpty();
    }
}
function updateLocalMarketPriceLanguage() {
    var t = UI_TEXT[currentLang] || UI_TEXT.ko;
    setText("local-market-title", t.market_title);
    setText("local-market-description", t.market_description);
    setText("local-market-region", t.market_current_area);
    setText("local-market-source", t.market_source);
    if (activeHelpTab === "market") renderLocalMarketPrices(localMarketPriceData);
}
function toggleHelp() { applyHelpLang(UI_TEXT[currentLang] || UI_TEXT.ko); document.getElementById("help-popup").classList.toggle("show"); }
function handleHelpOverlayClick(event) { var box = document.getElementById("help-content-box"); if (!box.contains(event.target)) toggleHelp(); }
function switchHelpTab(tab) {
    if (["ask", "info", "market", "settings"].indexOf(tab) < 0) tab = "ask";
    activeHelpTab = tab;
    applyHelpLang(UI_TEXT[currentLang] || UI_TEXT.ko);
    ["ask", "info", "market", "settings"].forEach(function(name) {
        var tabEl = document.getElementById("htab-" + name);
        var panelEl = document.getElementById("hpanel-" + name);
        var selected = name === tab;
        if (tabEl) { tabEl.classList.toggle("active", selected); tabEl.setAttribute("aria-selected", selected ? "true" : "false"); tabEl.tabIndex = selected ? 0 : -1; }
        if (panelEl) panelEl.hidden = !selected;
    });
    var box = document.getElementById("help-content-box");
    if (box) box.scrollTop = 0;
    if (tab === "market") renderLocalMarketPriceTab();
}
function showHelpTab(tabName) { switchHelpTab(tabName); }
function handleHelpTabKey(event, tab) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight" && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    var tabs = ["ask", "info", "market", "settings"];
    var index = tabs.indexOf(tab);
    if (event.key === "Home") index = 0;
    else if (event.key === "End") index = tabs.length - 1;
    else index = (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    switchHelpTab(tabs[index]);
    document.getElementById("htab-" + tabs[index]).focus();
}
function replayGiloaTutorial() {
    var helpPopup = document.getElementById("help-popup");
    if (helpPopup) helpPopup.classList.remove("show");
    if (typeof window.startGiloaTutorial === "function") window.startGiloaTutorial();
}
function changeLanguageFromSettings(lang) {
    lang = normalizeLang(lang);
    safeStorageSet(LANGUAGE_PREFERENCE_KEY, lang);
    safeStorageSet(LANGUAGE_SELECTED_KEY, "1");
    toggleLang(lang);
    switchHelpTab("settings");
}

(function () {
    "use strict";
    // Browser-side feature gate only. This is not server authentication or DRM.
    // Never publish the issuer workbook, raw access IDs or private credentials.
    var allowedDigests = ["fa05cdf8e533ba76d72e64db1162aa17f58951e3a8c3e7d5d85ded2e59d4b3ac","d2df911967743f5f1162a7d72ded897918f39158a4054d79d56172283918b6a6","d39831fa052f31a42ed3ea99486ebd183a8f8e94b9acb16365da47767e6150e2","4c88af2b181002c0d1e0d2fb4efcdb6e7e86bd6a5a21e5049c3e01a28a71ef61","b25eec1ee2a01b0e00bf6df503ba48398c716f591691ed3348355587d2fc70ed","516bd53d99fc89bef33586e0c81910906d8384605c50a2005f5b1561d88dc4fe","129b303678bc81d50245aa31e73a46f2d71932c92f735204f483df42d0977c58","a772dab881d85702e615545adaae4b82c14e722e735eb40512aebdf9457afa8d","002b170deb7ff3819aee472553e07c9ab4137a013e15521fb2703d7e17861980","290b6d361ebd1cad888c603824195ebf75948ab464c96cb33210b77fdc1eb4db"];
    var approved = false, checking = false, failures = 0, retryAt = 0;
    var words = {
        ko:{title:"GPX 이용 권한",copy:"관리자가 발급한 아이디를 입력하면 GPX 추출·불러오기·경로 보기·여행 ZIP을 사용할 수 있습니다.",id:"발급 아이디",enter:"이용 시작",lock:"GPX 잠그기",invalid:"등록되지 않은 아이디입니다.",wait:"잠시 후 다시 시도해 주세요.",checking:"아이디 확인 중…",secure:"HTTPS 연결에서 다시 열어 주세요.",active:"GPX 이용이 허용됐습니다.",note:"새로고침하거나 창을 다시 열면 아이디를 다시 입력해야 합니다. 기존 기록은 그대로 유지됩니다."},
        en:{title:"GPX access",copy:"Enter an administrator-issued ID to export, import and view GPX routes and save trip ZIP files.",id:"Issued ID",enter:"Unlock GPX",lock:"Lock GPX",invalid:"This ID is not registered.",wait:"Please try again shortly.",checking:"Checking ID…",secure:"Please reopen this page using HTTPS.",active:"GPX access is enabled.",note:"Enter the ID again after refreshing or reopening. Existing records are preserved."},
        ja:{title:"GPX利用権限",copy:"管理者が発行したIDを入力すると、GPXの書き出し・読み込み・経路表示・旅行ZIPを利用できます。",id:"発行されたID",enter:"GPXを利用",lock:"GPXをロック",invalid:"登録されていないIDです。",wait:"しばらくしてからお試しください。",checking:"IDを確認中…",secure:"HTTPSでページを開き直してください。",active:"GPXを利用できます。",note:"再読み込み時はIDの再入力が必要です。既存の記録は保持されます。"},
        zh:{title:"GPX使用权限",copy:"输入管理员发放的ID，即可导出、导入和查看GPX路线，并保存旅行ZIP。",id:"发放的ID",enter:"启用GPX",lock:"锁定GPX",invalid:"该ID未登记。",wait:"请稍后重试。",checking:"正在验证ID…",secure:"请通过HTTPS重新打开页面。",active:"已启用GPX。",note:"刷新或重新打开后需要再次输入ID。现有记录会保留。"},
        es:{title:"Acceso a GPX",copy:"Introduce un ID del administrador para exportar, importar y ver rutas GPX y guardar ZIP de viaje.",id:"ID asignado",enter:"Activar GPX",lock:"Bloquear GPX",invalid:"Este ID no está registrado.",wait:"Inténtalo de nuevo en unos instantes.",checking:"Comprobando ID…",secure:"Abre esta página mediante HTTPS.",active:"Acceso a GPX activado.",note:"Introduce el ID de nuevo al recargar o reabrir. Tus registros se conservan."},
        fr:{title:"Accès GPX",copy:"Saisissez un identifiant fourni par l’administrateur pour exporter, importer et afficher des parcours GPX et enregistrer des ZIP de voyage.",id:"Identifiant attribué",enter:"Activer GPX",lock:"Verrouiller GPX",invalid:"Cet identifiant n’est pas enregistré.",wait:"Veuillez réessayer dans quelques instants.",checking:"Vérification…",secure:"Rouvrez cette page en HTTPS.",active:"Accès GPX activé.",note:"Saisissez à nouveau l’identifiant après actualisation ou réouverture. Vos données sont conservées."}
    };
    function text() { return words[typeof currentLang === "string" ? currentLang : "ko"] || words.en; }
    function status(key) {
        var node = document.getElementById("gpx-access-status");
        if (node) { node.dataset.message = key || ""; node.textContent = key ? text()[key] : ""; }
    }
    function refresh() {
        var t = text(), form = document.getElementById("gpx-access-form"), content = document.getElementById("gpx-access-content"), lockButton = document.getElementById("gpx-access-lock");
        if (form) form.hidden = approved;
        if (content) { content.hidden = !approved; content.inert = !approved; }
        if (lockButton) { lockButton.hidden = !approved; lockButton.textContent = t.lock; }
        ["title", "copy", "id", "enter", "note"].forEach(function(key) { var el = document.getElementById("gpx-access-" + key); if (el) el.textContent = t[key]; });
        var input = document.getElementById("gpx-access-input"); if (input) input.disabled = checking;
        var enter = document.getElementById("gpx-access-enter"); if (enter) enter.disabled = checking;
        var node = document.getElementById("gpx-access-status"); if (node && node.dataset.message) node.textContent = t[node.dataset.message] || "";
    }
    function requireAccess() {
        if (approved) return true;
        refresh();
        if (typeof toggleSidebar === "function") toggleSidebar(true);
        if (typeof switchAllTab === "function") switchAllTab("gpx");
        var input = document.getElementById("gpx-access-input"); if (input) input.focus();
        return false;
    }
    async function submit(event) {
        if (event) event.preventDefault();
        if (checking) return;
        if (Date.now() < retryAt) { status("wait"); return; }
        if (!window.crypto || !window.crypto.subtle) { status("secure"); return; }
        var input = document.getElementById("gpx-access-input"), id = input ? input.value.trim().toLowerCase() : "";
        if (!/^giloa-[a-z2-9]{6}$/.test(id)) { status("invalid"); return; }
        checking = true; status("checking"); refresh();
        try {
            var data = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode("giloa-gpx-access-v1:" + id));
            var digest = Array.from(new Uint8Array(data)).map(function(b) { return b.toString(16).padStart(2,"0"); }).join("");
            approved = allowedDigests.indexOf(digest) !== -1;
            if (approved) { failures = 0; if (input) input.value = ""; status("active"); }
            else { failures++; if (failures >= 5) { failures = 0; retryAt = Date.now() + 30000; } status("invalid"); }
        } catch (_) { status("secure"); }
        finally { checking = false; refresh(); }
    }
    function lock() {
        approved = false;
        if (typeof clearActiveGpxRoute === "function") clearActiveGpxRoute();
        status(""); refresh();
    }
    function init() {
        var form = document.getElementById("gpx-access-form"); if (form) form.addEventListener("submit", submit);
        var button = document.getElementById("gpx-access-lock"); if (button) button.addEventListener("click", lock);
        refresh();
    }
    window.GiloaGpxAccess = Object.freeze({ requireAccess:requireAccess, isAuthorized:function() { return approved; }, refresh:refresh, lock:lock });
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once:true }); else init();
}());

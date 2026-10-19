(function() {
    "use strict";
    var MAX_BYTES = 1024 * 1024;
    var identity = null, owner = null, inbox = [], offset = 0, hasMore = false;
    var pending = null, busy = false, generation = 0;
    var LANGS = ["ko", "en", "ja", "zh", "es", "fr"];
    var TEXT = {
        title:["아이디로 GPX 보내기", "Send GPX by ID", "IDでGPXを送信", "通过账号发送GPX", "Enviar GPX por ID", "Envoyer un GPX par identifiant"],
        myId:["내 공유 아이디", "My sharing ID", "自分の共有ID", "我的分享账号", "Mi ID para compartir", "Mon identifiant de partage"],
        idHint:["영문 소문자·숫자·_·- 3~32자. 등록 후 변경할 수 없습니다.", "3–32 lowercase letters, digits, _ or -. Cannot be changed after registration.", "英小文字・数字・_・-の3〜32文字。登録後は変更できません。", "3至32个小写字母、数字、_或-，注册后不可更改。", "3–32 letras minúsculas, números, _ o -. No se puede cambiar.", "3 à 32 lettres minuscules, chiffres, _ ou -. Non modifiable."],
        register:["공유 아이디 등록", "Register sharing ID", "共有IDを登録", "注册分享账号", "Registrar ID", "Enregistrer l’identifiant"],
        route:["보낼 경로", "Route to send", "送信するルート", "要发送的路线", "Ruta para enviar", "Parcours à envoyer"],
        noRoutes:["먼저 GPX를 추출하거나 파일에서 불러오세요.", "Export or import a GPX first.", "先にGPXを保存または読み込んでください。", "请先导出或导入GPX。", "Primero exporta o importa un GPX.", "Exportez ou importez d’abord un GPX."],
        recipient:["받는 사람의 공유 아이디", "Recipient’s sharing ID", "受信者の共有ID", "接收者的分享账号", "ID del destinatario", "Identifiant du destinataire"],
        consent:["선택한 경로의 위치와 기록 시각을 이 아이디의 사용자에게 보냅니다. 받은 사람은 파일을 저장하거나 다시 공유할 수 있습니다.", "Send the selected route’s locations and timestamps to this ID. The recipient can save or forward the file.", "選択したルートの位置と時刻をこのIDへ送信します。受信者は保存や再共有ができます。", "将所选路线的位置和时间发送给此账号，接收者可保存或转发。", "Envía las ubicaciones y horas de esta ruta a este ID. El destinatario puede guardar o reenviar el archivo.", "Envoyez les positions et horaires du parcours à cet identifiant. Le destinataire peut enregistrer ou retransmettre le fichier."],
        send:["보내기", "Send", "送信", "发送", "Enviar", "Envoyer"],
        inbox:["받은 경로", "Received routes", "受信したルート", "收到的路线", "Rutas recibidas", "Parcours reçus"],
        refresh:["받은 경로 확인", "Check received routes", "受信を確認", "查看收到的路线", "Consultar recibidos", "Consulter les parcours reçus"],
        empty:["받은 경로가 없습니다.", "No received routes.", "受信したルートはありません。", "暂无收到的路线。", "No hay rutas recibidas.", "Aucun parcours reçu."],
        more:["더 보기", "Load more", "もっと見る", "加载更多", "Ver más", "Voir plus"],
        open:["지도에서 열기", "Open on map", "地図で開く", "在地图上打开", "Abrir en el mapa", "Ouvrir sur la carte"],
        download:["GPX 다운로드", "Download GPX", "GPXをダウンロード", "下载GPX", "Descargar GPX", "Télécharger le GPX"],
        login:["양쪽 모두 로그인하고 공유 아이디를 등록해야 합니다.", "Both users must sign in and register a sharing ID.", "双方のログインと共有ID登録が必要です。", "双方需登录并注册分享账号。", "Ambos usuarios deben iniciar sesión y registrar un ID.", "Les deux personnes doivent se connecter et enregistrer un identifiant."],
        goLogin:["로그인 화면 열기", "Open sign-in", "ログイン画面を開く", "打开登录界面", "Abrir inicio de sesión", "Ouvrir la connexion"],
        setup:["아이디 전송은 서버 연결 준비 중입니다. GPX 파일 다운로드와 불러오기는 계속 사용할 수 있습니다.", "ID sharing awaits server setup. GPX downloads and imports remain available.", "ID送信はサーバー設定待ちです。GPXの保存と読み込みは利用できます。", "账号分享等待服务器配置，仍可下载和导入GPX。", "Falta configurar el servidor. Puedes descargar e importar GPX.", "Le partage attend la configuration du serveur. Le téléchargement et l’import GPX restent disponibles."],
        preparing:["처리 중…", "Working…", "処理中…", "处理中…", "Procesando…", "Traitement…"],
        sent:["경로를 보냈습니다. 상대방이 ‘받은 경로 확인’을 누르면 볼 수 있습니다.", "Route sent. The recipient can select Check received routes.", "送信しました。受信者は受信を確認してください。", "已发送，请接收者查看收到的路线。", "Ruta enviada. El destinatario puede consultar sus rutas recibidas.", "Parcours envoyé. Le destinataire peut consulter ses parcours reçus."],
        registered:["공유 아이디를 등록했습니다.", "Sharing ID registered.", "共有IDを登録しました。", "分享账号已注册。", "ID registrado.", "Identifiant enregistré."],
        consentNeeded:["받는 사람과 공유 내용을 확인하고 동의란을 선택해 주세요.", "Check the recipient and select the sharing confirmation.", "受信者と共有内容を確認して同意してください。", "请确认接收者和分享内容并勾选同意。", "Confirma el destinatario y marca la autorización.", "Vérifiez le destinataire et cochez la confirmation."],
        invalid:["올바른 경로가 필요합니다. 전송할 GPX는 1MB 이하이며 유효한 좌표가 2개 이상 있어야 합니다.", "Use a valid GPX up to 1 MB with at least two coordinates.", "1MB以下で有効な座標が2つ以上のGPXが必要です。", "需要不超过1MB且含至少两个有效坐标的GPX。", "Usa un GPX válido de hasta 1 MB con al menos dos coordenadas.", "Utilisez un GPX valide de 1 Mo maximum contenant au moins deux coordonnées."],
        invalidId:["아이디는 영문 소문자·숫자·_·- 3~32자로 입력하세요.", "Use 3–32 lowercase letters, digits, _ or -.", "IDは英小文字・数字・_・-の3〜32文字です。", "账号需为3至32个小写字母、数字、_或-。", "Usa 3–32 letras minúsculas, números, _ o -.", "Utilisez 3 à 32 lettres minuscules, chiffres, _ ou -."],
        taken:["이미 사용 중이거나 등록된 아이디입니다.", "That ID is taken or already registered.", "使用中または登録済みのIDです。", "该账号已被使用或注册。", "Ese ID ya está en uso o registrado.", "Cet identifiant est déjà utilisé ou enregistré."],
        missing:["해당 공유 아이디를 찾을 수 없습니다. 상대방에게 등록 여부를 확인해 주세요.", "Sharing ID not found. Ask the recipient to register it first.", "共有IDが見つかりません。登録を確認してください。", "未找到分享账号，请确认对方已注册。", "ID no encontrado. Pide al destinatario que lo registre.", "Identifiant introuvable. Demandez au destinataire de l’enregistrer."],
        self:["다른 사람의 공유 아이디를 입력해 주세요.", "Enter another person’s sharing ID.", "他の人の共有IDを入力してください。", "请输入其他人的分享账号。", "Introduce el ID de otra persona.", "Saisissez l’identifiant d’une autre personne."],
        limit:["하루 전송 한도(20회)에 도달했습니다. 내일 다시 시도해 주세요.", "Daily limit reached (20 sends). Try again tomorrow.", "1日の上限（20回）に達しました。", "已达每日发送上限（20次）。", "Límite diario alcanzado (20 envíos).", "Limite quotidienne atteinte (20 envois)."],
        failed:["전송을 확인하지 못했습니다. 연결을 확인하고 다시 시도해 주세요. 같은 경로의 재시도는 중복 전송되지 않습니다.", "Could not confirm delivery. Check your connection and retry; retries do not duplicate the same send.", "送信を確認できません。接続を確認して再試行してください。同じ送信は重複しません。", "无法确认发送，请检查连接并重试，相同重试不会重复发送。", "No se pudo confirmar. Reintenta; no se duplicará el mismo envío.", "Envoi non confirmé. Réessayez ; le même envoi ne sera pas dupliqué."],
        storage:["기기 저장 공간이 부족합니다. 받은 원본은 받은 경로함에 남아 있습니다.", "Device storage is full. The original remains in your inbox.", "端末容量が不足しています。原本は受信箱に残ります。", "设备存储空间不足，原文件仍在收件箱中。", "Sin espacio local. El original sigue en recibidos.", "Stockage local plein. L’original reste dans votre boîte de réception."],
        from:["보낸 사람", "From", "送信者", "发送者", "De", "De"]
    };
    function t(key) { var index = LANGS.indexOf(typeof currentLang === "string" ? currentLang : "ko"); return TEXT[key][index < 0 ? 0 : index]; }
    function el(id) { return document.getElementById(id); }
    function status(key) { el("gpx-share-status").textContent = key ? t(key) : ""; }
    function cloud() { return window.GiloaCloud; }
    function user() { return cloud() && cloud().getSharingUserId(); }
    function configured() { return !!(cloud() && cloud().isConfigured()); }
    function validHandle(value) { return /^[a-z0-9_-]{3,32}$/.test(value); }
    function handle(value) { return String(value || "").trim().toLowerCase(); }
    function validateGpx(content) {
        if (typeof content !== "string" || new Blob([content]).size > MAX_BYTES || /<!DOCTYPE|<!ENTITY/i.test(content)) throw new Error("GPX_INVALID");
        var doc = new DOMParser().parseFromString(content, "application/xml");
        if (doc.querySelector("parsererror") || !doc.documentElement || doc.documentElement.localName !== "gpx") throw new Error("GPX_INVALID");
        var points = Array.from(doc.querySelectorAll("trkpt, rtept")).filter(function(point) {
            var lat = Number(point.getAttribute("lat")), lng = Number(point.getAttribute("lon"));
            return point.hasAttribute("lat") && point.hasAttribute("lon") && point.getAttribute("lat").trim() && point.getAttribute("lon").trim() && isFinite(lat) && isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
        });
        if (points.length < 2 || points.length > 100000) throw new Error("GPX_INVALID");
        return points.length;
    }
    function errorKey(error) {
        var msg = String(error && error.message || "");
        if (/GPX_NOT_CONFIGURED|PGRST20[25]|does not exist|schema cache/i.test(msg)) return "setup";
        if (/GPX_SIGN_IN_REQUIRED|JWT|token.*expired/i.test(msg) || error.status === 401) return "login";
        if (/GPX_HANDLE_TAKEN|GPX_ALREADY_REGISTERED/.test(msg)) return "taken";
        if (/GPX_ID_REQUIRED/.test(msg)) return "login";
        if (/GPX_RECIPIENT_NOT_FOUND/.test(msg)) return "missing";
        if (/GPX_SELF/.test(msg)) return "self";
        if (/GPX_LIMIT/.test(msg)) return "limit";
        if (/GPX_INVALID_HANDLE/.test(msg)) return "invalidId";
        if (/GPX_INVALID/.test(msg)) return "invalid";
        return "failed";
    }
    async function rpc(name, body) { return cloud().sharingRequest("/rest/v1/rpc/" + name, {method:"POST", body:JSON.stringify(body || {})}); }
    function renderAccess() {
        var signedIn = configured() && !!user();
        el("gpx-share-setup").hidden = configured();
        el("gpx-share-login").hidden = !configured() || signedIn;
        el("gpx-share-account").hidden = !signedIn;
        el("gpx-share-id-value").textContent = identity || "";
        el("gpx-share-id-form").hidden = !!identity;
        el("gpx-share-send").disabled = busy || !signedIn || !identity;
        el("gpx-share-register").disabled = busy || !signedIn;
        el("gpx-share-refresh").disabled = busy || !signedIn;
        el("gpx-share-more").hidden = !hasMore || !signedIn;
    }
    function routes() {
        var select = el("gpx-share-route"), before = select.value;
        select.replaceChildren();
        var saves = loadGpxSaves();
        if (!saves.length) { var empty = document.createElement("option"); empty.value = ""; empty.textContent = t("noRoutes"); select.appendChild(empty); }
        saves.slice().reverse().forEach(function(save) { var option = document.createElement("option"); option.value = save.id; option.textContent = save.name; select.appendChild(option); });
        if (saves.some(function(save) { return save.id === before; })) select.value = before;
    }
    function download(content, name) {
        var url = URL.createObjectURL(new Blob([content], {type:"application/gpx+xml"}));
        var a = document.createElement("a"); a.href = url; a.download = "giloa_" + String(name).replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_").slice(0,120) + ".gpx";
        document.body.appendChild(a); a.click(); a.remove(); setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
    }
    async function readRoute(row, action) {
        var who = user(); if (!who || who !== owner) { resetAccount(); return; }
        var data = await cloud().sharingRequest("/rest/v1/gpx_transfers?id=eq." + encodeURIComponent(row.id) + "&select=gpx_content&limit=1");
        if (user() !== who || owner !== who) return;
        if (!data || !data.length) throw new Error("GPX_INVALID");
        var content = data[0].gpx_content, count = validateGpx(content);
        if (action === "download") { download(content, row.route_name); return; }
        var saves = loadGpxSaves(), id = "received:" + row.id;
        if (!saves.some(function(save) { return save.id === id; })) {
            saves.push({id:id, name:row.route_name, createdAt:Date.now(), pointCount:count, gpxContent:content});
            if (!saveGpxSaves(saves)) { status("storage"); return; }
        }
        clearActiveGpxRoute(); drawGpxRoute(content, id); updateGpxSavedList(); toggleSidebar(false);
    }
    function renderInbox() {
        var list = el("gpx-share-inbox"); list.replaceChildren();
        inbox.forEach(function(row) {
            var item = document.createElement("article"); item.className = "gpx-received-item";
            var title = document.createElement("strong"); title.textContent = row.route_name;
            var meta = document.createElement("small"); meta.textContent = t("from") + ": " + row.sender_handle + " · " + new Date(row.created_at).toLocaleDateString(LANGS.indexOf(currentLang) >= 0 ? currentLang : "ko");
            item.appendChild(title); item.appendChild(meta);
            ["open", "download"].forEach(function(action) { var button = document.createElement("button"); button.type = "button"; button.textContent = t(action); button.addEventListener("click", async function() { button.disabled = true; try { await readRoute(row, action); } catch(error) { status(errorKey(error)); } finally { button.disabled = false; } }); item.appendChild(button); });
            list.appendChild(item);
        });
        if (!inbox.length && user() && identity) { var empty = document.createElement("p"); empty.textContent = t("empty"); list.appendChild(empty); }
    }
    async function refresh(more) {
        var version = generation, who = user();
        if (!configured()) { status("setup"); return; }
        if (!who) { status("login"); return; }
        var myId = await rpc("gpx_my_identity");
        if (generation !== version || user() !== who) return;
        identity = myId; owner = who;
        var start = more ? offset : 0;
        var rows = await cloud().sharingRequest("/rest/v1/gpx_transfers?select=id,sender_handle,route_name,point_count,created_at&order=created_at.desc,id.desc&limit=20&offset=" + start);
        if (generation !== version || user() !== who) return;
        inbox = more ? inbox.concat(rows) : rows; offset = start + rows.length; hasMore = rows.length === 20;
        renderAccess(); renderInbox();
    }
    async function run(action) {
        if (busy) return;
        var version = generation; busy = true; renderAccess(); status("preparing");
        try { await action(); } catch(error) { if (generation === version) status(errorKey(error)); }
        finally { if (generation === version) { busy = false; renderAccess(); } }
    }
    function resetAccount() {
        generation++; identity = null; owner = null; inbox = []; offset = 0; hasMore = false; pending = null; busy = false;
        el("gpx-share-consent").checked = false; el("gpx-share-recipient").value = ""; el("gpx-share-id").value = "";
        status(""); renderAccess(); renderInbox();
    }
    function applyLanguage() {
        if (!el("gpx-sharing")) return;
        document.querySelectorAll("[data-gpx-share-text]").forEach(function(node) { node.textContent = t(node.dataset.gpxShareText); });
        el("gpx-share-id").setAttribute("aria-label", t("myId"));
        routes(); renderAccess(); renderInbox(); decorateSaves();
    }
    function decorateSaves() {
        var saves = loadGpxSaves().slice().reverse();
        document.querySelectorAll("#gpx-saved-list .gpx-saved-item").forEach(function(item, index) {
            var save = saves[index]; if (!save) return;
            var button = item.querySelector(".gpx-saved-share");
            if (!button) {
                button = document.createElement("button"); button.type = "button"; button.className = "gpx-saved-share";
                button.addEventListener("click", function(event) { event.stopPropagation(); selectRoute(save.id); });
                button.addEventListener("keydown", function(event) { event.stopPropagation(); });
                item.appendChild(button);
            }
            button.textContent = t("send"); button.setAttribute("aria-label", t("send") + ": " + save.name);
        });
    }
    function selectRoute(id) { routes(); el("gpx-share-route").value = id; el("gpx-share-consent").checked = false; el("gpx-sharing").scrollIntoView({block:"nearest"}); el("gpx-share-recipient").focus(); }
    function init() {
        applyLanguage();
        el("gpx-share-id-form").addEventListener("submit", function(event) { event.preventDefault(); run(async function() {
            var value = handle(el("gpx-share-id").value), who = user(), version = generation;
            if (!validHandle(value)) { status("invalidId"); return; }
            var result = await rpc("gpx_register_identity", {p_handle:value});
            if (version !== generation || user() !== who) return;
            identity = result; owner = who; status("registered"); renderAccess();
        }); });
        el("gpx-share-form").addEventListener("submit", function(event) { event.preventDefault(); run(async function() {
            if (!configured()) { status("setup"); return; }
            if (!user() || !identity) { status("login"); return; }
            var target = handle(el("gpx-share-recipient").value);
            if (!validHandle(target)) { status("invalidId"); return; }
            if (!el("gpx-share-consent").checked) { status("consentNeeded"); return; }
            if (target === identity) { status("self"); return; }
            var route = loadGpxSaves().find(function(save) { return save.id === el("gpx-share-route").value; });
            var count = validateGpx(route && route.gpxContent), name = String(route.name || "GPX").slice(0,120);
            if (!pending || pending.owner !== user() || pending.target !== target || pending.name !== name || pending.content !== route.gpxContent) pending = {id:crypto.randomUUID(), owner:user(), target:target, name:name, content:route.gpxContent};
            var attempt = pending, version = generation;
            await rpc("gpx_send_route", {p_request_id:attempt.id, p_recipient_handle:target, p_route_name:name, p_gpx_content:route.gpxContent, p_point_count:count});
            if (generation !== version || user() !== attempt.owner) return;
            pending = null; el("gpx-share-consent").checked = false; status("sent");
        }); });
        ["gpx-share-recipient", "gpx-share-route"].forEach(function(id) { el(id).addEventListener("input", function() { el("gpx-share-consent").checked = false; }); });
        el("gpx-share-refresh").addEventListener("click", function() { run(async function() { await refresh(false); status(""); }); });
        el("gpx-share-more").addEventListener("click", function() { run(async function() { await refresh(true); status(""); }); });
        el("gpx-share-go-login").addEventListener("click", function() { toggleSidebar(false); if (!isHudExpanded) toggleHud(); el("cloud-email").focus(); });
        window.addEventListener("giloa:account-changed", function() { resetAccount(); if (configured() && user()) run(function() { return refresh(false).then(function() { status(""); }); }); });
        window.addEventListener("giloa:gpx-saves-changed", routes);
        new MutationObserver(decorateSaves).observe(el("gpx-saved-list"), {childList:true});
        if (configured() && user()) run(function() { return refresh(false).then(function() { status(""); }); });
    }
    window.GiloaGpxSharing = {applyLanguage:applyLanguage, selectRoute:selectRoute};
    init();
})();

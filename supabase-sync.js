(function() {
    "use strict";

    var URL_ROOT = String(window.GILOA_SUPABASE_URL || "").replace(/\/$/, "");
    var PUBLIC_KEY = String(window.GILOA_SUPABASE_PUBLISHABLE_KEY || "");
    var SESSION_KEY = "giloa-supabase-session-v1";
    var DEVICE_KEY = "giloa-device-id-v1";
    var syncTimer = null;
    var syncPromise = null;
    var syncQueued = false;
    var committingServerState = false;
    var session = null;
    var initialized = false;
    var recoveryMode = false;

    var TEXT = {
        ko:{title:"기록 동기화",copy:"로그인하면 이 기기의 기록을 먼저 보존한 뒤 길로아 서버와 동기화합니다.",email:"이메일",password:"비밀번호 (6자 이상)",signIn:"로그인",signUp:"가입",sync:"지금 동기화",signOut:"로그아웃",offline:"오프라인입니다. 기기 기록은 계속 저장됩니다.",signing:"로그인 중…",creating:"계정을 만드는 중…",syncing:"기기 기록을 보존하고 동기화하는 중…",done:"동기화 완료",signedOut:"로그아웃했습니다. 기기 기록은 그대로 유지됩니다.",confirm:"확인 이메일을 보냈습니다. 이메일 인증 후 로그인해 주세요.",missing:"이메일과 비밀번호를 입력해 주세요.",failed:"서버 연결에 실패했습니다. 기기 기록은 그대로 유지됩니다."},
        en:{title:"Record sync",copy:"After sign-in, records on this device are preserved first, then synced with GILOA.",email:"Email",password:"Password (6+ characters)",signIn:"Sign in",signUp:"Sign up",sync:"Sync now",signOut:"Sign out",offline:"Offline. Records will continue to be saved on this device.",signing:"Signing in…",creating:"Creating account…",syncing:"Preserving device records and syncing…",done:"Sync complete",signedOut:"Signed out. Device records remain available.",confirm:"Check your email, confirm the account, then sign in.",missing:"Enter an email and password.",failed:"Could not connect to the server. Device records remain available."},
        ja:{title:"記録の同期",copy:"ログインすると、この端末の記録を先に保護してからGILOAサーバーと同期します。",email:"メール",password:"パスワード（6文字以上）",signIn:"ログイン",signUp:"登録",sync:"今すぐ同期",signOut:"ログアウト",offline:"オフラインです。端末への保存は継続します。",signing:"ログイン中…",creating:"アカウント作成中…",syncing:"端末の記録を保護して同期中…",done:"同期完了",signedOut:"ログアウトしました。端末の記録は残ります。",confirm:"確認メールを送信しました。認証後にログインしてください。",missing:"メールとパスワードを入力してください。",failed:"サーバーに接続できません。端末の記録は保持されます。"},
        zh:{title:"记录同步",copy:"登录后会先保留此设备的记录，再与 GILOA 服务器同步。",email:"电子邮箱",password:"密码（至少6位）",signIn:"登录",signUp:"注册",sync:"立即同步",signOut:"退出登录",offline:"当前离线，记录仍会保存在此设备。",signing:"正在登录…",creating:"正在创建账户…",syncing:"正在保留设备记录并同步…",done:"同步完成",signedOut:"已退出登录，设备记录仍然保留。",confirm:"确认邮件已发送。请验证邮箱后登录。",missing:"请输入邮箱和密码。",failed:"无法连接服务器，设备记录仍然保留。"},
        es:{title:"Sincronizar registros",copy:"Al iniciar sesión, primero se conservan los registros del dispositivo y luego se sincronizan.",email:"Correo",password:"Contraseña (6+ caracteres)",signIn:"Entrar",signUp:"Crear cuenta",sync:"Sincronizar",signOut:"Salir",offline:"Sin conexión. Los registros siguen guardándose en el dispositivo.",signing:"Iniciando sesión…",creating:"Creando cuenta…",syncing:"Protegiendo y sincronizando registros…",done:"Sincronización completa",signedOut:"Sesión cerrada. Los registros del dispositivo se conservan.",confirm:"Confirma tu correo y luego inicia sesión.",missing:"Introduce correo y contraseña.",failed:"No se pudo conectar. Los registros del dispositivo se conservan."},
        fr:{title:"Synchronisation",copy:"Après connexion, les données de cet appareil sont d’abord conservées, puis synchronisées.",email:"E-mail",password:"Mot de passe (6 caractères min.)",signIn:"Connexion",signUp:"Créer un compte",sync:"Synchroniser",signOut:"Déconnexion",offline:"Hors ligne. Les données restent enregistrées sur cet appareil.",signing:"Connexion…",creating:"Création du compte…",syncing:"Protection et synchronisation…",done:"Synchronisation terminée",signedOut:"Déconnecté. Les données de l’appareil sont conservées.",confirm:"Confirmez votre e-mail, puis connectez-vous.",missing:"Saisissez l’e-mail et le mot de passe.",failed:"Connexion au serveur impossible. Les données locales sont conservées."}
    };
    var NOTICE = {
        ko:"기록은 항상 이 기기에 먼저 저장됩니다.<br>로그인하면 경로·기억·사진 메타데이터와 비공개 썸네일이 본인 서버 공간에 동기화됩니다.",
        en:"Records are always saved on this device first.<br>After sign-in, routes, memories, photo metadata and private thumbnails sync to your server space.",
        ja:"記録は常にこの端末へ先に保存されます。<br>ログインすると、経路・思い出・写真情報・非公開サムネイルが本人のサーバー領域へ同期されます。",
        zh:"记录始终先保存在此设备。<br>登录后，路线、记忆、照片信息和私密缩略图会同步到个人服务器空间。",
        es:"Los registros se guardan primero en este dispositivo.<br>Al iniciar sesión se sincronizan rutas, recuerdos, datos de fotos y miniaturas privadas.",
        fr:"Les données sont toujours enregistrées d’abord sur cet appareil.<br>Après connexion, parcours, souvenirs, métadonnées photo et miniatures privées sont synchronisés."
    };
    var RESET_TEXT = {
        ko:{reset:"비밀번호 재설정",newPassword:"새 비밀번호 (6자 이상)",confirmPassword:"새 비밀번호 확인",update:"비밀번호 변경",cancel:"취소",missing:"이메일을 입력한 뒤 비밀번호 재설정을 눌러 주세요.",sent:"비밀번호 재설정 메일을 보냈습니다. PC에서 최신 메일의 링크를 열어 주세요.",ready:"새 비밀번호를 두 번 입력해 주세요.",mismatch:"새 비밀번호가 서로 일치하지 않습니다.",updated:"비밀번호를 변경했습니다. 기록을 동기화합니다."},
        en:{reset:"Reset password",newPassword:"New password (6+ characters)",confirmPassword:"Confirm new password",update:"Change password",cancel:"Cancel",missing:"Enter your email, then select Reset password.",sent:"Password reset email sent. Open the newest link on your PC.",ready:"Enter your new password twice.",mismatch:"The new passwords do not match.",updated:"Password changed. Syncing records."},
        ja:{reset:"パスワードを再設定",newPassword:"新しいパスワード（6文字以上）",confirmPassword:"新しいパスワードの確認",update:"パスワードを変更",cancel:"キャンセル",missing:"メールを入力してからパスワード再設定を選択してください。",sent:"再設定メールを送信しました。PCで最新のリンクを開いてください。",ready:"新しいパスワードを2回入力してください。",mismatch:"新しいパスワードが一致しません。",updated:"パスワードを変更しました。記録を同期します。"},
        zh:{reset:"重置密码",newPassword:"新密码（至少6位）",confirmPassword:"确认新密码",update:"更改密码",cancel:"取消",missing:"请输入电子邮箱，然后选择重置密码。",sent:"密码重置邮件已发送。请在电脑上打开最新链接。",ready:"请两次输入新密码。",mismatch:"两次输入的新密码不一致。",updated:"密码已更改，正在同步记录。"},
        es:{reset:"Restablecer contraseña",newPassword:"Nueva contraseña (6+ caracteres)",confirmPassword:"Confirmar contraseña",update:"Cambiar contraseña",cancel:"Cancelar",missing:"Introduce tu correo y selecciona Restablecer contraseña.",sent:"Correo de restablecimiento enviado. Abre el enlace más reciente en tu PC.",ready:"Introduce dos veces la nueva contraseña.",mismatch:"Las nuevas contraseñas no coinciden.",updated:"Contraseña cambiada. Sincronizando registros."},
        fr:{reset:"Réinitialiser le mot de passe",newPassword:"Nouveau mot de passe (6 caractères min.)",confirmPassword:"Confirmer le mot de passe",update:"Changer le mot de passe",cancel:"Annuler",missing:"Saisissez votre e-mail puis sélectionnez Réinitialiser.",sent:"E-mail envoyé. Ouvrez le lien le plus récent sur votre PC.",ready:"Saisissez deux fois le nouveau mot de passe.",mismatch:"Les nouveaux mots de passe ne correspondent pas.",updated:"Mot de passe modifié. Synchronisation des données."}
    };

    function words() { return TEXT[typeof currentLang === "string" ? currentLang : "ko"] || TEXT.ko; }
    function setStatus(message, isError) {
        var el = document.getElementById("cloud-account-status");
        if (!el) return;
        el.textContent = message || "";
        el.classList.toggle("is-error", !!isError);
    }
    function applyLanguage() {
        var t = words();
        var rt = RESET_TEXT[typeof currentLang === "string" ? currentLang : "ko"] || RESET_TEXT.ko;
        var values = {"cloud-account-title":t.title,"cloud-account-copy":t.copy,"cloud-sign-in":t.signIn,"cloud-sign-up":t.signUp,"cloud-reset-request":rt.reset,"cloud-password-update":rt.update,"cloud-password-cancel":rt.cancel,"cloud-sync-now":t.sync,"cloud-sign-out":t.signOut};
        Object.keys(values).forEach(function(id) { var el = document.getElementById(id); if (el) el.textContent = values[id]; });
        var email = document.getElementById("cloud-email"), password = document.getElementById("cloud-password");
        if (email) email.placeholder = t.email;
        if (password) password.placeholder = t.password;
        var newPassword = document.getElementById("cloud-new-password"), confirmPassword = document.getElementById("cloud-new-password-confirm");
        if (newPassword) newPassword.placeholder = rt.newPassword;
        if (confirmPassword) confirmPassword.placeholder = rt.confirmPassword;
        var notice = document.getElementById("help-notice");
        if (notice) notice.innerHTML = NOTICE[typeof currentLang === "string" ? currentLang : "ko"] || NOTICE.ko;
        if (window.GiloaGpxSharing) window.GiloaGpxSharing.applyLanguage();
    }
    function saveSession(value) {
        var beforeUser = session && session.user ? session.user.id : null;
        session = value && value.access_token ? value : null;
        try { if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session)); else localStorage.removeItem(SESSION_KEY); } catch (_) {}
        renderAccount();
        var afterUser = session && session.user ? session.user.id : null;
        if (beforeUser !== afterUser) window.dispatchEvent(new Event("giloa:account-changed"));
    }
    function readSession() {
        try { var value = JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); return value && value.access_token ? value : null; } catch (_) { return null; }
    }
    function renderAccount() {
        applyLanguage();
        var signedOut = document.getElementById("cloud-account-signed-out");
        var signedIn = document.getElementById("cloud-account-signed-in");
        var recovery = document.getElementById("cloud-account-recovery");
        var email = document.getElementById("cloud-account-email");
        if (signedOut) signedOut.hidden = recoveryMode || !!session;
        if (signedIn) signedIn.hidden = recoveryMode || !session;
        if (recovery) recovery.hidden = !recoveryMode;
        if (email) email.textContent = session && session.user ? session.user.email || "" : "";
    }
    async function request(path, options) {
        options = options || {};
        var headers = Object.assign({ apikey:PUBLIC_KEY, "Content-Type":"application/json" }, options.headers || {});
        if (options.auth !== false && session && session.access_token) headers.Authorization = "Bearer " + session.access_token;
        var response = await fetch(URL_ROOT + path, Object.assign({}, options, { headers:headers }));
        var text = await response.text();
        var body = null;
        try { body = text ? JSON.parse(text) : null; } catch (_) { body = text; }
        if (!response.ok) {
            var error = new Error(body && (body.msg || body.message || body.error_description || body.error) || ("HTTP " + response.status));
            error.status = response.status;
            throw error;
        }
        return body;
    }
    async function refreshSession() {
        if (!session || !session.refresh_token) return null;
        try {
            var next = await request("/auth/v1/token?grant_type=refresh_token", { method:"POST", auth:false, body:JSON.stringify({ refresh_token:session.refresh_token }) });
            saveSession(next);
            return next;
        } catch (_) { saveSession(null); return null; }
    }
    async function ensureSession() {
        if (!session) return null;
        var expiresAt = Number(session.expires_at || 0) * 1000;
        if (expiresAt && expiresAt < Date.now() + 60000) return refreshSession();
        return session;
    }
    function formCredentials() {
        var email = document.getElementById("cloud-email"), password = document.getElementById("cloud-password");
        return { email:String(email && email.value || "").trim(), password:String(password && password.value || "") };
    }
    async function signInFromForm() {
        var value = formCredentials(), t = words();
        if (!value.email || value.password.length < 6) { setStatus(t.missing, true); return; }
        setStatus(t.signing);
        try {
            var result = await request("/auth/v1/token?grant_type=password", { method:"POST", auth:false, body:JSON.stringify(value) });
            saveSession(result);
            await syncNow(true);
        } catch (error) { console.warn("GILOA sign-in failed", error); setStatus(error.message || t.failed, true); }
    }
    async function signUpFromForm() {
        var value = formCredentials(), t = words();
        if (!value.email || value.password.length < 6) { setStatus(t.missing, true); return; }
        setStatus(t.creating);
        try {
            var result = await request("/auth/v1/signup", { method:"POST", auth:false, body:JSON.stringify(value) });
            if (result && result.access_token) { saveSession(result); await syncNow(true); }
            else setStatus(t.confirm);
        } catch (error) { console.warn("GILOA sign-up failed", error); setStatus(error.message || t.failed, true); }
    }
    function resetWords() {
        return RESET_TEXT[typeof currentLang === "string" ? currentLang : "ko"] || RESET_TEXT.ko;
    }
    function recoveryRedirectUrl() {
        if (/^https?:$/.test(window.location.protocol)) return window.location.origin + window.location.pathname;
        return "http://127.0.0.1:8080/";
    }
    async function requestPasswordReset() {
        var value = formCredentials(), rt = resetWords();
        if (!value.email) { setStatus(rt.missing, true); return; }
        setStatus(words().creating);
        try {
            var redirect = recoveryRedirectUrl();
            await request("/auth/v1/recover?redirect_to=" + encodeURIComponent(redirect), { method:"POST", auth:false, body:JSON.stringify({ email:value.email }) });
            setStatus(rt.sent);
        } catch (error) { console.warn("GILOA password reset request failed", error); setStatus(error.message || words().failed, true); }
    }
    async function handleRecoveryCallback() {
        var hash = new URLSearchParams(String(window.location.hash || "").replace(/^#/, ""));
        var query = new URLSearchParams(window.location.search || "");
        var errorMessage = hash.get("error_description") || query.get("error_description");
        if (errorMessage) {
            setStatus(errorMessage.replace(/\+/g, " "), true);
            return false;
        }
        if (hash.get("type") !== "recovery" || !hash.get("access_token")) return false;
        recoveryMode = true;
        var expiresIn = Number(hash.get("expires_in") || 3600);
        saveSession({
            access_token:hash.get("access_token"),
            refresh_token:hash.get("refresh_token") || "",
            token_type:hash.get("token_type") || "bearer",
            expires_in:expiresIn,
            expires_at:Math.floor(Date.now() / 1000) + expiresIn
        });
        try {
            session.user = await request("/auth/v1/user", { method:"GET" });
            saveSession(session);
        } catch (error) { console.warn("GILOA recovery session lookup failed", error); }
        if (window.history && history.replaceState) history.replaceState({}, document.title, window.location.pathname);
        renderAccount();
        setStatus(resetWords().ready);
        return true;
    }
    async function updatePassword() {
        var rt = resetWords();
        var first = String((document.getElementById("cloud-new-password") || {}).value || "");
        var second = String((document.getElementById("cloud-new-password-confirm") || {}).value || "");
        if (first.length < 6) { setStatus(words().missing, true); return; }
        if (first !== second) { setStatus(rt.mismatch, true); return; }
        try {
            var user = await request("/auth/v1/user", { method:"PUT", body:JSON.stringify({ password:first }) });
            if (session) { session.user = user; saveSession(session); }
            recoveryMode = false;
            renderAccount();
            setStatus(rt.updated);
            await syncNow(true);
        } catch (error) { console.warn("GILOA password update failed", error); setStatus(error.message || words().failed, true); }
    }
    async function cancelPasswordReset() {
        recoveryMode = false;
        await signOut();
    }
    async function signOut() {
        try { if (session) await request("/auth/v1/logout", { method:"POST" }); } catch (_) {}
        saveSession(null);
        setStatus(words().signedOut);
    }
    function deviceId() {
        try {
            var id = localStorage.getItem(DEVICE_KEY);
            if (!id) { id = window.crypto && crypto.randomUUID ? crypto.randomUUID() : "device-" + Date.now().toString(36) + Math.random().toString(36).slice(2); localStorage.setItem(DEVICE_KEY, id); }
            return id;
        } catch (_) { return "device-local"; }
    }
    function isoTime(value) { var time = Number(value); return isFinite(time) && time > 0 ? new Date(time).toISOString() : null; }
    function cleanPayload(value) {
        var copy = Object.assign({}, value || {});
        ["thumb","photo","_displayObjectUrl"].forEach(function(key) { delete copy[key]; });
        return copy;
    }
    function recordRows(payload) {
        var rows = [];
        (payload.memories || []).forEach(function(item) { rows.push({kind:"memory",id:String(item.id),lat:Number(item.lat),lng:Number(item.lng),recorded_at:isoTime(item.time),payload:cleanPayload(item),device_id:deviceId(),deleted_at:null}); });
        (payload.specialPlacePins || []).forEach(function(item) { rows.push({kind:"pin",id:String(item.id),lat:Number(item.latitude),lng:Number(item.longitude),recorded_at:item.createdAt || null,payload:cleanPayload(item),device_id:deviceId(),deleted_at:null}); });
        (payload.photos || []).forEach(function(item) { rows.push({kind:"photo",id:String(item.id),lat:isFinite(item.lat)?Number(item.lat):null,lng:isFinite(item.lng)?Number(item.lng):null,recorded_at:isoTime(item.time),payload:cleanPayload(item),thumb_path:item.thumbStoragePath || null,device_id:deviceId(),deleted_at:null}); });
        var deleted = payload.deletedJourneyRecords || {};
        ["memory","photo"].forEach(function(kind) { (deleted[kind === "memory" ? "memories" : "photos"] || []).forEach(function(id) { rows.push({kind:kind,id:String(id),payload:{},device_id:deviceId(),deleted_at:new Date().toISOString()}); }); });
        return rows;
    }
    function localDay(timestamp) {
        var d = new Date(Number(timestamp));
        return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
    }
    function routeRows(payload) {
        var groups = {};
        var points = Array.isArray(payload.rawGpsPoints) && payload.rawGpsPoints.length ? payload.rawGpsPoints : (payload.pathCoordinates || []);
        points.forEach(function(point) {
            var time = Number(point.timestamp || point.startTime);
            if (!isFinite(time) || !isFinite(point.lat) || !isFinite(point.lng)) return;
            var day = localDay(time);
            (groups[day] || (groups[day] = [])).push([Number(point.lat), Number(point.lng), time]);
        });
        return Object.keys(groups).map(function(day) {
            var all = groups[day].sort(function(a,b){return a[2]-b[2];});
            var stride = Math.max(1, Math.ceil(all.length / 2000));
            var compact = all.filter(function(_, index) { return index === 0 || index === all.length - 1 || index % stride === 0; });
            return {device_id:deviceId(),day:day,segments:[compact],point_count:compact.length,raw_point_count:all.length,distance_m:null};
        });
    }
    async function upsert(path, rows, conflict) {
        if (!rows.length) return;
        for (var start = 0; start < rows.length; start += 250) {
            await request("/rest/v1/" + path + "?on_conflict=" + encodeURIComponent(conflict), { method:"POST", headers:{ Prefer:"resolution=merge-duplicates,return=minimal" }, body:JSON.stringify(rows.slice(start, start + 250)) });
        }
    }
    async function uploadStoragePhoto(path, source, fallbackType) {
        if (!source) return false;
        var blob = source instanceof Blob ? source : (/^data:image\//.test(String(source)) ? dataUrlToBlob(source) : null);
        if (!blob || !blob.size) return false;
        var response = await fetch(URL_ROOT + "/storage/v1/object/giloa-thumbs/" + path, {
            method:"PUT",
            headers:{ apikey:PUBLIC_KEY, Authorization:"Bearer " + session.access_token, "Content-Type":blob.type || fallbackType || "image/jpeg", "x-upsert":"true" },
            body:blob
        });
        if (!response.ok) throw new Error("Photo upload failed (" + response.status + ")");
        return true;
    }
    async function uploadPhotoAssets(photo, payloadPhoto) {
        if (!session || !session.user || !photo || !photo.id) return;
        var stored = await idbGetPhoto(photo.id).catch(function() { return null; });
        if (!stored) return;
        var folder = session.user.id + "/" + encodeURIComponent(String(photo.id));
        if (!photo.thumbStoragePath) {
            var thumbPath = folder + "/thumb.jpg";
            if (await uploadStoragePhoto(thumbPath, stored.thumb || stored.photo || photo.thumb || "", "image/jpeg")) {
                photo.thumbStoragePath = thumbPath;
                if (payloadPhoto) payloadPhoto.thumbStoragePath = thumbPath;
            }
        }
        if (!photo.storagePath) {
            var photoPath = folder + "/photo.jpg";
            if (await uploadStoragePhoto(photoPath, stored.photo || photo.photo || stored.thumb || photo.thumb || "", "image/jpeg")) {
                photo.storagePath = photoPath;
                if (payloadPhoto) payloadPhoto.storagePath = photoPath;
            }
        }
        // Once the compressed large photo is durable in Supabase, release the
        // multi-megabyte original duplicate from IndexedDB. The phone gallery
        // remains untouched and the 2048px preview stays available offline.
        if (photo.storagePath && stored.originalBlob) {
            await idbSavePhoto(photo.id, stored.photo || "", stored.thumb || "", null, stored.originalMimeType || "image/jpeg");
        }
    }
    async function uploadThumbnails(payload) {
        var byId = {};
        (payload.photos || []).forEach(function(photo) { byId[String(photo.id)] = photo; });
        for (var i = 0; i < photos.length; i += 1) await uploadPhotoAssets(photos[i], byId[String(photos[i].id)]);
    }
    async function downloadStoragePhoto(path) {
        if (!path) return null;
        var response = await fetch(URL_ROOT + "/storage/v1/object/authenticated/giloa-thumbs/" + path, {
            headers:{ apikey:PUBLIC_KEY, Authorization:"Bearer " + session.access_token }
        });
        if (!response.ok) return null;
        return response.blob();
    }
    async function downloadPhotoAssets(photo) {
        if (!photo || !photo.id || (!photo.thumbStoragePath && !photo.storagePath)) return;
        var existing = await idbGetPhoto(photo.id).catch(function() { return null; });
        var large = existing && existing.photo || "";
        var thumb = existing && existing.thumb || "";
        var mime = existing && existing.originalMimeType || "image/jpeg";
        if (!large && photo.storagePath) {
            var largeBlob = await downloadStoragePhoto(photo.storagePath);
            if (largeBlob) { large = await blobToDataUrl(largeBlob); mime = largeBlob.type || mime; }
        }
        if (!thumb && photo.thumbStoragePath) {
            var thumbBlob = await downloadStoragePhoto(photo.thumbStoragePath);
            if (thumbBlob) thumb = await blobToDataUrl(thumbBlob);
        }
        if (!thumb) thumb = large;
        if (!large) large = thumb;
        if (large || thumb) await idbSavePhoto(photo.id, large, thumb, existing && existing.originalBlob || null, mime);
    }
    async function downloadRemoteThumbnails(payload) {
        for (var i = 0; i < (payload.photos || []).length; i += 1) await downloadPhotoAssets(payload.photos[i]);
    }
    async function uploadLocalFirst(payload) {
        await uploadThumbnails(payload);
        await upsert("records", recordRows(payload), "user_id,kind,id");
        await upsert("route_days", routeRows(payload), "user_id,device_id,day");
    }
    async function pullServer() {
        var records = await request("/rest/v1/records?select=kind,id,payload,deleted_at&order=updated_at.asc");
        var days = await request("/rest/v1/route_days?select=segments&order=day.asc");
        var remote = {memories:[],specialPlacePins:[],photos:[],pathCoordinates:[],rawGpsPoints:[],deletedJourneyRecords:{memories:[],photos:[]},totalDistance:0};
        (records || []).forEach(function(row) {
            if (row.deleted_at) {
                if (row.kind === "memory") remote.deletedJourneyRecords.memories.push(String(row.id));
                if (row.kind === "photo") remote.deletedJourneyRecords.photos.push(String(row.id));
                return;
            }
            var item = Object.assign({}, row.payload || {}, {id:String(row.id)});
            if (row.kind === "memory") remote.memories.push(item);
            if (row.kind === "pin") remote.specialPlacePins.push(item);
            if (row.kind === "photo") remote.photos.push(item);
        });
        (days || []).forEach(function(day) { (day.segments || []).forEach(function(segment) { (segment || []).forEach(function(point) { if (!Array.isArray(point) || point.length < 3) return; remote.pathCoordinates.push({lat:Number(point[0]),lng:Number(point[1]),timestamp:Number(point[2]),startTime:Number(point[2]),endTime:Number(point[2]),visits:1,accuracy:null,source:"supabase"}); }); }); });
        return remote;
    }
    function repaintJourney() {
        try {
            memoryMarkers.forEach(function(marker) { map.removeLayer(marker); }); memoryMarkers.clear();
            specialPlaceMarkers.forEach(function(marker) { map.removeLayer(marker); }); specialPlaceMarkers.clear();
            if (photoClusterGroup) { photoClusterGroup.clearLayers(); if (typeof clearPhotoMarkerIndex === "function") clearPhotoMarkerIndex(); }
            renderStoredMarkers(); renderSavedSpecialPlacePins(); renderStoredPhotoMarkers(); updateMemoryList(); updatePhotoList(); updateStats(); scheduleRender();
        } catch (error) { console.warn("GILOA cloud repaint failed", error); }
    }
    async function syncNow(showResult) {
        if (syncPromise) return syncPromise;
        if (!navigator.onLine) { if (showResult) setStatus(words().offline); return null; }
        if (!await ensureSession()) { renderAccount(); return null; }
        // Session validation yields: another caller may have started syncing.
        if (syncPromise) return syncPromise;
        clearTimeout(syncTimer);
        syncTimer = null;
        syncPromise = (async function() {
            setStatus(words().syncing);
            var local = buildStatePayload();
            await uploadLocalFirst(local);
            var remote = await pullServer();
            await downloadRemoteThumbnails(remote);
            // Capture live records after all network waits; do not yield
            // between this snapshot and the local commit.
            var latest = buildStatePayload();
            if (JSON.stringify(latest) !== JSON.stringify(local)) syncQueued = true;
            var merged = mergeJourneyStatePayloads([latest, local, remote]);
            if (merged && !hasJourneyRecordRegression(latest, merged) && applyStatePayload(merged)) {
                committingServerState = true;
                try {
                    if (!persistState({ restoreCommit:true })) throw new Error(words().failed);
                } finally { committingServerState = false; }
                repaintJourney();
            } else {
                throw new Error(words().failed);
            }
            setStatus(words().done + " · " + new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}));
            return merged;
        })().catch(function(error) {
            console.warn("GILOA cloud sync failed", error);
            setStatus((error && error.message) || words().failed, true);
            return null;
        }).finally(function() {
            syncPromise = null;
            if (syncQueued) { syncQueued = false; scheduleSync(); }
        });
        return syncPromise;
    }
    function scheduleSync() {
        if (committingServerState || !session || !navigator.onLine || !initialized) return;
        if (syncPromise) { syncQueued = true; return; }
        clearTimeout(syncTimer);
        syncTimer = setTimeout(function() { syncNow(false); }, 15000);
    }
    async function init() {
        if (initialized) return;
        initialized = true;
        session = readSession();
        renderAccount();
        window.dispatchEvent(new Event("giloa:account-changed"));
        if (await handleRecoveryCallback()) return;
        window.addEventListener("online", function() { if (session) syncNow(false); });
        window.addEventListener("giloa:language-changed", applyLanguage);
        if (session) await syncNow(false);
    }

    async function sharingRequest(path, options) {
        if (!URL_ROOT || !PUBLIC_KEY) throw new Error("GPX_NOT_CONFIGURED");
        var expectedUser = session && session.user ? session.user.id : null;
        var active = await ensureSession();
        if (!active || active !== session || !active.user || !active.user.id || active.user.id !== expectedUser) throw new Error("GPX_SIGN_IN_REQUIRED");
        return request(path, options);
    }
    window.GiloaCloud = { init:init, signInFromForm:signInFromForm, signUpFromForm:signUpFromForm, requestPasswordReset:requestPasswordReset, updatePassword:updatePassword, cancelPasswordReset:cancelPasswordReset, signOut:signOut, syncNow:syncNow, scheduleSync:scheduleSync, applyLanguage:applyLanguage,
        isConfigured:function() { return !!(URL_ROOT && PUBLIC_KEY); },
        getSharingUserId:function() { return session && session.user ? session.user.id : null; },
        sharingRequest:sharingRequest };
})();

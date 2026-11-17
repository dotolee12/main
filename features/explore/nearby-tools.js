// Optional map tools. Personal items live in their own IndexedDB database.
(function () {
    "use strict";
    var WORDS = {
        ko: {
            walk:"지금 탐험", items:"여기에 두었어요", close:"닫기", minutes:"분", make:"현재 위치로 코스 찾기",
            consent:"코스를 찾으면 현재 위치 주변의 보행로를 OpenStreetMap 보행로 제공 서버에 요청합니다.",
            notice:"보행로 데이터 기반 예상 코스예요. 계단·현장 통행 여부를 확인해 주세요. 화면 잠금 중 웹 기록은 중단될 수 있어요.",
            waiting:"위치와 보행로 확인 중…", error:"코스를 불러오지 못했어요. 연결을 확인하고 다시 시도해 주세요.",
            noRoad:"80m 안에서 연결된 보행로를 찾지 못했어요. 길 위에서 다시 시도해 주세요.",
            noRoute:"선택한 시간에 맞는 왕복 코스를 찾지 못했어요. 다른 시간을 선택해 주세요.",
            location:"위치를 확인하지 못했어요. 위치 권한을 확인해 주세요.", clear:"코스 지우기", start:"출발·도착",
            estimate:"예상 {min}분 · {km}km", approach:"출발 보행로까지 약 {m}m. 이동 구간은 코스에 포함되지 않아요.",
            point:"경유 지점", newItem:"소지품 기록", name:"물건 이름", note:"장소·층·선반·메모",
            photo:"사진 촬영·선택", current:"현재 위치 지정", pick:"지도에서 위치 선택", picking:"지도에서 보관 위치를 누르세요. 취소는 닫기 버튼을 누르세요.",
            save:"여기에 두기", show:"지도에서 찾기", edit:"수정·위치 변경", remove:"삭제", confirm:"이 소지품 기록을 삭제할까요?",
            empty:"아직 저장한 소지품이 없어요.", local:"사진·메모·마지막 보관 위치를 이 브라우저에 저장해요. 물건 이동은 자동 추적하지 않아요.",
            storage:"저장하지 못했어요. 여유 공간과 브라우저 설정을 확인해 주세요.", saved:"저장했어요.",
            required:"이름과 보관 위치를 입력해 주세요.", selected:"선택 위치", image:"사진을 읽지 못했어요. 15MB 이하 JPG·PNG·WebP를 선택해 주세요.",
            weak:"위치 오차 약 {m}m. 실내 위치는 지도에서 확인하고 메모로 보완해 주세요.", cancel:"취소", load:"기록을 읽지 못했어요. 다시 열어 주세요.", more:"더 보기"
        },
        en: {
            walk:"Explore now",items:"I left it here",close:"Close",minutes:"min",make:"Find a walk from here",
            consent:"Finding a route sends your surrounding location to an OpenStreetMap walking-data provider.",
            notice:"Estimated route from walking-map data. Check steps and local access. Web recording may stop when your screen locks.",
            waiting:"Finding location and paths…",error:"Could not load a route. Check your connection and retry.",noRoad:"No connected walking path within 80 m. Try again on a path.",noRoute:"No return route fits this duration. Try another duration.",
            location:"Location unavailable. Check location permission.",clear:"Clear route",start:"Start / finish",estimate:"About {min} min · {km} km",approach:"About {m} m to the starting path. This approach is excluded.",
            point:"Waypoint",newItem:"Record an item",name:"Item name",note:"Place · floor · shelf · note",photo:"Take or choose photo",current:"Set current location",pick:"Choose on map",picking:"Tap the storage location on the map. Close to cancel.",
            save:"Leave it here",show:"Find on map",edit:"Edit / move",remove:"Delete",confirm:"Delete this item record?",empty:"No items saved yet.",local:"Photos, notes and last storage locations stay in this browser. Movement is not tracked automatically.",
            storage:"Could not save. Check storage space and browser settings.",saved:"Saved.",required:"Enter a name and location.",selected:"Selected location",image:"Choose a JPG, PNG or WebP under 15 MB.",weak:"Location accuracy about {m} m. Check indoor locations and add a note.",cancel:"Cancel",load:"Could not read records. Reopen to retry.", more:"Show more"
        },
        ja: {
            walk:"今すぐ探索",items:"ここに置いた",close:"閉じる",minutes:"分",make:"現在地からコース検索",consent:"検索時に現在地周辺の歩道データをOpenStreetMapのサーバーに問い合わせます。",
            notice:"歩道データによる推定コースです。階段や現地の通行状況を確認してください。画面ロック中はWeb記録が止まる場合があります。",
            waiting:"位置と歩道を確認中…",error:"コースを取得できません。接続を確認してください。",noRoad:"80m以内に歩道がありません。道の上で再試行してください。",noRoute:"指定時間の周回コースがありません。別の時間を選んでください。",
            location:"位置を取得できません。権限を確認してください。",clear:"コース消去",start:"出発・到着",estimate:"約{min}分・{km}km",approach:"出発点まで約{m}m。この区間は含みません。",
            point:"経由地点",newItem:"持ち物を記録",name:"物の名前",note:"場所・階・棚・メモ",photo:"写真撮影・選択",current:"現在地を設定",pick:"地図で選択",picking:"地図で保管場所をタップ。閉じるで取消。",
            save:"ここに置く",show:"地図で探す",edit:"編集・移動",remove:"削除",confirm:"この持ち物を削除しますか？",empty:"持ち物はまだありません。",local:"写真・メモ・最終保管場所はこのブラウザに保存します。移動は自動追跡しません。",
            storage:"保存できません。空き容量と設定を確認してください。",saved:"保存しました。",required:"名前と場所を入力してください。",selected:"選択位置",image:"15MB以下のJPG・PNG・WebPを選択してください。",weak:"位置誤差約{m}m。屋内は地図とメモで補ってください。",cancel:"取消",load:"記録を読めません。再度開いてください。", more:"もっと見る"
        },
        zh: {
            walk:"现在探索",items:"我放在这里",close:"关闭",minutes:"分钟",make:"从当前位置寻找路线",consent:"搜索会向OpenStreetMap服务器请求当前位置周边的步行道路数据。",
            notice:"根据步行地图估算路线，请核对台阶及实际通行情况。锁屏可能中断网页记录。",
            waiting:"正在查询位置和步道…",error:"无法获取路线，请检查网络后重试。",noRoad:"80米内没有连通步道，请到道路上重试。",noRoute:"找不到符合时长的返回路线，请选择其他时长。",
            location:"无法定位，请检查权限。",clear:"清除路线",start:"出发・返回",estimate:"约{min}分钟・{km}公里",approach:"距起点约{m}米，此段不计入路线。",
            point:"途经地点",newItem:"记录随身物品",name:"物品名称",note:"地点・楼层・货架・备注",photo:"拍摄或选择照片",current:"设置当前位置",pick:"在地图上选择",picking:"点击地图上的存放地点。关闭可取消。",
            save:"放在这里",show:"在地图上查找",edit:"编辑・移动",remove:"删除",confirm:"删除这条物品记录？",empty:"暂无物品记录。",local:"照片、备注和最后存放位置仅保存在此浏览器，不自动追踪移动。",
            storage:"无法保存，请检查空间和浏览器设置。",saved:"已保存。",required:"请输入名称并选择位置。",selected:"所选位置",image:"请选择15MB以下的JPG、PNG或WebP。",weak:"定位误差约{m}米，请在地图上核对室内位置并添加备注。",cancel:"取消",load:"无法读取记录，请重新打开。", more:"显示更多"
        },
        es: {
            walk:"Explorar ahora",items:"Lo dejé aquí",close:"Cerrar",minutes:"min",make:"Buscar paseo desde aquí",consent:"La búsqueda solicita a OpenStreetMap las vías peatonales alrededor de tu ubicación.",
            notice:"Ruta estimada. Comprueba escaleras y accesos. El registro web puede detenerse al bloquear la pantalla.",
            waiting:"Buscando ubicación y caminos…",error:"No se pudo cargar la ruta. Revisa la conexión.",noRoad:"No hay camino conectado a menos de 80 m. Reintenta desde un camino.",noRoute:"No hay recorrido de vuelta para esa duración. Elige otra.",
            location:"Ubicación no disponible. Revisa los permisos.",clear:"Borrar ruta",start:"Salida / regreso",estimate:"Unos {min} min · {km} km",approach:"Unos {m} m hasta el inicio, no incluidos.",
            point:"Punto de paso",newItem:"Registrar objeto",name:"Nombre del objeto",note:"Lugar · planta · estante · nota",photo:"Tomar o elegir foto",current:"Fijar ubicación actual",pick:"Elegir en el mapa",picking:"Toca el lugar en el mapa. Cierra para cancelar.",
            save:"Dejar aquí",show:"Buscar en el mapa",edit:"Editar / mover",remove:"Eliminar",confirm:"¿Eliminar este registro?",empty:"Todavía no hay objetos.",local:"Las fotos, notas y últimas ubicaciones quedan en este navegador. El movimiento no se rastrea automáticamente.",
            storage:"No se pudo guardar. Revisa espacio y ajustes.",saved:"Guardado.",required:"Introduce nombre y ubicación.",selected:"Ubicación elegida",image:"Elige JPG, PNG o WebP de menos de 15 MB.",weak:"Precisión de unos {m} m. Revisa interiores y añade una nota.",cancel:"Cancelar",load:"No se pudieron leer los registros. Vuelve a abrir.", more:"Ver más"
        }
    };
    var qrWords = {
      ko:["자동차 QR 만들기","자동차 QR 읽기","QR 사진 선택","QR 또는 코드를 확인해 주세요.","내 자동차","카메라를 사용할 수 없어요. QR 사진을 선택해 주세요.","층·기둥번호를 적고 위치를 확인한 뒤 저장하세요.","QR 이미지 저장"],
      en:["Create car QR","Scan car QR","Choose QR photo","Check the QR or code.","My car","Camera unavailable. Choose a QR photo.","Add floor / pillar and confirm the location before saving.","Save QR image"],
      ja:["車のQRを作成","車のQRを読む","QR写真を選択","QRまたはコードを確認してください。","自分の車","カメラを使用できません。QR写真を選択してください。","階・柱番号と位置を確認して保存してください。","QR画像を保存"],
      zh:["创建汽车二维码","扫描汽车二维码","选择二维码照片","请检查二维码或代码。","我的汽车","无法使用相机，请选择二维码照片。","填写楼层和柱号，确认位置后保存。","保存二维码图片"],
      es:["Crear QR del coche","Escanear QR","Elegir foto QR","Comprueba el QR o código.","Mi coche","Cámara no disponible. Elige una foto QR.","Añade planta y columna, confirma la ubicación y guarda.","Guardar imagen QR"]
    };
    function qw(i) { return (qrWords[String(typeof currentLang === "string" ? currentLang : document.documentElement.lang || "ko").slice(0,2)] || qrWords.en)[i]; }
    var qrSession=0, qrStream=null;
    function stopQR() { qrSession++; if(qrStream) qrStream.getTracks().forEach(function(t){t.stop();}); qrStream=null; if(panel) node("qrVideo").hidden=true; }
    var vendorJobs={};
    function vendor(name, symbol) {
        if(window[symbol]) return Promise.resolve();
        if(!vendorJobs[name]) vendorJobs[name]=new Promise(function(resolve,reject){
            var script=document.createElement("script"); script.src=new URL("vendor/"+name, moduleURL).href;
            script.onload=function(){window[symbol]?resolve():reject(new Error("vendor"));};
            script.onerror=function(){delete vendorJobs[name];script.remove();reject(new Error("vendor"));}; document.head.append(script);
        });
        return vendorJobs[name];
    }
    // In production this source is assembled into root script.js.
    var scriptURL=document.currentScript && document.currentScript.src;
    var moduleURL=scriptURL && /\/features\/explore\/nearby-tools\.js(?:\?|$)/.test(scriptURL)
        ? scriptURL : new URL("features/explore/nearby-tools.js",scriptURL || location.href).href;
    async function acceptQR(raw) {
        var match=/^GILOA:CAR:1:([a-f0-9-]{36})$/i.exec(raw.trim());
        if(!match){node("status").textContent=qw(3);return;}
        stopQR(); var id=++locatingId;
        try {
            var connection=await db();
            var existing=await new Promise(function(resolve,reject){var tx=connection.transaction("items","readonly"),r=tx.objectStore("items").get("car-"+match[1]);r.onsuccess=function(){resolve(r.result);};r.onerror=function(){reject(r.error);};});
            if(id!==locatingId)return;
            edit(existing || {id:"car-"+match[1],name:qw(4),note:"",photo:null});
            // The last parking place must never become a new scan's location.
            delete draft.lat;delete draft.lng;node("selected").textContent="";
            var currentDraft=draft, token=++locatingId;
            try {var point=await position();if(token!==locatingId||draft!==currentDraft)return;setDraft(point);node("status").textContent=qw(6);}
            catch(_){if(token===locatingId)status("location");}
        } catch(_){status("storage");}
    }
    async function scanQR() {
        stopQR(); var session=qrSession;
        try {
            await vendor("jsQR.js","jsQR");
            var stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"},audio:false});
            if(session!==qrSession){stream.getTracks().forEach(function(t){t.stop();});return;}
            qrStream=stream;var video=node("qrVideo");video.srcObject=stream;video.hidden=false;await video.play();
            var canvas=document.createElement("canvas"),ctx=canvas.getContext("2d",{willReadFrequently:true});
            async function frame(){
                if(session!==qrSession)return;
                if(video.readyState>=2){canvas.width=Math.min(video.videoWidth,960);canvas.height=Math.round(video.videoHeight*canvas.width/video.videoWidth);ctx.drawImage(video,0,0,canvas.width,canvas.height);var data=ctx.getImageData(0,0,canvas.width,canvas.height),result=jsQR(data.data,data.width,data.height);if(result){await acceptQR(result.data);if(session!==qrSession)return;}}
                setTimeout(frame,250);
            } frame();
        }catch(_){if(session===qrSession){stopQR();node("status").textContent=qw(5);}}
    }
    var panel, toolsMap, routeLayer, itemLayer, database, workerJob;
    var listVersion = 0, pageCursor = null, pageLoading = false;
    var minutes = 20, mode = "walk", requestId = 0, controller = null, photoId = 0, locatingId = 0;
    var draft = null, picking = false, photoBusy = false, returnFocus = null;
    function words() {
        var lang = typeof currentLang === "string" ? currentLang : document.documentElement.lang;
        return WORDS[String(lang || "ko").slice(0, 2)] || WORDS.en;
    }
    function label(key, values) {
        var value = words()[key] || key;
        Object.keys(values || {}).forEach(function (k) { value = value.replace("{" + k + "}", values[k]); });
        return value;
    }
    function node(key) { return panel.querySelector('[data-nearby="' + key + '"]'); }
    function status(key, values) { node("status").textContent = key ? label(key, values) : ""; }
    function validPosition(p) {
        return p && Number.isFinite(p.lat) && Number.isFinite(p.lng) && Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180;
    }
    function db() {
        if (!database) database = new Promise(function (resolve, reject) {
            var open = indexedDB.open("giloa-belongings-v1", 2);
            var blocked = false;
            open.onupgradeneeded = function () {
                var store = open.result.objectStoreNames.contains("items")
                    ? open.transaction.objectStore("items")
                    : open.result.createObjectStore("items", {keyPath:"id"});
                if (!store.indexNames.contains("bySavedAt")) store.createIndex("bySavedAt", ["savedAt", "id"]);
            };
            open.onsuccess = function () {
                var result = open.result;
                if (blocked) { result.close(); return; }
                result.onversionchange = function () { result.close(); database = null; };
                resolve(result);
            };
            open.onerror = function () { database = null; reject(open.error); };
            open.onblocked = function () { blocked = true; database = null; reject(new Error("blocked")); };
        });
        return database;
    }
    async function records(action, value) {
        var connection = await db();
        return new Promise(function (resolve, reject) {
            var tx = connection.transaction("items", action === "list" ? "readonly" : "readwrite");
            var store = tx.objectStore("items"), result;
            if (action === "list") {
                result = {items:[], cursor:null, more:false};
                var range = value ? IDBKeyRange.upperBound(value, true) : null;
                var cursor = store.index("bySavedAt").openCursor(range, "prev");
                cursor.onsuccess = function () {
                    var row = cursor.result;
                    if (!row) return;
                    if (result.items.length === 30) { result.more = true; return; }
                    result.items.push(row.value);
                    result.cursor = row.key;
                    row.continue();
                };
            } else {
                var request = action === "put" ? store.put(value) : store.delete(value);
                request.onsuccess = function () { result = request.result; };
            }
            tx.oncomplete = function () { resolve(result); };
            tx.onabort = tx.onerror = function () { reject(tx.error || new Error("storage")); };
        });
    }
    function cancelWork() {
        stopQR(); requestId++; locatingId++; photoId++; listVersion++;
        pageLoading = false;
        if (workerJob) {
            workerJob.worker.terminate();
            clearTimeout(workerJob.timer);
            workerJob.reject(new Error("cancelled"));
            workerJob = null;
        }
        if (controller) controller.abort();
        controller = null;
        photoBusy = false; node("save").disabled = false; node("make").disabled = false;
    }
    function close() {
        cancelWork(); picking = false;
        panel.hidden = true; panel.classList.remove("is-picking");
        draft = null;
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        previewUrl = null;
        node("preview").removeAttribute("src");
        if (returnFocus && returnFocus.isConnected) returnFocus.focus();
    }
    function refreshText() {
        panel.querySelectorAll("[data-nearby-text]").forEach(function (element) { element.textContent = label(element.dataset.nearbyText); });
        panel.querySelectorAll("[data-minutes]").forEach(function (button) {
            button.textContent = button.dataset.minutes + " " + label("minutes");
            button.setAttribute("aria-pressed", String(Number(button.dataset.minutes) === minutes));
        });
        document.querySelectorAll("[data-nearby-open]").forEach(function (button) { button.textContent = label(button.dataset.nearbyOpen === "walk" ? "walk" : "items"); });
        node("walk").hidden = mode !== "walk"; node("items").hidden = mode !== "items";
        node("title").textContent = label(mode === "walk" ? "walk" : "items");
        node("close").textContent = "×";
        node("close").setAttribute("aria-label", label("close"));
    }
    function open(modeName) {
        cancelWork(); mode = modeName; picking = false;
        returnFocus = document.activeElement;
        panel.hidden = false; panel.classList.remove("is-picking");
        if (typeof toggleSidebar === "function") toggleSidebar(false);
        refreshText(); status("");
        panel.focus();
        if (mode === "items") { node("editor").hidden = true; refreshItems(); }
    }
    function position() {
        return new Promise(function (resolve, reject) {
            if (!navigator.geolocation) { reject(new Error("location")); return; }
            navigator.geolocation.getCurrentPosition(function (result) {
                if (result.coords.accuracy > 80) { reject(new Error("location")); return; }
                resolve({lat:result.coords.latitude, lng:result.coords.longitude, accuracy:result.coords.accuracy});
            }, function () { reject(new Error("location")); }, {enableHighAccuracy:true, timeout:15000, maximumAge:5000});
        });
    }
    function planInWorker(elements, origin, duration, history) {
        return new Promise(function (resolve, reject) {
            var worker = new Worker(new URL("./walk-worker.js?v=qr-walk-20261117", moduleURL));
            var job = {worker:worker, reject:reject};
            workerJob = job;
            function finish(error, route) {
                worker.terminate(); clearTimeout(job.timer);
                if (workerJob === job) workerJob = null;
                if (error) reject(error); else resolve(route);
            }
            job.timer = setTimeout(function () { finish(new Error("error")); }, 20000);
            worker.onmessage = function (event) {
                if (event.data.error) finish(new Error(event.data.error));
                else finish(null, event.data.route);
            };
            worker.onerror = function () { finish(new Error("error")); };
            worker.onmessageerror = function () { finish(new Error("error")); };
            try {
                worker.postMessage({elements:elements, origin:origin, minutes:duration, history:history});
            } catch (error) { finish(error); }
        });
    }
    async function makeWalk() {
        cancelWork();
        var id = requestId;
        node("make").disabled = true; status("waiting");
        try {
            var origin = await position();
            if (id !== requestId) return;
            var query = "[out:json][timeout:18];way(around:" + Math.ceil(minutes * 60 * 1.1 * 0.65 + 150) + "," + origin.lat.toFixed(5) + "," + origin.lng.toFixed(5) + ')[highway];(._;>;);out body;';
            var data = null;
            var endpoints = ["https://overpass-api.de/api/interpreter", "https://overpass.private.coffee/api/interpreter"];
            for (var endpoint of endpoints) {
                if (id !== requestId) return;
                controller = new AbortController();
                var currentController = controller;
                var timer = setTimeout(function () { currentController.abort(); }, 25000);
                try {
                    var response = await fetch(endpoint, {
                        method:"POST", body:new URLSearchParams({data:query}), signal:controller.signal,
                        credentials:"omit", referrerPolicy:"no-referrer"
                    });
                    if (!response.ok) throw new Error("error");
                    var body = await response.json();
                    if (!Array.isArray(body.elements) || body.remark || body.elements.length > 60000) throw new Error("error");
                    data = body;
                    break;
                } catch (_) {
                    if (id !== requestId) return;
                } finally { clearTimeout(timer); }
            }
            if (!data) throw new Error("error");
            if (id !== requestId) return;
            if (!Array.isArray(data.elements) || data.remark || data.elements.length > 60000) throw new Error("error");
            var points = typeof pathCoordinates !== "undefined" ? pathCoordinates : [];
            var history = [], stride = Math.max(1, Math.ceil(points.length / 1500));
            for (var i = 0; i < points.length; i += stride) {
                history.push({lat:points[i].lat, lng:points[i].lng});
            }
            var route = await planInWorker(data.elements, origin, minutes, history);
            if (id !== requestId) return;
            routeLayer.clearLayers();
            L.polyline(route.coords.map(function (p) { return [p.lat, p.lng]; }), {pane:"nearbyToolsPane", color:"#4fc3f7", weight:5, dashArray:"8 6"}).addTo(routeLayer);
            L.circleMarker(route.coords[0], {pane:"nearbyToolsPane", radius:7, color:"#4fc3f7"}).bindTooltip(label("start")).addTo(routeLayer);
            var stops = node("stops"); stops.replaceChildren();
            route.stops.forEach(function (p, i) {
                var title = label("point") + " " + (i + 1);
                // Only describe real, named tourism data located near this waypoint.
                if (typeof tourMarkers !== "undefined") {
                    var nearby = tourMarkers.map(function (marker) { return marker._tourItem; }).find(function (item) {
                        return item && item.title && L.latLng(p.lat, p.lng).distanceTo([Number(item.mapy), Number(item.mapx)]) < 100;
                    });
                    if (nearby) title += " · " + nearby.title;
                }
                L.circleMarker(p, {pane:"nearbyToolsPane", radius:5, color:"#4fc3f7"}).bindTooltip(title).addTo(routeLayer);
                var row = document.createElement("li"); row.textContent = title; stops.append(row);
            });
            node("summary").textContent = label("estimate", {min:Math.round(route.length / 1.1 / 60), km:(route.length / 1000).toFixed(2)});
            node("approach").textContent = label("approach", {m:Math.round(route.approach)});
            toolsMap.fitBounds(route.coords.map(function (p) { return [p.lat, p.lng]; }), {padding:[35, 35]});
            status("");
        } catch (error) {
            if (id === requestId) status(["location","noRoad","noRoute"].includes(error.message) ? error.message : "error");
        } finally {
            if (id === requestId) { controller = null; node("make").disabled = false; }
        }
    }
    function setDraft(p) {
        draft.lat = p.lat; draft.lng = p.lng;
        node("selected").textContent = label("selected") + " · " + p.lat.toFixed(5) + ", " + p.lng.toFixed(5);
        if (p.accuracy) status("weak", {m:Math.round(p.accuracy)});
    }
    function edit(record) {
        locatingId++; photoId++; photoBusy = false; node("save").disabled = false;
        draft = record ? Object.assign({}, record) : {id:crypto.randomUUID(), name:"", note:"", photo:null};
        node("name").value = draft.name; node("note").value = draft.note;
        node("photo").value = ""; node("selected").textContent = "";
        node("editor").hidden = false;
        if (validPosition(draft)) setDraft(draft);
        previewPhoto(); status("");
    }
    var previewUrl;
    function previewPhoto() {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        previewUrl = null;
        node("preview").hidden = !draft.photo;
        node("preview").removeAttribute("src");
        if (draft.photo) { previewUrl = URL.createObjectURL(draft.photo); node("preview").src = previewUrl; }
    }
    async function readPhoto(file) {
        if (!file) return;
        var id = ++photoId;
        photoBusy = true; node("save").disabled = true;
        try {
            if (file.size > 15 * 1024 * 1024 || !/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error("image");
            var bitmap = await createImageBitmap(file);
            try {
                if (bitmap.width * bitmap.height > 50000000) throw new Error("image");
                var scale = Math.min(1, 1000 / Math.max(bitmap.width, bitmap.height));
                var canvas = document.createElement("canvas");
                canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
                canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
                var blob = await new Promise(function (resolve) { canvas.toBlob(resolve, "image/jpeg", 0.8); });
                if (!blob) throw new Error("image");
                if (id === photoId) { draft.photo = blob; previewPhoto(); }
            } finally { bitmap.close(); }
        } catch (_) { if (id === photoId) status("image"); }
        finally { if (id === photoId) { photoBusy = false; node("save").disabled = false; } }
    }
    async function saveItem() {
        if (photoBusy || !draft) return;
        draft.name = node("name").value.trim(); draft.note = node("note").value.trim();
        if (!draft.name || !validPosition(draft)) { status("required"); return; }
        node("save").disabled = true;
        var savingDraft = draft;
        try {
            var value = Object.assign({}, savingDraft, {savedAt:Date.now()});
            await records("put", value);
            if (draft === savingDraft) {
                node("editor").hidden = true; draft = null;
                if (!panel.hidden) status("saved");
            }
            await refreshItems();
        } catch (_) { status("storage"); }
        finally { node("save").disabled = false; }
    }
    async function refreshItems(append) {
        if (panel.hidden || mode !== "items") return;
        if (append && pageLoading) return;
        if (!append) { listVersion++; pageCursor = null; }
        var version = listVersion;
        pageLoading = true;
        node("more").disabled = true;
        try {
            var page = await records("list", append ? pageCursor : null);
            if (version !== listVersion || panel.hidden || mode !== "items") return;
            if (!append) { node("list").replaceChildren(); itemLayer.clearLayers(); }
            if (!append && !page.items.length) node("list").textContent = label("empty");
            pageCursor = page.cursor;
            node("more").hidden = !page.more;
            page.items.forEach(function (record) {
                if (!validPosition(record)) return;
                var row = document.createElement("article"), name = document.createElement("h3"), note = document.createElement("p"), date = document.createElement("small");
                name.textContent = record.name; note.textContent = record.note;
                date.textContent = new Date(record.savedAt).toLocaleString(document.documentElement.lang || "ko");
                row.append(name, note, date);
                function button(key, action) {
                    var b = document.createElement("button"); b.type = "button"; b.textContent = label(key); b.onclick = action; row.append(b);
                }
                var marker = L.marker([record.lat, record.lng], {pane:"nearbyToolsPane"}).addTo(itemLayer);
                var popup = document.createElement("span"); popup.textContent = record.name + " · " + record.note;
                marker.bindPopup(popup); marker.on("click", function () { open("items"); edit(record); });
                button("show", function () { close(); toolsMap.setView([record.lat, record.lng], 18); marker.openPopup(); });
                button("edit", function () { edit(record); });
                button("remove", async function () {
                    if (!window.confirm(label("confirm"))) return;
                    try { await records("delete", record.id); await refreshItems(); } catch (_) { status("storage"); }
                });
                node("list").append(row);
            });
        } catch (_) { if (!panel.hidden && version === listVersion) status("load"); }
        finally {
            if (version === listVersion) { pageLoading = false; node("more").disabled = false; }
        }
    }
    function setup() {
        if (panel || typeof L === "undefined") return;
        toolsMap = typeof map !== "undefined" && typeof map.createPane === "function" ? map : null;
        if (!toolsMap) return;
        toolsMap.createPane("nearbyToolsPane"); toolsMap.getPane("nearbyToolsPane").style.zIndex = 635;
        routeLayer = L.layerGroup().addTo(toolsMap); itemLayer = L.layerGroup().addTo(toolsMap);
        panel = document.createElement("section");
        panel.id = "nearby-tools"; panel.tabIndex = -1; panel.hidden = true; panel.setAttribute("role", "dialog"); panel.setAttribute("aria-labelledby", "nearby-tools-title");
        panel.innerHTML = '<header><h2 id="nearby-tools-title" data-nearby="title"></h2><button type="button" data-nearby="close" data-nearby-text="close"></button></header>' +
            '<div data-nearby="walk"><div class="nearby-time">' + [10,20,40].map(function (m) { return '<button type="button" data-minutes="' + m + '"></button>'; }).join("") + '</div>' +
            '<p data-nearby-text="consent"></p><button type="button" data-nearby="make" data-nearby-text="make"></button><button type="button" data-nearby="clear" data-nearby-text="clear"></button>' +
            '<p data-nearby="summary"></p><p data-nearby="approach"></p><ol data-nearby="stops"></ol><p data-nearby-text="notice"></p><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap contributors</a></div>' +
            '<div data-nearby="items"><p data-nearby-text="local"></p><button type="button" data-nearby="new" data-nearby-text="newItem"></button><div data-nearby="editor" hidden>' +
            '<label><span data-nearby-text="name"></span><input data-nearby="name" maxlength="80"></label>' +
            '<label><span data-nearby-text="note"></span><textarea data-nearby="note" maxlength="500" rows="3"></textarea></label>' +
            '<label><span data-nearby-text="photo"></span><input data-nearby="photo" type="file" accept="image/jpeg,image/png,image/webp" capture="environment"></label><img data-nearby="preview" alt="" hidden>' +
            '<button type="button" data-nearby="current" data-nearby-text="current"></button><button type="button" data-nearby="pick" data-nearby-text="pick"></button><p data-nearby="selected"></p>' +
            '<button type="button" data-nearby="save" data-nearby-text="save"></button><button type="button" data-nearby="cancel" data-nearby-text="cancel"></button></div><div data-nearby="list"></div><button type="button" data-nearby="more" data-nearby-text="more" hidden></button></div>' +
            '<p data-nearby="status" role="status" aria-live="polite"></p>';
        document.body.append(panel);
        L.DomEvent.disableClickPropagation(panel);
        var qrBox=document.createElement("div");
        qrBox.innerHTML='<button type="button" data-nearby="qrCreate"></button><button type="button" data-nearby="qrScan"></button><label><span data-nearby="qrPhotoLabel"></span><input type="file" accept="image/*" data-nearby="qrPhoto"></label><video data-nearby="qrVideo" playsinline muted hidden style="width:100%"></video><canvas data-nearby="qrCanvas" hidden></canvas><a data-nearby="qrDownload" hidden download="giloa-car-qr.png"></a><label>QR<input data-nearby="qrCode" maxlength="100"></label><button type="button" data-nearby="qrUse">QR ✓</button>';
        node("items").prepend(qrBox);
        function qrText(){node("qrCreate").textContent=qw(0);node("qrScan").textContent=qw(1);node("qrPhotoLabel").textContent=qw(2);node("qrDownload").textContent=qw(7);}
        qrText();new MutationObserver(qrText).observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});
        node("qrCreate").onclick=async function(){try{await vendor("qrcode.js","qrcode");var raw="GILOA:CAR:1:"+crypto.randomUUID();node("qrCode").value=raw;var canvas=node("qrCanvas");var qr=qrcode(0,"M");qr.addData(raw);qr.make();var count=qr.getModuleCount(),scale=8;canvas.width=canvas.height=(count+8)*scale;var ctx=canvas.getContext("2d");ctx.fillStyle="#fff";ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle="#000";for(var y=0;y<count;y++)for(var x=0;x<count;x++)if(qr.isDark(y,x))ctx.fillRect((x+4)*scale,(y+4)*scale,scale,scale);canvas.hidden=false;node("qrDownload").href=canvas.toDataURL("image/png");node("qrDownload").hidden=false;}catch(_){node("status").textContent=qw(3);}};
        node("qrScan").onclick=scanQR;
        node("qrUse").onclick=function(){acceptQR(node("qrCode").value);};
        node("qrPhoto").onchange=async function(){var file=this.files[0];this.value="";if(!file)return;stopQR();var session=qrSession,bitmap;try{if(file.size>15*1024*1024)throw Error();await vendor("jsQR.js","jsQR");bitmap=await createImageBitmap(file);if(session!==qrSession)return;var canvas=document.createElement("canvas"),ratio=Math.min(1,1600/Math.max(bitmap.width,bitmap.height));canvas.width=Math.round(bitmap.width*ratio);canvas.height=Math.round(bitmap.height*ratio);var ctx=canvas.getContext("2d");ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);var data=ctx.getImageData(0,0,canvas.width,canvas.height),result=jsQR(data.data,data.width,data.height);if(!result)throw Error();await acceptQR(result.data);}catch(_){if(session===qrSession)node("status").textContent=qw(3);}finally{if(bitmap)bitmap.close();}};
        document.addEventListener("visibilitychange",function(){if(document.hidden)stopQR();});window.addEventListener("pagehide",stopQR);
        var host = document.createElement("div"); host.className = "nearby-tools-entry";
        ["walk", "items"].forEach(function (kind) {
            var b = document.createElement("button"); b.type = "button"; b.dataset.nearbyOpen = kind; b.onclick = function (event) { event.preventDefault(); event.stopPropagation(); open(kind); }; host.append(b);
        });
        var sidebar = document.querySelector("#sidebar .sidebar-header");
        if (sidebar) sidebar.after(host);
        node("close").onclick = close; node("make").onclick = makeWalk;
        node("clear").onclick = function () { cancelWork(); routeLayer.clearLayers(); node("summary").textContent = node("approach").textContent = ""; node("stops").replaceChildren(); status(""); };
        panel.querySelectorAll("[data-minutes]").forEach(function (button) {
            button.onclick = function () { cancelWork(); minutes = Number(button.dataset.minutes); refreshText(); status(""); };
        });
        node("new").onclick = function () { edit(null); };
        node("more").onclick = function () { refreshItems(true); };
        node("photo").onchange = function () { readPhoto(this.files[0]); };
        node("current").onclick = async function () {
            var id = ++locatingId; status("waiting");
            try { var p = await position(); if (id === locatingId && draft) { status(""); setDraft(p); } }
            catch (_) { if (id === locatingId) status("location"); }
        };
        node("pick").onclick = function () { locatingId++; picking = true; panel.classList.add("is-picking"); status("picking"); };
        node("cancel").onclick = function () { locatingId++; photoId++; draft = null; node("editor").hidden = true; };
        node("save").onclick = saveItem;
        toolsMap.on("click", function (event) {
            if (panel.hidden) return;
            var target = event.originalEvent && event.originalEvent.target;
            if (target && target.closest && target.closest("#nearby-tools,.nearby-tools-entry")) return;
            if (!picking) {
                if (mode === "items" && !node("editor").hidden) return;
                close(); return;
            }
            picking = false; panel.classList.remove("is-picking");
            if (draft) { setDraft(toolsMap.wrapLatLng(event.latlng)); status(""); }
        });
        document.addEventListener("keydown", function (event) { if (event.key === "Escape" && !panel.hidden) close(); });
        new MutationObserver(function () { refreshText(); if (mode === "items" && !panel.hidden) refreshItems(); }).observe(document.documentElement, {attributes:true, attributeFilter:["lang"]});
        window.addEventListener("focus", function () { if (!panel.hidden && mode === "items" && node("editor").hidden) refreshItems(); });
        refreshText();
        window.GiloaNearbyTools = {open:open, close:close};
    }
    window.addEventListener("giloa:ready", setup);
    setup();
})();

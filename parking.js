/* Personal parking is stored separately from journey records. */
(function () {
    'use strict';
    var KEY = 'giloa-personal-parking-v1';
    var TEXT = {
        ko: {title:'내 차 찾기', empty:'저장된 주차 위치가 없어요.', gps:'현재 위치 사용', pick:'지도에서 위치 선택', picking:'주차장 위치를 지도에서 눌러 주세요.', location:'위치를 선택해 주세요.', selected:'선택한 주차 위치', floor:'층 (예: B3, 5층)', zone:'구역 (예: C-17)', note:'메모 (예: 동쪽 엘리베이터)', photo:'표지판 사진', removePhoto:'사진 지우기', save:'주차 위치 저장', edit:'수정', find:'지도에서 보기', clear:'출차 완료', confirm:'저장된 주차 기록을 지울까요?', close:'닫기', cancel:'취소', waiting:'위치 확인 중…', gpsError:'위치를 확인하지 못했어요. 지도에서 위치를 선택해 주세요.', weak:'위치 오차가 커요. 지도에서 실제 주차장 위치를 확인해 주세요.', accuracy:'GPS 오차 약 {m}m', manual:'지도에서 지정한 위치', storageError:'저장 공간에 접근하지 못했어요. 브라우저 설정과 여유 공간을 확인해 주세요.', imageError:'사진을 읽지 못했어요. JPG 또는 PNG 사진을 선택해 주세요.', local:'이 브라우저에 저장돼요. 실내 층·구역은 직접 입력해 주세요.', saved:'주차 위치를 저장했어요.'},
        en: {title:'Find my car', empty:'No parking location saved.', gps:'Use current location', pick:'Choose on map', picking:'Tap the parking location on the map.', location:'Choose a location.', selected:'Selected parking location', floor:'Floor (e.g. B3, 5F)', zone:'Zone (e.g. C-17)', note:'Note (e.g. east elevator)', photo:'Sign photo', removePhoto:'Remove photo', save:'Save parking location', edit:'Edit', find:'Show on map', clear:'Finish parking', confirm:'Delete this parking record?', close:'Close', cancel:'Cancel', waiting:'Finding location…', gpsError:'Location unavailable. Choose a location on the map.', weak:'Low location accuracy. Check the actual parking location on the map.', accuracy:'GPS accuracy about {m}m', manual:'Location chosen on map', storageError:'Storage unavailable. Check browser settings and available space.', imageError:'Unable to read photo. Choose a JPG or PNG image.', local:'Saved in this browser. Enter indoor floor and zone manually.', saved:'Parking location saved.'},
        ja: {title:'車を探す', empty:'駐車位置は未保存です。', gps:'現在地を使う', pick:'地図で選択', picking:'地図で駐車場の位置をタップしてください。', location:'位置を選択してください。', selected:'選択した駐車位置', floor:'階（例 B3、5階）', zone:'区画（例 C-17）', note:'メモ（例 東側エレベーター）', photo:'看板の写真', removePhoto:'写真を削除', save:'駐車位置を保存', edit:'編集', find:'地図で表示', clear:'出庫完了', confirm:'駐車記録を削除しますか？', close:'閉じる', cancel:'キャンセル', waiting:'現在地を確認中…', gpsError:'現在地を取得できません。地図で選択してください。', weak:'位置の誤差が大きいため、地図で確認してください。', accuracy:'GPS誤差 約{m}m', manual:'地図で指定した位置', storageError:'保存できません。ブラウザ設定と空き容量を確認してください。', imageError:'写真を読み込めません。JPGまたはPNGを選択してください。', local:'このブラウザに保存します。屋内の階と区画は入力してください。', saved:'駐車位置を保存しました。'},
        zh: {title:'寻找我的车', empty:'尚未保存停车位置。', gps:'使用当前位置', pick:'在地图上选择', picking:'请点击地图上的停车位置。', location:'请选择位置。', selected:'已选停车位置', floor:'楼层（如 B3、5层）', zone:'区域（如 C-17）', note:'备注（如 东侧电梯）', photo:'标识照片', removePhoto:'删除照片', save:'保存停车位置', edit:'编辑', find:'在地图上显示', clear:'完成停车', confirm:'删除此停车记录？', close:'关闭', cancel:'取消', waiting:'正在定位…', gpsError:'无法定位，请在地图上选择。', weak:'定位误差较大，请在地图上确认实际位置。', accuracy:'GPS误差约 {m}米', manual:'地图上选择的位置', storageError:'无法保存，请检查浏览器设置和可用空间。', imageError:'无法读取照片，请选择JPG或PNG。', local:'保存在此浏览器中。室内楼层和区域请手动输入。', saved:'停车位置已保存。'},
        es: {title:'Encontrar mi coche', empty:'No hay ubicación guardada.', gps:'Usar ubicación actual', pick:'Elegir en el mapa', picking:'Toca el aparcamiento en el mapa.', location:'Elige una ubicación.', selected:'Ubicación seleccionada', floor:'Planta (p. ej. B3)', zone:'Zona (p. ej. C-17)', note:'Nota', photo:'Foto del cartel', removePhoto:'Quitar foto', save:'Guardar aparcamiento', edit:'Editar', find:'Ver en el mapa', clear:'Finalizar aparcamiento', confirm:'¿Eliminar este registro?', close:'Cerrar', cancel:'Cancelar', waiting:'Localizando…', gpsError:'Ubicación no disponible. Elige en el mapa.', weak:'Poca precisión. Comprueba la ubicación en el mapa.', accuracy:'Precisión GPS de unos {m}m', manual:'Ubicación elegida en el mapa', storageError:'No se pudo guardar. Revisa el espacio y los ajustes.', imageError:'No se pudo leer la foto. Elige JPG o PNG.', local:'Se guarda en este navegador. Introduce la planta y zona.', saved:'Ubicación guardada.'},
        fr: {title:'Retrouver ma voiture', empty:'Aucun stationnement enregistré.', gps:'Utiliser ma position', pick:'Choisir sur la carte', picking:'Touchez le parking sur la carte.', location:'Choisissez une position.', selected:'Stationnement sélectionné', floor:'Étage (ex. B3)', zone:'Zone (ex. C-17)', note:'Note', photo:'Photo du panneau', removePhoto:'Supprimer la photo', save:'Enregistrer le stationnement', edit:'Modifier', find:'Voir sur la carte', clear:'Terminer le stationnement', confirm:'Supprimer cet enregistrement ?', close:'Fermer', cancel:'Annuler', waiting:'Localisation…', gpsError:'Position indisponible. Choisissez sur la carte.', weak:'Précision faible. Vérifiez la position sur la carte.', accuracy:'Précision GPS environ {m}m', manual:'Position choisie sur la carte', storageError:'Enregistrement impossible. Vérifiez les réglages et l’espace disponible.', imageError:'Photo illisible. Choisissez JPG ou PNG.', local:'Enregistré dans ce navigateur. Saisissez l’étage et la zone.', saved:'Stationnement enregistré.'}
    };
    var EXTRA = {
        ko:{memo:'메모',parking:'주차',camera:'기둥 번호 촬영',shoot:'촬영하고 읽기',gallery:'기존 사진에서 읽기',cameraError:'카메라를 열지 못했어요. 사진을 선택하거나 직접 입력해 주세요.',reading:'층·구역 번호를 읽는 중… 처음에는 인식 도구를 내려받아 시간이 걸릴 수 있어요.',review:'읽은 번호를 확인·수정한 뒤 저장해 주세요.',ocrError:'번호를 읽지 못했어요. 다시 촬영하거나 직접 입력해 주세요.',local:'사진은 기기 안에서만 인식하고 저장하지 않아요. 확인한 층·구역·메모와 위치만 이 브라우저에 저장돼요.'},
        en:{memo:'Memo',parking:'Parking',camera:'Scan pillar number',shoot:'Capture and read',gallery:'Read existing photo',cameraError:'Camera unavailable. Select a photo or enter the details.',reading:'Reading floor and zone… The first scan downloads the recognition tools.',review:'Check and correct the numbers before saving.',ocrError:'No number recognized. Try again or enter the details.',local:'Photos are processed on this device and never saved by GILOA. Only reviewed text and location are saved in this browser.'},
        ja:{memo:'メモ',parking:'駐車',camera:'柱番号を撮影',shoot:'撮影して読み取る',gallery:'既存の写真から読む',cameraError:'カメラを開けません。写真を選択するか入力してください。',reading:'階と区画を認識中…初回は認識ツールを取得します。',review:'番号を確認・修正して保存してください。',ocrError:'認識できません。再撮影するか入力してください。',local:'写真は端末内で認識し保存しません。確認した文字と位置のみこのブラウザに保存します。'},
        zh:{memo:'备注',parking:'停车',camera:'拍摄立柱编号',shoot:'拍摄并识别',gallery:'从已有照片识别',cameraError:'无法打开相机，请选择照片或手动输入。',reading:'正在识别楼层和区域…首次需下载识别工具。',review:'请核对并修改编号后保存。',ocrError:'未识别到编号，请重拍或手动输入。',local:'照片仅在设备内识别，不会保存。仅在此浏览器中保存核对后的文字和位置。'},
        es:{memo:'Nota',parking:'Aparcar',camera:'Fotografiar número',shoot:'Capturar y leer',gallery:'Leer foto existente',cameraError:'Cámara no disponible. Elige una foto o escribe los datos.',reading:'Leyendo planta y zona… La primera vez se descargan las herramientas.',review:'Revisa y corrige los números antes de guardar.',ocrError:'No se reconoció el número. Reintenta o escribe los datos.',local:'La foto se procesa en el dispositivo y no se guarda. Solo se guardan los datos revisados y la ubicación en este navegador.'},
        fr:{memo:'Note',parking:'Parking',camera:'Photographier le numéro',shoot:'Capturer et lire',gallery:'Lire une photo existante',cameraError:'Caméra indisponible. Choisissez une photo ou saisissez les informations.',reading:'Lecture de l’étage et de la zone… Le premier scan télécharge les outils.',review:'Vérifiez et corrigez les numéros avant d’enregistrer.',ocrError:'Aucun numéro reconnu. Réessayez ou saisissez les informations.',local:'La photo est traitée sur cet appareil et n’est pas enregistrée. Seuls les textes vérifiés et la position sont conservés dans ce navigateur.'}
    };
    Object.keys(TEXT).forEach(function (lang) { Object.assign(TEXT[lang], EXTRA[lang]); });
    var parkingMap, marker, draftMarker, record = null, draft = null, panel, button;
    var stream = null, cameraRequest = 0, ocrTask = null, memoContext = null;
    var editing = false, picking = false, photoLoading = false, request = 0, photoRequest = 0;
    function words() {
        var lang = typeof currentLang === 'string' ? currentLang : document.documentElement.lang;
        return TEXT[String(lang || 'ko').slice(0, 2)] || TEXT.en;
    }
    function valid(value) {
        return value && typeof value.lat === 'number' && Number.isFinite(value.lat) && Math.abs(value.lat) <= 90 &&
            typeof value.lng === 'number' && Number.isFinite(value.lng) && Math.abs(value.lng) <= 180;
    }
    function load() {
        var value = JSON.parse(localStorage.getItem(KEY) || 'null');
        if (!valid(value)) return null;
        return {lat:value.lat, lng:value.lng, accuracy:Number(value.accuracy) || null,
            floor:String(value.floor || '').slice(0, 30), zone:String(value.zone || '').slice(0, 60),
            note:String(value.note || '').slice(0, 300), photo:/^data:image\/jpeg;base64,/.test(value.photo || '') ? value.photo : '',
            savedAt:Number(value.savedAt) || 0};
    }
    function node(id) { return panel.querySelector('[data-parking="' + id + '"]'); }
    function status(key) { node('status').textContent = words()[key] || ''; }
    function clearDraftMarker() {
        if (draftMarker) parkingMap.removeLayer(draftMarker);
        draftMarker = null;
    }
    function stopCamera() {
        cameraRequest++;
        if (stream) stream.getTracks().forEach(function (track) { track.stop(); });
        stream = null;
        if (panel) { node('video').srcObject = null; node('cameraView').hidden = true; }
    }
    function cancelPhoto() {
        photoRequest++;
        if (ocrTask) ocrTask.cancel();
        ocrTask = null; photoLoading = false;
        stopCamera();
        if (panel) node('photo').value = '';
    }
    function close() {
        cancelPhoto();
        panel.hidden = true;
        panel.classList.remove('is-picking');
        photoLoading = false;
        request++;
        photoRequest++;
        picking = false;
        clearDraftMarker();
        parkingMap.getContainer().classList.remove('parking-picking');
        button.focus();
    }
    function updateMarker() {
        if (marker) parkingMap.removeLayer(marker);
        marker = null;
        button.setAttribute('aria-label', words().title);
        button.title = words().title;
        button.classList.toggle('has-parking', !!record);
        if (!record) return;
        var label = document.createElement('span');
        label.className = 'personal-parking-pin';
        label.textContent = '🚗' + (record.floor ? ' ' + record.floor : '');
        marker = L.marker([record.lat, record.lng], {pane:'personalParkingPane', bubblingMouseEvents:false,
            title:words().title, icon:L.divIcon({className:'personal-parking-marker', html:label, iconSize:[90,40], iconAnchor:[45,40]})}).addTo(parkingMap);
        marker.on('click', function () { open(false); });
    }
    function refresh() {
        var w = words();
        document.querySelectorAll('[data-location-tab]').forEach(function (el) { el.textContent = w[el.dataset.locationTab]; });
        panel.querySelectorAll('[data-parking-text]').forEach(function (el) { el.textContent = w[el.dataset.parkingText]; });
        node('close').setAttribute('aria-label', w.close);
        node('preview').alt = w.photo;
        node('editor').hidden = !editing;
        node('details').hidden = editing;
        node('location').textContent = valid(draft) ? w.selected + ' · ' + draft.lat.toFixed(5) + ', ' + draft.lng.toFixed(5) : w.location;
        node('save').disabled = !valid(draft) || photoLoading;
        var photo = editing ? draft && draft.photo : record && record.photo;
        node('preview').hidden = !photo;
        if (photo) node('preview').src = photo;
        else node('preview').removeAttribute('src');
        node('removePhoto').hidden = !editing || !photo;
        node('summary').textContent = record ? [record.floor, record.zone, record.note].filter(Boolean).join(' · ') || w.title : w.empty;
        node('date').textContent = record && record.savedAt ? new Date(record.savedAt).toLocaleString(document.documentElement.lang || 'ko') : '';
        node('quality').textContent = record ? (record.accuracy ? w.accuracy.replace('{m}', Math.round(record.accuracy)) : w.manual) : '';
        node('find').hidden = node('edit').hidden = node('clear').hidden = !record;
    }
    function open(edit, fromMemo) {
        cancelPhoto();
        if (!fromMemo) memoContext = null;
        request++; photoRequest++; picking = false; photoLoading = false; clearDraftMarker();
        panel.classList.remove('is-picking');
        parkingMap.getContainer().classList.remove('parking-picking');
        editing = edit || !record;
        draft = record ? Object.assign({}, record) : {photo:''};
        ['floor','zone','note'].forEach(function (key) { node(key).value = draft[key] || ''; });
        node('photo').value = '';
        node('gps').disabled = false;
        node('save').disabled = false;
        panel.hidden = false;
        status(''); refresh(); node('close').focus();
    }
    function chooseLocation(lat, lng, accuracy) {
        draft.lat = lat; draft.lng = lng; draft.accuracy = accuracy || null;
        clearDraftMarker();
        draftMarker = L.marker([lat,lng], {pane:'personalParkingPane', opacity:0.7}).addTo(parkingMap);
        parkingMap.panTo([lat,lng]);
        refresh();
    }
    function locate() {
        var id = ++request;
        status('waiting'); node('gps').disabled = true;
        if (!navigator.geolocation) { node('gps').disabled = false; status('gpsError'); return; }
        navigator.geolocation.getCurrentPosition(function (position) {
            if (id !== request) return;
            node('gps').disabled = false;
            if (!valid({lat:position.coords.latitude,lng:position.coords.longitude})) { status('gpsError'); return; }
            chooseLocation(position.coords.latitude, position.coords.longitude, position.coords.accuracy);
            status(position.coords.accuracy > 50 ? 'weak' : '');
        }, function () {
            if (id !== request) return;
            node('gps').disabled = false; status('gpsError');
        }, {enableHighAccuracy:true, timeout:12000, maximumAge:0});
    }
    function pick() {
        cancelPhoto();
        request++; node('gps').disabled = false;
        picking = true; panel.classList.add('is-picking');
        parkingMap.getContainer().classList.add('parking-picking');
        node('editor').hidden = true; node('preview').hidden = true; node('removePhoto').hidden = true;
        status('picking');
    }
    function save() {
        if (!valid(draft) || photoLoading) return;
        var next = Object.assign({}, draft, {savedAt:Date.now()});
        ['floor','zone','note'].forEach(function (key) { next[key] = node(key).value.trim(); });
        try { localStorage.setItem(KEY, JSON.stringify(next)); }
        catch (_) { status('storageError'); return; }
        record = next; updateMarker(); open(false); status('saved');
        parkingMap.panTo([record.lat,record.lng]);
    }
    function clear() {
        if (!window.confirm(words().confirm)) return;
        try { localStorage.removeItem(KEY); }
        catch (_) { status('storageError'); return; }
        record = null; updateMarker(); close();
    }
    function readPhoto(file) {
        cancelPhoto();
        if (!file || !/^image\//.test(file.type) || file.size > 25 * 1024 * 1024) { status('imageError'); return; }
        if (!window.GiloaParkingOcr) { status('ocrError'); return; }
        var id = photoRequest;
        var before = {floor:node('floor').value, zone:node('zone').value};
        photoLoading = true; refresh(); status('reading');
        ocrTask = window.GiloaParkingOcr.recognize(file);
        ocrTask.promise.then(function (result) {
            if (id !== photoRequest || panel.hidden) return;
            ['floor','zone'].forEach(function (key) {
                if (result[key] && node(key).value === before[key]) node(key).value = result[key];
            });
            photoLoading = false; ocrTask = null; refresh();
            status(result.floor || result.zone ? 'review' : 'ocrError');
        }).catch(function (error) {
            if (id !== photoRequest || panel.hidden) return;
            console.warn('Parking OCR unavailable', error && error.message ? error.message : String(error));
            photoLoading = false; ocrTask = null; refresh(); status('ocrError');
        });
    }
    function photoChanged() { var file = node('photo').files[0]; if (file) readPhoto(file); }
    function camera() {
        cancelPhoto();
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { status('cameraError'); return; }
        var id = ++cameraRequest;
        navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false}).then(function (value) {
            if (id !== cameraRequest || panel.hidden) { value.getTracks().forEach(function (track) { track.stop(); }); return; }
            stream = value; node('video').srcObject = value; node('cameraView').hidden = false;
            var playing = node('video').play(); if (playing && playing.catch) playing.catch(function () { if (id === cameraRequest) { stopCamera(); status('cameraError'); } });
            status('');
        }).catch(function () { if (id === cameraRequest) status('cameraError'); });
    }
    function shoot() {
        var video = node('video');
        if (!video.videoWidth || !video.videoHeight) { status('cameraError'); return; }
        var canvas = document.createElement('canvas'), id = cameraRequest;
        var scale = Math.min(1, 1800 / Math.max(video.videoWidth, video.videoHeight));
        canvas.width = Math.round(video.videoWidth * scale); canvas.height = Math.round(video.videoHeight * scale);
        try {
            canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(function (blob) {
                canvas.width = canvas.height = 0;
                if (id !== cameraRequest || panel.hidden) return;
                stopCamera();
                if (blob) readPhoto(blob); else status('imageError');
            }, 'image/jpeg', 0.92);
        } catch (_) { canvas.width = canvas.height = 0; stopCamera(); status('imageError'); }
    }
    function memo() {
        var context = memoContext || (valid(draft) ? {lat:draft.lat, lng:draft.lng, note:''} : null);
        if (!context || typeof window.openSpecialPlaceEditor !== 'function') return;
        close();
        window.openSpecialPlaceEditor(context.lat, context.lng);
        document.getElementById('special-place-note').value = context.note;
    }
    function addMemoTabs() {
        var title = document.getElementById('special-place-title');
        if (!title || document.getElementById('location-memo-tabs')) return;
        var tabs = document.createElement('div'); tabs.id = 'location-memo-tabs'; tabs.className = 'location-tabs';
        tabs.innerHTML = '<button type="button" aria-pressed="true" data-location-tab="memo"></button><button type="button" aria-pressed="false" data-location-tab="parking"></button>';
        title.after(tabs);
        tabs.querySelector('[data-location-tab="parking"]').onclick = function () {
            if (typeof specialPlaceEditorCoords === 'undefined' || !specialPlaceEditorCoords) return;
            var coords = specialPlaceEditorCoords;
            var context = {lat:coords.latitude, lng:coords.longitude, note:document.getElementById('special-place-note').value};
            window.closeSpecialPlaceEditor();
            open(true, true); memoContext = context;
            chooseLocation(context.lat, context.lng, null);
            camera();
        };
    }
    function setup() {
        if (panel) return;
        parkingMap = window.giloaMapBootstrap || (typeof map !== 'undefined' && typeof map.createPane === 'function' ? map : null);
        if (!parkingMap || !window.L || !document.getElementById('controls')) return;
        parkingMap.createPane('personalParkingPane').style.zIndex = '680';
        button = document.createElement('button'); button.type = 'button'; button.id = 'personal-parking-button'; button.className = 'btn'; button.textContent = '🚗';
        document.getElementById('controls').appendChild(button);
        panel = document.createElement('section'); panel.id = 'personal-parking-panel'; panel.hidden = true;
        panel.setAttribute('role','dialog'); panel.setAttribute('aria-labelledby','personal-parking-title');
        panel.innerHTML = '<header><h2 id="personal-parking-title" data-parking-text="title"></h2><button type="button" data-parking="close">×</button></header>' +
            '<div class="location-tabs"><button type="button" data-parking="memo" data-location-tab="memo" aria-pressed="false"></button><button type="button" data-parking="parkingTab" data-location-tab="parking" aria-pressed="true"></button></div><p class="parking-local" data-parking-text="local"></p><p data-parking="status" role="status" aria-live="polite"></p><div data-parking="details"><p data-parking="summary"></p><small data-parking="date"></small><p data-parking="quality"></p><div class="parking-actions"><button type="button" data-parking="find" data-parking-text="find"></button><button type="button" data-parking="edit" data-parking-text="edit"></button><button type="button" data-parking="clear" data-parking-text="clear"></button></div></div>' +
            '<div data-parking="editor"><div class="parking-actions"><button type="button" data-parking="gps" data-parking-text="gps"></button><button type="button" data-parking="pick" data-parking-text="pick"></button></div><p data-parking="location"></p>' +
            '<button type="button" data-parking="camera" data-parking-text="camera"></button><div data-parking="cameraView" hidden><video data-parking="video" autoplay muted playsinline></video><div class="parking-actions"><button type="button" data-parking="shoot" data-parking-text="shoot"></button><button type="button" data-parking="cancelCamera" data-parking-text="cancel"></button></div></div>' +
            '<label><span data-parking-text="floor"></span><input data-parking="floor" maxlength="30"></label><label><span data-parking-text="zone"></span><input data-parking="zone" maxlength="60"></label><label><span data-parking-text="note"></span><textarea data-parking="note" maxlength="300" rows="2"></textarea></label>' +
            '<label><span data-parking-text="gallery"></span><input data-parking="photo" type="file" accept="image/jpeg,image/png,image/webp"></label><button type="button" data-parking="save" data-parking-text="save"></button></div>' +
            '<img data-parking="preview" alt="" hidden><button type="button" data-parking="removePhoto" data-parking-text="removePhoto" hidden></button>';
        document.body.appendChild(panel);
        L.DomEvent.disableClickPropagation(panel); L.DomEvent.disableScrollPropagation(panel);
        button.addEventListener('click',function () { panel.hidden ? open(false) : close(); });
        addMemoTabs();
        node('camera').onclick = camera; node('shoot').onclick = shoot; node('cancelCamera').onclick = stopCamera;
        node('memo').onclick = memo; node('parkingTab').onclick = function () { if (editing) camera(); };
        node('close').onclick = close; node('gps').onclick = locate; node('pick').onclick = pick;
        node('save').onclick = save; node('clear').onclick = clear;
        node('edit').onclick = function () { open(true); };
        node('find').onclick = function () { parkingMap.setView([record.lat,record.lng],Math.max(17,parkingMap.getZoom())); close(); };
        node('removePhoto').onclick = function () { cancelPhoto(); draft.photo = ''; node('photo').value = ''; refresh(); };
        node('photo').addEventListener('change',photoChanged);
        parkingMap.on('click',function (event) {
            if (panel.hidden) return;
            if (!picking) { close(); return; }
            picking = false; panel.classList.remove('is-picking');
            parkingMap.getContainer().classList.remove('parking-picking');
            var point = parkingMap.wrapLatLng(event.latlng);
            chooseLocation(point.lat,point.lng,null); status('');
        });
        document.addEventListener('keydown',function (event) { if (event.key === 'Escape' && !panel.hidden) close(); });
        new MutationObserver(function () { updateMarker(); if (!panel.hidden) { refresh(); if (picking) { node('editor').hidden = true; status('picking'); } } }).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
        window.addEventListener('storage',function (event) {
            if (event.key !== KEY && event.key !== null) return;
            try { record = load(); updateMarker(); if (!panel.hidden && !editing) open(false); }
            catch (_) { if (!panel.hidden) status('storageError'); }
        });
        try { record = load(); } catch (_) { record = null; }
        updateMarker(); refresh();
    }
    window.addEventListener('giloa:ready',setup);
    setup();
}());

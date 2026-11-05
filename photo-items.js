/* Local photo icons. Originals remain in memory; only the chosen pictogram or re-encoded crop enters IndexedDB. */
(function () {
    'use strict';
    var TEXT = {
        ko: {title:'사진으로 만든 아이템',add:'+ 사진으로 아이템 추가',editor:'사진 자르기',camera:'사진 찍기',gallery:'사진 선택',hint:'사진을 움직이고 확대해서 담을 부분을 맞추세요. 방향키로도 움직일 수 있어요.',zoom:'확대',name:'아이템 이름',placeholder:'예: 산책길에서 발견한 꽃',save:'아이템 저장',cancel:'취소',close:'닫기',privacy:'원본은 길로아에 저장·전송하지 않아요. 자른 아이콘과 이름만 이 기기에 저장해요.',empty:'발견한 물건을 사진 아이템으로 모아 보세요.',loading:'사진을 여는 중…',saving:'저장 중…',invalid:'사진을 열지 못했어요. JPG, PNG 또는 WebP 사진을 선택해 주세요.',large:'사진이 너무 커요. 30MB 이하의 더 작은 사진을 선택해 주세요.',required:'사진을 선택하고 이름을 입력해 주세요.',error:'저장 공간에 접근하지 못했어요. 저장 공간이나 브라우저 설정을 확인하고 다시 시도해 주세요.',retry:'다시 불러오기',remove:'삭제',confirm:'이 사진 아이템을 삭제할까요?',saved:'아이템을 저장했어요.',label:'아이콘으로 자를 사진'},
        en: {title:'My photo items',add:'+ Add item from photo',editor:'Crop photo',camera:'Take photo',gallery:'Choose photo',hint:'Drag and zoom to frame your item. You can also use the arrow keys.',zoom:'Zoom',name:'Item name',placeholder:'e.g. A flower on my walk',save:'Save item',cancel:'Cancel',close:'Close',privacy:'Giloa does not save or upload the original. Only the cropped icon and name are saved on this device.',empty:'Collect things you discover as photo items.',loading:'Opening photo…',saving:'Saving…',invalid:'Cannot open this photo. Choose a JPG, PNG or WebP image.',large:'This photo is too large. Choose a smaller photo under 30 MB.',required:'Choose a photo and enter a name.',error:'Cannot access storage. Check free space and browser settings, then try again.',retry:'Try loading again',remove:'Delete',confirm:'Delete this photo item?',saved:'Item saved.',label:'Photo crop preview'},
        ja: {title:'写真で作ったアイテム',add:'+ 写真からアイテムを追加',editor:'写真を切り抜く',camera:'写真を撮る',gallery:'写真を選ぶ',hint:'写真を動かして拡大し、切り抜く範囲を合わせてください。矢印キーでも動かせます。',zoom:'拡大',name:'アイテム名',placeholder:'例：散歩道で見つけた花',save:'アイテムを保存',cancel:'キャンセル',close:'閉じる',privacy:'元の写真はGiloaに保存・送信しません。切り抜いたアイコンと名前だけをこの端末に保存します。',empty:'見つけたものを写真アイテムとして集めましょう。',loading:'写真を開いています…',saving:'保存中…',invalid:'写真を開けません。JPG・PNG・WebP画像を選んでください。',large:'写真が大きすぎます。30MB以下の写真を選んでください。',required:'写真を選び、名前を入力してください。',error:'保存領域にアクセスできません。空き容量とブラウザ設定を確認して再試行してください。',retry:'再読み込み',remove:'削除',confirm:'この写真アイテムを削除しますか？',saved:'保存しました。',label:'切り抜く写真'},
        zh: {title:'照片物品',add:'+ 从照片添加物品',editor:'裁剪照片',camera:'拍照',gallery:'选择照片',hint:'拖动并放大照片，调整裁剪范围。也可使用方向键。',zoom:'缩放',name:'物品名称',placeholder:'例如：散步时发现的花',save:'保存物品',cancel:'取消',close:'关闭',privacy:'Giloa不会保存或上传原始照片。仅在此设备保存裁剪后的图标和名称。',empty:'将发现的事物收集为照片物品。',loading:'正在打开照片…',saving:'正在保存…',invalid:'无法打开照片。请选择JPG、PNG或WebP图片。',large:'照片太大，请选择30MB以下的照片。',required:'请选择照片并输入名称。',error:'无法访问存储空间。请检查可用空间和浏览器设置后重试。',retry:'重新加载',remove:'删除',confirm:'删除此照片物品？',saved:'物品已保存。',label:'照片裁剪预览'}
    };
    var EXTRA = {
        ko:{style:'아이템 모양',symbol:'간단한 그림 아이콘',photo:'사진 그대로',kind:'아이콘 종류',edit:'아이콘 변경',iconHint:'이름으로 종류를 제안해요. 사진 자동 인식은 아니며, 원하는 아이콘을 직접 선택할 수 있어요.',privacy:'사진은 서버로 보내지 않아요. 선택한 그림 아이콘 또는 자른 사진과 이름만 이 기기에 저장해요.',editor:'아이템 만들기',required:'사진을 선택하고 이름을 입력해 주세요.',iconUnavailable:'아이콘을 불러오지 못했어요. 새로고침하거나 사진 방식을 선택해 주세요.'},
        en:{style:'Item appearance',symbol:'Simple icon',photo:'Keep photo',kind:'Icon type',edit:'Change icon',iconHint:'The name suggests a type. This is not photo recognition; choose any icon you like.',privacy:'Photos are not uploaded. Only the chosen icon or cropped photo and name are saved on this device.',editor:'Create item',required:'Choose a photo and enter a name.',iconUnavailable:'Icons could not load. Refresh or choose photo mode.'},
        ja:{style:'アイテムの見た目',symbol:'シンプルなアイコン',photo:'写真のまま',kind:'アイコンの種類',edit:'アイコンを変更',iconHint:'名前から種類を提案します。写真の自動認識ではありません。好きなアイコンを選べます。',privacy:'写真は送信しません。選んだアイコンまたは切り抜いた写真と名前だけを端末に保存します。',editor:'アイテムを作る',required:'写真を選び、名前を入力してください。',iconUnavailable:'アイコンを読み込めません。再読み込みするか写真を選んでください。'},
        zh:{style:'物品外观',symbol:'简洁图标',photo:'保留照片',kind:'图标类型',edit:'更换图标',iconHint:'根据名称推荐类型，并非自动识别照片。您可以自行选择图标。',privacy:'不会上传照片。仅在此设备保存所选图标或裁剪后的照片及名称。',editor:'创建物品',required:'请选择照片并输入名称。',iconUnavailable:'图标加载失败，请刷新或选择照片模式。'}
    };
    Object.keys(EXTRA).forEach(function(lang) { Object.assign(TEXT[lang], EXTRA[lang]); });
    var section, dialog, form, canvas, zoom, nameInput, status, saveButton, camera, gallery, grid;
    var dbPromise, records = [], urls = [], source = null, sourceURL = '', generation = 0, busy = false, loadedPhoto = false, loadFailed = false, lastStatus = '', returnFocus, loadSerial = 0;
    var crop = {zoom:1,x:0,y:0}, drag = null;
    var editingRecord = null, mode = 'symbol', manualSymbol = false, styleSelect, symbolSelect, symbolPreview;
    function icons() { return window.GiloaItemIcons; }
    function words() {
        var lang = typeof currentLang === 'string' ? currentLang : document.documentElement.lang;
        return TEXT[String(lang || 'ko').toLowerCase().split('-')[0]] || TEXT.en;
    }
    function text(tag, value, className) { var node = document.createElement(tag); node.textContent = value; if (className) node.className = className; return node; }
    function button(value, action) { var node = text('button', value); node.type = 'button'; node.addEventListener('click', action); return node; }
    function setStatus(key) { lastStatus = key; status.textContent = key ? words()[key] : ''; }
    function database() {
        if (!dbPromise) dbPromise = new Promise(function(resolve, reject) {
            var request = indexedDB.open('giloa-photo-items-v1', 1);
            request.onupgradeneeded = function() { request.result.createObjectStore('items', {keyPath:'id'}); };
            request.onsuccess = function() {
                var db = request.result;
                db.onversionchange = function() { db.close(); dbPromise = null; };
                resolve(db);
            };
            request.onerror = function() { dbPromise = null; reject(request.error); };
            request.onblocked = function() { dbPromise = null; reject(new Error('Storage blocked')); };
        });
        return dbPromise;
    }
    async function store(mode, action) {
        var db = await database();
        return new Promise(function(resolve, reject) {
            var tx = db.transaction('items', mode), request;
            try { request = action(tx.objectStore('items')); } catch (err) { reject(err); return; }
            tx.oncomplete = function() { resolve(request.result); };
            tx.onerror = tx.onabort = function() { reject(tx.error || new Error('Storage failed')); };
        });
    }
    function releaseCards() { urls.forEach(function(url) { URL.revokeObjectURL(url); }); urls = []; }
    function renderCards() {
        if (!grid) return;
        releaseCards(); grid.replaceChildren();
        if (loadFailed) {
            grid.appendChild(text('p', words().error, 'photo-items-empty'));
            grid.appendChild(button(words().retry, load)); return;
        }
        if (!records.length) { grid.appendChild(text('p', words().empty, 'photo-items-empty')); return; }
        records.slice().sort(function(a,b) { return b.createdAt-a.createdAt; }).forEach(function(record) {
            var card = text('article', '', 'photo-item-card'), image = document.createElement('img');
            var url = URL.createObjectURL(record.icon); urls.push(url); image.src = url; image.alt = record.name; image.width = image.height = 96;
            card.appendChild(image); card.appendChild(text('b', record.name));
            var edit = button(words().edit, function() { open(record); }); edit.className = 'photo-item-edit'; edit.setAttribute('aria-label', words().edit + ': ' + record.name); card.appendChild(edit);
            var date = text('time', new Date(record.createdAt).toLocaleDateString(document.documentElement.lang || 'ko')); date.dateTime = new Date(record.createdAt).toISOString(); card.appendChild(date);
            var remove = button(words().remove, async function() {
                if (!window.confirm(words().confirm)) return;
                remove.disabled = true;
                try { await store('readwrite', function(s) { return s.delete(record.id); }); loadSerial++; records = records.filter(function(r) { return r.id !== record.id; }); renderCards(); }
                catch (_) { remove.disabled = false; window.alert(words().error); }
            });
            remove.className = 'photo-item-delete'; remove.setAttribute('aria-label', words().remove + ': ' + record.name); card.appendChild(remove); grid.appendChild(card);
        });
    }
    async function load() {
        var serial = ++loadSerial;
        try {
            var saved = await store('readonly', function(s) { return s.getAll(); });
            if (serial !== loadSerial) return;
            records = saved.filter(function(r) { return r && r.icon instanceof Blob && r.name && Number.isFinite(r.createdAt); }); loadFailed = false;
        } catch (_) { if (serial !== loadSerial) return; loadFailed = true; }
        renderCards();
    }
    function geometry() {
        if (!loadedPhoto) return null;
        var side = Math.min(source.naturalWidth, source.naturalHeight) / crop.zoom;
        crop.x = Math.max(side/2, Math.min(source.naturalWidth-side/2, crop.x));
        crop.y = Math.max(side/2, Math.min(source.naturalHeight-side/2, crop.y));
        return {x:crop.x-side/2, y:crop.y-side/2, side:side};
    }
    function draw(target) {
        target = target || canvas;
        var ctx = target.getContext('2d'); ctx.clearRect(0,0,target.width,target.height);
        var g = geometry(); if (!g) return;
        ctx.drawImage(source, g.x,g.y,g.side,g.side,0,0,target.width,target.height);
    }
    function releaseSource() {
        if (source) { source.onload = source.onerror = null; source.src = ''; }
        source = null; loadedPhoto = false; if (sourceURL) URL.revokeObjectURL(sourceURL); sourceURL = ''; camera.value = gallery.value = ''; drag = null;
    }
    function refreshSave() {
        var visualReady = mode === 'symbol' ? !!icons() && (!!editingRecord || loadedPhoto) : loadedPhoto;
        saveButton.disabled = busy || !visualReady || !nameInput.value.trim();
    }
    function updateAppearance() {
        if (!styleSelect) return;
        mode = styleSelect.value;
        canvas.hidden = mode !== 'photo'; zoom.closest('label').hidden = mode !== 'photo';
        symbolSelect.closest('label').hidden = mode !== 'symbol'; symbolPreview.hidden = mode !== 'symbol';
        dialog.querySelector('[data-photo-text="hint"]').textContent = mode === 'symbol' ? words().iconHint : words().hint;
        if (icons()) {
            if (!manualSymbol) symbolSelect.value = icons().suggest(nameInput.value);
            symbolPreview.querySelector('img').src = icons().url(symbolSelect.value);
            symbolPreview.querySelector('img').alt = symbolSelect.selectedOptions[0] ? symbolSelect.selectedOptions[0].textContent : '';
        } else if (mode === 'symbol') setStatus('iconUnavailable');
        refreshSave();
    }
    function resetPhoto() { generation++; releaseSource(); canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height); zoom.value = '1'; refreshSave(); }
    function close() {
        if (busy) return;
        resetPhoto(); dialog.close(); if (returnFocus && returnFocus.isConnected) returnFocus.focus();
    }
    function open(record) {
        returnFocus = document.activeElement; resetPhoto();
        editingRecord = record && record.id && record.icon instanceof Blob ? record : null;
        nameInput.value = editingRecord ? editingRecord.name : '';
        mode = icons() ? 'symbol' : 'photo'; styleSelect.value = mode; manualSymbol = false;
        if (editingRecord && editingRecord.symbolId && icons()) { symbolSelect.value = icons().valid(editingRecord.symbolId); manualSymbol = true; }
        setStatus(''); renderText(); dialog.showModal();
        if (editingRecord) loadPhoto(editingRecord.icon);
    }
    function select(input) {
        var file = input.files && input.files[0]; if (!file || busy) return;
        loadPhoto(file);
    }
    function loadPhoto(file) {
        resetPhoto(); var request = generation;
        if (file.size > 30*1024*1024) { setStatus('large'); return; }
        if (file.type && file.type.indexOf('image/') !== 0) { setStatus('invalid'); return; }
        setStatus('loading'); sourceURL = URL.createObjectURL(file);
        var image = new Image(); source = image;
        image.onload = function() {
            if (request !== generation) return;
            if (!image.naturalWidth || image.naturalWidth * image.naturalHeight > 64000000) { resetPhoto(); setStatus('large'); return; }
            loadedPhoto = true; crop = {zoom:1,x:image.naturalWidth/2,y:image.naturalHeight/2};
            setStatus(''); draw(); updateAppearance();
        };
        image.onerror = function() { if (request === generation) { resetPhoto(); setStatus('invalid'); } };
        image.src = sourceURL;
        camera.value = gallery.value = '';
    }
    async function save(event) {
        event.preventDefault(); if (busy) return;
        if (saveButton.disabled || !nameInput.value.trim()) { setStatus('required'); return; }
        var request = generation, output = document.createElement('canvas'); output.width = output.height = 256;
        busy = true; setStatus('saving'); refreshSave();
        camera.disabled = gallery.disabled = zoom.disabled = nameInput.disabled = styleSelect.disabled = symbolSelect.disabled = true;
        form.querySelectorAll('button').forEach(function(b) { b.disabled = true; });
        try {
            var blob;
            if (mode === 'symbol') blob = icons().blob(symbolSelect.value);
            else {
                draw(output);
                blob = await new Promise(function(resolve, reject) { output.toBlob(function(b) { if (b) resolve(b); else reject(new Error('Encoding failed')); }, 'image/jpeg', .88); });
            }
            if (request !== generation) return;
            var record = Object.assign({}, editingRecord || {id:'photo-'+(window.crypto && crypto.randomUUID ? crypto.randomUUID() : Date.now()+'-'+Math.random().toString(36).slice(2)), createdAt:Date.now()}, {name:nameInput.value.trim().slice(0,60), icon:blob});
            if (mode === 'symbol') { record.iconStyle = 'symbol'; record.symbolId = symbolSelect.value; }
            else { delete record.iconStyle; delete record.symbolId; }
            await store('readwrite', function(s) { return s.put(record); });
            loadSerial++; var index = records.findIndex(function(r) { return r.id === record.id; });
            if (index >= 0) records[index] = record; else records.push(record); loadFailed = false; renderCards(); busy = false; close();
            section.querySelector('[data-photo-items="notice"]').textContent = words().saved;
        } catch (_) { setStatus('error'); }
        finally {
            busy = false; output.width = output.height = 0;
            camera.disabled = gallery.disabled = zoom.disabled = nameInput.disabled = styleSelect.disabled = symbolSelect.disabled = false;
            form.querySelectorAll('button').forEach(function(b) { b.disabled = false; }); refreshSave();
        }
    }
    function renderText() {
        var t = words();
        document.querySelectorAll('[data-photo-text]').forEach(function(node) { node.textContent = t[node.dataset.photoText]; });
        dialog.querySelector('[data-close]').setAttribute('aria-label',t.close); nameInput.placeholder = t.placeholder; canvas.setAttribute('aria-label',t.label); renderCards();
        if (icons()) {
            var previous = symbolSelect.value;
            symbolSelect.replaceChildren();
            icons().list(typeof currentLang === 'string' ? currentLang : document.documentElement.lang).forEach(function(kind) { var option = text('option',kind.name); option.value = kind.id; symbolSelect.appendChild(option); });
            symbolSelect.value = previous || 'star';
        }
        updateAppearance();
        if (lastStatus) status.textContent = t[lastStatus];
    }
    function init() {
        var panel = document.getElementById('panel-item'); if (!panel) return;
        section = document.createElement('section'); section.className = 'photo-items-section';
        section.innerHTML = '<h3 data-photo-text="title"></h3><button type="button" class="photo-items-add" data-photo-text="add"></button><p data-photo-items="notice" role="status" aria-live="polite"></p><div class="photo-items-grid"></div>';
        panel.insertBefore(section, panel.firstChild); grid = section.querySelector('.photo-items-grid');
        section.querySelector('button').addEventListener('click',open);
        dialog = document.createElement('dialog'); dialog.id = 'photo-item-editor'; dialog.className = 'photo-item-editor'; dialog.setAttribute('aria-labelledby','photo-item-title');
        dialog.innerHTML = '<form><header><h2 id="photo-item-title" data-photo-text="editor"></h2><button type="button" class="photo-item-close" data-close aria-label="Close">×</button></header><div class="photo-item-pickers"><button type="button" data-camera data-photo-text="camera"></button><button type="button" data-gallery data-photo-text="gallery"></button></div><input type="file" accept="image/*" capture="environment" data-camera-input hidden><input type="file" accept="image/*" data-gallery-input hidden><p class="photo-item-hint" id="photo-item-hint" data-photo-text="hint"></p><label><span data-photo-text="style"></span><select data-style><option value="symbol" data-photo-text="symbol"></option><option value="photo" data-photo-text="photo"></option></select></label><label><span data-photo-text="kind"></span><select data-symbol></select></label><div class="photo-symbol-preview" data-symbol-preview><img width="256" height="256" alt=""></div><canvas width="320" height="320" tabindex="0" aria-describedby="photo-item-hint"></canvas><label><span data-photo-text="zoom"></span><input type="range" min="1" max="4" step="0.01" value="1" data-zoom></label><label><span data-photo-text="name"></span><input type="text" maxlength="60" required autocomplete="off" data-name></label><p class="photo-item-privacy" data-photo-text="privacy"></p><p data-status role="status" aria-live="polite"></p><footer><button type="button" data-cancel data-photo-text="cancel"></button><button type="submit" data-save data-photo-text="save" disabled></button></footer></form>';
        document.body.appendChild(dialog); form = dialog.querySelector('form'); canvas = dialog.querySelector('canvas'); zoom = dialog.querySelector('[data-zoom]'); nameInput = dialog.querySelector('[data-name]'); status = dialog.querySelector('[data-status]'); saveButton = dialog.querySelector('[data-save]'); camera = dialog.querySelector('[data-camera-input]'); gallery = dialog.querySelector('[data-gallery-input]');
        styleSelect = dialog.querySelector('[data-style]'); symbolSelect = dialog.querySelector('[data-symbol]'); symbolPreview = dialog.querySelector('[data-symbol-preview]');
        styleSelect.onchange = updateAppearance; symbolSelect.onchange = function() { manualSymbol = true; updateAppearance(); };
        dialog.querySelector('[data-camera]').onclick = function() { camera.click(); }; dialog.querySelector('[data-gallery]').onclick = function() { gallery.click(); };
        dialog.querySelector('[data-close]').onclick = close; dialog.querySelector('[data-cancel]').onclick = close;
        dialog.addEventListener('cancel',function(e) { e.preventDefault(); close(); });
        dialog.addEventListener('close',function() { if (!busy) resetPhoto(); });
        camera.onchange = function() { select(camera); }; gallery.onchange = function() { select(gallery); };
        zoom.oninput = function() { crop.zoom = Number(zoom.value); draw(); };
        nameInput.oninput = updateAppearance; form.onsubmit = save;
        canvas.addEventListener('pointerdown',function(e) { if (mode !== 'photo' || !loadedPhoto || busy || drag) return; e.preventDefault(); drag = {id:e.pointerId,x:e.clientX,y:e.clientY}; canvas.setPointerCapture(e.pointerId); });
        canvas.addEventListener('pointermove',function(e) {
            if (!drag || drag.id !== e.pointerId || busy) return;
            var g = geometry(), width = canvas.getBoundingClientRect().width || 320;
            crop.x -= (e.clientX-drag.x)*g.side/width; crop.y -= (e.clientY-drag.y)*g.side/width;
            drag.x = e.clientX; drag.y = e.clientY; draw();
        });
        ['pointerup','pointercancel','lostpointercapture'].forEach(function(type) { canvas.addEventListener(type,function(e) { if (drag && drag.id === e.pointerId) drag = null; }); });
        canvas.addEventListener('keydown',function(e) {
            if (mode !== 'photo' || !loadedPhoto || busy || !/^Arrow(Up|Down|Left|Right)$/.test(e.key)) return;
            e.preventDefault(); var step = geometry().side/20;
            if (e.key === 'ArrowLeft') crop.x -= step; if (e.key === 'ArrowRight') crop.x += step;
            if (e.key === 'ArrowUp') crop.y -= step; if (e.key === 'ArrowDown') crop.y += step; draw();
        });
        new MutationObserver(renderText).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
        window.addEventListener('pagehide',function() { generation++; releaseSource(); releaseCards(); });
        window.addEventListener('pageshow',function(e) { if (e.persisted) renderCards(); });
        renderText(); load();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();

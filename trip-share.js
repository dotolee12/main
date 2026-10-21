(function() {
    "use strict";
    // Presentation state only. Never write journey records or change GPS collection.
    var route = null, selected = new Set(), historyVisible = true, allPhotos = false;
    var photoLayer = null, restorePhotoLayer = false, busy = false, panel, list, status, historyButton;
    var MAX_ZIP_BYTES = 256 * 1024 * 1024;
    var I18N = {
        ko:{title:"여행 경로와 사진",on:"기존 기록: 켜짐",off:"기존 기록: 꺼짐",hint:"시간·위치가 맞는 사진을 추천합니다. 체크한 사진만 ZIP에 포함됩니다.",none:"사진 선택 해제",all:"전체 사진에서 선택",refresh:"사진 목록 새로고침",zip:"여행 ZIP 저장",empty:"연결할 사진이 없습니다. 사진 메뉴에서 먼저 가져와 주세요.",noTime:"GPX에 촬영 시간을 비교할 정보가 없습니다. 여행 사진을 직접 선택해 주세요.",location:"위치 지정",manual:"위치 없음 · 지도 표시 제외",suggested:"시간·위치 일치",count:"선택한 사진 {n}장",loading:"여행 파일 준비 중…",choose:"ZIP 파일의 저장 위치를 선택해 주세요.",saved:"여행 ZIP 파일을 저장했습니다.",cancel:"ZIP 저장을 취소했습니다. 기존 기록은 유지됩니다.",failed:"여행 ZIP을 저장하지 못했습니다. 기존 기록은 유지됩니다.",missing:"사진 {n}번을 읽지 못했습니다. 사진을 확인하거나 선택을 해제해 주세요.",large:"선택한 여행 파일이 256MB를 넘습니다. 사진 수를 줄여 주세요.",preview:"미리보기 사진",original:"원본 사진",mapFallback:"배경지도 없이 경로와 좌표를 표시한 개요입니다.",note:"ZIP에는 선택한 사진의 촬영 시간·위치와 메모가 포함됩니다.",map:"여행 경로 지도",photos:"여행 사진",noRoute:"GPX를 먼저 열어 주세요.",unavailable:"이 APK에서 ZIP 저장을 지원하지 않습니다. 앱을 업데이트해 주세요."},
        en:{title:"Trip route and photos",on:"History: on",off:"History: off",hint:"Photos matching the route time and location are suggested. Only checked photos go into the ZIP.",none:"Deselect photos",all:"Choose from all photos",refresh:"Refresh photos",zip:"Save trip ZIP",empty:"No photos available. Import them from Photos first.",noTime:"This GPX has no usable time information. Choose trip photos manually.",location:"Set location",manual:"No location · excluded from map",suggested:"Time and location match",count:"{n} photos selected",loading:"Preparing trip files…",choose:"Choose where to save the ZIP file.",saved:"Trip ZIP saved.",cancel:"ZIP save cancelled. Existing records are preserved.",failed:"Could not save the trip ZIP. Existing records are preserved.",missing:"Could not read photo {n}. Check it or deselect it.",large:"The trip exceeds 256 MB. Select fewer photos.",preview:"Preview photo",original:"Original photo",mapFallback:"Route overview with coordinates; no background map available.",note:"The ZIP includes selected photos' capture times, locations and notes.",map:"Trip route map",photos:"Trip photos",noRoute:"Open a GPX first.",unavailable:"This APK cannot save ZIP files. Update the app."},
        ja:{title:"旅の経路と写真",on:"過去の記録: 表示",off:"過去の記録: 非表示",hint:"時間と位置が一致する写真を提案します。チェックした写真のみZIPに含まれます。",none:"写真の選択解除",all:"すべての写真から選択",refresh:"写真一覧を更新",zip:"旅のZIPを保存",empty:"写真メニューから写真を取り込んでください。",noTime:"GPXに時間情報がありません。旅の写真を手動で選択してください。",location:"位置を指定",manual:"位置なし・地図に非表示",suggested:"時間と位置が一致",count:"写真{n}枚を選択",loading:"旅のファイルを準備中…",choose:"ZIPの保存先を選択してください。",saved:"旅のZIPを保存しました。",cancel:"ZIP保存をキャンセルしました。記録は保持されます。",failed:"ZIPを保存できませんでした。記録は保持されます。",missing:"写真{n}を読めません。確認するか選択を解除してください。",large:"256MBを超えています。写真を減らしてください。",preview:"プレビュー写真",original:"元の写真",mapFallback:"背景地図のない座標付き経路概要です。",note:"選択した写真の撮影日時・位置・メモが含まれます。",map:"旅の経路地図",photos:"旅の写真",noRoute:"先にGPXを開いてください。",unavailable:"ZIP保存に対応するアプリに更新してください。"},
        zh:{title:"旅行路线和照片",on:"历史记录：显示",off:"历史记录：隐藏",hint:"推荐时间和位置相符的照片。仅将勾选的照片包含在ZIP中。",none:"取消选择照片",all:"从全部照片选择",refresh:"刷新照片",zip:"保存旅行ZIP",empty:"请先从照片菜单导入照片。",noTime:"GPX没有可用的时间信息，请手动选择旅行照片。",location:"设置位置",manual:"无位置·不显示在地图上",suggested:"时间与位置相符",count:"已选择{n}张照片",loading:"正在准备旅行文件…",choose:"请选择ZIP文件的保存位置。",saved:"旅行ZIP已保存。",cancel:"已取消保存ZIP，原有记录保留。",failed:"无法保存旅行ZIP，原有记录保留。",missing:"无法读取照片{n}，请检查或取消选择。",large:"旅行文件超过256MB，请减少照片。",preview:"预览照片",original:"原始照片",mapFallback:"无背景地图的路线坐标概览。",note:"ZIP包含所选照片的拍摄时间、位置和备注。",map:"旅行路线地图",photos:"旅行照片",noRoute:"请先打开GPX。",unavailable:"请更新应用以支持保存ZIP。"},
        es:{title:"Ruta y fotos del viaje",on:"Historial: visible",off:"Historial: oculto",hint:"Se sugieren fotos por hora y ubicación. Solo las marcadas se incluyen en el ZIP.",none:"Desmarcar fotos",all:"Elegir entre todas las fotos",refresh:"Actualizar fotos",zip:"Guardar ZIP del viaje",empty:"Importa fotos desde el menú Fotos.",noTime:"El GPX no tiene horas utilizables. Elige las fotos manualmente.",location:"Fijar ubicación",manual:"Sin ubicación · fuera del mapa",suggested:"Hora y ubicación coinciden",count:"{n} fotos seleccionadas",loading:"Preparando archivos…",choose:"Elige dónde guardar el ZIP.",saved:"ZIP del viaje guardado.",cancel:"Guardado cancelado. Se conservan los registros.",failed:"No se pudo guardar el ZIP. Se conservan los registros.",missing:"No se pudo leer la foto {n}. Revísala o desmárcala.",large:"El viaje supera 256 MB. Elige menos fotos.",preview:"Vista previa",original:"Foto original",mapFallback:"Esquema con coordenadas, sin mapa de fondo.",note:"El ZIP incluye fechas, ubicaciones y notas de las fotos seleccionadas.",map:"Mapa de la ruta",photos:"Fotos del viaje",noRoute:"Abre primero un GPX.",unavailable:"Actualiza la app para guardar ZIP."},
        fr:{title:"Parcours et photos du voyage",on:"Historique : visible",off:"Historique : masqué",hint:"Photos suggérées selon l’heure et le lieu. Seules les photos cochées sont incluses.",none:"Désélectionner les photos",all:"Choisir parmi toutes les photos",refresh:"Actualiser les photos",zip:"Enregistrer le ZIP",empty:"Importez des photos depuis le menu Photos.",noTime:"Le GPX ne contient pas d’heure exploitable. Choisissez les photos manuellement.",location:"Définir le lieu",manual:"Sans lieu · absente de la carte",suggested:"Heure et lieu concordent",count:"{n} photos sélectionnées",loading:"Préparation des fichiers…",choose:"Choisissez où enregistrer le ZIP.",saved:"ZIP du voyage enregistré.",cancel:"Enregistrement annulé. Les données sont conservées.",failed:"Impossible d’enregistrer le ZIP. Les données sont conservées.",missing:"Impossible de lire la photo {n}. Vérifiez-la ou désélectionnez-la.",large:"Le voyage dépasse 256 Mo. Choisissez moins de photos.",preview:"Aperçu photo",original:"Photo originale",mapFallback:"Schéma du parcours avec coordonnées, sans fond de carte.",note:"Le ZIP inclut les dates, lieux et notes des photos sélectionnées.",map:"Carte du voyage",photos:"Photos du voyage",noRoute:"Ouvrez d’abord un GPX.",unavailable:"Mettez l’application à jour pour enregistrer un ZIP."}
    };
    function words() { return I18N[typeof currentLang === "string" ? currentLang : "ko"] || I18N.ko; }
    function located(p) { return p && isValidPhotoCoordinate(p.lat, p.lng); }
    function parseRoute(xml, id) {
        var doc = new DOMParser().parseFromString(xml, "application/xml");
        var nodes = Array.from(doc.querySelectorAll("trkseg"));
        if (!nodes.length) nodes = [doc];
        var segments = nodes.map(function(node) { return Array.from(node.querySelectorAll("trkpt,rtept")).map(function(p) {
            var lat = Number(p.getAttribute("lat")), lng = Number(p.getAttribute("lon"));
            if (!p.hasAttribute("lat") || !p.hasAttribute("lon") || !isFinite(lat) || !isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
            var time = p.querySelector("time");
            return { lat:lat, lng:lng, time:time ? Date.parse(time.textContent) : NaN };
        }).filter(Boolean); }).filter(function(s) { return s.length; });
        var points = []; segments.forEach(function(segment) { segment.forEach(function(p) { points.push(p); }); });
        var times = points.map(function(p) { return p.time; }).filter(function(t) { return isFinite(t) && t > 0; });
        var name = doc.querySelector("metadata > name, trk > name, rte > name");
        return { id:id, xml:xml, segments:segments, points:points, name:name && name.textContent || "Giloa trip", start:times.length ? times.reduce(function(a,b){return Math.min(a,b);}) : null, end:times.length ? times.reduce(function(a,b){return Math.max(a,b);}) : null };
    }
    function nearRoute(photo, trip) {
        if (!located(photo)) return false;
        var lat = Number(photo.lat), lng = Number(photo.lng), scale = Math.cos(lat * Math.PI / 180), found = false;
        function xy(p) { return {x:(p.lng - lng) * 111195 * scale,y:(p.lat - lat) * 111195}; }
        trip.segments.some(function(seg) {
            for (var i = 0; i < seg.length; i++) {
                var b = xy(seg[i]), a = i ? xy(seg[i - 1]) : b;
                var dx = b.x - a.x, dy = b.y - a.y, length = dx * dx + dy * dy;
                var t = length ? Math.max(0, Math.min(1, -(a.x * dx + a.y * dy) / length)) : 0;
                if (Math.hypot(a.x + t * dx, a.y + t * dy) <= 500) { found = true; return true; }
            }
            return false;
        });
        return found;
    }
    function suggested(photo) {
        if (!route || !route.start || !isFinite(Number(photo.time)) || Number(photo.time) < route.start || Number(photo.time) > route.end) return false;
        var timeMatches = route.segments.some(function(seg) {
            var times = seg.map(function(p) { return p.time; }).filter(function(t) { return isFinite(t) && t > 0; });
            return times.length && Number(photo.time) >= times.reduce(function(a,b){return Math.min(a,b);}) && Number(photo.time) <= times.reduce(function(a,b){return Math.max(a,b);});
        });
        return !!timeMatches && nearRoute(photo, route);
    }
    function setHistory(value) {
        historyVisible = !!value;
        document.getElementById("map-wrap").classList.toggle("giloa-trip-clean", !historyVisible);
        if (!historyVisible && map.hasLayer(photoClusterGroup)) { restorePhotoLayer = true; map.removeLayer(photoClusterGroup); }
        if (historyVisible && restorePhotoLayer) { map.addLayer(photoClusterGroup); restorePhotoLayer = false; }
        if (historyButton) { historyButton.textContent = historyVisible ? words().on : words().off; historyButton.setAttribute("aria-pressed", String(historyVisible)); }
        renderSelectedPhotos();
    }
    function renderSelectedPhotos() {
        if (!photoLayer) return;
        photoLayer.clearLayers();
        if (!route) return;
        var number = 0;
        photos.forEach(function(p) {
            if (!selected.has(String(p.id))) return;
            number++;
            if (!located(p)) return;
            var root = document.createElement("div"), image = document.createElement("img"), caption = document.createElement("p");
            image.src = getPhotoDisplaySrc(p); image.alt = words().photos; image.style.cssText = "max-width:240px;max-height:220px;object-fit:contain";
            caption.textContent = new Date(Number(p.time)).toLocaleString(currentLang) + (p.memo ? " · " + p.memo : "");
            root.appendChild(image); root.appendChild(caption);
            L.marker([p.lat,p.lng], { pane:"tripPhotoPane",icon:L.divIcon({className:"giloa-trip-photo",html:"<span>" + number + "</span>",iconSize:[30,30],iconAnchor:[15,15]}) }).bindPopup(root).addTo(photoLayer);
        });
    }
    function addButton(parent, id, onClick) { var b = document.createElement("button"); b.id = id; b.type = "button"; b.className = "gpx-action-btn"; b.onclick = onClick; parent.appendChild(b); return b; }
    function refresh() {
        if (!panel) return;
        panel.hidden = !route;
        historyButton.hidden = !route;
        if (!route) return;
        var t = words();
        panel.querySelector("h3").textContent = t.title;
        panel.querySelector(".trip-hint").textContent = route.start ? t.hint : t.noTime;
        panel.querySelector(".trip-share-note").textContent = t.note;
        document.getElementById("trip-select-none").textContent = t.none;
        document.getElementById("trip-show-all").textContent = t.all;
        document.getElementById("trip-refresh-photos").textContent = t.refresh;
        var zip = document.getElementById("trip-save-zip"); zip.textContent = t.zip; zip.disabled = busy;
        historyButton.textContent = historyVisible ? t.on : t.off;
        document.getElementById("trip-photo-count").textContent = t.count.replace("{n}", String(selected.size));
        list.replaceChildren();
        var candidates = photos.filter(function(p) { return allPhotos || selected.has(String(p.id)) || suggested(p); });
        if (!candidates.length) { var empty = document.createElement("p"); empty.textContent = photos.length ? t.all : t.empty; list.appendChild(empty); }
        candidates.forEach(function(p) {
            var row = document.createElement("div"), label = document.createElement("label"), check = document.createElement("input"), thumb = document.createElement("img"), text = document.createElement("span");
            row.className = "trip-photo-row"; check.type = "checkbox"; check.checked = selected.has(String(p.id)); check.setAttribute("aria-label", t.photos + " " + new Date(Number(p.time)).toLocaleString(currentLang));
            check.onchange = function() { if (check.checked) selected.add(String(p.id)); else selected.delete(String(p.id)); refresh(); renderSelectedPhotos(); };
            thumb.src = getPhotoDisplaySrc(p); thumb.alt = ""; thumb.loading = "lazy";
            text.textContent = new Date(Number(p.time)).toLocaleString(currentLang) + " · " + (!located(p) ? t.manual : suggested(p) ? t.suggested : t.photos);
            label.append(check,thumb,text); row.appendChild(label);
            if (!located(p)) { var locate = document.createElement("button"); locate.type = "button"; locate.textContent = t.location; locate.onclick = function() { focusPhotoOnMap(p); }; row.appendChild(locate); }
            list.appendChild(row);
        });
    }
    function open(xml, id) {
        route = parseRoute(xml,id); selected = new Set(); allPhotos = false;
        photos.forEach(function(p) { if (suggested(p)) selected.add(String(p.id)); });
        setHistory(false); refresh();
    }
    function close() { route = null; selected.clear(); if (photoLayer) photoLayer.clearLayers(); setHistory(true); refresh(); }
    function statusText(text) { if (status) status.textContent = text; }
    function blobDataUrl(blob) { return new Promise(function(resolve,reject) { var r = new FileReader(); r.onload = function() { resolve(r.result); }; r.onerror = reject; r.readAsDataURL(blob); }); }
    function dataUrlBlob(url) {
        if (typeof url !== "string" || !/^data:image\/[\w.+-]+;base64,/i.test(url)) return null;
        var comma = url.indexOf(","), binary = atob(url.slice(comma + 1)), bytes = new Uint8Array(binary.length);
        for (var i = 0; i < bytes.length; i++) bytes[i] = binary.charCodeAt(i);
        return new Blob([bytes], {type:url.slice(5,comma).split(";")[0]});
    }
    var crcTable = null;
    async function zipBlob(entries) {
        if (!crcTable) { crcTable = new Uint32Array(256); for (var n=0;n<256;n++) { var c=n; for(var k=0;k<8;k++) c=c&1 ? 0xedb88320 ^ (c>>>1) : c>>>1; crcTable[n]=c>>>0; } }
        var parts=[],central=[],offset=0,centralSize=0,enc=new TextEncoder();
        for (var e of entries) {
            var name=enc.encode(e.name),blob=e.blob instanceof Blob ? e.blob : new Blob([e.blob]),crc=0xffffffff;
            if(offset+blob.size>MAX_ZIP_BYTES) throw new Error(words().large);
            for(var pos=0;pos<blob.size;pos+=262144) { var data=new Uint8Array(await blob.slice(pos,pos+262144).arrayBuffer()); for(var j=0;j<data.length;j++) crc=crcTable[(crc^data[j])&255]^(crc>>>8); }
            crc=(crc^0xffffffff)>>>0;
            var header=new Uint8Array(30+name.length),h=new DataView(header.buffer);
            h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x800,true);h.setUint16(12,33,true);h.setUint32(14,crc,true);h.setUint32(18,blob.size,true);h.setUint32(22,blob.size,true);h.setUint16(26,name.length,true);header.set(name,30);
            var record=new Uint8Array(46+name.length),r=new DataView(record.buffer);
            r.setUint32(0,0x02014b50,true);r.setUint16(4,20,true);r.setUint16(6,20,true);r.setUint16(8,0x800,true);r.setUint16(14,33,true);r.setUint32(16,crc,true);r.setUint32(20,blob.size,true);r.setUint32(24,blob.size,true);r.setUint16(28,name.length,true);r.setUint32(42,offset,true);record.set(name,46);
            parts.push(header,blob);central.push(record);offset+=header.length+blob.size;centralSize+=record.length;
        }
        var end=new Uint8Array(22),v=new DataView(end.buffer);v.setUint32(0,0x06054b50,true);v.setUint16(8,entries.length,true);v.setUint16(10,entries.length,true);v.setUint32(12,centralSize,true);v.setUint32(16,offset,true);
        var zip=new Blob(parts.concat(central,[end]),{type:"application/zip"});if(zip.size>MAX_ZIP_BYTES)throw new Error(words().large);return zip;
    }
    async function mapPng(trip, chosen) {
        map.fitBounds(L.latLngBounds(trip.points.map(function(p){return [p.lat,p.lng];}).concat(chosen.filter(located).map(function(p){return [p.lat,p.lng];}))),{padding:[45,80],animate:false,maxZoom:18});
        await new Promise(function(resolve){setTimeout(resolve,1200);});
        var mapEl=map.getContainer(),rect=mapEl.getBoundingClientRect(),w=Math.max(1,Math.round(rect.width)),h=Math.max(1,Math.round(rect.height)),scale=Math.min(3,1600/w);
        var canvas=document.createElement("canvas");canvas.width=Math.round(w*scale);canvas.height=Math.round(h*scale);
        var ctx=canvas.getContext("2d"),tiles=currentBaseTileLayer&&currentBaseTileLayer.getContainer ? currentBaseTileLayer.getContainer().querySelectorAll("img.leaflet-tile-loaded") : [],drawn=0,fallback=false;
        ctx.scale(scale,scale);ctx.fillStyle="#eef2f6";ctx.fillRect(0,0,w,h);
        try { Array.from(tiles).forEach(function(tile){if(!tile.naturalWidth)return;var t=tile.getBoundingClientRect();if(t.right<rect.left||t.left>rect.right||t.bottom<rect.top||t.top>rect.bottom)return;ctx.drawImage(tile,t.left-rect.left,t.top-rect.top,t.width,t.height);drawn++;});ctx.getImageData(0,0,1,1); } catch (_) { canvas.width=canvas.width;ctx=canvas.getContext("2d");ctx.scale(scale,scale);ctx.fillStyle="#eef2f6";ctx.fillRect(0,0,w,h);fallback=true; }
        if(!drawn)fallback=true;
        ctx.strokeStyle="#B388FF";ctx.lineWidth=4;ctx.lineCap="round";ctx.lineJoin="round";
        trip.segments.forEach(function(segment){ctx.beginPath();segment.forEach(function(p,i){var xy=map.latLngToContainerPoint([p.lat,p.lng]);if(i)ctx.lineTo(xy.x,xy.y);else ctx.moveTo(xy.x,xy.y);});ctx.stroke();});
        chosen.forEach(function(p,i){if(!located(p))return;var xy=map.latLngToContainerPoint([p.lat,p.lng]);ctx.beginPath();ctx.fillStyle="#fff";ctx.strokeStyle="#6c3cb5";ctx.lineWidth=2;ctx.arc(xy.x,xy.y,11,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle="#352253";ctx.font="bold 12px sans-serif";ctx.textAlign="center";ctx.fillText(String(i+1),xy.x,xy.y+4);});
        ctx.textAlign="left";ctx.fillStyle="rgba(255,255,255,.94)";ctx.fillRect(8,8,w-16,64);ctx.fillStyle="#282438";ctx.font="bold 16px sans-serif";ctx.fillText(trip.name.slice(0,34),18,33);ctx.font="11px sans-serif";ctx.fillText(words().count.replace("{n}",String(chosen.length)),18,55);
        ctx.fillStyle="rgba(255,255,255,.94)";ctx.fillRect(0,h-38,w,38);ctx.fillStyle="#303846";ctx.font="9px sans-serif";
        ctx.fillText(fallback ? words().mapFallback : "© OpenStreetMap contributors · © CARTO",8,h-23);ctx.fillText("GILOA · "+trip.points[0].lat.toFixed(5)+", "+trip.points[0].lng.toFixed(5),8,h-8);
        var png=await new Promise(function(resolve,reject){canvas.toBlob(function(b){if(b)resolve(b);else reject(new Error(words().failed));},"image/png");});
        return {blob:png,fallback:fallback};
    }
    function extension(type) { return ({"image/jpeg":"jpg","image/png":"png","image/webp":"webp","image/heic":"heic","image/heif":"heif","image/gif":"gif"})[String(type).toLowerCase()]||"bin"; }
    async function buildPackage(trip, chosen) {
        var t=words(),entries=[{name:"route.gpx",blob:new Blob([trip.xml],{type:"application/gpx+xml"})}],items=[],size=entries[0].blob.size;
        for(var i=0;i<chosen.length;i++) {
            var p=chosen[i],row=await idbGetPhoto(p.id).catch(function(){return null;}),original=await getPhotoRecoveryBlob(p).catch(function(){return null;});
            var preview=dataUrlBlob(row&&(row.photo||row.thumb))||dataUrlBlob(p.photo||p.thumb),blob=original||preview;
            if(!blob||!blob.size)throw new Error(t.missing.replace("{n}",String(i+1)));
            size+=blob.size;if(size>MAX_ZIP_BYTES-2*1024*1024)throw new Error(t.large);
            var mime=blob.type || (original && row && row.originalMimeType) || (preview && preview.type) || "application/octet-stream";
            var number=String(i+1).padStart(3,"0"),file="photos/"+number+"."+extension(mime),display=file;
            entries.push({name:file,blob:blob});
            if(!/image\/(jpeg|png|webp|gif)/i.test(mime)&&preview){display="previews/"+number+"."+extension(preview.type);entries.push({name:display,blob:preview});}
            items.push({number:i+1,file:file,display:display,quality:original?"original":"preview",capturedAt:isFinite(Number(p.time))&&Number(p.time)>0?new Date(Number(p.time)).toISOString():null,lat:located(p)?Number(p.lat):null,lng:located(p)?Number(p.lng):null,locationSource:p.locationSource||"unknown",memo:p.memo||""});
        }
        var image=await mapPng(trip,chosen);entries.push({name:"map.png",blob:image.blob});
        var meta={format:"giloa-trip-v1",name:trip.name,createdAt:new Date().toISOString(),routeFile:"route.gpx",mapFile:"map.png",mapWithoutBasemap:image.fallback,photos:items};
        entries.push({name:"trip.json",blob:JSON.stringify(meta,null,2)});
        var html='<!doctype html><html lang="'+String(currentLang||"ko").slice(0,2)+'"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>'+escapeHtml(trip.name)+'</title><style>body{font:16px system-ui;max-width:1000px;margin:24px auto;padding:0 16px;color:#242333;background:#f7f6fc}img{max-width:100%;height:auto;border-radius:12px}figure{background:white;padding:16px;border-radius:16px}a{color:#683ca5}p{white-space:pre-wrap}</style><h1>'+escapeHtml(trip.name)+'</h1><p><a href="route.gpx">GPX</a> · <a href="trip.json">JSON</a></p><img src="map.png" alt="'+escapeHtml(t.map)+'">';
        items.forEach(function(p){html+='<figure><h2>'+p.number+' · '+escapeHtml(p.capturedAt||"")+'</h2><a href="'+p.file+'"><img loading="lazy" src="'+p.display+'" alt="'+p.number+'"></a><p>'+escapeHtml(p.memo)+'</p><p>'+escapeHtml(p.quality==="original"?t.original:t.preview)+(p.lat!=null?' · '+p.lat.toFixed(6)+', '+p.lng.toFixed(6):' · '+escapeHtml(t.manual))+'</p></figure>';});
        entries.push({name:"index.html",blob:html+'</html>'});
        entries.push({name:"README.txt",blob:trip.name+'\n\n'+t.note+'\nOpen index.html after extracting this ZIP.\nroute.gpx: GPS route\nmap.png: route and numbered photo positions\ntrip.json: photo times, coordinates, notes and original/preview availability\n'+(image.fallback?t.mapFallback:'Map data © OpenStreetMap contributors; tiles © CARTO / OpenStreetMap.')+'\n\n'+items.map(function(p){return p.number+': '+p.file+' ('+p.quality+')';}).join('\n')});
        return zipBlob(entries);
    }
    async function exportZip() {
        if(busy)return;if(!route){statusText(words().noRoute);return;}
        var snapshot=route,chosen=photos.filter(function(p){return selected.has(String(p.id));}).map(function(p){return Object.assign({},p);});
        busy=true;refresh();statusText(words().loading);
        var bridge=window.GiloaPhotoBridge,staged=false;
        try {
            var zip=await buildPackage(snapshot,chosen),filename="giloa_trip_"+new Date().toISOString().slice(0,10)+".zip";
            if(bridge&&typeof bridge.beginTravelZip==="function") {
                if(bridge.beginTravelZip(zip.size)!==true)throw new Error(words().failed);staged=true;
                for(var offset=0;offset<zip.size;offset+=196608){var data=await blobDataUrl(zip.slice(offset,offset+196608));if(bridge.appendTravelZipChunk(data.slice(data.indexOf(",")+1))!==true)throw new Error(words().failed);await new Promise(function(resolve){setTimeout(resolve,0);});}
                if(bridge.finishTravelZip(filename)!==true)throw new Error(words().failed);
                statusText(words().choose);
            } else if(!isNativeApp()) {
                var url=URL.createObjectURL(zip),a=document.createElement("a");a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},60000);busy=false;refresh();statusText(words().choose);
            } else throw new Error(words().unavailable);
        } catch(error){if(staged&&bridge&&typeof bridge.cancelTravelZip==="function")bridge.cancelTravelZip();busy=false;refresh();statusText(error&&error.message||words().failed);}
    }
    window.giloaHandleTravelZipResult=function(saved,cancelled){busy=false;refresh();var text=saved?words().saved:cancelled?words().cancel:words().failed;statusText(text);if(typeof showLocationToast==="function")showLocationToast(text,4500);};
    function init() {
        var host=document.getElementById("panel-gpx");if(!host)return;
        if(!map.getPane("tripPhotoPane")){map.createPane("tripPhotoPane");map.getPane("tripPhotoPane").style.zIndex=632;}
        photoLayer=L.layerGroup().addTo(map);
        panel=document.createElement("section");panel.id="trip-share-panel";panel.className="trip-share-panel";panel.hidden=true;
        var title=document.createElement("h3"),hint=document.createElement("p"),note=document.createElement("p"),count=document.createElement("p");hint.className="trip-hint";note.className="trip-share-note";count.id="trip-photo-count";panel.append(title,hint,count);
        addButton(panel,"trip-select-none",function(){selected.clear();refresh();renderSelectedPhotos();});addButton(panel,"trip-show-all",function(){allPhotos=true;refresh();});addButton(panel,"trip-refresh-photos",function(){refresh();renderSelectedPhotos();});
        list=document.createElement("div");list.id="trip-photo-list";panel.appendChild(list);panel.appendChild(note);addButton(panel,"trip-save-zip",exportZip);status=document.createElement("p");status.id="trip-export-status";status.setAttribute("role","status");panel.appendChild(status);host.appendChild(panel);
        historyButton=document.createElement("button");historyButton.id="trip-history-toggle";historyButton.type="button";historyButton.hidden=true;historyButton.className="trip-history-toggle";historyButton.onclick=function(){setHistory(!historyVisible);};document.getElementById("map-wrap").appendChild(historyButton);
        refresh();
    }
    window.GiloaTrip={open:open,close:close,refresh:refresh,setHistory:setHistory,exportZip:exportZip,
        parseRoute:parseRoute,nearRoute:nearRoute,zipBlob:zipBlob,buildPackage:buildPackage,
        getState:function(){return {route:route,selected:Array.from(selected),historyVisible:historyVisible,busy:busy};},
        selectPhoto:function(id,value){if(value)selected.add(String(id));else selected.delete(String(id));refresh();renderSelectedPhotos();}};
    init();
})();

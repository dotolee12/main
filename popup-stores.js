/* Reviewed public event facts only. No journey data is read or written. */
(function () {
    'use strict';
    if (window.GiloaPopupStores) return;
    var copy = {
        ko:['팝업스토어','공식 안내 ↗','지도에서 보기','기간','확인일','운영시간·예약·입장 조건은 공식 안내를 확인해 주세요.','지금 표시할 팝업이 없어요.','위치를 확인하지 못했어요. 주소로 지도 검색 ↗','닫기','기간 내 행사 · 영업 중 여부는 공식 안내 확인','목록을 불러오지 못했어요. 다시 시도','다시 시도','인터넷에서 확인해 등록한 목록이며 전체·실시간 목록은 아니에요.','표시 켜기/끄기'],
        en:['Pop-up stores','Official information ↗','Show on map','Dates','Checked','Check official information for hours, booking and admission.','No current pop-ups in this list.','Location unavailable. Search address ↗','Close','Within event dates · check opening hours','Could not load events. Try again','Retry','Reviewed online listings; not an exhaustive or live feed.','Show/hide markers'],
        ja:['ポップアップ','公式案内 ↗','地図で見る','期間','確認日','営業時間・予約・入場条件は公式案内をご確認ください。','現在表示できるイベントはありません。','位置を確認できません。住所で検索 ↗','閉じる','開催期間内・営業時間は公式案内を確認','読み込めませんでした。再試行してください','再試行','確認済みのオンライン情報です。全件・リアルタイム情報ではありません。','マーカー表示切替'],
        zh:['快闪店','官方信息 ↗','在地图查看','日期','核实日期','请在官方页面确认营业时间、预约及入场条件。','列表中暂无当前活动。','无法确认位置，搜索地址 ↗','关闭','活动日期内・请确认营业时间','无法加载，请重试','重试','经核实的网上信息，非完整或实时列表。','显示/隐藏标记'],
        es:['Tiendas temporales','Información oficial ↗','Ver en el mapa','Fechas','Verificado','Consulta horarios, reservas y acceso en la web oficial.','No hay eventos vigentes en esta lista.','Ubicación no disponible. Buscar dirección ↗','Cerrar','Dentro del período · confirma el horario','No se pudo cargar. Reintenta','Reintentar','Datos revisados en línea; no es una lista completa ni en tiempo real.','Mostrar/ocultar marcadores'],
        fr:['Boutiques éphémères','Informations officielles ↗','Voir sur la carte','Dates','Vérifié','Consultez horaires, réservations et accès sur le site officiel.','Aucun événement actuel dans cette liste.','Position indisponible. Chercher l’adresse ↗','Fermer','Période en cours · vérifiez les horaires','Chargement impossible. Réessayez','Réessayer','Informations vérifiées, ni exhaustives ni en temps réel.','Afficher/masquer les repères']
    };
    var m, group, panel, controlButton, data = {events:[]}, points = {}, enabled = true, loading = false, failed = false;
    function lang() { return String(typeof currentLang === 'string' ? currentLang : document.documentElement.lang || 'ko').slice(0,2); }
    function w() { return copy[lang()] || copy.en; }
    function day(now) { return new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(now || new Date()); }
    function active(e, today) { return !!e && /^\d{4}-\d{2}-\d{2}$/.test(e.start) && /^\d{4}-\d{2}-\d{2}$/.test(e.end) && e.start <= today && today <= e.end; }
    function title(e) { return e.names[lang()] || e.names.en || e.names.ko; }
    function node(tag,value,parent) { var n = document.createElement(tag); n.textContent = value || ''; if(parent) parent.appendChild(n); return n; }
    function link(parent,label,url) { try { var u = new URL(url); if(u.protocol !== 'https:') return; var a=node('a',label,parent); a.href=u.href;a.target='_blank';a.rel='noopener noreferrer'; } catch (_) {} }
    function close() { panel.hidden=true; controlButton.setAttribute('aria-expanded','false'); }
    function details(e) {
        var box=node('div');box.className='giloa-popup-card';
        node('small',w()[0]+' · POP',box);node('h3',title(e),box);
        node('p',w()[3]+': '+e.start+' — '+e.end,box);node('p',e.address+' · '+e.floor,box);
        if(e.hours) node('p',e.hours+' (KST)',box);
        node('p',w()[9],box);node('small',w()[4]+': '+data.checkedAt+' · '+e.publisher,box);
        link(box,w()[1],e.source);node('p',w()[5],box);
        link(box,w()[7],'https://map.kakao.com/link/search/'+encodeURIComponent(e.address));
        return box;
    }
    function render() {
        if(!m) return;
        var events=data.events.filter(function(e){return active(e,day());});
        controlButton.textContent='POP · '+events.length;controlButton.title=w()[0];controlButton.setAttribute('aria-label',w()[0]);
        group.clearLayers();
        events.forEach(function(e) {
            if(!enabled || !points[e.id]) return;
            L.marker(points[e.id],{pane:'giloaPopupPane',title:title(e),bubblingMouseEvents:false,icon:L.divIcon({className:'giloa-popup-marker',html:'<span>POP</span>',iconSize:[34,28],iconAnchor:[17,28]})}).addTo(group).bindPopup(details(e),{className:'giloa-popup-detail',maxWidth:300});
        });
        panel.replaceChildren();var header=node('header','',panel);node('h2',w()[0],header);var x=node('button','×',header);x.type='button';x.setAttribute('aria-label',w()[8]);x.onclick=close;
        node('p',w()[12],panel);node('small',w()[4]+': '+(data.checkedAt || '—'),panel);
        var toggle=node('button',w()[13],panel);toggle.type='button';toggle.setAttribute('aria-pressed',String(enabled));toggle.onclick=function(){enabled=!enabled;render();};
        if(failed) node('p',w()[10],panel);else if(!loading && !events.length) node('p',w()[6],panel);
        events.forEach(function(e) {
            var row=details(e);panel.appendChild(row);
            if(points[e.id]) { var b=node('button',w()[2],row);b.type='button';b.onclick=function(){close();m.setView(points[e.id],17);L.popup({className:'giloa-popup-detail'}).setLatLng(points[e.id]).setContent(details(e)).openOn(m);}; }
        });
        var retry=node('button',w()[11],panel);retry.type='button';retry.disabled=loading;retry.onclick=load;
    }
    function geocode(e) {
        return new Promise(function(resolve) {
            if(points[e.id]) return resolve();
            var done=false,t=setTimeout(finish,6000);
            function finish(result) {if(done)return;done=true;clearTimeout(t);if(result)points[e.id]=result;resolve();}
            try {new kakao.maps.services.Geocoder().addressSearch(e.address,function(rows,status){
                var r=rows && rows[0],lat=r && Number(r.y),lng=r && Number(r.x);
                finish(status === kakao.maps.services.Status.OK && Number.isFinite(lat) && Number.isFinite(lng) && lat>=33 && lat<=39 && lng>=124 && lng<=132 ? [lat,lng] : null);
            });} catch(_){finish();}
        });
    }
    async function load() {
        if(loading)return;loading=true;failed=false;render();
        try {
            var abort=new AbortController(),timer=setTimeout(function(){abort.abort();},10000);
            try {var res=await fetch('./data/popup-stores.json',{cache:'no-cache',signal:abort.signal});if(!res.ok)throw new Error('events');var value=await res.json();if(!Array.isArray(value.events))throw new Error('events');data=value;} finally {clearTimeout(timer);}
            render();
            // Reuse the existing SDK loader; never invent coordinates when address lookup fails.
            if(typeof loadKakaoTrafficSdk === 'function') await loadKakaoTrafficSdk();
            await Promise.all(data.events.filter(function(e){return active(e,day());}).map(geocode));
        } catch(_){failed=true;} finally {loading=false;render();}
    }
    function setup() {
        if(m)return;
        var ready=window.giloaMapBootstrap || (typeof map !== 'undefined' ? map : null);
        if(!ready || !window.L || !document.body)return;
        m=ready;m.createPane('giloaPopupPane').style.zIndex='650';group=L.layerGroup().addTo(m);
        panel=node('section','',document.body);panel.id='giloa-popup-panel';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-label',w()[0]);
        L.DomEvent.disableClickPropagation(panel);L.DomEvent.disableScrollPropagation(panel);
        var control=L.control({position:'bottomleft'});control.onAdd=function(){var wrap=node('div');controlButton=node('button','POP',wrap);controlButton.type='button';controlButton.className='giloa-popup-control';controlButton.setAttribute('aria-controls',panel.id);controlButton.setAttribute('aria-expanded','false');L.DomEvent.disableClickPropagation(wrap);controlButton.onclick=function(){panel.hidden=!panel.hidden;controlButton.setAttribute('aria-expanded',String(!panel.hidden));render();};return wrap;};control.addTo(m);
        m.on('click',close);new MutationObserver(function(){panel.setAttribute('aria-label',w()[0]);render();}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
        document.addEventListener('visibilitychange',function(){if(!document.hidden)render();});window.addEventListener('online',load);setInterval(render,60000);load();
    }
    window.GiloaPopupStores={day:day,active:active,refresh:load};
    window.addEventListener('giloa:ready',setup);document.addEventListener('DOMContentLoaded',setup);setup();
}());

/* Community facilities use transient public place results, never journey storage. */
(function () {
    'use strict';
    if (window.GiloaCommunityPlaces) return;
    var TEXT = {
        ko:{source:'카카오맵',loading:'주민회관 찾는 중…',count:'주변 {n}곳 · 카카오맵',empty:'주변 검색 결과 없음 · 카카오맵',error:'조회 실패 · 지도를 옮기거나 다시 켜 주세요',offline:'온라인에서 조회할 수 있어요',address:'주소 미등록',details:'카카오맵에서 보기 ↗'},
        en:{source:'Kakao Maps',loading:'Finding community facilities…',count:'{n} nearby · Kakao Maps',empty:'No nearby results · Kakao Maps',error:'Search failed. Move the map or toggle again.',offline:'Go online to search',address:'Address unavailable',details:'View on Kakao Maps ↗'},
        ja:{source:'Kakao Maps',loading:'住民施設を検索中…',count:'近くに{n}件 · Kakao Maps',empty:'近くに検索結果なし · Kakao Maps',error:'検索失敗。地図を動かすか再度オンにしてください。',offline:'オンラインで検索できます',address:'住所未登録',details:'Kakao Mapsで見る ↗'},
        zh:{source:'Kakao Maps',loading:'正在查找社区设施…',count:'附近{n}处 · Kakao Maps',empty:'附近无搜索结果 · Kakao Maps',error:'搜索失败，请移动地图或重新开启。',offline:'请联网搜索',address:'暂无地址',details:'在Kakao Maps查看 ↗'},
        es:{source:'Kakao Maps',loading:'Buscando centros comunitarios…',count:'{n} cercanos · Kakao Maps',empty:'Sin resultados cercanos · Kakao Maps',error:'Error. Mueve el mapa o activa de nuevo.',offline:'Conéctate para buscar',address:'Dirección no disponible',details:'Ver en Kakao Maps ↗'},
        fr:{source:'Kakao Maps',loading:'Recherche de centres communautaires…',count:'{n} à proximité · Kakao Maps',empty:'Aucun résultat à proximité · Kakao Maps',error:'Échec. Déplacez la carte ou réactivez.',offline:'Connectez-vous pour rechercher',address:'Adresse indisponible',details:'Voir sur Kakao Maps ↗'}
    };
    var activeMap, layer, row, source, items = [], sequence = 0, timer, initialized = false, status = 'source';
    function words() { var lang = typeof currentLang === 'string' ? currentLang : document.documentElement.lang; return TEXT[String(lang || 'ko').slice(0,2)] || TEXT.en; }
    function enabled() { return typeof mapLayerSettings === 'object' && !!mapLayerSettings.community; }
    function sync() {
        if (!source) return;
        source.textContent = words()[status].replace('{n}',String(items.length));
        source.setAttribute('role','status'); source.setAttribute('aria-live','polite');
        if (typeof syncMapLayerToggleUI === 'function') syncMapLayerToggleUI('community');
        row.title = source.textContent;
    }
    function closePopup() { if (activeMap && activeMap.closePopup) activeMap.closePopup(); }
    function popup(item) {
        var box = document.createElement('div'), title = document.createElement('b'), address = document.createElement('p');
        title.textContent = item.name; address.textContent = item.address || words().address;
        box.appendChild(title); box.appendChild(address);
        if (item.phone && /^[0-9+() -]+$/.test(item.phone)) {
            var phone = document.createElement('a'); phone.href = 'tel:' + item.phone.replace(/[^0-9+]/g,''); phone.textContent = item.phone; box.appendChild(phone); box.appendChild(document.createElement('br'));
        }
        var details = document.createElement('a'); details.href = 'https://place.map.kakao.com/' + encodeURIComponent(item.id); details.textContent = words().details; details.target = '_blank'; details.rel = 'noopener noreferrer'; box.appendChild(details);
        L.popup({className:'tour-popup',closeButton:true,closeOnClick:true}).setLatLng([item.lat,item.lng]).setContent(box).openOn(activeMap);
    }
    function render() {
        if (!layer) return;
        layer.clearLayers();
        if (!enabled()) return;
        items.forEach(function(item) {
            var icon = L.divIcon({className:'community-map-marker-wrap library-map-marker-wrap',html:mapPlaceSymbolHtml('community','',''),iconSize:[28,28],iconAnchor:[14,14]});
            L.marker([item.lat,item.lng],{pane:'communityPlacesPane',icon:icon,title:item.name,bubblingMouseEvents:false}).addTo(layer).on('click',function(){popup(item);});
        });
    }
    function query(term, center, radius) {
        return new Promise(function(resolve,reject) {
            var done = false, deadline = setTimeout(function(){finish(null,new Error('Community places timeout'));},9000);
            function finish(rows,error) { if (done) return; done=true; clearTimeout(deadline); error ? reject(error) : resolve(rows || []); }
            try {
                var services = window.kakao.maps.services;
                new services.Places().keywordSearch(term,function(rows,code){
                    if (code === services.Status.OK) finish(rows);
                    else if (code === services.Status.ZERO_RESULT) finish([]);
                    else finish(null,new Error('Community places unavailable'));
                },{location:new window.kakao.maps.LatLng(center.lat,center.lng),radius:Math.min(20000,radius),size:15,sort:services.SortBy.DISTANCE});
            } catch(error) { finish(null,error); }
        });
    }
    function refresh() {
        var id = ++sequence;
        if (!initialized) return Promise.resolve(false);
        if (!enabled()) { items=[];status='source';layer.clearLayers();closePopup();sync();return Promise.resolve(false); }
        if (navigator.onLine === false) {status='offline';sync();return Promise.resolve(false);}
        var center = activeMap.getCenter(), radius = typeof getMapSearchRadius === 'function' ? getMapSearchRadius() : 1000;
        status='loading';sync();
        return loadKakaoTrafficSdk().then(function(){
            if(id !== sequence || !enabled()) return [];
            return Promise.allSettled(['주민회관','마을회관','주민자치센터','행정복지센터'].map(function(term){return query(term,center,radius);}));
        }).then(function(groups){
            if (id !== sequence || !enabled()) return false;
            if (!groups.length || groups.every(function(group){return group.status === 'rejected';})) throw new Error('Community places unavailable');
            var seen = new Set();
            items = groups.filter(function(group){return group.status === 'fulfilled';}).flatMap(function(group){return group.value;}).map(function(place){
                var lat=Number(place.y),lng=Number(place.x),name=String(place.place_name || '');
                if (!place.id || !/(주민회관|마을회관|주민자치(?:센터|회관)|행정복지센터|주민센터)/.test(name.replace(/\s/g,'')) || /^(FD6|CE7|PK6)$/.test(place.category_group_code || '') || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat)>90 || Math.abs(lng)>180 || activeMap.distance(center,[lat,lng])>radius || seen.has(String(place.id))) return null;
                seen.add(String(place.id));return {id:String(place.id),name:name,address:String(place.road_address_name || place.address_name || ''),phone:String(place.phone || ''),lat:lat,lng:lng};
            }).filter(Boolean).sort(function(a,b){return activeMap.distance(center,[a.lat,a.lng])-activeMap.distance(center,[b.lat,b.lng]);}).slice(0,60);
            status=items.length ? 'count' : 'empty';render();sync();return items.length>0;
        }).catch(function(){if(id===sequence && enabled()){status='error';sync();}return false;});
    }
    function schedule() { sequence++; if(timer)clearTimeout(timer); if(enabled()) timer=setTimeout(refresh,500); }
    function setup() {
        if (initialized || !window.L || typeof mapLayerSettings !== 'object') return;
        activeMap = window.giloaMapBootstrap || (typeof map !== 'undefined' && map && typeof map.createPane === 'function' ? map : null);
        var toggle=document.getElementById('layer-toggle-community');
        if(!activeMap || !toggle) return;
        row=toggle.closest('.map-layer-item'); source=row.querySelector('.map-layer-source');
        row.classList.remove('unavailable');source.removeAttribute('data-i18n-extra');
        var soon=document.getElementById('map-layer-coming-soon');if(soon)soon.remove();
        if(typeof MAP_LAYER_UNAVAILABLE === 'object') MAP_LAYER_UNAVAILABLE.community=false;
        activeMap.createPane('communityPlacesPane').style.zIndex='644';layer=L.layerGroup().addTo(activeMap);initialized=true;
        activeMap.on('moveend',schedule);activeMap.on('click',closePopup);
        new MutationObserver(function(){sync();render();}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
        sync();if(enabled())refresh();
    }
    var previousApply=window.applyMapLayerChange;
    if(typeof previousApply === 'function') window.applyMapLayerChange=function(key){var result=previousApply.apply(this,arguments);if(key==='community')refresh();return result;};
    window.GiloaCommunityPlaces={refresh:refresh};
    window.addEventListener('giloa:ready',setup);window.addEventListener('online',function(){if(enabled())refresh();});
    setup();
}());

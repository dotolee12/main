/* Nearby shops: transient search results only; never writes journey or place storage. */
(function () {
    'use strict';
    var TEXT = {
        ko:{title:'동네 가게',hint:'지도 중심 반경 1km에서 가까운 가게를 찾아요. 검색 결과는 일부만 표시돼요.',query:'가게 이름 또는 상품',search:'이 지역 가게 보기',all:'상점',cafe:'카페',food:'음식점',convenience:'편의점',market:'마트',clear:'가게 표시 끄기',loading:'가게를 찾고 있어요…',empty:'검색된 가게가 없어요. 검색어나 지도 위치를 바꿔 보세요.',error:'가게 검색에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.',offline:'온라인에서 가게를 검색할 수 있어요.',count:'가까운 가게 {n}곳',source:'가게 정보: 카카오맵',osm:'링크 정보: © OpenStreetMap contributors',detail:'카카오맵 상세',buy:'온라인 구매·주문 ↗',website:'가게 웹사이트 ↗',find:'가게·판매처 검색 ↗',checking:'등록된 판매 링크를 확인하고 있어요…',missing:'등록된 판매 링크를 찾지 못했어요. 판매처 검색을 이용해 주세요.',linkError:'판매 링크를 확인하지 못했어요. 판매처 검색을 이용해 주세요.',linkHint:'공개 지도에 등록된 링크예요. 판매 상품·지점은 연결된 사이트에서 확인해 주세요.',close:'닫기',moved:'지도를 이동했어요. 버튼을 눌러 이 지역을 다시 검색하세요.'},
        en:{title:'Local shops',hint:'Find nearby shops within 1 km of the map center. Results are limited.',query:'Shop name or product',search:'Find shops in this area',all:'Shops',cafe:'Cafés',food:'Restaurants',convenience:'Convenience stores',market:'Supermarkets',clear:'Hide shops',loading:'Finding shops…',empty:'No shops found. Try another search or area.',error:'Shop search unavailable. Please try again.',offline:'Go online to search for shops.',count:'{n} nearby shops',source:'Places: Kakao Maps',osm:'Links: © OpenStreetMap contributors',detail:'Kakao Maps details',buy:'Buy / order online ↗',website:'Shop website ↗',find:'Search shop / sellers ↗',checking:'Checking registered sales links…',missing:'No registered sales link found. Try the seller search.',linkError:'Could not check sales links. Try the seller search.',linkHint:'Links from public map data. Check products and branch details on the linked site.',close:'Close',moved:'Map moved. Search again to find shops in this area.'},
        ja:{title:'近所のお店',hint:'地図の中心から半径1kmのお店を検索します。表示件数には制限があります。',query:'店名・商品名',search:'この地域のお店を検索',all:'お店',cafe:'カフェ',food:'飲食店',convenience:'コンビニ',market:'スーパー',clear:'お店を非表示',loading:'検索中…',empty:'見つかりません。検索語や地域を変えてください。',error:'検索できません。再度お試しください。',offline:'オンラインで検索できます。',count:'近くのお店 {n}件',source:'店舗情報：Kakao Maps',osm:'リンク：© OpenStreetMap contributors',detail:'Kakao Mapsの詳細',buy:'オンライン購入・注文 ↗',website:'お店のサイト ↗',find:'お店・販売先を検索 ↗',checking:'販売リンクを確認中…',missing:'登録された販売リンクはありません。検索をご利用ください。',linkError:'リンクを確認できません。検索をご利用ください。',linkHint:'公開地図に登録されたリンクです。商品・支店はリンク先でご確認ください。',close:'閉じる',moved:'地図を移動しました。この地域を再検索してください。'},
        zh:{title:'附近商店',hint:'搜索地图中心1公里内的商店。结果数量有限。',query:'店名或商品',search:'搜索此区域商店',all:'商店',cafe:'咖啡店',food:'餐厅',convenience:'便利店',market:'超市',clear:'隐藏商店',loading:'正在搜索…',empty:'未找到商店，请更换关键词或区域。',error:'无法搜索，请稍后重试。',offline:'请联网搜索商店。',count:'附近 {n} 家商店',source:'商店信息：Kakao Maps',osm:'链接：© OpenStreetMap contributors',detail:'Kakao Maps详情',buy:'在线购买·下单 ↗',website:'商店网站 ↗',find:'搜索商店·卖家 ↗',checking:'正在查找销售链接…',missing:'未找到已登记的销售链接，请使用搜索。',linkError:'无法查询销售链接，请使用搜索。',linkHint:'链接来自公开地图，请在网站确认商品和分店。',close:'关闭',moved:'地图已移动，请重新搜索此区域。'}
    };
    Object.assign(TEXT.ko,{error:'길로아의 가게 검색 연결에 문제가 있어요. 아래 버튼으로 카카오맵에서 검색할 수 있어요.',external:'카카오맵에서 검색 ↗',fallback:'공개 지도 검색 결과예요. 등록되지 않은 가게는 누락될 수 있어요.'});
    Object.assign(TEXT.en,{error:'Shop search is unavailable in GILOA. Use the button below to search Kakao Maps.',external:'Search in Kakao Maps ↗',fallback:'Public map results. Some shops may be missing.'});
    Object.assign(TEXT.ja,{error:'GILOAの店舗検索に接続できません。下のボタンでKakao Mapsを検索できます。',external:'Kakao Mapsで検索 ↗',fallback:'公開地図の検索結果です。未登録の店舗は表示されません。'});
    Object.assign(TEXT.zh,{error:'GILOA无法连接商店搜索。可使用下方按钮在Kakao Maps搜索。',external:'在Kakao Maps搜索 ↗',fallback:'公开地图搜索结果，可能缺少尚未登记的商店。'});
    var shopMap, panel, button, layer, items = [], selected = null, request = 0, linkRequest = 0, controller = null;
    function words() { var lang = typeof currentLang === 'string' ? currentLang : document.documentElement.lang; return TEXT[String(lang || 'ko').slice(0,2)] || TEXT.en; }
    function el(key) { return panel.querySelector('[data-shops="' + key + '"]'); }
    function text(tag, value, parent) { var node = document.createElement(tag); node.textContent = value || ''; if (parent) parent.appendChild(node); return node; }
    function safeUrl(value) {
        if (typeof value !== 'string' || !/^https?:\/\//i.test(value.trim())) return '';
        try { var url = new URL(value.trim()); return /^https?:$/.test(url.protocol) && !url.username && !url.password ? url.href : ''; } catch (_) { return ''; }
    }
    function link(parent, label, url) {
        url = safeUrl(url); if (!url) return;
        var a = text('a', label, parent); a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; return a;
    }
    function normalize(value) { return String(value || '').normalize('NFKC').toLowerCase().replace(/[\s\p{P}\p{S}]/gu,''); }
    function searchName(value) { return normalize(value).replace(/세븐일레븐|seveneleven/g,'7eleven'); }
    function externalSearch() {
        var category = el('category'), query = el('query').value.trim().slice(0,100) || category.options[category.selectedIndex].textContent;
        var region = document.getElementById('admin-region-label');
        var area = region ? region.textContent.split('·').slice(1).join(' ').trim() : '';
        el('external').href = 'https://map.kakao.com/link/search/' + encodeURIComponent([area,query].filter(Boolean).join(' '));
    }
    function validPoint(lat, lng) { return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180; }
    function shop(item, center) {
        var lat = Number(item.y), lng = Number(item.x);
        if (!item.id || !item.place_name || !validPoint(lat,lng) || shopMap.distance(center,[lat,lng]) > 1000) return null;
        return {id:String(item.id),name:String(item.place_name),address:String(item.road_address_name || item.address_name || ''),phone:String(item.phone || ''),lat:lat,lng:lng,distance:Math.round(shopMap.distance(center,[lat,lng]))};
    }
    function cancelLinks() { linkRequest++; if (controller) controller.abort(); controller = null; }
    function close() { panel.hidden = true; request++; cancelLinks(); el('search').disabled = false; }
    function clear() { close(); items = []; selected = null; layer.clearLayers(); button.classList.remove('is-active'); }
    function render() {
        var w = words();
        button.title = w.title; button.setAttribute('aria-label',w.title);
        panel.querySelectorAll('[data-shops-text]').forEach(function(node) { node.textContent = w[node.dataset.shopsText]; });
        var fromOsm = items.some(function(item) { return !!item.osm; });
        el('source').textContent = fromOsm ? '© OpenStreetMap contributors' : w.source;
        el('source').href = fromOsm ? 'https://www.openstreetmap.org/copyright' : 'https://map.kakao.com';
        el('close').setAttribute('aria-label',w.close); el('query').placeholder = w.query; el('query').setAttribute('aria-label',w.query); el('category').setAttribute('aria-label',w.title);
        externalSearch();
        el('list').replaceChildren(); layer.clearLayers();
        items.forEach(function(item) {
            var row = text('button',item.name + ' · ' + item.distance + 'm',el('list')); row.type = 'button'; row.onclick = function() { show(item); shopMap.panTo([item.lat,item.lng]); };
            var icon = L.divIcon({className:'local-shop-marker',html:'<span>🛍</span>',iconSize:[34,38],iconAnchor:[17,38]});
            L.marker([item.lat,item.lng],{pane:'localShopsPane',icon:icon,title:item.name,bubblingMouseEvents:false}).addTo(layer).on('click',function() { panel.hidden = false; show(item); });
        });
        if (selected && !panel.hidden) show(selected);
    }
    function showLinks(box, actions, tags, status) {
        var w = words(), buy = safeUrl(tags['website:orders']), website = safeUrl(tags.website || tags['contact:website']);
        if (!buy && website && /^(smartstore\.naver\.com|brand\.naver\.com)$/.test(new URL(website).hostname) && new URL(website).pathname !== '/') buy = website;
        if (buy) link(actions,w.buy,buy);
        if (website && website !== buy) link(actions,w.website,website);
        status.textContent = buy || website ? w.linkHint : w.missing;
        if (buy || website) link(box,w.osm,'https://www.openstreetmap.org/copyright');
    }
    async function osmSearch(center, category, query, id) {
        var filter = {CE7:'["amenity"="cafe"]',FD6:'["amenity"="restaurant"]',CS2:'["shop"="convenience"]',MT1:'["shop"="supermarket"]'}[category] || '["shop"]';
        var timeout = new AbortController(), timer = setTimeout(function() { timeout.abort(); },9000);
        try {
            var q = '[out:json][timeout:6];nwr' + filter + '(around:1000,' + center.lat.toFixed(6) + ',' + center.lng.toFixed(6) + ');out center tags 150;';
            var response = await fetch('https://overpass-api.de/api/interpreter',{method:'POST',body:new URLSearchParams({data:q}),signal:timeout.signal,cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer'});
            if (!response.ok) throw new Error('OSM unavailable');
            var data = await response.json(); if (id !== request) return [];
            return (data.elements || []).map(function(item) {
                var p = item.center || item, tags = item.tags || {}, lat = Number(p.lat), lng = Number(p.lon);
                var name = tags['name:ko'] || tags.name || tags.brand;
                if (!name || !validPoint(lat,lng) || shopMap.distance(center,[lat,lng]) > 1000) return null;
                if (query && !searchName([tags.name,tags['name:ko'],tags.brand,tags['brand:ko'],tags.operator,tags.shop,tags.cuisine].join(' ')).includes(searchName(query))) return null;
                return {id:'osm-' + item.type + '-' + item.id,name:name,address:tags['addr:full'] || [tags['addr:city'],tags['addr:street'],tags['addr:housenumber']].filter(Boolean).join(' '),phone:tags.phone || tags['contact:phone'] || '',lat:lat,lng:lng,distance:Math.round(shopMap.distance(center,[lat,lng])),osm:tags};
            }).filter(Boolean).sort(function(a,b) { return a.distance - b.distance; }).slice(0,30);
        } finally { clearTimeout(timer); }
    }
    function show(item) {
        cancelLinks(); selected = item;
        var w = words(), box = el('detail'); box.replaceChildren(); box.hidden = false;
        text('h3',item.name,box); text('p',item.address,box);
        if (item.phone) { var phone = text('p',item.phone,box); var digits = item.phone.replace(/[^0-9+]/g,''); if (digits) { phone.replaceChildren(); var a = text('a',item.phone,phone); a.href = 'tel:' + digits; } }
        var actions = text('div','',box); actions.className = 'local-shop-actions';
        if (!item.osm) link(actions,w.detail,'https://place.map.kakao.com/' + encodeURIComponent(item.id));
        link(actions,w.find,'https://search.naver.com/search.naver?query=' + encodeURIComponent(item.name + ' ' + item.address + ' 온라인 구매'));
        var status = text('p',w.checking,box); status.setAttribute('role','status');
        if (item.osm) { showLinks(box,actions,item.osm,status); return; }
        var id = linkRequest;
        controller = new AbortController();
        var timer = setTimeout(function() { if (id === linkRequest && controller) controller.abort(); },9000);
        var query = '[out:json][timeout:6];nwr(around:60,' + item.lat.toFixed(6) + ',' + item.lng.toFixed(6) + ')["name"];out center tags 60;';
        fetch('https://overpass-api.de/api/interpreter',{method:'POST',body:new URLSearchParams({data:query}),signal:controller.signal,cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer'}).then(function(response) {
            if (!response.ok) throw new Error('Link lookup failed'); return response.json();
        }).then(function(data) {
            if (id !== linkRequest || panel.hidden) return;
            var matches = (data.elements || []).filter(function(osm) {
                var p = osm.center || osm, tags = osm.tags || {};
                return validPoint(Number(p.lat),Number(p.lon)) && shopMap.distance([item.lat,item.lng],[Number(p.lat),Number(p.lon)]) <= 60 &&
                    [tags.name,tags['name:ko'],tags.official_name].some(function(name) { return name && normalize(name) === normalize(item.name); });
            });
            // Ambiguous same-name branches never receive an automatic purchase link.
            var tags = matches.length === 1 ? matches[0].tags : {};
            showLinks(box,actions,tags,status);
        }).catch(function() { if (id === linkRequest && !panel.hidden) status.textContent = w.linkError; }).finally(function() { clearTimeout(timer); if (id === linkRequest) controller = null; });
    }
    async function search() {
        var id = ++request, w = words(); cancelLinks(); selected = null; el('detail').hidden = true;
        items = []; render(); button.classList.remove('is-active'); el('search').disabled = false;
        if (navigator.onLine === false) { el('status').textContent = w.offline; return; }
        el('status').textContent = w.loading; el('search').disabled = true;
        var center = shopMap.getCenter(), category = el('category').value, query = el('query').value.trim().slice(0,100);
        try {
            await loadKakaoTrafficSdk();
            if (id !== request) return;
            var services = window.kakao.maps.services;
            var results = await new Promise(function(resolve,reject) {
                var timer = setTimeout(function() { reject(new Error('Shop search timeout')); },9000);
                function done(data,status) { clearTimeout(timer); if (status === services.Status.ZERO_RESULT) resolve([]); else if (status === services.Status.OK) resolve(data || []); else reject(new Error('Shop search failed')); }
                var places = new services.Places(), options = {location:new window.kakao.maps.LatLng(center.lat,center.lng),radius:1000,size:15,sort:services.SortBy.DISTANCE};
                if (query) { if (category) options.category_group_code = category; places.keywordSearch(query,done,options); }
                else if (category) places.categorySearch(category,done,options);
                else places.keywordSearch('상점',done,options);
            });
            if (id !== request) return;
            var seen = new Set();
            items = results.map(function(item) { return shop(item,center); }).filter(function(item) { if (!item || seen.has(item.id)) return false; seen.add(item.id); return true; }).sort(function(a,b) { return a.distance - b.distance; });
            render(); button.classList.toggle('is-active',items.length > 0);
            el('status').textContent = items.length ? words().count.replace('{n}',items.length) : words().empty;
        } catch (_) {
            if (id !== request) return;
            try {
                items = await osmSearch(center,category,query,id);
                if (id !== request) return;
                render(); button.classList.toggle('is-active',items.length > 0);
                el('status').textContent = (items.length ? words().count.replace('{n}',items.length) : words().empty) + ' ' + words().fallback;
                el('source').textContent = '© OpenStreetMap contributors'; el('source').href = 'https://www.openstreetmap.org/copyright';
            } catch (_) { if (id === request) el('status').textContent = words().error; }
        }
        finally { if (id === request) el('search').disabled = false; }
    }
    function setup() {
        if (panel) return;
        shopMap = window.giloaMapBootstrap;
        var controls = document.getElementById('controls'); if (!shopMap || !window.L || !controls) return;
        shopMap.createPane('localShopsPane').style.zIndex = '645';
        layer = L.layerGroup().addTo(shopMap);
        button = text('button','🛍',controls); button.id = 'local-shops-button'; button.type = 'button'; button.className = 'btn';
        panel = document.createElement('section'); panel.id = 'local-shops-panel'; panel.hidden = true; panel.setAttribute('role','dialog'); panel.setAttribute('aria-labelledby','local-shops-title');
        panel.innerHTML = '<header><h2 id="local-shops-title" data-shops-text="title"></h2><button type="button" data-shops="close">×</button></header><p data-shops-text="hint"></p>' +
            '<form data-shops="form"><input data-shops="query" maxlength="100"><select data-shops="category"><option value="" data-shops-text="all"></option><option value="CE7" data-shops-text="cafe"></option><option value="FD6" data-shops-text="food"></option><option value="CS2" data-shops-text="convenience"></option><option value="MT1" data-shops-text="market"></option></select><button type="submit" data-shops="search" data-shops-text="search"></button></form>' +
            '<p data-shops="status" role="status" aria-live="polite"></p><div data-shops="detail" hidden></div><div data-shops="list"></div><footer><a data-shops="source" target="_blank" rel="noopener noreferrer" href="https://map.kakao.com" data-shops-text="source"></a><button type="button" data-shops="clear" data-shops-text="clear"></button></footer>';
        document.body.appendChild(panel); L.DomEvent.disableClickPropagation(panel); L.DomEvent.disableScrollPropagation(panel);
        var external = document.createElement('a'); external.dataset.shops = 'external'; external.dataset.shopsText = 'external'; external.target = '_blank'; external.rel = 'noopener noreferrer';
        panel.querySelector('footer').prepend(external);
        el('query').addEventListener('input',externalSearch); el('category').addEventListener('change',externalSearch);
        button.onclick = function() { if (!panel.hidden) { close(); return; } panel.hidden = false; render(); if (!items.length) search(); };
        el('close').onclick = close; el('clear').onclick = clear; el('form').onsubmit = function(event) { event.preventDefault(); search(); };
        shopMap.on('click',close);
        shopMap.on('moveend',function() { if (!panel.hidden && items.length && !el('search').disabled) el('status').textContent = words().moved; });
        document.addEventListener('keydown',function(event) { if (event.key === 'Escape' && !panel.hidden) { close(); button.focus(); } });
        new MutationObserver(function() { render(); }).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
        render();
    }
    window.addEventListener('giloa:ready',setup); setup();
}());

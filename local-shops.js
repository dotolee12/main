/* Nearby shops: transient search results only; never writes journey or place storage. */
(function () {
    'use strict';
    if (window.GiloaPlaceSearch) return;
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
    Object.assign(TEXT.ko,{hint:'지도 중심 1km 안의 편의점·마트·카페를 함께 표시해요. 가게 이름을 입력하면 구분 없이 검색해요. 결과는 일부만 표시돼요.',query:'가게 이름 검색 · 예: 세븐일레븐, 약국'});
    Object.assign(TEXT.en,{hint:'Show convenience stores, supermarkets and cafés together within 1 km. Search any place by name. Results are limited.',query:'Search a place name'});
    Object.assign(TEXT.ja,{hint:'半径1kmのコンビニ・スーパー・カフェを一緒に表示します。店名検索は分類で制限しません。表示件数には制限があります。',query:'店名を検索'});
    Object.assign(TEXT.zh,{hint:'同时显示1公里内的便利店、超市和咖啡店。店名搜索不限类别，结果数量有限。',query:'搜索店名'});
    Object.assign(TEXT.ko,{title:'장소 검색',hint:'병원·카페·편의점·관광지 등 종류에 관계없이 검색해요. 종류를 입력하면 지도 중심 1km, 장소 이름을 입력하면 더 넓은 범위에서 찾아요.',query:'병원, 카페, 관광지 또는 장소 이름',search:'검색',empty:'검색된 장소가 없어요. 검색어나 지도 위치를 바꿔 보세요.',loading:'장소를 찾고 있어요…',count:'검색 결과 {n}곳',clear:'검색 결과 지우기',find:'웹에서 더 보기 ↗',layerTitle:'쇼핑·동네가게',layerHint:'카페 · 편의점 · 마트 · 다이소 · 올리브영',prompt:'찾고 싶은 장소를 입력해 주세요.'});
    Object.assign(TEXT.en,{title:'Place search',hint:'Search hospitals, cafés, shops and attractions. Categories search within 1 km; place names search a wider area.',query:'Hospital, café, attraction or place name',search:'Search',empty:'No places found. Try another query or area.',loading:'Finding places…',count:'{n} places found',clear:'Clear search results',find:'More on the web ↗',layerTitle:'Shopping & local shops',layerHint:'Cafés · convenience stores · supermarkets · DAISO · OLIVE YOUNG',prompt:'Enter a place or category.'});
    Object.assign(TEXT.ja,{title:'場所を検索',hint:'病院・カフェ・店舗・観光地を検索します。分類は半径1km、店名は広い範囲で検索します。',query:'病院・カフェ・観光地・店名',search:'検索',empty:'場所が見つかりません。検索語や地域を変えてください。',loading:'検索中…',count:'検索結果 {n}件',clear:'検索結果を消す',find:'ウェブで詳しく見る ↗',layerTitle:'買い物・近所のお店',layerHint:'カフェ・コンビニ・スーパー・ダイソー・オリーブヤング',prompt:'場所や種類を入力してください。'});
    Object.assign(TEXT.zh,{title:'地点搜索',hint:'搜索医院、咖啡店、商店和景点。类别搜索范围为1公里，店名搜索范围更广。',query:'医院、咖啡店、景点或店名',search:'搜索',empty:'未找到地点，请更换关键词或区域。',loading:'正在搜索地点…',count:'找到 {n} 个地点',clear:'清除搜索结果',find:'查看更多网页 ↗',layerTitle:'购物·附近商店',layerHint:'咖啡店・便利店・超市・大创・OLIVE YOUNG',prompt:'请输入地点或类别。'});
    // Plain store names only. Place results remain transient and are not stored.
    var BRANDS = [
        {id:'olive-young',label:'올리브영',match:/^(?:cj)?(?:올리브영|oliveyoung(?=[가-힣0-9]|$))/},
        {id:'daiso',label:'다이소',match:/^(아성)?다이소|^daiso(?=[가-힣0-9]|$)/},
        {id:'seven-eleven',label:'세븐일레븐',match:/^(세븐일레븐|7eleven|seveneleven)/},
        {id:'cu',label:'씨유',match:/^(씨유|cu(?=[가-힣0-9]|$))/},
        {id:'gs25',label:'쥐에스',match:/^(gs25|지에스25)/},
        {id:'emart24',label:'이마트24',match:/^(이마트24|emart24)/},
        {id:'mega-coffee',label:'메가커피',match:/^(메가mgc커피|메가커피|메가엠지씨커피|megamgccoffee|megacoffee)/},
        {id:'starbucks',label:'스타벅스',match:/^(스타벅스|starbucks)/},
        {id:'emart',label:'이마트',match:/^(이마트|emart)(?!24)/},
        {id:'lotte-mart',label:'롯데마트',match:/^(롯데마트|lottemart)/}
    ];
    var shopMap, panel, button, layer, items = [], selected = null, request = 0, linkRequest = 0, controller = null;
    var shopsLayer, shopsItems = [], shopsRequest = 0, shopsTimer = null, layerRow, localEnabled = false;
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
    function brandFor(item) {
        var tags = item.osm || {}, names = [item.name,tags.brand,tags['brand:ko']].map(normalize);
        return BRANDS.find(function(brand) { return names.some(function(name) { return brand.match.test(name); }); });
    }
    function brandName(brand) {
        var lang = String(typeof currentLang === 'string' ? currentLang : document.documentElement.lang || 'ko').slice(0,2);
        var names = {
            'seven-eleven':['7-Eleven','セブンイレブン','7-Eleven'], cu:['CU','CU','CU'], gs25:['GS25','GS25','GS25'],
            emart24:['emart24','emart24','emart24'], 'mega-coffee':['Mega Coffee','メガコーヒー','Mega Coffee'],
            starbucks:['Starbucks','スターバックス','星巴克'], emart:['emart','イーマート','易买得'],
            'lotte-mart':['Lotte Mart','ロッテマート','乐天玛特'], daiso:['Daiso','ダイソー','大创'],
            'olive-young':['OLIVE YOUNG','オリーブヤング','OLIVE YOUNG']
        };
        return lang === 'ko' ? brand.label : names[brand.id][lang === 'ja' ? 1 : lang === 'zh' ? 2 : 0];
    }
    function placeMarkerIcon(item) {
        var named = !!brandFor(item);
        return L.divIcon({className:'local-shop-marker',html:badge(item,true),iconSize:named ? [78,26] : [39,31],iconAnchor:named ? [39,13] : [19.5,15.5]});
    }
    function badge(item, onMap) {
        var brand = brandFor(item), node = document.createElement('span'); node.className = 'local-shop-pin' + (onMap ? ' map-symbol-only' : '');
        if (brand || !onMap) { var name = text('span',brand ? brandName(brand) : item.name,node); name.className = 'local-shop-pin-name'; }
        function fallbackSymbol() {
            var codes = {HP8:'hospital',PM9:'pharmacy',FD6:'food',AT4:'discovery',AD5:'lodging',PK6:'parking'};
            var kind = codes[item.category] || (item.osm && ({hospital:'hospital',clinic:'hospital',pharmacy:'pharmacy',restaurant:'food',toilets:'restroom',parking:'parking'})[item.osm.amenity]) || 'shopping';
            var symbol = document.createElement('span'); symbol.className = 'local-shop-category-symbol'; symbol.setAttribute('aria-hidden','true');
            if (typeof mapLayerMenuIcon === 'function') symbol.innerHTML = mapLayerMenuIcon(kind);
            else symbol.textContent = '◇';
            node.appendChild(symbol);
        }
        if (onMap && !brand) fallbackSymbol();
        if (brand) { node.dataset.brand = brand.id; node.classList.add('has-brand-name'); }
        return node;
    }
    function externalSearch() {
        var query = el('query').value.trim().slice(0,100) || words().title;
        var region = document.getElementById('admin-region-label');
        var area = region ? region.textContent.split('·').slice(1).join(' ').trim() : '';
        el('external').href = 'https://map.kakao.com/link/search/' + encodeURIComponent([area,query].filter(Boolean).join(' '));
    }
    function validPoint(lat, lng) { return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180; }
    function shop(item, center, localOnly) {
        var lat = Number(item.y), lng = Number(item.x);
        if (!item.id || !item.place_name || !validPoint(lat,lng) || (localOnly && shopMap.distance(center,[lat,lng]) > 1000)) return null;
        return {id:String(item.id),name:String(item.place_name),address:String(item.road_address_name || item.address_name || ''),phone:String(item.phone || ''),category:String(item.category_group_code || ''),lat:lat,lng:lng,distance:Math.round(shopMap.distance(center,[lat,lng]))};
    }
    function cancelLinks() { linkRequest++; if (controller) controller.abort(); controller = null; }
    function close() { panel.hidden = true; button.setAttribute('aria-expanded','false'); request++; cancelLinks(); el('search').disabled = false; }
    function clear() { close(); items = []; selected = null; layer.clearLayers(); button.classList.remove('is-active'); }
    function distanceLabel(item) { return item.distance < 1000 ? item.distance + 'm' : (item.distance / 1000).toFixed(1) + 'km'; }
    function focusPlace(item) { if (item.distance > 1000 && typeof shopMap.setView === 'function') shopMap.setView([item.lat,item.lng],16); else shopMap.panTo([item.lat,item.lng]); }
    function render() {
        var w = words();
        button.title = w.title; button.setAttribute('aria-label',w.title);
        panel.querySelectorAll('[data-shops-text]').forEach(function(node) { node.textContent = w[node.dataset.shopsText]; });
        var fromOsm = items.some(function(item) { return !!item.osm; });
        el('source').textContent = fromOsm ? '© OpenStreetMap contributors' : w.source;
        el('source').href = fromOsm ? 'https://www.openstreetmap.org/copyright' : 'https://map.kakao.com';
        el('close').setAttribute('aria-label',w.close); el('query').placeholder = w.query; el('query').setAttribute('aria-label',w.query);
        externalSearch();
        el('list').hidden = false; el('list').replaceChildren(); layer.clearLayers();
        items.forEach(function(item) {
            var row = text('button','',el('list')); row.appendChild(badge(item)); text('span',item.name + ' · ' + distanceLabel(item),row); row.type = 'button'; row.onclick = function() { show(item); focusPlace(item); };
            var icon = placeMarkerIcon(item);
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
    async function osmSearch(center, query, isCurrent) {
        var timeout = new AbortController(), timer = setTimeout(function() { timeout.abort(); },9000);
        try {
            var around = '(around:1000,' + center.lat.toFixed(6) + ',' + center.lng.toFixed(6) + ');';
            var oliveYoung = query ? '' : 'nwr["shop"~"^(cosmetics|chemist|beauty|perfumery)$"][~"^(name|brand)(:ko)?$"~"올리브 *영|olive *young",i]' + around;
            var q = '[out:json][timeout:6];(nwr' + (query ? '["shop"]' : '["shop"~"^(convenience|supermarket|grocery|greengrocer)$"]') + around + 'nwr["shop"]["name"~"다이소|daiso",i]' + around + 'nwr["amenity"="cafe"]' + around + oliveYoung + (query ? 'nwr["amenity"~"^(hospital|clinic|doctors|pharmacy|restaurant)$"]' + around + 'nwr["tourism"]' + around : '') + ');out center tags 150;';
            var response = await fetch('https://overpass-api.de/api/interpreter',{method:'POST',body:new URLSearchParams({data:q}),signal:timeout.signal,cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer'});
            if (!response.ok) throw new Error('OSM unavailable');
            var data = await response.json(); if (!isCurrent()) return [];
            return (data.elements || []).map(function(item) {
                var p = item.center || item, tags = item.tags || {}, lat = Number(p.lat), lng = Number(p.lon);
                var name = tags['name:ko'] || tags.name || tags.brand;
                if (!name || !validPoint(lat,lng) || shopMap.distance(center,[lat,lng]) > 1000) return null;
                var category = query && categoryFor(query), categoryMatch = category && ({HP8:/^(hospital|clinic|doctors)$/.test(tags.amenity || ''),PM9:tags.amenity === 'pharmacy',CE7:tags.amenity === 'cafe',CS2:tags.shop === 'convenience',MT1:/^(supermarket|grocery|greengrocer)$/.test(tags.shop || ''),AT4:!!tags.tourism,FD6:tags.amenity === 'restaurant'})[category];
                if (query && !categoryMatch && !searchName([tags.name,tags['name:ko'],tags.brand,tags['brand:ko'],tags.operator,tags.shop,tags.cuisine].join(' ')).includes(searchName(query))) return null;
                return {id:'osm-' + item.type + '-' + item.id,name:name,address:tags['addr:full'] || [tags['addr:city'],tags['addr:street'],tags['addr:housenumber']].filter(Boolean).join(' '),phone:tags.phone || tags['contact:phone'] || '',lat:lat,lng:lng,distance:Math.round(shopMap.distance(center,[lat,lng])),osm:tags};
            }).filter(Boolean).sort(function(a,b) { return a.distance - b.distance; }).slice(0,60);
        } finally { clearTimeout(timer); }
    }
    function show(item) {
        cancelLinks(); selected = item;
        button.setAttribute('aria-expanded','true');
        var w = words(), box = el('detail'); box.replaceChildren(); box.hidden = false;
        text('h3',item.name,box); text('p',item.address,box);
        if (item.phone) { var phone = text('p',item.phone,box); var digits = item.phone.replace(/[^0-9+]/g,''); if (digits) { phone.replaceChildren(); var a = text('a',item.phone,phone); a.href = 'tel:' + digits; } }
        var actions = text('div','',box); actions.className = 'local-shop-actions';
        if (!item.osm) link(actions,w.detail,'https://place.map.kakao.com/' + encodeURIComponent(item.id));
        link(actions,w.find,'https://search.naver.com/search.naver?query=' + encodeURIComponent(item.name + ' ' + item.address));
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
    function categoryFor(query) {
        var key = normalize(query), groups = {HP8:['병원','의원','hospital','hospitals','病院','医院'],PM9:['약국','pharmacy','薬局','药店'],CE7:['카페','cafe','cafes','カフェ','咖啡店'],CS2:['편의점','conveniencestore','コンビニ','便利店'],MT1:['마트','슈퍼마켓','supermarket','スーパー','超市'],AT4:['관광지','여행지','attraction','attractions','観光地','景点'],FD6:['음식점','식당','restaurant','レストラン','餐厅']};
        return Object.keys(groups).find(function(code) { return groups[code].some(function(word) { return normalize(word) === key; }); });
    }
    async function findPlaces(center, query, isCurrent) {
        await loadKakaoTrafficSdk(); if (!isCurrent()) return [];
        var services = window.kakao.maps.services, category = query && categoryFor(query);
        function providerSearch(value, isCategory, localOnly) { return new Promise(function(resolve,reject) {
            var timer = setTimeout(function() { reject(new Error('Place search timeout')); },9000);
            function done(data,status) { clearTimeout(timer); if (status === services.Status.ZERO_RESULT) resolve([]); else if (status === services.Status.OK) resolve(data || []); else reject(new Error('Place search failed')); }
            var options = {location:new window.kakao.maps.LatLng(center.lat,center.lng),size:15,sort:localOnly ? services.SortBy.DISTANCE : services.SortBy.ACCURACY};
            if (localOnly) options.radius = 1000;
            var places = new services.Places();
            try { if (isCategory) places.categorySearch(value,done,options); else places.keywordSearch(value,done,options); }
            catch (error) { clearTimeout(timer); reject(error); }
        }); }
        var results;
        if (query) results = await providerSearch(category || query,!!category,!!category);
        else {
            var markets = providerSearch('마트',false,true).then(function(places) { return places.filter(function(place) { return place.category_group_code === 'MT1' || /슈퍼|수퍼|식료품|하나로마트|대형마트/.test(place.category_name || ''); }); });
            var daiso = providerSearch('다이소',false,true).then(function(places) { return places.filter(function(place) { var brand = brandFor({name:place.place_name}); return brand && brand.id === 'daiso' && (!place.category_name || /다이소|daiso/i.test(String(place.category_name).split('>').pop())); }); });
            var oliveYoung = providerSearch('올리브영',false,true).then(function(places) {
                return places.filter(function(place) {
                    var brand = brandFor({name:place.place_name});
                    var categoryName = String(place.category_name || '').split('>').pop().trim();
                    return brand && brand.id === 'olive-young' &&
                        (!categoryName || /올리브\s*영|olive\s*young|화장품|드럭스토어/i.test(categoryName));
                });
            });
            var groups = await Promise.allSettled([providerSearch('CS2',true,true),providerSearch('MT1',true,true),providerSearch('CE7',true,true),markets,daiso,oliveYoung]);
            if (groups.every(function(group) { return group.status === 'rejected'; })) throw new Error('Place search failed');
            results = groups.filter(function(group) { return group.status === 'fulfilled'; }).flatMap(function(group) { return group.value; });
        }
        if (!isCurrent()) return [];
        var seen = new Set();
        return results.map(function(item) { return shop(item,center,!query || !!category); }).filter(function(item) { if (!item || seen.has(item.id)) return false; seen.add(item.id); return true; }).sort(function(a,b) { return a.distance - b.distance; });
    }
    async function search() {
        var id = ++request, w = words(); cancelLinks(); selected = null; el('detail').hidden = true;
        items = []; render(); button.classList.remove('is-active'); el('search').disabled = false;
        var query = el('query').value.trim().slice(0,100);
        if (!query) { el('status').textContent = w.prompt; return; }
        if (navigator.onLine === false) { el('status').textContent = w.offline; return; }
        el('status').textContent = w.loading; el('search').disabled = true;
        var center = shopMap.getCenter(), current = function() { return id === request; };
        try {
            items = await findPlaces(center,query,current); if (!current()) return;
            render(); button.classList.toggle('is-active',items.length > 0);
            el('status').textContent = items.length ? words().count.replace('{n}',items.length) : words().empty;
        } catch (_) {
            if (!current()) return;
            try {
                items = await osmSearch(center,query,current); if (!current()) return;
                render(); button.classList.toggle('is-active',items.length > 0);
                el('status').textContent = (items.length ? words().count.replace('{n}',items.length) : words().empty) + ' ' + words().fallback;
                el('source').textContent = '© OpenStreetMap contributors'; el('source').href = 'https://www.openstreetmap.org/copyright';
            } catch (_) { if (current()) el('status').textContent = words().error; }
        } finally { if (current()) el('search').disabled = false; }
    }
    function shopsOn() { return typeof mapLayerSettings === 'object' ? !!mapLayerSettings.shopping : localEnabled; }
    function syncShopRow(message) {
        if (!layerRow) return;
        var on = shopsOn(), toggle = layerRow.querySelector('.toggle-switch');
        layerRow.querySelector('.map-layer-name').textContent = words().layerTitle;
        layerRow.querySelector('.map-layer-source').textContent = message || words().layerHint + ' · © Korea Tourism Organization · Kakao Maps / © OpenStreetMap';
        toggle.classList.toggle('on',on); toggle.classList.toggle('off',!on); layerRow.setAttribute('aria-pressed',String(on));
        if (typeof syncMapLayerItemUI === 'function') syncMapLayerItemUI('shopping');
    }
    function renderShops() {
        shopsLayer.clearLayers(); if (!shopsOn()) return;
        shopsItems.forEach(function(item) {
            var icon = placeMarkerIcon(item);
            L.marker([item.lat,item.lng],{pane:'localShopsPane',icon:icon,title:item.name,bubblingMouseEvents:false}).addTo(shopsLayer).on('click',function() { panel.hidden = false; show(item); el('list').hidden = true; });
        });
    }
    async function refreshShops() {
        var id = ++shopsRequest; if (!shopsOn()) return;
        var current = function() { return id === shopsRequest && shopsOn(); }, center = shopMap.getCenter(), found;
        syncShopRow(words().loading);
        try { found = await findPlaces(center,'',current); }
        catch (_) {
            if (!current()) return;
            try { found = await osmSearch(center,'',current); }
            catch (_) { if (current()) syncShopRow(words().error); return; }
        }
        if (!current()) return;
        shopsItems = found; renderShops(); syncShopRow();
    }
    function shoppingChanged() {
        localEnabled = shopsOn();
        syncShopRow();
        if (localEnabled) refreshShops(); else { shopsRequest++; shopsItems = []; shopsLayer.clearLayers(); }
    }
    function toggleShops() {
        if (typeof toggleMapLayer === 'function') { toggleMapLayer('shopping'); return; }
        localEnabled = !shopsOn();
        if (typeof mapLayerSettings === 'object') {
            mapLayerSettings.shopping = localEnabled;
            mapLayerSettings.localshops = localEnabled;
            if (typeof saveMapLayerSettings === 'function') saveMapLayerSettings();
        }
        shoppingChanged();
    }
    function addShopRow() {
        var target = document.getElementById('map-layer-panel'); if (!target) return;
        if (typeof mapLayerSettings === 'object') {
            var on = !!(mapLayerSettings.shopping || mapLayerSettings.localshops);
            var changed = mapLayerSettings.shopping !== on || mapLayerSettings.localshops !== on;
            mapLayerSettings.shopping = mapLayerSettings.localshops = on;
            if (changed && on && typeof saveMapLayerSettings === 'function') saveMapLayerSettings();
        }
        var toggle = document.getElementById('layer-toggle-shopping');
        layerRow = toggle && toggle.closest('.map-layer-item');
        if (!layerRow) {
            layerRow = document.createElement('div'); layerRow.className = 'map-layer-item';
            layerRow.innerHTML = '<span class="map-layer-menu-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 7h14l-1 14H6L5 7zm3 0a4 4 0 018 0M9 12h.01M15 12h.01"/></svg></span><span class="map-layer-copy"><span class="map-layer-name" id="map-layer-name-shopping"></span><small class="map-layer-source"></small></span><div id="layer-toggle-shopping" class="toggle-switch small"><div class="toggle-knob"></div></div>';
            layerRow.onclick = toggleShops; target.appendChild(layerRow);
        }
        layerRow.id = 'map-layer-shopping'; layerRow.setAttribute('role','button'); layerRow.tabIndex = 0;
        layerRow.querySelector('.map-layer-source').removeAttribute('data-i18n-extra');
        syncShopRow();
        if (typeof syncMapLayerItemUI !== 'function') layerRow.onkeydown = function(event) { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggleShops(); } };
        if (typeof window.refreshMapLayerTileOrder === 'function') window.refreshMapLayerTileOrder();
    }
    function setup() {
        if (panel) return;
        shopMap = window.giloaMapBootstrap || (typeof map !== 'undefined' && map && typeof map.createPane === 'function' ? map : null);
        var tasks = document.getElementById('daily-task-widget'), taskButton = document.getElementById('daily-task-tag'); if (!shopMap || !window.L || !tasks || !taskButton) return;
        shopMap.createPane('localShopsPane').style.zIndex = '645';
        layer = L.layerGroup().addTo(shopMap);
        shopsLayer = L.layerGroup().addTo(shopMap);
        button = document.getElementById('place-search-button') || document.createElement('button'); button.id = 'place-search-button'; button.type = 'button';
        button.innerHTML = '<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/></svg>';
        button.setAttribute('aria-expanded','false'); button.setAttribute('aria-controls','local-shops-panel'); tasks.insertBefore(button,taskButton);
        panel = document.createElement('section'); panel.id = 'local-shops-panel'; panel.hidden = true; panel.setAttribute('role','dialog'); panel.setAttribute('aria-labelledby','local-shops-title');
        panel.innerHTML = '<header><h2 id="local-shops-title" data-shops-text="title"></h2><button type="button" data-shops="close">×</button></header><p data-shops-text="hint"></p>' +
            '<form data-shops="form"><input data-shops="query" maxlength="100"><button type="submit" data-shops="search" data-shops-text="search"></button></form>' +
            '<p data-shops="status" role="status" aria-live="polite"></p><div data-shops="detail" hidden></div><div data-shops="list"></div><footer><a data-shops="source" target="_blank" rel="noopener noreferrer" href="https://map.kakao.com" data-shops-text="source"></a><button type="button" data-shops="clear" data-shops-text="clear"></button></footer>';
        document.body.appendChild(panel); L.DomEvent.disableClickPropagation(panel); L.DomEvent.disableScrollPropagation(panel);
        var external = document.createElement('a'); external.dataset.shops = 'external'; external.dataset.shopsText = 'external'; external.target = '_blank'; external.rel = 'noopener noreferrer';
        panel.querySelector('footer').prepend(external);
        el('query').addEventListener('input',externalSearch);
        button.onclick = function() { if (!panel.hidden) { close(); return; } if (typeof toggleDailyTasks === 'function') toggleDailyTasks(false); panel.hidden = false; button.setAttribute('aria-expanded','true'); render(); if (!items.length) search(); el('query').focus(); };
        el('close').onclick = close; el('clear').onclick = clear; el('form').onsubmit = function(event) { event.preventDefault(); search(); };
        shopMap.on('click',close);
        shopMap.on('moveend',function() {
            if (!panel.hidden && items.length && !el('search').disabled) el('status').textContent = words().moved;
            if (shopsTimer) clearTimeout(shopsTimer);
            // Invalidate old viewport responses immediately, before the next refresh.
            shopsRequest++;
            if (shopsOn()) shopsTimer = setTimeout(function() { shopsTimer = null; refreshShops(); },650);
        });
        document.addEventListener('keydown',function(event) { if (event.key === 'Escape' && !panel.hidden) { close(); button.focus(); } });
        new MutationObserver(function() { render(); renderShops(); syncShopRow(); }).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
        window.addEventListener('giloa:shopping-layer-change',shoppingChanged);
        addShopRow(); render(); if (shopsOn()) refreshShops();
        window.GiloaPlaceSearch = { open:function() { if (panel.hidden) button.onclick(); } };
    }
    window.addEventListener('giloa:ready',setup); setup();
}());

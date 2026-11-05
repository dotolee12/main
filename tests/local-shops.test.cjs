const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM} = require(process.env.GPX_TEST_DEPS ? path.join(process.env.GPX_TEST_DEPS,'jsdom') : 'jsdom');
const source = fs.readFileSync(path.join(__dirname,'..','local-shops.js'),'utf8');
const fixture = {id:'123',place_name:'동네 빵집',x:'127.1',y:'37.5',road_address_name:'서울 송파구 동네로 1',phone:'02-123-4567'};
const tick = () => new Promise(resolve=>setTimeout(resolve,10));
function start(savedSettings, mainMapOnly) {
    const dom = new JSDOM('<html lang="ko"><body><div id="controls"></div><div id="daily-task-widget"><button id="daily-task-tag">할 일</button></div><div id="map-layer-panel"></div><div id="map"></div></body></html>',{url:'https://giloa.test',runScripts:'outside-only'});
    const w = dom.window, handlers={}, calls=[], markers=[];
    const map = {createPane:()=>({style:{}}),on:(name,fn)=>{handlers[name]=fn;},getCenter:()=>({lat:37.5,lng:127.1}),distance:(a,b)=>Math.hypot((a.lat??a[0])-b[0],(a.lng??a[1])-b[1])*100000,panTo:()=>{}};
    function makeLayer() { const layer={addTo:()=>layer,clearLayers:()=>{for(let i=markers.length-1;i>=0;i--)if(markers[i].target===layer)markers.splice(i,1);}};return layer; }
    if (mainMapOnly) { w.map = map; const button=w.document.createElement("button"); button.id="place-search-button"; w.document.getElementById("daily-task-widget").prepend(button); } else w.giloaMapBootstrap = map;
    w.L = {layerGroup:makeLayer,divIcon:x=>x,DomEvent:{disableClickPropagation:()=>{},disableScrollPropagation:()=>{}},marker:(point,opts)=>{const m={point,opts,addTo:target=>{m.target=target;return m;},on:(event,fn)=>{m[event]=fn;return m;}};markers.push(m);return m;}};
    const response = {data:[fixture],status:'OK'};
    function places() { const call=(type,q,cb,opts)=>{calls.push({type,q,cb,opts}); if (!response.defer) cb(response.byQuery ? response.byQuery(q,type) : response.data,response.status);}; this.keywordSearch=(...args)=>call('keyword',...args); this.categorySearch=(...args)=>call('category',...args); }
    w.kakao = {maps:{services:{Places:places,Status:{OK:'OK',ZERO_RESULT:'ZERO',ERROR:'ERROR'},SortBy:{DISTANCE:'distance',ACCURACY:'accuracy'}},LatLng:function(lat,lng){this.lat=lat;this.lng=lng;}}};
    w.loadKakaoTrafficSdk=()=>Promise.resolve();
    w.mapLayerSettings=savedSettings || {tourism:true,hospital:true}; w.saveMapLayerSettings=()=>w.localStorage.setItem('layer-settings',JSON.stringify(w.mapLayerSettings));
    w.fetch=()=>Promise.resolve({ok:true,json:()=>Promise.resolve({elements:[]})});
    w.AbortController=AbortController;
    w.localStorage.setItem('journey-fixture','GPS/photos/GPX/levels');
    w.eval(source);
    const el = key=>w.document.querySelector('[data-shops="'+key+'"]');
    const open=()=>{if(!el('query').value)el('query').value=fixture.place_name;w.document.getElementById('place-search-button').click();};
    const search=()=>el('form').dispatchEvent(new w.Event('submit',{cancelable:true}));
    return {w,dom,handlers,calls,markers,response,el,open,search};
}
test('nearby search displays safe markers, details and seller search without writing records',async()=>{
    const a=start(); a.open(); await tick();
    assert.equal(a.calls[0].opts.radius,undefined); assert.equal(a.markers.length,1);
    a.el('list').firstChild.click(); await tick();
    const links=[...a.el('detail').querySelectorAll('a')];
    assert(links.some(x=>x.href==='https://place.map.kakao.com/123'));
    assert(links.some(x=>x.href.startsWith('https://search.naver.com/search.naver?query=')));
    assert(links.filter(x=>x.target==='_blank').every(x=>x.rel==='noopener noreferrer'));
    assert.equal(a.w.localStorage.length,1); assert.equal(a.w.localStorage.getItem('journey-fixture'),'GPS/photos/GPX/levels');
    a.el('clear').click(); assert.equal(a.markers.length,0); a.dom.window.close();
});
test('exact nearby OSM match exposes purchase link and attribution; ambiguous or mismatched stores do not',async()=>{
    for (const mode of ['match','ambiguous','different','far']) {
        const a=start(); a.open(); await tick();
        let item={lat:37.5,lon:127.1,tags:{name:mode==='different'?'다른 가게':'동네 빵집','website:orders':'https://example.com/order'}};
        if(mode==='far')item.lat=38;
        a.w.fetch=()=>Promise.resolve({ok:true,json:()=>Promise.resolve({elements:mode==='ambiguous'?[item,item]:[item]})});
        a.markers[0].click(); await tick();
        assert.equal(!!a.el('detail').querySelector('a[href="https://example.com/order"]'),mode==='match');
        if(mode==='match')assert(a.el('detail').querySelector('a[href="https://www.openstreetmap.org/copyright"]'));
        a.dom.window.close();
    }
});
test('malicious URLs and HTML never become active content',async()=>{
    const a=start(); a.response.data=[{...fixture,place_name:'<img src=x onerror=alert(1)>'}]; a.open(); await tick();
    a.w.fetch=()=>Promise.resolve({ok:true,json:()=>Promise.resolve({elements:[{lat:37.5,lon:127.1,tags:{name:a.response.data[0].place_name,'website:orders':'javascript:alert(1)',website:'https://user:pass@example.com/'}}]})});
    a.markers[0].click(); await tick(); assert.equal(a.el('detail').querySelector('img'),null);
    assert.equal(a.el('detail').querySelector('[href^="javascript:"]'),null); assert(!a.el('detail').textContent.includes('온라인 구매·주문'));
    a.dom.window.close();
});
test('zero results, provider errors and offline have distinct recoverable status',async()=>{
    const a=start(); a.response.status='ZERO'; a.open(); await tick(); assert.match(a.el('status').textContent,/없어요/);
    a.response.status='ERROR'; a.w.fetch=()=>Promise.reject(new Error('offline')); a.search(); await tick(); assert.match(a.el('status').textContent,/연결/); assert.equal(a.el('search').disabled,false);
    Object.defineProperty(a.w.navigator,'onLine',{value:false,configurable:true}); a.search(); await tick(); assert.match(a.el('status').textContent,/온라인/);
    a.dom.window.close();
});
test('OSM fallback shows nearby shops and registered sales URLs when Kakao is unavailable',async()=>{
    const a=start(); a.w.loadKakaoTrafficSdk=()=>Promise.reject(new Error('domain mismatch'));
    a.w.fetch=()=>Promise.resolve({ok:true,json:()=>Promise.resolve({elements:[{type:'node',id:3,lat:37.5,lon:127.1,tags:{name:'동네 빵집',shop:'bakery','website:orders':'https://example.com/buy'}}]})});
    a.open(); await tick(); assert.equal(a.markers.length,1); assert.match(a.el('source').textContent,/OpenStreetMap/);
    a.markers[0].click(); await tick(); assert(a.el('detail').querySelector('a[href="https://example.com/buy"]'));
    assert.equal(a.el('detail').querySelector('a[href^="https://place.map.kakao.com/"]'),null); a.dom.window.close();
});
test('connection failure offers an accurately labelled external search using the entered store name',async()=>{
    const a=start(); a.w.loadKakaoTrafficSdk=()=>Promise.reject(new Error('domain mismatch'));
    a.w.fetch=()=>Promise.reject(new Error('unavailable'));
    a.el('query').value='세븐일레븐'; a.el('query').dispatchEvent(new a.w.Event('input')); a.open(); await tick();
    assert.match(a.el('status').textContent,/검색 연결에 문제가/);
    assert.equal(a.el('external').textContent,'카카오맵에서 검색 ↗');
    assert.equal(decodeURIComponent(a.el('external').href),'https://map.kakao.com/link/search/세븐일레븐');
    assert.equal(a.markers.length,0); a.dom.window.close();
});
test('fallback matches Korean Seven Eleven searches against English brand-only OSM shops',async()=>{
    const a=start(); a.w.loadKakaoTrafficSdk=()=>Promise.reject(new Error('domain mismatch'));
    a.w.fetch=()=>Promise.resolve({ok:true,json:()=>Promise.resolve({elements:[{type:'node',id:7,lat:37.5,lon:127.1,tags:{brand:'7-Eleven',shop:'convenience'}}]})});
    a.el('query').value='세븐일레븐'; a.open(); await tick();
    assert.equal(a.markers.length,1); assert.match(a.el('list').textContent,/7-Eleven/);
    assert.match(a.el('status').textContent,/공개 지도/); a.dom.window.close();
});
test('closing or clearing prevents late searches and link responses from replacing UI',async()=>{
    const a=start(); a.response.defer=true; a.open(); await tick(); a.el('clear').click();
    a.calls[0].cb([fixture],'OK'); await tick(); assert.equal(a.markers.length,0);
    a.response.defer=false; a.open(); await tick(); let complete;
    a.w.fetch=()=>new Promise(resolve=>{complete=resolve;}); a.markers[0].click(); a.handlers.click();
    complete({ok:true,json:()=>Promise.resolve({elements:[]})}); await tick(); assert(a.w.document.getElementById('local-shops-panel').hidden);
    a.dom.window.close();
});
test('shops load together without a category selector; keyword search is unrestricted and rejects invalid points',async()=>{
    const a=start(); a.w.document.getElementById('map-layer-localshops').click(); await tick();
    assert.equal(a.el('category'),null);
    assert.deepEqual(a.calls.filter(x=>x.type==='category').map(x=>x.q),['CS2','MT1','CE7']);
    assert(a.calls.some(x=>x.type==='keyword'&&x.q==='마트')); a.w.document.getElementById('map-layer-localshops').click(); a.open(); await tick();
    a.el('query').value='빵'; a.response.data=[fixture,fixture,{...fixture,id:'bad',y:'oops'},{...fixture,id:'far',y:'39'}]; a.search(); await tick();
    assert.equal(a.calls.at(-1).type,'keyword'); assert.equal(a.calls.at(-1).q,'빵');
    assert.equal(a.calls.at(-1).opts.category_group_code,undefined); assert.equal(a.markers.length,2);
    assert(a.markers.every(marker=>marker.point.every(Number.isFinite))); a.dom.window.close();
});
test('map logos and category symbols omit labels while search results keep readable names',async()=>{
    const a=start();
    const names=['세븐일레븐 성남점','CU 성남점','GS25 수정점','이마트24 산성점','메가MGC커피 단대점','스타벅스 성남점','이마트 성남점','롯데마트 성남점','동네마트','CUBE 카페'];
    a.response.data=names.map((name,i)=>({...fixture,id:String(i+1),place_name:name})); a.open(); await tick();
    const expected=['seven-eleven','cu','gs25','emart24','mega-coffee','starbucks','emart','lotte-mart'];
    expected.forEach((brand,i)=>{
        const badge=a.markers[i].opts.icon.html;
        const file=brand+(brand==='cu'?'.svg':'.png');
        assert.equal(badge.dataset.brand,brand); assert.equal(badge.querySelector('img').getAttribute('src'),'./assets/shop-logos/'+file);
        assert(fs.existsSync(path.join(__dirname,'..','assets','shop-logos',file)));
    });
    assert.equal(a.markers[8].opts.icon.html.querySelector('img'),null);
    assert.equal(a.markers[9].opts.icon.html.querySelector('img'),null);
    assert(a.markers[8].opts.icon.html.querySelector('.local-shop-category-symbol'));
    assert.equal(a.markers[8].opts.icon.html.querySelector('.local-shop-pin-name'),null);
    assert.match(a.el('list').textContent,/동네마트/);
    assert.deepEqual(Array.from(a.markers[8].opts.icon.iconSize),[39,31]);
    const badge=a.markers[0].opts.icon.html; badge.querySelector('img').dispatchEvent(new a.w.Event('error'));
    assert.equal(badge.classList.contains('has-logo'),false); assert(badge.querySelector('.local-shop-category-symbol')); assert.equal(badge.querySelector('.local-shop-pin-name'),null);
    a.el('query').value='약국'; a.search(); await tick(); assert.equal(a.calls.at(-1).opts.category_group_code,undefined);
    a.dom.window.close();
});
test('combined market search excludes shoe and phone shops with mart in their names',async()=>{
    const a=start(); a.response.byQuery=q=>q==='마트'?[
        {...fixture,id:'market',place_name:'동네마트',category_name:'가정,생활 > 슈퍼마켓'},
        {...fixture,id:'shoe',place_name:'ABC마트',category_name:'쇼핑,유통 > 신발 > ABC마트'},
        {...fixture,id:'phone',place_name:'폰마트',category_name:'쇼핑,유통 > 통신판매'}
    ]:[];
    a.w.document.getElementById('map-layer-localshops').click(); await tick(); assert.equal(a.markers.length,1); assert.equal(a.markers[0].opts.title,'동네마트'); a.dom.window.close();
});
test('Korean, English, Japanese and Chinese labels, Escape and map close work',async()=>{
    const a=start();
    for (const [lang,label] of [['ko','장소 검색'],['en','Place search'],['ja','場所を検索'],['zh-TW','地点搜索']]) {
        a.w.document.documentElement.lang=lang; await tick(); assert.equal(a.w.document.getElementById('place-search-button').title,label);
    }
    a.open(); await tick(); a.w.document.dispatchEvent(new a.w.KeyboardEvent('keydown',{key:'Escape'})); assert(a.w.document.getElementById('local-shops-panel').hidden);
    a.open(); a.handlers.click(); assert(a.w.document.getElementById('local-shops-panel').hidden); a.dom.window.close();
});
test('the old shop button is removed and empty unified search opens next to daily tasks without a request',async()=>{
    const a=start(); const button=a.w.document.getElementById('place-search-button');
    assert.equal(a.w.document.getElementById('local-shops-button'),null);
    assert.equal(button.nextElementSibling.id,'daily-task-tag');
    button.click(); await tick(); assert.equal(a.calls.length,0); assert.match(a.el('status').textContent,/입력/);
    assert.equal(a.el('category'),null); a.dom.window.close();
});
test('hospital cafe convenience and tourism use unrestricted shared search while named places can be distant',async()=>{
    const a=start(); a.open(); await tick();
    for(const [query,category] of [['병원','HP8'],['카페','CE7'],['편의점','CS2'],['관광지','AT4']]) {
        a.el('query').value=query; a.search(); await tick();
        assert.equal(a.calls.at(-1).type,'category'); assert.equal(a.calls.at(-1).q,category); assert.equal(a.calls.at(-1).opts.radius,1000);
    }
    a.response.data=[{...fixture,id:'jeju',place_name:'성산일출봉',y:'33.458',x:'126.942'}];
    a.el('query').value='성산일출봉'; a.search(); await tick(); assert.equal(a.calls.at(-1).opts.radius,undefined); assert.equal(a.markers.length,1);
    a.dom.window.close();
});
test('local shop layer persists visibility independently of search and existing map selections',async()=>{
    const a=start(); const toggle=a.w.document.getElementById('map-layer-localshops');
    toggle.click(); await tick(); assert(a.w.mapLayerSettings.localshops); assert.equal(a.markers.length,1);
    assert(a.w.document.getElementById('local-shops-panel').hidden);
    const saved=JSON.parse(a.w.localStorage.getItem('layer-settings')); assert(saved.tourism&&saved.hospital&&saved.localshops);
    a.open(); await tick(); assert.equal(a.markers.length,2);
    a.el('clear').click(); assert.equal(a.markers.length,1); assert.equal(a.w.localStorage.getItem('journey-fixture'),'GPS/photos/GPX/levels');
    a.open(); await tick(); assert.equal(a.markers.length,2); toggle.click(); await tick(); assert.equal(a.markers.length,1);
    assert.equal(a.w.document.getElementById('local-shops-panel').hidden,false);
    a.dom.window.close();
    const b=start(saved); await tick(); assert.equal(b.markers.length,1); assert.equal(b.w.document.getElementById('map-layer-localshops').getAttribute('aria-pressed'),'true'); b.dom.window.close();
});
test('disabled local shop layer rejects late provider responses',async()=>{
    const a=start(); a.response.defer=true; const toggle=a.w.document.getElementById('map-layer-localshops');
    toggle.click(); await tick(); toggle.click();
    a.calls.forEach(call=>call.cb([fixture],'OK')); await tick(); assert.equal(a.markers.length,0); assert.equal(a.w.mapLayerSettings.localshops,false); a.dom.window.close();
});

test('existing search button is reused when the bootstrap module is absent but the main map is ready',async()=>{
    const b=start(undefined,true);
    const existing=b.w.document.getElementById('place-search-button');
    b.w.GiloaPlaceSearch.open(); await tick();
    assert.equal(b.w.document.querySelectorAll('#place-search-button').length,1);
    assert.equal(b.w.document.getElementById('place-search-button'),existing);
    assert.equal(b.w.document.getElementById('local-shops-panel').hidden,false);
    b.dom.window.close();
});

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM} = require(process.env.GPX_TEST_DEPS ? path.join(process.env.GPX_TEST_DEPS,'jsdom') : 'jsdom');
const source = fs.readFileSync(path.join(__dirname,'..','local-shops.js'),'utf8');
const fixture = {id:'123',place_name:'동네 빵집',x:'127.1',y:'37.5',road_address_name:'서울 송파구 동네로 1',phone:'02-123-4567'};
const tick = () => new Promise(resolve=>setTimeout(resolve,10));
function start() {
    const dom = new JSDOM('<html lang="ko"><body><div id="controls"></div><div id="map"></div></body></html>',{url:'https://giloa.test',runScripts:'outside-only'});
    const w = dom.window, handlers={}, calls=[], markers=[];
    const map = {createPane:()=>({style:{}}),on:(name,fn)=>{handlers[name]=fn;},getCenter:()=>({lat:37.5,lng:127.1}),distance:(a,b)=>Math.hypot((a.lat??a[0])-b[0],(a.lng??a[1])-b[1])*100000,panTo:()=>{}};
    const layer = {addTo:()=>layer,clearLayers:()=>{markers.length=0;}};
    w.giloaMapBootstrap = map;
    w.L = {layerGroup:()=>layer,divIcon:x=>x,DomEvent:{disableClickPropagation:()=>{},disableScrollPropagation:()=>{}},marker:(point,opts)=>{const m={point,opts,addTo:()=>m,on:(event,fn)=>{m[event]=fn;return m;}};markers.push(m);return m;}};
    const response = {data:[fixture],status:'OK'};
    function places() { const call=(type,q,cb,opts)=>{calls.push({type,q,cb,opts}); if (!response.defer) cb(response.data,response.status);}; this.keywordSearch=(...args)=>call('keyword',...args); this.categorySearch=(...args)=>call('category',...args); }
    w.kakao = {maps:{services:{Places:places,Status:{OK:'OK',ZERO_RESULT:'ZERO',ERROR:'ERROR'},SortBy:{DISTANCE:'distance'}},LatLng:function(lat,lng){this.lat=lat;this.lng=lng;}}};
    w.loadKakaoTrafficSdk=()=>Promise.resolve();
    w.fetch=()=>Promise.resolve({ok:true,json:()=>Promise.resolve({elements:[]})});
    w.AbortController=AbortController;
    w.localStorage.setItem('journey-fixture','GPS/photos/GPX/levels');
    w.eval(source);
    const el = key=>w.document.querySelector('[data-shops="'+key+'"]');
    const open=()=>w.document.getElementById('local-shops-button').click();
    const search=()=>el('form').dispatchEvent(new w.Event('submit',{cancelable:true}));
    return {w,dom,handlers,calls,markers,response,el,open,search};
}
test('nearby search displays safe markers, details and seller search without writing records',async()=>{
    const a=start(); a.open(); await tick();
    assert.equal(a.calls[0].opts.radius,1000); assert.equal(a.markers.length,1);
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
    const a=start(); a.open(); await tick();
    assert.equal(a.el('category'),null);
    assert.deepEqual(a.calls.filter(x=>x.type==='category').map(x=>x.q),['CS2','MT1','CE7']);
    assert(a.calls.some(x=>x.type==='keyword'&&x.q==='마트'));
    a.el('query').value='빵'; a.response.data=[fixture,fixture,{...fixture,id:'bad',y:'oops'},{...fixture,id:'far',y:'39'}]; a.search(); await tick();
    assert.equal(a.calls.at(-1).type,'keyword'); assert.equal(a.calls.at(-1).q,'빵');
    assert.equal(a.calls.at(-1).opts.category_group_code,undefined); assert.equal(a.markers.length,1); a.dom.window.close();
});
test('brand logos identify chains while independent shops and failed logos keep readable labels',async()=>{
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
    assert.equal(a.markers[8].opts.icon.html.textContent,'동네마트');
    const badge=a.markers[0].opts.icon.html; badge.querySelector('img').dispatchEvent(new a.w.Event('error'));
    assert.equal(badge.classList.contains('has-logo'),false); assert.equal(badge.textContent,'7-Eleven');
    a.el('query').value='약국'; a.search(); await tick(); assert.equal(a.calls.at(-1).opts.category_group_code,undefined);
    a.dom.window.close();
});
test('Korean, English, Japanese and Chinese labels, Escape and map close work',async()=>{
    const a=start();
    for (const [lang,label] of [['ko','동네 가게'],['en','Local shops'],['ja','近所のお店'],['zh-TW','附近商店']]) {
        a.w.document.documentElement.lang=lang; await tick(); assert.equal(a.w.document.getElementById('local-shops-button').title,label);
    }
    a.open(); await tick(); a.w.document.dispatchEvent(new a.w.KeyboardEvent('keydown',{key:'Escape'})); assert(a.w.document.getElementById('local-shops-panel').hidden);
    a.open(); a.handlers.click(); assert(a.w.document.getElementById('local-shops-panel').hidden); a.dom.window.close();
});

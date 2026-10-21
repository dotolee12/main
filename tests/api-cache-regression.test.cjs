const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
function extract(name) {
    const start = source.indexOf('function ' + name + '(');
    assert.notEqual(start, -1);
    let depth = 0;
    for (let i = source.indexOf('{', start); i < source.length; i++) {
        if (source[i] === '{') depth++;
        if (source[i] === '}' && --depth === 0) return source.slice(start, i + 1);
    }
    throw new Error(name);
}
function setup(storage = new Map()) {
    let now = new Date(2026, 9, 13, 12).getTime();
    class Clock extends Date { constructor(...args) { super(...(args.length ? args : [now])); } static now() { return now; } }
    const c = { Date:Clock, console, Promise, Number, String, Math, isFinite,
        TOUR_AREA_CACHE_PREFIX:'giloa-api-area-v1:', TOUR_SEARCH_MOVE_M:120,
        TOUR_REVALIDATE_MS:86400000, TOUR_FESTIVAL_REVALIDATE_MS:900000,
        tourAreaMemoryCache:{}, festivalRefreshPromiseByLang:{}, currentLang:'ko',
        festivalRequestSeq:0, festivalItems:[], tourItems:[], tourPanelOpen:false,
        localStorage:{ get length() { return storage.size; }, key:i=>Array.from(storage.keys())[i],
            getItem:k => storage.get(k) || null, setItem:(k,v) => storage.set(k,v), removeItem:k=>storage.delete(k) },
        getTourSearchDistance:(a,b) => Math.hypot(a.lat-b.lat,a.lng-b.lng)*111000,
        normalizeLang:x=>x, markTourItemsSource() {}, translateTourItemsForLang() {},
        getMapSearchCenter:()=>({lat:37,lng:127}), getMapSearchRadius:()=>2000,
        getTourEndpoint:()=>'', TOUR_API_KEY:'', beginTourApiLoading() {}, endTourApiLoading() {},
        updateFestivalBadge() {}, renderFestivalStrip() {},
        TRANSLATE_CACHE_KEY:'giloa-api-translations-v1', TRANSLATE_CACHE_MAX_AGE_MS:2592000000,
        translateSavedRecords:null, translateMemoryCache:Object.create(null), translatePendingCache:Object.create(null)
    };
    vm.createContext(c);
    ['writeApiCacheStorage','normalizeTourCacheRecord','getTodayString','readTourAreaRecords','readTourAreaCache','writeTourAreaCache',
        'fetchFestivals','loadTranslateCache','saveTranslateCache','getTranslateCacheKey','varcoTranslate']
        .forEach(name => vm.runInContext(extract(name),c));
    return { c,storage,advance:ms=>{now+=ms;} };
}
test('revisited regions survive restart, isolate languages, and respect coverage and expiry', () => {
    const r=setup(), a={lat:37,lng:127}, b={lat:38,lng:128};
    r.c.writeTourAreaCache('spots',a,'ko',2000,[{contentid:'a'}]);
    r.c.writeTourAreaCache('spots',b,'ko',2000,[{contentid:'b'}]);
    const restarted=setup(r.storage);
    assert.equal(restarted.c.readTourAreaCache('spots',a,'ko',2000).items[0].contentid,'a');
    assert.equal(restarted.c.readTourAreaCache('spots',a,'en',2000),null);
    assert.equal(restarted.c.readTourAreaCache('spots',a,'ko',2500),null);
    assert.equal(restarted.c.readTourAreaCache('spots',{lat:37.01,lng:127},'ko',2000),null);
    restarted.advance(86400000);
    assert.equal(restarted.c.readTourAreaCache('spots',a,'ko',2000),null);
});
test('cache limits and quota failures never remove or overwrite journey records', () => {
    const r=setup(new Map([['journey','keep']]));
    for(let i=0;i<30;i++) r.c.writeTourAreaCache('spots',{lat:30+i/10,lng:127},'ko',1000,[]);
    assert.equal(r.c.readTourAreaRecords('spots','ko').length,24);
    r.c.localStorage.setItem=()=>{throw new Error('quota');};
    r.c.writeTourAreaCache('spots',{lat:37,lng:127},'ko',1000,[{contentid:'a'}]);
    assert.equal(r.c.readTourAreaCache('spots',{lat:37,lng:127},'ko',1000).items.length,1);
    assert.equal(r.storage.get('journey'),'keep');
});
test('festivals reuse empty results, share pending requests, expire and allow forced refresh', async () => {
    const r=setup(); let calls=0, release;
    r.c.fetchTourJsonWithFallback=()=>{calls++;return new Promise(done=>{release=()=>done({response:{header:{resultCode:'0000'},body:{items:''}}});});};
    r.c.writeFestivalCache=()=>{};
    const first=r.c.fetchFestivals({});
    assert.equal(r.c.fetchFestivals({}),first);
    release(); await first;
    await r.c.fetchFestivals({}); assert.equal(calls,1);
    r.advance(900000);
    const expired=r.c.fetchFestivals({}); release(); await expired; assert.equal(calls,2);
    const forced=r.c.fetchFestivals({force:true}); release(); await forced; assert.equal(calls,3);
});
test('translations persist across restart and share concurrent requests', async () => {
    const r=setup(); let calls=0,release;
    r.c.requestVarcoTranslation=()=>{calls++;return new Promise(done=>{release=()=>done('Hello');});};
    const first=r.c.varcoTranslate('안녕','ko','en');
    assert.equal(r.c.varcoTranslate('안녕','ko','en'),first);
    release(); assert.equal(await first,'Hello'); assert.equal(calls,1);
    const restarted=setup(r.storage);
    restarted.c.requestVarcoTranslation=async()=>{calls++;return 'New';};
    assert.equal(await restarted.c.varcoTranslate('안녕','ko','en'),'Hello'); assert.equal(calls,1);
    restarted.advance(2592000000);
    assert.equal(await restarted.c.varcoTranslate('안녕','ko','en'),'New'); assert.equal(calls,2);
});
test('translation failure fallback is retried and storage failure remains usable', async () => {
    const r=setup(); let calls=0;
    r.c.requestVarcoTranslation=async text=>{calls++;return text;};
    await r.c.varcoTranslate('안녕','ko','en'); await r.c.varcoTranslate('안녕','ko','en');
    assert.equal(calls,2); assert.equal(r.storage.has(r.c.TRANSLATE_CACHE_KEY),false);
    r.c.localStorage.setItem=()=>{throw new Error('quota');};
    r.c.requestVarcoTranslation=async()=> 'Hello';
    assert.equal(await r.c.varcoTranslate('안녕','ko','en'),'Hello');
});
test('cached tourism refresh redraws markers without requesting tourism spots', async () => {
    const r=setup(); let spots=0,markers=0, festivals=0;
    const a={lat:37,lng:127};
    Object.assign(r.c,{tourSearchStateByLang:{}, tourRefreshPromiseByLang:{}, MAP_LAYER_RADIUS_M:2000,
        hydrateTourItemsFromCache() {}, updateTourSummary() {}, renderTourCards() {}, addTourMarkers(){markers++;},
        fetchFestivals:async()=>{festivals++;}, fetchTourSpots:async()=>{spots++;return true;}});
    ['applyTourAreaCache','shouldRefreshTourData','refreshTourData'].forEach(name=>vm.runInContext(extract(name),r.c));
    r.c.writeTourAreaCache('spots',a,'ko',2000,[{contentid:'a',_sourceLang:'en'}]);
    await r.c.refreshTourData();
    assert.equal(spots,0); assert.equal(markers,1); assert.equal(festivals,1);
    assert.equal(r.c.tourItems[0]._sourceLang,'en');
    await r.c.refreshTourData();
    assert.equal(markers,1, 'unchanged cached items must not rebuild markers');
    assert.equal(spots,0);
});
test('API storage budget evicts only API caches, preserving journey and unrelated settings', () => {
    const r=setup(new Map([['journey','keep'],['settings','keep']]));
    for(let i=0;i<5;i++) assert.equal(r.c.writeApiCacheStorage('giloa-api-area-v1:spots:'+i,'x'.repeat(200000)),true);
    const values=Array.from(r.storage.entries()).filter(([key])=>key.startsWith('giloa-api-area-v1:'));
    assert.ok(values.reduce((sum,[key,value])=>sum+value.length,0)<=512*1024);
    assert.equal(r.storage.get('journey'),'keep'); assert.equal(r.storage.get('settings'),'keep');
});
test('festivals expire when the date changes even within fifteen minutes', () => {
    const r=setup(), a={lat:37,lng:127};
    r.advance(12*3600000-300000);
    r.c.writeTourAreaCache('festival',a,'ko',2000,[]);
    r.advance(360000);
    assert.equal(r.c.readTourAreaCache('festival',a,'ko',2000),null);
});
test('corrupt API caches do not become fresh results or affect saved journeys', () => {
    const r=setup(new Map([['journey','keep']])), a={lat:37,lng:127};
    r.storage.set('giloa-api-area-v1:spots:ko',JSON.stringify([{center:a,radius:2000,items:[null]},
        {center:a,radius:2000,items:[],savedAt:Date.now()}]));
    assert.equal(r.c.readTourAreaCache('spots',a,'ko',2000),null);
    assert.equal(r.storage.get('journey'),'keep');
});
test('manual force refresh bypasses a valid tourism cache', async () => {
    const r=setup(); let spots=0;
    const a={lat:37,lng:127};
    Object.assign(r.c,{tourItems:[{contentid:'a'}],tourSearchStateByLang:{}, tourRefreshPromiseByLang:{},
        MAP_LAYER_RADIUS_M:2000, hydrateTourItemsFromCache() {}, setTourRefreshing() {},
        fetchFestivals:async()=>{}, fetchTourSpots:async()=>{spots++;return true;}, scheduleTourFetch(){}});
    ['applyTourAreaCache','shouldRefreshTourData','refreshTourData'].forEach(name=>vm.runInContext(extract(name),r.c));
    r.c.writeTourAreaCache('spots',a,'ko',2000,[{contentid:'a'}]);
    assert.equal(await r.c.refreshTourData({force:true}),true);
    assert.equal(spots,1);
});

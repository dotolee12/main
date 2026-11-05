const test=require('node:test'), assert=require('node:assert/strict'), fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('script.js','utf8');
test('libraries outside Seoul use coordinates and names from Kakao without changing the existing catalogue',async()=>{
 const center={lat:37.452,lng:127.155,distanceTo:()=>0}, original={LBRRY_SEQ_NO:'seoul-1',LBRRY_NAME:'기존 서울 도서관'};
 let callback, renders=0, query,opts;
 const c={mapLayerSettings:{library:true},navigator:{onLine:true},nearbyLibraryArea:'',nearbyLibrarySeq:0,getMapSearchCenter:()=>center,getMapSearchRadius:()=>1000,loadKakaoTrafficSdk:()=>Promise.resolve(),setTimeout,clearTimeout,libraryItems:[original],currentLang:'ko',isWithinMapSearchCenter:()=>true,renderLibraryMarkers:()=>renders++,kakao:{maps:{LatLng:function(lat,lng){this.lat=lat;this.lng=lng;},services:{Status:{OK:'OK'},SortBy:{DISTANCE:'distance'},Places:function(){this.keywordSearch=(q,cb,o)=>{query=q;callback=cb;opts=o;};}}}}};
 vm.createContext(c);vm.runInContext(source.slice(source.indexOf('function fetchNearbyLibraryFallback()'),source.indexOf('function fetchLibraries()')),c);
 const work=c.fetchNearbyLibraryFallback();await Promise.resolve();callback([{id:'10',place_name:'성남수정도서관',y:'37.4521',x:'127.1552',road_address_name:'성남시 수정구',phone:'031-123-4567'}],'OK');assert.equal(await work,true);
 assert.equal(query,'도서관');assert.equal(opts.radius,1000);assert.equal(c.libraryItems[0],original);assert.equal(c.libraryItems[1].XCNTS,37.4521);assert.equal(c.libraryItems[1].YDNTS,127.1552);assert.equal(renders,1);
 assert.equal(await c.fetchNearbyLibraryFallback(),false);
});
test('missing place modules retry after document load; search button exists in the HTML before any module runs',()=>{
 const html=fs.readFileSync('index.html','utf8');assert.equal((html.match(/id="place-search-button"/g)||[]).length,1);
 const code=html.match(/<script id="giloa-place-module-recovery">([\s\S]*?)<\/script>/)[1];let listener, scripts=[];
 const c={window:{addEventListener:()=>{}},document:{addEventListener:(e,fn)=>{if(e==='DOMContentLoaded')listener=fn;},createElement:()=>({remove(){}}),head:{appendChild:s=>scripts.push(s)}}};
 vm.createContext(c);vm.runInContext(code,c);listener();assert.equal(scripts.length,2);assert(scripts[0].src.includes('local-shops.js'));listener();assert.equal(scripts.length,2);
 let opened=0;c.window.GiloaPlaceSearch={open:()=>opened++};c.window.giloaRetryPlaceModule();assert.equal(opened,1);
});
test('Kakao restroom markers render before a slow OSM request finishes',async()=>{
 let rendered=[];const c={navigator:{onLine:true},cached:null,center:{lat:37.45,lng:127.15},radius:1000,requestSeq:1,options:{},controller:null,applyItems:rows=>{rendered.push(rows[0]);return true;},fetchRestroomsFromKakaoForCurrentArea:()=>Promise.resolve(['nearby restroom']),fetchRestroomsFromOsm:()=>new Promise(()=>{})};
 vm.createContext(c);const a=source.indexOf('    function fetchOnlineFallbacks() {',source.indexOf('function fetchRestroomsForCurrentArea'));const b=source.indexOf('\n\n    var isSeoul',a);vm.runInContext(source.slice(a,b),c);c.fetchOnlineFallbacks();await Promise.resolve();await Promise.resolve();assert.deepEqual(rendered,['nearby restroom']);
});

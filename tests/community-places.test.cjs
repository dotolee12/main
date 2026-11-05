const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require(path.join(process.env.GPX_TEST_DEPS,'jsdom'));
const source=fs.readFileSync('community-places.js','utf8'),tick=()=>new Promise(r=>setTimeout(r,10));
const place={id:'42',place_name:'신흥동 주민회관',road_address_name:'경기도 성남시 수정구 시민로 1',address_name:'지번 주소',phone:'031-123-4567',x:'127.15',y:'37.45'};
function fixture(saved=false){
 const dom=new JSDOM('<html lang="ko"><body><div class="map-layer-item unavailable"><span id="map-layer-name-community">주민회관</span><em id="map-layer-coming-soon">준비중</em><small class="map-layer-source" data-i18n-extra="dataPreparing"></small><div id="layer-toggle-community"></div></div></body></html>',{url:'https://giloa.test/',runScripts:'outside-only'});
 const w=dom.window,handlers={},markers=[],calls=[],response={rows:[place],status:'OK',defer:false},popups=[];
 let originalCalls=0;const center={lat:37.45,lng:127.15};
 const map={createPane:()=>({style:{}}),getCenter:()=>center,distance:(a,b)=>Math.hypot(a.lat-b[0],a.lng-b[1])*100000,on:(event,fn)=>handlers[event]=fn,closePopup:()=>popups.splice(0)};
 w.giloaMapBootstrap=map;const layer={addTo:()=>layer,clearLayers:()=>markers.splice(0)};
 w.L={layerGroup:()=>layer,divIcon:opts=>opts,marker:(point,opts)=>{const m={point,opts,addTo:()=>{markers.push(m);return m;},on:(e,fn)=>{m[e]=fn;return m;}};return m;},popup:opts=>{const p={opts,setLatLng:x=>{p.point=x;return p;},setContent:x=>{p.box=x;return p;},openOn:()=>{popups.push(p);return p;}};return p;}};
 w.mapLayerSettings={community:saved,tourism:true,restroom:true};w.MAP_LAYER_UNAVAILABLE={community:true};w.getMapSearchRadius=()=>1000;
 w.mapPlaceSymbolHtml=key=>'<svg data-key="'+key+'"></svg>';w.loadKakaoTrafficSdk=()=>Promise.resolve();
 w.syncMapLayerToggleUI=key=>w.document.querySelector('.map-layer-item').setAttribute('aria-pressed',String(w.mapLayerSettings[key]));
 w.applyMapLayerChange=()=>originalCalls++;
 w.toggleMapLayer=()=>{if(w.MAP_LAYER_UNAVAILABLE.community)return;w.mapLayerSettings.community=!w.mapLayerSettings.community;w.localStorage.setItem('layer-settings',JSON.stringify(w.mapLayerSettings));w.applyMapLayerChange('community');};
 w.kakao={maps:{LatLng:function(lat,lng){this.lat=lat;this.lng=lng;},services:{Status:{OK:'OK',ZERO_RESULT:'ZERO'},SortBy:{DISTANCE:'distance'},Places:function(){this.keywordSearch=(q,cb,opts)=>{calls.push({q,cb,opts});if(!response.defer)cb(response.rows,response.status);};}}}};
 w.localStorage.setItem('journey-fixture','GPS/EXIF/photos/levels');w.eval(source);
 return {w,dom,map,handlers,markers,calls,response,popups,toggle:()=>w.toggleMapLayer('community'),old:()=>originalCalls};
}
test('community tile loads valid nearby addresses, deduplicates and retains all unrelated records',async()=>{
 const a=fixture();assert.equal(a.w.MAP_LAYER_UNAVAILABLE.community,false);assert.equal(a.w.document.getElementById('map-layer-coming-soon'),null);a.toggle();await tick();
 assert.deepEqual(a.calls.map(x=>x.q),['주민회관','마을회관','주민자치센터','행정복지센터']);assert(a.calls.every(x=>x.opts.radius===1000));assert.equal(a.markers.length,1);assert.deepEqual(Array.from(a.markers[0].point),[37.45,127.15]);assert.match(a.markers[0].opts.icon.html,/community/);
 a.markers[0].click();assert.match(a.popups[0].box.textContent,/경기도 성남시 수정구 시민로 1/);assert.equal(a.popups[0].box.querySelector('a[target="_blank"]').rel,'noopener noreferrer');assert.equal(a.popups[0].opts.closeOnClick,true);a.handlers.click();assert.equal(a.popups.length,0);
 assert.equal(a.w.localStorage.getItem('journey-fixture'),'GPS/EXIF/photos/levels');assert.equal(a.w.mapLayerSettings.restroom,true);assert.equal(a.old(),1);a.dom.window.close();
});
test('unrelated businesses, invalid coordinates and distant results never become community markers',async()=>{
 const a=fixture();a.response.rows=[place,{...place,id:'parking',place_name:'마을회관 주차장',category_group_code:'PK6'},{...place,id:'food',place_name:'주민회관 식당',category_group_code:'FD6'},{...place,id:'wrong',place_name:'다른 상점'},{...place,id:'bad',y:'NaN'},{...place,id:'far',y:'39'}];a.toggle();await tick();assert.equal(a.markers.length,1);a.dom.window.close();
});
test('toggle off and moving the map invalidate late results',async()=>{
 const a=fixture();a.response.defer=true;a.toggle();await tick();a.toggle();a.calls.forEach(x=>x.cb([place],'OK'));await tick();assert.equal(a.markers.length,0);
 a.toggle();await tick();const pending=a.calls.slice(-4);a.handlers.moveend();pending.forEach(x=>x.cb([place],'OK'));await tick();assert.equal(a.markers.length,0);a.toggle();a.dom.window.close();
});
test('saved setting restores facilities and translations preserve names and coordinates',async()=>{
 const a=fixture(true);await tick();assert.equal(a.markers.length,1);assert.equal(a.w.localStorage.length,1);
 for(const [lang,word] of [['en','nearby'],['ja','近く'],['zh','附近'],['ko','주변']]){a.w.document.documentElement.lang=lang;await tick();assert(a.w.document.querySelector('.map-layer-source').textContent.includes(word));assert.equal(a.markers[0].opts.title,place.place_name);}
 a.w.eval(source);await tick();assert.equal(a.calls.length,4);a.dom.window.close();
});
test('empty, provider error and offline states are distinct and recoverable',async()=>{
 for(const state of ['ZERO','ERROR','offline']){const a=fixture();a.response.status=state;if(state==='offline')Object.defineProperty(a.w.navigator,'onLine',{value:false});a.toggle();await tick();const text=a.w.document.querySelector('.map-layer-source').textContent;assert(text.includes(state==='ZERO'?'결과 없음':state==='ERROR'?'조회 실패':'온라인'));assert.equal(a.markers.length,0);a.dom.window.close();}
});
test('provider text never becomes executable popup markup',async()=>{
 const a=fixture();a.response.rows=[{...place,place_name:'마을회관 <img src=x onerror=alert(1)>',road_address_name:'<script>alert(1)</script>',phone:'javascript:alert(1)'}];a.toggle();await tick();a.markers[0].click();assert.equal(a.popups[0].box.querySelector('img,script,[href^="javascript:"]'),null);assert(a.popups[0].box.textContent.includes('<script>'));a.dom.window.close();
});

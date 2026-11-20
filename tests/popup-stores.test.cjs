const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('popup-stores.js','utf8');
function api(){const context={window:{addEventListener(){}},document:{documentElement:{lang:'ko'},addEventListener(){}},Intl,Date,console};vm.runInNewContext(source,context);return context.window.GiloaPopupStores;}
test('Korea date switches at midnight even when the host date is different',()=>{const a=api();assert.equal(a.day(new Date('2026-11-22T14:59:59Z')),'2026-11-22');assert.equal(a.day(new Date('2026-11-22T15:00:00Z')),'2026-11-23');});
test('event end date is inclusive, future and expired events are hidden',()=>{const a=api(),e={start:'2026-11-14',end:'2026-11-22'};assert.equal(a.active(e,'2026-11-13'),false);assert.equal(a.active(e,'2026-11-14'),true);assert.equal(a.active(e,'2026-11-22'),true);assert.equal(a.active(e,'2026-11-23'),false);assert.equal(a.active({},'2026-11-20'),false);});
test('seed events have distinct IDs, official HTTPS sources, addresses and expiry',()=>{const data=JSON.parse(fs.readFileSync('data/popup-stores.json','utf8'));assert.equal(new Set(data.events.map(e=>e.id)).size,data.events.length);for(const e of data.events){assert.ok(e.address.startsWith('서울 '));assert.ok(e.start<=e.end);assert.ok(['cjnews.cj.net','www.musinsa.com','plaza.seoul.go.kr'].includes(new URL(e.source).hostname));assert.ok(e.names.en&&e.names.ko);}});
async function ui(geoOk=true,now="2026-11-20T12:00:00Z"){
 const {JSDOM}=require('jsdom');const dom=new JSDOM('<html lang="ko"><body></body></html>',{url:'https://giloa.test',runScripts:'outside-only'}),w=dom.window,markers=[];
 w.Date=class extends Date{constructor(...a){super(...(a.length?a:[now]));}};w.setInterval=()=>0;
 w.giloaMapBootstrap={createPane:()=>({style:{}}),on(){},setView(){}};
 const group={addTo(){return this;},clearLayers(){markers.length=0;}};
 w.L={layerGroup:()=>group,DomEvent:{disableClickPropagation(){},disableScrollPropagation(){}},control:()=>({addTo(){w.document.body.appendChild(this.onAdd());}}),divIcon:x=>x,marker:(p,options)=>({addTo(){markers.push({p,options});return this;},bindPopup(){return this;}})};
 w.fetch=async()=>({ok:true,json:async()=>JSON.parse(fs.readFileSync('data/popup-stores.json','utf8'))});w.loadKakaoTrafficSdk=async()=>{};
 w.kakao={maps:{services:{Status:{OK:'OK'},Geocoder:function(){this.addressSearch=(address,cb)=>cb(geoOk?[{x:'127.05',y:'37.54'}]:[],geoOk?'OK':'ZERO');}}}};
 w.eval(source);await new Promise(r=>setTimeout(r,20));return {dom,w,markers};
}
test('verified events produce red POP markers, translated list, toggle and outside close',async()=>{const {dom,w,markers}=await ui();assert.equal(markers.length,3);assert.equal(markers[0].options.icon.className,'giloa-popup-marker');w.document.querySelector('.giloa-popup-control').click();const p=w.document.getElementById('giloa-popup-panel');assert.equal(p.hidden,false);assert.ok(p.textContent.includes('투에이엔'));p.querySelector('header button').click();assert.equal(p.hidden,true);w.document.documentElement.lang='es';await new Promise(r=>setTimeout(r,10));assert.ok(p.textContent.includes('Tiendas temporales'));assert.equal(w.localStorage.length,0);dom.window.close();});
test('failed geocoding preserves official listings without fabricated map points',async()=>{const {dom,w,markers}=await ui(false);assert.equal(markers.length,0);assert.equal(w.document.querySelectorAll('.giloa-popup-card').length,4);assert.ok(w.document.querySelector('a[href*="map.kakao.com/link/search/"]'));dom.window.close();});

test('Seoul Plaza is upcoming during installation and has an EVENT marker only after public opening',async()=>{
 const before=await ui();assert.equal(before.markers.length,3);assert.ok(before.w.document.getElementById('giloa-popup-panel').textContent.includes('예정'));assert.ok(before.w.document.getElementById('giloa-popup-panel').textContent.includes('서울광장 스케이트장'));before.dom.window.close();
 const open=await ui(true,'2026-12-18T03:00:00Z');assert.equal(open.markers.length,1);assert.equal(open.markers[0].options.icon.html,'<span>EVENT</span>');open.dom.window.close();
 const end=await ui(true,'2027-02-09T15:00:00Z');assert.equal(end.markers.length,0);assert.equal(end.w.document.querySelectorAll('.giloa-popup-card').length,0);end.dom.window.close();
});
test('upcoming list is limited to 30 days and excludes expired events',()=>{const a=api(),e={start:'2026-12-18',end:'2027-02-09'};assert.equal(a.listed(e,'2026-11-17'),false);assert.equal(a.listed(e,'2026-11-18'),true);assert.equal(a.listed(e,'2027-02-10'),false);});

const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const deps=process.env.GPX_TEST_DEPS;
const {JSDOM}=require(path.join(deps,'jsdom'));
const {IDBFactory,IDBKeyRange}=require(path.join(deps,'fake-indexeddb'));
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const tick=()=>new Promise(r=>setTimeout(r,30));
function start(factory){
 const dom=new JSDOM('<html lang="ko"><body><div id="sidebar"><div class="sidebar-header"></div></div><div id="controls"></div><div id="map"></div><section id="special-place-editor"><h2 id="special-place-title"></h2><textarea id="special-place-note"></textarea></section></body></html>',{url:'https://giloa.test/',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
 w.currentLang='ko';w.indexedDB=factory;w.IDBKeyRange=IDBKeyRange;w.Blob=Blob;
 w.URL.createObjectURL=()=> 'blob:https://giloa.test/'+w.crypto.randomUUID();w.URL.revokeObjectURL=()=>{};
 w.eval(read('vendor/leaflet.js'));w.map=w.L.map('map').setView([37.52,127.2],17);w.giloaMapBootstrap=w.map;
 w.toggleSidebar=()=>{};w.specialPlaceEditorCoords={latitude:37.52,longitude:127.2};
 w.closeSpecialPlaceEditor=()=>{w.specialPlaceEditorCoords=null;w.document.getElementById('special-place-editor').hidden=true;};
 w.openSpecialPlaceEditor=(lat,lng)=>{w.specialPlaceEditorCoords={latitude:lat,longitude:lng};w.document.getElementById('special-place-editor').hidden=false;};
 w.localStorage.setItem('giloa-personal-parking-v1',JSON.stringify({lat:37.1,lng:127.1,floor:'B3',zone:'C17'}));
 w.localStorage.setItem('journey-sentinel','existing route/photo/memory');
 w.createImageBitmap=async()=>({width:1000,height:800,close(){}});
 w.HTMLCanvasElement.prototype.getContext=()=>({drawImage(){}});
 w.HTMLCanvasElement.prototype.toBlob=function(cb){cb(new Blob(['saved-location-photo'],{type:'image/jpeg'}));};
 w.eval(read('features/explore/nearby-tools.js'));w.eval(read('parking.js'));
 const node=k=>w.document.querySelector('[data-nearby="'+k+'"]');
 return {w,dom,node,close:()=>{w.GiloaNearbyTools.close();w.map.remove();w.close();}};
}
test('current-location entry saves a photographed item at that point, restores it, and keeps old parking',async()=>{
 const factory=new IDBFactory(),a=start(factory);
 try{
  assert.equal(a.w.document.querySelectorAll('#sidebar [data-nearby-open="items"]').length,0);
  assert.equal(a.w.document.querySelectorAll('#sidebar [data-nearby-open="walk"]').length,1);
  const tab=a.w.document.querySelector('#location-memo-tabs [data-location-tab="parking"]');assert.equal(tab.textContent,'물건 위치 저장');
  a.w.document.getElementById('special-place-note').value='선반 위';tab.click();await tick();
  assert.equal(a.node('title').textContent,'물건 위치 저장');a.node('new').click();
  assert.match(a.node('selected').textContent,/37.52000/);assert.equal(a.node('note').value,'선반 위');
  a.node('name').value='가방';
  Object.defineProperty(a.node('cameraPhoto'),'files',{value:[{type:'image/jpeg',size:100}],configurable:true});
  a.node('cameraPhoto').dispatchEvent(new a.w.Event('change'));await tick();assert.equal(a.node('preview').hidden,false);
  a.node('save').click();await tick();await tick();
  assert(a.node('list').textContent.includes('가방'));assert(a.node('list').querySelector('img.stored-item-photo'));
  a.w.GiloaNearbyTools.close();a.w.GiloaNearbyTools.open('items');await tick();
  assert(a.node('list').querySelector('img.stored-item-photo'));
  a.node('parking').click();assert.equal(a.w.document.getElementById('personal-parking-panel').hidden,false);
  assert.match(a.w.document.querySelector('[data-parking="summary"]').textContent,/B3/);
  assert.equal(a.w.localStorage.getItem('journey-sentinel'),'existing route/photo/memory');
  for(const [lang,label] of [['en','Save item location'],['ja','物の場所を保存'],['zh','保存物品位置'],['es','Guardar ubicación de objetos']]){
   a.w.currentLang=lang;a.w.document.documentElement.lang=lang;await tick();assert.equal(tab.textContent,label);
  }
 }finally{a.close();}
 const b=start(factory);
 try{b.w.GiloaNearbyTools.open('items');await tick();assert(b.node('list').textContent.includes('가방'));assert(b.node('list').querySelector('img.stored-item-photo'));}
 finally{b.close();}
});

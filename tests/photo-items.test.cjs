const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM,VirtualConsole} = require(path.join(process.env.GPX_TEST_DEPS || '../test-deps/node_modules', 'jsdom'));
const source = fs.readFileSync(path.join(__dirname,'..','photo-items.js'),'utf8');
const tick = () => new Promise(r=>setTimeout(r,5));
function start(shared = new Map()) {
 const virtualConsole=new VirtualConsole();virtualConsole.on('jsdomError',error=>{throw error;});
 const dom = new JSDOM('<html lang="ko"><body><div id="panel-item"><div id="item-list">Existing items</div></div></body></html>',{url:'https://giloa.test',runScripts:'outside-only',virtualConsole});
 const w = dom.window, draws = [], revoked = [], images = [], writes = [], state = {fail:false};
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;}; w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
 w.HTMLCanvasElement.prototype.getContext=function(){const target=this;return {clearRect(){},drawImage(...args){draws.push({target,args});}};};
 w.HTMLCanvasElement.prototype.toBlob=function(callback,type){callback(new w.Blob(['CROPPED PIXELS ONLY'],{type}));};
 w.HTMLCanvasElement.prototype.setPointerCapture=function(){};
 w.URL.createObjectURL=obj=>'blob:fixture-'+Math.random();w.URL.revokeObjectURL=url=>revoked.push(url);
 w.Image=class {constructor(){this.naturalWidth=1200;this.naturalHeight=800;images.push(this);}set src(value){this.value=value;}get src(){return this.value;}};
 w.indexedDB = {open(){const req={};setTimeout(()=>{req.result={createObjectStore(){},transaction(name,mode){assert.equal(name,'items');const tx={};tx.objectStore=()=>({getAll(){const r={result:Array.from(shared.values()).map(r=>({...r,icon:r.icon instanceof w.Blob?r.icon:new w.Blob(['CROPPED PIXELS ONLY'],{type:r.icon.type})}))};setTimeout(()=>tx.oncomplete(),0);return r;},put(record){const r={result:record.id};setTimeout(()=>{if(state.fail){tx.error=new Error('Quota');tx.onabort();}else{shared.set(record.id,record);writes.push(record);tx.oncomplete();}},0);return r;},delete(id){const r={result:undefined};setTimeout(()=>{shared.delete(id);tx.oncomplete();},0);return r;}});return tx;},close(){}};req.onsuccess();},0);return req;}};
 w.localStorage.setItem('giloa-collection','existing badges/items');w.localStorage.setItem('journey','GPS GPX EXIF photos');w.confirm=()=>true;
 w.eval(fs.readFileSync(path.join(__dirname,'..','item-icons.js'),'utf8'));
 w.eval(source);
 const el=s=>w.document.querySelector(s), open=()=>{el('.photo-items-add').click();el('[data-style]').value='photo';el('[data-style]').dispatchEvent(new w.Event('change'));};
 function select({size=123,type='image/jpeg',loaded=true}={}){const input=el('[data-gallery-input]');Object.defineProperty(input,'files',{configurable:true,value:[{size,type}]});input.dispatchEvent(new w.Event('change'));if(loaded&&images.at(-1).onload)images.at(-1).onload();}
 function name(value='A flower'){el('[data-name]').value=value;el('[data-name]').dispatchEvent(new w.Event('input'));}
 const save=()=>el('form').dispatchEvent(new w.Event('submit',{cancelable:true}));
 return {dom,w,el,open,select,name,save,draws,revoked,images,shared,writes,state};
}
test('crop geometry clamps panning and zoom; save stores only a 256px crop, then reloads without touching journey',async()=>{
 const a=start();await tick();a.open();a.select();a.name('<flower>');
 let draw=a.draws.at(-1);assert.deepEqual(draw.args.slice(1),[200,0,800,800,0,0,320,320]);
 a.el('[data-zoom]').value='2';a.el('[data-zoom]').dispatchEvent(new a.w.Event('input'));
 for(let n=0;n<100;n++)a.el('canvas').dispatchEvent(new a.w.KeyboardEvent('keydown',{key:'ArrowRight',cancelable:true}));
 draw=a.draws.at(-1);assert.deepEqual(draw.args.slice(1,5),[800,200,400,400]);
 a.save();await tick();await tick();
 assert.equal(a.el('dialog').open,false);assert.equal(a.shared.size,1);
 const record=Array.from(a.shared.values())[0];assert.deepEqual(Object.keys(record).sort(),['createdAt','icon','id','name']);assert.equal(record.icon.type,'image/jpeg');
 assert.equal(a.draws.at(-1).args.at(-1),256);assert.equal(a.el('.photo-item-card b').textContent,'<flower>');assert.equal(a.el('.photo-item-card b').children.length,0);
 assert.equal(a.el('#item-list').textContent,'Existing items');assert.equal(a.w.localStorage.getItem('giloa-collection'),'existing badges/items');assert.equal(a.w.localStorage.getItem('journey'),'GPS GPX EXIF photos');assert(a.revoked.length>0);
 const b=start(a.shared);await tick();await tick();assert.equal(b.el('.photo-item-card b').textContent,'<flower>');a.w.close();b.w.close();
});
test('cancel and late image decode do not save; new selection clears the previous crop',async()=>{
 const a=start();await tick();a.open();a.select({loaded:false});const callback=a.images.at(-1).onload;a.name();assert(a.el('[data-save]').disabled);
 a.el('[data-cancel]').click();callback();assert.equal(a.shared.size,0);assert.equal(a.el('dialog').open,false);a.open();assert(a.el('[data-save]').disabled);a.select();a.name();assert(!a.el('[data-save]').disabled);
 a.select({loaded:false});assert(a.el('[data-save]').disabled);assert(a.revoked.length>=2);a.w.close();
});
test('transaction failure keeps the crop and name editable; retry and double submit do not duplicate',async()=>{
 const a=start();await tick();a.open();a.select();a.name();a.state.fail=true;a.save();await tick();await tick();assert.equal(a.shared.size,0);assert(a.el('dialog').open);assert.match(a.el('[data-status]').textContent,/저장/);assert.equal(a.el('[data-name]').value,'A flower');assert(!a.el('[data-save]').disabled);
 a.state.fail=false;a.save();a.save();await tick();await tick();assert.equal(a.shared.size,1);a.w.close();
});
test('oversize, invalid and failed images cannot create items, and empty names are rejected',async()=>{
 const a=start();await tick();a.open();a.select({size:31*1024*1024,loaded:false});assert.match(a.el('[data-status]').textContent,/30MB/);a.select({type:'text/plain',loaded:false});assert.match(a.el('[data-status]').textContent,/JPG/);
 a.select({loaded:false});a.images.at(-1).onerror();assert(a.el('[data-save]').disabled);a.select();a.name('  ');a.save();assert.equal(a.shared.size,0);a.w.close();
});
test('four languages, close, delete and camera input remain separate from the existing photo workflow',async()=>{
 const a=start();await tick();a.open();assert.equal(a.el('[data-camera-input]').getAttribute('capture'),'environment');
 for(const [lang,label] of [['en','Save item'],['ja','アイテムを保存'],['zh','保存物品'],['ko','아이템 저장']]){a.w.document.documentElement.lang=lang;await tick();assert.equal(a.el('[data-save]').textContent,label);}
 a.select();a.name();a.save();await tick();await tick();a.el('.photo-item-delete').click();await tick();await tick();assert.equal(a.shared.size,0);assert.equal(a.w.localStorage.getItem('journey'),'GPS GPX EXIF photos');a.w.close();
});

test('phone name suggests a clean icon; saved item contains SVG only, no photograph',async()=>{
 const a=start();await tick();a.open();a.el('[data-style]').value='symbol';a.el('[data-style]').dispatchEvent(new a.w.Event('change'));
 a.select();a.name('폰');assert.equal(a.el('[data-symbol]').value,'phone');assert(a.el('[data-symbol-preview] img').src.startsWith('data:image/svg+xml'));
 a.save();await tick();await tick();const record=Array.from(a.shared.values())[0];assert.equal(record.icon.type,'image/svg+xml');assert.equal(record.iconStyle,'symbol');assert.equal(record.symbolId,'phone');assert.equal(record.photo,undefined);assert.equal(record.original,undefined);a.w.close();
});
test('existing photo can be changed without a new photo; failed save and cancel preserve the original',async()=>{
 const a=start();await tick();a.open();a.select();a.name('폰');a.save();await tick();await tick();const old=Array.from(a.shared.values())[0],oldBlob=old.icon;
 a.el('.photo-item-edit').click();assert.equal(a.el('[data-style]').value,'symbol');assert.equal(a.el('[data-symbol]').value,'phone');assert(!a.el('[data-save]').disabled);
 a.state.fail=true;a.save();await tick();await tick();assert.equal(a.shared.get(old.id).icon,oldBlob);a.el('[data-cancel]').click();assert.equal(a.shared.get(old.id).icon,oldBlob);
 a.state.fail=false;a.el('.photo-item-edit').click();a.save();await tick();await tick();const updated=a.shared.get(old.id);assert.equal(a.shared.size,1);assert.equal(updated.id,old.id);assert.equal(updated.createdAt,old.createdAt);assert.equal(updated.name,'폰');assert.equal(updated.symbolId,'phone');assert.equal(updated.icon.type,'image/svg+xml');assert.equal(a.w.localStorage.getItem('journey'),'GPS GPX EXIF photos');a.w.close();
});
test('manual choice survives name changes and unrecognized objects have a visible generic icon',async()=>{
 const a=start();await tick();a.open();a.el('[data-style]').value='symbol';a.el('[data-style]').dispatchEvent(new a.w.Event('change'));a.select();a.name('unknown object');assert.equal(a.el('[data-symbol]').value,'star');
 a.el('[data-symbol]').value='flower';a.el('[data-symbol]').dispatchEvent(new a.w.Event('change'));a.name('폰');assert.equal(a.el('[data-symbol]').value,'flower');
 for(const lang of ['ko','en','ja','zh']){a.w.document.documentElement.lang=lang;await tick();assert.equal(a.el('[data-symbol]').value,'flower');assert(a.el('[data-style] option').textContent);}
 const safe=a.w.GiloaItemIcons.svg('<script>');assert(!safe.includes('<script'));assert(!/href=|<image|<foreignObject|onload=/.test(safe));assert.equal(a.w.GiloaItemIcons.suggest('phone'),'phone');assert.equal(a.w.GiloaItemIcons.suggest('携帯電話'),'phone');assert.equal(a.w.GiloaItemIcons.suggest('手机'),'phone');a.w.close();
});

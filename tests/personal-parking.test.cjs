// GPX_TEST_DEPS=/path/to/node_modules node --test tests/personal-parking.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM} = require(process.env.GPX_TEST_DEPS ? path.join(process.env.GPX_TEST_DEPS, 'jsdom') : 'jsdom');
const source = fs.readFileSync(path.join(__dirname, '..', 'parking.js'), 'utf8');
const key = 'giloa-personal-parking-v1';
function start(saved) {
    const dom = new JSDOM('<html lang="ko"><body><div id="controls"></div><div id="map"></div><div id="special-place-editor"><div id="special-place-title"></div><textarea id="special-place-note"></textarea></div></body></html>', {url:'https://giloa.test', runScripts:'outside-only'});
    const w = dom.window, handlers = {}, markers = [];
    const map = {createPane:()=>({style:{}}), getContainer:()=>w.document.getElementById('map'), on:(name, fn)=>{handlers[name]=fn;},
        removeLayer:marker=>{marker.removed=true;}, panTo:point=>{map.center=point;}, setView:point=>{map.center=point;}, getZoom:()=>16, wrapLatLng:point=>point};
    w.giloaMapBootstrap = map;
    w.L = {DomEvent:{disableClickPropagation:()=>{}, disableScrollPropagation:()=>{}}, divIcon:value=>value,
        marker:(point, options)=>{const value={point,options,on:(name,fn)=>{value[name]=fn;},addTo:()=>value}; markers.push(value); return value;}};
    w.confirm = ()=>true;
    if (saved) w.localStorage.setItem(key, JSON.stringify(saved));
    w.localStorage.setItem('journey-fixture', 'original GPS/photos/memories');
    w.specialPlaceEditorCoords = {latitude:37.52, longitude:127.2};
    w.closeSpecialPlaceEditor = ()=>{w.document.getElementById('special-place-editor').hidden=true; w.specialPlaceEditorCoords=null;};
    w.openSpecialPlaceEditor = (lat,lng)=>{w.specialPlaceEditorCoords={latitude:lat,longitude:lng};w.document.getElementById('special-place-editor').hidden=false;w.document.getElementById('special-place-note').value='';};
    w.eval(source);
    const el = id=>w.document.querySelector('[data-parking="'+id+'"]');
    const open = ()=>w.document.getElementById('personal-parking-button').click();
    const clickMap = ()=>handlers.click({latlng:{lat:37.51,lng:127.1}});
    return {w,dom,map,el,open,clickMap,markers};
}
test('manual location, floor, escaped notes, reload, and departure preserve journey data', () => {
    const a=start(); a.open(); assert.equal(a.el('save').disabled,true);
    a.el('pick').click(); a.clickMap();
    a.el('floor').value='B3'; a.el('zone').value='C-17'; a.el('note').value='<img src=x onerror=alert(1)>';
    a.el('save').click();
    const saved=JSON.parse(a.w.localStorage.getItem(key));
    assert.equal(saved.lat,37.51); assert.equal(saved.floor,'B3');
    assert.match(a.el('summary').textContent,/C-17/); assert.equal(a.el('summary').querySelector('img'),null);
    assert.equal(a.markers.at(-1).options.icon.html.textContent,'🚗 B3');
    const b=start(saved); b.open(); assert.match(b.el('summary').textContent,/B3/);
    b.el('find').click(); assert.deepEqual(Array.from(b.map.center),[37.51,127.1]);
    b.open(); b.el('clear').click(); assert.equal(b.w.localStorage.getItem(key),null);
    assert.equal(b.w.localStorage.getItem('journey-fixture'),'original GPS/photos/memories');
    a.dom.window.close(); b.dom.window.close();
});
test('GPS denial offers manual selection and stale GPS cannot replace it', () => {
    const a=start(); let succeed, fail;
    a.w.navigator.geolocation={getCurrentPosition:(ok,bad)=>{succeed=ok;fail=bad;}};
    a.open(); a.el('gps').click(); fail({code:1}); assert.match(a.el('status').textContent,/지도/);
    a.el('gps').click(); a.el('pick').click(); a.clickMap();
    succeed({coords:{latitude:1,longitude:2,accuracy:5}});
    a.el('save').click(); assert.equal(JSON.parse(a.w.localStorage.getItem(key)).lat,37.51);
    a.dom.window.close();
});
test('storage failure keeps saved location and draft editable', () => {
    const saved={lat:37,lng:127,floor:'B1'}; const a=start(saved); a.open(); a.el('edit').click(); a.el('floor').value='B2';
    a.w.Storage.prototype.setItem=function(){throw new Error('QuotaExceededError');};
    a.el('save').click(); assert.match(a.el('status').textContent,/저장 공간/);
    assert.equal(JSON.parse(a.w.localStorage.getItem(key)).floor,'B1'); assert.equal(a.el('floor').value,'B2');
    a.dom.window.close();
});
test('map click closes details, selection cancels cleanly, and all languages render', async () => {
    const a=start({lat:37,lng:127,floor:'B3'}); a.open(); a.clickMap(); assert.equal(a.w.document.getElementById('personal-parking-panel').hidden,true);
    a.open(); a.el('edit').click(); a.el('pick').click(); a.el('close').click(); a.open();
    assert.equal(a.w.document.getElementById('personal-parking-panel').classList.contains('is-picking'),false);
    for (const language of ['en','ja','zh','es','fr','ko']) {
        a.w.document.documentElement.lang=language;
        await new Promise(resolve=>setTimeout(resolve,0));
        assert.ok(a.w.document.getElementById('personal-parking-title').textContent);
        assert.notEqual(a.el('save').textContent,'undefined');
    }
    a.dom.window.close();
});
test('invalid stored coordinates do not become map markers', () => {
    const a=start({lat:999,lng:127}); assert.equal(a.markers.length,0); a.open(); assert.equal(a.el('save').disabled,true); a.dom.window.close();
});

test('integrates with the actual bundled Leaflet map and restores a clickable floor marker', () => {
    const dom = new JSDOM('<html lang="ko"><body><div id="controls"></div><div id="map" style="height:600px;width:400px"></div></body></html>', {url:'https://giloa.test',runScripts:'outside-only',pretendToBeVisual:true});
    const w=dom.window;
    w.eval(fs.readFileSync(path.join(__dirname,'..','vendor','leaflet.js'),'utf8'));
    w.giloaMapBootstrap=w.L.map('map').setView([37.51,127.1],17);
    w.localStorage.setItem(key,JSON.stringify({lat:37.51,lng:127.1,floor:'B3',zone:'C-17'}));
    w.eval(source);
    assert.equal(w.document.querySelector('.personal-parking-pin').textContent,'🚗 B3');
    w.document.querySelector('.personal-parking-pin').click();
    assert.equal(w.document.getElementById('personal-parking-panel').hidden,false);
    assert.match(w.document.querySelector('[data-parking="summary"]').textContent,/C-17/);
    w.giloaMapBootstrap.fire('click',{latlng:w.L.latLng(37.51,127.1)});
    assert.equal(w.document.getElementById('personal-parking-panel').hidden,true);
    w.giloaMapBootstrap.remove(); w.close();
});
const tick = ()=>new Promise(resolve=>setTimeout(resolve,0));
function selectPhoto(a) {
    Object.defineProperty(a.el('photo'),'files',{configurable:true,value:[new a.w.File(['private photo'],'sign.jpg',{type:'image/jpeg'})]});
    a.el('photo').dispatchEvent(new a.w.Event('change'));
}
test('OCR stores reviewed text only, preserves user edits and journey data', async () => {
    const a=start(); a.open(); a.el('pick').click(); a.clickMap();
    let resolve; a.w.GiloaParkingOcr={recognize:()=>({promise:new Promise(r=>resolve=r),cancel:()=>{}})};
    selectPhoto(a); assert.equal(a.el('save').disabled,true);
    a.el('zone').value='D-9'; resolve({floor:'B3',zone:'C-17'}); await tick();
    assert.equal(a.el('floor').value,'B3'); assert.equal(a.el('zone').value,'D-9');
    assert.equal(a.el('photo').value,''); assert.equal(a.el('preview').hasAttribute('src'),false);
    a.el('save').click(); const saved=JSON.parse(a.w.localStorage.getItem(key));
    assert.equal(saved.floor,'B3'); assert.equal(saved.photo,'');
    assert.doesNotMatch(JSON.stringify(saved),/private photo|data:image|blob:/);
    assert.equal(a.w.localStorage.getItem('journey-fixture'),'original GPS/photos/memories'); a.w.close();
});
test('late OCR result is cancelled on close and cannot update a reopened editor', async () => {
    const a=start();a.open();let resolve,cancelled=false;
    a.w.GiloaParkingOcr={recognize:()=>({promise:new Promise(r=>resolve=r),cancel:()=>cancelled=true})};
    selectPhoto(a);a.el('close').click();a.open();resolve({floor:'B9',zone:'Z-99'});await tick();
    assert.equal(cancelled,true);assert.equal(a.el('floor').value,'');a.w.close();
});
test('existing legacy parking photograph survives editing without new image persistence', async () => {
    const photo='data:image/jpeg;base64,dGVzdA==';const a=start({lat:37,lng:127,photo:photo});
    a.open();assert.equal(a.el('preview').hidden,false);a.el('edit').click();a.el('floor').value='B2';a.el('save').click();
    assert.equal(JSON.parse(a.w.localStorage.getItem(key)).photo,photo);a.w.close();
});
test('memo parking tab retains memo draft, starts camera without audio and stops tracks on return', async () => {
    const a=start();let stopped=0,options;
    a.w.HTMLMediaElement.prototype.play=()=>Promise.resolve();
    a.w.navigator.mediaDevices={getUserMedia:value=>{options=value;return Promise.resolve({getTracks:()=>[{stop:()=>stopped++}]});}};
    a.w.document.getElementById('special-place-note').value='original unsaved memo';
    a.w.document.querySelector('#location-memo-tabs [data-location-tab=parking]').click();await tick();
    assert.equal(options.audio,false);assert.equal(a.el('cameraView').hidden,false);
    assert.match(a.el('location').textContent,/37.52000/);a.el('memo').click();
    assert.equal(stopped,1);assert.equal(a.el('video').srcObject,null);
    assert.equal(a.w.document.getElementById('special-place-note').value,'original unsaved memo');
    assert.equal(a.w.localStorage.getItem(key),null);a.w.close();
});
test('pending camera is stopped when permission arrives after closing', async () => {
    const a=start();a.open();let resolve,stopped=0;
    a.w.navigator.mediaDevices={getUserMedia:()=>new Promise(r=>resolve=r)};
    a.el('camera').click();a.el('close').click();resolve({getTracks:()=>[{stop:()=>stopped++}]});await tick();
    assert.equal(stopped,1);assert.equal(a.el('video').srcObject,null);a.w.close();
});
test('denied camera and failed OCR keep manual entry available', async () => {
    const a=start();a.open();a.w.navigator.mediaDevices={getUserMedia:()=>Promise.reject(new Error('denied'))};
    a.el('camera').click();await tick();assert.match(a.el('status').textContent,/카메라/);
    a.w.GiloaParkingOcr={recognize:()=>({promise:Promise.reject(new Error('offline')),cancel:()=>{}})};
    selectPhoto(a);await tick();assert.match(a.el('status').textContent,/직접/);
    a.el('pick').click();a.clickMap();assert.equal(a.el('save').disabled,false);a.w.close();
});
test('camera captures to a temporary blob and never serializes image pixels', async () => {
    const a=start();a.open();let stopped=0,received;
    a.w.HTMLMediaElement.prototype.play=()=>Promise.resolve();
    a.w.navigator.mediaDevices={getUserMedia:()=>Promise.resolve({getTracks:()=>[{stop:()=>stopped++}]})};
    a.w.HTMLCanvasElement.prototype.getContext=()=>({drawImage:()=>{}});
    a.w.HTMLCanvasElement.prototype.toBlob=function(callback){callback(new a.w.Blob(['pixels'],{type:'image/jpeg'}));};
    a.w.HTMLCanvasElement.prototype.toDataURL=()=>{throw Error('Must never persist pixels');};
    a.w.GiloaParkingOcr={recognize:blob=>{received=blob;return {promise:Promise.resolve({floor:'B3',zone:'C-17'}),cancel:()=>{}};}};
    a.el('camera').click();await tick();Object.defineProperty(a.el('video'),'videoWidth',{value:1920});Object.defineProperty(a.el('video'),'videoHeight',{value:1080});
    a.el('shoot').click();await tick();assert.equal(received.type,'image/jpeg');assert.equal(stopped,1);
    assert.equal(a.el('floor').value,'B3');assert.equal(a.el('video').srcObject,null);assert.equal(a.w.localStorage.getItem(key),null);a.w.close();
});

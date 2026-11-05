// GPX_TEST_DEPS=/path/to/node_modules node --test tests/personal-parking.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM} = require(process.env.GPX_TEST_DEPS ? path.join(process.env.GPX_TEST_DEPS, 'jsdom') : 'jsdom');
const source = fs.readFileSync(path.join(__dirname, '..', 'parking.js'), 'utf8');
const key = 'giloa-personal-parking-v1';
function start(saved) {
    const dom = new JSDOM('<html lang="ko"><body><div id="controls"></div><div id="map"></div></body></html>', {url:'https://giloa.test', runScripts:'outside-only'});
    const w = dom.window, handlers = {}, markers = [];
    const map = {createPane:()=>({style:{}}), getContainer:()=>w.document.getElementById('map'), on:(name, fn)=>{handlers[name]=fn;},
        removeLayer:marker=>{marker.removed=true;}, panTo:point=>{map.center=point;}, setView:point=>{map.center=point;}, getZoom:()=>16, wrapLatLng:point=>point};
    w.giloaMapBootstrap = map;
    w.L = {DomEvent:{disableClickPropagation:()=>{}, disableScrollPropagation:()=>{}}, divIcon:value=>value,
        marker:(point, options)=>{const value={point,options,on:(name,fn)=>{value[name]=fn;},addTo:()=>value}; markers.push(value); return value;}};
    w.confirm = ()=>true;
    if (saved) w.localStorage.setItem(key, JSON.stringify(saved));
    w.localStorage.setItem('journey-fixture', 'original GPS/photos/memories');
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
test('photo loading blocks saving until compression finishes and the photo restores', () => {
    const a=start(); a.open(); a.el('pick').click(); a.clickMap();
    let image;
    a.w.Image=function(){image=this;this.width=2000;this.height=1000;};
    a.w.URL.createObjectURL=()=> 'blob:test'; a.w.URL.revokeObjectURL=()=>{};
    a.w.HTMLCanvasElement.prototype.getContext=()=>({drawImage:()=>{}});
    a.w.HTMLCanvasElement.prototype.toDataURL=()=> 'data:image/jpeg;base64,dGVzdA==';
    Object.defineProperty(a.el('photo'),'files',{value:[new a.w.File(['photo'],'sign.jpg',{type:'image/jpeg'})]});
    a.el('photo').dispatchEvent(new a.w.Event('change'));
    assert.equal(a.el('save').disabled,true);
    a.el('save').click(); assert.equal(a.w.localStorage.getItem(key),null);
    image.onload(); assert.equal(a.el('save').disabled,false);
    a.el('save').click(); const saved=JSON.parse(a.w.localStorage.getItem(key));
    assert.equal(saved.photo,'data:image/jpeg;base64,dGVzdA==');
    const b=start(saved); b.open(); assert.equal(b.el('preview').hidden,false);
    assert.match(b.el('preview').src,/^data:image\/jpeg/);
    a.dom.window.close(); b.dom.window.close();
});

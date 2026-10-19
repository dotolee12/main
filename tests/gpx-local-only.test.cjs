// GPX_TEST_DEPS=/absolute/node_modules node tests/gpx-local-only.test.cjs
// Uses jsdom for local GPX export/import and old-cache compatibility checks.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require(path.join(process.env.GPX_TEST_DEPS, 'jsdom'));
const root = path.join(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const html = read('index.html');
assert.ok(!/<script[^>]+(?:supabase-sync|gpx-sharing)/.test(html));
assert.ok(!html.includes('id="gpx-sharing"'));
assert.ok(!html.includes('id="cloud-account-title"'));
assert.ok(!read('config.js').includes('GILOA_SUPABASE'));
assert.ok(!read('script.js').includes('window.GiloaCloud'));
const dom = new JSDOM('<body><input id="gpx-export-name" value="Local walk"><div id="gpx-import-status"></div><div id="gpx-saved-list"></div><section class="cloud-account-card"></section><section id="gpx-sharing"></section></body>', {url:'https://example.test',runScripts:'outside-only'});
const w = dom.window;
let network = 0, download = null, imported = null, exportedBlob = null;
Object.assign(w, {
    fetch:()=>{network++;throw Error('No cloud requests allowed');},
    currentLang:'ko', UI_TEXT:{ko:{gpx_empty:'Empty',gpx_showing:'Showing',gpx_route:'Route',gpx_points:'points',gpx_delete:'Delete'}},
    GPX_SAVES_KEY:'giloa-gpx-saves', activeGpxId:null, activeGpxLayers:[], dialHours:1,
    rawGpsPoints:[{lat:1,lng:2,startTime:Date.now()-2000},{lat:1.1,lng:2.1,startTime:Date.now()-1000}],
    shouldConnectStoredPathPoints:()=>true, consumeNativeRouteTrackingPoints:()=>{},
    earlyUiText:key=>key, toggleSidebar:()=>{}, GPX_IMPORT_MAX_BYTES:10*1024*1024
});
w.URL.createObjectURL = blob => {exportedBlob=blob;return 'blob:test';};
w.URL.revokeObjectURL = ()=>{};
w.HTMLAnchorElement.prototype.click = function(){download=this.download;};
const source = read('script.js');
w.eval(source.slice(source.indexOf('function adjustHourDial('),source.indexOf('function getGpxImportText(')));
w.exportGpx();
assert.equal(download,'giloa_Local walk.gpx');
assert.ok(exportedBlob);
const saved = JSON.parse(w.localStorage.getItem('giloa-gpx-saves'));
assert.equal(saved.length,1);assert.equal(saved[0].pointCount,2);
assert.match(saved[0].gpxContent,/<gpx version="1.1"/);
assert.equal((saved[0].gpxContent.match(/<trkpt /g)||[]).length,2);
// Import the exported file back without adding it to live GPS recording data.
w.clearActiveGpxRoute=()=>{};
w.drawGpxRoute=(content,id)=>{imported={content,id};};
w.eval(source.slice(source.indexOf('function getGpxImportText('),source.indexOf('function toggleSidebar(')));
w.importGpxFile({target:{files:[new w.File([saved[0].gpxContent],'received.gpx',{type:'application/gpx+xml'})],value:'x'}});
(async()=>{
    for(let n=0;n<10&&!imported;n++)await new Promise(resolve=>setTimeout(resolve,10));
    assert.ok(imported);assert.equal(imported.content,saved[0].gpxContent);
    assert.equal(JSON.parse(w.localStorage.getItem('giloa-gpx-saves')).length,2);
    assert.equal(w.rawGpsPoints.length,2);
    // Even a cached page with an old session cannot call the old cloud client.
    w.localStorage.setItem('giloa-supabase-session-v1',JSON.stringify({access_token:'test-only',user:{id:'test-only'}}));
    w.eval(read('supabase-sync.js'));w.eval(read('gpx-sharing.js'));
    for(const name of ['init','syncNow','scheduleSync','signInFromForm','signUpFromForm','requestPasswordReset','updatePassword','signOut'])w.GiloaCloud[name]();
    assert.equal(w.GiloaCloud.isConfigured(),false);
    assert.equal(network,0);
    assert.equal(JSON.parse(w.localStorage.getItem('giloa-gpx-saves')).length,2);
    assert.equal(w.document.querySelector('.cloud-account-card').hidden,true);
    assert.equal(w.document.querySelector('#gpx-sharing').hidden,true);
    console.log('PASS local GPX export/download/import, device records preserved, no cloud loading/configuration, cached clients make zero requests');
    dom.window.close();
})().catch(error=>{console.error(error);process.exitCode=1;});

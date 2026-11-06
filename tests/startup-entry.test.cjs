const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require(path.join(process.env.GPX_TEST_DEPS,'jsdom'));
const root=path.join(__dirname,'..'),core=fs.readFileSync(path.join(root,'script.js'),'utf8');
function fixture(options={}){
 const dom=new JSDOM(fs.readFileSync(path.join(root,'index.html'),'utf8'),{url:'https://giloa.test/',runScripts:'outside-only'}),w=dom.window,events=[];
 const audio=w.document.getElementById('adventure-music-audio');let playing=false,plays=0;
 Object.defineProperty(audio,'paused',{get:()=>!playing});Object.defineProperty(audio,'ended',{get:()=>false});
 audio.play=()=>{plays++;playing=true;events.push('music');return Promise.resolve();};audio.pause=()=>{playing=false;};
 w.document.getElementById('gilo-welcome-audio').pause=()=>{};
 if(options.muted)w.localStorage.setItem('giloa-startup-music-enabled-v1','false');
 if(options.consented)w.localStorage.setItem('giloa-location-disclosure-v1','2026-10-21');
 w.localStorage.setItem('journeys','existing GPS/photos/EXIF');w.currentLang=options.lang||'ko';
 w.GiloaBoot={hide:()=>events.push('gate')};w.runInitStep=(name,fn)=>{events.push(name);return fn();};w.focusStartupLocation=opts=>{assert.equal(opts.beforeIntro,true);events.push('location');return Promise.resolve();};
 w.startFirstLaunchExperience=()=>{events.push('intro');return true;};w.showGiloaUpdateNoticeIfNeeded=()=>{};
 w.giloaPersistentStateReady=true;w.recordingLocationPermissionBlocked=false;w.isNativeApp=()=>false;w.pendingRecordingStartAfterRestore=false;w.isRecording=!!options.recording;
 w.recBtn=w.document.getElementById('rec-btn');w.recStatusBox=w.document.getElementById('rec-status-box');w.UI_TEXT={ko:{rec_active:'기록 중',rec_idle:'중단됨'}};w.currentLang='ko';
 if(options.webPermission)Object.defineProperty(w.navigator,'permissions',{value:{query:async()=>({state:options.webPermission})}});
 if(options.brokenPermissionQuery)Object.defineProperty(w.navigator,'permissions',{value:{query(){throw new TypeError('Geolocation query unsupported');}}});
 w.requestLocationPermission=()=>options.permissionDenied?Promise.reject(new Error('denied')):Promise.resolve();
 w.focusCurrentLocation=()=>{events.push('location');return Promise.resolve(true);};
 w.ensureRecordingSession=()=>events.push('session');w.startAutoRecordingTimer=()=>events.push('eight-hour-timer');w.startTracking=()=>events.push('tracking');
 for(const name of ['enableDeviceHeading','requestScreenAwake','scheduleSave','updateHud','syncImageMissionUI','dismissAutoRecordingNotice'])w[name]=()=>{};
 w.earlyUiText=x=>x;w.showLocationToast=()=>events.push('permission-error');
 const syncStart=core.indexOf('function syncRecordingUI()');w.eval(core.slice(syncStart,core.indexOf('\nfunction getImageMissionLatLng',syncStart)));
 w.eval(core.slice(core.indexOf('function toggleRecording()'),core.indexOf('function dismissAutoRecordingNotice()')));
 w.eval(core.slice(core.indexOf('function showRecordingPermissionRequired()'),core.indexOf('function applyAutoRecordingNoticeLang()')));
 w.syncRecordingUI();w.currentLang=options.lang||'ko';

 w.eval(fs.readFileSync(path.join(root,'privacy-policy.js'),'utf8'));w.eval(fs.readFileSync(path.join(root,'startup-music.js'),'utf8'));
 w.eval(core.slice(core.indexOf('var giloaStartupChoicePromise = null;'),core.indexOf('function startFirstLaunchExperience()')));
 const button=yes=>w.document.querySelector('.giloa-location-consent-card').querySelectorAll('button')[yes?1:2];
 return {w,dom,events,button,plays:()=>plays,playing:()=>playing};
}
test('consent is first even with prior consent; music starts synchronously on start, then location and onboarding',async()=>{
 const a=fixture({consented:true});const pending=a.w.requestGiloaStartupEntryChoice();a.w.beginGiloaStartupEntry();
 assert(a.w.document.querySelector('.giloa-location-consent'));assert.equal(a.plays(),0);assert(!a.events.includes('intro'));assert(!a.events.includes('location'));
 a.button(true).click();assert.equal(a.plays(),1);assert.equal(a.events.includes('location'),false);assert.equal(await pending,true);await new Promise(r=>setImmediate(r));
 assert(a.events.indexOf('music')<a.events.indexOf('location'));assert(a.events.includes('intro'));assert.equal(a.w.isRecording,true);assert(a.w.recBtn.classList.contains('recording'));assert.equal(a.w.recBtn.getAttribute('aria-pressed'),'true');assert(a.events.includes('eight-hour-timer'));assert(a.events.includes('tracking'));assert.equal(a.w.localStorage.getItem('journeys'),'existing GPS/photos/EXIF');
 assert.equal(await a.w.GiloaPrivacy.requestLocationConsent(),true);assert.equal(a.w.document.querySelectorAll('.giloa-location-consent').length,0);a.dom.window.close();
});
test('starting without location never requests GPS but still starts default music and enters the app',async()=>{
 const a=fixture({consented:true});const ready=a.w.beginGiloaStartupEntry();a.button(false).click();assert.equal(await ready,false);assert.equal(a.plays(),1);assert(!a.events.includes('location'));assert(a.events.includes('intro'));assert.equal(await a.w.GiloaPrivacy.requestLocationConsent(),false);a.dom.window.close();
});
test('start gesture enables music despite previous mute; it can still be stopped immediately',async()=>{
 const a=fixture({muted:true});const ready=a.w.beginGiloaStartupEntry();a.button(false).click();await ready;assert.equal(a.plays(),1);assert.equal(a.playing(),true);
 a.w.document.getElementById('adventure-music-toggle').click();assert.equal(a.playing(),false);assert.equal(a.w.localStorage.getItem('giloa-startup-music-enabled-v1'),'false');a.dom.window.close();
});
test('startup consent is coalesced and cannot accidentally dismiss on the background or Escape',async()=>{
 const a=fixture();const ready=a.w.requestGiloaStartupEntryChoice();assert.equal(a.w.requestGiloaStartupEntryChoice(),ready);assert.equal(a.w.GiloaPrivacy.requestLocationConsent(),ready);
 a.w.document.querySelector('.giloa-location-consent').click();a.w.document.dispatchEvent(new a.w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert(a.w.document.querySelector('.giloa-location-consent'));assert.equal(a.plays(),0);a.button(false).click();await ready;a.dom.window.close();
});
test('startup location notice and start controls support the existing six languages',async()=>{
 for(const lang of ['ko','en','ja','zh','es','fr']){const a=fixture({lang});const ready=a.w.requestGiloaStartupEntryChoice();assert(a.w.document.querySelector('#giloa-location-consent-title').textContent);assert(a.button(true).textContent);assert(a.button(false).textContent);a.button(false).click();await ready;a.dom.window.close();}
});
test('initialization requests consent before restoration and location lookup can precede first-run onboarding',()=>{
 const init=core.slice(core.indexOf('async function init() {'),core.indexOf('window.addEventListener("pagehide"',core.indexOf('async function init() {')));
 assert(init.indexOf('requestGiloaStartupEntryChoice')<init.indexOf('restoreDurableStorageSnapshot'));assert.match(init,/runInitStep\("startup entry", beginGiloaStartupEntry\)/);
});

test('permission rejection never starts a recorder or shows an active red indicator',async()=>{
 const a=fixture({permissionDenied:true});const ready=a.w.beginGiloaStartupEntry();a.button(true).click();await ready;await new Promise(r=>setTimeout(r,0));assert.equal(a.w.isRecording,false);assert.equal(a.w.recBtn.classList.contains('recording'),false);assert(!a.events.includes('tracking'));assert(a.events.includes('permission-error'));assert.equal(a.w.recStatusBox.textContent,'recordingPermissionRequired');assert.equal(a.w.localStorage.getItem('journeys'),'existing GPS/photos/EXIF');a.dom.window.close();
});
test('an existing recording session is not toggled off or restarted by startup agreement',async()=>{
 const a=fixture({recording:true});const ready=a.w.beginGiloaStartupEntry();a.button(true).click();await ready;await Promise.resolve();assert.equal(a.w.isRecording,true);assert(!a.events.includes('session'));assert(!a.events.includes('eight-hour-timer'));assert(a.w.recBtn.classList.contains('recording'));a.dom.window.close();
});

test('browser permission denial stops the indicator and explains the permission without deleting records',()=>{
 const a=fixture({recording:true});a.w.stopRecording=()=>{a.w.isRecording=false;a.w.syncRecordingUI();};
 a.w.eval(core.slice(core.indexOf('function handleLocationError(err)'),core.indexOf('function createPathPoint(')));
 a.w.handleLocationError({code:1});assert.equal(a.w.isRecording,false);assert.equal(a.w.recBtn.classList.contains('recording'),false);assert(a.events.includes('permission-error'));assert.equal(a.w.recStatusBox.textContent,'recordingPermissionRequired');assert.equal(a.w.localStorage.getItem('journeys'),'existing GPS/photos/EXIF');a.dom.window.close();
});

test('previously blocked browser permission stays blue and leaves a visible permission status',async()=>{
 const a=fixture({webPermission:'denied'});const ready=a.w.beginGiloaStartupEntry();a.button(true).click();await ready;await new Promise(r=>setImmediate(r));
 assert.equal(a.w.recBtn.getAttribute('aria-pressed'),'false');assert.equal(a.w.recStatusBox.textContent,'recordingPermissionRequired');assert(!a.events.includes('tracking'));a.dom.window.close();
});
test('browser permission granted starts the recorder and activates the red stop control',async()=>{
 const a=fixture({webPermission:'granted'});const ready=a.w.beginGiloaStartupEntry();a.button(true).click();await ready;await new Promise(r=>setImmediate(r));
 assert.equal(a.w.recBtn.getAttribute('aria-pressed'),'true');assert(a.w.recBtn.classList.contains('recording'));assert(a.events.includes('tracking'));a.dom.window.close();
});

test('startup agreement still starts GPS when the browser cannot query geolocation permission',async()=>{
 const a=fixture({brokenPermissionQuery:true});
 const ready=a.w.beginGiloaStartupEntry();a.button(true).click();await ready;await new Promise(r=>setImmediate(r));
 assert.equal(a.w.recBtn.getAttribute('aria-pressed'),'true');
 assert(a.events.includes('tracking'));assert(!a.events.includes('permission-error'));a.dom.window.close();
});

test('only the center dot changes color when recording starts',async()=>{
 const a=fixture({webPermission:'granted'}),w=a.w;
 const style=w.document.createElement('style');
 style.textContent=fs.readFileSync(path.join(root,'features/ui/legacy-panels.css'),'utf8');w.document.head.append(style);
 const dot=w.recBtn.querySelector('.loc-record-icon'),crosshair=w.recBtn.querySelector('.loc-crosshair');
 const frame=()=>[w.getComputedStyle(w.recBtn).borderTopColor,w.getComputedStyle(crosshair).borderTopColor];
 const idleFrame=frame();
 assert.equal(w.getComputedStyle(dot).backgroundColor,'rgb(77, 184, 255)');
 const ready=w.beginGiloaStartupEntry();a.button(true).click();await ready;await new Promise(r=>setImmediate(r));
 assert.equal(w.getComputedStyle(dot).backgroundColor,'rgb(255, 68, 68)');assert.deepEqual(frame(),idleFrame);
 w.isRecording=false;w.syncRecordingUI();
 assert.equal(w.getComputedStyle(dot).backgroundColor,'rgb(77, 184, 255)');assert.deepEqual(frame(),idleFrame);a.dom.window.close();
});

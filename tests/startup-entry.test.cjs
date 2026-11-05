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
 w.eval(fs.readFileSync(path.join(root,'privacy-policy.js'),'utf8'));w.eval(fs.readFileSync(path.join(root,'startup-music.js'),'utf8'));
 w.eval(core.slice(core.indexOf('var giloaStartupChoicePromise = null;'),core.indexOf('function startFirstLaunchExperience()')));
 const button=yes=>w.document.querySelector('.giloa-location-consent-card').querySelectorAll('button')[yes?1:2];
 return {w,dom,events,button,plays:()=>plays,playing:()=>playing};
}
test('consent is first even with prior consent; music starts synchronously on start, then location and onboarding',async()=>{
 const a=fixture({consented:true});const pending=a.w.requestGiloaStartupEntryChoice();a.w.beginGiloaStartupEntry();
 assert(a.w.document.querySelector('.giloa-location-consent'));assert.equal(a.plays(),0);assert(!a.events.includes('intro'));assert(!a.events.includes('location'));
 a.button(true).click();assert.equal(a.plays(),1);assert.equal(a.events.includes('location'),false);assert.equal(await pending,true);await Promise.resolve();
 assert(a.events.indexOf('music')<a.events.indexOf('location'));assert(a.events.indexOf('location')<a.events.indexOf('intro'));assert.equal(a.w.localStorage.getItem('journeys'),'existing GPS/photos/EXIF');
 assert.equal(await a.w.GiloaPrivacy.requestLocationConsent(),true);assert.equal(a.w.document.querySelectorAll('.giloa-location-consent').length,0);a.dom.window.close();
});
test('starting without location never requests GPS but still starts default music and enters the app',async()=>{
 const a=fixture({consented:true});const ready=a.w.beginGiloaStartupEntry();a.button(false).click();assert.equal(await ready,false);assert.equal(a.plays(),1);assert(!a.events.includes('location'));assert(a.events.includes('intro'));assert.equal(await a.w.GiloaPrivacy.requestLocationConsent(),false);a.dom.window.close();
});
test('saved mute survives launch and can be changed through the music button',async()=>{
 const a=fixture({muted:true});const ready=a.w.beginGiloaStartupEntry();a.button(false).click();await ready;assert.equal(a.plays(),0);
 a.w.document.getElementById('adventure-music-toggle').click();assert.equal(a.plays(),1);assert.equal(a.w.localStorage.getItem('giloa-startup-music-enabled-v1'),'true');a.dom.window.close();
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

// GPX_TEST_DEPS=/absolute/node_modules node tests/startup-music.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require(path.join(process.env.GPX_TEST_DEPS, 'jsdom'));
const root = path.join(__dirname, '..');
const dom = new JSDOM(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), {url:'https://example.test',runScripts:'outside-only'});
const w = dom.window, el = id => w.document.getElementById(id);
const song = el('adventure-music-audio'), greeting = el('gilo-welcome-audio');
let playing = false, ended = false, playCount = 0, finishCount = 0, blocked = false, hidden = false;
Object.defineProperty(song,'paused',{get:()=>!playing});
Object.defineProperty(song,'ended',{get:()=>ended});
Object.defineProperty(w.document,'hidden',{get:()=>hidden});
song.play = ()=>{
    playCount++;
    if(blocked) return Promise.reject(Error('NotAllowedError'));
    playing=true;ended=false;song.dispatchEvent(new w.Event('play'));return Promise.resolve();
};
song.pause = ()=>{playing=false;song.dispatchEvent(new w.Event('pause'));};
let greetingStops=0;
greeting.pause = ()=>{greetingStops++;};
el('gsi-start').onclick=()=>{finishCount++;};
w.eval(fs.readFileSync(path.join(root,'startup-music.js'),'utf8'));
const tick=()=>new Promise(resolve=>setTimeout(resolve,5));
(async()=>{
    assert.equal(playCount,0); assert.equal(song.autoplay,false); assert.equal(song.loop,false); assert.equal(song.preload,'none');
    el('gsi-start').click(); await tick(); assert.equal(playCount,0); assert.equal(finishCount,1);
    w.document.body.click(); assert.equal(playCount,0);
    el('adventure-music-start').click(); await tick();
    assert.equal(playCount,1); assert.equal(finishCount,2); assert.equal(playing,true); assert.equal(greetingStops,1);
    assert.equal(el('adventure-music-toggle').getAttribute('aria-pressed'),'true');
    assert.equal(song.volume,0.35);
    el('adventure-music-toggle').click(); assert.equal(playing,false); assert.equal(song.currentTime,0);
    el('adventure-music-toggle').click(); await tick(); assert.equal(playing,true);
    greeting.dispatchEvent(new w.Event('play')); assert.equal(playing,false);
    el('adventure-music-toggle').click(); await tick();
    hidden=true;w.document.dispatchEvent(new w.Event('visibilitychange'));assert.equal(playing,false);
    hidden=false;w.document.dispatchEvent(new w.Event('visibilitychange'));assert.equal(playing,false);
    el('adventure-music-toggle').click(); await tick();w.dispatchEvent(new w.Event('pagehide'));assert.equal(playing,false);
    blocked=true;el('adventure-music-start').click(); await tick();
    assert.equal(finishCount,3);assert.equal(el('adventure-music-toggle').getAttribute('aria-busy'),'false');
    assert.match(el('adventure-music-status').textContent,/재생하지 못/);
    blocked=false;el('adventure-music-toggle').click();await tick();assert.equal(playing,true);
    ended=true;playing=false;song.dispatchEvent(new w.Event('ended'));
    assert.equal(el('adventure-music-toggle').getAttribute('aria-pressed'),'false');
    for(const language of ['en','ja','zh','es','fr','ko']){
        w.document.documentElement.lang=language;await tick();
        assert.ok(el('adventure-music-start').textContent);
        assert.ok(el('adventure-music-toggle').getAttribute('aria-label'));
    }
    song.dispatchEvent(new w.Event('error'));assert.match(el('adventure-music-status').textContent,/재생하지 못/);
    console.log('PASS explicit opt-in, silent start, existing onboarding, no autoplay/loop, play/stop/retry, greeting exclusion, background stop, errors, six languages');
    dom.window.close();
})().catch(error=>{console.error(error);dom.window.close();process.exitCode=1;});

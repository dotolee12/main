const test=require('node:test'), assert=require('node:assert/strict'), fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require(process.env.GPX_TEST_DEPS?path.join(process.env.GPX_TEST_DEPS,'jsdom'):'jsdom');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const code=html.match(/<script id="giloa-startup-recovery-code">([\s\S]*?)<\/script>/)[1];
function start(lang='ko') {
    const dom=new JSDOM('<html lang="'+lang+'"><body></body></html>',{url:'https://giloa.test',runScripts:'outside-only'}),w=dom.window;
    const timers=[];w.setTimeout=fn=>{timers.push(fn);};w.localStorage.setItem('journey-fixture','existing GPS/photos/GPX');w.eval(code);return {dom,w,fire:()=>timers.forEach(fn=>fn())};
}
test('unfinished startup offers manual recovery without clearing records or blocking the map',()=>{
    const a=start();a.fire();const box=a.w.document.getElementById('giloa-startup-recovery');assert(box);assert.match(box.textContent,/다시 불러오기/);
    assert.equal(a.w.localStorage.getItem('journey-fixture'),'existing GPS/photos/GPX');assert.equal(a.w.localStorage.length,1);
    a.w.dispatchEvent(new a.w.Event('giloa:ready'));assert.equal(a.w.document.getElementById('giloa-startup-recovery'),null);a.dom.window.close();
});
test('ready applications never show a recovery overlay, in each supported language',()=>{
    for(const lang of ['ko','en','ja','zh','es','fr']){const a=start(lang);a.w.document.documentElement.dataset.giloaReady='true';a.fire();assert.equal(a.w.document.getElementById('giloa-startup-recovery'),null);a.dom.window.close();}
    const a=start();a.w.GiloaBoot={interactive:true};a.fire();assert.equal(a.w.document.getElementById('giloa-startup-recovery'),null);a.dom.window.close();
});

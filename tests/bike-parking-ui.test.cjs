const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const {JSDOM}=require(process.env.GPX_TEST_DEPS?path.join(process.env.GPX_TEST_DEPS,'jsdom'):'jsdom');
test('opt-in, candidate confirmation, map action, translation and reload preserve separate data',async()=>{
 const d=new JSDOM('<html lang="ko"><body><div id="sidebar"><div class="sidebar-header"></div></div></body></html>',{url:'https://giloa.test',runScripts:'outside-only'}),w=d.window,events={};let view;
 w.map={on:(n,f)=>events[n]=f,setView:p=>view=p};w.L={DomEvent:{disableClickPropagation(){}},marker:()=>({addTo(){return this},bindTooltip(){return this},on(){},remove(){},openTooltip(){}})};w.toggleSidebar=()=>{};
 w.localStorage.setItem('giloa-existing-journey','keep');w.eval(fs.readFileSync(path.join(__dirname,'../features/explore/bike-parking.js'),'utf8'));w.dispatchEvent(new w.Event('giloa:ready'));
 const p=w.document.querySelector('[role=dialog]'),toggle=p.querySelector('[data-toggle]');assert.equal(p.hidden,true);toggle.click();assert.equal(JSON.parse(w.localStorage.getItem('giloa-bike-parking-v1')).enabled,true);
 let start=Date.now()+1000;for(let t=0;t<=170;t+=10)w.GiloaBikeParking.feed({lat:t<=80?37+t/20000:37.004+Math.max(0,t-100)/90000,lng:127,accuracy:8,time:start+t*1000,speed:t<=80?4:t===90?0:1.1});
 let data=JSON.parse(w.localStorage.getItem('giloa-bike-parking-v1'));assert.ok(data.candidate);assert.equal(data.candidate.lat,37.004);w.GiloaBikeParking.open();assert.equal(p.hidden,false);p.querySelector('[data-action="7"]').click();data=JSON.parse(w.localStorage.getItem('giloa-bike-parking-v1'));assert.equal(data.candidate.confirmed,true);p.querySelector('[data-action="6"]').click();assert.equal(view[0],37.004);assert.equal(p.hidden,true);
 w.document.documentElement.lang='es';await new Promise(r=>setTimeout(r,0));assert.equal(p.querySelector('h2').textContent,'Recordar aparcamiento de bici');assert.equal(w.localStorage.getItem('giloa-existing-journey'),'keep');w.GiloaBikeParking.open();events.click();assert.equal(p.hidden,true);d.window.close();
});

const test=require('node:test'), assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'..','script.js'),'utf8');
function setup(points){
 const handlers={}, win={}, timers=new Map();let id=0,shown=0;
 const container={dataset:{},addEventListener:(name,fn)=>{handlers[name]=fn;}};
 const ctx={console,Math,Date,Map,Number,isFinite,Array,pathCoordinates:points,rawGpsPoints:[],
  isValidPhotoCoordinate:(lat,lng)=>typeof lat==='number'&&typeof lng==='number',
  shouldConnectStoredPathPoints:(a,b)=>a.session===b.session && !!a.startTime && !!b.startTime,
  map:{latLngToContainerPoint:p=>({x:Array.isArray(p)?p[0]:p.lat,y:Array.isArray(p)?p[1]:p.lng}),containerPointToLatLng:p=>({lat:p[0],lng:p[1]}),distance:(a,b)=>Math.hypot(a.lat-b.lat,a.lng-b.lng),getContainer:()=>container,mouseEventToLatLng:e=>({lat:e.clientX,lng:e.clientY}),on(){}},
  window:{addEventListener:(name,fn)=>{win[name]=fn;}},setTimeout:fn=>{timers.set(++id,fn);return id;},clearTimeout:id=>timers.delete(id)};
 vm.createContext(ctx);
 vm.runInContext(source.slice(source.indexOf('function findRouteDatesAt('),source.indexOf('function showRouteDatesAt(')),ctx);
 ctx.showRouteDatesAt=()=>{shown++;return true;};
 vm.runInContext(source.slice(source.indexOf('function initRouteDatesLongPress('),source.indexOf('initRouteDatesLongPress();',source.indexOf('function initRouteDatesLongPress('))+27),ctx);
 return {ctx,handlers,win,timers,get shown(){return shown;}};
}
const day=Date.UTC(2026,9,1,12);
test('middle of a recorded segment yields dates; repeat passes deduplicate per day',()=>{
 const pts=[{lat:10,lng:10,startTime:day,session:'a'},{lat:100,lng:10,startTime:day+60000,session:'a'},{lat:10,lng:10,startTime:day+86400000,session:'b'},{lat:100,lng:10,startTime:day+86460000,session:'b'}];
 const saved=JSON.stringify(pts),r=setup(pts);
 assert.equal(r.ctx.findRouteDatesAt({lat:55,lng:10}).length,2);
 assert.equal(JSON.stringify(pts),saved);
 assert.equal(r.ctx.findRouteDatesAt({lat:55,lng:100}).length,0);
});
test('disconnected sessions never invent a traversed segment; undated points remain unknown',()=>{
 const r=setup([{lat:10,lng:10,startTime:day,session:'a'},{lat:100,lng:10,startTime:day+60000,session:'b'}]);
 assert.equal(r.ctx.findRouteDatesAt({lat:55,lng:10}).length,0);
 r.ctx.pathCoordinates=[{lat:10,lng:10}];
 assert.equal(r.ctx.findRouteDatesAt({lat:10,lng:10})[0],null);
});
function press(target={closest:()=>null}){return {button:0,isPrimary:true,pointerId:1,clientX:10,clientY:10,target};}
test('long press opens once; dragging and pinch cancel; markers do not start lookup',()=>{
 const r=setup([]);r.handlers.pointerdown(press());const [timer,fire]=r.timers.entries().next().value;r.timers.delete(timer);fire();assert.equal(r.shown,1);
 r.win.pointerup();r.handlers.pointerdown(press());r.win.pointermove({pointerId:1,clientX:30,clientY:10});assert.equal(r.timers.size,0);
 r.handlers.pointerdown(press());r.handlers.pointerdown({...press(),isPrimary:false});assert.equal(r.timers.size,0);
 r.handlers.pointerdown(press({closest:()=>({})}));assert.equal(r.timers.size,0);
});
test('photo-location picking excludes route history and quick taps cancel',()=>{
 const r=setup([]);r.ctx.pendingPhotoLocationChoice={};r.handlers.pointerdown(press());assert.equal(r.timers.size,0);
 r.ctx.pendingPhotoLocationChoice=null;r.handlers.pointerdown(press());r.win.pointerup();assert.equal(r.timers.size,0);assert.equal(r.shown,0);
});
test('distant routes skip connection checks and each point is projected once',()=>{
 const points=Array.from({length:1000},(_,i)=>({lat:1000+i,lng:1000,startTime:day+i*1000,session:'a'}));
 const r=setup(points);let checks=0,projections=0;
 r.ctx.shouldConnectStoredPathPoints=()=>{checks++;return true;};
 const project=r.ctx.map.latLngToContainerPoint;
 r.ctx.map.latLngToContainerPoint=p=>{projections++;return project(p);};
 assert.equal(r.ctx.findRouteDatesAt({lat:10,lng:10}).length,0);
 assert.equal(checks,0);assert.equal(projections,1001);
});

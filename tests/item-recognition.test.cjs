const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'..','item-recognition.js'),'utf8');
function fixture(){let instance,delay;const canvas={width:0,height:0,getContext:()=>({drawImage(){},getImageData:()=>({data:new Uint8ClampedArray(320*240*4)})})};class Worker{constructor(url){this.url=url;instance=this;}postMessage(value,transfer){this.message=value;this.transfer=transfer;}terminate(){this.stopped=true;}}
const context={window:{},Worker,document:{baseURI:'https://giloa.test/',createElement:()=>canvas},URL,Uint8ClampedArray,ArrayBuffer,Number,Object,Array,Math,Error,setTimeout(fn){delay=fn;return 1;},clearTimeout(){}};vm.runInNewContext(source,context);return {api:context.window.GiloaItemRecognition,worker:()=>instance,timeout:()=>delay()};}
const p=(kind,score=.9,bbox=[10,10,280,220])=>({class:kind,score,bbox});
test('confident supported objects select their pictograms while weak, unsupported and malformed matches do not',()=>{
 const {api}=fixture();for(const [kind,type] of [['cell phone','phone'],['book','book'],['cup','coffee'],['backpack','bag'],['bicycle','bicycle'],['car','car'],['pizza','food']])assert.equal(api.pick([p(kind)],320,240).type,type);
 for(const predictions of [[p('cell phone',.4)],[p('person')],[p('camera')],[p('constructor')],[p('cell phone',.9,[0,0,1,1])],[p('cell phone',.9,[NaN,0,200,200])],[],null])assert.equal(api.pick(predictions,320,240),null);
 assert.equal(api.pick([p('cell phone')],Infinity,240),null);
});
test('similarly strong competing objects require review instead of an arbitrary automatic choice',()=>{
 const {api}=fixture();assert.equal(api.pick([p('cell phone'),p('book')],320,240),null);assert.equal(api.pick([p('cell phone',.95),p('book',.61,[0,0,30,40])],320,240).type,'phone');
});
test('only bounded pixels go to the worker; completion releases it and returns the detected type',async()=>{
 const a=fixture(),phases=[];const task=a.api.recognize({naturalWidth:320,naturalHeight:240},phase=>phases.push(phase));const w=a.worker();assert.match(w.url,/^https:\/\/giloa.test\/item-recognition-worker.js\?v=1$/);assert.deepEqual(Object.keys(w.message).sort(),['height','pixels','width']);assert.equal(w.message.pixels.byteLength,320*240*4);assert.equal(w.transfer[0],w.message.pixels);
 w.onmessage({data:{phase:'analyzing'}});assert.deepEqual(phases,['analyzing']);w.onmessage({data:{predictions:[p('cell phone')]}});assert.equal((await task.promise).type,'phone');assert(w.stopped);
});
test('cancel and timeout terminate the worker and reject instead of keeping photo work alive',async()=>{
 const a=fixture(),cancel=a.api.recognize({naturalWidth:320,naturalHeight:240});const caught=assert.rejects(cancel.promise,/cancelled/);cancel.cancel();await caught;assert(a.worker().stopped);
 const b=fixture(),timeout=b.api.recognize({naturalWidth:320,naturalHeight:240});const timed=assert.rejects(timeout.promise,/timed out/);b.timeout();await timed;assert(b.worker().stopped);
});
test('worker failures are recoverable and the worker never accepts full-resolution photos or location data',async()=>{
 const a=fixture(),task=a.api.recognize({naturalWidth:320,naturalHeight:240});const failed=assert.rejects(task.promise,/unavailable/);a.worker().onerror();await failed;assert(a.worker().stopped);
 const worker=fs.readFileSync(path.join(__dirname,'..','item-recognition-worker.js'),'utf8');assert.match(worker,/tf\.setBackend\('cpu'\)/);assert.match(worker,/data\.width > 640/);assert.doesNotMatch(worker,/localStorage|indexedDB|toDataURL|FormData|XMLHttpRequest/);
});

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname,'..','script.js'),'utf8');
function setup() {
  const calls = [], timers = [];
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const photos = [{id:'a'},{id:'b'},{id:'c'}];
  const ctx = {photos,console,document:{hidden:false},photoHasImageData:() => false,
    setTimeout:fn => { timers.push(fn); },updatePhotoList(){},scheduleSave(){},
    hydratePhotoImageFromOriginal:async p => {
      calls.push(p.id);
      if(p.id === 'a') await gate;
      if(p.id === 'b') throw new Error('broken original');
      return true;
    }};
  vm.createContext(ctx);
  vm.runInContext(source.slice(source.indexOf('var photoPreviewRecoveryQueue ='),source.indexOf('async function hydratePhotoImageFromOriginal(')),ctx);
  return {ctx,photos,calls,timers,release};
}
async function flush(){for(let i=0;i<12;i++) await Promise.resolve();}
test('one original at a time; duplicate requests share work; failure does not block later photos',async()=>{
  const r=setup();
  const first=r.ctx.queuePhotoPreviewRecovery(r.photos[0]);
  assert.equal(r.ctx.queuePhotoPreviewRecovery(r.photos[0]),first);
  const second=r.ctx.queuePhotoPreviewRecovery(r.photos[1]);
  const third=r.ctx.queuePhotoPreviewRecovery(r.photos[2]);
  await flush();assert.deepEqual(r.calls,['a']);
  r.release();await first;await flush();
  assert.deepEqual(r.calls,['a']);
  r.timers.shift()();await second;await flush();
  r.timers.shift()();await third;
  assert.deepEqual(r.calls,['a','b','c']);
  assert.equal(r.ctx.photoPreviewRecoveryPending.size,0);
});
test('photo deleted while queued is not decoded or written again',async()=>{
  const r=setup();
  const first=r.ctx.queuePhotoPreviewRecovery(r.photos[0]);
  const second=r.ctx.queuePhotoPreviewRecovery(r.photos[1]);
  r.photos.splice(1,1);r.release();await first;await flush();
  r.timers.shift()();assert.equal(await second,false);
  assert.deepEqual(r.calls,['a']);
});

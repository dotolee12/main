const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
const start = source.indexOf('function scheduleDeferredPhotoLocationRecovery()');
const end = source.indexOf('function renderStoredPhotoMarkers()', start);
function setup(photos) {
  const calls = [];
  const delays = [];
  let saves = 0;
  let refreshes = 0;
  const ctx = { photos, console, photoLocationRecoveryRunning:false,
    photoLocationRecoveryTimer:null, document:{hidden:false},
    PHOTO_LOCATION_RECOVERY_BATCH:3, PHOTO_LOCATION_MIGRATION_KEY:'migration',
    isValidPhotoCoordinate:(lat,lng) => typeof lat === 'number' && typeof lng === 'number',
    safeStorageGet:() => 'done', safeStorageSet:() => {},
    setTimeout:(fn,ms) => { delays.push(ms); fn(); },
    persistState:() => { saves++; }, updatePhotoList:() => { refreshes++; },
    recoverPhotoLocationFromExif:async (p, options) => {
      calls.push(p.id); p._exifRecoveryTried = true;
      assert.equal(options.deferSave,true);
      if (p.noGps) return false;
      p.lat = 37; p.lng = 127; return true;
    }
  };
  vm.createContext(ctx); vm.runInContext(source.slice(start,end),ctx);
  return {ctx,calls,delays,get saves(){return saves;},get refreshes(){return refreshes;}};
}
test('all 43 pending photos are inspected despite an old completion flag', async () => {
  const photos = Array.from({length:43}, (_,id) => ({id,lat:null,lng:null}));
  const {ctx,calls} = setup(photos);
  assert.equal(await ctx.migratePhotoLocations(),43);
  assert.equal(calls.length,43);
  assert.equal(ctx.photoLocationRecoveryRunning,false);
});
test('recovery rests between photos and batches, saving only changed batches', async () => {
  const photos = Array.from({length:7},(_,id) => ({id,lat:null,lng:null,noGps:id >= 3}));
  const run = setup(photos);
  assert.equal(await run.ctx.migratePhotoLocations(),3);
  assert.deepEqual(run.delays,[1000,1000,5000,1000,1000,5000]);
  assert.equal(run.saves,1);
  assert.equal(run.refreshes,1);
});
test('hidden app waits before reading the next original', async () => {
  const run = setup([{id:1,lat:null,lng:null}]);
  run.ctx.document.hidden = true;
  run.ctx.setTimeout = (fn,ms) => {
    assert.equal(run.calls.length,0);
    assert.equal(ms,5000);
    run.ctx.document.hidden = false;
    fn();
  };
  assert.equal(await run.ctx.migratePhotoLocations(),1);
});
test('startup requests share one deferred recovery timer', () => {
  const run = setup([{id:1,lat:null,lng:null}]);
  let scheduled = 0;
  run.ctx.setTimeout = () => { scheduled++; return 42; };
  run.ctx.scheduleDeferredPhotoLocationRecovery();
  run.ctx.scheduleDeferredPhotoLocationRecovery();
  assert.equal(scheduled,1);
});
test('one failed original does not prevent recovery of later photos', async () => {
  const run = setup([{id:1,lat:null,lng:null},{id:2,lat:null,lng:null}]);
  const original = run.ctx.recoverPhotoLocationFromExif;
  run.ctx.recoverPhotoLocationFromExif = async (p,options) => {
    if (p.id === 1) throw new Error('unreadable original');
    return original(p,options);
  };
  assert.equal(await run.ctx.migratePhotoLocations(),1);
  assert.equal(run.ctx.photoLocationRecoveryRunning,false);
});
test('existing coordinates survive and missing EXIF stays unlocated', async () => {
  const photos = [{id:1,lat:35,lng:129},{id:2,lat:null,lng:null,noGps:true}];
  const {ctx,calls} = setup(photos);
  assert.equal(await ctx.migratePhotoLocations(),0);
  assert.deepEqual(calls,[2]);
  assert.equal(photos[0].lat,35);
  assert.equal(photos[1].lat,null);
  assert.equal(photos.length,2);
});
test('forced recovery retries previously attempted photos', async () => {
  const {ctx,calls} = setup([{id:1,lat:null,lng:null,_exifRecoveryTried:true}]);
  assert.equal(await ctx.migratePhotoLocations({force:true}),1);
  assert.deepEqual(calls,[1]);
});

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
function fn(file, name) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  let start = source.indexOf('function ' + name + '(');
  assert(start >= 0);
  if (source.slice(start - 6, start) === 'async ') start -= 6;
  let depth = 0;
  for (let i = source.indexOf('{', start); i < source.length; i++) {
    if (source[i] === '{') depth++;
    if (source[i] === '}' && --depth === 0) return source.slice(start, i + 1);
  }
  throw Error(name);
}
function syncFixture(saveOK = true) {
  let state = {specialPlacePins:[{id:'old'}]};
  const uploads = [], timers = [], statuses = [];
  const ctx = {
    console:{warn() {}}, navigator:{onLine:true}, session:{}, initialized:true,
    syncPromise:null, syncQueued:false, committingServerState:false, syncTimer:null,
    ensureSession:async () => true, renderAccount() {},
    words:() => ({syncing:'syncing', done:'done', failed:'failed'}),
    setStatus:(s) => statuses.push(s),
    buildStatePayload:() => structuredClone(state),
    uploadLocalFirst:async (p) => uploads.push(structuredClone(p)),
    pullServer:async () => ({specialPlacePins:[{id:'server'}]}),
    downloadRemoteThumbnails:async () => {},
    mergeJourneyStatePayloads:(values) => ({specialPlacePins:[...new Map(values.flatMap(v => v.specialPlacePins).map(p => [p.id, p])).values()]}),
    hasJourneyRecordRegression:(old, next) => old.specialPlacePins.some(p => !next.specialPlacePins.some(n => n.id === p.id)),
    applyStatePayload:(p) => { state = p; return true; },
    persistState:() => { ctx.scheduleSync(); return saveOK; }, repaintJourney() {},
    setTimeout:(f) => { timers.push(f); return timers.length; }, clearTimeout() {}
  };
  vm.createContext(ctx);
  vm.runInContext(fn('supabase-sync.js', 'scheduleSync') + '\n' + fn('supabase-sync.js', 'syncNow'), ctx);
  return {ctx, uploads, timers, statuses, get state() { return state; }};
}
test('pin added during thumbnail download survives and is uploaded by queued sync', async () => {
  const f = syncFixture();
  f.ctx.downloadRemoteThumbnails = async () => {
    f.state.specialPlacePins.push({id:'new'});
    f.ctx.scheduleSync();
  };
  await f.ctx.syncNow(false);
  assert.deepEqual(f.state.specialPlacePins.map(p => p.id).sort(), ['new','old','server']);
  assert.equal(f.timers.length, 1);
  f.ctx.downloadRemoteThumbnails = async () => {};
  f.timers[0]();
  await new Promise(setImmediate); // drain VM and host async continuations
  await f.ctx.syncPromise;
  assert(f.uploads[1].specialPlacePins.some(p => p.id === 'new'));
  assert.equal(f.timers.length, 1, 'own commit must not create an endless sync loop');
});
test('sync commit failure does not display done', async () => {
  const f = syncFixture(false);
  assert.equal(await f.ctx.syncNow(false), null);
  assert.equal(f.statuses.at(-1), 'failed');
  assert(!f.statuses.some(s => s.startsWith('done')));
});
test('concurrent sync requests share one upload after session validation', async () => {
  const f = syncFixture();
  await Promise.all([f.ctx.syncNow(true), f.ctx.syncNow(false)]);
  assert.equal(f.uploads.length, 1);
});
test('failed pin save keeps note, retries same ID, and only confirms successful commit', () => {
  let saveOK = false, created = 0, closed = 0, confirmed = 0;
  const note = {value:'my note'}, error = {textContent:''};
  const ctx = {
    document:{getElementById:(id) => id === 'special-place-note' ? note : error},
    specialPlaceEditorCoords:{latitude:37, longitude:127}, specialPlacePins:[],
    getSpecialPlaceText:() => ({pin_save_failed:'failed',pin_saved:'saved'}),
    createSpecialPlaceId:() => 'new-pin', markJourneyStateDirty() {},
    persistState:() => saveOK, createSpecialPlaceMarker:() => created++,
    closeSpecialPlaceEditor:() => closed++, showCollectionToast:() => confirmed++, showGiloReaction() {}
  };
  vm.createContext(ctx);
  vm.runInContext(fn('script.js', 'saveSpecialPlacePin'), ctx);
  ctx.saveSpecialPlacePin();
  assert.equal(error.textContent, 'failed');
  assert.equal(note.value, 'my note');
  assert.equal(closed + confirmed + created, 0);
  ctx.specialPlacePins = ctx.specialPlacePins.map(p => ({...p}));
  note.value = 'updated note';
  saveOK = true;
  ctx.saveSpecialPlacePin();
  assert.equal(ctx.specialPlacePins.length, 1);
  assert.equal(ctx.specialPlacePins[0].note, 'updated note');
  assert.equal(created, 1);
  assert.equal(closed, 1);
  assert.equal(confirmed, 1);
});

// Synthetic fixtures only. Does not open the user's browser or data stores.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
function fn(name) {
    const start = source.indexOf('function ' + name + '(');
    assert(start >= 0, name);
    let depth = 0;
    for (let i = source.indexOf('{', start); i < source.length; i++) {
        if (source[i] === '{') depth++;
        if (source[i] === '}' && --depth === 0) return source.slice(start, i + 1);
    }
    throw Error(name);
}
function point(n) {
    const t = 1700000000000 + n * 60000;
    return {id:'gps'+n, lat:37+n*0.0001, lng:127, timestamp:t, startTime:t, endTime:t, accuracy:10, visits:1, recordingSessionId:'walk'};
}
function fixture() {
    return {
        pathCoordinates:[point(1), point(2)], rawGpsPoints:[point(2)],
        memories:[{id:'m1',lat:37,lng:127,name:'one',time:1},{id:'m2',lat:37,lng:127,name:'two',time:2}],
        photos:[{id:'p1',lat:37,lng:127,time:1},{id:'p2',lat:38,lng:128,time:2}],
        specialPlacePins:[{id:'pin1',latitude:37,longitude:127,note:'keep',createdAt:'2026-09-15T00:00:00Z'}],
        totalDistance:1000
    };
}
function context() {
    const storage = new Map(), deletedOriginals = [], alerts = [];
    const c = {
        ...fixture(), deletedJourneyRecords:{memories:[],photos:[]},
        isRecording:false, recordingSessionId:null, recordingSessionStartedAt:0,
        isFogEnabled:true, MAX_ACCURACY_M:100, MAX_PATH_POINTS:12000,
        PATH_SPIKE_WINDOW_MS:120000, PATH_SPIKE_MIN_EXCURSION_M:45,
        PATH_CONNECT_MAX_ACCURACY_M:100, PATH_SHORT_GAP_MAX_SPEED_MPS:8,
        GILOA_PERSISTENCE_DEBUG:false, giloaPersistentStateReady:true,
        persistentStateDirty:true, lastCheckpointAt:0,
        STORAGE_TEMP_KEY:'temp', STORAGE_BACKUP_KEY:'backup', STORAGE_KEY:'state',
        getLocalStorageKey:()=> 'state',
        localStorage:{getItem:k=>storage.get(k) ?? null,setItem:(k,v)=>storage.set(k,v)},
        persistDurableStorageSnapshot:()=>true,
        scheduleRegionStayRecalculation(){}, scheduleCompletedOfficialRouteRefresh(){},
        calculateRecordedDistance:()=>5,
        isValidPhotoCoordinate:(lat,lng)=>lat != null && lng != null && isFinite(lat) && isFinite(lng),
        normalizePhotoLocationSource:value=>value || '', normalizeHeading:value=>Number(value)%360,
        memoryMarkers:new Map(), map:{removeLayer(){}}, updateMemoryList(){}, updateStats(){},
        findPhotoMarker:()=>null, forgetPhotoMarker(){}, photoClusterGroup:{removeLayer(){}},
        idbDeletePhoto:id=>{deletedOriginals.push('idb:'+id);return Promise.resolve();},
        deleteRemotePhotoFiles:photo=>deletedOriginals.push('remote:'+photo.id),
        window:{dispatchEvent(){}}, CustomEvent:function(){},
        currentLang:'en', UI_TEXT:{en:{journey_delete_save_failed:'kept'},ko:{}},
        alert:message=>alerts.push(message), console:{log(){},warn(){},error(){}},
        L:{latLng:(lat,lng)=>({distanceTo:p=>Math.hypot(lat-p[0],lng-p[1])*111000})}
    };
    vm.createContext(c);
    [
        'isValidJourneyPoint','journeyPointKey','mergeJourneyPointLists','mergeJourneyEntities','journeyEntityId',
        'mergeJourneyDeletionRecords','filterDeletedJourneyEntities','journeyPayloadPointCount',
        'journeyPayloadRecordCounts','hasJourneyRecordRegression','mergeJourneyStatePayloads',
        'buildStatePayload','applyStatePayload','buildDisplayPath','isIsolatedGpsSpike','shrinkOldPoints',
        'compactPathData','safeStorageGet','safeStorageSet','parseStoredState','persistState',
        'commitJourneyDeletion','deleteMemory','deletePhoto'
    ].forEach(name=>vm.runInContext(fn(name),c));
    storage.set('state', JSON.stringify(fixture()));
    return {c,storage,deletedOriginals,alerts};
}
const plain = value=>JSON.parse(JSON.stringify(value));

test('partial RAW does not replace older display points or mutate RAW/stay metadata',()=>{
    const {c}=context();
    c.pathCoordinates[0].endTime += 20000;
    c.pathCoordinates[0].visits = 4;
    const raw = JSON.stringify(c.rawGpsPoints);
    c.compactPathData(); c.compactPathData();
    assert.deepEqual(plain(c.pathCoordinates).map(p=>p.id),['gps1','gps2']);
    assert.equal(c.pathCoordinates[0].visits,4);
    assert.equal(c.pathCoordinates[0].endTime,point(1).endTime+20000);
    assert.equal(JSON.stringify(c.rawGpsPoints),raw);
});
test('old display-only state and mixed state survive repeated apply/save/merge',()=>{
    const {c}=context();
    const saved=fixture(); saved.rawGpsPoints=[];
    c.applyStatePayload(saved);
    assert.equal(c.pathCoordinates.length,2);
    c.rawGpsPoints=[point(3)]; c.compactPathData();
    for(let i=0;i<3;i++) c.applyStatePayload(c.mergeJourneyStatePayloads([c.buildStatePayload(),saved]));
    assert.deepEqual(plain(c.pathCoordinates).map(p=>p.timestamp),[1,2,3].map(n=>point(n).timestamp));
    assert.equal(c.rawGpsPoints.length,1);
    assert.equal(c.totalDistance,1000);
});
test('partial legacy payload does not empty photo/memory collections that were absent from it',()=>{
    const {c}=context();
    c.applyStatePayload({pathCoordinates:[point(1)]});
    assert.equal(c.photos.length,2);
    assert.equal(c.memories.length,2);
});
test('RAW session metadata wins over duplicate legacy display fixes without losing stays',()=>{
    const {c}=context();
    c.pathCoordinates.forEach(p=>p.recordingSessionId=null);
    c.pathCoordinates[0].visits=5;
    c.rawGpsPoints=[{...point(1),recordingSessionId:'one'},{...point(2),recordingSessionId:'two'}];
    c.compactPathData();
    assert.deepEqual(plain(c.pathCoordinates).map(p=>p.recordingSessionId),['one','two']);
    assert.equal(c.pathCoordinates[0].visits,5);
});
test('explicit memory deletion saves and subsequent GPS checkpoints remain writable',()=>{
    const {c,storage}=context();
    c.deleteMemory('m1');
    let state=JSON.parse(storage.get('state'));
    assert.deepEqual(state.memories.map(m=>m.id),['m2']);
    assert.deepEqual(state.deletedJourneyRecords.memories,['m1']);
    c.rawGpsPoints.push(point(3)); c.compactPathData();
    assert.equal(c.persistState(),true);
    state=JSON.parse(storage.get('state'));
    assert.equal(state.rawGpsPoints.length,2);
    assert.equal(state.photos.length,2);
    assert.equal(state.specialPlacePins.length,1);
});
test('explicit photo deletion is committed before only that original is removed',()=>{
    const {c,storage,deletedOriginals}=context();
    c.deleteRemotePhotoFiles=photo=>{
        assert.deepEqual(JSON.parse(storage.get('state')).photos.map(p=>p.id),['p2']);
        deletedOriginals.push('remote:'+photo.id);
    };
    c.deletePhoto('p1');
    assert.deepEqual(deletedOriginals,['remote:p1','idb:p1']);
    assert.equal(c.memories.length,2);
    assert.deepEqual(plain(c.deletedJourneyRecords.photos),['p1']);
});
test('backup and pending merges cannot resurrect explicitly deleted photos or memories',()=>{
    const {c,storage}=context();
    const old=fixture(); c.deleteMemory('m1'); c.deletePhoto('p1');
    const newer=JSON.parse(storage.get('state'));
    const merged=c.mergeJourneyStatePayloads([old,JSON.parse(storage.get('backup')),newer]);
    c.applyStatePayload(merged);
    assert.deepEqual(plain(c.photos).map(p=>p.id),['p2']);
    assert.deepEqual(plain(c.memories).map(p=>p.id),['m2']);
    assert.equal(c.rawGpsPoints.length,1);
    assert.equal(c.pathCoordinates.length,2);
    assert.equal(c.totalDistance,1000);
});
test('unexpected loss remains blocked, including loss masked by a different new entity',()=>{
    const {c}=context();
    const old=fixture(), next=fixture();
    next.memories=[next.memories[1],{id:'other'}];
    assert.equal(c.hasJourneyRecordRegression(old,next),true);
    next.deletedJourneyRecords={memories:['m1']};
    assert.equal(c.hasJourneyRecordRegression(old,next),false);
    next.photos=[];
    assert.equal(c.hasJourneyRecordRegression(old,next),true);
    next.photos=old.photos;next.rawGpsPoints=[];next.pathCoordinates=[];
    assert.equal(c.hasJourneyRecordRegression(old,next),true);
});
test('display count cannot mask lost RAW, while duplicate RAW normalization remains allowed',()=>{
    const {c}=context();const old=fixture(),next=fixture();
    next.rawGpsPoints=[];
    assert.equal(c.hasJourneyRecordRegression(old,next),true);
    old.rawGpsPoints.push({...old.rawGpsPoints[0]});
    next.rawGpsPoints=[point(2)];
    assert.equal(c.hasJourneyRecordRegression(old,next),false);
});
test('storage failure rolls back live metadata and retains all original images',()=>{
    const {c,storage,deletedOriginals,alerts}=context();
    const before=storage.get('state');
    c.localStorage.setItem=()=>{throw Error('storage full');};
    c.deletePhoto('p1');
    assert.equal(c.photos.length,2);
    assert.equal(c.deletedJourneyRecords.photos.length,0);
    assert.equal(storage.get('state'),before);
    assert.deepEqual(deletedOriginals,[]);
    assert.deepEqual(alerts,['kept']);
});
test('failed primary write restores the previous pending checkpoint',()=>{
    const {c,storage,deletedOriginals}=context();
    const pending=JSON.stringify(fixture());storage.set('temp',pending);
    c.localStorage.setItem=(key,value)=>{if(key==='state')throw Error('primary rejected');storage.set(key,value);};
    c.deletePhoto('p1');
    assert.equal(storage.get('temp'),pending);
    assert.equal(c.photos.length,2);
    assert.deepEqual(deletedOriginals,[]);
    c.applyStatePayload(c.mergeJourneyStatePayloads([JSON.parse(storage.get('state')),JSON.parse(storage.get('temp'))]));
    assert.equal(c.photos.length,2);
});
test('primary AND pending rollback failure cannot resurrect an uncommitted deletion',()=>{
    const {c,storage,deletedOriginals}=context();
    let writes=0;
    c.localStorage.setItem=(key,value)=>{
        if(key==='state' || (key==='temp' && writes++ > 0)) throw Error('rejected');
        storage.set(key,value);
    };
    c.deletePhoto('p1');
    assert.equal(c.photos.length,2);
    assert.deepEqual(deletedOriginals,[]);
    c.applyStatePayload(c.mergeJourneyStatePayloads(['state','backup','temp'].map(key=>JSON.parse(storage.get(key)))));
    assert.equal(c.photos.length,2);
});
test('missing/numeric legacy memory IDs migrate, save and delete without resurrection',()=>{
    for(const legacy of [{time:123},{id:7,time:123}]) {
        const {c,storage}=context();
        const old=fixture();old.memories=[{...legacy,lat:37,lng:127,name:'legacy'}];
        storage.set('state',JSON.stringify(old));c.applyStatePayload(old);
        assert.equal(c.memories[0].id,'123');
        assert.equal(c.persistState(),true);
        c.deleteMemory('123');
        const saved=JSON.parse(storage.get('state'));
        c.applyStatePayload(c.mergeJourneyStatePayloads([old,saved]));
        assert.equal(c.memories.length,0);
    }
});
test('legacy/corrupt deletion fields do not authorize unrelated deletions',()=>{
    const {c}=context();
    assert.deepEqual(plain(c.mergeJourneyDeletionRecords([null,{photos:'p1',memories:[null,{},0,'m1','m1']}])) ,{memories:['m1'],photos:[]});
    const next=fixture();next.photos=[];next.deletedJourneyRecords={photos:['not-p1']};
    assert.equal(c.hasJourneyRecordRegression(fixture(),next),true);
    assert.equal(c.commitJourneyDeletion('rawGpsPoints','gps1'),false);
    assert.equal(c.commitJourneyDeletion('photos','missing'),false);
});
test('deletion save failure message exists in all six existing language dictionaries',()=>{
    for(const lang of ['ko','en','ja','zh','es','fr']) {
        assert.match(source,new RegExp('Object.assign\\(UI_TEXT\\.'+lang+', \\{ journey_delete_save_failed:"[^"\\n]+"'));
    }
});

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');

function functionSource(name) {
    const start = ['async function ', 'function '].map(prefix => source.indexOf(prefix + name + '(')).filter(i => i >= 0).sort((a, b) => a - b)[0];
    assert.notEqual(start, undefined, name);
    let depth = 0;
    for (let i = source.indexOf('{', start); i < source.length; i++) {
        if (source[i] === '{') depth++;
        if (source[i] === '}' && --depth === 0) return source.slice(start, i + 1);
    }
    throw new Error('Unclosed function: ' + name);
}
function deferred() {
    let resolve;
    const promise = new Promise(done => { resolve = done; });
    return { promise, resolve };
}
async function within(promise) {
    let timer;
    try { return await Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Photo import blocked')), 1000); })]); }
    finally { clearTimeout(timer); }
}
function core() {
    const events = [], canvases = [], rows = new Map(), elements = new Map();
    const context = {
        console: { log() {}, warn() {} }, Date, Math, Number, String, Promise, Blob, isFinite, GILOA_DEBUG: false,
        setTimeout: fn => setTimeout(fn, 0), clearTimeout,
        photos: [], activeImageMission: null, imageClassifierMeta: null,
        photoImageAnalysisQueue: Promise.resolve(), playerHeading: 0,
        PHOTO_THUMB_SIZE: 120, PHOTO_THUMB_JPEG_QUALITY: .74, PHOTO_THUMB_MIN_QUALITY: .58, PHOTO_THUMB_TARGET_BYTES: 24000,
        PHOTO_STORE_PREVIEW: true, PHOTO_POPUP_MAX_SIZE: 2048, PHOTO_POPUP_JPEG_QUALITY: .92, PHOTO_POPUP_MIN_QUALITY: .78, PHOTO_POPUP_TARGET_BYTES: 1600000,
        resizeImage: (_, opts) => opts.maxSize === 120 ? 'thumb' : 'preview',
        getPhotoContentFingerprint: () => 'fingerprint', normalizeHeading: x => x,
        idbSavePhoto: async (id, photo, thumb, originalBlob) => { rows.set(id, {photo, thumb, originalBlob}); events.push('stored'); },
        idbDeletePhoto: async id => rows.delete(id), requestMissingPhotoLocation: async () => 'unknown',
        createPhotoMarker: () => events.push('marker'), updateStats() {}, scheduleSave: () => events.push('save'), updatePhotoList() {},
        showGiloReaction() {}, uploadPhotoRemote: async () => {}, checkNearbyVisitCompletion() {},
        CustomEvent: function(type, init) { this.type = type; this.detail = init.detail; },
        window: { dispatchEvent: () => events.push('saved-event') },
        getPhotoInteractionText: () => ({ importProgress: 'Adding {current}/{total}', analysisAccepted: 'Recognized', analysisRetry: 'Retry' }),
        getReadableImagePredictionLabel: x => x, awardImagePredictionBadge: () => events.push('badge'), findPhotoMarker: () => null,
        classifyImportedImage: async () => null,
        document: {
            getElementById: id => elements.get(id), body: { appendChild: el => elements.set(el.id, el) },
            createElement: tag => {
                const el = { width: 0, height: 0, hidden: false, setAttribute() {}, getContext: () => ({ drawImage() {} }) };
                if (tag === 'canvas') canvases.push(el);
                return el;
            }
        }
    };
    vm.createContext(context);
    ['isValidPhotoCoordinate', 'normalizePhotoLocationSource', 'showPhotoImportProgress', 'hidePhotoImportProgress', 'awardPhotoImagePrediction', 'renderPhotoImagePrediction', 'schedulePhotoImageAnalysis', 'processPhoto'].forEach(name => vm.runInContext(functionSource(name), context));
    return { context, events, canvases, rows, elements };
}

for (const route of ['handlePhotos', 'importPhotosFromNativeUris']) {
    test(route + ': map and original storage complete while image analysis is still waiting', async () => {
        const {context: c, events, rows, elements} = core();
        const pending = deferred();
        c.classifyImportedImage = () => pending.promise;
        const original = new Blob(['original bytes with EXIF'], {type:'image/jpeg'});
        Object.assign(c, {
            getOriginalPhotoBlob: async () => original, consumeNativePhotoUri: () => 'content://fixture/1',
            describeNativePhotoUri: () => 'content://fixture',
            resolveNativePhotoMime: () => 'image/jpeg',
            clearNativePhotoUris() {}, syncRecordingUI() {}, showCollectionToast() {}, alert() {},
            inspectPhotoLocation: async () => ({gps:{lat:37.5,lng:127.1},photoDate:new Date(10000),location:{lat:37.5,lng:127.1,source:'exif'}}),
            convertHeicToJpegFile: async f => f, loadImageFromFile: async () => ({width:8000,height:6000}),
            nativeUriToFileName: () => 'fixture.jpg', blobAsNamedFile: b => b,
            focusPhotoOnMap: () => events.push('focused'), setSelectedDestination() {}, pendingCameraCaptureDate:null, pendingCameraCaptureLocation:null
        });
        vm.runInContext(functionSource(route), c);
        const event = {target:{id:'gallery-input',files:[original],value:'fixture'}};
        await within(route === 'handlePhotos' ? c.handlePhotos(event) : c.importPhotosFromNativeUris(['content://fixture/1']));
        assert.equal(c.photos.length, 1);
        const photo = c.photos[0];
        assert.equal(photo.locationSource, 'exif');
        assert.equal(photo.lat, 37.5);
        assert.equal(rows.get(photo.id).originalBlob, original);
        assert.equal(photo.imagePrediction, null);
        assert.ok(events.indexOf('stored') < events.indexOf('marker'));
        assert.ok(events.includes('focused'));
        assert.equal(elements.get('photo-import-progress').hidden, true);
        pending.resolve({label:'tree',percent:90,accepted:true});
        await c.photoImageAnalysisQueue;
        assert.equal(photo.imagePrediction.label, 'tree');
    });
}

test('failed storage never creates a marker or starts analysis', async () => {
    const {context:c,events,canvases} = core();
    c.idbSavePhoto = async () => { throw new Error('quota'); };
    await assert.rejects(c.processPhoto({}, new Date(),37,127,{deferImageAnalysis:true}), /quota/);
    assert.equal(c.photos.length,0);
    assert.equal(canvases.length,0);
    assert.ok(!events.includes('marker'));
});
test('cancelled location choice removes only the new photo and never queues analysis', async () => {
    const {context:c,rows,canvases} = core();
    const existing = {id:'existing'};
    c.photos.push(existing);
    c.requestMissingPhotoLocation = async () => 'cancel';
    assert.equal(await c.processPhoto({},new Date(),null,null,{deferImageAnalysis:true}), null);
    assert.equal(c.photos[0],existing);
    assert.equal(c.photos.length,1);
    assert.equal(rows.size,0);
    assert.equal(canvases.length,0);
});
test('analysis uses compact inputs, runs serially, and releases them after failure', async () => {
    const {context:c,canvases} = core();
    let active=0,maxActive=0,calls=0;
    c.classifyImportedImage = async input => {
        assert.equal(input.width,224); assert.equal(input.height,224);
        maxActive=Math.max(maxActive,++active);
        await new Promise(done=>setTimeout(done,5)); active--; calls++;
        if (calls===1) throw new Error('model failed');
        return {label:'tree'};
    };
    const a={id:'a'},b={id:'b'}; c.photos.push(a,b);
    c.schedulePhotoImageAnalysis(a,{width:8000,height:6000},null);
    c.schedulePhotoImageAnalysis(b,{width:8000,height:6000},null);
    await c.photoImageAnalysisQueue;
    assert.equal(maxActive,1); assert.equal(calls,2); assert.equal(b.imagePrediction.label,'tree');
    assert.ok(canvases.every(canvas=>canvas.width===0 && canvas.height===0));
});
test('deleted photos are not saved or awarded when delayed analysis finishes', async () => {
    const {context:c,events} = core();
    const pending=deferred(),started=deferred(), photo={id:'deleted'};
    c.photos.push(photo);
    c.classifyImportedImage=()=>{started.resolve(); return pending.promise;};
    c.schedulePhotoImageAnalysis(photo,{}, {name:'tree'});
    await started.promise;
    c.photos.length=0;
    pending.resolve({label:'tree',accepted:true});
    await c.photoImageAnalysisQueue;
    assert.equal(photo.imagePrediction,undefined);
    assert.ok(!events.includes('save')); assert.ok(!events.includes('badge'));
});
test('delayed recognition preserves mission badges and refreshes the existing popup', async () => {
    const {context:c,events} = core();
    const photo={id:'a'},element={}; c.photos.push(photo);
    c.classifyImportedImage=async()=>({label:'tree',percent:95,accepted:true});
    c.findPhotoMarker=()=>({_photoPredictionElement:element,isPopupOpen:()=>true,getPopup:()=>({update:()=>events.push('popup')})});
    c.schedulePhotoImageAnalysis(photo,{}, {name:'tree'});
    await c.photoImageAnalysisQueue;
    assert.ok(events.includes('badge')); assert.ok(events.includes('popup')); assert.ok(events.includes('save'));
    assert.equal(element.hidden,false); assert.match(element.textContent,/tree 95%/);
});
test('GPS and date reads overlap while EXIF location remains first priority', async () => {
    const {context:c} = core();
    const gps=deferred();
    c.getPhotoExifGps=()=>gps.promise;
    c.getPhotoExifDate=async()=>{gps.resolve({lat:35,lng:129});return new Date(10000);};
    vm.runInContext(functionSource('resolvePhotoLocation'),c);
    vm.runInContext(functionSource('inspectPhotoLocation'),c);
    const result=await within(c.inspectPhotoLocation({},'camera',new Date(),{lat:37,lng:127}));
    assert.equal(result.location.lat,35); assert.equal(result.location.source,'exif');
});
test('classifier releases input and output tensors on inference/readback failure', async () => {
    for (const failPredict of [true,false]) {
        const {context:c} = core(); const disposed=[];
        const input={dispose:()=>disposed.push('input')};
        for (const method of ['resizeBilinear','toFloat','div','sub','expandDims']) input[method]=()=>input;
        const prediction={data:async()=>{throw new Error('readback');},dispose:()=>disposed.push('output')};
        c.loadImageClassifier=async()=>({imageSize:224,model:{predict:()=>{if(failPredict)throw new Error('inference');return prediction;}}});
        c.promiseWithTimeout=p=>p;
        c.window.tf={tidy:fn=>fn(),browser:{fromPixels:()=>input}};
        vm.runInContext(functionSource('classifyImportedImage'),c);
        assert.equal(await c.classifyImportedImage({}),null);
        assert.ok(disposed.includes('input'));
        assert.equal(disposed.includes('output'),!failPredict);
    }
});

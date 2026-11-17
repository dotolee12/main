const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../features/gps/recording.js'),'utf8');
function fixture(){
    const calls=[],cleared=[],timers=[];
    const context={navigator:{geolocation:{
        watchPosition(ok,fail,options){calls.push({kind:'watch',ok,fail,options});return 7;},
        getCurrentPosition(ok,fail,options){calls.push({kind:'once',ok,fail,options});},
        clearWatch(id){cleared.push(id);}
    }},RESYNC_DURATION_MS:9000,RESYNC_TARGET_ACCURACY_M:20,
    setTimeout(fn){timers.push(fn);return timers.length;},clearTimeout(){}};
    vm.createContext(context);
    vm.runInContext(source.slice(source.indexOf('function acquireBestPosition('),source.indexOf('var locationResyncPending')),context);
    return {context,calls,cleared,timers};
}
const point=(accuracy,latitude=37.5)=>({coords:{latitude,longitude:127.1,accuracy},timestamp:Date.now()});
test('transient GPS failure waits for a simultaneous browser network fix',async()=>{
    const f=fixture(),result=f.context.acquireBestPosition();
    assert.deepEqual(f.calls.filter(c=>c.kind==='once').map(c=>c.options.enableHighAccuracy),[true,false]);
    f.calls[0].fail({code:2,message:'GPS unavailable'});
    const network=f.calls.find(c=>c.options.enableHighAccuracy===false);network.ok(point(15));
    assert.equal((await result).coords.accuracy,15);assert.deepEqual(f.cleared,[7]);
});
test('coarse initial fix is improved and stale callbacks cannot modify the final result',async()=>{
    const f=fixture(),improved=[],result=f.context.acquireBestPosition({onImproved:p=>improved.push(p.coords.accuracy)});
    f.calls[2].ok(point(1200));f.calls[0].ok(point(12));f.calls[2].ok(point(800));
    assert.equal((await result).coords.accuracy,12);assert.deepEqual(improved,[1200,12]);
});
test('permission denial cleans up promptly, with no network bypass',async()=>{
    const f=fixture(),result=f.context.acquireBestPosition(),failure={code:1};
    f.calls[0].fail(failure);await assert.rejects(result,e=>e.code===1);assert.deepEqual(f.cleared,[7]);
});
test('a silent location provider reaches the deadline, and invalid coordinates are rejected',async()=>{
    const f=fixture(),result=f.context.acquireBestPosition();f.calls[0].ok(point(5,NaN));f.timers[0]();
    await assert.rejects(result,e=>e.code===3);assert.deepEqual(f.cleared,[7]);
});
test('foreground watch restart preserves a valid status and ignores a late network fix after stop',()=>{
    let callback,handled=0;
    const c={foregroundLocationGeneration:0,watchId:null,isRecording:true,trackingRequested:true,
        recStatusBox:{textContent:'recording'},window:{isSecureContext:true},navigator:{geolocation:{
            watchPosition(){return 3;},clearWatch(){},getCurrentPosition(ok){callback=ok;}
        }},hasValidCurrentLocation:()=>true,handlePosition:()=>handled++,handleLocationError(){},earlyUiText:k=>k};
    vm.createContext(c);vm.runInContext(source.slice(source.indexOf('function startForegroundTracking('),source.indexOf('function startTracking(')),c);
    c.startForegroundTracking();assert.equal(c.recStatusBox.textContent,'recording');
    c.foregroundLocationGeneration++;c.isRecording=false;c.trackingRequested=false;callback(point(10));assert.equal(handled,0);
});

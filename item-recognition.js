/* The photo stays in a temporary worker. Network requests only load model assets. */
(function () {
    'use strict';
    var TYPES = {'cell phone':'phone',book:'book',cup:'coffee',bottle:'coffee','wine glass':'coffee',backpack:'bag',handbag:'bag',suitcase:'bag',bicycle:'bicycle',car:'car',banana:'food',apple:'food',sandwich:'food',orange:'food',broccoli:'food',carrot:'food','hot dog':'food',pizza:'food',donut:'food',cake:'food'};
    function pick(predictions,width,height) {
        if (!Array.isArray(predictions) || !(Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0)) return null;
        var ranked = predictions.slice(0,20).map(function(p) {
            if (!p || !Object.prototype.hasOwnProperty.call(TYPES,p.class) || !Number.isFinite(p.score) || p.score < 0.60 || !Array.isArray(p.bbox) || p.bbox.length !== 4 || !p.bbox.every(Number.isFinite)) return null;
            var x=p.bbox[0], y=p.bbox[1], w=p.bbox[2], h=p.bbox[3];
            var area = w*h/(width*height);
            if (w <= 0 || h <= 0 || area < 0.02 || x+w <= 0 || y+h <= 0 || x >= width || y >= height) return null;
            var center = Math.max(0,1-Math.hypot((x+w/2-width/2)/width,(y+h/2-height/2)/height));
            return {type:TYPES[p.class],score:p.score,rank:p.score*.6+Math.min(area,.65)*.3+center*.1};
        }).filter(Boolean).sort(function(a,b) { return b.rank-a.rank; });
        if (!ranked.length) return null;
        var rival = ranked.find(function(p) { return p.type !== ranked[0].type; });
        if (rival && ranked[0].rank-rival.rank < .08) return null;
        return {type:ranked[0].type,score:ranked[0].score};
    }
    function recognize(image,onPhase) {
        var worker = null, timer, settled = false, rejectTask;
        function cleanup() { clearTimeout(timer); if (worker) { worker.terminate(); worker = null; } }
        var promise = new Promise(function(resolve,reject) {
            rejectTask = reject;
            try {
                if (typeof Worker !== 'function') throw new Error('Worker unavailable');
                var width = image.naturalWidth, height = image.naturalHeight;
                if (!(Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0)) throw new Error('Photo unavailable');
                var ratio = Math.min(1,640/Math.max(width,height));
                var canvas = document.createElement('canvas'); canvas.width = Math.max(1,Math.round(width*ratio)); canvas.height = Math.max(1,Math.round(height*ratio));
                var context = canvas.getContext('2d'); context.drawImage(image,0,0,canvas.width,canvas.height);
                var pixels = context.getImageData(0,0,canvas.width,canvas.height).data;
                var sampleWidth = canvas.width, sampleHeight = canvas.height;
                canvas.width = canvas.height = 0;
                worker = new Worker(new URL('./item-recognition-worker.js?v=1',document.baseURI).href);
                worker.onmessage = function(event) {
                    if (settled) return;
                    var value = event.data || {};
                    if (value.phase) { if (onPhase) onPhase(value.phase); return; }
                    settled = true; cleanup();
                    if (value.error) reject(new Error('Recognition unavailable'));
                    else resolve(pick(value.predictions,sampleWidth,sampleHeight));
                };
                worker.onerror = function() { if (!settled) { settled = true; cleanup(); reject(new Error('Recognition unavailable')); } };
                timer = setTimeout(function() { if (!settled) { settled = true; cleanup(); reject(new Error('Recognition timed out')); } },90000);
                worker.postMessage({width:sampleWidth,height:sampleHeight,pixels:pixels.buffer},[pixels.buffer]);
            } catch (error) { settled = true; cleanup(); reject(error); }
        });
        return {promise:promise,cancel:function() { if (settled) return; settled = true; cleanup(); rejectTask(new Error('cancelled')); }};
    }
    window.GiloaItemRecognition = Object.freeze({recognize:recognize,pick:pick});
})();

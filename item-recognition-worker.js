/* Run on a dedicated CPU worker: never replace the app's existing TensorFlow runtime. */
'use strict';
self.onmessage = async function(event) {
    var data = event.data, input;
    try {
        if (!data || !Number.isInteger(data.width) || !Number.isInteger(data.height) || data.width < 1 || data.height < 1 || data.width > 640 || data.height > 640 || !(data.pixels instanceof ArrayBuffer) || data.pixels.byteLength !== data.width * data.height * 4) throw new Error('Invalid pixels');
        self.postMessage({phase:'loading'});
        importScripts('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js');
        importScripts('https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js');
        await tf.setBackend('cpu');
        await tf.ready();
        var model = await cocoSsd.load({base:'lite_mobilenet_v2',modelUrl:'https://storage.googleapis.com/tfjs-models/savedmodel/ssdlite_mobilenet_v2/model.json'});
        self.postMessage({phase:'analyzing'});
        var rgba = new Uint8Array(data.pixels), rgb = new Uint8Array(data.width * data.height * 3);
        for (var i = 0,j = 0; i < rgba.length; i += 4) { rgb[j++] = rgba[i]; rgb[j++] = rgba[i+1]; rgb[j++] = rgba[i+2]; }
        input = tf.tensor3d(rgb,[data.height,data.width,3],'int32');
        var predictions = await model.detect(input,10,0.5);
        self.postMessage({predictions:predictions.map(function(p) { return {class:p.class,score:p.score,bbox:p.bbox}; })});
    } catch (_) { self.postMessage({error:'unavailable'}); }
    finally { if (input) input.dispose(); self.close(); }
};

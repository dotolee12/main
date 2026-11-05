/* Photos stay in a temporary worker; only reviewed parking fields are saved by parking.js. */
(function () {
    'use strict';
    var engine;
    function parse(text) {
        var value = String(text || '').normalize('NFKC').toUpperCase().replace(/[‐‑–—]/g, '-');
        var match = value.match(/지하\s*(\d{1,2})\s*층?/) || value.match(/\bB\s*-?\s*(\d{1,2})(?:\s*F|\s*층)?(?!\d)\b/);
        var floor = match ? 'B' + match[1] : '';
        if (!floor) {
            match = value.match(/(?:지상\s*)?(\d{1,2})\s*(?:층|F\b)/);
            if (match) floor = match[1] + 'F';
        }
        var candidates = value.match(/\b[A-Z]{1,2}[ -]?\d{1,4}\b/g) || [];
        var zone = '';
        candidates.some(function (code) {
            if (code.replace(/[ -]/g, '') === floor) return false;
            zone = code.replace(/^([A-Z]+)[ -]?(\d+)$/, '$1-$2');
            return true;
        });
        if (!zone) {
            match = value.match(/(?:기둥|구역|ZONE|PILLAR|주차번호)\s*[:#-]?\s*(\d{1,4})\b/);
            if (match) zone = match[1];
        }
        return {floor:floor, zone:zone};
    }
    function loadEngine() {
        if (window.Tesseract) return Promise.resolve(window.Tesseract);
        if (engine) return engine;
        engine = new Promise(function (resolve, reject) {
            var script = document.createElement('script');
            var timer = setTimeout(fail, 20000);
            function fail() { clearTimeout(timer); script.remove(); engine = null; reject(new Error('OCR engine unavailable')); }
            script.src = new URL('./vendor/tesseract.min.js', document.baseURI).href;
            script.onload = function () { clearTimeout(timer); if (window.Tesseract) resolve(window.Tesseract); else fail(); };
            script.onerror = fail;
            document.head.appendChild(script);
        });
        return engine;
    }
    function recognize(blob) {
        var cancelled = false, worker, input = blob, timer;
        function stop() {
            input = null;
            if (worker) { var old = worker; worker = null; return old.terminate(); }
            return Promise.resolve();
        }
        var promise = (async function () {
            try {
                var api = await loadEngine();
                if (cancelled) throw new Error('cancelled');
                worker = await api.createWorker('kor+eng', 1, {
                    workerPath:new URL('./vendor/tesseract-worker.min.js', document.baseURI).href,
                    workerBlobURL:false,
                    corePath:'https://cdn.jsdelivr.net/npm/tesseract.js-core@6.0.0',
                    cacheMethod:'none'
                });
                if (cancelled) throw new Error('cancelled');
                var result = await worker.recognize(input);
                if (cancelled) throw new Error('cancelled');
                return parse(result.data.text);
            } finally { clearTimeout(timer); await stop(); }
        }());
        // The UI may cancel immediately while the engine or worker is still loading.
        var timeout = new Promise(function (_, reject) { timer = setTimeout(function () { cancelled = true; stop(); reject(new Error('OCR timed out')); }, 90000); });
        return {promise:Promise.race([promise, timeout]), cancel:function () { cancelled = true; clearTimeout(timer); stop(); }};
    }
    window.GiloaParkingOcr = {parse:parse, recognize:recognize};
}());

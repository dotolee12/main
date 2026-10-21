const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function functionSource(name) {
    const start = source.indexOf('function ' + name + '(');
    assert.notEqual(start, -1, name);
    let depth = 0;
    for (let i = source.indexOf('{', start); i < source.length; i++) {
        if (source[i] === '{') depth++;
        if (source[i] === '}' && --depth === 0) return source.slice(start, i + 1);
    }
    throw new Error('Unclosed function: ' + name);
}

function bundle() {
    return {
        courses: [{ crsIdx: 'near', crsKorNm: 'near trail' }],
        routes: { near: [[37, 127], [37.1, 127.1]] },
        routeBounds: { near: [37, 127, 37.1, 127.1] }
    };
}

function deferred() {
    let resolve;
    const promise = new Promise(done => { resolve = done; });
    return { promise, resolve };
}

function loader(protocol = 'https:', fetchImpl) {
    const requests = [], scripts = [], removed = [], drawn = [];
    const c = vm.createContext({
        window: { location: { protocol } },
        durunubiLocalBundlePromise: null,
        durunubiDiagnostics: {},
        fetch: (url, options) => {
            requests.push({ url, options });
            return fetchImpl ? fetchImpl(url, options) : Promise.resolve({ ok: true, json: async () => bundle() });
        },
        document: {
            createElement: tag => {
                assert.equal(tag, 'script');
                const script = { remove: () => removed.push(script) };
                return script;
            },
            head: { appendChild: script => scripts.push(script) }
        },
        mapLayerSettings: { durunubi: false },
        durunubiRouteLayers: [],
        durunubiRequestSeq: 0,
        durunubiVisibleBundle: null,
        durunubiLayerGroup: { clearLayers() {} },
        completedOfficialLayerGroup: { clearLayers() {} },
        renderedOfficialRoutes: [],
        completedOfficialMatchCache: null,
        clearDurunubiCanvas() {},
        setDurunubiBadge() {},
        getDurunubiText: () => ({ failed: 'failed', route: 'route' }),
        fetchDurunubiCourses: async () => { throw new Error('Unexpected external course API request'); },
        console: { warn() {} },
        renderNearbyDurunubiRoutes: () => drawn.push(c.durunubiVisibleBundle)
    });
    for (const name of ['loadDurunubiLocalScriptBundle', 'loadDurunubiLocalBundle', 'refreshDurunubiForMap', 'clearDurunubiRoutes']) {
        vm.runInContext(functionSource(name), c);
    }
    return { c, requests, scripts, removed, drawn };
}

test('startup HTML does not request route JS and disabled layer performs no data work', async () => {
    assert.doesNotMatch(html, /<script\b[^>]*\bsrc=["'][^"']*durunubi-routes\.js/i);
    for (const protocol of ['file:', 'http:', 'https:']) {
        const { c, requests, scripts } = loader(protocol);
        assert.equal(await c.refreshDurunubiForMap(true), false);
        assert.equal(requests.length, 0);
        assert.equal(scripts.length, 0);
    }
});

for (const protocol of ['http:', 'https:']) {
    test(protocol + ' first request shares one JSON load and reuses resolved bundle', async () => {
        const pending = deferred();
        const data = bundle();
        const { c, requests, scripts } = loader(protocol, () => pending.promise);
        const first = c.loadDurunubiLocalBundle();
        assert.equal(c.loadDurunubiLocalBundle(), first);
        assert.equal(requests.length, 1);
        assert.equal(requests[0].url, './data/durunubi-routes.json');
        assert.equal(requests[0].options.cache, 'no-store');
        assert.equal(scripts.length, 0);
        pending.resolve({ ok: true, json: async () => data });

        assert.equal(await first, data);
        assert.equal(await c.loadDurunubiLocalBundle(), data);
        assert.equal(requests.length, 1);
        assert.equal(c.durunubiDiagnostics.routes, 1);
        assert.equal(c.durunubiDiagnostics.points, 2);
    });
}

test('file first request injects one packaged script and never fetches JSON', async () => {
    const { c, requests, scripts, removed } = loader('file:');
    const first = c.loadDurunubiLocalBundle();
    assert.equal(c.loadDurunubiLocalBundle(), first);
    assert.equal(scripts.length, 1);
    assert.equal(scripts[0].src, './data/durunubi-routes.js');
    assert.equal(scripts[0].async, true);
    const data = bundle();
    c.window.GILOA_DURUNUBI_BUNDLE = data;
    scripts[0].onload();

    assert.equal(await first, data);
    assert.equal(await c.loadDurunubiLocalBundle(), data);
    assert.equal(requests.length, 0);
    assert.deepEqual(removed, [scripts[0]]);
    assert.equal(scripts[0].onload, null);
    assert.equal(scripts[0].onerror, null);
    assert.equal(scripts.length, 1);
});

for (const failure of ['network', 'http', 'json', 'empty']) {
    test('JSON ' + failure + ' failure clears shared promise so a later request can retry', async () => {
        let attempts = 0;
        const { c, requests } = loader('https:', async () => {
            attempts++;
            if (attempts === 1) {
                if (failure === 'network') throw new Error('offline');
                if (failure === 'http') return { ok: false, status: 404 };
                if (failure === 'json') return { ok: true, json: async () => { throw new Error('Invalid JSON'); } };
                return { ok: true, json: async () => ({ routes: {} }) };
            }
            return { ok: true, json: async () => bundle() };
        });

        await assert.rejects(c.loadDurunubiLocalBundle());
        assert.equal(c.durunubiLocalBundlePromise, null);
        assert.ok(c.durunubiDiagnostics.error);
        const recovered = await c.loadDurunubiLocalBundle();
        assert.ok(recovered.routes.near);
        assert.equal(c.durunubiDiagnostics.error, '');
        assert.equal(requests.length, 2);
    });
}

for (const failure of ['load', 'missing', 'empty']) {
    test('file script ' + failure + ' failure removes loader and permits a valid retry', async () => {
        const { c, scripts, removed, requests } = loader('file:');
        const first = c.loadDurunubiLocalBundle();
        const rejected = assert.rejects(first);
        if (failure === 'load') scripts[0].onerror();
        else {
            if (failure === 'empty') c.window.GILOA_DURUNUBI_BUNDLE = { routes: {} };
            scripts[0].onload();
        }
        await rejected;
        assert.equal(c.durunubiLocalBundlePromise, null);
        assert.deepEqual(removed, [scripts[0]]);

        const retry = c.loadDurunubiLocalBundle();
        assert.equal(scripts.length, 2);
        c.window.GILOA_DURUNUBI_BUNDLE = bundle();
        scripts[1].onload();
        assert.ok((await retry).routes.near);
        assert.equal(c.durunubiDiagnostics.error, '');
        assert.equal(removed.length, 2);
        assert.equal(requests.length, 0);
    });
}

test('turning trails off during lazy load keeps them hidden and enabling again reuses data', async () => {
    const pending = deferred();
    const { c, requests, drawn } = loader('https:', () => pending.promise);
    c.mapLayerSettings.durunubi = true;
    const refresh = c.refreshDurunubiForMap(true);
    c.mapLayerSettings.durunubi = false;
    c.clearDurunubiRoutes();
    pending.resolve({ ok: true, json: async () => bundle() });

    assert.equal(await refresh, false);
    assert.equal(c.durunubiVisibleBundle, null);
    assert.equal(drawn.length, 0);
    c.mapLayerSettings.durunubi = true;
    assert.equal(await c.refreshDurunubiForMap(true), true);
    assert.equal(drawn.length, 1);
    assert.equal(requests.length, 1);
    assert.equal(drawn[0].routes.near.length, 2);
});

test('lazy-loaded routes still follow viewport and zoom selection when rendered', async () => {
    const { c } = loader();
    const data = bundle();
    data.courses.push({ crsIdx: 'far' }, { crsIdx: 'zoom', sourceType: 'majorPeak' });
    data.routes.far = [[1, 2], [2, 3]];
    data.routes.zoom = [[37, 127], [37.1, 127.1]];
    data.routeBounds.far = [1, 2, 2, 3];
    data.routeBounds.zoom = data.routeBounds.near;
    const drawnIds = [];
    const viewport = {};
    Object.assign(c, {
        map: { getBounds: () => ({ pad: () => viewport }), getZoom: () => 10 },
        MAP_VIEWPORT_ROUTE_LIMIT: 10,
        OFFICIAL_ROUTE_STYLES: { durunubi: { minZoom: 8 }, majorPeak: { minZoom: 12 } },
        isDurunubiBoundsInViewport: (bounds, view) => { assert.equal(view, viewport); return bounds[0] > 30; },
        isDurunubiRouteInViewport: (points, view) => { assert.equal(view, viewport); return points[0][0] > 30; },
        drawDurunubiCourse: course => { drawnIds.push(course.crsIdx); return true; },
        renderCompletedOfficialRoutes() {}
    });
    vm.runInContext(functionSource('renderNearbyDurunubiRoutes'), c);
    c.window.GILOA_DURUNUBI_BUNDLE = data;
    c.mapLayerSettings.durunubi = true;

    assert.equal(await c.refreshDurunubiForMap(true), true);
    assert.deepEqual(drawnIds, ['near']);
    assert.equal(c.durunubiDiagnostics.drawn, 1);
});

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');
const origin = 'https://giloa.test';

function worker(options = {}) {
    const listeners = new Map();
    const stores = new Map();
    const deleted = [];
    const downloaded = [];
    const fetches = [];
    const lifecycle = [];
    function cacheKey(request) {
        return new URL(typeof request === 'string' ? request : request.url, origin + '/').href;
    }
    async function fetchMock(request) {
        const key = cacheKey(request);
        fetches.push(key);
        if (options.fetch) return options.fetch(key);
        return new Response('asset: ' + key);
    }
    function createCache() {
        const entries = new Map();
        return {
            entries,
            async add(request) {
                downloaded.push(cacheKey(request));
                assert.equal(request.cache, 'reload');
                const response = await fetchMock(request);
                if (!response.ok) throw new Error('Required asset failed: ' + request.url);
                if (options.failWrite === new URL(request.url).pathname) throw new Error('Cache storage quota');
                entries.set(cacheKey(request), response);
            },
            async put(request, response) { entries.set(cacheKey(request), response); },
            async match(request, matchOptions = {}) {
                const key = cacheKey(request);
                if (!matchOptions.ignoreSearch) return entries.get(key);
                return [...entries].find(([entry]) => entry.split('?')[0] === key.split('?')[0])?.[1];
            },
            async keys() { return [...entries.keys()]; },
            async delete(request) { return entries.delete(cacheKey(request)); }
        };
    }
    const caches = {
        async open(name) {
            if (!stores.has(name)) stores.set(name, createCache());
            return stores.get(name);
        },
        async keys() { return [...stores.keys()]; },
        async delete(name) { deleted.push(name); return stores.delete(name); }
    };
    const context = vm.createContext({
        caches, fetch: fetchMock, URL, Response, setTimeout, clearTimeout,
        Request: class extends Request {
            constructor(input, init) { super(new URL(input, origin + '/'), init); }
        },
        self: {
            location: { origin },
            addEventListener: (name, listener) => listeners.set(name, listener),
            async skipWaiting() { lifecycle.push('skipWaiting'); },
            clients: { async claim() { lifecycle.push('claim'); } }
        }
    });
    vm.runInContext(source, context, { filename: 'sw.js' });
    function dispatch(name, details = {}) {
        const waiting = [];
        let response;
        listeners.get(name)({
            ...details,
            waitUntil: promise => waiting.push(promise),
            respondWith: promise => { response = promise; }
        });
        return {
            async complete() {
                const result = response ? await response : undefined;
                await Promise.all(waiting);
                return result;
            }
        };
    }
    return { context, caches, stores, deleted, downloaded, fetches, lifecycle, dispatch };
}

async function within(promise) {
    let timer;
    try {
        return await Promise.race([
            promise,
            new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Activation blocked by optional download')), 1000); })
        ]);
    } finally { clearTimeout(timer); }
}

for (const failure of ['http', 'network', 'storage']) {
    test('required script ' + failure + ' failure rejects update and preserves previous caches', async () => {
        const sw = worker({
            failWrite: failure === 'storage' ? '/script.js' : undefined,
            fetch: async key => {
                if (new URL(key).pathname === '/script.js') {
                    if (failure === 'http') return new Response('missing', { status: 404 });
                    if (failure === 'network') throw new Error('offline');
                }
                return new Response('required asset');
            }
        });
        const priorName = 'giloa-app-shell-v222';
        const prior = await sw.caches.open(priorName);
        await prior.put('./script.js', new Response('previous working script'));
        await sw.caches.open('giloa-runtime-v75');
        await sw.caches.open('giloa-map-tiles-v5');

        await assert.rejects(sw.dispatch('install').complete(), /Required asset failed|offline|Cache storage quota/);

        assert.deepEqual(sw.lifecycle, []);
        assert.deepEqual(sw.deleted, []);
        assert.equal(await (await prior.match('./script.js')).text(), 'previous working script');
        assert.ok(sw.stores.has(priorName));
        assert.ok(sw.stores.has('giloa-runtime-v75'));
        assert.ok(sw.stores.has('giloa-map-tiles-v5'));
    });
}

test('successful update caches every required asset before activation and only removes outdated app caches', async () => {
    const sw = worker();
    const oldNames = ['giloa-app-shell-v222', 'giloa-runtime-v74', 'giloa-map-tiles-v4'];
    const retainedNames = [sw.context.RUNTIME_CACHE, sw.context.TILE_CACHE, 'other-app-cache', 'giloa-user-photos'];
    for (const name of [...oldNames, ...retainedNames]) await sw.caches.open(name);

    await sw.dispatch('install').complete();

    const core = Array.from(sw.context.CORE_ASSETS, asset => new URL(asset, origin + '/').href);
    const optional = Array.from(sw.context.OPTIONAL_CORE_ASSETS, asset => new URL(asset, origin + '/').href);
    assert.deepEqual(sw.downloaded, [...core, ...optional]);
    assert.deepEqual(sw.fetches, [...core, ...optional]);
    const shell = await sw.caches.open(sw.context.APP_CACHE);
    for (const asset of core) assert.ok(await shell.match(asset), asset);
    assert.deepEqual(sw.lifecycle, ['skipWaiting']);
    assert.deepEqual(sw.deleted, []);

    await sw.dispatch('activate').complete();

    assert.deepEqual(sw.lifecycle, ['skipWaiting', 'claim']);
    assert.deepEqual(sw.deleted.sort(), oldNames.sort());
    for (const name of [...retainedNames, sw.context.APP_CACHE]) assert.ok(sw.stores.has(name), name);
    assert.deepEqual(sw.fetches, [...core, ...optional]);
});

test('activation completes while optional asset requests would hang indefinitely', async () => {
    const pending = new Promise(() => {});
    const sw = worker({
        fetch: key => new URL(key).pathname === '/script.js' ? Promise.resolve(new Response('script')) : pending
    });
    await sw.caches.open(sw.context.APP_CACHE);
    await sw.caches.open('giloa-app-shell-v222');

    await within(sw.dispatch('activate').complete());

    assert.deepEqual(sw.lifecycle, ['claim']);
    assert.deepEqual(sw.fetches, []);
    assert.ok(sw.stores.has(sw.context.APP_CACHE));
    assert.deepEqual(sw.deleted, ['giloa-app-shell-v222']);
});

test('optional route data is downloaded and cached only when requested', async () => {
    const sw = worker();
    await sw.dispatch('install').complete();
    await sw.dispatch('activate').complete();
    const asset = origin + '/data/durunubi-routes.json';
    assert.ok(!sw.fetches.includes(asset));

    const response = await sw.dispatch('fetch', { request: new Request(asset) }).complete();

    assert.equal(await response.text(), 'asset: ' + asset);
    const runtime = await sw.caches.open(sw.context.RUNTIME_CACHE);
    assert.ok(await runtime.match(asset));
    assert.equal(sw.fetches.filter(url => url.includes('durunubi-routes')).length, 1);
});

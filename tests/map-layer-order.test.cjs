const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
function fixture(saved, fail) {
    const key = 'giloa-map-layer-order-v1';
    const storage = new Map([[key, saved], ['giloa-gpx-saves', 'existing routes'], ['giloa-collection', 'existing items']]);
    let alerts = 0;
    const context = { localStorage: {
        getItem: name => storage.get(name),
        setItem: (name, value) => { if (fail) throw Error('Quota'); storage.set(name, value); }
    }, currentLang:'ko', normalizeLang: lang => lang, window:{ alert: () => alerts++ }, document:{ getElementById: () => null } };
    vm.createContext(context);
    vm.runInContext('const MAP_LAYER_ORDER_KEY = "' + key + '";\n' + source.slice(source.indexOf('var MAP_LAYER_TILE_KEYS ='), source.indexOf('function mapLayerMenuIcon')), context);
    return { context, storage, key, alerts: () => alerts, order: () => Array.from(context.loadMapLayerTileOrder()) };
}
test('tile order keeps each supported tile once and appends late medical tiles', () => {
    const f = fixture(JSON.stringify(['tourism','tourism','unknown','community']));
    const order = f.order();
    assert.equal(order.length, 12);
    assert.equal(new Set(order).size, 12);
    assert.deepEqual(order.slice(0, 2), ['tourism','community']);
    assert.ok(order.includes('hospital') && order.includes('pharmacy'));
});
test('corrupt or unavailable saved order restores all tiles', () => {
    for (const saved of ['broken','null','{}',undefined]) assert.equal(fixture(saved).order().length, 12);
});
test('moving community persists one adjacent swap without modifying route or item storage', () => {
    const f = fixture('[]'), before = f.order();
    f.context.moveMapLayerTile('community', -1);
    const expected = before.slice();
    [expected[10],expected[11]] = [expected[11],expected[10]];
    assert.deepEqual(JSON.parse(f.storage.get(f.key)), expected);
    assert.equal(f.storage.get('giloa-gpx-saves'), 'existing routes');
    assert.equal(f.storage.get('giloa-collection'), 'existing items');
    f.context.moveMapLayerTile('hospital', -1);
    f.context.moveMapLayerTile('hospital', 2);
    assert.deepEqual(JSON.parse(f.storage.get(f.key)), expected);
});
test('storage failure reports the error and leaves the previous saved order intact', () => {
    const f = fixture('[]', true);
    f.context.moveMapLayerTile('pharmacy', 1);
    assert.equal(f.alerts(), 1);
    assert.equal(f.storage.get(f.key), '[]');
});

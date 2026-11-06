const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");
const vm = require("node:vm");

const source = fs.readFileSync("features/places/restaurant-coverage.js", "utf8");
const flush = () => new Promise(resolve => setImmediate(resolve));

function setup() {
    const markers = [];
    const active = new Set();
    const layer = { clearLayers() { markers.length = 0; }, addTo() { active.add(layer); } };
    const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]) * 100000;
    const center = { lat: 37, lng: 127, distanceTo: position => distance([37, 127], position) };
    const requests = [];
    const context = {
        L: {
            layerGroup: () => layer, divIcon: icon => icon,
            marker(position) {
                return { position, addTo() { markers.push(this); return this; },
                    bindTooltip(label) { this.label = label.textContent; }, on() {} };
            }
        },
        map: { distance, getBounds: () => ({ contains: () => true }),
            hasLayer: item => active.has(item), removeLayer: item => active.delete(item) },
        getMapSearchCenter: () => center,
        currentLang: "en", normalizeLang: lang => lang,
        getTourDisplayTitle: item => item.title, getTourTypeMeta: () => ({}),
        mapPlaceSymbolHtml: () => "",
        document: { createElement: () => ({}) },
        tourItems: [{ title: "Existing Place", mapx: 127, mapy: 37, contenttypeid: 39 }],
        mapLayerSettings: { restaurant: true }, navigator: { onLine: true },
        AbortController, URLSearchParams, setTimeout, clearTimeout,
        fetch(url, options) {
            return new Promise(resolve => requests.push({ options, resolve }));
        }
    };
    vm.createContext(context);
    vm.runInContext(source, context);
    return { context, markers, active, requests };
}

function restaurant(name, lat, extra = {}) {
    return { lat, lon: 127, tags: { name, amenity: "restaurant", ...extra } };
}

function respond(request, elements) {
    request.resolve({ ok: true, json: async () => ({ elements }) });
}

test("only adds nearby named restaurants missing from the current food layer", async () => {
    const { context, markers, active, requests } = setup();
    context.restaurantCoverage.refresh();
    context.restaurantCoverage.refresh();
    assert.equal(requests.length, 1);
    assert.match(requests[0].options.body.get("data"), /around:1500,37\.000,127\.000/);
    respond(requests[0], [
        restaurant("existing-place", 37.0001),
        restaurant("새 식당", 37.001, { "name:en": "New Restaurant" }),
        restaurant("새 식당", 37.0011),
        { center: { lat: 37.003, lon: 127 }, tags: { name: "Way Restaurant", amenity: "restaurant" } },
        restaurant("Too far", 37.05),
        restaurant("Cafe", 37.001, { amenity: "cafe" }),
        restaurant("", 37.001)
    ]);
    await flush();
    assert.deepEqual(markers.map(marker => marker.label), ["New Restaurant", "Way Restaurant"]);
    assert.equal(active.size, 1);

    context.tourItems.push({ title: "새 식당", mapx: 127, mapy: 37.001, contenttypeid: "39" });
    context.restaurantCoverage.refresh();
    assert.deepEqual(markers.map(marker => marker.label), ["Way Restaurant"]);
    assert.equal(requests.length, 1);
});

test("disabling the food layer aborts the request and ignores late results", async () => {
    const { context, markers, active, requests } = setup();
    context.restaurantCoverage.refresh();
    context.mapLayerSettings.restaurant = false;
    context.restaurantCoverage.refresh();
    assert.equal(requests[0].options.signal.aborted, true);
    respond(requests[0], [restaurant("Late Restaurant", 37.001)]);
    await flush();
    assert.equal(markers.length, 0);
    assert.equal(active.size, 0);
});

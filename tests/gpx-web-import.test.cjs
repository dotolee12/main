const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { JSDOM } = require(process.env.GPX_TEST_DEPS ? path.join(process.env.GPX_TEST_DEPS, "jsdom") : "jsdom");

const read = file => fs.readFileSync(path.join(__dirname, "..", file), "utf8");
const html = read("index.html");
const access = read("gpx-access.js");
const routes = read("features/gpx/routes.js");
const example = process.env.GILOA_GPX_TEST_FILE
    ? fs.readFileSync(process.env.GILOA_GPX_TEST_FILE, "utf8")
    : '<gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1"><trk><trkseg><trkpt lat="34.74" lon="127.74"/><trkpt lat="34.75" lon="127.75"/></trkseg></trk></gpx>';

function fixture(native = false) {
    const dom = new JSDOM(html, { url:"https://giloa.test", runScripts:"outside-only" });
    const w = dom.window;
    const layers = new Set();
    const layer = () => ({ addTo() { layers.add(this); return this; }, bindTooltip() { return this; } });
    let trips = 0;
    Object.assign(w, {
        isNativeApp:() => native,
        currentLang:"ko",
        UI_TEXT:{ ko:{gpx_empty:"Empty", gpx_showing:"Showing", gpx_route:"Route", gpx_points:"points", gpx_delete:"Delete"} },
        GPX_SAVES_KEY:"giloa-gpx-saves", GPX_IMPORT_MAX_BYTES:10*1024*1024,
        activeGpxLayers:[], activeGpxId:null, escapeHtml:text => text, earlyUiText:key => key, toggleSidebar() {}, switchAllTab() {},
        map:{removeLayer(item) { layers.delete(item); }, fitBounds() {}},
        L:{polyline:layer, circleMarker:layer, latLngBounds:() => ({ extend() {}, isValid:() => true })},
        GiloaTrip:{open() { trips++; }, close() {}}
    });
    w.eval(access);
    w.eval(routes);
    const byId = id => w.document.getElementById(id);
    return { dom, w, layers, byId, trips:() => trips };
}

test("web import draws and reopens a GPX without opening the export or trip ZIP gate", async () => {
    const { dom, w, layers, byId, trips } = fixture();
    try {
        const exported = { id:"1710000000000abc", name:"Private recording", createdAt:1710000000000, pointCount:2, gpxContent:example };
        const imported = { ...exported, id:"1710000000001", name:"Earlier import" };
        w.saveGpxSaves([exported, imported]);
        w.GiloaGpxAccess.refresh();
        assert.equal(byId("gpx-import-content").hidden, false);
        assert.equal(byId("gpx-access-content").hidden, true);
        assert.equal(byId("gpx-access-form").hidden, false);
        assert.match(byId("gpx-saved-list").textContent, /Earlier import/);
        assert.doesNotMatch(byId("gpx-saved-list").textContent, /Private recording/);

        let picked = false;
        byId("gpx-file-input").click = () => { picked = true; };
        assert.equal(byId("gpx-import-btn").getAttribute("onclick"), "chooseGpxFile()");
        w.chooseGpxFile();
        assert.equal(picked, true);
        w.importGpxFile({ target:{files:[new w.File([example], "GILOA_Yeosu_Walk.gpx")], value:""} });
        for (let i = 0; i < 30 && !w.activeGpxId; i++) await new Promise(resolve => setTimeout(resolve, 10));
        assert.match(byId("gpx-import-status").textContent, /불러오기 완료/);
        assert.ok(layers.size > 2);
        const saved = w.loadGpxSaves();
        assert.equal(saved.length, 3);
        assert.equal(saved[2].source, "import");
        assert.equal(saved[2].gpxContent, example);

        w.clearActiveGpxRoute();
        byId("gpx-saved-list").firstElementChild.click();
        assert.equal(w.activeGpxId, saved[2].id);
        assert.equal(trips(), 0);
        w.clearActiveGpxRoute();
        w.toggleGpxRoute(exported);
        w.exportGpx();
        assert.equal(w.activeGpxId, null);
        assert.equal(w.GiloaGpxAccess.isAuthorized(), false);
        assert.deepEqual(JSON.parse(JSON.stringify(w.loadGpxSaves())), JSON.parse(JSON.stringify(saved)));
    } finally { dom.window.close(); }
});

test("native runtime still requires an issued ID for import", () => {
    const { dom, w, byId } = fixture(true);
    try {
        w.GiloaGpxAccess.refresh();
        assert.equal(w.GiloaGpxAccess.canImport(), false);
        assert.equal(byId("gpx-import-content").hidden, true);
        byId("gpx-file-input").click = () => assert.fail("file picker opened without access");
        w.chooseGpxFile();
    } finally { dom.window.close(); }
});

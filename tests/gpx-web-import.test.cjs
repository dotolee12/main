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
    const layer = coordinates => ({
        coordinates, addTo() { layers.add(this); return this; }, bindTooltip() { return this; },
        bindPopup(content) { this.popup = content; return this; }
    });
    let trips = 0;
    Object.assign(w, {
        isNativeApp:() => native,
        currentLang:"ko",
        UI_TEXT:{ ko:{gpx_empty:"Empty", gpx_showing:"Showing", gpx_route:"Route", gpx_points:"points", gpx_delete:"Delete"} },
        GPX_SAVES_KEY:"giloa-gpx-saves", GPX_IMPORT_MAX_BYTES:10*1024*1024,
        activeGpxLayers:[], activeGpxId:null, escapeHtml:text => text, earlyUiText:key => key, toggleSidebar() {}, switchAllTab() {},
        map:{removeLayer(item) { layers.delete(item); }, fitBounds() {}},
        L:{polyline:layer, circleMarker:layer, marker:layer, divIcon:options => options, latLngBounds:() => ({ extend() {}, isValid:() => true })},
        GiloaTrip:{open() { trips++; }, close() {}}
    });
    w.eval(access);
    w.eval(routes);
    const byId = id => w.document.getElementById(id);
    return { dom, w, layers, byId, trips:() => trips };
}

test("web opens GPX import, export, saved routes and trip tools without an issued ID", async () => {
    const { dom, w, layers, byId, trips } = fixture();
    try {
        const exported = { id:"1710000000000abc", name:"Private recording", createdAt:1710000000000, pointCount:2, gpxContent:example };
        const imported = { ...exported, id:"1710000000001", name:"Earlier import" };
        w.saveGpxSaves([exported, imported]);
        w.GiloaGpxAccess.refresh();
        assert.equal(byId("gpx-import-content").hidden, false);
        assert.equal(byId("gpx-access-content").hidden, false);
        assert.equal(byId("gpx-access-form").hidden, true);
        assert.match(byId("gpx-saved-list").textContent, /Earlier import/);
        assert.match(byId("gpx-saved-list").textContent, /Private recording/);
        assert.equal(byId("gpx-access-lock").hidden, true);

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
        assert.ok(trips() > 0);
        w.clearActiveGpxRoute();
        w.toggleGpxRoute(exported);
        assert.equal(w.activeGpxId, exported.id);
        assert.equal(w.GiloaGpxAccess.requireAccess(), true);
        assert.equal(w.GiloaGpxAccess.isAuthorized(), true);
        assert.deepEqual(JSON.parse(JSON.stringify(w.loadGpxSaves())), JSON.parse(JSON.stringify(saved)));
    } finally { dom.window.close(); }
});

test("web GPX import renders embedded photos without EXIF, including photos sharing a location", async () => {
    const { dom, w, layers, byId, trips } = fixture();
    try {
        const input = process.env.GILOA_GPX_PHOTO_TEST_FILE
            ? fs.readFileSync(process.env.GILOA_GPX_PHOTO_TEST_FILE, "utf8")
            : `<gpx xmlns="http://www.topografix.com/GPX/1/1" xmlns:g="https://giloa.kr/ns/gpx-photo/1">
                <wpt lat="34.59" lon="127.80"><name>&lt;script&gt;</name><extensions>
                    <g:photo credit="Credit" source="javascript:alert(1)">/9j/</g:photo></extensions></wpt>
                <wpt lat="34.59" lon="127.80"><name>Second photo</name><extensions>
                    <g:photo credit="Credit" source="https://example.com/photo">/9j/</g:photo></extensions></wpt>
                <wpt lat="34.60" lon="127.80"><extensions><g:photo>invalid</g:photo></extensions></wpt>
                <trk><trkseg><trkpt lat="34.58" lon="127.81"/><trkpt lat="34.59" lon="127.81"/></trkseg></trk>
            </gpx>`;
        w.importGpxFile({ target:{files:[new w.File([input], "Trip.gpx")], value:""} });
        for (let i = 0; i < 50 && !w.activeGpxId; i++) await new Promise(resolve => setTimeout(resolve, 10));
        assert.match(byId("gpx-import-status").textContent, /불러오기 완료/);
        const pins = () => [...layers].filter(item => item.popup);
        const images = () => pins().flatMap(pin => [...pin.popup.querySelectorAll("img")]);
        const isYeosu = !!process.env.GILOA_GPX_PHOTO_TEST_FILE;
        assert.equal(pins().length, isYeosu ? 9 : 1);
        assert.equal(images().length, isYeosu ? 10 : 2);
        assert.ok(images().every(image => image.src.startsWith("data:image/jpeg;base64,/9j/")));
        assert.ok(pins().some(pin => pin.popup.querySelectorAll("img").length === 2));
        if (!isYeosu) {
            assert.equal(pins()[0].popup.querySelector("strong").textContent, "<script>");
            assert.equal(pins()[0].popup.querySelector("script"), null);
            assert.equal(pins()[0].popup.querySelectorAll("a").length, 1);
        }
        w.clearActiveGpxRoute();
        assert.equal(layers.size, 0);
        byId("gpx-saved-list").firstElementChild.click();
        assert.equal(images().length, isYeosu ? 10 : 2);
        assert.ok(trips() > 0);
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

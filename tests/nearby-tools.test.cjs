const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const deps = process.env.GPX_TEST_DEPS;
const dependency = name => require(deps ? path.join(deps, name) : name);
const {JSDOM} = dependency("jsdom");
const {IDBFactory, IDBKeyRange} = dependency("fake-indexeddb");
const root = path.join(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const tick = () => new Promise(resolve => setTimeout(resolve, 25));
async function fixture() {
    const dom = new JSDOM('<html lang="ko"><body><div id="sidebar"><div class="sidebar-header"></div></div></body></html>', {url:"https://giloa.test/", runScripts:"outside-only"});
    const w = dom.window, factory = new IDBFactory(), events = {}, routes = [];
    let opens = 0, terminated = 0, workers = 0;
    w.indexedDB = {open(...args) { opens++; return factory.open(...args); }};
    w.IDBKeyRange = IDBKeyRange;
    w.currentLang = "ko";
    w.toggleSidebar = () => {};
    w.confirm = () => true;
    w.map = {createPane(){}, getPane:() => ({style:{}}), on:(name, callback) => { events[name] = callback; }, wrapLatLng:p => p, setView(){}, fitBounds(){}};
    w.L = {
        DomEvent:{disableClickPropagation(){}},
        layerGroup:() => ({addTo(){return this;}, clearLayers(){}}),
        marker:() => ({addTo(){return this;}, bindPopup(){return this;}, on(){}, openPopup(){}}),
        polyline:coords => ({addTo(){routes.push(coords); return this;}}),
        circleMarker:() => ({addTo(){return this;}, bindTooltip(){return this;}})
    };
    w.Worker = class {
        constructor(url) { assert.equal(url.pathname, "/features/explore/walk-worker.js"); this.dead = false; workers++; }
        terminate() { this.dead = true; terminated++; }
        postMessage(data) {
            setTimeout(() => {
                if (this.dead) return;
                const context = vm.createContext({});
                context.self = {postMessage:result => { if (!this.dead) this.onmessage({data:result}); }};
                context.importScripts = () => vm.runInContext(read("features/explore/walk-core.js"), context);
                vm.runInContext(read("features/explore/walk-worker.js"), context);
                context.self.onmessage({data});
            }, 5);
        }
    };
    // Old v1 records must survive the additive v2 index upgrade.
    await new Promise((resolve, reject) => {
        const request = factory.open("giloa-belongings-v1", 1);
        request.onupgradeneeded = () => request.result.createObjectStore("items", {keyPath:"id"});
        request.onsuccess = () => {
            const db = request.result, tx = db.transaction("items", "readwrite");
            for (let i = 0; i < 35; i++) tx.objectStore("items").put({id:String(i).padStart(2,"0"), name:"Item "+i, note:"Old record", lat:37, lng:127, savedAt:1000});
            tx.oncomplete = () => {db.close(); resolve();};
            tx.onerror = () => reject(tx.error);
        };
    });
    w.eval(read("features/explore/nearby-tools.js"));
    const node = key => w.document.querySelector('[data-nearby="' + key + '"]');
    return {dom, w, node, events, routes, opens:() => opens, workers:() => workers, terminated:() => terminated};
}
test("no startup reads; old records paginate without duplication and survive editing", async () => {
    const f = await fixture();
    try {
        assert.equal(f.opens(), 0);
        f.w.GiloaNearbyTools.open("walk"); await tick();
        assert.equal(f.opens(), 0);
        f.w.GiloaNearbyTools.open("items"); await tick(); await tick();
        assert.equal(f.node("list").querySelectorAll("article").length, 30);
        assert.equal(f.node("more").hidden, false);
        f.node("more").click(); await tick();
        const names = Array.from(f.node("list").querySelectorAll("h3"), n => n.textContent);
        assert.equal(names.length, 35); assert.equal(new Set(names).size, 35);
        assert.equal(f.node("more").hidden, true);
        f.node("new").click(); f.node("name").value = "<img onerror=alert(1)>";
        f.node("note").value = "3층 선반"; f.node("pick").click();
        f.events.click({latlng:{lat:37.5,lng:127.2}});
        f.node("save").click(); await tick(); await tick();
        assert(f.node("list").textContent.includes("3층 선반"));
        assert.equal(f.node("list").querySelector("img"), null);
        f.node("list").querySelectorAll("button")[1].click();
        f.node("note").value = "이동한 곳"; f.node("save").click(); await tick(); await tick();
        assert(f.node("list").textContent.includes("이동한 곳"));
        f.w.GiloaNearbyTools.close(); f.w.GiloaNearbyTools.open("items"); await tick();
        assert(f.node("list").textContent.includes("이동한 곳"));
        f.w.currentLang = "es"; f.w.document.documentElement.lang = "es"; await tick();
        assert.equal(f.node("save").textContent, "Dejar aquí");
    } finally {f.dom.window.close();}
});
test("route requests use a disposable worker and closing cancels stale results", async () => {
    const f = await fixture();
    try {
        const elements = Array.from({length:24}, (_,i) => ({type:"node",id:i+1,lat:37+Math.sin(i*Math.PI/12)*0.0009,lon:127+Math.cos(i*Math.PI/12)*0.00113}));
        elements.push({type:"way", id:100, tags:{highway:"footway"}, nodes:[...Array.from({length:24}, (_,i) => i+1),1]});
        f.w.navigator.geolocation = {getCurrentPosition:ok => ok({coords:{latitude:elements[0].lat,longitude:elements[0].lon,accuracy:10}})};
        f.w.fetch = async () => ({ok:true, json:async () => ({elements})});
        f.w.GiloaNearbyTools.open("walk");
        f.w.document.querySelector('[data-minutes="10"]').click();
        f.node("make").click(); await tick(); await tick();
        assert.equal(f.workers(), 1); assert.equal(f.terminated(), 1);
        assert.equal(f.routes.length, 1);
        assert.equal(f.w.GiloaWalkCore, undefined, "graph must not load on the main page");
        f.node("make").click();
        await new Promise(resolve => setTimeout(resolve, 1));
        f.w.GiloaNearbyTools.close(); await tick();
        assert.equal(f.routes.length, 1);
        f.w.GiloaNearbyTools.open("walk");
        f.w.fetch = async () => { throw new Error("network"); };
        f.node("make").click(); await tick();
        assert(f.node("status").textContent.includes("불러오지"));
        assert.equal(f.node("make").disabled, false);
    } finally {f.dom.window.close();}
});
test("opening tools through menu buttons survives outside-map click handlers", async () => {
    const f = await fixture();
    try {
        f.w.document.addEventListener("click", event => {
            f.events.click({originalEvent:event, latlng:{lat:37,lng:127}});
        });
        f.w.document.querySelector('[data-nearby-open="walk"]').click();
        assert.equal(f.w.document.getElementById("nearby-tools").hidden, false);
        assert.equal(f.w.document.activeElement.id, "nearby-tools");
        f.node("clear").click();
        assert.equal(f.w.document.getElementById("nearby-tools").hidden, false);
        f.node("close").click();
        f.w.GiloaNearbyTools.open("items");
        await tick();
        assert.equal(f.w.document.getElementById("nearby-tools").hidden, false);
    } finally {f.dom.window.close();}
});

test("car QR updates the same item only after explicit save and requires a fresh location", async () => {
    const f=await fixture();
    try {
        f.w.navigator.geolocation={getCurrentPosition:ok=>ok({coords:{latitude:37.5,longitude:127.2,accuracy:12}})};
        f.w.GiloaNearbyTools.open("items"); await tick();
        f.node("qrCode").value="https://untrusted.example/";f.node("qrUse").click();await tick();
        assert(f.node("editor").hidden);
        f.node("qrCode").value="GILOA:CAR:1:12345678-1234-4234-9234-123456789abc";
        f.node("qrUse").click();await tick();await tick();
        assert(f.node("selected").textContent.includes("37.50000"));
        f.node("note").value="B2 C14";f.node("save").click();await tick();await tick();
        assert(f.node("list").textContent.includes("B2 C14"));
        f.w.navigator.geolocation={getCurrentPosition:(ok,fail)=>fail({code:1})};
        f.node("qrUse").click();await tick();await tick();
        assert.equal(f.node("selected").textContent, "");
        f.node("save").click();await tick();
        assert(f.node("status").textContent.includes("보관 위치"));
        f.node("pick").click();f.events.click({latlng:{lat:37.6,lng:127.3}});
        f.node("note").value="B1 A02";f.node("save").click();await tick();await tick();
        assert(f.node("list").textContent.includes("B1 A02"));
        assert.equal([...f.node("list").querySelectorAll("h3")].filter(n=>n.textContent==="내 자동차").length,1);
        f.w.currentLang="es";f.w.document.documentElement.lang="es";await tick();
        assert.equal(f.node("qrCreate").textContent,"Crear QR del coche");
    }finally{f.dom.window.close();}
});

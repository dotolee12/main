const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "script.js"), "utf8");

function functionSource(name) {
    const start = source.indexOf("function " + name + "(");
    assert.notEqual(start, -1, name + " must exist");
    let depth = 0;
    for (let i = source.indexOf("{", start); i < source.length; i++) {
        if (source[i] === "{") depth++;
        if (source[i] === "}" && --depth === 0) return source.slice(start, i + 1);
    }
    throw new Error("Unclosed function: " + name);
}

function clock() {
    let now = 1000, id = 0;
    const pending = new Map();
    function setTimeout(fn, delay = 0) {
        const key = ++id;
        pending.set(key, { time: now + Math.max(0, delay), fn });
        return key;
    }
    function clearTimeout(key) { pending.delete(key); }
    function advance(ms) {
        const end = now + ms;
        for (let steps = 0; steps < 10000; steps++) {
            const next = [...pending].sort((a, b) => a[1].time - b[1].time)[0];
            if (!next || next[1].time > end) { now = end; return; }
            pending.delete(next[0]);
            now = next[1].time;
            next[1].fn();
        }
        throw new Error("Timer loop did not settle");
    }
    return {
        now: () => now, advance, pending,
        api: {
            performance: { now: () => now }, setTimeout, clearTimeout,
            requestAnimationFrame: fn => setTimeout(() => fn(now), 16),
            cancelAnimationFrame: clearTimeout
        }
    };
}

function emitter() {
    const handlers = new Map();
    return {
        on(types, fn) {
            for (const type of types.split(" ")) {
                if (!handlers.has(type)) handlers.set(type, new Set());
                handlers.get(type).add(fn);
            }
        },
        off(types, fn) {
            for (const type of types.split(" ")) handlers.get(type)?.delete(fn);
        },
        emit(type, event = {}) { for (const fn of [...(handlers.get(type) || [])]) fn({ type, ...event }); },
        count: type => handlers.get(type)?.size || 0,
        addEventListener(type, fn) { this.on(type, fn); },
        removeEventListener(type, fn) { this.off(type, fn); }
    };
}

test("meters per pixel divides a ten-pixel measurement and keeps invalid-scale fallback finite", () => {
    let distance = 20;
    const c = {
        map: {
            getCenter: () => ({ distanceTo: () => distance }),
            latLngToContainerPoint: () => ({ x: 45, y: 65 }),
            containerPointToLatLng: p => { assert.equal(p.x, 55); assert.equal(p.y, 65); return {}; }
        },
        L: { point: (x, y) => ({ x, y }) }
    };
    vm.createContext(c);
    vm.runInContext(functionSource("calcMpp") + functionSource("metersToPixels"), c);
    assert.equal(c.calcMpp(), 2);
    assert.equal(c.metersToPixels(18, c.calcMpp()), 9);
    distance = 5;
    assert.equal(c.calcMpp(), 0.5);
    assert.equal(c.metersToPixels(18, c.calcMpp()), 36);
    for (distance of [0, NaN, Infinity, -10]) {
        assert.equal(c.calcMpp(), 1);
        assert.equal(c.metersToPixels(18, c.calcMpp()), 18);
    }
    assert.match(source, /FOG_RADIUS_M\s*=\s*18\b/);
});

function headingHarness() {
    const time = clock(), renders = [], window = emitter();
    window.DeviceOrientationEvent = function() {};
    const c = {
        ...time.api, window, screen: { orientation: { angle: 0 } },
        playerHeading: null, currentPos: { lat: 37.5, lng: 127 },
        visionCone: null, visionLine: null,
        map: { removeLayer() { throw new Error("No legacy cone should be allocated"); } },
        scheduleRender() { renders.push({ time: time.now(), heading: c.playerHeading, position: c.currentPos }); }
    };
    vm.createContext(c);
    vm.runInContext(
        functionSource("normalizeHeading") + functionSource("screenOrientationAngle") +
        source.slice(source.indexOf("var deviceHeadingRenderTimer ="), source.indexOf("function toggleRecording(")) +
        functionSource("updateVisionCone"), c
    );
    return { c, time, renders };
}

test("high-frequency compass events retain latest photo heading and repaint fog at most once per 80 ms", () => {
    const { c, time, renders } = headingHarness();
    for (let i = 0; i < 200; i++) {
        c.handleDeviceHeading({ webkitCompassHeading: i * 2 });
        assert.equal(c.playerHeading, (i * 2) % 360);
        time.advance(5);
    }
    time.advance(80);
    assert.ok(renders.length >= 10 && renders.length <= 14, "a fast turn still visibly clears fog without sensor-rate full redraws");
    renders.slice(1).forEach((render, i) => assert.ok(render.time - renders[i].time >= 80));
    assert.equal(renders.at(-1).heading, 38, "trailing update paints the final direction");
    assert.equal(renders.at(-1).position, c.currentPos);
});

test("compass jitter across north does not redraw; null and relative samples do not invent north", () => {
    const { c, time, renders } = headingHarness();
    for (const event of [null, {}, { webkitCompassHeading: null }, { absolute: true, alpha: null }, { absolute: false, alpha: 10 }]) c.handleDeviceHeading(event);
    assert.equal(c.playerHeading, null);
    assert.equal(renders.length, 0);
    c.handleDeviceHeading({ webkitCompassHeading: 359.5 });
    time.advance(100);
    c.handleDeviceHeading({ webkitCompassHeading: 0.2 });
    time.advance(100);
    assert.ok(Math.abs(c.playerHeading - 0.2) < 1e-8);
    assert.equal(renders.length, 1);
    c.handleDeviceHeading({ webkitCompassHeading: null, absolute: true, alpha: 270 });
    assert.equal(c.playerHeading, 90);
    assert.equal(renders.length, 2);
});

test("compass redraw waits for a location and repeated enable keeps one listener per event", async () => {
    const { c, time, renders } = headingHarness();
    c.currentPos = null;
    c.handleDeviceHeading({ webkitCompassHeading: 12 });
    time.advance(100);
    assert.equal(c.playerHeading, 12);
    assert.equal(renders.length, 0);
    assert.equal(time.pending.size, 0);
    await c.enableDeviceHeading();
    await c.enableDeviceHeading();
    assert.equal(c.window.count("deviceorientationabsolute"), 1);
    assert.equal(c.window.count("deviceorientation"), 1);
});

test("a position-driven direction change does not make the next sensor bearing look like jitter", () => {
    const { c, time, renders } = headingHarness();
    c.handleDeviceHeading({ webkitCompassHeading: 10 });
    time.advance(100);
    c.playerHeading = 90;
    c.updateVisionCone(c.currentPos);
    c.handleDeviceHeading({ webkitCompassHeading: 10 });
    assert.equal(c.playerHeading, 10);
    time.advance(80);
    assert.equal(renders.length, 3);
    assert.equal(renders.at(-1).heading, 10);
});

const viewConeStart = source.indexOf("(function initGiloaViewConeUI()");
const viewConeClose = source.indexOf("\n})();", viewConeStart);
assert.ok(viewConeStart >= 0 && viewConeClose > viewConeStart);
const viewConeSource = source.slice(viewConeStart, viewConeClose + "\n})();".length);

function viewHarness(options = {}) {
    const time = clock(), window = emitter(), document = emitter();
    const layers = new Set(), panes = new Map(), canvases = [];
    let scale = options.scale ?? 1;
    if (options.supported !== false) window.DeviceOrientationEvent = function() {};
    window.screen = { orientation: { angle: 0 } };
    document.hidden = false;
    document.createElement = () => {
        const canvas = {
            style: {}, hidden: true, setAttribute() {},
            getContext: () => options.canvasError ? null : {
                createRadialGradient: () => ({ addColorStop() {} }), fillRect() {},
                getImageData: () => ({ data: new Uint8ClampedArray(384 * 384 * 4) }), putImageData() {}
            }
        };
        canvases.push(canvas);
        return canvas;
    };
    const marker = Object.assign(emitter(), { getLatLng: () => ({ lat: 37.5, lng: 127 }) });
    if (options.location !== false) layers.add(marker);
    const map = Object.assign(emitter(), {
        hasLayer: layer => layers.has(layer), removeLayer: layer => layers.delete(layer),
        getPane: name => panes.get(name),
        createPane: name => { const pane = { style: {} }; panes.set(name, pane); return pane; },
        latLngToContainerPoint: () => ({ x: 50, y: 60 }),
        containerPointToLatLng: p => ({ lat: 37.5, lng: p.x }), distance: () => scale
    });
    const L = {
        point: (x, y) => ({ x, y }), divIcon: options => options,
        marker: () => ({ addTo() { layers.add(this); return this; }, setLatLng() {} })
    };
    window.L = L;
    const c = {
        ...time.api, window, document, map, L, playerMarker: marker,
        console: { warn() {} }, playerHeading: 72,
        scheduleRender() { throw new Error("The facing UI must not render fog"); }
    };
    vm.createContext(c);
    vm.runInContext(viewConeSource, c);
    return {
        c, time, window, document, map, marker, layers, canvases,
        status: () => window.giloaViewConeUI.getStatus(),
        setScale: value => { scale = value; },
        heading: value => window.emit("deviceorientationabsolute", { absolute: true, alpha: 360 - value })
    };
}

test("facing diagnostics distinguish unsupported sensors, missing location and missing absolute heading", () => {
    assert.equal(viewHarness({ supported: false }).status().status, "unsupported");
    assert.equal(viewHarness({ location: false }).status().status, "waiting-location");
    const h = viewHarness();
    assert.equal(h.status().status, "waiting-heading");
    for (const event of [
        { webkitCompassHeading: null, alpha: null },
        { alpha: 90, absolute: false },
        { webkitCompassHeading: 90, webkitCompassAccuracy: -1 },
        { webkitCompassHeading: 90, webkitCompassAccuracy: 60 }
    ]) h.window.emit("deviceorientation", event);
    h.time.advance(100);
    assert.equal(h.status().status, "waiting-heading");
    assert.equal(h.canvases[0].hidden, true);
    assert.equal(h.c.playerHeading, 72, "facing UI must not change the photo/fog heading");
});

test("facing diagnostics report visible, stale and resumed waiting states without fake headings", () => {
    const h = viewHarness();
    h.heading(0);
    h.time.advance(100);
    assert.equal(h.status().status, "visible");
    assert.equal(h.canvases[0].style.transform, "rotate(0deg)");
    assert.equal(h.canvases[0].style.width, "180px");
    assert.equal(Object.isFrozen(h.status()), true);
    h.time.advance(10001);
    assert.equal(h.status().status, "stale");
    assert.equal(h.canvases[0].hidden, true);
    h.document.hidden = true;
    h.document.emit("visibilitychange");
    assert.equal(h.status().status, "hidden");
    assert.equal(h.status().reason, "document-hidden");
    assert.equal(h.status().sensorAttached, false);
    h.document.hidden = false;
    h.document.emit("visibilitychange");
    assert.equal(h.status().status, "waiting-heading");
    assert.equal(h.status().headingAgeMs, null);
    h.heading(45);
    h.time.advance(100);
    assert.equal(h.status().status, "visible");
    h.window.giloaViewConeUI.dispose();
    assert.equal(h.status().status, "hidden");
    assert.equal(h.status().reason, "disposed");
    assert.equal(h.layers.has(h.marker), true, "disposing UI retains the actual location marker");
    assert.equal(h.time.pending.size, 0);
});

test("facing errors remain diagnosable; invalid map scale hides the cone and can recover", () => {
    const failed = viewHarness({ canvasError: true });
    assert.equal(failed.status().status, "error");
    assert.match(failed.status().reason, /canvas unavailable/i);
    assert.equal(failed.layers.has(failed.marker), true);
    const h = viewHarness({ scale: 0 });
    h.heading(90);
    h.time.advance(100);
    assert.equal(h.status().status, "error");
    assert.equal(h.status().reason, "invalid-map-scale");
    assert.equal(h.canvases[0].hidden, true);
    h.setScale(2);
    h.map.emit("zoomend");
    h.time.advance(100);
    assert.equal(h.status().status, "visible");
    assert.equal(h.canvases[0].style.width, "90px");
});

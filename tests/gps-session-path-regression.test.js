const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "script.js"), "utf8");

function functionSource(name) {
    const start = source.indexOf("function " + name + "(");
    assert.notEqual(start, -1, name + " must exist");
    const bodyStart = source.indexOf("{", start);
    let depth = 0;
    for (let i = bodyStart; i < source.length; i += 1) {
        if (source[i] === "{") depth += 1;
        if (source[i] === "}") depth -= 1;
        if (depth === 0) return source.slice(start, i + 1);
    }
    throw new Error("Unclosed function: " + name);
}

const context = {
    isFinite,
    Math,
    L: {
        latLng(lat, lng) {
            const aLat = typeof lat === "object" ? Number(lat.lat) : Number(lat);
            const aLng = typeof lat === "object" ? Number(lat.lng) : Number(lng);
            return {
                distanceTo(target) {
                    const bLat = Array.isArray(target) ? Number(target[0]) : Number(target.lat);
                    const bLng = Array.isArray(target) ? Number(target[1]) : Number(target.lng);
                    const rad = Math.PI / 180;
                    const dLat = (bLat - aLat) * rad;
                    const dLng = (bLng - aLng) * rad;
                    const h = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * rad) * Math.cos(bLat * rad) * Math.sin(dLng / 2) ** 2;
                    return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
                }
            };
        }
    }
};
vm.createContext(context);
[
    "PATH_MAX_FIX_GAP_MS", "GAP_THRESHOLD_MS", "PATH_MID_GAP_MAX_MS", "PATH_LONG_GAP_MAX_MS",
    "PATH_MID_GAP_MAX_SPEED_MPS", "PATH_LONG_GAP_MAX_SPEED_MPS",
    "PATH_LONG_GAP_MAX_DISTANCE_M", "PATH_CONNECT_MAX_ACCURACY_M",
    "MAX_PATH_SPEED_MPS", "PATH_SHORT_GAP_MAX_SPEED_MPS", "PATH_JUMP_BASE_TOLERANCE_M",
    "PATH_SPIKE_WINDOW_MS", "PATH_SPIKE_MIN_EXCURSION_M", "MAX_ACCURACY_M",
    "SPEED_LIMIT_WALK", "SPEED_LIMIT_BIKE", "FULL_VISIBILITY_HOURS", "MIN_VISIBILITY_HOURS", "MIN_PATH_VISIBILITY"
].forEach((name) => {
    const match = source.match(new RegExp("const\\s+" + name + "\\s*=\\s*([^;]+);"));
    assert.ok(match, name + " constant must exist");
    vm.runInContext("var " + name + " = " + match[1] + ";", context);
});
vm.runInContext(functionSource("shouldConnectPath"), context);
vm.runInContext(functionSource("getPathVisibility"), context);
vm.runInContext(functionSource("getTransportSegmentStyle"), context);
vm.runInContext(functionSource("isIsolatedGpsSpike"), context);

function point(time, northMeters, session = "session:test", accuracy = 10) {
    return {
        lat: 37 + northMeters / 111195,
        lng: 127,
        startTime: time,
        endTime: time,
        timestamp: time,
        accuracy,
        recordingSessionId: session
    };
}

test("A: same session splits a 4 minute 200 m missing GPS interval", () => {
    assert.equal(context.shouldConnectPath(point(0, 0), point(4 * 60_000, 200)), false);
});

test("B: same session splits a 6 minute 500 m missing GPS interval", () => {
    assert.equal(context.shouldConnectPath(point(1, 0), point(1 + 6 * 60_000, 500)), false);
});

test("C: same session rejects a 5 minute 10 km GPS jump", () => {
    assert.equal(context.shouldConnectPath(point(1, 0), point(1 + 5 * 60_000, 10_000)), false);
});

test("session boundary and poor accuracy always split the display path", () => {
    assert.equal(context.shouldConnectPath(point(1, 0, "one"), point(60_001, 50, "two")), false);
    assert.equal(context.shouldConnectPath(point(1, 0, "one", 101), point(60_001, 50, "one")), false);
});

test("legacy points remain compatible only inside the original short gap", () => {
    assert.equal(context.shouldConnectPath(point(1, 0, null), point(60_001, 100, null)), true);
    assert.equal(context.shouldConnectPath(point(1, 0, null), point(240_001, 100, null)), false);
});

test("D/E: missing foreground fixes split, but delayed continuous native fixes reconnect", () => {
    assert.equal(context.shouldConnectPath(point(1, 0), point(10 * 60_000 + 1, 600)), false);
    const fixes = Array.from({ length: 41 }, (_, index) => point(1 + index * 30_000, index * 30));
    assert.equal(fixes.slice(1).every((fix, index) => context.shouldConnectPath(fixes[index], fix)), true);
});

test("F/G: only permission denial stops recording and stop clears the session", () => {
    const errorBody = functionSource("handleLocationError");
    assert.match(errorBody, /err\s*&&\s*err\.code\s*===\s*1[^}]*stopRecording\(\)/s);
    assert.match(errorBody, /setTimeout/);
    assert.doesNotMatch(errorBody, /err\.code\s*===\s*[23][^}]*stopRecording\(\)/s);
    assert.match(functionSource("stopRecording"), /recordingSessionId\s*=\s*null/);
});

test("fog/distance keep their connection rule and transport display/GPX use the vehicle-aware rule", () => {
    ["renderFog", "renderAgeTint", "calculateRecordedDistance"].forEach((name) => {
        assert.match(functionSource(name), /shouldConnect(?:StoredPathPoints|Path)\(/, name);
    });
});

test("native and web duplicate fixes are filtered without creating fake points", () => {
    assert.match(functionSource("appendRawGpsPoint"), /existing\.source\s*!==\s*point\.source\s*&&\s*timeGap\s*<=\s*15000\s*&&\s*distance\s*<\s*5/);
    assert.match(functionSource("mergeNativeRouteTrackingPoints"), /timeGap\s*<=\s*15000\s*&&\s*distance\s*<\s*5/);
    assert.doesNotMatch(functionSource("buildDisplayPath"), /interpol|보간/i);
});

test("brief high-speed GPS rays are not connected", () => {
    assert.equal(context.shouldConnectPath(point(1, 0), point(10_001, 150)), false);
    assert.equal(context.shouldConnectPath(point(1, 0), point(30_001, 120)), true);
});

test("GPS gap boundary and long nearby gaps do not bridge missing evidence", () => {
    assert.equal(context.shouldConnectPath(point(1, 0), point(60_001, 40)), true);
    assert.equal(context.shouldConnectPath(point(1, 0), point(60_002, 40)), false);
    assert.equal(context.shouldConnectPath(point(1, 0), point(2 * 60 * 60_000 + 1, 20)), false);
    const before = point(1, 0);
    before.endTime = 119_001;
    assert.equal(context.shouldConnectPath(before, point(120_001, 40)), false);
});

test("GPS recovery starts a new GPX segment and excludes the missing leg from distance", () => {
    vm.runInContext(functionSource("shouldConnectStoredPathPoints"), context);
    vm.runInContext(functionSource("splitRecordedPathSegments"), context);
    vm.runInContext(functionSource("calculateRecordedDistance"), context);
    const fixes = [point(1, 0), point(30_001, 30), point(180_001, 300), point(210_001, 330)];
    const snapshot = JSON.stringify(fixes);
    assert.deepEqual(Array.from(context.splitRecordedPathSegments(fixes), (segment) => segment.length), [2, 2]);
    assert.ok(Math.abs(context.calculateRecordedDistance(fixes, 0) - 60) < 1);
    assert.equal(JSON.stringify(fixes), snapshot, "stored coordinates must remain unchanged");
});

test("isolated out-and-back GPS spike is removed from display only", () => {
    const before = point(1, 0, "session:test", 8);
    const spike = point(6_001, 180, "session:test", 65);
    const after = point(11_001, 5, "session:test", 8);
    assert.equal(context.isIsolatedGpsSpike(before, spike, after), true);
    assert.equal(context.isIsolatedGpsSpike(before, point(61_001, 60, "session:test", 8), point(121_001, 120, "session:test", 8)), false);
});

test("regional badge atlas closes from X and outside scrim without late DOM ready binding", () => {
    const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
    assert.match(html, /class="region-badge-atlas-scrim"[^>]*data-region-atlas-close[^>]*onclick="closeRegionBadgeAtlas\(\)"/);
    assert.match(html, /id="region-badge-atlas-close"[^>]*data-region-atlas-close[^>]*onclick="closeRegionBadgeAtlas\(\)"/);
    assert.match(source, /event\.target\s*===\s*atlas/);
    assert.doesNotMatch(source, /DOMContentLoaded[^\n]*region-badge-atlas-close/);
});

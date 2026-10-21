const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(path.join(__dirname, "..", "script.js"), "utf8");

function functionBody(name) {
    const start = source.indexOf("function " + name + "(");
    assert.notEqual(start, -1, name + " must exist");
    const bodyStart = source.indexOf("{", start);
    let depth = 0;
    for (let i = bodyStart; i < source.length; i += 1) {
        if (source[i] === "{") depth += 1;
        if (source[i] === "}") depth -= 1;
        if (depth === 0) return source.slice(bodyStart, i + 1);
    }
    throw new Error("Unclosed function: " + name);
}

test("place marker cleanup cannot reset GPS source or distance", () => {
    ["clearTourMarkers", "clearLibraryMarkers", "applyMapLayerChange"].forEach((name) => {
        const body = functionBody(name);
        assert.doesNotMatch(body, /pathCoordinates\s*=|rawGpsPoints\s*=|totalDistance\s*=|localStorage\.removeItem|idb[^\n]*\.(?:delete|clear)/i);
    });
});

test("tourism and library markers use independent layer groups", () => {
    assert.match(source, /tourMarkerLayer\s*=\s*L\.layerGroup\(\)\.addTo\(map\)/);
    assert.match(source, /libraryMarkerLayer\s*=\s*L\.layerGroup\(\)\.addTo\(map\)/);
    assert.match(functionBody("clearTourMarkers"), /tourMarkerLayer\.clearLayers\(\)/);
    assert.match(functionBody("clearLibraryMarkers"), /libraryMarkerLayer\.clearLayers\(\)/);
});

test("place layer changes preserve diagnostics and repaint GPS canvases", () => {
    assert.match(functionBody("applyMapLayerChange"), /captureGpsIntegrity\(\)/);
    assert.match(functionBody("refreshGpsVisualsAfterPlaceLayerChange"), /scheduleRender\(\)/);
    assert.match(functionBody("logGpsLayerChange"), /"GPS " \+ stage/);
    assert.match(functionBody("logGpsLayerChange"), /GPS INTEGRITY/);
});

test("GPX export still reads the raw GPS source", () => {
    assert.match(functionBody("exportGpx"), /rawGpsPoints\.filter/);
});

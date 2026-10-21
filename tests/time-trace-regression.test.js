const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const moduleSource = fs.readFileSync(path.join(__dirname, "..", "time-trace.js"), "utf8");
const appSource = fs.readFileSync(path.join(__dirname, "..", "script.js"), "utf8");
const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const sw = fs.readFileSync(path.join(__dirname, "..", "sw.js"), "utf8");

test("A/B/C: registration starts waiting and revisit opens at seven days or later", () => {
    assert.match(moduleSource, /REVISIT_DELAY_MS\s*=\s*7\s*\*\s*DAY_MS/);
    assert.match(moduleSource, /revisitAvailableAt\s*:\s*takenAt\s*\+\s*REVISIT_DELAY_MS/);
    assert.match(moduleSource, /Date\.now\(\)\s*>=\s*Number\(series\.revisitAvailableAt\)/);
    assert.match(moduleSource, /status\s*:\s*"waiting"/);
});

test("D/E: accuracy expands the 40 m radius but completion is always below 100 m", () => {
    assert.match(moduleSource, /BASE_RADIUS_M\s*=\s*40/);
    assert.match(moduleSource, /ABSOLUTE_MAX_RADIUS_M\s*=\s*100/);
    assert.match(moduleSource, /Math\.min\(ABSOLUTE_MAX_RADIUS_M[\s\S]*BASE_RADIUS_M/);
    assert.match(moduleSource, /distance\s*<\s*ABSOLUTE_MAX_RADIUS_M/);
});

test("F/H: composition score uses brightness-resistant edge orientation descriptors, not pixel equality", () => {
    assert.match(moduleSource, /function edgeDescriptor/);
    assert.match(moduleSource, /Math\.atan2\(gy,gx\)/);
    assert.match(moduleSource, /function cosine/);
    assert.doesNotMatch(moduleSource, /pixelmatch|===\s*pixels\[/i);
});

test("G/I: heading is optional and a low score can still be accepted", () => {
    assert.match(moduleSource, /headingScore===null\?locationScore/);
    assert.match(html, /id="time-trace-accept"/);
    assert.match(moduleSource, /addEventListener\("click",acceptResult\)/);
});

test("J/K: compare slider exists and metadata uses a separate durable IndexedDB", () => {
    assert.match(html, /id="time-trace-compare-slider"/);
    assert.match(moduleSource, /DB_NAME\s*=\s*"giloa-time-trace"/);
    assert.match(moduleSource, /createObjectStore\(STORE,\s*\{\s*keyPath:"seriesId"\s*\}\)/);
    assert.match(moduleSource, /style\.width=this\.value\+"%"/);
});

test("L: general photo save is isolated behind a post-save event", () => {
    const saveAt = appSource.indexOf("await idbSavePhoto(");
    const eventAt = appSource.indexOf('new CustomEvent("giloa:photo-saved"');
    assert.ok(saveAt >= 0 && eventAt > saveAt);
    assert.match(appSource, /catch \(timeTraceError\)/);
    assert.match(moduleSource, /window\.addEventListener\("giloa:photo-saved",onPhotoSaved\)/);
});

test("phone gallery single-select reads original bytes before EXIF inspection", () => {
    assert.match(appSource, /singleBlob\s*=\s*await getOriginalPhotoBlob\("",\s*single\)\s*\|\|\s*await fetchBlobFromUrl/);
    assert.match(appSource, /inspectPhotoLocation\(singleBlob\s*\|\|\s*single,\s*"gallery"/);
});

test("M: Time Trace does not mutate raw GPS, display path, fog, GPX, or photo stores", () => {
    assert.doesNotMatch(moduleSource, /rawGpsPoints\s*=|pathCoordinates\s*=|totalDistance\s*=|clearFog|exportGpx/);
    assert.doesNotMatch(moduleSource, /objectStore\(["']images["']\).*\.(?:clear|delete)/s);
    assert.match(sw, /"\.\/time-trace\.js"/);
    assert.match(sw, /"\.\/time-trace\.css"/);
});

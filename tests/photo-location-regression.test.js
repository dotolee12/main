const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = "D:\\giloa";
const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

function functionSource(source, name) {
    const markers = ["async function " + name + "(", "function " + name + "("];
    const start = markers.map(marker => source.indexOf(marker)).filter(index => index >= 0).sort((a, b) => a - b)[0];
    assert.notEqual(start, undefined, name + " must exist");
    const bodyStart = source.indexOf("{", start);
    let depth = 0;
    for (let index = bodyStart; index < source.length; index += 1) {
        if (source[index] === "{") depth += 1;
        if (source[index] === "}") depth -= 1;
        if (depth === 0) return source.slice(start, index + 1);
    }
    throw new Error("Unclosed function: " + name);
}

function loadPhotoCore() {
    const context = { console, isFinite, Number, String, Math };
    vm.createContext(context);
    ["isValidPhotoCoordinate", "parseExifRational", "parseExifCoord", "gpsFromExifObject", "getPhotoContentFingerprint", "resolvePhotoLocation"]
        .forEach(name => vm.runInContext(functionSource(script, name), context));
    context.getPhotoExifGps = async () => null;
    return context;
}

test("EXIF DMS coordinates preserve axis order and hemisphere", () => {
    const core = loadPhotoCore();
    const gps = core.gpsFromExifObject({
        GPSLatitude: [[37, 1], [33, 1], [3096, 100]], GPSLatitudeRef: "N",
        GPSLongitude: [[126, 1], [58, 1], [678, 100]], GPSLongitudeRef: "E"
    });
    assert.ok(Math.abs(gps.lat - 37.5586) < 0.000001);
    assert.ok(Math.abs(gps.lng - 126.96855) < 0.000001);
    const southwest = core.gpsFromExifObject({
        GPSLatitude: [33, 10, 30], GPSLatitudeRef: "S",
        GPSLongitude: [18, 20, 15], GPSLongitudeRef: "W"
    });
    assert.ok(southwest.lat < 0);
    assert.ok(southwest.lng < 0);
});

test("invalid, swapped-range, zero and malformed EXIF coordinates are rejected", () => {
    const core = loadPhotoCore();
    assert.equal(core.isValidPhotoCoordinate(0, 0), false);
    assert.equal(core.isValidPhotoCoordinate(126.9, 37.5), false);
    assert.equal(core.isValidPhotoCoordinate(NaN, 127), false);
    assert.equal(core.parseExifCoord([37, 61, 0], "N", "lat"), null);
    assert.equal(core.parseExifCoord([[37, 0], [30, 0], [0, 1]], "N", "lat"), null);
    assert.equal(core.parseExifCoord([37, 30, 0], "E", "lat"), null);
});

test("gallery without EXIF never silently uses current or route location", async () => {
    const core = loadPhotoCore();
    const result = await core.resolvePhotoLocation({}, null, "gallery", new Date(), { lat: 37.5, lng: 127, accuracy: 5 });
    assert.equal(result, null);
    assert.doesNotMatch(functionSource(script, "resolvePhotoLocation"), /getRoutePhotoLocation|getCurrentPhotoLocation/);
});

test("camera uses the button-time snapshot while EXIF remains highest priority", async () => {
    const core = loadPhotoCore();
    const captured = { lat: 37.4, lng: 127.1, accuracy: 12 };
    assert.equal(JSON.stringify(await core.resolvePhotoLocation({}, null, "camera", new Date(), captured)), JSON.stringify({ lat: 37.4, lng: 127.1, source: "current", accuracy: 12 }));
    assert.equal(JSON.stringify(await core.resolvePhotoLocation({}, { lat: 35.1, lng: 129.04 }, "camera", new Date(), captured)), JSON.stringify({ lat: 35.1, lng: 129.04, source: "exif", accuracy: null }));
});

test("missing-location dialog exposes all four requested choices", () => {
    assert.match(html, /id="photo-location-map"/);
    assert.match(html, /id="photo-location-current"/);
    assert.match(html, /id="photo-location-keep"/);
    assert.match(html, /id="photo-location-cancel"/);
});

test("photo fingerprint is stable and saved before duplicate insertion", () => {
    const core = loadPhotoCore();
    assert.equal(core.getPhotoContentFingerprint("data:image/jpeg;base64,abc"), core.getPhotoContentFingerprint("data:image/jpeg;base64,abc"));
    assert.notEqual(core.getPhotoContentFingerprint("data:image/jpeg;base64,abc"), core.getPhotoContentFingerprint("data:image/jpeg;base64,abd"));
    const processPhoto = functionSource(script, "processPhoto");
    assert.ok(processPhoto.indexOf("duplicate") < processPhoto.indexOf("photos.push(data)"));
});

test("EXIF inspection precedes HEIC conversion and compression", () => {
    const handle = functionSource(script, "handlePhotos");
    assert.ok(handle.indexOf("inspectPhotoLocation") < handle.indexOf("convertHeicToJpegFile"));
    assert.ok(handle.indexOf("inspectPhotoLocation") < handle.indexOf("processPhoto"));
    assert.match(functionSource(script, "processPhoto"), /originalBlob/);
});

test("delete removes list, marker and IndexedDB row", () => {
    const remove = functionSource(script, "deletePhoto");
    assert.match(remove, /photoClusterGroup\.removeLayer/);
    assert.match(remove, /idbDeletePhoto/);
    if (/commitJourneyDeletion\("photos", id\)/.test(remove)) {
        // The safe path now commits metadata before deleting the original.
        // Executable success/failure/restore cases live in journey-stability.test.js.
        const commit = functionSource(script, "commitJourneyDeletion");
        assert.match(commit, /before\.filter/);
        assert.match(commit, /photos = remaining/);
        assert.match(commit, /persistState\(\{ beforeExplicitDeletion: beforeDeletion \}\)/);
        assert.match(remove, /if \(!photo \|\| !commitJourneyDeletion\("photos", id\)\) return/);
        assert.ok(remove.indexOf("commitJourneyDeletion") < remove.indexOf("deleteRemotePhotoFiles"));
        assert.ok(remove.indexOf("commitJourneyDeletion") < remove.indexOf("idbDeletePhoto"));
    } else {
        // Also usable against the backup by the before/after comparison runner.
        assert.match(remove, /photos = photos\.filter/);
        assert.match(remove, /scheduleSave/);
    }
});

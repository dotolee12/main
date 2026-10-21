const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const source = fs.readFileSync(path.join(root, "script.js"), "utf8");

test("bundled administrative GeoJSON is present and valid", () => {
    const data = JSON.parse(fs.readFileSync(path.join(root, "data", "admin-districts.geojson"), "utf8"));
    assert.equal(data.type, "FeatureCollection");
    assert.ok(Array.isArray(data.features));
    assert.ok(data.features.length > 0);
    assert.ok(data.features.some((feature) => String(feature.properties && feature.properties.title).startsWith("고양시 ")));
});

test("Android file assets use plain-path XHR instead of query-string fetch", () => {
    assert.match(source, /ADMIN_BOUNDARY_ASSET_URL = "\.\/data\/admin-districts\.geojson"/);
    assert.match(source, /if \(isAndroidAsset\) return loadAdminBoundaryJsonByXhr\(ADMIN_BOUNDARY_ASSET_URL\)/);
    assert.match(source, /xhr\.status !== 0/);
});

test("browser fetch failure falls back to XHR", () => {
    assert.match(source, /fetch\(ADMIN_BOUNDARY_URL\)[\s\S]*loadAdminBoundaryJsonByXhr\(ADMIN_BOUNDARY_ASSET_URL\)/);
});

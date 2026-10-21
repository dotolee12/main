const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
const mainActivity = fs.readFileSync(path.join(root, "android-app", "app", "src", "main", "java", "com", "giloa", "app", "MainActivity.java"), "utf8");
const routeService = fs.readFileSync(path.join(root, "android-app", "app", "src", "main", "java", "com", "giloa", "app", "RouteTrackingService.java"), "utf8");

function functionBody(source, name) {
    const start = source.indexOf("function " + name + "(");
    assert.notEqual(start, -1, name + " must exist");
    const bodyStart = source.indexOf("{", start);
    let depth = 0;
    for (let index = bodyStart; index < source.length; index += 1) {
        if (source[index] === "{") depth += 1;
        if (source[index] === "}") depth -= 1;
        if (depth === 0) return source.slice(bodyStart, index + 1);
    }
    throw new Error("Unclosed function: " + name);
}

test("startup awaits every persistent source before marking state ready", () => {
    const restore = functionBody(script, "initializePersistentJourneyState");
    assert.match(restore, /await restoreRawGpsPoints\(\)/);
    assert.match(restore, /await consumeNativeRouteTrackingPoints\(\{ deferPersist:true \}\)/);
    assert.ok(restore.indexOf("giloaPersistentStateReady = true") > restore.indexOf("persistState({ restoreCommit:true })"));
    assert.match(functionBody(script, "init"), /await runInitStep\("saved journey", initializePersistentJourneyState\)/);
});

test("checkpoint cannot overwrite restored records with a smaller state", () => {
    const persist = functionBody(script, "persistState");
    assert.match(persist, /blocked before restore completed/);
    assert.match(persist, /hasJourneyRecordRegression/);
    assert.match(persist, /STORAGE_TEMP_KEY/);
    assert.match(persist, /STORAGE_BACKUP_KEY/);
});

test("local, backup and pending journey states are merged", () => {
    const load = functionBody(script, "loadState");
    assert.match(load, /\[primary, backup, pending\]/);
    assert.match(load, /mergeJourneyStatePayloads/);
    assert.match(functionBody(script, "restoreRawGpsPoints"), /mergeJourneyPointLists\(\[\s*pathCoordinates,\s*rawGpsPoints\s*\]/);
});

test("native GPS is acknowledged only after web persistence succeeds", () => {
    assert.match(mainActivity, /String loadRouteTrackingPoints\(\)/);
    assert.match(mainActivity, /boolean acknowledgeRouteTrackingPoints\(long throughTime\)/);
    assert.match(script, /if \(saved && nativeResult\.canAcknowledge/);
    assert.match(routeService, /PREF_POINTS_BACKUP/);
    assert.match(routeService, /\.commit\(\)/);
});

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const core = require(path.join(__dirname, "..", "region-stay-core.js"));

const MINUTE = 60 * 1000;
const source = fs.readFileSync(path.join(__dirname, "..", "script.js"), "utf8");

test("Goyang consecutive accepted GPS fixes accumulate residence time", () => {
    const points = [];
    for (let minute = 0; minute <= 60; minute += 1) {
        points.push({ lat:37.66, lng:126.83, accuracy:58, timestamp:minute * MINUTE + 1, startTime:minute * MINUTE + 1, endTime:minute * MINUTE + 1 });
    }
    const totals = core.calculate(points, () => "고양시", { cities:["고양시"], maximumAccuracy:100, maximumGapMs:2 * MINUTE });
    assert.equal(totals["고양시"], 60 * MINUTE);
});

test("Goyang district names resolve through the municipality prefix", () => {
    assert.match(source, /flat\.indexOf\(keys\[i\]\) >= 0/);
    assert.match(source, /"고양시": "region_goyang_1h"/);
    assert.match(source, /label\.dataset\.municipality = municipalityName/);
});

test("live GPS updates refresh an open regional badge atlas", () => {
    assert.match(source, /function updateRegionStayProgress\(\)[\s\S]*recalculateRegionStayFromPath\(\)[\s\S]*renderRegionBadgeAtlas\(\)/);
    assert.match(source, /if \(!appendRawGpsPoint\(rawPoint\)\) return;\s*updateRegionStayProgress\(\);/);
});

test("earning Goyang Cat opens Gilo dialogue and points to the atlas", () => {
    assert.match(source, /if \(isRegionBadgeId\(badgeId\)\) \{[\s\S]*animateRegionBadgeToMenu\(badgeId\);[\s\S]*showRegionBadgeEarnedDialogue/);
    assert.match(source, /아이템의 지역 뱃지 지도에서 방금 얻은/);
    assert.match(source, /region_goyang_1h[\s\S]*고양고양이/);
});

test("regional badge acquisition animates only a temporary visual into the menu", () => {
    assert.match(source, /function animateRegionBadgeToMenu\(badgeId\)/);
    assert.match(source, /document\.getElementById\("ham-btn"\)/);
    assert.match(source, /flight\.className = "region-badge-menu-flight"/);
    assert.match(source, /flight\.addEventListener\("animationend", finish, \{ once:true \}\)/);
    assert.match(source, /if \(flight\.parentNode\) flight\.parentNode\.removeChild\(flight\)/);
    assert.match(source, /slot\.dataset\.badgeId = entry\.id/);
});

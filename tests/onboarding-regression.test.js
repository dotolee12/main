const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const js = fs.readFileSync(path.join(root, "script.js"), "utf8");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
const sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");

test("first run contains one onboarding page with no slideshow controls", () => {
    assert.equal((html.match(/id="gsi-onboarding"/g) || []).length, 1);
    assert.match(html, /id="gsi-onboarding-close"/);
    assert.doesNotMatch(html, /id="gsi-skip"|class="gsi-language-grid"|class="gsi-brand"/);
    assert.match(js, /INTRO_STORY_SEEN_KEY\)!=="true"\)return showGiloaOnboarding\(\)/);
    assert.doesNotMatch(js, /startIntroVisualFrames|showIntroLogo|phaseTimer|visualTimer/);
});

test("language picker reuses all six supported language codes and existing keys", () => {
    ["ko", "en", "ja", "zh", "fr", "es"].forEach((language) => assert.match(html, new RegExp(`option value="${language}"`)));
    assert.match(js, /localStorage\.setItem\(LANGUAGE_PREFERENCE_KEY,language\)/);
    assert.match(js, /localStorage\.setItem\(LANGUAGE_SELECTED_KEY,"1"\)/);
    assert.match(js, /ko:\{language:[\s\S]*en:\{language:[\s\S]*ja:\{language:[\s\S]*zh:\{language:[\s\S]*fr:\{language:[\s\S]*es:\{language:/);
});

test("pictogram flow and find-places guidance are accessible and responsive", () => {
    ["walk", "explore", "remember", "grow"].forEach((action) => assert.match(html, new RegExp(`id="gsi-action-${action}"`)));
    assert.match(html, /id="gsi-find-places"/);
    assert.match(js, /setAttribute\("aria-label",pair\[1\]\)/);
    assert.match(css, /grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
    assert.match(css, /@media\(max-width:600px\)[\s\S]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
});

test("start goes straight to the existing map tutorial without changing journey data", () => {
    assert.match(js, /localStorage\.setItem\(INTRO_STORY_SEEN_KEY,"true"\)/);
    assert.match(js, /setTimeout\(startMapTutorial,120\)/);
    assert.match(js, /window\.startGiloaTutorial/);
    assert.doesNotMatch(js.slice(js.indexOf("function finishGiloaOnboarding"), js.indexOf("function setIntroArt")), /STORAGE_KEY|rawGpsPoints|pathCoordinates|photos|memories/);
});

test("story images are lazy and the optional story can return to onboarding", () => {
    assert.match(html, /id="gsi-art" class="gsi-art" alt="">/);
    assert.doesNotMatch(html, /id="gsi-art"[^>]+src=/);
    assert.match(js, /function showGiloStory/);
    assert.match(js, /showGiloStory\(\{completeToMap:true\}\)/);
    assert.match(js, /if\(returnToOnboarding\)\{showGiloaOnboarding\(\);return;\}/);
    assert.match(js, /event\.target===root/);
    assert.match(css, /\.gsi\.story-mode \.gsi-story\{width:80vw;height:80vh/);
    assert.doesNotMatch(sw, /PREFETCH_ON_IDLE_ASSETS[\s\S]*gilo-awake-transparent/);
});

test("visible onboarding cards have real actions", () => {
    ["walk", "explore", "remember", "grow"].forEach((action) => {
        assert.match(html, new RegExp(`id="gsi-action-${action}"[^>]*role="button"`));
    });
    assert.match(js, /toggleMapLayerPanel/);
    assert.match(js, /togglePhotoMenu/);
    assert.match(js, /toggleHud/);
});

test("first paint requests only the shared Gilo image", () => {
    const imageSources = [...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map((match) => match[1]).filter(Boolean);
    assert.deepEqual([...new Set(imageSources)], ["./gilo%20many%20appearance/gilo-tutorial-welcome-transparent.png"]);
    assert.doesNotMatch(html, /assets\/gilo\/story\/[^"']+\.(?:png|webp)/);
});

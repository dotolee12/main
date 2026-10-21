const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const tutorial = fs.readFileSync(path.join(root, "tutorial.js"), "utf8");
const tutorialCss = fs.readFileSync(path.join(root, "tutorial.css"), "utf8");
const style = fs.readFileSync(path.join(root, "style.css"), "utf8");
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");

test("first tutorial can be skipped immediately and does not lock map controls", () => {
  assert.match(tutorial, /phase-map skip-ready/);
  assert.match(tutorial, /gft-skip.*confirmSkip/);
  assert.match(tutorial, /dim\.onclick=function\(\){finish\(true\);}/);
  assert.match(tutorialCss, /body\.gft-active \.gft-dim \{ pointer-events:none !important; \}/);
  assert.match(style, /body\.gft-active #controls[\s\S]*pointer-events:auto/);
});

test("auto-recording notice does not block map outside its own card", () => {
  assert.match(style, /#auto-recording-notice \{[\s\S]*pointer-events: none;/);
  assert.match(style, /\.auto-recording-box \{[\s\S]*pointer-events: auto;/);
});

test("legacy guide glow is hidden without removing the guide character", () => {
  assert.match(style, /\.giloa-guide-glow\{display:none!important\}/);
  assert.match(index, /class="gft-character-wrap"/);
});

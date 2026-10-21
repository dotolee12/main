const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

test('protected Android HTML points every application script at obfuscated assets', () => {
  const html = fs.readFileSync(path.join(root, 'protected-dist', 'index.html'), 'utf8');
  const sourceHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const bootstrapRef = sourceHtml.match(/\.\/map-bootstrap\.js\?v=[^"']+/);
  assert.ok(bootstrapRef, 'source must reference the map bootstrap');
  assert.ok(html.includes(bootstrapRef[0]), 'protected HTML must preserve the source bootstrap version');
  assert.equal((html.match(/\.\/script\.js\?v=/g) || []).length, 0);
  assert.equal((html.match(/\.\/tutorial\.js\?v=/g) || []).length, 0);
  assert.ok((html.match(/script\.obfuscated\.js/g) || []).length >= 2);
  assert.ok(fs.existsSync(path.join(root, 'android-app', 'app', 'src', 'main', 'assets', 'www', 'script.obfuscated.js')));
  assert.ok(fs.existsSync(path.join(root, 'android-app', 'app', 'src', 'main', 'assets', 'www', 'map-bootstrap.js')));
});

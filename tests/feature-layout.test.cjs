const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const api = import('../tools/build-feature-sources.mjs');
function fixture(t) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'giloa-feature-layout-'));
    t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
    const write = (name, text) => {const file=path.join(dir,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,text);};
    write('features/one.js','let original = 3;\n');write('features/two.js','function readOriginal() { return original; }\n');
    write('features/base.css',':root { --color: #1a2035; }\n');write('features/override.css',':root { --color: #4fc3f7; }\n');
    write('features/open.html','<!doctype html><html><body><div>');write('features/close.html','원래 기록</div></body></html>\n');
    const m={version:1,bundles:[{output:'script.js',sources:[{path:'features/one.js',role:'state'},{path:'features/two.js',role:'function'}]},{output:'style.css',sources:[{path:'features/base.css',role:'base'},{path:'features/override.css',role:'override'}]},{output:'index.html',sources:[{path:'features/open.html',role:'open'},{path:'features/close.html',role:'close'}]}]};
    const save=()=>write('features/bundles.json',JSON.stringify(m));save();return {dir,write,m,save};
}
test('project source, runtime files and generated file/function guides agree',async()=>{
    const {checkFeatureBundles}=await api; const prepared=checkFeatureBundles(root);
    assert.deepEqual(prepared.bundles.map(b=>b.output),['script.js','style.css','index.html']);
    assert(prepared.bundles.every(b=>b.sources.length>1));
});
test('assembly preserves JS declaration order, CSS cascade and HTML bytes exactly',async t=>{
    const {writeFeatureBundles,checkFeatureBundles}=await api;const a=fixture(t);writeFeatureBundles(a.dir);
    assert.equal(fs.readFileSync(path.join(a.dir,'script.js'),'utf8'),'let original = 3;\nfunction readOriginal() { return original; }\n');
    assert.equal(fs.readFileSync(path.join(a.dir,'style.css'),'utf8'),':root { --color: #1a2035; }\n:root { --color: #4fc3f7; }\n');
    assert.equal(fs.readFileSync(path.join(a.dir,'index.html'),'utf8'),'<!doctype html><html><body><div>원래 기록</div></body></html>\n');checkFeatureBundles(a.dir);
});
test('editing only generated output fails the guard; rebuilding restores it from the sources',async t=>{
    const {writeFeatureBundles,checkFeatureBundles}=await api;const a=fixture(t);writeFeatureBundles(a.dir);
    a.write('script.js','let unwanted = true;');assert.throws(()=>checkFeatureBundles(a.dir),/Generated files differ: script.js/);
    writeFeatureBundles(a.dir);assert.match(fs.readFileSync(path.join(a.dir,'script.js'),'utf8'),/original = 3/);checkFeatureBundles(a.dir);
});
test('invalid JS is rejected before any existing deployment file is replaced',async t=>{
    const {writeFeatureBundles}=await api;const a=fixture(t);writeFeatureBundles(a.dir);
    const before=fs.readFileSync(path.join(a.dir,'script.js'));a.write('features/two.js','function broken( {');
    assert.throws(()=>writeFeatureBundles(a.dir),/Unexpected/);assert(fs.readFileSync(path.join(a.dir,'script.js')).equals(before));
});
test('duplicate chunks and paths outside the project cannot enter the bundle',async t=>{
    const {writeFeatureBundles}=await api;const a=fixture(t);a.m.bundles[0].sources.push(a.m.bundles[0].sources[0]);a.save();assert.throws(()=>writeFeatureBundles(a.dir),/duplicate source/);
    a.m.bundles[0].sources.pop();a.m.bundles[0].sources[0].path='features/../../outside.js';a.save();assert.throws(()=>writeFeatureBundles(a.dir),/Path leaves project/);
});
test('source changes and stale file/function documentation are both detected',async t=>{
    const {writeFeatureBundles,checkFeatureBundles}=await api;const a=fixture(t);writeFeatureBundles(a.dir);
    a.write('features/two.js','function newFunction() { return original; }\n');assert.throws(()=>checkFeatureBundles(a.dir),/FEATURE_SYMBOLS.md/);
    writeFeatureBundles(a.dir);assert.match(fs.readFileSync(path.join(a.dir,'docs/FEATURE_SYMBOLS.md'),'utf8'),/newFunction/);
    a.write('docs/FEATURE_FILES.md','outdated');assert.throws(()=>checkFeatureBundles(a.dir),/FEATURE_FILES.md/);
});

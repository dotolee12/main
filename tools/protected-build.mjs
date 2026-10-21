import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import JavaScriptObfuscator from "javascript-obfuscator";
import { minify as minifyHtml } from "html-minifier-terser";
import CleanCSS from "clean-css";
import { minify as minifyJs } from "terser";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const keyPath = path.join(root, ".giloa-author.key");
const expectedKeyHash = "54bf51583e8807cf3144a579beb79fd852ab117b13a0186cd957d46ccdaf02a7";
const checkOnly = process.argv.includes("--check");
const syncAndroid = process.argv.includes("--sync-android");
const testerBuild = process.argv.includes("--tester");
const outputDir = path.join(root, "protected-dist");
const androidAssets = path.join(root, "android-app", "app", "src", "main", "assets", "www");
const passthroughAndroidAssets = ["data/parking/bundle.js", "data/libraries_seoul.bundle.js"];

function fail(message) {
    process.stderr.write("[GILOA PROTECT] " + message + "\n");
    process.exit(1);
}
function read(file) { return fs.readFileSync(path.join(root, file), "utf8"); }
function digest(buffer) { return crypto.createHash("sha256").update(buffer).digest("hex"); }
function requireAuthorKey() {
    if (!fs.existsSync(keyPath)) fail("Author key is missing: .giloa-author.key");
    if (digest(fs.readFileSync(keyPath)) !== expectedKeyHash) fail("Author key is invalid or damaged.");
}

requireAuthorKey();
const requiredSources = ["privacy-policy.js", "privacy-policy.html", "privacy-policy.css", "index.html", "style.css", "time-trace.css", "tutorial.css", "config.js", "map-bootstrap.js", "script.js", "trip-share.js", "supabase-sync.js", "time-trace.js", "region-stay-core.js", "hidden-missions.js", "tutorial.js", "sw.js"];
requiredSources.forEach((file) => { if (!fs.existsSync(path.join(root, file))) fail("Required source is missing: " + file); });
// Fail before replacing build output if the packaged map cannot get its URL.
const configSource = read("config.js");
try {
    const context = { window:{} };
    vm.runInNewContext(configSource, context, { timeout:1000 });
    const tileUrl = context.window.GILOA_CARTO_TILE_URL;
    if (typeof tileUrl !== "string" || !tileUrl.includes("{z}/{x}/{y}") ||
        new URL(tileUrl).hostname !== "basemaps.cartocdn.com" ||
        new URL(tileUrl).protocol !== "https:" || !new URL(tileUrl).searchParams.get("key")) {
        fail("CARTO tile configuration is missing or invalid in config.js.");
    }
} catch (_) { fail("Cannot evaluate map configuration in config.js."); }
if (checkOnly) {
    process.stdout.write("[GILOA PROTECT] Author key and source files verified.\n");
    process.exit(0);
}

fs.rmSync(outputDir, { recursive:true, force:true });
fs.mkdirSync(outputDir, { recursive:true });

const obfuscatorOptions = {
    compact:true,
    controlFlowFlattening:false,
    deadCodeInjection:false,
    debugProtection:false,
    disableConsoleOutput:false,
    identifierNamesGenerator:"hexadecimal",
    renameGlobals:false,
    selfDefending:false,
    simplify:true,
    splitStrings:false,
    stringArray:true,
    stringArrayCallsTransform:true,
    stringArrayCallsTransformThreshold:0.5,
    stringArrayEncoding:[],
    stringArrayIndexShift:true,
    stringArrayRotate:true,
    stringArrayShuffle:true,
    stringArrayThreshold:0.65,
    unicodeEscapeSequence:false
};
const jsOutputs = {
    "script.js":"script.obfuscated.js",
    "trip-share.js":"trip-share.obfuscated.js",
    "supabase-sync.js":"supabase-sync.obfuscated.js",
    "time-trace.js":"time-trace.obfuscated.js",
    "region-stay-core.js":"region-stay-core.obfuscated.js",
    "hidden-missions.js":"hidden-missions.obfuscated.js",
    "tutorial.js":"tutorial.obfuscated.js"
};
for (const [source, destination] of Object.entries(jsOutputs)) {
    // Preserve public/global names used by inline HTML and native bridges.
    // Remove comments and unreachable debug branches before obfuscation.
    const compactSource = await minifyJs(read(source), {
        compress:{ defaults:false, dead_code:true, evaluate:true, conditionals:true, reduce_vars:true, side_effects:true },
        mangle:false,
        keep_fnames:true,
        keep_classnames:true,
        format:{ comments:false }
    });
    if (!compactSource.code) fail("JavaScript compression produced no output: " + source);
    const result = JavaScriptObfuscator.obfuscate(compactSource.code, obfuscatorOptions).getObfuscatedCode();
    fs.writeFileSync(path.join(outputDir, destination), result, "utf8");
}

const cleanCss = new CleanCSS({ level:1 }).minify(read("style.css"));
if (cleanCss.errors.length) fail("CSS minification failed: " + cleanCss.errors.join("; "));
fs.writeFileSync(path.join(outputDir, "style.css"), cleanCss.styles, "utf8");
const timeTraceCss = new CleanCSS({ level:1 }).minify(read("time-trace.css"));
if (timeTraceCss.errors.length) fail("Time Trace CSS minification failed: " + timeTraceCss.errors.join("; "));
fs.writeFileSync(path.join(outputDir, "time-trace.css"), timeTraceCss.styles, "utf8");
fs.writeFileSync(path.join(outputDir, "tutorial.css"), read("tutorial.css"), "utf8");
fs.writeFileSync(path.join(outputDir, "map-bootstrap.js"), await minifyJs(read("map-bootstrap.js"), { compress:true, mangle:true, format:{ comments:false } }).then((result) => result.code), "utf8");
fs.writeFileSync(path.join(outputDir, "config.js"), configSource, "utf8");

let html = read("index.html")
    // Each application script appears in both a preload and a body tag.
    // Replace every occurrence so the protected Android bundle never points
    // at a removed plaintext file (which would stop all UI handlers).
    .replace(/\.\/region-stay-core\.js\?v=[^\"']+/g, "./region-stay-core.obfuscated.js?v=protected-1")
    .replace(/\.\/script\.js\?v=[^\"']+/g, "./script.obfuscated.js?v=protected-1")
    .replace(/\.\/supabase-sync\.js\?v=[^\"']+/g, "./supabase-sync.obfuscated.js?v=protected-1")
    .replace(/\.\/time-trace\.js\?v=[^\"']+/g, "./time-trace.obfuscated.js?v=protected-1")
    .replace(/\.\/hidden-missions\.obfuscated\.js\?v=[^\"']+/g, "./hidden-missions.obfuscated.js?v=protected-1")
    .replace(/\.\/tutorial\.js\?v=[^\"']+/g, "./tutorial.obfuscated.js?v=protected-1")
    .replace("window.GILOA_TESTER_ENROLLMENT_OPEN = false", "window.GILOA_TESTER_ENROLLMENT_OPEN = " + (testerBuild ? "true" : "false"));
html = html.replace(/\.\/trip-share\.js\?v=[^\"']+/g, "./trip-share.obfuscated.js?v=protected-1");
html = await minifyHtml(html, {
    collapseWhitespace:true,
    conservativeCollapse:true,
    removeComments:true,
    removeRedundantAttributes:false,
    removeAttributeQuotes:false,
    minifyCSS:false,
    minifyJS:false
});
fs.writeFileSync(path.join(outputDir, "index.html"), html, "utf8");

let swSource = read("sw.js")
    .replace(/\.\/region-stay-core\.js/g, "./region-stay-core.obfuscated.js")
    .replace(/\.\/script\.js/g, "./script.obfuscated.js")
    .replace(/\.\/supabase-sync\.js/g, "./supabase-sync.obfuscated.js")
    .replace(/\.\/time-trace\.js/g, "./time-trace.obfuscated.js")
    .replace(/\.\/tutorial\.js/g, "./tutorial.obfuscated.js");
swSource = swSource.replace(/\.\/trip-share\.js/g, "./trip-share.obfuscated.js");
const swResult = await minifyJs(swSource, { compress:true, mangle:true, format:{ comments:false } });
if (!swResult.code) fail("Service worker minification produced no output.");
fs.writeFileSync(path.join(outputDir, "sw.js"), swResult.code, "utf8");

["privacy-policy.js", "privacy-policy.html", "privacy-policy.css"].forEach((name) => fs.copyFileSync(path.join(root, name), path.join(outputDir, name)));
const outputNames = ["privacy-policy.js", "privacy-policy.html", "privacy-policy.css", "index.html", "style.css", "time-trace.css", "tutorial.css", "config.js", "map-bootstrap.js", "sw.js", ...Object.values(jsOutputs)];
const manifest = { version:1, buildType:testerBuild ? "prelaunch-tester" : "production", createdAt:new Date().toISOString(), files:{} };
outputNames.forEach((name) => { manifest.files[name] = digest(fs.readFileSync(path.join(outputDir, name))); });
fs.writeFileSync(path.join(outputDir, "protected-manifest.json"), JSON.stringify(manifest, null, 2), "utf8");

if (syncAndroid) {
    if (!fs.existsSync(androidAssets)) fail("Android assets directory is missing.");
    [...outputNames, "protected-manifest.json"].forEach((name) => fs.copyFileSync(path.join(outputDir, name), path.join(androidAssets, name)));
    if (digest(fs.readFileSync(path.join(androidAssets, "config.js"))) !== manifest.files["config.js"]) {
        fail("Android config.js verification failed.");
    }
    passthroughAndroidAssets.forEach((name) => {
        const source = path.join(root, name);
        const target = path.join(androidAssets, name);
        if (!fs.existsSync(source)) fail("Android asset is missing: " + name);
        fs.mkdirSync(path.dirname(target), { recursive:true });
        fs.copyFileSync(source, target);
    });
    ["script.js", "trip-share.js", "supabase-sync.js", "time-trace.js", "region-stay-core.js", "tutorial.js"].forEach((name) => {
        const target = path.join(androidAssets, name);
        if (fs.existsSync(target)) fs.rmSync(target);
    });
}

process.stdout.write("[GILOA PROTECT] Protected files created" + (syncAndroid ? " and synced to Android assets" : "") + ".\n");

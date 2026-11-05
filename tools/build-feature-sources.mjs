/** Assemble feature source chunks without rewriting their bytes or execution order. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import {fileURLToPath, pathToFileURL} from 'node:url';

export const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function within(root, relative) {
    if (typeof relative !== 'string' || path.isAbsolute(relative)) throw new Error('Expected a relative project path');
    const resolved = path.resolve(root, relative);
    if (!resolved.startsWith(root + path.sep)) throw new Error('Path leaves project: ' + relative);
    if (!fs.realpathSync(resolved).startsWith(fs.realpathSync(root) + path.sep)) throw new Error('Symlink leaves project: ' + relative);
    return resolved;
}
export function prepareBundles(root = projectRoot) {
    root = path.resolve(root);
    const manifest = JSON.parse(fs.readFileSync(path.join(root, 'features/bundles.json'), 'utf8'));
    if (manifest.version !== 1 || !Array.isArray(manifest.bundles)) throw new Error('Unsupported feature manifest');
    const seenSources = new Set(), seenOutputs = new Set();
    const bundles = manifest.bundles.map(bundle => {
        if (!['script.js', 'style.css', 'index.html'].includes(bundle.output) || seenOutputs.has(bundle.output)) throw new Error('Invalid/duplicate output: ' + bundle.output);
        seenOutputs.add(bundle.output);
        if (!Array.isArray(bundle.sources) || !bundle.sources.length) throw new Error('Empty bundle: ' + bundle.output);
        const chunks = bundle.sources.map(entry => {
            if (!entry.path.startsWith('features/') || seenSources.has(entry.path)) throw new Error('Invalid/duplicate source: ' + entry.path);
            seenSources.add(entry.path);
            const bytes = fs.readFileSync(within(root, entry.path));
            // Every JS source ends at a statement boundary. Validate before any writes.
            if (bundle.output.endsWith('.js')) new vm.Script(bytes.toString('utf8'), {filename:entry.path});
            return {...entry, bytes};
        });
        const bytes = Buffer.concat(chunks.map(chunk => chunk.bytes));
        if (bundle.output.endsWith('.js')) new vm.Script(bytes.toString('utf8'), {filename:bundle.output});
        return {...bundle, chunks, bytes};
    });
    if (seenOutputs.size !== 3) throw new Error('All three runtime files must be declared');
    return {root, manifest, bundles};
}
export function generatedDocumentation(prepared) {
    const {bundles, manifest} = prepared;
    const rows = ['# 기능별 원본 파일 목록', '', '> 자동 생성: `npm run features:build`. 직접 수정하지 말고 역할은 `features/bundles.json`에서 수정하세요.', '',
        '수정 시작점과 검색 방법은 [FEATURE_MAP.md](../FEATURE_MAP.md)를 먼저 읽으세요. 아래 순서는 합치는 순서이며 바꾸면 안 됩니다.', '',
        '## 나뉜 원본', '', '| 배포 파일 | 수정할 원본 | 역할 |', '|---|---|---|'];
    for (const bundle of bundles) for (const entry of bundle.sources) rows.push(`| \`${bundle.output}\` | [${entry.path}](../${entry.path}) | ${entry.role} |`);
    rows.push('', '## 기존에 독립된 기능 파일', '', '| 수정할 파일 | 역할 |', '|---|---|');
    for (const entry of manifest.standalone || []) rows.push(`| [${entry.path}](../${entry.path}) | ${entry.role} |`);
    rows.push('', 'HTML 조각은 완성된 페이지가 아닙니다. 화면 확인은 조립한 프로젝트 루트의 `index.html`을 서버로 열거나 https://giloa.kr/ 에서 하세요.', '');
    const symbols = ['# 기능 함수 찾기', '', '> 자동 생성: `npm run features:build`. 함수 이름 또는 기능 이름으로 찾으세요.', '', '| 함수 | 수정할 원본 |', '|---|---|'];
    for (const bundle of bundles.filter(b => b.output.endsWith('.js'))) for (const chunk of bundle.chunks) {
        for (const match of chunk.bytes.toString('utf8').matchAll(/^(?:async )?function\s+([\w$]+)\s*\(/gm)) symbols.push(`| \`${match[1]}\` | [${chunk.path}](../${chunk.path}) |`);
    }
    symbols.push('', '다른 기능 파일 내부의 함수·CSS 선택자·HTML ID는 `FEATURE_MAP.md`의 검색 절차를 사용하세요.', '');
    return new Map([['docs/FEATURE_FILES.md', Buffer.from(rows.join('\n'))], ['docs/FEATURE_SYMBOLS.md', Buffer.from(symbols.join('\n'))]]);
}
export function checkFeatureBundles(root = projectRoot) {
    const prepared = prepareBundles(root), expected = new Map(prepared.bundles.map(b => [b.output, b.bytes]));
    for (const [name, bytes] of generatedDocumentation(prepared)) expected.set(name, bytes);
    const stale = [];
    for (const [name, bytes] of expected) {
        const target = path.join(prepared.root, name);
        if (!fs.existsSync(target) || !fs.readFileSync(target).equals(bytes)) stale.push(name);
    }
    if (stale.length) throw new Error('Generated files differ: ' + stale.join(', ') + '. Edit feature sources, then run npm run features:build.');
    return prepared;
}
export function writeFeatureBundles(root = projectRoot) {
    const prepared = prepareBundles(root); // Complete syntax/path checks before changing any output.
    const outputs = new Map(prepared.bundles.map(b => [b.output, b.bytes]));
    for (const [name, bytes] of generatedDocumentation(prepared)) outputs.set(name, bytes);
    for (const [name, bytes] of outputs) {
        const target = path.join(prepared.root, name);
        if (fs.existsSync(target) && fs.readFileSync(target).equals(bytes)) continue;
        fs.mkdirSync(path.dirname(target), {recursive:true});
        fs.writeFileSync(target, bytes);
    }
    return prepared;
}
export function verifyInitialBaseline(prepared) {
    for (const bundle of prepared.bundles) if (hash(bundle.bytes) !== prepared.manifest.baseline?.[bundle.output]) throw new Error('Original split baseline differs: ' + bundle.output);
}
function findFeature(query) {
    if (!query) throw new Error('Usage: npm run features:find -- <기능 이름 또는 함수 이름>');
    const prepared = prepareBundles(), needle = query.toLowerCase();
    const entries = prepared.bundles.flatMap(b => b.sources).concat(prepared.manifest.standalone || []);
    for (const entry of entries) {
        const content = fs.readFileSync(within(projectRoot, entry.path), 'utf8');
        const matches = content.split('\n').flatMap((line, index) => line.toLowerCase().includes(needle) ? [`  ${index + 1}: ${line.trim().slice(0, 180)}`] : []);
        if ((entry.path + ' ' + entry.role).toLowerCase().includes(needle) || matches.length) console.log(entry.path + ' — ' + entry.role + '\n' + matches.slice(0,3).join('\n'));
    }
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
    try {
        const args = process.argv.slice(2);
        if (args[0] === '--find') findFeature(args.slice(1).join(' '));
        else {
            if (args.length && !['--check','--write','--verify-baseline'].includes(args[0])) throw new Error('Use --check, --write, --verify-baseline or --find');
            const prepared = args[0] === '--write' ? writeFeatureBundles() : checkFeatureBundles();
            if (args[0] === '--verify-baseline') verifyInitialBaseline(prepared);
            console.log('[GILOA FEATURES] ' + prepared.bundles.map(b => b.output + ': ' + b.sources.length + ' sources').join(' | ') + ' — OK');
        }
    } catch (error) { console.error('[GILOA FEATURES] ' + error.message); process.exitCode = 1; }
}

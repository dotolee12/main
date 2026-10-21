const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'script.js'), 'utf8');

function section(start, end) {
    const from = source.indexOf(start);
    const to = source.indexOf(end, from + start.length);
    assert(from >= 0 && to > from, 'Expected source section');
    return source.slice(from, to);
}

function fixture() {
    const saved = new Map();
    const context = vm.createContext({
        encodeURI, console, currentLang: 'ko', normalizeLang: lang => lang,
        COLLECTION_KEY: 'collection-test', REGION_STAY_KEY: 'stay-test',
        regionStayState: null, badges: [], visitStamps: [], items: [],
        localStorage: { getItem: key => saved.get(key) || null, setItem: (key, value) => saved.set(key, value) },
        enrollPrelaunchTesterIfOpen() {}, grantTesterSproutGift() {}, updateBadgeList() {}, updateVisitList() {}
    });
    vm.runInContext(section('function getCollectionImage(', 'function animateRegionBadgeToMenu('), context);
    vm.runInContext(section('var REGION_BADGE_ATLAS_ENTRIES =', 'function getRegionBadgeAtlasText('), context);
    vm.runInContext(section('var REGION_STAY_TARGETS =', '// Coarse municipal outlines'), context);
    vm.runInContext(section('function loadRegionStayState(', 'function normalizeRegionName('), context);
    vm.runInContext(section('const IMAGE_CLASS_BADGES =', 'const LEVEL_TABLE =').replace('const IMAGE_CLASS_BADGES', 'var IMAGE_CLASS_BADGES'), context);
    return { context, saved };
}

test('Hanam stay and image recognition badges cannot be awarded', () => {
    const { context, saved } = fixture();
    for (const id of ['region_hanam_1h', 'image_hanam_bangul']) {
        assert.equal(context.BADGE_DEFS.some(def => def.id === id), false);
        context.earnBadge(id);
    }
    assert.equal(context.badges.length, 0);
    assert.equal(saved.size, 0, 'No write or reset when a retired badge is requested');
    assert.equal(context.IMAGE_CLASS_BADGES['Hanam Bangul'], undefined);
});

test('atlas contains only Gimpo and Goyang, with translations and existing artwork', () => {
    const { context } = fixture();
    assert.deepEqual(Array.from(context.REGION_BADGE_ATLAS_ENTRIES, entry => entry.id), ['region_gimpo_1h', 'region_goyang_1h']);
    for (const entry of context.REGION_BADGE_ATLAS_ENTRIES) {
        const def = context.BADGE_DEFS.find(item => item.id === entry.id);
        assert(def);
        assert(fs.existsSync(path.join(root, decodeURI(def.image))));
        for (const language of ['ko', 'en', 'ja', 'zh', 'es', 'fr']) {
            context.currentLang = language;
            assert(context.getBadgeText(def).name);
            assert(context.REGION_BADGE_ATLAS_I18N[language].cities[entry.id]);
        }
    }
});

test('existing Hanam badge, item and visit history survives collection restore/save unchanged', () => {
    const { context, saved } = fixture();
    const oldCollection = {
        badges: [{ id: 'region_hanam_1h', earnedAt: 100 }, { id: 'image_hanam_bangul', earnedAt: 200 }, { id: 'region_goyang_1h', earnedAt: 300 }],
        visitStamps: [{ id: 'saved-visit', visitedAt: 400 }],
        items: [{ id: 'saved-item', earnedAt: 500 }]
    };
    saved.set('collection-test', JSON.stringify(oldCollection));
    context.loadCollection();
    context.saveCollection();
    assert.deepEqual(JSON.parse(saved.get('collection-test')), oldCollection);
    assert.equal(context.badges.length, 3, 'Historical badge count used by growth is preserved');
});

test('Hanam stay state remains initialized and existing accumulated time is preserved', () => {
    const { context, saved } = fixture();
    saved.set('stay-test', JSON.stringify({ '하남시': { pathMs: 3600000, liveMs: 3600000, accumulatedMs: 3600000, customHistory: 'keep' } }));
    const state = context.loadRegionStayState();
    assert.equal(state['하남시'].accumulatedMs, 3600000);
    context.saveRegionStayState();
    assert.equal(JSON.parse(saved.get('stay-test'))['하남시'].customHistory, 'keep');
    assert(state['김포시'] && state['고양시']);
    const fresh = fixture().context.loadRegionStayState();
    assert(fresh['하남시'], 'Fallback boundary must not return a city with no state entry');
});

test('active markup, CSS and credits no longer contain Hanam mascot visuals', () => {
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
    assert.equal(/하남이|방울이|badge-hanam|badge-bangul/.test(html + css), false);
    const credits = source.split(/\r?\n/).find(line => line.includes('sourceMascots:['));
    assert(credits);
    assert.equal(/하남|방울|Hanam|Banguri|河南|ハナミ|バンウリ/.test(credits), false);
    assert.equal(source.includes('getProvinceAsset("하남시'), false);
    assert.equal(source.includes('badge-hanam'), false);
    const assets = path.join(root, 'assets/province/하남시 - 하남이와 방울이');
    assert.equal(fs.existsSync(assets) ? fs.readdirSync(assets).length : 0, 0);
});

// Run: GPX_TEST_DEPS=/absolute/node_modules node tests/gpx-sharing.test.cjs
// Dependencies: @electric-sql/pglite and jsdom. Synthetic coordinates only.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const deps = process.env.GPX_TEST_DEPS;
if (!deps) throw new Error('Set GPX_TEST_DEPS to the test dependencies node_modules directory');
const { PGlite } = require(path.join(deps, '@electric-sql/pglite'));
const { JSDOM } = require(path.join(deps, 'jsdom'));
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'gpx-sharing.js'), 'utf8');
const gpx = '<gpx version="1.1"><trk><trkseg><trkpt lat="1" lon="2"><time>2026-01-01T00:00:00Z</time></trkpt><trkpt lat="1.1" lon="2.1"/></trkseg></trk></gpx>';
const A = '00000000-0000-0000-0000-000000000001';
const B = '00000000-0000-0000-0000-000000000002';
const C = '00000000-0000-0000-0000-000000000003';

async function databaseTests() {
    const db = new PGlite();
    await db.exec(`create role anon; create role authenticated; create schema auth;
        create table auth.users(id uuid primary key);
        create function auth.uid() returns uuid language sql stable as
        'select nullif(current_setting(''request.jwt.claim.sub'', true), '''')::uuid';
        grant usage on schema public, auth to anon, authenticated;
        grant execute on function auth.uid() to anon, authenticated;
        insert into auth.users values ('${A}'), ('${B}'), ('${C}');`);
    await db.exec(fs.readFileSync(path.join(root, 'supabase/migrations/20261019_gpx_sharing.sql'), 'utf8'));
    async function as(uid) {
        await db.exec('reset role');
        await db.query("select set_config('request.jwt.claim.sub',$1,false)", [uid || '']);
        await db.exec('set role ' + (uid ? 'authenticated' : 'anon'));
    }
    await as(A);
    assert.equal((await db.query("select public.gpx_register_identity('alice') id")).rows[0].id, 'alice');
    await assert.rejects(db.query("select public.gpx_register_identity('renamed')"), /GPX_ALREADY_REGISTERED/);
    await as(B);
    await assert.rejects(db.query("select public.gpx_register_identity('alice')"), /GPX_HANDLE_TAKEN/);
    await db.query("select public.gpx_register_identity('bob')");
    await as(C);
    await db.query("select public.gpx_register_identity('carol')");
    const send = (requestId, target = 'bob', content = gpx) => db.query(
        'select public.gpx_send_route($1,$2,$3,$4,$5) id', [requestId, target, 'Synthetic walk', content, 2]);
    await as(A);
    const requestId = '10000000-0000-0000-0000-000000000001';
    const delivery = (await send(requestId)).rows[0].id;
    assert.equal((await send(requestId)).rows[0].id, delivery, 'same retry must not duplicate delivery');
    await assert.rejects(send(requestId, 'carol'), /GPX_INVALID/);
    await assert.rejects(send('10000000-0000-0000-0000-000000000002','alice'), /GPX_SELF/);
    await assert.rejects(send('10000000-0000-0000-0000-000000000002','unknown'), /GPX_RECIPIENT_NOT_FOUND/);
    await assert.rejects(send('10000000-0000-0000-0000-000000000002','bob','x'.repeat(1048577)), /GPX_INVALID/);
    await assert.rejects(db.query('select * from public.gpx_share_identities'), /permission denied/);
    await assert.rejects(db.query("insert into public.gpx_transfers default values"), /permission denied/);
    await as(B);
    const received = await db.query('select sender_handle, gpx_content from public.gpx_transfers');
    assert.equal(received.rows.length, 1); assert.equal(received.rows[0].sender_handle, 'alice');
    assert.equal(received.rows[0].gpx_content, gpx);
    await assert.rejects(db.query('update public.gpx_transfers set route_name=$1 where id=$2',['spoof',delivery]), /permission denied/);
    await as(C);
    assert.equal((await db.query('select * from public.gpx_transfers where id=$1',[delivery])).rows.length, 0, 'third party cannot read by guessed transfer ID');
    await as(null);
    await assert.rejects(db.query('select * from public.gpx_transfers'), /permission denied/);
    await assert.rejects(db.query('select public.gpx_my_identity()'), /permission denied/);
    await as(A);
    for (let n = 2; n <= 20; n++) await send('10000000-0000-0000-0000-' + String(n).padStart(12,'0'));
    await assert.rejects(send('10000000-0000-0000-0000-000000000021'), /GPX_LIMIT/);
    assert.equal((await send(requestId)).rows[0].id, delivery, 'retry is still allowed at daily limit');
    await db.close();
    console.log('PASS database: delivery, recipient-only RLS, anonymous/third-party denial, no spoofed inserts/updates, identity uniqueness, retry idempotency, size limit, daily limit');
}

async function uiTests() {
    const html = fs.readFileSync(path.join(root,'index.html'),'utf8');
    const panel = html.slice(html.indexOf('<div id="panel-gpx"'), html.indexOf('<div id="panel-visit"'));
    const dom = new JSDOM('<!doctype html><body>' + panel + '<input id="cloud-email"></body>', {url:'https://example.test',runScripts:'outside-only'});
    const w = dom.window, d = w.document;
    let saves = [{id:'route1',name:'Synthetic walk',gpxContent:gpx,pointCount:2}], uid = A, configured = true;
    let failOnce = false, calls = [], mapContent = null, failStorage = false, myId = 'alice', deferInbox = null;
    Object.assign(w, {currentLang:'ko', Blob:global.Blob, isHudExpanded:false,
        loadGpxSaves:()=>saves, saveGpxSaves:next=>{if(failStorage)return false;saves=next;return true;},
        clearActiveGpxRoute:()=>{},drawGpxRoute:content=>{mapContent=content;},updateGpxSavedList:()=>{},
        toggleSidebar:()=>{},toggleHud:()=>{}});
    w.GiloaCloud = {isConfigured:()=>configured,getSharingUserId:()=>uid, sharingRequest:async(route,opts)=>{
        calls.push({route,body:opts && JSON.parse(opts.body)});
        if (route.endsWith('/gpx_my_identity')) return myId;
        if (route.endsWith('/gpx_send_route')) { if(failOnce){failOnce=false;throw Error('network');} return 'delivery1'; }
        if (route.includes('select=gpx_content')) return [{gpx_content:gpx}];
        if (deferInbox) return new Promise(resolve=>{deferInbox.resolve=resolve;});
        return [{id:'delivery1',route_name:'<img src=x onerror=alert(1)>',sender_handle:'bob',point_count:2,created_at:'2026-01-01T00:00:00Z'}];
    }};
    const settle = async()=>{for(let n=0;n<8;n++)await new Promise(resolve=>setImmediate(resolve));};
    const submit = async()=>{d.getElementById('gpx-share-form').dispatchEvent(new w.Event('submit',{cancelable:true}));await settle();};
    const signChange=async()=>{w.dispatchEvent(new w.Event('giloa:account-changed'));await settle();};
    w.eval(source); await settle();
    assert.equal(d.getElementById('gpx-share-id-value').textContent,'alice');
    assert.equal(d.querySelector('#gpx-share-inbox img'),null,'untrusted route title must remain text');
    assert.equal(d.getElementById('gpx-share-send').disabled,false);
    d.getElementById('gpx-share-recipient').value='bob';
    await submit();
    assert.equal(calls.filter(c=>c.route.endsWith('/gpx_send_route')).length,0,'no send without explicit consent');
    d.getElementById('gpx-share-consent').checked=true;failOnce=true;
    await submit();await submit();
    const sends=calls.filter(c=>c.route.endsWith('/gpx_send_route'));
    assert.equal(sends.length,2); assert.equal(sends[0].body.p_request_id,sends[1].body.p_request_id);
    assert.equal(sends[1].body.p_recipient_handle,'bob'); assert.equal(d.getElementById('gpx-share-consent').checked,false);
    saves[0].gpxContent='<gpx><trkpt lat="999" lon="2"/><trkpt lat="1" lon="2"/></gpx>';
    d.getElementById('gpx-share-consent').checked=true;await submit();
    assert.equal(calls.filter(c=>c.route.endsWith('/gpx_send_route')).length,2,'invalid coordinates rejected');
    saves[0].gpxContent=gpx;
    const open = d.querySelector('#gpx-share-inbox button');open.click();await settle();
    assert.equal(mapContent,gpx); assert.equal(saves.length,2);
    open.click();await settle();assert.equal(saves.length,2,'opening twice must not duplicate local saved route');
    saves=saves.filter(s=>s.id!=='received:delivery1');failStorage=true;mapContent=null;
    open.click();await settle();assert.equal(mapContent,null,'do not claim saved route when local storage fails');
    failStorage=false;
    uid=null;await signChange();assert.equal(d.querySelectorAll('#gpx-share-inbox article').length,0);assert.equal(d.getElementById('gpx-share-send').disabled,true);
    configured=false;await signChange();assert.equal(d.getElementById('gpx-share-setup').hidden,false);
    configured=true;uid=B;myId='bob';deferInbox={};
    w.dispatchEvent(new w.Event('giloa:account-changed'));await settle();
    uid=null;await signChange();deferInbox.resolve([{id:'stale',route_name:'private',sender_handle:'alice',created_at:'2026-01-01'}]);await settle();
    assert.equal(d.querySelectorAll('#gpx-share-inbox article').length,0,'late response after sign-out cannot reveal inbox');
    for(const lang of ['ko','en','ja','zh','es','fr']){w.currentLang=lang;w.GiloaGpxSharing.applyLanguage();assert.ok(d.getElementById('gpx-share-title').textContent);}
    dom.window.close();
    console.log('PASS UI: explicit consent, matching retry IDs, GPX validation, safe route titles, map import, no duplicate saves, storage failure, sign-out race, setup state, six languages');
}
(async()=>{await databaseTests();await uiTests();})().catch(error=>{console.error(error);process.exitCode=1;});

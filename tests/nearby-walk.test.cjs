const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const context = vm.createContext({});
vm.runInContext(fs.readFileSync("features/explore/walk-core.js", "utf8"), context);
const core = context.GiloaWalkCore;
function ring() {
    const elements = Array.from({length:24}, (_, index) => {
        const angle = index * Math.PI * 2 / 24;
        return {type:"node", id:index + 1, lat:37 + Math.sin(angle) * 0.0009, lon:127 + Math.cos(angle) * 0.00113};
    });
    elements.push({type:"way", id:100, tags:{highway:"footway"}, nodes:[...Array.from({length:24}, (_, i) => i + 1), 1]});
    return elements;
}
test("walking recommendation returns to start exclusively on actual graph edges", () => {
    const elements = ring();
    const graph = core.graph(elements);
    const route = core.plan(graph, {lat:elements[0].lat, lng:elements[0].lon}, 10, []);
    assert.deepEqual(route.coords[0], route.coords.at(-1));
    assert.ok(route.length > 500 && route.length < 850);
    for (let i = 1; i < route.coords.length; i++) {
        const from = [...graph.nodes].find(([, p]) => p === route.coords[i - 1])[0];
        const to = [...graph.nodes].find(([, p]) => p === route.coords[i])[0];
        assert.ok(graph.links.get(from).some(edge => edge.id === to));
    }
});
test("private, blocked and missing ways do not create connectors", () => {
    assert.equal(core.walkable({highway:"footway", access:"private"}), false);
    assert.equal(core.walkable({highway:"motorway", foot:"yes"}), false);
    assert.equal(core.walkable({highway:"residential", foot:"use_sidepath"}), false);
    assert.equal(core.walkable({highway:"footway", "foot:conditional":"no @ night"}), false);
    const elements = ring();
    elements[2].tags = {barrier:"gate", access:"private"};
    const graph = core.graph(elements);
    assert.equal(graph.links.has(3), false);
    assert.throws(() => core.plan(graph, {lat:0, lng:0}, 10, []), /noRoad/);
    assert.throws(() => core.plan(core.graph([]), {lat:37, lng:127}, 20, []), /noRoad/);
});
test("one-way pedestrian paths remain directional", () => {
    const elements = ring();
    elements.at(-1).tags["oneway:foot"] = "yes";
    const graph = core.graph(elements);
    assert.equal(graph.links.get(1).some(edge => edge.id === 24), false);
    const result = core.plan(graph, {lat:elements[0].lat, lng:elements[0].lon}, 10, []);
    assert.ok(result.coords.length > 24);
});

test("a single connected road can supply an out-and-back walk", () => {
    const elements=Array.from({length:11},(_,i)=>({type:"node",id:i,lat:37.5665+i*.0009,lon:126.978}));
    elements.push({type:"way",id:50,nodes:Array.from({length:11},(_,i)=>i),tags:{highway:"footway"}});
    const graph=core.graph(elements), route=core.plan(graph,{lat:37.5665,lng:126.978},20,[]);
    assert.deepEqual(route.coords[0],route.coords.at(-1));
    assert(route.length>=20*60*1.1*.65 && route.length<=20*60*1.1*1.3);
    for(let i=1;i<route.coords.length;i++) {
        const a=[...graph.nodes].find(([,p])=>p===route.coords[i-1])[0];
        const b=[...graph.nodes].find(([,p])=>p===route.coords[i])[0];
        assert(graph.links.get(a).some(edge=>edge.id===b));
    }
});
test('a long road is usable from its middle even when its original endpoints are far away',()=>{
 const elements=[{type:'node',id:1,lat:37,lon:127},{type:'node',id:2,lat:37.018,lon:127},{type:'way',id:10,nodes:[1,2],tags:{highway:'footway'}}];
 const route=core.plan(core.graph(elements),{lat:37.009,lng:127},10,[]);
 assert(route.approach<=25);assert(route.length>=429 && route.length<=858);
 assert.deepEqual(route.coords[0],route.coords.at(-1));
 for(const p of route.coords)assert.equal(p.lng,127);
});
test('sidewalk-tagged streets and pedestrian bollards stay connected; private gates do not',()=>{
 assert.equal(core.walkable({highway:'tertiary',sidewalk:'both'}),true);
 assert.equal(core.walkable({highway:'tertiary',sidewalk:'both',foot:'no'}),false);
 const elements=ring();elements[2].tags={barrier:'bollard'};
 assert(core.graph(elements).links.has(3));
 elements[2].tags={barrier:'gate',access:'private'};assert.equal(core.graph(elements).links.has(3),false);
});

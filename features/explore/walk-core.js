// Pure walking graph. All displayed legs must be edges in the downloaded graph.
var GiloaWalkCore = (function () {
    "use strict";
    function distance(a, b) {
        var radians = Math.PI / 180;
        var dlat = (b.lat - a.lat) * radians, dlng = (b.lng - a.lng) * radians;
        var h = Math.sin(dlat / 2) ** 2 + Math.cos(a.lat * radians) * Math.cos(b.lat * radians) * Math.sin(dlng / 2) ** 2;
        return 6371000 * 2 * Math.asin(Math.sqrt(Math.min(1, h)));
    }
    function walkable(tags) {
        var permitted = /^(yes|designated|permissive)$/.test(tags.foot || "");
        if (/^(no|private|use_sidepath)$/.test(tags.foot || "")) return false;
        if (!permitted && /^(no|private|customers|destination)$/.test(tags.access || "")) return false;
        if (tags["access:conditional"] || tags["foot:conditional"] || tags.indoor === "yes" || tags.area === "yes") return false;
        if (/^(construction|proposed|motorway|motorway_link|trunk|trunk_link)$/.test(tags.highway || "")) return false;
        var sidewalk = [tags.sidewalk, tags["sidewalk:both"], tags["sidewalk:left"], tags["sidewalk:right"]].some(function(value) { return /^(yes|both|left|right)$/.test(value || ""); });
        return /^(footway|path|pedestrian|living_street|residential|service|steps|unclassified)$/.test(tags.highway || "") ||
            (permitted || sidewalk) && /^(cycleway|tertiary|tertiary_link|secondary|secondary_link|primary|primary_link|track)$/.test(tags.highway || "");
    }
    function graph(elements) {
        var nodes = new Map(), links = new Map();
        var barriers = new Set();
        elements.forEach(function (item) {
            if (item.type !== "node") return;
            if (item.tags && (/^(no|private)$/.test(item.tags.foot || item.tags.access || "") ||
                    item.tags.barrier && !/^(bollard|block)$/.test(item.tags.barrier) && !/^(yes|designated|permissive)$/.test(item.tags.foot || ""))) barriers.add(item.id);
            if (Number.isFinite(item.lat) && Number.isFinite(item.lon)) nodes.set(item.id, {lat:item.lat, lng:item.lon});
        });
        function edge(from, to, length) {
            if (!links.has(from)) links.set(from, []);
            links.get(from).push({id:to, length:length});
        }
        elements.forEach(function (item) {
            if (item.type !== "way" || !Array.isArray(item.nodes) || !walkable(item.tags || {})) return;
            for (var i = 1; i < item.nodes.length; i++) {
                var a = item.nodes[i - 1], b = item.nodes[i];
                if (!nodes.has(a) || !nodes.has(b) || barriers.has(a) || barriers.has(b)) continue;
                var length = distance(nodes.get(a), nodes.get(b));
                if (length <= 0) continue;
                // OSM may draw a straight street with distant endpoints. Add
                // samples ON that same edge, never straight connectors to it.
                var parts = Math.ceil(length / 35), previous = a;
                for (var step = 1; step <= parts; step++) {
                    var next = step === parts ? b : "walk:" + item.id + ":" + i + ":" + step;
                    if (next !== b) {
                        var from = nodes.get(a), to = nodes.get(b), fraction = step / parts;
                        nodes.set(next, {lat:from.lat + (to.lat-from.lat)*fraction, lng:from.lng + (to.lng-from.lng)*fraction});
                    }
                    if (item.tags["oneway:foot"] !== "-1") edge(previous, next, length / parts);
                    if (item.tags["oneway:foot"] !== "yes") edge(next, previous, length / parts);
                    previous = next;
                }
            }
        });
        return {nodes:nodes, links:links};
    }
    function shortest(g, source, limit) {
        var costs = new Map([[source, 0]]), previous = new Map(), heap = [[0, source]];
        function push(value) {
            heap.push(value);
            var i = heap.length - 1;
            while (i > 0) {
                var parent = (i - 1) >> 1;
                if (heap[parent][0] <= value[0]) break;
                heap[i] = heap[parent]; i = parent;
            }
            heap[i] = value;
        }
        function pop() {
            var first = heap[0], last = heap.pop();
            if (heap.length) {
                var i = 0;
                while (i * 2 + 1 < heap.length) {
                    var child = i * 2 + 1;
                    if (child + 1 < heap.length && heap[child + 1][0] < heap[child][0]) child++;
                    if (last[0] <= heap[child][0]) break;
                    heap[i] = heap[child]; i = child;
                }
                heap[i] = last;
            }
            return first;
        }
        while (heap.length) {
            var current = pop(), cost = current[0], id = current[1];
            if (cost !== costs.get(id)) continue;
            (g.links.get(id) || []).forEach(function (next) {
                var value = cost + next.length;
                if (value > limit || costs.has(next.id) && costs.get(next.id) <= value) return;
                costs.set(next.id, value); previous.set(next.id, id); push([value, next.id]);
            });
        }
        return {costs:costs, previous:previous};
    }
    function path(tree, source, to) {
        if (!tree.costs.has(to)) return null;
        var result = [to];
        while (to !== source) {
            to = tree.previous.get(to);
            if (to === undefined) return null;
            result.push(to);
        }
        return result.reverse();
    }
    function plan(g, origin, minutes, history) {
        var start = null, closest = Infinity, target = minutes * 60 * 1.1;
        g.links.forEach(function (_, id) {
            var d = distance(origin, g.nodes.get(id));
            if (d < closest) { closest = d; start = id; }
        });
        // Never draw a straight connector from a building to a nearby street.
        if (start === null || closest > 80) throw new Error("noRoad");
        var outward = shortest(g, start, target * 0.7);
        var candidates = Array.from(outward.costs).filter(function (entry) {
            return entry[1] > target * 0.18 && entry[1] < target * 0.48;
        }).sort(function (a, b) {
            return Math.abs(a[1] - target / 3) - Math.abs(b[1] - target / 3);
        });
        // Sample bearings, rather than taking only nodes in one dense street.
        var selected = [], sectors = new Set();
        candidates.forEach(function (entry) {
            var p = g.nodes.get(entry[0]), center = g.nodes.get(start);
            var angle = Math.floor((Math.atan2(p.lat - center.lat, (p.lng - center.lng) * Math.cos(center.lat * Math.PI / 180)) + Math.PI) / (Math.PI / 6));
            if (!sectors.has(angle)) { sectors.add(angle); selected.push(entry); }
        });
        var trees = new Map();
        selected.forEach(function (candidate) { trees.set(candidate[0], shortest(g, candidate[0], target * 0.8)); });
        var best = null, samples = (history || []).filter(function(p) {
            return p && Number.isFinite(p.lat) && Number.isFinite(p.lng);
        });
        if (samples.length > 1500) samples = samples.filter(function (_, i) { return i % Math.ceil(samples.length / 1500) === 0; });
        selected.forEach(function (candidate) {
            var a = candidate[0], middle = trees.get(a);
            selected.forEach(function (other) {
                var b = other[0];
                if (a === b || !middle.costs.has(b)) return;
                // Run the return search as well to respect pedestrian one-way edges.
                var home = trees.get(b);
                if (!home.costs.has(start)) return;
                var length = outward.costs.get(a) + middle.costs.get(b) + home.costs.get(start);
                if (length < target * 0.65 || length > target * 1.3) return;
                var ids = path(outward, start, a).concat(path(middle, a, b).slice(1), path(home, b, start).slice(1));
                var unique = new Set(), reused = 0;
                for (var i = 1; i < ids.length; i++) {
                    var key = [ids[i - 1], ids[i]].sort().join("/");
                    if (unique.has(key)) reused++;
                    unique.add(key);
                }
                var coords = ids.map(function (id) { return g.nodes.get(id); });
                var seen = coords.filter(function (p, i) {
                    return i % 8 === 0 && samples.some(function (old) { return distance(p, old) < 25; });
                }).length;
                var score = Math.abs(length - target) / target + reused / ids.length * 1.5 + seen / Math.ceil(ids.length / 8) * 0.35;
                if (!best || score < best.score) best = {coords:coords, length:length, score:score, approach:closest, stops:[g.nodes.get(a), g.nodes.get(b)]};
            });
        });
        if (!best) {
            // A connected road can have only one useful bearing. Allow a real
            // out-and-back path instead of requiring two different waypoints.
            for (var candidate of candidates.slice(0,48)) {
                var home=shortest(g,candidate[0],target*0.7);
                if(!home.costs.has(start))continue;
                var length=outward.costs.get(candidate[0])+home.costs.get(start);
                if(length<target*0.65||length>target*1.3)continue;
                var ids=path(outward,start,candidate[0]).concat(path(home,candidate[0],start).slice(1));
                var score=Math.abs(length-target)/target;
                if(!best||score<best.score)best={coords:ids.map(function(id){return g.nodes.get(id);}),length:length,score:score,approach:closest,stops:[g.nodes.get(candidate[0])]};
            }
        }
        if (!best) throw new Error("noRoute");
        return best;
    }
    return {distance:distance, graph:graph, plan:plan, walkable:walkable};
})();

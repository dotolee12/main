(function () {
    "use strict";
    var CONFIG = {
        hospital: { color:"#ef4444", labels:{ko:"병원",en:"Hospitals",ja:"病院",zh:"医院",es:"Hospitales",fr:"Hôpitaux"} },
        pharmacy: { color:"#14b8a6", labels:{ko:"약국",en:"Pharmacies",ja:"薬局",zh:"药店",es:"Farmacias",fr:"Pharmacies"} }
    };
    var state = { hospital:{ cache:{}, markers:[], layer:null, manifest:null }, pharmacy:{ cache:{}, markers:[], layer:null, manifest:null } };
    var bundlePromise = null, refreshTimer = null;

    function lang() { return typeof currentLang === "string" ? currentLang : "ko"; }
    function label(kind) { return CONFIG[kind].labels[lang()] || CONFIG[kind].labels.en; }
    function sourceText() { return lang() === "ko" ? "출처: 건강보험심사평가원 병원·약국 정보" : "Source: HIRA facility information"; }
    function escape(value) { return typeof escapeHtml === "function" ? escapeHtml(value) : String(value || "").replace(/[&<>"']/g, function(c) { return ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"})[c]; }); }
    function settings() {
        if (typeof mapLayerSettings !== "object") return {};
        if (typeof mapLayerSettings.hospital !== "boolean") mapLayerSettings.hospital = false;
        if (typeof mapLayerSettings.pharmacy !== "boolean") mapLayerSettings.pharmacy = false;
        return mapLayerSettings;
    }
    function loadBundle() {
        if (window.GILOA_MEDICAL_BUNDLE) return Promise.resolve(window.GILOA_MEDICAL_BUNDLE);
        if (bundlePromise) return bundlePromise;
        bundlePromise = new Promise(function(resolve, reject) {
            var script = document.createElement("script"), done = false;
            var timer = setTimeout(function() { finish(new Error("Medical data timeout")); }, 45000);
            function finish(error) { if (done) return; done = true; clearTimeout(timer); script.remove(); error ? reject(error) : resolve(window.GILOA_MEDICAL_BUNDLE); }
            script.src = "./data/medical/bundle.js?v=1";
            script.onload = function() { finish(window.GILOA_MEDICAL_BUNDLE ? null : new Error("Medical data invalid")); };
            script.onerror = function() { finish(new Error("Medical data unavailable")); };
            document.head.appendChild(script);
        });
        return bundlePromise;
    }
    function loadManifest(kind) {
        if (state[kind].manifest) return Promise.resolve(state[kind].manifest);
        return loadBundle().then(function(bundle) {
            var manifest = bundle && bundle[kind] && bundle[kind].manifest;
            if (!manifest || !Array.isArray(manifest.tiles)) throw new Error("Medical manifest invalid");
            state[kind].manifest = { scale:Number(manifest.scale) || 4, ids:new Set(manifest.tiles.map(function(tile) { return String(tile.id); })) };
            return state[kind].manifest;
        });
    }
    function tileIds(kind, manifest) {
        var bounds = map.getBounds().pad(0.12), scale = manifest.scale, center = map.getCenter(), ids = [];
        for (var y = Math.floor(bounds.getSouth() * scale); y <= Math.floor(bounds.getNorth() * scale); y++) for (var x = Math.floor(bounds.getWest() * scale); x <= Math.floor(bounds.getEast() * scale); x++) {
            var id = y + "_" + x;
            if (manifest.ids.has(id)) ids.push({id:id,d:center.distanceTo([(y + .5) / scale, (x + .5) / scale])});
        }
        return ids.sort(function(a,b) { return a.d - b.d; }).slice(0, 16).map(function(tile) { return tile.id; });
    }
    function loadTile(kind, id) {
        if (state[kind].cache[id]) return Promise.resolve(state[kind].cache[id]);
        return loadBundle().then(function(bundle) { var items = bundle[kind].tiles[id] || []; state[kind].cache[id] = items; return items; });
    }
    function clear(kind) { state[kind].markers = []; if (state[kind].layer) state[kind].layer.clearLayers(); }
    function popup(kind, item) {
        var details = [item.k, kind === "hospital" && item.d ? (lang() === "ko" ? "의사 " + item.d + "명" : "Doctors " + item.d) : ""].filter(Boolean);
        var tel = item.t ? "<br><a href='tel:" + escape(item.t) + "' style='color:#4ade80;font-size:12px;'>" + escape(item.t) + "</a>" : "";
        if (typeof setSelectedDestination === "function") setSelectedDestination(item.y, item.x, item.n || label(kind));
        L.popup({className:"tour-popup"}).setLatLng([item.y,item.x]).setContent("<b>" + escape(item.n) + "</b><br><span class='tour-popup-tag' style='color:" + CONFIG[kind].color + ";border-color:" + CONFIG[kind].color + ";background:rgba(20,184,166,.16);'>" + escape(label(kind)) + "</span>" + (item.a ? "<br><small>" + escape(item.a) + "</small>" : "") + (details.length ? "<br><small>" + escape(details.join(" · ")) + "</small>" : "") + tel).openOn(map);
    }
    function render(kind, ids) {
        clear(kind); if (!settings()[kind]) return;
        var center = getMapSearchCenter(), seen = new Set(), items = [];
        ids.forEach(function(id) { (state[kind].cache[id] || []).forEach(function(item) { if (!isWithinMapSearchCenter(Number(item.y), Number(item.x), getMapSearchRadius()) || seen.has(item.i)) return; seen.add(item.i); item._d = center.distanceTo([item.y,item.x]); items.push(item); }); });
        items.sort(function(a,b) { return a._d-b._d; }).slice(0, 100).forEach(function(item) {
            var icon = L.divIcon({className:"library-map-marker-wrap", html:"<div class='library-map-marker' style='--tour-color:" + CONFIG[kind].color + ";'><span class='library-map-dot' style='background:" + CONFIG[kind].color + ";'></span><span class='library-map-label'>" + escape(label(kind)) + "</span></div>", iconSize:[76,28], iconAnchor:[10,14]});
            var marker = L.marker([item.y,item.x], {pane:"markerPane",icon:icon,title:label(kind) + " - " + item.n}).addTo(state[kind].layer);
            marker.on("click", function() { popup(kind,item); }); state[kind].markers.push(marker);
        });
    }
    function refresh(kind) { if (!settings()[kind] || !window.map) return Promise.resolve(false); return loadManifest(kind).then(function(manifest) { var ids = tileIds(kind, manifest); return Promise.all(ids.map(function(id) { return loadTile(kind,id); })).then(function() { render(kind,ids); return true; }); }).catch(function(error) { console.warn("Medical layer load failed", kind, error && error.message); return false; }); }
    function refreshVisible() { ["hospital","pharmacy"].forEach(function(kind) { if (settings()[kind]) refresh(kind); }); }
    function scheduleRefresh() { if (refreshTimer) clearTimeout(refreshTimer); refreshTimer = setTimeout(function() { refreshTimer = null; refreshVisible(); }, 500); }
    function toggle(kind) { settings()[kind] = !settings()[kind]; if (typeof saveMapLayerSettings === "function") saveMapLayerSettings(); sync(); settings()[kind] ? refresh(kind) : clear(kind); }
    function sync() { ["hospital","pharmacy"].forEach(function(kind) { var node=document.getElementById("layer-toggle-"+kind), name=document.getElementById("map-layer-name-"+kind), source=document.getElementById("map-layer-source-"+kind), on=!!settings()[kind]; if(node) node.classList.toggle("on",on); if(node) node.classList.toggle("off",!on); if(node && node.closest(".map-layer-item")) node.closest(".map-layer-item").dataset.state=on ? "on" : "off"; if(name) name.textContent=label(kind); if(source) source.textContent=sourceText(); }); if(typeof syncMapLayerGroupUI === "function") syncMapLayerGroupUI(); }
    function menuIcon(kind) { var path = kind === "hospital" ? "<rect x='4' y='4' width='16' height='16' rx='2'/><path d='M12 8v8M8 12h8'/>" : "<path d='M7 5h10v14H7z'/><path d='M10 5V3h4v2M10 10h4M12 12v4M10 14h4'/>"; return "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'>" + path + "</svg>"; }
    function addRow(kind) { if (document.getElementById("layer-toggle-"+kind)) return; var row=document.createElement("div"); row.className="map-layer-item"; row.onclick=function(){toggle(kind);}; row.innerHTML="<span class='map-layer-menu-icon'>"+menuIcon(kind)+"</span><span class='map-layer-copy'><span class='map-layer-name' id='map-layer-name-"+kind+"'></span><small class='map-layer-source' id='map-layer-source-"+kind+"'></small></span><div id='layer-toggle-"+kind+"' class='toggle-switch small'><div class='toggle-knob'></div></div>"; var target=document.getElementById("map-layer-group-details-convenience") || document.getElementById("map-layer-panel"); if(target) target.appendChild(row); }
    function setup() { if (!window.L || !window.map || !document.getElementById("map-layer-panel")) return; ["hospital","pharmacy"].forEach(function(kind) { if(!state[kind].layer) state[kind].layer=L.layerGroup().addTo(map); addRow(kind); }); sync(); map.off("moveend",scheduleRefresh); map.on("moveend",scheduleRefresh); }
    window.GiloaMedicalLayers = { refresh:refreshVisible };
    var originalApply = window.applyUILang;
    if (typeof originalApply === "function") window.applyUILang = function(language) { var result=originalApply.apply(this,arguments); sync(); return result; };
    window.addEventListener("giloa:ready", setup);
    setTimeout(setup, 0);
}());

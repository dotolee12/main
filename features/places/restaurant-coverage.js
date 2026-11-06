/* Fill gaps in the food layer with nearby named OpenStreetMap restaurants. */
var restaurantCoverage = (function() {
    var radius = 1000;
    var credit = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>';
    var layer = L.layerGroup([], { attribution: credit });
    var results = [];
    var areaKey = "";
    var refreshAfter = 0;
    var request = null;

    function nameKey(name) {
        return String(name || "").normalize("NFKC").toLowerCase().replace(/[\s·.,()\-]/g, "");
    }

    function isDuplicate(item, other) {
        return item.keys.some(function(key) { return other.keys.indexOf(key) !== -1; }) &&
            map.distance([item.lat, item.lng], [other.lat, other.lng]) <= 60;
    }

    function normalizeRestaurant(element) {
        var tags = element.tags || {};
        var point = element.center || element;
        var names = {};
        if (tags.amenity !== "restaurant" || !Number.isFinite(point.lat) || !Number.isFinite(point.lon) ||
            Math.abs(point.lat) > 90 || Math.abs(point.lon) > 180) return null;
        ["name", "name:ko", "name:en", "name:ja", "name:zh", "name:zh-Hans", "name:es", "name:fr"].forEach(function(key) {
            if (typeof tags[key] === "string" && tags[key].trim()) names[key] = tags[key].trim();
        });
        var keys = Object.keys(names).map(function(key) { return nameKey(names[key]); }).filter(Boolean);
        return keys.length ? { names: names, keys: keys, lat: point.lat, lng: point.lon } : null;
    }

    function render(center) {
        layer.clearLayers();
        var existing = tourItems.filter(function(item) { return String(item.contenttypeid) === "39"; }).map(function(item) {
            return { lat: Number(item.mapy), lng: Number(item.mapx),
                keys: [nameKey(item.title), nameKey(getTourDisplayTitle(item))].filter(Boolean) };
        });
        var bounds = map.getBounds();
        var shown = [];
        results.map(function(item) {
            return { item: item, distance: center.distanceTo([item.lat, item.lng]) };
        }).filter(function(entry) {
            return entry.distance <= radius && bounds.contains([entry.item.lat, entry.item.lng]);
        }).sort(function(a, b) { return a.distance - b.distance; }).some(function(entry) {
            var item = entry.item;
            if (existing.some(function(other) { return isDuplicate(item, other); }) ||
                shown.some(function(other) { return isDuplicate(item, other); })) return false;
            var lang = normalizeLang(currentLang);
            var names = item.names;
            var title = names["name:" + lang] || (lang === "zh" && names["name:zh-Hans"]) ||
                names.name || names["name:ko"] || names[Object.keys(names)[0]];
            var position = [item.lat, item.lng];
            var marker = L.marker(position, {
                pane: "tourPane", title: title,
                icon: L.divIcon({ className: "tour-map-marker-wrap",
                    html: mapPlaceSymbolHtml("food", "", "", getTourTypeMeta("39").color),
                    iconSize: [28, 28], iconAnchor: [14, 14] })
            }).addTo(layer);
            var label = document.createElement("b");
            label.textContent = title;
            marker.bindTooltip(label, {
                permanent: true, direction: "right", offset: [12, 0], pane: "tourPane",
                className: "restaurant-coverage-label"
            });
            marker.on("click", function() {
                var box = document.createElement("div");
                var heading = document.createElement("b");
                heading.className = "tour-popup-title";
                heading.textContent = title;
                box.appendChild(heading);
                var source = document.createElement("small");
                source.className = "tour-popup-credit";
                source.innerHTML = credit;
                box.appendChild(source);
                setSelectedDestination(item.lat, item.lng, title);
                L.popup({ className: "tour-popup", autoPan: false, closeOnClick: true })
                    .setLatLng(position).setContent(box).openOn(map);
            });
            shown.push(item);
            return shown.length >= 30;
        });
        if (shown.length && !map.hasLayer(layer)) layer.addTo(map);
        else if (!shown.length && map.hasLayer(layer)) map.removeLayer(layer);
    }

    async function fetchRestaurants(query, signal) {
        var endpoints = [
            "https://overpass-api.de/api/interpreter",
            "https://overpass.private.coffee/api/interpreter"
        ];
        for (var endpoint of endpoints) {
            if (signal.aborted) break;
            var controller = new AbortController();
            var cancel = function() { controller.abort(); };
            signal.addEventListener("abort", cancel, { once: true });
            var timer = setTimeout(cancel, 8000);
            try {
                var response = await fetch(endpoint, {
                    method: "POST", body: new URLSearchParams({ data: query }), signal: controller.signal,
                    cache: "no-store", credentials: "omit", referrerPolicy: "no-referrer"
                });
                if (!response.ok) continue;
                var data = await response.json();
                if (!data.remark && Array.isArray(data.elements)) return data.elements;
            } catch (_) {
                // A provider can be unreachable or busy; try the other instance.
            } finally {
                clearTimeout(timer);
                signal.removeEventListener("abort", cancel);
            }
        }
        throw new Error("Restaurant lookup failed");
    }

    function refresh() {
        if (!mapLayerSettings.restaurant) {
            if (request) request.abort();
            request = null;
            layer.clearLayers();
            if (map.hasLayer(layer)) map.removeLayer(layer);
            return;
        }
        var center = getMapSearchCenter();
        // A rounded viewport center avoids repeated requests on small pans.
        var lat = (Math.round(center.lat * 200) / 200).toFixed(3);
        var lng = (Math.round(center.lng * 200) / 200).toFixed(3);
        var key = lat + "," + lng;
        if (key !== areaKey) {
            if (request) request.abort();
            request = null;
            areaKey = key;
            refreshAfter = 0;
            results = [];
        }
        render(center);
        if (request || Date.now() < refreshAfter || navigator.onLine === false) return;

        var controller = new AbortController();
        request = controller;
        var query = '[out:json][timeout:6];nwr(around:1500,' + key + ')["amenity"="restaurant"][~"^name(:.*)?$"~"."];out tags center;';
        fetchRestaurants(query, controller.signal).then(function(elements) {
            if (request !== controller || !mapLayerSettings.restaurant) return;
            results = elements.map(normalizeRestaurant).filter(Boolean);
            refreshAfter = Date.now() + 5 * 60 * 1000;
            render(getMapSearchCenter());
        }).catch(function() {
            if (request === controller) refreshAfter = Date.now() + 30 * 1000;
        }).finally(function() {
            if (request === controller) request = null;
        });
    }

    return { refresh: refresh };
})();

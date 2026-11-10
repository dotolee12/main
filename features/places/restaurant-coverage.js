/* Fill food-layer gaps with nearby OpenStreetMap places and Kakao franchise listings. */
var restaurantCoverage = (function() {
    var radius = 1000;
    var credit = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>';
    var kakaoCredit = '© <a href="https://map.kakao.com/">Kakao Maps</a>';
    var layer = L.layerGroup([], { attribution: credit + " · " + kakaoCredit });
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

    // Korean and English map labels for selected major restaurant chains.
    var foodChainNames = /^(맥도날드|mcdonalds|버거킹|burgerking|kfc|켄터키프라이드치킨|맘스터치|momstouch|롯데리아|lotteria|피자헛|pizzahut|도미노피자|도미노$|dominospizza|dominos$|프랭크버거|frankburger|노브랜드버거|nobrandburger|써브웨이|서브웨이|subway|피자스쿨|pizzaschool|피자마루|pizzamaru|피자알볼로|pizzaalvolo|파파존스|papajohns|피자나라치킨공주|교촌치킨|교촌$|kyochon|bhc|비에이치씨|bbq치킨|bbq$|비비큐|굽네치킨|goobne|처갓집양념치킨|노랑통닭|60계치킨|60계$|푸라닭|puradak|네네치킨|nenechicken|페리카나|pelicana|호식이두마리치킨|지코바치킨|지코바$|한솥도시락|한솥$|hansot|본죽|본도시락|이삭토스트|isaactoast|김가네|신전떡볶이|청년다방)/;

    function isFoodChain(tags) {
        return ["name", "name:ko", "name:en", "brand", "brand:ko", "brand:en", "operator"].some(function(key) {
            return foodChainNames.test(String(tags[key] || "").normalize("NFKC").toLowerCase().replace(/[\s\p{P}\p{S}]/gu, ""));
        });
    }

    function iconForName(name, category) {
        if (category === "CE7" || (window.GiloaIsCoffeeChain && window.GiloaIsCoffeeChain({ name: name }))) return "coffee";
        if (/패스트푸드|햄버거|피자|샌드위치/i.test(category || "") ||
            /^(맥도날드|mcdonalds|버거킹|burgerking|kfc|맘스터치|momstouch|롯데리아|lotteria|피자헛|pizzahut|도미노|dominos|프랭크버거|frankburger|노브랜드버거|nobrandburger|써브웨이|서브웨이|subway|피자스쿨|pizzaschool|피자마루|pizzamaru|피자알볼로|pizzaalvolo|파파존스|papajohns|이삭토스트|isaactoast)/.test(String(name || "").normalize("NFKC").toLowerCase().replace(/[\s\p{P}\p{S}]/gu, ""))) return "fastFood";
        return "food";
    }

    function normalizeRestaurant(element) {
        var tags = element.tags || {};
        var point = element.center || element;
        var names = {};
        var chainCafe = tags.amenity === "cafe" && window.GiloaIsCoffeeChain && window.GiloaIsCoffeeChain(tags);
        var chainFood = (tags.amenity === "restaurant" || tags.amenity === "fast_food") && isFoodChain(tags);
        if ((tags.amenity !== "restaurant" && !chainCafe && !chainFood) || !Number.isFinite(point.lat) || !Number.isFinite(point.lon) ||
            Math.abs(point.lat) > 90 || Math.abs(point.lon) > 180) return null;
        ["name", "name:ko", "name:en", "name:ja", "name:zh", "name:zh-Hans", "name:es", "name:fr"].forEach(function(key) {
            if (typeof tags[key] === "string" && tags[key].trim()) names[key] = tags[key].trim();
        });
        if ((chainCafe || chainFood) && !Object.keys(names).length) {
            var brand = tags["brand:ko"] || tags.brand || tags["brand:en"];
            if (typeof brand === "string" && brand.trim()) names.name = brand.trim();
        }
        var keys = Object.keys(names).map(function(key) { return nameKey(names[key]); }).filter(Boolean);
        var symbol = tags.amenity === "cafe" ? "coffee" : tags.amenity === "fast_food" ? "fastFood" :
            iconForName(names.name || names["name:ko"] || names["name:en"], "");
        return keys.length ? { names: names, keys: keys, lat: point.lat, lng: point.lon, franchise: !!(chainCafe || chainFood), symbol: symbol } : null;
    }

    function render(center) {
        layer.clearLayers();
        var existing = tourItems.filter(function(item) { return String(item.contenttypeid) === "39"; }).map(function(item) {
            return { lat: Number(item.mapy), lng: Number(item.mapx),
                keys: [nameKey(item.title), nameKey(getTourDisplayTitle(item))].filter(Boolean) };
        });
        var bounds = map.getBounds();
        var shown = [];
        var restaurantCount = 0;
        var franchiseCount = 0;
        results.map(function(item) {
            return { item: item, distance: center.distanceTo([item.lat, item.lng]) };
        }).filter(function(entry) {
            return entry.distance <= radius && bounds.contains([entry.item.lat, entry.item.lng]);
        }).sort(function(a, b) { return a.distance - b.distance; }).some(function(entry) {
            var item = entry.item;
            if ((item.franchise ? franchiseCount : restaurantCount) >= 30) return false;
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
                    html: mapPlaceSymbolHtml(item.symbol, "", "", getTourTypeMeta("39").color),
                    iconSize: [28, 28], iconAnchor: [14, 14] })
            }).addTo(layer);
            marker.on("click", function() {
                var box = document.createElement("div");
                var heading = document.createElement("b");
                heading.className = "tour-popup-title";
                heading.textContent = title;
                box.appendChild(heading);
                var source = document.createElement("small");
                source.className = "tour-popup-credit";
                source.innerHTML = item.source === "kakao" ? kakaoCredit : credit;
                box.appendChild(source);
                setSelectedDestination(item.lat, item.lng, title);
                L.popup({ className: "tour-popup", autoPan: false, closeOnClick: true })
                    .setLatLng(position).setContent(box).openOn(map);
            });
            shown.push(item);
            if (item.franchise) franchiseCount++;
            else restaurantCount++;
            return franchiseCount >= 30 && restaurantCount >= 30;
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

    async function fetchKakaoFranchises(center, signal) {
        await loadKakaoTrafficSdk();
        if (signal.aborted) return [];
        var services = window.kakao.maps.services;
        var location = new window.kakao.maps.LatLng(center.lat, center.lng);
        var brands = ["맥도날드", "버거킹", "KFC", "맘스터치", "롯데리아", "피자헛", "도미노피자"];
        function search(value, category) {
            return new Promise(function(resolve, reject) {
                var timer = setTimeout(function() { reject(new Error("Kakao place search timed out")); }, 9000);
                var options = { location: location, radius: 1500, size: 15, sort: services.SortBy.DISTANCE };
                function done(places, status) {
                    clearTimeout(timer);
                    if (status === services.Status.OK) resolve(places || []);
                    else if (status === services.Status.ZERO_RESULT) resolve([]);
                    else reject(new Error("Kakao place search failed"));
                }
                try {
                    var places = new services.Places();
                    if (category) places.categorySearch(value, done, options);
                    else places.keywordSearch(value, done, options);
                } catch (error) {
                    clearTimeout(timer);
                    reject(error);
                }
            });
        }
        var searches = brands.map(function(brand) { return search(brand, false); });
        searches.push(search("FD6", true), search("CE7", true));
        var groups = await Promise.allSettled(searches);
        if (groups.every(function(group) { return group.status === "rejected"; })) {
            throw new Error("Kakao franchise lookup failed");
        }
        return groups.filter(function(group) { return group.status === "fulfilled"; })
            .flatMap(function(group) { return group.value; })
            .map(function(place) {
                if (place.category_group_code !== "FD6" && place.category_group_code !== "CE7") return null;
                var item = normalizeRestaurant({
                    tags: { name: place.place_name, amenity: place.category_group_code === "CE7" ? "cafe" : "fast_food" },
                    lat: place.y ? Number(place.y) : NaN,
                    lon: place.x ? Number(place.x) : NaN
                });
                if (item) {
                    item.source = "kakao";
                    item.symbol = iconForName(place.place_name, place.category_group_code === "CE7" ? "CE7" : place.category_name);
                }
                return item;
            }).filter(Boolean);
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
        var around = 'nwr(around:1500,' + key + ')';
        var query = '[out:json][timeout:6];(' +
            around + '["amenity"="restaurant"][~"^name(:.*)?$"~"."];' +
            around + '["amenity"="cafe"][~"^(name|brand)(:.*)?$"~"."];' +
            around + '["amenity"="fast_food"][~"^(name|brand|operator)(:.*)?$"~"."];' +
            around + '["amenity"="restaurant"][~"^brand(:.*)?$"~"."];' +
            ');out tags center;';
        function addResults(items, source) {
            if (request !== controller || !mapLayerSettings.restaurant) return;
            results = results.filter(function(item) { return item.source !== source; }).concat(items);
            render(getMapSearchCenter());
        }
        var osm = fetchRestaurants(query, controller.signal).then(function(elements) {
            addResults(elements.map(normalizeRestaurant).filter(Boolean), undefined);
        });
        var kakao = fetchKakaoFranchises(L.latLng(Number(lat), Number(lng)), controller.signal).then(function(items) {
            addResults(items, "kakao");
        });
        Promise.allSettled([osm, kakao]).then(function(statuses) {
            if (request !== controller) return;
            refreshAfter = Date.now() + (statuses[1].status === "fulfilled" ? 5 * 60 * 1000 : 30 * 1000);
            request = null;
        });
    }

    return { refresh: refresh, iconForName: iconForName };
})();

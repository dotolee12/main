/* Start the real Leaflet map before the large application bundle executes.
 * This keeps a returning Android WebView from showing a blank screen while
 * script.js restores journey data and binds the rest of the UI. */
(function () {
    if (!window.L || !document.getElementById("map")) return;
    try {
        var map = L.map("map", { zoomControl: false, attributionControl: true })
            .setView([37.5665, 126.978], 16);
        var primaryTileUrl =
            window.GILOA_BASE_TILE_URL ||
            window.GILOA_CARTO_TILE_URL ||
            "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
        var fallbackTileUrl = window.GILOA_FALLBACK_TILE_URL;
        var primaryAttribution =
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
        var fallbackAttribution =
            'Tiles &copy; <a href="https://www.esri.com/">Esri</a>';

        var tile = L.tileLayer(primaryTileUrl, {
            maxZoom: 20,
            maxNativeZoom: 19,
            zIndex: 10,
            crossOrigin: true,
            attribution: primaryAttribution
        }).addTo(map);

        var tileErrorCount = 0;
        var fallbackActivated = false;
        tile.on("tileerror", function () {
            tileErrorCount += 1;
            if (fallbackActivated || tileErrorCount < 3 || !fallbackTileUrl) return;
            fallbackActivated = true;
            map.removeLayer(tile);
            tile = L.tileLayer(fallbackTileUrl, {
                maxZoom: 20,
                zIndex: 10,
                crossOrigin: true,
                attribution: fallbackAttribution
            }).addTo(map);
            window.giloaInitialBaseTileLayer = tile;
        });

        window.giloaMapBootstrap = map;
        window.giloaInitialBaseTileLayer = tile;
    } catch (error) {
        console.warn("GILOA map bootstrap failed", error);
    }
}());

 /* Start the real Leaflet map before the large application bundle executes.
 * This keeps a returning Android WebView from showing a blank screen while
 * script.js restores journey data and binds the rest of the UI. */
(function () {
    if (!window.L || !document.getElementById("map")) return;
    try {
        var map = L.map("map", { zoomControl: false, attributionControl: true })
            .setView([37.5665, 126.978], 16);
var tile = L.tileLayer(
    window.GILOA_CARTO_TILE_URL,
    {
        maxZoom: 20,
        zIndex: 10,
        crossOrigin: true,
        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }
).addTo(map);
        window.giloaMapBootstrap = map;
        window.giloaInitialBaseTileLayer = tile;
    } catch (error) {
        console.warn("GILOA map bootstrap failed", error);
    }
}());

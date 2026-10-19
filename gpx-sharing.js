// Compatibility for older cached pages: GPX stays on the device.
(function() {
    "use strict";
    function localOnly() {
        var panel = document.getElementById("gpx-sharing");
        if (panel) { panel.hidden = true; panel.style.display = "none"; }
        document.querySelectorAll(".gpx-saved-share").forEach(function(node) { node.remove(); });
    }
    window.GiloaGpxSharing = {applyLanguage:localOnly, selectRoute:localOnly};
    localOnly();
})();

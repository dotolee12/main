// Compatibility for older cached pages: cloud access has been removed.
(function() {
    "use strict";
    function localOnly() {
        document.querySelectorAll(".cloud-account-card").forEach(function(node) { node.hidden = true; node.style.display = "none"; });
    }
    window.GiloaCloud = {init:localOnly, applyLanguage:localOnly, scheduleSync:localOnly,
        syncNow:localOnly, signInFromForm:localOnly, signUpFromForm:localOnly,
        requestPasswordReset:localOnly, updatePassword:localOnly, cancelPasswordReset:localOnly,
        signOut:localOnly, isConfigured:function() { return false; },
        getSharingUserId:function() { return null; }};
    localOnly();
})();

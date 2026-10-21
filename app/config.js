// Kakao Maps JavaScript key.
// 1. Kakao Developers > My Application > Platform > Web: add your domain.
// 2. Replace the empty string below with the app's JavaScript key.
// 3. For a quick local test, you can also open index.html?kakaoKey=YOUR_KEY.
window.GILOA_KAKAO_JS_KEY = "1736de3a1f9f59a3e17cf569163687f1";
window.GILOA_TOUR_API_KEY = "c6995449e23f94083d88f198fe2617a8f957a2063bc6ac0d19816c9f27a0ed6c";
window.GILOA_SEOUL_LIBRARY_API_KEY = "756b506d69646f7439356a526f5a47";
window.GILOA_SEOUL_RESTROOM_API_KEY = "664a4d746c646f743439646e664d58";
window.GILOA_VARCO_API_KEY = "";
window.GILOA_FISHING_API_KEY = "";
// CARTO Voyager raster basemap. Keep this key restricted to GILOA's allowed
// web origins in the CARTO dashboard before production deployment.
window.GILOA_CARTO_BASEMAP_KEY = "cb1_3jvp_1_3c01cebe7b9b100e449d1ac0";
window.GILOA_CARTO_TILE_URL =
    "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=" +
    encodeURIComponent(window.GILOA_CARTO_BASEMAP_KEY);

// Supabase public client settings. The publishable key is safe to ship in the
// app; database and Storage access remains protected by Supabase RLS policies.
window.GILOA_SUPABASE_URL = "";
window.GILOA_SUPABASE_PUBLISHABLE_KEY = "";

// Temporary pause: retain sessions and records without cloud requests.
window.GILOA_CLOUD_SYNC_ENABLED = false;

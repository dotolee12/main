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

// Public basemap endpoints. OpenStreetMap does not require a browser API key.
// The Esri layer is used only if repeated tile errors make the primary layer unusable.
window.GILOA_BASE_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
window.GILOA_FALLBACK_TILE_URL =
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}";

// Backward-compatible alias for older cached application code.
window.GILOA_CARTO_TILE_URL = window.GILOA_BASE_TILE_URL;

// Supabase public client settings. The publishable key is safe to ship in the
// app; database and Storage access remains protected by Supabase RLS policies.
window.GILOA_SUPABASE_URL = "";
window.GILOA_SUPABASE_PUBLISHABLE_KEY = "";

// Temporary pause: retain sessions and records without cloud requests.
window.GILOA_CLOUD_SYNC_ENABLED = false;

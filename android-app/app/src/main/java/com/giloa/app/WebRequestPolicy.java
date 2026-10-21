package com.giloa.app;
import java.net.URI;
import java.util.Locale;
/** Pure URI checks: never migrate the WebView origin or touch stored records. */
final class WebRequestPolicy {
    static boolean isTrustedAsset(String value) {
        try {
            URI uri = new URI(value);
            if (!"file".equalsIgnoreCase(uri.getScheme()) || (uri.getAuthority() != null && !uri.getAuthority().isEmpty())) return false;
            String raw = uri.getRawPath();
            if (raw == null || raw.toLowerCase(Locale.ROOT).contains("%25") || raw.contains("\\")) return false;
            String decoded = uri.getPath();
            if (decoded == null || decoded.indexOf(0) >= 0 || decoded.indexOf('\\') >= 0) return false;
            String normalized = new URI(null, null, decoded, null).normalize().getPath();
            return normalized.startsWith("/android_asset/www/");
        } catch (Exception ignored) { return false; }
    }
    static boolean isTrustedLocation(String origin, String page) {
        return isTrustedAsset(page) && ("file://".equals(origin) || "file:///".equals(origin) || isTrustedAsset(origin));
    }
    static boolean isHttps(String value) {
        try {
            URI uri = new URI(value);
            return "https".equalsIgnoreCase(uri.getScheme()) && uri.getHost() != null && uri.getUserInfo() == null;
        } catch (Exception ignored) { return false; }
    }
    private WebRequestPolicy() {}
}

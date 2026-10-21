package com.giloa.app;

import android.Manifest;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.ContentResolver;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.res.AssetFileDescriptor;
import android.net.Uri;
import android.os.Bundle;
import android.os.Build;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.GeolocationPermissions;
import android.webkit.JavascriptInterface;
import android.webkit.MimeTypeMap;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceResponse;
import android.webkit.CookieManager;
import java.io.ByteArrayInputStream;
import java.util.Collections;
import android.graphics.Color;

import androidx.core.content.FileProvider;
import androidx.core.content.ContextCompat;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.io.ByteArrayOutputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

public class MainActivity extends Activity {
    private static final int LOCATION_PERMISSION_REQUEST = 10;
    private static final int NOTIFICATION_PERMISSION_REQUEST = 12;
    private static final int MEDIA_LOCATION_PERMISSION_REQUEST = 13;
    private static final int FILE_CHOOSER_REQUEST = 11;
    private static final int GPX_EXPORT_REQUEST = 14;
    private volatile File pendingGpxExportFile;
    private volatile String pendingRouteSessionId = "";
    private volatile long pendingRouteStopAt;
    private long travelZipExpectedBytes;
    private static final String APP_URL = "file:///android_asset/www/index.html";
    private static final String PHOTO_BRIDGE_NAME = "GiloaPhotoBridge";
    // Android Photo Picker redacts EXIF location unless the caller explicitly
    // requests it. Use the stable platform extra name so compileSdk 36 builds
    // remain compatible with picker module updates that introduced the flag.
    private static final String EXTRA_REQUEST_LOCATION_METADATA_ACCESS =
            "android.provider.extra.REQUEST_LOCATION_METADATA_ACCESS";
    private static final int MAX_DATA_URL_BYTES = 16 * 1024 * 1024;
    private static final int MAX_SOURCE_URI_LENGTH = 8192;
    private static final int MAX_PHOTO_ID_LENGTH = 80;
    private static final long MAX_ORIGINAL_PHOTO_BYTES = 64L * 1024L * 1024L;
    private static final long PHOTO_ORIGINAL_TRANSFER_MAX_BYTES = 32L * 1024L * 1024L;
    private static final String DURABLE_STATE_PREFS = "giloa_durable_state";
    private static final String DURABLE_STATE_KEY = "local_storage_snapshot";
    private static final int MAX_DURABLE_STATE_CHARS = 4 * 1024 * 1024;

    private WebView webView;
    private PhotoBridge photoBridge;
    private ValueCallback<Uri[]> fileCallback;
    private GeolocationPermissions.Callback geolocationCallback;
    private String geolocationOrigin;
    private boolean fileChooserUsesOpenDocument;
    private boolean fileChooserReturnsImages;
    private boolean fileChooserUsesCameraCapture;
    private Uri pendingCameraOutputUri;
    private File pendingCameraOutputFile;
    private final Object selectedUrisLock = new Object();
    private String pendingSelectedUrisJson = "[]";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (savedInstanceState != null) {
            String pendingName = savedInstanceState.getString("giloa_pending_gpx_file", "");
            if (((pendingName.startsWith("giloa-gpx-") && pendingName.endsWith(".gpx"))
                    || (pendingName.startsWith("giloa-trip-") && pendingName.endsWith(".zip")))
                    && pendingName.equals(new File(pendingName).getName())) {
                File pending = new File(getCacheDir(), pendingName);
                if (pending.isFile()) pendingGpxExportFile = pending;
            }
        }

        webView = new WebView(this);
        // The WebView can take a moment to recreate after another app was
        // foregrounded. Match the map canvas immediately instead of flashing
        // the platform's default white window.
        webView.setBackgroundColor(Color.rgb(16, 19, 29));
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setSupportZoom(true);
        settings.setBuiltInZoomControls(true);
        settings.setDisplayZoomControls(false);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(false);
        settings.setGeolocationEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        CookieManager.getInstance().setAcceptCookie(false);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, false);
        WebView.setWebContentsDebuggingEnabled(false);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) settings.setSafeBrowsingEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);

        photoBridge = new PhotoBridge();
        webView.addJavascriptInterface(photoBridge, PHOTO_BRIDGE_NAME);
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (WebRequestPolicy.isTrustedAsset(uri.toString())) return false;
                if (request.isForMainFrame()) openExternalUri(uri);
                return true;
            }
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String scheme = uri.getScheme();
                if (WebRequestPolicy.isTrustedAsset(uri.toString())) return null;
                if (!request.isForMainFrame() && WebRequestPolicy.isHttps(uri.toString())) return null;
                if (!request.isForMainFrame() && "file".equalsIgnoreCase(scheme)) {
                    try {
                        File candidate = new File(uri.getPath()).getCanonicalFile();
                        File originals = new File(getCacheDir(), "exif_originals").getCanonicalFile();
                        if (candidate.isFile() && candidate.getPath().startsWith(originals.getPath() + File.separator)) return null;
                    } catch (IOException | RuntimeException ignored) {}
                }
                if (!request.isForMainFrame() && "content".equalsIgnoreCase(scheme)
                        && canReadContentUri(uri)) return null;
                if (!request.isForMainFrame() && ("data".equalsIgnoreCase(scheme) || "blob".equalsIgnoreCase(scheme))) return null;
                return new WebResourceResponse("text/plain", "UTF-8", 403, "Forbidden",
                        Collections.emptyMap(), new ByteArrayInputStream("Blocked insecure or untrusted request".getBytes(StandardCharsets.UTF_8)));
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onGeolocationPermissionsShowPrompt(
                    String origin, GeolocationPermissions.Callback callback) {
                if (!WebRequestPolicy.isTrustedLocation(origin, webView.getUrl())) {
                    callback.invoke(origin, false, false);
                    return;
                }
                if (checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION)
                        == PackageManager.PERMISSION_GRANTED) {
                    callback.invoke(origin, true, false);
                } else {
                    geolocationOrigin = origin;
                    geolocationCallback = callback;
                    requestPermissions(
                            new String[]{
                                    Manifest.permission.ACCESS_FINE_LOCATION,
                                    Manifest.permission.ACCESS_COARSE_LOCATION
                            },
                            LOCATION_PERMISSION_REQUEST);
                }
            }

            @Override
            public boolean onShowFileChooser(
                    WebView view,
                    ValueCallback<Uri[]> callback,
                    FileChooserParams params) {
                if (fileCallback != null) {
                    fileCallback.onReceiveValue(null);
                }
                clearPendingCameraOutput(true);
                fileCallback = callback;

                String[] acceptedTypes = normalizeAcceptTypes(params.getAcceptTypes());
                boolean captureRequested = params.isCaptureEnabled();
                boolean imageCaptureRequested = captureRequested
                        && (acceptedTypes.length == 0 || containsImageType(acceptedTypes));
                fileChooserUsesCameraCapture = false;
                fileChooserReturnsImages = imageCaptureRequested
                        || containsImageType(acceptedTypes);

                Intent intent;
                if (imageCaptureRequested) {
                    intent = createCameraCaptureIntent();
                    fileChooserUsesCameraCapture = intent != null;
                    fileChooserUsesOpenDocument = intent == null;
                    if (intent == null) {
                        intent = createOpenDocumentIntent(params, acceptedTypes);
                    }
                } else if (captureRequested) {
                    fileChooserUsesOpenDocument = false;
                    intent = params.createIntent();
                } else {
                    intent = createPhotoPickerIntent(params, acceptedTypes);
                    fileChooserUsesOpenDocument = intent == null;
                    if (intent == null) intent = createOpenDocumentIntent(params, acceptedTypes);
                }
                try {
                    startActivityForResult(intent, FILE_CHOOSER_REQUEST);
                } catch (ActivityNotFoundException | SecurityException error) {
                    fileCallback = null;
                    clearPendingCameraOutput(true);
                    fileChooserUsesOpenDocument = false;
                    fileChooserReturnsImages = false;
                    fileChooserUsesCameraCapture = false;
                    return false;
                }
                return true;
            }
        });

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
                && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, NOTIFICATION_PERMISSION_REQUEST);
        }

       if (savedInstanceState == null
        || webView.restoreState(savedInstanceState) == null) {
    webView.loadUrl(APP_URL);
}
}
@Override
protected void onResume() {
    super.onResume();

    if (webView == null) return;

    webView.setVisibility(android.view.View.VISIBLE);
    webView.onResume();
    webView.resumeTimers();
    webView.requestFocus();
    webView.requestLayout();
    webView.invalidate();

    webView.post(() -> {
        webView.invalidate();
        webView.evaluateJavascript(
                "(function(){" +
                "if(window.giloaMapBootstrap){" +
                "window.giloaMapBootstrap.invalidateSize(false);" +
                "}" +
                "window.dispatchEvent(new Event('resize'));" +
                "window.dispatchEvent(new Event('giloa:app-resume'));" +
                "})();",
                null
        );
    });

    webView.postDelayed(() -> {
        webView.invalidate();
        webView.evaluateJavascript(
                "if(window.giloaMapBootstrap){" +
                "window.giloaMapBootstrap.invalidateSize(false);" +
                "}" +
                "window.dispatchEvent(new Event('resize'));",
                null
        );
    }, 250);
}
    private Intent createOpenDocumentIntent(
            WebChromeClient.FileChooserParams params,
            String[] acceptedTypes) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        // Providers often report .gpx as XML or application/octet-stream.
        // Let the user select it; the page validates the actual GPX content.
        boolean gpxImport = acceptedTypes.length == 1
                && "application/gpx+xml".equals(acceptedTypes[0]);
        intent.setType(gpxImport ? "*/*" : commonMimeType(acceptedTypes));
        intent.putExtra(
                Intent.EXTRA_ALLOW_MULTIPLE,
                params.getMode() == WebChromeClient.FileChooserParams.MODE_OPEN_MULTIPLE);
        if (!gpxImport && acceptedTypes.length > 1) {
            intent.putExtra(Intent.EXTRA_MIME_TYPES, acceptedTypes);
        }
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        intent.addFlags(Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
        return intent;
    }

    /** Opens Android's photo-first picker. Cloud document providers remain
     * available only through the picker's "other apps/locations" affordance. */
    private Intent createPhotoPickerIntent(
            WebChromeClient.FileChooserParams params,
            String[] acceptedTypes) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU
                || (acceptedTypes.length > 0 && !containsImageType(acceptedTypes))) {
            return null;
        }
        Intent intent = new Intent(MediaStore.ACTION_PICK_IMAGES);
        intent.setType("image/*");
        intent.putExtra(EXTRA_REQUEST_LOCATION_METADATA_ACCESS, true);
        if (params.getMode() == WebChromeClient.FileChooserParams.MODE_OPEN_MULTIPLE) {
            intent.putExtra(MediaStore.EXTRA_PICK_IMAGES_MAX, Math.min(20, MediaStore.getPickImagesMaxLimit()));
        }
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        return intent.resolveActivity(getPackageManager()) == null ? null : intent;
    }

    private Intent createCameraCaptureIntent() {
        File directory = new File(getCacheDir(), "shared_photos");
        if (!directory.exists() && !directory.mkdirs()) return null;

        File output;
        try {
            output = File.createTempFile("giloa_capture_", ".jpg", directory);
        } catch (IOException error) {
            return null;
        }

        Uri outputUri;
        try {
            outputUri = FileProvider.getUriForFile(
                    this,
                    getPackageName() + ".fileprovider",
                    output);
        } catch (IllegalArgumentException error) {
            output.delete();
            return null;
        }

        Intent intent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
        intent.putExtra(MediaStore.EXTRA_OUTPUT, outputUri);
        intent.setClipData(ClipData.newRawUri("Giloa camera output", outputUri));
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        intent.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
        if (intent.resolveActivity(getPackageManager()) == null) {
            output.delete();
            return null;
        }

        pendingCameraOutputFile = output;
        pendingCameraOutputUri = outputUri;
        return intent;
    }

    private void clearPendingCameraOutput(boolean deleteFile) {
        if (deleteFile && pendingCameraOutputFile != null) {
            pendingCameraOutputFile.delete();
        }
        pendingCameraOutputFile = null;
        pendingCameraOutputUri = null;
    }

    private String[] normalizeAcceptTypes(String[] rawTypes) {
        Set<String> result = new LinkedHashSet<>();
        if (rawTypes != null) {
            for (String rawType : rawTypes) {
                if (rawType == null) continue;
                for (String part : rawType.split(",")) {
                    String value = part.trim().toLowerCase(Locale.ROOT);
                    if (value.isEmpty()) continue;
                    if (value.startsWith(".")) {
                        value = mimeTypeForExtension(value.substring(1));
                    }
                    if (value != null && value.contains("/") && value.length() <= 100) {
                        result.add(value);
                    }
                    if (result.size() >= 16) break;
                }
                if (result.size() >= 16) break;
            }
        }
        return result.toArray(new String[0]);
    }

    private String mimeTypeForExtension(String extension) {
        if ("gpx".equals(extension)) return "application/gpx+xml";
        if ("heic".equals(extension)) return "image/heic";
        if ("heif".equals(extension)) return "image/heif";
        String mime = MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension);
        return mime == null ? "" : mime.toLowerCase(Locale.ROOT);
    }

    private String commonMimeType(String[] acceptedTypes) {
        if (acceptedTypes.length == 0) return "*/*";
        if (acceptedTypes.length == 1) return acceptedTypes[0];
        boolean allImages = true;
        for (String type : acceptedTypes) {
            if (!type.startsWith("image/")) {
                allImages = false;
                break;
            }
        }
        return allImages ? "image/*" : "*/*";
    }

    private boolean containsImageType(String[] acceptedTypes) {
        for (String type : acceptedTypes) {
            if (type.startsWith("image/")) return true;
        }
        return false;
    }

    @Override
    public void onRequestPermissionsResult(
            int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (photoBridge != null) photoBridge.handlePermissionResult(requestCode, grantResults);
        if (requestCode == LOCATION_PERMISSION_REQUEST && geolocationCallback != null) {
            boolean granted = grantResults.length > 0
                    && grantResults[0] == PackageManager.PERMISSION_GRANTED;
            geolocationCallback.invoke(geolocationOrigin, granted && WebRequestPolicy.isTrustedLocation(geolocationOrigin, webView.getUrl()), false);
            geolocationCallback = null;
            geolocationOrigin = null;
        }
        if (requestCode == LOCATION_PERMISSION_REQUEST) resumePendingRouteAfterPermission();
        if (requestCode == MEDIA_LOCATION_PERMISSION_REQUEST && webView != null) {
            boolean granted = grantResults.length > 0
                    && grantResults[0] == PackageManager.PERMISSION_GRANTED;
            webView.evaluateJavascript(
                    "window.onGiloaPhotoLocationPermissionResult&&window.onGiloaPhotoLocationPermissionResult(" + granted + ");",
                    null);
        }
    }

    private void resumePendingRouteAfterPermission() {
        long endAt = pendingRouteStopAt;
        String sessionId = pendingRouteSessionId;
        pendingRouteStopAt = 0L;
        pendingRouteSessionId = "";
        if (photoBridge == null || endAt <= System.currentTimeMillis()) return;
        if (checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
                || checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
            photoBridge.startRouteTrackingSession(endAt - System.currentTimeMillis(), sessionId);
        }
    }

    private Uri requireOriginalPhotoUri(Uri uri) {
        if (uri == null || Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) return uri;
        if (checkSelfPermission(Manifest.permission.ACCESS_MEDIA_LOCATION) != PackageManager.PERMISSION_GRANTED) return uri;
        try {
            Uri mediaUri = MediaStore.getMediaUri(this, uri);
            return MediaStore.setRequireOriginal(mediaUri != null ? mediaUri : uri);
        }
        catch (SecurityException | UnsupportedOperationException | IllegalArgumentException ignored) { return uri; }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == GPX_EXPORT_REQUEST) {
            File pending = pendingGpxExportFile;
            Uri destination = data == null ? null : data.getData();
            if (resultCode != RESULT_OK) {
                finishGpxExport(pending, false, true);
            } else if (pending == null || destination == null) {
                finishGpxExport(pending, false, false);
            } else {
                new Thread(() -> {
                    boolean saved = false;
                    try (InputStream input = new java.io.FileInputStream(pending);
                         OutputStream output = getContentResolver().openOutputStream(destination, "wt")) {
                        if (output == null) throw new IOException("GPX destination unavailable");
                        byte[] buffer = new byte[32768];
                        int read;
                        while ((read = input.read(buffer)) != -1) output.write(buffer, 0, read);
                        output.flush();
                        saved = true;
                    } catch (IOException | RuntimeException ignored) { saved = false; }
                    finishGpxExport(pending, saved, false);
                }, "giloa-gpx-export").start();
            }
            return;
        }
        if (photoBridge != null) photoBridge.handlePickResult(requestCode, resultCode, data);
        if (requestCode != FILE_CHOOSER_REQUEST || fileCallback == null) return;

        Uri[] result = null;
        if (resultCode == RESULT_OK) {
            if (fileChooserUsesCameraCapture) {
                if (pendingCameraOutputUri != null
                        && pendingCameraOutputFile != null
                        && pendingCameraOutputFile.length() > 0) {
                    result = new Uri[]{pendingCameraOutputUri};
                }
            } else {
                result = collectSelectedUris(data);
            }
        }

        if (fileChooserUsesOpenDocument && result != null) {
            persistReadPermissions(result, data);
        }

        boolean injectPhotoUris = fileChooserReturnsImages || areImageUris(result);
        clearPendingCameraOutput(result == null);
        fileChooserUsesOpenDocument = false;
        fileChooserReturnsImages = false;
        fileChooserUsesCameraCapture = false;
        deliverFileChooserResult(result, injectPhotoUris);
    }

    private Uri[] collectSelectedUris(Intent data) {
        if (data == null) return null;
        Set<Uri> uris = new LinkedHashSet<>();
        ClipData clipData = data.getClipData();
        if (clipData != null) {
            for (int i = 0; i < clipData.getItemCount(); i++) {
                Uri uri = clipData.getItemAt(i).getUri();
                if (uri != null) uris.add(uri);
            }
        }
        if (data.getData() != null) uris.add(data.getData());
        if (uris.isEmpty()) {
            Uri[] parsed = WebChromeClient.FileChooserParams.parseResult(RESULT_OK, data);
            if (parsed != null) {
                for (Uri uri : parsed) {
                    if (uri != null) uris.add(uri);
                }
            }
        }
        return uris.isEmpty() ? null : uris.toArray(new Uri[0]);
    }

    private void persistReadPermissions(Uri[] uris, Intent data) {
        int flags = Intent.FLAG_GRANT_READ_URI_PERMISSION;
        if (data != null) {
            int returnedFlags = data.getFlags() & Intent.FLAG_GRANT_READ_URI_PERMISSION;
            if (returnedFlags != 0) flags = returnedFlags;
        }
        ContentResolver resolver = getContentResolver();
        for (Uri uri : uris) {
            if (uri == null || !"content".equalsIgnoreCase(uri.getScheme())) continue;
            try {
                resolver.takePersistableUriPermission(uri, flags);
            } catch (SecurityException | UnsupportedOperationException ignored) {
                // Some camera/gallery providers only grant a temporary read permission.
            }
        }
    }

    private boolean areImageUris(Uri[] uris) {
        if (uris == null || uris.length == 0) return false;
        for (Uri uri : uris) {
            String mime = safeContentMimeType(uri);
            if (mime == null || !mime.startsWith("image/")) return false;
        }
        return true;
    }

    private void deliverFileChooserResult(Uri[] result, boolean injectPhotoUris) {
        final ValueCallback<Uri[]> callback = fileCallback;
        fileCallback = null;
        if (callback == null) return;

        JSONArray json = new JSONArray();
        if (injectPhotoUris && result != null) {
            for (Uri uri : result) {
                if (uri != null) json.put(uri.toString());
            }
        }
        String jsonText = json.toString();
        synchronized (selectedUrisLock) {
            pendingSelectedUrisJson = jsonText;
        }
        String script = "window.__giloaNativePhotoUris = " + jsonText + ";";
        if (webView == null) {
            callback.onReceiveValue(result);
            return;
        }
        webView.evaluateJavascript(script, ignored -> callback.onReceiveValue(result));
    }

    private String safeContentMimeType(Uri uri) {
        if (uri == null) return null;
        try {
            String mime = getContentResolver().getType(uri);
            if (mime != null) return mime.toLowerCase(Locale.ROOT);
        } catch (SecurityException ignored) {
        }
        String extension = MimeTypeMap.getFileExtensionFromUrl(uri.toString());
        return extension == null || extension.isEmpty()
                ? null
                : mimeTypeForExtension(extension.toLowerCase(Locale.ROOT));
    }

    private boolean canReadContentUri(Uri uri) {
        try (AssetFileDescriptor descriptor =
                     getContentResolver().openAssetFileDescriptor(uri, "r")) {
            return descriptor != null;
        } catch (IOException | SecurityException | UnsupportedOperationException error) {
            return false;
        }
    }

    private void openExternalUri(Uri uri) {
        if (uri == null) return;
        String scheme = uri.getScheme();
        if ("http".equalsIgnoreCase(scheme)) {
            uri = uri.buildUpon().scheme("https").build();
            scheme = "https";
        }
        if (!("https".equalsIgnoreCase(scheme) || "mailto".equalsIgnoreCase(scheme)
                || "tel".equalsIgnoreCase(scheme) || "geo".equalsIgnoreCase(scheme)
                || "market".equalsIgnoreCase(scheme) || "kakaomap".equalsIgnoreCase(scheme))) return;
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, uri));
        } catch (ActivityNotFoundException | SecurityException ignored) {
        }
    }

    private boolean queuePhotoViewer(Uri uri, String mimeType) {
        if (uri == null || mimeType == null || !mimeType.startsWith("image/")) return false;
        Intent viewIntent = new Intent(Intent.ACTION_VIEW);
        viewIntent.setDataAndType(uri, mimeType);
        viewIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        viewIntent.setClipData(ClipData.newRawUri("Giloa photo", uri));
        if (viewIntent.resolveActivity(getPackageManager()) == null) return false;

        runOnUiThread(() -> {
            try {
                Intent chooser = Intent.createChooser(viewIntent, "사진 보기");
                chooser.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                startActivity(chooser);
            } catch (ActivityNotFoundException | SecurityException ignored) {
            }
        });
        return true;
    }

    private String normalizeImageMime(String mimeType) {
        if (mimeType == null) return null;
        String value = mimeType.trim().toLowerCase(Locale.ROOT);
        if ("image/jpg".equals(value)) value = "image/jpeg";
        switch (value) {
            case "image/jpeg":
            case "image/png":
            case "image/webp":
            case "image/gif":
            case "image/heic":
            case "image/heif":
                return value;
            default:
                return null;
        }
    }

    private String extensionForMime(String mimeType) {
        switch (mimeType) {
            case "image/png":
                return "png";
            case "image/webp":
                return "webp";
            case "image/gif":
                return "gif";
            case "image/heic":
                return "heic";
            case "image/heif":
                return "heif";
            default:
                return "jpg";
        }
    }

    private boolean matchesImageSignature(byte[] bytes, String mimeType) {
        if (bytes == null || bytes.length < 12) return false;
        if ("image/jpeg".equals(mimeType)) {
            return (bytes[0] & 0xff) == 0xff
                    && (bytes[1] & 0xff) == 0xd8
                    && (bytes[2] & 0xff) == 0xff;
        }
        if ("image/png".equals(mimeType)) {
            return (bytes[0] & 0xff) == 0x89
                    && bytes[1] == 0x50 && bytes[2] == 0x4e && bytes[3] == 0x47;
        }
        if ("image/gif".equals(mimeType)) {
            return bytes[0] == 'G' && bytes[1] == 'I' && bytes[2] == 'F'
                    && bytes[3] == '8' && (bytes[4] == '7' || bytes[4] == '9')
                    && bytes[5] == 'a';
        }
        if ("image/webp".equals(mimeType)) {
            return bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F'
                    && bytes[8] == 'W' && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P';
        }
        if ("image/heic".equals(mimeType) || "image/heif".equals(mimeType)) {
            return bytes[4] == 'f' && bytes[5] == 't' && bytes[6] == 'y' && bytes[7] == 'p';
        }
        return false;
    }

    private String safePhotoId(String photoId) {
        String source = photoId == null ? "photo" : photoId;
        String safe = source.replaceAll("[^A-Za-z0-9._-]", "_");
        if (safe.isEmpty()) safe = "photo";
        return safe.substring(0, Math.min(safe.length(), MAX_PHOTO_ID_LENGTH));
    }

    private boolean writeAndOpenPhoto(byte[] bytes, String mimeType, String photoId) {
        File directory = new File(getCacheDir(), "shared_photos");
        if (!directory.exists() && !directory.mkdirs()) return false;

        File output = new File(
                directory,
                "giloa_" + safePhotoId(photoId) + "." + extensionForMime(mimeType));
        File temporary = new File(output.getAbsolutePath() + ".tmp");
        try (FileOutputStream stream = new FileOutputStream(temporary, false)) {
            stream.write(bytes);
            stream.flush();
        } catch (IOException error) {
            temporary.delete();
            return false;
        }

        if (output.exists() && !output.delete()) {
            temporary.delete();
            return false;
        }
        if (!temporary.renameTo(output)) {
            temporary.delete();
            return false;
        }

        Uri contentUri = FileProvider.getUriForFile(
                this,
                getPackageName() + ".fileprovider",
                output);
        return queuePhotoViewer(contentUri, mimeType);
    }

    private void finishGpxExport(File pending, boolean saved, boolean cancelled) {
        final String callback = pending != null && pending.getName().startsWith("giloa-trip-")
                ? "window.giloaHandleTravelZipResult&&window.giloaHandleTravelZipResult("
                : "window.giloaHandleGpxSaveResult&&window.giloaHandleGpxSaveResult(";
        if (pending != null) pending.delete(); // Export staging copy only; never journey storage.
        pendingGpxExportFile = null;
        runOnUiThread(() -> {
            if (webView != null && !isFinishing()) webView.evaluateJavascript(
                    callback + saved + "," + cancelled + ");", null);
        });
    }

    public final class PhotoBridge extends io.giloa.app.GiloaPhotoBridge {
        public PhotoBridge() { super(MainActivity.this, MainActivity.this.webView); }

        @JavascriptInterface
        public synchronized boolean beginTravelZip(double expectedBytes) {
            if (pendingGpxExportFile != null || !(expectedBytes > 0) || expectedBytes > 256L * 1024L * 1024L || isFinishing()) return false;
            try {
                pendingGpxExportFile = File.createTempFile("giloa-trip-", ".zip", getCacheDir());
                travelZipExpectedBytes = (long) expectedBytes;
                return true;
            } catch (IOException | RuntimeException error) { return false; }
        }

        @JavascriptInterface
        public synchronized boolean appendTravelZipChunk(String encoded) {
            File pending = pendingGpxExportFile;
            if (pending == null || !pending.getName().startsWith("giloa-trip-") || encoded == null || encoded.length() > 262144) return false;
            try {
                byte[] bytes = Base64.decode(encoded, Base64.DEFAULT);
                if (bytes.length == 0 || pending.length() + bytes.length > travelZipExpectedBytes) return false;
                try (FileOutputStream output = new FileOutputStream(pending, true)) { output.write(bytes); }
                return true;
            } catch (IOException | RuntimeException error) { return false; }
        }

        @JavascriptInterface
        public synchronized boolean finishTravelZip(String filename) {
            final File pending = pendingGpxExportFile;
            if (pending == null || !pending.getName().startsWith("giloa-trip-") || pending.length() != travelZipExpectedBytes || isFinishing()) return false;
            String safe = filename == null ? "giloa_trip.zip" : filename.replaceAll("[^a-zA-Z0-9._-]", "_");
            if (safe.length() > 100) safe = safe.substring(0, 96) + ".zip";
            if (!safe.toLowerCase(Locale.ROOT).endsWith(".zip")) safe += ".zip";
            final String exportName = safe;
            runOnUiThread(() -> {
                try {
                    Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                    intent.addCategory(Intent.CATEGORY_OPENABLE);
                    intent.setType("application/zip");
                    intent.putExtra(Intent.EXTRA_TITLE, exportName);
                    startActivityForResult(intent, GPX_EXPORT_REQUEST);
                } catch (ActivityNotFoundException | SecurityException error) {
                    finishGpxExport(pending, false, false);
                }
            });
            return true;
        }

        @JavascriptInterface
        public synchronized void cancelTravelZip() {
            File pending = pendingGpxExportFile;
            if (pending != null && pending.getName().startsWith("giloa-trip-")) {
                pending.delete(); // Only the new ZIP staging file, never GPS/photo records.
                pendingGpxExportFile = null;
                travelZipExpectedBytes = 0;
            }
        }


        @JavascriptInterface
        public synchronized boolean saveGpxFile(String filename, String content) {
            if (pendingGpxExportFile != null || content == null || content.isEmpty()
                    || content.length() > 32 * 1024 * 1024 || isFinishing()) return false;
            File staged = null;
            try {
                staged = File.createTempFile("giloa-gpx-", ".gpx", getCacheDir());
                try (OutputStreamWriter writer = new OutputStreamWriter(new FileOutputStream(staged), StandardCharsets.UTF_8)) {
                    writer.write(content);
                }
                pendingGpxExportFile = staged;
                String safeName = filename == null ? "giloa_route.gpx" : filename.replaceAll("[\\\\/:*?\"<>|\\p{Cntrl}]", "_");
                if (safeName.length() > 120) safeName = safeName.substring(0, 116) + ".gpx";
                if (!safeName.toLowerCase(Locale.ROOT).endsWith(".gpx")) safeName += ".gpx";
                final String exportName = safeName;
                final File exportFile = staged;
                runOnUiThread(() -> {
                    try {
                        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                        intent.addCategory(Intent.CATEGORY_OPENABLE);
                        intent.setType("application/gpx+xml");
                        intent.putExtra(Intent.EXTRA_TITLE, exportName);
                        startActivityForResult(intent, GPX_EXPORT_REQUEST);
                    } catch (ActivityNotFoundException | SecurityException error) {
                        finishGpxExport(exportFile, false, false);
                    }
                });
                return true;
            } catch (IOException | RuntimeException error) {
                if (staged != null) staged.delete();
                pendingGpxExportFile = null;
                return false;
            }
        }

        @Override
        @JavascriptInterface
        public void requestPhotoLocationPermission() {
            runOnUiThread(() -> super.requestPhotoLocationPermission());
        }

        @Override
        @JavascriptInterface
        public void pickPhotos() {
            runOnUiThread(() -> super.pickPhotos());
        }
@JavascriptInterface
public boolean saveDurableState(String json) {
    if (json == null
            || json.isEmpty()
            || json.length() > MAX_DURABLE_STATE_CHARS) {
        return false;
    }

    getSharedPreferences(DURABLE_STATE_PREFS, MODE_PRIVATE)
            .edit()
            .putString(DURABLE_STATE_KEY, json)
            .apply();

    return true;
}

        @JavascriptInterface
        public String loadDurableState() {
            String saved = getSharedPreferences(DURABLE_STATE_PREFS, MODE_PRIVATE)
                    .getString(DURABLE_STATE_KEY, "");
            return saved == null ? "" : saved;
        }

        @JavascriptInterface
        public String getPhotoData(String sourceUri) {
            if (sourceUri == null || sourceUri.isEmpty() || sourceUri.length() > MAX_SOURCE_URI_LENGTH) return "";
            Uri uri;
            try { uri = Uri.parse(sourceUri); }
            catch (RuntimeException error) { return ""; }
            if (!"content".equalsIgnoreCase(uri.getScheme()) || !canReadContentUri(uri)) return "";
            String mimeType = normalizeImageMime(safeContentMimeType(uri));
            if (mimeType == null) return "";
            Uri readableUri = requireOriginalPhotoUri(uri);
            try (InputStream input = getContentResolver().openInputStream(readableUri);
                 ByteArrayOutputStream output = new ByteArrayOutputStream()) {
                if (input == null) return "";
                byte[] buffer = new byte[32 * 1024];
                int count;
                long total = 0L;
                while ((count = input.read(buffer)) != -1) {
                    total += count;
                    if (total > PHOTO_ORIGINAL_TRANSFER_MAX_BYTES) return "";
                    output.write(buffer, 0, count);
                }
                return "data:" + mimeType + ";base64," + Base64.encodeToString(output.toByteArray(), Base64.NO_WRAP);
            } catch (IOException | SecurityException error) { return ""; }
        }

        @JavascriptInterface
        public String copyPhotoToCache(String sourceUri) {
            if (sourceUri == null || sourceUri.isEmpty() || sourceUri.length() > MAX_SOURCE_URI_LENGTH) return "";
            Uri uri;
            try { uri = Uri.parse(sourceUri); }
            catch (RuntimeException error) { return ""; }
            if (!"content".equalsIgnoreCase(uri.getScheme()) || !canReadContentUri(uri)) return "";
            String mimeType = normalizeImageMime(safeContentMimeType(uri));
            if (mimeType == null) return "";
            File directory = new File(getCacheDir(), "exif_originals");
            if (!directory.exists() && !directory.mkdirs()) return "";
            String extension = extensionForMime(mimeType);
            File output;
            try { output = File.createTempFile("giloa_exif_", "." + extension, directory); }
            catch (IOException error) { return ""; }
            long total = 0L;
            Uri readableUri = requireOriginalPhotoUri(uri);
            try (InputStream input = getContentResolver().openInputStream(readableUri);
                 FileOutputStream stream = new FileOutputStream(output, false)) {
                if (input == null) { output.delete(); return ""; }
                byte[] buffer = new byte[32 * 1024];
                int count;
                while ((count = input.read(buffer)) != -1) {
                    total += count;
                    if (total > MAX_ORIGINAL_PHOTO_BYTES) { output.delete(); return ""; }
                    stream.write(buffer, 0, count);
                }
                stream.flush();
            } catch (IOException | SecurityException error) {
                output.delete();
                return "";
            }
            return Uri.fromFile(output).toString();
        }

        @JavascriptInterface
        public boolean startRouteTracking(long durationMs) {
            return startRouteTrackingSession(durationMs, "");
        }

        @JavascriptInterface
        public boolean startRouteTrackingSession(long durationMs, String recordingSessionId) {
            if (checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED
                    && checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                String requestedId = recordingSessionId == null ? "" : recordingSessionId;
                long requestedStopAt = System.currentTimeMillis() + Math.max(1L, Math.min(RouteTrackingService.DEFAULT_DURATION_MS, durationMs));
                if (requestedId.equals(pendingRouteSessionId) && pendingRouteStopAt > 0L) requestedStopAt = Math.min(requestedStopAt, pendingRouteStopAt);
                pendingRouteSessionId = requestedId;
                pendingRouteStopAt = requestedStopAt;
                return false;
            }
            Intent service = new Intent(MainActivity.this, RouteTrackingService.class)
                    .setAction(RouteTrackingService.ACTION_START)
                    .putExtra(RouteTrackingService.EXTRA_DURATION_MS, durationMs)
                    .putExtra(RouteTrackingService.EXTRA_SESSION_ID, recordingSessionId == null ? "" : recordingSessionId);
            try {
                ContextCompat.startForegroundService(MainActivity.this, service);
                return true;
            } catch (IllegalStateException | SecurityException error) {
                return false;
            }
        }

        @JavascriptInterface
        public void stopRouteTracking() {
            pendingRouteStopAt = 0L;
            pendingRouteSessionId = "";
            Intent service = new Intent(MainActivity.this, RouteTrackingService.class)
                    .setAction(RouteTrackingService.ACTION_STOP);
            try { startService(service); } catch (IllegalStateException | SecurityException ignored) { }
        }

        @JavascriptInterface
        public String loadRouteTrackingPoints() {
            synchronized (RouteTrackingService.ROUTE_POINTS_LOCK) {
                SharedPreferences prefs = getSharedPreferences(RouteTrackingService.PREFS, MODE_PRIVATE);
                try {
                    String raw = prefs.getString(RouteTrackingService.PREF_POINTS, "[]");
                    JSONArray legacy;
                    try { legacy = new JSONArray(raw == null ? "[]" : raw); }
                    catch (JSONException error) { legacy = new JSONArray(prefs.getString(RouteTrackingService.PREF_POINTS_BACKUP, "[]")); }
                    JSONArray durable = RoutePointStore.read(MainActivity.this);
                    for (int i = 0; i < durable.length(); i++) legacy.put(durable.get(i));
                    return legacy.toString();
                } catch (JSONException | RuntimeException error) {
                    // Never expose a partial queue that could acknowledge unread GPS records.
                    prefs.edit().putString("last_store_error", "read_failed").apply();
                    return "[]";
                }
            }
        }

        @JavascriptInterface
        public boolean acknowledgeRouteTrackingPoints(long throughTime) {
            if (throughTime <= 0L) return false;
            SharedPreferences prefs = getSharedPreferences(RouteTrackingService.PREFS, MODE_PRIVATE);
            synchronized (RouteTrackingService.ROUTE_POINTS_LOCK) {
                JSONArray legacy;
                try { legacy = new JSONArray(prefs.getString(RouteTrackingService.PREF_POINTS, "[]")); }
                catch (JSONException error) {
                    try { legacy = new JSONArray(prefs.getString(RouteTrackingService.PREF_POINTS_BACKUP, "[]")); }
                    catch (JSONException unreadable) { return false; }
                }
                JSONArray remaining = new JSONArray();
                for (int i = 0; i < legacy.length(); i++) {
                    JSONObject point = legacy.optJSONObject(i);
                    if (point == null || point.optLong("time", 0L) > throughTime) remaining.put(point);
                }
                boolean committed = prefs.edit().putString(RouteTrackingService.PREF_POINTS_BACKUP, remaining.toString())
                        .putString(RouteTrackingService.PREF_POINTS, remaining.toString()).commit();
                return committed && RoutePointStore.acknowledge(MainActivity.this, throughTime);
            }
        }

        @JavascriptInterface
        public String consumeRouteTrackingPoints() { return loadRouteTrackingPoints(); }

        @JavascriptInterface
        public boolean isRouteTrackingActive() {
            SharedPreferences state = getSharedPreferences(RouteTrackingService.PREFS, MODE_PRIVATE);
            return state.getBoolean(RouteTrackingService.PREF_ACTIVE, false) && state.getLong("stop_at", 0L) > System.currentTimeMillis();
        }

        @JavascriptInterface
        public long getRouteTrackingStopAt() {
            return getSharedPreferences(RouteTrackingService.PREFS, MODE_PRIVATE).getLong("stop_at", 0L);
        }

        @JavascriptInterface
        public String getRouteTrackingStatus() {
            SharedPreferences state = getSharedPreferences(RouteTrackingService.PREFS, MODE_PRIVATE);
            JSONObject result = new JSONObject();
            try {
                result.put("active", isRouteTrackingActive());
                result.put("stopAt", state.getLong("stop_at", 0L));
                result.put("lastWatchdogAt", state.getLong("last_watchdog_at", 0L));
                result.put("lastServiceStartAt", state.getLong("last_service_start_at", 0L));
                result.put("lastReceivedAt", state.getLong("last_location_received_at", 0L));
                result.put("lastStoredAt", state.getLong("last_stored_fix_at", 0L));
                result.put("lastRecoveryAt", state.getLong("last_recovery_at", 0L));
                result.put("recoveryAttempts", state.getInt("recovery_attempts", 0));
                result.put("stopReason", state.getString("stop_reason", ""));
                result.put("storageError", state.getString("last_store_error", ""));
                result.put("providerError", state.getString("last_provider_error", ""));
            } catch (JSONException ignored) { }
            return result.toString();
        }

        @JavascriptInterface
        public String getRouteTrackingSessionId() {
            return getSharedPreferences(RouteTrackingService.PREFS, MODE_PRIVATE)
                    .getString(RouteTrackingService.PREF_SESSION_ID, "");
        }

        @JavascriptInterface
        public String consumeSelectedUris() {
            synchronized (selectedUrisLock) {
                String nativeResult = super.consumeSelectedUris();
                String result = "[]".equals(nativeResult) ? pendingSelectedUrisJson : nativeResult;
                pendingSelectedUrisJson = "[]";
                return result;
            }
        }

        @JavascriptInterface
        public boolean openPhoto(String sourceUri) {
            if (sourceUri == null
                    || sourceUri.isEmpty()
                    || sourceUri.length() > MAX_SOURCE_URI_LENGTH) {
                return false;
            }
            Uri uri;
            try {
                uri = Uri.parse(sourceUri);
            } catch (RuntimeException error) {
                return false;
            }
            if (!"content".equalsIgnoreCase(uri.getScheme())) return false;
            if (!canReadContentUri(uri)) return false;

            String mimeType = normalizeImageMime(safeContentMimeType(uri));
            if (mimeType == null) return false;
            return queuePhotoViewer(uri, mimeType);
        }

        @JavascriptInterface
        public boolean openPhotoData(String dataUrl, String photoId) {
            if (dataUrl == null || !dataUrl.startsWith("data:image/")) return false;
            int comma = dataUrl.indexOf(',');
            if (comma <= 5 || comma > 200) return false;

            String header = dataUrl.substring(5, comma).toLowerCase(Locale.ROOT);
            if (!header.contains(";base64")) return false;
            int separator = header.indexOf(';');
            String mimeType = normalizeImageMime(
                    separator < 0 ? header : header.substring(0, separator));
            if (mimeType == null) return false;

            String encoded = dataUrl.substring(comma + 1);
            long maxEncodedLength = ((long) MAX_DATA_URL_BYTES + 2L) / 3L * 4L + 16L;
            if (encoded.isEmpty() || encoded.length() > maxEncodedLength) return false;

            byte[] bytes;
            try {
                bytes = Base64.decode(encoded, Base64.DEFAULT);
            } catch (IllegalArgumentException error) {
                return false;
            }
            if (bytes.length == 0
                    || bytes.length > MAX_DATA_URL_BYTES
                    || !matchesImageSignature(bytes, mimeType)) {
                return false;
            }
            return writeAndOpenPhoto(bytes, mimeType, photoId);
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        webView.saveState(outState);
        if (pendingGpxExportFile != null) outState.putString("giloa_pending_gpx_file", pendingGpxExportFile.getName());
        super.onSaveInstanceState(outState);
    }

    @Override
    protected void onDestroy() {
        if (fileCallback != null) {
            fileCallback.onReceiveValue(null);
            fileCallback = null;
        }
        clearPendingCameraOutput(true);
        if (webView != null) {
            webView.removeJavascriptInterface(PHOTO_BRIDGE_NAME);
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }
}

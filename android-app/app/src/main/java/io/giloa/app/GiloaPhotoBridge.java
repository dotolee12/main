package io.giloa.app;

import android.app.Activity;
import android.content.ContentResolver;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.provider.DocumentsContract;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import androidx.core.content.ContextCompat;

import org.json.JSONArray;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.List;

/**
 * Native half of window.GiloaPhotoBridge.
 *
 * The point of this class is one call: MediaStore.setRequireOriginal().
 * Without it Android 10+ hands the app a copy of the photo whose GPS values are
 * zeroed out, which is why the same file reads fine on a desktop but comes back
 * locationless on the phone.
 *
 * Wire-up in MainActivity.onCreate, after super.onCreate:
 *     photoBridge = new GiloaPhotoBridge(this, getBridge().getWebView());
 *     getBridge().getWebView().addJavascriptInterface(photoBridge, "GiloaPhotoBridge");
 *
 * Also forward two Activity callbacks:
 *     onActivityResult(...)      -> photoBridge.handlePickResult(requestCode, resultCode, data)
 *     onRequestPermissionsResult -> photoBridge.handlePermissionResult(requestCode, grantResults)
 */
public class GiloaPhotoBridge {

    public static final int REQUEST_PICK_PHOTOS = 8801;
    public static final int REQUEST_MEDIA_LOCATION = 8802;

    private static final int MAX_INLINE_BYTES = 6 * 1024 * 1024;

    private final Activity activity;
    private final WebView webView;
    private final List<String> pendingUris = new ArrayList<>();

    private String lastErrorMessage = "";
    private String lastPickerLabel = "";
    private boolean pickPendingAfterPermission = false;
    private String cachedUri = "";
    private byte[] cachedBytes = null;

    public GiloaPhotoBridge(Activity activity, WebView webView) {
        this.activity = activity;
        this.webView = webView;
    }

    /** Lets the in-app diagnostic show why a read failed instead of guessing. */
    @JavascriptInterface
    public String lastError() {
        return lastErrorMessage == null ? "" : lastErrorMessage;
    }

    /** Which chooser actually opened, so the diagnostic can explain the UI shown. */
    @JavascriptInterface
    public String lastPicker() {
        return lastPickerLabel == null ? "" : lastPickerLabel;
    }

    // ---------------------------------------------------------------- permission

    @JavascriptInterface
    public boolean hasPhotoLocationPermission() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) return true;
        return granted(android.Manifest.permission.ACCESS_MEDIA_LOCATION) && hasReadPermission();
    }

    private boolean hasReadPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            return granted(android.Manifest.permission.READ_MEDIA_IMAGES);
        }
        return granted(android.Manifest.permission.READ_EXTERNAL_STORAGE);
    }

    private boolean granted(String permission) {
        return ContextCompat.checkSelfPermission(activity, permission) == PackageManager.PERMISSION_GRANTED;
    }

    @JavascriptInterface
    public void requestPhotoLocationPermission() {
        if (hasPhotoLocationPermission()) {
            reportPermission(true);
            return;
        }
        List<String> wanted = new ArrayList<>();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            wanted.add(android.Manifest.permission.READ_MEDIA_IMAGES);
        } else {
            wanted.add(android.Manifest.permission.READ_EXTERNAL_STORAGE);
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            wanted.add(android.Manifest.permission.ACCESS_MEDIA_LOCATION);
        }
        activity.requestPermissions(wanted.toArray(new String[0]), REQUEST_MEDIA_LOCATION);
    }

    public void handlePermissionResult(int requestCode, int[] grantResults) {
        if (requestCode != REQUEST_MEDIA_LOCATION) return;
        reportPermission(hasPhotoLocationPermission());
        if (!pickPendingAfterPermission) return;
        pickPendingAfterPermission = false;
        // Resume the pick either way: a denial simply falls back to the document
        // chooser, which still returns unredacted bytes for user-selected files.
        activity.runOnUiThread(new Runnable() {
            @Override public void run() { launchPhotoPicker(); }
        });
    }

    private void reportPermission(final boolean value) {
        runJs("window.onGiloaPhotoLocationPermissionResult && window.onGiloaPhotoLocationPermissionResult(" + value + ");");
    }

    // ------------------------------------------------------------------- picking

    /**
     * Opens the device gallery rather than the document browser. ACTION_PICK_IMAGES
     * (the system photo picker) is deliberately avoided because it returns photos
     * with the GPS values zeroed out no matter which permissions are held.
     *
     * ACTION_PICK gives the familiar gallery UI and hands back MediaStore URIs,
     * but those ARE redacted unless ACCESS_MEDIA_LOCATION is granted, so the
     * permission is requested first and the pick resumes afterwards.
     */
    @JavascriptInterface
    public void pickPhotos() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && !hasPhotoLocationPermission()) {
            pickPendingAfterPermission = true;
            requestPhotoLocationPermission();
            return;
        }
        launchPhotoPicker();
    }

    private void launchPhotoPicker() {
        // The gallery is only safe to use once the location permission is held;
        // without it the same chooser returns zeroed coordinates.
        if (hasPhotoLocationPermission() && launchGalleryPick()) return;
        launchDocumentPick();
    }

    private boolean launchGalleryPick() {
        try {
            Intent intent = new Intent(Intent.ACTION_PICK, MediaStore.Images.Media.EXTERNAL_CONTENT_URI);
            intent.setType("image/*");
            intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            activity.startActivityForResult(intent, REQUEST_PICK_PHOTOS);
            lastPickerLabel = "갤러리";
            return true;
        } catch (Exception e) {
            lastErrorMessage = "갤러리 열기 실패: " + e.getMessage();
            return false;
        }
    }

    /**
     * Fallback chooser. EXTRA_INITIAL_URI starts it in the device's own image
     * folder instead of the cloud-provider list, which is what made it look like
     * a file manager rather than a photo picker.
     */
    private void launchDocumentPick() {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("image/*");
        intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try { intent.putExtra(DocumentsContract.EXTRA_INITIAL_URI, MediaStore.Images.Media.EXTERNAL_CONTENT_URI); }
            catch (Exception ignored) { }
        }
        try {
            activity.startActivityForResult(intent, REQUEST_PICK_PHOTOS);
            lastPickerLabel = "문서 탐색기";
        } catch (Exception e) {
            lastErrorMessage = "사진 선택기를 열지 못했습니다: " + e.getMessage();
            lastPickerLabel = "실패";
            runJs("window.onGiloaPhotosPicked && window.onGiloaPhotosPicked('[]');");
        }
    }

    public void handlePickResult(int requestCode, int resultCode, Intent data) {
        if (requestCode != REQUEST_PICK_PHOTOS) return;
        pendingUris.clear();
        clearCache();
        if (resultCode != Activity.RESULT_OK || data == null) {
            runJs("window.onGiloaPhotosPicked && window.onGiloaPhotosPicked('[]');");
            return;
        }
        if (data.getClipData() != null) {
            for (int i = 0; i < data.getClipData().getItemCount(); i++) {
                addPickedUri(data.getClipData().getItemAt(i).getUri(), data);
            }
        } else if (data.getData() != null) {
            addPickedUri(data.getData(), data);
        }
        JSONArray array = new JSONArray(pendingUris);
        runJs("window.__giloaNativePhotoUris = " + array.toString() + ";"
                + "window.onGiloaPhotosPicked && window.onGiloaPhotosPicked(" + jsString(array.toString()) + ");");
    }

    /**
     * Without a persisted grant the URI can stop being readable before the photo
     * is imported, which looked exactly like "the original cannot be read".
     */
    private void addPickedUri(Uri uri, Intent data) {
        if (uri == null) return;
        try {
            int flags = data.getFlags() & Intent.FLAG_GRANT_READ_URI_PERMISSION;
            if (flags != 0) activity.getContentResolver().takePersistableUriPermission(uri, flags);
        } catch (Exception e) {
            lastErrorMessage = "URI 권한 유지 실패: " + e.getMessage();
        }
        pendingUris.add(uri.toString());
    }

    @JavascriptInterface
    public String consumeSelectedUris() {
        JSONArray array = new JSONArray(pendingUris);
        pendingUris.clear();
        return array.toString();
    }

    // -------------------------------------------------------- unredacted reading

    /**
     * Resolves a picked URI to one that yields the ORIGINAL bytes including GPS.
     * ACTION_OPEN_DOCUMENT returns a documents-provider URI, which setRequireOriginal
     * rejects outright, so it is converted to a MediaStore URI first.
     */
    private Uri requireOriginal(Uri uri) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) return uri;
        try {
            Uri mediaUri = MediaStore.getMediaUri(activity, uri);
            if (mediaUri != null) return MediaStore.setRequireOriginal(mediaUri);
        } catch (Exception e) {
            lastErrorMessage = "getMediaUri: " + e.getClass().getSimpleName() + " " + e.getMessage();
        }
        try {
            return MediaStore.setRequireOriginal(uri);
        } catch (Exception e) {
            lastErrorMessage = "setRequireOriginal: " + e.getClass().getSimpleName() + " " + e.getMessage();
        }
        return uri;
    }

    private byte[] loadBytes(String uriString) {
        if (uriString == null || uriString.isEmpty()) {
            lastErrorMessage = "빈 URI";
            return null;
        }
        if (uriString.equals(cachedUri) && cachedBytes != null) return cachedBytes;

        ContentResolver resolver = activity.getContentResolver();
        Uri uri = Uri.parse(uriString);
        InputStream in = null;
        try {
            try {
                in = resolver.openInputStream(requireOriginal(uri));
            } catch (SecurityException e) {
                // ACCESS_MEDIA_LOCATION missing or not granted: the redacted copy
                // is still better than failing the import outright.
                lastErrorMessage = "원본 접근 거부(권한): " + e.getMessage();
                in = resolver.openInputStream(uri);
            }
            if (in == null) {
                lastErrorMessage = "openInputStream이 null을 반환";
                return null;
            }
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] chunk = new byte[32768];
            int read;
            while ((read = in.read(chunk)) != -1) out.write(chunk, 0, read);
            byte[] bytes = out.toByteArray();
            if (bytes.length == 0) {
                lastErrorMessage = "읽은 바이트가 0";
                return null;
            }
            cachedUri = uriString;
            cachedBytes = bytes;
            lastErrorMessage = "";
            return bytes;
        } catch (Exception e) {
            lastErrorMessage = e.getClass().getSimpleName() + ": " + e.getMessage();
            return null;
        } finally {
            closeQuietly(in);
        }
    }

    private void clearCache() {
        cachedUri = "";
        cachedBytes = null;
    }

    private File writeCacheFile(byte[] bytes) {
        OutputStream out = null;
        try {
            File dir = new File(activity.getCacheDir(), "giloa-photos");
            if (!dir.exists() && !dir.mkdirs()) {
                lastErrorMessage = "캐시 폴더 생성 실패";
                return null;
            }
            File file = new File(dir, "photo-" + System.currentTimeMillis() + ".bin");
            out = new FileOutputStream(file);
            out.write(bytes);
            out.flush();
            return file;
        } catch (Exception e) {
            lastErrorMessage = "캐시 파일 쓰기 실패: " + e.getMessage();
            return null;
        } finally {
            closeQuietly(out);
        }
    }

    /** Bare absolute path. JS decides which URL scheme this build can actually load. */
    @JavascriptInterface
    public String copyPhotoToCachePath(String uriString) {
        byte[] bytes = loadBytes(uriString);
        if (bytes == null) return "";
        File file = writeCacheFile(bytes);
        return file == null ? "" : file.getAbsolutePath();
    }

    /**
     * The app is served from file:///android_asset/www, so a file:// URL is what
     * the WebView can actually open. It must be read with XHR, not fetch(),
     * because fetch() does not support the file: scheme at all.
     *
     * MainActivity.PhotoBridge overrides this with its own hardened version;
     * this implementation only matters if the subclass is removed.
     */
    @JavascriptInterface
    public String copyPhotoToCache(String uriString) {
        byte[] bytes = loadBytes(uriString);
        if (bytes == null) return "";
        File file = writeCacheFile(bytes);
        return file == null ? "" : Uri.fromFile(file).toString();
    }

    @JavascriptInterface
    public String getPhotoMimeType(String uriString) {
        try {
            String mime = activity.getContentResolver().getType(Uri.parse(uriString));
            return mime == null || mime.isEmpty() ? "image/jpeg" : mime;
        } catch (Exception e) {
            return "image/jpeg";
        }
    }

    @JavascriptInterface
    public int getPhotoSize(String uriString) {
        byte[] bytes = loadBytes(uriString);
        return bytes == null ? 0 : bytes.length;
    }

    /** Chunked transfer. A single multi-megabyte base64 string can be dropped by the WebView. */
    @JavascriptInterface
    public String getPhotoChunk(String uriString, int offset, int length) {
        byte[] bytes = loadBytes(uriString);
        if (bytes == null || offset < 0 || offset >= bytes.length) return "";
        int end = Math.min(bytes.length, offset + Math.max(0, length));
        byte[] slice = new byte[end - offset];
        System.arraycopy(bytes, offset, slice, 0, slice.length);
        return Base64.encodeToString(slice, Base64.NO_WRAP);
    }

    @JavascriptInterface
    public String getPhotoData(String uriString) {
        byte[] bytes = loadBytes(uriString);
        if (bytes == null) return "";
        if (bytes.length > MAX_INLINE_BYTES) {
            lastErrorMessage = "파일이 커서 인라인 전송 생략 (" + (bytes.length / 1024) + "KB)";
            return "";
        }
        return "data:" + getPhotoMimeType(uriString) + ";base64," + Base64.encodeToString(bytes, Base64.NO_WRAP);
    }

    // -------------------------------------------------------------------- helpers

    private void runJs(final String script) {
        webView.post(new Runnable() {
            @Override public void run() { webView.evaluateJavascript(script, null); }
        });
    }

    private static String jsString(String value) {
        return "\"" + value.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
    }

    private static void closeQuietly(java.io.Closeable c) {
        if (c == null) return;
        try { c.close(); } catch (Exception ignored) { }
    }
}

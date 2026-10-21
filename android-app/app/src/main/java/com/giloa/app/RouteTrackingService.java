package com.giloa.app;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Build;
import android.os.Bundle;
import android.os.IBinder;
import android.os.Handler;
import android.os.HandlerThread;
import android.os.SystemClock;
import android.os.Looper;
import android.os.PowerManager;

import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/** Visible foreground recording with bounded recovery and a fixed session deadline. */
public final class RouteTrackingService extends Service implements LocationListener {
    public static final String ACTION_START = "com.giloa.app.action.START_ROUTE";
    public static final String ACTION_STOP = "com.giloa.app.action.STOP_ROUTE";
    public static final String ACTION_DRAIN = "com.giloa.app.action.DRAIN_ROUTE";
    public static final String EXTRA_DURATION_MS = "durationMs";
    public static final String EXTRA_SESSION_ID = "recordingSessionId";
    public static final String PREFS = "giloa_route_tracking";
    public static final String PREF_POINTS = "pending_points";
    public static final String PREF_POINTS_BACKUP = "pending_points_backup";
    public static final String PREF_ACTIVE = "active";
    public static final String PREF_SESSION_ID = "recording_session_id";
    public static final long DEFAULT_DURATION_MS = 8L * 60L * 60L * 1000L;
    private static final String CHANNEL_ID = "giloa_route_tracking";
    private static final int NOTIFICATION_ID = 8108;
    private static final long WAKE_LOCK_GRACE_MS = 60_000L;
    private static final long FRESH_LAST_KNOWN_MS = 30_000L;
    static final Object ROUTE_POINTS_LOCK = new Object();
    private LocationManager locationManager;
    private PowerManager.WakeLock routeWakeLock;
    private volatile long stopAtMs;
    private HandlerThread trackingThread;
    private Handler trackingHandler;
    private long lastGoodFixElapsedMs;
    private long lastRequestElapsedMs;
    private final Handler stopHandler = new Handler(Looper.getMainLooper());
    private final Runnable stopRunnable = () -> stopTracking("duration_complete");
    private final Runnable watchdog = new Runnable() {
        @Override public void run() {
            if (!prefs().getBoolean(PREF_ACTIVE, false)) return;
            prefs().edit().putLong("last_watchdog_at", System.currentTimeMillis()).apply();
            if (System.currentTimeMillis() >= stopAtMs) { stopHandler.post(() -> stopTracking("duration_complete")); return; }
            if (RouteRecordingPolicy.needsRecovery(SystemClock.elapsedRealtime(), lastGoodFixElapsedMs, lastRequestElapsedMs)) {
                prefs().edit().putLong("last_recovery_at", System.currentTimeMillis()).putInt("recovery_attempts", prefs().getInt("recovery_attempts", 0) + 1).apply();
                requestLocations();
            }
            trackingHandler.postDelayed(this, 30_000L);
        }
    };
    @Override public void onCreate() {
        super.onCreate();
        locationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
        trackingThread = new HandlerThread("giloa-route-location"); trackingThread.start();
        trackingHandler = new Handler(trackingThread.getLooper());
        PowerManager power = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (power != null) { routeWakeLock = power.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "giloa:route-recording"); routeWakeLock.setReferenceCounted(false); }
        createChannel();
    }
    @Override public void onTaskRemoved(Intent rootIntent) {
        // Do not stop an active, user-visible route recording when the app UI
        // is swiped away. The foreground notification remains the stop affordance.
        long now = System.currentTimeMillis();
        long savedStopAt = prefs().getLong("stop_at", 0L);
        if (prefs().getBoolean(PREF_ACTIVE, false) && savedStopAt > now) {
            Intent restart = new Intent(this, RouteTrackingService.class)
                    .setAction(ACTION_START)
                    .putExtra(EXTRA_DURATION_MS, savedStopAt - now)
                    .putExtra(EXTRA_SESSION_ID, prefs().getString(PREF_SESSION_ID, ""));
            try { ContextCompat.startForegroundService(this, restart); } catch (IllegalStateException | SecurityException ignored) { }
        }
        super.onTaskRemoved(rootIntent);
    }


    @Override public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent == null ? ACTION_START : intent.getAction();
        if (ACTION_STOP.equals(action)) { stopTracking(); return START_NOT_STICKY; }
        if (ACTION_DRAIN.equals(action)) return START_NOT_STICKY;
        SharedPreferences prefs = prefs();
        long now = System.currentTimeMillis();
        String requested = intent == null ? "" : intent.getStringExtra(EXTRA_SESSION_ID);
        String sessionId = requested == null ? "" : requested.trim();
        if (sessionId.isEmpty() && prefs.getBoolean(PREF_ACTIVE, false)) sessionId = prefs.getString(PREF_SESSION_ID, "");
        if (sessionId.isEmpty()) sessionId = "session:" + now + ":native";
        long savedStopAt = prefs.getLong("stop_at", 0L);
        boolean active = prefs.getBoolean(PREF_ACTIVE, false);
        boolean sameSession = sessionId.equals(prefs.getString(PREF_SESSION_ID, ""));
        boolean restarting = intent == null || (flags & START_FLAG_REDELIVERY) != 0;
        long requestedDuration = intent == null ? DEFAULT_DURATION_MS : intent.getLongExtra(EXTRA_DURATION_MS, DEFAULT_DURATION_MS);
        stopAtMs = RouteRecordingPolicy.resolveStopAt(now, requestedDuration, savedStopAt, active, sameSession, restarting);
        if (stopAtMs <= now) {
            String reason = !active && sameSession ? prefs.getString("stop_reason", "inactive_session") : "duration_complete";
            stopTracking(reason.isEmpty() ? "inactive_session" : reason);
            return START_NOT_STICKY;
        }
        long duration = stopAtMs - now;
        prefs.edit().putBoolean(PREF_ACTIVE, true).putLong("stop_at", stopAtMs).putString(PREF_SESSION_ID, sessionId)
                .putString("stop_reason", "").putLong("last_service_start_at", now).commit();
        try { startForeground(NOTIFICATION_ID, buildNotification()); }
        catch (SecurityException | IllegalStateException error) {
            stopTracking("foreground_service_denied");
            return START_NOT_STICKY;
        }
        holdWakeLock(duration);
        stopHandler.removeCallbacks(stopRunnable); stopHandler.postDelayed(stopRunnable, duration);
        trackingHandler.removeCallbacks(watchdog);
        trackingHandler.post(() -> {
            trackingHandler.removeCallbacks(watchdog);
            if (lastGoodFixElapsedMs == 0L) lastGoodFixElapsedMs = SystemClock.elapsedRealtime();
            requestLocations();
            if (prefs().getBoolean(PREF_ACTIVE, false)) trackingHandler.postDelayed(watchdog, 30_000L);
        });
        return START_REDELIVER_INTENT;
    }
    private void holdWakeLock(long duration) {
        if (routeWakeLock == null) return;
        try { routeWakeLock.acquire(Math.min(DEFAULT_DURATION_MS + WAKE_LOCK_GRACE_MS, duration + WAKE_LOCK_GRACE_MS)); }
        catch (SecurityException ignored) { }
    }
    private void requestLocations() {
        if (!prefs().getBoolean(PREF_ACTIVE, false) || System.currentTimeMillis() >= stopAtMs) return;
        lastRequestElapsedMs = SystemClock.elapsedRealtime();
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED
                && ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            stopHandler.post(() -> stopTracking("permission_revoked")); return;
        }
        try { locationManager.removeUpdates(this); }
        catch (SecurityException error) { stopHandler.post(() -> stopTracking("permission_revoked")); return; }
        requestProvider(LocationManager.GPS_PROVIDER); requestProvider(LocationManager.NETWORK_PROVIDER);
    }
    private void requestProvider(String provider) {
        try {
            if (!locationManager.getAllProviders().contains(provider)) return;
            if (LocationManager.GPS_PROVIDER.equals(provider)
                    && ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                prefs().edit().putString("last_provider_error", "precise_location_not_granted").apply();
                return;
            }
            locationManager.requestLocationUpdates(provider, 5_000L, 0f, this, trackingThread.getLooper());
            Location known = locationManager.getLastKnownLocation(provider);
            if (known != null && System.currentTimeMillis() - known.getTime() <= FRESH_LAST_KNOWN_MS) onLocationChanged(known);
        } catch (SecurityException error) {
            prefs().edit().putString("last_provider_error", "permission_revoked").apply();
            if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED
                    && ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED)
                stopHandler.post(() -> stopTracking("permission_revoked"));
        } catch (IllegalArgumentException | IllegalStateException error) {
            prefs().edit().putString("last_provider_error", provider + ":" + error.getClass().getSimpleName()).apply();
        }
    }
    @Override public void onLocationChanged(Location location) {
        if (location == null || !prefs().getBoolean(PREF_ACTIVE, false)) return;
        if (System.currentTimeMillis() >= stopAtMs) { stopHandler.post(() -> stopTracking("duration_complete")); return; }
        prefs().edit().putLong("last_location_received_at", System.currentTimeMillis()).apply();
        if (!location.hasAccuracy() || !Float.isFinite(location.getAccuracy()) || location.getAccuracy() < 0f || location.getAccuracy() > 100f) return;
        double lat = location.getLatitude(), lng = location.getLongitude();
        if (!Double.isFinite(lat) || !Double.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return;
        lastGoodFixElapsedMs = SystemClock.elapsedRealtime();
        appendPoint(location);
    }
    private void appendPoint(Location location) {
        synchronized (ROUTE_POINTS_LOCK) {
            SharedPreferences prefs = prefs();
            if (!prefs.getBoolean(PREF_ACTIVE, false) || System.currentTimeMillis() >= stopAtMs) return;
            try {
                JSONObject point = new JSONObject();
                point.put("lat", location.getLatitude()); point.put("lng", location.getLongitude());
                point.put("accuracy", location.getAccuracy()); point.put("time", location.getTime() > 0 ? location.getTime() : System.currentTimeMillis());
                point.put("recordingSessionId", prefs.getString(PREF_SESSION_ID, ""));
                point.put("bearing", location.hasBearing() ? location.getBearing() : JSONObject.NULL);
                point.put("speed", location.hasSpeed() ? location.getSpeed() : JSONObject.NULL);
                boolean saved = RoutePointStore.append(this, point);
                if (!saved) {
                    JSONArray points;
                    String previous = prefs.getString(PREF_POINTS, "[]");
                    try { points = new JSONArray(previous); }
                    catch (JSONException error) { previous = prefs.getString(PREF_POINTS_BACKUP, "[]"); points = new JSONArray(previous); }
                    points.put(point);
                    saved = prefs.edit().putString(PREF_POINTS_BACKUP, previous).putString(PREF_POINTS, points.toString()).commit();
                }
                if (saved) prefs.edit().putLong("last_stored_fix_at", point.optLong("time", 0L)).putString("last_store_error", "").apply();
                else prefs.edit().putString("last_store_error", "write_failed").apply();
            } catch (JSONException error) { prefs.edit().putString("last_store_error", "legacy_queue_unreadable").apply(); }
        }
    }
    private String recordingDeadlineText() {
        String language = java.util.Locale.getDefault().getLanguage();
        String prefix = "Recording until ";
        if ("ko".equals(language)) prefix = "기록 종료 예정 ";
        else if ("ja".equals(language)) prefix = "記録終了予定 ";
        else if ("zh".equals(language)) prefix = "记录结束时间 ";
        else if ("es".equals(language)) prefix = "Grabando hasta ";
        else if ("fr".equals(language)) prefix = "Enregistrement jusqu’à ";
        return prefix + android.text.format.DateFormat.getTimeFormat(this).format(new java.util.Date(stopAtMs));
    }
    private Notification buildNotification() {
        Intent open = new Intent(this, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent contentIntent = PendingIntent.getActivity(this, 1, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Intent stop = new Intent(this, RouteTrackingService.class).setAction(ACTION_STOP);
        PendingIntent stopIntent = PendingIntent.getService(this, 2, stop, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_menu_mylocation)
                .setContentTitle("Giloa is recording your route")
                .setContentText(recordingDeadlineText())
                .setContentIntent(contentIntent).setOngoing(true).setOnlyAlertOnce(true)
                .addAction(android.R.drawable.ic_media_pause, "Stop recording", stopIntent)
                .build();
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationChannel channel = new NotificationChannel(CHANNEL_ID, "Giloa route recording", NotificationManager.IMPORTANCE_LOW);
        channel.setDescription("Keeps GPS route recording active while the screen is off.");
        ((NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE)).createNotificationChannel(channel);
    }

    private SharedPreferences prefs() { return getSharedPreferences(PREFS, MODE_PRIVATE); }
    private void stopTracking() { stopTracking("user_stop"); }
    private void stopTracking(String reason) {
        stopHandler.removeCallbacks(stopRunnable);
        if (trackingHandler != null) trackingHandler.removeCallbacks(watchdog);
        if (locationManager != null) try { locationManager.removeUpdates(this); } catch (SecurityException ignored) { }
        if (routeWakeLock != null && routeWakeLock.isHeld()) routeWakeLock.release();
        prefs().edit().putBoolean(PREF_ACTIVE, false).putString("stop_reason", reason).putLong("last_stopped_at", System.currentTimeMillis()).commit();
        stopForeground(STOP_FOREGROUND_REMOVE);
        stopSelf();
    }
    @Override public void onProviderDisabled(String provider) { if (trackingHandler != null) trackingHandler.post(() -> { if (RouteRecordingPolicy.needsProviderRefresh(SystemClock.elapsedRealtime(), lastRequestElapsedMs)) requestLocations(); }); }
    @Override public void onProviderEnabled(String provider) { if (trackingHandler != null) trackingHandler.post(() -> { if (RouteRecordingPolicy.needsProviderRefresh(SystemClock.elapsedRealtime(), lastRequestElapsedMs)) requestLocations(); }); }
    @Override public void onStatusChanged(String provider, int status, Bundle extras) { }
    @Override public IBinder onBind(Intent intent) { return null; }
    @Override public void onDestroy() {
        stopHandler.removeCallbacks(stopRunnable);
        if (trackingHandler != null) trackingHandler.removeCallbacks(watchdog);
        if (locationManager != null) try { locationManager.removeUpdates(this); } catch (SecurityException ignored) { }
        if (routeWakeLock != null && routeWakeLock.isHeld()) routeWakeLock.release();
        if (trackingThread != null) trackingThread.quitSafely();
        super.onDestroy();
    }
}

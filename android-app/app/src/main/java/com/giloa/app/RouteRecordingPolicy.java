package com.giloa.app;

/** Pure deadline/recovery rules shared by the native recorder and host regression tests. */
final class RouteRecordingPolicy {
    static final long MAX_DURATION_MS = 8L * 60L * 60L * 1000L;
    static long resolveStopAt(long now, long requestedDuration, long savedStopAt,
                              boolean active, boolean sameSession, boolean restarting) {
        // Retries and intent redelivery must not grant another eight hours.
        if (!active && (restarting || sameSession)) return 0L;
        if (sameSession && savedStopAt > 0L) return savedStopAt;
        if (restarting) return active && savedStopAt > 0L ? savedStopAt : 0L;
        return now + Math.max(1L, Math.min(MAX_DURATION_MS, requestedDuration));
    }
    static boolean needsRecovery(long elapsedNow, long lastGoodFix, long lastRequest) {
        return elapsedNow - lastGoodFix >= 60_000L && elapsedNow - lastRequest >= 120_000L;
    }
    static boolean needsProviderRefresh(long elapsedNow, long lastRequest) { return elapsedNow - lastRequest >= 5_000L; }
    private RouteRecordingPolicy() { }
}

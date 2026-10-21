package com.giloa.app;

import android.content.Context;
import android.content.ContentValues;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/** Additive native queue. Existing SharedPreferences remain readable and are not migrated/cleared. */
final class RoutePointStore {
    static final String CREATE_POINTS = "CREATE TABLE IF NOT EXISTS route_points (seq INTEGER PRIMARY KEY AUTOINCREMENT, fix_time INTEGER NOT NULL, payload TEXT NOT NULL)";
    static final String CREATE_INDEX = "CREATE INDEX IF NOT EXISTS route_points_time ON route_points(fix_time)";
    static final String READ_POINTS = "SELECT payload FROM route_points ORDER BY fix_time, seq";
    static final String ACK_POINTS = "fix_time <= ?";
    private static SQLiteDatabase open(Context context) {
        SQLiteDatabase db = context.openOrCreateDatabase("giloa_native_route_points_v1.db", Context.MODE_PRIVATE, null);
        try { db.execSQL(CREATE_POINTS); db.execSQL(CREATE_INDEX); return db; }
        catch (RuntimeException error) { db.close(); throw error; }
    }
    static boolean append(Context context, JSONObject point) {
        synchronized (RouteTrackingService.ROUTE_POINTS_LOCK) {
            try (SQLiteDatabase db = open(context)) {
                ContentValues row = new ContentValues();
                row.put("fix_time", point.optLong("time", 0L)); row.put("payload", point.toString());
                return db.insertOrThrow("route_points", null, row) >= 0L;
            } catch (RuntimeException error) { return false; }
        }
    }
    static JSONArray read(Context context) throws JSONException {
        synchronized (RouteTrackingService.ROUTE_POINTS_LOCK) {
            JSONArray result = new JSONArray();
            try (SQLiteDatabase db = open(context); Cursor rows = db.rawQuery(READ_POINTS, null)) {
                while (rows.moveToNext()) result.put(new JSONObject(rows.getString(0)));
            }
            return result;
        }
    }
    static boolean acknowledge(Context context, long throughTime) {
        if (throughTime <= 0L) return false;
        synchronized (RouteTrackingService.ROUTE_POINTS_LOCK) {
            try (SQLiteDatabase db = open(context)) {
                db.delete("route_points", ACK_POINTS, new String[]{Long.toString(throughTime)});
                return true;
            } catch (RuntimeException error) { return false; }
        }
    }
    private RoutePointStore() { }
}

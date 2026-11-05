const IDB_NAME = "giloa-photos"; const IDB_VERSION = 2; const IDB_STORE = "images"; const IDB_GPS_STORE = "gps-points"; let idb = null;
var photoStoragePersistenceRequested = false;
function openIdb() {
    // The database is opened WITHOUT a fixed version first. A database created by a
    // newer build used to fail with VersionError, which silently wiped every photo
    // thumbnail and every photo marker while localStorage still held the records.
    return new Promise(function(resolve, reject) {
        if (idb) { resolve(idb); return; }
        function upgradeStores(db) {
            if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE, { keyPath: "id" });
            if (!db.objectStoreNames.contains(IDB_GPS_STORE)) {
                var gpsStore = db.createObjectStore(IDB_GPS_STORE, { keyPath: "id" });
                gpsStore.createIndex("timestamp", "timestamp", { unique:false });
            }
        }
        function adopt(db) {
            idb = db;
            idb.onversionchange = function() { try { idb.close(); } catch (_) {} idb = null; };
            resolve(idb);
        }
        var probe;
        try { probe = indexedDB.open(IDB_NAME); }
        catch (error) { reject(error); return; }
        probe.onupgradeneeded = function(e) { upgradeStores(e.target.result); };
        probe.onerror = function(e) { reject(e.target.error); };
        probe.onblocked = function() { reject(new Error("Local storage is blocked")); };
        probe.onsuccess = function(e) {
            var db = e.target.result;
            if (db.objectStoreNames.contains(IDB_STORE) && db.objectStoreNames.contains(IDB_GPS_STORE)) { adopt(db); return; }
            var nextVersion = Math.max(IDB_VERSION, (db.version || 1) + 1);
            try { db.close(); } catch (_) {}
            var upgradeRequest = indexedDB.open(IDB_NAME, nextVersion);
            upgradeRequest.onupgradeneeded = function(ev) { upgradeStores(ev.target.result); };
            upgradeRequest.onsuccess = function(ev) { adopt(ev.target.result); };
            upgradeRequest.onerror = function(ev) { reject(ev.target.error); };
            upgradeRequest.onblocked = function() { reject(new Error("Local storage is blocked")); };
        };
    });
}
function idbSaveGpsPoint(point) { if (!point) return Promise.resolve(); var row = Object.assign({}, point, { id:String(point.id || (point.timestamp + ":" + point.lat.toFixed(7) + ":" + point.lng.toFixed(7))) }); return openIdb().then(function(db) { return new Promise(function(resolve, reject) { var tx = db.transaction(IDB_GPS_STORE, "readwrite"); tx.objectStore(IDB_GPS_STORE).put(row); tx.oncomplete = resolve; tx.onerror = function(e) { reject(tx.error || e.target.error); }; }); }); }
function idbGetAllGpsPoints() { return openIdb().then(function(db) { return new Promise(function(resolve, reject) { var req = db.transaction(IDB_GPS_STORE, "readonly").objectStore(IDB_GPS_STORE).getAll(); req.onsuccess = function(e) { resolve(e.target.result || []); }; req.onerror = function(e) { reject(e.target.error); }; }); }); }
function requestPhotoStoragePersistence() {
    if (photoStoragePersistenceRequested) return;
    photoStoragePersistenceRequested = true;
    try {
        if (navigator.storage && typeof navigator.storage.persist === "function") navigator.storage.persist().catch(function() {});
    } catch (_) {}
}
function writePhotoRow(row) { return openIdb().then(function(db) { return new Promise(function(resolve, reject) { var tx = db.transaction(IDB_STORE, "readwrite"); tx.objectStore(IDB_STORE).put(row); tx.oncomplete = function() { resolve(row); }; tx.onerror = function(e) { reject(tx.error || e.target.error); }; tx.onabort = function(e) { reject(tx.error || e.target.error); }; }); }); }
function idbSavePhoto(id, photo, thumb, originalBlob, originalMimeType) {
    requestPhotoStoragePersistence();
    var safeOriginal = originalBlob && typeof originalBlob.size === "number" && originalBlob.size <= PHOTO_ORIGINAL_MAX_BYTES ? originalBlob : null;
    var row = { id: id, photo: photo || "", thumb: thumb || "", originalBlob: safeOriginal, originalMimeType: originalMimeType || (safeOriginal && safeOriginal.type) || "image/jpeg" };
    return writePhotoRow(row).catch(function(error) {
        if (!safeOriginal) throw error;
        console.warn("Original photo storage failed; keeping high-resolution preview", error && error.name);
        row.originalBlob = null;
        return writePhotoRow(row);
    });
}
function idbGetPhoto(id) { return openIdb().then(function(db) { return new Promise(function(resolve, reject) { var req = db.transaction(IDB_STORE, "readonly").objectStore(IDB_STORE).get(id); req.onsuccess = function(e) { resolve(e.target.result || null); }; req.onerror = function(e) { reject(e.target.error); }; }); }); }
function idbDeletePhoto(id) { return openIdb().then(function(db) { return new Promise(function(resolve, reject) { var tx = db.transaction(IDB_STORE, "readwrite"); tx.objectStore(IDB_STORE).delete(id); tx.oncomplete = resolve; tx.onerror = function(e) { reject(e.target.error); }; }); }); }
function idbGetAllPhotos() { return openIdb().then(function(db) { return new Promise(function(resolve, reject) { var req = db.transaction(IDB_STORE, "readonly").objectStore(IDB_STORE).getAll(); req.onsuccess = function(e) { resolve(e.target.result || []); }; req.onerror = function(e) { reject(e.target.error); }; }); }); }
async function recoverOrphanedPhotoRows() {
    var rows = await idbGetAllPhotos().catch(function(error) { console.warn("Orphaned photo scan failed", error); return []; });
    if (!Array.isArray(rows) || rows.length === 0) return 0;
    var known = new Set((photos || []).map(function(photo) { return String(photo && photo.id || ""); }));
    var deleted = new Set((deletedJourneyRecords && deletedJourneyRecords.photos || []).map(String));
    var recovered = 0;
    rows.forEach(function(row) {
        var id = String(row && row.id || "");
        if (!id || known.has(id) || deleted.has(id) || !(row.photo || row.thumb || (row.originalBlob && row.originalBlob.size))) return;
        var match = id.match(/^(\d{13})/);
        var timestamp = match ? Number(match[1]) : Date.now();
        if (!isFinite(timestamp) || timestamp < 946684800000 || timestamp > Date.now() + 86400000) timestamp = Date.now();
        var taken = new Date(timestamp);
        photos.push({
            id:id, lat:null, lng:null, photo:row.photo || row.thumb || "", thumb:row.thumb || row.photo || "", time:timestamp,
            dateString:taken.toLocaleDateString("ko-KR", { year:"numeric", month:"long", day:"numeric" }),
            timeString:taken.toLocaleTimeString("ko-KR", { hour:"2-digit", minute:"2-digit" }),
            memo:"", emotion:"", missionId:"", placeId:"", sourceUri:"", sourceWebPath:"", sourceType:"recovered",
            locationSource:"unknown", locationAccuracy:null, remotePhotoUrl:"", remoteThumbUrl:"", storagePath:"", thumbStoragePath:"",
            imagePrediction:null, heading:null, contentFingerprint:getPhotoContentFingerprint(row.thumb || row.photo || "")
        });
        known.add(id);
        recovered += 1;
    });
    if (recovered > 0) {
        safeStorageSet(PHOTO_LOCATION_MIGRATION_KEY, "");
        console.warn("[GILOA PHOTO] recovered orphaned photos: " + recovered);
    }
    return recovered;
}
function migratePhotosToThumbOnly() {
    if (PHOTO_STORE_PREVIEW) return Promise.resolve();
    return idbGetAllPhotos().then(function(list) {
        var tasks = [];
        list.forEach(function(row) {
            if (!row || !row.id || !row.thumb) return;
            if (row.photo && row.photo !== row.thumb) tasks.push(idbSavePhoto(row.id, "", row.thumb, row.originalBlob || null, row.originalMimeType || ""));
        });
        if (tasks.length === 0) return;
        return Promise.all(tasks);
    }).catch(function(e) { console.warn("사진 경량화 실패", e); });
}

// ???占쏀깭 蹂??

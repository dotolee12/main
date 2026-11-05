function getPhotoContentFingerprint(dataUrl) {
    var value = String(dataUrl || "");
    var hash = 2166136261;
    for (var i = 0; i < value.length; i += 1) {
        hash ^= value.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return "thumb-v1:" + value.length + ":" + (hash >>> 0).toString(16);
}
function parseExifRational(value) {
    if (typeof value === "number") return isFinite(value) ? value : null;
    if (Array.isArray(value) && value.length >= 2) {
        var arrayDenominator = Number(value[1]);
        return isFinite(Number(value[0])) && isFinite(arrayDenominator) && arrayDenominator !== 0 ? Number(value[0]) / arrayDenominator : null;
    }
    if (value && typeof value === "object") {
        if (isFinite(value.numerator) && isFinite(value.denominator) && Number(value.denominator) !== 0) return Number(value.numerator) / Number(value.denominator);
        if (isFinite(value.num) && isFinite(value.den) && Number(value.den) !== 0) return Number(value.num) / Number(value.den);
    }
    var parsed = parseFloat(value);
    return isFinite(parsed) ? parsed : null;
}
function parseExifCoord(value, ref, axis) {
    if (value === null || value === undefined) return null;
    var result = null;
    if (typeof value === "number") result = value;
    else if (Array.isArray(value) && value.length >= 3) {
        var degrees = parseExifRational(value[0]);
        var minutes = parseExifRational(value[1]);
        var seconds = parseExifRational(value[2]);
        if (![degrees, minutes, seconds].every(function(part) { return part !== null && isFinite(part); })) return null;
        if (degrees < 0 || minutes < 0 || minutes >= 60 || seconds < 0 || seconds >= 60) return null;
        result = degrees + minutes / 60 + seconds / 3600;
    } else if (typeof value === "string" && isFinite(parseFloat(value))) result = parseFloat(value);
    if (!isFinite(result)) return null;
    ref = String(ref || "").trim().toUpperCase();
    if (ref && ((axis === "lat" && ref !== "N" && ref !== "S") || (axis === "lng" && ref !== "E" && ref !== "W"))) return null;
    return ref === "S" || ref === "W" ? -Math.abs(result) : result;
}
function gpsFromExifObject(exif) {
    if (!exif || typeof exif !== "object") return null;
    var directLat = exif.latitude;
    var directLng = exif.longitude;
    if (isValidPhotoCoordinate(directLat, directLng)) return { lat: Number(directLat), lng: Number(directLng) };
    var lat = parseExifCoord(exif.GPSLatitude || exif.gpsLatitude, exif.GPSLatitudeRef || exif.gpsLatitudeRef, "lat");
    var lng = parseExifCoord(exif.GPSLongitude || exif.gpsLongitude, exif.GPSLongitudeRef || exif.gpsLongitudeRef, "lng");
    return isValidPhotoCoordinate(lat, lng) ? { lat: lat, lng: lng } : null;
}
var GILOA_EXIF_TRACE = [];
function giloaExifTrace(step, detail) {
    try {
        GILOA_EXIF_TRACE.push("· " + step + (detail === undefined || detail === null ? "" : ": " + detail));
        if (GILOA_EXIF_TRACE.length > 40) GILOA_EXIF_TRACE.shift();
    } catch (_) {}
}
function readGpsRationalTriplet(view, at, littleEndian, type, count) {
    if (type !== 5 && type !== 10) return null;
    var signed = type === 10;
    var parts = [];
    var take = Math.min(3, Math.max(1, count));
    for (var k = 0; k < take; k++) {
        var numerator = signed ? view.getInt32(at + k * 8, littleEndian) : view.getUint32(at + k * 8, littleEndian);
        var denominator = signed ? view.getInt32(at + k * 8 + 4, littleEndian) : view.getUint32(at + k * 8 + 4, littleEndian);
        if (!denominator) return null;
        parts.push(numerator / denominator);
    }
    while (parts.length < 3) parts.push(0);
    if (parts[0] < 0 || parts[1] < 0 || parts[1] >= 60 || parts[2] < 0 || parts[2] >= 60) return null;
    var value = parts[0] + parts[1] / 60 + parts[2] / 3600;
    return isFinite(value) ? value : null;
}
function findExifTiffBase(view, searchFrom) {
    var resumeAt = Math.max(0, Number(searchFrom) || 0);
    // 1) 정상적인 JPEG 세그먼트 순회
    if (!resumeAt && view.byteLength > 4 && view.getUint16(0, false) === 0xFFD8) {
        var offset = 2;
        while (offset + 4 <= view.byteLength) {
            if (view.getUint8(offset) !== 0xFF) { offset += 1; continue; }
            var marker = view.getUint8(offset + 1);
            if (marker === 0xDA || marker === 0xD9) break;
            if (marker === 0xFF) { offset += 1; continue; }
            if (marker === 0x01 || marker === 0xD8 || (marker >= 0xD0 && marker <= 0xD7)) { offset += 2; continue; }
            if (offset + 4 > view.byteLength) break;
            var segmentLength = view.getUint16(offset + 2, false);
            if (segmentLength < 2) break;
            var segmentEnd = offset + 2 + segmentLength;
            if (marker === 0xE1 && segmentLength >= 8 &&
                view.getUint8(offset + 4) === 0x45 && view.getUint8(offset + 5) === 0x78 &&
                view.getUint8(offset + 6) === 0x69 && view.getUint8(offset + 7) === 0x66 &&
                view.getUint8(offset + 8) === 0) {
                return { tiffBase: offset + 10, limit: Math.min(segmentEnd, view.byteLength), how: "segment" };
            }
            if (segmentEnd > view.byteLength) break;
            offset = segmentEnd;
        }
    }
    // 2) 세그먼트가 깨졌거나 JPEG이 아닐 때: "Exif\0\0" 시그니처 직접 탐색
    // HEIC/HEIF는 EXIF 블록이 파일 앞 1MB 밖(수 MB 지점)에 놓이는 경우가 많으므로
    // 버퍼 전체를 훑는다. 예전 1MB 제한은 HEIC 사진의 GPS 유실 원인이었다.
    var scanBytes = null;
    try { scanBytes = new Uint8Array(view.buffer, view.byteOffset, view.byteLength); } catch (_) { scanBytes = null; }
    var byteAt = scanBytes ? function(a) { return scanBytes[a]; } : function(a) { return view.getUint8(a); };
    var scanEnd = view.byteLength - 8;
    for (var p = resumeAt; p < scanEnd; p++) {
        if (byteAt(p) !== 0x45) continue;
        if (byteAt(p + 1) !== 0x78 || byteAt(p + 2) !== 0x69 || byteAt(p + 3) !== 0x66) continue;
        if (byteAt(p + 4) !== 0 || byteAt(p + 5) !== 0) continue;
        var candidate = p + 6;
        var order = view.getUint16(candidate, false);
        if (order === 0x4949 || order === 0x4D4D) {
            return { tiffBase: candidate, limit: view.byteLength, how: "scan", nextSearchFrom: p + 1 };
        }
    }
    return null;
}
var GPS_TAG_NAMES = { 0:"VersionID", 1:"LatitudeRef", 2:"Latitude", 3:"LongitudeRef", 4:"Longitude", 5:"AltitudeRef", 6:"Altitude", 7:"TimeStamp", 8:"Satellites", 9:"Status", 16:"ImgDirectionRef", 17:"ImgDirection", 27:"ProcessingMethod", 29:"DateStamp" };
// Dumps the bytes actually sitting behind a GPS tag. Android's MediaStore keeps
// the tag structure intact and zeroes only the values, so an all-zero dump is
// proof of redaction rather than a parser bug.
function formatGpsTagValue(view, dataOffset, type, count, littleEndian, limit) {
    try {
        var parts = [];
        var i;
        if (type === 5 || type === 10) {
            var pairs = Math.min(count, 3);
            for (i = 0; i < pairs; i++) {
                var at = dataOffset + i * 8;
                if (at + 8 > limit) { parts.push("범위밖"); break; }
                var num = type === 10 ? view.getInt32(at, littleEndian) : view.getUint32(at, littleEndian);
                var den = type === 10 ? view.getInt32(at + 4, littleEndian) : view.getUint32(at + 4, littleEndian);
                parts.push(num + "/" + den);
            }
            return parts.join(", ");
        }
        if (type === 2) {
            var text = "";
            for (i = 0; i < Math.min(count, 12); i++) {
                if (dataOffset + i >= limit) break;
                var code = view.getUint8(dataOffset + i);
                if (!code) break;
                text += String.fromCharCode(code);
            }
            return '"' + text + '"';
        }
        for (i = 0; i < Math.min(count, 8); i++) {
            if (dataOffset + i >= limit) break;
            parts.push(view.getUint8(dataOffset + i).toString(16).padStart(2, "0"));
        }
        return parts.join(" ");
    } catch (_) { return "읽기 실패"; }
}
// Inspects ONE EXIF candidate starting at searchFrom. Kept separate so the
// caller can walk past a block that turned out to carry no coordinates.
function inspectExifBufferAt(buffer, searchFrom) {
    var out = { hasExif: false, hasGpsIfd: false, gpsTagCount: 0, endian: "", lat: null, lng: null, reason: "", gpsTags: [], gpsAllZero: false, nextSearchFrom: 0 };
    try {
        if (!buffer || buffer.byteLength < 16) { out.reason = "too-small"; return out; }
        var view = new DataView(buffer);
        var found = findExifTiffBase(view, searchFrom);
        if (!found) { out.reason = "no-exif"; return out; }
        out.hasExif = true;
        out.nextSearchFrom = found.nextSearchFrom || 0;
        var tiffBase = found.tiffBase;
        var limit = found.limit;
        var byteOrder = view.getUint16(tiffBase, false);
        var littleEndian = byteOrder === 0x4949;
        if (!littleEndian && byteOrder !== 0x4D4D) { out.reason = "bad-byte-order"; return out; }
        out.endian = littleEndian ? "II" : "MM";
        var read16 = function(a) { if (a < tiffBase || a + 2 > limit) throw new RangeError("EXIF bounds"); return view.getUint16(a, littleEndian); };
        var read32 = function(a) { if (a < tiffBase || a + 4 > limit) throw new RangeError("EXIF bounds"); return view.getUint32(a, littleEndian); };
        if (read16(tiffBase + 2) !== 42) { out.reason = "bad-magic"; return out; }
        var ifd0 = tiffBase + read32(tiffBase + 4);
        var ifd0Count = read16(ifd0);
        var gpsPointer = null;
        for (var i = 0; i < ifd0Count && i < 256; i++) {
            var entry = ifd0 + 2 + i * 12;
            if (entry + 12 > limit) break;
            if (read16(entry) === 0x8825) { gpsPointer = read32(entry + 8); break; }
        }
        if (gpsPointer === null || gpsPointer <= 0) { out.reason = "no-gps-tag"; return out; }
        var gpsIfd = tiffBase + gpsPointer;
        var gpsCount = read16(gpsIfd);
        if (!gpsCount || gpsCount > 128) { out.reason = "gps-ifd-empty"; return out; }
        out.hasGpsIfd = true;
        out.gpsTagCount = gpsCount;
        var latRef = "", lngRef = "", lat = null, lng = null;
        for (var j = 0; j < gpsCount; j++) {
            var gpsEntry = gpsIfd + 2 + j * 12;
            if (gpsEntry + 12 > limit) break;
            var tag = read16(gpsEntry);
            var type = read16(gpsEntry + 2);
            var count = read32(gpsEntry + 4);
            var typeSize = (type === 1 || type === 2 || type === 6 || type === 7) ? 1
                : (type === 3 || type === 8) ? 2
                : (type === 4 || type === 9 || type === 11) ? 4
                : (type === 5 || type === 10 || type === 12) ? 8 : 0;
            if (!typeSize || !count || count > 256) { out.gpsTags.push({ tag: tag, type: type, count: count, raw: "타입/개수 이상" }); continue; }
            var totalBytes = typeSize * count;
            var dataOffset = totalBytes <= 4 ? gpsEntry + 8 : tiffBase + read32(gpsEntry + 8);
            var needed = Math.min(totalBytes, 24);
            if (dataOffset < tiffBase || dataOffset + needed > limit) { out.gpsTags.push({ tag: tag, type: type, count: count, raw: "값 위치가 버퍼 밖" }); continue; }
            out.gpsTags.push({ tag: tag, type: type, count: count, raw: formatGpsTagValue(view, dataOffset, type, count, littleEndian, limit) });
            if (tag === 1) latRef = String.fromCharCode(view.getUint8(dataOffset)).toUpperCase();
            else if (tag === 3) lngRef = String.fromCharCode(view.getUint8(dataOffset)).toUpperCase();
            else if (tag === 2 || tag === 4) {
                var value = readGpsRationalTriplet(view, dataOffset, littleEndian, type, count);
                if (value === null) continue;
                if (tag === 2) lat = value; else lng = value;
            }
        }
        var coordTags = out.gpsTags.filter(function(entry) { return entry.tag === 2 || entry.tag === 4; });
        out.gpsAllZero = coordTags.length > 0 && coordTags.every(function(entry) {
            return typeof entry.raw === "string" && /^[0\s,\/]+$/.test(entry.raw);
        });
        if (lat === null || lng === null) { out.reason = out.gpsAllZero ? "gps-zeroed" : "no-coordinates"; return out; }
        if ((latRef && latRef !== "N" && latRef !== "S") || (lngRef && lngRef !== "E" && lngRef !== "W")) { out.reason = "no-coordinates"; return out; }
        if (latRef === "S") lat = -Math.abs(lat);
        if (lngRef === "W") lng = -Math.abs(lng);
        if (!isValidPhotoCoordinate(lat, lng)) { out.reason = "no-coordinates"; return out; }
        out.lat = Number(lat);
        out.lng = Number(lng);
        out.reason = "ok";
        return out;
    } catch (e) {
        out.reason = "parser-error";
        return out;
    }
}
function parseExifGps(buffer) {
    var info = inspectExifBuffer(buffer);
    return info && isValidPhotoCoordinate(info.lat, info.lng) ? { lat: Number(info.lat), lng: Number(info.lng) } : null;
}
async function getPhotoArrayBuffer(photoOrFile) {
    var isBlob = typeof Blob !== "undefined" && photoOrFile instanceof Blob;
    if (isBlob) {
        if (typeof photoOrFile.arrayBuffer === "function") return photoOrFile.arrayBuffer();
        return readFileAsArrayBuffer(photoOrFile);
    }
    var url = photoOrFile && (photoOrFile.webPath || photoOrFile.path || photoOrFile.uri);
    if (!url) return null;
    var response = await fetch(url);
    if (!response || !response.ok) return null;
    return response.arrayBuffer();
}
async function getPhotoExifDate(photoOrFile) {
    var objectDate = getPhotoTakenDate(photoOrFile, null);
    var exifrInput = photoOrFile;
    var isBlob = typeof Blob !== "undefined" && photoOrFile instanceof Blob;
    if (!isBlob && photoOrFile && (photoOrFile.webPath || photoOrFile.path || photoOrFile.uri)) {
        exifrInput = photoOrFile.webPath || photoOrFile.path || photoOrFile.uri;
    }
    if (window.exifr && typeof window.exifr.parse === "function" && exifrInput) {
        try {
            var metadata = await promiseWithTimeout(window.exifr.parse(exifrInput, ["DateTimeOriginal", "CreateDate", "ModifyDate", "DateTimeDigitized"]), 8000, "EXIF date read");
            var parsedDate = metadata && (
                parsePhotoDateValue(metadata.DateTimeOriginal) ||
                parsePhotoDateValue(metadata.CreateDate) ||
                parsePhotoDateValue(metadata.ModifyDate) ||
                parsePhotoDateValue(metadata.DateTimeDigitized)
            );
            if (parsedDate) return parsedDate;
        } catch (error) {
            console.warn("exifr date parse failed", error && error.message);
        }
    }
    return objectDate;
}
function isHeicLikeBlob(blob) {
    if (!blob) return false;
    var type = String(blob.type || "").toLowerCase();
    if (type.indexOf("heic") >= 0 || type.indexOf("heif") >= 0) return true;
    return /\.(heic|heif)$/i.test(String(blob.name || ""));
}
async function getPhotoHeaderBuffer(photoOrFile, maxBytes) {
    var isBlob = typeof Blob !== "undefined" && photoOrFile instanceof Blob;
    if (isBlob) {
        // HEIC/HEIF는 EXIF가 파일 뒤쪽에 위치해 앞 1MB만 읽으면 GPS를 놓친다.
        if (!maxBytes) maxBytes = isHeicLikeBlob(photoOrFile) ? Infinity : 1048576;
        var part = photoOrFile;
        if (photoOrFile.size > maxBytes && typeof photoOrFile.slice === "function") part = photoOrFile.slice(0, maxBytes);
        if (typeof part.arrayBuffer === "function") return part.arrayBuffer();
        return readFileAsArrayBuffer(part);
    }
    return getPhotoArrayBuffer(photoOrFile);
}
async function getPhotoExifGps(photoOrFile) {
    GILOA_EXIF_TRACE = [];
    window.__giloaLastExifReason = "";
    var fromObject = gpsFromExifObject(photoOrFile && photoOrFile.exif);
    if (fromObject) {
        giloaExifTrace("객체 exif", "성공");
        window.__giloaLastExifReason = "ok";
        return fromObject;
    }
    var exifrInput = photoOrFile;
    var isBlob = typeof Blob !== "undefined" && photoOrFile instanceof Blob;
    if (!isBlob && photoOrFile && (photoOrFile.webPath || photoOrFile.path || photoOrFile.uri)) {
        exifrInput = photoOrFile.webPath || photoOrFile.path || photoOrFile.uri;
    }
    giloaExifTrace("입력", isBlob
        ? "Blob " + Math.round((photoOrFile.size || 0) / 1024) + "KB " + (photoOrFile.type || "type?")
        : String(exifrInput || "없음").slice(0, 70));

    if (window.exifr && typeof window.exifr.gps === "function" && exifrInput) {
        try {
            var exifrGps = await promiseWithTimeout(window.exifr.gps(exifrInput), 8000, "EXIF GPS read");
            if (exifrGps && isValidPhotoCoordinate(exifrGps.latitude, exifrGps.longitude)) {
                giloaExifTrace("exifr", "성공");
                window.__giloaLastExifReason = "ok";
                return { lat: Number(exifrGps.latitude), lng: Number(exifrGps.longitude) };
            }
            giloaExifTrace("exifr", "좌표 없음");
        } catch (error) {
            giloaExifTrace("exifr 오류", error && error.message);
        }
    } else {
        giloaExifTrace("exifr", "미로드");
    }

    try {
        var buffer = await getPhotoHeaderBuffer(photoOrFile);
        if (!buffer) {
            giloaExifTrace("바이트 읽기", "실패");
            window.__giloaLastExifReason = "read-failed";
            return null;
        }
        giloaExifTrace("바이트", Math.round(buffer.byteLength / 1024) + "KB 확보");
        var info = inspectExifBuffer(buffer);
        // 앞부분만 읽어 좌표를 얻지 못했고 원본이 더 크면 전체를 다시 읽어 재시도한다.
        // HEIC는 앞쪽에 EXIF 블록이 보여도 GPS는 파일 뒤에 있는 경우가 많아,
        // hasExif만으로 재시도를 건너뛰면 좌표를 통째로 놓친다.
        var truncatedRead = isBlob && photoOrFile.size > buffer.byteLength;
        if (truncatedRead && (!info || !isValidPhotoCoordinate(info.lat, info.lng))) {
            giloaExifTrace("전체 재시도", Math.round(photoOrFile.size / 1024) + "KB");
            var fullBuffer = await getPhotoHeaderBuffer(photoOrFile, Infinity).catch(function() { return null; });
            if (fullBuffer && fullBuffer.byteLength > buffer.byteLength) {
                buffer = fullBuffer;
                info = inspectExifBuffer(buffer);
                giloaExifTrace("전체 재시도 결과", describeExifReason(info));
            }
        }
        window.__giloaLastExifReason = info.reason;
        giloaExifTrace("자체 파서", describeExifReason(info));
        if (isValidPhotoCoordinate(info.lat, info.lng)) {
            return { lat: Number(info.lat), lng: Number(info.lng) };
        }
    } catch (e) {
        giloaExifTrace("자체 파서 오류", e && e.message);
        window.__giloaLastExifReason = "parser-error";
    }
    return null;
}
// A HEIC can hold a thumbnail EXIF block ahead of the real one. Stopping at the
// first block found made the GPS look missing when it was simply further in.
function inspectExifBuffer(buffer) {
    var best = null;
    var searchFrom = 0;
    for (var attempt = 0; attempt < 6; attempt += 1) {
        var info = inspectExifBufferAt(buffer, searchFrom);
        if (!best || (!best.hasExif && info.hasExif) || (!best.hasGpsIfd && info.hasGpsIfd)) best = info;
        if (info && isValidPhotoCoordinate(info.lat, info.lng)) return info;
        if (!info || !info.hasExif || !info.nextSearchFrom) break;
        searchFrom = info.nextSearchFrom;
    }
    return best || inspectExifBufferAt(buffer, 0);
}
function describeExifReason(info) {
    if (!info) return earlyUiText("unknown");
    switch (info.reason) {
        case "ok": return earlyUiText("exifOk", { endian:info.endian });
        case "too-small": return earlyUiText("exifSmall");
        case "no-exif": return earlyUiText("exifAbsent");
        case "bad-byte-order": return earlyUiText("exifHeader");
        case "bad-magic": return earlyUiText("tiffHeader");
        case "no-gps-tag": return earlyUiText("gpsPointerAbsent");
        case "gps-ifd-empty": return earlyUiText("gpsEmpty");
        case "no-coordinates": return earlyUiText("gpsCoordinatesAbsent");
        case "gps-zeroed": return earlyUiText("gpsZeroed");
        default: return String(info.reason || earlyUiText("unknown"));
    }
}
function showGiloaDiagnosticReport(text, title) {
    var wrap = document.getElementById("giloa-diagnostic-overlay");
    if (!wrap) {
        wrap = document.createElement("div");
        wrap.id = "giloa-diagnostic-overlay";
        wrap.style.cssText = "position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;background:rgba(4,8,18,0.82);padding:18px;";
        var card = document.createElement("div");
        card.style.cssText = "width:100%;max-width:420px;max-height:80vh;display:flex;flex-direction:column;background:#141b30;border:1px solid rgba(77,184,255,0.45);border-radius:14px;overflow:hidden;box-shadow:0 18px 48px rgba(0,0,0,0.55);";
        var head = document.createElement("div");
        head.id = "giloa-diagnostic-title";
        head.style.cssText = "padding:12px 14px;font-size:13px;font-weight:800;color:#8edfff;border-bottom:1px solid rgba(255,255,255,0.08);";
        var body = document.createElement("pre");
        body.id = "giloa-diagnostic-body";
        body.style.cssText = "margin:0;padding:14px;flex:1;overflow:auto;white-space:pre-wrap;word-break:break-word;font-size:12px;line-height:1.55;color:#e8f2ff;font-family:ui-monospace,Menlo,Consolas,monospace;-webkit-user-select:text;user-select:text;";
        var foot = document.createElement("div");
        foot.style.cssText = "display:flex;gap:8px;padding:10px 12px;border-top:1px solid rgba(255,255,255,0.08);";
        var copyBtn = document.createElement("button");
        copyBtn.type = "button";
        copyBtn.textContent = earlyUiText("copy");
        copyBtn.style.cssText = "flex:1;padding:10px;border-radius:9px;border:1px solid rgba(77,184,255,0.5);background:rgba(77,184,255,0.14);color:#8edfff;font-size:13px;font-weight:700;";
        copyBtn.addEventListener("click", function() {
            var value = document.getElementById("giloa-diagnostic-body").textContent;
            var done = function() { copyBtn.textContent = earlyUiText("copied"); setTimeout(function() { copyBtn.textContent = earlyUiText("copy"); }, 1500); };
            if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(value).then(done).catch(function() {});
            else {
                var temp = document.createElement("textarea");
                temp.value = value;
                document.body.appendChild(temp);
                temp.select();
                try { document.execCommand("copy"); done(); } catch (_) {}
                document.body.removeChild(temp);
            }
        });
        var closeBtn = document.createElement("button");
        closeBtn.type = "button";
        closeBtn.textContent = earlyUiText("close");
        closeBtn.style.cssText = "flex:1;padding:10px;border-radius:9px;border:1px solid rgba(255,255,255,0.16);background:rgba(255,255,255,0.06);color:#e8f2ff;font-size:13px;font-weight:700;";
        closeBtn.addEventListener("click", function() { wrap.style.display = "none"; });
        foot.appendChild(copyBtn);
        foot.appendChild(closeBtn);
        card.appendChild(head);
        card.appendChild(body);
        card.appendChild(foot);
        wrap.appendChild(card);
        wrap.addEventListener("click", function(e) { if (e.target === wrap) wrap.style.display = "none"; });
        document.body.appendChild(wrap);
    }
    wrap.dataset.titleKey = ["diagnostic", "regionDiagnostic", "photoDiagnostic", "photoExifDiagnostic", "storageDiagnostic"].find(function(key) { return EARLY_UI_I18N[key].indexOf(title || earlyUiText("diagnostic")) >= 0; }) || "";
    document.getElementById("giloa-diagnostic-title").textContent = title || earlyUiText("diagnostic");
    document.getElementById("giloa-diagnostic-body").textContent = String(text || "");
    wrap.style.display = "flex";
    console.info(text);
    return text;
}
function describeGiloaPhotoBridge() {
    var bridge = window.GiloaPhotoBridge;
    if (!bridge) return { present: false, methods: [], summary: earlyUiText("bridgeAbsent") };
    var wanted = ["pickPhotos", "consumeSelectedUris", "copyPhotoToCache", "getPhotoData", "hasPhotoLocationPermission", "requestPhotoLocationPermission"];
    var picker = "";
    try { if (typeof bridge.lastPicker === "function") picker = bridge.lastPicker() || ""; } catch (_) { }
    var have = wanted.filter(function(name) { return typeof bridge[name] === "function"; });
    var missing = wanted.filter(function(name) { return have.indexOf(name) < 0; });
    var permission = earlyUiText("unknown");
    try {
        if (typeof bridge.hasPhotoLocationPermission === "function") permission = earlyUiText(bridge.hasPhotoLocationPermission() ? "allowed" : "denied");
    } catch (_) { permission = earlyUiText("callFailed"); }
    return {
        present: true,
        methods: have,
        missing: missing,
        permission: permission,
        picker: picker,
        summary: earlyUiText("present") + " · " + earlyUiText("methods") + " " + have.length + "/" + wanted.length + (missing.length ? " · " + earlyUiText("missing") + ": " + missing.join(", ") : "")
    };
}
var giloaExifDiagnosticPending = false;
// The hidden file input always routes through the system photo picker, which
// redacts location no matter what. Once the native bridge exists the diagnostic
// must read through it, otherwise it can never show the fix working.
function giloaRunExifDiagnostic() {
    if (hasNativePhotoPicker()) {
        giloaExifDiagnosticPending = true;
        try { window.GiloaPhotoBridge.pickPhotos(); return; }
        catch (error) {
            giloaExifDiagnosticPending = false;
            console.warn("네이티브 진단 선택 실패", error);
        }
    }
    var input = document.getElementById("exif-diagnose-input");
    if (input) input.click();
}
async function giloaDiagnoseNativeUri(uri) {
    var blob = await getOriginalPhotoBlob(uri, null).catch(function() { return null; });
    if (!blob || !blob.size) {
        var failLines = [earlyUiText("originalReadFailed"), ""];
        var info = describeGiloaPhotoBridge();
        failLines.push(earlyUiText("nativeBridge") + ": " + info.summary);
        if (info.present) failLines.push(earlyUiText("photoPermission") + ": " + info.permission);
        failLines.push("URI: " + describeNativePhotoUri(uri));
        failLines.push("");
        failLines.push("--- " + earlyUiText("readAttempts") + " ---");
        failLines = failLines.concat(GILOA_NATIVE_READ_TRACE.length ? GILOA_NATIVE_READ_TRACE.map(earlyDiagnosticTraceLine) : [earlyUiText("noRecords")]);
        showGiloaDiagnosticReport(failLines.join("\n"), earlyUiText("photoExifDiagnostic"));
        return;
    }
    var diagMime = resolveNativePhotoMime(uri, blob);
    await giloaDiagnosePhotoExif(blobAsNamedFile(blob, nativeUriToFileName(uri, diagMime), diagMime), { via: earlyUiText("nativeBridge"), uri: uri });
}
var giloaDiagnosticTaps = 0;
var giloaDiagnosticTapTimer = null;
window.giloaShowExifDiagnostic = function() { giloaRunExifDiagnostic(); };
function giloaTapDiagnostic() {
    giloaDiagnosticTaps += 1;
    clearTimeout(giloaDiagnosticTapTimer);
    giloaDiagnosticTapTimer = setTimeout(function() { giloaDiagnosticTaps = 0; }, 2500);
    if (giloaDiagnosticTaps < 5) return;
    giloaDiagnosticTaps = 0;
    var item = document.getElementById("photo-diagnose-item");
    if (!item) return;
    item.style.display = item.style.display === "none" ? "" : "none";
}
async function giloaDiagnosePhotoExifEvent(event) {
    var file = event && event.target && event.target.files && event.target.files[0];
    if (event && event.target) event.target.value = "";
    if (!file) return;
    await giloaDiagnosePhotoExif(file);
}
async function giloaDiagnosePhotoExif(file, context) {
    context = context || {};
    var lines = [];
    var bridgeInfo = describeGiloaPhotoBridge();
    lines.push(earlyUiText("readRoute") + ": " + (context.via || earlyUiText("systemPicker")));
    lines.push(earlyUiText("nativeBridge") + ": " + bridgeInfo.summary);
    if (bridgeInfo.present) lines.push(earlyUiText("photoPermission") + ": " + bridgeInfo.permission);
    if (bridgeInfo.picker) lines.push(earlyUiText("pickerUsed") + ": " + bridgeInfo.picker);
    lines.push("");
    lines.push(earlyUiText("file") + ": " + (file.name || earlyUiText("unnamed")));
    lines.push(earlyUiText("format") + ": " + (file.type || earlyUiText("unknown")) + " / " + Math.round((file.size || 0) / 1024) + "KB");
    lines.push("");
    var info = null;
    try {
        var buffer = await getPhotoHeaderBuffer(file, Infinity);
        info = buffer ? inspectExifBuffer(buffer) : null;
    } catch (e) {
        lines.push(earlyUiText("byteReadFailed") + ": " + (e && e.message));
    }
    if (info) {
        lines.push(earlyUiText("exifBlock") + ": " + (info.hasExif ? earlyUiText("present") + " (" + info.endian + ")" : earlyUiText("none")));
        lines.push(earlyUiText("gpsBlock") + ": " + (info.hasGpsIfd ? earlyUiText("gpsTagCount", { count:info.gpsTagCount }) : earlyUiText("none")));
        lines.push(earlyUiText("verdict") + ": " + describeExifReason(info));
        if (info.gpsTags && info.gpsTags.length) {
            lines.push("");
            lines.push("--- " + earlyUiText("rawGpsTags") + " ---");
            info.gpsTags.forEach(function(entry) {
                var name = GPS_TAG_NAMES[entry.tag] || ("tag" + entry.tag);
                lines.push(name + " (type " + entry.type + " x" + entry.count + ") = " + earlyDiagnosticValue(entry.raw));
            });
        }
    }
    var gps = await getPhotoExifGps(file);
    lines.push("");
    lines.push(gps
        ? earlyUiText("finalCoordinates") + ": " + gps.lat.toFixed(6) + ", " + gps.lng.toFixed(6)
        : earlyUiText("finalCoordinates") + ": " + earlyUiText("unknown"));
    lines.push("");
    lines.push("--- " + earlyUiText("processingLog") + " ---");
    lines = lines.concat(GILOA_EXIF_TRACE.map(earlyDiagnosticTraceLine));
    if (info && info.hasExif && (!info.hasGpsIfd || info.gpsAllZero || info.reason === "gps-zeroed")) {
        lines.push("");
        lines.push(earlyUiText("locationRedacted"));
    }
    return showGiloaDiagnosticReport(lines.join("\n"), earlyUiText("photoExifDiagnostic"));
}

function estimateDataUrlBytes(dataUrl) {
    var commaIndex = dataUrl.indexOf(",");
    if (commaIndex < 0) return 0;
    var base64Length = dataUrl.length - commaIndex - 1;
    return Math.ceil(base64Length * 0.75);
}

function resizeImage(img, options) {
    options = options || {};
    var maxSize = options.maxSize || 1024;
    var quality = typeof options.quality === "number" ? options.quality : 0.85;
    var minQuality = typeof options.minQuality === "number" ? options.minQuality : quality;
    var targetBytes = typeof options.targetBytes === "number" ? options.targetBytes : 0;
    var canvas = document.createElement("canvas");
    var w = img.width;
    var h = img.height;
    if (w > h && w > maxSize) {
        h = Math.round(h * maxSize / w);
        w = maxSize;
    } else if (h > maxSize) {
        w = Math.round(w * maxSize / h);
        h = maxSize;
    }
    canvas.width = w;
    canvas.height = h;
    var ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, w, h);
    var dataUrl = canvas.toDataURL("image/jpeg", quality);
    if (targetBytes > 0) {
        var currentQuality = quality;
        while (estimateDataUrlBytes(dataUrl) > targetBytes && currentQuality > minQuality) {
            currentQuality = Math.max(minQuality, currentQuality - 0.06);
            dataUrl = canvas.toDataURL("image/jpeg", currentQuality);
            if (currentQuality === minQuality) break;
        }
    }
    return dataUrl;
}

function isJpegFile(file) { return /image\/jpe?g/i.test(file.type) || /\.(jpe?g)$/i.test(file.name); }
function isHeicFile(file) { return /image\/hei[cf]/i.test(file.type) || /\.(hei[cf])$/i.test(file.name); }

function readFileAsArrayBuffer(file) {
    return new Promise(function(resolve, reject) {
        var reader = new FileReader();
        reader.onload = function(e) { resolve(e.target.result); };
        reader.onerror = function() { reject(reader.error || new Error("파일 읽기 실패")); };
        reader.readAsArrayBuffer(file);
    });
}

function loadImageFromFile(file) {
    return new Promise(function(resolve, reject) {
        var url = URL.createObjectURL(file);
        var img = new Image();
        var timer = setTimeout(function() { URL.revokeObjectURL(url); img.src = ""; reject(new Error("이미지 불러오기 시간 초과")); }, 20000);
        img.onload = function() { clearTimeout(timer); URL.revokeObjectURL(url); resolve(img); };
        img.onerror = function(err) { clearTimeout(timer); URL.revokeObjectURL(url); reject(err || new Error("이미지 불러오기 실패")); };
        img.src = url;
    });
}

function loadImageFromUrl(url) {
    return new Promise(function(resolve, reject) {
        var img = new Image();
        var timer = setTimeout(function() { img.src = ""; reject(new Error("이미지 불러오기 시간 초과")); }, 20000);
        img.onload = function() { clearTimeout(timer); resolve(img); };
        img.onerror = function(err) { clearTimeout(timer); reject(err || new Error("이미지 불러오기 실패")); };
        img.src = url;
    });
}

function ensureHeic2Any() {
    if (typeof window.heic2any === "function") return Promise.resolve(window.heic2any);
    if (heicLoaderPromise) return heicLoaderPromise;
    heicLoaderPromise = new Promise(function(resolve, reject) {
        var script = document.createElement("script");
        script.src = "./vendor/heic2any.min.js";
        script.async = true;
        script.onload = function() {
            if (typeof window.heic2any === "function") resolve(window.heic2any);
            else reject(new Error("heic2any 불러오기 실패"));
        };
        script.onerror = function() { reject(new Error("heic2any 스크립트를 불러오지 못했습니다.")); };
        document.head.appendChild(script);
    }).catch(function(err) {
        heicLoaderPromise = null;
        throw err;
    });
    return heicLoaderPromise;
}

async function convertHeicToJpegFile(file) {
    if (!isHeicFile(file)) return file;
    var heic2any = await ensureHeic2Any();
    var converted = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.95 });
    var blob = Array.isArray(converted) ? converted[0] : converted;
    var name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    if (typeof File === "function") return new File([blob], name, { type: "image/jpeg", lastModified: Date.now() });
    blob.name = name;
    return blob;
}

async function handlePhotos(event) {
    var files = Array.from(event.target.files || []);
    if (!files.length) { clearNativePhotoUris(); return; }
    var loadedCount = 0;
    var failedCount = 0;
    var lastLocatedImportedPhoto = null;
    var sourceType = event.target && event.target.id === "camera-input" ? "camera" : "gallery";
    try {
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            await showPhotoImportProgress(i + 1, files.length);
            try {
                var sourceUri = consumeNativePhotoUri(i);
                var cameraFallbackDate = sourceType === "camera" ? (pendingCameraCaptureDate || new Date()) : null;
                var cameraCaptureLocation = sourceType === "camera" ? pendingCameraCaptureLocation : null;
                var originalBlob = await getOriginalPhotoBlob(sourceUri, null) || file;
                var inspection = await inspectPhotoLocation(originalBlob, sourceType, cameraFallbackDate, cameraCaptureLocation);
                var takenDate = inspection.photoDate || cameraFallbackDate || new Date();
                var location = inspection.location;
                if (GILOA_DEBUG) console.log("[GILOA EXIF DEBUG]", {
                    fileName: file && file.name || "",
                    mimeType: originalBlob && originalBlob.type || file && file.type || "",
                    nativeUri: describeNativePhotoUri(sourceUri),
                    originalBlobSize: originalBlob && originalBlob.size || 0,
                    exifGps: inspection.gps,
                    exifDate: inspection.photoDate,
                    finalLocation: location,
                    locationSource: location && location.source || "unknown"
                });
                var normalizedFile = await convertHeicToJpegFile(file);
                var img = await loadImageFromFile(normalizedFile);
                var importedPhoto = await processPhoto(img, takenDate, location && location.lat, location && location.lng, {
                    deferUi: true,
                    openPopup: files.length === 1,
                    originalBlob: originalBlob,
                    sourceUri: sourceUri,
                    sourceType: sourceType,
                    locationSource: location ? location.source : "unknown",
                    locationAccuracy: location ? location.accuracy : null,
                    deferImageAnalysis: true,
                    mission: activeImageMission ? { name: activeImageMission.name } : null
                });
                if (importedPhoto) {
                    loadedCount += 1;
                    if (isValidPhotoCoordinate(importedPhoto.lat, importedPhoto.lng)) {
                        lastLocatedImportedPhoto = importedPhoto;
                        setSelectedDestination(importedPhoto.lat, importedPhoto.lng, importedPhoto.dateString || getPhotoInteractionText().exifLocation);
                    }
                }
            } catch (e) {
                failedCount += 1;
                console.warn("사진 처리 실패:", file.name, e);
            }
        }
    } finally {
        hidePhotoImportProgress();
        if (sourceType === "camera") {
            pendingCameraCaptureDate = null;
            pendingCameraCaptureLocation = null;
        }
        clearNativePhotoUris();
        event.target.value = "";
        syncRecordingUI();
    }
    if (loadedCount > 0) {
        updateStats();
        scheduleSave();
        updatePhotoList();
        if (lastLocatedImportedPhoto) focusPhotoOnMap(lastLocatedImportedPhoto);
    }
    if (failedCount > 0) alert(earlyUiText("photoFailed", { count:failedCount }));
}

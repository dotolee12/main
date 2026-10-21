(function() {
    if (!Array.isArray) Array.isArray = function(value) { return Object.prototype.toString.call(value) === "[object Array]"; };
    if (!Array.prototype.forEach) Array.prototype.forEach = function(fn) { for (var i = 0; i < this.length; i += 1) fn(this[i], i, this); };
    if (!Array.prototype.map) Array.prototype.map = function(fn) { var out = []; for (var i = 0; i < this.length; i += 1) out.push(fn(this[i], i, this)); return out; };
    if (!Array.prototype.filter) Array.prototype.filter = function(fn) { var out = []; for (var i = 0; i < this.length; i += 1) if (fn(this[i], i, this)) out.push(this[i]); return out; };
    if (!Array.prototype.reduce) Array.prototype.reduce = function(fn, initial) { var value = initial; for (var i = 0; i < this.length; i += 1) value = fn(value, this[i], i, this); return value; };
    if (!Array.prototype.indexOf) Array.prototype.indexOf = function(value) { for (var i = 0; i < this.length; i += 1) if (this[i] === value) return i; return -1; };
    var fso = new ActiveXObject("Scripting.FileSystemObject");
    var testFile = WScript.ScriptFullName;
    var root = fso.GetParentFolderName(fso.GetParentFolderName(testFile));
    var stream = fso.OpenTextFile(fso.BuildPath(root, "region-stay-core.js"), 1, false, 0);
    eval(stream.ReadAll());
    stream.Close();

    var HOUR = 60 * 60 * 1000;
    var MINUTE = 60 * 1000;
    function point(cityCode, startMinute, endMinute, accuracy) {
        var value = { lat:cityCode, lng:127, startTime:startMinute * MINUTE, endTime:endMinute * MINUTE, timestamp:startMinute * MINUTE };
        if (typeof accuracy !== "undefined") value.accuracy = accuracy;
        return value;
    }
    function cityFor(pointValue) {
        return pointValue.lat === 1 ? "Hanam" : pointValue.lat === 2 ? "Gimpo" : pointValue.lat === 3 ? "Goyang" : "";
    }
    function calculate(points) {
        return GiloaRegionStayCore.calculate(points, cityFor, { cities:["Hanam", "Gimpo", "Goyang"], maximumAccuracy:100, maximumGapMs:2 * MINUTE });
    }
    function equal(name, actual, expected) {
        if (actual !== expected) throw new Error(name + ": expected " + expected + ", got " + actual);
        WScript.Echo("PASS " + name);
    }

    // A: 30 minutes of valid Hanam GPS.
    equal("A Hanam 30/60", calculate([point(1, 1, 31, 20)]).Hanam, 30 * MINUTE);
    // B: another 30 minutes accumulates to the one-hour threshold.
    equal("B Hanam 60/60", calculate([point(1, 1, 31, 20), point(1, 1441, 1471, 15)]).Hanam, HOUR);
    // C: accuracy over 100 m contributes nothing.
    equal("C accuracy 150m rejected", calculate([point(1, 1, 61, 150)]).Hanam, 0);
    // D: a point outside all target polygons contributes nothing.
    equal("D outside Hanam rejected", calculate([point(9, 1, 61, 20)]).Hanam, 0);
    // E: serialized/reloaded source GPS yields identical progress.
    var saved = [point(2, 1, 31, 25)];
    var reloaded = saved.map(function(p) { return { lat:p.lat, lng:p.lng, startTime:p.startTime, endTime:p.endTime, timestamp:p.timestamp, accuracy:p.accuracy }; });
    equal("E restart preserves progress", calculate(reloaded).Gimpo, 30 * MINUTE);
    // F: legacy points without accuracy remain compatible and restore 65 min.
    equal("F legacy Hanam 65m restored", calculate([point(1, 1, 66)]).Hanam, 65 * MINUTE);
    // G: a long signal outage is not counted, but both recorded sections are.
    equal("G 20m plus 40m across outage", calculate([point(3, 1, 21, 30), point(3, 121, 161, 30)]).Goyang, HOUR);
    // Adjacent samples use their timestamp delta instead of point count.
    equal("timestamp pair delta", calculate([point(1, 1, 1, 10), point(1, 1.25, 1.25, 10)]).Hanam, 15 * 1000);
    WScript.Echo("All regional stay tests passed.");
})();

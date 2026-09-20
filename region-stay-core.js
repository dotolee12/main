(function(root, factory) {
    var api = factory();
    if (typeof module === "object" && module.exports) module.exports = api;
    else root.GiloaRegionStayCore = api;
})(typeof self !== "undefined" ? self : this, function() {
    "use strict";

    function pointTime(point, key, fallback) {
        var value = Number(point && point[key]);
        return isFinite(value) && value > 0 ? value : fallback;
    }

    function hasAcceptedAccuracy(point, maximumAccuracy) {
        // Legacy Giloa routes were already filtered before being stored, but
        // older payloads did not preserve accuracy. Keep those points eligible.
        if (!point || point.accuracy === null || typeof point.accuracy === "undefined" || point.accuracy === "") return true;
        var accuracy = Number(point.accuracy);
        return isFinite(accuracy) && accuracy >= 0 && accuracy <= maximumAccuracy;
    }

    function mergeIntervals(intervals) {
        if (!intervals.length) return [];
        intervals.sort(function(a, b) { return a[0] - b[0] || a[1] - b[1]; });
        var merged = [intervals[0].slice()];
        for (var i = 1; i < intervals.length; i += 1) {
            var current = intervals[i], previous = merged[merged.length - 1];
            if (current[0] <= previous[1]) previous[1] = Math.max(previous[1], current[1]);
            else merged.push(current.slice());
        }
        return merged;
    }

    function calculate(points, resolveCity, options) {
        options = options || {};
        var maximumAccuracy = Number(options.maximumAccuracy) || 100;
        var maximumGapMs = Number(options.maximumGapMs) || 2 * 60 * 1000;
        var cities = Array.isArray(options.cities) ? options.cities.slice() : [];
        var intervalsByCity = {};
        cities.forEach(function(city) { intervalsByCity[city] = []; });
        var normalized = (Array.isArray(points) ? points : []).map(function(point) {
            var timestamp = pointTime(point, "timestamp", pointTime(point, "startTime", NaN));
            var start = pointTime(point, "startTime", timestamp);
            var end = pointTime(point, "endTime", start);
            if (!isFinite(start) || !isFinite(end) || end < start) return null;
            var accepted = hasAcceptedAccuracy(point, maximumAccuracy);
            var city = accepted ? resolveCity(point) : "";
            return { point:point, city:cities.indexOf(city) >= 0 ? city : "", start:start, end:end, accepted:accepted };
        }).filter(Boolean).sort(function(a, b) { return a.start - b.start; });

        normalized.forEach(function(item, index) {
            if (!item.accepted || !item.city) return;
            if (item.end > item.start) intervalsByCity[item.city].push([item.start, item.end]);
            var next = normalized[index + 1];
            if (!next || !next.accepted || next.city !== item.city) return;
            var gap = next.start - item.end;
            if (gap > 0 && gap <= maximumGapMs) intervalsByCity[item.city].push([item.end, next.start]);
        });

        var accumulatedMs = {};
        cities.forEach(function(city) {
            accumulatedMs[city] = mergeIntervals(intervalsByCity[city]).reduce(function(total, interval) {
                return total + Math.max(0, interval[1] - interval[0]);
            }, 0);
        });
        return accumulatedMs;
    }

    return { calculate:calculate, hasAcceptedAccuracy:hasAcceptedAccuracy };
});

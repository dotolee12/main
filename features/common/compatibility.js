// giloa.js
// Lightweight compatibility layer for older Android System WebView builds.
// Missing collection and Promise helpers must never stop the map at startup.
(function installLegacyCompatibility() {
    if (!Object.assign) {
        Object.assign = function(target) {
            if (target === null || target === undefined) throw new TypeError("Cannot convert undefined or null to object");
            var output = Object(target);
            for (var i = 1; i < arguments.length; i++) {
                var source = arguments[i];
                if (source === null || source === undefined) continue;
                for (var key in source) if (Object.prototype.hasOwnProperty.call(source, key)) output[key] = source[key];
            }
            return output;
        };
    }
    if (!Array.from) Array.from = function(value) { return Array.prototype.slice.call(value || []); };
    if (!Array.prototype.find) Array.prototype.find = function(callback, thisArg) { for (var i = 0; i < this.length; i++) if (callback.call(thisArg, this[i], i, this)) return this[i]; };
    if (!Array.prototype.findIndex) Array.prototype.findIndex = function(callback, thisArg) { for (var i = 0; i < this.length; i++) if (callback.call(thisArg, this[i], i, this)) return i; return -1; };
    if (!Array.prototype.includes) Array.prototype.includes = function(value, start) { return this.indexOf(value, start || 0) !== -1; };
    if (!String.prototype.includes) String.prototype.includes = function(value, start) { return this.indexOf(value, start || 0) !== -1; };
    if (!String.prototype.padStart) String.prototype.padStart = function(length, fill) { var text = String(this); var pad = String(fill === undefined ? " " : fill); while (text.length < length) text = pad + text; return text.slice(-length); };
    if (typeof NodeList !== "undefined" && !NodeList.prototype.forEach) NodeList.prototype.forEach = Array.prototype.forEach;
    if (typeof Promise === "function" && !Promise.prototype.finally) {
        Promise.prototype.finally = function(callback) {
            var PromiseCtor = this.constructor || Promise;
            return this.then(function(value) { return PromiseCtor.resolve(callback()).then(function() { return value; }); }, function(error) { return PromiseCtor.resolve(callback()).then(function() { throw error; }); });
        };
    }
    if (typeof window.requestAnimationFrame !== "function") window.requestAnimationFrame = function(callback) { return setTimeout(function() { callback(Date.now()); }, 16); };
    if (typeof window.cancelAnimationFrame !== "function") window.cancelAnimationFrame = function(id) { clearTimeout(id); };
})();


/* Loaded only after the user requests a walking route. */
importScripts("./walk-core.js?v=car-qr-walk-20261117");
self.onmessage = function (event) {
    try {
        var input = event.data;
        var route = GiloaWalkCore.plan(
            GiloaWalkCore.graph(input.elements),
            input.origin,
            input.minutes,
            input.history
        );
        self.postMessage({route:route});
    } catch (error) {
        self.postMessage({error:["noRoad", "noRoute"].includes(error.message) ? error.message : "error"});
    }
};

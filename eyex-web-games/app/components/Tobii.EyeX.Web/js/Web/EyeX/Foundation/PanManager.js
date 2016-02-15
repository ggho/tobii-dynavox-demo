EyeX.PanManager = EyeX.Class({
    constructor: function () {
        this._proxiedPerformPanAnimation = EyeX.utils.proxy(this, this._performPanAnimation);
    },

    stop: function (id) {
        delete this._panObjects[id];
        this._requiresScheduling = Object.keys(this._panObjects).length === 0;
    },

    setVelocity: function (id, htmlElement, velocityX, velocityY) {
        var obj = this._panObjects[id];

        if (!obj) {
            obj = this._panObjects[id] = new EyeX.PanObject(id, htmlElement);
        }
        obj.setVelocity(velocityX, velocityY);
    },

    isPanning: function (id) {
        var obj = this._panObjects[id];
        return obj && obj.isPanning;
    },

    start: function (id) {
        var obj = this._panObjects[id];
        if (!obj) {
            return;
        }

        obj.initialize();

        if (this._requiresScheduling) {
            this._requiresScheduling = false;
            this._schedulePanAnimation();
        }
    },

    _schedulePanAnimation: function () {
        window.requestAnimationFrame(this._proxiedPerformPanAnimation);
    },

    _performPanAnimation: function () {
        var keys = Object.keys(this._panObjects),
            i = 0,
            len = keys.length;

        if (len === 0)
            return;

        for (; i < len; i++) {
            this._panObjects[keys[i]].performDelta();
        }

        this._schedulePanAnimation();
    },

    _panObjects: {},
    _requiresScheduling: true
});

EyeX.PanObject = EyeX.Class({
    constructor: function (id, element) {
        this._id = id;
        this._element = element;
    },

    setVelocity: function (velocityX, velocityY) {
        this._velocityX = velocityX;
        this._velocityY = velocityY;
    },

    initialize: function () {
        this._isPanning = true;
        this._lastPanTimestamp = Date.now();
    },

    performDelta: function () {
        var now = Date.now(),
            deltaTime = (now - this._lastPanTimestamp) / 1000;

        this._element.scrollLeft += this._velocityX * deltaTime;
        this._element.scrollTop -= this._velocityY * deltaTime;
        this._lastPanTimestamp = now;
    },

    isPanning: false,
    _lastPanTimestamp: null,
    _velocityX: 0,
    _velocityY: 0,
    _id: null,
    _element: null
});

EyeX.pan = new EyeX.PanManager();
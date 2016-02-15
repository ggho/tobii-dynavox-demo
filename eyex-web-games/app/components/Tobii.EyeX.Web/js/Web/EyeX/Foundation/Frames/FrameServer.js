/**
 * Class EyeX.FrameServer
 */
EyeX.FrameServer = EyeX.Class(EyeX.FrameNode, {
    constructor: function (context) {
        EyeX.FrameServer.$super.call(this, context, EyeX.FrameManager.tokens.clientMessage, EyeX.FrameManager.tokens.serverMessage);
        this._frames = {};
        EyeX.coords.clientChanged.subscribe(EyeX.utils.proxy(this, this._updateClientFramePositions));
    },

    sendMessage: function (frameId, token, data) {
        var frameSelector = this._frames[frameId];
        if (frameSelector)
            this._sendMessage(frameSelector[0].contentWindow, token, data);
    },

    onRequest: function (request, frameId, sender, respond) {
        switch (request.data.token) {
            case EyeX.FrameManager.tokens.initialize:
                this._initializeClientConnection(sender, respond);
                break;

            case EyeX.FrameManager.tokens.getPosition:
                this._getFramePosition(frameId, respond);
                break;
        }
    },

    _initializeClientConnection: function (clientFrameWindow, respond) {
        var frameSelector = this._findFrameByWindow(clientFrameWindow);
        if (!frameSelector)
            return;
        var frameId = EyeX.utils.getUniqueId();
        this._frames[frameId] = frameSelector;
        frameSelector.attr("eyex-frame-id", frameId);
        respond({ frameId: frameId });
    },

    _getFramePosition: function (frameId, respond) {
        var frameSelector = this._findFrameById(frameId);
        if (!frameSelector)
            return;
        var offset = frameSelector.offset();
        var position = EyeX.coords.clientToScreen({ x: offset.left, y: offset.top });
        respond(position);
    },

    _findFrameById: function (frameId) {
        var frameSelector = this._frames[frameId];
        if (frameSelector[0].contentWindow)
            return frameSelector;

        delete this._frames[frameId];
        return null;
    },

    _findFrameByWindow: function (frameWindow) {
        var frameSelector = $("iframe");
        for (var i = 0, len = frameSelector.length; i < len; i++) {
            var iFrameElement = frameSelector[i];
            if (iFrameElement.contentWindow == frameWindow)
                return $(iFrameElement);
        }
        return null;
    },

    _updateClientFramePositions: function () {
        var frameSelectors = this._getAllFrameSelectors();
        var self = this;
        frameSelectors.forEach(function (frameSelector) {
            var offset = frameSelector.offset();
            var frameBoundingRect = EyeX.coords.clientToScreen({ x: offset.left, y: offset.top, width: frameSelector.width(), height: frameSelector.height() });
            self._sendMessage(frameSelector[0].contentWindow, EyeX.FrameManager.tokens.updatePosition, frameBoundingRect);
        });
    },

    _getAllFrameSelectors: function () {
        var frameSelectors = [];
        var frameIds = Object.keys(this._frames);
        for (var i = 0, len = frameIds.length; i < len; i++) {
            var frameSelector = this._findFrameById(frameIds[i]);
            if (frameSelector)
                frameSelectors.push(frameSelector);
        }
        return frameSelectors;
    }
});

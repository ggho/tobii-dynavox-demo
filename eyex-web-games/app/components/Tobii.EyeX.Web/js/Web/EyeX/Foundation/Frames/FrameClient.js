/**
 * Class EyeX.FrameClient
 *
 * A frame node which is used inside a frame and handles communication with a frame server in the parent window.
 */
EyeX.FrameClient = EyeX.Class(EyeX.FrameNode, {

    /**
     * Creates a frame client.
     *
     * @param context:
     *  The context used for communication with the EyeX server.
     */
    constructor: function (context) {
        EyeX.FrameClient.$super.call(this, context, EyeX.FrameManager.tokens.serverMessage, EyeX.FrameManager.tokens.clientMessage);
    },

    initialize: function () {
        var def = new EyeX.utils.Deferred();
        var self = this;
        this._initializeCommunicationWithParent()
            .done(function () {
                self._requestPosition().done(function () {
                    def.resolve();
                });
            })
            .fail(function () {
                def.reject();
            });

        return def.promise();
    },

    sendRequest: function (token, data) {
        return this._sendRequest(window.parent, token, data, EyeX.FrameManager.frameId);
    },

    onMessage: function (message) {
        switch (message.token) {
            case EyeX.FrameManager.tokens.updatePosition:
                this._updatePageOffset(message.data);
                break;
        }
    },

    _initializeCommunicationWithParent: function () {
        return this.sendRequest(EyeX.FrameManager.tokens.initialize, null).done(EyeX.utils.proxy(this, function (data) {
            EyeX.FrameManager.frameId = data.frameId;
        }));
    },

    _requestPosition: function () {
        return this.sendRequest(EyeX.FrameManager.tokens.getPosition, null).done(EyeX.utils.proxy(this, function (data) {
            this._updatePageOffset(data);
        }));
    },

    _updatePageOffset: function (frameBoundingRect) {
        console.log(frameBoundingRect);
        EyeX.FrameManager.size = { width: frameBoundingRect.width, height: frameBoundingRect.height };

        // Must be WebCoordinateConverter.
        EyeX.coords.getConverter().setPageOffsetInBrowserWindow({
            x: frameBoundingRect.x - window.screenX,
            y: frameBoundingRect.y - window.screenY,
        });

        this.context.communicator.sendRequest(EyeX.constants.requestType.custom + 1, {
            frameId: EyeX.FrameManager.frameId,
            x: frameBoundingRect.x,
            y: frameBoundingRect.y,
            width: frameBoundingRect.width,
            height: frameBoundingRect.height,
        });
    }
});

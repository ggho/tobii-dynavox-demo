/**
 * Class EyeX.FrameNode.
 *
 * Base class for frame nodes. A frame node is a communiction unit used to synchronize EyeX instances between different frames.
 */
EyeX.FrameNode = EyeX.Class({

    /**
     * Initializes the frame node.
     *
     * @param context:
     *  The context used for communication with the EyeX server.
     *
     * @param inputMessageToken:
     *  The token to expect on incoming messages.
     *
     * @param outputMessagetoken:
     *  The token to use on outgoing messages.
     */
    constructor: function (context, inputMessageToken, outputMessageToken) {
        this.context = context;
        this._requests = {};
        this._inputMessageToken = inputMessageToken;
        this._outputMessageToken = outputMessageToken;

        // Subscribe to "window messages".
        window.addEventListener("message", EyeX.utils.proxy(this, this._onWindowMessage));
    },

    /**
     * Called when a message has arrived. 
     * This function should be overriden to supply custom message handling.
     *
     * @param message:
     *  The message.
     *
     * @param sender:
     *  The window object from which the message was sent.
     */
    onMessage: function (message, sender) {
    },

    /**
     * Called when a request has arrived.
     * This function should be overriden to supply custom request handling.
     *
     * @param request:
     *  The request content.
     *
     * @param frameId:
     *  The id of the the frame that sent the request.
     *
     * @param sender:
     *  The window object of the sender.
     *
     * @param respond:
     *  A function which when called sends a response to the sender.
     */
    onRequest: function (request, frameId, sender, respond) {
    },

    /**
     * Called when a "window message" has been received.
     */ 
    _onWindowMessage: function (e) {
        if (e.data && e.data.messageToken == this._inputMessageToken)
            this._onMessage(e.data.message, e.source);
    },

    /**
     * Called when a message has arrived. 
     *
     * @param message:
     *  The message.
     *
     * @param sender:
     *  The window object from which the message was sent.
     */
    _onMessage: function (message, sender) {
        var self = this;
        switch (message.token) {
            case EyeX.FrameManager.tokens.response:
                this._handleResponse(message.data);
                break;

            case EyeX.FrameManager.tokens.request:
                var request = message.data;
                this.onRequest(request, message.frameId, sender, function (responseData) {
                    self._sendResponse(sender, responseData, request.requestId);
                });
                break;

            default:
                this.onMessage(message, sender);
        }
    },

    /**
     * Handles a response message.
     *
     * @param response:
     *  The response message.
     */ 
    _handleResponse: function (response) {
        // Find the deferred mapped to this request id and resolve it if found.
        var def = this._requests[response.requestId];
        if (def)
            def.resolve(response.data);
    },

    /**
     * Sends a mesasge to a target window.
     *
     * @param targetWindow:
     *  The window to send the message to.
     *
     * @param token:
     *  A token to identify the message.
     *
     * @param data:
     *  The content of the message.
     *
     * @param frameId:
     *  The frame id of the sender. (can be left out if not a frame)
     */
    _sendMessage: function (targetWindow, token, data, frameId) {
        targetWindow.postMessage({
            messageToken: this._outputMessageToken,
            message: {
                token: token,
                data: data,
                frameId: frameId,
            }
        }, "*");
    },

    /**
     * Sends a request to a target window. 
     *
     * @param targetWindow:
     *  The window to send the message to.
     *
     * @param token:
     *  A token to identify the message.
     *
     * @param data:
     *  The content of the message.
     *
     * @param frameId:
     *  The frame id of the sender. (can be left out if not a frame)
     *
     * @returns:
     *  A deferred which will be resolved with the response or rejected if no response is received.
     */
    _sendRequest: function (targetWindow, token, data, frameId) {
        
        // Generate new id for the request.
        var requestId = EyeX.utils.getUniqueId();

        // Create and store deferred which will provide the result.
        var def = new EyeX.utils.Deferred();
        this._requests[requestId] = def;

        // Sends a message to the target window containing the request.
        this._sendMessage(targetWindow, EyeX.FrameManager.tokens.request, {
            requestId: requestId,
            data: {
                token: token,
                data: data,
            }
        }, frameId);

        // TODO: should time out if no response has been received.

        return def.promise();
    },

    /**
     * Sends a response to a target window.
     *
     * @param targetWindow:
     *  The window to send the response to.
     *
     * @param data:
     *  The content of the response.
     *
     * @param requestId:
     *  The id of the request for which this is a response.     
     */
    _sendResponse: function (targetWindow, data, requestId) {
        this._sendMessage(targetWindow, EyeX.FrameManager.tokens.response, {
            requestId: requestId,
            data: data
        });
    }
});

/**
 * Class EyeX.FrameManager.
 *
 * Manages frame related tasks such as keeping identifying each frame and keeping track of it's position.
 */
EyeX.FrameManager = EyeX.Class({
    $statics: {

        /**
         * Tokens used in communication between frame clients and servers.
         */
        tokens: {
            serverMessage: "eyex-servermsg",
            clientMessage: "eyex-clientmsg",
            request: "request",
            response: "response",
            initialize: "init",
            getPosition: "get-position",
            updatePosition: "update-position",
        },

        /**
         * Determines if this code is currently executing within a frame.
         */
        isFrame: function () {
            return window.top != window;
        },

        /**
         * The id of the current frame (if any).
         */
        frameId: null,
    },

    /**
     * Creates a frame manager.
     *
     * @param context:
     *  The EyeX context that should be used for communication.        
     */
    constructor: function (context) {
        this.context = context;
        var self = this;

        // Create a deferred used to signal when ready.
        this._readyDef = new EyeX.utils.Deferred();

        // Create a frame server (always present if child frames should need it)
        this.server = new EyeX.FrameServer(self.context);

        // If currently not running in a frame. (this is the top window)
        if (!EyeX.FrameManager.isFrame()) {

            // The frame manager is now ready!
            this._readyDef.resolve();
            return;
        }

        // Create fram client. (Will connect to frame server in parent window if EyeX is available).
        this.client = new EyeX.FrameClient(self.context);

        // Initialize the client and signal deferred based on result.
        this.client.initialize()
            .done(function () {
                self._readyDef.resolve();
            })
            .fail(function () {
                self._readyDef.reject();
            });
    },

    /**
     * Used to let the user know when the frame manager is ready to be used.
     *
     * @param onReady:
     *  A callback which will be invoked when the frame manager is ready.
     *
     * @returns:
     *  A deferred which will be resolved when ready or rejected if the frame manager could no become ready.
     */
    ready: function (onReady) {
        if (onReady)
            this._readyDef.done(onReady);

        return this._readyDef.promise();
    },
});

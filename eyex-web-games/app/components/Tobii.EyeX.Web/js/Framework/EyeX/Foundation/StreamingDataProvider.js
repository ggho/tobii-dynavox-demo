/**
 * EyeX.StreamingDataProvider
 * 
 * Helper used for simple streaming data interaction.
 */
EyeX.StreamingDataProvider = EyeX.Class(EyeX.Object, {

    /**
     * Creates a EyeX.StreamingDataProvider.
     * 
     * @param context:
     *  The context to use for the communication.
     *
     * @param behaviorType:
     *  The behavior type which specifies what kind of data stream to get.
     *
     * @param behaviorParams:
     *  Params specifying details for the data stream.
     *
     * @param callback:
     *  Callback which will be invoked when data arrives on the stream.
     */
    constructor: function (context, behaviorType, behaviorParams, callback) {
        EyeX.StreamingDataProvider.$super.call(this, context);
        this._interactorId = "streaming_" + EyeX.utils.getUniqueString();
        this._behaviorType = behaviorType;
        this._behaviorParams = behaviorParams;
        this._callback = callback;
        this._isEnabled = false;
    },

    /**
     * Enables or disables the stream.
     * 
     * @param isEnabled:
     *  Specifies if the stream should be enabled or not.
     */
    enable: function (isEnabled) {
        // Return if already in preferred state. 
        if (isEnabled == this.isEnabled())
            return;

        // Enable or disable.
        this._isEnabled = isEnabled;
        if (this._isEnabled)
            this._onEnabled();
        else
            this._onDisabled();
    },

    /**
     * Determines if the stream is currently enabled.
     */
    isEnabled: function () {
        return !!this._isEnabled;
    },

    /**
     *  Called when an event arrives.
     *
     * @param event:
     *  The event.
     */
    _onEvent: function (event) {
        // Get the behavior contaning the data.
        var behavior = event.getBehavior(this._behaviorType);
        if (!behavior)
            return;

        // Invoke the callback with the data from the event.
        this._callback(behavior.data);
    },

    /**
     * Called when enabled.
     */
    _onEnabled: function () {
        this._sendSnapshot(false);
        this._eventHandlerTicket = this.context.registerEventHandler(EyeX.utils.proxy(this, this._onEvent));
        this._connectionStateChangedTicket = this.context.registerConnectionStateChangedHandler(EyeX.utils.proxy(this, this._onConnectionStateChanged));
    },
    
    /**
     * Called when disabled.
     */
    _onDisabled: function () {
        if (this._connectionStateChangedTicket)
            this.context.unregisterConnectionStateChangedHandler(this._connectionStateChangedTicket);
        if (this._eventHandlerTicket)
            this.context.unregisterMessageHandler(this._eventHandlerTicket);
        this._sendSnapshot(true);
    },


    /**
     *  Called when the connection state of the context changes.
     *
     * @param isConnected:
     *  True if connected, otherwise false.
     */
    _onConnectionStateChanged: function(isConnected) {
        if (isConnected)
            this._sendSnapshot(!this._isEnabled);
    },

    /**
     *  Sends a global snapshot with an interactor describing the data stream to the EyeX.Engine.
     *
     * @param isDeleted:
     *  Specifies if the interactor should be deleted or not.
     */
    _sendSnapshot: function (isDeleted) {
        var C = EyeX.constants;
        var snapshot = this.context.createSnapshot();
        snapshot.setWindowIds([EyeX.constants.literals.globalInteractorWindowId]);
        snapshot.createBounds(C.boundsType.none);
        var interactor = snapshot.createInteractor(this._interactorId);
        interactor.isDeleted = isDeleted;
        interactor.createBounds(C.boundsType.none);
        interactor.createBehavior(this._behaviorType, this._behaviorParams);
        interactor.windowId = EyeX.constants.literals.globalInteractorWindowId;
        snapshot.commitAsync();
    }
});

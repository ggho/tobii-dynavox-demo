/**
 * EyeX.StatesHelper
 * 
 * Basic facade used for managing states.
 */
EyeX.StatesHelper = EyeX.Class(EyeX.CommonBase, {

    /**
     * Initializes the state helper.
     *
     * @param context:
     *  The EyeX context.
     */
    constructor: function (context) {
        this.context = context;
        this.context.registerNotificationHandler(this.proxy(this._onNotification));
    },

    /**
     * Gets the state for a specified path.
     *
     * @param statePath:
     *  The path to the state to get.
     *
     * @param callback:
     *  The callback to be invoked when the state is available. (optional)
     *
     * @returns:
     *  A deferred which will be resolved with the state when available, or rejected if not found.
     */
    get: function (statePath, callback) {
        return this.context.getStateAsync(statePath).done(function (stateBag) {
            if (callback)
                callback(stateBag.data);
        });
    },
    
    /**
     * Sets the state for a specified path.
     *
     * @param statePath:
     *  The path to the state to set.
     *
     * @returns:
     *  A deferred which will be resolved when the state has been set, or rejected if not.
     */
    set: function(statePath, data) {
        var stateBag = this.context.createStateBag(statePath, data);
        return this.context.setStateAsync(stateBag);
    },

    /**
     * Subscribes to state changes for a specified state path.
     */
    subscribe: function (statePath, callback) {
        return this.context.registerStateChangedHandler(statePath, function (stateBag) {
            callback(stateBag.data);
        });
    },

    /**
     * Cancells a previous subscription.
     */
    unsubscribe: function(ticket) {
        return this.context.unregisterStateChangedHandler(ticket);
    },
});

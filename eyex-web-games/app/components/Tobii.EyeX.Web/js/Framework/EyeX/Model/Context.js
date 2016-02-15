/**
 * EyeX.Context
 * 
 * Manages a single interaction session between a Web Client and the EyeX.Engine.
 */
EyeX.Context = EyeX.Class(EyeX.CommonBase, {

    /**
     * Static methods.
     */
    $statics: {
        /**
         * Creates the EyeX Context with the specified config. 
         *
         * @param config:
         *  The config for the context. 
         *
         * @returns:
         *  A promise which will be resolved with the context as value if successfully created, otherwise rejected.
         */
        create: function (config) {
            // This may need to be deferred in the future. 
            var def = new EyeX.utils.Deferred();
            if (!config)
                config = {};
            def.resolve(new EyeX.Context(config));
            return def.promise();
        }
    },

    /**
     * Creates the EyeX.Context.
     *
     * @param config:
     *  The config for the context. TODO     
     */
    constructor: function (config) {
        this._config = config;
        this._connectionStateChangedHandlers = {};
        this._messageHandlers = {};
        this._stateObservations = {};
        this.communicator = new EyeX.Communicator({
            onConnected: EyeX.utils.proxy(this, this._onConnected),
            onDisconnected: EyeX.utils.proxy(this, this._onDisconnected),
            onCommunicationEstablished: EyeX.utils.proxy(this, this._onCommunicationEstablished),
            onMessage: EyeX.utils.proxy(this, this._onMessage),
        });
    },

    /**
     * Enables the connection to the EyeX Engine.
     */
    enableConnection: function () {
        this.communicator.open();
    },

    /**
     * Disables the connection to the EyeX Engine.
     */
    disableConnection: function () {
        this.communicator.close();
    },

    /**
     * Creates an EyeX.Command.
     * 
     * @param commandType: 
     *  The type of the command.
     *
     * @param data:
     *  The data for the command.
     *
     * @returns:
     *  The command.
     */
    createCommand: function (commandType, data) {
        return new EyeX.Command(this, commandType, data);
    },

    /**
     * Creates an EyeX.Snapshot.     
     *
     * @returns:
     *  The snapshot.
     */
    createSnapshot: function () {
        return new EyeX.Snapshot(this);
    },

    /**
     * Creates an EyeX.Snapshot for an EyeX.Query.     
     *
     * @param query: 
     *  The query for which to create the snapshot.
     *
     * @returns:
     *  The snapshot.
     */
    createSnapshotForQuery: function (query) {
        var snapshot = this.createSnapshot();
        snapshot.createBounds(EyeX.constants.boundsType.rectangular, EyeX.utils.clone(query.getBounds().data));
        return snapshot;
    },

    /**
     * Registers a callback which will be invoked when the connection state changes.
     * 
     * @param callback: 
     *  The callback.
     *
     * @returns:
     *  A ticket when can be used to unregister the callback.
     */
    registerConnectionStateChangedHandler: function (callback) {
        var ticket = EyeX.utils.getUniqueId();
        this._connectionStateChangedHandlers[ticket] = callback;
        return ticket;
    },

    /**
     * Unregisters a callback from being invoked when the connection state changes.
     * 
     * @param callback: 
     *  The ticket retrieved when the callback was registered.
     */
    unregisterConnectionStateChangedHandler: function (ticket) {
        delete this._connectionStateChangedHandlers[ticket];
    },

    /**
     * Registers a callback which will be invoked when a message of the specified type arrives.
     * 
     * @param messageType: 
     *  The type of message for which this callback should be invoked.
     * 
     * @param callback: 
     *  The callback.
     *
     * @param options:
     *  Options associated with the callback.
     *
     * @returns:
     *  A ticket when can be used to unregister the callback.
     */
    registerMessageHandler: function (messageType, callback, options) {
        var handlers = this._messageHandlers[messageType];
        if (!handlers) {
            handlers = {};
            this._messageHandlers[messageType] = handlers;
        }
        var ticket = EyeX.utils.getUniqueId();
        handlers[ticket] = { callback: callback, options: options };
        return ticket;
    },

    /**
     * Unregisters a callback from being invoked when a message of the specified type arrives.
     * 
     * @param ticket: 
     *  The ticket retrieved when the callback was registered.
     */
    unregisterMessageHandler: function (ticket) {
        for (var messageType in this._messageHandlers) {
            var callbacks = this._messageHandlers[messageType];
            var callback = callbacks[ticket];
            if (!callback) {
                delete callbacks[ticket];
                return;
            }
        }
    },

    /**
     * Registers a callback which will be invoked when a query arrives.
     * 
     * @param callback: 
     *  The callback.
     *
     * @returns:
     *  A ticket when can be used to unregister the callback.
     */
    registerQueryHandler: function (callback) {
        return this.registerMessageHandler(EyeX.constants.messageType.query, callback);
    },

    /**
     * Registers a callback which will be invoked when an event arrives.
     * 
     * @param callback: 
     *  The callback.
     *
     * @returns:
     *  A ticket when can be used to unregister the callback.
     */
    registerEventHandler: function (callback) {
        return this.registerMessageHandler(EyeX.constants.messageType.event, callback);
    },

    /**
     * Registers a callback which will be invoked when a notification arrives.
     * 
     * @param callback: 
     *  The callback.
     *
     * @returns:
     *  A ticket when can be used to unregister the callback.
     */
    registerNotificationHandler: function (callback) {
        return this.registerMessageHandler(EyeX.constants.messageType.notification, callback);
    },

    /**
     * Registers observation on a specific state path.
     * 
     * @param statePath: 
     *  The statePath.
     */
    registerStateObserver: function (statePath) {
        var observation = EyeX.utils.getValueOr(this._stateObservations, statePath, { refCount: 0 });
        if (observation.refCount++ > 0)
            return;
        var command = this.createCommand(EyeX.constants.commandType.registerStateObserver, {
            statePath: statePath
        });
        command.executeAsync();
    },
    
    /**
     * Unregisters observation on a specific state path.
     * 
     * @param statePath: 
     *  The statePath.
     */
    unregisterStateObserver: function (statePath) {
        var observation = this._stateObservations[statePath];
        if (!observation || --observation.refCount > 0)
            return;
        var command = this.createCommand(EyeX.constants.commandType.unregisterStateObserver, {
            statePath: statePath
        });
        command.executeAsync();
    },

    /**
     * Gets options associated with a message handler.
     * 
     * @param messageType: 
     *  The type of message for which this callback should be invoked.
     * 
     * @param callback: 
     *  The callback.
     *
     * @param options:
     *  Options associated with the callback.
     */ 
    getMessageHandlerOptions: function(messageType, ticket) {
        var handlers = this._messageHandlers[messageType];
        if (!handlers)
            return null;
        var handler = handlers[ticket];
        if (!handler)
            return null;
        return handler.options;
    },

    /**
     * Registers a callback which will be invoked when a state on the specified path changes.
     *
     * @param statePath:
     *  The state path to observe.
     *
     * @param callback:
     *  The callback to invoke when the state changes.
     *
     * @returns:
     *  A ticket used to unregister this handler.
     */
    registerStateChangedHandler: function(statePath, callback) {
        this.registerStateObserver(statePath);
        return this.registerMessageHandler(EyeX.constants.messageType.notification, function(notification) {

            if (notification.getNotificationType() != EyeX.constants.notificationType.stateChanged)
                return;

            var stateBag = notification.getData();
            if (statePath.indexOf(stateBag.statePath) != 0)
                return;

            callback(stateBag);
        }, { statePath: statePath });
    },

    /**
     * Unregisters a callback which will be invoked when a state on the specified path changes.
     *
     * @param ticket:
     *  The ticket received during registration of the handler.
     */
    unregisterStateChangedHandler: function(ticket) {
        var options = this.getMessageHandlerOptions(EyeX.constants.messageType.notification, ticket);
        this.unregisterStateObserver(options.statePath);
        this.unregisterMessageHandler(ticket);
    },

    /**
     * Gets a state from the EyeX engine asynchronously.
     *
     * @param statePath: 
     *  The path of the state to get.
     *
     * @returns: 
     *  A dererred which will be resolved if the state is successfully retrieved, otherwise rejected.
     */
    getStateAsync: function (statePath) {
        var def = new EyeX.utils.Deferred();
        var command = this.createCommand(EyeX.constants.commandType.getState, {
            statePath: statePath
        });
        command.executeAsync()
            .done(this.proxy(function (asyncData) {                
                if (asyncData.result == EyeX.constants.resultCode.ok) {                    
                    var stateBag = new EyeX.StateBag(this, asyncData.data);
                    def.resolve(stateBag);
                } else
                    def.reject();
            }))
            .fail(function () {
                def.reject();
            });
        return def.promise();
    },

    /**
     * Sets a state in the EyeX engine asynchronously.
     *
     * @param stateBag: 
     *  A state bag describing the path and value to set.
     *
     * @returns: 
     *  A dererred which will be resolved if the state was successfully set, otherwise rejected.
     */
    setStateAsync: function (stateBag) {
        var def = new EyeX.utils.Deferred();
        var command = this.createCommand(EyeX.constants.commandType.setState, stateBag);
        command.executeAsync()
            .done(function (asyncData) {
                if (asyncData.result == EyeX.constants.resultCode.ok)
                    def.resolve();
                else
                    def.reject();
            })
            .fail(function () {
                def.reject();
            });
        return def.promise();
    },

    /**
     * Creates a statebag for the specified path and data.
     *
     * @param statePath:
     *  The path for the state bag.
     *
     * @param data:
     *  Data for the state bag.
     */
    createStateBag: function(statePath, data) {
        return new EyeX.StateBag(this, {
            statePath: statePath,
            data: data
        });
    },

    /**
     * Sets the visibility of this client.
     * Clients not considered visible will not receive data from the EyeX Engine.
     *
     * @param isVisible:
     *  True if visible, otherwise false.
     */
    setVisibility: function(isVisible) {
        this.communicator.sendRequest(EyeX.constants.webRequestType.setVisibility, {
            isVisible: isVisible
        });
    },

    /**
     * Called when connected to the EyeX Engine.
     */
    _onConnected: function () {
        this._sendSlaveMessage();
    },

    /**
     * Called when disconnected from the EyeX Engine.
     */
    _onDisconnected: function () {
        this._callConnectionStateChangedHandlers(false);
    },

    /**
     * Called when communication has been established with the EyeX Engine.
     */
    _onCommunicationEstablished: function () {
        this._callConnectionStateChangedHandlers(true);
    },

    /**
     * Called when a message has arrived from the EyeX Engine.
     * 
     * @param message: 
     *  The message.
     */
    _onMessage: function (message) {
        var contract = message.body;
        switch (message.header.messageType) {
            case EyeX.constants.messageType.query:
                this._onQuery(contract);
                break;
            case EyeX.constants.messageType.event:
                this._onEvent(contract);
                break;
            case EyeX.constants.messageType.notification:
                this._onNotification(contract);
                break;
        }
    },

    /**
     * Called when a query has arrived from the EyeX Engine.
     * 
     * @param queryContract: 
     *  The contract for a query.
     */
    _onQuery: function (queryContract) {
        // Create actual query.
        var query = new EyeX.Query(this, queryContract);

        // Call message handlers registers for query messages.
        this._callMessageHandlers(EyeX.constants.messageType.query, query);
    },

    /**
     * Called when an event has arrived from the EyeX Engine.
     * 
     * @param eventContract: 
     *  The contract for an event.
     */
    _onEvent: function (eventContract) {
        // Create actual event.
        var event = new EyeX.Event(this, eventContract);

        // Call message handlers registered for event messages.
        this._callMessageHandlers(EyeX.constants.messageType.event, event);
    },

    /**
     * Called when an event has arrived from the EyeX Engine.
     * 
     * @param eventContract: 
     *  The contract for an event.
     */
    _onNotification: function (notificationContract) {
        // Create actual notification.
        var notification = new EyeX.Notification(this, notificationContract);

        // Call message handlers registered for event messages.
        this._callMessageHandlers(EyeX.constants.messageType.notification, notification);
    },

    /**
     * Calls connection state changed handlers.
     * 
     * @param isConnected:
     *  True if connected, otherwise false.
     */
    _callConnectionStateChangedHandlers: function (isConnected) {
        for (var ticket in this._connectionStateChangedHandlers) {
            var callback = this._connectionStateChangedHandlers[ticket];
            callback(isConnected);
        }
    },

    /**
     * Calls message handlers for a specified message type.
     * 
     * @param messageType:
     *  The type of message specifyning which handlers to call.
     *
     * @param args:
     *  The args the the message handler.
     */
    _callMessageHandlers: function (messageType, args) {
        var handlers = this._messageHandlers[messageType];
        if (!handlers)
            return;
        for (var ticket in handlers) {
            var handler = handlers[ticket];
            handler.callback(args);
        }
    },

    /**
     * Sends a slave message to the EyeX Engine.
     */
    _sendSlaveMessage: function () {
        EyeX.logDebug("Sending slave message");
        this.communicator.sendRaw({
            mode: "slave",
            masterId: this._config.masterId,
            slaveId: this._config.slaveId,
            token: this._config.token,
        });
    },
});

/**
 * EyeX.Communicator
 * 
 * Manages a single communication channel between a Web Client and the EyeX Engine.
 * Once opened, the EyeX.Communicator will try to keep a connection connected.
 */
EyeX.Communicator = EyeX.Class(EyeX.CommonBase, {

    /**
     * Creats the EyeX.Connection.
     *
     * @param: config
     *  The configuration for the connection:
     *      
     *      onConnected [optional]: 
     *       Called when connected to the EyeX Engine.
     *      
     *      onDisconnected [optional]:
     *       Called when disconnected from the EyeX Engine.
     *      
     *      onCommunicationEstablished [optional]:
     *       Called when the communication has been established.
     *       Typically, this is when the Web Client can start doing stuff.
     *      
     *      onMessage [optional]:
     *       Called when a message arrives.
     */
    constructor: function (config) {
        this._config = config ? config : {};
        this._activeRequests = {};
    },

    /**
     * Attempts to open the communication.
     */
    open: function () {
        if (this._isOpen)
            return;
        this._isOpen = true;
        this._beginConnect();
    },

    /**
     * Closes the communication or ends the attempts of connecting.
     */
    close: function () {
        this._isOpen = false;
        if (this._connectionLoop)
            this._connectionLoop.stop();
        if (this._connection)
            this._connection.close();
    },

    /**
     * Determines if the commucation is open, not same as connected.
     */
    isOpen: function () {
        return this._isOpen;
    },

    /**
     * Determines if currently connected to the EyeX Engine.
     */
    isConnected: function () {
        return !!this._connection;
    },

    /**
     * Determines communication has been established.
     */
    isEstablished: function () {
        return !!this._hasEstablishedCommunication;
    },

    /**
     * Sends an object as JSON to the EyeX Engine.
     *
     * @param: data
     *  The data to send.      
     */
    sendRaw: function (data) {
        this._connection.send(data);
    },
    
    /**
     * Sends an EyeX.Message to the EyeX Engine.
     *
     * @param: message
     *  The message to send.      
     */
    sendMessage: function (message) {
        // Get contract.
        var contract = message.toContract();
        
        // Send contract.
        this._connection.send(contract);
    },

    /**
     * Sends a a request to the EyeX Engine.
     *
     * @param: requestType
     *  The type of the request.
     *
     * @param: body
     *  The body of the request.
     *
     * @return:
     *  A promise which will be resolved if the request is completed, otherwise rejected. 
     */
    sendRequest: function (requestType, body) {
        var def = new EyeX.utils.Deferred();

        // Reject if not connected.
        if (!this.isConnected()) 
            def.reject();

        // Generate request id and store it.
        var requestId = EyeX.utils.getUniqueId();
        this._activeRequests[requestId] = def;

        // Create header.
        var header = {
            messageType: EyeX.constants.messageType.request,
            metadata: {
                requestType: requestType,
                requestId: requestId,
            }
        };

        // Create and send message.
        var message = new EyeX.Message(header, body);
        this.sendMessage(message);

        return def.promise();
    },
    
    /**
     * Establishs the communication with the EyeX Engine.
     *
     * @param: message
     *  A message containing initialization stuff from the EyeX Engine.
     */
    _establishCommunication: function (message) {
        // Extend EyeX.constants with stuff from EyeX.Engine.
        EyeX.extend({ constants: message.constants });

        // Merge literals with internal literals.
        EyeX.utils.extend(EyeX.constants.literals, EyeX.constants.sharedLiterals);
        EyeX.utils.extend(EyeX.constants.literals, EyeX.constants.internalLiterals);
        delete EyeX.constants.sharedLiterals;
        delete EyeX.constants.internalLiterals;

        // Set up reverse literals.
        var reverseLiterals = {};
        for (var literalName in EyeX.constants.literals) {
            var value = EyeX.constants.literals[literalName];
            reverseLiterals[value] = literalName;
        }
        EyeX.constants.reverseLiterals = reverseLiterals;

        this._hasEstablishedCommunication = true;
        EyeX.logDebug("Communication with EyeX Engine has been established!");

        // Invoke onCommunicationEstablished callback.
        EyeX.utils.safeCall(this._config.onCommunicationEstablished);

        // Start time sync loop.
        this._timeSyncLoop = new EyeX.utils.AsyncLoop(this.proxy(this._refreshTimeDiff), EyeX.constants.timeSyncIntervalMs);
    },

    /**
     * Starts a sequence of attempts to connect to the EyeX Engine.
     *
     * @param: firstAttemptDelay
     *  The delay for the first connection attempt.
     */ 
    _beginConnect: function (firstAttemptDelay) {
        // If not open, don't even try to connect.
        if (!this._isOpen)
            return;
        
        // Performs the actual connection attempt.
        var connect = this.proxy(function(loop) {
            // If not open, don't even try to connect.
            if (!this._isOpen)
                return;

            // Try to connect.
            this._connect()
                .done(this.proxy(function(connection) { // Successfully connected.
                    this._onConnected(connection);
                }))
                .fail(function() { // Failed to connect.
                    loop.next(EyeX.constants.reconnectIntervalMs);
                });
        });

        // Start connection loop.
        this._connectionLoop = new EyeX.utils.AsyncLoop(connect, firstAttemptDelay);
    },

    /**
     * Attempts a single connect to the EyeX Engine.
     *
     * @return:
     *  A promise which will be resolved if successfully connected, otherwise rejected.  
     */
    _connect: function () {
        // Create connection.
        var connection = new EyeX.Connection({
            onClose: this.proxy(this._onDisconnected),
            onMessage: this.proxy(this._onMessage),
        });

        var def = new EyeX.utils.Deferred();
        var url = this._config.url ? this._config.url : EyeX.constants.defaultWebSocketUrl;

        // Open connection.
        connection.open(url)
            .done(function () { // Connection successfully opened.
                def.resolve(connection);
            })
            .fail(function () { // Failed to open connected.
                def.reject();
            });

        return def.promise();
    },

    /**
     * Called when connected to the EyeX Engine.
     *
     * @param: connection
     *  The connection.
     */
    _onConnected: function (connection) {
        this._connection = connection;
        EyeX.utils.safeCall(this._config.onConnected);
    },

    /**
      * Called when disconnected from the EyeX Engine.
      */
    _onDisconnected: function () {
        // Stop timesync loop of started.
        if (this._timeSyncLoop)
            this._timeSyncLoop.stop();

        this._hasEstablishedCommunication = false;

        // Cancel all requests.
        this._cancelRequests();

        // Invoke the onDisconnected callback.
        EyeX.utils.safeCall(this._config.onDisconnected);

        // Begins to connect again. (we want to keep the connction alive as long as not explicity closed).
        this._beginConnect(EyeX.constants.reconnectIntervalMs);
    },

    /**
     * Called when a message arrives from the EyeX Engine.
     *
     * @param: message
     *  The message.
     */
    _onMessage: function (message) {
        // If communication has not been established, this first message should be an initialization message.
        if (!this._hasEstablishedCommunication) {
            this._establishCommunication(message);
            return;
        }

        // Handle the message.
        this._handleMessage(message);
    },

    /**
     * Main message handler. 
     * Manages responses for requests and forwards messages.
     *
     * @param: message
     *  The message.
     */
    _handleMessage: function (message) {
        // If this is a reponse, handle it.
        if (message.header.messageType == EyeX.constants.messageType.response) 
            this._handleResponse(message);
        else
            EyeX.utils.safeCall(this._config.onMessage, message);
    },

    /**
     * Main response handler.
     *
     * @param: responseMessage
     *  The message contaning the renspose.
     */
    _handleResponse: function (responseMessage) {
        // Get request id.
        var requestId = responseMessage.header.metadata.requestId;

        // Find deferred for that request.
        var def = this._activeRequests[requestId];
        if (!def)
            return;
        delete this._activeRequests[requestId];

        // Get response.
        var response = responseMessage.body;

        // Resolve deferred with response.
        def.resolve(response);
    },

    /**
     * Cancels all requests.
     * All not completed requests will be rejected.
     */
    _cancelRequests: function () {
        for (var requestId in this._activeRequests) {
            var def = this._activeRequests[requestId];
            def.reject();
        }
        this._activeRequests = {};
    },

    /**
     * Refreshes the EyeX.constants.timeDiff value.
     */
    _refreshTimeDiff: function () {
        // Send a timeSync request.
        this.sendRequest(EyeX.constants.webRequestType.timeSync)
            .done(function (response) {
                // Update the timeDiff value.
                var timeDiff = response.timeDiff;
                EyeX.constants.timeDiff = timeDiff;
            });

        // Initiate the next refresh.
        this._timeSyncLoop.next(EyeX.constants.timeSyncIntervalMs);
    },
});


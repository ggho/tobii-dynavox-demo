
/**
 * Manages a single connection to the EyeX Engine using a web socket.
 */
EyeX.Connection = EyeX.Class(EyeX.CommonBase, {

    /**
     * Creats the EyeX.Connection.
     *
     * @param: config
     *  The configuration for the connection:
     *      
     *      onOpen [optional]: 
     *       Called when the connection has been opened.
     *      
     *      onClose [optional]:
     *       Called when the connection has been closed.
     *      
     *      onMessage [optional]:
     *       Called when a message arrives.
     */
    constructor: function (config) {
        this._config = config;
        this._isConnected = false;
    },

    /**
      * Opens a connection to the EyeX Engine.
      *
      * @param: url
      *  The URL the the EyeX Engine Web Socket Host.
      *
      * @return:
      *  A promise which will be resolved if successfully connected, otherwise rejected.
      */
    open: function (url) {
        var def = new EyeX.utils.Deferred();

        EyeX.logDebug("Attempting to connect to EyeX Engine on: " + url);

        try {
            // Create web socket.
            this._webSocket = new WebSocket(url);
        } catch(err) {
            def.reject();
            return def.promise();
        }

        // Hook web socket open event.
        this._webSocket.onopen = this.proxy(function () {
            this._isConnected = true;
            EyeX.logDebug("Connected to EyeX Engine");
            def.resolve();
            if (this._config.onOpen)
                this._config.onOpen();
        });

        // Hook web socket close event.
        this._webSocket.onclose = this.proxy(function () {
            if (!this._isConnected) {
                EyeX.logDebug("Failed to connect to EyeX Engine");
                def.reject();
                return;
            }
            this._isConnected = false;
            EyeX.logDebug("Disconnected from EyeX Engine");
            if (this._config.onClose)
                this._config.onClose();
        });

        // Hook web socket message event.
        this._webSocket.onmessage = this.proxy(function (message) {
            if (this._config.onMessage) {
                var data = JSON.parse(message.data);
                this._config.onMessage(data);
            }
        });

        return def.promise();
    },

    /**
      * Closes the connection to the EyeX Engine.
      * Ignored if not conencted.        
      */
    close: function () {
        if (this._webSocket)
            this._webSocket.close();
    },

    /**
      * Sends an object as JSON to the EyeX Engine.
      *
      * @param: message
      *  The message to send.      
      */
    send: function (message) {
        if (!this._isConnected)
            return;
        var json = JSON.stringify(message);
        this._webSocket.send(json);
    }
});

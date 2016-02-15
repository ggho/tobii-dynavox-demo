/**
 * EyeX.MasterBase
 * 
 * Common Base class for Master plugins.
 */
EyeX.MasterBase = EyeX.Class({

    /**
     * Initializes a EyeX.MasterBase
     *
     * @param config:
     *  The configuration for the Master plugin: TODO
     */ 
    constructor: function (config) {
        this._config = config;
        this._communicator = new EyeX.Communicator({
            onConnected: EyeX.utils.proxy(this, this._onConnected),
            onDisconnected: EyeX.utils.proxy(this, this._onDisconnected),
            onCommunicationEstablished: EyeX.utils.proxy(this, this._onCommunicationEstablished),
        });
        this._validSlaveIds = {};
    },

    /**
     * Runs the master plugin.
     */
    run: function () {
        this._communicator.open();
    },

    /**
     * Called when connected to the EyeX Engine.
     */
    _onConnected: function () {
        this._sendMasterMessage();
    },

    /**
     * Called when disconnected from the EyeX engine.
     */
    _onDisconnected: function () {
    },
    
    /**
     * Called when communication has been established with the EyeX engine.
     */
    _onCommunicationEstablished: function () {
        // Update valid slave ids.
        var validSlaveIds = EyeX.utils.getKeys(this._validSlaveIds);
        this._sendRegisterSlaves(validSlaveIds);

        // Notify active slaves.
        this._notifyActiveSlaves();
    },

    /**
     * Called when the slave plugin has a request.
     *
     * @param message:
     *  Message from the slave plugin.
     *
     * @param sendResponse:
     *  Callback used to send a response.
     */
    _onSlaveRequest: function (message, sendResponse) {
        switch (message.action) {
            // Slave plugin requests master/slave ids.
            case "get-master-slave-ids":
                var ids = this._getMasterSlaveIds();
                sendResponse(ids);
                break;
        }
    },

    /**
     * Gets master and slave ids.
     */
    _getMasterSlaveIds: function () {
        return {
            masterId: this._config.masterId,
            slaveId: this._generateSlaveId(),
        };
    },
    
    /**
     * Generates a new slave id.
     */
    _generateSlaveId: function () {
        return "chrome-slave-" + EyeX.utils.getUniqueId();
    },
    
    /**
     * Register slave ids and sends them the EyeX Engine.
     */
    _registerSlaves: function (slaveIds) {
        var self = this;
        slaveIds.forEach(function (slaveId) {
            self._validSlaveIds[slaveId] = true;
        });
        this._sendRegisterSlaves(slaveIds);
    },
    
    /**
     * Register slave ids and sends them the EyeX Engine.
     */
    _unregisterSlaves: function (slaveIds) {
        var self = this;
        slaveIds.forEach(function (slaveId) {
            delete self._validSlaveIds[slaveId];
        });
        this._sendUnregisterSlaves(slaveIds);
    },

    /**
     * Notifies the EyeX Engine of which slaves are currently active.
     */
    _notifyActiveSlaves: function () {
        var activeSlaveIds = this._getActiveSlaveIds();
        this._sendActiveSlaveIds(activeSlaveIds);
    },
    
    /**
     * Sends slave registation message to the EyeX Engine.
     *
     * @param slaveIds:
     *  The ids of the slaves to register.
     */
    _sendRegisterSlaves: function (slaveIds) {
        this._invokeIfCommunicationIsEstablished(function() {
            EyeX.logDebug("Sending slave registration message: [" + slaveIds + "]");
            if (!this._communicator.isConnected())
                return;
            this._communicator.sendRequest(EyeX.constants.webRequestType.registerSlaves, {
                slaveIds: slaveIds
            });
        });
    },

    /**
     * Sends slave unregistation message to the EyeX Engine.
     *
     * @param slaveIds:
     *  The ids of the slaves to unregister.
     */
    _sendUnregisterSlaves: function (slaveIds) {
        this._invokeIfCommunicationIsEstablished(function() {
            EyeX.logDebug("Sending slave unregistration message: [" + slaveIds + "]");
            if (!this._communicator.isConnected())
                return;
            this._communicator.sendRequest(EyeX.constants.webRequestType.unregisterSlaves, {
                slaveIds: slaveIds
            });
        });
    },

    /**
     * Sends active slaves message to the EyeX Engine.
     *
     * @param slaveIds:
     *  The ids of currently active slaves.
     */
    _sendActiveSlaveIds: function (activeSlaveIds) {
        this._invokeIfCommunicationIsEstablished(function() {
            EyeX.logDebug("Sending active slave ids: [" + activeSlaveIds + "]");
            if (!this._communicator.isConnected())
                return;
            this._communicator.sendRequest(EyeX.constants.webRequestType.updateActiveSlaves, {
                slaveIds: activeSlaveIds
            });
        });
    },

    /**
     * Helper which only invokes the function if communication is established.
     *
     * @param fn:
     *  The function to invoke.
     */
    _invokeIfCommunicationIsEstablished: function (fn) {
        if (this._communicator.isEstablished())
            EyeX.utils.proxy(this, fn)();
    },

    /**
     * Sends a "master" message to the EyeX Engine which will initialize this connection as a master in the EyeX Engine.     
     */
    _sendMasterMessage: function () {
        EyeX.logDebug("Sending master message");
        this._communicator.sendRaw({
            mode: "master",
            masterId: this._config.masterId,
            token: this._config.token,
        });
    },
});

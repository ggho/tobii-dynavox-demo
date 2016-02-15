EyeX.SlaveBase = EyeX.Class({
    constructor: function (config) {
        this._config = config;
    },

    run: function () {
        var message = {
            action: "get-master-slave-ids",
            isRoot: window === window.top,
        };
        this._sendMasterRequest(message, EyeX.utils.proxy(this, this._onMasterSlaveIdsReceived));
    },

    _onMasterSlaveIdsReceived: function (ids) {
        var htmlElement = $("html");
        htmlElement.attr(EyeX.constants.masterIdAttributeName, ids.masterId);
        htmlElement.attr(EyeX.constants.slaveIdAttributeName, ids.slaveId);
    },

    _sendMasterRequest: function (message, onResponse) {
        var self = this;
        var sendRequest = function (asyncLoop) {
            self._config.sendMasterRequest(message, function (response) {
                if (response)
                    onResponse(response);
                else
                    asyncLoop.next(50);
            });
        };
        // Loop until master plugin has been loaded.
        new EyeX.utils.AsyncLoop(sendRequest);
    },
});
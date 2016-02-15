/**
 * EyeX.ChromeSlave
 * 
 * Specific Slave plugin for Chrome.
 * This pluin is running as a "content-script" plugin for each frame used by Chrome.
 * 
 * The plugin has the following responsibilities:
 *  
 *  - Request masterId and slaveId from the Master plugin and provide it to the SlaveBase which writes them to the DOM.
 */
EyeX.ChromeSlave = EyeX.Class(EyeX.SlaveBase, {

    /**
     * Initializes the ChromeSlave plugin.
     */
    constructor: function () {
        EyeX.ChromeSlave.$super.call(this, {
            sendMasterRequest: EyeX.utils.proxy(this, this._sendChromeRequest)
        });

        // TODO: run _onDocmentReady when DOM has been loaded.
    },
    
    /**
     * Sends a request to the master plugin using the Chrome messaging system.
     *
     * @param message:
     *  The message to send to the master plugin.
     *
     * @param onResponse:
     *  Callback for the reply.
     */
    _sendChromeRequest: function (message, onResponse) {
        chrome.runtime.sendMessage(message, onResponse);
    },

    _onDocumentReady: function () {

        if (!this._canInjectEyeX())
            return;

        console.log("Injecting EyeX Scripts");
        this._injectEyeX();

        //EyeX.basic.ready(function (context) {
        //    EyeX.dev.initialize(context);
        //    EyeX.dev.showQueryBox();
        //    EyeX.dom.enableDOMDecoration();
        //    EyeX.dom.enableDOMScanning(context);
        //});
    },

    _canInjectEyeX: function() {
        return !EyeX.getHasExplicitEyeX() && window.top === window;
    },

    _injectEyeX: function() {
        var preFiles = [];
        
        EyeX.load(null, function (relativePath) {
            return chrome.extension.getURL("js/" + relativePath);
        }, preFiles, ["EyeX/Foundation/DOM/Injection.js"], "EyeX/");

        var cssFilePath = chrome.extension.getURL("css/EyeX.css");

        // TODO: get head element and append this.
        // HEAD.append("<link rel='stylesheet' type='text/css' href='" + cssFilePath + "'>");
    }
});

// Create ChromeSlave and run it!
window.eyeXSlave = new EyeX.ChromeSlave();
window.eyeXSlave.run();


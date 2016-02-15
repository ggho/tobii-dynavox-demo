/**
 * EyeX.ChromeMaster
 * 
 * Specific Master plugin for Chrome.
 * This pluin is running as a "background" plugin servering all chrome windows and tabs. 
 * 
 * The plugin has the following responsibilities:
 *  
 *  - Deliver MasterId and SlaveId to all slave plugins that need them.
 *  - Keep track of which slaves currently exists and sync with the EyeX Engine.
 *  - Keep track of which slaves are currently active (active tabs) and sync with the EyeX Engine. 
 */
EyeX.ChromeMaster = EyeX.Class(EyeX.MasterBase, {

    /**
     * Initializes the ChromeMaster plugin.
     */
    constructor: function () {

        // Call base constructor with specific chrome master name and token.
        EyeX.ChromeMaster.$super.call(this, {
            // TODO jon 140624: This should proabably be random.
            masterId: "chrome-master",
            // This token should not be publically exposed as it is used to identify the chrome master.
            token: "A6617788-BCD8-4A6B-A7FD-224669FECD57", 
        });

        // Set up book keeping collections.
        this._slavesInTabs = {};
        this._activeTabsPerWindow = {};

        // Scan the current active tabs. (Useful if this plugin is loaded when chrome already has several windows/pages)
        this._refreshActiveTabsPerWindow();

        // Subscribe to messages from chrome slave plugins.
        chrome.runtime.onMessage.addListener(EyeX.utils.proxy(this, this._onChromeMessage));

        // Hook useful chrome events used to keep track of tabs etc.
        chrome.tabs.onActiveChanged.addListener(EyeX.utils.proxy(this, this._onActiveTabChanged));
        chrome.tabs.onRemoved.addListener(EyeX.utils.proxy(this, this._onTabRemoved));
    },

    /**
     * Gets the ids of the currently active slaves.
     */
    _getActiveSlaveIds: function() {
        var activeSlaveIds = [];

        // Loop through all windows.
        for (var windowId in this._activeTabsPerWindow) {

            // Get active tab for the current window.
            var tabId = this._activeTabsPerWindow[windowId];

            // Get the slaveIds in that tab.
            // TODO jon 140624: Should determine which frames are actually visible within the tab.
            var slaveIds = this._slavesInTabs[tabId];

            // Copy all slave ids to the result array.
            for (var slaveId in slaveIds)
                activeSlaveIds.push(slaveId);
        }
        return activeSlaveIds;
    },

    /**
     * Gets ids of the slaves in a certain tab.
     */
    _getSlavesInTab: function(tabId) {
        return EyeX.utils.getValueOr(this._slavesInTabs, tabId, function () { return {}; });
    },

    /**
     * Registers a slave id in a certain tab.
     * The EyeX Engine will be notified of this new slave being available.
     *
     * @param slaveId: 
     *  The id of the slave to register.
     *
     * @param tabId: 
     *  The id of the tab in which the slave exists.
     */
    _registerSlaveInTab: function (slaveId, tabId) {
        EyeX.logDebug("Registering slave: " + slaveId + " on tab: " + tabId);

        // Registers the slave on the EyeX Engine.
        this._registerSlaves([ slaveId ]);

        // Add slave to local map of tabId/slaveIds.
        var slaves = this._getSlavesInTab(tabId);
        slaves[slaveId] = {}; // could be used for custom slave info.

        // TODO: is this really necessary?
        this._notifyActiveSlaves();
    },

    /**
     * Unregisters a tab.
     * All slaves registered with this tab will be removed.
     * The EyeX engine will be notified that these slaves are no longer available.
     *
     * @param tabId: 
     *  The id of the tab to unregister.
     */
    _unregisterTab: function (tabId) {

        // Get the slaves in this tab.
        var slaveIds = EyeX.utils.getKeys(this._slavesInTabs[tabId]);

        // Notify the EyeX engine that these slaves are no longer available.
        this._unregisterSlaves(slaveIds);

        // Remove tab from local map.
        delete this._slavesInTabs[tabId];

        // TODO: is this really necessary?
        this._notifyActiveSlaves();
    },
    
    /**
     * Called when a message is sent from a slave plugin.
     *
     * @param message:
     *  The message sent from the slave plugin.
     *
     * @param sender:
     *  Chrome specific information about the sender.
     *
     * @param sendResponse:
     *  Callback used to send a response to the sender.
     */
    _onChromeMessage: function (message, sender, sendResponse) {
        var self = this;
        var tab = sender.tab;
        var tabId = tab.id;

        // If no tab is active for the window from which the message arrives, set it as active.
        if (!this._activeTabsPerWindow[tab.windowId]) 
            this._activeTabsPerWindow[tab.windowId] = tabId;

        // If the sender is an actual tab (not an iframe inside it)...
        if (message.isRoot)
            this._unregisterTab(tabId); //  make sure there are no tab registered with the same id.

        // Call the common "_onSlaveRequest" defined in MasterBase.
        this._onSlaveRequest(message, function (ids) {

            // Register this new slave in the tab that sent the message.
            self._registerSlaveInTab(ids.slaveId, tabId);

            // Reply.
            sendResponse(ids);
        });
    },

    /**
     * Called when the active tab in a Chrome window changes.
     *
     * @param tabId: 
     *  The id of the tab which is being activated.
     *
     * @param selectInfo:
     *  Chrome specific info about the selection.
     */
    _onActiveTabChanged: function (tabId, selectInfo) {
        EyeX.logDebug("Tab activated: " + tabId + " in window: " + selectInfo.windowId);

        // Set this tab id as the active one for the specified window.
        this._activeTabsPerWindow[selectInfo.windowId] = tabId;

        // Notify EyeX Engine of the currently active salves.
        this._notifyActiveSlaves();
    },

    /**
     * Called when a tab is removed from a Chrome window.
     *
     * @param tabId:
     *  The id of the tab that was removed.
     */
    _onTabRemoved: function (tabId) {
        EyeX.logDebug("Tab removed: " + tabId);
        this._unregisterTab(tabId);
    },
    
    /**
     * Refreshes the active tabs for each window.     
     */
    _refreshActiveTabsPerWindow: function () {
        var self = this;
        
        // Get current window.
        chrome.windows.getCurrent({ populate: false }, function (currentWindow) {

            // Get all windows.
            chrome.windows.getAll({ populate: true }, function (windows) {

                // For each window.
                windows.forEach(function (window) {

                    // If this is current (Master Plugin Window), do nothing.
                    if (window.id == currentWindow.id)
                        return;

                    // For each tab in the window.
                    window.tabs.forEach(function (tab) {

                        // If this tab is active, set it as active tab for the window.
                        if (tab.active)
                            self._activeTabsPerWindow[window.id] = tab.id;
                    });
                });
            });
        });
    },
});

// Create ChromeMaster and run it!
window.eyeXMaster = new EyeX.ChromeMaster();
window.eyeXMaster.run();

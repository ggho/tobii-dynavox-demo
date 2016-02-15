/**
 * EyeX.Agent
 *
 * Represents an Agent in the EyeX Foundation Model.
 */
EyeX.Agent = EyeX.Class(EyeX.CommonBase, {

    /**
     * Initializes an EyeX.Agent.
     *
     * @param context:
     *  The EyeX context.
     */
    constructor: function(context) {
        this.context = context;
        this._interactorManagers = {};
        this.context.registerQueryHandler(this.proxy(this._onQuery));
        this.context.registerEventHandler(this.proxy(this._onEvent));
    },

    /**
     * Adds an EyeX Interactor Manager to the Agent.
     *
     * @param interactorManager: The interactor manager to add.
     */ 
    addInteractorManager: function (interactorManager) {

        // Only one interactor manager with this id may be added.
        if (this._interactorManagers[interactorManager.id])
            throw "Duplicate interactor manager: " + interactorManager.id;

        // Add and initialize the interactor manager.
        this._interactorManagers[interactorManager.id] = interactorManager;
        interactorManager.initialize(this.context);
    },

    /**
     * Called when a query has been received.
     *
     * @param query:
     *  The query.
     */
    _onQuery: function (query) {

        // Create snapshot.
        var snapshot = this.context.createSnapshotForQuery(query);

        // Populate with window ids. 
        var windowIds = query.getWindowIds();
        snapshot.setWindowIds(windowIds);

        // Let each interactor manager populate the snapshot.
        EyeX.utils.forEachValue(this._interactorManagers, function(interactorManager) {
            interactorManager.populateSnapshot(snapshot);
        });

        // Commit the snapshot.
        snapshot.commitAsync();
    },

    /**
     * Called when an event has been received.
     *
     * @param event:
     *  The event.
     */
    _onEvent: function(event) {
        var interactorId = event.getInteractorId();
        var interactorManager = this._getInteractorManagerForInteractor(interactorId);
        if (interactorManager)
            interactorManager.handleEvent(event);
    },

    /**
     * Finds the interactor manager to which an specific interactor belongs.
     *
     * @param interactorId:
     *  the id of the interactor for which to get the interactor manager.
     */
    _getInteractorManagerForInteractor: function (interactorId) {

        // Get the prefix (i.e. id of the interactor manager)
        var interactorManagerId = interactorId.split("/")[0];

        // Get the interactor manager.
        return this._interactorManagers[interactorManagerId];
    }
});
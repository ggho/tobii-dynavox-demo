/**
 * EyeX.Snapshot
 * 
 * Represents a snapshot used to deliver interactors from a Web Client to the EyeX Engine.
 */
EyeX.Snapshot = EyeX.Class(EyeX.Object, {

    /**
     * Initializes a Snapshot.
     *
     * @param context:
     *  The EyeX Context to which this snapshot belongs.
     */
    constructor: function (context) {
        EyeX.Snapshot.$super.call(this, context);
        this.interactors = {};
    },

    /**
     * Creates bounds for the snapshot.
     *
     * @param boundsType:
     *  The type for the bounds.
     
     * @param data:
     *  The data for the bounds.
     */
    createBounds: function (boundsType, data) {
        this.bounds = new EyeX.Bounds(this.context, boundsType, data);
        return this.bounds;
    },

    setWindowIds: function(windowIds) {
        this.windowIds = windowIds;
    },

    /**
     * Creates an interactor in the snapshot.
     *
     * @param interactorId:
     *  The id of the new interactor.
     */
    createInteractor: function(interactorId) {
        var interactor = new EyeX.Interactor(this.context, interactorId);
        this.interactors[interactorId] = interactor;
        return interactor;
    },
    
    insertInteractor: function (interactor) {
        this.interactors[interactor.id] = interactor;
    },

    /**
     * Commits a snapshot to the EyeX Engine.
     *
     * @returns: 
     *  A deferred which will be resolved if the snapshot is successfully commited to the EyeX Engine, otherwise rejected.
     */
    commitAsync: function () {
        var data = this.toContract();
        var command = this.context.createCommand(EyeX.constants.commandType.commitSnapshot, data);
        return command.executeAsync();
    },

    /**
     * Creates a contract contaning the content of the snapshot.
     */
    toContract: function () {
        var boundsContract = this.bounds.toContract();
        var interactorContracts = EyeX.utils.getValues(this.interactors).map(function (interactor) {
            return interactor.toContract();
        });
        return {
            timestamp: EyeX.now(),
            bounds: boundsContract,
            interactors: interactorContracts,
            windowIds: this.windowIds,
        };
    }
});

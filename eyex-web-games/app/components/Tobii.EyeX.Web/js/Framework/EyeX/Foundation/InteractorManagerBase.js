/**
 * EyeX.InteractorManagerBase 
 *
 * Common base class for interactor managers.
 */
EyeX.InteractorManagerBase = EyeX.Class(EyeX.CommonBase, {

    /**
     * Initializes an EyeX.InteractorManagerBase.
     */ 
    constructor: function () {
        this.id = EyeX.getUniqueString();
    },

    /**
     * Populates a snapshot with interactors within the specified bounds.
     * This method can be overriden to handle 
     *
     * @param snapshot:
     *  The snapshot to populate.
     */
    populateSnapshot: function (snapshot) {
        // TODO: should this return promise?
        var clientBounds = EyeX.coords.screenToClient(snapshot.bounds.toRect());
        this.findInteractorDescriptors(clientBounds).done(this.proxy(function (interactorDescriptors) {
            for (var i = 0, len = interactorDescriptors.length; i < len; i++)
                interactorDescriptors[i].populateSnapshot(snapshot);
        }));
    },

    /**
     * Handles an event by passing it to the interactor for which it applies.
     * This method can be overriden to handle the event manually.
     *
     * param event:
     *  The event to handle.
     */
    handleEvent: function (event) {
        var interactorId = event.getInteractorId().split("/")[1];
        if (!interactorId)
            return;
        var interactorDescriptor = this.getInteractorDescriptor(interactorId);
        if (!interactorDescriptor)
            return;
        if (interactorDescriptor.handleEvent)
            interactorDescriptor.handleEvent(event);
    },

    /**
     * Finds interactor descriptors withing the specified bounds.
     * Unless populateSnapshot is handled manually, this method must be overridden.
     *
     * @param bounds:
     *  The bounds within which the interactors should be.
     *
     * @returns:
     *  An empty array.
     */
    findInteractorDescriptors: function (bounds) {
        return [];
    },

    /**
     * Gets an interactor desciptor from an interactor id.
     * Unless handleEvent is handled manually, this method must be overridden.
     *
     * @param interactorId:
     *  The id of the interactor descriptor to get.
     *
     * @returns:
     *  null.
     */
    getInteractorDescriptor: function (interactorId) {
        return null;
    },
});

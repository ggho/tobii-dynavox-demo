/**
 * EyeX.Interactor
 * 
 * Represents an interactor in an EyeX.Snapshot.
 * A interactor is used to describe one interactable element in a snapshot.
 */
EyeX.Interactor = EyeX.Class(EyeX.Object, {

    /**
     * Initializes an Interactor.
     *
     * @param context:
     *  The EyeX Context to which this interactor belongs.
     *
     * @param id:
     *  The id of the interactor.
     */
    constructor: function (context, id) {
        EyeX.Interactor.$super.call(this, context);
        this.behaviors = {};
        this.id = id;
        this.isEnabled = true;
        this.isDeleted = false;
        this.parentId = EyeX.constants.literals.rootId;
        this.z = 0;
    },

    /**
     * Creates bounds for the interactor.
     *
     * @param boundsType:
     *  The type for the bounds.
     */
    createBounds: function (boundsType, data) {
        this.bounds = new EyeX.Bounds(this.context, boundsType, data);
        return this.bounds;
    },

    /**
     * Creates a behavior on the interactor.
     *
     * @param behaviorType: 
     *  The type of the behavior.
     *
     * @param data:
     *  The data for the behavior.
     */
    createBehavior: function (behaviorType, data) {
        var behavior = new EyeX.Behavior(this.context, behaviorType, data);
        this.behaviors[behaviorType] = behavior;
        return behavior;
    },

    /**
     * Removes a behavior from the interactor.
     *
     * @param behaviorType:
     *  The type of the behavior to remove.
     */
    removeBehavior: function(behaviorType) {
        delete this.behaviors[behaviorType];
    },

    /**
     * Creates a mask for the interactor.
     *
     * @param rowCount:
     *  The number of rows in the mask.
     *
     * @param columnCount:
     *  The number of columns in the mask.
     *
     * @param data:
     *  The data for the mask.
     */
    createMask: function (rowCount, columnCount, data) {
        this.mask = new EyeX.Mask(this.context, rowCount, columnCount, data);
    },

    /**
     * Removes the mask from the interactor.
     */
    clearMask: function () {
        delete this.mask;
    },

    /**
     * Creates a contract contaning the content of the interactor.
     */
    toContract: function () {
        var boundsContract = this.bounds.toContract();
        var behaviorContracts = EyeX.utils.getValues(this.behaviors).map(function (behavior) {
            return behavior.toContract();
        });

        var maskContract;
        if (this.mask)
            maskContract = this.mask.toContract();

        return {
            id: this.id,
            parentId: this.parentId,
            isEnabled: this.isEnabled,
            isDeleted: this.isDeleted,
            z: this.z,
            bounds: boundsContract,
            behaviors: behaviorContracts,
            windowId: this.windowId,
            mask: maskContract,
        };
    }
});
/**
 * EyeX.StandardInteractorCache
 *
 * The standard cache used by EyeX.CachingInteractorManager unless specified otherwise.
 * A BSP Tree is used for internal partitioning.
 */
EyeX.StandardInteractorCache = EyeX.Class(EyeX.CommonBase, {

    /**
     * Initializes a new EyeX.StandardInteractorCache.
     *
     * @param boundingRect:
     *  A rectangle describing the virtual space of the cache.
     */
    constructor: function (boundingRect) {
        this._interactorDescriptorsById = {};
        console.log(boundingRect);
        this._bspTree = new EyeX.BSPTree(null, boundingRect, 100);
    },

    /** 
     * Sets the bounds of the cache.
     *
     * @param boundingRect:
     *  The new bounds.
     */
    setBounds: function (boundingRect) {
        var minSize = this._bspTree.minSize;
        var oldInteractorDescriptorsById = this._interactorDescriptorsById;
        this._interactorDescriptorsById = {};
        this._bspTree = new EyeX.BSPTree(null, new EyeX.utils.Rectangle(boundingRect), minSize);
        EyeX.utils.getValues(oldInteractorDescriptorsById).forEach(this.proxy(function (item) {
            this.addInteractorDescriptor(item.interactorDescriptor);
        }));
    },

    /**
     * Adds an interactor descriptor to the cache.
     *
     * @param interactorDescriptor:
     *  The interactor descriptor that should be added to the cache.
     */
    addInteractorDescriptor: function (interactorDescriptor) {
        var bspNode = this._bspTree.addInteractor(interactorDescriptor);
        this._interactorDescriptorsById[interactorDescriptor.id] = {
            interactorDescriptor: interactorDescriptor,
            bspNode: bspNode
        };
    },

    /**
     * Removes an interactor descriptor from the cache.
     *
     * @param interactorId:
     *  The id of the interactor descriptor to remove. 
     */
    removeInteractorDescriptor: function (interactorId) {
        var item = this._interactorDescriptorsById[interactorId];
        if (!item)
            return;
        item.bspNode.removeInteractor(interactorId);
        delete this._interactorDescriptorsById[interactorId];
    },

    /**
     * Finds interactor descriptors within a specified region.
     * Ancestors are not included.
     * 
     * @param boundingRect:
     *  A rectangle describing the region.
     *
     * @returns:
     *  The intersected interactor descriptors as an array.
     */
    findInteractorDescriptors: function (bounds) {
        return this._bspTree.findInteractors(bounds);
    },

    /**
     * Gets an interactor descriptor from its id.
     *
     * @param interactorId:
     *  The id of the interactor descriptor to get.
     *
     * @returns:
     *  The interactor descriptor if found, otherwise null.
     */
    getInteractorDescriptor: function (interactorId) {
        var item = this._interactorDescriptorsById[interactorId];
        if (item)
            return item.interactorDescriptor;
        return null;
    }
});

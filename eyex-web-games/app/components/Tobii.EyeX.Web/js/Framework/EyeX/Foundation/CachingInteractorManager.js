/**
 * EyeX.CachingInteractorManager
 *
 * Specialized interactor manager for caching scenarios. 
 * I.e. where the interactor descriptors are created and stored instead of temporarily created by demand for each query.
 */
EyeX.CachingInteractorManager = EyeX.Class(EyeX.InteractorManagerBase, {

    /**
     * Initializes the caching interactor manager.
     * 
     * @param boundingRect:
     *  The size of the "canvas" on which interactors can be placed. 
     */
    constructor: function (boundingRect) {
        if (!boundingRect) {
            var virtualBounds = EyeX.coords.getVirtualBounds();
            boundingRect = new EyeX.utils.Rectangle(virtualBounds);
            EyeX.coords.virtualBoundsChanged.subscribe(this.proxy(this._onVirtualBoundsChanged));
        }
        this.boundingRect = boundingRect;
    },
    
    /**
     * Initializes the cache.
     */
    initialize: function () {
        this._cache = this.createCache();
    },

    /**
     * Creates the cache.
     * This method can be overriden to create another type of cache.
     */
    createCache: function () {
        return new EyeX.StandardInteractorCache(this.boundingRect);
    },

    /**
     * Adds an interactor descriptor.
     *
     * @param: The interactor descriptor.
     */
    addInteractorDescriptor: function (interactorDescriptor) {
        this._cache.addInteractorDescriptor(interactorDescriptor);
    },

    /**
     * Adds an interactor descriptor.
     *
     * @param: The interactor descriptor.
     */
    removeInteractorDescriptor: function (interactorId) {
        this._cache.removeInteractorDescriptor(interactorId);
    },

    /**
     * Finds interactor descriptors within a specified region.
     * Ancestors of the intersected interactors will be included.
     *
     * @param bounds:
     *  Bounds describing the region in which to search for interactors.
     * 
     * @returns:
     *  A deferred which will be resolved with the found interactors as an array.
     */
    findInteractorDescriptors: function (bounds) {
        var includedInteractorIds = {};
        var interactorDescriptors = [];

        // Adds an interactor to the result list including its parent if not already included.
        var addInteractorDescriptor = function (interactorDescriptor) {
            interactorDescriptors.push(interactorDescriptor);
            includedInteractorIds[interactorDescriptor.Id] = true;

            var parentId = interactorDescriptor.parentId;
            if (includedInteractorIds[parentId])
                return;

            var parentInteractorDescriptor = _cache.getInteractorDescriptor(parentId);
            if (!parentInteractorDescriptor)
                return;

            addInteractorDescriptor(parentInteractorDescriptor);
        };

        // Find the interactors that actually intersect the bounds.
        var intersectedInteractorDescriptors = this._cache.findInteractorDescriptors(bounds);

        // Add all intersected interactors.
        for (var i = 0, len = intersectedInteractorDescriptors.length; i < len; i++)
            addInteractorDescriptor(intersectedInteractorDescriptors[i]);

        return new EyeX.utils.Deferred().resolve(interactorDescriptors);
    },

    /**
     * Gets an interactor descriptor for a specified interactor id.
     *
     * @param interactorId: The id for which to get the interactor descriptor.
     *
     * @returns:
     *  The interactor descriptor if found, otherwise null.
     */
    getInteractorDescriptor: function (interactorId) {
        return this._cache.getInteractorDescriptor(interactorId);
    },

    /**
     * Updates the cache bounds.
     * This method should be overriden if the cache being used does not support setBounds(...);
     *
     * @param boundingRect:
     *  The new bounds.
     */
    updateCacheBounds: function (boundingRect) {
        this._cache.setBounds(boundingRect);
    },
    
    /**
     * Called when the virtual bounds has changed.
     */
    _onVirtualBoundsChanged: function () {
        var virtualBounds = EyeX.coords.getVirtualBounds();
        this.updateCacheBounds(virtualBounds);
    },
});

/**
 * EyeX.BSPTree
 *
 * Binary space partitioning tree used to partition interactors spatially.
 * Typically for 2D scenarios a quad tree is used. However, web pages are usually high and narrow making two axis splits inefficient.
 * Child nodes in quad trees always have the same aspect as their parents resulting in high and narrow child nodes as well.
 * This would result in wide interactors intersecting the tree at a high level making the partitioning less effective, thus motivating a binary approach.
 */
EyeX.BSPTree = EyeX.Class(EyeX.CommonBase, {

    /**
     * Initializes a EyeX.BSPTree.
     *
     * @param parent:
     *  The parent tree. null if this is the root.
     *
     * @param boundingRect:
     *  A rectangle defining the region for this tree.
     *
     * @param minSize:
     *  The minimum size of a tree. (where to end the recursion)
     */
    constructor: function (parent, boundingRect, minSize) {
        this._interactors = {};
        this.parent = parent;
        this.boundingRect = boundingRect;
        this.minSize = minSize;

        // Set up bounds for child trees. Yet do not create the child trees right now, we only do that on demand.
        if (boundingRect.height >= boundingRect.width) {
            var halfHeight = boundingRect.height / 2;
            if (halfHeight >= this.minSize) {
                this._childRects = [
                    EyeX.utils.Rectangle.fromComponents(this.boundingRect.x, this.boundingRect.y, this.boundingRect.width, halfHeight),
                    EyeX.utils.Rectangle.fromComponents(this.boundingRect.x, this.boundingRect.y + halfHeight, this.boundingRect.width, halfHeight)
                ];
            }
        } else {
            var halfWidth = boundingRect.width / 2;
            if (halfWidth > this.minSize) {
                this._childRects = [
                    EyeX.utils.Rectangle.fromComponents(this.boundingRect.x, this.boundingRect.y, halfWidth, this.boundingRect.height),
                    EyeX.utils.Rectangle.fromComponents(this.boundingRect.x + halfWidth, this.boundingRect.y, halfWidth, this.boundingRect.height)
                ];
            }
        }
    },
    
    /**
     * Adds an interactor to the tree.
     *
     * @param interactor: The interactor to add to the tree.
     */
    addInteractor: function (interactor) {
        var childIndex = -1;

        // Find a child rect in which the interactor fits. (no rects available if min size is reached on this level)
        if (this._childRects) {
            for (var i = 0; i < this._childRects.length; i++) {
                var childRect = this._childRects[i];
                if (childRect.containsRectangle(interactor.boundingRect)) {
                    childIndex = i;
                    break;
                }
            }
        }

        // If no child rect was selected. Insert on this level.
        if (childIndex == -1) {
            this._interactors[interactor.id] = interactor;
            return this;
        }

        // Create child trees if not available.
        if (!this._childTrees) {
            this._childTrees = [];
            for (var i = 0; i < this._childRects.length; i++) {
                this._childTrees.push(new EyeX.BSPTree(this, this._childRects[i], this.minSize));
            }
        }

        // Insert in selected child tree.
        return this._childTrees[childIndex].addInteractor(interactor);
    },

    /**
     * Removes an interactor with a specified id.
     *
     * @param interactorId: 
     *  The id of the interactor to remove.
     */
    removeInteractor: function (interactorId) {
        var interactor = this._interactors[interactorId];
        if(interactor)
            delete this._interactors[interactorId];
    },

    /**
     * Finds interactors within a specified region.
     * 
     * @param boundingRect:
     *  A rectangle describing the region.
     *
     * @param info [optional]: 
     *  Information about the search.
     *  Will have its required member "testCount" set to the number of interactors tested.
     */
    findInteractors: function (boundingRect, info) {
        if (!info)
            info = { testCount: 0 };
        var interactors = [];
        this._findInteractors(boundingRect, interactors, info);
        return interactors;
    },

    /**
     * Recursively finds interactors within a specified region.
     * 
     * @param boundingRect:
     *  A rectangle describing the region.
     *
     * @param interactors: 
     *  An array that will be populated with the intersected interactors.
     *
     * @param info: 
     *  Information about the search.
     *  Will have its required member "testCount" set to the number of interactors tested.
     */
    _findInteractors: function (boundingRect, interactors, info) {

        // If this tree  does not overlap the bounding rect, do nothing.
        if (!this.boundingRect.overlapsRectangle(boundingRect))
            return;

        // For each of the interactors on this level.
        for (var interactorId in this._interactors) {
            var interactor = this._interactors[interactorId];
            info.testCount++;

            // If it overlaps the bounding rect, include it.
            if (interactor.boundingRect.overlapsRectangle(boundingRect))
                interactors.push(interactor);
        }

        // If this is a leaf, end recursion.
        if (!this._childTrees)
            return;

        // Recursively collect interactors from child trees.
        for (var i = 0; i < this._childTrees.length; i++)
            this._childTrees[i]._findInteractors(boundingRect, interactors, info);
    }
});

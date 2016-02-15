/**
 * EyeX.DOMScanner
 */
EyeX.DOMScanner = EyeX.Class({
    constructor: function (context, domInvalidation) {
        this.context = context;
        this.context.registerQueryHandler(EyeX.utils.proxy(this, this._onQuery));
        this.context.registerEventHandler(EyeX.utils.proxy(this, this._onEvent));
        this._cache = new EyeX.DOMElementCache();
        
        domInvalidation.addMutationHandler(EyeX.utils.proxy(this, this._onMutation));

        this._refresher = EyeX.utils.proxy(this._cache, this._cache.refresh);
        this._debounceRefresh = EyeX.utils.debounce(this, this._refreshCache, 200);
        EyeX.utils.TimingSession.run("DOM scanning", this._refresher);
    },
     
    _onQuery: function (query) {
        var frameId;
        if (EyeX.FrameManager.isFrame()) {
            frameId = EyeX.FrameManager.frameId;
            if (!frameId)
                return;
        }

        var queryScreenBoundsRect = query.getBounds().toRect();
        var queryPageBoundsRect = EyeX.coords.screenToClient(queryScreenBoundsRect);
        var elements = this._cache.findElementsWithinBounds(queryPageBoundsRect);
        var snapshot = this.context.createSnapshotForQuery(query);

        var windowIds = [];
        query.getWindowIds().forEach(function(windowId) {
            if (frameId)
                windowId = windowId + ";" + frameId;
            windowIds.push(windowId);
        });

        snapshot.setWindowIds(windowIds);

        elements.forEach(function (element) {
            element.createInteractor(snapshot);
        });

        snapshot.commitAsync();
    },

    _onEvent: function (event) {
        var interactorId = event.getInteractorId();
        var element = this._cache.getElement(interactorId);
        if (element)
            element.handleEvent(event);
    },
    
    _refreshCache: function () {
        this._refresher();
    },

    _onMutation: function(mutations) {
        var doRefresh;
        
        doRefresh = mutations.some(function (mutation) {
            if (mutation.type !== "attributes") {
                return false;
            }

            if (mutation.attributeName === "data-eyex-behaviors") {
                return !!mutation.target.getAttribute(mutation.attributeName);
            }

            return false;
        });
        
        if (doRefresh) {
            this._debounceRefresh();
        }
    }
});

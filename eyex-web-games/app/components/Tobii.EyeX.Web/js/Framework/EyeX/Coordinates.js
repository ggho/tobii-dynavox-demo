/**
 * EyeX.CoordinatesConverter
 * 
 * Default coordinate converter.
 */
EyeX.CoordinatesConverter = EyeX.Class(EyeX.CommonBase, {

    /**
     * Creates the EyeX.CoordinatesHelper.
     */
    constructor: function () {
        this.clientChanged = new EyeX.utils.Signal();
        this.virtualBoundsChanged = new EyeX.utils.Signal();
    },
    
    /**
     * Notifies that some aspect of the client has changed.
     */
    notifyClientChanged: function() {
        this.clientChanged.raise();
    },

    /**
     * Notifies that the virtual bounds has changed.
     */
    notifyVirtualBoundsChanged: function () {
        this.virtualBoundsChanged.raise();
    },
    
    /**
     * Converts client coordinates to screen coordinates.
     */
    screenToClient: function (screenCoordinates, copyOtherProperties) {
        return screenCoordinates;
    },

    /**
      * Converts screen coordinates to client coordinates.
      */
    clientToScreen: function (clientCoordinates, copyOtherProperties) {
        return clientCoordinates;
    },
});

/**
 * EyeX.CoordinatesFacade
 * 
 * Helper used to convert between screen and client coordinates. 
 */
EyeX.CoordinatesFacade = EyeX.Class(EyeX.CoordinatesConverter, {

    /**
     * Creates the EyeX.CoordinatesHelper.
     */
    constructor: function () {
        EyeX.CoordinatesFacade.$super.call(this);
        this.setConverter(new EyeX.CoordinatesConverter());
    },

    /**
     * Sets the converter.
     */
    setConverter: function (converter) {

        // Unsubscribe from previous signals.
        if (this._converterClientChangedTicket)
            this._converter.clientChanged.unsubscribe(this._converterClientChangedTicket);
        if (this._conveterVirtualBoundsChangedTicket)
            this._converter.virtualBoundsChanged.unsubscribe(this._conveterVirtualBoundsChangedTicket);

        // Change converter.
        this._converter = converter;

        // Subscribe to new signals.
        this._converterClientChangedTicket = this._converter.clientChanged.subscribe(this.proxy(this.notifyClientChanged));
        this._conveterVirtualBoundsChangedTicket = this._converter.virtualBoundsChanged.subscribe(this.proxy(this.notifyVirtualBoundsChanged));
    },

    /**
     * Gets the current converter.
     */
    getConverter: function() {
        return this._converter;
    },

    /**
     * Converts client coordinates to screen coordinates.
     */
    screenToClient: function (screenCoordinates, copyOtherProperties) {
        return this._converter.screenToClient(screenCoordinates, copyOtherProperties);
    },

    /**
      * Converts screen coordinates to client coordinates.
      */
    clientToScreen: function (clientCoordinates, copyOtherProperties) {
        return this._converter.clientToScreen(clientCoordinates, copyOtherProperties);
    },

    /**
     * Gets the virtual bounds.
     */
    getVirtualBounds: function() {
        return this._converter.getVirtualBounds();
    },

    /**
     * Sets the virtual bounds.
     */
    setVirtualBounds: function(width, height) {
        this._converter.setVirtualBounds(width, height);
    }
});
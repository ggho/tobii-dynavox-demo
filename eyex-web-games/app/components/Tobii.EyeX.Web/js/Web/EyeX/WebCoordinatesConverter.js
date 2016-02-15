/**
 * EyeX.CoordindatesHelper
 * 
 * Helper used to convert between screen and page coordinates. 
 */
EyeX.WebCoordinatesConverter = EyeX.Class(EyeX.CoordinatesConverter, {

    /**
     * Creates the EyeX.CoordinatesHelper.
     */
    constructor: function (context) {
        EyeX.CoordinatesFacade.$super.call(this);
        this.context = context;
        
        this._pageOffsetInBrowserWindow = { x: 0, y: 0 };
        this._estimatePageOffsetInBrowserWindow();

        this._pageScrollOffset = { x: 0, y: 0 };
        this._refreshPageScrollOffset();

        if (window.top == window)
            window.addEventListener("mousemove", EyeX.utils.proxy(this, this._onMouseMove));

        window.addEventListener("scroll", EyeX.utils.proxy(this, this._onPageScroll));

        var self = this;
        
        // Screen to page converters.
        var s2pX = function (x) { return (x - window.screenX - self._pageOffsetInBrowserWindow.x) / self.getZoom() + self._pageScrollOffset.x; };
        var s2pY = function (y) { return (y - window.screenY - self._pageOffsetInBrowserWindow.y) / self.getZoom() + self._pageScrollOffset.y; };
        var s2pWidth = function (w) { return w / self.getZoom(); };
        var s2pHeight = function (h) { return h / self.getZoom(); };

        // Page to Screen
        var p2sX = function (x) { return (x - self._pageScrollOffset.x) * self.getZoom() + window.screenX + self._pageOffsetInBrowserWindow.x; };
        var p2sY = function (y) { return (y - self._pageScrollOffset.y) * self.getZoom() + window.screenY + self._pageOffsetInBrowserWindow.y; };
        var p2sWidth = function (w) { return w * self.getZoom(); };
        var p2sHeight = function (h) { return h * self.getZoom(); };

        this._screenToPageConverters = {
            x: s2pX,
            y: s2pY,
            width: s2pWidth,
            height: s2pHeight,
        };

        this._pageToScreenConverters = {
            x: p2sX,
            y: p2sY,
            width: p2sWidth,
            height: p2sHeight,
        };

        this._prevBrowserPosition = this.getBrowserWindowPositionOnScreen();
        this._prevZoom = this.getZoom();
        this._prevPageSize = this.getPageSize();
        this._prevVirtualBounds = this.getVirtualBounds();

        setInterval(this.proxy(function () {
            this._clientChanged = false;
            this._checkPageSizeChanged();
            this._checkBrowserPositionChanged();
            this._checkPageZoomChanged();
            if (this._clientChanged)
                this.notifyClientChanged();
            this._checkVirtualBoundsChanged();
        }), 250);
    },

    /**
     * Gets the position of the browser window on screen.
     */
    getBrowserWindowPositionOnScreen: function () {
        var x = window.screenX;
        if (!x)
            x = window.screenLeft;
        var y = window.screenY;
        if (!y)
            y = window.screenTop;
        return { x: x, y: y };
    },

    getPageSize: function () {
        return { width: window.innerWidth, height: window.innerHeight };
    },

    /**
     * Gets the current page offset in the browser window (in screen pixels).
     */
    getPageOffsetInBrowserWindow: function () {
        return {
            x: this._pageOffsetInBrowserWindow.x,
            y: this._pageOffsetInBrowserWindow.y
        };
    },

    /**
     * Sets the current page offset in the browser window (in screen pixels).
     */
    setPageOffsetInBrowserWindow: function (value) {
        if (EyeX.utils.almostEquals(value.x, this._pageOffsetInBrowserWindow.x, 2) &&
            EyeX.utils.almostEquals(value.y, this._pageOffsetInBrowserWindow.y, 2))
            return;

        this._pageOffsetInBrowserWindow = value;
        this.notifyClientChanged();
    },

    /**
     * Gets the current page scroll offset.
     */
    getPageScrollOffset: function () {
        return this._pageScrollOffset;
    },

    /**
     * Sets the current page scroll offset.
     */
    setPageScrollOffset: function (value) {
        if (EyeX.utils.almostEquals(value.x, this._pageScrollOffset.x, 2) &&
            EyeX.utils.almostEquals(value.y, this._pageScrollOffset.y, 2))
            return;

        this._pageScrollOffset = value;
        this.notifyClientChanged();
    },

    /**
     * Gets the current zoom factor.
     */
    getZoom: function () {
        return window.devicePixelRatio;
    },

    /**
     * Converts screen coordiates to page coordiates.
     */
    screenToClient: function (screenCoordinates, copyOtherProperties) {
        return this._convert(this._screenToPageConverters, screenCoordinates, copyOtherProperties);
    },

    /**
      * Converts page coordiates to screen coordiates.
      */
    clientToScreen: function (pageCoordinates, copyOtherProperties) {
        return this._convert(this._pageToScreenConverters, pageCoordinates, copyOtherProperties);
    },

    /**
     * Get page virtual size.
     */
    getPageVirtualSize: function() {
        return {
            width: document.documentElement.scrollWidth,
            height: document.documentElement.scrollHeight,
        };
    },
    
    /**
     * Gets the virtual bounds.
     */
    getVirtualBounds: function() {
        var pageVirtualSize = this.getPageVirtualSize();
        var margin = 250;
        return {
            x: -margin,
            y: -margin,
            width: pageVirtualSize.width + 2 * margin,
            height: pageVirtualSize.height + 2 * margin
        };
    },

    /**
     * Sets the virtual bounds.
     */
    setVirtualBounds: function(x, y, width, height) {
        throw "The virtual bounds may not be set explicitly in a Web Environment.";
    },

    /**
     * Performs conversion from a source object to a target object.
     */
    _convert: function (converters, source, copyOtherProperties) {
        if (!source)
            return; // TODO: should this throw?
        var target = {};
        for (var key in source) {
            var converter = converters[key];
            if (!converter) {
                if (!copyOtherProperties)
                    continue;
                converter = function (value) { return value; };
            }
            var sourceValue = source[key];
            var targetValue = converter(sourceValue);
            target[key] = targetValue;
        }
        return target;
    },

    /**
     * Called when the mouse have moved. (Used to determine the offset between the browser window and page).
     */
    _onMouseMove: function (e) {
        this._refreshPageScrollOffset();
        var offset = {
            x: e.screenX - (e.pageX - this._pageScrollOffset.x) * this.getZoom() - window.screenX,
            y: e.screenY - (e.pageY - this._pageScrollOffset.y) * this.getZoom() - window.screenY,
        };
        this.setPageOffsetInBrowserWindow(offset);
    },

    /**
     * Called when the page scrolls. 
     */
    _onPageScroll: function () {
        this._refreshPageScrollOffset();
    },

    _estimatePageOffsetInBrowserWindow: function() {
        var verticalBorderWidth = (window.outerWidth - window.innerWidth) / 2;
        // We assume that the bottom border is the same as the vertical.
        var estimatedVerticalPageOffsetInBrowserWindow = window.outerHeight - window.innerHeight - verticalBorderWidth;
        var estimatedPageOffsetInBrowserWindow = { x: verticalBorderWidth, y: estimatedVerticalPageOffsetInBrowserWindow };
        this.setPageOffsetInBrowserWindow(estimatedPageOffsetInBrowserWindow);
    },

    /**
     * Updates the current page scroll offset.
     */
    _refreshPageScrollOffset: function () {
        var offset = {
            x: window.scrollX ? window.scrollX : window.pageXOffset,
            y: window.scrollY ? window.scrollY : window.pageYOffset,
        };
        this.setPageScrollOffset(offset);
    },

    /**
     * Checks of the page size has changed and if so sets the _clientChanged flag to true.
     */
    _checkPageSizeChanged: function () {
        var currentPageSize = this.getPageSize();
        if (EyeX.utils.almostEquals(this._prevPageSize.width, currentPageSize.width, 1) && EyeX.utils.almostEquals(this._prevPageSize.height, currentPageSize.height, 1))
            return;
        EyeX.logDebug("Page size changed: " + EyeX.utils.sizoToString(this._prevPageSize) + " -> " + EyeX.utils.sizoToString(currentPageSize));
        this._estimatePageOffsetInBrowserWindow();
        this._clientChanged = true;
        this._prevPageSize = currentPageSize;
    },

    /**
     * Checks of the browser position has changed and if so sets the _clientChanged flag to true.
     */
    _checkBrowserPositionChanged: function () {
        var currentBrowserPosition = this.getBrowserWindowPositionOnScreen();
        if (EyeX.utils.almostEquals(currentBrowserPosition.x, this._prevBrowserPosition.x, 1) && EyeX.utils.almostEquals(currentBrowserPosition.y, this._prevBrowserPosition.y, 1))
            return;
        EyeX.logDebug("Browser position changed: " + EyeX.utils.pointToString(this._prevBrowserPosition) + " -> " + EyeX.utils.pointToString(currentBrowserPosition));
        this._clientChanged = true;
        this._prevBrowserPosition = currentBrowserPosition;
    },

    /**
     * Checks of the page zoom has changed and if so sets the _clientChanged flag to true.
     */
    _checkPageZoomChanged: function () {
        var currentZoom = this.getZoom();
        if (currentZoom == this._prevZoom)
            return;
        EyeX.logDebug("Page zoom changed: " + this._prevZoom + " -> " + currentZoom);
        this._clientChanged = true;
        this._prevZoom = currentZoom;
    },

    /**
     * Checks of the page virtual size has changed and if so raises the virtualBoundsChanged signal.
     */
    _checkVirtualBoundsChanged: function() {
        var currentVirtualBounds = this.getVirtualBounds();
        if (currentVirtualBounds.x == this._prevVirtualBounds.x && currentVirtualBounds.y == this._prevVirtualBounds.y &&
            currentVirtualBounds.width == this._prevVirtualBounds.width && currentVirtualBounds.height == this._prevVirtualBounds.height)
            return;
        EyeX.logDebug("Page virtual bounds changed: " + EyeX.utils.rectToString(this._prevVirtualBounds) + " -> " + EyeX.utils.rectToString(currentVirtualBounds));
        this.notifyVirtualBoundsChanged();
        this._prevVirtualBounds = currentVirtualBounds;
    }
});

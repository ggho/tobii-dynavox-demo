/**
 * EyeX.DOMManager
 * 
 * Manages all DOM interaction.
 */
EyeX.DOMManager = EyeX.Class({
    constructor: function(context) {
        this._invalidation = new EyeX.DOMInvalidation();
	this.context = context;
    },

    query: function(selectorQuery) {
        return new EyeX.ElementSelection(selectorQuery, this._domScanner._cache);
    },

    enableDOMDecoration: function () {
        this._invalidation.initialize(); // only initialize if needed
        this._domDecorator = new EyeX.DOMDecorator(this._invalidation);
    },

    enableDOMScanning: function () {
        this._invalidation.initialize(); // only initialize if needed
        this._domScanner = new EyeX.DOMScanner(this.context, this._invalidation);
    },

    findElements: function (selector, parent) {
        ///<summary>find elements that matches selector</summary>
        ///<param name="selector">Selector that is compatible with querySelector</param>
        ///<param name="parent">(optional) root element whose descendats should be searched (not included in result)</param>
        return Array.prototype.slice.call((parent || window.document).querySelectorAll(selector));
    },

    findAncestorElements: function (selector, child, root) {
        ///<summary>find ancestor elements that matches selector</summary>
        ///<param name="selector">Selector that is compatible with querySelector</param>
        ///<param name="child">element whose ancestors should be searched (not included in result)</param>
        ///<param name="root">(optional) stop search at this element (not included in result)</param>

        var found = [],
    		parent = child.parentElement;

        root = root || window.document.documentElement;

        while (parent && parent !== root) {
            if (this.isMatch(selector, parent)) {
                found.push(parent);
            }
            parent = parent.parentElement;
        }
        return found;
    },

    isMatch: function (selector, element) {
        /// <summary>Test if element matches selector</summary>
        ///<param name="selector">Selector that is compatible with querySelector</param>
        /// <param name="element">Element to test</param>
        var func = (
                HTMLElement.prototype.matches ||
                HTMLElement.prototype.matchesSelector ||
                HTMLElement.prototype.msMatchesSelector ||
                HTMLElement.prototype.mozMatchesSelector ||
                HTMLElement.prototype.webkitMatchesSelector ||
                HTMLElement.prototype.oMatchesSelector);

        return element && func.call(element, selector);
    },
    
    // in html documents DOM returns upper case tag names, xhtml documents returns tag names as typed in source
    elementTagName: function (element) {
        /// <summary>Always returns tag names in upper case</summary>

        if (element && element.tagName)
            return element.tagName.toUpperCase();
        return null;
    },
    
    getElementBounds: function(element) {
        /// <summary>relative to document (not viewport, use element.getBoundingClientRect for that)</summary>
        var rect = element.getBoundingClientRect(),
            document = element.ownerDocument,
            documentElement = document.documentElement,
            window = document.defaultView,
            scrollX = (window.pageXOffset || documentElement.scrollLeft) - (documentElement.clientLeft || 0),
            scrollY = (window.pageYOffset || documentElement.scrollTop) - (documentElement.clientTop || 0);

        return new EyeX.utils.Rectangle({
            x: rect.left + scrollX,
            y: rect.top + scrollY,
            width: rect.right - rect.left, //element.offsetWidth,
            height: rect.bottom - rect.top //element.offsetHeight
        });
    },
    
    addClass: function(element, className) {
        var pattern = /\s*(\S+)\s*/gi,
            classes;

        if (!element)
            return;

        classes = element.className
            ? element.className.match(pattern).filter(function (item) { return item !== className; })
            : [];
        classes.push(className);
        element.className = classes.join(" ");
    },
    
    removeClass: function(element, className) {
        var pattern = /\s*(\S+)\s*/gi,
            classes;

        if (!element || !element.className)
            return;

        classes = element.className.match(pattern).filter(function (item) { return item !== className; });
        element.className = classes.join(" ");
    }

});
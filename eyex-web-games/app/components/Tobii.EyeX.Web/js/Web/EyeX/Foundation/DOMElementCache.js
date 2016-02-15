/**
 * EyeX.DOMElementCache
 */
EyeX.DOMElementCache = EyeX.Class({
    constructor: function () {
        this._rootElements = [];
        this._elementsById = {};
    },

    refresh: function () {
        this._rootElements = this._findEyeXElements();
        this._elementsById = {};

        var bodySelector = EyeX.dom.findElements("body")[0];
        var bodyBoundingRect = EyeX.utils.Rectangle.fromComponents(-1000, -1000, bodySelector.scrollWidth + 2000, bodySelector.scrollHeight + 2000);
        this._bspTree = new EyeX.BSPTree(null, bodyBoundingRect, 100);

        var self = this;
        this.forEachElement(function (element) {
            var elementId = element.getId();
            self._elementsById[elementId] = element;
            self._bspTree.addElement(element);
        });

        this._totalElementCount = Object.keys(this._elementsById).length;
    },

    clear: function () {
        this._rootElements = [];
    },

    getElement: function (elementId) {
        return this._elementsById[elementId];
    },

    findElementsWithinBounds: function (boundingRect) {
        var info = { testCount: 0 };
        var elementsWithinBounds = this._bspTree.findElements(boundingRect, info);
        
        var elementsWithAncestors = {};
        var addElement = function (element) {
            var elementId = element.getId();
            if (elementsWithAncestors[elementId])
                return;
            elementsWithAncestors[elementId] = element;
            if (!element.parentElement.isRoot())
                addElement(element.parentElement);
        };

        elementsWithinBounds.forEach(function (element) {
            addElement(element);
        });

        //console.log({ total: this._totalElementCount, included: elementsWithinBounds.length, tested: info.testCount });

        var elements = EyeX.utils.getValues(elementsWithAncestors);
        return elements;
    },

    forEachElement: function (action) {
        this._forEachRootElement(function (rootElement) {
            if (rootElement.traverse(action) === false)
                return false;
        });
    },

    _forEachRootElement: function (action) {
        EyeX.utils.forEach(this._rootElements, action);
    },

    _findEyeXElements: function () {
        var html = $("html");
        html.attr("data-eyex-id", EyeX.constants.literals.rootId);
        var rootElement = new EyeX.DOMElement(html);
        this._findEyeXElementsRecursive(rootElement);
        return rootElement.childElements;
    },

    _findEyeXElementsRecursive: function (parentElement) {
        var self = this,
            descendants = this._findFirstLevelDescendants(parentElement.selector[0]);
        
        descendants.forEach(function (descendant) {
            var selector = $(descendant);
            var element = new EyeX.DOMElement(selector, parentElement);
            self._findEyeXElementsRecursive(element);
        });
    },
    
    _findFirstLevelDescendants: function (rootElement) {
        var found = [],
            selector = "[data-eyex-behaviors]";
        EyeX.dom.findElements(selector, rootElement).forEach(function (element) {
            if (EyeX.dom.findAncestorElements(selector, element, rootElement).length < 1) {
                found.push(element);
            }
        });
        return found;
    }

});

/**
 * EyeX.DOMDecorator
 */
EyeX.DOMDecorator = EyeX.Class({
    constructor: function (domInvalidation) {
        var self = this;
        
        domInvalidation.addMutationHandler(EyeX.utils.proxy(this, this._onMutation));
        this._activatableSelectors = EyeX.css.getActivatableSelectors();

        // first pass check whole DOM
        EyeX.utils.TimingSession.run("DOM decoration", function () {
            self.decorateElements(EyeX.dom.findElements("body")[0]);
        });
    },

    decorateElements: function(rootElement) {
        var elements = [],
            oldElements,
            element,
            tagName,
            i,
            len,
            elementsWithActivatableStyle,
            constrainingBounds = this._findConstrainingBounds(rootElement);
        
        this._addElementsRecursively(rootElement, constrainingBounds, elements);
        elementsWithActivatableStyle = this._activatableSelectors
            ? EyeX.dom.findElements(this._activatableSelectors.join(", "))
            : null;

        // clear previously decorated elements
        oldElements = EyeX.dom.findElements("[data-eyex-autodecorated][data-eyex-behaviors]", rootElement);
        oldElements.forEach(function (elm) {
            elm.removeAttribute("data-eyex-autodecorated");
            elm.removeAttribute("data-eyex-behaviors");
            elm.removeAttribute("data-eyex-tentativefocus");
        });

        for (i = 0, len = elements.length; i < len; i++) {
            element = elements[i];
            tagName = EyeX.dom.elementTagName(element);

            if (this.elementIsActivatable(element, tagName, elementsWithActivatableStyle)) {
                element.setAttribute("data-eyex-autodecorated", "");
                element.setAttribute("data-eyex-tentativefocus", true);
                this.addBehaviorDecoration(element, "activatable");
            }

            if (this.elementIsPannable(element, tagName)) {
                element.setAttribute("data-eyex-autodecorated", "");
                this.addBehaviorDecoration(element, "pannable");
            }
        }
        
        if (this._debounceHolder[rootElement]) {
            // deleteing debounce holder if it exists
            delete this._debounceHolder[rootElement];
            //console.log("deleteing debounce holder", Object.keys(this._debounceHolder).length);
        }
    },

    elementIsActivatable: function(element, tagName, cssElementList) {
        var ariaRole,
            contentIsEditable,
            hasActivatableStyle,
            hasPointerCursor;

        switch (tagName) {
            case "A":
            case "BUTTON":
            case "SELECT":
            case "TEXTAREA":
                return true;
            case "INPUT":
                return element.getAttribute("type") !== "hidden";
        }

        // ARIA tagged
        ariaRole = element.getAttribute("role");
        switch (ariaRole) {
            case "button":
            case "checkbox":
            case "textbox":
                return true;
        }

        contentIsEditable = element.getAttribute("contenteditable");
        if (contentIsEditable === "true") {
            return true;
        }

        // find activatable by looking at CSS
        hasActivatableStyle = cssElementList && cssElementList.indexOf(element[0]) > -1;
        hasPointerCursor = window.getComputedStyle(element).cursor === "pointer";
        if (hasActivatableStyle || hasPointerCursor) {
            if (element.children.length > 1) {
                return false;
            } else if (element.children.length > 0) {
                return EyeX.dom.isMatch("img", element.children[0]);
            } else if (element.childNodes.length === 1 && element.childNodes[0].nodeType === 3) {
                // element contains only text
                return true;
            }

        }

        if (element.getAttribute("onclick") || element.getAttribute("onmousedown") || element.getAttribute("onmouseup")) {
            return EyeX.dom.findElements(this._commonActivatableSelectors, element).length < 1;
        }

        return false;
    },

    elementIsPannable: function(element, tagName) {
        var canScrollX,
            canScrollY;

        // only block element can be scrollable
        if (window.getComputedStyle(element).display !== "block") {
            return false;
        }

        if (tagName === "BODY") {
            return this.isBodyPannable(element);
        }

        if (this.isOverflowPannable(element)) {
            canScrollX = element.scrollWidth > (element.clientWidth + 10); // add small margin
            canScrollY = element.scrollHeight > (element.clientHeight + 10); // add small margin
            return canScrollX || canScrollY;
        }

        return false;
    },
            
    addBehaviorDecoration: function(element, behavior) {
        var old = element.getAttribute("data-eyex-behaviors");
        if (!old || old.indexOf(behavior) < 0) {
            element.setAttribute("data-eyex-behaviors", old ? old + " " + behavior : behavior);
            return;
        }
    },
        
    isOverflowPannable: function (element) {
        var styles = ["overflow", "overflowX", "overflowY"],
            value,
            i, len,
            css = window.getComputedStyle(element);

        for (i = 0, len = styles.length; i < len; i++) {
            value = css[styles[i]];
            if (!value)
                continue;
            
            if (value === "auto" || value === "scroll") {
                return true;
            }
        }

        return false;
    },
    
    isBodyPannable: function (bodyElement) {
        var doc = bodyElement.ownerDocument,
            win = doc.defaultView,
            documentElement = doc.documentElement,
            outerWidth = documentElement.clientWidth === documentElement.scrollWidth ? win.innerWidth : documentElement.clientWidth,
            outerHeight = win.innerHeight,
            innerWidth = Math.max(bodyElement.scrollWidth, documentElement.scrollWidth),
            innerHeight = Math.max(bodyElement.scrollHeight, documentElement.scrollHeight),
            canScrollX = innerWidth > outerWidth,
            canScrollY = innerHeight > outerHeight;

        return canScrollX || canScrollY;
    },
    
    stringStartsWith: function (input, prefix) {
        if (prefix && prefix.length > 0 && input && input.length >= prefix.length) {
            return input.substring(0, prefix.length) === prefix;
        }
        return false;
    },

    hasBehaviorStyleChange: function (elm) {
        var style = window.getComputedStyle(elm),
            name,
            newValue,
            oldValue,
            i, len,
            hasChange = false;

        if (!elm.previousStyle) {
            elm.previousStyle = {};
        }

        for (i = 0, len = this._behaviorAlteringStyles.length; i < len; i++) {
            name = this._behaviorAlteringStyles[i];
            newValue = style[name];
            oldValue = elm.previousStyle[name];
            if (newValue !== oldValue) {
                elm.previousStyle[name] = newValue;
                hasChange = true;
            }
        }
            
        return hasChange;
    },
    
    hasBoundsStyleChange: function (element) {
        var rect = EyeX.dom.getElementBounds(element),
            hasChange = false;

        if (!element.previousBounds) {
            element.previousBounds = rect;
        }

        hasChange = hasChange || element.previousBounds.x !== rect.x;
        hasChange = hasChange || element.previousBounds.y !== rect.y;
        hasChange = hasChange || element.previousBounds.width !== rect.width;
        hasChange = hasChange || element.previousBounds.height !== rect.height;
        return hasChange;
    },

    _addElementsRecursively: function (elm, constrainingBounds, arr) {
        var tagName = EyeX.dom.elementTagName(elm.tagName),
            style,
            i, len,
            newConstrainingBounds,
            childBounds;

        // skip these elements
        switch (tagName) {
            case "IFRAME":
            case "SCRIPT":
                return;
        }

        if (elm.offsetWidth < 1 && elm.offsetHeight < 1) {
            style = window.getComputedStyle(elm);
            if (!(style.display === "inline" && elm.children.length > 0))
                return;
        }

        arr.push(elm);
        newConstrainingBounds = this._getNewConstrainingBounds(elm, constrainingBounds);

        // skip children of these elements
        switch (tagName) {
            case "SELECT":
            case "OBJECT":
                return;
        }

        for (i = 0, len = elm.children.length; i < len; i++) {
            childBounds = EyeX.dom.getElementBounds(elm.children[i]);
            if (newConstrainingBounds.overlapsRectangle(childBounds)) {
                this._addElementsRecursively(elm.children[i], newConstrainingBounds, arr);
            }
        }
    },
    
    _getBodyUnconstrainedBounds: function() {
        var body = EyeX.dom.findElements("body")[0];
        return new EyeX.utils.Rectangle({
            x: 0,
            y: 0,
            width: body.scrollWidth,
            height: body.scrollHeight
        });
    },

    _hasConstrainingBounds: function(element) {
        var style = window.getComputedStyle(element);
        return style.overflow !== "visible" || style.overflowX !== "visible" || style.overflowY !== "visible";
    },

    _getNewConstrainingBounds: function(element, oldConstrainingBounds) {
        if (this._hasConstrainingBounds(element)) {
            return EyeX.dom.getElementBounds(element);
        }
        return oldConstrainingBounds;
    },
    
    _findConstrainingBounds: function (element) {
        var current = element,
            is = EyeX.dom.isMatch;

        while (current && !is("body", current)) {
            if (this._hasConstrainingBounds(current))
                return EyeX.dom.getElementBounds(element);
            current = parent.parentElement;
        }

        return this._getBodyUnconstrainedBounds();
    },
    
    _debounceDecorateElements: function(rootElement) {
        if (!this._debounceHolder[rootElement]) {
            //console.log("adding debounce holder", rootElement);
            this._debounceHolder[rootElement] = EyeX.utils.debounce(this, this.decorateElements, 200);
        }
        this._debounceHolder[rootElement](rootElement);
    },

    _onMutation: function (mutations) {
        var self = this;

        mutations.forEach(function (mutation) {
            switch (mutation.type) {
                case "attributes":
                    if (self.stringStartsWith(mutation.attributeName, "data-eyex-")) {
                        // ignore own attributes (read by scanner)
                        return;
                    }
                    
                    if (mutation.attributeName === "id") {
                        if (!mutation.target.id && !mutation.oldValue) {
                            return;
                        }
                    }

                    if (mutation.attributeName === "style" || mutation.attributeName === "class") {
                        if (!self.hasBehaviorStyleChange(mutation.target)) {
                            if (self.hasBoundsStyleChange(mutation.target)) {
                                self._debounceDecorateElements(mutation.target);
                            }
                            return;
                        }
                        self.decorateElements(mutation.target);
                    }
                    break;
                case "childList":
                    self.decorateElements(mutation.target);
                    break;
                default:
                    //console.log(mutation.type);
                    break;
            }
        });
    },

    _debounceHolder: {},
    _commonActivatableSelectors: "a, button, input:not([type='hidden']), select, textarea, *[onclick], *[onmousedown], *[onmouseup]",
    _behaviorAlteringStyles: ["cursor", "display"],
});

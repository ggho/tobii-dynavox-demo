/**
 * EyeX.DOMElement
 */
EyeX.DOMElement = EyeX.Class({

    $statics: {
        hookNames: {
            onActivationFocusChanged: "onactivationfocuschanged",
            onActivated: "onactivated",
            onGazeEnter: "ongazeenter",
            onGazeLeave: "ongazeleave",
        }
    },

    constructor: function (selector, parentElement) {
        this.parentElement = parentElement;
        this.selector = selector;
        this.sourceElement = selector[0];
        this.childElements = [];
        this._isPanning = false;
        this._eventHandlers = {};

        if (this.parentElement)
            this.parentElement.childElements.push(this);

        this._ensureUniqueElementId();
        this._updateBoundingRect();
        this._setupInlineEventHandlers();
    },

    isRoot: function () {
        return this.parentElement == null;
    },

    getId: function () {
        return this.sourceElement.getAttribute("data-eyex-id");
    },

    traverse: function (action) {
        if (action(this) === false)
            return false;

        EyeX.utils.forEach(this.childElements, function (childElement) {
            if (childElement.traverse(action) === false)
                return false;
        });
    },

    _cachedInteractor: null,
    createInteractor: function (snapshot) {
        var interactor,
            screenBoundsRect = EyeX.coords.clientToScreen(this.boundingRect),
            oldRect;

        if (this._cachedInteractor) {
            oldRect = this._cachedInteractor.bounds.data;
            if (screenBoundsRect.x === oldRect.x
                && screenBoundsRect.y === oldRect.y
                && screenBoundsRect.width === oldRect.width
                && screenBoundsRect.height === oldRect.height) {
                snapshot.insertInteractor(this._cachedInteractor);
                return;
            }
        }

        interactor = snapshot.createInteractor(this.getId());
        interactor.parentId = this.parentElement.getId();
        interactor.createBounds(EyeX.constants.boundsType.rectangular, screenBoundsRect);

        // TODO: temp hack for now. We need to get window ids some other way!
        interactor.windowId = snapshot.windowIds[0];

        this._createBehaviors(interactor);

        this._cachedInteractor = interactor;
    },

    handleEvent: function (event) {
        var self = this;
        event.getBehaviors().forEach(function (behavior) {
            switch (behavior.type) {
                case EyeX.constants.behaviorType.activatable:
                    self._onActivation(behavior);
                    break;

                case EyeX.constants.behaviorType.pannable:
                    self._onPanning(behavior);
                    break;

                case EyeX.constants.behaviorType.gazeAware:
                    self._onGazeAware(behavior);
                    break;
            }
        });
    },

    on: function (name, callback) {
        name = "data-eyex-" + name;
        this._registerEventCallback(name, callback);
    },

    onActivationFocusChanged: function (hasTentativeActivationFocus, hasActivationFocus) {
        if (this._callEventHandlers(EyeX.DOMElement.hookNames.onActivationFocusChanged, {
            hasTentativeActivationFocus: hasTentativeActivationFocus,
            hasActivationFocus: hasActivationFocus
        })) return;

        if (hasTentativeActivationFocus) {
            EyeX.dom.addClass(this.sourceElement, "eyex-tentativeactivationfocus");
        } else {
            EyeX.dom.removeClass(this.sourceElement, "eyex-tentativeactivationfocus");
        }

        if (hasActivationFocus) {
            EyeX.dom.addClass(this.sourceElement, "eyex-activationfocus");
        }
        else {
            EyeX.dom.removeClass(this.sourceElement, "eyex-activationfocus");
        }
    },

    onActivated: function () {
        if (this._callEventHandlers(EyeX.DOMElement.hookNames.onActivated))
            return;
        this.sourceElement.click();
    },

    onPanningPan: function (data) {
        var id = this.getId();
        // If pan velocity is zero then stop panning.
        if (data.panVelocityX == 0 && data.panVelocityY == 0) {
            EyeX.pan.stop(id);
            return;
        }

        // Update pan velocity.
        var zoom = EyeX.coords.getZoom();
        EyeX.pan.setVelocity(id, this.sourceElement, data.panVelocityX / zoom, data.panVelocityY / zoom);
        if (EyeX.pan.isPanning(id))
            return;

        // Start panning.
        EyeX.pan.start(id);
    },

    onPanningStep: function (data) {
        this.selector.animate({ scrollLeft: "+=" + data.panStepX, scrollTop: "-=" + data.panStepY }, data.panStepDuration);
        if (EyeX.pan.isPanning(this.getId()))
            this.selector.stop();
    },

    onPanningHandsFree: function (data) {
    },

    onGazeEnter: function () {
        if (this._callEventHandlers(EyeX.DOMElement.hookNames.onGazeEnter))
            return;
        this.selector.addClass("eyex-hasgaze");
    },

    onGazeLeave: function () {
        if (this._callEventHandlers(EyeX.DOMElement.hookNames.onGazeLeave))
            return;
        this.selector.removeClass("eyex-hasgaze");
    },

    _ensureUniqueElementId: function () {
        if (!this.getId()) {
            this.sourceElement.setAttribute("data-eyex-id", EyeX.utils.getUniqueId());
        }
    },

    _updateBoundingRect: function () {
        var len, i,
            htmlElement = this.sourceElement,
            style;

        if (EyeX.dom.elementTagName(htmlElement) === "BODY") {
            this._updateBodyBoundingRect();
            //window.addEventListener("scroll", EyeX.utils.proxy(this, this._updateBodyBoundingRect));
            return;
        }

        style = window.getComputedStyle(this.sourceElement);
        if (style.display === "inline") {
            len = htmlElement.children.length;

            if (len > 0 && htmlElement.offsetHeight === 0) {
                // handle inline elements, without offset height, with child elements
                // union child element bounds
                var bounds = EyeX.dom.getElementBounds(htmlElement),
                    left = bounds.x,
                    top = bounds.y,
                    right = bounds.x + bounds.width,
                    bottom = bounds.y + bounds.height;

                for (i = 0; i < len; i++) {
                    bounds = EyeX.dom.getElementBounds(htmlElement.children[0]);
                    left = Math.min(left, bounds.x);
                    top = Math.min(top, bounds.y);
                    right = Math.max(right, bounds.x + bounds.width);
                    bottom = Math.max(bottom, bounds.y + bounds.height);
                }

                this.boundingRect = new EyeX.utils.Rectangle({
                    x: left,
                    y: top,
                    width: right - left,
                    height: bottom - top,
                });
                return;
            }
        }

        this.boundingRect = EyeX.dom.getElementBounds(htmlElement);
    },

    _updateBodyBoundingRect: function () {
        this.boundingRect = new EyeX.utils.Rectangle({
            x: window.pageXOffset,
            y: window.pageYOffset,
            width: window.innerWidth,
            height: window.innerHeight,
        });
    },

    _createBehaviors: function (interactor) {
        // TODO: the behaviors could probably be cached.
        var behaviorsValue = this.sourceElement.getAttribute("data-eyex-behaviors");
        if (!behaviorsValue)
            return;

        var behaviorNames = behaviorsValue.split(" ");
        var self = this;
        behaviorNames.forEach(function (behaviorName) {
            switch (behaviorName) {
                case "activatable":
                    self._createActivatableBehavior(interactor);
                    break;

                case "pannable":
                    self._createPannableBehavior(interactor);
                    break;

                case "gazeaware":
                    self._createGazeAwareBehavior(interactor);
                    break;
            }
        });
    },

    _createActivatableBehavior: function (interactor) {
        var isTentativeFocusEnabled = this.selector.attr("data-eyex-activatable-istentativefocusenabled") == "true";
        interactor.createBehavior(EyeX.constants.behaviorType.activatable, {
            isTentativeFocusEnabled: isTentativeFocusEnabled
        });
    },

    _createPannableBehavior: function (interactor) {
        interactor.createBehavior(EyeX.constants.behaviorType.pannable, {
            panHandsFree: false,
            panningProfile: EyeX.constants.panningProfile.vertical,
            panDirectionsAvailable: EyeX.constants.panDirection.all,
        });
    },

    _createGazeAwareBehavior: function (interactor) {
        interactor.createBehavior(EyeX.constants.behaviorType.gazeAware, {
            gazeAwareMode: EyeX.constants.gazeAwareMode.normal,
            DelayTime: 0.0,
        });
    },

    _onActivation: function (behavior) {
        var data = behavior.data;
        switch (data.activatableEventType) {
            case EyeX.constants.activatableEventType.activationFocusChanged:
                this.onActivationFocusChanged(data.hasTentativeActivationFocus, data.hasActivationFocus);
                break;
            case EyeX.constants.activatableEventType.activated:
                this.onActivated();
                break;
        }
    },

    _onPanning: function (behavior) {
        var data = behavior.data;
        switch (data.pannableEventType) {
            case EyeX.constants.pannableEventType.pan:
                this.onPanningPan(data);
                break;
            case EyeX.constants.pannableEventType.step:
                this.onPanningStep(data);
                break;
            case EyeX.constants.pannableEventType.handsFree:
                this.onPanningHandsFree(data);
                break;
        }
    },

    _onGazeAware: function (behavior) {
        if (behavior.data.hasGaze)
            this.onGazeEnter();
        else
            this.onGazeLeave();
    },


    _setupInlineEventHandlers: function () {
        this._hooks = {};
        var self = this;
        var hookNames = EyeX.utils.getValues(EyeX.DOMElement.hookNames);
        hookNames.forEach(function (hookName) {
            var name = "data-eyex-" + hookName;
            var code = self.selector.attr(name);
            if (!code)
                return;
            window.eyeXHooks = self._hooks;
            var wrappedCode = "window.eyeXHooks['" + name + "'] = function(e) {" + code + "; };";
            eval(wrappedCode);
            window.eyeXHooks = null;
        });
        for (var eventName in this._hooks) {
            var callback = this._hooks[eventName];
            this._registerEventCallback(eventName, callback);
        }
    },

    _callEventHandlers: function (name, behavior) {
        name = "data-eyex-" + name;
        var cancelDefault = false;
        var element = this.selector[0];
        try {
            var callbacks = EyeX.utils.getValueOr(this._eventHandlers, name, []);
            callbacks.forEach(function (callback) {
                cancelDefault = cancelDefault || callback.call(element, {
                    behavior: behavior,
                    element: this,
                }) === false;
            });
        } catch (err) {
            EyeX.logError(err);
        }

        return cancelDefault;
    },

    _registerEventCallback: function (eventName, callback) {
        if (!callback)
            return;
        var callbacks = EyeX.utils.getValueOr(this._eventHandlers, eventName, []);
        callbacks.push(callback);
    },
});

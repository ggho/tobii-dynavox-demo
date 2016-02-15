/**
 * EyeX.MutableInteractorDescriptor
 *
 * Mutable desciptor for interactors. 
 */
EyeX.MutableInteractorDescriptor = EyeX.Class(EyeX.InteractorConfiguration, {

    /**
     * Initializes a new mutable interactor descriptor.
     *
     * @param context:
     *  The EyeX context.
     *
     * @param interactorManager:
     *  The interactor manager to which this interactor descriptor belong.
     *
     * @param boundingRect:
     *  A rectangle describing the bounds of the interactor.
     *
     * @param z:
     *  The z value of the interactor.
     */
    constructor: function (context, interactorManager, boundingRect, parent, z) {
        if (!z)
            z = 0;
        this.context = context;
        this.id = EyeX.utils.getUniqueString();

        this._callbacksByEventName = {
            activationfocuschanged: [],
            activated: [],
            gazeenter: [],
            gazeleave: [],
            panningpan: [],
            panningstep: [],
            panninghandsfree: [],
        };

        this.parent = parent;
        this.boundingRect = boundingRect;
        this._interactorManager = interactorManager;
        this._interactorManager.addInteractorDescriptor(this);

        this._interactor = new EyeX.Interactor(this.context, this._makeIdWithManagerPrefix(this.id));
        this._interactor.parentId = this.parent ? this._makeIdWithManagerPrefix(this.parent.id) : EyeX.constants.literals.rootId;
        this._interactor.z = z;
        this._interactorBounds = this._interactor.createBounds(EyeX.constants.boundsType.rectangular, EyeX.coords.clientToScreen(boundingRect));
    },

    /**
     * Sets the bounding rectangle of the interactor.
     *
     * @param boundingRect:
     *  The bounding rectangle.
     */
    setBoundingRect: function (boundingRect) {
        this._interactorManager.removeInteractorDescriptor(this.id);
        this.boundingRect = boundingRect;
        this.updateScreenBounds();
        this._interactorManager.addInteractorDescriptor(this);
    },

    /**
     * Updates the bounding rectangle in screen spsace.
     */
    updateScreenBounds: function () {
        var screenBoundingRect = EyeX.coords.clientToScreen(this.boundingRect);
        this._interactorBounds.update(screenBoundingRect);
    },

    /**
     * Sets a behavior.
     * 
     * @param behaviorType: 
     *  The type of behavior to set.
     *
     * @param behaviorData:
     *  The data for the behavior. Can be null to clear the behavior.
     */
    setBehavior: function (behaviorType, behaviorData) {
        if (behaviorData == null)
            this._interactor.removeBehavior(behaviorType);
        else
            this._interactor.createBehavior(behaviorType, behaviorData);
    },

    /**
     * Sets the Z value of the interactor.
     *
     * @param z:
     *  The z value.
     */
    setZ: function (z) {
        this._interactor.z = z;
    },

    /**
     * Gets the Z value of the interactor.
     *
     * @returns:
     *  The z value.
     */
    getZ: function () {
        return this._interactor.z;
    },

    /**
     * Sets the mask.
     *
     * @param mask:
     *  The mask on the form: {
     *      rowCount: number of rows
     *      columnCount: number of columns
     *      data: array of mask values (0-255) (Should be Uint8Array for greater performance).
     *  }  
     */
    setMask: function (mask) {
        if (!mask)
            this._interactor.clearMask();
        else
            this._interactor.createMask(mask.rowCount, mask.columnCount, mask.data);
    },

    /**
     * Gets the mask of the interactor.
     *  
     * @returns:
     *  The mask.
     */
    getMask: function () {
        if (!this.mask)
            return null;
        return {
            rowCount: this.mask.rowCount,
            columnCount: this.mask.columnCount,
            data: this.mask.data,
        };
    },

    /** 
     * Handles an event. 
     * The event will be unpacked and the correct message handlers will be called.
     * If this class is inherited, the on[eventName] methods can be overridden.
     * 
     * @param event:
     *  The event.
     */
    handleEvent: function (event) {
        var behaviors = event.getBehaviors();
        for (var i = 0, len = behaviors.length; i < len; i++) {
            var behavior = behaviors[i];
            switch (behavior.type) {
                case EyeX.constants.behaviorType.activatable:
                    this._onActivation(behavior);
                    break;

                case EyeX.constants.behaviorType.pannable:
                    this._onPanning(behavior);
                    break;

                case EyeX.constants.behaviorType.gazeAware:
                    this._onGazeAware(behavior);
                    break;
            }
        }
    },

    /**
     * Populates the snapshot with the interactor for which this is a description.
     *
     * @param snapshot:
     *  The snapshot to populate.
     */
    populateSnapshot: function (snapshot) {
        this._interactor.windowId = snapshot.windowIds[0]; // Should be assigned somewhere else.
        snapshot.insertInteractor(this._interactor);
    },

    /**
     * Called when the activation focus has changed.
     *
     * @param data:
     *  The data for the event.
     *  
     * @returns:
     *  True if the default action should be performed, otherwise false.
     */
    onActivationFocusChanged: function (data) {
        return this._callEventHandlers("activationfocuschanged", data);
    },

    /**
     * Called when this interactor has been activated.
     *
     * @param data:
     *  The data for the event.
     *  
     * @returns:
     *  True if the default action should be performed, otherwise false.
     */
    onActivated: function () {
        return this._callEventHandlers("activated");
    },

    /**
     * Called when this interactor has been panned.
     *
     * @param data:
     *  The data for the event.
     *  
     * @returns:
     *  True if the default action should be performed, otherwise false.
     */
    onPanningPan: function (data) {
        return this._callEventHandlers("panningpan", data);
    },

    /**
     * Called when this interactor has been should pan step.
     *
     * @param data:
     *  The data for the event.
     *  
     * @returns:
     *  True if the default action should be performed, otherwise false.
     */
    onPanningStep: function (data) {
        return this._callEventHandlers("panningstep", data);
    },

    /**
     * Called when this interactor has been should panned hands free.
     *
     * @param data:
     *  The data for the event.
     *  
     * @returns:
     *  True if the default action should be performed, otherwise false.
     */
    onPanningHandsFree: function (data) {
        return this._callEventHandlers("panninghandsfree", data);
    },

    /**
     * Called when the gaze point has entered this interactor.
     *
     * @param data:
     *  The data for the event.
     *  
     * @returns:
     *  True if the default action should be performed, otherwise false.
     */
    onGazeEnter: function () {
        return this._callEventHandlers("gazeenter");
    },

    /**
     * Called when the gaze point has left the interactor.
     *
     * @param data:
     *  The data for the event.
     *  
     * @returns:
     *  True if the default action should be performed, otherwise false.
     */
    onGazeLeave: function () {
        return this._callEventHandlers("gazeleave");
    },

    /**
     * Registers an event callback.
     *
     * @param eventName:
     *  The name of the event for which to register the callback.
     *
     * @param callback:
     *  The callback for the event.
     */
    registerEventCallback: function (eventName, callback) {
        if (!callback)
            return;
        var callbacks = this._callbacksByEventName[eventName];
        if (!callbacks)
            throw "Unknown event name: " + eventName;
        callbacks.push(callback);
    },

    /**
     * Calls all handlers for the specified event.
     *      
     * @param eventName:
     *  The name of the event for which the handles should be called.
     *
     * @param data:
     *  The data for the event.
     *  
     * @returns:
     *  True if the default action should be performed, otherwise false.
     */
    _callEventHandlers: function (eventName, data) {
        var performDefaultAction = true;
        var callbacks = EyeX.utils.getValueOr(this._callbacksByEventName, eventName, []);
        for (var i = 0, len = callbacks.length; i < len; i++) {
            try {
                var callback = callbacks[i];
                if (callback.call(this, { data: data, /* element: this, */ }) === false)
                    performDefaultAction = false;
            }
            catch (err) {
                EyeX.logError(err);
            }
        }

        return performDefaultAction;
    },

    /**
     * Called when an activation event has occuered.
     * Will dispatch the event to the appropirate handler.
     *
     * @param behavior:
     *  Behavior for the event containing the data.
     */
    _onActivation: function (behavior) {
        var data = behavior.data;
        switch (data.activatableEventType) {
            case EyeX.constants.activatableEventType.activationFocusChanged:
                this.onActivationFocusChanged(data);
                break;
            case EyeX.constants.activatableEventType.activated:
                this.onActivated();
                break;
        }
    },

    /**
    * Called when a panning event has occuered.
    * Will dispatch the event to the appropirate handler.
    *
    * @param behavior:
    *  Behavior for the event containing the data.
    */
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

    /**
    * Called when a gaze aware event has occuered.
    * Will dispatch the event to the appropirate handler.
    *
    * @param behavior:
    *  Behavior for the event containing the data.
    */
    _onGazeAware: function (behavior) {
        if (behavior.data.hasGaze)
            this.onGazeEnter();
        else
            this.onGazeLeave();
    },

    /**
    * Called when an action event has occuered.
    * Will dispatch the event to the appropirate handler.
    *
    * @param behavior:
    *  Behavior for the event containing the data.
    */
    _makeIdWithManagerPrefix: function (id) {
        return this._interactorManager.id + "/" + id;
    }
});


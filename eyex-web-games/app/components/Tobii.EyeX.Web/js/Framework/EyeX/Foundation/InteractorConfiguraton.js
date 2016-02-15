/**
 * EyeX.InteractorConfiguration
 *
 * Facade used for easy configuration of interactor descriptors.
 */
EyeX.InteractorConfiguration = EyeX.Class(EyeX.CommonBase, {

    /**
     * Initializes the interactor configuration.
     *
     * @param interactorDescriptor:
     *  The interactor descriptor that should be configured.
     */
    constructor: function (interactorDescriptor, interactorManager) {
        this._interactorDescriptor = interactorDescriptor;
        this._interactorManager = interactorManager;
    },

    /**
     * Gets the interactor descriptor.
     * Will throw if the interactor descriptor has been removed. i.e. made this configuration invalid.
     * 
     * @returns:
     *  The interactor descriptor.
     */
    getInteractorDescriptor: function () {
        if (!this._interactorDescriptor)
            throw "Invalid InteractorConfiguration";
        return this._interactorDescriptor;
    },

    /**
     * Determines if this interactor configuration is valid.
     *
     * @returns:
     *  True if valid, otherwise false.
     */
    isValid: function () {
        return !!this._interactorDescriptor;
    },

    /**
     * Removes the interactor descriptor from its interactor manager.
     * This interactor configuration is no longer valid and will throw if any configuration operation is performed.
     */
    remove: function () {
        var interactorDescriptor = this.getInteractorDescriptor();
        this._interactorManager.removeInteractorDescriptor(interactorDescriptor.id);
        delete this._interactorDescriptor;
    },

    /**
     * Sets the bounding rect of the interactor.
     * 
     * @param x: 
     *  The x position.
     * 
     * @param y:
     *  The y position.
     *
     * @param width:
     *  The width of the interactor.
     *
     * @param height:
     *  The height of the interactor.
     *
     * @returns:
     *  This interactor configuration, for chaining.
     */
    setBounds: function (x, y, width, height) {
        var boundingRect = EyeX.utils.Rectangle.fromComponents(x, y, width, height);
        this.getInteractorDescriptor().setBoundingRect(boundingRect);
        return this;
    },

    /**
     * Gets the bounding rect of the interactor.
     *
     * @returns:
     *  The bounding rect.
     */
    getBounds: function () {
        return this.getInteractorDescriptor().boundingRect;
    },

    /**
     * Sets the z of the interactor.
     *
     * @param z:
     *  The z value.
     *
     * @returns:
     *  This interactor configuration, for chaining.
     */
    setZ: function (z) {
        this.getInteractorDescriptor().setZ(z);
        return this;
    },

    /**
     * Gets the z of the interactor.
     *
     * @returns:
     *  The z value.
     */
    getZ: function () {
        return this.getInteractorDescriptor().getZ();
    },

    /**
     * Sets the mask of the interactor.
     *
     * @param mask:
     *  The mask on the form: {
     *      rowCount: number of rows
     *      columnCount: number of columns
     *      data: array of mask values (0-255) (Should be Uint8Array for greater performance).
     *  }
     *
     * @returns:
     *  This interactor configuration, for chaining.
     */
    setMask: function (mask) {
        this.getInteractorDescriptor().setMask(mask);
        return this;
    },

    /**
     * Gets the mask of the interactor.
     *  
     * @returns:
     *  The mask.
     */
    getMask: function () {
        this.getInteractorDescriptor().getMask();
    },

    /**
     * Sets a behavior on the interactor.
     *
     * @param behaviorType:
     *  The type of behavior to set.
     *
     * @param behaviorDataOrConfigurationFn.
     *  The behavior data or a function which will return behavior data.
     *
     * @returns:
     *  This interactor configuration, for chaining.
     */
    setBehavior: function (behaviorType, behaviorDataOrConfigurationFn) {
        var data = EyeX.utils.callIfFunction(behaviorDataOrConfigurationFn);
        this.getInteractorDescriptor().setBehavior(behaviorType, data);
        return this;
    },

    /**
     * Removes a behavior of a specified type.
     *
     * @param behaviorType:
     *  The type of behavior to remove.
     *
     * @returns:
     *  This interactor configuration, for chaining.
     */
    clearBehavior: function (behaviorType) {
        this.getInteractorDescriptor().setBehavior(behaviorType, null);
        return this;
    },

    /**
     * Makes the interactor activatable.
     *
     * @param isTentativeFocusEnabled:
     *  Specifies if tentative activation focus should be enabled. (default = true)
     *
     * @returns:
     *  This interactor configuration, for chaining.
     */
    makeActivatable: function (isTentativeFocusEnabled) {
        return this.setBehavior(EyeX.constants.behaviorType.activatable, {
            isTentativeFocusEnabled: EyeX.utils.getSelfOr(isTentativeFocusEnabled, true)
        });
    },

    /**
     * Makes the interactor pannable.
     *
     * @param panningProfile:
     *  Specifies the panning profile. (default = vertical)
     *
     * @param panDirectionsAvailable:
     *  Specifies which pan directions that should be available. (default = all)
     *
     * @returns:
     *  This interactor configuration, for chaining.
     */
    makePannable: function (panningProfile, panDirectionsAvailable) {
        return this.setBehavior(EyeX.constants.behaviorType.pannable, {
            panHandsFree: false, // TODO: is this available?
            panningProfile: EyeX.utils.getSelfOr(panningProfile, EyeX.constants.panningProfile.vertical),
            panDirectionsAvailable: EyeX.utils.getSelfOr(panDirectionsAvailable, EyeX.constants.panDirection.all)
        });
    },

    /**
     * Makes the interactor gaze aware.
     *
     * @param gazeAwareMode:
     *  Specifies the gaze aware mode. (default = normal)
     *
     * @param delayTime:
     *  Specifies the delay time if applicable. (default = 0.0)
     *
     * @returns:
     *  This interactor configuration, for chaining.
     */
    makeGazeAware: function (gazeAwareMode, delayTime) {
        return this.setBehavior(EyeX.constants.behaviorType.gazeAware, {
            gazeAwareMode: EyeX.utils.getSelfOr(gazeAwareMode, EyeX.constants.gazeAwareMode.normal),
            delayTime: EyeX.utils.getSelfOr(delayTime, 0.0),
        });
    },

    /**
     * Hooks the activation focus changed event.
     * 
     * @param callback:
     *  The function to call when the event occurs.
     *
     * @returns:
     *  This interactor configuration, for chaining.
     */
    activationFocusChanged: function (callback) {
        return this.on("activationfocuschanged", callback);
    },

    /**
     * Hooks the activated event.
     * 
     * @param callback:
     *  The function to call when the event occurs.
     *
     * @returns:
     *  This interactor configuration, for chaining.
     */
    activated: function (callback) {
        return this.on("activated", callback);
    },

    /**
     * Hooks the gaze enter event.
     * 
     * @param callback:
     *  The function to call when the event occurs.
     *
     * @returns:
     *  This interactor configuration, for chaining.
     */
    gazeEnter: function (callback) {
        return this.on("gazeenter", callback);
    },

    /**
     * Hooks the gaze leave event.
     * 
     * @param callback:
     *  The function to call when the event occurs.
     *
     * @returns:
     *  This interactor configuration, for chaining.
     */
    gazeLeave: function (callback) {
        return this.on("gazeleave", callback);
    },

    /**
     * Hooks the panning pan event.
     * 
     * @param callback:
     *  The function to call when the event occurs.
     *
     * @returns:
     *  This interactor configuration, for chaining.
     */
    panningPan: function (callback) {
        return this.on("panningpan", callback);
    },

    /**
     * Hooks the panning step event.
     * 
     * @param callback:
     *  The function to call when the event occurs.
     *
     * @returns:
     *  This interactor configuration, for chaining.
     */
    panningStep: function (callback) {
        return this.on("panningstep", callback);
    },

    /**
     * Hooks the panning hands free event.
     * 
     * @param callback:
     *  The function to call when the event occurs.
     *
     * @returns:
     *  This interactor configuration, for chaining.
     */
    panningHandsFree: function (callback) {
        return this.on("panninghandsfree", callback);
    },

    /**
     * Hooks any event by name.
     * 
     * @param eventName: 
     *  The name of the event to hook.
     *
     * @param callback:
     *  The function to call when the event occurs.
     *
     * @returns:
     *  This interactor configuration, for chaining.
     */
    on: function (eventName, callback) {
        this.getInteractorDescriptor().registerEventCallback(eventName, callback);
        return this;
    },
});

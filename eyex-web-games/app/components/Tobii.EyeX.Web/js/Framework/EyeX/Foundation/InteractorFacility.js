/**
 * EyeX.InteractorFacility 
 *
 * Facade used to create and access interactor configurations.
 * The interactor facilicity creates and wraps an internal EyeX.InteractorManager.
 * Whenever an EyeX.InteractorConfiguration is created a EyeX.MutableInteractorDescriptor is created and added to the interactor manager.
 */
EyeX.InteractorFacility = EyeX.Class(EyeX.CommonBase, {

    /**
     * Initializes the EyeX.InteractorFacility.
     *
     * @param context:
     *  The EyeX context.
     *
     * @param boundingRect:
     *  The size of the "canvas" on which interactors can be placed. 
     */
    constructor: function (context, boundingRect) {
        this.context = context;
        this._interactorManager = new EyeX.CachingInteractorManager(boundingRect);
        EyeX.agent.addInteractorManager(this._interactorManager);
    },

    /**
     * Creates an interactor configuration with the specified parameters.
     *
     * @param x:
     *  The x position of the interactor. (In client coordinates)
     *
     * @param y:
     *  The y position of the interactor. (In client coordinates)
     
     * @param width:
     *  The width of the interactor. (In client coordinates)
     *
     * @param height:
     *  The height of the interactor. (In client coordinates)
     *
     * @param parent:
     *  The interactor configuration for the parent or null if this interactor is a root.
     *
     * @param z:
     *  The z value of the interactor. Will be 0 if no value is specified.
     *
     * @returns:
     *  An interactor configuration on which additional configuration can be performed.
     */
    create: function (x, y, width, height, parent, z) {
        var boundingRect = EyeX.utils.Rectangle.fromComponents(x, y, width, height);
        var interactorDescriptor = new EyeX.MutableInteractorDescriptor(this.context, this._interactorManager, boundingRect, parent, z);
        var interactorConfiguration = new EyeX.InteractorConfiguration(interactorDescriptor, this._interactorManager);
        return interactorConfiguration;
    },

    /**
     * Gets a interactor configuration from an id.
     *
     * @param interactorId:
     *  The id of the interactor for which to get a configuration.
     *
     * @returns:
     *  An interactor configuration for the specified interactor if found, otherwise null.
     */
    get: function (interactorId) {
        var interactorDescriptor = this._interactorManager.getInteractorDescriptor(interactorId);
        if (!interactorDescriptor)
            return null;
        var interactorConfiguration = new EyeX.InteractorConfiguration(interactorDescriptor);
        return interactorConfiguration;
    },
});

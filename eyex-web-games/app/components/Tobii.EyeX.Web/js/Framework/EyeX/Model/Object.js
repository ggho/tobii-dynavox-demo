/**
 * EyeX.Object
 * 
 * Base class for objects belonging to an EyeX.Context.
 */
EyeX.Object = EyeX.Class(EyeX.CommonBase, {

    /**
     * Initializes a Behavior.
     *
     * @param context:
     *  The EyeX Context to which this behavior belongs.
     */
    constructor: function (context) {
        this.context = context;
    }
});

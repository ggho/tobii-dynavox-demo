/**
 * EyeX.Bounds
 * 
 * Represents a bounds structure on an EyeX.Interactor.
 * The bounds are used to describe the spatial claim of an interactor.
 */
EyeX.Bounds = EyeX.Class(EyeX.Object, {
    
    /**
     * Initializes a Bounds object.
     *
     * @param context:
     *  The EyeX Context to which this bounds object belongs.
     *
     * @param type:
     *  The type of the bounds object.
     *
     * @param data:
     *  The data of the bounds objects.
     */
    constructor: function (context, type, data) {
        EyeX.Bounds.$super.call(this, context);
        this.type = type;
        this.data = data;
    },
    
    /**
     * Updates the data.
     *
     * @param data:
     *  The new data.
     */
    update: function(data) {
        this.data = data;
    },
    
    /**
     * Creates a contract contaning the content of the bounds.
     */
    toContract: function () {
        return {
            boundsType: this.type,
            data: this.data
        };
    },

    /**
     * Converts the bounds data to a rect.
     */
    toRect: function() {
        return {
            x: this.data.x,
            y: this.data.y,
            width: this.data.width,
            height: this.data.height,
        };
    },
});
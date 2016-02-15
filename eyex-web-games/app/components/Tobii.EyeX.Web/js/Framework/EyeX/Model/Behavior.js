/**
 * EyeX.Behavior
 * 
 * Represents a behavior on an EyeX.Interactor.
 * A behavior is used to specify how an interactor should work.
 */
EyeX.Behavior = EyeX.Class(EyeX.Object, {

    /**
     * Initializes a Behavior.
     *
     * @param context:
     *  The EyeX Context to which this behavior belongs.
     *
     * @param type:
     *  The type of the behavior.
     *
     * @param data:
     *  The data of the behavior.
     */
    constructor: function (context, type, data) {
        EyeX.Behavior.$super.call(this, context);
        this.type = type;
        this.data = data;
    },

    /**
     * Creates a contract contaning the content of the behavior.
     */
    toContract: function () {
        var dataContract = this._getDataContract();
        return {
            behaviorType: this.type,
            data: dataContract
        };
    },

    /**
     * Gets the data of the behavior.
     */
    _getDataContract: function() {
        return this.data;
    }
});

/**
 * EyeX.Query
 * 
 * Represents a query sent from the EyeX Engine. 
 */
EyeX.Query = EyeX.Class(EyeX.Object, {

    /**
    * Initializes a Query.
    *
    * @param context:
    *  The EyeX Context to which this query belongs.
    *
    * @param contract:
    *  The contract for the query.
    */
    constructor: function (context, contract) {
        EyeX.Query.$super.call(this, context);
        var boundsContract = contract.data.bounds;
        this._bounds = new EyeX.Bounds(context, boundsContract.type, boundsContract.data);
        this._windowIds = contract.data.windowIds;
    },

    /**
     * Gets the bounds of the query.
     */
    getBounds: function() {
        return this._bounds;
    },

    /**
     * Gets the window ids of the query.
     */
    getWindowIds: function () {
        return this._windowIds;
    },
});
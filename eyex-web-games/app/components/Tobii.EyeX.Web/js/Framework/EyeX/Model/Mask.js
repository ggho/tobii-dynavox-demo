/**
 * EyeX.Mask
 * 
 * Represents an interaction mask.
 */
EyeX.Mask = EyeX.Class(EyeX.Object, {

    /**
     * Initializes a Mask.
     *
     * @param context:
     *  The EyeX Context to which this mask belongs.
     *
     * @param rowCount:
     *  The number of rows in the mask.
     *
     * @param columnCount:
     *  The number of columns in the mask.
     *
     * @param data:
     *  The data for the mask.
     */
    constructor: function (context, rowCount, columnCount, data) {
        EyeX.Mask.$super.call(this, context);
        this.columnCount = columnCount;
        this.rowCount = rowCount;
        if (data && !(data instanceof Uint8Array))
            data = new Uint8Array(data);
        this.data = data;
    },

    /**
     * Converts the mask to a contract.
     */
    toContract: function () {
        return {
            columnCount: this.columnCount,
            rowCount: this.rowCount,
            data: EyeX.utils.blobToBase64String(this.data),
        };
    },
});
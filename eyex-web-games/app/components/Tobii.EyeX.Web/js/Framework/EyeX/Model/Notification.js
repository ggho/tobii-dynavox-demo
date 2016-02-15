/**
 * EyeX.Notification
 * 
 * Represents a notification sent from the EyeX Engine. 
 */
EyeX.Notification = EyeX.Class(EyeX.Object, {

    /**
    * Initializes a notification.
    *
    * @param context:
    *  The EyeX Context to which this notification belongs.
    *
    * @param contract:
    *  The contract for the notification.
    */
    constructor: function(context, contract) {
        EyeX.Notification.$super.call(this, context);
        this._notificationType = contract.data.notificationType;
        this._data = contract.data.data;
    },

    /**
     * Gets the interactor id.
     */
    getNotificationType: function() {
        return this._notificationType;
    },

    /**
     * Gets the data.
     */
    getData: function() {
        return this._data;
    },
});
/**
 * EyeX.Event
 * 
 * Represents an event sent from the EyeX Engine. 
 */
EyeX.Event = EyeX.Class(EyeX.Object, {

    /**
    * Initializes an Event.
    *
    * @param context:
    *  The EyeX Context to which this event belongs.
    *
    * @param contract:
    *  The contract for the event.
    */
    constructor: function(context, contract) {
        EyeX.Event.$super.call(this, context);
        this._interactorId = contract.data.interactorId;  
        this._behaviors = {};
        var self = this;
        EyeX.utils.forEachValue(contract.data.behaviors, function(behaviorContract) {
            var behaviorType = behaviorContract.behaviorType;
            var behavior = new EyeX.Behavior(this.context, behaviorType, behaviorContract.data);
            self._behaviors[behaviorType] = behavior;
        });
    },

    /**
     * Gets the interactor id.
     */
    getInteractorId: function() {
        return this._interactorId;
    },

    /**
     * Gets a behavior of a specified type.
     */
    getBehavior: function(behaviorType) {
        return this._behaviors[behaviorType];
    },

    /**
     * Gets all behaviors.
     */
    getBehaviors: function() {
        return EyeX.utils.getValues(this._behaviors);
    }
});
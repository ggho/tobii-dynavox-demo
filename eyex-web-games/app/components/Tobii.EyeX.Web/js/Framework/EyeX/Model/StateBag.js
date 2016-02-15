/**
 * EyeX.StateBag
 * 
 * Represents a state bag.
 */
EyeX.StateBag = EyeX.Class(EyeX.Object, {

    /**
    * Initializes a StateBag.
    *
    * @param context:
    *  The EyeX Context to which this state bag belongs.
    *
    * @param contract:
    *  The contract for the state bag.
    */
    constructor: function (context, contract) {
        EyeX.StateBag.$super.call(this, context);
        this.statePath = contract.statePath;
        this.data = contract.data;
    },
});
/**
 * EyeX.Behavior
 * 
 * Represents a command that can be executed in the EyeX Engine.
 */
EyeX.Command = EyeX.Class(EyeX.Object, {

    /**
     * Initializes a Command.
     *
     * @param context:
     *  The EyeX Context to which this command belongs.
     *
     * @param type:
     *  The type of the command.
     *
     * @param data:
     *  The data of the command.
     */
    constructor: function (context, type, data) {
        EyeX.Command.$super.call(this, context);
        this.type = type;
        this.data = data;
    },

    /**
     * Executes the command.
     *
     * @returns: 
     *  A deferred which will be resolved if the command was successfully executed in the EyeX Engine, otherwise rejected.
     */
    executeAsync: function() {
        var contract = this.toContract();
        return this.context.communicator.sendRequest(EyeX.constants.requestType.command, contract);
    },

    /**
     * Creates a contract contaning the content of the command.
     */
    toContract: function () {
        return {
            commandType: this.type,
            data: this.data,
        };
    }
});

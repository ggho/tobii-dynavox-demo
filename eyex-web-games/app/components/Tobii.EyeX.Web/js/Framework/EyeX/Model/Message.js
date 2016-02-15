/**
 * EyeX.Message
 * 
 * Basic message container used to send messages betweeen Web client and EyeX Engine.
 */
EyeX.Message = EyeX.Class({

    /**
     * Initializes a Message.
     *
     * @param header:
     *  The header of the message.
     *
     * @param body:
     *  The body of the message.
     */
    constructor: function(header, body) {
        this.header = header;
        this.body = body;
    },

    /**
     * Creates a contract contaning the content of the message.
     */
    toContract: function() {
        return {
            header: this.header,
            body: this.body
        };
    },
});


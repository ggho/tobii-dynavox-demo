/**
 * Simple logging framework used throughout the EyeX Web Binding source code.
 */
EyeX.extend({

    /**
     * Writes a log message for a specified level.
     * 
     * @param: level
     *  The log level.
     *
     * @param: message
     *  The message.
     */
    log: function (level, message) {
        if(!this._disabledLogLevels[level])
            console.log(level + ": " + message);
    },

    /**
      * Writes a log message using "debug" log level.
      *
      * @param: message
      *  The message.
      */
    logDebug: function(message) {
        EyeX.log("debug", message);
    },

    /**
      * Writes a log message using "info" log level.
      *
      * @param: message
      *  The message.
      */
    logInfo: function(message) {
        EyeX.log("info", message);
    },

    /**
      * Writes a log message using "warning" log level.
      *
      * @param: message
      *  The message.
      */
    logWarning: function(message) {
        EyeX.log("warning", message);
    },

    /**
      * Writes a log message using "error" log level.
      *
      * @param: message
      *  The message.
      */
    logError: function(message) {
        EyeX.log("error", message);
    },

    /**
     * Enables or disables a specified log level.
     */
    setLogLevelEnabled: function(level, isEnabled) {
        this._disabledLogLevels[level] = !isEnabled;
    },

    _disabledLogLevels: {},
});

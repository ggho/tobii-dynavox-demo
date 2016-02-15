/**
 * Container for EyeX Web API.
 *
 * EyeX has a the following dependencies:
 *      jQuery - http://jquery.com/
 *      jsFace - https://github.com/tnhu/jsface
 */
var EyeX = {
    
    /**
     * Helpers used to mixin extensions to EyeX.
     *
     * @param: extension
     *  The extension to mixin.
     */
    extend: function (extension) {
        EyeX.utils.extend(this, extension, true);
    },

    /**
     * Gets the current time in "EyeX server time".
     */
    now: function () {
        var value = Date.now() - EyeX.constants.timeDiff - 0.00001; // Temp hack to make sure timestamps are always "doubles"
        if (value > EyeX._lastNow)
            EyeX._lastNow = value;
        return EyeX._lastNow;
    },
    _lastNow: 0.0,
};

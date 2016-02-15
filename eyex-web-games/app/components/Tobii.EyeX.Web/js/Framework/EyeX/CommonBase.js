/**
 * EyeX.CommonBase
 * 
 * Common base class with nice to have stuff for all classes.
 */
EyeX.CommonBase = EyeX.Class({

    /**
     * Helper used to provide this to anonymous functions.
     */
    proxy: function(fn) {
        return EyeX.utils.proxy(this, fn);
    }
});

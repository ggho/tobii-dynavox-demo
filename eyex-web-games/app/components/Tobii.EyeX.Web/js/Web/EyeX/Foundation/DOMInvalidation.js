EyeX.DOMInvalidation = EyeX.Class(function () {
    var MutationObserver = MutationObserver || WebKitMutationObserver || MozMutationObserver;

    return {
        constructor: function () {
            this._mutationObserver = new MutationObserver(EyeX.utils.proxy(this, this._onMutation));
        },
        
        initialize: function() {
            if (this._initialized) {
                return;
            }
            this._initialized = true;
            
            // defer observer if page is still loading
            if (!this._tryStart()) {
                document.addEventListener("readystatechange", EyeX.utils.proxy(this, this._tryStart));
            }
        },

        addMutationHandler: function (func) {
            this._mutationHandlers.push(func);
        },

        startMutationObserver: function () {
            if (this._started) {
                return;
            }

            this._started = true;
            this._mutationObserver.observe(document.querySelector("body"), {
                attributes: true,
                childList: true,
                subtree: true,
                characterData: true
            });
        },
        
        _tryStart: function() {
            if (document.readyState === "complete") {
                this.startMutationObserver();
                return true;
            }
            return false;
        },

        _onMutation: function (mutations) {
            var i, len;
            for (i = 0, len = this._mutationHandlers.length; i < len; i++) {
                this._mutationHandlers[i](mutations);
            }
        },
        
        _mutationHandlers: []
    };
});
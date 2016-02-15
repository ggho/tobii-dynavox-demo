/**
 * EyeX.utils
 *
 * Nice to have components that makes developing the Web Binding easier.
 */
EyeX.utils = {

    // Proxy function used for hitching.
    proxy: function (ctx, fn) {
        return function () {
            if (fn)
                fn.apply(ctx, arguments);
        };
    },

    // Ignore all but last call within time frame
    debounce: function (ctx, fn, timeFrame) {
        var timer = null,
            debounceFunc = function () {
                var args = arguments;
                window.clearTimeout(timer);
                timer = window.setTimeout(function () {

                    fn.apply(ctx, args);
                }, timeFrame);
            };
        debounceFunc.cancel = function () {
            window.clearTimeout(timer);
        };

        return debounceFunc;
    },

    //proxy: function (ctx, fn, args) {
    //    if (args && args.length > 0) {
    //        var mergedArgs = [];
    //        mergedArgs.concat(arguments);
    //        mergedArgs.concat(args);
    //        args = mergedArgs;
    //    } else {
    //        args = arguments;
    //    }
    //    return function () {
    //        if (fn)
    //            fn.apply(ctx, args);
    //    };
    //},

    // Deep clones an object.
    clone: function (obj) {
        if (Array.isArray(obj)) {
            var clone = [];
            for (var i = 0, len = obj.length; i < len; i++) {
                var clonedValue = EyeX.utils.clone(obj[i]);
                clone.push(clonedValue);
            }
            return clone;
        }

        if (typeof obj == "object")
            return EyeX.utils.extend({}, obj, true);

        return obj;
    },

    // Extends an object with the content of another. (optionally recursive)
    extend: function (target, source, deep) {
        var keys = EyeX.utils.getKeys(source);
        for (var i = 0, len = keys.length; i < len; i++) {
            var key = keys[i];

            // No recursion, just copy value.
            if (!deep) {
                target[key] = source[key];
                continue;
            }

            // If source value is object and target value is object. Mixin source in target.
            var sourceValue = source[key];
            if (typeof (sourceValue) == "object") {
                var targetValue = target[key];
                if (targetValue && typeof targetValue == "object") {
                    EyeX.utils.extend(targetValue, sourceValue, true);
                    continue;
                }
            }

            // Just override target.
            target[key] = EyeX.utils.clone(sourceValue);
        }
        return target;
    },

    // Gets the keys of an object, or empty array if not an object.
    getKeys: function (obj) {
        if (typeof obj == "object")
            return Object.keys(obj);
        return [];
    },

    // Gets the values of an object as an array.
    getValues: function (obj) {
        var values = [];
        for (key in obj)
            values.push(obj[key]);
        return values;
    },

    // Gets the value for a specified key from an object or invokes the callback to create a value for the key.
    getValueOr: function (obj, key, fallback) {
        var value = obj[key];
        if (value == undefined) {
            value = EyeX.utils.callIfFunction(fallback);
            obj[key] = value;
        }
        return value;
    },

    // If obj is undefined, gets fallback value, otherwise obj it self.
    getSelfOr: function(obj, fallback) {
        if(obj == undefined)
            return EyeX.utils.callIfFunction(fallback);
        return obj;
    },

    // Invokes a callback on each value in an object.
    forEachValue: function (obj, callback) {
        for (var key in obj) {
            var value = obj[key];
            if (callback(value) === false)
                return;
        }
    },

    // Invokes a callback on each element in an array.
    forEach: function (array, callback) {
        for (var i = 0, len = array.length; i < len; i++)
            if (callback(array[i]) === false)
                break;
    },

    // Calls a specified function with the given arguments if not null.
    safeCall: function (fn) {
        if (fn) {
            var args = Array.prototype.slice.call(arguments, 1);
            fn.apply(this, args);
        }
    },

    callIfFunction: function(objOrFn) {
        if (typeof objOrFn == "function")
            objOrFn = objOrFn();
        return objOrFn;
    },

    // Helper used to rename keys in JSON objects. Typically used to translate from user friendly keys to literals.
    renameKeys: function (source, newKeys) {
        if (Array.isArray(source)) {
            var target = [];
            for (var i = 0, len = source.length; i < len; i++) {
                var value = source[i];
                if (typeof value === "object")
                    value = EyeX.utils.renameKeys(value, newKeys);
                target.push(value);
            }
            return target;
        }
        var target = {};
        var oldKeys = Object.keys(source);
        for (var i = 0, len = oldKeys.length; i < len; i++) {
            var oldKey = oldKeys[i];
            var value = source[oldKey];
            if (typeof value === "object")
                value = EyeX.utils.renameKeys(value, newKeys);
            var newKey = newKeys[oldKey];
            if (newKey)
                target[newKey] = value;
            else
                target[oldKey] = value;
        }
        return target;
    },

    // Gets a unique id.
    getUniqueId: function () {
        return EyeX.utils._uniqueIdCounter++;
    },

    //Gets a unique string
    getUniqueString: function (prefix) {
        if (prefix == undefined)
            prefix = "";
        return prefix + EyeX.utils.getUniqueId();
    },

    _uniqueIdCounter: 1,

    // Determines if two values are almost equal.
    almostEquals: function (v0, v1, threshold) {
        return Math.abs(v0 - v1) < threshold;
    },

    // Converts a point to a string "x,y".
    pointToString: function (point) {
        return point.x + "," + point.y;
    },

    // Converts a size to a string "width,height"
    sizoToString: function (size) {
        return size.width + "," + size.height;
    },

    // Converts a rect to a string "x,y,width,height"
    rectToString: function(rect) {
        return rect.x + "," + rect.y + "," + rect.width + "," + rect.height;
    },

    // Converts a blob (Uint8Array) to a base64 string.
    blobToBase64String: function(arr) {
        return btoa(String.fromCharCode.apply(null, arr));
    },

    // Converts a base64 string to a blob (Uint8Array).
    base64StringToBlob: function(blob) {
        return new Uint8Array(atob(b64encoded).split("").map(function(c) {
            return c.charCodeAt(0);
        }));
    },

    // Simple impl of a Deferred task.
    Deferred: EyeX.Class({
        $statics: {
            whenAll: function (promises, args) {
                var def = new EyeX.utils.Deferred();
                var count = promises.length;
                if (count == 0) 
                    return def.resolve([]);
                var results = new Array(count);
                for (var i = 0, len = count; i < len; i++) {
                    var index = i;
                    var promise = promises[index];
                    if (typeof promise == "function")
                        promise = promise.apply(this, args);
                    promise
                        .done(function (result) {
                            results[index] = result;
                            if (--count == 0)
                                def.resolve(results);
                        })
                        .fail(function () {
                            def.reject();
                        });
                }
                return def.promise();
            }
        },

        constructor: function () {
            this.isResolved = false;
            this.isRejected = false;
            this._doneCallbacks = [];
            this._failCallbacks = [];
        },

        done: function (callback) {
            if (!callback)
                return this;
            if (this.isResolved) {
                callback(this.result);
                return this;
            }
            this._doneCallbacks.push(callback);
            return this;
        },

        fail: function (callback) {
            if (!callback)
                return this;
            if (this.isRejected) {
                callback();
                return this;
            }
            this._failCallbacks.push(callback);
            return this;
        },

        resolve: function (result) {
            if (this.isResolved || this.isRejected)
                return this;
            this.result = result;
            this.isResolved = true;
            for (var i = 0, len = this._doneCallbacks.length; i < len; i++)
                this._doneCallbacks[i](this.result);
            return this;
        },

        reject: function () {
            if (this.isResolved || this.isRejected)
                return this;
            this.isRejected = true;
            for (var i = 0, len = this._failCallbacks.length; i < len; i++)
                this._failCallbacks[i]();
            return this;
        },

        promise: function () {
            return this; // Ugly but works for now.
        }
    }),

    // Helper to perform async loops.
    AsyncLoop: EyeX.Class({
        constructor: function (callback, startDelayTimeMs, defaultNextTimeout) {
            this._callback = callback;
            this._startTimeMs = Date.now();
            if (!startDelayTimeMs)
                startDelayTimeMs = 0;
            if (!defaultNextTimeout)
                this._defaultNextTimeout = 0;
            this._setTimeout(startDelayTimeMs);
        },

        next: function (delayTime) {
            this._setTimeout(delayTime);
        },

        stop: function () {
            if (this._timeoutHandle)
                clearTimeout(this._timeoutHandle);
        },

        getTimeElapsedMs: function () {
            return Date.now() - this._startTimeMs;
        },

        _setTimeout: function (timeoutTimeMs) {
            this._timeoutHandle = setTimeout(EyeX.utils.proxy(this, this._invokeCallback), timeoutTimeMs);
        },

        _invokeCallback: function () {
            if (this._callback(this))
                this.next(this._defaultNextTimeout);
        }
    }),

    // Stopwatch utility.
    Stopwatch: EyeX.Class({
        constructor: function () {
            this._totalTime = 0;
            this._isRunning = false;
        },

        start: function () {
            if (this._isRunning)
                return;
            this._startTime = Date.now();
            this._isRunning = true;
        },

        stop: function () {
            if (!this._isRunning)
                return;
            this._totalTime += Date.now() - this._startTime;
            this._isRunning = false;
        },

        getTotalTime: function () {
            return this._totalTime;
        }
    }),

    // Timings session utility.
    TimingSession: EyeX.Class({
        $statics: {
            run: function (name, job) {
                var session = new EyeX.utils.TimingSession(name);
                job();
                return session.end();
            }
        },

        constructor: function (name) {
            this._name = name;
            this._stopwatch = new EyeX.utils.Stopwatch();
            this._stopwatch.start();
        },

        end: function () {
            this._stopwatch.stop();
            var totalTime = this.getTotalTime();
            EyeX.logDebug(this._name + ": " + totalTime + "ms");
            return totalTime;
        },

        getTotalTime: function () {
            return this._stopwatch.getTotalTime();
        }
    }),

    // Rectangle utility.
    Rectangle: EyeX.Class({
        $statics: {
            fromComponents: function (x, y, width, height) {
                return new EyeX.utils.Rectangle({ x: x, y: y, width: width, height: height });
            }
        },

        constructor: function (components) {
            this.x = components.x;
            this.y = components.y;
            this.width = components.width;
            this.height = components.height;
        },

        overlapsRectangle: function (other) {
            return !(this.x + this.width < other.x ||
                this.x > other.x + other.width ||
                this.y + this.height < other.y ||
                this.y > other.y + other.height);
        },

        containsRectangle: function (other) {
            return this.x <= other.x &&
                this.y <= other.y &&
                this.x + this.width >= other.x + other.width &&
                this.y + this.height >= other.y + other.height;
        }
    }),

    // Event utility.
    Signal: EyeX.Class({
        constructor: function () {
            this._subscriptions = {};
        },

        subscribe: function (subscriber) {
            var ticket = Event._ticketGenerator++;
            this._subscriptions[ticket] = subscriber;
            return ticket;
        },

        unsubscribe: function (ticketOrSubscriber) {
            var ticketToDelete = null;

            if (typeof ticketOrSubscriber == "number") {
                ticketToDelete = ticketOrSubscriber;
            } else {
                var tickets = Object.keys(this._subscriptions);
                for (var i = 0; i < tickets.length; i++) {
                    var ticket = tickets[i];
                    var subscriber = this._subscriptions[ticket];
                    if (subscriber == ticketOrSubscriber) {
                        ticketToDelete = ticket;
                    }
                }
            }

            if (ticketToDelete)
                delete this._subscriptions[ticketToDelete];
        },

        raise: function () {
            var tickets = Object.keys(this._subscriptions);
            for (var i = 0; i < tickets.length; i++) {
                var ticket = tickets[i];
                var subscriber = this._subscriptions[ticket];
                subscriber();
            }
        }
    }),
};



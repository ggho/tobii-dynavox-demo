EyeX.EventDispatcher = EyeX.Class({
    
    constructor: function() {
        this._eventMatchers = {
            'HTMLEvents': /^(?:load|unload|abort|error|select|change|submit|reset|focus|blur|resize|scroll)$/,
            'MouseEvents': /^(?:click|dblclick|mouse(?:down|up|over|move|out))$/,
            'WheelEvent': /^mousewheel$/,
        };
       this._eventDefaultOptions = {
           clientX: 0,
           clientY: 0,
           button: 0,
           ctrlKey: false,
           altKey: false,
           shiftKey: false,
           metaKey: false,
           bubbles: true,
           cancelable: true
       };
    },
    
     simulateEvent: function (element, eventName, options) {
         var doc, win,
             event,
             eventType = null,
             name,
             eventOptions;

         if (!element) {
             return;
         }

         doc = element.ownerDocument;
         win = doc.defaultView;
         eventOptions = EyeX.extend({}, this._eventDefaultOptions);
         eventOptions = EyeX.extend(eventOptions, options);

         for (name in this._eventMatchers) {
             if (this._eventMatchers.hasOwnProperty(name) && this._eventMatchers[name].test(eventName)) {
                 eventType = name;
                 break;
             }
         }

         if (!eventType) {
             throw new SyntaxError('Only HTMLEvents and MouseEvents interfaces are supported');
         }

         event = doc.createEvent(eventType);
         switch (eventType) {
             case "HTMLEvents":
                 event.initEvent(eventName, eventOptions.bubbles, eventOptions.cancelable);
                 break;
             case "WheelEvent":
                 // void initWebKitWheelEvent(int wheelDeltaX, int wheelDeltaY,
                 //                           DOMWindow view,
                 //                           int screenX, int screenY,
                 //                           int clientX, int clientY,
                 //                           bool ctrlKey, bool altKey, bool shiftKey, bool metaKey);
                 event.initWebKitWheelEvent(
                     eventOptions.wheelDeltaX || 0,
                     eventOptions.wheelDeltaY || eventOptions.wheelDelta,
                     doc.defaultView,
                     eventOptions.clientX + win.screenX,
                     eventOptions.clientY + win.screenY,
                     eventOptions.clientX,
                     eventOptions.clientY,
                     eventOptions.ctrlKey,
                     eventOptions.altKey,
                     eventOptions.shiftKey,
                     eventOptions.metaKey);
                 break;
             default:
                 event.initMouseEvent(
                     eventName,
                     eventOptions.bubbles,
                     eventOptions.cancelable,
                     doc.defaultView,
                     0,
                     eventOptions.clientX + win.screenX,
                     eventOptions.clientY + win.screenY,
                     eventOptions.clientX,
                     eventOptions.clientY,
                     eventOptions.ctrlKey,
                     eventOptions.altKey,
                     eventOptions.shiftKey,
                     eventOptions.metaKey,
                     eventOptions.button,
                     element);
                 break;
         }

         element.dispatchEvent(event);
     }
});
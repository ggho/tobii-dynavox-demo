/**
 * class EyeX.ElementSelection
 */
EyeX.ElementSelection = EyeX.Class({
    
    constructor: function(selectorQuery, elementCache) {
        var selector = $(selectorQuery);
        this.elements = {};
        var index = 0;
        var self = this;
        selector.each(function() {
            var elementId = $(this).attr("data-eyex-id");
            if (!elementId)
                return;
            var element = elementCache.getElement(elementId);
            if (!element)
                return;
            self.elements[elementId] = element;
            self[index++] = element;
        });
    },

    on: function(eventName, callback) {
        EyeX.utils.getValues(this.elements).forEach(function(element) {
            element.on(eventName, callback);
        });
        return this;
    },
});
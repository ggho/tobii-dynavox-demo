

/**
 * EyeX.DeveloperTools
 */
EyeX.DeveloperTools = EyeX.Class({
    
    initialize: function(context) {
        this.context = context;
        this.context.registerQueryHandler(EyeX.utils.proxy(this, this._onQuery));
    },

    showQueryBox: function() {
        this.queryBoxSelector = $("#eyex-diagnostics-query-box");
        if (this.queryBoxSelector.length == 0) {
            var queryBoxHtml = [
                "<div id='eyex-diagnostics-query-box'></div>",
                "<style scoped>",
                "#eyex-diagnostics-query-box {",
                    "position: absolute;",
                    "border: solid 1px black;",
                    "background-color: orange;",
                    "opacity: 0.2;",
                    "margin: 0",
                    "padding: 0",
                "}",
                "</style>"
            ].join("\n");
            $("body").append(queryBoxHtml);
            this.queryBoxSelector = $("#eyex-diagnostics-query-box");
        }
        this.queryBoxSelector.show();
    },

    hideQueryBox: function() {
        if(this.queryBoxSelector)
            this.queryBoxSelector.hide();
    },

    _onQuery: function (query) {
        if (this.queryBoxSelector) {
            var queryRect = query.getBounds().toRect();
            queryRect = EyeX.coords.screenToClient(queryRect);
            this.queryBoxSelector.css("left", queryRect.x);
            this.queryBoxSelector.css("top", queryRect.y);
            this.queryBoxSelector.css("width", queryRect.width);
            this.queryBoxSelector.css("height", queryRect.height);
        }
    }
});



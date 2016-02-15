/**
 * EyeX.WebManager
 * 
 * Manages all web related tasks.
 */
EyeX.WebManager = EyeX.Class(EyeX.CommonBase, {

    constructor: function (context) {
        this.context = context;
        this.context.registerConnectionStateChangedHandler(this.proxy(this._onConnectionStateChanged));
        this._updateBrowserName();
        this._updateVisibility();
        this._coordinatesConverter = new EyeX.WebCoordinatesConverter(context);
        EyeX.coords.setConverter(this._coordinatesConverter);

        // Prevent EyeX Interaction Chrome extensions from interfering
        document.documentElement.setAttribute("data-eyex-interaction-extension", "DISABLE");


        // Frame stuff must be ready.
        //EyeX.frames = new EyeX.FrameManager(context);
        //EyeX.frames.ready()
        //    .done(function() {
        //        // Resolve deferred.
        //        EyeX._initDef.resolve(context);
        //    })
        //    .fail(function() {
        //        EyeX._initDef.reject();
        //    });

        document.addEventListener("visibilitychange", this.proxy(this._onVisibilityChanged));
    },

    /**
     * Determines if this is currently running in a plugin.
     */
    isPlugin: function () {
        return !!window.isEyeXPlugin;
    },

    getHasExplicitEyeX: function () {
        return $("html").attr("data-eyex-is-explicit");
    },

    setHasExplicitEyeX: function (value) {
        return $("html").attr("data-eyex-is-explicit", value);
    },

    getBrowserName: function () {
        var userAgent = navigator.userAgent;
        if (userAgent.indexOf("Chrome") != -1)
            return "chrome";
        if (userAgent.indexOf("Opera") != -1)
            return "opera";
        if (userAgent.indexOf("MSIE") != -1)
            return "ie";
        if (userAgent.indexOf("Firefox") != -1)
            return "firefox";
        return "unknown";
    },

    _onConnectionStateChanged: function (isConnected) {
        if (isConnected) {
            this._updateBrowserName();
            this._updateVisibility();
        }
    },

    _onVisibilityChanged: function () {
        this._updateVisibility();
    },

    _updateBrowserName: function () {
        var browserName = this.getBrowserName();
        this.context.communicator.sendRequest(EyeX.constants.webRequestType.setBrowserName, {
            browserName: browserName
        });
    },

    _updateVisibility: function() {
        switch (document.visibilityState) {
            case "visible":
                this.context.setVisibility(true);
                break;
            case "hidden":
                this.context.setVisibility(false);
                break;
        }
    }
});

EyeX.addInitializer(function (context) {
    var def = new EyeX.utils.Deferred();
    EyeX.web = new EyeX.WebManager(context);
    def.resolve();
    return def.promise();
});


//if (!EyeX.isPlugin()) {
//    if (EyeX.getHasExplicitEyeX() === undefined)
//        EyeX.setHasExplicitEyeX(true);
//}


/**
 * Nice to have loader which makes it easy to include EyeX without having to specify all javascript files explictly.
 * Typically just for developers. Won't be needed in production where we have EyeX.min.js.
 */
//load: function (onLoaded, getAbsolutePath, preFiles, postFiles, eyeXFilesPrefix) {

//    if (eyeXFilesPrefix === undefined)
//        eyeXFilesPrefix = "";

//    if (!EyeX._loadedDef) {
//        EyeX._loadedDef = new EyeX.utils.Deferred();

//        if (!getAbsolutePath) {
//            var path = EyeX._eyeXJSPath;
//            var lastSlashIndex = path.toLowerCase().lastIndexOf("eyex.js");
//            var basePath = path.substring(0, lastSlashIndex);

//            getAbsolutePath = function (relativePath) {
//                return basePath + relativePath;
//            };
//        }

//        var sourceFilePaths = [];

//        if (preFiles)
//            sourceFilePaths = sourceFilePaths.concat(preFiles);

//        var eyeXSourceFilePaths = [
//            "Utils.js",
//            "Developer.js",
//            "Constants.js",
//            "Logging.js",
//            "Connection.js",
//            "Communicator.js",
//            "Coordinates.js",
//            "Model/Message.js",
//            "Model/Context.js",
//            "Model/Object.js",
//            "Model/Command.js",
//            "Model/Snapshot.js",
//            "Model/Interactor.js",
//            "Model/Behavior.js",
//            "Model/Bounds.js",
//            "Model/Event.js",
//            "Model/Query.js",
//            "Foundation/StreamingDataProvider.js",
//            "Foundation/Streams.js",
//            "Foundation/CSS/CSSLoader.js",
//            "Foundation/DOM/PanManager.js",
//            "Foundation/DOM/DOMElement.js",
//            "Foundation/DOM/BSPTree.js",
//            "Foundation/DOM/DOMElementCache.js",
//            "Foundation/DOM/DOMInvalidation.js",
//            "Foundation/DOM/DOMScanner.js",
//            "Foundation/DOM/DOMDecorator.js",
//            "Foundation/DOM/Frames/FrameManager.js",
//            "Foundation/DOM/Frames/FrameNode.js",
//            "Foundation/DOM/Frames/FrameClient.js",
//            "Foundation/DOM/Frames/FrameServer.js",
//            "Foundation/DOM/DOMManager.js",
//            "Ready.js"
//        ];

//        eyeXSourceFilePaths.forEach(function (eyeXSourceFilePath) {
//            sourceFilePaths.push(eyeXFilesPrefix + eyeXSourceFilePath);
//        });

//        if (postFiles)
//            sourceFilePaths = sourceFilePaths.concat(postFiles);

//        sourceFilePaths.push(eyeXFilesPrefix + "Loaded.js");

//        var scriptElementsSource = "";
//        sourceFilePaths.forEach(function (filePath) {
//            var absoluteFilePath = getAbsolutePath(filePath);
//            var scriptElementSource = "<script type='text/javascript' src='" + absoluteFilePath + "'></script>\n";
//            scriptElementsSource += scriptElementSource;
//        });

//        $("head").append(scriptElementsSource);
//    }

//    if (onLoaded)
//        EyeX._loadedDef.done(onLoaded);

//    return EyeX._loadedDef.promise();
//},

//_eyeXJSPath: $("script:last").attr("src"),

//    _notifyLoaded: function () {
//        if (EyeX._loadedDef)
//            EyeX._loadedDef.resolve();
//    },
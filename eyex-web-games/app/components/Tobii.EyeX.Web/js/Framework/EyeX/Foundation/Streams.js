/**
 * EyeX.StreamHelper
 * 
 * Basic facade used for streaming data.
 */
EyeX.StreamHelper = EyeX.Class({

    constructor: function (context) {
        this.context = context;
        this._streamingDataProvidersPerType = {};
    },

    /**
     * Adds or removes a callback for gaze point data.
     *
     * @param callback:
     *  The callback to be invoked when gaze point data arrives.
     *  Specify null or undefined to unregister callback.
     *
     * @param mode:
     *  The gaze point data mode.
     *  Will be set to lightlyFiltered if not specified.
     */
    gazePointData: function (callback, mode) {
        if (!mode)
            mode = EyeX.constants.gazePointDataMode.lightlyFiltered;
        this._onStreamingData(EyeX.constants.behaviorType.gazePointData, mode, { gazePointDataMode: mode }, callback);
    },

    /**
     * Adds or removes a callback for fixation data.
     *
     * @param callback:
     *  The callback to be invoked when fixation data arrives.
     *  Specify null or undefined to unregister callback.
     *
     * @param mode:
     *  The fixation data mode.
     *  Will be set to sensitive if not specified.
     */
    fixationData: function (callback, mode) {
        if (!mode)
            mode = EyeX.constants.fixationDataMode.sensitive;
        this._onStreamingData(EyeX.constants.behaviorType.fixationData, mode, { fixationDataMode: mode }, callback);
    },

    /**
     * Adds or removes a callback for eye position data.
     *
     * @param callback:
     *  The callback to be invoked when eye position data arrives.
     *  Specify null or undefined to unregister callback.
     */
    eyePositionData: function (callback) {
        this._onStreamingData(EyeX.constants.behaviorType.eyePositionData, 1, {}, callback);
    },

    /**
     * Helper to set up/tear down streaming data.
     */
    _onStreamingData: function (behaviorType, mode, behaviorParams, callback) {
        var streamingDataProviders = EyeX.utils.getValueOr(this._streamingDataProvidersPerType, behaviorType, {});
        var streamingDataProvider = streamingDataProviders[mode];
        if (streamingDataProvider) {
            streamingDataProvider.enable(false);
            delete streamingDataProviders[mode];
        }
        if (!callback)
            return;
        streamingDataProvider = new EyeX.StreamingDataProvider(this.context, behaviorType, behaviorParams, callback);
        streamingDataProvider.enable(true);
        streamingDataProviders[mode] = streamingDataProvider;
    },
});

EyeX.extend({
    /**
     * Initializes EyeX.
     *
     * @params:
     *  Called when communication has been established with the EyeX Engine.
     *
     * @returns: 
     *  A promise which will be resolved when communication has been established with the EyeX Engine, or rejected the context could not be created.
     */
    ready: function (onReady) {
        if (!EyeX._initDef) {
            // This deferred will be rejected if the context can't be created or resolved when communication has been established.
            EyeX._initDef = new EyeX.utils.Deferred();
            var self = this;

            // Create context.
            EyeX.Context.create({}, 3000)
                .fail(function () { self._initDef.reject(); }) // Reject deferred if failed to create context.
                .done(function (context) { // Context successfully crated.

                    // Register connection state changed handler.
                    var ticket = context.registerConnectionStateChangedHandler(function (isConnected) {

                        // If not connected, do nothing.
                        if (!isConnected)
                            return;

                        // No longer need connection state changes.
                        context.unregisterConnectionStateChangedHandler(ticket);

                        EyeX.coords = new EyeX.CoordinatesFacade();
                        //EyeX.dom = new EyeX.DOMManager(context);

                        EyeX.streams = new EyeX.StreamHelper(context);
                        EyeX.states = new EyeX.StatesHelper(context);
                        EyeX.dev = new EyeX.DeveloperTools();

                        EyeX.utils.Deferred.whenAll(EyeX._initializers, [context])
                            .done(function () {
                                EyeX.agent = new EyeX.Agent(context);
                                EyeX.headlessInteractors = new EyeX.InteractorFacility(context); // TODO: bounding rect must be specified if web

                                EyeX._initDef.resolve(context);
                            });
                    });

                    // Enable the connection.
                    context.enableConnection();
                });
        }

        EyeX._initDef.done(onReady);
        return EyeX._initDef.promise();
    },

    /**
     * Adds an initializer to be called before ready completes.
     */
    addInitializer: function (initializer) {
        EyeX._initializers.push(initializer);
    },

    _initializers: []
})
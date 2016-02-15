/**
 * EyeX.Constants
 *
 * Container for all constants in the EyeX Web Binding.
 * Most values will be streamed from the EyeX Engine when connection has been established.
 */
EyeX.extend({

    // Constants
    constants: {
        defaultWebSocketUrl: "ws://127.0.0.1:44049",
        reconnectIntervalMs: 2000,
        timeSyncIntervalMs: 10000,
        masterIdAttributeName: "data-eyex-master-id",
        slaveIdAttributeName: "data-eyex-slave-id",

    }
});

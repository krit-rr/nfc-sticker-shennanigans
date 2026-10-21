const { withPodfileProperties } = require("expo/config-plugins");

/**
 * Builds Expo's own modules from source instead of using Expo's precompiled XCFrameworks.
 *
 * The precompiled frameworks are tied to the Swift version they were built with: this Mac's Xcode
 * (Swift 6.4) refuses the ones built with Swift 6.3.1 ("this SDK is not supported by the compiler").
 * Source builds take a few minutes longer but always match the installed toolchain. Remove this plugin
 * once Expo ships frameworks for the installed Xcode.
 */
module.exports = function withSourceBuiltExpoModules(config) {
  return withPodfileProperties(config, (config) => {
    config.modResults.EXPO_USE_PRECOMPILED_MODULES = "false";
    return config;
  });
};

const { AndroidConfig, withAndroidManifest } = require("expo/config-plugins");

const NDEF_DISCOVERED = "android.nfc.action.NDEF_DISCOVERED";

/**
 * Adds an NDEF_DISCOVERED intent filter so tapping a sticker that carries our URL opens the app
 * directly (no browser hop). Expo's `android.intentFilters` cannot express this action because it
 * always prefixes `android.intent.action.`, hence this plugin.
 *
 * Usage in app.json: ["./plugins/with-nfc-intent-filter.js", { "host": "tap.example.com", "pathPrefix": "/t/" }]
 */
module.exports = function withNfcIntentFilter(config, { host, pathPrefix = "/t/" }) {
  if (!host) throw new Error("with-nfc-intent-filter: `host` is required");
  return withAndroidManifest(config, (config) => {
    const activity = AndroidConfig.Manifest.getMainActivityOrThrow(config.modResults);
    const filters = (activity["intent-filter"] ??= []);
    const alreadyThere = filters.some((filter) =>
      (filter.action ?? []).some((action) => action.$["android:name"] === NDEF_DISCOVERED),
    );
    if (!alreadyThere) {
      filters.push({
        action: [{ $: { "android:name": NDEF_DISCOVERED } }],
        category: [{ $: { "android:name": "android.intent.category.DEFAULT" } }],
        data: [
          {
            $: {
              "android:scheme": "https",
              "android:host": host,
              "android:pathPrefix": pathPrefix,
            },
          },
        ],
      });
    }
    return config;
  });
};

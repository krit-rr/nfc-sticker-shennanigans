import Constants from "expo-constants";

const extra = (Constants.expoConfig?.extra ?? {}) as { tagBaseUrl?: string };

/** Host that stickers point at. Change `expo.extra.tagBaseUrl` in app.json (and the associated domains). */
export const TAG_BASE_URL = extra.tagBaseUrl ?? "https://tap.example.com";

export const ANDROID_PACKAGE = Constants.expoConfig?.android?.package ?? "com.example.tap";

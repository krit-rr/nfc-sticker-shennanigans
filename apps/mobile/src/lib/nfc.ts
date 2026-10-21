import {
  androidApplicationRecord,
  decodeUriPayload,
  encodeMessage,
  uriRecord,
  type NdefRecord,
} from "@tap/ndef";
import { Platform } from "react-native";
import NfcManager, { NfcTech, type TagEvent } from "react-native-nfc-manager";

/**
 * Thin wrapper over react-native-nfc-manager. Needs a development build
 * (`pnpm --filter @tap/mobile ios:device`); Expo Go and simulators have no NFC.
 */

export const nfcAvailable = Platform.OS === "ios" || Platform.OS === "android";

let started: Promise<boolean> | null = null;

/** Resolves true when NFC is supported and the manager is running. Safe to call repeatedly. */
export function ensureNfc(): Promise<boolean> {
  if (!nfcAvailable) return Promise.resolve(false);
  started ??= (async () => {
    if (!(await NfcManager.isSupported())) return false;
    await NfcManager.start();
    return true;
  })().catch(() => false);
  return started;
}

function recordTypeName(type: number[] | string): string {
  return typeof type === "string" ? type : String.fromCharCode(...type);
}

/** First URL stored on a tag, decoded with @tap/ndef, or null if there is none. */
export function firstUrl(tag: TagEvent | null): string | null {
  for (const record of tag?.ndefMessage ?? []) {
    if (record.tnf === 0x01 && recordTypeName(record.type) === "U") {
      return decodeUriPayload(Uint8Array.from(record.payload as number[]));
    }
  }
  return null;
}

export type ScanResult = { url: string | null; uid: string | null };

/** Opens a scan session (system sheet on iOS) and returns what is on the sticker. */
export async function readTag(
  prompt = "Hold your phone near the sticker",
): Promise<ScanResult | null> {
  if (!(await ensureNfc())) return null;
  try {
    await NfcManager.requestTechnology(NfcTech.Ndef, { alertMessage: prompt });
    const tag = await NfcManager.getTag();
    return { url: firstUrl(tag), uid: tag?.id ?? null };
  } finally {
    await NfcManager.cancelTechnologyRequest().catch(() => undefined);
  }
}

/** Message we write on stickers: the URL, plus an Android Application Record so Android opens the app. */
export function stickerMessage(url: string, androidPackage?: string): NdefRecord[] {
  return androidPackage
    ? [uriRecord(url), androidApplicationRecord(androidPackage)]
    : [uriRecord(url)];
}

/** Writes a URL to a blank (or rewritable) sticker. Throws if NFC is unavailable or the user cancels. */
export async function writeUrl(url: string, androidPackage?: string): Promise<void> {
  if (!(await ensureNfc())) throw new Error("NFC is not available on this device");
  const bytes = Array.from(encodeMessage(stickerMessage(url, androidPackage)));
  try {
    await NfcManager.requestTechnology(NfcTech.Ndef, {
      alertMessage: "Hold the sticker still while writing…",
    });
    await NfcManager.ndefHandler.writeNdefMessage(bytes);
    if (Platform.OS === "ios") await NfcManager.setAlertMessageIOS("Done!");
  } finally {
    await NfcManager.cancelTechnologyRequest().catch(() => undefined);
  }
}

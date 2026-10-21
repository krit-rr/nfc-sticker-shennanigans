# NFC notes

## Chips

Stickers you buy are almost always NTAG21x (ISO 14443-A, NFC Forum Type 2). Every modern phone reads them.

| Chip    | User memory | Practical NDEF limit\* | Good for                                                                 |
| ------- | ----------- | ---------------------- | ------------------------------------------------------------------------ |
| NTAG213 | 144 B       | 137 B                  | a URL (`https://tap.example.com/t/xxxxxxxx` ≈ 30 B) + Android app record |
| NTAG215 | 504 B       | 492 B                  | a URL plus a short vCard                                                 |
| NTAG216 | 888 B       | 872 B                  | a full vCard on the tag itself                                           |

\* the number Android reports from `Ndef.getMaxSize()` for a factory-formatted tag. `@tap/ndef`'s
`fitsOn()` uses it. NTAG424 DNA adds tap-unique signed URLs (anti-cloning) if that ever matters.

## What we write

- Record 1: a URI record, `https://<host>/t/<id>` (app stickers) or `https://<host>/c/<slug>` (cards).
  Written with the RTD-URI prefix table so `https://` costs one byte.
- Record 2 (app stickers only): an Android Application Record (`android.com:pkg`) so Android launches
  the app, or its Play Store page, instead of a browser.
- Nothing else. The tag id is a pointer; the action lives in the app's registry.

Optionally lock the tag read-only after writing (`NfcManager.ndefHandler.makeReadOnly()`), which
prevents anyone from rewriting a sticker stuck to your wall.

## How each phone reacts to a tap

**iOS (iPhone XS and later)**: background tag reading is on all the time. When the screen is on (it works
from the lock screen after the first unlock since boot, but not while Camera or Wallet are active), the
phone reads the tag and shows a notification with the URL. If the URL is a universal link for an installed
app, tapping the notification opens the app at that route (`src/app/t/[tagId].tsx`). Inside the app,
scanning explicitly (`readTag()` in `src/lib/nfc.ts`) shows the system NFC sheet. Requires the NFC Tag
Reading capability (the `react-native-nfc-manager` config plugin adds the entitlement) and a paid Apple
developer account.

**Android**: the system dispatches an `NDEF_DISCOVERED` intent for the URL. Our manifest filters on
`https://<host>/t/*` so the app opens directly; the Android Application Record makes that unambiguous.
Verified app links (`assetlinks.json`) skip the app chooser for `https` links too.

**Any phone without the app**: the URL opens in the browser. `/t/<id>` explains and offers the `tap://`
deep link; `/c/<slug>` is the business card.

## Making links open the app

1. Pick a real host and replace `tap.example.com` everywhere (see README "Before shipping").
2. iOS: `apps/web` serves `/.well-known/apple-app-site-association` with `APPLE_TEAM_ID`. The app's
   `ios.associatedDomains` lists `applinks:<host>`. Apple's CDN caches the file; use
   `?mode=developer` on the entitlement during development.
3. Android: `apps/web` serves `/.well-known/assetlinks.json` with the signing certificate fingerprint
   (`ANDROID_SHA256_CERT_FINGERPRINT`, from `keytool -list -v`). The intent filter has `autoVerify`.
4. Check with `adb shell pm get-app-links com.example.tap` (Android) and the Apple Search Console
   / `swcutil` (macOS) for iOS.

## Testing without hardware

- Routines screen: "Simulate tap" calls the same `applyTap()` a real tap would.
- Deep links into the tag screen: `npx uri-scheme open "tap://t/b4thr00m" --ios` (or `--android`).
- `@tap/ndef` tests show exactly which bytes go on the tag.

## Writing stickers

- In the app: Stickers tab → select → Write (needs a development build on a device).
- From a browser: `apps/web` `/write` uses Web NFC (Chrome on Android only).
- Any "NFC Tools" style app can write the same URL by hand.

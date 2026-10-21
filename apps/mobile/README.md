# @tap/mobile

Expo (SDK 57) app: alarms you dismiss by tapping a sticker, sticker-driven routines, focus toggles, and
writing stickers. Routes live in `src/app/`, domain logic comes from `@tap/core`, NDEF bytes from `@tap/ndef`.

## Running it

NFC and AlarmKit are native, so **Expo Go and simulators will not do NFC**. For that, use a development
build on a real phone (needs Xcode signing set up):

```bash
pnpm --filter @tap/mobile ios:device   # or: pnpm --filter @tap/mobile android
```

Everything else works in the simulator. `expo run:ios` currently mistakes the booted simulator for a
physical device on Xcode 27 and asks for a signing certificate, so use the script that drives
`xcodebuild` directly, then start Metro:

```bash
pnpm --filter @tap/mobile ios:sim      # build without signing, install, launch (METRO_PORT=8090 if 8081 is busy)
pnpm mobile                            # Metro; add --port 8090 to match
```

Deep-link a sticker tap into the running app: `xcrun simctl openurl booted "tap://t/b4thr00m"`.

## Design

The look lives in two places, so screens stay thin and consistent:

- `src/constants/theme.ts`: colour tokens for light and dark, tones for chips and banners, type
  families, spacing and radii. Light is warm paper with white cards; dark is near-black with raised
  surfaces; the indigo "night" card is the same in both.
- `src/components/`: `Screen`, `Card`, `Button`, `Chip`, `Icon`, `IconTile`, `Banner`,
  `ProgressBar`, `SectionHeader`, `ThemedText`. Build new screens from these instead of styling
  from scratch.

Gradients, shadows and symbols use what React Native and Expo already ship (`experimental_backgroundImage`,
`boxShadow`, `expo-symbols`, Reanimated transitions), so no extra native modules are needed.

#!/usr/bin/env bash
# Build the Debug app for the iOS Simulator (no code signing), install it, and launch it.
#
# Why not `expo run:ios`? With Xcode 27 the Expo CLI currently classifies the booted simulator as a
# physical device and refuses to build without a signing certificate. This does what it would have done.
#
# Usage: scripts/ios-sim.sh [simulator UDID]      (defaults to the booted simulator)
#        METRO_PORT=8090 scripts/ios-sim.sh        (if something else already uses 8081)
# Then start Metro: npx expo start [--port $METRO_PORT]
set -euo pipefail
cd "$(dirname "$0")/.."
export LANG="${LANG:-en_US.UTF-8}"   # CocoaPods refuses to run without a UTF-8 locale

[ -d ios ] || npx expo prebuild --platform ios --no-install
[ -d ios/Pods ] || (cd ios && pod install)

UDID="${1:-$(xcrun simctl list devices booted -j | node -e '
  const d = JSON.parse(require("fs").readFileSync(0, "utf8")).devices;
  const booted = Object.values(d).flat().find((x) => x.state === "Booted");
  process.stdout.write(booted ? booted.udid : "");')}"
if [ -z "$UDID" ]; then
  echo "No booted simulator. Open one (open -a Simulator) or pass a UDID." >&2
  exit 1
fi
PORT="${METRO_PORT:-8081}"
BUNDLE_ID="$(node -e 'process.stdout.write(require("./app.json").expo.ios.bundleIdentifier)')"

xcodebuild -workspace ios/Tap.xcworkspace -scheme Tap -configuration Debug -sdk iphonesimulator \
  -destination "platform=iOS Simulator,id=$UDID" -derivedDataPath ios/build \
  CODE_SIGNING_ALLOWED=NO COMPILER_INDEX_STORE_ENABLE=NO build \
  | grep -E "error:|warning: .*Tap/|BUILD (SUCCEEDED|FAILED)"

xcrun simctl install "$UDID" ios/build/Build/Products/Debug-iphonesimulator/Tap.app
# Tell React Native's dev bundle loader where Metro is (persists in the simulator's defaults).
xcrun simctl spawn "$UDID" defaults write "$BUNDLE_ID" RCT_jsLocation "localhost:$PORT" >/dev/null
xcrun simctl launch "$UDID" "$BUNDLE_ID" >/dev/null
echo "Installed and launched $BUNDLE_ID on $UDID. Now run: npx expo start --port $PORT"

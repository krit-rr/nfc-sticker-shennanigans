# Alarm strategy: making "tap the sticker to stop" real

## The constraint

**iOS 26+ AlarmKit** is the only way for a third-party app to ring through silent mode and Focus like the
Clock app. It is OS-owned: the system draws the alert, and that alert always has a **Stop** button. You
can add a secondary button that opens the app (custom App Intent) or snoozes (countdown), but you cannot
remove Stop. So "must tap the sticker" cannot be enforced by a single alarm on iOS.

**Android** has no such limit: `AlarmManager.setAlarmClock()` + a foreground service + a full-screen
intent activity that ignores dismiss until an NFC tag is read (reader mode in that activity). It needs
`SCHEDULE_EXACT_ALARM`/`USE_EXACT_ALARM`, `USE_FULL_SCREEN_INTENT`, and a small Kotlin module.

## The design: schedule the whole chain up front

`@tap/core`'s `Alarm.nag = { everyMinutes, times }` and `ringTimes(alarm, firstRing)` produce the full
list of rings for one occurrence, e.g. 7:00, 7:03, 7:06, 7:09, 7:12, 7:15. The scheduler
(`apps/mobile/src/lib/alarm-scheduler.ts`) schedules **all of them** with the OS.

- Hitting Stop on the 7:00 alert stops that ring only; 7:03 is already scheduled and fires whether or not
  the app is running. On iOS this is exactly what makes it enforceable without background execution.
- Tapping the dismiss sticker opens the app at `/t/<id>`, which calls `scheduler.cancel(alarmId)` and
  removes every remaining ring. That is the only way to silence the chain.
- The alert's secondary button says "I'm at the sticker" and opens the app's scanner, so the user always
  has a path that does not require finding the app icon.
- Choose defaults that are annoying, not cruel: 3 minutes apart, 5–10 follow-ups, and a visible "rings
  again at …" preview on the Alarms screen (already rendered).

Edge cases to handle when wiring the native module:

- App reinstalled or alarms edited: reschedule from the domain model on launch (`nextOccurrence()` for
  every enabled alarm).
- Tapping the sticker before the first ring: cancel today's chain, keep the recurrence.
- Two alarms sharing a sticker: cancel both.
- Snooze is not a feature. If it ever is, it is a countdown on the secondary button, never on Stop.

## Sleep cycles: matching sleepyti.me

Alarm and bed times follow the sleepyti.me calculator. Its domain now redirects to Sleepopolis's
"formerly Sleepytime" page, so the numbers here come from the original site's script:

- A sleep cycle is 90 minutes, and waking between cycles feels better than waking mid-cycle.
- **"I have to wake up at…"**: be asleep 9 h, 7.5 h, 6 h or 4.5 h before the alarm (6, 5, 4, 3
  cycles). These are fall-asleep times; get in bed 14 minutes earlier.
- **"zzz" (going to bed now)**: wake at now + 14 minutes to fall asleep + 1 to 6 cycles.
- 5–6 cycles is "a good night's sleep", so those options are the highlighted ones.

`packages/core/src/sleep.ts` implements this as `fallAsleepTimesFor(wakeAt)`, `inBedBy(asleepAt)` and
`wakeTimesFrom(inBedAt)`; `oneShotAlarmAt()` turns a chosen wake time into an alarm. On the Alarms
screen, "Going to bed now?" creates a one-shot alarm at the picked cycle boundary with the dismiss
sticker and nag chain attached, and every alarm lists the bedtimes that fit it.

The first ring sits on the cycle boundary; nag follow-ups come after it, so the chain never wakes you
earlier than the boundary you chose. Still to do: a wind-down notification at the in-bed time of the
recommended bedtime, and disabling one-shot alarms after they have been dismissed.

## Native module candidates (evaluated from npm metadata + readmes, 2026-10-27)

None has been run on a device from this repo yet — that validation is still the gate. Criteria: last
publish date, Expo compatibility, whether it exposes alarm state/Stop events so the app can react, and
whether it degrades to a no-op below iOS 26.

| Package                                   | Last publish | Shape                           | Notes                                                                                                                                                                                                |
| ----------------------------------------- | ------------ | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `react-native-ios-alarmkit` 1.0.0         | Oct 2026     | Nitro module (iOS only)         | Hooks + event listeners for alarm state, opt-in saved stop/dismiss events, Live Activities, silent no-op on Android and iOS < 26, Expo supported. Adds `react-native-nitro-modules`.                 |
| `@klyftig/alarm-kit` 0.2.0                | Oct 2026     | Expo module (iOS only)          | Has the exact nag primitive: Stop can re-ring after N s up to K times, plus `consumeStopped()`. But readme says it has **never run on a physical iPhone**; config plugin lives in a sibling package. |
| `expo-alarm-kit` 0.1.11                   | Apr 2026     | Expo module (iOS only)          | App-launch on dismiss/snooze intents, App Groups state. Stale half a year; wants manual Xcode deployment-target edits, which fights `expo prebuild`.                                                 |
| `react-native-nitro-ios-alarm-kit` 1.0.41 | May 2026     | Nitro module (iOS only)         | Schedule/stop, custom sounds; aimed at meditation timers, no Stop-event surface in the readme.                                                                                                       |
| `rn-native-alarmkit` 0.1.13               | Nov 2025     | RN module, claims iOS + Android | One API over AlarmKit and AlarmManager with notification fallbacks — right shape for us eventually, but the oldest and the fallback can silently downgrade to notifications.                         |

**Wired in:** `react-native-ios-alarmkit` — freshest, built for Expo, and its state/stop events are
what `scheduler.cancel()` and the "rings again at …" UI need. `apps/mobile/src/lib/alarm-scheduler.ts`
turns each ring of the chain into its own fixed-date AlarmKit alarm (ids are UUIDs, kept in the
document store under the domain alarm's id), the alert's secondary button is "I'm at the sticker"
(opens the app), tapping the anchor sticker cancels the chain and disables dismissed one-shots, and
every enabled alarm is rescheduled from the domain model at launch. **Not yet validated on a physical
iPhone** — Stop-then-re-ring, authorization, and the secondary button all need a device pass.
Keep `@klyftig/alarm-kit` as the backup: its Stop-re-ring is our nag chain in one call, worth
revisiting once it has device mileage. Android stays the planned small Kotlin module
(`setAlarmClock` + full-screen intent); check `rn-native-alarmkit`'s Android half for reference
before writing it.

If the first try disappoints, an Expo Module in Swift wrapping `AlarmManager.schedule(id:configuration:)`
is ~200 lines, and it keeps the presentation strings and buttons under our control.

## Focus mode (the Brick part)

iOS: Screen Time API (`FamilyControls` for authorization, `ManagedSettings` to shield apps,
`DeviceActivity` for schedules). Needs the Family Controls entitlement: works in development builds
after enabling the capability; App Store distribution requires requesting it from Apple.
`react-native-device-activity` wraps this for Expo and is the first thing to try.

Android: app blocking is done with an overlay + `UsageStatsManager` polling or an AccessibilityService.
Play policy is strict about accessibility services, so prefer the overlay approach for a prototype.

The sticker's job is the same on both: `focus.toggle` starts a shield session; tapping again ends it.

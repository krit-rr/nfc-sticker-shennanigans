import type { Alarm } from "@tap/core";

/**
 * Boundary between the domain (packages/core) and the OS alarm APIs.
 *
 * iOS 26+: AlarmKit. Candidate bridges on npm as of Sep 2026 — evaluate before picking:
 *   expo-alarm-kit, @klyftig/alarm-kit (Expo modules); react-native-ios-alarmkit,
 *   react-native-nitro-ios-alarm-kit (Nitro modules). See docs/alarm-strategy.md.
 * Android: AlarmManager.setAlarmClock + a foreground service that keeps ringing until the tag is tapped.
 */
export interface AlarmScheduler {
  /** Schedule every ring in `times` (first ring plus nag follow-ups) for this alarm. */
  schedule(alarm: Alarm, times: Date[]): Promise<void>;
  /** Cancel every pending ring for this alarm (called when the dismiss tag is tapped). */
  cancel(alarmId: string): Promise<void>;
}

/** Placeholder until a native module is wired up: logs what it would do. */
export const loggingScheduler: AlarmScheduler = {
  async schedule(alarm, times) {
    console.log(
      `[alarms] would schedule "${alarm.label}" at`,
      times.map((t) => t.toLocaleTimeString()),
    );
  },
  async cancel(alarmId) {
    console.log(`[alarms] would cancel "${alarmId}"`);
  },
};

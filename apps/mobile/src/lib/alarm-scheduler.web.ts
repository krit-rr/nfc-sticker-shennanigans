import type { Alarm } from "@tap/core";

import type { AlarmScheduler } from "./alarm-scheduler";

export type { AlarmScheduler };

/**
 * Web build of the scheduler. The nitro module behind react-native-ios-alarmkit cannot load
 * outside a native dev build, and the web preview has no OS alarms anyway, so log instead.
 */
export const scheduler: AlarmScheduler = {
  async schedule(alarm: Alarm, times: Date[]) {
    console.log(
      `[alarms] web preview; would schedule "${alarm.label}" at`,
      times.map((t) => t.toLocaleTimeString()),
    );
  },
  async cancel(alarmId: string) {
    console.log(`[alarms] web preview; would cancel "${alarmId}"`);
  },
};

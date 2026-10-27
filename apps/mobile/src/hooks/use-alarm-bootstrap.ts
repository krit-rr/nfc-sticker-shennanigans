import { nextOccurrence, ringTimes } from "@tap/core";
import { useEffect } from "react";

import { loadAlarms } from "@/lib/alarm-store";
import { scheduler } from "@/lib/alarm-scheduler";

/**
 * Reschedules every enabled alarm from the domain model once at launch, so the OS alarms
 * stay right after a reinstall, an edit while offline, or a dismissed occurrence
 * (see docs/alarm-strategy.md, "edge cases").
 */
export function useAlarmBootstrap() {
  useEffect(() => {
    void (async () => {
      for (const alarm of await loadAlarms()) {
        const first = alarm.enabled ? nextOccurrence(alarm) : null;
        if (first) await scheduler.schedule(alarm, ringTimes(alarm, first));
        else await scheduler.cancel(alarm.id);
      }
    })();
  }, []);
}

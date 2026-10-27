import type { Alarm } from "@tap/core";
import * as Crypto from "expo-crypto";
import { Platform } from "react-native";
import { AlarmConfigurationFactory, AlarmKitManager } from "react-native-ios-alarmkit";

import { docStore } from "./doc-store";

/**
 * Boundary between the domain (packages/core) and the OS alarm APIs.
 *
 * iOS 26+: AlarmKit via react-native-ios-alarmkit (see docs/alarm-strategy.md for why it was
 * picked). Each ring of the nag chain becomes its own fixed-date AlarmKit alarm, so hitting the
 * system Stop button silences one ring while the rest stay scheduled OS-side; only `cancel()`
 * — the dismiss-sticker tap — removes the whole chain. AlarmKit ids must be UUIDs, so the chain's
 * ids are kept in the document store under the domain alarm's id.
 *
 * Android: still TODO (AlarmManager.setAlarmClock + a foreground service); unsupported platforms
 * and simulators fall back to logging what they would have done.
 */
export interface AlarmScheduler {
  /** Schedule every ring in `times` (first ring plus nag follow-ups) for this alarm. */
  schedule(alarm: Alarm, times: Date[]): Promise<void>;
  /** Cancel every pending ring for this alarm (called when the dismiss tag is tapped). */
  cancel(alarmId: string): Promise<void>;
}

const RINGS = "alarm-rings";

/** Matches the splash/accent blue so the system alert looks like the app. */
const TINT = "#208AEF";

function alarmKitAvailable(): boolean {
  return Platform.OS === "ios" && AlarmKitManager.shared.isSupported;
}

async function ensureAuthorized(): Promise<boolean> {
  const state = await AlarmKitManager.shared.getAuthorizationState();
  if (state === "authorized") return true;
  if (state === "denied") return false;
  return AlarmKitManager.shared.requestAuthorization();
}

function ringConfiguration(alarm: Alarm, at: Date) {
  return AlarmConfigurationFactory.alarm({
    schedule: { type: "fixed", date: at.getTime() },
    attributes: {
      presentation: {
        alert: {
          title: alarm.label,
          // The system always draws a Stop button; it silences this ring only.
          stopButton: { text: "Stop", textColor: "#FFFFFF", systemImageName: "stop.circle" },
          // The path that ends the chain: opens the app so the user can scan the sticker.
          ...(alarm.dismissTagId
            ? {
                secondaryButton: {
                  text: "I'm at the sticker",
                  textColor: "#FFFFFF",
                  systemImageName: "sensor.tag.radiowaves.forward",
                },
                secondaryButtonBehavior: "custom" as const,
              }
            : {}),
        },
      },
      tintColor: TINT,
    },
  });
}

async function storedRingIds(alarmId: string): Promise<string[]> {
  const data = await docStore.get(RINGS, alarmId);
  if (data === null) return [];
  try {
    const parsed: unknown = JSON.parse(data);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export const scheduler: AlarmScheduler = {
  async schedule(alarm, times) {
    // Rescheduling an alarm replaces its chain, so clear whatever is still pending first.
    await this.cancel(alarm.id);

    const future = times.filter((time) => time.getTime() > Date.now());
    if (future.length === 0) return;

    if (!alarmKitAvailable() || !(await ensureAuthorized())) {
      console.log(
        `[alarms] no native scheduler here; would schedule "${alarm.label}" at`,
        future.map((t) => t.toLocaleTimeString()),
      );
      return;
    }

    const ringIds: string[] = [];
    try {
      for (const time of future) {
        const id = Crypto.randomUUID();
        await AlarmKitManager.shared.scheduleOrReschedule(id, ringConfiguration(alarm, time));
        ringIds.push(id);
      }
    } catch (error) {
      console.warn(`[alarms] scheduling "${alarm.label}" failed:`, error);
    } finally {
      // Record whatever made it to the OS, so cancel() can always find the chain.
      if (ringIds.length > 0) await docStore.set(RINGS, alarm.id, JSON.stringify(ringIds));
    }
  },

  async cancel(alarmId) {
    const ringIds = await storedRingIds(alarmId);
    for (const id of ringIds) {
      try {
        await AlarmKitManager.shared.cancel(id);
      } catch (error) {
        console.warn(`[alarms] cancelling ring ${id} of "${alarmId}" failed:`, error);
      }
    }
    await docStore.remove(RINGS, alarmId);
  },
};

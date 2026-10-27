import type { Alarm } from "@tap/core";
import { requireOptionalNativeModule } from "expo";
import * as Crypto from "expo-crypto";
import { Platform } from "react-native";
import { AlarmConfigurationFactory, AlarmKitManager } from "react-native-ios-alarmkit";

import { docStore } from "./doc-store";

/**
 * Boundary between the domain (packages/core) and the OS alarm APIs.
 *
 * Both platforms use the same design (see docs/alarm-strategy.md): each ring of the nag chain
 * becomes its own OS alarm, so the system's Stop/dismiss silences one ring while the rest stay
 * scheduled OS-side; only `cancel()` — the dismiss-sticker tap — removes the whole chain. The
 * chain's per-ring ids are kept in the document store under the domain alarm's id.
 *
 * iOS 26+: AlarmKit via react-native-ios-alarmkit (ids must be UUIDs there).
 * Android: the local Expo module in modules/tap-alarm (AlarmManager.setAlarmClock + a foreground
 * service that loops the alarm sound behind a full-screen notification).
 * Anywhere else (simulators without the frameworks, denied auth): logs what it would have done.
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

/** One OS alarm = one ring. Implemented per platform below. */
interface RingBackend {
  /** True when scheduling can really happen here (framework present + permission granted). */
  ready(): Promise<boolean>;
  scheduleRing(id: string, alarm: Alarm, at: Date): Promise<void>;
  cancelRing(id: string): Promise<void>;
}

function iosRingConfiguration(alarm: Alarm, at: Date) {
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

const iosBackend: RingBackend = {
  async ready() {
    if (Platform.OS !== "ios" || !AlarmKitManager.shared.isSupported) return false;
    const state = await AlarmKitManager.shared.getAuthorizationState();
    if (state === "authorized") return true;
    if (state === "denied") return false;
    return AlarmKitManager.shared.requestAuthorization();
  },
  async scheduleRing(id, alarm, at) {
    await AlarmKitManager.shared.scheduleOrReschedule(id, iosRingConfiguration(alarm, at));
  },
  async cancelRing(id) {
    await AlarmKitManager.shared.cancel(id);
  },
};

/** The native half lives in modules/tap-alarm; absent in Expo Go, hence the try. */
type TapAlarmModule = {
  canScheduleExact(): boolean;
  requestNotificationPermission(): Promise<unknown>;
  scheduleRing(id: string, atMillis: number, label: string): void;
  cancelRing(id: string): void;
};

const tapAlarm =
  Platform.OS === "android" ? requireOptionalNativeModule<TapAlarmModule>("TapAlarm") : null;

const androidBackend: RingBackend = {
  async ready() {
    if (!tapAlarm) return false;
    // The full-screen alert needs the notification permission on Android 13+.
    await tapAlarm.requestNotificationPermission().catch(() => undefined);
    if (!tapAlarm.canScheduleExact()) {
      console.warn("[alarms] exact alarms are revoked; rings will be inexact");
    }
    return true;
  },
  async scheduleRing(id, alarm, at) {
    tapAlarm!.scheduleRing(id, at.getTime(), alarm.label);
  },
  async cancelRing(id) {
    tapAlarm!.cancelRing(id);
  },
};

const backend: RingBackend = Platform.OS === "android" ? androidBackend : iosBackend;

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

    if (!(await backend.ready())) {
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
        await backend.scheduleRing(id, alarm, time);
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
        await backend.cancelRing(id);
      } catch (error) {
        console.warn(`[alarms] cancelling ring ${id} of "${alarmId}" failed:`, error);
      }
    }
    await docStore.remove(RINGS, alarmId);
  },
};

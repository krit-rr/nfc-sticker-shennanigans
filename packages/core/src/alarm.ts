import { AlarmSchema, type Alarm } from "./schemas";

const MINUTE = 60_000;

/** Next time this alarm should ring after `now`, in local time. Null when disabled or never. */
export function nextOccurrence(alarm: Alarm, now: Date = new Date()): Date | null {
  if (!alarm.enabled) return null;
  for (let dayOffset = 0; dayOffset <= 7; dayOffset++) {
    const candidate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + dayOffset,
      alarm.hour,
      alarm.minute,
      0,
      0,
    );
    if (candidate.getTime() <= now.getTime()) continue;
    if (alarm.repeatDays.length === 0 || alarm.repeatDays.includes(candidate.getDay()))
      return candidate;
  }
  return null;
}

/**
 * Every ring time for one occurrence: the first ring plus the nag follow-ups.
 * Schedule all of them up front with the OS and cancel the rest when the dismiss tag is tapped.
 */
export function ringTimes(alarm: Alarm, firstRing: Date): Date[] {
  const followUps = alarm.nag?.times ?? 0;
  const every = (alarm.nag?.everyMinutes ?? 0) * MINUTE;
  return Array.from({ length: followUps + 1 }, (_, k) => new Date(firstRing.getTime() + k * every));
}

/** Does tapping `tagId` dismiss this alarm? Alarms without a dismiss tag accept any dismissal. */
export function canDismissWith(alarm: Alarm, tagId: string | null): boolean {
  return alarm.dismissTagId === null || alarm.dismissTagId === tagId;
}

/**
 * A one-shot alarm at the clock time of `at` (seconds dropped, as on a clock face).
 * Used to turn a sleep-cycle suggestion into an alarm.
 */
export function oneShotAlarmAt(
  at: Date,
  fields: Pick<Alarm, "id"> & Partial<Pick<Alarm, "label" | "dismissTagId" | "nag">>,
): Alarm {
  return AlarmSchema.parse({
    ...fields,
    hour: at.getHours(),
    minute: at.getMinutes(),
    repeatDays: [],
  });
}

/** The enabled alarm that rings soonest after `now`, with its ring time. Null when none will ring. */
export function soonestAlarm(
  alarms: readonly Alarm[],
  now: Date = new Date(),
): { alarm: Alarm; at: Date } | null {
  let soonest: { alarm: Alarm; at: Date } | null = null;
  for (const alarm of alarms) {
    const at = nextOccurrence(alarm, now);
    if (at && (!soonest || at.getTime() < soonest.at.getTime())) soonest = { alarm, at };
  }
  return soonest;
}

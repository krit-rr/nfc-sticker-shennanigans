import { describe, expect, it } from "vitest";

import { nextOccurrence, oneShotAlarmAt } from "./alarm";
import { fallAsleepTimesFor, inBedBy, wakeTimesFrom } from "./sleep";

const at = (y: number, m: number, d: number, h: number, mi: number, s = 0) =>
  new Date(y, m - 1, d, h, mi, s, 0);

const minutesBetween = (a: Date, b: Date) => (b.getTime() - a.getTime()) / 60_000;

describe("fallAsleepTimesFor (sleepyti.me: I have to wake up at…)", () => {
  it("counts back 6, 5, 4 and 3 cycles from the wake time, earliest first", () => {
    const options = fallAsleepTimesFor(at(2026, 10, 6, 7, 0));
    expect(options.map((o) => o.time)).toEqual([
      at(2026, 10, 5, 22, 0),
      at(2026, 10, 5, 23, 30),
      at(2026, 10, 6, 1, 0),
      at(2026, 10, 6, 2, 30),
    ]);
    expect(options.map((o) => o.cycles)).toEqual([6, 5, 4, 3]);
    expect(options.map((o) => o.hoursAsleep)).toEqual([9, 7.5, 6, 4.5]);
    expect(options.map((o) => o.recommended)).toEqual([true, true, false, false]);
  });

  it("uses the offsets from the original script: 270 minutes, then 90 more each", () => {
    const wake = at(2026, 10, 6, 6, 15);
    expect(fallAsleepTimesFor(wake).map((o) => minutesBetween(o.time, wake))).toEqual([
      540, 450, 360, 270,
    ]);
  });

  it("puts you in bed 14 minutes before you need to be asleep", () => {
    expect(inBedBy(at(2026, 10, 5, 22, 0))).toEqual(at(2026, 10, 5, 21, 46));
  });
});

describe("wakeTimesFrom (sleepyti.me: zzz, if I go to bed now)", () => {
  it("adds 14 minutes to fall asleep, then 1 to 6 cycles", () => {
    const options = wakeTimesFrom(at(2026, 10, 5, 23, 0));
    expect(options.map((o) => o.time)).toEqual([
      at(2026, 10, 6, 0, 44),
      at(2026, 10, 6, 2, 14),
      at(2026, 10, 6, 3, 44),
      at(2026, 10, 6, 5, 14),
      at(2026, 10, 6, 6, 44),
      at(2026, 10, 6, 8, 14),
    ]);
    expect(options.map((o) => o.cycles)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(options.filter((o) => o.recommended).map((o) => o.cycles)).toEqual([5, 6]);
  });

  it("uses the offsets from the original script: 104 minutes, then 90 more each", () => {
    const bed = at(2026, 10, 5, 22, 37);
    expect(wakeTimesFrom(bed).map((o) => minutesBetween(bed, o.time))).toEqual([
      104, 194, 284, 374, 464, 554,
    ]);
  });

  it("skips the fall-asleep allowance when given the time you will be asleep", () => {
    const [five] = wakeTimesFrom(at(2026, 10, 5, 23, 0), { fallAsleepMinutes: 0, cycles: [5] });
    expect(five!.time).toEqual(at(2026, 10, 6, 6, 30));
  });
});

describe("turning a suggestion into an alarm", () => {
  it("creates a one-shot alarm that next rings at the suggested minute", () => {
    const now = at(2026, 10, 5, 23, 0, 40);
    const fiveCycles = wakeTimesFrom(now)[4]!;
    const alarm = oneShotAlarmAt(fiveCycles.time, {
      id: "sleep-1",
      label: "Sleep now",
      dismissTagId: "b4thr00m",
      nag: { everyMinutes: 3, times: 5 },
    });
    expect(alarm).toMatchObject({
      hour: 6,
      minute: 44,
      repeatDays: [],
      enabled: true,
      dismissTagId: "b4thr00m",
    });
    expect(nextOccurrence(alarm, now)).toEqual(at(2026, 10, 6, 6, 44));
  });
});

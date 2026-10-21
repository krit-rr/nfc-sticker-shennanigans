import { describe, expect, it } from "vitest";

import { canDismissWith, nextOccurrence, ringTimes, soonestAlarm } from "./alarm";
import { AlarmSchema } from "./schemas";

const at = (y: number, m: number, d: number, h: number, mi: number) =>
  new Date(y, m - 1, d, h, mi, 0, 0);

const base = AlarmSchema.parse({ id: "a1", hour: 7, minute: 30 });

describe("nextOccurrence", () => {
  it("rings later today if the time has not passed", () => {
    expect(nextOccurrence(base, at(2026, 9, 28, 6, 0))).toEqual(at(2026, 9, 28, 7, 30));
  });

  it("rolls to tomorrow once the time has passed", () => {
    expect(nextOccurrence(base, at(2026, 9, 28, 7, 30))).toEqual(at(2026, 9, 29, 7, 30));
  });

  it("skips to the next enabled weekday", () => {
    // 2026-09-28 is a Monday; weekdays-only alarm asked on Friday evening → Monday.
    const weekdays = { ...base, repeatDays: [1, 2, 3, 4, 5] };
    expect(nextOccurrence(weekdays, at(2026, 9, 25, 20, 0))).toEqual(at(2026, 9, 28, 7, 30));
  });

  it("is null when disabled", () => {
    expect(nextOccurrence({ ...base, enabled: false }, at(2026, 9, 28, 6, 0))).toBeNull();
  });
});

describe("ringTimes", () => {
  it("is just the first ring without nag mode", () => {
    expect(ringTimes(base, at(2026, 9, 28, 7, 30))).toEqual([at(2026, 9, 28, 7, 30)]);
  });

  it("adds follow-up rings in nag mode", () => {
    const nagging = { ...base, nag: { everyMinutes: 3, times: 2 } };
    expect(ringTimes(nagging, at(2026, 9, 28, 7, 30))).toEqual([
      at(2026, 9, 28, 7, 30),
      at(2026, 9, 28, 7, 33),
      at(2026, 9, 28, 7, 36),
    ]);
  });
});

describe("canDismissWith", () => {
  it("requires the anchor tag when one is set", () => {
    const anchored = { ...base, dismissTagId: "7k3m9x2a" };
    expect(canDismissWith(anchored, "7k3m9x2a")).toBe(true);
    expect(canDismissWith(anchored, "zzzzzzzz")).toBe(false);
    expect(canDismissWith(anchored, null)).toBe(false);
    expect(canDismissWith(base, null)).toBe(true);
  });
});

describe("soonestAlarm", () => {
  it("picks the enabled alarm that rings first", () => {
    const early = { ...base, id: "early", hour: 6, minute: 0 };
    const off = { ...base, id: "off", hour: 5, minute: 0, enabled: false };
    const result = soonestAlarm([base, early, off], at(2026, 9, 28, 4, 0));
    expect(result?.alarm.id).toBe("early");
    expect(result?.at).toEqual(at(2026, 9, 28, 6, 0));
  });

  it("is null when nothing is enabled", () => {
    expect(soonestAlarm([{ ...base, enabled: false }], at(2026, 9, 28, 4, 0))).toBeNull();
  });
});

import { describe, expect, it } from "vitest";

import {
  RoutineRunSchema,
  applyTap,
  completeStep,
  currentStep,
  progress,
  startRun,
} from "./routine";
import { RoutineSchema } from "./schemas";

const morning = RoutineSchema.parse({
  id: "morning",
  name: "Morning",
  steps: [
    { id: "meds", title: "Take meds", tagId: "aaaaaaaa" },
    { id: "teeth", title: "Brush teeth", tagId: "bbbbbbbb" },
    { id: "bag", title: "Pack bag", tagId: null },
  ],
});

const now = new Date(2026, 8, 28, 7, 0);

describe("ordered routine", () => {
  it("walks through steps in order and finishes", () => {
    let run = startRun(morning, now);
    expect(currentStep(morning, run)?.id).toBe("meds");

    const first = applyTap(morning, run, "aaaaaaaa", now);
    expect(first.result).toBe("advanced");
    run = first.run;
    expect(progress(morning, run)).toEqual({ done: 1, total: 3, fraction: 1 / 3 });

    const second = applyTap(morning, run, "bbbbbbbb", now);
    expect(second.result).toBe("advanced");
    run = second.run;

    const third = completeStep(morning, run, "bag", now);
    expect(third.result).toBe("finished");
    expect(third.run.finishedAt).toBe(now.toISOString());
    expect(applyTap(morning, third.run, "aaaaaaaa", now).result).toBe("already-finished");
  });

  it("tells you which step you skipped", () => {
    const run = startRun(morning, now);
    const result = applyTap(morning, run, "bbbbbbbb", now);
    expect(result.result).toBe("wrong-tag");
    if (result.result === "wrong-tag") expect(result.expected.id).toBe("meds");
    expect(result.run).toBe(run);
  });

  it("ignores tags that are not part of the routine and repeated taps", () => {
    const run = startRun(morning, now);
    expect(applyTap(morning, run, "cccccccc", now).result).toBe("unknown-tag");
    const after = applyTap(morning, run, "aaaaaaaa", now).run;
    expect(applyTap(morning, after, "aaaaaaaa", now).result).toBe("already-done");
  });
});

describe("unordered routine", () => {
  it("accepts steps in any order", () => {
    const anyOrder = { ...morning, ordered: false };
    const run = startRun(anyOrder, now);
    const result = applyTap(anyOrder, run, "bbbbbbbb", now);
    expect(result.result).toBe("advanced");
    expect(result.run.completedStepIds).toEqual(["teeth"]);
    expect(currentStep(anyOrder, result.run)?.id).toBe("meds");
  });
});

describe("RoutineRunSchema", () => {
  it("round-trips a run through JSON, as the apps persist it", () => {
    const run = applyTap(morning, startRun(morning, now), "aaaaaaaa", now).run;
    expect(RoutineRunSchema.parse(JSON.parse(JSON.stringify(run)))).toEqual(run);
  });

  it("rejects a run with a bad timestamp", () => {
    expect(
      RoutineRunSchema.safeParse({ routineId: "morning", startedAt: "yesterday" }).success,
    ).toBe(false);
  });
});

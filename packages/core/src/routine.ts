import type { Routine, RoutineStep } from "./schemas";

export type RoutineRun = {
  routineId: string;
  startedAt: string;
  completedStepIds: string[];
  finishedAt: string | null;
};

export type TapResult =
  | { result: "advanced"; run: RoutineRun; step: RoutineStep }
  | { result: "finished"; run: RoutineRun; step: RoutineStep }
  | { result: "wrong-tag"; run: RoutineRun; expected: RoutineStep }
  | { result: "already-done"; run: RoutineRun; step: RoutineStep }
  | { result: "unknown-tag"; run: RoutineRun }
  | { result: "already-finished"; run: RoutineRun };

export function startRun(routine: Routine, now: Date = new Date()): RoutineRun {
  return {
    routineId: routine.id,
    startedAt: now.toISOString(),
    completedStepIds: [],
    finishedAt: null,
  };
}

export function remainingSteps(routine: Routine, run: RoutineRun): RoutineStep[] {
  return routine.steps.filter((step) => !run.completedStepIds.includes(step.id));
}

/** The step the user should do next (first remaining step), or null when done. */
export function currentStep(routine: Routine, run: RoutineRun): RoutineStep | null {
  return remainingSteps(routine, run)[0] ?? null;
}

export function progress(
  routine: Routine,
  run: RoutineRun,
): { done: number; total: number; fraction: number } {
  const total = routine.steps.length;
  const done = run.completedStepIds.length;
  return { done, total, fraction: total === 0 ? 1 : done / total };
}

function finish(routine: Routine, run: RoutineRun, step: RoutineStep, now: Date): TapResult {
  const completed = { ...run, completedStepIds: [...run.completedStepIds, step.id] };
  if (completed.completedStepIds.length >= routine.steps.length) {
    return { result: "finished", step, run: { ...completed, finishedAt: now.toISOString() } };
  }
  return { result: "advanced", step, run: completed };
}

/** Complete a step by hand (for steps without a tag, or when the sticker is unreachable). */
export function completeStep(
  routine: Routine,
  run: RoutineRun,
  stepId: string,
  now: Date = new Date(),
): TapResult {
  if (run.finishedAt) return { result: "already-finished", run };
  const step = routine.steps.find((s) => s.id === stepId);
  if (!step) return { result: "unknown-tag", run };
  if (run.completedStepIds.includes(step.id)) return { result: "already-done", run, step };
  if (routine.ordered) {
    const expected = currentStep(routine, run)!;
    if (expected.id !== step.id) return { result: "wrong-tag", run, expected };
  }
  return finish(routine, run, step, now);
}

/** Apply a sticker tap to a run. Pure: returns the new run, never mutates. */
export function applyTap(
  routine: Routine,
  run: RoutineRun,
  tagId: string,
  now: Date = new Date(),
): TapResult {
  if (run.finishedAt) return { result: "already-finished", run };
  const step = routine.steps.find((s) => s.tagId === tagId);
  if (!step) return { result: "unknown-tag", run };
  return completeStep(routine, run, step.id, now);
}

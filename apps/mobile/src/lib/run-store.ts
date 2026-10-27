import { RoutineRunSchema, type RoutineRun } from "@tap/core";

import { docStore } from "./doc-store";

/** The active (or last finished) run of each routine, keyed by routine id. */
const COLLECTION = "routine-runs";

export async function loadRun(routineId: string): Promise<RoutineRun | null> {
  const data = await docStore.get(COLLECTION, routineId);
  if (data === null) return null;
  try {
    const result = RoutineRunSchema.safeParse(JSON.parse(data));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export async function saveRun(run: RoutineRun): Promise<void> {
  await docStore.set(COLLECTION, run.routineId, JSON.stringify(run));
}

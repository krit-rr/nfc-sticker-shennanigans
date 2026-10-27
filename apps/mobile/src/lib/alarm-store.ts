import { AlarmSchema, demoAlarms, type Alarm } from "@tap/core";

import { docStore } from "./doc-store";

/**
 * Alarms are stored as one JSON array so their order on the Alarms screen survives
 * restarts. Until the first edit, the demo alarms stand in.
 */
const COLLECTION = "alarms";
const DOC = "all";

export async function loadAlarms(): Promise<Alarm[]> {
  const data = await docStore.get(COLLECTION, DOC);
  if (data !== null) {
    try {
      const result = AlarmSchema.array().safeParse(JSON.parse(data));
      if (result.success) return result.data;
    } catch {
      // fall through to the demo alarms
    }
  }
  return demoAlarms;
}

export async function saveAlarms(alarms: readonly Alarm[]): Promise<void> {
  await docStore.set(COLLECTION, DOC, JSON.stringify(alarms));
}

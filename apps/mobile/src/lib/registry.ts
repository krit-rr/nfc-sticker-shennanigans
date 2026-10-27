import { TagSchema, demoTags, type Tag, type TagRegistry } from "@tap/core";

import { docStore } from "./doc-store";

const TAGS = "tags";
const META = "meta";
const SEEDED = "tags-seeded";

function parseTag(data: string): Tag | null {
  try {
    const result = TagSchema.safeParse(JSON.parse(data));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

let seeded: Promise<void> | null = null;

/** First run only: start from the demo stickers so the app has something to show. */
function ensureSeeded(): Promise<void> {
  seeded ??= (async () => {
    if ((await docStore.get(META, SEEDED)) !== null) return;
    for (const tag of demoTags) await docStore.set(TAGS, tag.id, JSON.stringify(tag));
    await docStore.set(META, SEEDED, "1");
  })();
  return seeded;
}

/** The device's tag registry, persisted with expo-sqlite so registered stickers survive restarts. */
export const registry: TagRegistry = {
  async get(id) {
    await ensureSeeded();
    const data = await docStore.get(TAGS, id);
    return data === null ? null : parseTag(data);
  },
  async list() {
    await ensureSeeded();
    const rows = await docStore.list(TAGS);
    return rows.map(parseTag).filter((tag): tag is Tag => tag !== null);
  },
  async upsert(tag) {
    await ensureSeeded();
    await docStore.set(TAGS, tag.id, JSON.stringify(TagSchema.parse(tag)));
  },
  async remove(id) {
    await ensureSeeded();
    await docStore.remove(TAGS, id);
  },
};

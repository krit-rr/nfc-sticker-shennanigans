import type { Tag } from "./schemas";

/** Where an app keeps its tags. Mobile backs this with on-device storage; web with a database. */
export interface TagRegistry {
  get(id: string): Promise<Tag | null>;
  list(): Promise<Tag[]>;
  upsert(tag: Tag): Promise<void>;
  remove(id: string): Promise<void>;
}

/** In-memory registry for tests, demos, and prototyping before storage exists. */
export function createMemoryRegistry(initial: readonly Tag[] = []): TagRegistry {
  const tags = new Map(initial.map((tag) => [tag.id, tag]));
  return {
    get: async (id) => tags.get(id) ?? null,
    list: async () => [...tags.values()],
    upsert: async (tag) => {
      tags.set(tag.id, tag);
    },
    remove: async (id) => {
      tags.delete(id);
    },
  };
}

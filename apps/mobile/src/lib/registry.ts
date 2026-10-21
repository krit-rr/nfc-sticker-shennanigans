import { createMemoryRegistry, demoTags } from "@tap/core";

/**
 * The device's tag registry. In-memory with demo data for now.
 * TODO(next): persist with expo-sqlite so registered stickers survive restarts.
 */
export const registry = createMemoryRegistry(demoTags);

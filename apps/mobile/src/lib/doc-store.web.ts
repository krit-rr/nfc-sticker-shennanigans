import type { DocStore } from "./doc-store";

export type { DocStore };

/**
 * Web build of the document store. expo-sqlite needs a wasm setup on web, and the web
 * build of this app is a preview, so documents live in memory for the session.
 */
const collections = new Map<string, Map<string, string>>();

function collectionFor(name: string): Map<string, string> {
  let collection = collections.get(name);
  if (!collection) {
    collection = new Map();
    collections.set(name, collection);
  }
  return collection;
}

export const docStore: DocStore = {
  get: async (collection, id) => collectionFor(collection).get(id) ?? null,
  set: async (collection, id, data) => {
    collectionFor(collection).set(id, data);
  },
  remove: async (collection, id) => {
    collectionFor(collection).delete(id);
  },
  list: async (collection) => [...collectionFor(collection).values()],
};

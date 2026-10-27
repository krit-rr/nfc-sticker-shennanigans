import * as SQLite from "expo-sqlite";

/**
 * A tiny JSON document store: rows of (collection, id) → serialized JSON.
 * Backed by expo-sqlite on iOS and Android; doc-store.web.ts keeps web in memory.
 * Callers validate what they read with the zod schemas in @tap/core, so a corrupt
 * or outdated row degrades to "not there" instead of crashing a screen.
 */
export interface DocStore {
  get(collection: string, id: string): Promise<string | null>;
  set(collection: string, id: string, data: string): Promise<void>;
  remove(collection: string, id: string): Promise<void>;
  /** Every document in the collection, oldest first. */
  list(collection: string): Promise<string[]>;
}

let db: Promise<SQLite.SQLiteDatabase> | null = null;

function open(): Promise<SQLite.SQLiteDatabase> {
  db ??= (async () => {
    const handle = await SQLite.openDatabaseAsync("tap.db");
    await handle.execAsync(
      `PRAGMA journal_mode = WAL;
       CREATE TABLE IF NOT EXISTS documents (
         collection TEXT NOT NULL,
         id TEXT NOT NULL,
         data TEXT NOT NULL,
         PRIMARY KEY (collection, id)
       );`,
    );
    return handle;
  })();
  return db;
}

export const docStore: DocStore = {
  async get(collection, id) {
    const row = await (
      await open()
    ).getFirstAsync<{ data: string }>(
      "SELECT data FROM documents WHERE collection = ? AND id = ?",
      collection,
      id,
    );
    return row?.data ?? null;
  },
  async set(collection, id, data) {
    await (
      await open()
    ).runAsync(
      `INSERT INTO documents (collection, id, data) VALUES (?, ?, ?)
       ON CONFLICT (collection, id) DO UPDATE SET data = excluded.data`,
      collection,
      id,
      data,
    );
  },
  async remove(collection, id) {
    await (
      await open()
    ).runAsync("DELETE FROM documents WHERE collection = ? AND id = ?", collection, id);
  },
  async list(collection) {
    const rows = await (
      await open()
    ).getAllAsync<{ data: string }>(
      "SELECT data FROM documents WHERE collection = ? ORDER BY rowid",
      collection,
    );
    return rows.map((row) => row.data);
  },
};

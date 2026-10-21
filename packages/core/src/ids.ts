/**
 * Tag IDs are what we write onto stickers, so they are short, URL-safe, and hard to misread:
 * lowercase Crockford base32 (no i, l, o, u). 8 chars = 2^40 possibilities.
 */
export const TAG_ID_ALPHABET = "0123456789abcdefghjkmnpqrstvwxyz";
export const TAG_ID_LENGTH = 8;

const TAG_ID_RE = new RegExp(`^[${TAG_ID_ALPHABET}]{${TAG_ID_LENGTH}}$`);

export type RandomBytes = (length: number) => Uint8Array;

const defaultRandom: RandomBytes = (length) => {
  const c = globalThis.crypto;
  if (!c?.getRandomValues) {
    throw new Error(
      "crypto.getRandomValues is unavailable in this runtime; pass a RandomBytes source to newTagId()",
    );
  }
  return c.getRandomValues(new Uint8Array(length));
};

export function isTagId(value: unknown): value is string {
  return typeof value === "string" && TAG_ID_RE.test(value);
}

export function newTagId(random: RandomBytes = defaultRandom): string {
  const bytes = random(TAG_ID_LENGTH);
  let id = "";
  for (let i = 0; i < TAG_ID_LENGTH; i++) id += TAG_ID_ALPHABET[bytes[i]! & 31];
  return id;
}

/**
 * Accepts a hand-typed ID (any case, Crockford look-alikes such as I/L→1 and O→0)
 * and returns the canonical form, or null if it is not a valid ID.
 */
export function normalizeTagId(input: string): string | null {
  const cleaned = input
    .trim()
    .toLowerCase()
    .replace(/[il]/g, "1")
    .replace(/o/g, "0")
    .replace(/-/g, "");
  return isTagId(cleaned) ? cleaned : null;
}

import { describe, expect, it } from "vitest";

import { TAG_ID_ALPHABET, TAG_ID_LENGTH, isTagId, newTagId, normalizeTagId } from "./ids";

describe("tag ids", () => {
  it("generates ids of the right length from the safe alphabet", () => {
    for (let i = 0; i < 50; i++) {
      const id = newTagId();
      expect(id).toHaveLength(TAG_ID_LENGTH);
      expect(isTagId(id)).toBe(true);
      for (const ch of id) expect(TAG_ID_ALPHABET).toContain(ch);
    }
  });

  it("is deterministic given a random source", () => {
    const zeros = () => new Uint8Array(TAG_ID_LENGTH);
    expect(newTagId(zeros)).toBe("00000000");
    expect(newTagId(() => Uint8Array.from({ length: TAG_ID_LENGTH }, () => 31))).toBe("zzzzzzzz");
  });

  it("normalizes hand-typed ids", () => {
    expect(normalizeTagId(" 7K3M-9X2A ")).toBe("7k3m9x2a");
    expect(normalizeTagId("7k3m9x2I")).toBe("7k3m9x21");
    expect(normalizeTagId("Ok3m9x2a")).toBe("0k3m9x2a");
    expect(normalizeTagId("nope")).toBeNull();
    expect(normalizeTagId("7k3m9x2u")).toBeNull();
  });
});

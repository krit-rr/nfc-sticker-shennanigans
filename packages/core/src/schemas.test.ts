import { describe, expect, it } from "vitest";

import { ActionSchema, TagSchema } from "./schemas";

describe("schemas", () => {
  it("parses a tag and fills defaults", () => {
    const tag = TagSchema.parse({
      id: "7k3m9x2a",
      label: "Bathroom sink",
      action: { kind: "alarm.dismiss" },
      createdAt: "2026-09-28T07:00:00.000Z",
    });
    expect(tag.chip).toBeNull();
    expect(tag.lastTappedAt).toBeNull();
  });

  it("rejects unknown actions and bad ids", () => {
    expect(ActionSchema.safeParse({ kind: "teleport" }).success).toBe(false);
    expect(
      TagSchema.safeParse({
        id: "nope",
        label: "x",
        action: { kind: "focus.toggle" },
        createdAt: "2026-09-28T07:00:00.000Z",
      }).success,
    ).toBe(false);
  });

  it("validates action payloads", () => {
    expect(ActionSchema.safeParse({ kind: "timer.start", minutes: 25 }).success).toBe(true);
    expect(ActionSchema.safeParse({ kind: "timer.start", minutes: -1 }).success).toBe(false);
    expect(ActionSchema.safeParse({ kind: "card.open", slug: "kritika" }).success).toBe(true);
    expect(ActionSchema.safeParse({ kind: "url.open", url: "not a url" }).success).toBe(false);
  });
});

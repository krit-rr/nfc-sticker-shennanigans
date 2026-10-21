import { describe, expect, it } from "vitest";

import { buildCardUrl, buildTagDeepLink, buildTagUrl, parseTapUrl } from "./tag-url";

describe("tag urls", () => {
  it("builds urls without doubling slashes", () => {
    expect(buildTagUrl("https://tap.example.com/", "7k3m9x2a")).toBe(
      "https://tap.example.com/t/7k3m9x2a",
    );
    expect(buildCardUrl("https://tap.example.com", "kritika")).toBe(
      "https://tap.example.com/c/kritika",
    );
    expect(buildTagDeepLink("7k3m9x2a")).toBe("tap://t/7k3m9x2a");
  });

  it("parses https, deep-link, and trailing-junk variants", () => {
    expect(parseTapUrl("https://tap.example.com/t/7k3m9x2a")).toEqual({
      kind: "tag",
      tagId: "7k3m9x2a",
    });
    expect(parseTapUrl("https://tap.example.com/t/7K3M9X2A/?utm=x#frag")).toEqual({
      kind: "tag",
      tagId: "7k3m9x2a",
    });
    expect(parseTapUrl("tap://t/7k3m9x2a")).toEqual({ kind: "tag", tagId: "7k3m9x2a" });
    expect(parseTapUrl("tap:///t/7k3m9x2a")).toEqual({ kind: "tag", tagId: "7k3m9x2a" });
    expect(parseTapUrl("https://tap.example.com/c/kritika")).toEqual({
      kind: "card",
      slug: "kritika",
    });
  });

  it("rejects everything else", () => {
    expect(parseTapUrl("https://tap.example.com/")).toBeNull();
    expect(parseTapUrl("https://tap.example.com/x/abc")).toBeNull();
    expect(parseTapUrl("https://tap.example.com/c/Not_A_Slug")).toBeNull();
    expect(parseTapUrl("not a url")).toBeNull();
  });
});

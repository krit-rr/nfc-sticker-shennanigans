import { describe, expect, it } from "vitest";

import { CardSchema } from "./schemas";
import { toVCard } from "./vcard";

describe("toVCard", () => {
  it("renders a full card with CRLF line endings", () => {
    const card = CardSchema.parse({
      slug: "kritika",
      name: "Kritika Ravichander",
      title: "Builder",
      company: "Cadre, Inc.",
      email: "krit@example.com",
      phone: "+1 555 555 0123",
      website: "https://example.com",
      links: [{ label: "LinkedIn", url: "https://linkedin.com/in/kritika" }],
      note: "Met at the NFC meetup; likes stickers",
    });
    const vcard = toVCard(card);
    expect(vcard.startsWith("BEGIN:VCARD\r\nVERSION:3.0\r\n")).toBe(true);
    expect(vcard).toContain("N:Ravichander;Kritika;;;\r\n");
    expect(vcard).toContain("FN:Kritika Ravichander\r\n");
    expect(vcard).toContain("ORG:Cadre\\, Inc.\r\n");
    expect(vcard).toContain("NOTE:Met at the NFC meetup\; likes stickers\r\n");
    expect(vcard).toContain("URL;TYPE=LinkedIn:https://linkedin.com/in/kritika\r\n");
    expect(vcard.endsWith("END:VCARD\r\n")).toBe(true);
  });

  it("handles a single-word name and omits empty fields", () => {
    const vcard = toVCard(CardSchema.parse({ slug: "cher", name: "Cher" }));
    expect(vcard).toContain("N:;Cher;;;\r\n");
    expect(vcard).not.toContain("ORG:");
    expect(vcard).not.toContain("TEL");
  });
});

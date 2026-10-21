import { describe, expect, it } from "vitest";

import { fitsOn, smallestChipFor } from "./capacity";
import { androidApplicationRecord, mimeRecord, uriRecord } from "./ndef";

describe("capacity", () => {
  it("a normal tag URL plus an Android app record fits on the cheapest sticker", () => {
    const result = fitsOn("ntag213", [
      uriRecord("https://tap.example.com/t/7k3m9x2a"),
      androidApplicationRecord("com.kritika.tap"),
    ]);
    expect(result.fits).toBe(true);
    expect(result.headroom).toBeGreaterThan(50);
  });

  it("a full vCard does not fit on an NTAG213 but does on an NTAG215", () => {
    const vcard = mimeRecord(
      "text/vcard",
      "BEGIN:VCARD\r\nVERSION:3.0\r\n" + "NOTE:" + "x".repeat(200) + "\r\nEND:VCARD\r\n",
    );
    expect(fitsOn("ntag213", [vcard]).fits).toBe(false);
    expect(fitsOn("ntag215", [vcard]).fits).toBe(true);
    expect(smallestChipFor([vcard])).toBe("ntag215");
  });

  it("returns null when nothing is big enough", () => {
    expect(
      smallestChipFor([mimeRecord("application/octet-stream", new Uint8Array(1000))]),
    ).toBeNull();
  });
});

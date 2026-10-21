import { describe, expect, it } from "vitest";

import {
  androidApplicationRecord,
  decodeMessage,
  decodeUriPayload,
  encodeMessage,
  encodeUriPayload,
  mimeRecord,
  textRecord,
  uriRecord,
  type NdefRecord,
} from "./ndef";

const bytes = (u8: Uint8Array) => Array.from(u8);

describe("URI payload", () => {
  it("abbreviates with the longest matching prefix", () => {
    expect(bytes(encodeUriPayload("https://www.example.com"))).toEqual([
      0x02,
      ...bytes(new TextEncoder().encode("example.com")),
    ]);
    expect(bytes(encodeUriPayload("https://tap.example.com/t/abc"))[0]).toBe(0x04);
    expect(bytes(encodeUriPayload("tel:+15555550123"))[0]).toBe(0x05);
    expect(bytes(encodeUriPayload("tap://t/abc"))[0]).toBe(0x00);
  });

  it("round-trips", () => {
    for (const uri of [
      "https://tap.example.com/t/7k3m9x2a",
      "mailto:hi@example.com",
      "tap://t/abc",
      "https://www.a.b/ünïcode",
    ]) {
      expect(decodeUriPayload(encodeUriPayload(uri))).toBe(uri);
    }
  });

  it("treats unknown prefix codes as no prefix", () => {
    expect(decodeUriPayload(Uint8Array.of(0xff, 0x61))).toBe("a");
  });
});

describe("message", () => {
  it("encodes a single short URI record with MB|ME|SR flags", () => {
    const out = encodeMessage([uriRecord("https://tap.example.com/t/abc")]);
    // flags: MB(0x80) | ME(0x40) | SR(0x10) | TNF well-known(0x01)
    expect(out[0]).toBe(0xd1);
    expect(out[1]).toBe(1); // type length ("U")
    expect(out[2]).toBe(out.length - 4); // payload length
    expect(out[3]).toBe(0x55); // "U"
  });

  it("round-trips a multi-record message and sets MB/ME only on the ends", () => {
    const records: NdefRecord[] = [
      uriRecord("https://tap.example.com/t/abc"),
      textRecord("Bathroom sink", "en"),
      mimeRecord("text/vcard", "BEGIN:VCARD\r\nEND:VCARD\r\n"),
      androidApplicationRecord("com.example.tap"),
    ];
    const encoded = encodeMessage(records);
    const decoded = decodeMessage(encoded);

    expect(decoded).toHaveLength(4);
    expect(decoded[0]).toEqual(records[0]);
    expect(decoded[1]).toEqual(records[1]);
    expect(decoded[2]).toMatchObject({ type: "mime", mimeType: "text/vcard" });
    expect(decoded[3]).toMatchObject({ type: "external", domain: "android.com", name: "pkg" });
    expect(new TextDecoder().decode((decoded[3] as { data: Uint8Array }).data)).toBe(
      "com.example.tap",
    );

    expect(encoded[0]! & 0x80).toBe(0x80); // first record: MB
    expect(encoded[0]! & 0x40).toBe(0); // first record: not ME
  });

  it("uses a 4-byte payload length for records over 255 bytes", () => {
    const long = textRecord("x".repeat(300));
    const encoded = encodeMessage([long]);
    expect(encoded[0]! & 0x10).toBe(0); // SR flag clear
    expect(decodeMessage(encoded)).toEqual([long]);
  });

  it("encodes an empty message as a single empty record and decodes it back to []", () => {
    const encoded = encodeMessage([]);
    expect(bytes(encoded)).toEqual([0xd0, 0x00, 0x00]);
    expect(decodeMessage(encoded)).toEqual([]);
  });

  it("rejects truncated input instead of returning garbage", () => {
    const encoded = encodeMessage([uriRecord("https://tap.example.com/t/abc")]);
    expect(() => decodeMessage(encoded.subarray(0, encoded.length - 3))).toThrow(/truncated/);
  });

  it("keeps unknown records as raw", () => {
    const raw: NdefRecord = {
      type: "raw",
      tnf: 0x05,
      recordType: new Uint8Array(0),
      payload: Uint8Array.of(1, 2, 3),
    };
    expect(decodeMessage(encodeMessage([raw]))).toEqual([raw]);
  });
});

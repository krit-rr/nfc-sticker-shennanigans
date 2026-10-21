/**
 * NDEF (NFC Data Exchange Format) encode/decode in pure TypeScript.
 *
 * Covers what stickers actually carry: URI records (RTD-URI), Text records (RTD-Text),
 * MIME records (e.g. text/vcard), and External records (e.g. Android Application Records).
 * Anything else round-trips as a `raw` record. Chunked records (CF flag) are not supported.
 *
 * Refs: NFC Forum NDEF 1.0 §3, RTD-URI 1.0 §3.2, RTD-Text 1.0 §3.2.
 */

export const TNF = {
  EMPTY: 0x00,
  WELL_KNOWN: 0x01,
  MIME: 0x02,
  ABSOLUTE_URI: 0x03,
  EXTERNAL: 0x04,
  UNKNOWN: 0x05,
  UNCHANGED: 0x06,
} as const;

const FLAG_MB = 0x80; // message begin
const FLAG_ME = 0x40; // message end
const FLAG_CF = 0x20; // chunk flag
const FLAG_SR = 0x10; // short record (1-byte payload length)
const FLAG_IL = 0x08; // id length present
const TNF_MASK = 0x07;

const TYPE_URI = 0x55; // "U"
const TYPE_TEXT = 0x54; // "T"

export type NdefRecord =
  | { type: "uri"; uri: string }
  | { type: "text"; text: string; lang: string }
  | { type: "mime"; mimeType: string; data: Uint8Array }
  | { type: "external"; domain: string; name: string; data: Uint8Array }
  | { type: "raw"; tnf: number; recordType: Uint8Array; id?: Uint8Array; payload: Uint8Array };

/** RTD-URI prefix table. The index is the one-byte identifier code written before the URI. */
export const URI_PREFIXES: readonly string[] = [
  "",
  "http://www.",
  "https://www.",
  "http://",
  "https://",
  "tel:",
  "mailto:",
  "ftp://anonymous:anonymous@",
  "ftp://ftp.",
  "ftps://",
  "sftp://",
  "smb://",
  "nfs://",
  "ftp://",
  "dav://",
  "news:",
  "telnet://",
  "imap:",
  "rtsp://",
  "urn:",
  "pop:",
  "sip:",
  "sips:",
  "tftp:",
  "btspp://",
  "btl2cap://",
  "btgoep://",
  "tcpobex://",
  "irdaobex://",
  "file://",
  "urn:epc:id:",
  "urn:epc:tag:",
  "urn:epc:pat:",
  "urn:epc:raw:",
  "urn:epc:",
  "urn:nfc:",
];

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function utf8(text: string): Uint8Array {
  return encoder.encode(text);
}

function ascii(text: string): Uint8Array {
  const out = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code > 0x7f) throw new RangeError(`non-ASCII character in "${text}"`);
    out[i] = code;
  }
  return out;
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

// ---------- record constructors ----------

export function uriRecord(uri: string): NdefRecord {
  return { type: "uri", uri };
}

export function textRecord(text: string, lang = "en"): NdefRecord {
  return { type: "text", text, lang };
}

export function mimeRecord(mimeType: string, data: Uint8Array | string): NdefRecord {
  return { type: "mime", mimeType, data: typeof data === "string" ? utf8(data) : data };
}

export function externalRecord(
  domain: string,
  name: string,
  data: Uint8Array | string,
): NdefRecord {
  return { type: "external", domain, name, data: typeof data === "string" ? utf8(data) : data };
}

/**
 * Android Application Record. When present, Android launches this package on tap
 * (or opens its Play Store page if it is not installed). Put it after the URI record
 * so iOS and other readers still see the URI first.
 */
export function androidApplicationRecord(packageName: string): NdefRecord {
  return externalRecord("android.com", "pkg", packageName);
}

// ---------- payload codecs ----------

/** Picks the longest matching RTD-URI prefix so the sticker stores as few bytes as possible. */
export function encodeUriPayload(uri: string): Uint8Array {
  let code = 0;
  for (let i = 1; i < URI_PREFIXES.length; i++) {
    const prefix = URI_PREFIXES[i]!;
    if (uri.startsWith(prefix) && prefix.length > URI_PREFIXES[code]!.length) code = i;
  }
  return concat(Uint8Array.of(code), utf8(uri.slice(URI_PREFIXES[code]!.length)));
}

export function decodeUriPayload(payload: Uint8Array): string {
  if (payload.length === 0) throw new RangeError("empty URI payload");
  const code = payload[0]!;
  const prefix = code < URI_PREFIXES.length ? URI_PREFIXES[code]! : "";
  return prefix + decoder.decode(payload.subarray(1));
}

export function encodeTextPayload(text: string, lang = "en"): Uint8Array {
  const langBytes = ascii(lang);
  if (langBytes.length > 63) throw new RangeError("language code longer than 63 bytes");
  // Status byte: bit 7 = UTF-16 flag (we always write UTF-8), bits 0-5 = language code length.
  return concat(Uint8Array.of(langBytes.length), langBytes, utf8(text));
}

export function decodeTextPayload(payload: Uint8Array): { text: string; lang: string } {
  if (payload.length === 0) throw new RangeError("empty Text payload");
  const status = payload[0]!;
  const langLength = status & 0x3f;
  const isUtf16 = (status & 0x80) !== 0;
  const lang = decoder.decode(payload.subarray(1, 1 + langLength));
  const body = payload.subarray(1 + langLength);
  const text = isUtf16 ? new TextDecoder("utf-16be").decode(body) : decoder.decode(body);
  return { text, lang };
}

// ---------- message codec ----------

type WireRecord = { tnf: number; recordType: Uint8Array; id?: Uint8Array; payload: Uint8Array };

function toWire(record: NdefRecord): WireRecord {
  switch (record.type) {
    case "uri":
      return {
        tnf: TNF.WELL_KNOWN,
        recordType: Uint8Array.of(TYPE_URI),
        payload: encodeUriPayload(record.uri),
      };
    case "text":
      return {
        tnf: TNF.WELL_KNOWN,
        recordType: Uint8Array.of(TYPE_TEXT),
        payload: encodeTextPayload(record.text, record.lang),
      };
    case "mime":
      return { tnf: TNF.MIME, recordType: ascii(record.mimeType), payload: record.data };
    case "external":
      return {
        tnf: TNF.EXTERNAL,
        recordType: ascii(`${record.domain}:${record.name}`),
        payload: record.data,
      };
    case "raw":
      return record;
  }
}

function fromWire(wire: WireRecord): NdefRecord {
  const { tnf, recordType, payload } = wire;
  if (tnf === TNF.WELL_KNOWN && recordType.length === 1) {
    if (recordType[0] === TYPE_URI) return { type: "uri", uri: decodeUriPayload(payload) };
    if (recordType[0] === TYPE_TEXT) return { type: "text", ...decodeTextPayload(payload) };
  }
  if (tnf === TNF.MIME)
    return { type: "mime", mimeType: decoder.decode(recordType), data: payload };
  if (tnf === TNF.EXTERNAL) {
    const typeName = decoder.decode(recordType);
    const colon = typeName.indexOf(":");
    if (colon > 0) {
      return {
        type: "external",
        domain: typeName.slice(0, colon),
        name: typeName.slice(colon + 1),
        data: payload,
      };
    }
  }
  return { type: "raw", ...wire };
}

/** Serializes records into one NDEF message (what gets written inside the tag's NDEF TLV). */
export function encodeMessage(records: readonly NdefRecord[]): Uint8Array {
  const wires: WireRecord[] =
    records.length === 0
      ? [{ tnf: TNF.EMPTY, recordType: new Uint8Array(0), payload: new Uint8Array(0) }]
      : records.map(toWire);

  const parts: Uint8Array[] = [];
  wires.forEach((wire, index) => {
    if (wire.recordType.length > 255) throw new RangeError("record type longer than 255 bytes");
    if (wire.id && wire.id.length > 255) throw new RangeError("record id longer than 255 bytes");
    const short = wire.payload.length < 256;
    let flags = wire.tnf & TNF_MASK;
    if (index === 0) flags |= FLAG_MB;
    if (index === wires.length - 1) flags |= FLAG_ME;
    if (short) flags |= FLAG_SR;
    if (wire.id) flags |= FLAG_IL;

    const header: number[] = [flags, wire.recordType.length];
    if (short) header.push(wire.payload.length);
    else {
      const n = wire.payload.length;
      header.push((n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff);
    }
    if (wire.id) header.push(wire.id.length);

    parts.push(Uint8Array.from(header), wire.recordType);
    if (wire.id) parts.push(wire.id);
    parts.push(wire.payload);
  });
  return concat(...parts);
}

/** Parses an NDEF message. Throws on truncated input or chunked records. */
export function decodeMessage(bytes: Uint8Array): NdefRecord[] {
  const records: NdefRecord[] = [];
  let offset = 0;

  const need = (n: number) => {
    if (offset + n > bytes.length) throw new RangeError("truncated NDEF message");
  };

  while (offset < bytes.length) {
    need(2);
    const flags = bytes[offset]!;
    if (flags & FLAG_CF) throw new RangeError("chunked NDEF records are not supported");
    const tnf = flags & TNF_MASK;
    const typeLength = bytes[offset + 1]!;
    offset += 2;

    let payloadLength: number;
    if (flags & FLAG_SR) {
      need(1);
      payloadLength = bytes[offset]!;
      offset += 1;
    } else {
      need(4);
      payloadLength =
        ((bytes[offset]! << 24) |
          (bytes[offset + 1]! << 16) |
          (bytes[offset + 2]! << 8) |
          bytes[offset + 3]!) >>>
        0;
      offset += 4;
    }

    let idLength = 0;
    if (flags & FLAG_IL) {
      need(1);
      idLength = bytes[offset]!;
      offset += 1;
    }

    need(typeLength + idLength + payloadLength);
    const recordType = bytes.slice(offset, offset + typeLength);
    offset += typeLength;
    const id = idLength > 0 ? bytes.slice(offset, offset + idLength) : undefined;
    offset += idLength;
    const payload = bytes.slice(offset, offset + payloadLength);
    offset += payloadLength;

    if (tnf === TNF.EMPTY && records.length === 0 && flags & FLAG_ME) return [];
    records.push(fromWire(id ? { tnf, recordType, id, payload } : { tnf, recordType, payload }));

    if (flags & FLAG_ME) break;
  }
  return records;
}

/** Byte size of the encoded message. Use with `fitsOn()` before writing a sticker. */
export function messageSize(records: readonly NdefRecord[]): number {
  return encodeMessage(records).length;
}

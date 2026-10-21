import { messageSize, type NdefRecord } from "./ndef";

/**
 * The chips you actually get when you buy "NFC stickers". Every modern phone reads all three.
 *
 * `ndefMaxBytes` is the practical NDEF message limit for a factory-formatted tag (the number
 * Android reports from `Ndef.getMaxSize()`); the lock-control TLV and NDEF TLV header eat the
 * difference from `userMemoryBytes`. Treat it as the hard ceiling when writing.
 */
export const CHIPS = {
  ntag213: { name: "NTAG213", userMemoryBytes: 144, ndefMaxBytes: 137 },
  ntag215: { name: "NTAG215", userMemoryBytes: 504, ndefMaxBytes: 492 },
  ntag216: { name: "NTAG216", userMemoryBytes: 888, ndefMaxBytes: 872 },
} as const;

export type ChipId = keyof typeof CHIPS;

export const CHIP_IDS = Object.keys(CHIPS) as ChipId[];

export type FitResult = {
  fits: boolean;
  /** Encoded message size in bytes. */
  bytes: number;
  /** The chip's NDEF ceiling in bytes. */
  max: number;
  /** Bytes left over (negative when it does not fit). */
  headroom: number;
};

/** Does this message fit on the given chip? */
export function fitsOn(chip: ChipId, message: readonly NdefRecord[] | Uint8Array): FitResult {
  const bytes = message instanceof Uint8Array ? message.length : messageSize(message);
  const max = CHIPS[chip].ndefMaxBytes;
  return { fits: bytes <= max, bytes, max, headroom: max - bytes };
}

/** The smallest (cheapest) chip the message fits on, or null if it needs something bigger. */
export function smallestChipFor(message: readonly NdefRecord[] | Uint8Array): ChipId | null {
  for (const chip of CHIP_IDS) if (fitsOn(chip, message).fits) return chip;
  return null;
}

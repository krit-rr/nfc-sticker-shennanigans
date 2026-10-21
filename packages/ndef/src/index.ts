export {
  TNF,
  URI_PREFIXES,
  uriRecord,
  textRecord,
  mimeRecord,
  externalRecord,
  androidApplicationRecord,
  encodeUriPayload,
  decodeUriPayload,
  encodeTextPayload,
  decodeTextPayload,
  encodeMessage,
  decodeMessage,
  messageSize,
  type NdefRecord,
} from "./ndef";

export { CHIPS, CHIP_IDS, fitsOn, smallestChipFor, type ChipId, type FitResult } from "./capacity";

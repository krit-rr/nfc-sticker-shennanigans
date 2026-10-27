import type { Card } from "./schemas";

function escape(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function splitName(name: string): { first: string; last: string } {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return { first: parts[0]!, last: "" };
  return { first: parts.slice(0, -1).join(" "), last: parts[parts.length - 1]! };
}

/** vCard 3.0 text for a business card. CRLF line endings, as the spec requires. */
export function toVCard(card: Card): string {
  const { first, last } = splitName(card.name);
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${escape(last)};${escape(first)};;;`,
    `FN:${escape(card.name)}`,
  ];
  if (card.company) lines.push(`ORG:${escape(card.company)}`);
  if (card.title) lines.push(`TITLE:${escape(card.title)}`);
  if (card.email) lines.push(`EMAIL;TYPE=INTERNET:${escape(card.email)}`);
  if (card.phone) lines.push(`TEL;TYPE=CELL:${escape(card.phone)}`);
  if (card.website) lines.push(`URL:${escape(card.website)}`);
  for (const link of card.links) lines.push(`URL;TYPE=${escape(link.label)}:${escape(link.url)}`);
  if (card.note) lines.push(`NOTE:${escape(card.note)}`);
  lines.push("END:VCARD");
  return lines.join("\r\n") + "\r\n";
}

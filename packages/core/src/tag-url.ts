/**
 * The URL written on a sticker. Two shapes:
 *   https://<host>/t/<tagId>   — a registered tag; the app decides what it does
 *   https://<host>/c/<slug>    — a business card; any phone opens the card page
 * plus the custom scheme `tap://t/<tagId>` for deep links that bypass the browser.
 */

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;
const TAP_URL_RE = /^(?:https?:\/\/[^/?#]+|tap:\/{0,2})\/?(t|c)\/([A-Za-z0-9-]+)\/?(?:[?#].*)?$/;

export type TapUrl = { kind: "tag"; tagId: string } | { kind: "card"; slug: string };

export function isSlug(value: unknown): value is string {
  return typeof value === "string" && SLUG_RE.test(value);
}

function base(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}

export function buildTagUrl(baseUrl: string, tagId: string): string {
  return `${base(baseUrl)}/t/${tagId}`;
}

export function buildCardUrl(baseUrl: string, slug: string): string {
  return `${base(baseUrl)}/c/${slug}`;
}

/** Deep link that skips the browser on Android and in the app's own NFC reader. */
export function buildTagDeepLink(tagId: string): string {
  return `tap://t/${tagId}`;
}

export function parseTapUrl(url: string): TapUrl | null {
  const match = TAP_URL_RE.exec(url.trim());
  if (!match) return null;
  const [, kind, value] = match;
  if (kind === "t") return { kind: "tag", tagId: value!.toLowerCase() };
  return isSlug(value!) ? { kind: "card", slug: value! } : null;
}

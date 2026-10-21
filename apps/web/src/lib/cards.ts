import { demoCards, type Card } from "@tap/core";

/**
 * Card lookup. Demo data for now.
 * TODO(next): back this with a database so cards can be edited without a deploy.
 */
export function findCard(slug: string): Card | null {
  return demoCards.find((card) => card.slug === slug) ?? null;
}

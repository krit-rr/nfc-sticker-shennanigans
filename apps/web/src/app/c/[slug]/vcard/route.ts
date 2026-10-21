import { toVCard } from "@tap/core";

import { findCard } from "@/lib/cards";

/** Serves the card as a .vcf so phones open their "add contact" sheet. */
export async function GET(_request: Request, ctx: RouteContext<"/c/[slug]/vcard">) {
  const { slug } = await ctx.params;
  const card = findCard(slug);
  if (!card) return new Response("Not found", { status: 404 });

  return new Response(toVCard(card), {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}.vcf"`,
    },
  });
}

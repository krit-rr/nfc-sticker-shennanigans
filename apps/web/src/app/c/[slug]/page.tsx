import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { findCard } from "@/lib/cards";

export async function generateMetadata({ params }: PageProps<"/c/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const card = findCard(slug);
  return { title: card ? `${card.name} · Tap` : "Card not found" };
}

export default async function CardPage({ params }: PageProps<"/c/[slug]">) {
  const { slug } = await params;
  const card = findCard(slug);
  if (!card) notFound();

  const subtitle = [card.title, card.company].filter(Boolean).join(" · ");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{card.name}</h1>
        {subtitle ? <p className="text-zinc-600 dark:text-zinc-400">{subtitle}</p> : null}
        {card.note ? <p className="text-sm text-zinc-500">{card.note}</p> : null}
      </header>

      <a
        className="flex h-12 items-center justify-center rounded-full bg-foreground px-5 font-medium text-background"
        href={`/c/${card.slug}/vcard`}
      >
        Save contact
      </a>

      <ul className="flex flex-col gap-3">
        {card.email ? <Row label="Email" href={`mailto:${card.email}`} text={card.email} /> : null}
        {card.phone ? <Row label="Phone" href={`tel:${card.phone}`} text={card.phone} /> : null}
        {card.website ? <Row label="Website" href={card.website} text={card.website} /> : null}
        {card.links.map((link) => (
          <Row key={link.url} label={link.label} href={link.url} text={link.url} />
        ))}
      </ul>
    </main>
  );
}

function Row({ label, href, text }: { label: string; href: string; text: string }) {
  return (
    <li className="flex flex-col rounded-2xl bg-zinc-100 px-4 py-3 dark:bg-zinc-900">
      <span className="text-xs uppercase tracking-wide text-zinc-500">{label}</span>
      <a className="truncate underline-offset-4 hover:underline" href={href}>
        {text}
      </a>
    </li>
  );
}

import Link from "next/link";

import { demoCards } from "@tap/core";

const card = demoCards[0]!;

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-6 py-20">
      <header className="flex flex-col gap-3">
        <h1 className="text-4xl font-semibold tracking-tight">Tap</h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          NFC stickers that do things. Alarms that only stop at the bathroom mirror, morning
          routines you check off by tapping, a focus mode you flip at your desk, and business cards
          that save themselves.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-medium">Try it</h2>
        <ul className="flex flex-col gap-3">
          <li>
            <Link className="underline underline-offset-4" href={`/c/${card.slug}`}>
              A business card page
            </Link>{" "}
            <span className="text-zinc-500">— what a card sticker opens on any phone.</span>
          </li>
          <li>
            <Link className="underline underline-offset-4" href="/write">
              Write a sticker from the browser
            </Link>{" "}
            <span className="text-zinc-500">— Chrome on Android only (Web NFC).</span>
          </li>
          <li>
            <Link className="underline underline-offset-4" href="/t/b4thr00m">
              What a phone without the app sees
            </Link>{" "}
            <span className="text-zinc-500">— the landing page for an app sticker.</span>
          </li>
        </ul>
      </section>
    </main>
  );
}

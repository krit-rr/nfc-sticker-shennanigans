import { buildTagDeepLink, normalizeTagId } from "@tap/core";

/**
 * Where an app sticker lands when the phone does not have the app (or tapped from a browser).
 * With the app installed, universal links / app links open the app directly instead of this page.
 */
export default async function TagLanding({ params }: PageProps<"/t/[tagId]">) {
  const { tagId: raw } = await params;
  const tagId = normalizeTagId(raw);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">You tapped a Tap sticker</h1>
      {tagId ? (
        <>
          <p className="text-zinc-600 dark:text-zinc-400">
            Sticker <code className="font-mono">{tagId}</code> belongs to someone&apos;s alarms or
            routines. It only does something inside the Tap app on their phone.
          </p>
          <a
            className="flex h-12 items-center justify-center rounded-full bg-foreground px-5 font-medium text-background"
            href={buildTagDeepLink(tagId)}
          >
            Open in the app
          </a>
          <p className="text-sm text-zinc-500">
            No app? This is where the install link and a short explanation go.
          </p>
        </>
      ) : (
        <p className="text-zinc-600 dark:text-zinc-400">
          That does not look like a valid sticker id (<code className="font-mono">{raw}</code>).
        </p>
      )}
    </main>
  );
}

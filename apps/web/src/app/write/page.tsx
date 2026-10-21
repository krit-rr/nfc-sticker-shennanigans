"use client";

import { buildTagUrl, newTagId } from "@tap/core";
import { CHIPS, CHIP_IDS, fitsOn, uriRecord } from "@tap/ndef";
import { useMemo, useState } from "react";

import { SITE_URL } from "@/lib/site";

/** Minimal Web NFC surface (Chrome on Android). Not in the TypeScript DOM lib yet. */
type NDEFReaderLike = {
  write(message: { records: { recordType: string; data: string }[] }): Promise<void>;
};
declare global {
  interface Window {
    NDEFReader?: new () => NDEFReaderLike;
  }
}

export default function WritePage() {
  const [tagId, setTagId] = useState(() => newTagId());
  const [status, setStatus] = useState<string | null>(null);
  const url = buildTagUrl(SITE_URL, tagId);
  const fits = useMemo(
    () => CHIP_IDS.map((chip) => [chip, fitsOn(chip, [uriRecord(url)])] as const),
    [url],
  );
  const supported = typeof window !== "undefined" && "NDEFReader" in window;

  const write = async () => {
    if (!window.NDEFReader) return;
    setStatus("Hold a sticker against the back of the phone…");
    try {
      await new window.NDEFReader().write({ records: [{ recordType: "url", data: url }] });
      setStatus(`Wrote ${url}`);
    } catch (error) {
      setStatus(`Write failed: ${String(error)}`);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Write a sticker</h1>
      <label className="flex flex-col gap-1 text-sm">
        Tag id
        <input
          className="rounded-xl border border-zinc-300 bg-transparent px-3 py-2 font-mono dark:border-zinc-700"
          value={tagId}
          onChange={(event) => setTagId(event.target.value)}
        />
      </label>
      <p className="break-all font-mono text-sm">{url}</p>
      <ul className="text-sm text-zinc-600 dark:text-zinc-400">
        {fits.map(([chip, fit]) => (
          <li key={chip}>
            {CHIPS[chip].name}: {fit.bytes} of {fit.max} bytes {fit.fits ? "✓" : "✗ too big"}
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="flex h-12 items-center justify-center rounded-full bg-foreground px-5 font-medium text-background disabled:opacity-40"
        disabled={!supported}
        onClick={() => void write()}
      >
        {supported ? "Write with this phone" : "Web NFC needs Chrome on Android"}
      </button>
      <button
        type="button"
        className="text-sm underline underline-offset-4"
        onClick={() => setTagId(newTagId())}
      >
        New random id
      </button>
      {status ? <p className="text-sm">{status}</p> : null}
    </main>
  );
}

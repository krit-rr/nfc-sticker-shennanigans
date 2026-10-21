import { useEffect } from "react";

import { ensureNfc } from "@/lib/nfc";

/** Starts the NFC manager once at launch so scan/write sessions open instantly later. */
export function useNfcBootstrap() {
  useEffect(() => {
    void ensureNfc();
  }, []);
}

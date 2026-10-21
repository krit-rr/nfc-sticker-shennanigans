import { useEffect, useState } from "react";

/** The current time, refreshed every `everyMs` so time-based suggestions stay accurate. */
export function useNow(everyMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), everyMs);
    return () => clearInterval(id);
  }, [everyMs]);

  return now;
}

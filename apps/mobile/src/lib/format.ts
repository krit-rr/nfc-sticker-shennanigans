/** Display helpers. Presentation only: anything with rules behind it belongs in @tap/core. */

/** "7:00 AM" in the device's own format. */
export function clock(date: Date): string {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/** Splits a localized clock time so the digits can be large and the AM/PM small. */
export function clockParts(date: Date): { time: string; period: string } {
  const text = clock(date).replace(/[  ]/g, " ");
  const match = /^(\d{1,2}[:.]\d{2})\s*(.*)$/.exec(text);
  return match ? { time: match[1], period: match[2].trim() } : { time: text, period: "" };
}

/**
 * A Date that carries an alarm's clock time on `day` (today by default), for formatting.
 * It must sit in the current season: Hermes applies today's UTC offset when it builds a local
 * Date, so a January date shows an hour off during daylight time.
 */
export function clockDate(hour: number, minute: number, day: Date = new Date()): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute, 0, 0);
}

export function weekdayShort(date: Date): string {
  return date.toLocaleDateString([], { weekday: "short" });
}

/** "9 h 8 min", "42 min", or "under a minute". */
export function countdown(from: Date, to: Date): string {
  const minutes = Math.max(0, Math.round((to.getTime() - from.getTime()) / 60_000));
  if (minutes < 1) return "under a minute";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

/**
 * Sleep-cycle math that matches sleepyti.me.
 *
 * Taken from the original calculator's script (the domain now redirects to Sleepopolis's
 * "formerly Sleepytime" page, which kept the 90-minute cycle):
 *   - "I have to wake up at…": fall asleep 9h, 7.5h, 6h or 4.5h before the alarm (6, 5, 4, 3 cycles)
 *   - "zzz" (go to bed now): wake at now + 14 minutes to fall asleep + 1 to 6 cycles
 *   - "A good night's sleep consists of 5-6 complete sleep cycles."
 */

export const SLEEP_CYCLE_MINUTES = 90;
export const FALL_ASLEEP_MINUTES = 14;
/** The cycle counts sleepyti.me calls a good night's sleep. */
export const GOOD_NIGHT_CYCLES: readonly number[] = [5, 6];

const MINUTE = 60_000;

export type SleepOption = {
  /** The suggested moment: when to be asleep (bedtime mode) or when to wake up (wake mode). */
  time: Date;
  /** Complete 90-minute cycles between falling asleep and waking. */
  cycles: number;
  /** Hours asleep: cycles × 1.5. */
  hoursAsleep: number;
  /** True for 5–6 cycles. */
  recommended: boolean;
};

function option(time: Date, cycles: number): SleepOption {
  return {
    time,
    cycles,
    hoursAsleep: (cycles * SLEEP_CYCLE_MINUTES) / 60,
    recommended: GOOD_NIGHT_CYCLES.includes(cycles),
  };
}

/**
 * "I have to wake up at…": when to be asleep so the alarm lands between cycles, earliest first.
 * These are fall-asleep times, exactly as the site reports them; use `inBedBy()` for when to
 * actually get into bed.
 */
export function fallAsleepTimesFor(
  wakeAt: Date,
  cycles: readonly number[] = [6, 5, 4, 3],
): SleepOption[] {
  return cycles.map((n) =>
    option(new Date(wakeAt.getTime() - n * SLEEP_CYCLE_MINUTES * MINUTE), n),
  );
}

/** When to get into bed in order to be asleep at `asleepAt`: 14 minutes earlier. */
export function inBedBy(asleepAt: Date, fallAsleepMinutes: number = FALL_ASLEEP_MINUTES): Date {
  return new Date(asleepAt.getTime() - fallAsleepMinutes * MINUTE);
}

/**
 * "If I go to bed now…": wake-up times that land between cycles, soonest first.
 * Allows 14 minutes to fall asleep. Pass `fallAsleepMinutes: 0` when `inBedAt` is already the
 * moment you expect to be asleep.
 */
export function wakeTimesFrom(
  inBedAt: Date,
  options: { fallAsleepMinutes?: number; cycles?: readonly number[] } = {},
): SleepOption[] {
  const { fallAsleepMinutes = FALL_ASLEEP_MINUTES, cycles = [1, 2, 3, 4, 5, 6] } = options;
  const asleepAt = inBedAt.getTime() + fallAsleepMinutes * MINUTE;
  return cycles.map((n) => option(new Date(asleepAt + n * SLEEP_CYCLE_MINUTES * MINUTE), n));
}

import { CHIP_IDS } from "@tap/ndef";
import { z } from "zod";

import { isTagId } from "./ids";
import { isSlug } from "./tag-url";

export const TagIdSchema = z.string().refine(isTagId, "expected an 8-char tag id");
export const SlugSchema = z.string().refine(isSlug, "expected a url slug");
export const IsoDateSchema = z.iso.datetime();

/**
 * What tapping a tag does. Tags are dumb pointers: the sticker only stores the tag id,
 * and the action lives in the app's registry, so you can repurpose a sticker without rewriting it.
 */
export const ActionSchema = z.discriminatedUnion("kind", [
  /** Anchor tag for alarms: alarms with `dismissTagId` set stop only when this tag is tapped. */
  z.object({ kind: z.literal("alarm.dismiss") }),
  /** A checkpoint in a routine (toothbrush, meds, keys). */
  z.object({
    kind: z.literal("routine.step"),
    routineId: z.string().min(1),
    stepId: z.string().min(1),
  }),
  /** Brick-style: toggle distraction blocking on and off. */
  z.object({ kind: z.literal("focus.toggle") }),
  /** Start a timer (pomodoro, "just 10 minutes" body-double timer). */
  z.object({ kind: z.literal("timer.start"), minutes: z.number().int().positive() }),
  /** Log that something happened now (water, meds, walked the dog). */
  z.object({ kind: z.literal("log.event"), event: z.string().min(1) }),
  /** Open a business card page. */
  z.object({ kind: z.literal("card.open"), slug: SlugSchema }),
  /** Open any URL. */
  z.object({ kind: z.literal("url.open"), url: z.url() }),
]);
export type Action = z.infer<typeof ActionSchema>;
export type ActionKind = Action["kind"];

export const TagSchema = z.object({
  id: TagIdSchema,
  label: z.string().min(1),
  action: ActionSchema,
  /** Which sticker it is physically written on, if known. */
  chip: z.enum(CHIP_IDS).nullable().default(null),
  createdAt: IsoDateSchema,
  lastTappedAt: IsoDateSchema.nullable().default(null),
});
export type Tag = z.infer<typeof TagSchema>;

/** 0 = Sunday … 6 = Saturday, matching `Date.prototype.getDay()`. */
export const WeekdaySchema = z.number().int().min(0).max(6);
export type Weekday = z.infer<typeof WeekdaySchema>;

export const AlarmSchema = z.object({
  id: z.string().min(1),
  label: z.string().default("Alarm"),
  hour: z.number().int().min(0).max(23),
  minute: z.number().int().min(0).max(59),
  /** Empty = one-shot. */
  repeatDays: z.array(WeekdaySchema).default([]),
  enabled: z.boolean().default(true),
  /** When set, only tapping this tag counts as dismissing. */
  dismissTagId: TagIdSchema.nullable().default(null),
  /**
   * Nag mode: after the first ring, keep re-ringing every `everyMinutes` up to `times` more
   * times unless the dismiss tag is tapped. This is what makes "get out of bed" enforceable on
   * iOS, where the system alarm UI always offers a Stop button (see docs/alarm-strategy.md).
   */
  nag: z
    .object({ everyMinutes: z.number().int().positive(), times: z.number().int().positive() })
    .nullable()
    .default(null),
});
export type Alarm = z.infer<typeof AlarmSchema>;

export const RoutineStepSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  /** Tag that completes this step, or null for a manual check-off. */
  tagId: TagIdSchema.nullable().default(null),
  estimateMinutes: z.number().int().positive().nullable().default(null),
});
export type RoutineStep = z.infer<typeof RoutineStepSchema>;

export const RoutineSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  /** Ordered routines require steps in sequence; unordered ones accept any remaining step. */
  ordered: z.boolean().default(true),
  steps: z.array(RoutineStepSchema).min(1),
});
export type Routine = z.infer<typeof RoutineSchema>;

export const CardLinkSchema = z.object({ label: z.string().min(1), url: z.url() });

export const CardSchema = z.object({
  slug: SlugSchema,
  name: z.string().min(1),
  title: z.string().nullable().default(null),
  company: z.string().nullable().default(null),
  email: z.email().nullable().default(null),
  phone: z.string().nullable().default(null),
  website: z.url().nullable().default(null),
  links: z.array(CardLinkSchema).default([]),
  note: z.string().nullable().default(null),
});
export type Card = z.infer<typeof CardSchema>;

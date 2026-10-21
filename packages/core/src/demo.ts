/**
 * Demo fixtures so both apps have something to show before real storage exists.
 * Tag ids must use the Crockford alphabet (no i, l, o, u).
 */
import {
  AlarmSchema,
  CardSchema,
  RoutineSchema,
  TagSchema,
  type Alarm,
  type Card,
  type Routine,
  type Tag,
} from "./schemas";

const createdAt = "2026-09-28T00:00:00.000Z";

export const demoTags: Tag[] = [
  { id: "b4thr00m", label: "Bathroom mirror", action: { kind: "alarm.dismiss" }, chip: "ntag213" },
  {
    id: "m3dsb0x0",
    label: "Meds box",
    action: { kind: "routine.step", routineId: "morning", stepId: "meds" },
    chip: "ntag213",
  },
  {
    id: "t00thbr5",
    label: "Toothbrush cup",
    action: { kind: "routine.step", routineId: "morning", stepId: "teeth" },
    chip: "ntag213",
  },
  {
    id: "fr0ntd00",
    label: "Front door",
    action: { kind: "routine.step", routineId: "morning", stepId: "keys" },
    chip: "ntag213",
  },
  { id: "d3skf0c5", label: "Desk (focus)", action: { kind: "focus.toggle" }, chip: "ntag213" },
  {
    id: "w4t3rb0t",
    label: "Water bottle",
    action: { kind: "log.event", event: "water" },
    chip: "ntag213",
  },
  {
    id: "c4rdme00",
    label: "Business card",
    action: { kind: "card.open", slug: "you" },
    chip: "ntag215",
  },
].map((tag) => TagSchema.parse({ ...tag, createdAt }));

export const demoAlarms: Alarm[] = [
  AlarmSchema.parse({
    id: "weekday",
    label: "Get up",
    hour: 7,
    minute: 0,
    repeatDays: [1, 2, 3, 4, 5],
    dismissTagId: "b4thr00m",
    nag: { everyMinutes: 3, times: 5 },
  }),
  AlarmSchema.parse({
    id: "weekend",
    label: "Weekend",
    hour: 9,
    minute: 30,
    repeatDays: [0, 6],
    enabled: false,
  }),
];

export const demoRoutines: Routine[] = [
  RoutineSchema.parse({
    id: "morning",
    name: "Morning",
    ordered: true,
    steps: [
      { id: "meds", title: "Take meds", tagId: "m3dsb0x0", estimateMinutes: 1 },
      { id: "teeth", title: "Brush teeth", tagId: "t00thbr5", estimateMinutes: 3 },
      { id: "water", title: "Drink a glass of water", tagId: null, estimateMinutes: 1 },
      {
        id: "keys",
        title: "Keys, wallet, phone — tap the door",
        tagId: "fr0ntd00",
        estimateMinutes: 1,
      },
    ],
  }),
];

export const demoCards: Card[] = [
  CardSchema.parse({
    slug: "you",
    name: "Your Name",
    title: "Builder of NFC things",
    company: "Sticker Shenanigans",
    email: "you@example.com",
    website: "https://example.com",
    links: [{ label: "GitHub", url: "https://github.com/" }],
    note: "Tap the sticker on the back of the card to save this contact.",
  }),
];

import {
  applyTap,
  buildCardUrl,
  currentStep,
  demoRoutines,
  nextOccurrence,
  normalizeTagId,
  progress,
  ringTimes,
  startRun,
  TagSchema,
  type Action,
  type Alarm,
  type Tag,
  type TapResult,
} from "@tap/core";
import { useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";

import { Banner } from "@/components/banner";
import { Button } from "@/components/button";
import { IconTile } from "@/components/icon-tile";
import { Screen } from "@/components/screen";
import { ThemedText } from "@/components/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { actionVisual, describeAction } from "@/lib/actions";
import { scheduler } from "@/lib/alarm-scheduler";
import { loadAlarms, saveAlarms } from "@/lib/alarm-store";
import { TAG_BASE_URL } from "@/lib/config";
import { registry } from "@/lib/registry";
import { loadRun, saveRun } from "@/lib/run-store";

type Lookup = { id: string; tag: Tag | null };

/**
 * Every sticker tap lands here: from the in-app scanner, from an Android NDEF intent, from an iOS
 * background-read notification (universal link https://<host>/t/<id>), or from the tap://t/<id> scheme.
 */
export default function TagTappedScreen() {
  const { tagId: raw } = useLocalSearchParams<{ tagId: string }>();
  const tagId = normalizeTagId(raw ?? "");
  const [lookup, setLookup] = useState<Lookup | null>(null);

  useEffect(() => {
    if (!tagId) return;
    let cancelled = false;
    void registry.get(tagId).then((tag) => {
      if (!cancelled) setLookup({ id: tagId, tag });
    });
    return () => {
      cancelled = true;
    };
  }, [tagId]);

  if (!tagId) return <UnknownSticker raw={raw} tagId={null} />;
  if (!lookup || lookup.id !== tagId) return <Screen />;
  if (!lookup.tag) {
    return (
      <UnknownSticker
        raw={raw}
        tagId={tagId}
        onRegistered={(tag) => setLookup({ id: tagId, tag })}
      />
    );
  }

  const tag = lookup.tag;
  const visual = actionVisual(tag.action);

  return (
    <Screen>
      <View style={styles.hero}>
        <IconTile icon={visual.icon} tone={visual.tone} size={76} />
        <ThemedText type="title" style={styles.centered} accessibilityRole="header">
          {tag.label}
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.centered}>
          {describeAction(tag.action)}
        </ThemedText>
      </View>
      <Outcome tag={tag} />
    </Screen>
  );
}

type UnknownStickerProps = {
  raw: string | undefined;
  /** The normalized id when the link held a valid one, so the sticker can be registered. */
  tagId: string | null;
  onRegistered?: (tag: Tag) => void;
};

function UnknownSticker({ raw, tagId, onRegistered }: UnknownStickerProps) {
  return (
    <Screen>
      <View style={styles.hero}>
        <IconTile icon="question" tone="neutral" size={76} />
        <ThemedText type="title" style={styles.centered} accessibilityRole="header">
          {tagId ? "New sticker" : "Unknown sticker"}
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.centered}>
          {tagId
            ? "This sticker is not registered on this phone yet. Give it a job:"
            : "The link on this sticker has no valid id in it."}
        </ThemedText>
      </View>
      {tagId && onRegistered ? (
        <RegisterSticker tagId={tagId} onRegistered={onRegistered} />
      ) : (
        <Banner
          tone="neutral"
          icon="info"
          text={raw ? `The link said "${raw}".` : "The link had no id in it."}
        />
      )}
    </Screen>
  );
}

/** What a fresh sticker can become, right here. Routine steps and cards are set up on their own screens. */
const REGISTER_CHOICES = [
  { key: "alarm", title: "Alarm anchor", action: { kind: "alarm.dismiss" } },
  { key: "focus", title: "Focus toggle", action: { kind: "focus.toggle" } },
  { key: "log", title: "Log an event", action: null },
  { key: "timer", title: "10 min timer", action: { kind: "timer.start", minutes: 10 } },
] as const;
type RegisterChoiceKey = (typeof REGISTER_CHOICES)[number]["key"];

function RegisterSticker({
  tagId,
  onRegistered,
}: {
  tagId: string;
  onRegistered: (tag: Tag) => void;
}) {
  const theme = useTheme();
  const [label, setLabel] = useState("");
  const [choice, setChoice] = useState<RegisterChoiceKey>("alarm");
  const [saving, setSaving] = useState(false);
  const trimmed = label.trim();

  const register = async () => {
    const picked = REGISTER_CHOICES.find((candidate) => candidate.key === choice)!;
    // "Log an event" logs the sticker's own name: a "Water bottle" sticker logs "water bottle".
    const action: Action = picked.action ?? { kind: "log.event", event: trimmed.toLowerCase() };
    const tag = TagSchema.parse({
      id: tagId,
      label: trimmed,
      action,
      createdAt: new Date().toISOString(),
    });
    setSaving(true);
    try {
      await registry.upsert(tag);
      onRegistered(tag);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.form}>
      <TextInput
        value={label}
        onChangeText={setLabel}
        placeholder="Name it after where it lives (Bathroom mirror…)"
        placeholderTextColor={theme.textTertiary}
        autoFocus
        maxLength={40}
        accessibilityLabel="Sticker name"
        style={[
          styles.input,
          {
            borderColor: theme.border,
            color: theme.text,
            backgroundColor: theme.backgroundElement,
          },
        ]}
      />
      <View style={styles.choices}>
        {REGISTER_CHOICES.map((candidate) => (
          <Button
            key={candidate.key}
            size="sm"
            variant={choice === candidate.key ? "primary" : "secondary"}
            title={candidate.title}
            onPress={() => setChoice(candidate.key)}
          />
        ))}
      </View>
      <Button
        fullWidth
        icon="sticker"
        title="Register sticker"
        disabled={trimmed.length === 0 || saving}
        onPress={() => void register()}
      />
      <ThemedText type="small" themeColor="textTertiary" style={styles.centered}>
        Stickers are pointers: you can give <ThemedText type="code">{tagId}</ThemedText> a different
        job later without rewriting it.
      </ThemedText>
    </View>
  );
}

/** A quiet reminder of what is not wired up yet, so the prototype never pretends. */
function PrototypeNote({ children }: { children: string }) {
  return (
    <ThemedText type="small" themeColor="textTertiary" style={styles.centered}>
      Prototype: {children}
    </ThemedText>
  );
}

function Outcome({ tag }: { tag: Tag }) {
  const { action } = tag;
  switch (action.kind) {
    case "alarm.dismiss":
      return <AlarmDismissOutcome tag={tag} />;
    case "routine.step":
      return <RoutineStepOutcome tag={tag} routineId={action.routineId} />;
    case "card.open": {
      const url = buildCardUrl(TAG_BASE_URL, action.slug);
      return (
        <Button
          fullWidth
          icon="safari"
          title="Open the card"
          onPress={() => void WebBrowser.openBrowserAsync(url)}
        />
      );
    }
    case "url.open":
      return (
        <Button
          fullWidth
          icon="safari"
          title="Open the link"
          onPress={() => void WebBrowser.openBrowserAsync(action.url)}
        />
      );
    case "focus.toggle":
    case "timer.start":
    case "log.event":
      return (
        <>
          <Banner
            tone="neutral"
            icon="info"
            text="Recognized. This kind of sticker is not built yet."
          />
          <PrototypeNote>{`${action.kind} comes next.`}</PrototypeNote>
        </>
      );
  }
}

/**
 * The product's core move: tapping the anchor sticker is the only thing that silences the
 * whole nag chain. Cancels every pending ring of each alarm anchored to this tag, disables
 * dismissed one-shots, and re-arms repeating alarms for their next occurrence.
 */
function AlarmDismissOutcome({ tag }: { tag: Tag }) {
  const [dismissed, setDismissed] = useState<Alarm[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const alarms = await loadAlarms();
      const anchored = alarms.filter((alarm) => alarm.dismissTagId === tag.id);
      for (const alarm of anchored) await scheduler.cancel(alarm.id);

      const oneShots = new Set(
        anchored.filter((alarm) => alarm.repeatDays.length === 0).map((alarm) => alarm.id),
      );
      if (oneShots.size > 0) {
        await saveAlarms(
          alarms.map((alarm) => (oneShots.has(alarm.id) ? { ...alarm, enabled: false } : alarm)),
        );
      }
      // A repeating alarm keeps its recurrence: re-arm the next occurrence's chain.
      for (const alarm of anchored) {
        if (alarm.repeatDays.length === 0 || !alarm.enabled) continue;
        const next = nextOccurrence(alarm);
        if (next) await scheduler.schedule(alarm, ringTimes(alarm, next));
      }
      if (!cancelled) setDismissed(anchored);
    })();
    return () => {
      cancelled = true;
    };
  }, [tag.id]);

  if (!dismissed) return null;
  return (
    <Banner
      tone={dismissed.length ? "success" : "neutral"}
      icon={dismissed.length ? "checkCircle" : "info"}
      text={
        dismissed.length
          ? `Dismissed: ${dismissed.map((alarm) => alarm.label).join(", ")}. All remaining rings are cancelled.`
          : "No alarm uses this sticker yet."
      }
    />
  );
}

/**
 * Applies the tap to the routine's persisted run — this is the real thing, not a demo:
 * the Routines tab reloads the same run when it regains focus.
 */
function RoutineStepOutcome({ tag, routineId }: { tag: Tag; routineId: string }) {
  const routine = demoRoutines.find((candidate) => candidate.id === routineId) ?? null;
  const [result, setResult] = useState<TapResult | null>(null);

  useEffect(() => {
    if (!routine) return;
    let cancelled = false;
    void (async () => {
      const run = (await loadRun(routine.id)) ?? startRun(routine);
      const outcome = applyTap(routine, run, tag.id);
      if (outcome.result === "advanced" || outcome.result === "finished") {
        await saveRun(outcome.run);
      }
      if (!cancelled) setResult(outcome);
    })();
    return () => {
      cancelled = true;
    };
  }, [routine, tag.id]);

  if (!routine) {
    return <Banner tone="warning" icon="warning" text="That routine no longer exists." />;
  }
  if (!result) return null;

  const next = currentStep(routine, result.run);
  const ok = result.result === "advanced" || result.result === "finished";
  const neutral = result.result === "already-done" || result.result === "already-finished";
  const text = (() => {
    switch (result.result) {
      case "advanced":
        return `${result.step.title}: done.${next ? ` Next: ${next.title}.` : ""}`;
      case "finished":
        return `${result.step.title}: done. That was the last one.`;
      case "wrong-tag":
        return `Not yet. First: ${result.expected.title}.`;
      case "already-done":
        return `${result.step.title} is already done.${next ? ` Next: ${next.title}.` : ""}`;
      case "already-finished":
        return `${routine.name} is already finished. Start it over on the Routines tab.`;
      case "unknown-tag":
        return "This sticker is no longer a step in that routine.";
    }
  })();
  const { done, total } = progress(routine, result.run);

  return (
    <>
      <Banner
        tone={ok ? "success" : neutral ? "neutral" : "warning"}
        icon={ok ? "checkCircle" : neutral ? "info" : "warning"}
        text={text}
      />
      <ThemedText type="small" themeColor="textTertiary" style={styles.centered}>
        {routine.name}: {done} of {total} done.
      </ThemedText>
    </>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: "center", gap: Spacing.two, paddingVertical: Spacing.four },
  centered: { textAlign: "center" },
  form: { gap: Spacing.three },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.md,
    borderCurve: "continuous",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  choices: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two },
});

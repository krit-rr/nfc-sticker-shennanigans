import {
  applyTap,
  buildCardUrl,
  demoAlarms,
  demoRoutines,
  normalizeTagId,
  startRun,
  type Tag,
} from "@tap/core";
import { useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { Banner } from "@/components/banner";
import { Button } from "@/components/button";
import { IconTile } from "@/components/icon-tile";
import { Screen } from "@/components/screen";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { actionVisual, describeAction } from "@/lib/actions";
import { TAG_BASE_URL } from "@/lib/config";
import { registry } from "@/lib/registry";

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

  if (!tagId) return <UnknownSticker raw={raw} />;
  if (!lookup || lookup.id !== tagId) return <Screen />;
  if (!lookup.tag) return <UnknownSticker raw={raw} />;

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

function UnknownSticker({ raw }: { raw: string | undefined }) {
  return (
    <Screen>
      <View style={styles.hero}>
        <IconTile icon="question" tone="neutral" size={76} />
        <ThemedText type="title" style={styles.centered} accessibilityRole="header">
          Unknown sticker
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.centered}>
          This sticker is not registered on this phone yet.
        </ThemedText>
      </View>
      <Banner
        tone="neutral"
        icon="info"
        text={raw ? `Its id is ${raw}.` : "The link had no id in it."}
      />
      <PrototypeNote>Next: offer to register it here and pick what it does.</PrototypeNote>
    </Screen>
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
    case "alarm.dismiss": {
      const alarms = demoAlarms.filter((alarm) => alarm.dismissTagId === tag.id);
      return (
        <>
          <Banner
            tone={alarms.length ? "success" : "neutral"}
            icon={alarms.length ? "checkCircle" : "info"}
            text={
              alarms.length
                ? `Stops: ${alarms.map((alarm) => alarm.label).join(", ")}.`
                : "No alarm uses this sticker yet."
            }
          />
          <PrototypeNote>
            this tap will cancel the remaining rings once a real alarm is wired in.
          </PrototypeNote>
        </>
      );
    }
    case "routine.step": {
      const routine = demoRoutines.find((candidate) => candidate.id === action.routineId);
      const result = routine ? applyTap(routine, startRun(routine), tag.id) : null;
      const ok = result?.result === "advanced" || result?.result === "finished";
      return (
        <>
          <Banner
            tone={ok ? "success" : "warning"}
            icon={ok ? "checkCircle" : "warning"}
            text={
              !routine
                ? "That routine no longer exists."
                : result?.result === "wrong-tag"
                  ? `Not yet. First: ${result.expected.title}.`
                  : `${routine.name}: step checked off.`
            }
          />
          <PrototypeNote>this starts a fresh run each time until runs are saved.</PrototypeNote>
        </>
      );
    }
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

const styles = StyleSheet.create({
  hero: { alignItems: "center", gap: Spacing.two, paddingVertical: Spacing.four },
  centered: { textAlign: "center" },
});

import { buildTagUrl, parseTapUrl, type Tag } from "@tap/core";
import { CHIPS, fitsOn } from "@tap/ndef";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Banner, type BannerProps } from "@/components/banner";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { Chip } from "@/components/chip";
import { Icon } from "@/components/icon";
import { IconTile } from "@/components/icon-tile";
import { Screen } from "@/components/screen";
import { SectionHeader } from "@/components/section-header";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { actionVisual, describeAction } from "@/lib/actions";
import { ANDROID_PACKAGE, TAG_BASE_URL } from "@/lib/config";
import { nfcAvailable, readTag, stickerMessage, writeUrl } from "@/lib/nfc";
import { registry } from "@/lib/registry";

const TILE_SIZE = 42;
const ROW_GAP = 14;

type StickerRowProps = {
  tag: Tag;
  selected: boolean;
  isLast: boolean;
  onSelect: () => void;
  onWrite: () => void;
  onSimulate: () => void;
};

/** One sticker in the grouped list. Tapping it opens its details and actions in place. */
function StickerRow({ tag, selected, isLast, onSelect, onWrite, onSimulate }: StickerRowProps) {
  const theme = useTheme();
  const visual = actionVisual(tag.action);

  return (
    <Pressable
      onPress={onSelect}
      accessibilityRole="button"
      accessibilityState={{ expanded: selected }}
      accessibilityLabel={`${tag.label}. ${describeAction(tag.action)}`}
      style={({ pressed }) => [styles.rowOuter, pressed && styles.pressed]}
    >
      <View style={styles.row}>
        <IconTile icon={visual.icon} tone={visual.tone} size={TILE_SIZE} />
        <View style={styles.rowText}>
          <ThemedText type="bodyStrong">{tag.label}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {describeAction(tag.action)}
          </ThemedText>
        </View>
        <Icon
          name={selected ? "chevronDown" : "chevronRight"}
          size={13}
          color={theme.textTertiary}
          weight="semibold"
        />
      </View>

      {selected ? (
        <View style={styles.expanded}>
          <View style={styles.rowWrap}>
            <Chip mono label={tag.id} />
            <Chip label={tag.chip ? CHIPS[tag.chip].name : "Unknown chip"} />
          </View>
          <View style={styles.rowWrap}>
            <Button
              size="sm"
              icon="nfc"
              title="Write to sticker"
              onPress={onWrite}
              disabled={!nfcAvailable}
            />
            <Button
              size="sm"
              variant="secondary"
              icon="hand"
              title="Simulate tap"
              onPress={onSimulate}
            />
          </View>
        </View>
      ) : null}

      {isLast ? null : <View style={[styles.separator, { backgroundColor: theme.border }]} />}
    </Pressable>
  );
}

export default function TagsScreen() {
  const router = useRouter();
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState<BannerProps | null>(null);

  // Reload on focus: the registry persists now, and other screens can register stickers.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void registry.list().then((stored) => {
        if (!cancelled) setTags(stored);
      });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const open = (tagId: string) => router.push({ pathname: "/t/[tagId]", params: { tagId } });

  const scan = async () => {
    setStatus({ tone: "accent", icon: "scan", text: "Hold the top of your phone on a sticker." });
    try {
      const result = await readTag();
      if (!result) {
        setStatus({
          tone: "warning",
          icon: "warning",
          text: "NFC is not available here. Use a development build on a real phone.",
        });
        return;
      }
      const parsed = result.url ? parseTapUrl(result.url) : null;
      if (parsed?.kind === "tag") {
        setStatus(null);
        open(parsed.tagId);
      } else {
        setStatus({
          tone: "neutral",
          icon: "info",
          text: result.url
            ? `Not a Tap sticker. It holds ${result.url}`
            : "This sticker is blank. Pick one below and write to it.",
        });
      }
    } catch {
      setStatus({ tone: "neutral", icon: "info", text: "Scan cancelled." });
    }
  };

  const write = async (tag: Tag) => {
    const url = buildTagUrl(TAG_BASE_URL, tag.id);
    const chip = tag.chip ?? "ntag213";
    const fit = fitsOn(chip, stickerMessage(url, ANDROID_PACKAGE));
    if (!fit.fits) {
      setStatus({
        tone: "danger",
        icon: "warning",
        text: `Too big for ${CHIPS[chip].name}: ${fit.bytes} of ${fit.max} bytes.`,
      });
      return;
    }
    setStatus({ tone: "accent", icon: "scan", text: `Hold a sticker to write ${tag.label}.` });
    try {
      await writeUrl(url, ANDROID_PACKAGE);
      setStatus({ tone: "success", icon: "checkCircle", text: `${tag.label} is written.` });
    } catch {
      setStatus({
        tone: "warning",
        icon: "warning",
        text: "Nothing was written. NFC needs a development build on a real phone.",
      });
    }
  };

  return (
    <Screen
      title="Stickers"
      subtitle="A sticker only stores its id. What it does lives here, so you can repurpose one without rewriting it."
    >
      <Button
        fullWidth
        icon="scan"
        title="Scan a sticker"
        onPress={() => void scan()}
        disabled={!nfcAvailable}
      />
      {status ? <Banner {...status} /> : null}

      <SectionHeader title="Registered" trailing={`${tags.length}`} />
      <Card style={styles.list}>
        {tags.map((tag, index) => (
          <StickerRow
            key={tag.id}
            tag={tag}
            selected={selectedId === tag.id}
            isLast={index === tags.length - 1}
            onSelect={() => setSelectedId(selectedId === tag.id ? null : tag.id)}
            onWrite={() => void write(tag)}
            onSimulate={() => open(tag.id)}
          />
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingVertical: 6, paddingHorizontal: 0, gap: 0 },
  rowOuter: { paddingHorizontal: Spacing.three },
  pressed: { opacity: 0.6 },
  row: { flexDirection: "row", alignItems: "center", gap: ROW_GAP, paddingVertical: 12 },
  rowText: { flex: 1, gap: 1 },
  rowWrap: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: Spacing.two },
  expanded: { gap: 10, paddingBottom: 14, paddingLeft: TILE_SIZE + ROW_GAP },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: TILE_SIZE + ROW_GAP },
});

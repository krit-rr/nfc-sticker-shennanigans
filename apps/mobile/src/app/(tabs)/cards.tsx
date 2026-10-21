import { buildCardUrl, demoCards, toVCard, type Card as BusinessCardData } from "@tap/core";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { Banner, type BannerProps } from "@/components/banner";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { Chip } from "@/components/chip";
import { Icon, type IconName } from "@/components/icon";
import { Screen } from "@/components/screen";
import { SectionHeader } from "@/components/section-header";
import { ThemedText } from "@/components/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { TAG_BASE_URL } from "@/lib/config";
import { nfcAvailable, writeUrl } from "@/lib/nfc";

const card = demoCards[0]!;

const CARD_GRADIENT = "linear-gradient(135deg, #5B4BF5 0%, #7C3AED 55%, #C0399A 100%)";
const ON_CARD = "#FFFFFF";

/** A url without its protocol or trailing slash, for display. */
function bare(url: string) {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}
const ON_CARD_SECONDARY = "rgba(255, 255, 255, 0.82)";

/** The card as a physical object: what the sticker on the back of it stands for. */
function CardFace({ data }: { data: BusinessCardData }) {
  return (
    <View
      style={[styles.face, { experimental_backgroundImage: CARD_GRADIENT }]}
      accessible
      accessibilityLabel={`Business card for ${data.name}`}
    >
      <View style={styles.spread}>
        <ThemedText type="caption" style={{ color: ON_CARD_SECONDARY }}>
          {data.company ?? "Business card"}
        </ThemedText>
        <Icon name="nfc" size={22} color={ON_CARD} weight="semibold" />
      </View>
      <View style={styles.faceName}>
        <ThemedText type="title" style={{ color: ON_CARD }}>
          {data.name}
        </ThemedText>
        {data.title ? (
          <ThemedText style={{ color: ON_CARD_SECONDARY }}>{data.title}</ThemedText>
        ) : null}
      </View>
    </View>
  );
}

function DetailRow({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={styles.detail}>
      <Icon name={icon} size={16} color={theme.textTertiary} />
      <View style={styles.flex}>
        <ThemedText type="caption" themeColor="textTertiary">
          {label}
        </ThemedText>
        <ThemedText numberOfLines={1}>{value}</ThemedText>
      </View>
    </View>
  );
}

export default function CardsScreen() {
  const [status, setStatus] = useState<BannerProps | null>(null);
  const [showFile, setShowFile] = useState(false);
  const url = buildCardUrl(TAG_BASE_URL, card.slug);

  const write = async () => {
    setStatus({ tone: "accent", icon: "scan", text: "Hold a sticker to write your card." });
    try {
      // No Android app record here: a card sticker should open in any phone's browser.
      await writeUrl(url);
      setStatus({ tone: "success", icon: "checkCircle", text: "Your card sticker is written." });
    } catch {
      setStatus({
        tone: "warning",
        icon: "warning",
        text: "Nothing was written. NFC needs a development build on a real phone.",
      });
    }
  };

  return (
    <Screen title="Cards" subtitle="Tap to share. It opens on any phone, no app needed.">
      <CardFace data={card} />
      <View style={styles.center}>
        <Chip mono icon="link" label={bare(url)} />
      </View>

      <View style={styles.actions}>
        <View style={styles.flex}>
          <Button
            fullWidth
            variant="secondary"
            icon="safari"
            title="Preview"
            onPress={() => void WebBrowser.openBrowserAsync(url)}
          />
        </View>
        <View style={styles.flex}>
          <Button
            fullWidth
            icon="nfc"
            title="Write sticker"
            onPress={() => void write()}
            disabled={!nfcAvailable}
          />
        </View>
      </View>
      {status ? <Banner {...status} /> : null}

      <SectionHeader title="What a tap saves" />
      <Card>
        <DetailRow icon="card" label="Name" value={card.name} />
        {card.email ? <DetailRow icon="mail" label="Email" value={card.email} /> : null}
        {card.website ? (
          <DetailRow icon="safari" label="Website" value={bare(card.website)} />
        ) : null}
        {card.links.map((link) => (
          <DetailRow key={link.url} icon="link" label={link.label} value={bare(link.url)} />
        ))}
        <Button
          size="sm"
          variant="ghost"
          title={showFile ? "Hide contact file" : "Show contact file"}
          onPress={() => setShowFile(!showFile)}
        />
        {showFile ? (
          <Card tone="muted" style={styles.file}>
            <ThemedText type="code" themeColor="textSecondary">
              {toVCard(card).trim()}
            </ThemedText>
          </Card>
        ) : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: "center" },
  spread: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  actions: { flexDirection: "row", gap: 10 },

  face: {
    aspectRatio: 1.586,
    borderRadius: Radius.lg,
    borderCurve: "continuous",
    padding: 22,
    justifyContent: "space-between",
    backgroundColor: "#5B4BF5",
    boxShadow: "0 14px 32px rgba(91, 75, 245, 0.35)",
  },
  faceName: { gap: 2 },

  detail: { flexDirection: "row", alignItems: "center", gap: 12 },
  file: { padding: Spacing.three, borderRadius: Radius.md },
});

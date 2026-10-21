import { StyleSheet, View } from "react-native";

import { Icon, type IconName } from "./icon";
import { ThemedText } from "./themed-text";

import { Radius, toneColors, type Tone } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export type BannerProps = { text: string; tone?: Tone; icon?: IconName };

/** One line of feedback about what just happened. */
export function Banner({ text, tone = "neutral", icon }: BannerProps) {
  const theme = useTheme();
  const { bg, fg } = toneColors(theme, tone);
  return (
    <View style={[styles.banner, { backgroundColor: bg }]} accessibilityLiveRegion="polite">
      {icon ? <Icon name={icon} size={18} color={fg} weight="semibold" /> : null}
      <ThemedText type="smallBold" style={[styles.text, { color: fg }]}>
        {text}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    borderCurve: "continuous",
  },
  text: { flex: 1 },
});

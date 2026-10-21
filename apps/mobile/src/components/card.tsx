import { StyleSheet, View, type ViewProps } from "react-native";

import { CardShadow, Radius, Spacing } from "@/constants/theme";
import { useScheme, useTheme } from "@/hooks/use-theme";

type Props = ViewProps & {
  /** "surface" is the default raised card, "muted" a flat well, "night" the indigo sleep card. */
  tone?: "surface" | "muted" | "night";
};

export function Card({ style, tone = "surface", ...props }: Props) {
  const theme = useTheme();
  const scheme = useScheme();

  const toneStyle =
    tone === "night"
      ? {
          backgroundColor: theme.night,
          experimental_backgroundImage: `linear-gradient(145deg, ${theme.night} 0%, ${theme.nightEnd} 100%)`,
          borderColor: "transparent",
        }
      : tone === "muted"
        ? { backgroundColor: theme.backgroundElement, borderColor: "transparent" }
        : {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            boxShadow: CardShadow[scheme],
          };

  return <View style={[styles.card, toneStyle, style]} {...props} />;
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: Radius.lg,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.three - 4,
  },
});

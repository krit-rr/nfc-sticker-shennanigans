import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";

import { useTheme } from "@/hooks/use-theme";

type Props = {
  /** 0 to 1. */
  fraction: number;
  tone?: "accent" | "success";
};

export function ProgressBar({ fraction, tone = "accent" }: Props) {
  const theme = useTheme();
  const percent = Math.round(Math.min(1, Math.max(0, fraction)) * 100);
  return (
    <View
      style={[styles.track, { backgroundColor: theme.backgroundElement }]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: percent }}
    >
      <Animated.View
        style={[
          styles.fill,
          {
            width: `${percent}%`,
            backgroundColor: tone === "success" ? theme.success : theme.accent,
            transitionProperty: "width",
            transitionDuration: 350,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 10, borderRadius: 5, overflow: "hidden" },
  fill: { height: 10, borderRadius: 5 },
});

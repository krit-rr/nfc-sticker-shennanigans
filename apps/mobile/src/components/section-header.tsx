import { StyleSheet, View } from "react-native";

import { ThemedText } from "./themed-text";

import { Spacing } from "@/constants/theme";

/** A quiet label above a group of cards, with an optional count or status on the right. */
export function SectionHeader({ title, trailing }: { title: string; trailing?: string }) {
  return (
    <View style={styles.row}>
      <ThemedText type="caption" themeColor="textTertiary" accessibilityRole="header">
        {title}
      </ThemedText>
      {trailing ? (
        <ThemedText type="caption" themeColor="textTertiary">
          {trailing}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.two,
    paddingHorizontal: Spacing.one,
  },
});

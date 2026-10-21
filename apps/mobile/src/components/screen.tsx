import type { PropsWithChildren } from "react";
import { Platform, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "./themed-text";

import { MaxContentWidth, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type Props = PropsWithChildren<{
  /** Large page title. Omit for screens that draw their own hero. */
  title?: string;
  subtitle?: string;
  /** Small label above the title. */
  eyebrow?: string;
}>;

/** Scrollable page with a large title and the shared content width. */
export function Screen({ title, subtitle, eyebrow, children }: Props) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  // iOS insets the scroll view itself (status bar, floating tab bar, modal header), and Android
  // native tabs handle the bottom edge. Only the remaining edges are padded by hand.
  const edgePadding = Platform.select({
    ios: { paddingTop: Spacing.two, paddingBottom: Spacing.five },
    android: { paddingTop: insets.top + Spacing.three, paddingBottom: Spacing.five },
    default: { paddingTop: Spacing.six + Spacing.four, paddingBottom: Spacing.five },
  });

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: theme.background }]}
      contentContainerStyle={[styles.content, edgePadding]}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.inner}>
        {title ? (
          <View style={styles.header}>
            {eyebrow ? (
              <ThemedText type="caption" themeColor="accentText">
                {eyebrow}
              </ThemedText>
            ) : null}
            <ThemedText type="title" accessibilityRole="header">
              {title}
            </ThemedText>
            {subtitle ? <ThemedText themeColor="textSecondary">{subtitle}</ThemedText> : null}
          </View>
        ) : null}
        {children}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { flexDirection: "row", justifyContent: "center", paddingHorizontal: 20 },
  inner: { flexGrow: 1, flexBasis: 0, maxWidth: MaxContentWidth, gap: Spacing.three },
  header: { gap: Spacing.one, paddingHorizontal: Spacing.one, marginBottom: Spacing.one },
});

import { Platform, StyleSheet, Text, type TextProps } from "react-native";

import { Fonts, type ThemeColor } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export type TextType =
  | "display"
  | "title"
  | "heading"
  | "default"
  | "bodyStrong"
  | "small"
  | "smallBold"
  | "caption"
  | "code";

export type ThemedTextProps = TextProps & {
  type?: TextType;
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = "default", themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();
  return <Text style={[{ color: theme[themeColor ?? "text"] }, styles[type], style]} {...rest} />;
}

const styles = StyleSheet.create({
  /** Clock faces and other hero numerals. */
  display: {
    fontFamily: Fonts.rounded,
    fontSize: 54,
    lineHeight: 58,
    fontWeight: 700,
    letterSpacing: -1.2,
    fontVariant: ["tabular-nums"],
  },
  /** Screen titles. */
  title: {
    fontFamily: Fonts.rounded,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: 700,
    letterSpacing: -0.6,
  },
  /** Card titles. */
  heading: {
    fontFamily: Fonts.rounded,
    fontSize: 21,
    lineHeight: 27,
    fontWeight: 700,
    letterSpacing: -0.3,
  },
  default: { fontSize: 16, lineHeight: 23, fontWeight: 400 },
  bodyStrong: { fontSize: 16, lineHeight: 23, fontWeight: 600 },
  small: { fontSize: 14, lineHeight: 20, fontWeight: 400 },
  smallBold: { fontSize: 14, lineHeight: 20, fontWeight: 600 },
  /** Section labels and eyebrows. */
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: 700,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  code: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: Platform.select({ android: 700 }) ?? 500,
  },
});

/**
 * Design tokens for Tap: colour, type, spacing and shape in one place.
 *
 * Light is warm paper with white cards; dark is near-black with raised surfaces. The "night" colours
 * are the same in both schemes so the sleep card always reads as night. Text colours are chosen for
 * WCAG AA contrast against the surfaces they sit on.
 */

import "@/global.css";

import { Platform } from "react-native";

export const Colors = {
  light: {
    background: "#F4F3EF",
    surface: "#FFFFFF",
    backgroundElement: "#ECEAE4",
    backgroundSelected: "#DFDCD3",
    border: "rgba(26, 24, 36, 0.08)",

    text: "#17151F",
    textSecondary: "#5E5B6B",
    textTertiary: "#777486",

    accent: "#5B4BF5",
    accentText: "#4A3AE0",
    accentSoft: "#ECE9FF",
    onAccent: "#FFFFFF",

    success: "#0E7A54",
    successSoft: "#DDF5EA",
    onSuccess: "#FFFFFF",
    warning: "#8A5A00",
    warningSoft: "#FFF1D0",
    danger: "#B42A23",
    dangerSoft: "#FFE4E1",
    sky: "#1A5FB8",
    skySoft: "#DFEEFF",
    coral: "#A83C1C",
    coralSoft: "#FFE7DE",
    pink: "#A82C73",
    pinkSoft: "#FFE3F2",

    night: "#1B1846",
    nightEnd: "#3B2F8F",
    nightTile: "rgba(255, 255, 255, 0.11)",
    onNight: "#FFFFFF",
    onNightSecondary: "rgba(255, 255, 255, 0.74)",
  },
  dark: {
    background: "#0C0B11",
    surface: "#17161E",
    backgroundElement: "#23212D",
    backgroundSelected: "#302D3D",
    border: "rgba(255, 255, 255, 0.09)",

    text: "#F5F4F9",
    textSecondary: "#ABA8BA",
    textTertiary: "#8A8799",

    accent: "#5B4BF5",
    accentText: "#A99EFF",
    accentSoft: "#26215A",
    onAccent: "#FFFFFF",

    success: "#3DD68C",
    successSoft: "#12382A",
    onSuccess: "#06281B",
    warning: "#F2BE4B",
    warningSoft: "#3B2E0E",
    danger: "#FF7A70",
    dangerSoft: "#43201D",
    sky: "#6CB2FF",
    skySoft: "#14304F",
    coral: "#FF9475",
    coralSoft: "#45241A",
    pink: "#FF8CCB",
    pinkSoft: "#45183A",

    night: "#211D5C",
    nightEnd: "#3F33A0",
    nightTile: "rgba(255, 255, 255, 0.11)",
    onNight: "#FFFFFF",
    onNightSecondary: "rgba(255, 255, 255, 0.74)",
  },
} as const;

export type Scheme = keyof typeof Colors;
export type ThemeColors = (typeof Colors)[Scheme];
export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/** A soft tinted background with matching foreground: chips, banners, icon tiles. */
export type Tone =
  "neutral" | "accent" | "success" | "warning" | "danger" | "sky" | "coral" | "pink";

export function toneColors(colors: ThemeColors, tone: Tone): { bg: string; fg: string } {
  switch (tone) {
    case "neutral":
      return { bg: colors.backgroundElement, fg: colors.textSecondary };
    case "accent":
      return { bg: colors.accentSoft, fg: colors.accentText };
    case "success":
      return { bg: colors.successSoft, fg: colors.success };
    case "warning":
      return { bg: colors.warningSoft, fg: colors.warning };
    case "danger":
      return { bg: colors.dangerSoft, fg: colors.danger };
    case "sky":
      return { bg: colors.skySoft, fg: colors.sky };
    case "coral":
      return { bg: colors.coralSoft, fg: colors.coral };
    case "pink":
      return { bg: colors.pinkSoft, fg: colors.pink };
  }
}

/** Card elevation. Dark surfaces separate by colour instead of shadow. */
export const CardShadow: Record<Scheme, string | undefined> = {
  light: "0 1px 2px rgba(23, 21, 31, 0.04), 0 10px 28px rgba(23, 21, 31, 0.06)",
  dark: undefined,
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "var(--font-display)",
    serif: "var(--font-serif)",
    rounded: "var(--font-rounded)",
    mono: "var(--font-mono)",
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 12,
  md: 18,
  lg: 26,
  full: 999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 640;

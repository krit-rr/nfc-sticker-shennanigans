import { Pressable, StyleSheet, View } from "react-native";

import { Icon, type IconName } from "./icon";
import { ThemedText } from "./themed-text";

import { Radius } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  /** "primary" is the one main action on a screen or card. */
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "md" | "sm";
  icon?: IconName;
  /** Stretch to the container width instead of hugging the label. */
  fullWidth?: boolean;
};

export function Button({
  title,
  onPress,
  disabled = false,
  variant = "primary",
  size = "md",
  icon,
  fullWidth = false,
}: Props) {
  const theme = useTheme();
  const colors = {
    primary: { bg: theme.accent, fg: theme.onAccent },
    secondary: { bg: theme.backgroundElement, fg: theme.text },
    ghost: { bg: "transparent", fg: theme.accentText },
    danger: { bg: "transparent", fg: theme.danger },
  }[variant];
  const small = size === "sm";
  const flat = variant === "ghost" || variant === "danger";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      hitSlop={small ? 6 : 0}
      style={({ pressed }) => [
        fullWidth ? styles.stretch : styles.hug,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <View
        style={[
          styles.base,
          small ? styles.sm : styles.md,
          flat && small && styles.flatSm,
          { backgroundColor: colors.bg },
        ]}
      >
        {icon ? (
          <Icon name={icon} size={small ? 15 : 18} color={colors.fg} weight="semibold" />
        ) : null}
        <ThemedText type={small ? "smallBold" : "bodyStrong"} style={{ color: colors.fg }}>
          {title}
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hug: { alignSelf: "flex-start" },
  stretch: { alignSelf: "stretch" },
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: Radius.full,
  },
  md: { minHeight: 50, paddingHorizontal: 22 },
  sm: { minHeight: 38, paddingHorizontal: 14 },
  flatSm: { paddingHorizontal: 4 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.4 },
});

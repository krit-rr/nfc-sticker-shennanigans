import { StyleSheet, View } from "react-native";

import { Icon, type IconName } from "./icon";
import { ThemedText } from "./themed-text";

import { toneColors, type Tone } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type Props = {
  label: string;
  tone?: Tone;
  icon?: IconName;
  /** Monospaced label, for ids and urls. */
  mono?: boolean;
};

/** A small rounded label: a state, a tag name, a time. Not interactive. */
export function Chip({ label, tone = "neutral", icon, mono = false }: Props) {
  const theme = useTheme();
  const { bg, fg } = toneColors(theme, tone);
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      {icon ? <Icon name={icon} size={13} color={fg} weight="semibold" /> : null}
      <ThemedText type={mono ? "code" : "smallBold"} style={{ color: fg }} numberOfLines={1}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    minHeight: 30,
    paddingHorizontal: 11,
    borderRadius: 15,
    flexShrink: 1,
  },
});

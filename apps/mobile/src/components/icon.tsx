import { SymbolView, type SymbolViewProps } from "expo-symbols";
import type { ColorValue } from "react-native";

import { useTheme } from "@/hooks/use-theme";

/** Every icon the app uses: an SF Symbol on iOS, a Material symbol on Android and web. */
const ICONS = {
  alarm: { ios: "alarm.fill", android: "alarm", web: "alarm" },
  bed: { ios: "bed.double.fill", android: "bed", web: "bed" },
  card: { ios: "person.text.rectangle.fill", android: "badge", web: "badge" },
  check: { ios: "checkmark", android: "check", web: "check" },
  checkCircle: { ios: "checkmark.circle.fill", android: "check_circle", web: "check_circle" },
  checklist: { ios: "checklist", android: "checklist", web: "checklist" },
  chevronDown: { ios: "chevron.down", android: "keyboard_arrow_down", web: "keyboard_arrow_down" },
  chevronRight: { ios: "chevron.right", android: "chevron_right", web: "chevron_right" },
  clock: { ios: "clock.fill", android: "schedule", web: "schedule" },
  drop: { ios: "drop.fill", android: "water_drop", web: "water_drop" },
  focus: { ios: "lock.fill", android: "lock", web: "lock" },
  hand: { ios: "hand.tap.fill", android: "touch_app", web: "touch_app" },
  info: { ios: "info.circle.fill", android: "info", web: "info" },
  link: { ios: "link", android: "link", web: "link" },
  mail: { ios: "envelope.fill", android: "mail", web: "mail" },
  moon: { ios: "moon.stars.fill", android: "bedtime", web: "bedtime" },
  nfc: { ios: "wave.3.right", android: "nfc", web: "nfc" },
  party: { ios: "party.popper.fill", android: "celebration", web: "celebration" },
  question: { ios: "questionmark.circle.fill", android: "help", web: "help" },
  repeat: { ios: "repeat", android: "repeat", web: "repeat" },
  restart: { ios: "arrow.counterclockwise", android: "restart_alt", web: "restart_alt" },
  safari: { ios: "safari.fill", android: "open_in_browser", web: "open_in_browser" },
  scan: { ios: "iphone.radiowaves.left.and.right", android: "contactless", web: "contactless" },
  sparkles: { ios: "sparkles", android: "auto_awesome", web: "auto_awesome" },
  sticker: { ios: "sensor.tag.radiowaves.forward.fill", android: "sell", web: "sell" },
  timer: { ios: "timer", android: "timer", web: "timer" },
  trash: { ios: "trash", android: "delete", web: "delete" },
  warning: { ios: "exclamationmark.triangle.fill", android: "warning", web: "warning" },
} as const satisfies Record<string, SymbolViewProps["name"]>;

export type IconName = keyof typeof ICONS;

type Props = {
  name: IconName;
  size?: number;
  /** Defaults to the primary text colour. */
  color?: ColorValue;
  weight?: "regular" | "medium" | "semibold" | "bold";
};

export function Icon({ name, size = 18, color, weight = "medium" }: Props) {
  const theme = useTheme();
  return (
    <SymbolView
      name={ICONS[name]}
      size={size}
      tintColor={color ?? theme.text}
      weight={weight}
      resizeMode="scaleAspectFit"
    />
  );
}

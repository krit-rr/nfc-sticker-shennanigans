import { View } from "react-native";

import { Icon, type IconName } from "./icon";

import { toneColors, type Tone } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type Props = { icon: IconName; tone?: Tone; size?: number };

/** A tinted rounded square with an icon: the leading visual of a row or a hero. */
export function IconTile({ icon, tone = "accent", size = 44 }: Props) {
  const theme = useTheme();
  const { bg, fg } = toneColors(theme, tone);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        borderCurve: "continuous",
        backgroundColor: bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon name={icon} size={Math.round(size * 0.48)} color={fg} weight="semibold" />
    </View>
  );
}

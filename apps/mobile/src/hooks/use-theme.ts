import { Colors, type Scheme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

/** "light" or "dark", following the system setting. */
export function useScheme(): Scheme {
  return useColorScheme() === "dark" ? "dark" : "light";
}

/** The colour tokens for the current scheme. */
export function useTheme() {
  return Colors[useScheme()];
}

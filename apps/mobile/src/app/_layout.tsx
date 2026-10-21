import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";

import { Colors } from "@/constants/theme";
import { useNfcBootstrap } from "@/hooks/use-nfc-bootstrap";
import { useScheme } from "@/hooks/use-theme";

/** React Navigation chrome (modal headers, backgrounds) in the app's own colours. */
const navigationThemes = {
  light: {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: Colors.light.background,
      card: Colors.light.background,
      text: Colors.light.text,
      border: Colors.light.border,
      primary: Colors.light.accentText,
    },
  },
  dark: {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: Colors.dark.background,
      card: Colors.dark.background,
      text: Colors.dark.text,
      border: Colors.dark.border,
      primary: Colors.dark.accentText,
    },
  },
};

export default function RootLayout() {
  const scheme = useScheme();
  useNfcBootstrap();

  return (
    <ThemeProvider value={navigationThemes[scheme]}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="t/[tagId]"
          options={{
            presentation: "modal",
            headerShown: true,
            headerShadowVisible: false,
            title: "Sticker tapped",
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}

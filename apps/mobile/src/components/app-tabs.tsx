import { NativeTabs } from "expo-router/unstable-native-tabs";

import { useTheme } from "@/hooks/use-theme";

export default function AppTabs() {
  const theme = useTheme();

  return (
    <NativeTabs
      backgroundColor={theme.background}
      indicatorColor={theme.accentSoft}
      tintColor={theme.accentText}
      labelStyle={{ selected: { color: theme.accentText } }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Alarms</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="alarm.fill" md="alarm" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="routines">
        <NativeTabs.Trigger.Label>Routines</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="checklist" md="checklist" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="tags">
        <NativeTabs.Trigger.Label>Stickers</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="tag.fill" md="sell" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="cards">
        <NativeTabs.Trigger.Label>Cards</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.text.rectangle.fill" md="badge" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

import {
  FALL_ASLEEP_MINUTES,
  demoTags,
  fallAsleepTimesFor,
  nextOccurrence,
  oneShotAlarmAt,
  ringTimes,
  soonestAlarm,
  wakeTimesFrom,
  type Alarm,
  type SleepOption,
} from "@tap/core";
import { useEffect, useState, type ReactNode } from "react";
import { Platform, Pressable, StyleSheet, Switch, View } from "react-native";
import Animated, { FadeInDown, FadeOut, LinearTransition } from "react-native-reanimated";

import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { Chip } from "@/components/chip";
import { Icon, type IconName } from "@/components/icon";
import { Screen } from "@/components/screen";
import { SectionHeader } from "@/components/section-header";
import { ThemedText } from "@/components/themed-text";
import { Fonts, Radius, Spacing } from "@/constants/theme";
import { useNow } from "@/hooks/use-now";
import { useTheme } from "@/hooks/use-theme";
import { loggingScheduler } from "@/lib/alarm-scheduler";
import { loadAlarms, saveAlarms } from "@/lib/alarm-store";
import { clock, clockDate, clockParts, countdown, weekdayShort } from "@/lib/format";

const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SLEEP_ALARM_PREFIX = "sleep-";

/**
 * Alarm cards slide in, fade out and make room for each other on iOS and Android. On web they
 * simply appear, so a card never depends on an animation frame to become visible.
 */
const cardMotion =
  Platform.OS === "web"
    ? {}
    : {
        entering: FadeInDown.duration(260),
        exiting: FadeOut.duration(160),
        layout: LinearTransition.duration(240),
      };

/** The sticker that "sleep now" alarms require: the first alarm anchor we know about. */
const anchorTag = demoTags.find((tag) => tag.action.kind === "alarm.dismiss") ?? null;

function cyclesLabel(option: SleepOption) {
  return `${option.cycles} ${option.cycles === 1 ? "cycle" : "cycles"}`;
}

/** One wake-up option inside the night card. The 5–6 cycle ones are the bright tiles. */
function WakeTile({ option, onPress }: { option: SleepOption; onPress: () => void }) {
  const theme = useTheme();
  const { time, period } = clockParts(option.time);
  const foreground = option.recommended ? theme.night : theme.onNight;
  const secondary = option.recommended ? theme.night : theme.onNightSecondary;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Wake at ${time} ${period}. ${cyclesLabel(option)}, ${option.hoursAsleep} hours of sleep.`}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: option.recommended ? theme.onNight : theme.nightTile },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.baseline}>
        <ThemedText style={[styles.tileClock, { color: foreground }]}>{time}</ThemedText>
        {period ? (
          <ThemedText type="smallBold" style={{ color: secondary }}>
            {period}
          </ThemedText>
        ) : null}
      </View>
      <ThemedText type="small" style={{ color: secondary }}>
        {cyclesLabel(option)} · {option.hoursAsleep} h
      </ThemedText>
    </Pressable>
  );
}

/** sleepyti.me's "zzz": if you go to bed now, wake at the end of a 90-minute cycle. */
type SleepNowCardProps = {
  now: Date;
  onPick: (option: SleepOption) => void;
  /** Shown after a time is picked, because the new alarm appears further down the page. */
  confirmation: string | null;
};

function SleepNowCard({ now, onPick, confirmation }: SleepNowCardProps) {
  const theme = useTheme();
  return (
    <Card tone="night">
      <View style={styles.row}>
        <View style={[styles.nightBadge, { backgroundColor: theme.nightTile }]}>
          <Icon name="moon" size={18} color={theme.onNight} />
        </View>
        <ThemedText type="heading" style={{ color: theme.onNight }}>
          Going to bed now?
        </ThemedText>
      </View>
      <ThemedText type="small" style={{ color: theme.onNightSecondary }}>
        Pick a wake-up time between sleep cycles. The {FALL_ASLEEP_MINUTES} minutes it takes to fall
        asleep are already counted.
      </ThemedText>
      <View style={styles.tileGrid}>
        {wakeTimesFrom(now).map((option) => (
          <WakeTile key={option.cycles} option={option} onPress={() => onPick(option)} />
        ))}
      </View>
      {confirmation ? (
        <View style={[styles.confirmation, { backgroundColor: theme.nightTile }]}>
          <Icon name="checkCircle" size={17} color={theme.onNight} />
          <ThemedText type="smallBold" style={[styles.flex, { color: theme.onNight }]}>
            {confirmation}
          </ThemedText>
        </View>
      ) : (
        <View style={styles.row}>
          <Icon name="sparkles" size={14} color={theme.onNightSecondary} />
          <ThemedText type="small" style={{ color: theme.onNightSecondary }}>
            Bright tiles are a full night: 5 to 6 cycles.
          </ThemedText>
        </View>
      )}
    </Card>
  );
}

function DayDots({ days, muted }: { days: readonly number[]; muted: boolean }) {
  const theme = useTheme();
  return (
    <View
      style={styles.days}
      accessible
      accessibilityLabel={`Repeats ${days.map((day) => DAY_NAMES[day]).join(", ")}`}
    >
      {DAY_LETTERS.map((letter, day) => {
        const on = days.includes(day);
        return (
          <View
            key={DAY_NAMES[day]}
            style={[
              styles.day,
              on && { backgroundColor: muted ? theme.backgroundElement : theme.accentSoft },
            ]}
          >
            <ThemedText
              type="smallBold"
              style={{
                color: !on ? theme.textTertiary : muted ? theme.textSecondary : theme.accentText,
              }}
            >
              {letter}
            </ThemedText>
          </View>
        );
      })}
    </View>
  );
}

function InfoRow({ icon, children }: { icon: IconName; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Icon name={icon} size={15} color={theme.textTertiary} />
      </View>
      <ThemedText type="small" themeColor="textSecondary" style={styles.flex}>
        {children}
      </ThemedText>
    </View>
  );
}

type AlarmCardProps = {
  alarm: Alarm;
  now: Date;
  onToggle: (enabled: boolean) => void;
  onRemove?: () => void;
};

function AlarmCard({ alarm, now, onToggle, onRemove }: AlarmCardProps) {
  const theme = useTheme();
  const next = nextOccurrence(alarm, now);
  const anchor = demoTags.find((tag) => tag.id === alarm.dismissTagId);
  const { time, period } = clockParts(clockDate(alarm.hour, alarm.minute, now));
  const oneShot = alarm.repeatDays.length === 0;
  // sleepyti.me's "I have to wake up at…": when to be asleep so this alarm lands between cycles.
  const bedtimes = next && !alarm.id.startsWith(SLEEP_ALARM_PREFIX) ? fallAsleepTimesFor(next) : [];

  return (
    <Card>
      <View style={styles.heading}>
        <View style={styles.spread}>
          <View style={styles.baseline}>
            <ThemedText type="display" style={!alarm.enabled && { color: theme.textTertiary }}>
              {time}
            </ThemedText>
            {period ? (
              <ThemedText
                type="bodyStrong"
                themeColor={alarm.enabled ? "textSecondary" : "textTertiary"}
              >
                {period}
              </ThemedText>
            ) : null}
          </View>
          <Switch
            value={alarm.enabled}
            onValueChange={onToggle}
            trackColor={{ true: theme.accent, false: theme.backgroundSelected }}
            ios_backgroundColor={theme.backgroundSelected}
            accessibilityLabel={`${alarm.label} alarm`}
          />
        </View>

        <View style={styles.rowWrap}>
          <ThemedText type="bodyStrong">{alarm.label}</ThemedText>
          {oneShot ? <Chip label="Once" /> : null}
        </View>
      </View>
      {oneShot ? null : <DayDots days={alarm.repeatDays} muted={!alarm.enabled} />}

      {next ? (
        <View style={[styles.details, { borderTopColor: theme.border }]}>
          {anchor ? (
            <InfoRow icon="sticker">
              Stops only at <ThemedText type="smallBold">{anchor.label}</ThemedText>
            </InfoRow>
          ) : null}
          {alarm.nag ? (
            <InfoRow icon="repeat">
              Rings again every {alarm.nag.everyMinutes} min, up to {alarm.nag.times} more times
            </InfoRow>
          ) : null}
          <InfoRow icon="clock">
            {weekdayShort(next)} {clock(next)}, in {countdown(now, next)}
          </InfoRow>
          {bedtimes.length ? (
            <View style={styles.bedtimes}>
              <InfoRow icon="bed">Be asleep by</InfoRow>
              <View style={[styles.rowWrap, styles.indent]}>
                {bedtimes.map((option) => (
                  <Chip
                    key={option.cycles}
                    label={clock(option.time)}
                    tone={option.recommended ? "accent" : "neutral"}
                    icon={option.recommended ? "sparkles" : undefined}
                  />
                ))}
              </View>
              <ThemedText type="small" themeColor="textTertiary" style={styles.indent}>
                Starred times are a full night. Get in bed {FALL_ASLEEP_MINUTES} minutes earlier.
              </ThemedText>
            </View>
          ) : null}
        </View>
      ) : null}

      {onRemove ? (
        <Button size="sm" variant="danger" icon="trash" title="Remove" onPress={onRemove} />
      ) : null}
    </Card>
  );
}

export default function AlarmsScreen() {
  const now = useNow();
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [lastSetId, setLastSetId] = useState<string | null>(null);
  const upcoming = soonestAlarm(alarms, now);

  useEffect(() => {
    let cancelled = false;
    void loadAlarms().then((stored) => {
      if (!cancelled) setAlarms(stored);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  /** Single write path: every change renders and persists the same list. */
  const update = (next: Alarm[]) => {
    setAlarms(next);
    void saveAlarms(next);
  };

  const addSleepAlarm = (option: SleepOption) => {
    const alarm = oneShotAlarmAt(option.time, {
      id: `${SLEEP_ALARM_PREFIX}${option.time.getTime()}`,
      label: `Sleep now · ${cyclesLabel(option)}`,
      dismissTagId: anchorTag?.id ?? null,
      nag: { everyMinutes: 3, times: 5 },
    });
    update([alarm, ...alarms.filter((existing) => existing.id !== alarm.id)]);
    setLastSetId(alarm.id);
    const first = nextOccurrence(alarm, new Date());
    if (first) void loggingScheduler.schedule(alarm, ringTimes(alarm, first));
  };

  const toggle = (id: string, enabled: boolean) => {
    const updated = alarms.map((alarm) => (alarm.id === id ? { ...alarm, enabled } : alarm));
    update(updated);
    const alarm = updated.find((candidate) => candidate.id === id);
    const first = alarm ? nextOccurrence(alarm, new Date()) : null;
    if (alarm && first) void loggingScheduler.schedule(alarm, ringTimes(alarm, first));
    else void loggingScheduler.cancel(id);
  };

  const remove = (id: string) => {
    update(alarms.filter((alarm) => alarm.id !== id));
    void loggingScheduler.cancel(id);
  };

  const lastSet = alarms.find((alarm) => alarm.id === lastSetId && alarm.enabled);
  const confirmation = lastSet
    ? `Alarm set for ${clock(clockDate(lastSet.hour, lastSet.minute, now))}.${anchorTag ? ` It stops only at ${anchorTag.label}.` : ""}`
    : null;

  return (
    <Screen
      title="Alarms"
      subtitle={
        upcoming
          ? `Next rings ${weekdayShort(upcoming.at)} at ${clock(upcoming.at)}, in ${countdown(now, upcoming.at)}.`
          : "No alarms are on."
      }
    >
      <SleepNowCard now={now} onPick={addSleepAlarm} confirmation={confirmation} />
      <SectionHeader
        title="Your alarms"
        trailing={`${alarms.filter((alarm) => alarm.enabled).length} on`}
      />
      {alarms.map((alarm) => (
        <Animated.View key={alarm.id} {...cardMotion}>
          <AlarmCard
            alarm={alarm}
            now={now}
            onToggle={(enabled) => toggle(alarm.id, enabled)}
            onRemove={alarm.id.startsWith(SLEEP_ALARM_PREFIX) ? () => remove(alarm.id) : undefined}
          />
        </Animated.View>
      ))}
      <ThemedText type="small" themeColor="textTertiary" style={styles.footnote}>
        Sleep times follow sleepyti.me: 90-minute cycles and {FALL_ASLEEP_MINUTES} minutes to fall
        asleep.
      </ThemedText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowWrap: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: Spacing.two },
  spread: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  baseline: { flexDirection: "row", alignItems: "baseline", gap: 6 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },

  nightBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    borderCurve: "continuous",
  },
  tileGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tile: {
    flexBasis: "46%",
    flexGrow: 1,
    borderRadius: Radius.md,
    borderCurve: "continuous",
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 2,
  },
  tileClock: {
    fontFamily: Fonts.rounded,
    fontSize: 26,
    lineHeight: 30,
    fontWeight: 700,
    letterSpacing: -0.4,
    fontVariant: ["tabular-nums"],
  },

  heading: { gap: 0 },
  days: { flexDirection: "row", gap: 6 },
  day: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },

  details: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 14, gap: 10 },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  infoIcon: { width: 20, height: 20, alignItems: "center", justifyContent: "center" },
  bedtimes: { gap: Spacing.two },
  indent: { marginLeft: 30 },
  footnote: { textAlign: "center", paddingHorizontal: Spacing.three },
});

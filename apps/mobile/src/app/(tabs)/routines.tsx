import {
  applyTap,
  completeStep,
  currentStep,
  demoRoutines,
  demoTags,
  progress,
  remainingSteps,
  startRun,
  type RoutineRun,
  type RoutineStep,
  type TapResult,
} from "@tap/core";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";

import { Banner, type BannerProps } from "@/components/banner";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { Chip } from "@/components/chip";
import { Icon } from "@/components/icon";
import { ProgressBar } from "@/components/progress-bar";
import { Screen } from "@/components/screen";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { loadRun, saveRun } from "@/lib/run-store";

const routine = demoRoutines[0]!;

type StepState = "done" | "current" | "upcoming";

/** What to tell the user about the tap that just happened. */
function feedback(result: TapResult): BannerProps {
  switch (result.result) {
    case "advanced":
      return { tone: "success", icon: "checkCircle", text: `${result.step.title}: done.` };
    case "finished":
      return {
        tone: "success",
        icon: "party",
        text: `${result.step.title}: done. That was the last one.`,
      };
    case "wrong-tag":
      return {
        tone: "warning",
        icon: "warning",
        text: `Not yet. First: ${result.expected.title}.`,
      };
    case "already-done":
      return { tone: "neutral", icon: "info", text: `${result.step.title} is already done.` };
    case "unknown-tag":
      return {
        tone: "warning",
        icon: "warning",
        text: "That sticker is not part of this routine.",
      };
    case "already-finished":
      return { tone: "neutral", icon: "info", text: "This routine is already finished." };
  }
}

type StepRowProps = {
  step: RoutineStep;
  number: number;
  state: StepState;
  isLast: boolean;
  onAct: () => void;
};

function StepRow({ step, number, state, isLast, onAct }: StepRowProps) {
  const theme = useTheme();
  const tag = demoTags.find((candidate) => candidate.id === step.tagId);
  const dot = {
    done: { bg: theme.success, fg: theme.onSuccess },
    current: { bg: theme.accent, fg: theme.onAccent },
    upcoming: { bg: theme.backgroundElement, fg: theme.textSecondary },
  }[state];

  return (
    <View style={styles.step}>
      <View style={styles.rail}>
        <View style={[styles.dot, { backgroundColor: dot.bg }]}>
          {state === "done" ? (
            <Icon name="check" size={14} color={dot.fg} weight="bold" />
          ) : (
            <ThemedText type="smallBold" style={{ color: dot.fg }}>
              {number}
            </ThemedText>
          )}
        </View>
        {isLast ? null : (
          <View
            style={[
              styles.line,
              { backgroundColor: state === "done" ? theme.success : theme.backgroundSelected },
            ]}
          />
        )}
      </View>

      <View style={[styles.stepBody, !isLast && styles.stepGap]}>
        <ThemedText
          type="bodyStrong"
          style={
            state === "done" && { color: theme.textTertiary, textDecorationLine: "line-through" }
          }
        >
          {step.title}
        </ThemedText>
        <View style={styles.rowWrap}>
          {tag ? (
            <Chip
              icon="sticker"
              tone={state === "current" ? "accent" : "neutral"}
              label={tag.label}
            />
          ) : (
            <Chip icon="hand" label="By hand" />
          )}
          {step.estimateMinutes ? (
            <ThemedText type="small" themeColor="textTertiary">
              about {step.estimateMinutes} min
            </ThemedText>
          ) : null}
        </View>
        {state === "done" ? null : (
          <Button
            size="sm"
            variant={state === "current" ? "primary" : "ghost"}
            icon={tag ? "nfc" : "check"}
            title={tag ? "Simulate tap" : "Check off"}
            onPress={onAct}
          />
        )}
      </View>
    </View>
  );
}

export default function RoutinesScreen() {
  const [run, setRun] = useState<RoutineRun | null>(null);
  const [last, setLast] = useState<BannerProps | null>(null);

  // Reload whenever the tab gains focus: a sticker tap advances the run on the tag screen.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void loadRun(routine.id).then((stored) => {
        if (!cancelled) setRun(stored ?? startRun(routine));
      });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  if (!run) return <Screen eyebrow="Routine" title={routine.name} />;
  return <RoutineBody run={run} setRun={setRun} last={last} setLast={setLast} />;
}

type RoutineBodyProps = {
  run: RoutineRun;
  setRun: (run: RoutineRun) => void;
  last: BannerProps | null;
  setLast: (last: BannerProps | null) => void;
};

function RoutineBody({ run, setRun, last, setLast }: RoutineBodyProps) {
  const { done, total, fraction } = progress(routine, run);
  const current = currentStep(routine, run);
  const finished = current === null;
  const minutesLeft = remainingSteps(routine, run).reduce(
    (sum, step) => sum + (step.estimateMinutes ?? 0),
    0,
  );

  const apply = (result: TapResult) => {
    setRun(result.run);
    setLast(feedback(result));
    void saveRun(result.run);
  };

  return (
    <Screen
      eyebrow="Routine"
      title={routine.name}
      subtitle={finished ? "All done. Nice work." : `Next up: ${current.title}.`}
    >
      <Card>
        <View style={styles.spread}>
          <ThemedText type="heading">
            {done} of {total} done
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {finished ? "Finished" : `about ${minutesLeft} min left`}
          </ThemedText>
        </View>
        <ProgressBar fraction={fraction} tone={finished ? "success" : "accent"} />
      </Card>

      {last ? <Banner {...last} /> : null}

      <Card style={styles.steps}>
        {routine.steps.map((step, index) => (
          <StepRow
            key={step.id}
            step={step}
            number={index + 1}
            isLast={index === routine.steps.length - 1}
            state={
              run.completedStepIds.includes(step.id)
                ? "done"
                : current?.id === step.id
                  ? "current"
                  : "upcoming"
            }
            onAct={() =>
              apply(
                step.tagId
                  ? applyTap(routine, run, step.tagId)
                  : completeStep(routine, run, step.id),
              )
            }
          />
        ))}
      </Card>

      <Button
        variant="ghost"
        icon="restart"
        title="Start over"
        onPress={() => {
          const fresh = startRun(routine);
          setRun(fresh);
          setLast(null);
          void saveRun(fresh);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  spread: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  rowWrap: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: Spacing.two },

  steps: { gap: 0 },
  step: { flexDirection: "row", gap: 14 },
  rail: { width: 30, alignItems: "center" },
  dot: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  line: { flex: 1, width: 2, borderRadius: 1, marginVertical: 4 },
  stepBody: { flex: 1, gap: Spacing.two, paddingTop: 3 },
  stepGap: { paddingBottom: Spacing.four },
});

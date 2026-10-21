import { demoRoutines, type Action } from "@tap/core";

import type { IconName } from "@/components/icon";
import type { Tone } from "@/constants/theme";

/** One-line, human description of what a sticker does. */
export function describeAction(action: Action): string {
  switch (action.kind) {
    case "alarm.dismiss":
      return "Stops your alarm. You have to get here to tap it.";
    case "routine.step":
      return describeRoutineStep(action.routineId, action.stepId);
    case "focus.toggle":
      return "Turns focus mode on and off.";
    case "timer.start":
      return `Starts a ${action.minutes} minute timer.`;
    case "log.event":
      return `Logs "${action.event}" with the time.`;
    case "card.open":
      return "Opens your business card.";
    case "url.open":
      return `Opens ${action.url}`;
  }
}

function describeRoutineStep(routineId: string, stepId: string): string {
  const routine = demoRoutines.find((candidate) => candidate.id === routineId);
  const step = routine?.steps.find((candidate) => candidate.id === stepId);
  if (!routine || !step) return "Checks off a routine step.";
  return `Checks off “${step.title}” in ${routine.name}.`;
}

/** The icon and colour that represent each kind of sticker across the app. */
export function actionVisual(action: Action): { icon: IconName; tone: Tone } {
  switch (action.kind) {
    case "alarm.dismiss":
      return { icon: "alarm", tone: "accent" };
    case "routine.step":
      return { icon: "checklist", tone: "success" };
    case "focus.toggle":
      return { icon: "focus", tone: "coral" };
    case "timer.start":
      return { icon: "timer", tone: "warning" };
    case "log.event":
      return { icon: "drop", tone: "sky" };
    case "card.open":
      return { icon: "card", tone: "pink" };
    case "url.open":
      return { icon: "link", tone: "neutral" };
  }
}

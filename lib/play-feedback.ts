import { runDelta } from "./engine";
import { currentGoal } from "./story/goal";
import type { GameState } from "./types";

/** Only compare committed state. Hidden flags are deliberately not interpreted. */
export function choiceReceipt(before: GameState, after: GameState): string[] {
  const lines = runDelta(before, after);
  const acquired = after.journal.filter(entry => !before.journal.some(old => old.id === entry.id));
  if (acquired.length) lines.push(`${acquired.length} new journal ${acquired.length === 1 ? "entry" : "entries"}. Review in Sheet → Journal.`);
  if (currentGoal(before) !== currentGoal(after)) lines.push(`Objective updated: ${currentGoal(after)}`);
  return lines;
}

/** History is chosen labels, not inferred outcomes or undiscovered story. */
export function recentDecisions(state: GameState): string[] {
  return state.log.slice(-3);
}

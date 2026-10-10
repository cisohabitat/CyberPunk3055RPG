import type { Effect, GameState } from "./types";

export const WINDOW_FLAGS = [0, 1, 2, 3].map(n => `chapel_window_${n}`);
export const WINDOW_OPEN_FLAGS = WINDOW_FLAGS.slice(1);
// Valid runs have one flag. Conflicting imported flags use the smallest
// allowance, so malformed drafts never create extra opportunities.
export function windowRemaining(state: GameState): number {
  return [0, 1, 2, 3].find(n => state.flags[`chapel_window_${n}`]) ?? 0;
}
export function startWindow(state: GameState): Effect {
  return state.flags.chapel_window_started ? {} : { flags: ["chapel_window_started", "chapel_window_3"], flagsOff: WINDOW_FLAGS.slice(0, 3) };
}
export function spendWindow(state: GameState): Effect {
  const n = Math.max(0, windowRemaining(state) - 1);
  return { flags: [`chapel_window_${n}`], flagsOff: WINDOW_FLAGS.filter(flag => flag !== `chapel_window_${n}`) };
}
export function windowResume(state: GameState): string {
  if (state.flags.chapel_window_entered) return "chapel_window_exit";
  return windowRemaining(state) ? "chapel_window_plan" : "chapel_window_expired";
}

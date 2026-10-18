import type { CheckResult } from "./types";

export type DiceCueName = "dice-tumble" | "dice-land-success" | "dice-land-miss" | "dice-land-ten" | "dice-land-one";
export const DICE_CUE_MIX = { level: .38, speechDuck: .35 } as const;

/** Critical accents follow the resolved rule, not merely a displayed face. */
export function diceLandingCue(result: Pick<CheckResult, "success" | "crit">): DiceCueName {
  if (result.crit === "success") return "dice-land-ten";
  if (result.crit === "fail") return "dice-land-one";
  return result.success ? "dice-land-success" : "dice-land-miss";
}

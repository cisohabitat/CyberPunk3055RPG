import { FACTIONS } from "./character";
import type { GameState, FactionId } from "./types";
export type ResourceChanges = Partial<Record<"creds" | "strain" | FactionId, number>>;
/** Actual committed values include caps, paid costs and critical adjustments. */
export function resourceChanges(before: GameState, after: GameState): ResourceChanges {
  const result: ResourceChanges = {};
  for (const key of ["creds", "strain"] as const) {
    const amount = after[key] - before[key];
    if (amount) result[key] = amount;
  }
  for (const key of FACTIONS) {
    const amount = after.factions[key] - before.factions[key];
    if (amount) result[key] = amount;
  }
  return result;
}

import { objectives } from "./objectives";
import { finaleScene } from "./finale-direction";
import type { GameState } from "./types";

export function finaleCommitments(state: GameState) {
  if (!finaleScene(state.sceneId)) return null;
  const rows = objectives(state);
  if (!rows.length) return null;
  return { rows, complete: rows.filter(row => row.status === "Complete").length,
    open: rows.filter(row => row.status === "Open").length,
    unresolved: rows.filter(row => row.status === "Unresolved").length,
    compromised: rows.filter(row => row.status === "Compromised").length };
}

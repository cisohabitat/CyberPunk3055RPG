import { objectives } from "./objectives";
import { finaleScene } from "./finale-direction";
import type { GameState } from "./types";

export function finaleCommitments(state: GameState) {
  if (!finaleScene(state.sceneId)) return null;
  const rows = objectives(state);
  if (!rows.length) return null;
  const priority = rows.find(row => row.status === "Compromised")
    ?? rows.find(row => row.status === "Unresolved")
    ?? rows.find(row => row.status === "Open");
  return { rows, complete: rows.filter(row => row.status === "Complete").length,
    priority,
    open: rows.filter(row => row.status === "Open").length,
    unresolved: rows.filter(row => row.status === "Unresolved").length,
    compromised: rows.filter(row => row.status === "Compromised").length };
}

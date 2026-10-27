/** Real legal operations over authored-route checkpoints. No fabricated grants. */
import { commitChoice, getScene, presentChoices } from "../../lib/engine";
import { commitCaseAction } from "../../lib/case-file";
import { commitArchivePlan } from "../../lib/archive-plan";
import { importRun, exportRun } from "../../lib/vault";
import { routeCheckpoint } from "./route-checkpoint";
import type { GameState } from "../../lib/types";

export function takeIntegrated(state: GameState, id: string, roll = 10) {
  const choice = presentChoices(state, getScene(state.sceneId)).find(c => c.id === id && c.enabled);
  if (!choice) throw new Error(`Unavailable integration step ${state.sceneId}/${id}`);
  return importRun(exportRun(commitChoice(state, choice, choice.check ? { roll } : undefined).state));
}
export function closeIntegratedWeek(state: GameState) {
  for (const id of ["stand", "back-to-board", "to-the-wall", "to-ward-nine"]) state = takeIntegrated(state, id);
  if (state.sceneId === "act3_neighborhood") state = takeIntegrated(state, "go-wall");
  state = takeIntegrated(state, "face-sera");
  return takeIntegrated(state, "leave-wall");
}
export function integratedArchive(variant: "reader" | "carbon" | "withdraw" | "paused") {
  let state = routeCheckpoint("scarce-archive-open", "act2_archive_compare");
  state = commitCaseAction(state, { type: "claim", claim: "issuer" });
  state = commitCaseAction(state, { type: "link", source: "memory-order", relation: "supports" });
  state = commitCaseAction(state, { type: "test" });
  state = commitCaseAction(state, { type: "link", source: "memory-order", relation: "limits" });
  state = commitCaseAction(state, { type: "test" });
  state = takeIntegrated(state, "case-pursue-archive");
  const carbon = variant === "carbon";
  state = commitArchivePlan(state, { objective: carbon ? "corroborate" : "authenticate", approach: carbon ? "carbon" : "reader", contingency: variant === "withdraw" ? "withdraw" : "staffed" });
  state = takeIntegrated(state, carbon ? "archive-plan-window" : "archive-plan-priority");
  state = takeIntegrated(state, carbon ? "lift-carbon" : "trace-receipt", variant === "withdraw" || variant === "paused" ? 1 : 10);
  if (variant === "paused") state = takeIntegrated(state, "pause-archive-recovery");
  if (variant === "reader" || carbon) {
    state = takeIntegrated(state, "withhold-technician");
    state = takeIntegrated(state, "keep-chain");
  }
  const checkpoint = state;
  return { checkpoint, final: closeIntegratedWeek(state) };
}

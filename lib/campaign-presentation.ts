import type { GameState } from "./types";
import { finaleScene } from "./finale-direction";

const DEPOT_CONTEXTS = new Set([
  "act2_district_brief", "act2_district_edda", "act2_district_canal", "act2_district_docket",
  "act2_district_kerr", "act2_district_kerr_reply", "act2_district_work", "act2_district_rest", "act2_district_result", "act3_district_return",
  "act2_technique_bench", "act2_technique_chrome", "act2_technique_chrome_submit", "act2_technique_ghost", "act2_technique_ghost_route",
  "act2_technique_face", "act2_technique_face_scope", "act2_technique_nerve", "act2_technique_nerve_handover", "act2_technique_result",
]);
export function showDistrictLedger(state: GameState) {
  return Boolean(state.flags.district_started && DEPOT_CONTEXTS.has(state.sceneId));
}

/** Written reflection of recorded costs. No new dialogue, outcome or permission. */
export function finaleConsequenceEcho(state: GameState): { id: string; title: string; text: string } | undefined {
  if (!finaleScene(state.sceneId)) return;
  const f = state.flags, record = (id: string) => state.journal.some(row => row.id === id);
  if (f.technique_work_waived && f.technique_review_reference && record("technique-review")) return {
    id: "wage", title: "The wage and the record",
    text: "You gave up the sorting wage. A correction now has a review reference; what the depot decides remains ahead of you.",
  };
  if (f.witness_lost && record("nia-account")) return {
    id: "room", title: "The room and the account",
    text: "Nia's words survive beside the cost of a room Helion learned to find. The memorial page cannot make that earlier address private again.",
  };
  if (f.archive_paused && !f.order_verified && record("archive-gap")) return {
    id: "question", title: "The question you carry",
    text: "You leave with a question still open. The failed archive attempt remains recorded; the wall supplies no answer the search did not find.",
  };
}

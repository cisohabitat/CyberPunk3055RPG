import { FRAGMENTS } from "./evidence";
import { sourceLedger } from "./source-ledger";
import type { GameState } from "./types";

export const SOURCE_GROUPS = [
  { id: "memory", label: "Recorded memory" },
  { id: "archive", label: "Archive records" },
  { id: "witness", label: "Witness account" },
  { id: "interpretation", label: "Interpretations and corrections" },
] as const;
export type SourceGroup = typeof SOURCE_GROUPS[number]["id"];
const MEMORY = new Set(["memory-signature", "memory-order", "memory-roster", "mara-assurance", "mara-channel"]);
const ARCHIVE = new Set(["archive-method", "verified-order", "archive-gap", "archive-custody"]);

// Read-only views of acquired records. Preserve their original order, wording
// and kind; fragment metadata was already available on the inspected card.
export function notebookSources(state: GameState) {
  return sourceLedger(state).map(record => {
    const group: SourceGroup = MEMORY.has(record.id) ? "memory" : ARCHIVE.has(record.id) ? "archive" : record.id === "nia-account" ? "witness" : "interpretation";
    const fragment = FRAGMENTS.find(fragment => record.id === `memory-${fragment.id}`);
    return { ...record, group, ...(fragment ? { time: fragment.time, provenance: fragment.source } : {}) };
  });
}
export function filterNotebookSources(state: GameState, group: SourceGroup | "all", query: string) {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return notebookSources(state).filter(record => (group === "all" || record.group === group) && terms.every(term => [record.title, record.kind, record.text, record.time, record.provenance].filter(Boolean).join(" ").toLowerCase().includes(term)));
}

// Explicit contexts keep consultation away from undiscovered opening facts.
const NOTEBOOK_SCENES = new Set([
  "memory_table", "memory_reconstruction", "memory_sequence", "memory_sequence_result", "memory_model", "memory_model_test", "memory_model_result", "memory_challenge", "memory_cross_exam", "memory_assurance", "memory_channel", "memory_publication",
  "act2_archive_brief", "act2_archive_prep", "act2_archive_compare", "act2_archive_challenge", "act2_archive_door", "act2_archive_gap", "act2_archive_custody", "act2_public_response",
  "act3_records_visit", "act3_testimony_review", "act3_testimony_consent", "act3_testimony_nia", "act3_testimony_hearing", "act3_testimony_correction", "act3_testimony_record",
]);
export function canConsultSources(state: GameState) {
  return NOTEBOOK_SCENES.has(state.sceneId) && sourceLedger(state).length > 0;
}

import type { GameState } from "./types";

export type SceneCueName = "foley-viewer" | "foley-reader" | "foley-case" | "foley-recorder" | "foley-paper" | "foley-chair" | "foley-folio";
export const SCENE_CUE_MIX = { level: .5, speechDuck: .35 } as const;

/** Mechanical actions only: a cue supplies no new evidence or outcome. */
export function sceneInteractionCue(before: GameState, choiceId: string, after: GameState): SceneCueName | undefined {
  if (before.sceneId === "act2_witness_plan" && choiceId === "steady-chair" && after.sceneId === "act2_witness_door") return "foley-chair";
  if (before.sceneId === "act2_archive_custody" && ["withhold-technician", "ask-named-source"].includes(choiceId)
    && after.sceneId === "act2_archive_verified" && !before.flags.archive_custody && after.flags.archive_custody) return "foley-paper";
  if (before.sceneId === "act3_testimony_record" && ["file-public-account", "withdraw-public-account"].includes(choiceId)
    && after.sceneId === "act3_arrival" && !before.flags.testimony_done && after.flags.testimony_done) return "foley-paper";
  if (before.sceneId === "act3_arrival" && ["let-ives", "say-anyway"].includes(choiceId) && after.sceneId === "ending_listed") return "foley-folio";
  const fragmentFlags: Record<string, string> = { "inspect-signature": "memory_signature", "inspect-order": "memory_order", "inspect-roster": "memory_roster" };
  const fragment = fragmentFlags[choiceId];
  if (before.sceneId === "memory_table" && after.sceneId === "memory_table" && fragment && !before.flags[fragment] && after.flags[fragment]) return "foley-viewer";
  if (before.sceneId === "act2_archive_compare" && after.sceneId === before.sceneId) {
    const records: Record<string, string> = { "catalog-request-authorization": "archive_catalog_queried_authorization", "catalog-request-revision": "archive_catalog_queried_revision", "catalog-request-service": "archive_catalog_queried_service" };
    const flag = records[choiceId];
    if (flag && !before.flags[flag] && after.flags[flag]) return "foley-reader";
  }
  if (before.sceneId === "act2_archive_prep" && choiceId === "index-archive" && after.sceneId === "act2_archive_compare") return "foley-reader";
  if (before.sceneId === "act2_archive_door" && ["trace-receipt", "isolate-key"].includes(choiceId)
    && ["act2_archive_custody", "act2_archive_verified", "act2_archive_gap"].includes(after.sceneId)) return "foley-reader";
  if (before.sceneId === "act2_freight_sources" && choiceId === "inspect-freight-seal" && after.sceneId === before.sceneId && !before.flags.freight_seal && after.flags.freight_seal) return "foley-case";
  if (after.sceneId === "act3_testimony_hearing"
    && (before.sceneId === "act3_testimony_consent" && choiceId === "keep-recording-private"
      || before.sceneId === "act3_testimony_nia" && ["accept-public-permission", "decline-public-quote"].includes(choiceId))) return "foley-recorder";
}

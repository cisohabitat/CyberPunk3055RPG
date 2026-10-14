import type { GameState } from "./types";

export type SceneCueName = "foley-viewer" | "foley-reader" | "foley-case" | "foley-recorder";
export const SCENE_CUE_MIX = { level: .5, speechDuck: .35 } as const;

/** Mechanical actions only: a cue supplies no new evidence or outcome. */
export function sceneInteractionCue(before: GameState, choiceId: string, after: GameState): SceneCueName | undefined {
  const fragmentFlags: Record<string, string> = { "inspect-signature": "memory_signature", "inspect-order": "memory_order", "inspect-roster": "memory_roster" };
  const fragment = fragmentFlags[choiceId];
  if (before.sceneId === "memory_table" && after.sceneId === "memory_table" && fragment && !before.flags[fragment] && after.flags[fragment]) return "foley-viewer";
  if (before.sceneId === "act2_archive_prep" && choiceId === "index-archive" && after.sceneId === "act2_archive_compare") return "foley-reader";
  if (before.sceneId === "act2_archive_door" && ["trace-receipt", "isolate-key"].includes(choiceId)
    && ["act2_archive_custody", "act2_archive_verified", "act2_archive_gap"].includes(after.sceneId)) return "foley-reader";
  if (before.sceneId === "act2_freight_sources" && choiceId === "inspect-freight-seal" && after.sceneId === before.sceneId && !before.flags.freight_seal && after.flags.freight_seal) return "foley-case";
  if (after.sceneId === "act3_testimony_hearing"
    && (before.sceneId === "act3_testimony_consent" && choiceId === "keep-recording-private"
      || before.sceneId === "act3_testimony_nia" && ["accept-public-permission", "decline-public-quote"].includes(choiceId))) return "foley-recorder";
}

import type { GameState } from "./types";
import { relationshipCoda } from "./relationships";

/** Explicit closing frames; chapter endings retain their existing presentation. */
export const FINALE_SCENES = {
  ending_names: { label: "At the wall · Sera", kind: "conversation" },
  ending_quiet: { label: "On the stair · Sera", kind: "conversation" },
  ending_witness: { label: "A late account · Sera", kind: "conversation" },
  ending_listed: { label: "The memorial page · Ives", kind: "conversation" },
} as const;

export function finaleScene(id: string) {
  return Object.hasOwn(FINALE_SCENES, id) ? FINALE_SCENES[id as keyof typeof FINALE_SCENES] : undefined;
}

/** A remembered answer supplies no new outcome. Detailed records stay available. */
export function finalePersonalEcho(state: GameState): string | undefined {
  if (!finaleScene(state.sceneId)) return;
  const mara = relationshipCoda(state);
  if (mara) return mara;
  if (state.flags.nia_contact_set && state.journal.some(row => row.id === "nia-contact")) {
    if (state.flags.nia_contact_paused) return "You leave Nia the quiet you agreed to give her. The wall does not reopen the questions; any account she approved keeps its own terms.";
    if (state.flags.nia_contact_relay) return "The clinic can carry another question to Nia. Whether she answers remains hers to choose, after this wall and after your story of it.";
  }
  if (state.flags.kerr_question_done && state.journal.some(row => row.id === "kerr-personal-answer")) {
    return "You remember Kerr counting the steps to a table he hopes to reach. His answer stays a hope; you have not seen the brace fitted or tested.";
  }
  if (state.flags.lumen_quiet_heard) {
    return "You remember Lumen putting the cup back in the same place. The small answer stays with you beside the names; it settles no debt to them.";
  }
}

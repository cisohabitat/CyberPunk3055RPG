import { CHAPTER_BACKDROPS, sceneIllustration, type Illustration } from "./art";
import type { GameState } from "./types";
import { nightRetell } from "./story/retell";

export const CITY_SCHEMATIC: Illustration = {
  src: "/art/city-schematic.jpg", small: "/art/city-schematic-small.jpg", caption: "Kite City · runner’s schematic",
  description: "An atmospheric sketch of anonymous blocks and channels in copper ink on dark paper; positions are schematic, not geographic directions.",
};
/** Resolve each slot from its own immutable snapshot, never from the active runner. */
export function checkpointArt(state: GameState): Illustration | undefined {
  return sceneIllustration(state.sceneId, state.flags) ?? (Object.hasOwn(CHAPTER_BACKDROPS, state.sceneId) ? CHAPTER_BACKDROPS[state.sceneId] : undefined);
}
export function campaignRecap(state: GameState) {
  const retell = nightRetell(state);
  const shared = state.flags.mara_company_kept && state.journal.find(e => e.id === "mara-window-choice");
  const custody = state.flags.archive_custody && state.journal.find(e => e.id === "archive-custody");
  const expected: Record<string, boolean> = {
    ending_names: Boolean(state.flags.spoke_names),
    ending_witness: !state.flags.spoke_names && Boolean(state.flags.confirmed_leak),
    ending_listed: !state.flags.spoke_names && !state.flags.confirmed_leak && Boolean(state.flags.ives_took_list),
    ending_quiet: !state.flags.spoke_names && !state.flags.confirmed_leak && !state.flags.ives_took_list,
  };
  return [
    { chapter: "The Hour", text: retell[0], art: sceneIllustration("front") },
    { chapter: "The Week", text: shared ? shared.text : custody ? custody.text : retell[1],
      art: shared ? sceneIllustration("act2_mara_company_kept", state.flags) : custody ? sceneIllustration("act3_edda_visit", state.flags) : CHAPTER_BACKDROPS.card_week },
    { chapter: "The Wall", text: retell[2], art: Object.hasOwn(expected, state.sceneId) && expected[state.sceneId] ? checkpointArt(state) : sceneIllustration("ward_wall") },
  ];
}

import type { Illustration } from "./art";

/** Explicit presentation direction; never changes a source, actor, primary shot or sound plan. */
const shot = (id: string, caption: string, description: string): Illustration => ({ src: `/art/${id}.jpg`, small: `/art/${id}-small.jpg`, caption, description });
export const VISUAL_SHOTS = {
  edda: shot("edda-listening-wide", "Edda · a moment of attention", "Edda listens in three-quarter view: the same short graying hair, rectangular glasses, worn brown work coat and dark scarf. Her hands and any documents are outside the frame; her reserved expression depicts no agreement or restored archive shift."),
  kerr: shot("kerr-listening-wide", "Kerr · under the awning", "Kerr listens beneath amber stall light in his worn black raincoat and scarf. His weathered face remains serious; hands, case and brace are outside the frame. No handover, cure or forgiveness is shown."),
  question: shot("archive-question-detail", "The question · a space on the table", "Three separate blank cards and one plain cup leave a pale tea ring on a scratched brass tabletop. No writing, signature, acquired source or test result is visible."),
  counter: shot("stall-quiet-detail", "The counter · a quiet corner", "A chipped cup, its pale ring and a folded blank paper occupy a worn wooden tabletop corner. The floor and case location remain outside the frame; no delivery, recipient entry, payment or treatment is depicted."),
  memorial: shot("memorial-pause-detail", "Ward Nine · the pencil and the rain", "A pencil lies on a dry lip of the rain-worn memorial stair. No legible name, new inscription, transferred paper or final choice is depicted."),
} as const;
type Direction = { label: string; kind: "conversation"; personSpeaker?: "Edda" | "Kerr"; person?: Illustration; detail: Illustration };
const archive = (label: string): Direction => ({ label, kind: "conversation", personSpeaker: "Edda", person: VISUAL_SHOTS.edda, detail: VISUAL_SHOTS.question });
const stall = (label: string): Direction => ({ label, kind: "conversation", personSpeaker: "Kerr", person: VISUAL_SHOTS.kerr, detail: VISUAL_SHOTS.counter });
export const VISUAL_DIRECTIONS: Readonly<Record<string, Direction>> = {
  act2_craft_archive: archive("At Edda's desk · three descriptions"),
  act2_craft_archive_challenge: archive("At Edda's desk · a question reconsidered"),
  act2_craft_archive_issuer: archive("At Edda's desk · before the key test"),
  act2_craft_archive_ledger: archive("At Edda's desk · a bounded request"),
  act3_craft_archive_return: archive("Edda · the question you brought back"),
  act3_payoff_edda: archive("Edda · a minute at the table"),
  act2_craft_kerr_offer: stall("Kerr · the price of a quiet route"),
  act2_craft_kerr_settlement: stall("Kerr · the actual bargain"),
  act3_craft_kerr_settlement: stall("Kerr · the bargain at the wall"),
  act3_payoff_kerr: stall("Kerr · the space beside the table"),
  ending_names: { label: "At the wall · Sera", kind: "conversation", detail: VISUAL_SHOTS.memorial },
  ending_quiet: { label: "On the stair · Sera", kind: "conversation", detail: VISUAL_SHOTS.memorial },
  ending_witness: { label: "A late account · Sera", kind: "conversation", detail: VISUAL_SHOTS.memorial },
  ending_listed: { label: "The memorial page · Ives", kind: "conversation", detail: VISUAL_SHOTS.memorial },
};
export function visualDirection(sceneId: string): Direction | undefined {
  return Object.hasOwn(VISUAL_DIRECTIONS, sceneId) ? VISUAL_DIRECTIONS[sceneId] : undefined;
}

import { previewCheck } from "./engine";
import { SCENES } from "./story";
import { FIELD_KITS } from "./loadout";
import type { GameState } from "./types";

const EXAMPLES: Record<string, readonly [string, string][]> = {
  "archive-probe": [["act2_witness_plan", "read-scanner"], ["act2_archive_prep", "index-archive"]],
  "chair-harness": [["act2_witness_plan", "steady-chair"], ["act2_archive_prep", "brace-archive"]],
  "desk-guide": [["act2_witness_plan", "arrange-escort"], ["act2_witness_checkpoint", "argue-transfer"]],
  "route-shroud": [["act2_witness_plan", "scout-patrol"], ["act2_archive_prep", "watch-archive"]],
};

/** Hypothetical equipment only. These examples grant no access or preparation. */
export function kitComparison(state: GameState, id: string) {
  if (!FIELD_KITS.some(kit => kit.id === id) || state.items.includes(id)) return [];
  const equipped = { ...state, items: [...state.items, id] };
  return EXAMPLES[id].flatMap(([scene, choiceId]) => {
    const check = SCENES[scene].choices.find(choice => choice.id === choiceId)?.check;
    if (!check) return [];
    return [{ label: check.label, before: previewCheck(state, check).hits * 10, after: previewCheck(equipped, check).hits * 10 }];
  });
}

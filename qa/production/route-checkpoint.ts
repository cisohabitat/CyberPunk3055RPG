/** Offline authored-route checkpoints; never imported by gameplay. */
import { readFileSync } from "node:fs";
import { createCharacter, commitChoice, getScene, presentChoices } from "../../lib/engine";
import type { ReplaySpec } from "../../lib/story-replay";
export function routeCheckpoint(file: string, sceneId: string, choiceId?: string) {
  const spec = JSON.parse(readFileSync(`qa/routes/${file}.json`, "utf8")) as ReplaySpec;
  let state = createCharacter(spec.character);
  for (const step of spec.steps) {
    if (state.sceneId === sceneId && (!choiceId || step.choiceId === choiceId)) return state;
    const choice = presentChoices(state, getScene(state.sceneId)).find(choice => choice.id === step.choiceId && choice.enabled);
    if (!choice) throw new Error(`Unavailable authored choice ${file}/${step.choiceId}`);
    state = commitChoice(state, choice, choice.check ? { roll: step.roll! } : undefined).state;
  }
  if (state.sceneId === sceneId && !choiceId) return state;
  throw new Error(`No authored checkpoint ${file}/${sceneId}/${choiceId}`);
}

/** Offline full-route contract. Never import into the game. */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { createCharacter, commitChoice, getScene, presentChoices, sceneText } from "../../lib/engine";
import { sceneIllustration } from "../../lib/art";
import { visibleCampaignDialogue } from "../../lib/campaign-dialogue";
import { parseSave } from "../../lib/storage";
import type { ReplaySpec } from "../../lib/story-replay";

export function campaignContract() {
  const hash = createHash("sha256");
  const files = readdirSync("qa/routes").filter(f => f.endsWith(".json")).sort();
  let visits = 0;
  for (const file of files) {
    const spec = JSON.parse(readFileSync(`qa/routes/${file}`, "utf8")) as ReplaySpec;
    let state = createCharacter(spec.character);
    for (let index = 0; index <= spec.steps.length; index++) {
      const scene = getScene(state.sceneId), choices = presentChoices(state, scene), text = sceneText(scene, state);
      hash.update(JSON.stringify({ file, index, state, text, choices, dialogue: visibleCampaignDialogue(scene.id, scene.speaker, text), art: sceneIllustration(scene.id, state.flags) }) + "\n");
      visits++;
      const step = spec.steps[index];
      if (!step) break;
      const choice = choices.find(c => c.id === step.choiceId && c.enabled);
      if (!choice) throw new Error(`Missing canonical choice ${file}/${step.choiceId}`);
      state = commitChoice(state, choice, choice.check ? { roll: step.roll! } : undefined).state;
      if (step.reload) {
        const restored = parseSave(JSON.stringify(state));
        if (!restored) throw new Error(`Rejected checkpoint ${file}/${index}`);
        state = restored;
      }
    }
  }
  return { routes: files.length, visits, sha256: hash.digest("hex") };
}

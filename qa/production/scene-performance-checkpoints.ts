/** Legal route checkpoints for every reviewed candidate, including retained originals. */
import { readFileSync } from 'node:fs';
import { createCharacter, getScene, sceneText, presentChoices, commitChoice } from '../../lib/engine';
import { visibleCampaignDialogue } from '../../lib/campaign-dialogue';
import phase from '../media/connected-scenes.json';
export const SCENE_PERFORMANCE_CHECKPOINTS = phase.deliveries.map(delivery => {
  const spec = JSON.parse(readFileSync(delivery.checkpoint.route, 'utf8'));
  let state = createCharacter(spec.character);
  for (let i = 0; i <= spec.steps.length; i++) {
    const scene = getScene(state.sceneId), lines = visibleCampaignDialogue(scene.id, scene.speaker, sceneText(scene, state));
    if (scene.id === delivery.checkpoint.scene && lines.some(l => l.id === delivery.id)) return { delivery, state, lines };
    if (i === spec.steps.length) break;
    const a = spec.steps[i], c = presentChoices(state, scene).find(c => c.id === a.choiceId && c.enabled);
    if (!c) throw Error(`Illegal checkpoint ${spec.name}/${a.choiceId}`);
    state = commitChoice(state, c, c.check ? { roll: a.roll } : undefined).state;
  }
  throw Error(`No legal checkpoint for ${delivery.id}`);
});

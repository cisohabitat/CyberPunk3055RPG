/** Canonical offline checkpoints; no fixture flags or outcomes are grafted in. */
import { readFileSync } from 'node:fs';
import { createCharacter, getScene, presentChoices, commitChoice, sceneText } from '../../lib/engine';
import { visibleCampaignDialogue } from '../../lib/campaign-dialogue';
import type { GameState } from '../../lib/types';
import phase from '../media/dramatic-beats.json';
import bindings from '../media/dramatic-beats-dialogue-bindings.json';
export const DRAMATIC_CHECKPOINTS = bindings.map(binding => {
  for(const file of phase.newRoutes){const spec=JSON.parse(readFileSync(`qa/routes/${file}`,'utf8'));let state=createCharacter(spec.character);
    for(const a of spec.steps){const scene=getScene(state.sceneId),lines=visibleCampaignDialogue(scene.id,scene.speaker,sceneText(scene,state));
      if(lines.some(l=>l.id===binding.id))return {binding,state:state as GameState,lines};
      const c=presentChoices(state,scene).find(c=>c.id===a.choiceId&&c.enabled)!;if(!c)throw Error(`Illegal checkpoint route ${file}/${a.choiceId}`);state=commitChoice(state,c,c.check?{roll:a.roll}:undefined).state;
    }
  }
  throw Error(`No legal source for ${binding.id}`);
});

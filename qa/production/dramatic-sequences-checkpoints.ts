/** Legal full-route checkpoints; no story outcome or resource is grafted in. */
import {readFileSync} from 'node:fs';
import {createCharacter,getScene,presentChoices,commitChoice} from '../../lib/engine';
import {dramaticSequenceIllustration} from '../../lib/dramatic-sequence-art';
import phase from '../media/dramatic-sequences.json';
export const SEQUENCE_CHECKPOINTS=phase.rules.map(rule=>{
 for(const file of phase.newRoutes){const spec=JSON.parse(readFileSync(file,'utf8'));let state=createCharacter(spec.character);
  for(const step of spec.steps){if(dramaticSequenceIllustration(state.sceneId,state.flags)?.src===rule.illustration.src)return{rule,state};const c=presentChoices(state,getScene(state.sceneId)).find(c=>c.id===step.choiceId&&c.enabled);if(!c)throw Error(file+'/'+step.choiceId);state=commitChoice(state,c,c.check?{roll:step.roll}:undefined).state;}
 }throw Error('No legal checkpoint for '+rule.id);
});

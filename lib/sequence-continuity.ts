import type {GameState} from './types';
import type {SoundMood,SoundDistrict} from './sound';
import type {BedFocus} from './pivotal-scenes';
/** Score direction only. The location's ambience, narration, art and rules remain independent. */
export const CONTINUITY_SEQUENCES = [
 {id:'archive-desk',mood:'quiet',focus:'intimate',scenes:[
  'act2_archive_brief','act2_archive_prep','act2_archive_compare','act2_archive_door','act2_archive_challenge','act2_archive_custody','act2_archive_gap',
  'act2_craft_archive','act2_craft_archive_challenge','act2_craft_archive_issuer','act2_craft_archive_ledger',
 ]},
 {id:'freight-work',mood:'quiet',focus:'normal',scenes:[
  'act2_freight_brief','act2_freight_sources','act2_freight_prep','act2_freight_recovery','act2_freight_intake','act2_freight_result',
  'act2_ramp_terms','act2_ramp_survey','act2_ramp_gear','act2_ramp_load','act2_ramp_arrived','act2_ramp_stopped',
 ]},
 {id:'asa-return',mood:'quiet',focus:'normal',scenes:[
  'act3_freight_visit','act3_freight_query','act3_freight_reflection','act3_ramp_return',
 ]},
] as const;
export function sequenceContinuity(state:GameState,base:{mood:SoundMood;district:SoundDistrict},focus:BedFocus):{mood:SoundMood;district:SoundDistrict;focus:BedFocus}{
 const sequence=CONTINUITY_SEQUENCES.find(row=>row.scenes.some(id=>id===state.sceneId));
 // Retain actual pressure, finale direction and the unbriefed legacy archive path.
 if(!sequence||base.mood==='pressure'||sequence.id==='archive-desk'&&!state.flags.archive_briefed)return {...base,focus};
 return {mood:sequence.mood,district:state.sceneId==='act2_freight_intake'?'clinic':base.district,focus:sequence.focus};
}

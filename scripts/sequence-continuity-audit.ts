/** Offline canonical score/focus edge audit; no game actions or public writes. */
import{readFileSync,readdirSync,writeFileSync,mkdirSync}from'node:fs';
import{dirname}from'node:path';
import type{ReplaySpec}from'../lib/story-replay';
import type{SoundMood,SoundDistrict}from'../lib/sound';
import type{BedFocus}from'../lib/pivotal-scenes';
import{createCharacter,getScene,presentChoices,commitChoice}from'../lib/engine';
import{sceneSoundPlan}from'../lib/sound';import{actName}from'../lib/story/goal';
import{pivotalScene}from'../lib/pivotal-scenes';import{cinematicSequence}from'../lib/cinematic-sequences';import{finaleScene}from'../lib/finale-direction';import{investigationScene}from'../lib/investigation-scenes';import{sequenceContinuity}from'../lib/sequence-continuity';
let beforeMusic=0,afterMusic=0,beforeFocus=0,afterFocus=0,rooms=0,visits=0,changed=0;type Plan={mood:SoundMood;district:SoundDistrict;focus:BedFocus};const changes=new Map<string,{sceneId:string;before:Plan;after:Plan;visits:number}>();
for(const file of readdirSync('qa/routes',{recursive:true}).filter(f=>typeof f==='string'&&f.endsWith('.json')).sort()){
 const spec=JSON.parse(readFileSync('qa/routes/'+file,'utf8')) as ReplaySpec;let state=createCharacter(spec.character),previous:{before:Plan;after:Plan}|undefined;
 for(let step=0;step<=spec.steps.length;step++){
  const scene=getScene(state.sceneId),base=sceneSoundPlan(state,scene.location,actName(state)),finale=finaleScene(scene.id),sequence=cinematicSequence(scene.id),existing=pivotalScene(scene.id)??finale??investigationScene(scene.id)??sequence;
  const before:Plan={...base,focus:finale?'closing':sequence?.focus??(existing?'intimate':'normal')},after=sequenceContinuity(state,base,before.focus);visits++;
  if(JSON.stringify(before)!==JSON.stringify(after)){changed++;const key=scene.id;const c=changes.get(key)??{sceneId:key,before,after,visits:0};c.visits++;changes.set(key,c);}
  if(previous){beforeMusic+=Number(previous.before.mood!==before.mood);afterMusic+=Number(previous.after.mood!==after.mood);beforeFocus+=Number(previous.before.focus!==before.focus);afterFocus+=Number(previous.after.focus!==after.focus);rooms+=Number(previous.before.district!==before.district);}
  previous={before,after};if(step===spec.steps.length)break;const action=spec.steps[step],c=presentChoices(state,scene).find(c=>c.id===action.choiceId&&c.enabled)!;if(c.check&&typeof action.roll!=='number')throw Error(`Missing authored roll: ${file}/${action.choiceId}`);state=commitChoice(state,c,c.check?{roll:action.roll!}:undefined).state;
 }
}
const out={visits,changedVisits:changed,beforeMusic,afterMusic,beforeFocus,afterFocus,precedingRoomTransitions:rooms,changedScenes:[...changes.values()],method:'Canonical selected route edges, including self inspections and finales. Not listening, timing, perceived smoothness or reduced loading bytes.'};const output=process.argv[2] ?? 'qa/production/reports/sequence-continuity-measurement.json';mkdirSync(dirname(output),{recursive:true});writeFileSync(output,JSON.stringify(out,null,2)+'\n');console.log({visits,changed,beforeMusic,afterMusic,beforeFocus,afterFocus,rooms});

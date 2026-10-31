import { isConnectedPerformanceFile } from "../qa/production/connected-performance-media";
import routing from "../qa/media/return-routing.json";
import assert from 'node:assert/strict';
import {it} from 'node:test';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createCharacter,getScene,presentChoices,commitChoice,sceneText} from './engine';
import {sceneIllustration,portraitArt} from './art';
import {visibleCampaignDialogue} from './campaign-dialogue';
import {sceneSoundPlan} from './sound';
import {CONTINUITY_SEQUENCES,sequenceContinuity} from './sequence-continuity';
import {SCENES} from './story';
import {actName} from './story/goal';
import phase from '../qa/media/sequence-continuity.json';
const hash=(s:string|Buffer)=>createHash('sha256').update(s).digest('hex');
const files=(d:string):string[]=>readdirSync(d,{withFileTypes:true}).flatMap(r=>r.isDirectory()?files(`${d}/${r.name}`):[`${d}/${r.name}`]).filter(p=>!isConnectedPerformanceFile(p)&&!routing.newMedia.includes(p)&&!routing.newRoutes.includes(p.replace(/^qa\/routes\//,"")));
it('preserves all231 campaigns,16441 visits, exact art, actor, dialogue and827 preceding media hashes',()=>{
 const rows=[];const routes=files('qa/routes').filter(f=>f.endsWith('.json')).sort();assert.equal(routes.length,231);
 for(const file of routes){const spec=JSON.parse(readFileSync(file,'utf8'));let state=createCharacter(spec.character);
  for(let step=0;step<=spec.steps.length;step++){
   const scene=getScene(state.sceneId),text=sceneText(scene,state),choices=presentChoices(state,scene);
   rows.push({file,step,state,text,choices,voice:visibleCampaignDialogue(scene.id,scene.speaker,text),actor:scene.speaker,art:sceneIllustration(scene.id,state.flags),portrait:portraitArt(scene.speaker,scene.id,state.flags)});
   if(step===spec.steps.length)break;const action=spec.steps[step],choice=choices.find(c=>c.id===action.choiceId&&c.enabled);assert.ok(choice);state=commitChoice(state,choice,choice.check?{roll:action.roll}:undefined).state;
  }
 }
 assert.equal(rows.length,phase.baseline.visits);assert.equal(hash(JSON.stringify(rows)),phase.baseline.campaignSha256);
 assert.deepEqual([...files('public/art'),...files('public/audio')].sort().map(path=>({path,sha256:hash(readFileSync(path))})),phase.baseline.media);
 for(const m of phase.baseline.manifests)assert.equal(hash(readFileSync(m.path === "qa/media/scene-art.json" ? routing.baseline.sceneArt.path : m.path)),m.sha256,m.path);
 assert.deepEqual(phase.sequences,CONTINUITY_SEQUENCES);assert.deepEqual(phase.newScenes,[]);assert.deepEqual(phase.newMedia,[]);
});
it('keeps the exact desk/carry/return scope, actual locations, pressure and unbriefed legacy paths',()=>{
 const ids=CONTINUITY_SEQUENCES.flatMap(s=>[...s.scenes]);assert.equal(ids.length,27);assert.equal(new Set(ids).size,27);
 const base=createCharacter({handle:'Continuity',givenName:'Ada',origin:'dustline',bonus:{chrome:0,nerve:2,face:0,ghost:0}});
 for(const scene of Object.values(SCENES)){
  const state={...base,sceneId:scene.id,flags:{...base.flags,archive_briefed:true}},before=JSON.stringify(state),plan=sceneSoundPlan(state,scene.location,actName(state));
  const out=sequenceContinuity(state,plan,'normal');assert.equal(JSON.stringify(state),before);
  if(!ids.includes(scene.id as typeof ids[number]))assert.deepEqual(out,{...plan,focus:'normal'});
  else {assert.equal(out.mood,'quiet');assert.equal(out.district,scene.id==='act2_freight_intake'?'clinic':plan.district);assert.equal(out.focus,scene.id.includes('archive')?'intimate':'normal');}
  assert.deepEqual(sequenceContinuity(state,{...plan,mood:'pressure'},'confrontation'),{...plan,mood:'pressure',focus:'confrontation'});
 }
 for(const id of CONTINUITY_SEQUENCES[0].scenes){const s={...base,sceneId:id},plan=sceneSoundPlan(s,getScene(id).location,'The Week');assert.deepEqual(sequenceContinuity(s,plan,'normal'),{...plan,focus:'normal'});}
 assert.deepEqual(sequenceContinuity({...base,sceneId:'constructor'},{mood:'ward',district:'ward'},'closing'),{mood:'ward',district:'ward',focus:'closing'});
});

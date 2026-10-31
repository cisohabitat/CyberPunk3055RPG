/** Positive legal reachability witnesses. A bounded search cannot prove absence. */
import { createCharacter, getScene, presentChoices, commitChoice } from '../../lib/engine';
import { SCENES } from '../../lib/story';
import type { ReplaySpec } from '../../lib/story-replay';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const files=(d:string):string[]=>readdirSync(d,{withFileTypes:true}).flatMap(r=>r.isDirectory()?files(`${d}/${r.name}`):[`${d}/${r.name}`]);
const currentFeatures={startWithPrologue:true,expandedKerr:true,expandedMara:true,expandedWitness:true,craftedEncounters:true,emotionalPayoffs:true,freightCraft:true,returnRouting:true,seraShift:true,dramaticBeats:true,consequentialMethods:true,consequentialExpansion:true,dramaticSequenceArt:true};
const legacy=new Map<string,unknown>(),current=new Map<string,unknown>();
for(const route of files('qa/routes').filter(p=>p.endsWith('.json')).sort()){
 const spec=JSON.parse(readFileSync(route,'utf8'))as ReplaySpec;
 for(const promoted of[false,true]){
  let state=createCharacter({...spec.character,...(promoted?currentFeatures:{})});const witnesses=promoted?current:legacy;
  for(let step=0;step<=spec.steps.length;step++){
   if(!witnesses.has(state.sceneId))witnesses.set(state.sceneId,{route,prefixSteps:step,features:promoted?'current UI feature set':'exact route factory / supported save',extraStep:null});
   if(promoted)for(const choice of presentChoices(state,getScene(state.sceneId)).filter(c=>c.enabled))for(const roll of choice.check?[1,10]:[undefined]){
    const next=commitChoice(state,choice,choice.check?{roll:roll!}:undefined).state;
    if(!current.has(next.sceneId))current.set(next.sceneId,{route,prefixSteps:step,features:'current UI feature set',extraStep:{choiceId:choice.id,...(roll?{roll}:{})}});
   }
   if(step===spec.steps.length)break;const a=spec.steps[step],choice=presentChoices(state,getScene(state.sceneId)).find(c=>c.id===a.choiceId&&c.enabled);if(!choice)break;
   state=commitChoice(state,choice,choice.check?{roll:a.roll!}:undefined).state;
  }
 }
}
const prior=JSON.parse(readFileSync('qa/editorial/connected-scenes-whole-campaign-acceptance.json','utf8'));
const profiles=JSON.parse(readFileSync('qa/editorial/navigation-release-profiles.json','utf8'));
const planned=new Set<string>(prior.distinctBrowserSceneIds);
for(const p of profiles){const spec=JSON.parse(readFileSync(p.route,'utf8'));let s=createCharacter(spec.character);planned.add(s.sceneId);for(const a of spec.steps){const c=presentChoices(s,getScene(s.sceneId)).find(c=>c.id===a.choiceId&&c.enabled)!;s=commitChoice(s,c,c.check?{roll:a.roll}:undefined).state;planned.add(s.sceneId);}}
const rows=Object.keys(SCENES).sort().map(id=>({id,classification:current.has(id)?'current reachable':legacy.has(id)?'supported legacy save':'unverified',witness:current.get(id)??legacy.get(id)??null,priorContinuousUI:prior.distinctBrowserSceneIds.includes(id),targetContinuousUI:planned.has(id)}));
const sha=(p:string)=>createHash('sha256').update(readFileSync(p)).digest('hex');
writeFileSync(process.argv[2]??'qa/editorial/navigation-release-coverage-classification.json',JSON.stringify({revision:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),dirty:!!execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim(),method:'Replay legal route prefixes and one additional enabled action with an actual1/10 die. Exact factory legacy and current UI feature sets are separate. Positive reachability is not complete-campaign browser coverage; unverified is not unreachable. No outcome/state grafting. Planned UI ids require fresh actual browser acceptance.',currentFeatures,routeHashes:Object.fromEntries(files('qa/routes').filter(p=>p.endsWith('.json')).sort().map(p=>[p,sha(p)])),priorContinuousUI:prior.distinctBrowserSceneIds.length,targetContinuousUI:planned.size,additionalTargetIds:[...planned].filter(id=>!prior.distinctBrowserSceneIds.includes(id)).sort(),classes:Object.fromEntries(['current reachable','supported legacy save','retired/unreachable','unverified'].map(k=>[k,rows.filter(r=>r.classification===k).length])),rows},null,2)+'\n');
console.log(JSON.stringify({classes:Object.fromEntries([...new Set(rows.map(r=>r.classification))].map(k=>[k,rows.filter(r=>r.classification===k).length])),targetUI:planned.size,unverified:rows.filter(r=>r.classification==='unverified').map(r=>r.id)}));

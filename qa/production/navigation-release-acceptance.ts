/** All current QA routes must be played continuously from UI creation. */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createCharacter, getScene, presentChoices, commitChoice, sceneText } from '../../lib/engine';
import { FRAGMENTS } from '../../lib/evidence';
import type { ReplaySpec } from '../../lib/story-replay';
import profiles from '../editorial/navigation-release-profiles.json';
const directory=process.argv[2],priorFile=process.argv[3],output=process.argv[4];assert.ok(directory&&priorFile&&output,'Report directory, verified66 result and output required');
const load=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const sha=(p:string)=>createHash('sha256').update(readFileSync(p)).digest('hex');
const norm=(s:string)=>s.replace(/\s+/g,' ').trim();
const words=(s:string)=>(s.toLowerCase().match(/[\p{L}\p{N}]+/gu)??[]).join(' ');
const prior=load(priorFile);assert.equal(prior.profiles.length,66);
const expectedPrior=load('qa/editorial/connected-scenes-whole-campaign-acceptance.json');assert.deepEqual(prior.totals,expectedPrior.totals);assert.deepEqual(prior.distinctBrowserSceneIds,expectedPrior.distinctBrowserSceneIds);
const rows=profiles.map(p=>{
 const file=`${directory}/${p.id}.json`,r=load(file),spec=load(p.route)as ReplaySpec;
 for(const k of['route','width','artwork','reading','sound','shots']as const)assert.equal(r[k],p[k],`${p.id}/${k}`);
 for(const[path,hash]of Object.entries(r.testedSources))assert.equal(sha(path),hash,path);
 assert.equal(r.cohortSetup.kind,'current-ui-creation');assert.equal(r.cohortSetup.tabs,0);assert.equal(r.cohortSetup.reloads,0);
 assert.deepEqual(r.errors,[]);assert.deepEqual(r.failedMedia,[]);assert.equal(r.finalAudio.liveSources,0);assert.equal(r.finalAudio.sourcesCreated,r.finalAudio.sourcesDisposed);assert.equal(r.finalAudio.sourcesCreated,r.finalAudio.buffersCleared);
 assert.equal(r.visits,spec.steps.length+1);assert.equal(r.observations.length,r.visits);
 let state=createCharacter(spec.character);
 for(const[i,o]of r.observations.entries()){
  assert.equal(o.sceneId,state.sceneId);assert.equal(o.step,i);assert.equal(o.overflow,false);assert.equal(norm(o.text),norm(sceneText(getScene(state.sceneId),state)));
  const a=spec.steps[i];if(!a)continue;const c=presentChoices(state,getScene(state.sceneId)).find(c=>c.id===a.choiceId&&c.enabled);assert.ok(c);
  const rendered=o.choices.find((r:{id:string})=>r.id===`choice-${c.id}`);assert.ok(rendered?.enabled);
  if(state.sceneId==='memory_sequence'&&['place-roster','place-signature','place-order'].includes(c.id)){
   const f=FRAGMENTS.find(f=>`place-${f.id}`===c.id)!;assert.equal(c.label,`Place ${f.title.toLowerCase()} in the next slot.`);assert.equal(words(rendered.text.replace(/^\d+\s*·\s*/,'')),words(`Place ${f.title.toLowerCase()} next`));
  }else assert.ok(words(rendered.text).includes(words(c.label)),`${p.id}/${i}/${c.id}`);
  state=commitChoice(state,c,c.check?{roll:a.roll!}:undefined).state;
 }
 assert.deepEqual(r.final,{sceneId:state.sceneId,creds:state.creds,strain:state.strain,rolls:state.rolls.map(r=>r.roll)});assert.equal(state.sceneId,spec.expected.sceneId);
 if(!p.sound)assert.deepEqual(r.mediaRequests.filter((p:string)=>p.startsWith('/audio/')),[]);
 if(p.artwork==='none')assert.deepEqual(r.mediaRequests.filter((p:string)=>p.startsWith('/art/')),[]);
 return{id:p.id,evidence:file,evidenceSha256:sha(file),revision:r.revision,dirty:r.dirty,cohortSetup:r.cohortSetup,visits:r.visits,reloads:r.reloads,tabs:r.tabs,voices:r.completedVoices.length,artViews:r.shotReviews.length,ordinaryArtViews:r.ordinaryShotReviews.length,interruptions:r.interruptions,addedAuthoredChoices:0,scenes:[...new Set<string>(r.scenes)],final:r.final,precedingComparison:'Additional existing-story current campaign, not a change to authored story. Actual full workload reported; no numerical improvement comparison claimed.'};
});
const all=[...prior.profiles,...rows],sceneIds=[...new Set<string>(all.flatMap(r=>r.scenes))].sort();
const additionalIds=sceneIds.filter(id=>!prior.distinctBrowserSceneIds.includes(id));assert.ok(additionalIds.length>=20);
const result={method:'Accepted source-familiar authored-dice UI proxy; no physical-device, unfamiliar-human, independent acting or AAA claim.',profiles:all,priorProfiles:66,newProfiles:rows.length,priorTotals:prior.totals,totals:Object.fromEntries(['visits','reloads','tabs','voices','artViews','ordinaryArtViews','interruptions','addedAuthoredChoices'].map(k=>[k,all.reduce((n,r)=>n+Number(r[k]),0)])),distinctBrowserSceneIds:sceneIds,additionalIds,precedingProof:{path:priorFile,sha256:sha(priorFile)}};
writeFileSync(output,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({profiles:all.length,totals:result.totals,browserScenes:sceneIds.length,additionalIds}));

import assert from 'node:assert/strict';
import { it } from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createCharacter, getScene, presentChoices, commitChoice, sceneText } from './engine';
import { visibleCampaignDialogue } from './campaign-dialogue';
import { sceneIllustration, portraitArt } from './art';
import { replayCampaign, type ReplaySpec } from './story-replay';
import baseline from '../qa/editorial/navigation-release-baseline.json';
import phase from '../qa/media/navigation-release.json';
import preceding from '../qa/editorial/connected-scenes-whole-campaign-acceptance.json';
import { isNavigationReleaseFile } from '../qa/production/navigation-release-cohort';
const files=(d:string):string[]=>readdirSync(d,{withFileTypes:true}).flatMap(r=>r.isDirectory()?files(`${d}/${r.name}`):[`${d}/${r.name}`]);
const hash=(b:string|Buffer)=>createHash('sha256').update(b).digest('hex');
it('preserves all281 preceding routes,20278 canonical visits and874 media without new story or outcomes',()=>{
 assert.equal(hash(readFileSync(phase.baseline)),phase.baselineSha256);
 assert.deepEqual(files('qa/routes').filter(p=>p.endsWith('.json')&&!isNavigationReleaseFile(p)).sort(),baseline.routeFiles);
 const rows=[];
 for(const file of baseline.routeFiles){const spec=JSON.parse(readFileSync(file,'utf8'))as ReplaySpec;let state=createCharacter(spec.character);
  for(let step=0;step<=spec.steps.length;step++){const scene=getScene(state.sceneId),text=sceneText(scene,state),choices=presentChoices(state,scene);
   rows.push({file,step,state,text,choices,voice:visibleCampaignDialogue(scene.id,scene.speaker,text),actor:scene.speaker,art:sceneIllustration(scene.id,state.flags),portrait:portraitArt(scene.speaker,scene.id,state.flags)});
   if(step===spec.steps.length)break;const a=spec.steps[step],c=choices.find(c=>c.id===a.choiceId&&c.enabled)!;assert.ok(c);state=commitChoice(state,c,c.check?{roll:a.roll!}:undefined).state;
  }
 }
 assert.equal(rows.length,20278);assert.equal(hash(JSON.stringify(rows)),baseline.campaignSha256);
 assert.deepEqual([...files('public/art'),...files('public/audio')].sort().map(path=>({path,sha256:hash(readFileSync(path))})),baseline.media);
 assert.deepEqual(files('qa/media').filter(p=>p.endsWith('.json')&&!isNavigationReleaseFile(p)).sort(),baseline.manifests.map(m=>m.path));
 for(const m of baseline.manifests)assert.equal(hash(readFileSync(m.path)),m.sha256,m.path);
 assert.deepEqual(phase.newScenes,[]);assert.deepEqual(phase.newMedia,[]);assert.deepEqual(phase.newFlags,[]);
 assert.equal(isNavigationReleaseFile('qa/routes/navigation-release/future.json'),false);assert.equal(isNavigationReleaseFile('qa/media/navigation-release-future.json'),false);
});
it('eight current-creation continuous legal campaigns target at least20 more existing scene ids',()=>{
 const covered=new Set(preceding.distinctBrowserSceneIds),newIds=new Set<string>();
 assert.equal(phase.newRoutes.length,8);
 for(const path of phase.newRoutes){const spec=JSON.parse(readFileSync(path,'utf8'))as ReplaySpec;
  for(const flag of['startWithPrologue','expandedKerr','expandedMara','expandedWitness','craftedEncounters','emotionalPayoffs','freightCraft','returnRouting','seraShift','dramaticBeats','consequentialMethods','consequentialExpansion','dramaticSequenceArt'])assert.equal((spec.character as unknown as Record<string,unknown>)[flag],true);
  const run=replayCampaign(spec);assert.ok(['ending_names','ending_quiet','ending_listed','ending_witness'].includes(run.state.sceneId));
  for(const stage of run.transcript)for(const id of[stage.from,stage.to])if(!covered.has(id))newIds.add(id);
 }
 assert.ok(newIds.size>=20,`Only${newIds.size} newly exercised current scene ids`);
});

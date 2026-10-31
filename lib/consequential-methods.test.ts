import assert from 'node:assert/strict';
import { it } from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createCharacter, getScene, presentChoices, commitChoice, sceneText } from './engine';
import { visibleCampaignDialogue, quotedSpeech } from './campaign-dialogue';
import { portraitArt, sceneIllustration } from './art';
import { replayCampaign, type ReplaySpec } from './story-replay';
import { routeCheckpoint } from '../qa/production/route-checkpoint';
import { isConsequentialMethodsFile } from '../qa/production/consequential-methods-cohort';
import { consequentialMethod } from './consequential-methods';
import { districtRemaining } from './district-response';
import baseline from '../qa/editorial/consequential-methods-baseline.json';
import phase from '../qa/media/consequential-methods.json';
import profiles from '../qa/editorial/consequential-methods-profiles.json';
const hash = (b: string | Buffer) => createHash('sha256').update(b).digest('hex');
const files = (d: string): string[] => readdirSync(d, { withFileTypes: true }).flatMap(r => r.isDirectory() ? files(`${d}/${r.name}`) : [`${d}/${r.name}`]);
const load = (p: string) => JSON.parse(readFileSync(p, 'utf8')) as ReplaySpec;
const words = (s: string) => s.toLowerCase().replace(/[’']/g, '').match(/[a-z0-9]+/g) ?? [];
it('preserves all255 preceding routes,18271 exact visits,859 original media and every preceding manifest', () => {
  assert.equal(hash(readFileSync(phase.baseline)), phase.baselineSha256);
  assert.deepEqual(files('qa/routes').filter(p => p.endsWith('.json') && !isConsequentialMethodsFile(p)).sort(), baseline.routeFiles);
  const rows=[];
  for (const file of baseline.routeFiles) {
    const spec=load(file);let state=createCharacter(spec.character);
    for(let i=0;i<=spec.steps.length;i++) {
      const scene=getScene(state.sceneId),text=sceneText(scene,state),choices=presentChoices(state,scene);
      rows.push({file,step:i,state,text,choices,voice:visibleCampaignDialogue(scene.id,scene.speaker,text),actor:scene.speaker,art:sceneIllustration(scene.id,state.flags),portrait:portraitArt(scene.speaker,scene.id,state.flags)});
      if(i===spec.steps.length)break;const a=spec.steps[i],c=choices.find(c=>c.id===a.choiceId&&c.enabled)!;assert.ok(c);state=commitChoice(state,c,c.check?{roll:a.roll!}:undefined).state;
    }
  }
  assert.equal(rows.length,18271);assert.equal(hash(JSON.stringify(rows)),baseline.campaignSha256);
  assert.deepEqual([...files('public/art'),...files('public/audio')].filter(p=>!isConsequentialMethodsFile(p)).sort().map(path=>({path,sha256:hash(readFileSync(path))})),baseline.media);
  assert.deepEqual(files('qa/media').filter(p=>p.endsWith('.json')&&!isConsequentialMethodsFile(p)).sort(),baseline.manifests.map(m=>m.path));
  for(const m of baseline.manifests)assert.equal(hash(readFileSync(m.path)),m.sha256,m.path);
  assert.deepEqual(phase.newScenes,[]);for(const p of ['public/audio/voice-campaign-consequential-methods-future.mp3','qa/routes/consequential-methods/future.json','qa/media/consequential-methods-future.json'])assert.equal(isConsequentialMethodsFile(p),false);
});
const choose = (s: ReturnType<typeof createCharacter>, id: string) => {
 const c=presentChoices(s,getScene(s.sceneId)).find(c=>c.id===id&&c.enabled);assert.ok(c,`${s.sceneId}/${id}`);return commitChoice(s,c).state;
};
for(const p of profiles)it(`replays the complete consequential campaign ${p.id} with matching original dialogue`,()=>{
 const spec=load(p.route),r=replayCampaign(spec);assert.ok(r.transcript.every(t=>t.restored));assert.equal(r.state.sceneId,spec.expected.sceneId);
 const old=replayCampaign(load(p.precedingRoute)).state;
 assert.deepEqual(r.state.rolls,old.rolls);assert.deepEqual(r.state.items,old.items);
 assert.equal(r.state.flags.archive_key_authenticated,old.flags.archive_key_authenticated);
 assert.equal(r.state.flags.nia_public_consent,old.flags.nia_public_consent);
 assert.equal(r.state.creds-old.creds,p.id.endsWith('-work')?8:0);
 if(p.id.includes('face-private'))assert.equal(consequentialMethod(r.state),undefined);
 else assert.equal(consequentialMethod(r.state),p.id.includes('chrome')?'chrome':'face');
 let state=createCharacter(spec.character);
 for(const a of spec.steps){const text=sceneText(getScene(state.sceneId),state);const prior=structuredClone(state);delete prior.flags.consequential_methods_enabled;
 assert.deepEqual(quotedSpeech(text),quotedSpeech(sceneText(getScene(prior.sceneId),prior)),`${p.id}/${state.sceneId}: no new quotation without a matching delivery`);
 state=chooseWithRoll(state,a.choiceId,a.roll);}
});
function chooseWithRoll(s:ReturnType<typeof createCharacter>,id:string,roll?:number){const c=presentChoices(s,getScene(s.sceneId)).find(c=>c.id===id&&c.enabled);assert.ok(c);return commitChoice(s,c,c.check?{roll:roll!}:undefined).state;}
it('commits one probe use, keeps owned equipment and blocks repeat payment after reload',()=>{
 const s=routeCheckpoint('consequential-methods/chrome-public-work','act2_technique_chrome');
 const started=choose(s,'consequential-probe-intake');assert.equal(started.strain-s.strain,2);assert.equal(districtRemaining(started),1);assert.deepEqual(started.items,s.items);
 const back=choose(JSON.parse(JSON.stringify(started)),'leave-technique-result');const paid=choose(back,'consequential-short-shift');assert.equal(paid.creds-back.creds,8);assert.equal(paid.strain-back.strain,1);assert.equal(districtRemaining(paid),0);assert.ok(!presentChoices(paid,getScene(paid.sceneId)).some(c=>c.id==='consequential-short-shift'));assert.equal(paid.flags.district_work_paid,undefined);
});
it('keeps scarcity, strain, absent-kit, private-request, closure and contact limits authoritative',()=>{
 const s=routeCheckpoint('consequential-methods/chrome-public-work','act2_technique_chrome');
 for(const strain of [4,5]){const high={...s,strain};assert.equal(presentChoices(high,getScene(high.sceneId)).find(c=>c.id==='consequential-probe-intake')?.enabled,false);assert.ok(presentChoices(high,getScene(high.sceneId)).find(c=>c.id==='prepare-technique-chrome-counter')?.enabled);}
 const noKit={...s,creds:0,items:s.items.filter(i=>i!=='archive-probe')};assert.ok(!presentChoices(noKit,getScene(noKit.sceneId)).some(c=>c.id==='consequential-probe-intake'));assert.ok(presentChoices(noKit,getScene(noKit.sceneId)).find(c=>c.id==='prepare-technique-chrome-counter')?.enabled);
 const privateFace=routeCheckpoint('consequential-methods/face-private','act2_technique_face');assert.ok(!presentChoices(privateFace,getScene(privateFace.sceneId)).some(c=>c.id==='consequential-public-intake'));
 const fast=choose(s,'consequential-probe-intake'),back=choose(fast,'leave-technique-result');
 for(const flag of ['district_window_closed','act2_done','district_kerr_refused','district_work_paid','technique_work_waived']){const blocked=structuredClone(back);blocked.flags[flag]=true;assert.ok(!presentChoices(blocked,getScene(blocked.sceneId)).some(c=>c.id==='consequential-short-shift'),flag);}
 const forged=structuredClone(back);forged.journal=forged.journal.filter(j=>j.id!=='consequential-procedure');assert.equal(consequentialMethod(forged),undefined);assert.ok(!presentChoices(forged,getScene(forged.sceneId)).some(c=>c.id==='consequential-short-shift'));
});
it('allows free review and stopping while keeping public signatures and committed costs',()=>{
 const s=routeCheckpoint('consequential-methods/face-public-stop','act2_technique_face');const paused=choose(s,'pause-technique');assert.equal(districtRemaining(paused),2);assert.equal(paused.creds,s.creds);assert.equal(consequentialMethod(paused),undefined);
 const done=choose(s,'consequential-public-intake');assert.equal(districtRemaining(done),1);assert.equal(done.creds,s.creds);assert.equal(done.flags.technique_work_waived,undefined);assert.equal(done.flags.technique_filing_signed,true);assert.ok(done.factions.helion<=5);
 const back=choose(done,'leave-technique-result'),closed=choose(back,'district-close');assert.equal(consequentialMethod(closed),'face');assert.equal(closed.creds,s.creds);assert.equal(districtRemaining(closed),0);
});

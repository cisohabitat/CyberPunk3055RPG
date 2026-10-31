import assert from 'node:assert/strict';
import { it } from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createCharacter, getScene, presentChoices, commitChoice, sceneText } from './engine';
import { visibleCampaignDialogue, quotedSpeech } from './campaign-dialogue';
import { portraitArt, sceneIllustration } from './art';
import { replayCampaign, type ReplaySpec } from './story-replay';
import { routeCheckpoint } from '../qa/production/route-checkpoint';
import { isConsequentialExpansionFile } from '../qa/production/consequential-expansion-cohort';
import { consequentialMethod, consequentialExposure } from './consequential-methods';
import { districtRemaining } from './district-response';
import baseline from '../qa/editorial/consequential-expansion-baseline.json';
import phase from '../qa/media/consequential-expansion.json';
import profiles from '../qa/editorial/consequential-expansion-profiles.json';
const hash = (b: string | Buffer) => createHash('sha256').update(b).digest('hex');
const files = (d: string): string[] => readdirSync(d, { withFileTypes: true }).flatMap(r => r.isDirectory() ? files(`${d}/${r.name}`) : [`${d}/${r.name}`]);
const load = (p: string) => JSON.parse(readFileSync(p, 'utf8')) as ReplaySpec;
const words = (s: string) => s.toLowerCase().replace(/[’']/g, '').match(/[a-z0-9]+/g) ?? [];
it('preserves all261 preceding routes,18766 exact visits,859 original media and every preceding manifest', () => {
  assert.equal(hash(readFileSync(phase.baseline)), phase.baselineSha256);
  assert.deepEqual(files('qa/routes').filter(p => p.endsWith('.json') && !isConsequentialExpansionFile(p)).sort(), baseline.routeFiles);
  const rows=[];
  for (const file of baseline.routeFiles) {
    const spec=load(file);let state=createCharacter(spec.character);
    for(let i=0;i<=spec.steps.length;i++) {
      const scene=getScene(state.sceneId),text=sceneText(scene,state),choices=presentChoices(state,scene);
      rows.push({file,step:i,state,text,choices,voice:visibleCampaignDialogue(scene.id,scene.speaker,text),actor:scene.speaker,art:sceneIllustration(scene.id,state.flags),portrait:portraitArt(scene.speaker,scene.id,state.flags)});
      if(i===spec.steps.length)break;const a=spec.steps[i],c=choices.find(c=>c.id===a.choiceId&&c.enabled)!;assert.ok(c);state=commitChoice(state,c,c.check?{roll:a.roll!}:undefined).state;
    }
  }
  assert.equal(rows.length,18766);assert.equal(hash(JSON.stringify(rows)),baseline.campaignSha256);
  assert.deepEqual([...files('public/art'),...files('public/audio')].filter(p=>!isConsequentialExpansionFile(p)).sort().map(path=>({path,sha256:hash(readFileSync(path))})),baseline.media);
  assert.deepEqual(files('qa/media').filter(p=>p.endsWith('.json')&&!isConsequentialExpansionFile(p)).sort(),baseline.manifests.map(m=>m.path));
  for(const m of baseline.manifests)assert.equal(hash(readFileSync(m.path)),m.sha256,m.path);
  assert.deepEqual(phase.newScenes,[]);for(const p of ['public/audio/voice-campaign-consequential-expansion-future.mp3','qa/routes/consequential-expansion/future.json','qa/media/consequential-expansion-future.json'])assert.equal(isConsequentialExpansionFile(p),false);
});
const choose=(s:ReturnType<typeof createCharacter>,id:string,roll?:number)=>{const c=presentChoices(s,getScene(s.sceneId)).find(c=>c.id===id&&c.enabled);assert.ok(c,`${s.sceneId}/${id}`);return commitChoice(s,c,c.check?{roll:roll!}:undefined).state;};
for(const p of profiles)it(`keeps resources, sources, consent, contracts and exact speech through ${p.id}`,()=>{
 const spec=load(p.route),control=load(p.precedingRoute),after=replayCampaign(spec),before=replayCampaign(control);assert.ok(after.transcript.every(t=>t.restored));
 const state=structuredClone(after.state);delete state.flags.consequential_expansion_enabled;
 if(consequentialExposure(after.state)!==undefined){const old=before.state.journal.find(j=>j.id==='consequential-procedure')!;state.journal=state.journal.map(j=>j.id===old.id?old:j);}
 assert.deepEqual(state,before.state);assert.equal(after.state.sceneId,spec.expected.sceneId);
 let a=createCharacter(spec.character),b=createCharacter(control.character);
 for(const step of spec.steps){assert.equal(a.creds,b.creds);assert.equal(a.strain,b.strain);assert.deepEqual(a.factions,b.factions);
 assert.deepEqual(quotedSpeech(sceneText(getScene(a.sceneId),a)),quotedSpeech(sceneText(getScene(b.sceneId),b)));
 a=choose(a,step.choiceId,step.roll);b=choose(b,step.choiceId,step.roll);}
});
it('measures actual capped exposure at commitment and retains it after later standing changes',()=>{
 const base=routeCheckpoint('consequential-expansion/face-quiet','act2_technique_face');
 for(let helion=-3;helion<=5;helion++){
  const s=structuredClone(base);s.factions.helion=helion;const next=choose(s,'consequential-public-intake');assert.equal(consequentialExposure(next),next.factions.helion-helion);assert.equal(next.flags.technique_filing_signed,true);assert.equal(consequentialMethod(next),'face');
  const later=structuredClone(next);later.factions.helion=-3;assert.equal(consequentialExposure(later),next.factions.helion-helion);
 }
 const forged=choose(base,'consequential-public-intake');forged.journal=forged.journal.map(j=>j.id==='consequential-procedure'?{...j,text:j.text.replace('increase was 0','increase was 3')}:j);assert.equal(consequentialMethod(forged),undefined);
});
it('reaches every finale with each earned procedure without granting unrelated permissions',()=>{
 for(const stat of ['chrome','face'])assert.deepEqual(profiles.filter(p=>p.stat===stat&&p.kind==='ending').map(p=>replayCampaign(load(p.route)).state.sceneId).sort(),['ending_listed','ending_names','ending_quiet','ending_witness']);
});
it('uses genuine zero-creds high-strain routes and respects actual refusal and withheld information',()=>{
 for(const stat of ['chrome','face']){
 const scarce=routeCheckpoint(`consequential-expansion/${stat}-scarce`,`act2_technique_${stat}`);assert.equal(scarce.creds,0);assert.equal(scarce.strain,4);assert.ok(!scarce.items.includes('archive-probe'));
 const c=presentChoices(scarce,getScene(scarce.sceneId));if(stat==='chrome'){assert.ok(!c.some(c=>c.id==='consequential-probe-intake'));assert.ok(c.find(c=>c.id==='prepare-technique-chrome-counter')?.enabled);}else assert.ok(c.find(c=>c.id==='consequential-public-intake')?.enabled);
 for(const kind of ['refused','withheld']){const s=routeCheckpoint(`consequential-expansion/${stat}-${kind}`,'act2_technique_result'),hub=choose(s,'leave-technique-result');assert.ok(!presentChoices(hub,getScene(hub.sceneId)).some(c=>c.id==='consequential-short-shift'));assert.equal(hub.flags.consequential_short_shift,undefined);if(kind==='refused')assert.equal(hub.flags.district_kerr_refused,true);else assert.equal(hub.flags.district_told_kerr_case,undefined);}
 }
});

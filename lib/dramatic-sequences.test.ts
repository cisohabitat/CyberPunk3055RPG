import assert from 'node:assert/strict';
import { it } from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createCharacter, getScene, presentChoices, commitChoice, sceneText } from './engine';
import { visibleCampaignDialogue, quotedSpeech } from './campaign-dialogue';
import { portraitArt, sceneIllustration } from './art';
import { replayCampaign, type ReplaySpec } from './story-replay';
import { routeCheckpoint } from '../qa/production/route-checkpoint';
import { isDramaticSequencesFile } from '../qa/production/dramatic-sequences-cohort';
import { consequentialMethod, consequentialExposure } from './consequential-methods';
import { districtRemaining } from './district-response';
import baseline from '../qa/editorial/dramatic-sequences-baseline.json';
import phase from '../qa/media/dramatic-sequences.json';
import profiles from '../qa/editorial/dramatic-sequences-profiles.json';
const hash = (b: string | Buffer) => createHash('sha256').update(b).digest('hex');
const files = (d: string): string[] => readdirSync(d, { withFileTypes: true }).flatMap(r => r.isDirectory() ? files(`${d}/${r.name}`) : [`${d}/${r.name}`]);
const load = (p: string) => JSON.parse(readFileSync(p, 'utf8')) as ReplaySpec;
const words = (s: string) => s.toLowerCase().replace(/[’']/g, '').match(/[a-z0-9]+/g) ?? [];
it('preserves all275 preceding routes,19925 exact visits,859 original media and every preceding manifest', () => {
  assert.equal(hash(readFileSync(phase.baseline)), phase.baselineSha256);
  assert.deepEqual(files('qa/routes').filter(p => p.endsWith('.json') && !isDramaticSequencesFile(p)).sort(), baseline.routeFiles);
  const rows=[];
  for (const file of baseline.routeFiles) {
    const spec=load(file);let state=createCharacter(spec.character);
    for(let i=0;i<=spec.steps.length;i++) {
      const scene=getScene(state.sceneId),text=sceneText(scene,state),choices=presentChoices(state,scene);
      rows.push({file,step:i,state,text,choices,voice:visibleCampaignDialogue(scene.id,scene.speaker,text),actor:scene.speaker,art:sceneIllustration(scene.id,state.flags),portrait:portraitArt(scene.speaker,scene.id,state.flags)});
      if(i===spec.steps.length)break;const a=spec.steps[i],c=choices.find(c=>c.id===a.choiceId&&c.enabled)!;assert.ok(c);state=commitChoice(state,c,c.check?{roll:a.roll!}:undefined).state;
    }
  }
  assert.equal(rows.length,19925);assert.equal(hash(JSON.stringify(rows)),baseline.campaignSha256);
  assert.deepEqual([...files('public/art'),...files('public/audio')].filter(p=>!isDramaticSequencesFile(p)).sort().map(path=>({path,sha256:hash(readFileSync(path))})),baseline.media);
  assert.deepEqual(files('qa/media').filter(p=>p.endsWith('.json')&&!isDramaticSequencesFile(p)).sort(),baseline.manifests.map(m=>m.path));
  for(const m of baseline.manifests)assert.equal(hash(readFileSync(m.path)),m.sha256,m.path);
  assert.deepEqual(phase.newScenes,[]);for(const p of ['public/audio/voice-campaign-dramatic-sequences-future.mp3','qa/routes/dramatic-sequences/future.json','qa/media/dramatic-sequences-future.json'])assert.equal(isDramaticSequencesFile(p),false);
});
import { dramaticSequenceIllustration } from './dramatic-sequence-art';
import { SEQUENCE_CHECKPOINTS } from '../qa/production/dramatic-sequences-checkpoints';
import { GALLERY_ART } from './art-gallery';
import provenance from '../qa/media/dramatic-sequences-provenance.json';
for(const p of profiles)it(`preserves every word, actor, recording, action and resource in ${p.id}`,()=>{
 const spec=load(p.route),control=load(p.precedingRoute);let a=createCharacter(spec.character),b=createCharacter(control.character);
 for(let i=0;i<=spec.steps.length;i++){
  const copy=structuredClone(a);delete copy.flags.dramatic_sequence_art_enabled;assert.deepEqual(copy,b);
  const as=getScene(a.sceneId),bs=getScene(b.sceneId);assert.equal(sceneText(as,a),sceneText(bs,b));assert.equal(JSON.stringify(presentChoices(a,as)),JSON.stringify(presentChoices(b,bs)));assert.deepEqual(visibleCampaignDialogue(as.id,as.speaker,sceneText(as,a)),visibleCampaignDialogue(bs.id,bs.speaker,sceneText(bs,b)));assert.equal(portraitArt(as.speaker,as.id,a.flags),portraitArt(bs.speaker,bs.id,b.flags));
  if(i===spec.steps.length)break;const step=spec.steps[i];const x=presentChoices(a,as).find(c=>c.id===step.choiceId&&c.enabled)!,y=presentChoices(b,bs).find(c=>c.id===step.choiceId&&c.enabled)!;assert.ok(x);assert.ok(y);a=commitChoice(a,x,x.check?{roll:step.roll!}:undefined).state;b=commitChoice(b,y,y.check?{roll:step.roll!}:undefined).state;
 }assert.equal(a.sceneId,spec.expected.sceneId);
});
for(const {rule,state} of SEQUENCE_CHECKPOINTS)it(`binds ${rule.id} to its legal state and rejects missing/conflicting guards`,()=>{
 assert.equal(getScene(state.sceneId).speaker,rule.actor);assert.deepEqual(dramaticSequenceIllustration(state.sceneId,state.flags),rule.illustration);assert.deepEqual(sceneIllustration(state.sceneId,state.flags),rule.illustration);
 assert.equal(dramaticSequenceIllustration(state.sceneId,{...state.flags,dramatic_sequence_art_enabled:false}),undefined);
 for(const f of rule.allFlags)assert.equal(dramaticSequenceIllustration(state.sceneId,{...state.flags,[f]:false}),undefined,f);
 for(const f of rule.noneFlags)assert.equal(dramaticSequenceIllustration(state.sceneId,{...state.flags,[f]:true}),undefined,f);
 assert.equal(dramaticSequenceIllustration('ending_witness',state.flags),undefined);
 assert.equal(GALLERY_ART.filter(a=>a.src===rule.illustration.src).length,1);
});
it('pins five full/small pairs and retained generation masters without changing old assets',()=>{
 assert.equal(provenance.assets.length,5);assert.equal(phase.newMedia.length,10);
 for(const asset of provenance.assets)for(const d of asset.deliveries){assert.equal(hash(readFileSync(d.path)),d.sha256);assert.equal(readFileSync(d.path).length,d.bytes);assert.ok(phase.newMedia.includes(d.path));}
 assert.equal(isDramaticSequencesFile('public/art/sequence-future.jpg'),false);assert.equal(isDramaticSequencesFile('qa/routes/dramatic-sequences/future.json'),false);
});

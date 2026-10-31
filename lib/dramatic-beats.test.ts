import assert from 'node:assert/strict';
import { it } from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createCharacter, getScene, presentChoices, commitChoice, sceneText } from './engine';
import { visibleCampaignDialogue, quotedSpeech } from './campaign-dialogue';
import { portraitArt, sceneIllustration } from './art';
import { replayCampaign, type ReplaySpec } from './story-replay';
import { routeCheckpoint } from '../qa/production/route-checkpoint';
import { dramaticArchiveMethod, DRAMATIC_QUOTES } from './dramatic-beats';
import { isDramaticBeatsFile } from '../qa/production/dramatic-beats-cohort';
import baseline from '../qa/editorial/dramatic-beats-baseline.json';
import phase from '../qa/media/dramatic-beats.json';
import profiles from '../qa/editorial/dramatic-beats-profiles.json';
import bindings from '../qa/media/dramatic-beats-dialogue-bindings.json';
import deliveries from '../qa/media/dramatic-beats-dialogue-provenance.json';
import asr from '../qa/media/dramatic-beats-dialogue-transcripts.json';
const hash = (b: string | Buffer) => createHash('sha256').update(b).digest('hex');
const files = (d: string): string[] => readdirSync(d, { withFileTypes: true }).flatMap(r => r.isDirectory() ? files(`${d}/${r.name}`) : [`${d}/${r.name}`]);
const load = (p: string) => JSON.parse(readFileSync(p, 'utf8')) as ReplaySpec;
const words = (s: string) => s.toLowerCase().replace(/[’']/g, '').match(/[a-z0-9]+/g) ?? [];
it('preserves all247 preceding routes,17737 exact visits,849 original media and every preceding manifest', () => {
  assert.equal(hash(readFileSync(phase.baseline)), phase.baselineSha256);
  assert.deepEqual(files('qa/routes').filter(p => p.endsWith('.json') && !isDramaticBeatsFile(p)).sort(), baseline.routeFiles);
  const rows=[];
  for (const file of baseline.routeFiles) {
    const spec=load(file);let state=createCharacter(spec.character);
    for(let i=0;i<=spec.steps.length;i++) {
      const scene=getScene(state.sceneId),text=sceneText(scene,state),choices=presentChoices(state,scene);
      rows.push({file,step:i,state,text,choices,voice:visibleCampaignDialogue(scene.id,scene.speaker,text),actor:scene.speaker,art:sceneIllustration(scene.id,state.flags),portrait:portraitArt(scene.speaker,scene.id,state.flags)});
      if(i===spec.steps.length)break;const a=spec.steps[i],c=choices.find(c=>c.id===a.choiceId&&c.enabled)!;assert.ok(c);state=commitChoice(state,c,c.check?{roll:a.roll!}:undefined).state;
    }
  }
  assert.equal(rows.length,17737);assert.equal(hash(JSON.stringify(rows)),baseline.campaignSha256);
  assert.deepEqual([...files('public/art'),...files('public/audio')].filter(p=>!isDramaticBeatsFile(p)).sort().map(path=>({path,sha256:hash(readFileSync(path))})),baseline.media);
  assert.deepEqual(files('qa/media').filter(p=>p.endsWith('.json')&&!isDramaticBeatsFile(p)).sort(),baseline.manifests.map(m=>m.path));
  for(const m of baseline.manifests)assert.equal(hash(readFileSync(m.path)),m.sha256,m.path);
  assert.deepEqual(phase.newScenes,[]);for(const p of ['public/audio/voice-campaign-dramatic-beats-future.mp3','qa/routes/dramatic-beats/future.json','qa/media/dramatic-beats-future.json'])assert.equal(isDramaticBeatsFile(p),false);
});
for(const p of profiles)it(`retains real costs, outcomes and dice through ${p.id}`,()=>{
  const spec=load(p.route),r=replayCampaign(spec),old=replayCampaign(load(p.precedingRoute)).state;assert.ok(r.transcript.every(t=>t.restored));
  const next=structuredClone(r.state);delete next.flags.dramatic_beats_enabled;delete next.flags.dramatic_quill_greeted;
  if(!load(p.precedingRoute).character.seraShift){for(const k of Object.keys(next.flags))if(k.startsWith('sera_shift_'))delete next.flags[k];next.journal=next.journal.filter(j=>j.id!=='sera-shift-offer');}
  assert.deepEqual({...next,log:[]},{...old,log:[]});
});
it('recognizes only actual paid/badge/signed extractions, retains exposure and respects source naming decisions',()=>{
  for(const [name,method]of [['face','signed'],['badge-scarce','badge'],['paid','paid']]as const){
    const s=routeCheckpoint(`dramatic-beats/${name}`,'act2_archive_custody');assert.equal(dramaticArchiveMethod(s),method);
    assert.match(sceneText(getScene(s.sceneId),s),new RegExp(DRAMATIC_QUOTES[method].replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
    assert.equal(dramaticArchiveMethod({...s,journal:s.journal.filter(j=>j.id!=='verified-order')}),undefined);
    assert.equal(dramaticArchiveMethod({...s,flags:{...s.flags,craft_archive_attempted:false}}),undefined);
    for(const c of presentChoices(s,getScene(s.sceneId)).filter(c=>c.enabled)){const n=commitChoice(s,c).state;assert.equal(n.flags.archive_method_face,s.flags.archive_method_face);assert.equal(n.flags.old_badge_traced,s.flags.old_badge_traced);}
  }
  const s=routeCheckpoint('dramatic-beats/face','act3_edda_visit');assert.ok(sceneText(getScene(s.sceneId),s).includes(DRAMATIC_QUOTES.return));
  const legacy=createCharacter({...load(profiles[0].route).character,dramaticBeats:false});assert.equal(legacy.flags.dramatic_beats_enabled,undefined);
  assert.throws(()=>createCharacter({...load(profiles[0].route).character,dramaticBeats:'yes' as unknown as boolean}));
});
it('binds every new quote to the right actor and exact media, retaining the two numeric ASR disagreements',()=>{
  const seen=new Set<string>();
  for(const p of profiles){const spec=load(p.route);let s=createCharacter(spec.character);for(const a of spec.steps){const scene=getScene(s.sceneId),text=sceneText(scene,s),lines=visibleCampaignDialogue(scene.id,scene.speaker,text);if(phase.changedScenes.includes(scene.id))for(const q of quotedSpeech(text))assert.ok(lines.some(l=>l.suffix?q.text.endsWith(l.quote):l.quote===q.text),q.text);for(const b of lines.filter(l=>phase.voiceIds.includes(l.id))){seen.add(b.id);assert.equal(b.speaker,scene.speaker);assert.ok(portraitArt(b.speaker,scene.id,s.flags));}const c=presentChoices(s,scene).find(c=>c.id===a.choiceId&&c.enabled)!;s=commitChoice(s,c,c.check?{roll:a.roll!}:undefined).state;}}
  assert.deepEqual([...seen].sort(),phase.voiceIds.slice().sort());
  const numeric:Record<string,[string,string]>={'voice-campaign-dramatic-beats-043fc7da30bc':['ninety','90'],'voice-campaign-dramatic-beats-11d2890d6c98':['fifty','50']};
  for(const b of bindings){const d=deliveries.lines.find(d=>d.id===b.id)!,t=asr.lines.find(t=>t.id===b.id)!;assert.ok(d);assert.ok(t);assert.equal(d.text,b.quote);assert.equal(d.speaker,b.speaker);assert.equal(d.voice,b.speaker==='Quill'?'am_michael':'af_kore');assert.equal(hash(readFileSync(d.path)),d.sha256);assert.equal(t.sha256,d.sha256);assert.ok(Math.abs(d.integratedLufs+23.5)<=.6);assert.ok(d.truePeakDbtp<=-1.5);assert.ok(d.peak<.95);
    if(numeric[b.id]){assert.equal(t.exactNormalizedWords,false);const [written,digit]=numeric[b.id];assert.equal(words(b.text)[0],written);assert.equal(words(t.transcription)[0],digit);assert.deepEqual(words(t.transcription).slice(1),words(b.text).slice(1));}else{assert.equal(t.exactNormalizedWords,true);assert.deepEqual(words(t.transcription),words(b.text));}
  }
});

it('keeps the personal opening once after an actual exchange without changing the advance or other actions',()=>{
  const s=routeCheckpoint('dramatic-beats/face','stall');
  const choose=(state:typeof s,id:string)=>{const c=presentChoices(state,getScene(state.sceneId)).find(c=>c.id===id&&c.enabled)!;assert.ok(c);return commitChoice(state,c).state;};
  assert.ok(sceneText(getScene(s.sceneId),s).includes(DRAMATIC_QUOTES.quill));
  const pay=choose(s,'ask-pay'),back=choose(pay,'back');assert.equal(back.flags.dramatic_quill_greeted,true);assert.equal(back.creds,s.creds);assert.deepEqual(back.rolls,s.rolls);assert.ok(!sceneText(getScene(back.sceneId),back).includes(DRAMATIC_QUOTES.quill));
});

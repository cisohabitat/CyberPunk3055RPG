import assert from 'node:assert/strict';
import { it } from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createCharacter, getScene, presentChoices, commitChoice, sceneText } from './engine';
import { visibleCampaignDialogue, quotedSpeech } from './campaign-dialogue';
import { portraitArt, sceneIllustration } from './art';
import { replayCampaign, type ReplaySpec } from './story-replay';
import { routeCheckpoint } from '../qa/production/route-checkpoint';
import { isConnectedScenesFile } from '../qa/production/connected-scenes-cohort';
import { consequentialMethod, consequentialExposure } from './consequential-methods';
import { districtRemaining } from './district-response';
import baseline from '../qa/editorial/connected-scenes-baseline.json';
import phase from '../qa/media/connected-scenes.json';
const hash = (b: string | Buffer) => createHash('sha256').update(b).digest('hex');
const files = (d: string): string[] => readdirSync(d, { withFileTypes: true }).flatMap(r => r.isDirectory() ? files(`${d}/${r.name}`) : [`${d}/${r.name}`]);
const load = (p: string) => JSON.parse(readFileSync(p, 'utf8')) as ReplaySpec;
const words = (s: string) => s.toLowerCase().replace(/[’']/g, '').match(/[a-z0-9]+/g) ?? [];
it('preserves all281 preceding routes,20278 exact visits,869 original media and every preceding manifest', () => {
  assert.equal(hash(readFileSync(phase.baseline)), phase.baselineSha256);
  assert.deepEqual(files('qa/routes').filter(p => p.endsWith('.json') && !isConnectedScenesFile(p)).sort(), baseline.routeFiles);
  const rows=[];
  for (const file of baseline.routeFiles) {
    const spec=load(file);let state=createCharacter(spec.character);
    for(let i=0;i<=spec.steps.length;i++) {
      const scene=getScene(state.sceneId),text=sceneText(scene,state),choices=presentChoices(state,scene);
      rows.push({file,step:i,state,text,choices,voice:visibleCampaignDialogue(scene.id,scene.speaker,text),actor:scene.speaker,art:sceneIllustration(scene.id,state.flags),portrait:portraitArt(scene.speaker,scene.id,state.flags)});
      if(i===spec.steps.length)break;const a=spec.steps[i],c=choices.find(c=>c.id===a.choiceId&&c.enabled)!;assert.ok(c);state=commitChoice(state,c,c.check?{roll:a.roll!}:undefined).state;
    }
  }
  assert.equal(rows.length,20278);assert.equal(hash(JSON.stringify(rows)),baseline.campaignSha256);
  assert.deepEqual([...files('public/art'),...files('public/audio')].filter(p=>!isConnectedScenesFile(p)).sort().map(path=>({path,sha256:hash(readFileSync(path))})),baseline.media);
  assert.deepEqual(files('qa/media').filter(p=>p.endsWith('.json')&&!isConnectedScenesFile(p)).sort(),baseline.manifests.map(m=>m.path));
  for(const m of baseline.manifests)assert.equal(hash(readFileSync(m.path)),m.sha256,m.path);
  assert.deepEqual(phase.newScenes,[]);for(const p of ['public/audio/voice-campaign-dramatic-sequences-future.mp3','qa/routes/dramatic-sequences/future.json','qa/media/dramatic-sequences-future.json'])assert.equal(isConnectedScenesFile(p),false);
});
import { scenePerformancePath, scenePerformanceLevel } from './scene-performance';
import { performanceVoicePath } from './performance-delivery';
import transcripts from '../qa/media/connected-scenes-transcripts.json';
import context from '../qa/editorial/connected-scenes-context.json';
import mix from '../qa/media/connected-scenes-mix.json';
for(const r of phase.deliveries)it(`selects reviewed same-word same-cast bytes and bounded levels for ${r.id}`,()=>{
 assert.equal(performanceVoicePath(r.id),'/'+r.path.slice(7));assert.equal(scenePerformancePath(r.id),'/'+r.path.slice(7));assert.equal(hash(readFileSync(r.path)),r.sha256);assert.equal(readFileSync(r.path).length,r.bytes);assert.equal(hash(readFileSync(r.fallbackPath)),r.fallbackSha256);
 assert.equal(scenePerformanceLevel(r.id,scenePerformancePath(r.id)!),1);assert.equal(scenePerformanceLevel(r.id,'/'+r.fallbackPath.slice(7)),r.fallbackGain);assert.equal(scenePerformanceLevel(r.id,'/audio/unknown.mp3'),undefined);
 assert.equal(r.sourceGain,1);assert.equal(r.sampleRate,24000);assert.equal(r.channels,1);assert.ok(Math.abs(r.integratedLufs+23.5)<=.1);assert.ok(r.truePeakDbtp<=-1.5);assert.ok(r.bytes<3*1024*1024);
 const t=transcripts.lines.find(t=>t.id===r.id)!;assert.ok(t);assert.equal(t.sha256,r.sha256);assert.equal(t.exactNormalizedWords,true);assert.deepEqual(words(t.transcription),words(r.text));const original=context.groups.flatMap(g=>g.stages).flatMap(s=>s.lines).find(l=>l.id===r.id)!;assert.equal(r.text,original.text);assert.equal(r.speaker,original.speaker);assert.equal(r.fallbackPath,original.beforePath);
});
it('keeps three clearer originals and rejects unknown/future ids and paths',()=>{
 assert.equal(phase.deliveries.length,5);assert.equal(phase.retainedIds.length,3);for(const id of [...phase.retainedIds,'constructor','__proto__','unknown','../voice']){assert.equal(scenePerformancePath(id),undefined);assert.equal(scenePerformanceLevel(id,'/audio/'+id+'.mp3'),undefined);}
 assert.equal(isConnectedScenesFile('public/audio/connected-scenes-v2/future.mp3'),false);assert.equal(isConnectedScenesFile('qa/media/connected-scenes-future.json'),false);
 const changed=phase.deliveries.filter(r=>r.fallbackGain!==r.previousSourceGain);assert.equal(changed.length,1);assert.equal(changed[0].id,'voice-campaign-kerr-899d4ba5ecfb');assert.equal(changed[0].fallbackGain,.66834392);assert.ok(Math.abs(mix.fallback.playback.integratedLufs+23.5)<=.1);
});
for(const group of context.groups)it(`retains complete legal ${group.id} words, art, actual actor and queue context`,()=>{
 const spec=load(group.route);let state=createCharacter(spec.character);let seen=0;
 for(let i=0;i<=spec.steps.length;i++){
  const stages=group.stages.filter(s=>s.step===i);for(const s of stages){seen++;assert.deepEqual(state,s.state);const sc=getScene(state.sceneId);assert.equal(sc.id,s.scene);assert.equal(sceneText(sc,state),s.text);assert.deepEqual(sceneIllustration(sc.id,state.flags),s.art);assert.equal(portraitArt(sc.speaker,sc.id,state.flags),s.portrait);
   const actual=visibleCampaignDialogue(sc.id,sc.speaker,s.text);const captured=s.lines.map(({beforePath,beforeSourceGain,beforeSha256,pauseBeforeMs,...line})=>line);assert.deepEqual(actual,captured);for(const l of s.lines)assert.equal(hash(readFileSync(l.beforePath)),l.beforeSha256);
  }if(i===spec.steps.length)break;const a=spec.steps[i],c=presentChoices(state,getScene(state.sceneId)).find(c=>c.id===a.choiceId&&c.enabled)!;assert.ok(c);state=commitChoice(state,c,c.check?{roll:a.roll!}:undefined).state;
 }assert.equal(seen,group.stages.length);
});
it('separates actual and loudness-matched complete-scene evidence with reproducible delivery hashes',()=>{
 assert.equal(context.groups.length,5);assert.equal(context.groups.reduce((n,g)=>n+g.stages.length,0),37);assert.equal(mix.groups.length,10);assert.equal(mix.compact.intervals.length,10);assert.equal(hash(readFileSync(mix.compact.previewPath)),mix.compact.previewSha256);
 for(const g of mix.groups){assert.ok(['actual','loudness-matched'].includes(g.mode));assert.ok(g.peak<.99);for(const s of g.stages){assert.equal(s.versions.length,2);for(const v of s.versions)for(const c of v.clips){assert.equal(hash(readFileSync(c.path)),c.sha256);if(g.mode==='actual')assert.equal(c.comparisonOnlyGain,1);}}}
});

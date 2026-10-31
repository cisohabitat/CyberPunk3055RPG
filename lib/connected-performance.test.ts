import assert from 'node:assert/strict';
import { it } from 'node:test';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { CONNECTED_PERFORMANCE_IDS, connectedPerformancePath } from './connected-performance';
import { performanceVoicePath } from './performance-delivery';
import { voiceLevel } from './voice-level';
import { routeCheckpoint } from '../qa/production/route-checkpoint';
import { getScene, sceneText } from './engine';
import { visibleCampaignDialogue } from './campaign-dialogue';
import { sceneSoundPlan } from './sound';
import { ORDINARY_CHECKPOINTS } from '../qa/production/ordinary-checkpoints';
import { CONNECTED_PERFORMANCE_MEDIA, CONNECTED_PERFORMANCE_MANIFESTS, isConnectedPerformanceFile } from '../qa/production/connected-performance-media';
import phase from '../qa/media/expressive-performance.json';
import review from '../qa/media/expressive-performance-review.json';
import audition from '../qa/media/expressive-performance-audition.json';
import baseline from '../qa/editorial/expressive-performance-baseline.json';
import precedingAsr from '../qa/media/emotional-payoff-dialogue-transcripts.json';
const sha=(p:string)=>createHash('sha256').update(readFileSync(p)).digest('hex');
const files=(d:string):string[]=>readdirSync(d,{withFileTypes:true}).flatMap(r=>r.isDirectory()?files(`${d}/${r.name}`):[`${d}/${r.name}`]);
const words=(s:string)=>s.toLowerCase().replace(/[’']/g,'').match(/[a-z0-9]+/g)??[];
it('preserves the independent full preceding inventory and every existing manifest without broad exemptions',()=>{
 assert.equal(phase.baselineSha256,'534fea12322018e9e7efbb9e86fe7f7751d386b60e1ba6494b139200b66f7914');assert.equal(sha(phase.baseline),phase.baselineSha256);assert.equal(baseline.routes,241);assert.equal(baseline.visits,17281);assert.equal(baseline.campaignSha256,'402c12d19542024d58bded4acf27643569d6b5092443a42a071c2b904c2a19d6');
 assert.deepEqual(files('qa/routes').filter(p=>p.endsWith('.json')).sort(),baseline.routeFiles);
 const current=[...files('public/art'),...files('public/audio')].sort();assert.equal(current.length,842);assert.equal(baseline.media.length,837);assert.deepEqual(current.filter(p=>!CONNECTED_PERFORMANCE_MEDIA.includes(p)).map(path=>({path,sha256:sha(path)})),baseline.media);
 const manifests=files('qa/media').filter(p=>p.endsWith('.json')&&!CONNECTED_PERFORMANCE_MANIFESTS.includes(p)).sort();assert.deepEqual(manifests,baseline.manifests.map(p=>p.path));for(const m of baseline.manifests)assert.equal(sha(m.path),m.sha256,m.path);
 assert.deepEqual(phase.newScenes,[]);assert.deepEqual(phase.newRoutes,[]);
 for(const p of ['public/audio/connected-performance-v1/unknown.mp3','public/audio/connected-performance-v1/constructor.mp3','qa/media/expressive-performance-future.json'])assert.equal(isConnectedPerformanceFile(p),false);
});
it('selects exactly five reviewed alternatives and retains originals, exact stock identity and words',()=>{
 assert.deepEqual([...CONNECTED_PERFORMANCE_IDS],phase.selectedIds);assert.equal(phase.deliveries.length,5);assert.deepEqual(CONNECTED_PERFORMANCE_MEDIA,phase.newMedia);
 for(const l of phase.deliveries){const bound=phase.examples.flatMap(e=>e.lines).find(b=>b.id===l.id)!;assert.ok(bound);assert.equal(l.text,bound.text);assert.equal(l.speaker,bound.speaker);assert.equal(l.speaker,'Kerr');assert.equal(l.voice,'am_adam');assert.equal(performanceVoicePath(l.id),connectedPerformancePath(l.id));assert.equal(l.path,'public'+connectedPerformancePath(l.id));assert.equal(sha(l.path),l.sha256);assert.equal(readFileSync(l.path).length,l.bytes);assert.equal(sha(l.fallbackPath),l.previousSha256);assert.equal(l.fallbackPath,l.previousPath);assert.equal(l.sourceGain,1);assert.equal(voiceLevel(l.id),1);assert.equal(l.channels,1);assert.equal(l.sampleRate,24000);assert.ok(Math.abs(l.integratedLufs+23.5)<=.6);assert.ok(l.truePeakDbtp<=-1.5);assert.ok(l.peak<.95);assert.ok(l.bytes<3*1024*1024);assert.equal(l.segments.map(s=>s.text).join(' '),l.text);assert.ok(l.transcript.exactNormalizedWords);assert.equal(l.transcript.sha256,l.sha256);assert.deepEqual(words(l.transcript.transcription),words(l.text));}
 for(const id of ['unknown','constructor','__proto__','../voice',phase.retainedIds[0]])assert.equal(connectedPerformancePath(id),undefined);
});
it('binds every complete conditional stage to legal checkpoints, original actor and actual beds',()=>{
 assert.equal(phase.examples.length,6);const seen=new Set<string>();
 for(const example of phase.examples){const c=ORDINARY_CHECKPOINTS.find(c=>c.id===example.id)!;const s=routeCheckpoint(c.route,c.scene,c.choice),scene=getScene(s.sceneId),text=sceneText(scene,s);assert.equal(example.text,text);assert.deepEqual(visibleCampaignDialogue(scene.id,scene.speaker,text),example.lines);assert.deepEqual(sceneSoundPlan(s,scene.location),example.sound);for(const l of example.lines)seen.add(l.id);}
 assert.equal(seen.size,6);for(const id of phase.selectedIds)assert.ok(seen.has(id));assert.deepEqual(phase.retainedIds,['voice-campaign-kerr-899d4ba5ecfb']);
});
it('retains every candidate byte and unprompted negative result without transcript rewriting',()=>{
 assert.equal(sha(review.asrDriver.path),review.asrDriver.sha256);for(const f of precedingAsr.modelFiles)assert.equal(review.asrModel.files.find(m=>m.name===f.name.split('/').at(-1))!.sha256,f.sha256);assert.equal(review.before.lines.length,6);assert.equal(review.iterations.length,3);assert.equal(review.iterations.flatMap(i=>i.provenance.lines).length,14);assert.equal(review.beforeLevels.length,6);assert.ok(review.before.lines.some(l=>!l.exactNormalizedWords));
 for(const iteration of review.iterations){for(const l of iteration.provenance.lines){assert.equal(sha(l.retainedCandidatePath),l.sha256);const t=iteration.transcripts.lines.find(t=>t.id===l.id)!;assert.equal(t.sha256,l.sha256);assert.equal(t.exactNormalizedWords,JSON.stringify(words(t.transcription))===JSON.stringify(words(l.text)));}assert.ok(iteration.transcripts.lines.some(l=>!l.exactNormalizedWords));}
 assert.equal(review.rejectedFindings.length,4);assert.deepEqual(review.acceptedIds,phase.selectedIds);assert.deepEqual(review.retainedIds,phase.retainedIds);
});
it('provides twelve complete stage-bed intervals with exact sources and explicit unmatched loudness',()=>{
 assert.equal(audition.scenes.length,6);assert.equal(audition.channels,2);assert.equal(sha(audition.previewPath),audition.previewSha256);assert.equal(readFileSync(audition.previewPath).length,audition.bytes);assert.match(audition.limitations,/not level matched/);
 for(const s of audition.scenes){assert.equal(sha(s.musicPath),s.musicSha256);assert.equal(sha(s.ambiencePath),s.ambienceSha256);assert.equal(s.sceneText,phase.examples.find(e=>e.id===s.checkpoint)!.text);assert.deepEqual(s.versions.map(v=>v.version),['before','directed']);for(const v of s.versions){assert.ok(v.peak<.99);assert.ok(v.bedRms>0);for(const clip of v.clips){assert.equal(sha(clip.path),clip.sha256);assert.equal(clip.text,phase.examples.find(e=>e.id===s.checkpoint)!.lines.find(l=>l.id===clip.id)!.text);}}}
});

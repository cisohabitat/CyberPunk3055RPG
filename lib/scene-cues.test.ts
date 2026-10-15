import assert from 'node:assert/strict';
import { it } from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { commitChoice, createCharacter, getScene, presentChoices } from './engine';
import { sceneInteractionCue, SCENE_CUE_MIX } from './scene-cues';
import type { ReplaySpec } from './story-replay';
import media from '../qa/media/scene-foley.json';
import physical from '../qa/media/investigation-foley.json';
import mastering from '../qa/media/voice-mastering.json';
import { sceneIllustration } from './art';
const base = createCharacter({handle:'Foley review',givenName:'Jo',origin:'spire',bonus:{chrome:2,nerve:0,face:0,ghost:0}});

it('keeps every authored action and source outcome unchanged while choosing neutral mechanical cues', () => {
  const heard = new Set<string>();
  for (const file of readdirSync(new URL('../qa/routes/',import.meta.url)).filter(f=>f.endsWith('.json'))) {
    const spec = JSON.parse(readFileSync(new URL(`../qa/routes/${file}`,import.meta.url),'utf8')) as ReplaySpec;
    let state = createCharacter(spec.character);
    for (const step of spec.steps) {
      const choice = presentChoices(state,getScene(state.sceneId)).find(c=>c.id===step.choiceId&&c.enabled)!;
      const after = commitChoice(state,choice,choice.check?{roll:step.roll!}:undefined).state;
      const beforeJSON=JSON.stringify(state),afterJSON=JSON.stringify(after);
      const cue=sceneInteractionCue(state,choice.id,after);if(cue)heard.add(cue);
      assert.equal(JSON.stringify(state),beforeJSON);assert.equal(JSON.stringify(after),afterJSON);
      state=after;
    }
  }
  assert.deepEqual([...heard].sort(),[...media.clips,...physical.clips].map(c=>c.id).sort());
});

it('uses the same reader sound for a successful and rejected key query, without supplying authentication', () => {
  const state={...base,sceneId:'act2_archive_door'};
  const choice=presentChoices(state,getScene(state.sceneId)).find(c=>c.id==='trace-receipt')!;
  const miss=commitChoice(state,choice,{roll:1}).state,hit=commitChoice(state,choice,{roll:10}).state;
  assert.equal(miss.flags.archive_key_authenticated,undefined);assert.equal(hit.flags.archive_key_authenticated,true);
  assert.equal(sceneInteractionCue(state,choice.id,miss),'foley-reader');assert.equal(sceneInteractionCue(state,choice.id,hit),'foley-reader');
  assert.equal(sceneInteractionCue({...state,sceneId:'act2_archive_compare'},'catalog-is-proof',{...state,sceneId:'act2_archive_challenge'}),undefined);
});

it('keeps a closed case and a running recorder separate from receipts and public witness permission', () => {
  const state={...base,sceneId:'act2_freight_sources',flags:{freight_started:true}};
  const choice=presentChoices(state,getScene(state.sceneId)).find(c=>c.id==='inspect-freight-seal')!;
  const after=commitChoice(state,choice).state;
  assert.equal(sceneInteractionCue(state,choice.id,after),'foley-case');assert.equal(after.flags.freight_delivered,undefined);
  assert.equal(sceneInteractionCue(after,choice.id,after),undefined);
  const consent={...base,sceneId:'act3_testimony_consent',flags:{testimony_bounded:true}};
  const leavePrivate=presentChoices(consent,getScene(consent.sceneId)).find(c=>c.id==='keep-recording-private')!;
  const hearing=commitChoice(consent,leavePrivate).state;
  assert.equal(sceneInteractionCue(consent,leavePrivate.id,hearing),'foley-recorder');
  assert.equal(hearing.flags.nia_public_consent,undefined);assert.equal(hearing.flags.testimony_published,undefined);
  assert.equal(sceneInteractionCue(hearing,'answer-open-question',{...hearing,sceneId:'act3_testimony_record'}),undefined);
  assert.equal(sceneIllustration('act3_testimony_hearing')?.src,'/art/ives-hearing.jpg');
});

it('pins short quiet delivery signals, retained voices and the optional authoring source', () => {
  assert.deepEqual(media.mix,SCENE_CUE_MIX);assert.equal(media.clips.length,4);
  for(const clip of media.clips) {
    const bytes=readFileSync(new URL(`../${clip.path}`,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),clip.sha256);
    assert.equal(bytes.length,clip.bytes);assert.equal(bytes.readUInt32LE(24),22050);assert.equal(bytes.readUInt16LE(22),1);
    assert.ok(clip.durationSeconds<=1.5&&clip.durationSeconds>.5);assert.ok(clip.peak<.2&&clip.rms>.001);
    assert.equal(bytes.readInt16LE(44),0);assert.equal(bytes.readInt16LE(bytes.length-2),0);
  }
  for(const [path,hash] of Object.entries(media.sourceSha256))assert.equal(createHash('sha256').update(readFileSync(new URL(`../${path}`,import.meta.url))).digest('hex'),hash);
  for(const clip of mastering.clips)assert.equal(createHash('sha256').update(readFileSync(new URL(`../${clip.path}`,import.meta.url))).digest('hex'),clip.sha256);
});

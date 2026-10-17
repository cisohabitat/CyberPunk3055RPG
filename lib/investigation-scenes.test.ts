import { bindingHashBeforeMultiline } from "../qa/production/binding-history";
import assert from "node:assert/strict";
import { it } from "node:test";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { INVESTIGATION_SCENES, investigationScene } from "./investigation-scenes";
import { getScene, sceneText, createCharacter, presentChoices, commitChoice } from "./engine";
import { sceneIllustration } from "./art";
import { visibleCampaignDialogue } from "./campaign-dialogue";
import { sceneSoundPlan } from "./sound";
import { sceneInteractionCue } from "./scene-cues";
import { routeCheckpoint } from "../qa/production/route-checkpoint";
import { reviewedDeliveryHash } from "../qa/production/delivery-history";
import phase from "../qa/media/archive-hearing.json";
import physical from "../qa/media/investigation-foley.json";
import authoring from "../qa/media/campaign-dialogue-lines.json";
import provenance from "../qa/media/campaign-dialogue-provenance.json";
import oldMedia from "../qa/media/character-profiles.json";
const hash = (file: string) => createHash("sha256").update(readFileSync(file)).digest("hex");
const words = (text: string) => text.toLowerCase().replace(/\bcira\b/g,"sera").replace(/['’]/g,"").match(/[a-z0-9]+/g) ?? [];

it("directs ten explicit scenes using unchanged canonical words, actual actors and appropriate paintings", () => {
  assert.equal(phase.scenes.length, 10);
  assert.deepEqual(Object.keys(INVESTIGATION_SCENES).sort(), phase.scenes.map(row => row.sceneId).sort());
  for (const row of phase.scenes) {
    const state = routeCheckpoint(row.route, row.sceneId), scene = getScene(row.sceneId), before = JSON.stringify(state), text = sceneText(scene,state);
    assert.deepEqual(investigationScene(row.sceneId), { label: row.label, kind: row.kind });
    assert.equal(scene.speaker, row.sceneSpeaker);
    assert.equal(createHash("sha256").update(text).digest("hex"), row.textSha256);
    assert.deepEqual(visibleCampaignDialogue(scene.id,scene.speaker,text).map(({key,id,speaker,text})=>({key,id,speaker,text})),row.dialogue);
    assert.equal(sceneIllustration(scene.id,state.flags)!.src,row.illustration);
    assert.equal(sceneSoundPlan(state,scene.location).mood,"quiet");
    if (["act2_witness_safe","act3_testimony_nia"].includes(scene.id)) assert.equal(sceneSoundPlan(state,scene.location).district,"witness");
    assert.equal(JSON.stringify(state),before);
  }
  for(const id of ["memo","ending_names","act2_archive_compare","toString","__proto__","unknown"]) assert.equal(investigationScene(id),undefined);
});

it("pins four exact-word performances, independent transcripts, retained prior bytes and every other original media file", () => {
  assert.equal(phase.performances.length,4);
  assert.equal(bindingHashBeforeMultiline(),phase.bindingSha256);
  const changed=new Set(phase.performances.map(row=>row.path));
  for(const row of phase.performances){
    const line=authoring.find(line=>line.id===row.id)!,delivery=provenance.lines.find(line=>line.id===row.id)!;
    assert.equal(line.text,row.text);assert.equal(delivery.text,row.text);assert.equal(delivery.speaker,row.speaker);assert.equal(delivery.voice,row.voice);
    assert.equal(line.segments!.map(part=>part.text).join(" "),row.text);
    assert.equal(hash(row.path),row.sha256);assert.equal(hash(row.previousDeliveryCopy),row.previousSha256);assert.notEqual(row.sha256,row.previousSha256);
    assert.equal(reviewedDeliveryHash(row.path,row.previousSha256),row.previousSha256);
    assert.throws(()=>reviewedDeliveryHash(row.path,"0".repeat(64)),/Unreviewed delivery change/);
    assert.equal(row.transcription.sha256,row.sha256);assert.deepEqual(words(row.transcription.text),words(row.text));
    assert.ok(Math.abs(row.integratedLufs+20)<=.6);assert.ok(row.truePeakDbtp<=-1.5);
  }
  for(const file of oldMedia.preservedMedia) if(!changed.has(file.path)) assert.equal(reviewedDeliveryHash(file.path,file.sha256),file.sha256,file.path);
});

it("keeps mechanical sounds tied to committed physical actions, without adding permission or a success signal", () => {
  const base=createCharacter({handle:"Physical review",givenName:"Jo",origin:"spire",bonus:{chrome:2,nerve:0,face:0,ghost:0}});
  const move=(state:typeof base,id:string,roll?:number)=>{const c=presentChoices(state,getScene(state.sceneId)).find(c=>c.id===id&&c.enabled)!;assert.ok(c);return commitChoice(state,c,c.check?{roll:roll!}:undefined).state;};
  const chair={...base,sceneId:"act2_witness_plan"};
  for(const roll of [1,10]) {const after=move(chair,"steady-chair",roll);assert.equal(sceneInteractionCue(chair,"steady-chair",after),"foley-chair");assert.equal(after.flags.witness_safe,undefined);}
  const custody=routeCheckpoint("pacing-signed-face","act2_archive_custody");
  for(const id of ["withhold-technician","ask-named-source"]) {const after=move(custody,id);assert.equal(sceneInteractionCue(custody,id,after),"foley-paper");assert.equal(sceneInteractionCue(after,id,after),undefined);}
  const record=routeCheckpoint("finale-witness-corrected","act3_testimony_record");
  for(const id of ["file-public-account","withdraw-public-account"]) {const after=move(record,id);assert.equal(sceneInteractionCue(record,id,after),"foley-paper");assert.equal(after.flags.archive_key_authenticated,undefined);assert.equal(after.flags.nia_public_consent,undefined);}
  const wall=routeCheckpoint("finale-listed-archive","act3_arrival","let-ives");
  const folio=move(wall,"let-ives");assert.equal(sceneInteractionCue(wall,"let-ives",folio),"foley-folio");
  assert.equal(sceneInteractionCue(folio,"let-ives",folio),undefined);
  assert.equal(sceneInteractionCue(wall,"say-anyway",{...wall,sceneId:"ending_names"}),undefined);
});

it("delivers three quiet bounded physical textures from optional authoring without rewriting the original cues", () => {
  assert.equal(physical.clips.length,3);
  for(const clip of physical.clips){
    const bytes=readFileSync(clip.path);assert.equal(hash(clip.path),clip.sha256);assert.equal(bytes.length,clip.bytes);
    assert.equal(bytes.readUInt16LE(22),1);assert.equal(bytes.readUInt32LE(24),22050);assert.ok(clip.durationSeconds<1.5&&clip.durationSeconds>.5);
    assert.ok(clip.peak<.2&&clip.rms>.001);assert.equal(bytes.readInt16LE(44),0);assert.equal(bytes.readInt16LE(bytes.length-2),0);
  }
  for(const [path,sha]of Object.entries(physical.sourceSha256))assert.equal(hash(path),sha);
});

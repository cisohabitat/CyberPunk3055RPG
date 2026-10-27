import assert from "node:assert/strict";
import { it } from "node:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { createCharacter, commitChoice, getScene, presentChoices, sceneText } from "./engine";
import { replayCampaign, type ReplaySpec } from "./story-replay";
import { sceneIllustration } from "./art";
import { visibleCampaignDialogue } from "./campaign-dialogue";
import { CINEMATIC_SEQUENCES, cinematicDetail, cinematicSequence, dialoguePause } from "./cinematic-sequences";
import { DialoguePlayback } from "./dialogue-playback";
import { BED_FOCUS } from "./pivotal-scenes";
import phase from "../qa/media/cinematic-sequences.json";
import kerr from "../qa/media/kerr-confrontation.json";
import mara from "../qa/media/mara-relationship.json";
const hash=(v:string|Buffer)=>createHash("sha256").update(v).digest("hex");
it("preserves all 164 complete campaign states, scripts, actor bindings and primary/earned shots",()=>{
 const rows=[],sequenceRows=[];
 for(const file of readdirSync("qa/routes").filter(f=>f.endsWith(".json")).sort()){
  const spec=JSON.parse(readFileSync(`qa/routes/${file}`,"utf8"))as ReplaySpec;const state=replayCampaign(spec).state,scene=getScene(state.sceneId),text=sceneText(scene,state);rows.push({file,state,text,voice:visibleCampaignDialogue(scene.id,scene.speaker,text)});
  let s=createCharacter(spec.character);for(const[step,entry]of spec.steps.entries()){const sc=getScene(s.sceneId),t=sceneText(sc,s);if(cinematicSequence(sc.id))sequenceRows.push({file,step,sceneId:sc.id,text:t,voice:visibleCampaignDialogue(sc.id,sc.speaker,t),art:sceneIllustration(sc.id,s.flags)});const c=presentChoices(s,sc).find(c=>c.id===entry.choiceId&&c.enabled)!;s=commitChoice(s,c,c.check?{roll:entry.roll!}:undefined).state;}
 }
 assert.equal(rows.length,phase.baseline.routes.count);assert.equal(hash(JSON.stringify(rows)),phase.baseline.routes.sha256);assert.equal(sequenceRows.length,phase.baseline.sequenceScript.visits);assert.equal(hash(JSON.stringify(sequenceRows)),phase.baseline.sequenceScript.sha256);
});
it("keeps every preceding audio and art byte unchanged and inventories all twelve new art deliveries",()=>{
 const additions=phase.artAssets.flatMap(a=>a.files).map(f=>f.path);
 const laterAdditions=[kerr,mara].flatMap(p=>[...p.artAssets.flatMap(a=>a.files).map(f=>f.path),...p.voiceIds.map(id=>`public/audio/${id}.mp3`)]);
 const generated=phase.baseline.reproducibleAudio.map(f=>f.path);for(const f of phase.baseline.reproducibleAudio)assert.equal(hash(readFileSync(f.path)),f.sha256);
 for(const[dir,contract]of [["audio",phase.baseline.precedingAudio],["art",phase.baseline.precedingArt]]as const){
  const files=readdirSync(`public/${dir}`,{recursive:true}).map(p=>`public/${dir}/${p}`).filter(p=>!additions.includes(p)&&!laterAdditions.includes(p)&&!generated.includes(p)&&statSync(p).isFile()).map(path=>{const b=readFileSync(path);return{path,blob:createHash("sha1").update(`blob ${b.length}\0`).update(b).digest("hex")};}).sort((a,b)=>a.path.localeCompare(b.path,"en"));assert.equal(files.length,contract.count);assert.equal(hash(JSON.stringify(files)),contract.sha256,dir);
 }
 assert.equal(additions.length,12);for(const a of phase.artAssets)for(const f of a.files)assert.equal(hash(readFileSync(f.path)),f.sha256);
});
it("enumerates four sequences and scopes detail shots to the actual room, without ending/unknown fallbacks",()=>{
 assert.equal(CINEMATIC_SEQUENCES.length,4);const scenes=CINEMATIC_SEQUENCES.flatMap(s=>[...s.scenes]);assert.equal(new Set(scenes).size,16);assert.deepEqual(new Set(scenes),new Set(phase.baseline.examples.map(e=>e.sceneId)));
 for(const s of CINEMATIC_SEQUENCES){for(const id of s.scenes)assert.ok(getScene(id));for(const id of s.detailScenes)assert.equal(cinematicDetail(id)?.src,s.detail.src);assert.ok(s.sameSpeakerMs< s.changedSpeakerMs);assert.ok(BED_FOCUS[s.focus].music<.55);assert.ok(BED_FOCUS[s.focus].ambience<=.7);}
 for(const id of ["act2_witness_plan","act2_witness_door","act2_witness_repair","act3_district_return","after_kerr"])assert.equal(cinematicDetail(id),undefined,id);
 for(const id of ["ending_quiet","ending_names","ending_witness","ending_listed","__proto__","constructor","unknown"])assert.equal(cinematicSequence(id),undefined,id);
});
it("preserves default/first-line cadence and gives each sequence a bounded actor-aware pause",()=>{
 assert.equal(dialoguePause("memo",undefined,"Mara"),0);assert.equal(dialoguePause(undefined,"Mara","Mara"),120);assert.equal(dialoguePause("unknown","Mara","Kerr"),220);
 for(const s of CINEMATIC_SEQUENCES){assert.equal(dialoguePause(s.scenes[0],"A","A"),s.sameSpeakerMs);assert.equal(dialoguePause(s.scenes[0],"A","B"),s.changedSpeakerMs);assert.ok(s.changedSpeakerMs<=700);}
});
for(const stop of ["stop","mute","dispose"]as const)it(`cancels a directed breath on ${stop} without falsely announcing an audible actor`,t=>{
 t.mock.timers.enable({apis:["setTimeout"]});const views:{status:string;key?:string}[]=[],calls:{id:string;end:(outcome:"ended"|"unavailable")=>void}[]=[];
 const p=new DialoguePlayback(v=>views.push(v),(id,report,end)=>{calls.push({id,end:end!});report("playing");return()=>{};},(a,b)=>dialoguePause("act2_witness_arrival",a,b));const lines=[{key:"a",id:"first",speaker:"Nia Pell"},{key:"b",id:"second",speaker:"Nia Pell"}];p.update(lines,true,true);t.mock.timers.tick(0);assert.equal(calls.length,1);calls[0].end("ended");assert.equal(views.at(-1)?.status,"loading");t.mock.timers.tick(379);assert.equal(calls.length,1);if(stop==="mute")p.update(lines,false,true);else p[stop]();t.mock.timers.tick(1000);assert.equal(calls.length,1);p.dispose();
});
it("starts a directed second line only at the authored boundary and does not pause after a failed decode",t=>{
 t.mock.timers.enable({apis:["setTimeout"]});const calls:{id:string;end:(outcome:"ended"|"unavailable")=>void}[]=[];const p=new DialoguePlayback(()=>{},(id,report,end)=>{calls.push({id,end:end!});report("playing");return()=>{};},(a,b)=>dialoguePause("act3_arrival",a,b));p.update([{key:"a",id:"first",speaker:"Sera"},{key:"b",id:"second",speaker:"Sera"},{key:"c",id:"third",speaker:"Ives"}],true,true);t.mock.timers.tick(0);calls[0].end("ended");t.mock.timers.tick(419);assert.equal(calls.length,1);t.mock.timers.tick(1);assert.equal(calls.length,2);calls[1].end("unavailable");t.mock.timers.tick(0);assert.equal(calls.length,3);p.dispose();
});

import { routeCheckpoint } from "../qa/production/route-checkpoint";
import { allCampaignDialogue } from "./campaign-dialogue";
import mixSpec from "../qa/media/cinematic-mix-spec.json";
import mixReview from "../qa/media/cinematic-mix-review.json";
import transcripts from "../qa/media/cinematic-mix-transcripts.json";
it("retains a real missed-confrontation branch without inventing source, escape or permission",()=>{
 const e=phase.baseline.examples.find(e=>e.forceChoiceId)!;const s=routeCheckpoint(e.route,e.checkpointSceneId!,e.choiceId),c=presentChoices(s,getScene(s.sceneId)).find(c=>c.id===e.forceChoiceId&&c.enabled)!;const result=commitChoice(s,c,{roll:e.forceRoll!});assert.equal(result.check?.success,false);assert.equal(result.state.sceneId,e.sceneId);const sc=getScene(e.sceneId),text=sceneText(sc,result.state);assert.equal(hash(text),e.textSha256);assert.deepEqual(visibleCampaignDialogue(sc.id,sc.speaker,text),e.dialogue);assert.equal(sceneIllustration(sc.id,result.state.flags)?.src,e.defaultArt);
});
it("reconciles all four actual mix comparisons and eight raw transcripts to unchanged cast words and levels",()=>{
 const words=(t:string)=>t.toLowerCase().replace(/\b300\b/g,"three hundred").replace(/\b9\b/g,"nine").replace(/['’]/g,"").match(/[a-z0-9]+/g);
 assert.equal(mixSpec.length,4);assert.equal(mixReview.samples.length,4);assert.equal(transcripts.samples.length,8);
 for(const spec of mixSpec){const row=mixReview.samples.find(r=>r.sceneId===spec.sceneId)!,s=cinematicSequence(spec.sceneId)!;assert.deepEqual(row.lines,spec.lines);assert.deepEqual(spec.afterFocus,BED_FOCUS[s.focus]);assert.equal(spec.pauseAfter.sameSpeakerMs,s.sameSpeakerMs);assert.equal(spec.pauseAfter.changedSpeakerMs,s.changedSpeakerMs);assert.equal(row.versions[0].voiceRmsWithoutGaps,row.versions[1].voiceRmsWithoutGaps);assert.ok(row.bedChangeDb<0);assert.equal(hash(readFileSync(row.musicPath)),row.musicSha256);assert.equal(hash(readFileSync(row.ambiencePath)),row.ambienceSha256);
  for(const line of row.lines){assert.ok(allCampaignDialogue.some(b=>b.id===line.id&&b.speaker===line.speaker&&b.text===line.text));assert.equal(hash(readFileSync(line.path)),line.sha256);}
  for(const version of row.versions){assert.ok(version.peak<.99);const t=transcripts.samples.find(t=>t.sceneId===row.sceneId&&t.version===version.version)!;assert.equal(t.sha256,version.sha256);assert.equal(t.authoredText,row.lines.map(l=>l.text).join(" "));assert.deepEqual(words(t.transcription),words(t.authoredText));}
 }
});

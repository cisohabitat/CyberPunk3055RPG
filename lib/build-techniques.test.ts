import assert from "node:assert/strict";
import { it } from "node:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { commitChoice, createCharacter, getScene, presentChoices, sceneText } from "./engine";
import { districtRemaining } from "./district-response";
import { canStartTechnique, techniqueMode, techniqueStat, techniqueResume } from "./build-techniques";
import { exportRun, importRun } from "./vault";
import { replayCampaign, type ReplaySpec } from "./story-replay";
import { routeCheckpoint } from "../qa/production/route-checkpoint";
import { visibleCampaignDialogue, quotedSpeech } from "./campaign-dialogue";
import phase from "../qa/media/build-techniques.json";
import bindings from "../qa/media/technique-dialogue-bindings.json";
import recordings from "../qa/media/technique-dialogue-provenance.json";
import authoring from "../qa/media/technique-dialogue-lines.json";
import transcripts from "../qa/media/technique-dialogue-transcripts.json";
import type { GameState } from "./types";
const digest = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");
const base = (file = "technique-chrome-portable-label") => routeCheckpoint(file, "act2_district_canal", "open-build-techniques");
const options = (s: GameState) => presentChoices(s, getScene(s.sceneId));
function take(s: GameState, id: string) { const c = options(s).find(c => c.id === id && c.enabled); assert.ok(c, `${s.sceneId}/${id}`); const result = commitChoice(s,c).state; assert.deepEqual(importRun(exportRun(result)), result); return result; }
function planned(file: string, stat: string) { return take(take(base(file), "open-build-techniques"), `plan-technique-${stat}`); }
it("preserves all 152 preceding campaign states, prose, voices and eight authoring catalogs", () => {
  for (const [path, hash] of Object.entries(phase.precedingFiles)) assert.equal(digest(readFileSync(path)), hash, path);
  const rows = phase.precedingRouteContract.files.map(file => { const state = replayCampaign(JSON.parse(readFileSync(`qa/routes/${file}`, "utf8"))).state, scene = getScene(state.sceneId), text = sceneText(scene,state); return { file, state, text, voice: visibleCampaignDialogue(scene.id,scene.speaker,text) }; });
  assert.equal(rows.length,152); assert.equal(digest(JSON.stringify(rows)),phase.precedingRouteContract.sha256);
});
it("covers every actual new quotation throughout twelve complete checkpoint campaigns", () => {
  const seen = new Set<string>();
  for (const file of phase.routes) {
    const spec = JSON.parse(readFileSync(`qa/routes/${file}`, "utf8")) as ReplaySpec; replayCampaign(spec);
    let s = createCharacter(spec.character);
    for (const step of spec.steps) {
      const scene = getScene(s.sceneId), text = sceneText(scene,s);
      if (scene.id.startsWith("act2_technique_")) {
        const spoken = visibleCampaignDialogue(scene.id,scene.speaker,text); for (const b of spoken) seen.add(b.id);
        for (const q of quotedSpeech(text)) assert.ok(spoken.some(b=>b.quote===q.text),q.text);
      }
      const c = options(s).find(c=>c.id===step.choiceId&&c.enabled)!; s=commitChoice(s,c,c.check?{roll:step.roll!}:undefined).state;
    }
  }
  assert.deepEqual([...seen].sort(),phase.voiceIds);
});
it("binds all nine recordings to exact delivered words, actor and measured files", () => {
  assert.equal(bindings.length,9); assert.equal(recordings.lines.length,9); assert.equal(authoring.length,9);
  const words=(t:string)=>t.toLowerCase().replace(/\b2\b/g,"two").replace(/\b3\b/g,"three").replace(/['’]/g,"").match(/[a-z0-9]+/g);
  for(const b of bindings){const a=authoring.find(l=>l.id===b.id)!,r=recordings.lines.find(l=>l.id===b.id)!,t=transcripts.lines.find(l=>l.id===b.id)!;
    assert.equal(b.speaker,"Dispatcher");assert.equal(a.text,b.text);assert.equal(r.text,b.text);assert.equal(r.voice,a.voice);assert.equal(digest(readFileSync(r.path)),r.sha256);assert.equal(t.sha256,r.sha256);assert.equal(t.authoredText,b.text);assert.deepEqual(words(t.transcription),words(b.text));assert.ok(Math.abs(r.integratedLufs+20)<=.6&&r.truePeakDbtp<=-1.5&&r.peak<.95&&r.rms>.005);
  }
  for(const asset of phase.artAssets)for(const file of asset.files)assert.equal(digest(readFileSync(file.path)),file.sha256);
});
it("requires earned training and two actual actions; equipment alone grants no method",()=>{
  const s=base(),without={...s,flags:{...s.flags,perk_chrome:false}};assert.equal(canStartTechnique(without),false);
  for(const flags of [{district_window_1:true},{district_window_closed:true},{act2_done:true},{district_work_registered:true},{district_rest_booked:true},{district_correction_carried:true}])assert.equal(canStartTechnique({...s,flags:{...s.flags,...flags}}),false);
  const opened=take(s,"open-build-techniques");assert.equal(districtRemaining(opened),2);assert.equal(opened.strain,s.strain);assert.equal(opened.creds,s.creds);assert.deepEqual(opened.journal,s.journal);
});
it("locks method and cost across pause, native export and resume without duplicate rewards",()=>{
  let s=planned("technique-chrome-portable-label","chrome");const before=s;s=take(s,"prepare-technique-chrome-portable");assert.equal(s.strain,before.strain+1);assert.equal(districtRemaining(s),1);s=take(s,"pause-technique");assert.ok(!options(s).some(c=>["open-build-techniques","district-register-work","district-carry-correction"].includes(c.id)));s=take(s,"resume-build-technique");assert.equal(s.sceneId,"act2_technique_chrome_submit");assert.ok(!options(s).some(c=>c.id.startsWith("prepare-")));s=take(s,"submit-technique-chrome-label");assert.equal(s.factions.wards,Math.min(5,before.factions.wards+1));assert.equal(districtRemaining(s),0);assert.ok(!options(s).some(c=>c.id.startsWith("submit-")));for(const flag of ["archive_key_authenticated","nia_public_consent","edda_public_consent"])assert.equal(s.flags[flag],before.flags[flag]);
});
it("fails closed for ambiguous saved methods without refund or reference",()=>{
  const s=take(planned("technique-chrome-portable-label","chrome"),"prepare-technique-chrome-portable");const mixed={...s,flags:{...s.flags,technique_ghost:true,perk_ghost:true}};assert.equal(techniqueStat(mixed),undefined);assert.equal(techniqueResume(mixed),"act2_technique_bench");assert.ok(!options(mixed).some(c=>c.id.startsWith("submit-")));const modes={...s,flags:{...s.flags,technique_mode_counter:true}};assert.equal(techniqueMode(modes),undefined);assert.equal(take(modes,"abandon-technique").strain,s.strain);
});
it("keeps an unsupported recipient alteration held rather than inventing a person",()=>{
  let s=take(planned("technique-chrome-counter-invent","chrome"),"prepare-technique-chrome-counter");s=take(s,"reject-technique-chrome-invent");assert.equal(s.flags.technique_packet_held,true);assert.equal(s.flags.technique_review_reference,undefined);assert.equal(s.flags.technique_named_diagnostic,true);
});
it("screening preserves earlier signatures and hatch closure; deleting the return reference fails",()=>{
  let s=planned("technique-ghost-screened-reference","ghost");s={...s,flags:{...s.flags,technique_courier_signed:true}};s=take(s,"prepare-technique-ghost-screened");assert.equal(s.flags.district_public_review,true);assert.equal(s.flags.technique_courier_signed,true);s=take(s,"reject-technique-ghost-strip");assert.equal(s.flags.technique_failed,true);assert.equal(s.flags.technique_review_reference,undefined);
});
it("asks without spending and honors refusal without bypassing a denied introduction",()=>{
  let s=planned("technique-face-self-refusal","face");const before=s;s=take(s,"ask-technique-cosign");assert.equal(districtRemaining(s),2);assert.equal(s.creds,before.creds);assert.equal(s.flags.technique_work_waived,undefined);assert.ok(!options(s).some(c=>c.id==="prepare-technique-face-cosign"));assert.match(sceneText(getScene(s.sceneId),s),/doesn.t give you my agreement/);
  const valid=take(planned("technique-face-cosign-process","face"),"ask-technique-cosign");assert.ok(options(valid).some(c=>c.id==="prepare-technique-face-cosign"));for(const f of ["district_kerr_refused","kerr_route_denied"]) {const denied={...valid,flags:{...valid.flags,[f]:true}};assert.ok(!options(denied).some(c=>c.id==="prepare-technique-face-cosign"),f);}
});
it("retains the voluntary wage waiver after abandonment and refused scope",()=>{
  const s=take(take(planned("technique-face-cosign-process","face"),"ask-technique-cosign"),"prepare-technique-face-cosign");const closed=take(s,"abandon-technique");assert.equal(closed.flags.technique_work_waived,true);assert.ok(!options(closed).some(c=>["district-register-work","district-resume-work"].includes(c.id)));const refused=take(s,"reject-technique-face-truth");assert.equal(refused.flags.technique_truth_refused,true);assert.equal(refused.flags.technique_work_waived,true);assert.equal(refused.flags.technique_review_reference,undefined);
});
it("makes fast handover real in one action and recovery once-only; week closure retains intake",()=>{
  let s=planned("technique-nerve-fast-rest","nerve");const before=s;s=take(s,"prepare-technique-nerve-fast");assert.equal(districtRemaining(s),1);assert.equal(s.strain,before.strain+2);assert.equal(s.flags.technique_review_reference,true);const ended={...s,flags:{...s.flags,act2_done:true}};assert.equal(districtRemaining(ended),0);assert.ok(!options(ended).some(c=>c.id==="technique-harness-rest"));assert.equal(ended.flags.technique_review_reference,true);s=take(s,"technique-harness-rest");assert.equal(s.strain,before.strain+1);assert.equal(districtRemaining(s),0);assert.ok(!options(s).some(c=>c.id==="technique-harness-rest"));
});
it("keeps unfinished/wet slow handovers unreceived and preserves their effort",()=>{
  let s=take(planned("technique-nerve-supported-dry","nerve"),"prepare-technique-nerve-supported");assert.equal(s.strain,1);const ended={...s,flags:{...s.flags,act2_done:true}};assert.ok(!options(ended).some(c=>c.id.startsWith("submit-")));assert.equal(ended.flags.technique_review_reference,undefined);s=take(s,"reject-technique-nerve-wet");assert.equal(s.flags.technique_failed,true);assert.equal(s.strain,1);
});
it("keeps a free exit and viable no-kit paths at zero funds across every origin and strain cap",()=>{
  for(const stat of ["chrome","ghost","face","nerve"]as const)for(const origin of ["dustline","spire","gutterwire"]as const)for(const strain of [0,3,4,5]){
    const file={chrome:"technique-chrome-counter-label",ghost:"technique-ghost-signed-reference",face:"technique-face-self-process",nerve:"technique-nerve-direct-dry"}[stat];let s=planned(file,stat);s={...s,origin,strain,creds:0,items:[]};const mode={chrome:"counter",ghost:"signed",face:"self",nerve:"direct"}[stat];const prep=options(s).find(c=>c.id===`prepare-technique-${stat}-${mode}`)!;assert.equal(prep.enabled,stat!=="nerve"||strain<=3);if(prep.enabled){s=take(s,prep.id);assert.equal(s.creds,0);}s=take(s,"pause-technique");assert.ok(options(s).some(c=>c.id==="district-close"&&c.enabled));
  }
});

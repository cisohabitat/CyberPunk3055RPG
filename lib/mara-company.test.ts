import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {describe,it} from "node:test";
import {commitChoice,createCharacter,getScene,presentChoices,sceneText} from "./engine";
import {aftermath} from "./evidence";
import {characterConduct,relationshipCoda} from "./relationships";
import {maraCompanyRecord,maraCompanyReply} from "./mara-company";
import {objectives} from "./objectives";
import {sceneSoundPlan} from "./sound";
import {replayCampaign,type ReplaySpec} from "./story-replay";
import {exportRun,importRun} from "./vault";
import type {GameState} from "./types";
const invite=(creds=15,strain=0):GameState=>({...createCharacter({handle:"Rex",givenName:"Ada",origin:"dustline",bonus:{chrome:0,nerve:0,face:2,ghost:0}}),sceneId:"act2_mara_company",creds,strain,flags:{heard_memo:true,response_started:true,response_private_consent:true,response_question_done:true,mara_quiet_heard:true}});
function step(s:GameState,id:string){const c=presentChoices(s,getScene(s.sceneId)).find(c=>c.id===id&&c.enabled);assert.ok(c,`${s.sceneId}:${id}`);return commitChoice(s,c).state;}
const replay=(name:string)=>replayCampaign(JSON.parse(readFileSync(`qa/routes/mara-company-${name}.json`,'utf8')) as ReplaySpec).state;
describe("Mara’s company and dispatch are separate acts",()=>{
 it("charges one courier and retains the chosen shared hour across saves",()=>{
  const before=invite();let s=step(before,"stay-with-mara-courier");assert.equal(s.creds,0);assert.equal(s.strain,0);assert.equal(s.flags.response_sent,true);assert.equal(s.flags.response_received,undefined);assert.deepEqual(s.factions,before.factions);
  s=importRun(exportRun(s));assert.throws(()=>step({...s,sceneId:"act2_mara_company",creds:100},"stay-with-mara-courier"));
  s=step(s,"keep-mara-shared-hour");assert.equal(s.sceneId,"act2_response_receipt");assert.throws(()=>step({...s,sceneId:"act2_mara_company_kept"},"keep-mara-shared-hour"));assert.match(maraCompanyRecord(s)!,/fifteen creds.*stayed/);assert.equal(s.journal.find(j=>j.id==="mara-window-choice")?.kind,"fact");
 });
 it("zero credits allow walking, staying pending or honest refusal without a roll",()=>{
  assert.throws(()=>step(invite(0),"stay-with-mara-courier"));
  for(const id of ["carry-reply-leave-mara","stay-with-mara-wait","decline-mara-company"]){const before=invite(0,5);const s=step(before,id);assert.equal(s.creds,0);assert.equal(s.strain,5);assert.equal(s.rolls.length,0);assert.deepEqual(s.factions,before.factions);assert.equal(s.flags.nia_public_consent,undefined);assert.equal(s.flags.archive_key_authenticated,undefined);assert.equal(s.flags.witness_safe,undefined);}
  const walked=step(invite(0,2),"carry-reply-leave-mara");assert.equal(walked.strain,3);assert.equal(walked.flags.mara_company_kept,undefined);assert.match(maraCompanyReply(walked)!,/I wanted you here, too/);
 });
 it("company records no dispatch until an actual later trip, including after restore",()=>{
  let s=step(step(invite(0),"stay-with-mara-wait"),"keep-mara-shared-hour");s=importRun(exportRun(s));assert.equal(s.flags.response_sent,undefined);assert.match(maraCompanyReply(s)!,/envelope is still here/);assert.match(objectives(s).find(r=>r.id==="mara-response")!.detail,/Dispatch is open/);
  s=step(s,"hear-mara-response");assert.equal(s.sceneId,"act2_response_dispatch");assert.throws(()=>step(s,"share-mara-window"));s=step(s,"walk-private-response");assert.equal(s.flags.mara_company_waited,true);assert.equal(s.flags.mara_company_kept,true);assert.match(maraCompanyRecord(s)!,/dispatch afterward.*earlier wait/);assert.match(maraCompanyReply(s)!,/envelope went in the next batch/);s=step(s,"record-response-dispatch");s=step({...s,sceneId:"act3_arrival"},"visit-mara-response");assert.match(sceneText(getScene(s.sceneId),s),/next intake batch/);s=step(s,"read-response-intake");assert.match(s.journal.find(j=>j.id==="mara-response-intake")!.text,/next intake batch/);
 });
 it("declining company retains the separately authorized reply and original refusals",()=>{
  const before={...invite(),flags:{...invite().flags,response_public_refused:true,response_clinic_refused:true,betrayed_lumen:true}};const s=step(before,"decline-mara-company");assert.equal(s.sceneId,"act2_response_dispatch");assert.equal(s.flags.response_private_consent,true);assert.equal(s.flags.response_declined,undefined);assert.equal(s.flags.response_public_refused,true);assert.equal(s.flags.response_clinic_refused,true);assert.equal(s.flags.betrayed_lumen,true);assert.match(maraCompanyReply(s)!,/don't owe me company/);
 });
 it("requires private consent and blocks choosing a second company outcome",()=>{
  for(const id of ["stay-with-mara-courier","carry-reply-leave-mara","stay-with-mara-wait","decline-mara-company"]){assert.throws(()=>step({...invite(),flags:{response_started:true}},id));const s=step(invite(),id);for(const other of ["stay-with-mara-courier","carry-reply-leave-mara","stay-with-mara-wait","decline-mara-company"])assert.throws(()=>step({...s,sceneId:"act2_mara_company"},other));}
 });
 it("retains failure, private quotation and waiting in the complete scarce campaign",()=>{
  const s=importRun(exportRun(replay("scarce-stay")));assert.equal(s.creds,0);assert.equal(s.flags.witness_lost,true);assert.equal(s.flags.witness_relocated,true);assert.equal(s.flags.archive_key_authenticated,undefined);assert.equal(s.flags.nia_public_consent,undefined);assert.equal(s.flags.response_sent,undefined);assert.equal(objectives(s).find(r=>r.id==="mara-response")!.status,"Unresolved");assert.match(aftermath(s).find(r=>r.title==="Mara’s chosen hour")!.text,/No dispatch through you/);
 });
 it("full-campaign branches retain distinct personal replies and all four finale identities",()=>{
  const routes=["courier-stay","walk-leave","scarce-stay","decline-company"];const states=routes.map(replay);assert.equal(new Set(states.map(s=>s.sceneId)).size,4);assert.equal(new Set(states.map(s=>maraCompanyReply(s))).size,4);
  for(const s of states){assert.match(characterConduct(s,"Mara Voss")!,/hour/);assert.ok(relationshipCoda(s));assert.match(sceneText(getScene("act3_mara_followup"),s),/signed the old order/);assert.equal(s.flags.nia_public_consent,undefined);}
 });
 it("old private-response campaigns gain no company or source flag",()=>{
  const s=replayCampaign(JSON.parse(readFileSync('qa/routes/response-private-mara.json','utf8')) as ReplaySpec).state;assert.equal(maraCompanyRecord(s),undefined);assert.equal(maraCompanyReply(s),undefined);assert.match(relationshipCoda(s)!,/Mara’s cup and the morning/);
 });
 it("both new moments use the existing quiet score and clinic room texture",()=>{
  for(const sceneId of ["act2_mara_company","act2_mara_company_kept"])assert.deepEqual(sceneSoundPlan({...invite(),sceneId},getScene(sceneId).location,"The Week"),{mood:"quiet",district:"clinic"});
 });
});

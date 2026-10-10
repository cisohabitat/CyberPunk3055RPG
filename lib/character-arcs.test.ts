import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createCharacter, commitChoice, presentChoices, getScene, sceneText } from "./engine";
import { exportRun, importRun } from "./vault";
import { aftermath } from "./evidence";
import { characterConduct, relationshipCoda } from "./relationships";
import type { GameState } from "./types";
const base = (): GameState => ({ ...createCharacter({handle:"Rex",givenName:"Ada",origin:"dustline",bonus:{chrome:0,nerve:0,face:2,ghost:0}}),sceneId:"act2_middle",creds:15,strain:0,flags:{heard_memo:true} });
function step(s:GameState,id:string){const c=presentChoices(s,getScene(s.sceneId)).find(c=>c.id===id);assert.ok(c?.enabled,`${s.sceneId}:${id}`);return commitChoice(s,c).state}
function invite(){return step(step(base(),"hear-mara-response"),"listen-response-terms")}
describe("present-day Mara and Lumen agency",()=>{
 for(const [proposal,flag] of [["propose-public-response","response_public_refused"],["propose-clinic-endorsement","response_clinic_refused"]]) it(`keeps ${proposal} refusal independent of standing and revision`,()=>{
  let s=invite();s.factions.lumen=5;s=step(s,proposal);assert.equal(s.flags[flag],true);s=importRun(exportRun(s));assert.equal(s.flags.response_private_consent,undefined);
  s=step(s,"revise-private-response");assert.equal(s.flags[flag],true);assert.equal(s.flags.response_private_consent,true);assert.throws(()=>step(s,proposal));
  assert.equal(s.flags.nia_public_consent,undefined);assert.equal(s.flags.order_verified,undefined);
 });
 it("permits one quiet question, keeps current hopes attributed and does not invent treatment",()=>{
  for(const [ask,keep,id] of [["ask-mara-tomorrow","keep-mara-quiet-answer","mara-tomorrow"],["ask-lumen-staying","keep-lumen-quiet-answer","lumen-staying"]]){
   let s=step(invite(),"propose-private-response");s=step(s,ask);s=step(s,keep);assert.equal(s.journal.find(j=>j.id===id)?.kind,"claim");assert.throws(()=>step({...s,sceneId:"act2_response_terms"},ask));assert.equal(s.flags.order_verified,undefined);
  }
 });
 it("restores deferred terms and charges courier only once before receipt",()=>{
  let s=step(step(invite(),"propose-private-response"),"arrange-response-dispatch");assert.throws(()=>step({...s,creds:14},"courier-private-response"));
  s=importRun(exportRun(step(s,"defer-private-response")));s=step(s,"hear-mara-response");assert.equal(s.sceneId,"act2_response_dispatch");s=step(s,"courier-private-response");assert.equal(s.creds,0);assert.equal(s.flags.response_received,undefined);
  assert.throws(()=>step({...s,sceneId:"act2_response_dispatch"},"courier-private-response"));s=step(s,"record-response-dispatch");assert.throws(()=>step(s,"hear-mara-response"));
  s=step({...s,sceneId:"act3_arrival"},"visit-mara-response");s=step(s,"read-response-intake");assert.equal(s.flags.response_received,true);assert.match(sceneText(getScene(s.sceneId),s),/inquiry is still waiting/);s=step(s,"finish-mara-response");assert.throws(()=>step(s,"visit-mara-response"));
 });
 it("keeps refusal, withdrawal and declined requests out of completed-receipt prose",()=>{
  const variants=[step(step(base(),"hear-mara-response"),"decline-response-request"),step(step(invite(),"propose-public-response"),"withdraw-response-proposal"),step(invite(),"leave-response-agenda")];
  for(let s of variants){s=step({...s,sceneId:"act3_arrival"},"visit-mara-response");assert.throws(()=>step(s,"read-response-intake"));s=step(s,"keep-response-unfinished");assert.doesNotMatch(sceneText(getScene(s.sceneId),s),/survived the journey/);assert.equal(s.flags.response_received,undefined);}
 });
 it("offers zero-fund walking without a roll, evidence or public permission",()=>{
  let s=step(step(invite(),"propose-private-response"),"arrange-response-dispatch");s=step({...s,creds:0},"walk-private-response");assert.equal(s.strain,1);assert.equal(s.creds,0);assert.equal(s.rolls.length,0);assert.equal(s.flags.witness_safe,undefined);assert.equal(s.flags.nia_public_consent,undefined);
 });
 it("preserves earlier betrayal through present help and Lumen’s own contact limit",()=>{
  let s=step({...invite(),flags:{...invite().flags, betrayed_lumen:true}},"propose-private-response");s=step(s,"arrange-response-dispatch");s=step(s,"walk-private-response");s=step(s,"record-response-dispatch");s=step({...s,sceneId:"act3_arrival"},"visit-lumen-boundary");assert.match(sceneText(getScene(s.sceneId),s),/sold the week/);s=step(s,"respect-lumen-boundary");assert.equal(s.flags.betrayed_lumen,true);assert.equal(s.flags.lumen_contact_limited,true);assert.match(characterConduct(s,"Sister Lumen")!,/earlier betrayal/);assert.throws(()=>step(s,"visit-lumen-boundary"));
  const fake={...s,flags:{response_started:true,pact_fake:true,act1_both:true},sceneId:"act3_lumen_boundary"};assert.match(sceneText(getScene(fake.sceneId),fake),/promised to break/);
 });
 it("gives all four finales distinct character beats without changing historical evidence",()=>{
  const s={...base(),flags:{heard_memo:true,response_started:true,response_sent:true,response_received:true,mara_quiet_heard:true}};
  const codas=new Set<string>();for(const sceneId of ["ending_names","ending_quiet","ending_witness","ending_listed"]){codas.add(relationshipCoda({...s,sceneId})!);assert.match(aftermath({...s,sceneId}).find(r=>r.title==="Mara’s present-day reply")!.text,/unanswered queue.*does not clear/s)}assert.equal(codas.size,4);assert.equal(relationshipCoda(base()),undefined);
 });
});

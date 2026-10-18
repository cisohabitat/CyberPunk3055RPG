import { bindingHashBeforeMultiline } from "../qa/production/binding-history";
import { reviewedDeliveryHash } from "../qa/production/delivery-history";
import assert from "node:assert/strict";
import { it } from "node:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import phase from "../qa/media/consequence-media.json";
import bindings from "../qa/media/campaign-dialogue-bindings.json";
import authoring from "../qa/media/campaign-dialogue-lines.json";
import provenance from "../qa/media/campaign-dialogue-provenance.json";
import decisions from "../qa/media/scene-art.json";
import { sceneIllustration, portraitArt, ILLUSTRATION_STAGING } from "./art";
import { createCharacter, getScene, presentChoices, commitChoice, sceneText } from "./engine";
import { auditSceneArt } from "./scene-art";
import { SCENES } from "./story";
import { parseSave } from "./storage";
import type { GameState } from "./types";
const base = createCharacter({handle:"Review",givenName:"Jo",origin:"gutterwire",bonus:{chrome:0,nerve:2,face:0,ghost:0}});
const run = (sceneId:string,flags:Record<string,boolean>={}):GameState => ({...base,sceneId,flags});
const choose = (state:GameState,id:string,roll?:number) => {
  const choice=presentChoices(state,getScene(state.sceneId)).find(c=>c.id===id&&c.enabled);assert.ok(choice,id);
  return commitChoice(state,choice,choice.check?{roll:roll!}:undefined).state;
};
const sha=(path:string)=>createHash("sha256").update(readFileSync(new URL(`../${path}`,import.meta.url))).digest("hex");
const words=(text:string)=>text.toLowerCase().replace(/['’]/g,"").match(/[a-z0-9]+/g)??[];

it("shows repair detail only after committed repair, never for evacuation or an unobserved move",()=>{
  const before=run("act2_shelter_methods");
  assert.equal(sceneIllustration(before.sceneId,before.flags)?.src,"/art/shelter-pump.jpg");
  for(const repaired of [choose(before,"shelter-hire-fitter"),choose(before,"shelter-turn-valve",10)]){
    assert.equal(repaired.flags.shelter_restored,true);assert.equal(repaired.flags.shelter_reserved,undefined);
    assert.equal(sceneIllustration(repaired.sceneId,repaired.flags)?.src,"/art/shelter-restored.jpg");
    const residents=choose(repaired,"shelter-all-residents");assert.equal(residents.flags.shelter_reserved,undefined);
    const restored=parseSave(JSON.stringify(residents))!;
    assert.equal(sceneIllustration(restored.sceneId,restored.flags)?.src,"/art/shelter-restored.jpg");
  }
  const failed=choose(before,"shelter-turn-valve",1);assert.equal(failed.flags.shelter_restored,undefined);
  const hall=choose(choose(failed,"shelter-guide-hall"),"shelter-confirm-hall");
  assert.match(sceneText(getScene(hall.sceneId),hall),/still needs repair/);
  assert.notEqual(sceneIllustration(hall.sceneId,hall.flags)?.src,"/art/shelter-restored.jpg");
  for(const flag of ["shelter_declined","shelter_unobserved","shelter_hall","shelter_failed"])
    assert.notEqual(sceneIllustration("act2_shelter_result",{shelter_restored:true,[flag]:true})?.src,"/art/shelter-restored.jpg");
});

it("distinguishes confirmed stock receipt from intake, and late receipt supplies no pass or treatment",()=>{
  const intake=run("act2_freight_intake",{freight_at_intake:true});
  const left=choose(intake,"leave-freight-batch"),received=choose(intake,"acknowledge-freight-receipt");
  assert.equal(sceneIllustration(received.sceneId,received.flags)?.src,"/art/courier-receipt.jpg");
  assert.notEqual(sceneIllustration(left.sceneId,left.flags)?.src,"/art/courier-receipt.jpg");
  const late=choose({...left,sceneId:"act3_freight_query"},"record-freight-reply");
  assert.equal(late.flags.freight_late_received,true);assert.equal(late.flags.freight_clearance_earned,undefined);
  assert.equal(sceneIllustration(late.sceneId,late.flags)?.src,"/art/courier-receipt.jpg");
  assert.match(sceneText(getScene(late.sceneId),late),/No passenger clearance was earned/);
  assert.equal(sceneIllustration("act2_freight_result",{freight_delivered:true,freight_exposed:true})?.src,"/art/courier-receipt.jpg");
  for(const flags of [{freight_at_intake:true},{freight_unconfirmed:true},{freight_late_unknown:true},{freight_queried:true}])
    assert.notEqual(sceneIllustration("act3_freight_visit",flags)?.src,"/art/courier-receipt.jpg");
});

it("requires completed publication, keeps private sources closed and retains all finale illustrations",()=>{
  const draft=run("act3_testimony_record",{testimony_answered:true,testimony_bounded:true});
  assert.equal(sceneIllustration(draft.sceneId,draft.flags)?.src,"/art/sera-hearing.jpg");
  const filed=choose(draft,"file-public-account"),withdrawn=choose(draft,"withdraw-public-account");
  assert.equal(sceneIllustration(filed.sceneId,filed.flags)?.src,"/art/hearing-filed.jpg");
  assert.notEqual(sceneIllustration(withdrawn.sceneId,withdrawn.flags)?.src,"/art/hearing-filed.jpg");
  for(const flag of ["archive_key_authenticated","order_verified","nia_public_consent"])assert.equal(filed.flags[flag],undefined);
  assert.match(filed.journal.find(row=>row.id==="wall-account")!.text,/quotes none of her words/);
  for(const flags of [{testimony_answered:true},{testimony_published:true},{testimony_done:true,testimony_published:true,testimony_withdrawn:true}])
    assert.notEqual(sceneIllustration("act3_arrival",flags)?.src,"/art/hearing-filed.jpg");
  for(const id of ["ending_names","ending_quiet","ending_witness","ending_listed"])
    assert.ok(sceneIllustration(id,filed.flags)?.src.startsWith("/art/finale-"));
});

it("locks nine revised deliveries to unchanged actors, words and bindings and retains every other voice",()=>{
  assert.equal(phase.performances.length,9);assert.equal(bindingHashBeforeMultiline(),phase.bindingSha256);
  const changed=new Set(phase.performances.map(e=>e.id));
  for(const entry of phase.performances){
    const line=authoring.find(l=>l.id===entry.id)!,delivery=provenance.lines.find(l=>l.id===entry.id)!;
    assert.equal(line.text,entry.text);assert.equal(line.speaker,entry.speaker);assert.equal(delivery.voice,entry.voice);
    assert.equal(line.segments!.map(p=>p.text).join(" "),entry.text);assert.equal(sha(delivery.path),entry.sha256);
    assert.notEqual(entry.sha256,entry.previousSha256);assert.equal(entry.previousSha256,phase.precedingVoiceSha256[entry.id as keyof typeof phase.precedingVoiceSha256]);
    assert.deepEqual(words(entry.transcription.text),words(entry.text));assert.equal(entry.transcription.sha256,entry.sha256);
    assert.ok(Math.abs(entry.integratedLufs+20)<=.6);assert.ok(entry.truePeakDbtp<=-1.5);
    assert.deepEqual([...new Set(bindings.filter(b=>b.id===entry.id).map(b=>b.scene))].sort(),entry.scenes);
  }
  for(const [id,hash] of Object.entries(phase.precedingVoiceSha256))if(!changed.has(id))
    assert.equal(reviewedDeliveryHash(`public/audio/${id}.${id.startsWith("voice-campaign-")?"mp3":"wav"}`,hash),hash,id);
});

it("reviews explicit outcome-art rules and stages actual actors without erasing guarded conduct",()=>{
  assert.deepEqual(decisions.illustrationVariants,ILLUSTRATION_STAGING);
  // Keep the preceding three-rule review intact; visual-library.test.ts covers the additive cohort.
  assert.deepEqual(phase.illustrationVariants,ILLUSTRATION_STAGING.slice(0,phase.illustrationVariants.length));
  auditSceneArt(SCENES);
  const wrong=structuredClone(decisions);wrong.illustrationVariants[0].allFlags=["witness_safe"];
  assert.throws(()=>auditSceneArt(SCENES,wrong),/Conditional illustration catalog/);
  for(const p of phase.portraits)for(const scene of p.scenes){assert.equal(portraitArt(p.speaker,scene),p.asset);assert.notEqual(portraitArt("Mara",scene),p.asset);}
  assert.equal(portraitArt("Sister Lumen","act3_chapel_return",{betrayed_lumen:true,chapel_shift_kept:true}),"/art/lumen-guarded.jpg");
  assert.equal(portraitArt("Sister Lumen","act3_chapel_return",{response_clinic_refused:true}),"/art/lumen-guarded.jpg");
  assert.equal(portraitArt("Nia Pell","act3_testimony_nia"),"/art/nia-terms.jpg");
});

/** Matched full-route resource policy; no randomized/human play claim. */
import assert from 'node:assert/strict';
import{readFileSync,writeFileSync}from'node:fs';
import{replayCampaign,type ReplaySpec}from'../../lib/story-replay';
import{consequentialExposure,consequentialMethod}from'../../lib/consequential-methods';
import profiles from'../editorial/consequential-expansion-profiles.json';
const rows=profiles.map(p=>{const spec=JSON.parse(readFileSync(p.route,'utf8'))as ReplaySpec,control=JSON.parse(readFileSync(p.precedingRoute,'utf8'))as ReplaySpec;const after=replayCampaign(spec).state,before=replayCampaign(control).state;
 const compared=structuredClone(after);delete compared.flags.consequential_expansion_enabled;
 if(consequentialExposure(after)!==undefined)compared.journal=compared.journal.map(j=>j.id==='consequential-procedure'?before.journal.find(o=>o.id===j.id)!:j);
 assert.deepEqual(compared,before);assert.equal(after.sceneId,spec.expected.sceneId);assert.deepEqual(after.rolls,before.rolls);
 return{id:p.id,route:p.route,control:p.precedingRoute,visits:spec.steps.length+1,method:consequentialMethod(after),finale:after.sceneId,creds:after.creds,strain:after.strain,exposureAtCommit:consequentialExposure(after),finalStanding:after.factions.helion,paidShortTask:Boolean(after.flags.consequential_short_shift),refusedIntroduction:Boolean(after.flags.district_kerr_refused),inquiryClosed:Boolean(after.flags.edda_shift_cleared),sourceAuthenticated:Boolean(after.flags.archive_key_authenticated),witnessConsent:Boolean(after.flags.nia_public_consent)};});
const output=process.argv[2]??'/tmp/consequential-expansion-policy.json';writeFileSync(output,JSON.stringify({method:'Fourteen source-authored matched full routes with original dice and costs. Current corrected record compared with published-runtime controls. This is separate from five original randomized audits and from continuous browser evidence; no grading or human claim.',rows},null,2)+'\n');console.log(JSON.stringify({output,routes:rows.length,visits:rows.reduce((n,r)=>n+r.visits,0),finales:[...new Set(rows.map(r=>r.finale))].sort(),failures:0}));

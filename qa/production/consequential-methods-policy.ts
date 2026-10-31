/** Named authored-policy comparison, separate from the five original randomized audits. */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createCharacter, getScene, presentChoices, commitChoice } from '../../lib/engine';
import { districtRemaining } from '../../lib/district-response';
import { consequentialMethod } from '../../lib/consequential-methods';
import type { GameState } from '../../lib/types';
import type { ReplaySpec } from '../../lib/story-replay';
type Step = {scene:string;choice:string;creds:number;strain:number;remaining:number};
type PolicyRow = {stat:string;policy:string;source:string;visits:number;creds:number;strain:number;factions:GameState['factions'];reviewReference:boolean;publicSignature:boolean;probeOwned:boolean;finale:string;rolls:number[];trace:Step[]};
const rows:PolicyRow[]=[];
for(const stat of ['chrome','face'])for(const policy of ['two-step','express-stop','express-short','full-wage']){
 const path=`qa/${policy==='two-step'||policy==='full-wage'?'editorial/consequential-methods-controls':'routes/consequential-methods'}/${stat}-public-${policy==='express-short'?'work':'stop'}.json`;
 const spec=JSON.parse(readFileSync(path,'utf8')) as ReplaySpec;
 let s=createCharacter({...spec.character,consequentialMethods:policy!=='two-step'});let visits=1;const trace:Step[]=[];
 const act=(id:string,roll?:number)=>{const c=presentChoices(s,getScene(s.sceneId)).find(c=>c.id===id&&c.enabled);assert.ok(c,`${stat}/${policy}/${s.sceneId}/${id}`);const before=s;s=commitChoice(s,c,c.check?{roll:roll!}:undefined).state;visits++;trace.push({scene:before.sceneId,choice:id,creds:s.creds-before.creds,strain:s.strain-before.strain,remaining:districtRemaining(s)});};
 for(const a of spec.steps){
  if(policy==='full-wage'&&a.choiceId==='open-build-techniques'){act('district-register-work');act('district-finish-work');act('district-return-result');continue;}
  if(policy==='full-wage'&&(a.choiceId===`plan-technique-${stat}`||a.choiceId.startsWith(`prepare-technique-${stat}-`)||a.choiceId.startsWith(`submit-technique-${stat}-`)||a.choiceId==='leave-technique-result'))continue;
  act(a.choiceId,a.roll);
 }
 assert.equal(s.sceneId,spec.expected.sceneId);assert.equal(districtRemaining(s),0);assert.ok(s.strain>=0&&s.strain<=5);assert.ok(Object.values(s.factions).every(n=>n>=-3&&n<=5));
 assert.equal(Boolean(s.flags.consequential_short_shift),policy==='express-short');assert.equal(Boolean(s.flags.district_work_paid),policy==='full-wage');assert.equal(Boolean(consequentialMethod(s)),policy.startsWith('express'));
 rows.push({stat,policy,source:path,visits,creds:s.creds,strain:s.strain,factions:s.factions,reviewReference:Boolean(s.flags.technique_review_reference),publicSignature:Boolean(s.flags.consequential_face),probeOwned:s.items.includes('archive-probe'),finale:s.sceneId,rolls:s.rolls.map(r=>r.roll),trace});
}
for(const stat of ['chrome','face']){
 const own=rows.filter(r=>r.stat===stat),get=(p:string)=>own.find(r=>r.policy===p)!;
 assert.equal(get('express-short').creds-get('two-step').creds,8);assert.equal(get('full-wage').creds-get('two-step').creds,20);assert.equal(get('express-stop').creds,get('two-step').creds);
 assert.equal(get('express-short').strain-get('express-stop').strain,1);assert.ok(get('two-step').reviewReference);assert.equal(get('full-wage').reviewReference,false);
 for(const row of own)assert.deepEqual(row.rolls,get('two-step').rolls);
}
const out=process.argv[2]??'/tmp/consequential-methods-policy.json';writeFileSync(out,JSON.stringify({method:'Eight complete source-authored policies with fixed original rolls; not randomized balance, browser play, unfamiliar-player evidence or a grade. Full wages and bounded review compete within the original two-action window. Standing effects retain original caps; the public signature remains recorded even at the cap.',rows},null,2)+'\n');console.log(JSON.stringify({output:out,policies:rows.length,visits:rows.reduce((n,r)=>n+r.visits,0),failures:0}));

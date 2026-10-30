import {beginTechnique,canStartTechnique,finishTechnique,techniqueMode,techniqueStat} from './build-techniques';
import {districtRemaining} from './district-response';
import type {Choice,Effect,GameState} from './types';
export const ROUTING_QUOTES={
 terms:'Most of my shift is finding where these came from. Leave me a way to send this one back.',
 read:'The desk needs a return code. It does not need somebody else\'s name.',
 prepare:'You can sign for yourself. If you screen the outside, leave the desk its way back.',
 route:'The lit counter is still open. The old hatch is not another way in.',
 accepted:'I can route this. What the review decides is still their work.',
 held:'I have to hold it here. I cannot give you the counter\'s reference.',
 kept:'I knew whose table it could come back to. That mattered to me.',
 failed:'I kept it on the held shelf. I will not call that the same as getting it through.',
 closed:'You told me where you stopped. I can work with an honest stop.',
 unfinished:'I remember the plan. I have no finished packet from it.',
}as const;
export const ROUTING_RECORDS={
 offer:'The Dispatcher asked for a procedural packet with a usable depot return path. Hearing the request spends no depot action and supplies no review reference.',
 agreement:'You agreed to inspect the return path before routing the bounded packet. Preparation and submission each use one existing depot action; conversation, inspection, pause and cancellation are free.',
 stub:'The inner return stub says DEPOT REVIEW. It identifies the public review desk. It contains no recipient name or home address.',
 tag:'The outer courier tag records the courier, not the receiving desk. Your own signature can remain, or your owned Route Shroud can screen this outer tag without removing the inner return stub.',
 hatch:'The old side hatch is closed. The lit public counter accepts this bounded packet by its depot return code; screening changes no hatch restriction.',
 accepted:'The bounded packet kept its depot return stub and reached the lit public counter. A review reference confirms intake only; the correction, historical source and witness permissions keep their separate status.',
 held:'The new routing attempt ended with a held packet and no review reference. Its committed depot actions, effort and courier trace remain. It supplied no historical source or witness permission.',
 declined:'You declined the Dispatcher\'s routing invitation before agreeing. No action or effort was spent; the original specialist methods remained available.',
 closed:'You closed the routing plan and told the Dispatcher where you stopped. Any already committed actions, effort and courier trace remain; no submission or review reference was claimed.',
}as const;
export const ROUTING_SCENES=['act2_return_routing_terms','act2_return_routing_read','act2_return_routing_prepare','act2_return_routing_route','act2_return_routing_result','act3_return_routing_return']as const;
const has=(s:GameState,id:string,text:string,kind='fact')=>s.journal.some(j=>j.id===id&&j.kind===kind&&j.text===text);
const offered=(s:GameState)=>Boolean(s.flags.return_routing_enabled&&s.flags.routing_offered&&has(s,'return-routing-offer',ROUTING_RECORDS.offer));
export const routingAgreed=(s:GameState)=>Boolean(offered(s)&&s.flags.routing_agreed&&!s.flags.routing_declined&&has(s,'return-routing-agreement',ROUTING_RECORDS.agreement,'promise'));
export const routingRead=(s:GameState)=>Boolean(routingAgreed(s)&&(['stub','tag','hatch']as const).every(k=>s.flags[`routing_read_${k}`]&&has(s,`return-routing-${k}`,ROUTING_RECORDS[k])));
const weekClosed=(s:GameState)=>Boolean(s.flags.act2_done||s.sceneId.startsWith('act3_')||s.sceneId.startsWith('ending_'));
const live=(s:GameState)=>!weekClosed(s)&&s.flags.district_query_sent&&!s.flags.district_window_closed;
export function routingPreparationRecord(mode:string){return mode==='screened'?'You spent one depot action and one strain screening only the outer courier tag with your owned Route Shroud. The inner depot return stub stays readable; the shroud remains owned and older traces remain.':'You spent one depot action preparing the handoff under your own courier signature. No strain or money was charged; the inner depot return stub stays readable and your new signature remains.';}
export function routingPrepared(s:GameState){const mode=techniqueMode(s);return Boolean(routingRead(s)&&s.flags.routing_prepared&&s.flags.technique_started&&s.flags.perk_ghost&&techniqueStat(s)==='ghost'&&['signed','screened'].includes(mode??'')&&(mode!=='screened'||s.items.includes('route-shroud'))&&has(s,'return-routing-preparation',routingPreparationRecord(mode!)));}
export function routingOutcome(s:GameState):'kept'|'failed'|'closed'|'unfinished'|undefined{
 if(!offered(s))return;const f=s.flags;
 if([f.routing_accepted,f.routing_held,f.routing_closed,f.routing_declined].filter(Boolean).length>1)return;
 if(f.routing_prepared&&!routingPrepared(s))return;
 if(f.routing_accepted)return routingPrepared(s)&&f.technique_complete&&f.technique_review_reference&&!f.technique_failed&&has(s,'return-routing-result',ROUTING_RECORDS.accepted)?'kept':undefined;
 if(f.routing_held)return routingPrepared(s)&&f.technique_failed&&!f.technique_review_reference&&has(s,'return-routing-result',ROUTING_RECORDS.held)?'failed':undefined;
 if(f.routing_closed)return routingAgreed(s)&&!f.technique_complete&&!f.technique_failed&&(!f.routing_prepared||f.technique_closed)&&has(s,'return-routing-closed',ROUTING_RECORDS.closed)?'closed':undefined;
 if(f.routing_declined)return !f.routing_agreed&&!f.routing_prepared&&has(s,'return-routing-declined',ROUTING_RECORDS.declined)?'closed':undefined;
 if(routingAgreed(s)&&!f.technique_complete&&!f.technique_failed&&!f.technique_closed)return 'unfinished';
}
export function routingPrepare(s:GameState,mode:'signed'|'screened'):Effect{return beginTechnique(s,'ghost',mode,{...(mode==='screened'?{strain:1}:{}),flags:['routing_prepared',mode==='screened'?'technique_screened':'technique_courier_signed'],journal:[{id:'return-routing-preparation',kind:'fact',text:routingPreparationRecord(mode)}]});}
export function routingSubmit(s:GameState,accepted:boolean):Effect{const effect=finishTechnique(s,accepted);return {...effect,flags:[...effect.flags!,accepted?'routing_accepted':'routing_held'],journal:[...effect.journal!,{id:'return-routing-result',kind:'fact',text:accepted?ROUTING_RECORDS.accepted:ROUTING_RECORDS.held}]};}
export function routingClose(s:GameState):Effect{return {flags:['routing_closed',...(routingPrepared(s)?['technique_closed']:[])],journal:[{id:'return-routing-closed',kind:'fact',text:ROUTING_RECORDS.closed}]};}
export function routingReturn(s:GameState):Effect{const outcome=routingOutcome(s);return outcome&&weekClosed(s)&&!s.flags.routing_return_seen?{flags:['routing_return_seen'],journal:[{id:'return-routing-moment',kind:'claim',text:`The Dispatcher said: "${ROUTING_QUOTES[outcome]}" This personal response grants no review finding, source authentication or witness permission.`}]}:{};}
export function routingSceneAvailable(s:GameState,id:string){if(!(ROUTING_SCENES as readonly string[]).includes(id)||!offered(s))return false;const outcome=routingOutcome(s);
 if(id==='act3_return_routing_return')return Boolean(weekClosed(s)&&outcome&&!s.flags.routing_return_seen);
 if(!live(s)||!s.flags.perk_ghost)return false;
 if(id==='act2_return_routing_result')return outcome==='kept'||outcome==='failed';
 if(outcome!=='unfinished'&&id!=='act2_return_routing_terms')return false;
 if(id==='act2_return_routing_terms')return !s.flags.routing_agreed&&!s.flags.routing_declined&&!s.flags.routing_closed&&!s.flags.routing_accepted&&!s.flags.routing_held&&!s.flags.routing_prepared&&canStartTechnique(s);
 if(id==='act2_return_routing_route')return routingPrepared(s)&&!s.flags.technique_closed;
 return routingAgreed(s)&&!s.flags.routing_prepared&&!s.flags.technique_started&&(id!=='act2_return_routing_prepare'||routingRead(s));
}
function resume(s:GameState){return routingPrepared(s)?'act2_return_routing_route':routingRead(s)?'act2_return_routing_prepare':'act2_return_routing_read';}
export function returnRoutingChoices(s:GameState,id:string,choices:Choice[]):Choice[]{
 if((ROUTING_SCENES as readonly string[]).includes(id)){
  if(!routingSceneAvailable(s,id))return [{id:'routing-unavailable-exit',label:'Return with the actual packet record unchanged.',next:weekClosed(s)?'act3_neighborhood':'act2_district_canal'}];
  return choices.filter(c=>!c.id.startsWith('routing-prepare-')? !c.id.startsWith('routing-submit-')||routingPrepared(s)&&districtRemaining(s)>=1 :canStartTechnique(s)&&routingRead(s));
 }
 let out=choices;
 const pending=routingAgreed(s)&&routingOutcome(s)==='unfinished'&&live(s);
 if(pending&&id.startsWith('act2_technique_'))out=out.filter(c=>!/^plan-technique-|^prepare-technique-|^submit-technique-|^reject-technique-/.test(c.id));
 if(pending&&id==='act2_district_canal')out=out.filter(c=>c.id!=='resume-build-technique'&&c.id!=='open-build-techniques');
 if(pending&&['act2_district_canal','act2_technique_ghost'].includes(id))out=[...out,{id:'routing-resume',label:'Return to the routing plan you agreed with the Dispatcher.',detail:'Keep the inspected fields and actual committed actions, effort and courier trace.',next:resume(s)}];
 if(s.flags.return_routing_enabled&&s.flags.perk_ghost&&!s.flags.routing_offered&&canStartTechnique(s)&&id==='act2_technique_ghost')out=[...out,{id:'routing-open',label:'Ask the Dispatcher where this packet has to come back.',detail:'Free conversation and inspection. The original filing method remains available if you decline.',effects:{flags:['routing_offered'],journal:[{id:'return-routing-offer',kind:'fact',text:ROUTING_RECORDS.offer}]},next:'act2_return_routing_terms'}];
 if(id==='act3_neighborhood'&&weekClosed(s)&&routingOutcome(s)&&!s.flags.routing_return_seen)out=[...out,{id:'routing-ask-return',label:'Ask the Dispatcher about the packet you planned to route.',detail:'Hear a personal response; no new review decision or source permission.',next:'act3_return_routing_return'}];
 return out;
}
export function routingFinale(s:GameState,text:string,finale:boolean|undefined){const outcome=routingOutcome(s);if(!finale||!weekClosed(s)||!outcome||!s.flags.routing_return_seen||!has(s,'return-routing-moment',`The Dispatcher said: "${ROUTING_QUOTES[outcome]}" This personal response grants no review finding, source authentication or witness permission.`,'claim'))return text;
 const memory=outcome==='kept'?'At the wall, you remember the return stub you left readable and the Dispatcher knowing whose table it could come back to. Intake remains separate from the review finding.':outcome==='failed'?'At the wall, you remember the held shelf and the Dispatcher refusing to call it a completed route. Its spent effort remains.':outcome==='closed'?'At the wall, you remember telling the Dispatcher where you stopped. No finished packet stands in for that honest stop.':'At the wall, you remember the route left open on the filing table. No review reference was invented to finish it.';
 const i=text.lastIndexOf('\n\n"');return i<0?`${text}\n\n${memory}`:`${text.slice(0,i)}\n\n${memory}${text.slice(i)}`;
}

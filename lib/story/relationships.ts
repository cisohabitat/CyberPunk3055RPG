import { kerrMethodResponse } from "../encounter-methods";
import { kitBonuses } from "../loadout";
import { routeDeparture, routeOutcome, routePlan, routeResume, ROUTE_DRAFT_FLAGS, ROUTE_ENTRIES, ROUTE_EXITS } from "../route-planning";
import type { Choice, GameState, Scene, StatId } from "../types";

function approach(id: string, stat: StatId, label: string, required: string, success: string, failure: string, logsFailure = false): Choice {
  return { id, label, requireFlag: required, hideIfAnyFlag: ["kerr_route_collected", "kerr_route_failed", "kerr_route_done"],
    check: { stat, dc: 8, label, itemBonuses: kitBonuses(stat), ...(stat === "face" ? { flagBonuses: [{ flag: "kerr_route_intro", amount: 2, label: "Quill’s depot introduction" }] } : {}) },
    successEffects: { flags: ["kerr_route_collected", `kerr_route_${stat}`] },
    failEffects: { strain: 1, flags: ["kerr_route_failed", ...(logsFailure ? ["kerr_route_trace"] : [])] },
    resultSuccess: success, resultFail: failure, nextSuccess: "act2_route_receipt", nextFail: "act2_route_recovery" };
}

export function kerrVisitChoice(): Choice {
  return { id: "visit-kerr-collection", label: "Hear Kerr’s response to the collection.", requireAnyFlag: ["kerr_route_promised", "kerr_route_declined"], hideIfFlag: "kerr_route_visit", next: "act3_kerr_collection" };
}
export function quillVisitChoice(): Choice {
  return { id: "visit-quill-introduction", label: "Return to Quill about his introduction.", requireAnyFlag: ["kerr_route_intro", "quill_repaid_late"], hideIfFlag: "quill_route_visit", next: "act3_quill_introduction" };
}
export function kerrQuestionChoice(): Choice {
  return { id: "ask-kerr-personal-question", label: "Use the one question Kerr left open.", requireFlag: "kerr_contact_open", hideIfAnyFlag: ["kerr_question_done", "kerr_route_denied"], next: "act3_kerr_personal_question" };
}

export const RELATIONSHIP_SCENES: Record<string, Scene> = {
  act2_kerr_collection_terms: {
    id: "act2_kerr_collection_terms", location: "Ward Four stall", speaker: "Kerr",
    text: (state) => `${state.flags.kerr_sold_you ? "Kerr puts his own depot slip on the table. He sold your account upstairs; asking for help does not take that back." : state.flags.kerr_week_paid ? "Kerr separates the depot slip from the receipt for the forty creds you paid him. 'This isn't another collection from you.'" : "Kerr rests a depot slip beneath his cup. The old knee brace has a split strap."}\n\n"They have my replacement at the canal depot. Unpowered, no miracle in it. I want the case, not a treatment report. Their free courier gate writes the recipient into the shift register. If you promise to keep my name out, don't save your fare by putting it in."\n\nYou can agree to private collection, ask him to accept registration, or decline before making a promise. Quill knows the depot counter; his introduction can help negotiation. This errand concerns Kerr’s case, not your evidence packet.`,
    choices: [
      { id: "ask-quill-introduction", label: "Ask Quill for a depot introduction.", hideIfFlag: "kerr_route_intro", next: "act2_quill_introduction" },
      { id: "promise-private-collection", label: "Promise a collection without a recipient register.", detail: "Registered entry or recovery can break these terms. Planning itself costs nothing.", effects: { flags: ["kerr_route_promised", "kerr_route_private"], journal: [{ id: "kerr-collection-promise", kind: "promise", text: "You promised to collect Kerr's own unpowered brace without entering him on the depot recipient register. Delivery and treatment are separate outcomes." }] }, next: "act2_route_map" },
      { id: "agree-registered-collection", label: "Ask Kerr to accept a registered collection. He agrees.", detail: "The depot may retain your handle and Kerr’s recipient name. No clinic room or witness address.", effects: { flags: ["kerr_route_promised", "kerr_route_registered"], journal: [{ id: "kerr-collection-promise", kind: "promise", text: "Kerr agreed to collection that may register the runner's handle and his recipient name. Receipt still needs to be observed; the equipment supplies no treatment outcome." }] }, next: "act2_route_map" },
      { id: "decline-kerr-collection", label: "Decline. Do not make a promise you cannot keep.", effects: { flags: ["kerr_route_declined"] }, next: "act2_middle" },
    ],
  },
  act2_quill_introduction: {
    id: "act2_quill_introduction", location: "Ward Four stall", speaker: "Quill",
    text: (state) => `${state.flags.quill_repaid_late ? "Quill leaves both receipts on the counter: the postponed tab and its later forty-creds payment. 'Paid now. Late then. Both fit on the page.'" : state.flags.quill_refused ? "Quill taps the tab you postponed. 'An introduction asks somebody else to believe my word about yours. Clear the forty first, or use the map without me.'" : state.flags.quill_collected ? "Quill moves your paid tab away from the depot paper. 'This is an introduction, not another invoice.'" : "Quill tears a strip from an unused order pad. 'I know who works the depot counter.'"}\n\nHe will introduce you to the counter steward. It adds two to a Face negotiation, not to machines, patrol timing or carrying weight. He cannot promise delivery, an empty register or a repaired knee.`,
    choices: [
      { id: "repay-quill-late", label: "Pay the postponed forty-creds tab now.", detail: "Record a late repayment. The original refusal and its strain remain.", requireFlag: "quill_refused", hideIfFlag: "quill_repaid_late", requireCreds: 40, effects: { creds: -40, flags: ["quill_repaid_late"], factions: { quill: 1 }, journal: [{ id: "quill-late-payment", kind: "fact", text: "You repaid forty creds after postponing Quill's tab. The earlier refusal, interest and strain were not erased." }] }, next: "act2_quill_introduction" },
      { id: "take-quill-introduction", label: "Take the introduction on its actual terms.", hideIfAnyFlag: ["quill_refused", "kerr_route_intro"], effects: { flags: ["kerr_route_intro"] }, next: "act2_kerr_collection_terms" },
      { id: "take-repaid-introduction", label: "Take the introduction after repayment.", requireAllFlags: ["quill_refused", "quill_repaid_late"], hideIfFlag: "kerr_route_intro", effects: { flags: ["kerr_route_intro"] }, next: "act2_kerr_collection_terms" },
      { id: "leave-quill-introduction", label: "Use the map without his recommendation.", next: "act2_kerr_collection_terms" },
    ],
  },
  act2_route_map: {
    id: "act2_route_map", location: "Canal dispatch alcove",
    text: "The depot has three entrances. The map is a working transit diagram, not a claim that any route is safe. Pick an entry, then an exit.\n\nCoins buy the lift without a name. Stairs ask your legs for payment. The free courier gate asks for a recipient. Planning changes no register and spends nothing; departure makes those costs real.",
    choices: [
      ...ROUTE_ENTRIES.map((entry): Choice => ({ id: `route-entry-${entry.id}`, label: `Plan ${entry.title.toLowerCase()}.`, detail: entry.detail, hideIfFlag: "kerr_route_started", effects: { flags: [`kerr_entry_${entry.id}`], flagsOff: ROUTE_DRAFT_FLAGS.filter((flag) => flag !== `kerr_entry_${entry.id}`) }, next: "act2_route_exit" })),
      { id: "pause-kerr-plan", label: "Pause planning. Keep the collection promise open.", next: "act2_middle" },
    ],
  },
  act2_route_exit: {
    id: "act2_route_exit", location: "Canal dispatch alcove",
    text: "Now choose how to leave the depot with the case. The sensor ramp suits a machine approach, the patrol gap suits timing, and the maintenance stairs suit carrying weight. Negotiation is available at the counter on any plan.\n\nAn anonymous exit cannot erase a name already recorded at entry. A failed sensor or counter approach also records Kerr as the recipient; missing the patrol or failing to carry the case leaves it held without a new entry.",
    choices: [
      ...ROUTE_EXITS.map((exit): Choice => ({ id: `route-exit-${exit.id}`, label: `Plan the ${exit.title.toLowerCase()}.`, detail: exit.detail, hideIfFlag: "kerr_route_started", effects: { flags: [`kerr_exit_${exit.id}`, "kerr_route_ready"], flagsOff: ROUTE_EXITS.filter((other) => other.id !== exit.id).map(({ id }) => `kerr_exit_${id}`) }, next: "act2_route_review" })),
      { id: "replan-kerr-entry", label: "Choose the entry again.", hideIfFlag: "kerr_route_started", effects: { flagsOff: ROUTE_DRAFT_FLAGS }, next: "act2_route_map" },
      { id: "pause-kerr-exit", label: "Pause with this entry saved.", next: "act2_middle" },
    ],
  },
  act2_route_review: {
    id: "act2_route_review", location: "Canal dispatch alcove",
    text: (state) => { const plan = routePlan(state); return `${plan.entry?.title ?? "Entry missing"} → ${plan.exit?.title ?? "Exit missing"}. Departure costs ${plan.creds} creds and adds ${plan.strain} strain before the approach roll.\n\n${plan.entry?.registered ? state.flags.kerr_route_private ? "This entry WILL break the private terms: your handle and Kerr's recipient name enter the register before the exit attempt." : "Kerr accepted this recipient registration before collection." : "Entry uses no recipient register. A failed sensor or negotiation attempt can still add one."}\n\nRebuild freely, or depart and commit the fare and effort once. Collect the case, then bring it to Kerr.`; },
    choices: [
      { id: "depart-kerr-lift", label: "Pay ten creds and depart on the planned lift route.", requireAllFlags: ["kerr_route_ready", "kerr_entry_lift"], hideIfFlag: "kerr_route_started", requireCreds: 10, effects: routeDeparture, next: "act2_route_crossing" },
      { id: "depart-kerr-foot", label: "Depart on the planned entry without a fare.", requireFlag: "kerr_route_ready", requireAnyFlag: ["kerr_entry_stairs", "kerr_entry_gate"], hideIfFlag: "kerr_route_started", effects: routeDeparture, next: "act2_route_crossing" },
      { id: "reset-kerr-route", label: "Clear the draft and rebuild the route.", hideIfFlag: "kerr_route_started", effects: { flagsOff: ROUTE_DRAFT_FLAGS }, next: "act2_route_map" },
      { id: "pause-kerr-route", label: "Pause with both crossings saved.", next: "act2_middle" },
    ],
  },
  act2_route_crossing: {
    id: "act2_route_crossing", location: "Canal dispatch alcove",
    text: (state) => `The depot steward sets the closed canvas case behind the shutter. No medicine, recorder or witness file is inside.\n\n${state.flags.kerr_route_trace ? "The courier entry already has your handle and Kerr as recipient. A private exit cannot remove it." : "The entry used no recipient register. Keep the next approach's limits in mind."}\n\nChoose the approach your exit prepared, or negotiate at the counter. A failed approach is final for this attempt; recovery can arrange a registered courier or leave the case held.`,
    choices: [
      { id: "compare-depot-handling", label: "Compare a borrowed rig with a work-for-release bargain.", hideIfAnyFlag: ["kerr_route_collected", "kerr_route_failed", "kerr_route_done"], next: "act2_route_handling" },
      approach("route-use-sensor", "chrome", "Keep the ramp’s recipient field empty.", "kerr_exit_ramp", "The ramp accepts the anonymous case token. You collect the closed case without a new recipient entry; any entry-gate registration remains.", "The ramp locks. Its failed-release docket records your handle and Kerr as recipient; the case remains held.", true),
      approach("route-use-gap", "ghost", "Wait for the patrol gap and collect the case.", "kerr_exit_gap", "You collect the closed case between patrol passes. No new recipient entry is made; any entry-gate registration remains.", "The patrol doubles back before collection. The case remains held; no new recipient entry is made."),
      approach("route-use-stairs", "nerve", "Carry the case through the maintenance stairs.", "kerr_exit_walk", "You carry the closed case down the maintenance steps. No new recipient entry is made; any entry-gate registration remains.", "The load catches against the rail. You return it to the holding shelf; no new recipient entry is made."),
      approach("route-negotiate", "face", "Negotiate an anonymous release at the counter.", "kerr_route_started", "The steward accepts responsibility for an anonymous case token. You collect it without a new recipient entry; any entry-gate registration remains.", "The steward refuses the anonymous release and writes your handle and Kerr as recipient on the failed-release docket. The case remains held.", true),
    ],
  },
  act2_route_recovery: {
    id: "act2_route_recovery", location: "Canal dispatch alcove",
    text: (state) => `The closed case is back on its shelf. No second approach roll can make the first attempt disappear.\n\n${state.flags.kerr_route_trace ? "Your handle and Kerr's recipient name are already in the register." : "The failed approach made no recipient entry."}\n\nA twenty-creds courier can bring it to the stall while you accompany the handover. That service records both your handle and Kerr as recipient. If you promised private collection, this is a breach, even if the case arrives. You can also leave it held and record the unfinished promise.`,
    choices: [
      { id: "fund-kerr-courier", label: "Pay twenty creds for a registered courier.", detail: "Observe receipt next. Recipient registration remains; private terms are broken.", requireCreds: 20, hideIfAnyFlag: ["kerr_route_collected", "kerr_route_done"], effects: { creds: -20, flags: ["kerr_route_trace", "kerr_route_collected", "kerr_route_courier"] }, next: "act2_route_receipt" },
      { id: "leave-kerr-case-held", label: "Leave the case held. Record collection as unresolved.", effects: { flags: ["kerr_route_done", "kerr_route_unresolved"], journal: [{ id: "kerr-collection-outcome", kind: "fact", text: "After the failed collection attempt, the brace remained held at the depot. Kerr had not received it. Any existing recipient registration remains." }] }, next: "act2_middle" },
    ],
  },
  act2_route_receipt: {
    id: "act2_route_receipt", location: "Ward Four stall", speaker: "Kerr",
    text: (state) => `Kerr checks the case tag, then rests his hand on the closed strap. ${state.flags.kerr_route_courier ? "The courier waits while you observe the handover." : "You carried the case from the depot; receipt is the separate part of the promise."}\n\n${state.flags.kerr_route_trace ? state.flags.kerr_route_private ? "'You brought the case. You also put my name in their register after promising not to. Those aren't the same line.'" : "'We agreed they could register it. Leave that on the receipt.'" : "'No recipient entry. That was the part I asked you to keep.'"}\n\n${kerrMethodResponse({ ...state, flags: { ...state.flags, ...(state.flags.kerr_method_rig ? { kerr_rig_returned: true } : {}) } })}\n\nThe case stays closed. You observed a handover, not treatment.`,
    choices: [{ id: "record-kerr-receipt", label: "Record the observed handover and its actual terms.", effects: (state) => ({ creds: state.flags.kerr_method_rig && !state.flags.kerr_rig_returned ? 20 : 0, flags: ["kerr_route_done", "kerr_route_delivered", ...(state.flags.kerr_method_rig ? ["kerr_rig_returned"] : [])], journal: [{ id: "kerr-collection-outcome", kind: "fact", text: `Kerr received his closed brace case.${state.flags.kerr_route_trace ? state.flags.kerr_route_private ? " The depot recipient register broke the promised private terms." : " Recipient registration had been agreed before collection." : " No depot recipient entry was made."} No fitting, treatment result, historical evidence or witness permission was supplied.` }] }), next: "act2_middle" }],
  },
  act3_kerr_collection: {
    id: "act3_kerr_collection", location: "Ward Nine stall", speaker: "Kerr",
    text: (state) => `${state.flags.kerr_route_delivered ? "Kerr sets the received case beside the bench, still closed. He gives you no treatment report." : state.flags.kerr_route_declined ? "Kerr has the depot slip you declined. There is no handover to record." : "Kerr leaves the depot slip unfolded. You have no completed handover to show him."}

${state.flags.kerr_route_private && state.flags.kerr_route_trace ? "He puts the recipient docket beside your promise. ‘You wrote my name after promising not to. Don't call this private.’" : state.flags.kerr_route_delivered ? state.flags.kerr_route_trace ? "‘The register was part of our agreement,’ he says. ‘Leave it on the receipt.’" : "‘No recipient entry,’ he says. ‘That was the part I asked you to keep.’" : state.flags.kerr_route_declined ? "‘You said no before I counted on it. I can work with a no.’" : "‘Tell the wall you left it open. I don't need a finished job invented on the way down.’"}

${state.flags.kerr_sold_you ? "You remind him that he sold your account. ‘That stays on my side of the page.’ His request does not cancel the betrayal." : "He shifts the cup away from the papers. ‘The terms arrive with the case.’"}\n\n${kerrMethodResponse(state)}`,
    choices: [
      { id: "answer-kerr-breach", label: "Answer the broken private terms directly.", requireAllFlags: ["kerr_route_private", "kerr_route_trace"], next: "act3_kerr_collection_response" },
      { id: "acknowledge-kerr-collection", label: "Keep the receipt and the limits in his own words.", detail: "Kerr leaves one personal question open. No new favor or contract.", hideIfAnyFlag: ["kerr_route_private"], effects: { flags: ["kerr_route_visit", "kerr_contact_open"] }, next: "act3_arrival" },
      { id: "acknowledge-private-collection", label: "Keep the receipt and the limits in his own words.", detail: "Kerr leaves one personal question open. No new favor or contract.", requireFlag: "kerr_route_private", hideIfFlag: "kerr_route_trace", effects: { flags: ["kerr_route_visit", "kerr_contact_open"] }, next: "act3_arrival" },
    ],
  },
  act3_kerr_collection_response: {
    id: "act3_kerr_collection_response", location: "Ward Nine stall", speaker: "Kerr",
    text: "Kerr folds the register copy without tearing it.\n\n'You can't unwrite the depot. You can stop asking me to pretend you kept the private part. Tell me what you'll put beside that promise.'\n\nAcknowledging the breach can leave a limited future contact through the stall. Denying the recorded entry closes that contact. Neither answer deletes the trace or grants a new favor.",
    choices: [
      { id: "acknowledge-kerr-disclosure", label: "Acknowledge the broken terms. Keep the docket attached.", effects: { flags: ["kerr_route_visit", "kerr_route_acknowledged", "kerr_contact_open"], journal: [{ id: "kerr-collection-response", kind: "fact", text: "You acknowledged breaking the private-collection terms. Kerr permits one future question through the stall, with the option to decline. Recipient registration remains; no new favor or forgiveness was granted." }] }, next: "act3_arrival" },
      { id: "deny-kerr-disclosure", label: "Insist the register does not break my promise.", detail: "Kerr closes further contact through you. The register and first promise remain.", effects: { flags: ["kerr_route_visit", "kerr_route_denied"], journal: [{ id: "kerr-collection-response", kind: "fact", text: "You denied that recipient registration broke the private promise. Kerr closed future contact through you. The original promise, actual collection outcome and register entry remain recorded." }] }, next: "act3_arrival" },
    ],
  },
  act3_kerr_personal_question: {
    id: "act3_kerr_personal_question", location: "Ward Nine stall", speaker: "Kerr",
    text: (state) => `You ask what he wants the brace to make possible. Kerr watches somebody carry a bowl from the counter to the window.\n\n'One walk without counting the steps first. Not another door to stand in. Just the table where the rain doesn't land in the soup.'\n\n${state.flags.kerr_route_delivered ? "He leaves the received case closed beside the bench." : "He rubs the split strap of his old brace. The replacement is still at the depot."} It is a hoped-for walk. He gives you no fitting or treatment report; the old contracts still stand.`,
    choices: [{ id: "keep-kerr-personal-answer", label: "Keep the small answer without turning it into a favor.", effects: { flags: ["kerr_question_done"], journal: [{ id: "kerr-personal-answer", kind: "claim", text: "Kerr says he hopes to walk to a table without counting the steps. The brace has not been fitted or tested; this personal answer supplied no favor, evidence or treatment result." }] }, next: "act3_arrival" }],
  },
  act3_quill_introduction: {
    id: "act3_quill_introduction", location: "Ward Four stall", speaker: "Quill",
    text: (state) => `${state.flags.quill_repaid_late ? "Quill keeps the late forty-creds payment beside the old postponement. 'I took the money. I haven't lost the calendar.'" : "Quill has the depot steward's torn order pad beside his bowl."}\n\n${state.flags.kerr_route_face ? "'You used the introduction to get a counter answer. That's what I lent you.'" : state.flags.kerr_route_intro ? "'You took my introduction and used another way through. A recommendation can go unused. It doesn't become a delivery receipt.'" : "'You paid what you had postponed. That settles the forty, not the rest of your night.'"}\n\n${state.flags.kerr_route_private && state.flags.kerr_route_trace ? "He reads the recipient docket. 'My letter wasn't a promise that the gate would forget. That part was yours to keep.'" : state.flags.kerr_route_delivered ? "He checks that a handover was actually observed before writing collected on his own note." : "He leaves collected blank. Nobody at this stall observed a completed delivery."}\n\nThere is no new fee or favor to collect from this conversation.`,
    choices: [{ id: "close-quill-introduction", label: "Keep his recommendation separate from the outcome.", effects: { flags: ["quill_route_visit"] }, next: "act3_arrival" }],
  },
};

export const kerrCollectionChoice: Choice = { id: "answer-kerr-collection", label: "Answer Kerr’s personal depot request.", detail: "Plan two crossings and honor the collection terms. Equipment delivery supplies no evidence or treatment outcome.", requireAnyFlag: ["met_kerr", "kerr_told", "kerr_down", "kerr_slipped", "kerr_talked", "kerr_sold_you"], hideIfAnyFlag: ["kerr_route_done", "kerr_route_declined", "act2_done"], next: (state) => state.flags.kerr_route_promised ? routeResume(state) : "act2_kerr_collection_terms" };

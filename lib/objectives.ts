import { encounterRecords, noticePlanRecord } from "./campaign-consequences";
import { windowRemaining } from "./chapel-window";
import { spireOutcome } from "./story/spire";
import { shelterOutcome } from "./story/shelter";
import { freightOutcome } from "./story/freight";
import { actName } from "./story/goal";
import { routeOutcome } from "./route-planning";
import type { GameState } from "./types";

export type Objective = { id: string; title: string; status: "Open" | "Complete" | "Compromised" | "Unresolved"; detail: string };

export function objectives(state: GameState): Objective[] {
  const rows: Objective[] = [];
  const atWall = actName(state) === "The Wall";
  if (state.flags.response_private_consent) rows.push({ id: "mara-response", title: "Mara’s current private reply", status: state.flags.response_received ? "Complete" : atWall && !state.flags.response_sent ? "Unresolved" : "Open", detail: state.flags.response_received ? "The desk received her reply into an unanswered queue. The inquiry is still open." : state.flags.response_sent ? "Dispatched privately. Return later to record the desk’s receipt; no inquiry decision is promised." : "Dispatch is open under her own name, with no clinic sponsor or public permission." });
  if (state.flags.kerr_route_promised) rows.push({ id: "kerr-collection", title: "Kerr’s collection terms", status: state.flags.kerr_route_private && state.flags.kerr_route_trace ? "Compromised" : state.flags.kerr_route_delivered ? "Complete" : state.flags.kerr_route_done || atWall ? "Unresolved" : "Open", detail: routeOutcome(state) });
  if (state.flags.notice_started) rows.push({ id: "notice", title: "Clinic appointment information", status: state.flags.notice_unresolved ? "Unresolved" : state.flags.notice_done ? "Complete" : atWall ? "Unresolved" : "Open", detail: state.flags.notice_unresolved ? "Distribution was left with staff; no patient receipt was observed." : state.flags.notice_done ? "Distribution was arranged without a public home list. Patient receipt and attendance are still unobserved." : "Choose a usable route or private channel without publishing home addresses." });
  if (state.flags.notice_done && !state.flags.notice_unresolved) rows.push({ id: "notice-followup", title: "Check clinic distribution", status: state.flags.notice_monitored ? "Compromised" : state.flags.notice_followed_up ? "Complete" : "Open", detail: state.flags.notice_monitored ? `The advertised window was observed. ${state.flags.notice_private_reply_booked ? "A private reply channel is booked, with new appointments unconfirmed." : state.flags.notice_window_withdrawn ? "The window was withdrawn, with no replacement confirmed." : "Callers requested another time; no response is arranged."} No home list was published; attendance remains unknown.` : state.flags.notice_receipt_observed ? "Two private receipts were acknowledged. Other receipts and all attendance remain unknown." : "Return to Lumen at Ward Nine for a dispatch reply. No patient receipt is observed yet." });
  const account = state.journal.some((entry) => entry.id === "nia-account");
  if (state.flags.memory_witness || state.flags.memory_redacted) {
    rows.push({
      id: "witness", title: "Protect Nia Pell",
      status: state.flags.witness_lost ? "Compromised" : state.flags.witness_safe && account ? "Complete" : atWall ? "Unresolved" : "Open",
      detail: state.flags.witness_lost ? state.flags.witness_relocated ? "Her new room is private. The first location was exposed; that breach remains part of the account." : account ? "Her account corroborates the order, but her clinic location is on Helion's register." : "Her clinic location is on Helion's register. Her account can still be preserved."
        : state.flags.witness_safe ? account ? "Her account is recorded without publishing her home." : atWall ? "Nia reached a safe room, but her account was not attached before the week ended." : "Nia has a safe room. Attach her account before moving on."
        : actName(state) === "The Hour" ? "During The Week, find a safe transfer through the clinic. The private roster alone does not move her."
        : atWall ? "The week ended without a protected account. Her location remains private; her route remains unresolved."
        : "After answering a district call, agree Nia's terms and prepare a transfer. A shelter, passenger route, trained method, favor, or ninety creds can secure a room.",
    });
  }
  if (state.flags.memory_intact) {
    rows.push({ id: "archive", title: "Authenticate the counter-order",
      status: state.flags.order_verified ? "Complete" : state.flags.archive_unresolved || atWall ? "Unresolved" : "Open",
      detail: state.flags.order_verified ? "An independent source corroborates the canceled evacuation."
        : state.flags.archive_unresolved ? "The issuing key remains unverified. The gap is recorded, not repaired."
        : actName(state) === "The Hour" ? "During The Week, compare the exported receipt with an independent tower record."
        : atWall ? "The archive survived, but its issuing key was not independently verified."
        : "After answering a district call, trace the issuing key from the dry canal. A failed query still leaves a ledger route.",
    });
  }
  if (state.flags.edda_shift_consent) rows.push({ id: "edda-shift", title: "Bridge Edda’s suspended shift", status: state.flags.edda_shift_paid ? "Complete" : state.flags.edda_shift_done ? "Unresolved" : "Open", detail: state.flags.edda_shift_paid ? "Edda accepted one paid bench assignment. Archive access remains suspended and the records inquiry continues." : state.flags.edda_representation ? "A representative booked a review appointment. The sixty-creds fee bought no restored shift or inquiry decision." : state.flags.edda_shift_done ? "The signed application remains pending; no paid assignment was offered." : "Edda authorized a private payroll request. Choose one form of help, then record the actual response." });
  if (state.flags.pump_attempted || state.flags.pump_done) rows.push({ id: "coolant", title: "Respond to the clinic coolant emergency", status: !state.flags.pump_done ? "Open" : state.flags.pump_left ? "Unresolved" : "Complete", detail: !state.flags.pump_done ? state.flags.pump_restored ? "Cooling is restored. Choose custody of the maintenance receipt before returning." : "The pump attempt failed. Arrange cold-storage transfer or leave its outcome unobserved." : state.flags.pump_restored ? `The spare restored cooling.${state.flags.pump_inspection_booked ? " A follow-up inspection is booked, but has not happened yet." : " Another inspection remains due."} This supplies no historical evidence.` : state.flags.pump_supplies_saved ? "Medicines reached another cold cabinet. The pump still needs a replacement relay." : "You left the transfer to clinic staff. Its delivery outcome was not observed by you." });
  if (state.flags.freight_started) rows.push({ id: "freight", title: "Asa’s sealed clinic parcel", status: state.flags.freight_exposed ? "Compromised" : state.flags.freight_delivered || state.flags.freight_late_received ? "Complete" : state.flags.freight_done || atWall ? "Unresolved" : "Open", detail: freightOutcome(state) });
  if (state.flags.shelter_started) rows.push({ id: "shelter", title: "Shelter residents and referral room", status: state.flags.shelter_unobserved || atWall && !state.flags.shelter_done ? "Unresolved" : state.flags.shelter_done ? "Complete" : "Open", detail: shelterOutcome(state) });
  if (state.flags.spire_started) rows.push({ id: "spire-key", title: "Edda’s obsolete maintenance key", status: state.flags.old_badge_traced ? "Compromised" : state.flags.spire_closure_recorded ? "Complete" : state.flags.spire_done || atWall ? "Unresolved" : "Open", detail: spireOutcome(state) });
  for (const row of encounterRecords(state).filter(row => !["chapel-access", "witness-method"].includes(row.id))) rows.push({ id: row.id, title: row.title, status: row.open ? atWall || state.flags.act2_done ? "Unresolved" : "Open" : "Complete", detail: row.detail });
  const notice = rows.find(row => row.id === "notice");
  if (notice && noticePlanRecord(state)) notice.detail = `${noticePlanRecord(state)} ${notice.detail}`;
  return rows;
}

export function unresolvedPromises(state: GameState): Objective[] {
  return objectives(state).filter((row) => row.status === "Open" || row.status === "Unresolved");
}

export function nextStep(state: GameState): string {
  if (state.pendingCheck) return "Finish the recorded roll. Its outcome is already saved.";
  if (state.sceneId.startsWith("act2_response_") || ["act2_mara_quiet", "act2_lumen_quiet"].includes(state.sceneId)) return "Hear their terms, choose one quiet question if you wish, and arrange a private reply. Refusal and dispatch keep their own records.";
  if (state.sceneId.startsWith("act3_response_") || state.sceneId === "act3_mara_followup" || state.sceneId === "act3_lumen_boundary") return "Hear the actual reply and each person’s limits before returning to the wall.";
  if (["act2_route_map", "act2_route_exit", "act2_route_review"].includes(state.sceneId)) return "Plan an entry and an exit. Review the fee, strain and recipient registration before departing; your draft is saved.";
  if (state.sceneId === "act2_route_crossing") return "Use the approach your exit prepared, or negotiate. Departure is already paid; a failed approach leaves recovery without another roll.";
  if (state.sceneId === "act2_route_recovery") return "Choose a registered courier or leave the case held. Receipt, registration and the original promise retain separate outcomes.";
  // The arrival goal already explains the opening; leave room for the story.
  if (state.sceneId.startsWith("opening_")) return "";
  if (state.sceneId === "act2_spire_sources") return "Read all three records. Her current account must stay open; a service request is not a closure receipt.";
  if (state.sceneId === "act2_spire_recovery") return "Choose paid closure or a free pending request. No second terminal roll can erase the badge log.";
  if (state.sceneId === "act2_spire_receipt") return "Check both registers before recording closure. An exposed badge prevents a receiver handover.";
  if (state.sceneId.startsWith("act2_spire_")) return "Retire only the obsolete maintenance key. Keep current payroll, earlier charges and historical evidence separate.";
  if (state.sceneId.startsWith("act3_spire_")) return "Record payroll’s actual reply. Later closure creates no earlier receiver handover or restored wage.";
  if (state.sceneId.startsWith("act2_shelter_")) return "Settle resident beds before reserving a private referral room. Evacuation and repair are different outcomes.";
  if (state.sceneId === "act3_shelter_visit") return "Hear how the neighbors slept. Today’s help creates no replacement token or witness transfer.";
  if (state.sceneId.startsWith("act2_freight_")) return "Keep the parcel cold, distinguish a handover from an observed receipt, and preserve any exposed route.";
  if (state.sceneId === "act3_freight_reflection") return "Remember why you took work that night. The receipt keeps its own limits.";
  if (state.sceneId.startsWith("act3_freight_")) return "Ask what the clinic actually acknowledged. A late reply supplies no clearance or patient outcome.";
  if (state.sceneId.startsWith("act3_notice_")) return "Keep dispatch, receipt and attendance separate. A private reply booking cannot erase an observed public window.";
  if (state.sceneId === "act3_nia_contact") return "Nia chooses whether to answer future questions. Contact permission changes no testimony or public consent.";
  if (["act2_notice_allocation", "act2_notice_allocation_review", "act2_notice_offer", "act2_notice_counter", "act2_notice_capacity", "act2_notice_privacy_refusal"].includes(state.sceneId)) return "Early clinic/dispatch capacities: 4/4. Later capacities: 3/2. Drafts are free; homes cannot be a return contact.";
  if (state.sceneId.startsWith("act2_notice_")) return "Separate public routing from private homes. Choose a channel; a dispatch receipt guarantees no attendance.";
  if (["memory_cross_exam", "memory_assurance", "memory_channel"].includes(state.sceneId)) return "Replay what Mara knew and who supplied her assurance. Attribute her recorded answers; no testimony becomes an independent issuing-key test.";
  if (state.sceneId === "memory_sequence") return "Place the inspected fragments from earliest to latest, consulting source timestamps. Your draft is saved; reset changes no evidence.";
  if (state.sceneId === "memory_sequence_result") return "Check the timestamp feedback. Rebuild a mismatch or retain the chronology as unresolved.";
  if (state.sceneId.startsWith("memory_model")) return "Test a claim against its source. Support, contradiction and missing authentication are different findings; retain any correction.";
  if (state.sceneId === "act2_public_response" && state.flags.memory_model_pending) return "Answer the disputed bench verdict before responding to the packet’s source challenge.";
  if (state.sceneId === "memory_table") {
    const count = ["memory_signature", "memory_order", "memory_roster"].filter((flag) => state.flags[flag]).length;
    return count < 3 ? `Inspect the remaining ${3 - count} ${3 - count === 1 ? "fragment" : "fragments"}, then compare their decisions.` : state.flags.memory_prepared ? "Choose an archive, a redacted roster, or a witness chain. Each opens a different responsibility next week." : "Compare the signature and the later order, then label what the packet can prove.";
  }
  if (state.sceneId === "memory_reconstruction" || state.sceneId === "memory_challenge") return "Separate authorization, the later cancellation, and the questions neither source settles.";
  if (state.sceneId === "memory_publication") return "Label the account's certainty. Custody and witness safety are separate decisions.";
  if (state.sceneId === "act2_pump_brief") return "Choose whether to help. Kerr’s earlier response can earn assistance; present maintenance supplies no historical proof.";
  if (state.sceneId === "act2_pump_methods") return "Choose one repair approach. Failure still leaves a cold-storage transfer route.";
  if (state.sceneId === "act2_pump_triage") return "Preserve the medicines with a courier or carrying route, or leave staff to arrange an unobserved transfer.";
  if (state.sceneId === "act2_pump_report") return "Choose who keeps the repair receipt. Patient names stay out of both copies.";
  if (state.sceneId === "act3_pump_schedule") return "Book one future inspection with money or neighborhood standing. A booked visit is not a completed inspection.";
  if (state.sceneId === "act2_workshop") return "Compare one kit against the money needed for care. Tools improve specific checks, not base stats.";
  if (state.sceneId === "act2_recovery") return "Choose paid care, a clinic favor, or a short rest. Use this week’s recovery visit once.";
  if (state.sceneId === "act2_recovery_after") return "Pressure eased; evidence, witness safety, and publication still need their own decisions.";
  if (state.sceneId === "act2_witness_brief") return "Agree what Nia authorizes before arranging the move.";
  if (state.sceneId === "chapel_window_plan" || state.sceneId === "chapel_window_exit") return `Service window: ${windowRemaining(state)} opportunities left. Preparation, entry and quiet exit share this allowance.`;
  if (state.sceneId === "chapel_window_expired") return "The window is closed. Return to ordinary doors without a fee; patrol attention remains.";
  if (state.sceneId === "chapel_methods" || state.sceneId === "chapel_method_review") return "Prepare one access method; compare its cost and trace before committing.";
  if (state.sceneId === "act2_witness_support") return "Match preparation to a transport commitment. Recording permission remains separate.";
  if (state.sceneId === "act2_route_handling") return "Choose physical effort and a refundable deposit, or an accepted work bargain.";
  if (state.sceneId === "act2_witness_plan") return "Choose one preparation. Your trained skill can unlock a different transfer method.";
  if (state.sceneId === "act2_witness_arrival") return "Nia has a safe room. Let her review the account, or return before the week closes.";
  if (state.sceneId === "act2_witness_repair") return "Protect a new location without erasing the earlier breach.";
  if (state.sceneId === "act2_public_response") return "Answer with a corroborating source, a correction, or an explicit unresolved question.";
  if (state.sceneId === "act3_testimony_review") return "Choose the scope your actual sources support. Public testimony supplies no new evidence.";
  if (["act3_testimony_consent", "act3_testimony_nia"].includes(state.sceneId)) return "Recording consent and public quotation consent are separate. A private account can remain private.";
  if (["act3_testimony_hearing", "act3_testimony_correction"].includes(state.sceneId)) return "Identify corroboration or key authentication precisely; preserve any correction beside the original claim.";
  if (state.sceneId === "act3_testimony_record") return "File or withdraw the draft, then return to the original ending choices.";
  if (state.sceneId === "act3_neighborhood") return "Visit the people and records changed by your week, or go directly to the wall.";
  if (state.sceneId === "act2_witness_checkpoint") return "Recover the transfer at this checkpoint. A registered room provides care but exposes Nia's location.";
  if (state.sceneId === "act2_witness_safe") return "Attach Nia's account. A safe room and a recorded witness are separate steps.";
  if (state.sceneId === "act2_archive_brief") return "Agree source access and publication limits before searching.";
  if (state.sceneId === "act2_archive_prep") return "Prepare one retrieval route. A failed probe leaves staffed recovery available.";
  if (["act2_archive_compare", "act2_archive_challenge"].includes(state.sceneId)) return "Distinguish a catalog, a corroborating ledger, and an authenticated issuing key.";
  if (state.sceneId === "act2_archive_custody") return "Choose public attribution. Withholding a name cannot erase an existing signed extraction.";
  if (state.sceneId === "act3_edda_terms") return "Ask for Edda’s private payroll authorization. Public source consent remains separate.";
  if (state.sceneId === "act3_edda_methods") return "Choose one desk attempt, an earned key-closure receipt, or paid representation. A review appointment guarantees no shift.";
  if (state.sceneId === "act3_edda_reply") return "Record temporary paid work or a pending application accurately. The records inquiry continues.";
  if (state.sceneId === "act3_edda_visit") return "Hear the source’s employment consequences; support does not settle the review.";
  if (state.sceneId === "act2_archive_gap") return "Corroborate the receipt through the ledger, or record the gap honestly.";
  if (state.sceneId === "act2_middle") {
    const work = encounterRecords(state).filter(row => row.open);
    if (work.length) return `${work.map(row => row.title).join("; ")} remains open. Keep the work or handover before closing the week, or leave it unresolved.`;
    if (state.flags.notice_started && !state.flags.notice_done) return "Clinic distribution is unfinished. Resume the saved draft or leave it unaccepted when closing the week.";
    if (state.flags.kerr_route_promised && !state.flags.kerr_route_done) return "Kerr’s collection is unfinished. Resume the saved plan or leave the promise open when closing the week.";
    if (objectives(state).some((row) => row.status === "Open")) return "Your memory promise is still open. Finish it here before closing the week, or choose to leave it unresolved.";
    if (unresolvedPromises(state).length) return "The archive gap is recorded. Closing the week leaves that issuing key unverified.";
  }
  if (state.sceneId === "districts") return state.flags.act2_done ? "Ward Nine is the remaining call. Take your account to the wall." : "Answer a district call. Your old contact also offers an optional origin favor.";
  return "";
}

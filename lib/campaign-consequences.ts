import type { GameState } from "./types";

export type EncounterRecord = { id: string; title: string; detail: string; open: boolean };

// These are records of actions, not new rewards or permission grants.
export function encounterRecords(s: GameState): EncounterRecord[] {
  const rows: EncounterRecord[] = [];
  for (const [prefix, title, kept, owed] of [
    ["chapel", "Chapel return shift", "You worked the orderly’s accepted return shift. The work docket remains.", "The orderly accepted your return shift; you have not worked it."],
    ["witness", "Volunteer return shift", "You worked your promised clinic return shift. Nia owes you nothing.", "Your clinic return shift remains unpaid work. The promise is yours, not Nia’s."],
  ]) if (s.flags[`${prefix}_shift_owed`]) rows.push({ id: `${prefix}-shift`, title, open: !s.flags[`${prefix}_shift_kept`], detail: `${s.flags[`${prefix}_shift_kept`] ? kept : owed} This supplies no recording or public quotation permission.` });
  if (s.flags.chapel_window_started || s.flags.chapel_method_chrome || s.flags.chapel_method_face || s.flags.chapel_service_refused) rows.push({ id: "chapel-access", title: "Chapel access record", open: false, detail: chapelAccessRecord(s) });
  const transport = s.flags.witness_method_chrome ? "You used the prepared clinic-only form; no patient home address was supplied by that method." : s.flags.witness_method_nerve ? "You used a prepared physical chair transfer. Its strain remains part of the journey." : s.flags.witness_method_ghost ? "You used the mapped quiet crossing. Earlier checkpoint attention was not erased." : s.flags.witness_method_face ? "The arranged volunteer handled the room under agreed terms. Your work promise or spent clinic standing keeps its own record." : "";
  if (transport) rows.push({ id: "witness-method", title: "Nia’s transfer method", open: false, detail: `${transport} Transport supplied no recording or public quotation permission.${s.flags.witness_lost ? " Her earlier exposed location remains on the register." : ""}` });
  if (s.flags.kerr_method_rig) rows.push({ id: "depot-rig", title: "Borrowed depot rig", open: !s.flags.kerr_rig_returned, detail: s.flags.kerr_rig_returned ? "The rig was returned at observed handover; its twenty-creds deposit was refunded once. Earlier registration remains." : "The rig has not been returned at an observed handover. Its twenty-creds deposit remains held; no refund or delivery is recorded through this method." });
  if (s.flags.kerr_method_shift) rows.push({ id: "depot-work", title: "Depot sorting work", open: false, detail: "You completed the accepted sorting work at collection. Kerr owes no favor for your time; receipt and treatment keep their own status." });
  return rows;
}

export function chapelAccessRecord(s: GameState): string {
  const f = s.flags;
  const records: string[] = [];
  if (f.chapel_window_staffed_exit) records.push(`You left by the staffed stair with added strain and a visitor watch.${f.chapel_window_expired ? " The local service allowance ran out before departure." : " You chose attention over the quiet exit."}`);
  else if (f.chapel_window_quiet_exit) records.push("You spent the saved local allowance on a quiet exit; that route made no new visitor entry.");
  else if (f.chapel_window_expired) records.push("The local service window ended outside. You returned to ordinary doors with patrol attention; this was no missed campaign deadline.");
  else if (f.chapel_window_failed) records.push("The window entry attempt failed and drew attention; no quiet departure was recorded.");
  else if (f.chapel_window_started) records.push("The local service plan was left without a recorded departure. A draft supplies no quiet exit.");
  if (f.chapel_method_chrome) records.push("The isolated reader left a maintenance fault on its log.");
  if (f.chapel_method_face) records.push("Fifteen creds reserved the orderly’s tools. The accepted service bargain put your handle on a watched work docket.");
  if (f.chapel_window_nerve) records.push("Physical entry strained the latch and the runner.");
  if (f.chapel_window_query_seen) records.push("The failed reader query remains recorded.");
  if (f.chapel_service_refused) records.push("The service bargain was refused. Fifteen creds reserved tools; the fee stayed spent and no return shift was accepted.");
  if (f.watched) records.push("Earlier attention remains; a later quiet route did not erase it.");
  return records.join(" ");
}

export function noticePlanRecord(s: GameState): string {
  const f = s.flags;
  const records: string[] = [];
  if (f.notice_allocation_committed) {
    const split = f.notice_allocation_42 !== f.notice_allocation_33 ? f.notice_allocation_42 ? "four early and two later" : "three early and three later" : "an inconsistent saved split; no precise window total can be claimed";
    const work = f.notice_allocation_paid ? "Ten creds funded the extra later carrier." : f.notice_allocation_carry ? "You made the extra later trip for two strain." : f.notice_allocation_standard ? "You carried the return bundle for one strain." : "The saved record does not identify the accepted work or fare.";
    records.push(`Dispatch accepted six sealed cards: ${split}. ${work} The clinic was the private return contact.`);
  } else if (["notice_schedule_42", "notice_schedule_33", "notice_schedule_60"].some(k => f[k])) records.push("Your saved allocation stayed an unaccepted draft. No dispatch, work charge or carrier fee was committed by that plan.");
  if (f.notice_plan_invalid) records.push("The capacity conflict remains in the proposal history.");
  if (f.notice_privacy_refused) records.push("Lumen refused the home-list contact; revising the plan did not erase her refusal.");
  if (f.notice_delivery_delayed) records.push("The earlier crossing failed; a later accepted dispatch did not repair that delivery.");
  return records.join(" ");
}

export function campaignCoda(s: GameState): string | undefined {
  const motive = s.flags.opening_survival ? "You came to keep tomorrow paid for." : s.flags.opening_identity ? "You came to keep your name your own." : s.flags.opening_exit ? "You came looking for a way beyond the next closed door." : "";
  const cost = s.flags.witness_shift_owed ? s.flags.witness_shift_kept ? "The clinic shift is behind you; Nia’s answer is still hers." : "There is still a clinic shift waiting with your name on it, not Nia’s." : s.flags.chapel_shift_owed ? s.flags.chapel_shift_kept ? "You kept the orderly’s shift. That is work you can name without asking the wall to forgive anything." : "The orderly’s promised shift is still work you have not done." : s.flags.kerr_method_rig ? s.flags.kerr_rig_returned ? "The returned rig’s receipt is folded in your pocket. It says nothing about whether Kerr will walk." : "Twenty creds are still held against a rig you have not returned." : s.flags.notice_allocation_committed ? "The six-card plan cost you time or money. It cannot tell you who made it to an appointment." : "";
  if (!motive && !cost) return;
  const action = s.sceneId === "ending_names" ? "Now your voice has a place beside Sera’s pencil." : s.sceneId === "ending_witness" ? "Now you have admitted where the fire began." : s.sceneId === "ending_listed" ? "Now Ives has a folio you cannot take back." : "Now the stair is quiet behind you.";
  return [motive, action, cost].filter(Boolean).join(" ");
}

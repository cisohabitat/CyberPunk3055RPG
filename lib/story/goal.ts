import type { GameState } from "../types";
import { windowRemaining } from "../chapel-window";

export const GOAL_ARRIVE = "Find Quill at the Ward Four noodle stall. Hear what he is offering.";

export const GOAL_SELF = "Choose what you want tonight's work to buy.";
export const GOAL_OFFER = "Hear Quill's terms. Decide whether to take Mara Voss's hour from Glass Chapel.";

export const GOAL_LIFT = "Lift Mara Voss's hour from Glass Chapel before dawn. Kerr is paid to stop you.";
export const GOAL_DECIDE = "You know what the hour is. Decide who gets it.";
export const GOAL_WEEK = "The week wants a buyer or a witness.";
export const GOAL_WALL = "The wall has the names. Say them, or leave them to the rain.";

const WEEK = new Set([
  "card_week",
  "street_after",
  "districts",
  "act2_kerr_door",
  "act2_lumen_door",
  "act2_helion_door",
  "ending_week_wards",
  "ending_week_deal",
  "ending_exposed",
]);

const WALL = new Set(["card_wall", "ward_wall", "ending_names", "ending_quiet", "ending_witness", "ending_listed"]);

const BRIEFING = new Set(["stall", "pay", "pay_yes", "pay_no", "why", "chapel", "job_owner"]);

// Written directions for the current task, never a new spoken quotation or
// evidence that its outcome has already happened.
const TASK_GOALS: Readonly<Record<string, string>> = {
  act3_sera_shift: "Choose how to help Sera, or leave the task with her and prepare the account.",
  act3_sera_carry: "Carry the blank cards and return the empty tray, change tasks, or decline before doing it.",
  act3_sera_watch: "Watch the closed table until Sera returns, change tasks, or decline before doing it.",
  act3_sera_reply: "Hear Sera's response to your completed task. Return to reviewing the account.",
  act2_ramp_terms: "Hear Asa’s gate task and decide whether to plan a trained carry.",
  act2_ramp_survey: "Inspect both resting places before choosing support. The case has not moved.",
  act2_ramp_gear: "Choose a real harness, five-creds blocks or two-strain carry; cancel free before lifting.",
  act2_ramp_load: "The lift is paid. Choose a resting place before the narrowing rail; no timer runs.",
  act2_ramp_arrived: "A handover reached intake. Review the separate stock-receipt decision.",
  act2_ramp_stopped: "The carry stopped. Choose a real recovery carrier or return the case without a receipt.",
  act3_ramp_return: "Hear Asa’s personal reply beside the actual freight record; add no invented receipt.",
  act2_archive_brief: "Hear Edda's access terms, or leave the archive search open.",
  act2_archive_prep: "Prepare one archive route, or proceed without a preparation bonus.",
  act2_archive_challenge: "Keep the catalog's limits clear, then retrieve the actual source.",
  act2_archive_door: "Choose a retrieval method. A ledger can corroborate; an issuing-key match can authenticate.",
  act2_archive_gap: "Request ledger corroboration, pause the search for free, or record the unresolved gap.",
  act2_archive_custody: "Decide how to attribute the source. Withholding a public name cannot erase an existing employer trace.",
  act2_archive_verified: "Keep the earlier authorization and later cancellation attached as separate decisions.",
  act2_witness_brief: "Hear Nia's terms. A safe move and permission to use her words are separate promises.",
  act2_witness_plan: "Prepare one crossing, or use resources you already earned. Choose the transfer method next.",
  act2_witness_door: "Choose Nia's transfer route, or leave the move unresolved.",
  act2_witness_checkpoint: "Resolve the transfer at the desk. A registered room gives Helion her location.",
  act2_witness_arrival: "Let Nia review her account, or leave the recorder off and return before the week closes.",
  act2_witness_safe: "Attach the approved account with its source and privacy limits.",
  act2_witness_lost: "Keep the account and record the location breach. Treatment did not make the room private.",
  act2_witness_repair: "Arrange a second private move, or leave the known location unresolved. The first breach remains recorded.",
  act3_testimony_review: "Choose what the sources support, or return to the names without drafting an account.",
  act3_testimony_nia: "Accept Nia's terms for this account, or keep her recording private.",
  act3_testimony_hearing: "Answer Ives with the source you have. Corroboration and key authentication are different claims.",
  act3_testimony_correction: "Correct the unsupported certainty and keep the earlier claim attached.",
  act3_testimony_record: "File the public account with its limits, or withdraw the draft. The memorial choice follows separately.",
};

export function actName(state: GameState): string {
  const id = state.sceneId;
  if (WALL.has(id) || id.startsWith("act3_")) return "The Wall";
  if (WEEK.has(id) || id.startsWith("act2_")) return "The Week";
  return "The Hour";
}

export function currentGoal(state: GameState): string {
  const id = state.sceneId;
  if (id === "act2_archive_compare") return state.flags.archive_catalog_open
    ? state.flags.archive_catalog_located
      ? "The locator is found. Retrieve the ledger, or choose another method; the lookup supplied no record."
      : "Compare catalog descriptions and locate the evacuation revision. Submitting a locator leaves a trace."
    : "Compare the two decisions, then choose a retrieval method or investigate the catalog.";
  if (id === "act3_testimony_consent") return state.journal.some(entry => entry.id === "nia-account")
    && state.flags.witness_safe && state.flags.witness_consent && !state.flags.witness_lost && !state.flags.nia_contact_paused
    ? "Ask Nia through the relay about public quotation, or keep her recording private."
    : "Keep Nia's words out of this public account. Continue with the sources and limits you have.";
  if (Object.hasOwn(TASK_GOALS, id)) return TASK_GOALS[id];
  if (id === "chapel_window_plan" || id === "chapel_window_exit") {
    const count = windowRemaining(state);
    if (count === 0) return id === "chapel_window_exit"
      ? "Service window: 0 opportunities left. Use the staffed stair; no fee, a visitor watch and up to 1 strain."
      : "Service window: 0 opportunities left. Pause and return to the ordinary doors without a fee.";
    return `Service window: ${count} ${count === 1 ? "opportunity" : "opportunities"} left. Save one for a quiet exit, or use the staffed recovery.`;
  }
  if (id === "chapel_window_expired") return "The service window closed. Ordinary doors remain available without a fee.";
  if (id === "act2_notice_allocation" || id === "act2_notice_allocation_review") return "Allocate six cards across two clinic windows. Compare dispatch capacity and offer a private return contact.";
  if (id === "act2_notice_counter") return "Resolve the extra later card: carry it, fund a carrier, revise the split or leave the offer open.";
  if (id === "act2_notice_offer") return "Accept the return work once, or revise the draft. Dispatch acceptance is separate from receipt.";
  if (id === "act2_notice_capacity" || id === "act2_notice_privacy_refusal") return "Keep the conflict or refusal recorded. Revise the plan, or leave distribution unresolved.";
  if (id === "opening_self") return GOAL_SELF;
  if (id.startsWith("opening_")) return GOAL_ARRIVE;
  if (WALL.has(id) || id.startsWith("act3_")) return GOAL_WALL;
  if (WEEK.has(id) || id.startsWith("act2_")) return GOAL_WEEK;
  if (state.flags.heard_memo || state.journal.some((entry) => entry.id === "ward-nine")) return GOAL_DECIDE;
  if (BRIEFING.has(id) && !state.flags.hired) return GOAL_OFFER;
  return GOAL_LIFT;
}

import { DISTRICT_QUOTES as Q } from "../district-dialogue";
import { districtRemaining, districtSpend, districtStart, districtStatus, kerrKnowsDistrictBreach } from "../district-response";
import type { Effect, GameState, Scene } from "../types";
const say = (key: keyof typeof Q) => `“${Q[key].text}”`;
const action = (s: GameState, effect: Effect): Effect => { const spent = districtSpend(s); return { ...effect, flags: [...spent.flags!, ...(effect.flags ?? [])], flagsOff: spent.flagsOff }; };
export const DISTRICT_SCENES: Record<string, Scene> = {
  act2_district_brief: {
    id: "act2_district_brief", location: "Helion service window", speaker: "Edda",
    text: `Edda turns an empty cover sheet toward you. Your notebook stays on your side of the counter.\n\n${say("edda_intro")}\n\nYou can share the recorded receipt or attach the independently retrieved ledger. Neither packet includes a witness account, address or recording. Opening this conversation has sent nothing.`,
    choices: [
      { id: "district-edda-receipt", label: "Share only the cancellation receipt, with its limits.", requireJournal: "memory-order", effects: { flags: ["district_started", "district_edda_receipt", "district_edda_knows_receipt"], flagsOff: ["district_edda_corroborated"] }, next: "act2_district_edda" },
      { id: "district-edda-corroboration", label: "Share the cancellation receipt and its retrieved corroborating ledger.", requireJournal: "memory-order", effects: { flags: ["district_started", "district_edda_corroborated", "district_edda_knows_receipt", "district_edda_knows_ledger"], flagsOff: ["district_edda_receipt"] }, next: "act2_district_edda" },
      { id: "district-keep-case", label: "Keep the notebook closed. Send no request.", next: "act2_middle" },
    ],
  },
  act2_district_edda: {
    id: "act2_district_edda", location: "Helion service window", speaker: "Edda",
    text: s => `${s.flags.district_edda_corroborated ? say("edda_corroborated") : say("edda_receipt")}\n\nEdda offers two requests about the public recipient-register procedure, without attaching her name or any witness material. A review is not a finding against a worker.\n\n${say("edda_request")}\n\nThe public route logs your handle and closes the anonymous hatch during review; a registered sorting shift becomes available through an introduction. The private route keeps the ordinary hatch and offers a short service-room rest instead. Two saved depot actions will be available. There is no real-time clock.`,
    choices: [
      { id: "district-public-review", label: "Sign the public register-review request with your own handle.", detail: "Helion +1. Side hatch closes during review; registered counter remains. No Edda or witness name is attached.", hideIfFlag: "district_query_sent", effects: s => districtStart(s, true), next: "act2_district_canal" },
      { id: "district-private-query", label: "Ask Edda to submit the private service query.", detail: "No public filing. Ordinary hatch remains; short rest appointment offered. No anonymity or inquiry outcome is guaranteed.", hideIfFlag: "district_query_sent", effects: s => districtStart(s, false), next: "act2_district_canal" },
      { id: "district-revise-packet", label: "Reconsider which source summary to share.", hideIfFlag: "district_query_sent", next: "act2_district_brief" },
      { id: "district-defer-request", label: "Leave the request unsent for now.", next: "act2_middle" },
    ],
  },
  act2_district_canal: {
    id: "act2_district_canal", location: "Canal depot",
    text: s => `${s.flags.district_public_review ? "A queue rail blocks the anonymous side hatch. A blank review cover hangs on its lowered shutter. The main counter is lit; workers now sign there under their own handles. Your public request changed a door, not the truth of the cancellation." : "The ordinary hatch remains behind the dispatch table. A private service-query reference waits in a sleeve; it offers an appointment, not an empty register or a cleared inquiry."}\n\n${districtStatus(s)}\n\nKerr is at the nearby stall. An introduction can open the offered task. You can instead carry a sealed procedural correction to the public counter: one depot action and one strain, for Ward standing rather than wages or rest. No witness or technician identity is inside.`,
    choices: [
      { id: "district-read-notice", label: "Inspect the actual notice and recorded scope.", detail: "Free. Reading consumes no depot action.", next: "act2_district_docket" },
      { id: "district-speak-kerr", label: "Ask Kerr about the depot opportunity.", detail: "Free conversation. Decide what to disclose before he responds.", hideIfFlag: "district_kerr_introduced", next: "act2_district_kerr" },
      { id: "district-register-work", label: "Register your own handle for the sorting shift.", detail: "One of two depot actions; finishing costs the second action and adds one strain, then pays twenty creds. Kerr's recipient field stays empty.", requireAllFlags: ["district_public_review", "district_kerr_introduced"], hideIfAnyFlag: ["district_work_registered", "district_work_paid", "district_window_closed"], maxStrain: 4, effects: s => action(s, { flags: ["district_work_registered"], journal: [{ id: "district-work-registration", kind: "fact", text: "You registered your own worker handle for one sorting shift. Kerr's recipient name and witness material were not included. No wage has been paid yet." }] }), next: "act2_district_work" },
      { id: "district-resume-work", label: "Return to the registered shift; wages still require completion.", requireFlag: "district_work_registered", hideIfAnyFlag: ["district_work_paid", "district_window_closed"], next: "act2_district_work" },
      { id: "district-book-rest", label: "Take the private service-room appointment.", detail: "One depot action now, one to finish a short rest. Recovers at most one strain; no medicine or treatment outcome.", requireAllFlags: ["district_private_query", "district_kerr_introduced"], hideIfAnyFlag: ["district_rest_booked", "district_rest_done", "district_window_closed"], effects: s => action(s, { flags: ["district_rest_booked"] }), next: "act2_district_rest" },
      { id: "district-resume-rest", label: "Return to the booked service-room rest.", requireFlag: "district_rest_booked", hideIfAnyFlag: ["district_rest_done", "district_window_closed"], next: "act2_district_rest" },
      { id: "district-carry-correction", label: "Carry the sealed procedural correction to the counter.", detail: "One depot action; Strain +1; Wards +1. Filing only, no acceptance or authenticated evidence. This can leave too few actions to begin the two-step opportunity.", hideIfAnyFlag: ["district_correction_carried", "district_window_closed"], maxStrain: 4, effects: s => action(s, { strain: 1, factions: { wards: 1 }, flags: ["district_correction_carried"], journal: [{ id: "district-correction", kind: "fact", text: "You carried a sealed procedural correction to the public counter for filing. It contained no witness or technician identity. Delivery is not an accepted correction, authenticated source or resolved inquiry." }] }), next: "act2_district_result" },
      { id: "district-pause", label: "Return to the canal with the remaining depot actions saved.", detail: "Free. No refund, new allowance or completed task.", next: "act2_middle" },
      { id: "district-close", label: "Close this depot action window and keep the actual record.", effects: s => ({ flags: ["district_window_closed", "district_window_0"], flagsOff: DISTRICT_CLOSING_FLAGS, journal: [{ id: "district-outcome", kind: "fact", text: districtStatus(s) + " You then closed the remaining action window." }] }), next: "act2_middle" },
    ],
  },
  act2_district_docket: {
    id: "act2_district_docket", location: "Canal depot",
    text: s => `${districtStatus(s)}\n\nThe notice records a procedural response to a request. It names neither Edda nor a witness and contains no new proof about the issuing key. A public review retains a worker registration; a private appointment retains its service reference. Neither deletes an earlier recipient entry.\n\n${s.flags.district_work_registered && !s.flags.district_work_paid ? "Your shift registration exists. No wage has been paid." : "Any wage or recovery appears only after its task is actually completed."}\n\nReading and reopening this notice changes no saved allowance.`,
    choices: [{ id: "district-return-notice", label: "Return to the depot choices.", next: "act2_district_canal" }],
  },
  act2_district_kerr: {
    id: "act2_district_kerr", location: "Ward Four stall", speaker: "Kerr",
    text: `${say("kerr_intro")}\n\nThe posted depot procedure is public. Your case notes are not. If you show Kerr the summary, use the same source scope you gave Edda and include any docket showing a breach of his private collection terms. No witness material will be shared. You can keep the case closed.`,
    choices: [
      { id: "district-tell-kerr", label: "Show the bounded source summary and any broken private-collection docket.", effects: s => ({ flags: ["district_kerr_heard", "district_told_kerr_case", ...(s.flags.kerr_route_private && s.flags.kerr_route_trace ? ["district_told_kerr_trace"] : [])], flagsOff: ["district_kerr_withheld"] }), next: "act2_district_kerr_reply" },
      { id: "district-withhold-kerr", label: "Keep the case private; ask only about the posted depot opportunity.", effects: { flags: ["district_kerr_heard", "district_kerr_withheld"] }, next: "act2_district_kerr_reply" },
    ],
  },
  act2_district_kerr_reply: {
    id: "act2_district_kerr_reply", location: "Ward Four stall", speaker: "Kerr",
    text: s => `${s.flags.district_told_kerr_case ? say("kerr_shared") : say("kerr_private")}\n\n${s.flags.district_kerr_refused || s.flags.kerr_route_denied ? say("kerr_refused") : kerrKnowsDistrictBreach(s) ? s.flags.district_breach_acknowledged || s.flags.kerr_route_acknowledged ? say("kerr_acknowledged") : say("kerr_breach") : "He offers an introduction about your own task. It is not a promise to remove anyone from the recipient register."}\n\n${s.flags.district_public_review ? "The counter offers registered sorting work under your own handle." : "The service desk offers one short rest appointment through the private query."} An introduction supplies no payment, recovery, treatment or source. Any earlier breach stays recorded.`,
    choices: [
      { id: "district-kerr-acknowledge", label: "Acknowledge the broken private terms and retain the docket.", effects: { flags: ["district_breach_acknowledged"], journal: [{ id: "district-kerr-response", kind: "fact", text: "You acknowledged the depot recipient entry in this conversation. Kerr may offer a limited introduction; the broken private promise, earlier contact limits and registration remain." }] }, next: "act2_district_kerr_reply" },
      { id: "district-kerr-deny", label: "Deny the recorded breach. Kerr withholds this introduction.", effects: { flags: ["district_kerr_refused"], journal: [{ id: "district-kerr-response", kind: "fact", text: "You denied the recorded private-collection breach. Kerr refused this depot introduction. The earlier promise and recipient register remain unchanged." }] }, next: "act2_district_kerr_reply" },
      { id: "district-kerr-introduce", label: "Accept a limited introduction for your own depot task.", hideIfFlag: "district_kerr_introduced", effects: { flags: ["district_kerr_introduced"] }, next: "act2_district_canal" },
      { id: "district-leave-kerr", label: "Leave the conversation with the actual terms unchanged.", next: "act2_district_canal" },
    ],
  },
  act2_district_work: {
    id: "act2_district_work", location: "Canal depot counter", speaker: "Dispatcher",
    text: s => `${say("dispatcher")}\n\n${districtRemaining(s)} depot actions remain. The registration was one action; sorting and observed handover cost one more and add one strain. Payment arrives only after that task. Carrying a correction instead can use the last action and leave this shift unfinished. Pausing preserves the current state.`,
    choices: [
      { id: "district-finish-work", label: "Finish sorting and observe the handover; collect twenty creds.", detail: "One depot action; Strain +1; 20 creds earned once. Registration and earlier recipient traces remain.", requireFlag: "district_work_registered", hideIfAnyFlag: ["district_work_paid", "district_window_closed"], maxStrain: 4, effects: s => action(s, { creds: 20, strain: 1, flags: ["district_work_paid"], journal: [{ id: "district-work-pay", kind: "fact", text: "You completed the registered sorting shift and observed the handover. Twenty creds were paid once; the worker registration remains. Kerr's recipient name was not entered by this job." }] }), next: "act2_district_result" },
      { id: "district-leave-work", label: "Return without claiming an unfinished wage.", next: "act2_district_canal" },
    ],
  },
  act2_district_rest: {
    id: "act2_district_rest", location: "Canal service room",
    text: s => `A dry chair waits at a table behind the service desk. The appointment is for a short rest, not a clinical examination or a private route through the archive.\n\n${districtRemaining(s)} depot actions remain. Finish with one action to recover at most one strain. No money, proof, treatment or erased register entry follows.`,
    choices: [
      { id: "district-finish-rest", label: "Finish the short rest; recover at most one strain.", requireFlag: "district_rest_booked", hideIfAnyFlag: ["district_rest_done", "district_window_closed"], effects: s => action(s, { strain: -1, flags: ["district_rest_done"], journal: [{ id: "district-service-rest", kind: "fact", text: "You completed the service-room rest, recovering at most one strain. No clinical treatment, evidence or restored access was supplied." }] }), next: "act2_district_result" },
      { id: "district-leave-rest", label: "Return without claiming recovery.", next: "act2_district_canal" },
    ],
  },
  act2_district_result: {
    id: "act2_district_result", location: "Canal depot",
    text: s => `${districtStatus(s)}\n\nThe changed door and the actual task are different records. Nothing in this depot response authenticates the issuing key, restores Edda's archive shift or authorizes a witness account.`,
    choices: [{ id: "district-return-result", label: "Keep the actual result and return to the depot choices.", next: "act2_district_canal" }],
  },
  act3_district_return: {
    id: "act3_district_return", location: "Ward Nine records table", speaker: "Edda",
    text: s => `${say("edda_return")}\n\n${districtStatus(s)}\n\nThe original source stays under its existing custody and publication terms. Edda's employment response remains separate; a depot wage or appointment is not an acquittal.`,
    choices: [{ id: "district-record-return", label: "Record the depot response without closing the records inquiry.", effects: { flags: ["district_return_heard"] }, next: "act3_neighborhood" }],
  },
};
const DISTRICT_CLOSING_FLAGS = ["district_window_1", "district_window_2"];

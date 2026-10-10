import type { GameState, Scene } from "../types";

export function shiftResponse(state: GameState): string {
  if (state.flags.edda_shift_paid) return "The desk offers Edda one paid bench assignment while the records inquiry continues. She accepts it. Her archive access remains suspended; the assignment neither clears her name nor removes the original exposure.";
  if (state.flags.edda_representation) return "A worker representative accepts Edda's application and books a review appointment. The sixty-creds fee is spent. No shift has been restored and no decision on the records inquiry has arrived.";
  return "The desk acknowledges Edda's application without offering an assignment. The suspended shift and records inquiry remain open. A submitted form is not a restored wage.";
}

const paid = { flags: ["edda_shift_attempted", "edda_shift_paid"] };
const pending = { flags: ["edda_shift_attempted", "edda_shift_pending"] };

export const EMPLOYMENT_SCENES: Record<string, Scene> = {
  act3_edda_terms: {
    id: "act3_edda_terms", location: "Ward Nine records table", speaker: "Edda",
    text: "Edda lays out a temporary-work application beside the suspended archive shift.\n\n‘I'll sign for payroll to use my name here. Not on your public packet. Leave the witness recording and patient list out. I need a shift, not another version of the accusation.’\n\nShe can authorize this private request or keep it unsigned. Any earlier forty-creds bridge stays separate.",
    choices: [
      { id: "authorize-shift-request", label: "Let Edda sign a private request for a temporary paid assignment.", requireFlag: "archive_custody", requireAnyFlag: ["edda_exposed", "archive_method_face", "archive_method_nerve"], hideIfFlag: "edda_shift_done", effects: { flags: ["edda_shift_consent"], journal: [{ id: "edda-shift-request", text: "Edda authorized her name on a private payroll application for temporary paid work. No witness recording or patient list is included; public source permission is unchanged.", kind: "promise" }] }, next: "act3_edda_methods" },
      { id: "decline-shift-request", label: "Respect her decision to leave payroll out of this visit.", hideIfFlag: "edda_shift_done", effects: { flags: ["edda_shift_done", "edda_shift_declined", "visited_edda"], journal: [{ id: "edda-shift-response", text: "Edda declined a payroll application during your visit. The suspended shift and records inquiry remain unresolved.", kind: "fact" }] }, next: "act3_neighborhood" },
    ],
  },
  act3_edda_methods: {
    id: "act3_edda_methods", location: "Helion payroll relay", speaker: "Edda",
    text: (state) => `Edda reads the signed application before opening the relay. The request is narrow: paid work away from the archive while the inquiry continues.\n\n${state.origin === "spire" && (state.flags.origin_helped || state.flags.spire_closure_recorded) ? "You previously closed her obsolete maintenance key. The receipt separates that old billing number from her current shifts; it can support this limited request without a roll." : "You have no receipt proving her obsolete maintenance key was closed. The memory receipt concerns evacuation; it cannot stand in for a payroll history."}\n\nYou can reconcile the current shift ledger, negotiate a supervised assignment, or pay sixty creds for worker representation. Representation buys an appointment, not a job. There is time for one desk attempt; a rejection leaves the application pending. Your source original stays with Sera, and Nia's recording stays out of payroll.`,
    choices: [
      { id: "submit-key-closure", label: "Attach the key-closure receipt you earned for Edda.", detail: "Spire origin and an observed key-closure receipt required. Secure one paid bench assignment; the inquiry and archive suspension continue.", requireOrigin: "spire", requireFlag: "edda_shift_consent", requireAnyFlag: ["origin_helped", "spire_closure_recorded"], hideIfAnyFlag: ["edda_shift_attempted", "edda_shift_done"], effects: paid, next: "act3_edda_reply" },
      { id: "reconcile-shift-ledger", label: "Reconcile her current shift ledger with the payroll record.", requireFlag: "edda_shift_consent", hideIfAnyFlag: ["edda_shift_attempted", "edda_shift_done"], check: { stat: "chrome", dc: 9, label: "Reconcile Edda's payroll ledger" }, successEffects: paid, failEffects: { ...pending, strain: 1 }, resultSuccess: "The desk separates the shift charges and offers paid bench work outside the archive.", resultFail: "The desk asks for another records review. The form stays open; no assignment is offered.", nextSuccess: "act3_edda_reply", nextFail: "act3_edda_reply" },
      { id: "negotiate-bench-shift", label: "Negotiate a supervised bench assignment during the inquiry.", requireFlag: "edda_shift_consent", hideIfAnyFlag: ["edda_shift_attempted", "edda_shift_done"], check: { stat: "face", dc: 8, label: "Negotiate Edda's temporary assignment", factionBonuses: [{ faction: "helion", min: 2, amount: 1, label: "The payroll desk recognizes your standing" }] }, successEffects: paid, failEffects: pending, resultSuccess: "The supervisor offers one paid bench assignment. Edda checks its terms before accepting.", resultFail: "The supervisor acknowledges the request and offers no shift. Edda keeps the reference number.", nextSuccess: "act3_edda_reply", nextFail: "act3_edda_reply" },
      { id: "fund-worker-representative", label: "Pay sixty creds for worker representation.", detail: "Book a review appointment. This payment guarantees no assignment or inquiry outcome.", requireCreds: 60, requireFlag: "edda_shift_consent", hideIfAnyFlag: ["edda_shift_attempted", "edda_shift_done"], effects: { creds: -60, flags: ["edda_shift_attempted", "edda_shift_pending", "edda_representation"] }, next: "act3_edda_reply" },
      { id: "leave-shift-pending", label: "Submit the signed request and leave its response pending.", requireFlag: "edda_shift_consent", hideIfAnyFlag: ["edda_shift_attempted", "edda_shift_done"], effects: pending, next: "act3_edda_reply" },
    ],
  },
  act3_edda_reply: {
    id: "act3_edda_reply", location: "Ward Nine records table", speaker: "Edda",
    text: (state) => `${shiftResponse(state)}\n\n${state.flags.edda_supported ? "Your earlier forty-creds bridge remains on Edda's receipt. Neither the application nor this reply refunds it." : "The payroll reply is separate from any money you chose to keep or spend elsewhere."}\n\n${state.flags.edda_shift_paid ? "Edda folds the assignment notice around the inquiry reference. 'One shift. Keep both papers. Don't make the first one an acquittal.'" : "Edda keeps the application reference beside the suspension notice. 'Tell Sera what arrived. Leave room for what hasn't.'"}\n\nThe application stays private. Sera keeps the original evidence under its existing terms.`,
    choices: [{ id: "record-shift-response", label: "Record the actual reply and return to the neighborhood.", requireFlag: "edda_shift_attempted", hideIfFlag: "edda_shift_done", effects: (state) => ({ flags: ["edda_shift_done", "visited_edda"], journal: [{ id: "edda-shift-response", text: shiftResponse(state), kind: "fact" }] }), next: "act3_neighborhood" }],
  },
};

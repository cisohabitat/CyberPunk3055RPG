import { kitBonuses } from "../loadout";
import type { Scene } from "../types";

export const METHOD_SCENES: Record<string, Scene> = {
  chapel_methods: {
    id: "chapel_methods", location: "Glass Chapel service bench", speaker: "Quill",
    text: "Quill has a service docket and a diagram of the side-door reader. Neither is a pass.\n\nIsolating the reader means hands-on work and a fault the clinic can notice. A service bargain means offering your own time and appearing on the orderly's work docket. You can try one preparation, then commit it or use the original doors. No preparation grants access to a patient or their account.",
    choices: [
      { id: "inspect-chapel-reader", label: "Inspect and isolate the service reader. Chrome 7.", hideIfFlag: "chapel_method_prepared", check: { stat: "chrome", dc: 7, label: "Isolate the service reader", itemBonuses: kitBonuses("chrome") }, effects: { flags: ["chapel_method_prepared"] }, successEffects: { flags: ["chapel_reader_isolated"] }, failEffects: { flags: ["chapel_reader_failed"] }, resultSuccess: "You find a local disconnect. Entry will add one strain and leave a machine fault, rather than a visitor name.", resultFail: "The disconnect is sealed. You stop before disabling anything; the ordinary doors remain available.", nextSuccess: "chapel_method_review", nextFail: "chapel_method_review" },
      { id: "offer-chapel-service", label: "Offer fifteen creds and a return service shift.", detail: "Reserve tools, not access. The orderly must still accept the bargain. Fee is not refundable; a refused offer creates no shift debt.", requireCreds: 15, hideIfFlag: "chapel_method_prepared", effects: { creds: -15, flags: ["chapel_method_prepared", "chapel_service_offer"] }, next: "chapel_method_review" },
      { id: "leave-chapel-methods", label: "Keep the ordinary doors available.", next: "route" },
    ],
  },
  chapel_method_review: {
    id: "chapel_method_review", location: "Glass Chapel service bench", speaker: "Quill",
    text: (s) => s.flags.chapel_reader_isolated ? "The local disconnect is ready. You can work through the maintenance opening: one strain, no visitor entry, a visible machine fault. Or leave it untouched and choose another door." : s.flags.chapel_service_offer ? "Tools reserved: fifteen creds already spent. The orderly can accept a service shift in exchange for access. Your handle goes on the work docket; a failed bargain leaves you outside, with the ordinary doors still available." : "The sealed reader stays on. The inspection cannot be repeated into a lucky result. Use a different door; no access or shift debt was created.",
    choices: [
      { id: "use-isolated-reader", label: "Work through the isolated reader. Add 1 strain.", requireFlag: "chapel_reader_isolated", hideIfFlag: "chapel_method_committed", effects: { strain: 1, flags: ["chapel_method_committed", "chapel_method_chrome", "quiet"] }, next: "undercroft" },
      { id: "bargain-service-entry", label: "Ask the orderly to accept your service bargain. Face 7.", detail: "Success records your handle and owes a return shift; the visitor watch remains. Refusal permits another door.", requireFlag: "chapel_service_offer", hideIfFlag: "chapel_method_committed", check: { stat: "face", dc: 7, label: "Offer a service shift", itemBonuses: kitBonuses("face") }, effects: { flags: ["chapel_method_committed"] }, successEffects: { flags: ["chapel_method_face", "chapel_shift_owed", "watched"] }, failEffects: { flags: ["chapel_service_refused"] }, resultSuccess: "The orderly accepts. Your handle is on the work docket and you owe the return shift; no patient access or recording permission was offered.", resultFail: "The orderly refuses your bargain. The reserved tool fee stays spent; you owe no shift. Choose another door.", nextSuccess: "undercroft", nextFail: "route" },
      { id: "leave-prepared-entry", label: "Use another door. Keep the preparation record.", next: "route" },
    ],
  },
  act2_witness_support: {
    id: "act2_witness_support", location: "Witness room, Glass Chapel", speaker: "Nia Pell",
    text: "Nia holds the chair brake herself. 'Tell me whose work you're offering.'\n\nAn arranged volunteer will accept your return shift instead of spending clinic standing. A successfully braced chair plus a carrying harness permits a slow, strenuous stair transfer; Nia chooses the stops. A scanner protocol plus Edda's earned signal baffle permits a clinic-only form without the usual strain. These methods need their stated preparation or equipment. The existing funded room, earned clearances and checkpoint route remain available without them.",
    choices: [
      { id: "promise-volunteer-shift", label: "Offer your own return shift to the arranged volunteer.", detail: "One clinic shift owed, payable later for 1 strain. Nia accepts transport only. No standing spent and no recording consent.", requireFlag: "witness_escort", effects: { flags: ["witness_done", "witness_safe", "witness_shift_owed", "witness_method_face"] }, next: "act2_witness_arrival" },
      { id: "harness-chair-transfer", label: "Use the harness and braced chair; let Nia call the stops.", detail: "Add 2 strain. Keep the reusable harness. No roll; preparation and equipment are required.", requireFlag: "witness_braced", requireItem: "chair-harness", effects: { strain: 2, flags: ["witness_done", "witness_safe", "witness_method_nerve"] }, next: "act2_witness_arrival" },
      { id: "baffle-clinic-transfer", label: "Spend Edda's signal baffle on the clinic-only form.", detail: "Scanner preparation required. Consume the earned baffle; no strain and no patient address.", requireFlag: "witness_scanner", requireItem: "signal-baffle", consumeItems: ["signal-baffle"], effects: { flags: ["witness_done", "witness_safe", "witness_method_chrome"] }, next: "act2_witness_arrival" },
      { id: "leave-witness-support", label: "Choose an existing transfer or leave the move open.", next: "act2_witness_door" },
    ],
  },
  act2_route_handling: {
    id: "act2_route_handling", location: "Canal dispatch alcove",
    text: "The steward has a carrying rig and two unsorted shelves. The rig needs a twenty-creds deposit, refunded only when the closed case and rig reach the stall. Carrying still adds two strain.\n\nAlternatively, Quill's introduction or your trained Face method lets you offer a sorting shift. The steward accepts your own work, not Kerr's name; completing it adds one strain. Neither method erases an entry-gate registration. Without the deposit, introduction or skill, use your planned approach or leave the collection unfinished.",
    choices: [
      { id: "borrow-depot-rig", label: "Deposit twenty creds; carry with the borrowed rig.", detail: "Add 2 strain. Collect the closed case now; refund requires observed handover and rig return next.", requireCreds: 20, hideIfAnyFlag: ["kerr_route_collected", "kerr_route_failed", "kerr_route_done"], effects: { creds: -20, strain: 2, flags: ["kerr_route_collected", "kerr_method_rig"] }, next: "act2_route_receipt" },
      { id: "offer-depot-shift", label: "Work the sorting shift for an anonymous case release.", detail: "Quill's introduction or trained Face required. Add 1 strain; existing recipient registration remains.", requireAnyFlag: ["kerr_route_intro", "perk_face"], hideIfAnyFlag: ["kerr_route_collected", "kerr_route_failed", "kerr_route_done"], effects: { strain: 1, flags: ["kerr_route_collected", "kerr_method_shift"] }, next: "act2_route_receipt" },
      { id: "leave-depot-handling", label: "Use the planned approach instead.", next: "act2_route_crossing" },
    ],
  },
};

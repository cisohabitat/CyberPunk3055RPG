import type { Choice, GameState } from "./types";
import { depotOutcome } from "./depot-methods";

export function chapelMethodResponse(state: GameState): string {
  if (state.flags.chapel_window_staffed_exit) return "Lumen recognizes the visitor watch from the staffed stair. 'The service window closed. Their eyes didn't.'";
  if (state.flags.chapel_window_nerve) return "Lumen tests the strained latch. 'You held it open with your hands. Maintenance will notice that.'";
  if (state.flags.chapel_window_ghost) return "Lumen looks toward the quiet landing. 'You waited for their return pass. That left no new visitor entry.'";
  if (state.flags.chapel_method_chrome) return "Lumen glances at the dead service reader. 'You isolated it. The maintenance fault is on their log, even if your name isn't.'";
  if (state.flags.chapel_method_face && state.flags.chapel_shift_kept) return "Lumen closes the work slip. 'You came back for the shift. The docket stays; the work is done.'";
  if (state.flags.chapel_method_face) return "Lumen reads the service docket. 'The orderly accepted a shift, not a confession. You still owe the work you offered.'";
  return "";
}
export function witnessMethodResponse(state: GameState): string {
  if (state.flags.witness_shift_owed && state.flags.witness_shift_kept) return "Nia remembers the volunteer walking beside her chair. 'You kept your shift. Don't turn that into something I owe you.'";
  if (state.flags.witness_shift_owed) return "Nia remembers the volunteer walking beside her chair. 'You offered your own shift. Don't turn that into something I owe you.'";
  if (state.flags.witness_method_nerve) return "Nia taps the chair's strap. 'You stopped when I asked. Remember that, not just the weight you carried.'";
  if (state.flags.witness_method_chrome) return "Nia folds the clinic-only form. 'An empty address field. Keep it that way when you tell the story.'";
  if (state.flags.witness_method_ghost) return "Nia remembers waiting for the quiet crossing. 'I chose to wait with you. Quiet doesn't mean I agreed to a recording.'";
  return "";
}
export function kerrMethodResponse(state: GameState): string {
  if (state.flags.depot_started) {
    const record = depotOutcome(state);
    if (!state.flags.depot_complete) return record;
    const response = state.flags.depot_chrome ? "Kerr puts a finger against the depot return mark. 'You left them somewhere to send it back. Good. A private name shouldn't make a lost case somebody else's problem.'"
      : state.flags.depot_ghost ? "Kerr watches a loaded cart go past the stall. 'You let it go without you. Most runners hear an empty corridor and stop listening.'"
      : state.flags.depot_nerve ? "Kerr touches the lower strap without opening the case. 'You carried the weight where it was. Not where the handle told you it ought to be.'"
      : state.flags.depot_registered_contract ? "Kerr keeps the recipient contract beside the depot slip. 'This has my name, too. Keep it beside the terms we agreed.'"
      : state.flags.depot_cash_liability ? "Kerr leaves the paid liability receipt on your side of the counter. 'You paid for their responsibility. My case doesn't make that money mine.'"
      : "Kerr leaves your work docket on your side of the counter. 'My case. Your terms with the depot. Keep both names on the right paper.'";
    return `${record}\n\n${response}`;
  }
  if (state.flags.kerr_method_rig) return state.flags.kerr_rig_returned ? "Kerr taps the receipt for the returned rig and its refunded twenty-creds deposit. 'You paid with your back. Keep the receipt for that, too.'" : "The borrowed rig still needs to go back. Its twenty-creds deposit has not been refunded.";
  if (state.flags.kerr_method_shift) return "Kerr points at the steward's work slip. 'You sorted somebody else's shelves for this. That's your time, not a favor I signed for.'";
  return "";
}
export const witnessShiftChoice: Choice = {
  id: "work-witness-shift", label: "Keep your promised clinic return shift. Add 1 strain.",
  requireFlag: "witness_shift_owed", hideIfFlag: "witness_shift_kept",
  effects: { strain: 1, flags: ["witness_shift_kept"], journal: [{ id: "witness-return-shift", kind: "fact", text: "You worked the clinic return shift you promised the volunteer. Nia incurred no debt and supplied no recording permission through this work." }] }, next: "act2_middle",
};

export const depotShiftChoice: Choice = {
  id: "work-depot-return-shift", label: "Keep my promised depot return shift. Add 1 strain.",
  requireFlag: "depot_shift_owed", hideIfFlag: "depot_shift_kept",
  effects: { strain: 1, flags: ["depot_shift_kept"], journal: [{ id: "depot-return-work", kind: "fact", text: "You completed the depot sorting shift promised in your own name. Kerr owed no work. Existing recipient registration and the original promise remain." }] }, next: "act2_middle",
};

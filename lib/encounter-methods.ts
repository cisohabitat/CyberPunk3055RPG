import type { Choice, GameState } from "./types";

export function chapelMethodResponse(state: GameState): string {
  if (state.flags.chapel_method_chrome) return "Lumen glances at the dead service reader. 'You isolated it. The maintenance fault is on their log, even if your name isn't.'";
  if (state.flags.chapel_method_face) return "Lumen reads the service docket. 'The orderly accepted a shift, not a confession. You still owe the work you offered.'";
  return "";
}
export function witnessMethodResponse(state: GameState): string {
  if (state.flags.witness_shift_owed) return "Nia remembers the volunteer walking beside her chair. 'You offered your own shift. Don't turn that into something I owe you.'";
  if (state.flags.witness_method_nerve) return "Nia taps the chair's strap. 'You stopped when I asked. Remember that, not just the weight you carried.'";
  if (state.flags.witness_method_chrome) return "Nia folds the clinic-only form. 'An empty address field. Keep it that way when you tell the story.'";
  if (state.flags.witness_method_ghost) return "Nia remembers waiting for the quiet crossing. 'I chose to wait with you. Quiet doesn't mean I agreed to a recording.'";
  return "";
}
export function kerrMethodResponse(state: GameState): string {
  if (state.flags.kerr_method_rig) return state.flags.kerr_rig_returned ? "Kerr watches you return the borrowed rig and reclaim its twenty-creds deposit. 'You paid with your back. Keep the receipt for that, too.'" : "The borrowed rig still needs to go back. Its twenty-creds deposit has not been refunded.";
  if (state.flags.kerr_method_shift) return "Kerr points at the steward's work slip. 'You sorted somebody else's shelves for this. That's your time, not a favor I signed for.'";
  return "";
}
export const witnessShiftChoice: Choice = {
  id: "work-witness-shift", label: "Keep your promised clinic return shift. Add 1 strain.",
  requireFlag: "witness_shift_owed", hideIfFlag: "witness_shift_kept",
  effects: { strain: 1, flags: ["witness_shift_kept"], journal: [{ id: "witness-return-shift", kind: "fact", text: "You worked the clinic return shift you promised the volunteer. Nia incurred no debt and supplied no recording permission through this work." }] }, next: "act2_middle",
};

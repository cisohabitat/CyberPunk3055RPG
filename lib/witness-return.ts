import type { Choice, GameState } from "./types";

export const WITNESS_RETURN_QUOTES = {
  approved: "The photograph is on the shelf now. I can look at it without watching the door at the same time. Keep the words I agreed to. The rest of this room is mine.",
  waiting: "I put the photograph on the shelf. I have not decided what I want to say about the night. Leave the recorder off. I need a room that can be quiet without becoming part of your story.",
  registered: "The nurse closed the door. Then someone outside called the room number. I stopped listening to the nurse. Whatever you can prove about the old order, do not call this room protected.",
  relocated: "I unpacked the photograph twice. I want this to be the last shelf I have to choose because somebody found the first one. You moved me again. You did not move the first room out of their records.",
  workOwed: "The volunteer is still waiting for the shift you offered. Do not leave that work beside her bed.",
  workKept: "The volunteer went home when you took the shift. That was your promise to keep, never hers.",
  workMissed: "I took the shift you promised. I was here when the volunteers went home. Next time, offer me the hours you mean to give.",
} as const;

const has = (state: GameState, id: string) => state.journal.some(row => row.id === id);
export function witnessWorkReply(state: GameState): string {
  if (!state.flags.witness_shift_owed || !has(state, "witness-shift-promise")) return "";
  if (state.flags.witness_shift_kept && has(state, "witness-return-shift")) return `Lumen folds the completed work slip. "${WITNESS_RETURN_QUOTES.workKept}"`;
  if (!state.flags.witness_shift_kept) return `Lumen keeps the volunteer's work slip on her side of the table. "${WITNESS_RETURN_QUOTES.workOwed}"`;
  return "";
}

export const WITNESS_RETURN_CHOICES: Choice[] = [
  { id: "hear-witness-pause", label: "Hear Nia with the recorder still off.", detail: "A private conversation, without asking for an account.", requireAllFlags: ["witness_returns_enabled", "witness_safe", "witness_deferred"], hideIfAnyFlag: ["act2_done", "nia_contact_paused", "witness_lost", "witness_return_waiting"], hideIfJournal: "nia-account", next: "act2_witness_return_private" },
  { id: "hear-witness-account", label: "Ask what the new room means to Nia.", detail: "Her approved account keeps its own terms.", requireAllFlags: ["witness_returns_enabled", "witness_safe"], requireJournal: "nia-account", hideIfAnyFlag: ["act2_done", "nia_contact_paused", "witness_lost", "witness_return_approved"], next: "act2_witness_return_private" },
  { id: "hear-witness-clinic", label: "Hear Nia after the registered transfer.", detail: "Care and the exposed room remain separate outcomes.", requireAllFlags: ["witness_returns_enabled", "witness_lost"], hideIfAnyFlag: ["act2_done", "nia_contact_paused", "witness_relocated", "witness_return_registered"], next: "act2_witness_return_registered" },
  { id: "hear-witness-move", label: "Hear Nia after the second move.", detail: "The first location remains exposed.", requireAllFlags: ["witness_returns_enabled", "witness_lost", "witness_relocated"], hideIfAnyFlag: ["act2_done", "nia_contact_paused", "witness_return_relocated"], next: "act2_witness_return_relocated" },
];

export const WITNESS_SHIFT_RETURN: Choice = {
  id: "hear-unkept-witness-shift", label: "Answer Lumen about the shift you left unworked.",
  detail: "Hear her response. The earlier promise remains in the record.",
  requireAllFlags: ["witness_returns_enabled", "act2_done", "witness_shift_owed"], requireJournal: "witness-shift-promise",
  hideIfAnyFlag: ["witness_shift_kept", "witness_return_shift_heard"], next: "act3_witness_shift_return",
};

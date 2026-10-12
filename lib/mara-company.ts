import type { GameState } from "./types";

/** Personal conduct is recorded separately from the letter and historical evidence. */
export function maraCompanyRecord(state: GameState): string | undefined {
  if (!state.flags.mara_company_chosen) return;
  if (state.flags.mara_company_left) return "You carried the private reply yourself and left Mara to keep the window hour alone. The walk cost its ordinary strain; no shared hour was recorded.";
  if (state.flags.mara_company_declined) return "You declined the invitation to stay. Mara kept the hour for herself; dispatch retained its separate status.";
  if (!state.flags.mara_company_kept) return "You chose to stay, but completion of the shared hour has not been recorded. Dispatch retains its separate status.";
  if (state.flags.mara_company_courier) return "You spent fifteen creds on private courier dispatch and stayed for the window hour. Neither the company nor the payment supplied a desk reply, acquittal or new quotation permission.";
  return `You stayed for the window hour while the sealed envelope missed the current intake batch.${state.flags.response_sent ? " You arranged private dispatch afterward for the next intake batch; that later act did not change the earlier wait." : " No dispatch through you was recorded."} Company supplied no clinic endorsement, acquittal or witness permission.`;
}

export function maraCompanyReply(state: GameState): string | undefined {
  if (state.flags.mara_company_left) return "Mara turns the cup's chip toward the window. ‘I did this after you left. You took the envelope; I kept the hour. I wanted you here, too. Both things can be true.’ She leaves the spare chair where it was.";
  if (state.flags.mara_company_declined) return "Mara turns the cup's chip toward the window. ‘I kept the hour for myself. You don't owe me company because you heard what I did.’ She leaves room for your answer without asking again.";
  if (!state.flags.mara_company_kept) return;
  return state.flags.mara_company_courier
    ? "Mara turns the cup's chip toward the window, the way she did while you stayed. ‘You paid someone to carry the paper so you could sit here. I remember the chair, too.’ She does not ask you to make either act a defense of the old order."
    : `Mara turns the cup's chip toward the window, the way she did while you stayed. ${state.flags.response_sent ? "‘The envelope went in the next batch. That hour didn't need a receipt to have happened.’" : "‘The envelope is still here. I'm glad you sat with me. I still need to send it.’"} She gives you no clean ending to write over either part.`;
}

export function maraCompanyCoda(state: GameState): string | undefined {
  if (state.flags.mara_company_kept) return "the cup Mara turned toward the window during the hour you shared";
  if (state.flags.mara_company_left) return "the spare chair you left when you carried Mara’s reply";
  if (state.flags.mara_company_declined) return "the window hour Mara kept for herself";
}

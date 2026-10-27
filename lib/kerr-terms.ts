import type { GameState } from "./types";

export const KERR_TERMS_QUOTES = {
  opening: "You want me to decide this is somebody else's trouble. Tell me what it costs you.",
  negotiate: "Twenty for the clinic. Your name in my report. I let you walk under objection. That is not clearance.",
  named: "I can give you a door. I can't give you a clean name.",
  bluff: "Then say which desk. Don't look at the glass while you do it.",
  bluffed: "If that desk doesn't answer, I will remember who sent me to it.",
  exposed: "There is no clearance. There is you, using one more person as a door.",
  retreat: "You can leave. Don't call it saving her.",
  returnNamed: "I wrote your name. Not your reason. Those are different things.",
  returnBluffed: "I called the desk you gave me. There wasn't a desk. You made my shift longer so yours could end.",
  returnExposed: "You tried a clearance that wasn't there. Don't ask me to remember it differently.",
  returnWithdrew: "You left the hour in the room. I stayed. Neither of us gets to call that a rescue.",
  returnOwned: "You said it was a lie. I heard you. That doesn't make the first story true.",
  owned: "You want me to trust you because you've stopped lying for a minute? Start with the next minute.",
} as const;

const OUTCOMES = ["named", "bluffed", "exposed", "withdrew"] as const;
const admitted = (state: GameState) => state.flags.kerr_terms_owned && state.journal.some(j => j.id === "kerr-terms-owned");
export function kerrTermsOutcome(state: GameState): typeof OUTCOMES[number] | undefined {
  const found = OUTCOMES.filter(outcome => state.flags[`kerr_terms_${outcome}`]);
  return found.length === 1 ? found[0] : undefined;
}

export function kerrTermsReturn(state: GameState): string {
  const outcome = kerrTermsOutcome(state);
  if (!outcome || !state.journal.some(j => j.id === `kerr-terms-${outcome}`)) return "";
  const line = admitted(state) && ["bluffed", "exposed"].includes(outcome)
    ? KERR_TERMS_QUOTES.returnOwned : { named: KERR_TERMS_QUOTES.returnNamed, bluffed: KERR_TERMS_QUOTES.returnBluffed,
      exposed: KERR_TERMS_QUOTES.returnExposed, withdrew: KERR_TERMS_QUOTES.returnWithdrew }[outcome];
  return `Kerr turns his wrist, looking for a clock he is not wearing tonight. The chapel has reached this awning ahead of you.\n\n"${line}"`;
}

export function kerrTermsCoda(state: GameState): string | undefined {
  const outcome = kerrTermsOutcome(state);
  if (!outcome || !state.journal.some(j => j.id === `kerr-terms-${outcome}`)) return;
  if (outcome === "named") return "Twenty credits bought Kerr a way toward the clinic, not a promise of treatment. Your name went into his report. You carried the hour out with both costs attached.";
  if (outcome === "withdrew") return "You left the original in the chair room. Leaving kept you out of that fight; it did not take Mara's hour out of Helion's reach.";
  return admitted(state)
    ? "You admitted the clearance was a lie. Kerr heard you. The admission belongs beside the deception; it does not cross it out."
    : outcome === "bluffed" ? "The clearance never existed. You carried the hour through the gap in a story Kerr would later check."
      : "Kerr checked your clearance and found a lie. Whatever came after the doorway, that first attempt did not become permission.";
}

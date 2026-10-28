import { eddaPayoff, kerrPayoff, PAYOFF_QUOTES as Q, payoffReturnEffect } from "../emotional-payoff";
import type { Scene } from "../types";

export const EMOTIONAL_PAYOFF_SCENES: Record<string, Scene> = {
  act3_payoff_edda: { id: "act3_payoff_edda", location: "Ward Nine records table", speaker: "Edda", text: s => {
    const outcome = eddaPayoff(s); if (!outcome) return "There is no supported question from this desk to revisit. Edda's earlier limits remain.";
    const work = outcome === "authenticated" ? "Edda sets the question beside the issuing-key result you actually obtained. She touches the cancellation line, then takes her hand off the paper. Mara's separate approval remains where it was."
      : outcome === "corroborated" ? "Edda sets your question beside the retrieved movement account. She puts her finger below its last line, where the issuing hand is still unverified. Then she lifts the cup out of the way."
        : s.flags.craft_archive_attempted ? "Edda leaves a space beside the question you submitted. The attempted search produced no corroborating record or authenticated key to put there. She moves her cup to make a second place at the table."
          : "Edda unfolds the question you drafted but never submitted. There is no search result attached to it. She moves her cup to make a second place at the table.";
    return `${work}\n\n"${Q[outcome]}"\n\nHer cup leaves a pale ring on the table. The rain goes on.`;
  }, choices: [{ id: "payoff-keep-edda", label: "Stay for the minute she offered. Then go back.", effects: s => payoffReturnEffect(s, "edda"), next: s => s.flags.craft_return_from_edda ? "act3_edda_visit" : "act3_neighborhood" }] },
  act3_payoff_kerr: { id: "act3_payoff_kerr", location: "Ward Nine stall", speaker: "Kerr", text: s => {
    const outcome = s.flags.kerr_route_denied ? undefined : kerrPayoff(s); if (!outcome) return "Kerr has no supported collection answer to add. The earlier contact limit and collection record remain.";
    const work = outcome === "private" ? "The case you handed over is still closed. Kerr clears a space beside the table leg. He does not try the brace or tell you how a fitting will go. For once, he points somewhere that is not a door."
      : outcome === "registered" ? "The received case is closed beside Kerr. He folds the recipient docket once, carefully, and places it on top. He keeps his hand there after the paper stops moving."
        : s.flags.craft_kerr_canceled ? "You canceled the bargain before departing. Kerr puts that slip away without calling it a failed delivery. He leaves the space beside the table leg empty."
          : "The case never reached Kerr through your collection. He moves the cup away from the edge and leaves the space beside the table leg empty. His old strap stays fastened.";
    return `${work}\n\n"${Q[outcome]}"\n\nYou let the minute pass.`;
  }, choices: [{ id: "payoff-keep-kerr", label: "Let the quiet stand. Return to the collection account.", effects: s => payoffReturnEffect(s, "kerr"), next: "act3_kerr_collection" }] },
};

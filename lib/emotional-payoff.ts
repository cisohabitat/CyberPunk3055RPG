import { craftBond, craftInspected, craftScope } from "./encounter-craft";
import type { Choice, Effect, GameState } from "./types";

export const PAYOFF_QUOTES = {
  authenticated: "Put the reader away. I want to hear the rain for a minute.",
  corroborated: "The tea will be cold. Sit down anyway.",
  unanswered: "Stay a minute. You don't have to bring me an answer to sit here.",
  private: "Put it beside the table leg. I can reach it from here.",
  registered: "Leave the case there. I need a minute before we talk about anything else.",
  uncollected: "Leave that space. I'll know what it's for.",
  names: "Wait. Let me hear that one again.",
  quiet: "Mind the broken step. It's the second one down.",
  witness: "Your name can stay. Leave theirs where they are.",
  listed: "Mind the edge. Keep that page in one piece.",
} as const;
const fact = (s: GameState, id: string) => s.journal.some(j => j.id === id && j.kind === "fact");
const wall = (s: GameState) => Boolean(s.flags.emotional_payoffs_enabled && s.flags.act2_done);
export function eddaPayoff(s: GameState): "authenticated" | "corroborated" | "unanswered" | undefined {
  if (!wall(s) || !s.flags.encounter_craft_enabled || !craftInspected(s) || !craftScope(s)) return;
  const submitted = Boolean(s.flags.craft_archive_attempted && fact(s, "craft-archive-request"));
  const draft = !s.flags.craft_archive_attempted && !fact(s, "craft-archive-request") && craftInspected(s) && craftScope(s);
  if (!submitted && !draft) return;
  const proof = fact(s, "verified-order");
  if (submitted && s.flags.archive_done && s.flags.order_verified && proof) return s.flags.archive_key_authenticated ? "authenticated" : "corroborated";
  if (!s.flags.order_verified && !s.flags.archive_key_authenticated && !proof) return "unanswered";
}
export function kerrPayoff(s: GameState): "private" | "registered" | "uncollected" | undefined {
  if (!wall(s) || !craftBond(s)) return;
  if (s.flags.kerr_route_started && !fact(s, "kerr-itinerary")) return;
  if (s.flags.kerr_route_delivered) {
    if (!s.flags.kerr_route_started || !s.flags.kerr_route_done || !fact(s, "kerr-itinerary") || !fact(s, "kerr-collection-outcome") || s.flags.craft_kerr_canceled) return;
    const trace = s.flags.kerr_route_trace || s.flags.kerr_route_courier || s.journal.some(j => j.kind === "fact" && (j.id === "kerr-itinerary" && j.text.includes("The gate recorded") || j.id === "kerr-collection-outcome" && j.text.includes("broke the promised private terms")));
    return trace ? "registered" : "private";
  }
  if (s.flags.kerr_route_collected || s.flags.kerr_route_done && !s.flags.craft_kerr_canceled && !fact(s, "kerr-collection-outcome")) return;
  if (fact(s, "kerr-collection-outcome") && s.journal.some(j => j.id === "kerr-collection-outcome" && j.text.startsWith("Kerr received"))) return;
  if (s.flags.craft_kerr_canceled && !fact(s, "craft-kerr-settlement")) return;
  return "uncollected";
}
export const DEFERRED_EDDA_RETURN: Choice = { id: "payoff-return-draft", label: "Bring the unsubmitted question back to Edda.", detail: "An unanswered question and a personal visit. No retrieved source or new permission.", requireAllFlags: ["emotional_payoffs_enabled", "act2_done"], hideIfAnyFlag: ["craft_archive_attempted", "payoff_edda_seen"], effects: { flagsOff: ["craft_return_from_edda"] }, next: "act3_payoff_edda" };
export const KERR_PERSONAL_RETURN: Choice = { id: "payoff-kerr-moment", label: "Let the collection papers rest. Stay a minute with Kerr.", detail: "Hear him without settling security, reopening contact or inventing a fitting.", requireAllFlags: ["emotional_payoffs_enabled", "act2_done"], hideIfAnyFlag: ["payoff_kerr_seen", "kerr_route_denied"], next: "act3_payoff_kerr" };
export function payoffReturnEffect(s: GameState, person: "edda" | "kerr"): Effect {
  if (s.flags[`payoff_${person}_seen`] || person === "kerr" && s.flags.kerr_route_denied) return {};
  const result = person === "edda" ? eddaPayoff(s) : kerrPayoff(s); if (!result) return {};
  return { flags: [`payoff_${person}_seen`, ...(person === "edda" ? ["craft_archive_returned"] : [])], journal: [{ id: `payoff-${person}-moment`, kind: "claim", text: `${person === "edda" ? "Edda" : "Kerr"} said: ${PAYOFF_QUOTES[result]} This personal response changed no source, custody, permission, security settlement, treatment, contact limit or inquiry result.` }] };
}
export function payoffChoices(s: GameState, sceneId: string, choices: Choice[]): Choice[] {
  if (!s.flags.emotional_payoffs_enabled) return sceneId.startsWith("act3_payoff_") ? [{ id: "payoff-unavailable-exit", label: "Return to the wall without adding an answer.", next: "act3_arrival" }] : choices;
  if (sceneId === "act3_payoff_edda" && (!eddaPayoff(s) || s.flags.payoff_edda_seen) || sceneId === "act3_payoff_kerr" && (!kerrPayoff(s) || s.flags.payoff_kerr_seen || s.flags.kerr_route_denied)) return [{ id: "payoff-unavailable-exit", label: "Return to the wall without adding an answer.", next: "act3_arrival" }];
  return choices.filter(c => c.id !== "payoff-return-draft" || Boolean(eddaPayoff(s))).filter(c => c.id !== "payoff-kerr-moment" || Boolean(kerrPayoff(s))).map(c => c.id === "craft-return-edda" && eddaPayoff(s) ? { ...c, next: "act3_payoff_edda" } : c);
}
const endings = {
  ending_names: { quote: PAYOFF_QUOTES.names, previous: '"One at a time," Sera says. "The wall has room for a voice. It has never had room for an excuse."', action: "Rain reaches the lower edge of the names. Sera moves her hand down and leaves her pencil still until you finish. Then she looks at the place where your voice stopped." },
  ending_quiet: { quote: PAYOFF_QUOTES.quiet, previous: '"I won\'t call you back," Sera says. "I have the pencil. The rain can wait with me."', action: "Halfway down the stair you hear Sera set the pencil against the next line. She does not ask you to turn around. Her voice reaches you through the rain." },
  ending_witness: { quote: PAYOFF_QUOTES.witness, previous: '"You came late," Sera says. "Leave that beside what you know. Don\'t make it a clean story for me."', action: "Sera does not draw a line from your name to the names above it. She leaves the space between them. When she sees you looking, she waits." },
  ending_listed: { quote: PAYOFF_QUOTES.listed, previous: '"The folio is closed," Ives says. "Your name is still on file. That is what the tower will keep."', action: "Ives opens the clasp again to free a corner of the page. Behind his shoulder, Sera places a fresh blank sheet beneath her pencil. Neither of them writes on it." },
} as const;
export function emotionalFinale(s: GameState, previous: string): string {
  if (!wall(s) || !Object.hasOwn(endings, s.sceneId)) return previous;
  const f = s.flags;
  if (Number(Boolean(f.spoke_names)) + Number(Boolean(f.confirmed_leak)) + Number(Boolean(f.ives_took_list)) !== (s.sceneId === "ending_quiet" ? 0 : 1)
    || s.sceneId === "ending_names" && !f.spoke_names || s.sceneId === "ending_witness" && !f.confirmed_leak || s.sceneId === "ending_listed" && !f.ives_took_list) return previous;
  const ending = endings[s.sceneId as keyof typeof endings]; if (!previous.endsWith(ending.previous)) return previous;
  const heard = (person: "edda" | "kerr") => {
    const outcome = person === "edda" ? eddaPayoff(s) : kerrPayoff(s);
    return outcome && f[`payoff_${person}_seen`] && s.journal.some(j => j.id === `payoff-${person}-moment` && j.kind === "claim" && j.text.includes(PAYOFF_QUOTES[outcome]));
  };
  // The runner recalls private visits; neither Sera nor Ives acquires their contents.
  const memory = heard("edda") ? "You remember the minute you stayed with Edda. No one asked you for a sentence to put on a wall."
    : heard("kerr") ? "You remember the space beside Kerr's table. What reached it, and what did not, stays with you here." : "";
  return `${previous.slice(0, -ending.previous.length)}${ending.action}${memory ? `\n\n${memory}` : ""}\n\n"${ending.quote}"`;
}

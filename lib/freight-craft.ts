import type { Choice, Effect, GameState } from "./types";

export const RAMP_QUOTES = {
  terms: "I will hold the catch while you carry. Show me where the load can rest. I am not your second carrier.",
  survey: "Watch where the weight can stop. Not how quickly you can make it move.",
  gear: "Use the support you actually have. A promise won't hold the bottom of this case.",
  load: "The gate is mine. The weight is yours. Call down before the bend if you need the landing.",
  arrived: "Put it down flat. The stamp is still the clerk's work.",
  stopped: "The case stays under the hood. A stopped carry is not a lost parcel.",
  kept: "You called down, and there was somewhere to put it. That's work I can do with you.",
  failed: "You stopped before the seal opened. How it went on from there belongs in the clinic ledger.",
  closed: "A no before the weight is in the air is a useful word. Keep it available.",
  unfinished: "We never finished that carry. The rest belongs in the clinic ledger.",
} as const;
export const RAMP_RECORDS = {
  offer: "Asa offered to hold the freight gate, not share the load. A cooperative carry requires a real stopping place before lifting. Hearing the offer costs nothing and grants no handover or receipt.",
  agreement: "You agreed to plan a trained Nerve carry while Asa holds the gate. Survey and cancellation are free. A real harness or five-creds rest blocks costs one strain on lifting; carrying without either costs two. No lift or delivery has happened yet.",
  landing: "The broad landing lies before the bend, beside the cold hood. A closed case can rest flat there while Asa keeps the gate clear.",
  rail: "Beyond the bend the rail narrows the passage. There is no level place to set the case down; the short-looking line is not a resting place.",
  canceled: "The cooperative carry was canceled before lifting. No strain or materials were charged and no handover was made by this plan.",
  declined: "You declined Asa's cooperative carry before agreeing to it. The original freight preparations and routes remain available.",
  arrived: "The trained carry used the broad landing before the bend. Asa held the gate while the closed cold case reached clinic intake. No stock receipt, passenger clearance or patient treatment was established by this handover.",
  failed: "The carry tried the narrow rail beyond the bend and was stopped. The closed case returned under the cold hood. Effort and any rest-block fee remain spent; no gate registration, handover or receipt was created by this stopped carry.",
} as const;
const has = (s: GameState, id: string, text?: string) => s.journal.some(j => j.id === id && j.kind === (id === "freight-promise" || id === "freight-ramp-terms" ? "promise" : id === "freight-ramp-moment" ? "claim" : "fact") && (!text || j.text === text));
const closedWeek = (s: GameState) => Boolean(s.flags.act2_done || s.sceneId.startsWith("act3_") || s.sceneId.startsWith("ending_"));
const enabled = (s: GameState) => Boolean(s.flags.freight_craft_enabled && s.origin === "dustline" && s.flags.freight_started && has(s, "freight-promise"));
const offer = (s: GameState) => enabled(s) && s.flags.ramp_offered && has(s, "freight-ramp-offer", RAMP_RECORDS.offer);
export const rampAgreement = (s: GameState) => Boolean(offer(s) && s.flags.ramp_agreed && has(s, "freight-ramp-terms", RAMP_RECORDS.agreement) && !s.flags.ramp_declined);
export const rampInspected = (s: GameState) => Boolean(rampAgreement(s) && s.flags.ramp_read_landing && s.flags.ramp_read_rail && has(s, "freight-ramp-landing", RAMP_RECORDS.landing) && has(s, "freight-ramp-rail", RAMP_RECORDS.rail));
export function rampSupportRecord(mode: "harness" | "blocks" | "bare") {
  return mode === "harness" ? "The carry began with the owned chair harness: one strain, no fee. The harness remains owned."
    : mode === "blocks" ? "The carry began with five real creds spent on rest blocks and one strain. Materials and effort are not refunded if the carry stops."
      : "The carry began without support equipment: two strain, no fee. Effort is not refunded if the carry stops.";
}
export function rampPaid(s: GameState) {
  if (!rampInspected(s) || !s.flags.ramp_started || !s.flags.perk_nerve || s.flags.ramp_canceled || s.flags.ramp_declined) return false;
  const modes = (["harness", "blocks", "bare"] as const).filter(mode => s.flags[`ramp_support_${mode}`]);
  return modes.length === 1 && has(s, "freight-ramp-load", rampSupportRecord(modes[0]));
}
export function rampOutcome(s: GameState): "kept" | "failed" | "closed" | "unfinished" | undefined {
  if (!offer(s)) return;
  const f = s.flags;
  if ([f.ramp_arrived, f.ramp_failed, f.ramp_canceled, f.ramp_declined].filter(Boolean).length > 1) return;
  if (f.ramp_started && !rampPaid(s)) return;
  if (f.ramp_arrived) return rampPaid(s) && f.freight_at_intake && has(s, "freight-ramp-handover", RAMP_RECORDS.arrived) ? "kept" : undefined;
  if (f.ramp_failed) return rampPaid(s) && has(s, "freight-ramp-stop", RAMP_RECORDS.failed) ? "failed" : undefined;
  if (f.ramp_canceled) return rampAgreement(s) && !f.ramp_started && has(s, "freight-ramp-canceled", RAMP_RECORDS.canceled) ? "closed" : undefined;
  if (f.ramp_declined) return !f.ramp_agreed && !f.ramp_started && has(s, "freight-ramp-declined", RAMP_RECORDS.declined) ? "closed" : undefined;
  return rampAgreement(s) ? "unfinished" : undefined;
}
export function rampLoad(mode: "harness" | "blocks" | "bare"): Effect {
  return { strain: mode === "bare" ? 2 : 1, ...(mode === "blocks" ? { creds: -5 } : {}), flags: ["ramp_started", `ramp_support_${mode}`], journal: [{ id: "freight-ramp-load", kind: "fact", text: rampSupportRecord(mode) }] };
}
export function rampReturnEffect(s: GameState): Effect {
  const outcome = rampOutcome(s); if (!outcome || s.flags.ramp_return_seen || !closedWeek(s)) return {};
  return { flags: ["ramp_return_seen"], journal: [{ id: "freight-ramp-moment", kind: "claim", text: `Asa said: "${RAMP_QUOTES[outcome]}" This personal response changes no delivery, clearance, patient outcome, historical source or permission.` }] };
}
export function closedRampFreightRecord(s: GameState): string | undefined {
  if (rampAgreement(s) && closedWeek(s) && !s.flags.freight_done && !s.flags.freight_delivered && !s.flags.freight_late_received) return "The week closed without an observed freight stock receipt. The parcel's later delivery and patient outcome remain unconfirmed; no passenger clearance was earned.";
}
function work(s: GameState) {
  return enabled(s) && !closedWeek(s) && !s.flags.freight_done && !s.flags.freight_at_intake && !s.flags.freight_exposed && !s.flags.freight_registered && !s.flags.freight_attempted
    && ["seal", "manifest", "window"].every(id => s.flags[`freight_${id}`] && has(s, `freight-${id}`));
}
const record = (id: string, text: string, flags: string[]): Effect => ({ flags, journal: [{ id, text, kind: "fact" }] });
export const RAMP_SCENES = ["act2_ramp_terms", "act2_ramp_survey", "act2_ramp_gear", "act2_ramp_load", "act2_ramp_arrived", "act2_ramp_stopped", "act3_ramp_return"] as const;
export function rampSceneAvailable(s: GameState, id: string): boolean {
  if (!(RAMP_SCENES as readonly string[]).includes(id)) return false;
  return Boolean(id === "act3_ramp_return" ? closedWeek(s) && rampOutcome(s) && !s.flags.ramp_return_seen
    : id === "act2_ramp_arrived" ? !closedWeek(s) && rampOutcome(s) === "kept" && !s.flags.freight_done
      : work(s) && offer(s) && !s.flags.ramp_canceled && !s.flags.ramp_declined
        && (id === "act2_ramp_terms" ? !s.flags.ramp_agreed : rampAgreement(s))
        && (["act2_ramp_load", "act2_ramp_stopped"].includes(id) ? rampPaid(s) && (id === "act2_ramp_stopped" ? s.flags.ramp_failed : !s.flags.ramp_failed && !s.flags.ramp_arrived) : !s.flags.ramp_started)
        && (id === "act2_ramp_gear" ? rampInspected(s) : true));
}
export function freightCraftChoices(s: GameState, id: string, choices: Choice[]): Choice[] {
  const atReturn = id === "act3_ramp_return";
  if (id.startsWith("act2_ramp_") || atReturn) {
    const valid = rampSceneAvailable(s, id);
    if (!valid) return [{ id: "ramp-unavailable-exit", label: "Return without inventing a carry or receipt.", next: closedWeek(s) ? "act3_neighborhood" : "districts" }];
    return choices;
  }
  let result = choices;
  if (work(s) && !s.flags.ramp_canceled && !s.flags.ramp_declined && !s.flags.ramp_failed && !s.flags.ramp_arrived
    && (id === "act2_freight_prep" || ["districts", "act2_middle"].includes(id) && rampAgreement(s))) {
    result = [...result, { id: "ramp-open-plan", label: rampAgreement(s) ? "Resume the carry you planned with Asa." : "Ask Asa to plan the ramp carry with you.",
      detail: "Hear the gate-holder's limits; free survey and cancellation. Trained Nerve can choose real support, strain and a resting place. No receipt just for making a plan.",
      effects: offer(s) ? {} : record("freight-ramp-offer", RAMP_RECORDS.offer, ["ramp_offered"]),
      next: rampAgreement(s) ? s.flags.ramp_started ? "act2_ramp_load" : rampInspected(s) ? "act2_ramp_gear" : "act2_ramp_survey" : "act2_ramp_terms" }];
  }
  if (id === "act3_freight_visit" && closedWeek(s) && rampOutcome(s) && !s.flags.ramp_return_seen) result = [...result, { id: "ramp-ask-return", label: "Ask Asa about the carry you planned together.", detail: "Hear a personal response. The actual parcel receipt and route exposure keep their separate limits.", next: "act3_ramp_return" }];
  return result;
}
export function freightFinale(s: GameState, previous: string, finale: boolean | undefined): string {
  const outcome = rampOutcome(s); if (!finale || !closedWeek(s) || !outcome || !s.flags.ramp_return_seen || !has(s, "freight-ramp-moment", `Asa said: "${RAMP_QUOTES[outcome]}" This personal response changes no delivery, clearance, patient outcome, historical source or permission.`)) return previous;
  const memory = outcome === "kept" ? "At the wall, you remember the landing before the bend and Asa waiting for the weight to settle. That carry and the clinic's actual stock record remain separate."
    : outcome === "failed" ? "At the wall, you remember putting the case back under the hood. The stopped carry remains beside whatever the clinic actually recorded."
      : outcome === "closed" ? "At the wall, you remember the carry you and Asa chose not to make. No receipt was invented to fill its place."
        : "At the wall, you remember the carry plan left open. What you later learned about the parcel keeps its own record.";
  const point = previous.lastIndexOf('\n\n"');
  return point < 0 ? `${previous}\n\n${memory}` : `${previous.slice(0, point)}\n\n${memory}${previous.slice(point)}`;
}

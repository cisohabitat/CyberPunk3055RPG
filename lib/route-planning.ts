import type { Effect, GameState } from "./types";

export const ROUTE_ENTRIES = [
  { id: "stairs", title: "Public stairs", detail: "No register or fee. Add 1 strain on departure.", creds: 0, strain: 1, registered: false },
  { id: "lift", title: "Coin lift", detail: "10 creds on departure. Anonymous coin payment; no register.", creds: 10, strain: 0, registered: false },
  { id: "gate", title: "Courier gate", detail: "No fee or strain. Records your handle and Kerr as the recipient on departure.", creds: 0, strain: 0, registered: true },
] as const;
export const ROUTE_EXITS = [
  { id: "ramp", title: "Sensor ramp", detail: "Chrome can suppress the recipient field; Face can negotiate. A failed approach logs the recipient.", strain: 0, stat: "chrome" },
  { id: "gap", title: "Patrol gap", detail: "Ghost can time the patrol. A missed gap holds the case without a new entry. A failed Face negotiation registers the recipient.", strain: 0, stat: "ghost" },
  { id: "walk", title: "Maintenance stairs", detail: "Nerve can carry the case. Add 1 strain on departure; no stairs register. A failed Face negotiation registers the recipient.", strain: 1, stat: "nerve" },
] as const;
export const ROUTE_DRAFT_FLAGS = ["kerr_route_ready", ...ROUTE_ENTRIES.map(({ id }) => `kerr_entry_${id}`), ...ROUTE_EXITS.map(({ id }) => `kerr_exit_${id}`)];
export function routePlan(state: GameState) {
  const entries = ROUTE_ENTRIES.filter(({ id }) => state.flags[`kerr_entry_${id}`]);
  const exits = ROUTE_EXITS.filter(({ id }) => state.flags[`kerr_exit_${id}`]);
  const entry = entries.length === 1 ? entries[0] : undefined;
  const exit = exits.length === 1 ? exits[0] : undefined;
  return { entry, exit, ready: Boolean(entry && exit), creds: entry?.creds ?? 0, strain: (entry?.strain ?? 0) + (exit?.strain ?? 0) };
}
export function routeResume(state: GameState): string {
  if (state.flags.kerr_route_collected) return "act2_route_receipt";
  if (state.flags.kerr_route_failed) return "act2_route_recovery";
  if (state.flags.kerr_route_started) return "act2_route_crossing";
  if (routePlan(state).ready) return "act2_route_review";
  return routePlan(state).entry ? "act2_route_exit" : "act2_route_map";
}
export function routeDeparture(state: GameState): Effect {
  const plan = routePlan(state);
  // Pure effects also run in authoring previews; canonical choices gate departure.
  if (state.flags.kerr_route_started || !plan.ready) return {};
  return { creds: -plan.creds, strain: plan.strain, flags: ["kerr_route_started", ...(plan.entry?.registered ? ["kerr_route_trace"] : [])], journal: [{ id: "kerr-itinerary", kind: "fact", text: `Departed through ${plan.entry!.title.toLowerCase()} toward ${plan.exit!.title.toLowerCase()}. Spent ${plan.creds} creds and took ${plan.strain} planned strain.${plan.entry?.registered ? " The gate recorded the runner's handle and Kerr as recipient." : " Entry used no recipient register."}` }] };
}
export function routeOutcome(state: GameState): string {
  const breach = Boolean(state.flags.kerr_route_private && state.flags.kerr_route_trace);
  if (state.flags.kerr_route_delivered) return `Kerr received his closed brace case.${state.flags.kerr_route_trace ? breach ? " The private-collection promise was broken: the depot retains your handle and Kerr's recipient name." : " Registration was agreed before collection; the depot retains your handle and Kerr's recipient name." : " No depot recipient entry was made."} Delivery supplies no treatment outcome, historical evidence or witness permission.`;
  if (state.flags.kerr_route_done) return `The case remains held at the depot; Kerr has not received it.${state.flags.kerr_route_trace ? " Your handle and Kerr's recipient name remain on its register." : " No recipient entry was made."} The collection promise remains unfulfilled.`;
  if (state.flags.kerr_route_started) return `The journey's cost is already paid.${state.flags.kerr_route_trace ? " Your handle and Kerr's recipient name are on the depot register." : " No recipient entry has been made."} Collection and receipt remain unfinished.`;
  if (state.flags.kerr_route_promised && (state.flags.act2_done || state.sceneId.startsWith("act3_") || ["ending_names", "ending_quiet", "ending_witness", "ending_listed"].includes(state.sceneId))) return "You left the collection promise open without departing. Kerr has not received the case; no depot recipient entry was made.";
  if (state.flags.kerr_route_promised) return state.flags.kerr_route_private ? "You promised a private collection. Plan both crossings; a registered gate would break those terms." : "Kerr agreed to a registered collection. Plan both crossings; receipt still needs to be observed.";
  return "You declined before promising a collection. No delivery or treatment was claimed.";
}

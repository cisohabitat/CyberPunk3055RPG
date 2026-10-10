import { routeOutcome } from "./route-planning";
import type { GameState } from "./types";

export function characterConduct(state: GameState, name: string): string | undefined {
  if (name === "Quill") {
    const tab = state.flags.quill_repaid_late ? "Late repayment recorded; the earlier postponement remains." : state.flags.quill_refused ? "Tab postponed; interest remains." : state.flags.quill_collected ? "Tab paid." : state.flags.hired ? "You accepted his job." : "";
    return [tab, state.flags.kerr_route_intro ? "Introduced you to the depot counter." : ""].filter(Boolean).join(" ") || undefined;
  }
  if (name === "Mara Voss") return state.flags.memory_model_corrected ? "You corrected the disputed interpretation; her signature remains." : state.flags.memory_model_contested || state.flags.memory_model_repeated ? "Your interpretation remains disputed." : state.flags.memory_assurance_heard || state.flags.memory_channel_heard ? "Her answers are kept as attributed testimony." : state.flags.heard_memo ? "You heard her authorization and explanation." : undefined;
  if (name === "Kerr") {
    const collection = state.flags.kerr_route_denied ? "You denied the recorded disclosure; he closed further contact." : state.flags.kerr_route_acknowledged ? "You acknowledged the disclosure; the trace remains." : state.flags.kerr_route_promised ? state.flags.kerr_route_private && state.flags.kerr_route_trace ? "Private terms broken; recipient registration remains." : state.flags.kerr_route_delivered ? "Collection terms fulfilled; receipt observed." : state.flags.kerr_route_done ? "Collection promise unfinished." : "Collection promised; receipt not yet observed." : state.flags.kerr_route_declined ? "You declined the collection honestly." : "";
    const earlier = state.flags.kerr_sold_you ? "He sold your account to Helion." : state.flags.kerr_told ? "You told him the names; he kept them." : state.flags.kerr_week_paid ? "You paid his forty-creds demand." : state.flags.kerr_week_refused ? "You refused his demand." : "";
    return [collection, earlier].filter(Boolean).join(" ") || undefined;
  }
}
export function relationshipAftermath(state: GameState): { title: string; text: string }[] {
  const rows: { title: string; text: string }[] = [];
  if (state.flags.kerr_route_promised || state.flags.kerr_route_declined) rows.push({ title: "Kerr’s collection", text: `${routeOutcome(state)}${state.flags.kerr_route_acknowledged ? " You acknowledged the broken terms. He permits one future question through the stall, not a new job or automatic forgiveness." : state.flags.kerr_route_denied ? " You denied the disclosure despite the recipient register; he closed future contact through you." : state.flags.kerr_route_visit ? " He acknowledged your visit. He made no promise of another contract." : " You did not return to hear his response."}${state.flags.kerr_question_done ? " He told you about the walk he hopes for; it is not an observed treatment result." : ""}${state.flags.kerr_sold_you ? " His earlier sale of your account to Helion remains recorded." : ""}` });
  if (state.flags.kerr_route_intro || state.flags.quill_repaid_late) rows.push({ title: "Quill’s introduction", text: `${state.flags.quill_repaid_late ? "You repaid forty creds after postponing the tab. Both actions remain recorded. " : ""}${state.flags.kerr_route_intro ? "His introduction was available only for the depot negotiation, not every skill check. " : ""}${state.flags.quill_route_visit ? "You returned to discuss what his recommendation actually bought." : "You did not return to discuss his recommendation."}` });
  return rows;
}

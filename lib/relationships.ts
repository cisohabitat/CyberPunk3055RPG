import { routeOutcome } from "./route-planning";
import type { GameState } from "./types";

export function characterConduct(state: GameState, name: string): string | undefined {
  if (name === "Quill") {
    const tab = state.flags.quill_repaid_late ? "Late repayment recorded; the earlier postponement remains." : state.flags.quill_refused ? "Tab postponed; interest remains." : state.flags.quill_collected ? "Tab paid." : state.flags.hired ? "You accepted his job." : "";
    return [tab, state.flags.kerr_route_intro ? "Introduced you to the depot counter." : ""].filter(Boolean).join(" ") || undefined;
  }
  if (name === "Mara Voss") {
    const current = state.flags.response_received ? "Her private reply entered an unanswered queue." : state.flags.response_sent ? "Her named private reply was dispatched; receipt awaits a reply." : state.flags.response_started ? "You heard her present-day request; no receipt is recorded." : "";
    const past = state.flags.memory_model_corrected ? "You corrected the disputed interpretation; her signature remains." : state.flags.memory_model_contested || state.flags.memory_model_repeated ? "Your interpretation remains disputed." : state.flags.memory_assurance_heard || state.flags.memory_channel_heard ? "Her recorded answers are kept as attributed testimony." : state.flags.heard_memo ? "You heard her recorded authorization and explanation." : "";
    return [current, state.flags.response_public_refused ? "She refused public release of her new statement." : "", past].filter(Boolean).join(" ") || undefined;
  }
  if (name === "Sister Lumen" && state.flags.response_started) return [state.flags.response_clinic_refused ? "She refused clinic endorsement." : "Hosting did not endorse the statement.", state.flags.lumen_boundary_visit ? "Private desk messages only; she decides whether to answer." : "Future contact has not been agreed.", state.flags.betrayed_lumen || state.flags.pact_fake && (state.flags.act1_sold || state.flags.act1_both) ? "Your earlier betrayal remains." : ""].filter(Boolean).join(" ");
  if (name === "Kerr") {
    const collection = state.flags.kerr_route_denied ? "You denied the recorded disclosure; he closed further contact." : state.flags.kerr_route_acknowledged ? "You acknowledged the disclosure; the trace remains." : state.flags.kerr_route_promised ? state.flags.kerr_route_private && state.flags.kerr_route_trace ? "Private terms broken; recipient registration remains." : state.flags.kerr_route_delivered ? "Collection terms fulfilled; receipt observed." : state.flags.kerr_route_done ? "Collection promise unfinished." : "Collection promised; receipt not yet observed." : state.flags.kerr_route_declined ? "You declined the collection honestly." : "";
    const earlier = state.flags.kerr_sold_you ? "He sold your account to Helion." : state.flags.kerr_told ? "You told him the names; he kept them." : state.flags.kerr_week_paid ? "You paid his forty-creds demand." : state.flags.kerr_week_refused ? "You refused his demand." : "";
    return [collection, earlier].filter(Boolean).join(" ") || undefined;
  }
}
export function relationshipAftermath(state: GameState): { title: string; text: string }[] {
  const rows: { title: string; text: string }[] = [];
  if (state.flags.response_started) rows.push({ title: "Mara’s present-day reply", text: `${state.flags.response_received ? "Her named private response was received into the records desk’s unanswered queue. There is no inquiry decision." : state.flags.response_sent ? "Her named private response was dispatched, but you did not return to record the desk’s receipt." : state.flags.response_declined ? "You declined before undertaking dispatch. The envelope remained with Mara." : "Her response was left pending; no dispatch or receipt was recorded."}${state.flags.response_public_refused ? " Her refusal of public release remains attached to the revised or unfinished proposal." : ""}${state.flags.response_clinic_refused ? " Lumen’s refusal of clinic endorsement remains attached." : ""} The reply does not clear Mara’s historical signature or authenticate an issuer.` });
  if (state.flags.lumen_boundary_visit) rows.push({ title: "Lumen’s own terms", text: `${state.flags.lumen_contact_limited ? "Earlier betrayal remains; Lumen permits desk messages without partnership." : "Lumen permits private desk messages and chooses whether to answer."} Hosting supplies no clinic endorsement or public quotation permission.` });
  if (state.flags.kerr_route_promised || state.flags.kerr_route_declined) rows.push({ title: "Kerr’s collection", text: `${routeOutcome(state)}${state.flags.kerr_route_acknowledged ? " You acknowledged the broken terms. He permits one future question through the stall, not a new job or automatic forgiveness." : state.flags.kerr_route_denied ? " You denied the disclosure despite the recipient register; he closed future contact through you." : state.flags.kerr_route_visit ? " He acknowledged your visit. He made no promise of another contract." : " You did not return to hear his response."}${state.flags.kerr_question_done ? " He told you about the walk he hopes for; it is not an observed treatment result." : ""}${state.flags.kerr_sold_you ? " His earlier sale of your account to Helion remains recorded." : ""}` });
  if (state.flags.kerr_route_intro || state.flags.quill_repaid_late) rows.push({ title: "Quill’s introduction", text: `${state.flags.quill_repaid_late ? "You repaid forty creds after postponing the tab. Both actions remain recorded. " : ""}${state.flags.kerr_route_intro ? "His introduction was available only for the depot negotiation, not every skill check. " : ""}${state.flags.quill_route_visit ? "You returned to discuss what his recommendation actually bought." : "You did not return to discuss his recommendation."}` });
  return rows;
}

export function relationshipCoda(state: GameState): string | undefined {
  if (!state.flags.response_started) return;
  const action = state.sceneId === "ending_names" ? "As the names are read" : state.sceneId === "ending_witness" ? "As the leak joins the wall’s account" : state.sceneId === "ending_listed" ? "As Ives closes the folio" : "As you leave the wall to the rain";
  return `${action}, you remember ${state.flags.mara_quiet_heard ? "Mara’s cup and the morning she hopes to choose" : state.flags.lumen_quiet_heard ? "Lumen putting the cup back in the same place" : "the unsealed envelope between two chairs"}. ${state.flags.response_received ? "Her reply is waiting at the desk. It has not answered the names on the wall." : state.flags.response_sent ? "The dispatch stub is still a question, not an answer." : "The envelope has not left through your hands."}`;
}

import { reviewCase } from "./case-file";
import type { Choice, Effect, GameState, Scene } from "./types";

export const DISTRICT_WINDOWS = [0, 1, 2].map(n => `district_window_${n}`);
export function districtRemaining(s: GameState) {
  if (s.flags.act2_done) return 0;
  return [0, 1, 2].find(n => s.flags[`district_window_${n}`]) ?? 0;
}
export function districtSpend(s: GameState): Effect {
  const flag = `district_window_${Math.max(0, districtRemaining(s) - 1)}`;
  return { flags: [flag], flagsOff: DISTRICT_WINDOWS.filter(f => f !== flag) };
}
export function districtStart(s: GameState, publicReview: boolean): Effect {
  if (s.flags.district_query_sent) return {};
  return { flags: ["district_query_sent", "district_window_2", publicReview ? "district_public_review" : "district_private_query"], flagsOff: DISTRICT_WINDOWS.slice(0, 2),
    ...(publicReview ? { factions: { helion: 1 } } : {}),
    journal: [{ id: "district-request", kind: "fact", text: publicReview
      ? "You signed a public request to review the canal depot recipient register. The depot closed its anonymous side hatch during review and retained a registered main counter. No technician or witness identity was attached; the review is not a finding."
      : "Edda submitted a private service query using the shared source summary. The depot offered a short service appointment; its ordinary side hatch remains available. This appointment grants no source authentication, anonymity guarantee or restored archive access." }] };
}
const breach = (s: GameState) => Boolean(s.flags.kerr_route_private && s.flags.kerr_route_trace);
export function kerrKnowsDistrictBreach(s: GameState) {
  return breach(s) && Boolean(s.flags.district_told_kerr_trace || s.flags.kerr_route_delivered || s.flags.kerr_route_visit);
}
export function districtIntroductionAllowed(s: GameState) {
  return !s.flags.district_kerr_refused && !s.flags.kerr_route_denied
    && (!kerrKnowsDistrictBreach(s) || s.flags.district_breach_acknowledged || s.flags.kerr_route_acknowledged);
}
export function districtActorKnowledge(s: GameState) {
  return [
    { name: "Edda", firsthand: "Her archive work and source-custody terms.", told: s.flags.district_edda_knows_ledger ? "You shared a cancellation summary with its corroborating ledger; witness material stayed private."
      : s.flags.district_edda_knows_receipt ? "You shared the recorded cancellation receipt, without independent corroboration in that packet." : "No case summary shared in this conversation.",
      response: s.flags.district_public_review ? "Submitted the signed public review request; archive access and any inquiry remain unchanged."
        : s.flags.district_private_query ? "Submitted a private service query; appointment only, with no inquiry outcome." : "Waiting for your choice of request." },
    { name: "Kerr", firsthand: s.flags.kerr_route_delivered ? "Observed his closed brace-case handover; no treatment result." : "His own collection terms; no new handover inferred.",
      told: s.flags.district_told_kerr_case ? `You shared the same bounded source summary.${s.flags.district_told_kerr_trace ? " You also disclosed the broken private-collection docket." : " No private witness material was shared."}` : "You kept the case summary private.",
      response: !s.flags.district_kerr_heard ? "No response to this request yet."
        : s.flags.district_kerr_refused || s.flags.kerr_route_denied ? "Withheld this depot introduction. The earlier promise and any registration remain."
        : s.flags.district_kerr_introduced ? "Made one limited introduction; no forgiveness, evidence or treatment outcome." : "Waiting for your answer; no introduction granted." },
  ];
}
export function districtStatus(s: GameState) {
  if (!s.flags.district_query_sent) return "No depot request submitted.";
  const place = s.flags.district_public_review ? "Public review: anonymous side hatch closed; registered main counter available." : "Private service query: ordinary hatch remains; one service appointment offered.";
  const result = s.flags.district_work_paid ? "You completed a registered sorting shift: twenty creds earned, one strain spent."
    : s.flags.district_rest_done ? "You attended a short service-room rest: up to one strain recovered; no treatment or proof."
      : s.flags.district_window_closed || s.flags.act2_done ? "The action window is closed; unfinished tasks remain unfinished." : `${districtRemaining(s)} depot actions remain. Reading, conversation and settings spend none.`;
  return `${place} ${result}${s.flags.district_correction_carried ? " You delivered the separate correction for filing; submission is not acceptance." : ""}`;
}

export const DISTRICT_ROUTE_CATALOG = [
  { id: "open-district-response", scene: "act2_middle", next: "act2_district_brief", requires: "Source custody and an acquired cancellation receipt; optionally carry an unchallenged tested case, or resume a saved request" },
  { id: "visit-district-return", scene: "act3_neighborhood", next: "act3_district_return", requires: "An actually submitted depot request" },
];
export function districtChoices(s: GameState, scene: Scene, choices: Choice[]): Choice[] {
  let result = choices;
  if (scene.id.startsWith("act2_district_")) result = choices.filter(c => {
    if (c.id === "district-edda-corroboration") return Boolean(s.flags.order_verified && s.journal.some(j => j.id === "verified-order"));
    if (c.id === "district-kerr-acknowledge" || c.id === "district-kerr-deny") return kerrKnowsDistrictBreach(s) && !s.flags.district_breach_acknowledged && !s.flags.kerr_route_acknowledged && !s.flags.kerr_route_denied;
    if (c.id === "district-kerr-introduce") return districtIntroductionAllowed(s);
    if (c.id === "district-register-work" || c.id === "district-book-rest") return districtRemaining(s) >= 2;
    if (["district-finish-work", "district-finish-rest", "district-carry-correction"].includes(c.id)) return districtRemaining(s) >= 1;
    return true;
  });
  if (scene.id === "act2_middle" && !s.flags.act2_done && !s.flags.district_window_closed && (s.flags.district_started || s.flags.archive_custody && s.journal.some(j => j.id === "memory-order"))) {
    const tested = s.caseFile?.reviewed && s.caseFile.claim !== "authorization" && reviewCase(s).verdict !== "challenged";
    result = [...result, { id: "open-district-response", label: s.flags.district_started ? "Return to the depot response and its remaining actions." : tested ? "Ask Edda what your tested case can change at the depot." : "Ask Edda what your recorded sources can change at the depot.", detail: "Optional. Share a bounded source summary deliberately; witness material stays private. No request or cost just for opening the conversation.", next: s.flags.district_query_sent ? "act2_district_canal" : "act2_district_brief" }];
  }
  if (scene.id === "act3_neighborhood" && s.flags.district_query_sent && !s.flags.district_return_heard) result = [...result, { id: "visit-district-return", label: "Hear Edda's reply about the changed depot.", next: "act3_district_return" }];
  return result;
}

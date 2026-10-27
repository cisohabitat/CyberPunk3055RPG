import { districtIntroductionAllowed, districtRemaining, districtSpend } from "./district-response";
import type { Choice, Effect, GameState, Scene, StatId } from "./types";

export const TECHNIQUES = [
  { stat: "chrome", name: "Separate the fields", kit: "archive-probe", kitName: "Archive Probe", use: "Portable verification trades one strain for avoiding a new named diagnostic entry. Counter verification records your handle instead. The request clarifies labels; it does not make two populations equal." },
  { stat: "ghost", name: "Route the bounded packet", kit: "route-shroud", kitName: "Route Shroud", use: "A screened sleeve trades one strain for omitting a new courier signature. Preserve the depot return reference; the closed side hatch and any earlier records remain." },
  { stat: "face", name: "Agree the scope", kit: "desk-guide", kitName: "Clinic Desk Guide", use: "With a valid introduction and an offered public sorting shift, ask for a voluntary process-only co-sign by waiving that paid work. A guide alone cannot make the Dispatcher agree." },
  { stat: "nerve", name: "Handle the dry copy", kit: "chair-harness", kitName: "Chair Harness", use: "Supported carry costs one strain over two actions. A fast harness handover costs two strain in one action and can leave one action for a short recovery. Direct carry costs two strain over two actions." },
] as const;
const modes = {
  chrome: ["counter", "portable"], ghost: ["signed", "screened"], face: ["self", "cosign"], nerve: ["direct", "supported", "fast"],
} as const;
const statFlags = TECHNIQUES.map(t => `technique_${t.stat}`);
export function techniqueStat(s: GameState): StatId | undefined {
  const chosen = TECHNIQUES.filter(t => s.flags[`technique_${t.stat}`]);
  return chosen.length === 1 && s.flags[`perk_${chosen[0].stat}`] ? chosen[0].stat : undefined;
}
export function techniqueMode(s: GameState): string | undefined {
  const stat = techniqueStat(s); if (!stat) return undefined;
  const chosen = modes[stat].filter(mode => s.flags[`technique_mode_${mode}`]);
  return chosen.length === 1 ? chosen[0] : undefined;
}
const live = (s: GameState) => Boolean(s.flags.district_query_sent && !s.flags.district_window_closed && !s.flags.act2_done);
const resolved = (s: GameState) => Boolean(s.flags.technique_complete || s.flags.technique_failed || s.flags.technique_closed);
export function canStartTechnique(s: GameState) {
  return live(s) && !s.pendingCheck && districtRemaining(s) >= 2 && !s.flags.technique_started && !resolved(s)
    && !s.flags.district_correction_carried && !s.flags.district_work_registered && !s.flags.district_rest_booked
    && !s.flags.district_work_paid && !s.flags.district_rest_done && TECHNIQUES.some(t => s.flags[`perk_${t.stat}`]);
}
export function processCosignAllowed(s: GameState) {
  return Boolean(s.flags.district_public_review && s.flags.district_kerr_introduced && districtIntroductionAllowed(s)
    && !s.flags.technique_work_waived && !s.flags.district_work_registered && !s.flags.district_work_paid);
}
export function spendTechnique(s: GameState, effect: Effect): Effect {
  const spent = districtSpend(s);
  return { ...effect, flags: [...spent.flags!, ...(effect.flags ?? [])], flagsOff: [...spent.flagsOff!, ...(effect.flagsOff ?? [])] };
}
export function beginTechnique(s: GameState, stat: StatId, mode: string, effect: Effect = {}): Effect {
  return spendTechnique(s, { ...effect, flags: ["technique_started", `technique_${stat}`, `technique_mode_${mode}`, ...(effect.flags ?? [])], flagsOff: statFlags.filter(f => f !== `technique_${stat}`) });
}
export function finishTechnique(s: GameState, success: boolean, extra: Effect = {}): Effect {
  const stat = techniqueStat(s)!;
  return spendTechnique(s, { ...extra, ...(success ? { factions: { wards: 1 } } : {}),
    flags: [success ? "technique_complete" : "technique_failed", ...(success ? ["technique_review_reference", "district_correction_carried"] : ["technique_packet_held"]), ...(extra.flags ?? [])],
    journal: [{ id: "technique-review", kind: "fact", text: success
      ? `Your ${stat} procedure delivered a readable, source-bounded correction and obtained a depot review reference. The reference confirms intake for review; the correction itself, issuing key, employment inquiry and witness permissions remain undecided under their existing terms.`
      : `Your ${stat} procedure ended without a depot review reference. The packet remains held for repair or a narrower request; committed actions, effort, signatures and any waived work remain recorded.` }],
  });
}
export function fastNerveTechnique(s: GameState): Effect {
  const begun = beginTechnique(s, "nerve", "fast", { strain: 2 });
  return { ...begun, factions: { wards: 1 }, flags: [...begun.flags!, "technique_complete", "technique_review_reference", "district_correction_carried"], journal: [{ id: "technique-review", kind: "fact", text: "Your trained harness handover delivered the dry correction copy and obtained a depot review reference in one action, at two strain. Intake is confirmed; the correction, issuing key, inquiry and witness permissions retain their separate status." }] };
}
export function techniqueResume(s: GameState): string {
  if (s.flags.technique_complete || s.flags.technique_failed) return "act2_technique_result";
  const stat = techniqueStat(s);
  return s.flags.technique_started && techniqueMode(s) && stat ? { chrome: "act2_technique_chrome_submit", ghost: "act2_technique_ghost_route", face: "act2_technique_face_scope", nerve: "act2_technique_nerve_handover" }[stat] : "act2_technique_bench";
}
export function techniqueStatus(s: GameState) {
  if (!s.flags.technique_started) return "No specialist task committed. Planning and inspection spend no depot action.";
  const method = techniqueStat(s), mode = techniqueMode(s);
  if (!method || !mode) return "The saved method is inconsistent. Keep its costs and close it without claiming a review reference.";
  const outcome = s.flags.technique_review_reference ? "Review reference received; the correction remains undecided." : s.flags.technique_failed ? "Packet held; no review reference received." : s.flags.technique_closed ? "Task set aside; no completion claimed." : "One preparation committed; submission still required.";
  return `${method} · ${mode}. ${outcome}${s.flags.technique_work_waived ? " The paid sorting opportunity was waived and cannot be claimed." : ""}${s.flags.technique_named_diagnostic ? " Your diagnostic handle remains recorded." : ""}${s.flags.technique_courier_signed ? " Your courier signature remains recorded." : ""}${s.flags.technique_portable_fault ? " A device-service diagnostic trace remains; earlier public records are unchanged." : ""}${s.flags.technique_screened ? " The outer sleeve screened the packet tags; earlier signatures remain." : ""}`;
}
export const TECHNIQUE_ROUTE_CATALOG = [
  { id: "open-build-techniques", scene: "act2_district_canal", requires: "Earned training, two saved depot actions and no competing task or prior correction", next: "act2_technique_bench" },
  { id: "resume-build-technique", scene: "act2_district_canal", requires: "An actually committed specialist procedure", next: "Saved method step or result" },
];
export function techniqueChoices(s: GameState, scene: Scene, choices: Choice[]): Choice[] {
  let result = choices;
  if (scene.id === "act2_district_canal") {
    if (s.flags.technique_work_waived) result = result.filter(c => c.id !== "district-register-work" && c.id !== "district-resume-work");
    if (s.flags.technique_started && !resolved(s)) result = result.filter(c => !["district-register-work", "district-book-rest", "district-carry-correction", "district-resume-work", "district-resume-rest"].includes(c.id));
    if (canStartTechnique(s)) result = [...result, { id: "open-build-techniques", label: "Use your training and kit to obtain a correction review reference.", detail: "Compare four distinct methods. Opening spends nothing; real preparation/submission uses the saved depot allowance.", next: "act2_technique_bench" }];
    else if (live(s) && s.flags.technique_started && !s.flags.technique_closed) result = [...result, { id: "resume-build-technique", label: "Return to the committed specialist procedure and its actual result.", next: techniqueResume(s) }];
  }
  if (!scene.id.startsWith("act2_technique_")) return result;
  return result.filter(c => {
    if (c.id === "prepare-technique-face-cosign") return canStartTechnique(s) && processCosignAllowed(s) && s.flags.technique_cosign_asked;
    if (c.id.startsWith("plan-technique-") || c.id.startsWith("prepare-technique-")) return canStartTechnique(s);
    if (c.id === "ask-technique-cosign") return canStartTechnique(s) && s.items.includes("desk-guide");
    if (c.id === "technique-harness-rest") return live(s) && s.flags.technique_review_reference && techniqueStat(s) === "nerve" && techniqueMode(s) === "fast" && !s.flags.technique_harness_recovered && districtRemaining(s) >= 1;
    if (c.id.startsWith("submit-technique-") || c.id.startsWith("reject-technique-")) {
      const stat = c.id.split("-")[2];
      return live(s) && !resolved(s) && s.flags.technique_started && techniqueStat(s) === stat && Boolean(techniqueMode(s)) && districtRemaining(s) >= 1;
    }
    if (c.id === "abandon-technique") return s.flags.technique_started && !s.flags.technique_complete && !s.flags.technique_closed;
    return true;
  });
}

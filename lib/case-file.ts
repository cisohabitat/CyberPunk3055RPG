import { canConsultSources, notebookSources } from "./investigation-notebook";
import type { Choice, GameState, Scene } from "./types";

export const CASE_CLAIMS = {
  authorization: "Mara authorized the coolant dump.",
  cancellation: "An evacuation cancellation followed the authorization.",
  issuer: "The cancellation's issuing key is authenticated.",
} as const;
export const CASE_SOURCES = ["memory-signature", "memory-order", "verified-order", "nia-account"] as const;
export type CaseClaim = keyof typeof CASE_CLAIMS;
export type CaseSource = typeof CASE_SOURCES[number];
export type CaseRelation = "supports" | "limits";
export type CaseLink = { source: CaseSource; relation: CaseRelation };
export type CaseVerdict = "supported" | "bounded" | "challenged";
export type CaseReview = { claim: CaseClaim; links: CaseLink[]; verdict: CaseVerdict };
export type CaseFile = { claim: CaseClaim; links: CaseLink[]; reviewed: boolean; history: CaseReview[] };
export type CaseAction = { type: "claim"; claim: CaseClaim } | { type: "link"; source: CaseSource; relation: CaseRelation | "omit" } | { type: "test" };
export const CASE_ROUTE_CATALOG = [
  { id: "case-pursue-archive", scene: "act2_archive_compare", next: "act2_archive_door", requires: "Reviewed unchallenged case with linked receipt/archive record" },
  { id: "case-bring-account", scene: "act3_testimony_review", next: "act3_testimony_consent", requires: "Reviewed unchallenged cancellation/issuer case; scope derives from linked acquired sources" },
] as const;

export function caseSources(state: GameState) {
  return notebookSources(state).filter(record => (CASE_SOURCES as readonly string[]).includes(record.id)).map(record => record.id === "verified-order" ? { ...record, title: state.flags.archive_key_authenticated ? "Authenticated issuing-key record" : "Cancellation corroboration" } : record);
}
export function canBuildCase(state: GameState) {
  return caseSources(state).some(source => source.id === "memory-order" || source.id === "verified-order");
}
function supports(state: GameState, claim: CaseClaim, source: CaseSource) {
  if (claim === "authorization") return source === "memory-signature";
  if (claim === "cancellation") return source === "memory-order" || (source === "verified-order" || source === "nia-account") && Boolean(state.flags.order_verified);
  return source === "verified-order" && Boolean(state.flags.order_verified && state.flags.archive_key_authenticated);
}
export function reviewCase(state: GameState, draft = state.caseFile) {
  const available = new Set(caseSources(state).map(record => record.id));
  const links = draft?.links ?? [], claim = draft?.claim ?? "cancellation";
  const errors = links.filter(link => !available.has(link.source) || link.relation === "supports" && !supports(state, claim, link.source));
  const supported = links.some(link => link.relation === "supports" && supports(state, claim, link.source));
  const independent = links.some(link => (link.source === "verified-order" || link.source === "nia-account") && link.relation === "supports" && state.flags.order_verified);
  const recorded = links.some(link => link.source === "memory-order" && link.relation === "supports");
  const verdict: CaseVerdict = !links.length || errors.length ? "challenged" : supported && (claim !== "cancellation" || independent && recorded) ? "supported" : "bounded";
  const feedback = !links.length ? "Connect at least one acquired source before testing the case."
    : errors.length ? claim === "issuer" ? "A receipt or witness account does not authenticate an issuing key. Change the link to a limit, or investigate and link a successful key match."
      : claim === "authorization" ? "The later cancellation does not establish Mara's authorization. Connect her signature, or mark this source as a limit."
        : "This source does not support the cancellation. Connect the recorded receipt and independent corroboration, or narrow the account."
      : verdict === "bounded" ? claim === "issuer" ? "This account leaves the issuer open. Link a successfully matched key before asserting authentication."
        : claim === "authorization" ? "Locate and connect the signature before asserting authorization."
          : recorded ? "The receipt records cancellation. Connect an independent ledger or approved witness account to corroborate the sequence."
            : "Connect the recorded receipt to establish the sequence alongside the independent source."
        : claim === "authorization" ? "The acquired signature supports authorization, not prior knowledge or the later issuer."
          : claim === "cancellation" ? "The linked independent source corroborates cancellation. Key authentication and public quotation remain separate tests."
            : "The linked archive record includes a successfully authenticated key. Witness quotation still requires separate permission.";
  return { verdict, feedback };
}
export function parseCaseFile(value: unknown, state: GameState): CaseFile | null {
  if (!canBuildCase(state) || !value || typeof value !== "object" || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  const claim = (c: unknown): c is CaseClaim => typeof c === "string" && Object.hasOwn(CASE_CLAIMS, c);
  const available = new Set(caseSources(state).map(record => record.id));
  function links(input: unknown): CaseLink[] | null {
    if (!Array.isArray(input) || input.length > 4) return null;
    const result: CaseLink[] = [];
    for (const entry of input) {
      if (!entry || typeof entry !== "object" || !(CASE_SOURCES as readonly unknown[]).includes(entry.source) || !available.has(entry.source) || !["supports", "limits"].includes(entry.relation) || result.some(link => link.source === entry.source)) return null;
      result.push({ source: entry.source, relation: entry.relation });
    }
    return result;
  }
  const current = links(v.links);
  if (!claim(v.claim) || !current || typeof v.reviewed !== "boolean" || !Array.isArray(v.history) || v.history.length > 4) return null;
  const history: CaseReview[] = [];
  for (const entry of v.history) {
    const prior = entry && links(entry.links);
    if (!entry || !claim(entry.claim) || !prior || !["supported", "bounded", "challenged"].includes(entry.verdict)) return null;
    history.push({ claim: entry.claim, links: prior, verdict: entry.verdict });
  }
  return { claim: v.claim, links: current, reviewed: v.reviewed, history };
}
export function commitCaseAction(state: GameState, action: CaseAction): GameState {
  if (state.pendingCheck || !canConsultSources(state) || !canBuildCase(state)) throw new Error("The case cannot be changed here.");
  const draft: CaseFile = state.caseFile ?? { claim: "cancellation", links: [], reviewed: false, history: [] };
  let next: CaseFile;
  if (action.type === "claim") next = { ...draft, claim: action.claim, reviewed: false };
  else if (action.type === "link") next = { ...draft, links: [...draft.links.filter(link => link.source !== action.source), ...(action.relation === "omit" ? [] : [{ source: action.source, relation: action.relation }])], reviewed: false };
  else if (action.type === "test") next = { ...draft, reviewed: true, history: [...draft.history, { claim: draft.claim, links: draft.links.map(link => ({ ...link })), verdict: reviewCase(state, draft).verdict }].slice(-4) };
  else throw new Error("Unknown case action.");
  const valid = parseCaseFile(next, state);
  if (!valid) throw new Error("Use acquired sources and valid case connections.");
  return { ...state, caseFile: valid };
}
export function caseFileChoices(state: GameState, scene: Scene): Choice[] {
  const draft = state.caseFile;
  if (!draft?.reviewed || reviewCase(state).verdict === "challenged") return [];
  if (scene.id === "act2_archive_compare" && draft.links.some(link => link.source === "memory-order" || link.source === "verified-order")) return [{ id: "case-pursue-archive", label: "Follow the archive lead from your tested case.", detail: "Retrieve the missing source; testing supplies no record or key match.", effects: { flags: ["archive_compared"] }, next: "act2_archive_door" }];
  if (scene.id === "act3_testimony_review" && draft.claim !== "authorization") {
    const corroborated = reviewCase(state).verdict === "supported" && state.flags.order_verified;
    return [{ id: "case-bring-account", label: "Bring your tested case and its limits to the hearing.", detail: corroborated ? "Cite the linked independent record. Ask separately about quotation." : "Present an open question without claiming proof or quoting private testimony.", effects: { flags: [corroborated ? "testimony_source" : "testimony_bounded"], flagsOff: [corroborated ? "testimony_bounded" : "testimony_source"] }, next: "act3_testimony_consent" }];
  }
  return [];
}

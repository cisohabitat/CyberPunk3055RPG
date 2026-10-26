"use client";
import { CASE_CLAIMS, canBuildCase, caseSources, reviewCase, type CaseAction, type CaseClaim, type CaseRelation, type CaseSource } from "@/lib/case-file";
import type { GameState } from "@/lib/types";

export function CaseBoard({ state, onAction }: { state: GameState; onAction: (action: CaseAction) => void }) {
  if (!canBuildCase(state)) return <p className="hint">Inspect the available sources before building a case.</p>;
  const draft = state.caseFile, review = reviewCase(state);
  return <details className="case-board" data-testid="case-board"><summary>Build a Ward Nine case{draft?.reviewed ? ` · ${review.verdict}` : ""}</summary>
    <p>Connect acquired sources to a claim, then test what your account can defend. Annotations grant no evidence or permission. A tested case can open an archive lead or enter the hearing.</p>
    <label>Claim to investigate<select value={draft?.claim ?? "cancellation"} onChange={event => onAction({ type: "claim", claim: event.target.value as CaseClaim })}>{Object.entries(CASE_CLAIMS).map(([id, text]) => <option key={id} value={id}>{text}</option>)}</select></label>
    <ul className="case-sources">{caseSources(state).map(source => <li key={source.id}><label>{source.title}<select aria-label={`Connection for ${source.title}`} value={draft?.links.find(link => link.source === source.id)?.relation ?? "omit"} onChange={event => onAction({ type: "link", source: source.id as CaseSource, relation: event.target.value as CaseRelation | "omit" })}><option value="omit">Not linked</option><option value="supports">Supports this claim</option><option value="limits">Shows a limit or unanswered question</option></select></label><p className="hint">{source.text}</p></li>)}</ul>
    {!caseSources(state).length && <p>Acquire a signature, receipt, archive record or approved witness account first.</p>}
    <button className="ghost" type="button" disabled={!draft?.links.length} onClick={() => onAction({ type: "test" })}>Test assembled case</button>
    <p role="status" aria-atomic="true" data-testid="case-feedback">{draft?.reviewed ? `${review.verdict}: ${review.feedback}` : "Draft not tested. Editing a connection requires another test."}</p>
    {!!draft?.history.length && <details><summary>Previous case reviews ({draft.history.length})</summary><ol>{draft.history.map((entry, index) => <li key={index}>{CASE_CLAIMS[entry.claim]} · {entry.verdict} · {entry.links.length} linked sources</li>)}</ol><p className="hint">The last four reviews are retained. Correcting a draft grants no source.</p></details>}
  </details>;
}

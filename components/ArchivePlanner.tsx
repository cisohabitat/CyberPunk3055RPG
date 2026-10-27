"use client";
import { useState } from "react";
import { ARCHIVE_POSITIONS, archiveSetupBonus, canPlanArchive, type ArchivePlanDraft } from "@/lib/archive-plan";
import { effectPreview, getScene } from "@/lib/engine";
import type { GameState } from "@/lib/types";
import { hasCampaignThread } from "@/lib/campaign-thread";

export function ArchivePlanner({ state, onSave }: { state: GameState; onSave: (draft: ArchivePlanDraft) => void }) {
  const plan = state.archivePlan;
  const [draft, setDraft] = useState<ArchivePlanDraft>(() => plan ? { objective: plan.objective, approach: plan.approach, contingency: plan.contingency } : { objective: "corroborate", approach: "reader", contingency: "staffed" });
  const [message, setMessage] = useState("");
  const editable = Boolean(canPlanArchive(state));
  if (!editable && !plan) return null;
  if (!editable && hasCampaignThread(state.sceneId)) return null;
  if (!editable && !state.sceneId.startsWith("act2_archive_") && !["act2_middle", "act3_arrival", "act3_testimony_review", "act3_edda_visit"].includes(state.sceneId) && !state.sceneId.startsWith("ending_")) return null;
  const invalid = draft.objective === "authenticate" && draft.approach === "carbon";
  const fee = getScene("act2_archive_gap").choices.find(c => c.id === "buy-ledger")!.requireCreds;
  const outcome = !plan ? "No plan saved." : plan.stage === "retrieved" ? state.flags.archive_key_authenticated ? "Retrieved: the issuing key was authenticated." : "Retrieved: independent corroboration, without a key match."
    : plan.stage === "withdrawn" ? "Archive search closed as unresolved. Previously acquired sources remain; this attempt supplied no key match."
      : plan.stage === "failed" ? state.flags.act2_done ? "The week closed after the failed attempt. The paused request supplied no retrieved source or reopened recovery." : `The attempt failed. The staffed ledger (${fee} creds or a Spire employee number), free pause and unresolved exit remain.`
      : plan.stage === "abandoned" ? "Plan set aside. Spent setup costs and exposure stay recorded; acquired records show what was obtained."
          : plan.stage === "positioned" ? "Setup committed. Resolve the displayed method; no source has been gained from preparation."
            : "Plan saved. Continue to the reader and commit one setup. Saving spends nothing and supplies no evidence.";
  return <details className="archive-planner" data-testid="archive-planner"><summary>Archive mission plan{plan ? ` · ${plan.stage}` : " · optional"}</summary>
    <p data-testid="archive-plan-status">{outcome}</p>
    {plan && <p className="hint">Objective: {plan.objective === "authenticate" ? "authenticate the issuer" : "corroborate cancellation"} · approach: {plan.approach} · on failure: {plan.contingency === "staffed" ? "staffed recovery" : "withdraw and close unresolved"}{plan.position ? ` · setup: ${plan.position}` : ""}</p>}
    {editable && <>
      <p>Choose an objective, method and contingency. Only the actual setup/retrieval choices below spend resources. Carbon records cannot perform a digital-key match. A plan grants no skill, source or permission.</p>
      <label>Archive objective<select value={draft.objective} onChange={e => setDraft({ ...draft, objective: e.target.value as ArchivePlanDraft["objective"] })}><option value="corroborate">Cancellation</option><option value="authenticate">Issuing key</option></select></label>
      <label>Archive approach<select value={draft.approach} onChange={e => setDraft({ ...draft, approach: e.target.value as ArchivePlanDraft["approach"] })}><option value="reader">Reader / key match</option><option value="carbon">Carbon ledger</option></select></label>
      <label>If retrieval fails<select value={draft.contingency} onChange={e => setDraft({ ...draft, contingency: e.target.value as ArchivePlanDraft["contingency"] })}><option value="staffed">Staffed recovery</option><option value="withdraw">Close unresolved</option></select></label>
      {invalid && <p className="form-error">A carbon copy can corroborate cancellation; authentication requires the reader.</p>}
      <ul>{ARCHIVE_POSITIONS.filter(p => p.approach === draft.approach).map(p => <li key={p.id}><strong>{p.label}</strong> {effectPreview(state, p).join(" · ")}. Additional rolled accuracy: +{archiveSetupBonus(state, draft.approach, p.position)}. {p.maxStrain !== undefined && state.strain > p.maxStrain ? "Recover strain before this setup." : ""}</li>)}</ul>
      <p className="hint">Matching index/interval preparation does not stack with planned accuracy. An earned matching preparation or technique can be used without extra setup cost. Signal discipline keeps its original no-roll reader method.</p>
      <p className="hint">Staffed recovery charges {fee} creds after failure, or logs a Spire employee number. It never authenticates a key. Withdrawal closes this attempt without offering that recovery; other existing sources remain.</p>
      <button className="ghost" type="button" disabled={invalid} onClick={() => { try { onSave(draft); setMessage("Plan saved. Continue to the archive reader to choose setup."); } catch (error) { setMessage(error instanceof Error ? error.message : "The plan could not be saved."); } }}>Save archive plan</button>
      <p role="status">{message}</p>
    </>}
    {!editable && plan && ["planned", "positioned"].includes(plan.stage) && <p className="hint">Use the actual mission controls below. Abandon committed setup before changing the plan; costs are not refunded.</p>}
  </details>;
}

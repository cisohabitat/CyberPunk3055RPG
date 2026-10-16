import { nextStep, objectives } from "@/lib/objectives";
import { clinicWitnessBudget, commitmentActions } from "@/lib/commitment-navigation";
import type { GameState } from "@/lib/types";

export function ObjectiveBrief({ state }: { state: GameState }) {
  const step = nextStep(state);
  const rows = objectives(state);
  const actions = commitmentActions(state), budget = clinicWitnessBudget(state);
  const open = rows.filter(row => row.status === "Open").length;
  const compromised = rows.filter((row) => row.status === "Compromised").length;
  const unresolved = rows.filter((row) => row.status === "Unresolved").length;
  if (!step && !rows.length) return null;
  return <section className="objective-brief" aria-label="Current commitments" data-testid="objectives">
    {step && <p className="next-step"><strong>Next step</strong> {step}</p>}
    {rows.length > 0 && <details><summary>{(state.flags.chapel_shift_owed || state.flags.witness_shift_owed || state.flags.response_private_consent || state.flags.kerr_route_promised || state.flags.edda_shift_consent || state.flags.pump_attempted || state.flags.notice_started || state.flags.freight_started || state.flags.shelter_started) ? "Campaign commitments" : "Memory commitments"} · {rows.filter((row) => row.status === "Complete").length}/{rows.length} complete{open > 0 && ` · ${open} open`}{compromised > 0 && ` · ${compromised} compromised`}{unresolved > 0 && ` · ${unresolved} unresolved`}</summary>
      {budget && <p data-testid="care-budget">{budget}</p>}
      {actions.length > 0 && <div className="commitment-actions" data-testid="commitment-actions"><h2>Available here</h2><p className="hint">Find a choice to review it. Finding spends nothing; selecting the choice commits it.</p><ul>{actions.map(action => <li key={action.id}>
        {action.enabled ? <button type="button" className="ghost" data-testid={`find-commitment-${action.id}`} onClick={() => {
          const target = document.getElementById(`choice-label-${action.id}`)?.closest("button");
          target?.focus();
          target?.scrollIntoView({ block: "center", behavior: "instant" });
        }}>Find: {action.label}</button> : <strong>{action.label}</strong>}
        {action.detail && <p>{action.detail}</p>}
      </li>)}</ul></div>}
      <ul>{rows.map((row) => <li key={row.id}><strong>{row.title}</strong><span className={`objective-status ${row.status.toLowerCase()}`}>{row.status}</span><p>{row.detail}</p></li>)}</ul>
    </details>}
  </section>;
}

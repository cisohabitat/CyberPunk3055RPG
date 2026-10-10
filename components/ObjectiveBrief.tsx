import { nextStep, objectives } from "@/lib/objectives";
import type { GameState } from "@/lib/types";

export function ObjectiveBrief({ state }: { state: GameState }) {
  const step = nextStep(state);
  const rows = objectives(state);
  const compromised = rows.filter((row) => row.status === "Compromised").length;
  const unresolved = rows.filter((row) => row.status === "Unresolved").length;
  if (!step && !rows.length) return null;
  return <section className="objective-brief" aria-label="Current commitments" data-testid="objectives">
    {step && <p className="next-step"><strong>Next step</strong> {step}</p>}
    {rows.length > 0 && <details><summary>{(state.flags.chapel_shift_owed || state.flags.witness_shift_owed || state.flags.response_private_consent || state.flags.kerr_route_promised || state.flags.edda_shift_consent || state.flags.pump_attempted || state.flags.notice_started || state.flags.freight_started || state.flags.shelter_started) ? "Campaign commitments" : "Memory commitments"} · {rows.filter((row) => row.status === "Complete").length}/{rows.length} complete{compromised > 0 && ` · ${compromised} compromised`}{unresolved > 0 && ` · ${unresolved} unresolved`}</summary>
      <ul>{rows.map((row) => <li key={row.id}><strong>{row.title}</strong><span className={`objective-status ${row.status.toLowerCase()}`}>{row.status}</span><p>{row.detail}</p></li>)}</ul>
    </details>}
  </section>;
}

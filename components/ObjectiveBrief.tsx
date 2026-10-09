import { nextStep, objectives } from "@/lib/objectives";
import type { GameState } from "@/lib/types";

export function ObjectiveBrief({ state }: { state: GameState }) {
  const step = nextStep(state);
  const rows = objectives(state);
  if (!step && !rows.length) return null;
  return <section className="objective-brief" aria-label="Current commitments" data-testid="objectives">
    {step && <p className="next-step"><strong>Next step</strong> {step}</p>}
    {rows.length > 0 && <details><summary>Memory commitments · {rows.filter((row) => row.status === "Complete").length}/{rows.length} complete</summary>
      <ul>{rows.map((row) => <li key={row.id}><strong>{row.title}</strong><span className={`objective-status ${row.status.toLowerCase()}`}>{row.status}</span><p>{row.detail}</p></li>)}</ul>
    </details>}
  </section>;
}

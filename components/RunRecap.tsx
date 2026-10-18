import { checkpointLabel } from "@/lib/checkpoints";
import { recentDecisions } from "@/lib/play-feedback";
import type { GameState } from "@/lib/types";

export function RunRecap({ state }: { state: GameState }) {
  const decisions = recentDecisions(state);
  return <details className="run-recap" data-testid="run-recap">
    <summary>Where you left off · {checkpointLabel(state)}</summary>
    {state.pendingCheck && <p>A roll of {state.pendingCheck.roll} is held. Continue the run to review it; its outcome has not been committed.</p>}
    {decisions.length ? <><p>Recent decisions, oldest first:</p><ol>{decisions.map((label, index) => <li key={index}>{label}</li>)}</ol></> : <p>No decisions recorded yet. Continue at the saved location.</p>}
    <p className="hint">These are your chosen actions; their outcomes remain in the story and journal.</p>
  </details>;
}

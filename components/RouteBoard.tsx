import { ROUTE_ENTRIES, ROUTE_EXITS, routePlan } from "@/lib/route-planning";
import type { GameState } from "@/lib/types";

export function RouteBoard({ state }: { state: GameState }) {
  const plan = routePlan(state);
  const entries = state.sceneId === "act2_route_map" || !plan.entry ? ROUTE_ENTRIES : [plan.entry];
  const exits = state.sceneId === "act2_route_map" ? [] : state.sceneId === "act2_route_exit" || !plan.exit ? ROUTE_EXITS : [plan.exit];
  return <section className="route-board" aria-label="Depot route plan" data-testid="route-board">
    <div className="route-heading"><h2>Two crossings</h2><span>{state.flags.kerr_route_started ? "Departure committed" : "Saved draft · no cost yet"}</span></div>
    <div className="route-lanes">
      <div><h3>Entry</h3><ul>{entries.map((entry) => <li key={entry.id} className={entry.id === plan.entry?.id ? "route-selected" : ""}><strong>{entry.title}{entry.id === plan.entry?.id ? " · selected" : ""}</strong><p>{entry.detail}</p></li>)}</ul></div>
      <div><h3>Exit</h3>{exits.length ? <ul>{exits.map((exit) => <li key={exit.id} className={exit.id === plan.exit?.id ? "route-selected" : ""}><strong>{exit.title}{exit.id === plan.exit?.id ? " · selected" : ""}</strong><p>{exit.detail}</p></li>)}</ul> : <p className="hint">Choose after planning the entry.</p>}</div>
    </div>
    <p className="route-summary" role="status">{plan.entry?.title ?? "Choose an entry"} → {plan.exit?.title ?? "Choose an exit"} · {state.flags.kerr_route_started ? "Paid on departure" : "On departure"}: {plan.creds} creds, +{plan.strain} strain.</p>
    {plan.entry?.registered && state.flags.kerr_route_private && <p className="route-warning">This entry breaks your private terms. It records your handle and Kerr’s recipient name before any exit attempt.</p>}
    {state.flags.kerr_route_started && state.flags.kerr_route_trace && <p className="route-warning">Recipient registration remains. An anonymous exit cannot erase it.</p>}
    <p className="hint">Choose with the numbered options below. No timer or drag gesture is required.</p>
  </section>;
}

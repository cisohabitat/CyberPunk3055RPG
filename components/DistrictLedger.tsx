import { districtActorKnowledge, districtStatus } from "@/lib/district-response";
import type { GameState } from "@/lib/types";
import { showDistrictLedger } from "@/lib/campaign-presentation";

export function DistrictLedger({ state }: { state: GameState }) {
  if (!showDistrictLedger(state)) return null;
  return <details className="district-ledger" data-testid="district-ledger">
    <summary>Depot response · people and consequences</summary>
    <p data-testid="district-status">{districtStatus(state)}</p>
    {state.flags.district_public_review && <p className="hint">Public record: your signed register-review request. Private source and witness materials were not attached.</p>}
    {state.flags.district_private_query && <p className="hint">Private service reference: an appointment, with no public review notice or guarantee of anonymity.</p>}
    {districtActorKnowledge(state).map(person => <details key={person.name}><summary>{person.name} · what was shared</summary>
      <dl><dt>Firsthand</dt><dd>{person.firsthand}</dd><dt>You told them</dt><dd>{person.told}</dd><dt>Response</dt><dd>{person.response}</dd></dl>
    </details>)}
  </details>;
}

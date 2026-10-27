import { TECHNIQUES, techniqueMode, techniqueStat, techniqueStatus } from "@/lib/build-techniques";
import { districtRemaining } from "@/lib/district-response";
import type { GameState } from "@/lib/types";

export function TechniqueBoard({ state }: { state: GameState }) {
  if (!state.sceneId.startsWith("act2_technique_")) return null;
  return <aside className="technique-board" data-testid="technique-board" aria-label="Specialist procedure">
    <p className="hint">{techniqueStatus(state)} · {districtRemaining(state)} depot actions remain.</p>
    {state.sceneId.includes("chrome") && <details data-testid="technique-record-fields"><summary>Inspect the public field comparison · free</summary>
      <table><caption>Different populations; keep the source counts</caption><thead><tr><th scope="col">Record</th><th scope="col">Value</th></tr></thead><tbody>
        <tr><th scope="row">Display heading: People</th><td>3</td></tr><tr><th scope="row">Source: Workers</th><td>3</td></tr><tr><th scope="row">Source: Recipients</th><td>2</td></tr>
      </tbody></table></details>}
    {state.sceneId === "act2_technique_ghost_route" && <details data-testid="technique-envelope"><summary>Inspect the routing envelope · free</summary><dl>
      <dt>Return reference</dt><dd>Depot review desk</dd><dt>Recipient name</dt><dd>Empty; no witness or technician identity</dd><dt>Carrier record</dt><dd>{techniqueMode(state) === "screened" ? "Screened outer tags; no new courier signature. Earlier records remain." : "Your courier signature remains."}</dd>
    </dl></details>}
    <details data-testid="technique-builds"><summary>Training and equipment combinations</summary><ul>
      {TECHNIQUES.map(t => <li key={t.stat} data-active={techniqueStat(state) === t.stat || undefined}><strong>{t.stat.toUpperCase()} · {t.name}</strong>
        <p className="hint">{state.flags[`perk_${t.stat}`] ? "Training earned" : "Training required"} · {state.items.includes(t.kit) ? `${t.kitName} equipped` : `${t.kitName} not equipped`}</p><p>{t.use}</p>
      </li>)}
    </ul><p>These procedures use decisions and saved depot actions. They add no check bonus, extra die or training. A held result elsewhere remains held.</p></details>
  </aside>;
}

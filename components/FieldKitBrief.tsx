import { FIELD_KITS, equippedKits } from "@/lib/loadout";
import type { GameState } from "@/lib/types";

export function FieldKitBrief({ state }: { state: GameState }) {
  const shopping = state.sceneId === "act2_workshop";
  const missions = ["act2_witness_plan", "act2_witness_door", "act2_witness_checkpoint", "act2_archive_prep", "act2_archive_door"];
  const kits = shopping ? FIELD_KITS : equippedKits(state);
  if (!shopping && (!missions.includes(state.sceneId) || kits.length === 0)) return null;
  return <aside className="transfer-brief" aria-label={shopping ? "Compare field equipment" : "Equipped field kit"} data-testid="field-kit-brief">
    {shopping && <p>One field kit this week · <strong>{state.creds} creds available</strong>. Private witness care costs 90; staffed recovery costs 45.</p>}
    <dl className="testimony-sources">
      {kits.map((kit) => <div key={kit.id}><dt>{kit.name}{shopping ? ` · ${kit.price} creds` : " · equipped"}</dt><dd>{kit.uses}{state.flags[`perk_${kit.stat}`] ? " Complements your practiced skill." : " Works without training this skill."}</dd></div>)}
    </dl>
    <p className="hint">Only the listed checks receive the bonus. Equipment supplies no evidence, safe room, or consent.</p>
  </aside>;
}

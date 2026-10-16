import { FIELD_KITS, equippedKits, fieldKitBudget, trainedKitAdvice } from "@/lib/loadout";
import type { GameState } from "@/lib/types";

export function FieldKitBrief({ state }: { state: GameState }) {
  const shopping = state.sceneId === "act2_workshop";
  const missions = ["act2_witness_plan", "act2_witness_door", "act2_witness_checkpoint", "act2_archive_prep", "act2_archive_door"];
  const kits = shopping ? FIELD_KITS : equippedKits(state);
  if (!shopping && (!missions.includes(state.sceneId) || kits.length === 0)) return null;
  return <aside className="transfer-brief" aria-label={shopping ? "Compare field equipment" : "Equipped field kit"} data-testid="field-kit-brief">
    {shopping && <p>One field kit this week · <strong>{state.creds} creds available</strong>. Private witness care costs 90; staffed recovery costs 45.</p>}
    <dl className="testimony-sources">
      {kits.map((kit) => {
        const budget = fieldKitBudget(state.creds, kit.price);
        return <div key={kit.id}><dt>{kit.name}{shopping ? ` · ${kit.price} creds` : " · equipped"}</dt><dd>
          {kit.uses}{state.flags[`perk_${kit.stat}`] ? " Your practiced skill has its own methods." : " Works without training this skill."}
          {shopping && trainedKitAdvice(state, kit.stat) && <details className="kit-training" data-testid={`training-advice-${kit.id}`}>
            <summary>How the {kit.name} fits your training</summary>
            <p>{trainedKitAdvice(state, kit.stat)}</p>
          </details>}
          {shopping && <p className="kit-budget" data-testid={`budget-${kit.id}`}>
            {budget.affordable ? <><strong>After purchase: {budget.remaining} creds.</strong>{" "}
              {budget.careGap ? `Room + staffed rest: ${budget.careGap} more needed.` : "Enough cash remains for a room and staffed rest."}{" "}
              {!budget.careGap && (budget.careAndCourierGap ? `Adding a private courier would need ${budget.careAndCourierGap} more.` : "A private courier also fits that combined budget.")}
            </> : `Need ${-budget.remaining} more creds to buy this kit.`}
          </p>}
        </dd></div>;
      })}
    </dl>
    <p className="hint">Only the listed checks receive the bonus. Equipment supplies no evidence, safe room, or consent.{shopping && " Cash benchmarks: room 90 + staffed rest 45 = 135; adding private courier dispatch 15 brings the combined cost to 150. These comparisons reserve nothing; earned rooms and other legal methods remain available."}</p>
  </aside>;
}

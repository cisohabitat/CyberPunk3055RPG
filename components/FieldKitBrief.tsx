import { FIELD_KITS, equippedKits, fieldKitBudget, trainedKitAdvice } from "@/lib/loadout";
import type { GameState } from "@/lib/types";
import { kitComparison } from "@/lib/kit-comparison";
import { getScene, presentChoices } from "@/lib/engine";
import { TECHNIQUES } from "@/lib/build-techniques";
import type { ReactNode } from "react";

export function FieldKitBrief({ state, renderPurchase }: { state: GameState; renderPurchase?: (id: string) => ReactNode }) {
  const shopping = state.sceneId === "act2_workshop";
  const missions = ["act2_witness_plan", "act2_witness_door", "act2_witness_checkpoint", "act2_archive_prep", "act2_archive_door"];
  const kits = shopping ? FIELD_KITS : equippedKits(state);
  const purchases = shopping ? presentChoices(state, getScene(state.sceneId)) : [];
  function reviewChoice(id: string) {
    const target = document.getElementById(`choice-label-${id}`)?.closest("button");
    const height = document.querySelector(".topbar")?.getBoundingClientRect().height ?? 0;
    document.documentElement.style.setProperty("--header-h", `${height + 12}px`);
    target?.focus({ preventScroll: true });
    target?.scrollIntoView({ block: "start", behavior: "instant" });
  }
  const limits = <p className="hint">Only the listed checks receive the bonus. Equipment supplies no evidence, safe room, or consent.{shopping && " Cash benchmarks: room 90 + staffed rest 45 = 135; adding private courier dispatch 15 brings the combined cost to 150. These comparisons reserve nothing; earned rooms and other legal methods remain available."}</p>;
  if (!shopping && (!missions.includes(state.sceneId) || kits.length === 0)) return null;
  return <aside className={`transfer-brief field-kit-brief${shopping ? " kit-shop" : ""}`} aria-label={shopping ? "Compare field equipment" : "Equipped field kit"} data-testid="field-kit-brief">
    {shopping && <h2>Compare field equipment</h2>}
    {shopping && <p>One field kit this week · <strong>{state.creds} creds available</strong>. Private witness care costs 90; staffed recovery costs 45.</p>}
    {shopping && renderPurchase && limits}
    {shopping && renderPurchase && purchases.some(choice => choice.enabled && choice.id.startsWith("buy-")) && <p className="hint kit-review-terms">Find the purchase choice and review it. No money is spent until you select that choice.</p>}
    {shopping && renderPurchase && purchases.some(choice => choice.id === "leave-workshop" && choice.enabled) && <a className="ghost kit-exit-review" data-testid="review-workshop-exit" href="#campaign-choice-leave-workshop" onClick={event => { event.preventDefault(); reviewChoice("leave-workshop"); }}>Review leaving without buying</a>}
    <dl className="testimony-sources">
      {kits.map((kit) => {
        const budget = fieldKitBudget(state.creds, kit.price);
        const purchase = purchases.find(choice => choice.id === `buy-${kit.id}`);
        return <div key={kit.id}><dt>{kit.name}{shopping ? ` · ${kit.price} creds` : " · equipped"}</dt><dd>
          {!(shopping && renderPurchase && purchase?.enabled) && kit.uses}{state.flags[`perk_${kit.stat}`] ? " Your practiced skill has its own methods." : " Works without training this skill."}
          {shopping && trainedKitAdvice(state, kit.stat) && <details className="kit-training" data-testid={`training-advice-${kit.id}`}>
            <summary>How the {kit.name} fits your training</summary>
            <p>{trainedKitAdvice(state, kit.stat)}</p>
            <p>{TECHNIQUES.find(t => t.kit === kit.id)?.use} Later filing procedures need an actual depot request and remaining actions; this comparison grants no access.</p>
          </details>}
          {shopping && !state.items.includes(kit.id) && <details className="kit-comparison" data-testid={`kit-odds-${kit.id}`}>
            <summary>Compare current check odds</summary>
            {renderPurchase && purchase?.enabled && <div className="kit-reference">{kit.uses}</div>}
            <ul>{kitComparison(state, kit.id).map(row => <li key={row.label}>{row.label}: {row.before}% → {row.after}% with this kit.{row.before === row.after ? " No increase at current modifiers." : ""}</li>)}</ul>
            <p className="hint">Examples use your current stats and modifiers. Later preparation or attention can change these odds. Buying equipment grants no access or successful outcome.</p>
          </details>}
          {shopping && <p className="kit-budget" data-testid={`budget-${kit.id}`}>
            {budget.affordable ? <><strong>After purchase: {budget.remaining} creds.</strong>{" "}
              {budget.careGap ? `Room + staffed rest: ${budget.careGap} more needed.` : "Enough cash remains for a room and staffed rest."}{" "}
              {!budget.careGap && (budget.careAndCourierGap ? `Adding a private courier would need ${budget.careAndCourierGap} more.` : "A private courier also fits that combined budget.")}
            </> : `Need ${-budget.remaining} more creds to buy this kit.`}
          </p>}
          {shopping && <div className="kit-purchase-review">
            {purchase ? <>
              <button className="ghost" type="button" data-testid={`review-purchase-${kit.id}`} disabled={!purchase.enabled} onClick={() => reviewChoice(purchase.id)}>Review {kit.name} purchase</button>
              {(!renderPurchase || !purchase.enabled) && <p className="hint">{purchase.enabled ? "Find the purchase choice and review it. No money is spent until you select that choice." : purchase.disabledReason}</p>}
            </> : <p className="hint">{state.items.includes(kit.id) ? "This kit is equipped." : "No purchase choice is available for this kit in this visit."}</p>}
          </div>}
          {shopping && renderPurchase && purchase && <div className="kit-commit">{renderPurchase(purchase.id)}</div>}
        </dd></div>;
      })}
    </dl>
    {(!shopping || !renderPurchase) && limits}
  </aside>;
}

// Offline matched-objective QA; no state injection and no application imports.
import { ORIGINS, STATS } from "./character";
import { commitChoice, createCharacter, getScene, presentChoices } from "./engine";
import { FIELD_KITS } from "./loadout";
import type { ComplicationId, GameState, OriginId, StatId } from "./types";

export type MissionCase = {
  origin: OriginId; stat: StatId; complication: ComplicationId | null;
  income: "sale" | "no-sale"; equipment: boolean; mission: "witness" | "archive";
};
type Branch = { state: GameState; mass: number; fallback: boolean; primary: boolean; checks: number; capped: boolean };
export type MissionResult = MissionCase & {
  id: string; leaves: number; mass: number; purchased: boolean; kitPrice: number;
  startingCreds: number; missionCreds: number; startingStrain: number;
  objective: number; primaryObjective: number; fallback: number; keyAuthenticated: number;
  witnessExposed: number; archiveFlagged: number; signedExtraction: number;
  cashSpent: number; missionCashSpent: number; strainDelta: number;
  clinicStandingSpent: number; capReached: number; expectedChecks: number;
};

const legal = (state: GameState) => presentChoices(state, getScene(state.sceneId)).filter(c => c.enabled);
function directed(state: GameState, id: string): GameState {
  const choice = legal(state).find(c => c.id === id);
  if (!choice) throw new Error(`Controlled prefix: unavailable ${state.sceneId}/${id}`);
  // Setup only, explicitly directed and identical across specializations.
  return commitChoice(state, choice, choice.check ? { roll: 10 } : undefined).state;
}

export function missionSetup(spec: MissionCase) {
  let state = createCharacter({ handle: "Mission review", givenName: "", origin: spec.origin, complication: spec.complication,
    bonus: { chrome: 0, nerve: 0, face: 0, ghost: 0, [spec.stat]: 2 }, startWithPrologue: true });
  const prefix = ["begin-opening", "opening-identity", "hear-stallholder", "take-the-stool", "ask-pay", "haggle", "pocket", "accept", "side", "spoof-door", "go", "honest", "pact-copy", "copy", "heard", "inspect-hour", "inspect-signature", "inspect-order", "inspect-roster", "reconstruct", "separate-decisions", "label-unverified", spec.mission === "witness" ? "seal-witness" : "seal-full", "talk-leave", spec.income === "sale" ? "both" : "destroy", "week-after", "into-week", "practice", `learn-${spec.stat}`, "read-board"];
  for (const id of prefix) state = directed(state, id);
  const beforeShopping = state;
  let purchased = false;
  const kit = FIELD_KITS.find(k => k.stat === spec.stat)!;
  if (spec.equipment) {
    state = directed(state, "visit-workshop");
    purchased = legal(state).some(c => c.id === `buy-${kit.id}`);
    state = directed(state, purchased ? `buy-${kit.id}` : "leave-workshop");
  }
  for (const id of ["to-lumen", "hear-lumen", "walk-with-her"]) state = directed(state, id);
  state = directed(state, spec.mission === "witness" ? "protect-witness" : "trace-order");
  return { state, beforeShopping, purchased, kitPrice: purchased ? kit.price : 0 };
}

function missionMove(branch: Branch, spec: MissionCase): { id: string; fallback?: boolean; primary?: boolean } {
  const state = branch.state, ids = new Set(legal(state).map(c => c.id));
  const pick = (...options: string[]) => {
    const id = options.find(id => ids.has(id));
    if (!id) throw new Error(`No supported mission continuation: ${state.sceneId} (${[...ids].join(",")})`);
    return id;
  };
  switch (state.sceneId) {
    case "act2_witness_brief": return { id: "agree-terms" };
    case "act2_witness_plan": return { id: ({ chrome: "read-scanner", nerve: "steady-chair", face: "arrange-escort", ghost: "scout-patrol" })[spec.stat] };
    case "act2_witness_door": {
      if (spec.stat === "nerve" && state.items.includes("chair-harness") && state.flags.witness_braced) return { id: "compare-witness-support" };
      const primary = `${spec.stat}-transfer`;
      if (ids.has(primary)) return { id: primary, primary: true };
      // Recovery is identical for every build: funded room, then the existing
      // hatch attempt. No fallback silently counts as matching-method success.
      return { id: pick("pay-room", "slip-witness"), fallback: true };
    }
    case "act2_witness_support": return { id: "harness-chair-transfer", primary: true };
    case "act2_witness_checkpoint": return { id: pick("clinic-transfer", "fund-checkpoint-room", "argue-transfer"), fallback: true };
    case "act2_witness_arrival": return { id: "defer-account" };
    case "act2_witness_lost": return { id: "record-cost" };
    case "act2_archive_brief": return { id: "agree-archive-terms" };
    case "act2_archive_prep": return { id: spec.stat === "ghost" ? "watch-archive" : spec.stat === "nerve" ? "brace-archive" : "skip-archive-prep" };
    case "act2_archive_compare": return { id: "separate-source-tests" };
    case "act2_archive_door": return { id: ({ chrome: "isolate-key", nerve: "hold-reader", face: "request-invoice", ghost: "lift-carbon" })[spec.stat], primary: true };
    case "act2_archive_gap": return { id: pick("buy-ledger", "old-employee", "keep-gap"), fallback: true };
    case "act2_archive_custody": return { id: "withhold-technician" };
    case "act2_archive_verified": return { id: "keep-chain" };
    default: throw new Error(`Unexpected mission scene ${state.sceneId}`);
  }
}

const rounded = (n: number) => Math.round(n * 1e10) / 1e10;
export function compareMission(spec: MissionCase): MissionResult {
  const setup = missionSetup(spec), start = setup.state;
  const result: MissionResult = { ...spec, id: `${spec.origin}/${spec.stat}/${spec.complication ?? "none"}/${spec.income}/${spec.equipment ? "kit-requested" : "no-kit"}/${spec.mission}`,
    leaves: 0, mass: 0, purchased: setup.purchased, kitPrice: setup.kitPrice,
    startingCreds: setup.beforeShopping.creds, missionCreds: start.creds, startingStrain: start.strain,
    objective: 0, primaryObjective: 0, fallback: 0, keyAuthenticated: 0, witnessExposed: 0, archiveFlagged: 0, signedExtraction: 0,
    cashSpent: 0, missionCashSpent: 0, strainDelta: 0, clinicStandingSpent: 0, capReached: 0, expectedChecks: 0 };
  function visit(branch: Branch, depth: number) {
    if (depth > 20) throw new Error(`Mission decision budget exceeded: ${result.id}/${branch.state.sceneId}`);
    const state = branch.state;
    if (state.sceneId === "act2_middle") {
      const objective = Boolean(spec.mission === "witness" ? state.flags.witness_safe : state.flags.order_verified);
      if (state.flags.nia_public_consent || state.flags.witness_consent || state.flags.testimony_published) throw new Error(`Mission invented recording/publication permission: ${result.id}`);
      if (spec.mission === "witness" && state.flags.archive_key_authenticated) throw new Error("Witness transfer invented key authentication");
      result.leaves++; result.mass += branch.mass;
      const add = (key: keyof Pick<MissionResult, "objective" | "primaryObjective" | "fallback" | "keyAuthenticated" | "witnessExposed" | "archiveFlagged" | "signedExtraction" | "cashSpent" | "missionCashSpent" | "strainDelta" | "clinicStandingSpent" | "capReached" | "expectedChecks">, n: number | boolean) => { result[key] += branch.mass * Number(n); };
      add("objective", objective); add("primaryObjective", objective && branch.primary && !branch.fallback);
      add("fallback", branch.fallback); add("keyAuthenticated", Boolean(state.flags.archive_key_authenticated));
      add("witnessExposed", Boolean(state.flags.witness_lost)); add("archiveFlagged", Boolean(state.flags.archive_flagged || state.flags.old_badge_traced));
      add("signedExtraction", Boolean(state.flags.archive_method_face || state.flags.archive_method_nerve));
      add("cashSpent", setup.beforeShopping.creds - state.creds); add("missionCashSpent", start.creds - state.creds);
      add("strainDelta", state.strain - start.strain); add("clinicStandingSpent", start.factions.lumen - state.factions.lumen);
      add("capReached", branch.capped); add("expectedChecks", branch.checks);
      return;
    }
    const move = missionMove(branch, spec), choice = legal(state).find(c => c.id === move.id);
    if (!choice) throw new Error(`Unavailable mission choice: ${result.id}/${state.sceneId}/${move.id}`);
    // Enumerate every face at every actual check, retaining branch probability.
    // Unchecked methods get one branch, never a fictitious die or automatic miss.
    for (const roll of choice.check ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] : [undefined]) {
      const next = commitChoice(state, choice, roll === undefined ? undefined : { roll }).state;
      if (next.creds < 0 || next.strain < 0 || next.strain > 5) throw new Error("Invalid mission resources");
      visit({ state: next, mass: branch.mass / (choice.check ? 10 : 1), fallback: branch.fallback || Boolean(move.fallback), primary: branch.primary || Boolean(move.primary), checks: branch.checks + Number(Boolean(choice.check)), capped: branch.capped || next.strain === 5 }, depth + 1);
    }
  }
  visit({ state: start, mass: 1, fallback: false, primary: false, checks: 0, capped: start.strain === 5 }, 0);
  if (Math.abs(result.mass - 1) > 1e-9) throw new Error(`Incomplete die probability: ${result.id}`);
  for (const key of Object.keys(result) as (keyof MissionResult)[]) if (typeof result[key] === "number") (result as unknown as Record<string, unknown>)[key] = rounded(result[key] as number);
  return result;
}

export function matchedMissionReport() {
  const rows: MissionResult[] = [];
  for (const origin of Object.keys(ORIGINS) as OriginId[]) for (const stat of STATS) for (const complication of [null, "debt", "optic", "on-file"] as const) for (const income of ["sale", "no-sale"] as const) for (const equipment of [false, true]) for (const mission of ["witness", "archive"] as const) rows.push(compareMission({ origin, stat, complication, income, equipment, mission }));
  return { schema: 1, method: "Controlled legal prefix with directed tens; exact weighted enumeration of all subsequent mission dice. No injected state. Conditional mission comparison, not natural-dice whole-campaign performance.", rows };
}

export function matchedMissionSummary(report: ReturnType<typeof matchedMissionReport>): string {
  const pct = (n: number) => `${(100 * n).toFixed(1)}%`;
  const lines = ["# Matched mission balance", "", report.method, "", `${report.rows.length} controlled scenarios; ${report.rows.reduce((sum, r) => sum + r.leaves, 0)} terminal die branches. Branches have different probabilities; row metrics use probability weights, not leaf counts.`, "", "| Origin / complication | Stat | Income | Kit bought | Mission | Primary objective | After fallback | Fallback used | Total cash spent | Strain delta | Key authenticated |", "|---|---|---|---|---|---|---|---|---|---|---|"];
  for (const r of report.rows) lines.push(`| ${r.origin}/${r.complication ?? "none"} | ${r.stat} | ${r.income} | ${r.purchased ? r.kitPrice : r.equipment ? "unaffordable" : "not requested"} | ${r.mission} | ${pct(r.primaryObjective)} | ${pct(r.objective)} | ${pct(r.fallback)} | ${r.cashSpent.toFixed(2)} | ${r.strainDelta.toFixed(2)} | ${pct(r.keyAuthenticated)} |`);
  lines.push("", "Total cash includes actual kit purchases. Strain deltas include normal critical relief and caps; JSON records cap incidence and traces separately. A successful transfer grants no recording or quotation permission. Archive corroboration and digital-key authentication are separate outcomes. See docs/MATCHED_MISSION_BALANCE.md for policy and findings.", "");
  return lines.join("\n");
}

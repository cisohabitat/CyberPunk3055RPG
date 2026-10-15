// Offline QA only. Never import this sampler into the application.
import { ORIGINS, STATS, STRAIN_MAX } from "./character";
import { commitChoice, createCharacter, getScene, presentChoices, previewCheck } from "./engine";
import { SCENES } from "./story";
import type { ComplicationId, OriginId, StatId } from "./types";

export const BALANCE_CONFIG = {
  version: 1, runsPerCell: 200, firstSeed: 1, maxSteps: 300,
  policies: ["uniform", "specialist"] as const,
};
const complications: (ComplicationId | null)[] = [null, "debt", "optic", "on-file"];
export type BalanceCell = {
  id: string; origin: OriginId; stat: StatId; complication: ComplicationId | null;
  policy: typeof BALANCE_CONFIG.policies[number]; runs: number; completed: number;
  checks: number; successes: number; expectedSuccesses: number;
  decisions: number; zeroCashDecisions: number; highStrainDecisions: number;
  cashBlockedOptions: number; visibleOptions: number;
  finalCreds: number; finalStrain: number; steps: number;
  outcomes: { witnessSafe: number; orderVerified: number; publicAccount: number };
  endings: Record<string, number>;
};
export type BalanceReport = {
  schema: 1; config: typeof BALANCE_CONFIG; cells: BalanceCell[];
  coverage: { scenes: string[]; choices: string[] };
  checks: Record<string, { attempts: number; successes: number; expectedSuccesses: number; stat: StatId }>;
  dice: number[];
  failures: { cell: string; seed: number; scene: string; reason: string }[];
};

// Separate streams: selecting an option cannot consume a future die face.
// Specializations within one origin/complication/policy share seed streams;
// other strata use independent salts. Branching means the nth roll/decision
// need not represent the same encounter in each specialization.
export function balanceRandom(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value = (value + 0x6d2b79f5) >>> 0;
    let mixed = Math.imul(value ^ (value >>> 15), value | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

export function runBalanceAudit(config: typeof BALANCE_CONFIG = BALANCE_CONFIG): BalanceReport {
  if (!Number.isInteger(config.runsPerCell) || config.runsPerCell < 1 ||
      !Number.isInteger(config.maxSteps) || config.maxSteps < 1 ||
      !Number.isInteger(config.firstSeed) || config.firstSeed < 1 ||
      config.firstSeed + config.runsPerCell > 0xffffffff ||
      JSON.stringify(config.policies) !== JSON.stringify(BALANCE_CONFIG.policies) || config.version !== 1) {
    throw new Error("Invalid balance sampling configuration");
  }
  const report: BalanceReport = { schema: 1, config, cells: [], coverage: { scenes: [], choices: [] }, checks: {}, dice: Array(10).fill(0), failures: [] };
  const scenes = new Set<string>(), choicesSeen = new Set<string>();
  for (const origin of Object.keys(ORIGINS) as OriginId[]) for (const stat of STATS) for (const complication of complications) for (const policy of config.policies) {
    const cell: BalanceCell = {
      id: `${origin}/${stat}/${complication ?? "none"}/${policy}`, origin, stat, complication, policy,
      runs: config.runsPerCell, completed: 0, checks: 0, successes: 0, expectedSuccesses: 0,
      decisions: 0, zeroCashDecisions: 0, highStrainDecisions: 0, cashBlockedOptions: 0, visibleOptions: 0,
      finalCreds: 0, finalStrain: 0, steps: 0,
      outcomes: { witnessSafe: 0, orderVerified: 0, publicAccount: 0 }, endings: {},
    };
    report.cells.push(cell);
    for (let seed = config.firstSeed; seed < config.firstSeed + config.runsPerCell; seed++) {
      const stratum = (Object.keys(ORIGINS).indexOf(origin) * complications.length + complications.indexOf(complication)) * config.policies.length + config.policies.indexOf(policy);
      const streamSeed = (seed + Math.imul(stratum, 0x85ebca6b)) >>> 0;
      const select = balanceRandom(streamSeed), dice = balanceRandom(streamSeed ^ 0x9e3779b9);
      let state = createCharacter({ handle: "Balance QA", givenName: "", origin, complication,
        bonus: { chrome: 0, nerve: 0, face: 0, ghost: 0, [stat]: 2 }, startWithPrologue: true });
      try {
        for (let step = 0; ; step++) {
          const scene = getScene(state.sceneId);
          scenes.add(scene.id);
          if (scene.finale) {
            cell.completed++; cell.finalCreds += state.creds; cell.finalStrain += state.strain; cell.steps += step;
            cell.endings[scene.id] = (cell.endings[scene.id] ?? 0) + 1;
            cell.outcomes.witnessSafe += Number(Boolean(state.flags.witness_safe));
            cell.outcomes.orderVerified += Number(Boolean(state.flags.order_verified));
            cell.outcomes.publicAccount += Number(Boolean(state.flags.testimony_published));
            break;
          }
          if (step >= config.maxSteps) throw new Error("Decision budget exceeded (possible loop)");
          const visible = presentChoices(state, scene), enabled = visible.filter(choice => choice.enabled);
          if (!enabled.length) throw new Error("No enabled continuation");
          cell.decisions++; cell.zeroCashDecisions += Number(state.creds === 0);
          cell.highStrainDecisions += Number(state.strain >= 4); cell.visibleOptions += visible.length;
          cell.cashBlockedOptions += visible.filter(choice => choice.requireCreds !== undefined && state.creds < choice.requireCreds).length;
          // Specialist attempts a matching check four times as often, and seeks
          // its training when offered. It never reads future outcomes/effects.
          const weights = enabled.map(choice => policy === "specialist" &&
            (choice.check?.stat === stat || choice.id === `learn-${stat}`) ? 4 : 1);
          let draw = select() * weights.reduce((sum, weight) => sum + weight, 0), index = 0;
          while (index < enabled.length - 1 && draw >= weights[index]) draw -= weights[index++];
          const choice = enabled[index], key = `${scene.id}/${choice.id}`;
          choicesSeen.add(key);
          const roll = choice.check ? 1 + Math.floor(dice() * 10) : undefined;
          const expected = choice.check ? previewCheck(state, choice.check).hits / 10 : 0;
          const result = commitChoice(state, choice, roll === undefined ? undefined : { roll });
          if (result.check && choice.check && roll !== undefined) {
            cell.checks++; cell.successes += Number(result.check.success); cell.expectedSuccesses += expected;
            report.dice[roll - 1]++;
            const encounter = report.checks[key] ??= { attempts: 0, successes: 0, expectedSuccesses: 0, stat: choice.check.stat };
            encounter.attempts++; encounter.successes += Number(result.check.success); encounter.expectedSuccesses += expected;
          }
          state = result.state;
          if (!Number.isFinite(state.creds) || state.creds < 0 || !Number.isInteger(state.strain) || state.strain < 0 || state.strain > STRAIN_MAX) {
            throw new Error("Invalid resources after committed choice");
          }
        }
      } catch (error) {
        report.failures.push({ cell: cell.id, seed, scene: state.sceneId, reason: error instanceof Error ? error.message : String(error) });
      }
    }
  }
  report.coverage = { scenes: [...scenes].sort(), choices: [...choicesSeen].sort() };
  return report;
}

const ratio = (n: number, d: number) => d ? n / d : 0;
export function validateBalanceReport(value: unknown): asserts value is BalanceReport {
  const fail = () => { throw new Error("Invalid balance report: expected complete finite aggregates for 96 unique build/policy cells"); };
  if (!value || typeof value !== "object") fail();
  const r = value as BalanceReport;
  if (r.schema !== 1 || !r.config || r.config.version !== 1 ||
      !Number.isInteger(r.config.runsPerCell) || r.config.runsPerCell < 1 ||
      !Number.isInteger(r.config.firstSeed) || r.config.firstSeed < 1 ||
      !Number.isInteger(r.config.maxSteps) || r.config.maxSteps < 1 ||
      JSON.stringify(r.config.policies) !== JSON.stringify(BALANCE_CONFIG.policies) ||
      !Array.isArray(r.cells) || r.cells.length !== 96 ||
      !Array.isArray(r.failures) || !Array.isArray(r.dice) || r.dice.length !== 10 ||
      !r.coverage || !r.checks || typeof r.checks !== "object" || Array.isArray(r.checks)) fail();
  const finite = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n) && n >= 0;
  const count = (n: unknown): n is number => finite(n) && Number.isInteger(n);
  const ids = new Set<string>();
  let checks = 0, successes = 0, expected = 0;
  for (const c of r.cells) {
    if (!c || !Object.hasOwn(ORIGINS, c.origin) || !STATS.includes(c.stat) || !complications.includes(c.complication) ||
        !r.config.policies.includes(c.policy) || c.id !== `${c.origin}/${c.stat}/${c.complication ?? "none"}/${c.policy}` || ids.has(c.id)) fail();
    ids.add(c.id);
    for (const key of ["runs", "completed", "checks", "successes", "decisions", "zeroCashDecisions", "highStrainDecisions", "cashBlockedOptions", "visibleOptions", "finalCreds", "finalStrain", "steps"] as const) if (!count(c[key])) fail();
    if (c.runs !== r.config.runsPerCell || c.completed > c.runs || c.successes > c.checks || !finite(c.expectedSuccesses) || c.expectedSuccesses > c.checks + 1e-6 ||
        c.zeroCashDecisions > c.decisions || c.highStrainDecisions > c.decisions || c.cashBlockedOptions > c.visibleOptions || c.finalStrain > c.completed * STRAIN_MAX ||
        !c.outcomes || !c.endings || typeof c.endings !== "object") fail();
    for (const key of ["witnessSafe", "orderVerified", "publicAccount"] as const) if (!count(c.outcomes[key]) || c.outcomes[key] > c.completed) fail();
    if (Object.entries(c.endings).some(([id, n]) => !getScene(id).finale || !count(n)) || Object.values(c.endings).reduce((sum, n) => sum + n, 0) !== c.completed) fail();
    checks += c.checks; successes += c.successes; expected += c.expectedSuccesses;
  }
  for (const kind of ["scenes", "choices"] as const) if (!Array.isArray(r.coverage[kind]) ||
    !r.coverage[kind].length || r.coverage[kind].some(id => typeof id !== "string") || new Set(r.coverage[kind]).size !== r.coverage[kind].length) fail();
  for (const n of r.dice) if (!count(n)) fail();
  if (r.dice.reduce((sum, n) => sum + n, 0) !== checks) fail();
  let encounterChecks = 0, encounterSuccesses = 0, encounterExpected = 0;
  for (const c of Object.values(r.checks)) {
    if (!c || !count(c.attempts) || !count(c.successes) || c.successes > c.attempts ||
        !finite(c.expectedSuccesses) || c.expectedSuccesses > c.attempts + 1e-6 || !STATS.includes(c.stat)) fail();
    encounterChecks += c.attempts; encounterSuccesses += c.successes; encounterExpected += c.expectedSuccesses;
  }
  if (encounterChecks !== checks || encounterSuccesses !== successes || Math.abs(encounterExpected - expected) > 1e-6) fail();
}

export function balanceIssues(current: BalanceReport, baseline: BalanceReport): string[] {
  validateBalanceReport(current); validateBalanceReport(baseline);
  const issues: string[] = [];
  if (current.schema !== 1 || baseline.schema !== 1 || JSON.stringify(current.config) !== JSON.stringify(baseline.config)) {
    return ["Balance schema/sampling configuration differs; review and explicitly regenerate the baseline"];
  }
  if (current.failures.length) issues.push(`${current.failures.length} campaigns failed; first: ${JSON.stringify(current.failures[0])}`);
  if (baseline.failures.length || baseline.cells.some(c => c.completed !== c.runs)) issues.push("Baseline contains incomplete campaigns; it cannot establish acceptance");
  const previous = new Map(baseline.cells.map(cell => [cell.id, cell]));
  if (current.cells.length !== 96 || previous.size !== 96 || new Set(current.cells.map(cell => cell.id)).size !== 96) issues.push("Expected 96 unique build/policy cells");
  for (const cell of current.cells) {
    const before = previous.get(cell.id);
    if (!before) { issues.push(`Missing baseline cell ${cell.id}`); continue; }
    if (cell.completed !== cell.runs || cell.runs !== current.config.runsPerCell) issues.push(`${cell.id}: incomplete campaign sampling`);
    const rates = [
      ["check success", ratio(before.successes, before.checks) - ratio(cell.successes, cell.checks), .05, Math.min(before.checks, cell.checks) >= 100],
      ["expected check success", ratio(before.expectedSuccesses, before.checks) - ratio(cell.expectedSuccesses, cell.checks), .05, Math.min(before.checks, cell.checks) >= 100],
      ["zero-cash decision share", ratio(cell.zeroCashDecisions, cell.decisions) - ratio(before.zeroCashDecisions, before.decisions), .10, true],
      ["high-strain decision share", ratio(cell.highStrainDecisions, cell.decisions) - ratio(before.highStrainDecisions, before.decisions), .10, true],
      ["cash-blocked option share", ratio(cell.cashBlockedOptions, cell.visibleOptions) - ratio(before.cashBlockedOptions, before.visibleOptions), .10, true],
    ] as const;
    for (const [label, delta, limit, eligible] of rates) if (eligible && delta > limit + 1e-9) issues.push(`${cell.id}: ${label} worsened ${(100 * delta).toFixed(1)}pp (limit ${100 * limit}pp)`);
    // Means use completed runs only; originating balances are never pooled.
    if (ratio(before.finalCreds, before.completed) - ratio(cell.finalCreds, cell.completed) > 25) issues.push(`${cell.id}: mean final cash fell by more than 25 creds`);
    if (ratio(cell.finalStrain, cell.completed) - ratio(before.finalStrain, before.completed) > .5) issues.push(`${cell.id}: mean final strain rose by more than 0.5`);
    if (ratio(cell.steps, cell.completed) > ratio(before.steps, before.completed) * 1.25) issues.push(`${cell.id}: mean campaign decisions rose by more than 25%`);
    if (cell.checks < before.checks * .8) issues.push(`${cell.id}: check sample fell by more than 20%`);
  }
  for (const kind of ["scenes", "choices"] as const) {
    const seen = new Set(current.coverage[kind]);
    const lost = baseline.coverage[kind].filter(id => !seen.has(id));
    if (lost.length) issues.push(`Lost sampled ${kind}: ${lost.join(", ")}`);
  }
  // Per-encounter guard prevents an easier route elsewhere masking a weakened check.
  for (const [key, before] of Object.entries(baseline.checks)) {
    const after = current.checks[key];
    if (before.attempts >= 200 && after && after.attempts >= 200 &&
        before.expectedSuccesses / before.attempts - after.expectedSuccesses / after.attempts > .05 + 1e-9) {
      issues.push(`${key}: expected check success fell by more than 5pp`);
    }
  }
  return issues;
}

export function balanceSummary(report: BalanceReport): string {
  const sum = (field: "runs" | "completed" | "checks" | "successes") => report.cells.reduce((total, cell) => total + cell[field], 0);
  const pct = (n: number, d: number) => `${(100 * ratio(n, d)).toFixed(1)}%`;
  const lines = ["# Gameplay balance audit", "", `${sum("completed")}/${sum("runs")} campaigns completed; ${sum("checks")} natural-dice checks; ${pct(sum("successes"), sum("checks"))} succeeded.`,
    `${report.coverage.scenes.length} scenes and ${report.coverage.choices.length} choices sampled.`, "",
    "| Origin | Specialization | Complication | Policy | Check success | Zero-cash decisions | High-strain decisions | Mean final creds | Mean final strain |", "|---|---|---|---|---|---|---|---|---|" ];
  for (const c of report.cells) lines.push(`| ${c.origin} | ${c.stat} | ${c.complication ?? "none"} | ${c.policy} | ${pct(c.successes, c.checks)} (${c.checks}) | ${pct(c.zeroCashDecisions, c.decisions)} | ${pct(c.highStrainDecisions, c.decisions)} | ${ratio(c.finalCreds, c.completed).toFixed(1)} | ${ratio(c.finalStrain, c.completed).toFixed(2)} |`);
  lines.push("", "## Build disparity flags (review only)", "", "Check mix and branching differ; these flags do not prove a dominant build. No finale is treated as a win.");
  for (const origin of Object.keys(ORIGINS)) for (const complication of complications) for (const policy of report.config.policies) {
    const cells = report.cells.filter(c => c.origin === origin && c.complication === complication && c.policy === policy && c.checks >= 100);
    if (cells.length !== 4) continue;
    const sorted = cells.toSorted((a, b) => ratio(a.successes, a.checks) - ratio(b.successes, b.checks));
    const low = sorted[0], high = sorted[3], gap = ratio(high.successes, high.checks) - ratio(low.successes, low.checks);
    if (gap > .10) lines.push(`- ${origin}/${complication ?? "none"}/${policy}: ${high.stat} vs ${low.stat}, ${(100 * gap).toFixed(1)}pp check-success spread.`);
  }
  const sampledScenes = new Set(report.coverage.scenes), sampledChoices = new Set(report.coverage.choices);
  const missingScenes = Object.keys(SCENES).filter(id => !sampledScenes.has(id)).sort();
  const missingChoices = Object.values(SCENES).flatMap(scene => scene.choices.map(choice => `${scene.id}/${choice.id}`)).filter(id => !sampledChoices.has(id)).sort();
  lines.push("", "## Sampling gaps", "", `${missingScenes.length} scenes and ${missingChoices.length} choices were not sampled; authored route tests remain necessary.`, "", ...missingScenes.map(id => `- Scene: ${id}`), "", "<details><summary>Unsampled choices</summary>", "", ...missingChoices.map(id => `- ${id}`), "", "</details>", "", "Checks with fewer than 200 attempts receive no per-encounter rate gate:", "", ...Object.entries(report.checks).filter(([, c]) => c.attempts < 200).sort(([a], [b]) => a.localeCompare(b)).map(([key, c]) => `- ${key}: ${c.attempts} attempts`));
  lines.push("", "Seeded source-aware engine simulation; no player telemetry, injected resources, prescribed good endings or measure of enjoyment. Specialist weights matching checks/training 4:1; it does not optimize the campaign. See docs/STATISTICAL_BALANCE.md for thresholds and interpretation.", "");
  return lines.join("\n");
}

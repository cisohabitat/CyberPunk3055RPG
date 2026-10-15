import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { it } from "node:test";
import { BALANCE_CONFIG, balanceIssues, balanceRandom, balanceSummary, runBalanceAudit, validateBalanceReport } from "./balance-audit";
import type { BalanceReport } from "./balance-audit";
import { getScene } from "./engine";

const baseline: BalanceReport = JSON.parse(readFileSync(new URL("../qa/balance/baseline.json", import.meta.url), "utf8"));
const copy = () => structuredClone(baseline);

it("samples every origin/specialization/complication/policy legally and reproducibly", () => {
  const config = { ...BALANCE_CONFIG, runsPerCell: 4 };
  const a = runBalanceAudit(config), b = runBalanceAudit(config);
  assert.deepEqual(a, b);
  validateBalanceReport(a);
  assert.deepEqual(a.failures, []);
  assert.equal(a.cells.length, 96);
  assert.ok(a.cells.every(cell => cell.completed === 4));
  assert.ok(a.cells.some(cell => cell.complication === null));
  assert.ok(a.cells.some(cell => cell.complication === "debt" && cell.origin === "dustline" && cell.zeroCashDecisions > 0));
  for (const id of a.coverage.scenes) assert.ok(getScene(id));
  for (const key of a.coverage.choices) {
    const [scene, choice] = key.split("/");
    assert.ok(getScene(scene).choices.some(option => option.id === choice));
  }
  assert.equal(a.dice.reduce((sum, n) => sum + n, 0), a.cells.reduce((sum, c) => sum + c.checks, 0));
});

it("uses a fixed mixed random stream with every die face represented across seeds", () => {
  const random = balanceRandom(1);
  assert.deepEqual(Array.from({ length: 8 }, () => random()), [0.6270739405881613, 0.002735721180215478, 0.5274470399599522, 0.9810509674716741, 0.9683778982143849, 0.281103502959013, 0.6128388606011868, 0.7207431411370635]);
  const faces = new Set(Array.from({ length: 200 }, (_, index) => Math.floor(balanceRandom(index + 1)() * 10) + 1));
  assert.equal(faces.size, 10);
  for (const config of [{ ...BALANCE_CONFIG, runsPerCell: 0 }, { ...BALANCE_CONFIG, maxSteps: 0 }, { ...BALANCE_CONFIG, firstSeed: -1 }]) assert.throws(() => runBalanceAudit(config));
});

it("accepts the reviewed baseline and rejects missing, duplicate, incompatible or nonfinite evidence", () => {
  assert.deepEqual(balanceIssues(baseline, baseline), []);
  assert.deepEqual(baseline.config, BALANCE_CONFIG);
  for (const mutate of [
    (r: BalanceReport) => { r.cells.pop(); },
    (r: BalanceReport) => { r.cells[1] = r.cells[0]; },
    (r: BalanceReport) => { r.cells[0].finalCreds = NaN; },
    (r: BalanceReport) => { r.cells[0].checks = -1; },
    (r: BalanceReport) => { r.dice = []; },
    (r: BalanceReport) => { r.checks = {}; },
    (r: BalanceReport) => { r.coverage.scenes = []; },
  ]) { const bad = copy(); mutate(bad); assert.throws(() => balanceIssues(baseline, bad), /Invalid balance report/); }
  const changed = copy(); changed.config = { ...changed.config, firstSeed: 2 };
  assert.match(balanceIssues(baseline, changed).join("\n"), /sampling configuration differs/);
});

it("fails on a seeded progression failure and identifies its build, seed and scene", () => {
  const r = runBalanceAudit({ ...BALANCE_CONFIG, runsPerCell: 1, maxSteps: 1 });
  assert.equal(r.failures.length, 96);
  const issues = balanceIssues(r, r).join("\n");
  assert.match(issues, /campaigns failed/); assert.match(issues, /seed.*1/);
  assert.ok(issues.includes(`"scene":"${r.failures[0].scene}"`));
  assert.match(issues, /incomplete campaign sampling/);
});

it("catches a localized success regression even when global averages scarcely change", () => {
  const r = copy(), c = r.cells[0];
  const loss = Math.ceil(c.checks * .06);
  c.successes -= loss;
  // Keep independent aggregate counts internally consistent.
  let remaining = loss;
  for (const encounter of Object.values(r.checks)) {
    const n = Math.min(encounter.successes, remaining); encounter.successes -= n; remaining -= n;
  }
  assert.equal(remaining, 0);
  assert.match(balanceIssues(r, baseline).join("\n"), new RegExp(`${c.id}: check success worsened`));
});

it("detects money, strain, pacing and coverage regressions without enforcing identical builds", () => {
  const r = copy(), c = r.cells[0];
  c.finalCreds = Math.max(0, c.finalCreds - 26 * c.completed);
  c.finalStrain = Math.min(5 * c.completed, c.finalStrain + c.completed);
  c.zeroCashDecisions = Math.ceil(c.decisions * .5);
  c.highStrainDecisions = Math.ceil(c.decisions * .6);
  c.cashBlockedOptions = Math.ceil(c.visibleOptions * .5);
  c.steps *= 2;
  r.coverage.scenes.pop(); r.coverage.choices.pop();
  const issues = balanceIssues(r, baseline).join("\n");
  for (const text of ["mean final cash", "mean final strain", "zero-cash", "high-strain", "cash-blocked", "mean campaign decisions", "Lost sampled scenes", "Lost sampled choices"]) assert.ok(issues.includes(text), text);
  const summary = balanceSummary(baseline);
  assert.match(summary, /Build disparity flags/); assert.match(summary, /No finale is treated as a win/);
  assert.match(summary, /do not prove a dominant build/);
});

it("catches per-encounter difficulty regressions that other checks could mask", () => {
  const r = copy();
  const [key, encounter] = Object.entries(r.checks).find(([, c]) => c.attempts >= 200 && c.expectedSuccesses / c.attempts > .2)!;
  const loss = encounter.attempts * .06;
  encounter.expectedSuccesses -= loss;
  let remaining = loss;
  for (const c of r.cells) {
    const n = Math.min(c.expectedSuccesses, remaining); c.expectedSuccesses -= n; remaining -= n;
  }
  assert.match(balanceIssues(r, baseline).join("\n"), new RegExp(`${key}: expected check success fell`));
});

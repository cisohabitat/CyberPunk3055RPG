import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { it } from "node:test";
import { ORIGINS } from "./character";
import { campaignEconomyIssues, campaignEconomyReport, economyCampaignCases, playEconomyCampaign } from "./campaign-economy";
import { replayCampaign } from "./story-replay";
import { trainedKitAdvice } from "./loadout";
import { missionSetup } from "./matched-balance";
import type { EconomyReport } from "./campaign-economy";
import type { StatId } from "./types";

const baseline: EconomyReport = JSON.parse(readFileSync(new URL("../qa/balance/campaign-economy.json", import.meta.url), "utf8"));
const spec = { origin: "dustline", stat: "ghost", complication: "debt", goal: "witness", income: "no-sale", spending: "care-first" } as const;

it("plays every goal/build/spending combination reproducibly with natural opening outcomes", () => {
  const a = campaignEconomyReport(2), b = campaignEconomyReport(2);
  assert.deepEqual(a, b); assert.equal(a.rows.length, 432); assert.deepEqual(a.failures, []);
  assert.ok(a.rows.every(row => row.completed === 2 && row.goalMet <= row.eligible));
  assert.equal(economyCampaignCases().length, 432);
  assert.deepEqual(campaignEconomyIssues(a, a), []);
  const rolls = new Set<number>(), successes = new Set<boolean>();
  for (let seed = 1; seed <= 20; seed++) for (const check of playEconomyCampaign(spec, seed).opening) { rolls.add(check.roll); successes.add(check.success); }
  assert.equal(rolls.size, 10); assert.equal(successes.size, 2);
});

it("replays actual directed records of sampled campaigns through every saved check without invented money", () => {
  for (const goal of ["witness", "archive", "delivery"] as const) for (const seed of [1, 4, 13]) {
    const run = playEconomyCampaign({ ...spec, goal }, seed), replayed = replayCampaign(run.replay);
    assert.deepEqual(replayed.state, run.state);
    assert.equal(run.state.creds, Math.max(0, ORIGINS[spec.origin].creds - 40) + run.cashEarned - run.cashSpent);
    assert.ok(run.steps.some(step => step.reload && step.roll !== undefined));
    assert.ok(run.kitUnaffordable); assert.equal(run.kitBought, false);
    assert.ok(run.week); assert.equal(run.state.sceneId, "ending_names");
  }
});

it("pairs opening dice across spending strategies and keeps a failed opening distinct from a blocked game", () => {
  let absent = 0;
  const fragileOpening = { ...spec, origin: "gutterwire", stat: "chrome" } as const;
  for (let seed = 1; seed <= 30; seed++) {
    const a = playEconomyCampaign(fragileOpening, seed), b = playEconomyCampaign({ ...fragileOpening, spending: "kit-first" }, seed);
    assert.deepEqual(a.opening, b.opening);
    if (!a.mission) { absent++; assert.equal(a.goalMet, false); assert.equal(a.state.sceneId, "ending_names"); assert.equal(a.state.flags.memory_prepared, undefined); }
  }
  assert.ok(absent > 0);
  assert.throws(() => playEconomyCampaign(spec, 0), /Invalid campaign seed/);
  assert.throws(() => playEconomyCampaign(spec, 1, 1), /exceeded 1 decisions/);
});

it("rejects incompatible, incomplete, duplicate and invalid economic evidence", () => {
  assert.deepEqual(campaignEconomyIssues(baseline, baseline), []);
  for (const mutate of [
    (r: EconomyReport) => { r.rows.pop(); },
    (r: EconomyReport) => { r.rows[1] = r.rows[0]; },
    (r: EconomyReport) => { r.rows[0].finalCreds = NaN; },
    (r: EconomyReport) => { r.rows[0].eligible = -1; },
    (r: EconomyReport) => { r.rows[0].hourOutcomes = {}; },
    (r: EconomyReport) => { r.config.seeds = 1; },
  ]) { const r = structuredClone(baseline); mutate(r); assert.throws(() => campaignEconomyIssues(baseline, r)); }
});

it("detects localized access, goal, wallet, Strain, privacy, obligation and coverage regressions", () => {
  const r = structuredClone(baseline), row = r.rows[0];
  row.goalMet -= 6; row.finalCreds -= 26 * row.completed; row.finalStrain += row.completed;
  row.exposedWitness = 6; row.openWork = 6; r.coveredScenes.pop();
  const issues = campaignEconomyIssues(r, baseline).join("\n");
  for (const text of ["eligible-goal success", "mean final cash", "mean final Strain", "exposedWitness", "openWork", "Lost goal-policy scene"]) assert.ok(issues.includes(text), text);
  const access = structuredClone(baseline); access.rows[0].eligible -= 6; access.rows[0].goalMet = Math.min(access.rows[0].goalMet, access.rows[0].eligible);
  assert.match(campaignEconomyIssues(access, baseline).join("\n"), /mission access/);
  const failed = structuredClone(baseline); failed.failures.push({ id: row.id, seed: 1, error: "No enabled continuation" });
  assert.match(campaignEconomyIssues(failed, baseline).join("\n"), /campaigns failed/);
});

it("only describes earned training and leaves the character and canonical no-roll methods untouched", () => {
  for (const stat of ["chrome", "nerve", "face", "ghost"] as StatId[]) {
    const state = missionSetup({ origin: "spire", stat, complication: "optic", income: "sale", equipment: false, mission: "witness" }).beforeShopping;
    const before = JSON.stringify(state);
    assert.ok(trainedKitAdvice(state, stat)); assert.equal(JSON.stringify(state), before);
    for (const other of ["chrome", "nerve", "face", "ghost"] as StatId[]) if (other !== stat) assert.equal(trainedKitAdvice(state, other), undefined);
  }
});

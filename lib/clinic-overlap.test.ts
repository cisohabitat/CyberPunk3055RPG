import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { it } from "node:test";
import { clinicOverlapCases, clinicOverlapReport, playClinicOverlap, validateOverlapReport, type OverlapReport } from "./clinic-overlap";
import { clinicWitnessBudget, commitmentActions } from "./commitment-navigation";
import { commitChoice, getScene, presentChoices, stageCheck } from "./engine";
import { replayCampaign } from "./story-replay";
import { nextStep, objectives, unresolvedPromises } from "./objectives";

const spec = { origin: "spire", stat: "face", complication: "debt", goal: "witness", income: "no-sale", spending: "care-first", order: "witness-first", recovery: "late", transport: "volunteer" } as const;
const run = playClinicOverlap(spec, 1);
function before(id: string) {
  const index = run.steps.findIndex(s => s.choiceId === id); assert.ok(index > 0, id);
  return replayCampaign({ ...run.replay, steps: run.steps.slice(0, index), expected: { sceneId: "act2_middle" } }).state;
}

it("covers all paired overlapping-work cells reproducibly and replays saved natural dice", () => {
  const a = clinicOverlapReport(2); assert.deepEqual(a, clinicOverlapReport(2)); validateOverlapReport(a);
  assert.equal(clinicOverlapCases().length, 576); assert.deepEqual(a.failures, []);
  for (const schedule of clinicOverlapCases().filter(s => s.origin === "dustline" && s.stat === "nerve" && s.complication === "debt")) {
    const r = playClinicOverlap(schedule, 3); assert.deepEqual(replayCampaign(r.replay).state, r.state);
  }
  assert.equal(run.state.flags.witness_shift_kept, true); assert.equal(run.state.flags.witness_consent, true);
  assert.equal(run.state.flags.nia_public_consent, undefined); assert.equal(run.state.flags.archive_key_authenticated, undefined);
  const report: OverlapReport = JSON.parse(readFileSync(new URL("../qa/balance/clinic-overlap.json", import.meta.url), "utf8"));
  validateOverlapReport(report);
  assert.equal(report.rows.reduce((n, r) => n + r.openWork, 0), 0);
  // Preserve actual risky outcomes rather than calling every completed campaign a success.
  assert.equal(report.rows.reduce((n, r) => n + r.exposed, 0), 16);
  for (const mutate of [
    (r: OverlapReport) => { r.rows.pop(); }, (r: OverlapReport) => { r.rows[1] = r.rows[0]; },
    (r: OverlapReport) => { r.rows[0].finalCreds = NaN; }, (r: OverlapReport) => { r.rows[0].jointGoal = 26; },
    (r: OverlapReport) => { delete (r.rows[0] as Partial<typeof r.rows[0]>).openWork; },
    (r: OverlapReport) => { r.failures.push({ id: "bad", seed: 1, error: "No continuation" }); },
  ]) { const bad = structuredClone(report); mutate(bad); assert.throws(() => validateOverlapReport(bad)); }
});

it("keeps a safe room, deferred account and owed clinic shift separate through overlapping work", () => {
  const state = before("work-witness-shift"), original = JSON.stringify(state);
  assert.equal(state.flags.witness_safe, true); assert.equal(state.flags.witness_consent, undefined); assert.equal(state.flags.pump_done, true);
  assert.equal(objectives(state).find(r => r.id === "witness")?.status, "Open");
  assert.equal(objectives(state).find(r => r.id === "coolant")?.status, "Complete");
  const actions = commitmentActions(state);
  assert.ok(actions.some(a => a.id === "return-witness")); assert.ok(actions.some(a => a.id === "work-witness-shift" && a.detail.includes("Strain")));
  assert.match(nextStep(state), /return for her review/); assert.equal(JSON.stringify(state), original);
  const shift = presentChoices(state, getScene(state.sceneId)).find(c => c.id === "work-witness-shift")!;
  const kept = commitChoice(state, shift).state;
  assert.equal(kept.flags.witness_consent, undefined); assert.match(nextStep(kept), /return for her review/);
  assert.ok(!commitmentActions(kept).some(a => a.id === "work-witness-shift"));
  assert.ok(unresolvedPromises(kept).some(r => r.id === "witness"));
  const closed = commitChoice(kept, getScene(kept.sceneId).choices.find(c => c.id === "stand")!).state;
  assert.deepEqual(commitmentActions(closed), []);
});

it("derives current care affordability and action costs without revealing hidden or completed work", () => {
  const state = before("help-clinic-pump");
  // In this schedule the room is already safe, so no outstanding-room reservation is invented.
  assert.equal(clinicWitnessBudget(state), undefined);
  const clinicFirst = playClinicOverlap({ ...spec, origin: "dustline", order: "clinic-first" }, 1);
  const i = clinicFirst.steps.findIndex(s => s.choiceId === "help-clinic-pump");
  const initial = replayCampaign({ ...clinicFirst.replay, steps: clinicFirst.steps.slice(0, i), expected: { sceneId: "act2_middle" } }).state;
  assert.match(clinicWitnessBudget(initial)!, /90.*35.*cannot cover both/s);
  const original = JSON.stringify(initial); commitmentActions(initial); clinicWitnessBudget(initial); assert.equal(JSON.stringify(initial), original);
  const rich = { ...initial, creds: 125 }; assert.match(clinicWitnessBudget(rich)!, /covers both/);
  const cap = { ...before("work-witness-shift"), strain: 5 };
  assert.match(commitmentActions(cap).find(a => a.id === "work-witness-shift")!.detail, /Strain unchanged/);
  const methods = { ...initial, sceneId: "act2_pump_methods" };
  const held = stageCheck(methods, "dispatch-pump", 1);
  assert.deepEqual(commitmentActions(held), []); assert.match(nextStep(held), /recorded roll/);
});

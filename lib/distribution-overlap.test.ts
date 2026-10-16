import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { it } from "node:test";
import { distributionCases, distributionReport, playDistribution, validateDistribution, type DistributionReport } from "./distribution-overlap";
import { commitmentActions } from "./commitment-navigation";
import { commitChoice, getScene, sceneText } from "./engine";
import { nextStep, objectives, weekClosingPromises } from "./objectives";
import { promiseStatus } from "./journal";
import { replayCampaign } from "./story-replay";

const spec = { origin: "spire", stat: "face", complication: "debt", goal: "witness", income: "no-sale", spending: "care-first", order: "clinic-first", recovery: "late", transport: "trained", distribution: "carrier", interleave: true } as const;
const run = playDistribution(spec, 1);
function before(id: string, sceneId: string, occurrence = 0) {
  const indices = run.steps.flatMap((s, i) => s.choiceId === id ? [i] : []), i = indices[occurrence]; assert.ok(i > 0, id);
  return replayCampaign({ ...run.replay, steps: run.steps.slice(0, i), expected: { sceneId } }).state;
}

it("plays every distribution/build/order/timing cell reproducibly and restores sampled pending dice", () => {
  const a = distributionReport(2); assert.deepEqual(a, distributionReport(2)); validateDistribution(a); assert.equal(distributionCases().length, 1296);
  for (const distribution of ["standard", "carry", "carrier"] as const) for (const order of ["clinic-first", "witness-first"] as const) {
    const r = playDistribution({ ...spec, distribution, order }, 4); assert.deepEqual(replayCampaign(r.replay).state, r.state);
    assert.equal(r.state.flags.notice_receipt_observed, true); assert.equal(r.state.flags.nia_public_consent, undefined);
  }
  const baseline: DistributionReport = JSON.parse(readFileSync(new URL("../qa/balance/distribution-overlap.json", import.meta.url), "utf8")); validateDistribution(baseline);
  assert.ok(baseline.rows.some(r => r.carrierUnavailable > 0)); assert.ok(baseline.rows.some(r => r.highStrain > 0 && r.broke > 0));
  for (const mutate of [
    (r: DistributionReport) => { r.rows.pop(); }, (r: DistributionReport) => { r.rows[1] = r.rows[0]; },
    (r: DistributionReport) => { r.rows[0].acknowledged = NaN; }, (r: DistributionReport) => { r.rows[0].jointGoal = 21; },
    (r: DistributionReport) => { r.failures.push({ id: "bad", seed: 1, error: "Repeated payment" }); },
  ]) { const r = structuredClone(baseline); mutate(r); assert.throws(() => validateDistribution(r)); }
});

it("names both paused distribution and a deferred witness account, without charging a draft or inventing consent", () => {
  const s = before("help-clinic-notice", "act2_middle", 1), original = JSON.stringify(s);
  assert.equal(s.flags.witness_safe, true); assert.equal(s.flags.witness_deferred, true); assert.equal(s.flags.witness_consent, undefined);
  assert.equal(s.flags.notice_schedule_33, true); assert.equal(s.flags.notice_allocation_committed, undefined);
  assert.match(objectives(s).find(r => r.id === "notice")!.detail, /3 early \/ 3 later.*has not accepted/);
  assert.match(nextStep(s), /Clinic distribution and Nia/);
  assert.ok(weekClosingPromises(s).some(r => r.id === "notice")); assert.ok(weekClosingPromises(s).some(r => r.id === "witness"));
  assert.ok(commitmentActions(s).some(a => a.id === "help-clinic-notice")); assert.ok(commitmentActions(s).some(a => a.id === "return-witness"));
  assert.equal(JSON.stringify(s), original);
  // Choosing an existing channel after a draft must not be called unaccepted.
  for (const channel of ["courier-notice", "post-notice-map"]) {
    let alternative = s;
    for (const id of ["help-clinic-notice", "accept-notice", "plan-notice", channel]) {
      alternative = commitChoice(alternative, getScene(alternative.sceneId).choices.find(c => c.id === id)!).state;
    }
    assert.match(objectives(alternative).find(r => r.id === "notice")!.detail, channel === "courier-notice" ? /Private dispatch was accepted/ : /window were posted/);
    assert.equal(alternative.flags.notice_allocation_committed, undefined);
  }
  const closed = commitChoice(s, getScene(s.sceneId).choices.find(c => c.id === "stand")!).state;
  assert.equal(closed.flags.notice_allocation_committed, undefined); assert.equal(closed.flags.witness_consent, undefined);
  // The actual Wall transition keeps the missing work; no dispatch or recording is invented.
  const back = commitChoice(closed, getScene(closed.sceneId).choices.find(c => c.id === "back-to-board")!).state;
  assert.equal(objectives(back).find(r => r.id === "notice")!.status, "Unresolved");
  assert.match(objectives(back).find(r => r.id === "notice")!.detail, /week ended before dispatch/);
});

it("keeps dispatch, future replies, two observed card receipts and unknown attendance distinct", () => {
  const s = before("stand", "act2_middle");
  assert.equal(s.flags.notice_done, true); assert.equal(s.flags.notice_receipt_observed, undefined);
  assert.deepEqual(weekClosingPromises(s), []); assert.match(nextStep(s), /Ward Nine after the Week/);
  assert.ok(objectives(s).some(r => r.id === "notice-followup" && r.status === "Open"));
  const reply = before("record-private-reply", "act3_notice_visit");
  assert.match(sceneText(getScene(reply.sceneId), reply), /Two sealed cards/);
  assert.ok(commitmentActions(reply).some(a => a.id === "record-private-reply"));
  const acknowledged = commitChoice(reply, getScene(reply.sceneId).choices.find(c => c.id === "record-private-reply")!).state;
  assert.match(objectives(acknowledged).find(r => r.id === "notice")!.detail, /Two card receipts.*all attendance remain unknown/);
  assert.equal(promiseStatus("notice-promise", acknowledged.flags), "Two receipts; attendance unknown");
  assert.equal(acknowledged.flags.notice_attendance_confirmed, undefined); assert.equal(acknowledged.flags.nia_public_consent, undefined);
  assert.ok(!commitmentActions(acknowledged).some(a => a.id === "visit-notice"));
});

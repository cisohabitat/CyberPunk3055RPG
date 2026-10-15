import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { it } from "node:test";
import { commitChoice, getScene, presentChoices, stageCheck } from "./engine";
import { compareMission, matchedMissionReport, missionSetup } from "./matched-balance";
import { parseSave } from "./storage";
import type { GameState, OriginId, StatId } from "./types";

const advance = (state: GameState, id: string, roll?: number) => {
  const choice = presentChoices(state, getScene(state.sceneId)).find(c => c.id === id && c.enabled);
  assert.ok(choice, `${state.sceneId}/${id}`);
  return commitChoice(state, choice, roll === undefined ? undefined : { roll }).state;
};
const scenario = { origin: "spire", stat: "nerve", complication: null, income: "sale", equipment: false, mission: "witness" } as const;

it("reproduces all 384 reviewed matched scenarios with complete weighted die coverage", () => {
  const report = matchedMissionReport();
  const baseline = JSON.parse(readFileSync(new URL("../qa/balance/matched-missions.json", import.meta.url), "utf8"));
  assert.deepEqual(report, baseline);
  assert.equal(report.rows.length, 384); assert.equal(new Set(report.rows.map(r => r.id)).size, 384);
  assert.ok(report.rows.every(r => r.mass === 1 && r.objective >= r.primaryObjective));
  assert.equal(report.rows.filter(r => r.equipment && !r.purchased).length, 26);
});

it("weights die branches rather than leaf counts and separates primary from funded recovery", () => {
  const r = compareMission(scenario);
  // 90% brace × 90% carry = 81%; two disjoint recovery events total 19%.
  assert.equal(r.primaryObjective, .81); assert.equal(r.objective, 1); assert.equal(r.fallback, .19);
  assert.equal(r.cashSpent, 17.1); assert.equal(r.witnessExposed, 0);
  const equipped = compareMission({ ...scenario, equipment: true });
  assert.equal(equipped.primaryObjective, 1); assert.equal(equipped.strainDelta, 0); assert.equal(equipped.cashSpent, 120);
  const chrome = compareMission({ ...scenario, stat: "chrome" });
  assert.equal(chrome.primaryObjective, 1); assert.equal(chrome.strainDelta, 1); assert.equal(chrome.cashSpent, 0);
});

it("keeps source corroboration, authenticated keys and signed extraction separate", () => {
  const chrome = compareMission({ ...scenario, stat: "chrome", mission: "archive" });
  const face = compareMission({ ...scenario, stat: "face", mission: "archive" });
  const ghost = compareMission({ ...scenario, stat: "ghost", mission: "archive", equipment: true });
  assert.equal(chrome.keyAuthenticated, 1); assert.equal(chrome.strainDelta, 1);
  assert.equal(face.objective, 1); assert.equal(face.keyAuthenticated, 0); assert.equal(face.strainDelta, 0);
  assert.equal(face.signedExtraction, 1); assert.equal(face.archiveFlagged, 1);
  assert.equal(ghost.objective, 1); assert.equal(ghost.keyAuthenticated, 0); assert.equal(ghost.signedExtraction, 0); assert.equal(ghost.strainDelta, 0);
});

it("records unaffordable requested kits honestly and uses legally earned no-sale recovery", () => {
  const r = compareMission({ ...scenario, origin: "dustline", complication: "debt", income: "no-sale", equipment: true });
  assert.equal(r.purchased, false); assert.equal(r.kitPrice, 0); assert.equal(r.startingCreds, 90);
  assert.equal(r.objective, 1); assert.ok(r.fallback > 0);
});

it("funds checkpoint recovery across every origin and specialization without inventing consent or erasing the failed roll", () => {
  for (const origin of ["gutterwire", "spire", "dustline"] as OriginId[]) for (const stat of ["chrome", "nerve", "face", "ghost"] as StatId[]) {
    let state = missionSetup({ ...scenario, origin, stat }).state;
    for (const id of ["agree-terms", "use-existing-plan"]) state = advance(state, id);
    state = stageCheck(state, "slip-witness", 1);
    state = parseSave(JSON.stringify(state))!;
    state = advance(state, "slip-witness", 1);
    assert.equal(state.sceneId, "act2_witness_checkpoint");
    const before = parseSave(JSON.stringify(state))!;
    const choice = getScene(before.sceneId).choices.find(c => c.id === "fund-checkpoint-room")!;
    for (const creds of [0, 89]) assert.throws(() => commitChoice({ ...before, creds }, choice));
    for (const flag of ["witness_done", "witness_lost", "witness_checkpoint_funded"]) assert.throws(() => commitChoice({ ...before, flags: { ...before.flags, [flag]: true } }, choice));
    const exact = commitChoice({ ...before, creds: 90 }, choice).state;
    assert.equal(exact.creds, 0);
    state = commitChoice(before, choice).state;
    assert.equal(state.creds, before.creds - 90); assert.equal(state.strain, before.strain);
    assert.deepEqual(state.rolls, before.rolls); assert.equal(state.rolls[0].success, false);
    assert.equal(state.flags.witness_safe, true); assert.equal(state.flags.witness_checkpoint, true);
    for (const flag of ["witness_lost", "witness_consent", "nia_public_consent", "order_verified"]) assert.equal(state.flags[flag], undefined);
    assert.equal(state.sceneId, "act2_witness_arrival");
    assert.deepEqual(parseSave(JSON.stringify(state)), state);
    assert.throws(() => commitChoice(state, choice));
    state = advance(state, "defer-account"); assert.equal(state.sceneId, "act2_middle");
    assert.equal(state.journal.some(entry => entry.id === "nia-account"), false);
  }
});

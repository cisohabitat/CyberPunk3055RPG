import assert from "node:assert/strict";
import { it } from "node:test";
import { createCharacter, commitChoice, getScene, runDelta, stageCheck } from "./engine";
import { choiceReceipt, recentDecisions } from "./play-feedback";
const base = createCharacter({ handle: "Receipt", givenName: "Jo", origin: "gutterwire", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 } });
it("receipts include new same-scene journal records without promoting their claims to facts", () => {
  const state = { ...base, sceneId: "memory_table" };
  const choice = getScene(state.sceneId).choices.find(c => c.id.startsWith("inspect-"))!;
  const next = commitChoice(state, choice).state;
  assert.equal(next.sceneId, state.sceneId);
  assert.deepEqual(choiceReceipt(state, next), ["1 new journal entry. Review in Sheet → Journal."]);
  assert.deepEqual(choiceReceipt(next, next), []);
});
it("receipts use bounded actual outcomes and never infer hidden flags", () => {
  const state = { ...base, sceneId: "lumen_deal", strain: 5 };
  const staged = stageCheck(state, "fake-pact", 1);
  assert.deepEqual(choiceReceipt(state, staged), []);
  const next = commitChoice(staged, getScene(state.sceneId).choices.find(c => c.id === "fake-pact")!, { roll: 1 }).state;
  assert.deepEqual(choiceReceipt(staged, next), runDelta(staged, next));
  assert.deepEqual(choiceReceipt(base, { ...base, flags: { secret: true } }), []);
});
it("return recap preserves three chosen labels in order and tolerates legacy empty logs", () => {
  assert.deepEqual(recentDecisions(base), []);
  assert.deepEqual(recentDecisions({ ...base, log: ["one", "two", "two", "four"] }), ["two", "two", "four"]);
});
it("objective feedback reveals only the current goal when that goal actually changes", () => {
  const state = { ...base, sceneId: "opening_city" };
  const choice = getScene(state.sceneId).choices.find(c => c.next === "opening_self")!;
  const next = commitChoice(state, choice).state;
  assert.ok(choiceReceipt(state, next).some(line => line.startsWith("Objective updated:")));
  assert.ok(!choiceReceipt(state, next).join(" ").includes("coolant"));
});

import assert from "node:assert/strict";
import { it } from "node:test";
import { createCharacter, commitChoice, getScene, presentChoices, sceneText, stageCheck } from "./engine";
import { objectives, nextStep } from "./objectives";
import { exportRun, importRun } from "./vault";
import type { GameState } from "./types";
const base = (): GameState => ({ ...createCharacter({ handle: "Dispatcher", givenName: "Ada", origin: "dustline", bonus: { chrome: 0, nerve: 0, face: 2, ghost: 0 } }), sceneId: "act2_notice_brief", flags: { memory_prepared: true } });
function step(state: GameState, id: string, roll?: number) {
  const choice = getScene(state.sceneId).choices.find((entry) => entry.id === id)!;
  return commitChoice(state, choice, roll === undefined ? undefined : { roll }).state;
}
function prepare() {
  let state = step(base(), "accept-notice");
  for (const id of ["read-notice-slip", "read-notice-map", "read-notice-card", "plan-notice"]) state = step(state, id);
  return state;
}
it("requires all routing sources before methods and does not infer historical proof", () => {
  const state = step(base(), "accept-notice");
  assert.throws(() => step(state, "plan-notice"));
  const publicRun = step(step(prepare(), "post-notice-map"), "record-public-notice");
  assert.equal(publicRun.flags.notice_done, true);
  assert.equal(publicRun.flags.order_verified, undefined);
  assert.equal(publicRun.flags.witness_consent, undefined);
  assert.match(publicRun.journal.find((entry) => entry.id === "notice-receipt")!.text, /without home addresses/);
  assert.match(objectives(publicRun).find((row) => row.id === "notice")!.detail, /unobserved/);
  assert.equal(presentChoices(publicRun, getScene(publicRun.sceneId)).some((choice) => choice.id === "help-clinic-notice"), false);
});
it("retains poor-player recovery after refusal, without retrying or silently spending money", () => {
  const failed = step({ ...prepare(), creds: 0 }, "negotiate-notice", 1);
  assert.equal(failed.sceneId, "act2_notice_recovery");
  assert.throws(() => step(failed, "courier-notice"));
  assert.equal(presentChoices(failed, getScene(failed.sceneId)).some((choice) => choice.id === "negotiate-notice"), false);
  const recovered = step(step(failed, "post-notice-map"), "record-public-notice");
  assert.equal(recovered.creds, 0); assert.equal(recovered.flags.notice_desk_refused, true);
});
it("charges the courier once and preserves a carried failure across a saved roll", () => {
  const paid = step(step({ ...prepare(), creds: 20 }, "courier-notice"), "record-private-notice");
  assert.equal(paid.creds, 0); assert.equal(paid.flags.notice_private_confirmed, true);
  assert.equal(paid.flags.notice_carried, undefined);
  let state = { ...prepare(), creds: 0 };
  state = importRun(exportRun(stageCheck(state, "carry-notice", 1)));
  assert.match(nextStep(state), /recorded roll/);
  assert.throws(() => step(state, "carry-notice", 10), /recorded roll/);
  state = step(state, "carry-notice", 1);
  assert.equal(state.flags.notice_delivery_delayed, true);
  assert.match(sceneText(getScene(state.sceneId), state), /Nobody received/);
  state = step(state, "leave-notice-recovery");
  assert.equal(objectives(state).find((row) => row.id === "notice")!.status, "Unresolved");
});

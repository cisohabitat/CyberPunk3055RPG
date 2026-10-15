import assert from "node:assert/strict";
import { it } from "node:test";
import { commitChoice, createCharacter, getScene, presentChoices, effectPreview } from "./engine";
import { parseSave } from "./storage";
import { FIELD_KITS, fieldKitBudget } from "./loadout";
import type { GameState, OriginId } from "./types";

const advance = (state: GameState, id: string, roll?: number) => {
  const choice = presentChoices(state, getScene(state.sceneId)).find(choice => choice.id === id && choice.enabled);
  assert.ok(choice, `${state.sceneId}/${id}`);
  return commitChoice(state, choice, roll === undefined ? undefined : { roll }).state;
};

it("earned Steady hands and purchased harness avoid added strain without healing or supplying recording consent", () => {
  for (const origin of ["gutterwire", "spire", "dustline"] as OriginId[]) {
    let state = createCharacter({ handle: "Balance review", givenName: "Jo", origin, bonus: { chrome: 0, nerve: 2, face: 0, ghost: 0 } });
    state = advance({ ...state, sceneId: "act2_training" }, "learn-nerve");
    state = advance({ ...state, sceneId: "act2_workshop", creds: 150 }, "buy-chair-harness");
    assert.equal(state.creds, 30);
    assert.throws(() => advance({ ...state, sceneId: "act2_workshop" }, "buy-chair-harness"));
    state = advance({ ...state, sceneId: "act2_witness_plan", strain: 3 }, "steady-chair", 8);
    state = advance(state, "compare-witness-support");
    const saved = parseSave(JSON.stringify(state))!;
    const choice = presentChoices(saved, getScene(saved.sceneId)).find(choice => choice.id === "harness-chair-transfer")!;
    assert.ok(!effectPreview(saved, choice).some(line => /strain/i.test(line)));
    const moved = advance(saved, choice.id);
    assert.equal(moved.strain, 3); assert.equal(moved.creds, 30);
    assert.ok(moved.items.includes("chair-harness")); assert.ok(moved.flags.witness_safe);
    assert.equal(moved.flags.witness_consent, undefined); assert.equal(moved.flags.nia_public_consent, undefined);
    assert.equal(moved.flags.order_verified, undefined);
  }
});

it("training alone or a failed chair preparation cannot invent the equipped transfer", () => {
  const state = createCharacter({ handle: "Gate review", givenName: "Jo", origin: "spire", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 } });
  const trained = advance({ ...state, sceneId: "act2_training" }, "learn-nerve");
  assert.throws(() => advance({ ...trained, sceneId: "act2_witness_support", flags: { ...trained.flags, witness_braced: true } }, "harness-chair-transfer"));
  const failed = advance({ ...trained, sceneId: "act2_witness_plan", items: ["chair-harness"] }, "steady-chair", 1);
  assert.equal(failed.flags.witness_braced, undefined);
  assert.throws(() => advance({ ...failed, sceneId: "act2_witness_support" }, "harness-chair-transfer"));
});

it("equipment cash comparisons include combined care and courier costs without spending or promising anything", () => {
  for (const kit of FIELD_KITS) {
    assert.equal(fieldKitBudget(kit.price - 1, kit.price).affordable, false);
    assert.equal(fieldKitBudget(kit.price, kit.price).remaining, 0);
    assert.equal(fieldKitBudget(kit.price + 134, kit.price).careGap, 1);
    assert.equal(fieldKitBudget(kit.price + 135, kit.price).careGap, 0);
    assert.equal(fieldKitBudget(kit.price + 135, kit.price).careAndCourierGap, 15);
    assert.equal(fieldKitBudget(kit.price + 150, kit.price).careAndCourierGap, 0);
  }
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { commitChoice, createCharacter, getScene, presentChoices, sceneText } from "./engine";
import { parseSave } from "./storage";
import { nightRetell } from "./story/retell";
import type { GameState } from "./types";

const runner = (origin: GameState["origin"] = "spire") => createCharacter({ handle: "Clarity", givenName: "Ada", origin, complication: "on-file", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 }, startWithPrologue: true });
function step(state: GameState, id: string, roll?: number) {
  const choice = presentChoices(state, getScene(state.sceneId)).find(choice => choice.id === id && choice.enabled);
  assert.ok(choice, `${state.sceneId}:${id}`);
  return commitChoice(state, choice, choice.check ? { roll: roll! } : undefined).state;
}

describe("opening and consequence clarity", () => {
  for (const [origin, context] of [["gutterwire", /dry place to sleep/], ["spire", /build a life without it/], ["dustline", /next crossing/]] as const) it(`keeps ${origin} context after skipping without choosing a motive or accepting work`, () => {
    const initial = runner(origin), skipped = step(initial, "skip-opening"), restored = parseSave(JSON.stringify(skipped))!;
    assert.deepEqual(restored, skipped);
    const text = sceneText(getScene(restored.sceneId), restored);
    assert.match(text, context); assert.match(text, /Mara Voss.*Glass Chapel.*dawn/s);
    assert.doesNotMatch(text, /Ward Nine|coolant dump|You came (for|because|to buy)/);
    for (const flag of ["opening_survival", "opening_identity", "opening_exit", "hired"]) assert.equal(restored.flags[flag], undefined);
    for (const key of ["creds", "strain", "stats", "factions", "items", "journal", "rolls"] as const) assert.deepEqual(restored[key], initial[key]);
    const back = step(step(restored, "ask-owner"), "back-to-offer");
    assert.doesNotMatch(sceneText(getScene(back.sceneId), back), context);
    assert.equal(step(back, "accept").creds, initial.creds + 50);
  });
  it("does not insert skipped context or a chosen motive into a legacy job checkpoint", () => {
    const state = { ...runner(), sceneId: "stall", flags: {} };
    assert.doesNotMatch(sceneText(getScene("stall"), state), /build a life without it|You came (for|because|to buy)/);
    assert.equal(state.flags.opening_skipped, undefined);
  });
  for (const [sceneId, choice, roll, expected] of [
    ["act2_middle", "deal", undefined, /eighty-creds.*silence/],
    ["act2_folio", "cheap-deal", undefined, /forty-creds.*silence/],
    ["act2_heat", "take-leftover", undefined, /forty-creds.*silence/],
    ["act2_middle", "stand", undefined, /Mara's name and Ward Nine.*wards began repeating/],
    ["act2_folio", "stand-folio", 1, /Helion filed.*failed attempt/],
  ] as const) it(`carries ${choice} into the chapter card and all four finale recaps without inventing evidence`, () => {
    const initial = { ...runner(), sceneId, flags: sceneId === "act2_heat" ? { kerr_sold_you: true } : {} };
    const outcome = step(initial, choice, roll), card = parseSave(JSON.stringify(step(outcome, "back-to-board")))!;
    assert.match(sceneText(getScene(card.sceneId), card), expected);
    assert.doesNotMatch(sceneText(getScene(card.sceneId), card), /authenticated|recording|consent|safe room/);
    for (const finale of ["ending_names", "ending_quiet", "ending_witness", "ending_listed"]) assert.match(nightRetell({ ...card, sceneId: finale })[1], expected);
    for (const flag of ["archive_key_authenticated", "order_verified", "witness_safe", "nia_public_consent", "testimony_published"]) assert.equal(card.flags[flag], undefined);
    assert.deepEqual(card.journal, initial.journal);
  });
  it("leaves an unresolved legacy Week unresolved and keeps an unfinished return open", () => {
    const initial = runner();
    assert.match(sceneText(getScene("card_wall"), { ...initial, sceneId: "card_wall" }), /remains unresolved/);
    assert.doesNotMatch(nightRetell(initial)[1], /You spoke|You took/);
    const returned = { ...initial, sceneId: "act2_middle", flags: { witness_done: true, witness_safe: true, witness_account_deferred: true } };
    assert.match(sceneText(getScene(returned.sceneId), returned), /unfinished commitments stay open/);
    assert.doesNotMatch(sceneText(getScene(returned.sceneId), returned), /approved recording|permission|completed/);
    assert.equal(returned.journal.some(entry => entry.id === "nia-account"), false);
  });
});

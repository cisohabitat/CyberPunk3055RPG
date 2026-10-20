import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { createCharacter, commitChoice, getScene, presentChoices, sceneText } from "./engine";
import { currentGoal } from "./story/goal";
import { visibleCampaignDialogue } from "./campaign-dialogue";
import { campaignReturnBeat } from "./story/campaign-beats";
import type { ReplaySpec } from "./story-replay";
import type { GameState } from "./types";

function states(file: string) {
  const route = JSON.parse(readFileSync(new URL(`../qa/routes/${file}.json`, import.meta.url), "utf8")) as ReplaySpec;
  let state = createCharacter(route.character);
  const result = [state];
  for (const step of route.steps) {
    const choice = presentChoices(state, getScene(state.sceneId)).find(choice => choice.id === step.choiceId && choice.enabled)!;
    assert.ok(choice);
    state = commitChoice(state, choice, choice.check ? { roll: step.roll! } : undefined).state;
    result.push(state);
  }
  return result;
}
const text = (state: GameState) => sceneText(getScene(state.sceneId), state);

describe("campaign reading continuity", () => {
  it("introduces Ren once while legally pausing both stages of Kerr's plan", () => {
    const canal = states("kerr-chrome").filter(state => state.sceneId === "act2_middle");
    assert.equal(canal.filter(state => text(state).includes("Junie Calder worked beside Ivo Pell")).length, 1);
    const entry = canal.find(state => state.log.at(-1) === "Pause with this entry saved.")!;
    const both = canal.find(state => state.log.at(-1) === "Pause with both crossings saved.")!;
    assert.ok(entry); assert.ok(both);
    assert.equal(Boolean(entry.flags.kerr_route_started), false);
    assert.equal(Boolean(both.flags.kerr_route_started), false);
    assert.match(text(entry), /entry route is saved/);
    assert.match(text(both), /Both crossings are on the plan/);
    assert.equal(campaignReturnBeat({ ...entry, flags: {} }), null);
    assert.equal(campaignReturnBeat({ ...both, flags: { kerr_route_promised: true } }), null);
    assert.deepEqual(visibleCampaignDialogue("act2_middle", undefined, text(entry)), []);
  });

  it("retains the first archive comparison but avoids repeating it during catalog actions", () => {
    const comparisons = states("catalog-reader").filter(state => state.sceneId === "act2_archive_compare");
    const first = comparisons[0];
    assert.match(text(first), /Mara's authorization precedes/);
    for (const state of comparisons.filter(state => state.flags.archive_catalog_open)) {
      assert.ok(text(state).split(/\s+/).length < text(first).split(/\s+/).length / 2);
      assert.match(text(state), /none is a retrieved ledger or an authenticated issuing key/);
      assert.equal(Boolean(state.flags.archive_done), false);
      assert.deepEqual(visibleCampaignDialogue(state.sceneId, "Edda", text(state)), []);
    }
    const closed = comparisons.find(state => !state.flags.archive_catalog_open && state.flags.archive_catalog_read_revision)!;
    assert.match(text(closed), /descriptions and query history kept/);
  });

  it("changes the written archive objective only as the actual investigation progresses", () => {
    const comparisons = states("catalog-reader").filter(state => state.sceneId === "act2_archive_compare");
    assert.match(currentGoal(comparisons[0]), /choose a retrieval method/);
    const open = comparisons.find(state => state.flags.archive_catalog_open && !state.flags.archive_catalog_located)!;
    assert.match(currentGoal(open), /Submitting a locator leaves a trace/);
    const located = comparisons.find(state => state.flags.archive_catalog_located)!;
    assert.match(currentGoal(located), /lookup supplied no record/);
    assert.match(currentGoal({ ...located, sceneId: "act2_archive_custody" }), /employer trace/);
  });

  it("never suggests a public quotation request when Nia's consent path is unavailable", () => {
    const base = { ...createCharacter({ handle: "Review", givenName: "Jo", origin: "gutterwire", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 } }), sceneId: "act3_testimony_consent" };
    const allowed = { ...base, journal: [{ id: "nia-account", text: "Approved account" }], flags: { witness_safe: true, witness_consent: true } };
    assert.match(currentGoal(allowed), /Ask Nia through the relay/);
    for (const state of [base, { ...allowed, journal: [] }, { ...allowed, flags: { ...allowed.flags, witness_lost: true } }, { ...allowed, flags: { ...allowed.flags, nia_contact_paused: true } }, { ...allowed, flags: { witness_safe: true } }]) {
      assert.match(currentGoal(state), /Keep Nia's words out/);
      assert.equal(presentChoices(state, getScene(state.sceneId)).some(choice => choice.id === "ask-public-permission"), false);
    }
  });
});

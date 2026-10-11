import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { commitChoice, createCharacter, getScene, presentChoices, previewCheck, sceneText, stageCheck } from "./engine";
import { aftermath } from "./evidence";
import { parseSave } from "./storage";
import { testimonyPacket } from "./testimony";
import type { GameState } from "./types";

function runner(): GameState {
  return createCharacter({ handle: "Continuity", givenName: "Ada", origin: "spire", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 }, complication: "optic" });
}
function step(state: GameState, id: string, roll?: number): GameState {
  const choice = presentChoices(state, getScene(state.sceneId)).find((entry) => entry.id === id);
  assert.ok(choice?.enabled, `${state.sceneId}:${id}`);
  return commitChoice(state, choice, roll === undefined ? undefined : { roll }).state;
}
function restore(state: GameState): GameState {
  const restored = parseSave(JSON.stringify(state));
  assert.ok(restored);
  return restored;
}
function hearing(account = false): GameState {
  const state: GameState = { ...runner(), sceneId: "act3_arrival", flags: { memory_prepared: true, order_verified: true, archive_key_authenticated: true } };
  if (account) {
    Object.assign(state.flags, { witness_safe: true, witness_consent: true });
    state.journal.push({ id: "nia-account", text: "Nia approved a private account.", kind: "fact" });
  }
  return step(step(state, "prepare-public-account"), "scope-corroborated");
}

describe("state continuity after observed play", () => {
  it("retains a missed plinth roll but describes the later successful copy through saved checks and payout", () => {
    let state: GameState = { ...runner(), sceneId: "vault_quiet", flags: { quiet: true, pact_copy: true }, items: ["spoof-chip"] };
    assert.equal(previewCheck(state, getScene(state.sceneId).choices.find((entry) => entry.id === "copy")!.check!).bonus, 8);
    state = restore(stageCheck(state, "copy", 1));
    state = step(state, "copy", 1);
    assert.equal(state.flags.copy_failed, true);
    assert.equal(state.flags.copied, undefined);
    assert.deepEqual(state.rolls.at(-1), { label: "Copy the hour", roll: 1, total: 9, dc: 10, success: false });
    state = step(state, "heard"); state = step(state, "why-signed");
    assert.equal(state.sceneId, "kerr");
    assert.equal(previewCheck(state, getScene(state.sceneId).choices.find((entry) => entry.id === "copy-hot")!.check!).bonus, 8);
    const strain = state.strain;
    state = restore(stageCheck(state, "copy-hot", 4));
    state = step(state, "copy-hot", 4); state = restore(state);
    assert.equal(state.sceneId, "after_kerr");
    assert.equal(state.flags.copy_failed, true);
    assert.equal(state.flags.copied, true);
    assert.equal(state.strain, strain);
    assert.deepEqual(state.rolls[0], { label: "Copy under Kerr", roll: 4, total: 12, dc: 10, success: true });
    assert.deepEqual(state.rolls[1], { label: "Copy the hour", roll: 1, total: 9, dc: 10, success: false });
    const text = sceneText(getScene(state.sceneId), state);
    assert.match(text, /Two copies of Mara's hour exist/);
    assert.doesNotMatch(text, /copy collapsed|Only the original|copying window is closed/);
    const credits = state.creds;
    state = step(state, "both");
    assert.equal(state.sceneId, "ending_both");
    assert.equal(state.creds, credits + 200);
    assert.equal(state.items.includes("shard"), false);
    assert.equal(state.flags.copy_failed, true);
    assert.equal(state.flags.copied, true);
    assert.equal(state.rolls.length, 2);
  });

  for (const stalePermission of [false, true]) it(`describes an absent recording throughout filing, including stale permission ${stalePermission}`, () => {
    let state = hearing();
    state.flags.nia_public_consent = stalePermission;
    assert.match(testimonyPacket(state)[2].text, /No approved account/);
    assert.equal(presentChoices(state, getScene(state.sceneId)).some((entry) => entry.id === "ask-public-permission"), false);
    state = step(state, "keep-recording-private"); state = step(state, "answer-authenticated-key");
    assert.match(sceneText(getScene(state.sceneId), state), /No approved recording from Nia was obtained/);
    state = step(restore(state), "file-public-account");
    const journal = state.journal.find((entry) => entry.id === "wall-account")!.text;
    const ending = aftermath(state).find((row) => row.title === "The public hearing")!.text;
    for (const text of [journal, ending]) {
      assert.match(text, /No approved recording from Nia was obtained/);
      assert.doesNotMatch(text, /private recording|Nia authorized/);
    }
    assert.equal(state.journal.some((entry) => entry.id === "nia-account"), false);
    assert.equal(state.flags.nia_public_consent, stalePermission);
    assert.equal(state.flags.archive_key_authenticated, true);
  });

  it("keeps a real approved recording private when the runner declines public quotation", () => {
    let state = step(hearing(true), "keep-recording-private");
    state = step(state, "answer-authenticated-key");
    assert.match(sceneText(getScene(state.sceneId), state), /recording remains private/);
    state = step(restore(state), "file-public-account");
    assert.match(state.journal.find((entry) => entry.id === "wall-account")!.text, /private recording was not quoted/);
    assert.match(aftermath(state).find((row) => row.title === "The public hearing")!.text, /private recording was not quoted/);
    assert.equal(state.flags.nia_public_consent, undefined);
    assert.equal(state.flags.witness_safe, true);
    assert.equal(state.journal.some((entry) => entry.id === "nia-account"), true);
  });

  it("withdraws an absent-recording draft without implying a private recording exists", () => {
    let state = step(hearing(), "keep-recording-private");
    state = step(state, "answer-authenticated-key"); state = step(state, "withdraw-public-account");
    assert.match(aftermath(state).find((row) => row.title === "The public hearing")!.text, /no approved recording from Nia was obtained/);
    assert.match(state.journal.find((entry) => entry.id === "wall-account")!.text, /no approved recording from Nia was obtained/);
    assert.equal(state.flags.testimony_published, undefined);
    assert.equal(state.journal.some((entry) => entry.id === "nia-account"), false);
  });

  for (const custody of ["memory_redacted", "memory_witness"]) it(`offers transfer terms without inventing an earlier promise for ${custody}`, () => {
    const state = { ...runner(), sceneId: "act2_middle", flags: { [custody]: true } };
    const choice = presentChoices(state, getScene(state.sceneId)).find((entry) => entry.id === "protect-witness")!;
    assert.equal(choice.enabled, true);
    assert.match(choice.label, /Arrange Nia Pell's transfer under her terms/);
    assert.doesNotMatch(choice.label, /Finish the promise/);
    const next = step(state, "protect-witness");
    assert.equal(next.sceneId, "act2_witness_brief");
    assert.equal(next.flags.witness_safe, undefined);
    assert.equal(next.flags.witness_consent, undefined);
    assert.equal(next.flags.nia_public_consent, undefined);
    assert.equal(next.journal.some((entry) => entry.id === "nia-account"), false);
    assert.equal(next.creds, state.creds);
    assert.equal(next.strain, state.strain);
  });
});

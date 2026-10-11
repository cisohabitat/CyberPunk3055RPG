import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyEffect, commitChoice, createCharacter, effectPreview, getScene, presentChoices, sceneText } from "./engine";
import { currentGoal } from "./story/goal";
import { testimonyPacket } from "./testimony";
import { exportRun, importRun } from "./vault";
import type { GameState } from "./types";

const base = (): GameState => createCharacter({ handle: "Validation", givenName: "Ada", origin: "spire", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 } });
function step(s: GameState, id: string) {
  const choice = presentChoices(s, getScene(s.sceneId)).find(c => c.id === id && c.enabled);
  assert.ok(choice, `${s.sceneId}:${id}`);
  return commitChoice(s, choice).state;
}
const account = (): GameState => ({ ...base(), sceneId: "act3_testimony_consent", flags: { witness_safe: true, witness_consent: true, order_verified: true, testimony_source: true }, journal: [{ id: "nia-account", text: "Approved private recording.", kind: "fact" }] });

describe("player validation feedback", () => {
  for (const wards of [-3, -2, 0, 4, 5]) it(`previews actual standing at ${wards} without changing state`, () => {
    const s = { ...base(), sceneId: "act3_arrival", factions: { ...base().factions, wards, helion: 5 }, flags: { on_file: true, act2_deal: true }, journal: [{ id: "ward-nine", text: "The recorded names.", kind: "fact" as const }] };
    const before = JSON.stringify(s);
    const give = getScene(s.sceneId).choices.find(c => c.id === "let-ives")!;
    const read = getScene(s.sceneId).choices.find(c => c.id === "read-names")!;
    for (const c of [give, read]) {
      const next = commitChoice(s, c).state;
      const delta = next.factions.wards - wards;
      assert.ok(effectPreview(s, c).includes(delta ? `The wards ${delta > 0 ? "+" : ""}${delta}` : "The wards unchanged (at limit)"));
    }
    assert.ok(effectPreview(s, give).includes("Helion unchanged (at limit)"));
    assert.equal(JSON.stringify(s), before);
  });
  it("previews bounded strain on the actual staffed exit", () => {
    const c = getScene("chapel_window_exit").choices.find(c => c.id === "window-staffed-exit")!;
    for (const strain of [0, 4, 5]) {
      const s = { ...base(), sceneId: "chapel_window_exit", strain, flags: { chapel_window_entered: true, chapel_window_0: true } };
      const next = commitChoice(s, c).state;
      assert.deepEqual(effectPreview(s, c), [next.strain === strain ? "Strain unchanged (at limit)" : `Strain +${next.strain - strain}`]);
    }
  });
  it("evaluates a dynamic effect once and previews bounded credit loss", () => {
    const s = { ...base(), creds: 3, strain: 1 }; let calls = 0;
    const effects = () => { calls++; return { creds: -10, strain: -3 }; };
    assert.deepEqual(effectPreview(s, { id: "cost", label: "Cost", next: "stall", effects }), ["Strain -1", "-3 cr"]);
    assert.equal(calls, 1); assert.equal(s.creds, 3); assert.equal(s.strain, 1);
    assert.equal(applyEffect(s, effects).creds, 0);
    assert.deepEqual(effectPreview({ ...s, creds: 0, strain: 0 }, { id: "cost", label: "Cost", next: "stall", effects }), ["Strain unchanged (at limit)", "Credits unchanged (at zero)"]);
  });
  it("keeps useful window advice at three and one, and gives viable zero routes after restoration", () => {
    for (const count of [3, 1, 0]) for (const sceneId of ["chapel_window_plan", "chapel_window_exit"]) {
      const s = importRun(exportRun({ ...base(), sceneId, flags: { [`chapel_window_${count}`]: true } }));
      assert.match(currentGoal(s), new RegExp(`${count} opportunit`));
      if (count) assert.match(currentGoal(s), /Save one/);
      else {
        assert.doesNotMatch(currentGoal(s), /Save one|quiet exit/);
        assert.match(currentGoal(s), sceneId.endsWith("exit") ? /staffed stair/ : /ordinary doors/);
      }
    }
  });
});

describe("paused contact at the hearing", () => {
  for (const finish of ["file-public-account", "withdraw-public-account"]) it(`respects pause through ${finish} and reload without revoking the private recording`, () => {
    let s = step({ ...account(), sceneId: "act3_nia_contact" }, "give-nia-space");
    s = importRun(exportRun({ ...s, sceneId: "act3_testimony_consent" }));
    assert.throws(() => step(s, "ask-public-permission"));
    assert.match(sceneText(getScene(s.sceneId), s), /pause questions/);
    assert.match(testimonyPacket(s)[2].text, /Contact is paused/);
    s = step(s, "keep-recording-private"); s = step(s, "answer-corroboration"); s = step(s, finish);
    s = importRun(exportRun(s));
    assert.equal(s.flags.nia_contact_paused, true); assert.equal(s.flags.witness_consent, true);
    assert.equal(s.flags.nia_public_consent, undefined);
    assert.match(s.journal.find(j => j.id === "nia-account")!.text, /Approved private/);
    assert.equal(s.flags.testimony_published, finish === "file-public-account" ? true : undefined);
  });
  it("keeps relay permission distinct from quotation consent", () => {
    let s = step({ ...account(), flags: { ...account().flags, nia_contact_relay: true } }, "ask-public-permission");
    assert.equal(s.flags.nia_public_consent, undefined);
    s = step(s, "decline-public-quote"); s = step(s, "answer-corroboration"); s = step(s, "file-public-account");
    assert.equal(s.flags.nia_public_consent, undefined); assert.match(s.journal.find(j => j.id === "wall-account")!.text, /not quoted publicly/);
  });
  it("allows an old save already at Nia's explicit reply to continue without reopening contact", () => {
    let s = importRun(exportRun({ ...account(), sceneId: "act3_testimony_nia", flags: { ...account().flags, nia_contact_paused: true } }));
    assert.match(sceneText(getScene(s.sceneId), s), /doesn't reopen contact/);
    s = step(s, "accept-public-permission"); s = step(s, "answer-corroboration"); s = step(s, "file-public-account");
    assert.equal(s.flags.nia_public_consent, true); assert.equal(s.flags.nia_contact_paused, true);
    assert.match(testimonyPacket(s)[2].text, /authorized/);
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { commitChoice, createCharacter, getScene, presentChoices, previewCheck, sceneText } from "./engine";
import { aftermath, FRAGMENTS } from "./evidence";
import { objectives } from "./objectives";
import { exportRun, importRun } from "./vault";
import type { GameState, StatId } from "./types";

const base = (): GameState => createCharacter({ handle: "Rex", givenName: "Ada", origin: "dustline", bonus: { chrome: 0, nerve: 0, face: 2, ghost: 0 } });
function step(state: GameState, id: string, roll?: number) {
  const choice = presentChoices(state, getScene(state.sceneId)).find((entry) => entry.id === id);
  assert.ok(choice?.enabled, `${state.sceneId}:${id}`);
  return commitChoice(state, choice, roll === undefined ? undefined : { roll }).state;
}
function inspect() {
  let state = { ...base(), sceneId: "memory_table" };
  for (const fragment of FRAGMENTS) state = step(state, `inspect-${fragment.id}`);
  return state;
}

describe("playable interpretation and public claims", () => {
  it("requires interpretation and a packet label before disposition, including a restored old bench save", () => {
    let state = importRun(exportRun(inspect()));
    assert.equal(presentChoices(state, getScene(state.sceneId)).some((choice) => choice.id.startsWith("seal-")), false);
    assert.throws(() => step(state, "seal-full"));
    state = step(state, "reconstruct"); state = step(state, "separate-decisions"); state = step(state, "label-unverified"); state = step(state, "seal-full");
    assert.equal(state.flags.memory_intact, true);
    assert.equal(state.flags.order_verified, undefined);
  });
  it("answers both misleading interpretations without erasing responsibility or awarding verification", () => {
    for (const theory of ["clear-mara", "ignore-order"]) {
      let state = step(inspect(), "reconstruct"); state = step(state, theory);
      assert.equal(state.sceneId, "memory_challenge");
      assert.match(sceneText(getScene(state.sceneId), state), theory === "clear-mara" ? /does not remove her authorization/ : /leaves the workers' last chance unexplained/);
      state = step(state, "keep-both-decisions"); state = step(state, "name-tower");
      assert.equal(state.flags.order_verified, undefined); assert.equal(state.journal.find((entry) => entry.id === "public-packet")?.kind, "claim");
      state = { ...state, sceneId: "act2_middle" };
      state = step(state, "hear-response"); assert.throws(() => step(state, "answer-with-source"));
      state = step(state, "correct-public-claim");
      assert.equal(state.flags.order_verified, undefined);
      assert.equal(presentChoices(state, getScene(state.sceneId)).some((choice) => choice.id === "hear-response"), false);
      assert.match(aftermath(state).find((row) => row.title === "The public packet")!.text, /still unverified/);
    }
  });
  it("allows a verified source to answer a challenge and blocks unverified replies", () => {
    let state = { ...base(), sceneId: "act2_public_response", flags: { memory_public_claim: true, order_verified: true } };
    assert.equal(presentChoices(state, getScene(state.sceneId)).some((choice) => choice.id === "repeat-public-claim"), false);
    state = step(state, "answer-with-source");
    assert.match(aftermath(state).find((row) => row.title === "The public packet")!.text, /independent source/);
  });
  it("cannot relabel an unverified accusation without correcting it", () => {
    const state = { ...base(), sceneId: "act2_public_response", flags: { memory_public_claim: true } };
    assert.throws(() => step(state, "hold-public-account"));
    const bounded = { ...state, flags: {} };
    assert.equal(step(bounded, "hold-public-account").flags.memory_response_done, true);
  });
  it("does not invent a witness-protection promise for an archive-only return", () => {
    const state = { ...base(), sceneId: "act3_neighborhood", flags: { memory_intact: true, memory_prepared: true } };
    const text = sceneText(getScene(state.sceneId), state);
    assert.match(text, /promise concerned the archive/); assert.doesNotMatch(text, /protected roster/);
    assert.equal(presentChoices(state, getScene(state.sceneId)).some((choice) => choice.id === "visit-nia"), false);
  });
});

describe("prepared witness missions and consent", () => {
  it("separates agreeing terms, preparation, safety, review, and attached testimony across a reload", () => {
    let state = { ...base(), creds: 150, sceneId: "act2_middle", flags: { memory_witness: true } };
    state = step(state, "protect-witness"); assert.equal(state.sceneId, "act2_witness_brief");
    state = step(state, "agree-terms"); state = step(state, "use-existing-plan");
    const poor = { ...state, creds: 89 }; assert.throws(() => step(poor, "pay-room"));
    const before = state.creds; state = step(state, "pay-room"); assert.equal(state.creds, before - 90);
    assert.equal(state.sceneId, "act2_witness_arrival"); assert.equal(objectives(state)[0].status, "Open");
    state = step(state, "defer-account"); state = importRun(exportRun(state));
    assert.equal(state.flags.witness_safe, true); assert.equal(state.flags.order_verified, undefined);
    state = step(state, "return-witness"); state = step(state, "review-account"); state = step(state, "file-account");
    assert.equal(state.flags.witness_deferred, undefined); assert.equal(state.flags.witness_consent, true);
    assert.equal(objectives(state)[0].status, "Complete");
  });
  it("gates four different trained methods on the matching preparation", () => {
    const methods: [StatId, string, string][] = [["chrome", "witness_scanner", "chrome-transfer"], ["face", "witness_escort", "face-transfer"], ["ghost", "witness_scouted", "ghost-transfer"], ["nerve", "witness_braced", "nerve-transfer"]];
    for (const [stat, prep, method] of methods) {
      const state = { ...base(), sceneId: "act2_witness_door", flags: { witness_briefed: true, [`perk_${stat}`]: true }, factions: { ...base().factions, lumen: 2 } };
      assert.throws(() => step(state, method));
      const moved = step({ ...state, flags: { ...state.flags, [prep]: true } }, method, stat === "nerve" ? 10 : undefined);
      assert.equal(moved.sceneId, "act2_witness_arrival"); assert.equal(moved.flags.witness_safe, true);
      assert.equal(moved.flags.order_verified, undefined); assert.equal(moved.flags[`witness_method_${stat}`], true);
    }
  });
  it("makes successful scouting and a detected query change later checks in opposite directions", () => {
    const state = { ...base(), sceneId: "act2_witness_door" };
    const check = getScene(state.sceneId).choices.find((choice) => choice.id === "slip-witness")!.check!;
    const normal = previewCheck(state, check).bonus;
    assert.equal(previewCheck({ ...state, flags: { witness_scouted: true } }, check).bonus, normal + 2);
    assert.equal(previewCheck({ ...state, flags: { witness_alert: true } }, check).bonus, normal - 1);
  });
  it("repairs a current location without pretending the earlier privacy breach vanished", () => {
    let state = { ...base(), creds: 100, sceneId: "act2_middle", flags: { memory_witness: true, witness_lost: true, witness_done: true, order_verified: true }, journal: [{ id: "nia-account", text: "Nia's authorized account.", kind: "fact" as const }] };
    state = step(state, "repair-location"); state = step(state, "fund-second-room");
    assert.equal(state.flags.witness_lost, true); assert.equal(state.flags.witness_safe, undefined);
    assert.equal(objectives(state)[0].status, "Compromised"); assert.match(objectives(state)[0].detail, /first location was exposed/);
    assert.match(aftermath(state).find((row) => row.title === "Nia Pell")!.text, /first location remains/);
    assert.equal(presentChoices(state, getScene(state.sceneId)).some((choice) => choice.id === "repair-location"), false);
    const returned = { ...state, sceneId: "act3_witness_visit" };
    assert.match(sceneText(getScene(returned.sceneId), returned), /first one still gets calls/);
  });
  it("keeps an in-flight legacy transfer usable without a new mandatory brief", () => {
    let state = importRun(exportRun({ ...base(), sceneId: "act2_witness_door", flags: { memory_witness: true }, items: ["burner-route"] }));
    state = step(state, "use-freight"); assert.equal(state.sceneId, "act2_witness_safe"); state = step(state, "file-account");
    assert.equal(objectives(state)[0].status, "Complete");
  });
});

describe("specialist archive methods", () => {
  it("gates each method and retains an independent source for each success", () => {
    const methods: [StatId, string][] = [["chrome", "isolate-key"], ["face", "request-invoice"], ["ghost", "lift-carbon"], ["nerve", "hold-reader"]];
    for (const [stat, method] of methods) {
      const state = { ...base(), sceneId: "act2_archive_door" };
      assert.throws(() => step(state, method));
      const verified = step({ ...state, flags: { memory_intact: true, [`perk_${stat}`]: true } }, method, ["ghost", "nerve"].includes(stat) ? 10 : undefined);
      assert.equal(verified.flags.order_verified, true); assert.equal(verified.sceneId, "act2_archive_verified");
      assert.equal(verified.journal.find((entry) => entry.id === "verified-order")?.kind, "fact");
      if (stat === "face") assert.equal(verified.flags.archive_flagged, true);
    }
  });
  it("sends unsuccessful physical or stealth methods to the recoverable ledger route", () => {
    for (const [stat, method] of [["ghost", "lift-carbon"], ["nerve", "hold-reader"]]) {
      const state = { ...base(), sceneId: "act2_archive_door", flags: { [`perk_${stat}`]: true } };
      const failed = step(state, method, 1); assert.equal(failed.sceneId, "act2_archive_gap");
      assert.equal(failed.flags.order_verified, undefined); assert.ok(presentChoices(failed, getScene(failed.sceneId)).some((choice) => choice.enabled));
    }
  });
});

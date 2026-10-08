import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createCharacter, commitChoice, getScene, presentChoices, previewCheck, stageCheck } from "./engine.ts";
import { aftermath, FRAGMENTS } from "./evidence.ts";
import { importRun, exportRun } from "./vault.ts";
import { parseSave } from "./storage.ts";
import { parsePreferences } from "./preferences.ts";
import { simulateCampaign, storyReport } from "./story-report.ts";
import type { GameState, OriginId } from "./types.ts";

const base = () => createCharacter({ handle: "Rex", givenName: "Ada", origin: "spire", bonus: { chrome: 0, nerve: 0, face: 2, ghost: 0 }, complication: "optic" });
function step(state: GameState, id: string, roll?: number) {
  const choice = presentChoices(state, getScene(state.sceneId)).find((option) => option.id === id);
  assert.ok(choice?.enabled, `${state.sceneId}:${id} unavailable`);
  return commitChoice(state, choice, roll === undefined ? undefined : { roll }).state;
}
function examined(): GameState {
  let state = { ...base(), sceneId: "memory_table", items: ["shard"], flags: { heard_memo: true } };
  for (const fragment of FRAGMENTS) state = step(state, `inspect-${fragment.id}`);
  return state;
}

describe("recorded checks and portable saves", () => {
  it("round-trips a rolled outcome and applies it exactly once", () => {
    const state = { ...base(), sceneId: "pay" };
    const staged = stageCheck(state, "haggle", 1);
    const restored = importRun(exportRun(staged));
    assert.equal(restored.pendingCheck?.roll, 1);
    assert.equal(stageCheck(restored, "haggle", 10).pendingCheck?.roll, 1);
    assert.throws(() => step(restored, "haggle", 10));
    assert.throws(() => step(restored, "back"));
    const next = step(restored, "haggle", 1);
    assert.equal(next.pendingCheck, undefined); assert.equal(next.rolls.length, 1);
    assert.throws(() => step(next, "haggle", 1));
  });
  it("rejects altered snapshots, illegal pending checks and invalid numerical state", () => {
    const file = JSON.parse(exportRun(base())); file.state.creds += 10;
    assert.throws(() => importRun(JSON.stringify(file)), /integrity/);
    const bad = { ...base(), sceneId: "pay", flags: { haggled: true }, pendingCheck: { sceneId: "pay", choiceId: "haggle", roll: 1 } };
    assert.equal(parseSave(JSON.stringify(bad)), null);
    for (const stats of [{}, { chrome: null, nerve: 2, face: 2, ghost: 2 }, { chrome: 6, nerve: 2, face: 2, ghost: 2 }]) assert.equal(parseSave(JSON.stringify({ ...base(), stats })), null);
    assert.equal(parseSave(JSON.stringify({ ...base(), sceneId: "__proto__" })), null);
    assert.equal(parseSave(JSON.stringify({ ...base(), journal: [{ id: "bad", text: "bad", kind: {} }] })), null);
    assert.throws(() => stageCheck({ ...base(), sceneId: "pay" }, "haggle", 1.5));
  });
  it("imports a supported legacy state without an envelope", () => { const state = base(); assert.deepEqual(importRun(JSON.stringify(state)), state); });
  it("bounds preference values and handles malformed preferences", () => {
    assert.equal(parsePreferences("{").sound, false);
    assert.equal(parsePreferences(JSON.stringify({ music: 1000, ambience: -1, effects: "loud" })).music, 100);
    assert.equal(parsePreferences(JSON.stringify({ ambience: -1 })).ambience, 0);
  });
});

describe("memory evidence and promises", () => {
  it("requires examining all fragments and records claims separately from facts", () => {
    let state = { ...base(), sceneId: "memory_table" };
    assert.equal(presentChoices(state, getScene(state.sceneId)).some((choice) => choice.id === "seal-full"), false);
    state = examined();
    assert.equal(state.journal.find((entry) => entry.id === "memory-signature")?.kind, "claim");
    assert.equal(state.journal.find((entry) => entry.id === "memory-order")?.kind, "fact");
    assert.equal(presentChoices(state, getScene(state.sceneId)).filter((choice) => choice.id.startsWith("seal-")).length, 3);
  });
  it("opens a traceable archive and verifies its counter-order", () => {
    let state = step(examined(), "seal-full");
    assert.equal(state.flags.memory_intact, true); assert.equal(state.strain, 2);
    state = { ...state, sceneId: "act2_middle" };
    state = step(state, "trace-order"); state = step(state, "trace-receipt", 10); state = step(state, "keep-chain");
    assert.equal(state.flags.order_verified, true); assert.equal(state.flags.archive_done, true);
    assert.match(aftermath(state).find((row) => row.title === "Mara")!.text, /counter-order/);
    assert.equal(presentChoices(state, getScene(state.sceneId)).some((choice) => choice.id === "trace-order"), false);
  });
  it("protects a witness through a consumed origin tool", () => {
    let state = step(examined(), "seal-witness");
    state = { ...state, sceneId: "act2_middle", items: [...state.items, "burner-route"] };
    state = step(state, "protect-witness"); state = step(state, "use-freight"); state = step(state, "file-account");
    assert.equal(state.items.includes("burner-route"), false); assert.equal(state.flags.witness_safe, true);
    assert.equal(state.flags.order_verified, true); assert.match(aftermath(state).find((row) => row.title === "Nia Pell")!.text, /protected|outside Helion/);
    assert.equal(presentChoices(state, getScene(state.sceneId)).some((choice) => choice.id === "protect-witness"), false);
  });
  it("turns failed transport into a checkpoint with a recoverable cost", () => {
    let state = { ...base(), sceneId: "act2_witness_door", flags: { memory_redacted: true }, items: ["clinic-marker"] };
    state = step(state, "slip-witness", 1); assert.equal(state.sceneId, "act2_witness_checkpoint");
    state = step(state, "clinic-transfer"); state = step(state, "file-account");
    assert.equal(state.flags.witness_safe, true); assert.equal(state.items.includes("clinic-marker"), false);
  });
  it("records a failed witness transfer honestly in the aftermath", () => {
    let state = { ...base(), sceneId: "act2_witness_checkpoint", flags: { memory_redacted: true } };
    state = step(state, "argue-transfer", 1); state = step(state, "record-cost");
    assert.equal(state.flags.witness_lost, true); assert.match(aftermath(state).find((row) => row.title === "Nia Pell")!.text, /tower's records/);
  });
});

describe("builds, gates and complete campaigns", () => {
  it("learns one perk without inflating the underlying stat", () => {
    let state = { ...base(), sceneId: "street_after" };
    state = step(state, "practice"); state = step(state, "learn-face");
    assert.equal(previewCheck(state, { stat: "face", dc: 8, label: "Read" }).bonus, state.stats.face + 1);
    assert.equal(presentChoices(state, getScene(state.sceneId)).some((choice) => choice.id === "practice"), false);
    assert.ok(state.stats.face <= 5);
  });
  it("gives each origin a different contract and tool", () => {
    for (const [origin, choice, tool] of [["gutterwire", "move-valve", "witness-token"], ["spire", "clear-key", "signal-baffle"], ["dustline", "courier-run", "burner-route"]] as const) {
      let state = { ...createCharacter({ handle: "Rex", givenName: "", origin, bonus: { chrome: 1, nerve: 1, face: 0, ghost: 0 } }), sceneId: "districts" };
      state = step(state, "origin-contract"); assert.equal(state.sceneId, `act2_origin_${origin}`);
      state = step(state, choice, 10); assert.ok(state.items.includes(tool));
      state = step(state, "return-board"); assert.equal(presentChoices(state, getScene(state.sceneId)).some((entry) => entry.id === "origin-contract"), false);
    }
  });
  it("locks faction favors below their stated standing", () => {
    const state = { ...base(), sceneId: "act2_witness_door" };
    assert.equal(presentChoices(state, getScene(state.sceneId)).find((choice) => choice.id === "quill-room")?.enabled, false);
    assert.throws(() => step(state, "quill-room"));
  });
  it("limits the third-name check to one attempt", () => {
    let state = { ...base(), sceneId: "ward_wall" };
    state = step(state, "read-third", 1);
    assert.equal(presentChoices(state, getScene(state.sceneId)).some((choice) => choice.id === "read-third"), false);
    assert.ok(presentChoices(state, getScene(state.sceneId)).some((choice) => choice.enabled));
  });
  it("checks the authoring graph and finishes 900 seeded builds", () => {
    assert.deepEqual(storyReport().missing, []);
    const reached = new Set<string>();
    for (const origin of ["gutterwire", "spire", "dustline"] as OriginId[]) for (let seed = 1; seed <= 300; seed++) {
      const result = simulateCampaign(seed, origin); reached.add(result.finale);
      assert.ok(result.steps < 200); assert.ok(result.state.strain <= 5); assert.ok(result.state.creds >= 0);
    }
    assert.equal(reached.size, 4);
  });
});

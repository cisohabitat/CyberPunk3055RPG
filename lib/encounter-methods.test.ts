import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { commitChoice, createCharacter, getScene, presentChoices, sceneText, stageCheck } from "./engine";
import { exportRun, importRun } from "./vault";
import type { GameState } from "./types";
const base = (sceneId: string): GameState => ({ ...createCharacter({ handle: "Methods", givenName: "Ada", origin: "spire", bonus: { chrome: 0, nerve: 0, face: 2, ghost: 0 } }), sceneId, creds: 100, strain: 0 });
function step(s: GameState, id: string, roll?: number) { const c = presentChoices(s, getScene(s.sceneId)).find(c => c.id === id && c.enabled); assert.ok(c, `${s.sceneId}:${id}`); return commitChoice(s, c, roll === undefined ? undefined : { roll }).state; }
describe("prepared encounter methods", () => {
  it("saves an isolation roll and cannot repeat preparation after failure", () => {
    let s = step(base("route"), "prepare-chapel-method");
    s = importRun(exportRun(stageCheck(s, "inspect-chapel-reader", 1)));
    s = step(s, "inspect-chapel-reader", 1); assert.equal(s.flags.chapel_reader_failed, true);
    s = step(s, "leave-prepared-entry"); s = step(s, "prepare-chapel-method");
    assert.throws(() => step(s, "inspect-chapel-reader", 10)); assert.throws(() => step(s, "use-isolated-reader"));
    s = step(s, "leave-prepared-entry"); assert.ok(presentChoices(s, getScene(s.sceneId)).some(c => c.id === "hatch" && c.enabled));
  });
  it("isolates a machine with physical effort and a later observed fault", () => {
    let s = step(step(base("chapel_methods"), "inspect-chapel-reader", 8), "use-isolated-reader");
    assert.equal(s.strain, 1); assert.equal(s.flags.watched, undefined); assert.equal(s.flags.quiet, true);
    assert.match(sceneText(getScene("lumen"), { ...s, sceneId: "lumen" }), /maintenance fault/);
    assert.equal(s.flags.witness_consent, undefined); assert.equal(s.flags.order_verified, undefined);
  });
  it("charges a reserved tool fee once, preserves refusal and offers a zero-funds door", () => {
    let s = step({ ...base("chapel_methods"), creds: 15 }, "offer-chapel-service"); s = importRun(exportRun(s));
    s = step(s, "bargain-service-entry", 1); assert.equal(s.creds, 0); assert.equal(s.flags.chapel_service_refused, true); assert.equal(s.flags.chapel_shift_owed, undefined);
    assert.throws(() => step(s, "prepare-chapel-method")); assert.ok(presentChoices(s, getScene(s.sceneId)).some(c => c.id === "hatch" && c.enabled));
  });
  it("keeps the service commitment separate from entry and once-only return work", () => {
    let s = step(step(base("chapel_methods"), "offer-chapel-service"), "bargain-service-entry", 8);
    assert.equal(s.flags.watched, true); assert.match(sceneText(getScene("lumen"), { ...s, sceneId: "lumen" }), /owe the work/);
    s = step({ ...s, sceneId: "act2_middle" }, "work-chapel-shift"); s = importRun(exportRun(s)); assert.equal(s.strain, 1); assert.throws(() => step(s, "work-chapel-shift"));
  });
  it("offers a volunteer your own work without spending standing or buying consent", () => {
    let s = step({ ...base("act2_witness_support"), creds: 0, flags: { witness_briefed: true, witness_escort: true } }, "promise-volunteer-shift");
    assert.equal(s.flags.witness_safe, true); assert.equal(s.flags.witness_consent, undefined); s = step(s, "defer-account");
    s = step(importRun(exportRun(s)), "work-witness-shift"); assert.equal(s.strain, 1); assert.throws(() => step(s, "work-witness-shift"));
    assert.match(sceneText(getScene("act3_witness_visit"), { ...s, sceneId: "act3_witness_visit" }), /something I owe/);
  });
  it("requires chair preparation and the reusable harness, with distinct strain", () => {
    const s = { ...base("act2_witness_support"), items: ["chair-harness"] };
    assert.throws(() => step(s, "harness-chair-transfer")); const moved = step({ ...s, flags: { witness_braced: true } }, "harness-chair-transfer");
    assert.equal(moved.strain, 2); assert.ok(moved.items.includes("chair-harness")); assert.equal(moved.flags.witness_consent, undefined);
  });
  it("spends an actually earned baffle, with no repeated favor grant", () => {
    let s = step({ ...base("act2_witness_support"), flags: { witness_scanner: true, old_badge_traced: true }, items: ["signal-baffle"] }, "baffle-clinic-transfer");
    assert.equal(s.strain, 0); assert.ok(!s.items.includes("signal-baffle")); assert.equal(s.flags.old_badge_traced, true); assert.equal(s.flags.witness_consent, undefined);
  });
  it("refunds the rig only on observed handover, preserving existing registration", () => {
    let s = step({ ...base("act2_route_handling"), creds: 20, flags: { kerr_route_started: true, kerr_route_private: true, kerr_route_trace: true } }, "borrow-depot-rig");
    assert.equal(s.creds, 0); assert.equal(s.flags.kerr_route_delivered, undefined); s = importRun(exportRun(s)); s = step(s, "record-kerr-receipt");
    assert.equal(s.creds, 20); assert.equal(s.strain, 2); assert.equal(s.flags.kerr_route_trace, true); assert.equal(s.flags.kerr_rig_returned, true); assert.throws(() => step(s, "record-kerr-receipt"));
    assert.match(sceneText(getScene("act3_kerr_collection"), { ...s, sceneId: "act3_kerr_collection" }), /deposit/);
  });
  it("requires an earned introduction or trained Face for the zero-funds work offer", () => {
    const s = { ...base("act2_route_handling"), creds: 0 }; assert.throws(() => step(s, "offer-depot-shift")); assert.throws(() => step(s, "borrow-depot-rig"));
    const done = step({ ...s, flags: { kerr_route_intro: true } }, "offer-depot-shift"); assert.equal(done.strain, 1); assert.equal(done.flags.kerr_route_trace, undefined); assert.equal(done.flags.kerr_route_delivered, undefined);
    assert.match(sceneText(getScene("act3_kerr_collection"), { ...done, sceneId: "act3_kerr_collection" }), /sorted/);
  });
});

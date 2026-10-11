import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { commitChoice, createCharacter, getScene, presentChoices, sceneText } from "./engine";
import { routeOutcome, routeResume } from "./route-planning";
import { exportRun, importRun } from "./vault";
import type { GameState, StatId } from "./types";

const base = (stat: StatId, creds = 100): GameState => ({ ...createCharacter({ handle: "Depot", givenName: "Ada", origin: "spire", bonus: { chrome: 0, nerve: 0, face: 0, ghost: 0, [stat]: 2 } }), sceneId: "act2_route_crossing", creds, strain: 0, flags: { kerr_route_started: true, kerr_route_private: true, [`perk_${stat}`]: true, [`kerr_exit_${stat === "chrome" ? "ramp" : stat === "nerve" ? "walk" : "gap"}`]: true } });
function step(s: GameState, id: string) {
  const c = presentChoices(s, getScene(s.sceneId)).find(c => c.id === id && c.enabled);
  assert.ok(c, `${s.sceneId}:${id}`);
  return importRun(exportRun(commitChoice(s, c).state));
}
const begin = (stat: StatId, creds = 100) => step(step(base(stat, creds), "compare-trained-depot-methods"), `begin-depot-${stat}`);
const resume = (s: GameState) => ({ ...s, sceneId: routeResume(s) });

describe("distinct trained depot methods", () => {
  it("requires actual training and the prepared exit, without removing legacy rolls", () => {
    const s = base("chrome");
    assert.ok(presentChoices(s, getScene(s.sceneId)).some(c => c.id === "route-use-sensor" && c.enabled));
    const board = step(s, "compare-trained-depot-methods");
    assert.throws(() => step(board, "begin-depot-ghost"));
    assert.throws(() => step({ ...board, flags: { ...board.flags, kerr_exit_ramp: false } }, "begin-depot-chrome"));
    assert.throws(() => step({ ...board, flags: { ...board.flags, perk_chrome: false } }, "begin-depot-chrome"));
  });
  it("charges the buffer once, requires the return circuit, and keeps collection separate from receipt", () => {
    let s = step(begin("chrome", 10), "depot-fit-buffer");
    assert.equal(s.creds, 0); assert.equal(s.flags.kerr_route_collected, undefined);
    s = resume(step(s, "pause-depot-task")); assert.equal(s.sceneId, "act2_depot_return");
    assert.throws(() => step(s, "depot-fit-buffer"));
    s = step(s, "depot-preserve-return"); assert.equal(s.flags.kerr_route_delivered, undefined); assert.equal(s.strain, 0);
    s = step(s, "record-kerr-receipt"); assert.equal(s.creds, 0); assert.equal(s.flags.kerr_route_delivered, true);
    assert.match(routeOutcome(s), /ten creds.*return address/); assert.equal(s.rolls.length, 0);
  });
  it("offers a zero-funds disconnect without erasing the entry register", () => {
    let s = begin("chrome", 0); s.flags.kerr_route_trace = true;
    assert.throws(() => step(s, "depot-fit-buffer"));
    s = step(step(s, "depot-disconnect-recipient"), "depot-preserve-return");
    s = step(s, "record-kerr-receipt"); assert.equal(s.strain, 1); assert.equal(s.flags.kerr_route_trace, true);
    assert.match(sceneText(getScene("act3_kerr_collection"), { ...s, sceneId: "act3_kerr_collection" }), /service fault/);
    assert.match(routeOutcome(s), /private-collection promise was broken/);
  });
  it("preserves the patrol beat and charges waiting once across every pause", () => {
    let s = begin("ghost", 0); s = resume(step(s, "pause-depot-task")); assert.equal(s.sceneId, "act2_depot_outer_pass");
    s = step(s, "depot-watch-cart"); s = resume(step(s, "pause-depot-task")); assert.equal(s.sceneId, "act2_depot_cart_pass");
    assert.throws(() => step(s, "depot-cross-return"));
    s = step(s, "depot-wait-return"); s = resume(step(s, "pause-depot-task")); assert.equal(s.sceneId, "act2_depot_return_pass");
    assert.equal(s.strain, 1); assert.throws(() => step(s, "depot-wait-return"));
    s = step(step(s, "depot-cross-return"), "record-kerr-receipt"); assert.match(routeOutcome(s), /patrol's return/);
  });
  it("keeps an early patrol failure final, with zero-funds unresolved recovery", () => {
    let s = step(step(begin("ghost", 0), "depot-watch-cart"), "depot-follow-cart");
    assert.equal(s.strain, 1); assert.equal(s.flags.kerr_route_trace, undefined);
    assert.throws(() => step(resume(s), "begin-depot-ghost")); assert.throws(() => step(s, "fund-kerr-courier"));
    s = step(s, "leave-kerr-case-held"); assert.equal(s.flags.kerr_route_delivered, undefined); assert.match(routeOutcome(s), /case remains held/);
  });
  it("keeps Chrome failure, fee and registration history when a courier recovers the case", () => {
    let s = step(step(begin("chrome", 30), "depot-fit-buffer"), "depot-clear-return");
    assert.equal(s.creds, 20); assert.equal(s.strain, 1); assert.equal(s.flags.kerr_route_collected, undefined);
    s = step(step(s, "fund-kerr-courier"), "record-kerr-receipt"); assert.equal(s.creds, 0); assert.equal(s.flags.kerr_route_trace, true);
    assert.match(routeOutcome(s), /trained depot attempt.*later registered courier/);
  });
  it("makes Nerve money versus strain meaningful and preserves the sealed case", () => {
    const cradle = step(step(begin("nerve", 5), "depot-rent-cradle"), "depot-carry-low");
    const direct = step(step(begin("nerve", 0), "depot-carry-direct"), "depot-carry-low");
    assert.equal(cradle.creds, 0); assert.equal(cradle.strain, 1); assert.equal(direct.creds, 0); assert.equal(direct.strain, 2);
    assert.equal(direct.flags.kerr_route_trace, undefined); assert.match(routeOutcome(direct), /two strain/);
    const held = step(step(begin("nerve", 0), "depot-carry-direct"), "depot-lift-high");
    assert.equal(held.strain, 3); assert.equal(held.flags.kerr_route_collected, undefined);
  });
  it("separates your future work from Kerr's register and completes it only once", () => {
    let s = step(step(begin("face", 0), "depot-offer-own-liability"), "depot-promise-return-shift");
    assert.equal(s.strain, 0); assert.equal(s.flags.kerr_route_trace, undefined); assert.equal(s.flags.depot_shift_kept, undefined);
    s = step(s, "record-kerr-receipt"); assert.match(routeOutcome(s), /promise is still open/);
    s = step(s, "work-depot-return-shift"); assert.equal(s.strain, 1); assert.throws(() => step(s, "work-depot-return-shift"));
    assert.match(routeOutcome(s), /kept the depot return shift/); assert.ok(s.journal.some(j => j.id === "depot-return-promise"));
  });
  it("distinguishes paid liability and explicit recipient registration without inventing care or consent", () => {
    const cash = step(step(begin("face", 15), "depot-offer-own-liability"), "depot-pay-liability");
    const registered = step(begin("face", 0), "depot-sign-recipient");
    assert.equal(cash.creds, 0); assert.equal(cash.flags.depot_shift_owed, undefined); assert.equal(cash.flags.kerr_route_trace, undefined);
    assert.equal(registered.flags.kerr_route_trace, true);
    const response = sceneText(getScene("act2_route_receipt"), registered);
    assert.match(response, /recipient contract/); assert.doesNotMatch(response, /your work docket/);
    for (const s of [cash, registered]) for (const flag of ["witness_safe", "witness_consent", "nia_public_consent", "archive_key_authenticated"]) assert.equal(s.flags[flag], undefined);
  });
  it("prevents switching to a legacy roll or rig once a trained task has begun", () => {
    const s = begin("chrome");
    assert.throws(() => step({ ...s, sceneId: "act2_route_crossing" }, "route-use-sensor"));
    assert.throws(() => step({ ...s, sceneId: "act2_route_handling" }, "borrow-depot-rig"));
    assert.throws(() => step({ ...s, sceneId: "act2_depot_methods" }, "begin-depot-chrome"));
    const held = step(s, "abandon-depot-task"); assert.equal(held.flags.depot_failed, true); assert.equal(held.flags.kerr_route_collected, undefined);
  });
  it("keeps a trained Face contract separate from Quill's unused introduction", () => {
    let s = begin("face"); s.flags.kerr_route_intro = true;
    s = step(step(s, "depot-offer-own-liability"), "depot-pay-liability");
    assert.equal(s.flags.kerr_route_face, undefined);
    assert.match(sceneText(getScene("act3_quill_introduction"), { ...s, sceneId: "act3_quill_introduction" }), /recommendation can go unused/);
  });
  it("supports each origin without new rolls, care outcomes or save versions", () => {
    for (const origin of ["gutterwire", "spire", "dustline"] as const) {
      let s = step({ ...base("face", 0), origin }, "compare-trained-depot-methods");
      s = step(step(step(s, "begin-depot-face"), "depot-offer-own-liability"), "depot-promise-return-shift");
      assert.equal(s.origin, origin); assert.equal(s.version, 2); assert.equal(s.rolls.length, 0);
    }
  });
});

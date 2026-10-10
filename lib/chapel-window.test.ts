import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { commitChoice, createCharacter, getScene, presentChoices, stageCheck } from "./engine";
import { startWindow, windowRemaining } from "./chapel-window";
import { exportRun, importRun } from "./vault";
import type { GameState } from "./types";
const base = (): GameState => ({ ...createCharacter({ handle: "Window", givenName: "Ada", origin: "gutterwire", bonus: { chrome: 0, nerve: 0, face: 2, ghost: 0 }, complication: "on-file" }), sceneId: "route", creds: 0, strain: 0 });
function step(s: GameState, id: string, roll?: number) { const c = presentChoices(s, getScene(s.sceneId)).find(c => c.id === id && c.enabled); assert.ok(c, `${s.sceneId}:${id}`); return commitChoice(s, c, roll === undefined ? undefined : { roll }).state; }
describe("saved local Chapel window", () => {
  it("starts once and preserves every allowance through import and repeated pauses", () => {
    let s = step(base(), "begin-chapel-window"); assert.equal(windowRemaining(s), 3); s = step(s, "window-scout-gap");
    for (let i = 0; i < 4; i++) { s = step(s, "pause-chapel-window"); s = step(importRun(exportRun(s)), "begin-chapel-window"); assert.equal(windowRemaining(s), 2); assert.deepEqual(startWindow(s), {}); }
    assert.throws(() => step(s, "window-scout-gap"));
  });
  it("shares three opportunities between scouting, entry and the quiet exit", () => {
    let s = step(step(base(), "begin-chapel-window"), "window-scout-gap"); s = step(s, "window-use-gap", 8);
    assert.equal(windowRemaining(s), 1); assert.equal(s.flags.chapel_window_done, undefined); s = step(s, "window-quiet-exit");
    assert.equal(windowRemaining(s), 0); assert.equal(s.sceneId, "undercroft"); assert.equal(s.creds, 0); assert.equal(s.flags.watched, undefined);
    assert.throws(() => step({ ...s, sceneId: "route" }, "begin-chapel-window"));
  });
  it("freezes a pending die without spending, then commits exactly one opportunity", () => {
    let s = step(step(base(), "begin-chapel-window"), "window-scout-gap"); s = importRun(exportRun(stageCheck(s, "window-use-gap", 8)));
    assert.equal(windowRemaining(s), 2); assert.throws(() => step(s, "window-use-gap", 10), /recorded roll/); assert.throws(() => step(s, "pause-chapel-window"), /recorded roll/);
    s = step(s, "window-use-gap", 8); assert.equal(windowRemaining(s), 1); assert.equal(s.pendingCheck, undefined);
  });
  it("spending on both information routes leaves no quiet exit but a free staffed recovery", () => {
    let s = step(step(base(), "begin-chapel-window"), "window-scout-gap"); s = step(s, "window-inspect-reader", 8); assert.equal(windowRemaining(s), 1);
    s = step(s, "window-use-reader"); assert.equal(windowRemaining(s), 0); assert.equal(s.sceneId, "chapel_window_exit"); assert.throws(() => step(s, "window-quiet-exit"));
    s = step(importRun(exportRun(s)), "window-staffed-exit"); assert.equal(s.sceneId, "undercroft"); assert.equal(s.strain, 2); assert.equal(s.creds, 0); assert.equal(s.flags.chapel_window_expired, true); assert.equal(s.flags.watched, true);
  });
  it("failed reader inspection spends its allowance and cannot be farmed", () => {
    let s = step(base(), "begin-chapel-window"); s = step(importRun(exportRun(stageCheck(s, "window-inspect-reader", 1))), "window-inspect-reader", 1);
    assert.equal(windowRemaining(s), 2); assert.equal(s.flags.chapel_window_query_seen, true); assert.equal(s.flags.chapel_window_reader, undefined);
    assert.throws(() => step(s, "window-inspect-reader", 8)); assert.throws(() => step(s, "window-use-reader"));
    s = step(s, "window-force-hatch", 8); assert.equal(windowRemaining(s), 1); assert.equal(s.sceneId, "chapel_window_exit");
  });
  it("a failed crossing closes this attempt, while zero-funds doors still work", () => {
    let s = step(step(base(), "begin-chapel-window"), "window-scout-gap"); s.stats.ghost = 1; s = step(s, "window-use-gap", 1);
    assert.equal(s.sceneId, "chapel_window_expired"); assert.equal(s.flags.chapel_window_entered, undefined); s = step(s, "window-return-doors");
    assert.equal(s.creds, 0); assert.equal(s.flags.watched, true); assert.throws(() => step(s, "begin-chapel-window")); assert.ok(presentChoices(s, getScene("route")).some(c => c.id === "hatch" && c.enabled));
  });
  it("recovers when an old imported window has no remaining allowance", () => {
    let s = step({ ...base(), flags: { chapel_window_started: true, chapel_window_0: true } }, "begin-chapel-window"); assert.equal(s.sceneId, "chapel_window_expired");
    s = step(s, "window-return-doors"); assert.equal(s.sceneId, "route"); assert.equal(s.flags.chapel_window_done, true);
  });
  it("conflicting saved allowances use the smallest and zero hides every timed action", () => {
    const s = { ...base(), sceneId: "chapel_window_plan", flags: { chapel_window_0: true, chapel_window_3: true, chapel_window_reader: true, chapel_window_scouted: true } };
    assert.equal(windowRemaining(s), 0); for (const id of ["window-use-gap", "window-inspect-reader", "window-use-reader", "window-force-hatch", "window-scout-gap"]) assert.throws(() => step(s, id, 8));
    assert.equal(windowRemaining({ ...s, flags: { chapel_window_1: true, chapel_window_3: true } }), 1);
  });
});

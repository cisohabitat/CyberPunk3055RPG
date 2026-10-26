import assert from "node:assert/strict";
import { it } from "node:test";
import { commitArchivePlan, archivePlanBonus, type ArchivePlanDraft } from "./archive-plan";
import { commitCaseAction } from "./case-file";
import { createCharacter, commitChoice, getScene, presentChoices, previewCheck, stageCheck } from "./engine";
import { exportRun, importRun } from "./vault";
import { parseSave } from "./storage";
import type { GameState, StatId } from "./types";
import { routeCheckpoint } from "../qa/production/route-checkpoint";
import { readFileSync } from "node:fs";

const base: GameState = { ...createCharacter({ handle: "Planner", givenName: "Ada", origin: "gutterwire", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 } }), sceneId: "act2_archive_door", creds: 100, flags: { archive_briefed: true, memory_intact: true }, journal: [{ id: "memory-order", text: "The acquired cancellation receipt.", kind: "fact" }] };
const plan = (approach: "reader" | "carbon" = "reader", contingency: "staffed" | "withdraw" = "staffed"): ArchivePlanDraft => ({ objective: approach === "reader" ? "authenticate" : "corroborate", approach, contingency });
function take(state: GameState, id: string, roll?: number) {
  const choice = presentChoices(state, getScene(state.sceneId)).find(c => c.id === id);
  assert.ok(choice?.enabled, `${state.sceneId}/${id} must be enabled`);
  return commitChoice(state, choice, roll ? { roll } : undefined);
}
function prepared(approach: "reader" | "carbon" = "reader", contingency: "staffed" | "withdraw" = "staffed", state = base) {
  return take(commitArchivePlan(state, plan(approach, contingency)), approach === "reader" ? "archive-plan-priority" : "archive-plan-window").state;
}

it("saving a plan spends nothing, grants nothing and cannot promise carbon authentication", () => {
  const state = commitArchivePlan(base, plan()); const { archivePlan, ...unchanged } = state;
  assert.deepEqual(unchanged, base); assert.equal(archivePlan!.stage, "planned");
  assert.throws(() => commitArchivePlan(base, { ...plan("carbon"), objective: "authenticate" }));
  assert.throws(() => commitArchivePlan({ ...base, sceneId: "stall" }, plan()));
  assert.equal(presentChoices(state, getScene(state.sceneId)).some(c => c.id === "trace-receipt"), false);
});
it("charges setup once, uses one canonical check and preserves held rolls and modifiers", () => {
  const state = prepared(); assert.equal(state.factions.helion, Math.min(5, base.factions.helion + 1));
  assert.equal(state.strain, base.strain); assert.equal(state.creds, base.creds);
  assert.throws(() => take(state, "archive-plan-priority"));
  assert.throws(() => commitArchivePlan(state, plan("carbon")));
  const held = stageCheck(state, "trace-receipt", 8);
  assert.deepEqual(importRun(exportRun(held)), held); assert.throws(() => commitArchivePlan(held, plan()));
  const choice = presentChoices(held, getScene(held.sceneId)).find(c => c.id === "trace-receipt")!;
  const preview = previewCheck(held, choice.check!); const result = take(held, "trace-receipt", 8);
  assert.equal(result.check!.bonus, preview.bonus); assert.equal(result.check!.dc, preview.dc);
  assert.equal(result.state.archivePlan!.stage, "retrieved"); assert.equal(result.state.flags.archive_key_authenticated, true);
});
it("opens carbon only for the prepared attempt without granting training or key authentication", () => {
  assert.equal(presentChoices(base, getScene(base.sceneId)).some(c => c.id === "lift-carbon"), false);
  const state = prepared("carbon"); assert.equal(state.strain, 1); assert.equal(state.flags.perk_ghost, undefined);
  const result = take(state, "lift-carbon", 10).state;
  assert.equal(result.flags.order_verified, true); assert.equal(result.flags.archive_key_authenticated, undefined);
  assert.equal(result.archivePlan!.stage, "retrieved"); assert.equal(result.flags.perk_ghost, undefined);
});
it("does not stack planned accuracy with the same earned preparation", () => {
  const state = prepared("reader", "staffed", { ...base, flags: { ...base.flags, archive_indexed: true } });
  const choice = presentChoices(state, getScene(state.sceneId)).find(c => c.id === "trace-receipt")!;
  assert.equal(archivePlanBonus(state, choice.check!), 0);
  assert.deepEqual(previewCheck(state, choice.check!), previewCheck({ ...state, archivePlan: undefined }, choice.check!));
  const existing = take(commitArchivePlan({ ...base, flags: { ...base.flags, perk_chrome: true } }, plan()), "archive-plan-existing").state;
  const result = take(existing, "isolate-key"); assert.equal(result.check, null); assert.equal(result.state.flags.archive_key_authenticated, true);
});
it("keeps staffed recovery explicit and adds the actually acquired ledger without a key match", () => {
  const failed = take(prepared("reader", "staffed", { ...base, creds: 25 }), "trace-receipt", 1).state;
  assert.equal(failed.sceneId, "act2_archive_gap"); assert.equal(failed.archivePlan!.stage, "failed"); assert.equal(failed.creds, 25);
  assert.equal(failed.flags.order_verified, undefined);
  const paid = take(failed, "buy-ledger").state;
  assert.equal(paid.creds, 0); assert.equal(paid.archivePlan!.stage, "retrieved");
  assert.equal(paid.flags.order_verified, true); assert.equal(paid.flags.archive_key_authenticated, undefined);
  assert.ok(paid.journal.some(e => e.id === "verified-order")); assert.throws(() => take(paid, "buy-ledger"));
  assert.deepEqual(importRun(exportRun(paid)), paid);
});
it("executes planned withdrawal while retaining failure costs and previously earned evidence", () => {
  const state = prepared("reader", "withdraw", { ...base, flags: { ...base.flags, order_verified: true } });
  const result = take(state, "trace-receipt", 1).state;
  assert.equal(result.sceneId, "act2_middle"); assert.equal(result.flags.archive_unresolved, true);
  assert.equal(result.flags.order_verified, true); assert.equal(result.flags.archive_key_authenticated, undefined);
  assert.equal(result.strain, 2); assert.equal(result.archivePlan!.stage, "withdrawn");
  assert.deepEqual(importRun(exportRun(result)), result);
});
it("abandonment retains real costs and restores the original capability requirements", () => {
  const planned = commitArchivePlan(base, plan("carbon"));
  const registered = take(planned, "archive-plan-registered").state;
  const result = take(registered, "archive-plan-abandon").state;
  assert.equal(result.creds, 85); assert.equal(result.archivePlan!.stage, "abandoned");
  assert.equal(presentChoices(result, getScene(result.sceneId)).some(c => c.id === "lift-carbon"), false);
  assert.ok(presentChoices(result, getScene(result.sceneId)).some(c => c.id === "trace-receipt" && c.enabled));
  assert.deepEqual(importRun(exportRun(result)), result);
});
it("blocks effort at full strain and retains a free exit when no carbon setup is affordable", () => {
  const state = commitArchivePlan({ ...base, strain: 5, creds: 0 }, plan("carbon"));
  const choices = presentChoices(state, getScene(state.sceneId));
  assert.equal(choices.find(c => c.id === "archive-plan-window")!.enabled, false);
  assert.equal(choices.find(c => c.id === "archive-plan-registered")!.enabled, false);
  assert.equal(choices.find(c => c.id === "leave-archive")!.enabled, true);
  assert.equal(take(state, "archive-plan-abandon").state.strain, 5);
});
it("sets aside a plan when the player instead retrieves through the original paid catalog", () => {
  let state = commitArchivePlan(routeCheckpoint("catalog-paid", "act2_archive_compare"), plan());
  const spec = JSON.parse(readFileSync(new URL("../qa/routes/catalog-paid.json", import.meta.url), "utf8"));
  const start = spec.steps.findIndex((s: { choiceId: string }) => s.choiceId === "open-archive-catalog");
  for (const step of spec.steps.slice(start)) {
    state = take(state, step.choiceId, step.roll).state;
    assert.deepEqual(importRun(exportRun(state)), state);
    if (state.flags.archive_done) break;
  }
  assert.equal(state.flags.order_verified, true); assert.equal(state.archivePlan!.stage, "abandoned");
});
it("preserves both extension creation orders and rejects forged stages or unsupported plan data", () => {
  for (const first of ["case", "plan"]) {
    let state = { ...base, sceneId: "act2_archive_compare" };
    if (first === "plan") state = commitArchivePlan(state, plan());
    state = commitCaseAction(state, { type: "link", source: "memory-order", relation: "supports" });
    if (first === "case") state = commitArchivePlan(state, plan());
    assert.equal(JSON.stringify(importRun(exportRun(state))), JSON.stringify(state));
  }
  const p = commitArchivePlan(base, plan()).archivePlan!;
  for (const invalid of [null, { ...p, approach: "constructor" }, { ...p, objective: "authenticate", approach: "carbon" }, { ...p, stage: "positioned", position: "priority" }, { ...p, stage: "retrieved", position: "priority" }]) assert.equal(parseSave(JSON.stringify({ ...base, archivePlan: invalid })), null);
  assert.equal(Object.hasOwn(importRun(exportRun(base)), "archivePlan"), false);
});
it("resolves all four builds, approaches, contingencies and ten faces with a forward path", () => {
  for (const stat of ["chrome", "nerve", "face", "ghost"] as StatId[]) for (const approach of ["reader", "carbon"] as const) for (const contingency of ["staffed", "withdraw"] as const) for (let face = 1; face <= 10; face++) {
    const bonus = { chrome: 0, nerve: 0, face: 0, ghost: 0 }; bonus[stat] = 2;
    const state = { ...base, stats: createCharacter({ handle: "Build", givenName: "Ada", origin: "gutterwire", bonus }).stats };
    const result = take(prepared(approach, contingency, state), approach === "reader" ? "trace-receipt" : "lift-carbon", face);
    if (result.check!.success) { assert.equal(result.state.archivePlan!.stage, "retrieved"); assert.equal(Boolean(result.state.flags.archive_key_authenticated), approach === "reader"); }
    else if (contingency === "withdraw") assert.equal(result.state.sceneId, "act2_middle");
    else assert.equal(take(result.state, "keep-gap").state.sceneId, "act2_middle");
  }
});

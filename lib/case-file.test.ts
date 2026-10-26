import assert from "node:assert/strict";
import { it } from "node:test";
import { commitCaseAction, reviewCase } from "./case-file";
import { createCharacter, commitChoice, getScene, presentChoices, stageCheck } from "./engine";
import { exportRun, importRun } from "./vault";
import { parseSave } from "./storage";
import type { GameState } from "./types";

const base: GameState = { ...createCharacter({ handle: "Case", givenName: "Ada", origin: "spire", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 } }), sceneId: "act2_archive_compare", journal: [
  { id: "memory-signature", text: "The acquired authorization.", kind: "fact" },
  { id: "memory-order", text: "The acquired later receipt.", kind: "fact" },
] };
function linked(state = base, claim: "authorization" | "cancellation" | "issuer" = "cancellation", source: "memory-signature" | "memory-order" | "verified-order" = "memory-order", relation: "supports" | "limits" = "supports") {
  let next = commitCaseAction(state, { type: "claim", claim });
  next = commitCaseAction(next, { type: "link", source, relation });
  return commitCaseAction(next, { type: "test" });
}
it("preserves a challenged account beside its correction without granting source authority", () => {
  const wrong = linked(base, "issuer"); assert.equal(reviewCase(wrong).verdict, "challenged");
  assert.equal(presentChoices(wrong, getScene(wrong.sceneId)).some(c => c.id === "case-pursue-archive"), false);
  const changed = commitCaseAction(wrong, { type: "link", source: "memory-order", relation: "limits" });
  assert.equal(changed.caseFile!.reviewed, false);
  const corrected = commitCaseAction(changed, { type: "test" });
  assert.equal(reviewCase(corrected).verdict, "bounded");
  assert.deepEqual(corrected.caseFile!.history.map(r => r.verdict), ["challenged", "bounded"]);
  const { caseFile, ...unchanged } = corrected; assert.deepEqual(unchanged, base);
  const choice = presentChoices(corrected, getScene(corrected.sceneId)).find(c => c.id === "case-pursue-archive")!;
  const next = commitChoice(corrected, choice).state;
  assert.equal(next.sceneId, "act2_archive_door"); assert.equal(next.flags.order_verified, undefined);
});
it("distinguishes a supported authorization, bounded receipt and independently corroborated sequence", () => {
  assert.equal(reviewCase(linked(base, "authorization", "memory-signature")).verdict, "supported");
  assert.equal(reviewCase(linked()).verdict, "bounded");
  let next = linked({ ...base, flags: { order_verified: true }, journal: [...base.journal, { id: "verified-order", text: "An independent ledger.", kind: "fact" }] });
  next = commitCaseAction(next, { type: "link", source: "verified-order", relation: "supports" });
  next = commitCaseAction(next, { type: "test" });
  assert.equal(reviewCase(next).verdict, "supported");
  assert.equal(reviewCase(linked(next, "issuer", "verified-order")).verdict, "challenged");
});
it("carries case scope into the real hearing while keeping permission and evidence separate", () => {
  const next = { ...linked(), sceneId: "act3_testimony_review" };
  const choice = presentChoices(next, getScene(next.sceneId)).find(c => c.id === "case-bring-account")!;
  const result = commitChoice(next, choice).state;
  assert.equal(result.sceneId, "act3_testimony_consent"); assert.equal(result.flags.testimony_bounded, true);
  assert.equal(result.flags.testimony_source, undefined); assert.equal(result.flags.nia_public_consent, undefined);
});
it("accepts approved witness corroboration without turning it into a key match or quotation right", () => {
  let state = linked({ ...base, flags: { order_verified: true }, journal: [...base.journal, { id: "nia-account", text: "Nia corroborated the canceled evacuation.", kind: "fact" }] });
  state = commitCaseAction(state, { type: "link", source: "nia-account", relation: "supports" });
  state = commitCaseAction(state, { type: "test" });
  assert.equal(reviewCase(state).verdict, "supported");
  assert.equal(state.flags.archive_key_authenticated, undefined); assert.equal(state.flags.nia_public_consent, undefined);
});
it("roundtrips optional drafts and rejects unknown, duplicate or oversized case data", () => {
  const state = linked(); assert.deepEqual(importRun(exportRun(state)), state);
  assert.equal(Object.hasOwn(importRun(exportRun(base)), "caseFile"), false);
  for (const caseFile of [null, { ...state.caseFile, claim: "constructor" }, { ...state.caseFile, links: [{ source: "verified-order", relation: "supports" }] }, { ...state.caseFile, links: [...state.caseFile!.links, ...state.caseFile!.links] }, { ...state.caseFile, history: Array(5).fill(state.caseFile!.history[0]) }]) {
    assert.equal(parseSave(JSON.stringify({ ...base, caseFile })), null);
  }
  const forged = { ...state, caseFile: { ...state.caseFile!, claim: "issuer" as const, history: [{ ...state.caseFile!.history[0], verdict: "supported" as const }] } };
  assert.equal(reviewCase(importRun(exportRun(forged))).verdict, "challenged");
});
it("keeps reviews bounded and refuses editing during held rolls or outside source contexts", () => {
  let state = linked(); for (let i = 0; i < 10; i++) state = commitCaseAction(state, { type: "test" });
  assert.equal(state.caseFile!.history.length, 4);
  assert.throws(() => commitCaseAction({ ...base, sceneId: "stall" }, { type: "test" }));
  assert.throws(() => commitCaseAction({ ...base, journal: [base.journal[0]] }, { type: "claim", claim: "issuer" }));
  const held = stageCheck({ ...base, sceneId: "act2_archive_door" }, "trace-receipt", 8);
  assert.throws(() => commitCaseAction(held, { type: "test" }));
});

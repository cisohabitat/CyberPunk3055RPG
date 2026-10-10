import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { describe, it } from "node:test";
import { importRun } from "./vault";
import { parseSave } from "./storage";
import { commitChoice, getScene, presentChoices } from "./engine";

const dir = "qa/release/cycle9", provenance = JSON.parse(readFileSync(join(dir, "provenance.json"), "utf8"));
describe("previous public release fixtures", () => {
  it("records immutable native exports from the preceding deployment", () => {
    assert.equal(provenance.revision, "c0b4895c3581810c9dce84c1393cd7637663a737");
    assert.equal(provenance.deploymentId, "dpl_5fe2MCQvkvywHWBADVhaKWXyvwUA");
    assert.equal(provenance.files.length, 5);
    for (const file of provenance.files) {
      const raw = readFileSync(join(dir, file.file), "utf8");
      assert.equal(createHash("sha256").update(raw).digest("hex"), file.sha256);
      assert.equal(importRun(raw).sceneId, file.sceneId);
    }
  });
  it("keeps all four previous finale identities, costs, evidence and journals", () => {
    for (const id of ["names", "quiet", "witness", "listed"]) {
      const raw = readFileSync(join(dir, `ending-${id}.json`), "utf8"), snapshot = JSON.parse(raw), state = importRun(raw);
      assert.equal(state.sceneId, `ending_${id}`);
      assert.deepEqual(state, snapshot.state);
      assert.deepEqual(parseSave(JSON.stringify(state)), state);
      assert.ok(state.rolls.length > 0);
    }
  });
  it("resolves the old pending eight with one allowance and one roll record", () => {
    const state = importRun(readFileSync(join(dir, "pending-window.json"), "utf8"));
    assert.equal(state.pendingCheck?.roll, 8);
    assert.equal(state.flags.chapel_window_2, true);
    const choice = presentChoices(state, getScene(state.sceneId)).find(choice => choice.id === state.pendingCheck?.choiceId && choice.enabled)!;
    const committed = commitChoice(state, choice, { roll: state.pendingCheck!.roll }).state;
    assert.equal(committed.pendingCheck, undefined);
    assert.equal(committed.flags.chapel_window_1, true);
    assert.equal(committed.rolls.length, state.rolls.length + 1);
    assert.equal(committed.rolls.at(-1)?.roll, 8);
    assert.deepEqual(parseSave(JSON.stringify(committed)), committed);
  });
});

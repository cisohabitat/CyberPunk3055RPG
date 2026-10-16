/** Test-only preservation of the exact binding cohort before additive voices. */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import bindings from "../media/campaign-dialogue-bindings.json";
import multiline from "../media/multiline-dialogue.json";

export function bindingsBeforeMultiline() {
  const added = new Set(multiline.additions.map(line => line.key));
  assert.deepEqual(bindings.filter(line => added.has(line.key)), multiline.additions);
  const preceding = bindings.filter(line => !added.has(line.key));
  assert.deepEqual(preceding, multiline.precedingBindings);
  assert.equal(createHash("sha256").update(JSON.stringify(preceding, null, 2) + "\n").digest("hex"), multiline.precedingBindingSha256);
  return preceding;
}

export function bindingHashBeforeMultiline() {
  bindingsBeforeMultiline();
  return multiline.precedingBindingSha256;
}

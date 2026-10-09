import assert from "node:assert/strict";
import { it } from "node:test";
import { endingGroups } from "./ending-discovery";
import { checkpointLabel } from "./checkpoints";
import { createCharacter } from "./engine";
it("ending discovery partitions all fifteen outcomes into chapters and four finales", () => {
  const groups = endingGroups({ seen: [{ id: "ending_quiet", title: "Quiet" }, { id: "ending_quiet", title: "Quiet" }, { id: "unknown", title: "Unknown" }], keepsakes: [] });
  assert.deepEqual(groups.map((group) => group.entries.length), [8, 3, 4]);
  assert.equal(new Set(groups.flatMap((group) => group.entries.map((entry) => entry.id))).size, 15);
  assert.deepEqual(groups.map((group) => group.discovered), [0, 0, 1]);
});
it("checkpoint labels distinguish the chapter and precise place or ending", () => {
  const state = createCharacter({ handle: "Rex", givenName: "Ada", origin: "spire", bonus: { chrome: 0, nerve: 0, face: 2, ghost: 0 } });
  assert.match(checkpointLabel(state), /^The Hour · /);
  assert.match(checkpointLabel({ ...state, sceneId: "ending_quiet" }), /^The Wall · /);
});

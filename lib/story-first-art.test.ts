import assert from "node:assert/strict";
import { it } from "node:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { sceneBackdrop, sceneIllustration } from "./art";
import { auditSceneArt } from "./scene-art";
import { SCENES } from "./story";
import phase from "../qa/media/story-first-art.json";
const sha = (path: string) => createHash("sha256").update(readFileSync(path)).digest("hex");
it("keeps chapter textures explicit and all new art aligned with retained references", () => {
  assert.deepEqual(phase.assets.map(row => row.scene).sort(), ["card_wall", "card_week"]);
  assert.equal(sha("qa/media/campaign-dialogue-bindings.json"), phase.bindingSha256);
  const decisions = auditSceneArt(SCENES);
  for (const row of phase.assets) {
    const src = `/art/${row.id}.jpg`;
    assert.equal(decisions[row.scene].treatment, row.treatment);
    assert.equal(decisions[row.scene].asset, src);
    assert.equal(sceneBackdrop(row.scene, SCENES[row.scene].location), src);
    assert.equal(sceneIllustration(row.scene), undefined);
    for (const file of row.files) assert.equal(sha(file.path), file.sha256);
    for (const reference of row.references) assert.equal(sha(reference.path), reference.sha256);
  }
  assert.equal(sceneBackdrop("__proto__", "unmapped"), "/art/stall.jpg");
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { it } from "node:test";
import { sceneIllustration } from "./art";
import { auditSceneArt } from "./scene-art";
import { SCENES } from "./story";
import phase from "../qa/media/visual-compositions.json";
const sha = (path: string) => createHash("sha256").update(readFileSync(path)).digest("hex");
it("restricts the new establishing and detail compositions to their reviewed preparations", () => {
  assert.deepEqual(phase.scenes.map(row => row.scene).sort(), ["act2_archive_prep", "hatch"]);
  const decisions = auditSceneArt(SCENES);
  assert.equal(sha("qa/media/campaign-dialogue-bindings.json"), phase.bindingSha256);
  for (const row of phase.scenes) {
    const art = sceneIllustration(row.scene)!;
    assert.equal(art.src, `/art/${row.id}.jpg`);
    assert.equal(art.small, `/art/${row.id}-small.jpg`);
    assert.equal(art.description, row.description); assert.equal(decisions[row.scene].asset, art.src);
    assert.equal(sha(row.reference), row.referenceSha256);
    for (const file of row.files) assert.equal(sha(file.path), file.sha256);
  }
  // The later story-first art phase replaces this adjacent confrontation explicitly.
  assert.equal(sceneIllustration("hatch_caught")?.src, "/art/attendant-confrontation.jpg");
  assert.equal(sceneIllustration("act2_archive_door")?.src, "/art/archive-desk.jpg");
  assert.equal(sceneIllustration("act2_archive_custody")?.src, "/art/edda-archive.jpg");
});

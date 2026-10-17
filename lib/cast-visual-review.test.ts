import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { it } from "node:test";
import { CAST } from "./story/cast";
import { SCENES } from "./story";
import { PORTRAIT_ART, portraitArt, PORTRAIT_STAGING } from "./art";
import phase from "../qa/media/cast-visual-review.json";
const sha = (path: string) => createHash("sha256").update(readFileSync(path)).digest("hex");
it("reviews every cast identity and expression without changing its artwork or dialogue", () => {
  assert.deepEqual(phase.characters.map(row => row.speaker).sort(), CAST.map(row => row.speaker).sort());
  assert.equal(sha("qa/media/campaign-dialogue-bindings.json"), phase.bindingSha256);
  for (const row of phase.characters) {
    assert.equal(row.base, PORTRAIT_ART[row.speaker]);
    assert.equal(row.thumbnail, CAST.find(person => person.speaker === row.speaker)!.thumbnail);
    const paths = new Set(row.files.map(file => file.path));
    for (const scene of Object.keys(SCENES)) assert.ok(paths.has(`public${portraitArt(row.speaker, scene)}`));
    for (const rule of PORTRAIT_STAGING.filter(rule => rule.speaker === row.speaker)) assert.ok(paths.has(`public${rule.asset}`));
    for (const file of row.files) assert.equal(sha(file.path), file.sha256, file.path);
  }
});

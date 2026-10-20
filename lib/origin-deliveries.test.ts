import assert from "node:assert/strict";
import { it } from "node:test";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import deliveries from "../qa/media/origin-deliveries.json";
import provenance from "../qa/media/art-provenance.json";
const sha = (path: string) => createHash("sha256").update(readFileSync(path)).digest("hex");
it("preserves original origin paintings and ships smaller same-dimension WebP deliveries", () => {
  assert.equal(deliveries.files.length, 3);
  for (const row of deliveries.files) {
    assert.equal(sha(row.source), row.sourceSha256);
    assert.equal(sha(row.path), row.sha256);
    assert.equal(readFileSync(row.path).length, row.bytes);
    assert.ok(row.bytes < row.sourceBytes * .5, row.path);
    assert.equal(row.width, 1280); assert.equal(row.height, 720);
    assert.ok(provenance.assets.some(asset => asset.files.some(file => file.path === row.path && file.sha256 === row.sha256)));
  }
});

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { it } from "node:test";
import provenance from "../qa/media/art-provenance.json";

it("ships the reviewed generated images without corrupting or enlarging their encoded files", () => {
  assert.equal(provenance.assets.length, 7);
  const paths = new Set<string>();
  for (const asset of provenance.assets) for (const file of asset.files) {
    assert.equal(paths.has(file.path), false); paths.add(file.path);
    const bytes = readFileSync(new URL(`../${file.path}`, import.meta.url));
    assert.equal(bytes.readUInt16BE(0), 0xffd8, file.path);
    assert.equal(bytes.readUInt16BE(bytes.length - 2), 0xffd9, file.path);
    assert.equal(bytes.length, file.bytes, file.path);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), file.sha256, file.path);
    assert.ok(file.bytes < 1_048_576, file.path);
  }
});

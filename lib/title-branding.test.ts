import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { it } from "node:test";
import phase from "../qa/media/title-branding.json";
import provenance from "../qa/media/art-provenance.json";
import { TITLE_BRAND, TITLE_PORTRAIT } from "./title-branding";

const sha = (path: string) => createHash("sha256").update(readFileSync(path)).digest("hex");

it("ships only the separately reviewed title cohort with transparent brand deliveries", () => {
  assert.deepEqual(phase.assets.map(a => a.id), ["title-brand", "title-portrait"]);
  const paths = phase.assets.flatMap(a => a.files.map(f => f.path)).sort();
  assert.deepEqual(paths, [TITLE_BRAND.src, TITLE_BRAND.small, TITLE_PORTRAIT.src, TITLE_PORTRAIT.small].map(p => `public${p}`).sort());
  for (const asset of phase.assets) {
    assert.deepEqual(provenance.assets.find(a => a.id === asset.id), asset);
    for (const f of asset.files) {
      const bytes = readFileSync(f.path);
      assert.equal(sha(f.path), f.sha256);
      assert.equal(bytes.length, f.bytes);
      if (asset.id === "title-brand") {
        assert.equal(bytes.toString("ascii", 12, 16), "VP8X");
        assert.ok(bytes[20] & 0x10, "Brand must retain alpha, including letter counters");
      }
    }
  }
});

it("preserves the existing key art, dialogue and preceding anatomy review", () => {
  const original = phase.references.find(r => r.path === "public/art/title.jpg")!;
  assert.equal(sha(original.path), original.sha256);
  assert.equal(sha("qa/media/campaign-dialogue-bindings.json"), phase.bindingSha256);
  assert.equal(sha("qa/media/anatomy-art-review.json"), phase.anatomySnapshotSha256);
});

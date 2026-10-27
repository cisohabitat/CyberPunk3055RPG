import assert from "node:assert/strict";
import { it } from "node:test";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { reviewedDeliveryHash } from "../qa/production/delivery-history";
import retake from "../qa/media/anatomy-retakes.json";
import review from "../qa/media/anatomy-art-review.json";
import provenance from "../qa/media/art-provenance.json";
import previews from "../qa/media/art-previews.json";
import branding from "../qa/media/title-branding.json";
import kerr from "../qa/media/kerr-confrontation.json";
import mara from "../qa/media/mara-relationship.json";
import { paintedActor, sceneIllustration } from "./art";

const sha = (path: string) => createHash("sha256").update(readFileSync(path)).digest("hex");

it("retains explicit preceding art bytes and rejects an unreviewed replacement hash", () => {
  assert.equal(retake.deliveries.length, 3);
  for (const row of retake.deliveries) {
    assert.notEqual(row.previousSha256, row.sha256);
    assert.equal(sha(row.previousDeliveryCopy), row.previousSha256);
    assert.equal(sha(row.path), row.sha256);
    assert.equal(reviewedDeliveryHash(row.path, row.previousSha256), row.previousSha256);
    assert.throws(() => reviewedDeliveryHash(row.path, "0".repeat(64)), /Unreviewed delivery change/);
  }
});

it("uses the reviewed counter painting and its same-master phone/preview deliveries", () => {
  const art = sceneIllustration(retake.sceneId)!;
  assert.equal(art.src, "/art/edda-service-review.jpg");
  assert.equal(paintedActor(art, "Edda"), true);
  assert.match(art.description, /both hands on the counter/);
  assert.deepEqual(provenance.assets.find(a => a.id === retake.assetId), retake.asset);
  const preview = previews.files.find(f => f.source === `public${art.src}`)!;
  assert.equal(preview.sourceSha256, sha(`public${art.src}`));
  for (const f of retake.asset.files) {
    assert.equal(sha(f.path), f.sha256);
    assert.equal(readFileSync(f.path).length, f.bytes);
  }
  assert.equal(sha("qa/media/campaign-dialogue-bindings.json"), retake.bindingSha256);
});

it("records every current art delivery and explicitly corrects the missed visual defect", () => {
  const files = readdirSync("public/art", { recursive: true }).filter((p): p is string => typeof p === "string" && p.endsWith(".jpg")).map(p => `public/art/${p}`).sort();
  // Preserve the preceding review verbatim; additions carry a separate cohort.
  assert.equal(sha("qa/media/anatomy-art-review.json"), branding.anatomySnapshotSha256);
  const additions = [...branding.assets, ...district.artAssets, ...techniques.artAssets, ...cinematic.artAssets, ...kerr.artAssets, ...mara.artAssets].flatMap(a => a.files).filter(f => f.path.endsWith(".jpg"));
  const rows = [...review.primary, ...review.derivatives, ...additions];
  assert.deepEqual(rows.map(r => r.path).sort(), files);
  assert.equal(new Set(rows.map(r => r.path)).size, rows.length);
  for (const row of rows) assert.equal(sha(row.path), row.sha256, row.path);
  assert.match(review.supersedesFinding, /missed Edda/);
  assert.equal(review.primary.filter(r => r.result === "corrected").length, 1);
  assert.equal(review.counts.totalArtDeliveries, rows.length - additions.length);
  assert.equal(review.counts.primaryPortraitCastDeliveries, review.primary.length);
  assert.equal(review.counts.derivativeDeliveries, review.derivatives.length);
});
import district from "../qa/media/district-response.json";
import techniques from "../qa/media/build-techniques.json";

import cinematic from "../qa/media/cinematic-sequences.json";

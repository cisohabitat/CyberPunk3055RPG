import assert from "node:assert/strict";
import { reviewedDeliveryHash } from "../qa/production/delivery-history";
import { it } from "node:test";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { createCharacter, getScene, sceneText } from "./engine";
import { cityMap, mapDisplayRows } from "./city-map";
import { inventoryArt, inventoryThumbnailArt } from "./inventory-art";
import { ITEMS } from "./items";
import { sceneIllustration, portraitArt, paintedActor } from "./art";
import { visibleCampaignDialogue } from "./campaign-dialogue";
import phase from "../qa/media/complete-art.json";
import { ART_PREVIEWS } from "./art-previews";
import previews from "../qa/media/art-previews.json";
const base = createCharacter({ handle: "DetailReview", givenName: "Jo", origin: "gutterwire", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 } });
it("prioritizes current and actionable known places without inventing locations or changing legal choices", () => {
  for (const sceneId of ["opening_city", "act2_middle", "act3_arrival", "card_week"]) {
    const state = { ...base, sceneId, flags: { hired: true, memory_intact: true, memory_prepared: true } }, before = JSON.stringify(state);
    const original = cityMap(state), displayed = mapDisplayRows(state);
    assert.deepEqual(displayed.map(r => r.id).sort(), original.map(r => r.id).sort());
    assert.deepEqual(displayed.flatMap(r => r.choices).map(c => c.id).sort(), original.flatMap(r => r.choices).map(c => c.id).sort());
    const current = displayed.find(r => r.current); if (current) assert.equal(displayed[0], current);
    assert.equal(JSON.stringify(state), before);
  }
});
it("gives every known inventory item a distinct independent inspection and retains atlas ownership/condition thumbnails", () => {
  const paths = new Set<string>();
  for (const id of Object.keys(ITEMS)) {
    const art = inventoryArt(id)!; assert.equal(art.tile, undefined); assert.match(art.src, /^\/art\/item-[a-z-]+\.jpg$/); assert.equal(paths.has(art.src), false); paths.add(art.src);
    assert.equal(inventoryThumbnailArt(id)?.src, "/art/equipment-atlas.jpg");
  }
  assert.equal(paths.size, 14); assert.equal(inventoryThumbnailArt("shard", true)?.tile, 14);
  assert.equal(inventoryArt("shard", true)?.src, "/art/item-shard-damaged.jpg");
  for (const id of ["__proto__", "constructor", "missing"]) assert.equal(inventoryArt(id), undefined);
});
it("pairs the shelter, service review and quiet cup with the actual authored people without changing quotation or conduct", () => {
  for (const [sceneId, name, actors] of [
    ["act2_shelter_brief", "shelter-conversation", ["Sera", "Ren"]],
    ["act2_spire_sources", "edda-service-review", ["Edda"]],
    ["act2_lumen_quiet", "lumen-cup", ["Sister Lumen"]],
  ] as const) {
    const scene = getScene(sceneId), state = { ...base, sceneId }, art = sceneIllustration(sceneId)!;
    assert.equal(art.src, `/art/${name}.jpg`); assert.equal(paintedActor(art, scene.speaker), true);
    assert.deepEqual([...new Set(visibleCampaignDialogue(sceneId, scene.speaker, sceneText(scene, state)).map(l => l.speaker))], actors);
  }
  assert.equal(portraitArt("Sister Lumen", "act2_lumen_quiet", { betrayed_lumen: true }), "/art/lumen-guarded.jpg");
  assert.equal(sceneIllustration("act2_shelter_result")?.src, "/art/shelter-landing.jpg");
  assert.equal(sceneIllustration("act2_spire_receipt")?.src, "/art/spire-counter.jpg");
  assert.equal(sceneIllustration("act3_lumen_boundary")?.src, "/art/ordinary-rest.jpg");
});
it("hashes all new paintings, references and tiny derivatives while preserving exact voice bindings", () => {
  const sha = (p: string) => createHash("sha256").update(readFileSync(p)).digest("hex");
  assert.equal(phase.assets.length, 14); assert.equal(sha("qa/media/campaign-dialogue-bindings.json"), phase.bindingSha256);
  for (const asset of phase.assets) {
    for (const f of asset.files) { assert.equal(reviewedDeliveryHash(f.path, f.sha256), f.sha256); assert.ok(f.bytes < 1048576); }
    for (const r of asset.references) assert.equal(sha(r.path), r.sha256);
  }
  assert.deepEqual(ART_PREVIEWS, previews.images);
  for (const f of previews.files) { assert.equal(sha(f.path), f.sha256); assert.equal(sha(f.source), f.sourceSha256); assert.ok(f.bytes < 8192); }
  for (const id of Object.keys(ITEMS)) assert.ok(Object.hasOwn(previews.images, inventoryArt(id)!.src));
  for (const row of phase.scenes) assert.ok(Object.hasOwn(previews.images, sceneIllustration(row.sceneId)!.src));
});

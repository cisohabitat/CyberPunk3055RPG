import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { it } from "node:test";
import provenance from "../qa/media/art-provenance.json";
import decisions from "../qa/media/scene-art.json";
import { SCENES } from "./story";
import { portraitArt, sceneIllustration, SOURCE_ART, TITLE_ART } from "./art";
import { auditSceneArt } from "./scene-art";

it("ships documented generated images without corrupting or enlarging their encoded files", () => {
  assert.ok(provenance.assets.length > 0);
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
  for (const id of Object.keys(SCENES)) {
    const art = sceneIllustration(id);
    if (art) for (const path of [art.src, art.small]) assert.ok(paths.has(`public${path}`), `Missing generated illustration provenance: ${id} ${path}`);
  }
  for (const path of [TITLE_ART.src, TITLE_ART.small]) assert.ok(paths.has(`public${path}`), `Missing title art provenance: ${path}`);
  for (const art of Object.values(SOURCE_ART)) for (const path of [art.src, art.small]) assert.ok(paths.has(`public${path}`), `Missing source art provenance: ${path}`);
  for (const id of ["memory_assurance", "memory_publication"]) assert.ok(paths.has(`public${portraitArt(SCENES[id].speaker, id)}`));
});

it("every scene has an explicit art decision matching delivered artwork", () => {
  const catalog = auditSceneArt(SCENES);
  assert.deepEqual(Object.keys(catalog).sort(), Object.keys(SCENES).sort());
  for (const [id, decision] of Object.entries(catalog)) {
    const art = sceneIllustration(id);
    for (const asset of [decision.asset, art?.small].filter((asset): asset is string => Boolean(asset))) {
      assert.ok(readFileSync(new URL(`../public${asset}`, import.meta.url)).length, asset);
    }
  }
});

it("new, removed and multiply assigned scenes cannot silently inherit an art decision", () => {
  assert.throws(() => auditSceneArt({ ...SCENES, new_scene: { ...SCENES.stall, id: "new_scene" } }), /Missing scene art decision: new_scene/);
  const { opening_city: _removed, ...remaining } = SCENES;
  assert.throws(() => auditSceneArt(remaining), /Unknown scene art decision: opening_city/);
  const duplicate = structuredClone(decisions);
  duplicate.decisions.push(duplicate.decisions[0]);
  assert.throws(() => auditSceneArt(SCENES, duplicate), /Duplicate scene art decision: opening_city/);
});

it("art decisions require a rationale and the art actually used by the scene", () => {
  assert.throws(() => auditSceneArt(SCENES, { version: 2, decisions: [] }), /Invalid scene art manifest/);
  const noReason = structuredClone(decisions); noReason.decisions[0].reason = "";
  assert.throws(() => auditSceneArt(SCENES, noReason), /rationale/);
  const wrongAsset = structuredClone(decisions); wrongAsset.decisions[0].asset = "/art/freight.jpg";
  assert.throws(() => auditSceneArt(SCENES, wrongAsset), /disagrees with rendered art: opening_city/);
  const omittedPlate = structuredClone(decisions); omittedPlate.decisions[0].treatment = "text"; delete omittedPlate.decisions[0].asset;
  assert.throws(() => auditSceneArt(SCENES, omittedPlate), /disagrees with rendered art: opening_city/);
  const portraitMismatch = { ...SCENES, act2_spire_result: { ...SCENES.act2_spire_result, speaker: "Asa" } };
  assert.throws(() => auditSceneArt(portraitMismatch), /disagrees with rendered art: act2_spire_result/);
});

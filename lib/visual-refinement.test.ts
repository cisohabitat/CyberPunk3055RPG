import assert from "node:assert/strict";
import { it } from "node:test";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { createCharacter, commitChoice, getScene, presentChoices, sceneText, stageCheck } from "./engine";
import { resourceChanges } from "./resource-changes";
import { inventoryArt, inventoryThumbnailArt } from "./inventory-art";
import { MAP_LANDMARKS, cityMap } from "./city-map";
import { sceneIllustration } from "./art";
import { visibleCampaignDialogue } from "./campaign-dialogue";
import phase from "../qa/media/visual-refinement.json";
const base = createCharacter({ handle: "Review", givenName: "Jo", origin: "gutterwire", bonus: { chrome: 0, nerve: 2, face: 0, ghost: 0 } });
it("derives resource receipts from committed capped values, never previews or staged dice", () => {
  const before = { ...base, sceneId: "stall", factions: { ...base.factions, quill: 5 } };
  const choice = presentChoices(before, getScene(before.sceneId)).find(c => c.id === "accept")!;
  const after = commitChoice(before, choice).state;
  assert.deepEqual(resourceChanges(before, after), { creds: after.creds - before.creds });
  const pending = { ...base, sceneId: "lumen_deal" };
  assert.deepEqual(resourceChanges(pending, stageCheck(pending, "fake-pact", 1)), {});
  assert.deepEqual(resourceChanges(base, { ...base, strain: 1, creds: base.creds - 20, factions: { ...base.factions, wards: -1 } }), { strain: 1, creds: -20, wards: -1 - base.factions.wards });
});
it("loads dedicated inspection paintings for key equipment while retaining every thumbnail and condition", () => {
  for (const [id, damaged, filename] of [["shard", false, "item-shard"], ["shard", true, "item-shard-damaged"], ["archive-probe", false, "item-archive-probe"], ["witness-token", false, "item-witness-token"]] as const) {
    assert.equal(inventoryArt(id, damaged)?.src, `/art/${filename}.jpg`); assert.equal(inventoryArt(id, damaged)?.tile, undefined);
    assert.equal(inventoryThumbnailArt(id, damaged)?.src, "/art/equipment-atlas.jpg");
  }
  assert.notEqual(inventoryArt("shard")?.src, inventoryArt("shard", true)?.src);
  for (const id of ["__proto__", "constructor", "missing"]) assert.equal(inventoryArt(id), undefined);
  assert.equal(inventoryArt("mono-knife")?.tile, 10);
});
it("adds landmarks only to the already-known place registry without adding positions or future destinations", () => {
  for (const row of cityMap(base)) assert.ok(Object.hasOwn(MAP_LANDMARKS, row.id));
  assert.deepEqual(cityMap({ ...base, sceneId: "opening_city" }).map(row => row.id), ["market"]);
  for (const landmark of Object.values(MAP_LANDMARKS)) assert.ok(readFileSync(`public${landmark.src}`).length);
});
it("depicts Mara and Lumen together only while the authored pact puts Lumen at the plinth", () => {
  for (const pact of ["pact_copy", "pact_break", "pact_fake"]) {
    const state = { ...base, sceneId: "vault_quiet", flags: { lumen_here: true, [pact]: true } };
    assert.equal(sceneIllustration(state.sceneId, state.flags)?.src, "/art/chapel-shared.jpg");
    assert.match(sceneText(getScene(state.sceneId), state), /Lumen/);
    assert.deepEqual(visibleCampaignDialogue(state.sceneId, "Mara", sceneText(getScene(state.sceneId), state)).map(l => l.speaker), pact === "pact_fake" ? [] : ["Sister Lumen"]);
  }
  for (const flags of [{}, { pact_copy: true }, { lumen_here: true }, { lumen_here: true, pact_copy: true, pact_sell: true }]) assert.notEqual(sceneIllustration("vault_quiet", flags)?.src, "/art/chapel-shared.jpg");
});
it("depicts Ives waiting with Sera only when both arrival prose branches place them there", () => {
  for (const returned of [false, true]) {
    const state = { ...base, sceneId: "act3_arrival", flags: { on_file: true, act2_deal: true, response_visit: returned } };
    const text = sceneText(getScene(state.sceneId), state);
    assert.match(text, /Ives/); assert.match(text, /Sera/);
    assert.equal(sceneIllustration(state.sceneId, state.flags)?.src, "/art/wall-shared.jpg");
  }
  for (const flags of [{}, { on_file: true }, { act2_deal: true }]) assert.notEqual(sceneIllustration("act3_arrival", flags)?.src, "/art/wall-shared.jpg");
  assert.equal(sceneIllustration("act3_arrival", { on_file: true, act2_deal: true, testimony_done: true, testimony_published: true })?.src, "/art/hearing-filed.jpg");
});
it("retains exact dialogue and reference bytes and records every new delivery", () => {
  const sha = (path: string) => createHash("sha256").update(readFileSync(path)).digest("hex");
  assert.equal(sha("qa/media/campaign-dialogue-bindings.json"), phase.bindingSha256);
  assert.equal(phase.assets.length, 6);
  for (const asset of phase.assets) {
    for (const f of asset.files) { assert.equal(sha(f.path), f.sha256); assert.equal(readFileSync(f.path).length, f.bytes); assert.ok(f.bytes < 1048576); }
    for (const ref of asset.references) assert.equal(sha(ref.path), ref.sha256);
  }
});

import assert from "node:assert/strict";
import { it } from "node:test";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { ITEMS } from "./items";
import { inventoryArt } from "./inventory-art";
import { ILLUSTRATION_STAGING, paintedActor, sceneIllustration } from "./art";
import { createCharacter, commitChoice, getScene, presentChoices } from "./engine";
import type { GameState } from "./types";
import phase from "../qa/media/visual-library.json";
const sha = (p: string) => createHash("sha256").update(readFileSync(p)).digest("hex");
const base = createCharacter({ handle: "ArtReview", givenName: "Jo", origin: "gutterwire", bonus: { chrome: 0, nerve: 2, face: 0, ghost: 0 } });
const choose = (s: GameState, id: string) => {
  const c = presentChoices(s, getScene(s.sceneId)).find(c => c.id === id && c.enabled); assert.ok(c, id);
  return commitChoice(s, c).state;
};
it("illustrates every known owned item with a distinct atlas cell and preserves damaged shard meaning", () => {
  const tiles = Object.keys(ITEMS).map(id => { const art = inventoryArt(id)!; assert.ok(art.description.length > 20); return art.tile; });
  assert.equal(tiles.length, 14); assert.equal(new Set(tiles).size, tiles.length);
  assert.equal(inventoryArt("shard", true)?.tile, 14); assert.equal(inventoryArt("shard")?.tile, 12);
  for (const id of Object.keys(ITEMS).filter(id => id !== "shard")) assert.deepEqual(inventoryArt(id, true), inventoryArt(id));
  for (const id of ["__proto__", "constructor", "toString", "not-owned"]) assert.equal(inventoryArt(id), undefined);
});
it("shows the shared hour only after an actual stay, for either dispatch choice", () => {
  const invited = { ...base, sceneId: "act2_mara_company", flags: { response_private_consent: true } };
  assert.notEqual(sceneIllustration(invited.sceneId, invited.flags)?.src, "/art/mara-shared-hour.jpg");
  for (const id of ["stay-with-mara-courier", "stay-with-mara-wait"]) {
    const stayed = choose(invited, id); assert.equal(sceneIllustration(stayed.sceneId, stayed.flags)?.src, "/art/mara-shared-hour.jpg");
    assert.equal(stayed.flags.response_received, undefined); assert.equal(stayed.flags.response_public_consent, undefined);
    for (const flag of ["mara_company_declined", "mara_company_left"]) assert.notEqual(sceneIllustration(stayed.sceneId, { ...stayed.flags, [flag]: true })?.src, "/art/mara-shared-hour.jpg");
  }
  for (const id of ["carry-reply-leave-mara", "decline-mara-company"]) { const left = choose(invited, id); assert.notEqual(sceneIllustration(left.sceneId, left.flags)?.src, "/art/mara-shared-hour.jpg"); }
  for (const flags of [{}, { mara_company_chosen: true }, { mara_company_courier: true }]) assert.notEqual(sceneIllustration("act2_mara_company_kept", flags)?.src, "/art/mara-shared-hour.jpg");
});
it("separates agreed source custody from key authentication, public permission and employer risk", () => {
  const custody = { ...base, sceneId: "act2_archive_custody", flags: { archive_briefed: true } };
  for (const id of ["withhold-technician", "ask-named-source"]) {
    const agreed = choose(custody, id), returned = { ...agreed, sceneId: "act3_edda_visit" };
    assert.equal(sceneIllustration(returned.sceneId, returned.flags)?.src, "/art/archive-held-original.jpg");
    assert.equal(returned.flags.archive_key_authenticated, undefined);
    assert.equal(returned.flags.edda_public_consent, id === "ask-named-source" ? true : undefined);
  }
  for (const flags of [{}, { archive_key_authenticated: true }, { edda_public_consent: true }, { order_verified: true }]) assert.notEqual(sceneIllustration("act3_edda_visit", flags)?.src, "/art/archive-held-original.jpg");
  assert.notEqual(sceneIllustration("act2_archive_custody", { archive_custody: true })?.src, "/art/archive-held-original.jpg");
});
it("retains reviewed prior variants and hashes every new delivery and reference without changing dialogue", () => {
  assert.deepEqual(phase.previousIllustrationVariants, ILLUSTRATION_STAGING.slice(0, 3));
  assert.deepEqual(phase.illustrationVariants, ILLUSTRATION_STAGING);
  assert.equal(sha("qa/media/campaign-dialogue-bindings.json"), phase.bindingSha256);
  for (const asset of phase.assets) {
    for (const file of asset.files) { assert.equal(sha(file.path), file.sha256); assert.ok(file.bytes < 1048576); }
    for (const ref of asset.references) assert.equal(sha(ref.path), ref.sha256);
  }
  assert.equal(paintedActor(sceneIllustration("act2_archive_brief"), "Edda"), true);
  assert.equal(paintedActor(sceneIllustration("act2_archive_brief"), "Mara"), false);
  assert.equal(paintedActor(sceneIllustration("hatch"), "Masked attendant"), false);
});

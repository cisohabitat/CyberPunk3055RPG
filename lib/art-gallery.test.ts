import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";
import { it } from "node:test";
import { filterGallery, GALLERY_ART, GALLERY_CATEGORIES } from "./art-gallery";

it("the gallery covers every primary image once and pairs only the same image's smaller delivery", () => {
  const root = new URL("../public/art/", import.meta.url);
  const files = readdirSync(root).filter(file => /\.(jpg|webp|png)$/.test(file) && !/-small\./.test(file)).map(file => `/art/${file}`).sort();
  assert.deepEqual(GALLERY_ART.map(art => art.src).sort(), files);
  assert.equal(new Set(GALLERY_ART.map(art => art.src)).size, files.length);
  for (const art of GALLERY_ART) {
    assert.ok(GALLERY_CATEGORIES.some(category => category === art.category), art.src);
    assert.ok(art.caption.trim() && art.description.trim(), art.src);
    assert.ok(Number.isInteger(art.width) && art.width > 0 && Number.isInteger(art.height) && art.height > 0, art.src);
    const small = art.src.replace(/(\.[^.]+)$/, "-small$1");
    assert.equal(art.small, existsSync(new URL(`../public${small}`, import.meta.url)) ? small : art.src);
  }
});

it("gallery search combines words and category without mutating the full catalog", () => {
  assert.equal(filterGallery("All artwork", " ").length, GALLERY_ART.length);
  const portraits = filterGallery("Characters", "  MARA portrait ");
  assert.ok(portraits.length > 0);
  assert.ok(portraits.every(art => art.category === "Characters" && /mara/i.test(art.description)));
  assert.equal(filterGallery("All artwork", "not-a-real-artwork").length, 0);
  assert.ok(filterGallery("All artwork", "Mara").some(art => art.src === "/art/mara-account.jpg"));
});

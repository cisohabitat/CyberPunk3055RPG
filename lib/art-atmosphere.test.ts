import assert from "node:assert/strict";
import { it } from "node:test";
import { ART_ATMOSPHERES, artAtmosphere } from "./art-atmosphere";
import { SCENES } from "./story";
import { sceneIllustration } from "./art";
it("limits atmospheric motion to the four reviewed setting paintings", () => {
  assert.deepEqual(Object.keys(ART_ATMOSPHERES), ["/art/opening.jpg", "/art/canal-dispatch.jpg", "/art/incinerator-flue.jpg", "/art/held-case.jpg"]);
  const used = new Set(Object.keys(SCENES).map(id => sceneIllustration(id)?.src));
  for (const [src, effect] of Object.entries(ART_ATMOSPHERES)) { assert.equal(used.has(src), true); assert.equal(artAtmosphere(src), effect); }
  assert.equal(artAtmosphere("/art/attendant-confrontation.jpg"), undefined);
  assert.equal(artAtmosphere("__proto__"), undefined);
});

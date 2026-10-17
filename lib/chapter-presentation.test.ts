import assert from "node:assert/strict";
import { it } from "node:test";
import { chapterPresentation, CHAPTER_PRESENTATIONS } from "./chapter-presentation";
import { createCharacter } from "./engine";
import { actName } from "./story/goal";
import { SCENES } from "./story";
it("presents exactly the three chapter entrances using their actual act names", () => {
  assert.deepEqual(Object.keys(CHAPTER_PRESENTATIONS), ["opening_city", "card_week", "card_wall"]);
  const base = createCharacter({ handle: "Review", givenName: "Jo", origin: "gutterwire", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 } });
  for (const [id, chapter] of Object.entries(CHAPTER_PRESENTATIONS)) {
    const state = { ...base, sceneId: id }, before = JSON.stringify(state);
    assert.ok(SCENES[id]); assert.equal(chapter.title, actName(state));
    assert.equal(chapterPresentation(id), chapter); assert.equal(JSON.stringify(state), before);
  }
});
it("keeps ordinary scenes and untrusted property names outside chapter presentation", () => {
  for (const id of [...Object.keys(SCENES).filter(id => !Object.hasOwn(CHAPTER_PRESENTATIONS, id)), "toString", "constructor", "__proto__", "unknown"]) assert.equal(chapterPresentation(id), undefined);
});

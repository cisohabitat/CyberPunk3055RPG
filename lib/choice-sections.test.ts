import assert from "node:assert/strict";
import { it } from "node:test";
import { CHOICE_SECTIONS, choiceSection } from "./choice-sections";
import { SCENES } from "./story";
it("keeps reviewed choice sections complete, contiguous and in canonical order", () => {
  for (const [scene, sections] of Object.entries(CHOICE_SECTIONS)) {
    const ids = sections.flatMap(section => section.choices);
    assert.deepEqual(ids, SCENES[scene].choices.map(choice => choice.id));
    assert.equal(new Set(ids).size, ids.length);
    for (const section of sections) for (const id of section.choices) assert.equal(choiceSection(scene, id), section.title);
  }
  assert.equal(choiceSection("__proto__", "x"), undefined);
  assert.equal(choiceSection("stall", "unknown"), undefined);
});

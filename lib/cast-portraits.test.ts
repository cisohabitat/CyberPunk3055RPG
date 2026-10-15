import { reviewedDeliveryHash } from "../qa/production/delivery-history";
import assert from "node:assert/strict";
import { it } from "node:test";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import phase from "../qa/media/cast-portraits.json";
import { CAST, encounteredCast, metCast } from "./story/cast";
import { createCharacter, commitChoice, getScene, sceneText, stageCheck } from "./engine";
import { parseSave } from "./storage";
import { CAST_PORTRAIT_VARIANTS, PORTRAIT_ART, portraitArt } from "./art";
import { visibleCampaignDialogue } from "./campaign-dialogue";
import { dialogueExamples } from "../qa/production/dialogue-examples";
const base = createCharacter({ handle: "Cast review", givenName: "Jo", origin: "dustline", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 } });

it("covers every portrait identity exactly once with a small, documented character card", () => {
  assert.equal(CAST.length, 15);
  assert.equal(new Set(CAST.map(person => person.metFlag)).size, 15);
  assert.deepEqual(CAST.map(person => person.speaker).sort(), Object.keys(PORTRAIT_ART).sort());
  assert.deepEqual(phase.characters.map(person => person.speaker).sort(), Object.keys(PORTRAIT_ART).sort());
  for (const person of CAST) {
    const row = phase.characters.find(row => row.speaker === person.speaker)!;
    assert.equal(row.thumbnail, person.thumbnail);
    assert.equal(row.basePortrait, PORTRAIT_ART[person.speaker]);
    const bytes = readFileSync(new URL(`../public${person.thumbnail}`, import.meta.url));
    assert.ok(bytes.length < 25_000, person.thumbnail);
    assert.ok(row.direction.length > 30);
  }
});

it("keeps every pre-existing art file and every voice delivery unchanged", () => {
  for (const file of phase.preservedMedia) {
    const bytes = readFileSync(new URL(`../${file.path}`, import.meta.url));
    assert.equal(reviewedDeliveryHash(file.path, file.sha256), file.sha256, file.path);
  }
});

it("uses the new expressions only for their explicit actor and scene, preserving earned outcomes", () => {
  assert.deepEqual(phase.portraits, CAST_PORTRAIT_VARIANTS);
  for (const row of CAST_PORTRAIT_VARIANTS) for (const scene of row.scenes) {
    assert.equal(portraitArt(row.speaker, scene), row.asset);
    assert.notEqual(portraitArt("Quill", scene), row.asset);
    assert.equal(portraitArt(row.speaker, "unknown"), PORTRAIT_ART[row.speaker]);
  }
  assert.equal(portraitArt("Ren", "act2_shelter_brief"), "/art/ren-concerned.jpg");
  assert.equal(portraitArt("Edda", "act3_edda_reply", { edda_shift_pending: true }), "/art/edda.jpg");
  assert.equal(portraitArt("Edda", "act3_edda_reply", { edda_shift_paid: true }), "/art/edda-assignment.jpg");
});

it("introduces actual secondary speakers without revealing the rest of the cast", () => {
  const scene = getScene("opening_approach"), state = { ...base, sceneId: scene.id };
  assert.deepEqual(metCast(state, scene.speaker).map(person => person.name), ["Quill"]);
  assert.ok(metCast(state, scene.speaker, sceneText(scene, state)).some(person => person.speaker === "Stallholder"));
  assert.ok(!metCast(state, scene.speaker, sceneText(scene, state)).some(person => person.speaker === "Mara"));
  assert.deepEqual(encounteredCast(scene.id, scene.speaker, "An uncast written notice mentions a mechanic."), []);
  const next = commitChoice(state, scene.choices.find(choice => choice.id === "meet-quill")!).state;
  assert.equal(next.flags.met_stallholder, true);
  assert.ok(metCast(parseSave(JSON.stringify(next))!).some(person => person.speaker === "Stallholder"));
  assert.equal(next.creds, state.creds); assert.equal(next.strain, state.strain);
});

it("retains recorded dice while consulting cards and derives all actual voiced actor identities", () => {
  const state = { ...base, sceneId: "front", items: [...base.items, "counterfeit-pass"] };
  const held = stageCheck(state, "bluff-door", 4), before = JSON.stringify(held);
  metCast(held, "Orderly", sceneText(getScene("front"), held));
  assert.equal(JSON.stringify(held), before);
  assert.deepEqual(parseSave(JSON.stringify(held))!.pendingCheck, held.pendingCheck);
  for (const { state } of dialogueExamples().values()) {
    const scene = getScene(state.sceneId), text = sceneText(scene, state);
    const present = encounteredCast(scene.id, scene.speaker, text).map(person => person.speaker);
    for (const line of visibleCampaignDialogue(scene.id, scene.speaker, text)) assert.ok(present.includes(line.speaker), `${scene.id}: ${line.speaker}`);
  }
});

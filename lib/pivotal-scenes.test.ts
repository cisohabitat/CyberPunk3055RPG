import assert from "node:assert/strict";
import { it } from "node:test";
import { createHash } from "node:crypto";
import { createCharacter, getScene, sceneText } from "./engine";
import { SCENES } from "./story";
import { sceneIllustration } from "./art";
import { visibleCampaignDialogue } from "./campaign-dialogue";
import { PIVOTAL_SCENES, pivotalScene } from "./pivotal-scenes";
import phase from "../qa/media/pivotal-scenes.json";
import art from "../qa/media/scene-art.json";

it("pairs each pivotal frame with its reviewed canonical words, actual actor and explicit art decision", () => {
  const base = createCharacter({ handle: "Stage review", givenName: "Jo", origin: "gutterwire", bonus: { chrome: 0, nerve: 2, face: 0, ghost: 0 } });
  assert.deepEqual(Object.keys(PIVOTAL_SCENES).sort(), phase.scenes.map(row => row.sceneId).sort());
  for (const row of phase.scenes) {
    const state = { ...base, sceneId: row.sceneId }, before = JSON.stringify(state), scene = getScene(row.sceneId);
    const text = sceneText(scene, state);
    assert.deepEqual(pivotalScene(row.sceneId), { label: row.label, kind: row.kind });
    assert.equal(createHash("sha256").update(text).digest("hex"), row.textSha256);
    assert.deepEqual(visibleCampaignDialogue(scene.id, scene.speaker, text).map(({ key, id, speaker, text }) => ({ key, id, speaker, text })), row.dialogue);
    assert.equal(sceneIllustration(scene.id, state.flags)!.src, row.illustration);
    const decision = art.decisions.find(decision => decision.scenes.includes(scene.id));
    assert.ok(decision && decision.reason.includes("pivotal frame"));
    assert.ok(row.artDecision.length > 100);
    assert.equal(JSON.stringify(state), before);
  }
});

it("keeps recording and live conversation distinct without framing other or unknown scenes", () => {
  for (const id of Object.keys(SCENES).filter(id => !phase.scenes.some(row => row.sceneId === id))) assert.equal(pivotalScene(id), undefined, id);
  for (const id of ["unknown", "toString", "constructor", "__proto__"]) assert.equal(pivotalScene(id), undefined);
  for (const id of ["memo", "mara_why"]) assert.equal(pivotalScene(id)!.kind, "recording");
  for (const id of ["act2_witness_brief", "act2_witness_support", "act2_witness_arrival"]) assert.equal(pivotalScene(id)!.kind, "conversation");
});

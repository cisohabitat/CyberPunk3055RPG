import assert from "node:assert/strict";
import { it } from "node:test";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { FINALE_SCENES, finaleScene, finalePersonalEcho } from "./finale-direction";
import { sceneText, getScene, createCharacter } from "./engine";
import { sceneIllustration } from "./art";
import { visibleCampaignDialogue } from "./campaign-dialogue";
import { replayCampaign } from "./story-replay";
import { routeCheckpoint } from "../qa/production/route-checkpoint";
import phase from "../qa/media/finale-direction.json";
import art from "../qa/media/scene-art.json";

const hash = (text: string) => createHash("sha256").update(text).digest("hex");
it("directs precisely the four finales with unchanged canonical prose, paintings and exact actors/quotes", () => {
  assert.deepEqual(Object.keys(FINALE_SCENES).sort(), phase.scenes.map(row => row.sceneId).sort());
  for (const row of phase.scenes) {
    const state = routeCheckpoint(row.route, row.sceneId), scene = getScene(row.sceneId), text = sceneText(scene, state);
    assert.equal(scene.finale, true);
    assert.deepEqual(finaleScene(row.sceneId), { label: row.label, kind: row.kind });
    assert.equal(hash(text), row.textSha256);
    assert.equal(sceneIllustration(row.sceneId, state.flags)!.src, row.illustration);
    assert.deepEqual(visibleCampaignDialogue(scene.id, scene.speaker, text).map(({ key, id, speaker, text }) => ({ key, id, speaker, text })), row.dialogue);
    assert.match(art.decisions.find(decision => decision.scenes.includes(scene.id))!.reason, /Finale direction/);
  }
  for (const id of ["memo", "ending_sold", "unknown", "toString", "__proto__", "constructor"]) assert.equal(finaleScene(id), undefined);
});
it("preserves every authored route's exact final state, canonical prose and visible dialogue", () => {
  const rows = readdirSync("qa/routes").sort().filter(file => file.endsWith(".json")).map(file => {
    const state = replayCampaign(JSON.parse(readFileSync(`qa/routes/${file}`, "utf8"))).state, scene = getScene(state.sceneId);
    return { file, state, text: sceneText(scene, state), voice: visibleCampaignDialogue(scene.id, scene.speaker, sceneText(scene, state)) };
  });
  // Keep the original 147-route contract byte-for-byte. The later funded
  // checkpoint campaign has its own replay expectations and balance checks.
  const additions = ["funded-checkpoint-room.json"];
  assert.equal(rows.length, phase.routeContract.count + additions.length);
  for (const file of additions) assert.ok(rows.some(row => row.file === file));
  const preserved = rows.filter(row => !additions.includes(row.file));
  assert.equal(preserved.length, phase.routeContract.count);
  assert.equal(hash(JSON.stringify(preserved)), phase.routeContract.sha256);
});
it("only recalls earned personal answers and retains a contact pause over a stale relay", () => {
  const base = { ...createCharacter({ handle: "Echo", givenName: "Ada", origin: "spire", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 } }), sceneId: "ending_quiet" };
  assert.equal(finalePersonalEcho(base), undefined);
  assert.equal(finalePersonalEcho({ ...base, flags: { kerr_question_done: true } }), undefined);
  const kerr = { ...base, flags: { kerr_question_done: true }, journal: [{ id: "kerr-personal-answer", text: "His attributed hope." }] };
  const before = JSON.stringify(kerr); assert.match(finalePersonalEcho(kerr)!, /not seen the brace fitted/); assert.equal(JSON.stringify(kerr), before);
  const nia = { ...base, flags: { nia_contact_set: true, nia_contact_relay: true, nia_contact_paused: true }, journal: [{ id: "nia-contact", text: "Pause agreed." }] };
  assert.match(finalePersonalEcho(nia)!, /does not reopen/); assert.doesNotMatch(finalePersonalEcho(nia)!, /carry another question/);
  assert.equal(finalePersonalEcho({ ...nia, sceneId: "act3_arrival" }), undefined);
});

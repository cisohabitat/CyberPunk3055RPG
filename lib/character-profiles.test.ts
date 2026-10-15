import assert from "node:assert/strict";
import { it } from "node:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { CHARACTER_PROFILES, characterProfile } from "./character-profiles";
import { CAST } from "./story/cast";
import { commitChoice, createCharacter, getScene, presentChoices, sceneText, stageCheck } from "./engine";
import { parseSave } from "./storage";
import { replayCampaign, type ReplaySpec } from "./story-replay";
import type { GameState } from "./types";
import phase from "../qa/media/character-profiles.json";

const base = createCharacter({ handle: "Profile review", givenName: "Jo", origin: "spire", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 } });
const advance = (state: GameState, id: string) => {
  const choice = presentChoices(state, getScene(state.sceneId)).find(choice => choice.id === id && choice.enabled);
  assert.ok(choice, `${state.sceneId}/${id}`);
  return commitChoice(state, choice).state;
};

it("documents neutral enlarged art for every identity and preserves every preceding art/audio delivery", () => {
  assert.deepEqual(Object.keys(CHARACTER_PROFILES).sort(), CAST.map(person => person.speaker).sort());
  assert.deepEqual(phase.characters.map(person => person.speaker).sort(), CAST.map(person => person.speaker).sort());
  for (const person of CAST) {
    const state = { ...base, flags: { [person.metFlag]: true } };
    const profile = characterProfile(state, person.speaker)!;
    const row = phase.characters.find(row => row.speaker === person.speaker)!;
    assert.equal(profile.portrait, row.portrait);
    assert.notEqual(profile.portrait, person.thumbnail);
    assert.ok(profile.introduction.length > 60);
    assert.ok(row.artDecision.length > 60);
  }
  for (const file of phase.preservedMedia) {
    assert.equal(createHash("sha256").update(readFileSync(new URL(`../${file.path}`, import.meta.url))).digest("hex"), file.sha256, file.path);
  }
});

it("hides unknown profiles and honors actual paragraph revelation of supporting speakers", () => {
  assert.ok(characterProfile(base, "Quill"));
  for (const person of CAST.filter(person => person.speaker !== "Quill")) assert.equal(characterProfile(base, person.speaker), undefined);
  const state = { ...base, sceneId: "opening_approach" }, scene = getScene(state.sceneId);
  assert.equal(characterProfile(state, "Stallholder", scene.speaker, sceneText(scene, state).split("\n\n")[0]), undefined);
  assert.ok(characterProfile(state, "Stallholder", scene.speaker, sceneText(scene, state)));
  assert.equal(characterProfile(state, "Mara", scene.speaker, sceneText(scene, state)), undefined);
  assert.equal(characterProfile(base, "Unknown"), undefined);
});

it("does not invent biography from legacy outcome flags or change held dice while consulting notes", () => {
  const held = stageCheck({ ...base, sceneId: "front", items: [...base.items, "counterfeit-pass"], flags: { met_edda: true, edda_shift_paid: true, witness_safe: true } }, "bluff-door", 4);
  const before = JSON.stringify(held);
  assert.deepEqual(characterProfile(held, "Edda")!.notes, []);
  assert.equal(characterProfile(held, "Nia Pell"), undefined);
  assert.equal(JSON.stringify(held), before);
  assert.deepEqual(parseSave(before)!.pendingCheck, held.pendingCheck);
});

it("keeps Mara's chosen company, private dispatch and hoped-for morning in their original journal terms", () => {
  let state: GameState = { ...base, sceneId: "act2_mara_quiet", flags: { met_mara: true, response_private_consent: true } };
  state = advance(state, "share-mara-window");
  state = advance(state, "stay-with-mara-wait");
  state = advance(state, "keep-mara-shared-hour");
  const before = JSON.stringify(state), profile = characterProfile(state, "Mara")!;
  assert.deepEqual(profile.notes, state.journal);
  assert.equal(profile.notes.find(entry => entry.id === "mara-tomorrow")!.kind, "claim");
  assert.match(profile.notes.find(entry => entry.id === "mara-window-choice")!.text, /missed.*intake batch.*no.*receipt/is);
  assert.ok(!profile.notes.some(entry => entry.id === "mara-response-intake"));
  profile.notes[0].text = "Changed outside the save";
  assert.equal(JSON.stringify(state), before);
});

it("retains actual Edda and Nia outcome qualifications from complete authored campaign records", () => {
  for (const file of ["shift-key.json", "shift-representative.json", "balance-gutterwire-nerve-equipped.json"]) {
    const spec = JSON.parse(readFileSync(new URL(`../qa/routes/${file}`, import.meta.url), "utf8")) as ReplaySpec;
    const { state } = replayCampaign(spec);
    for (const actor of ["Edda", "Nia Pell"]) {
      const profile = characterProfile(state, actor);
      if (!profile) continue;
      for (const note of profile.notes) assert.deepEqual(note, state.journal.find(entry => entry.id === note.id));
    }
    assert.equal(parseSave(JSON.stringify(state))!.sceneId, state.sceneId);
  }
});

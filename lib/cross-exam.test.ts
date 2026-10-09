import assert from "node:assert/strict";
import { it } from "node:test";
import { createCharacter, commitChoice, getScene, presentChoices } from "./engine";
import { aftermath } from "./evidence";
import { exportRun, importRun } from "./vault";
import type { GameState } from "./types";
const base = (): GameState => ({ ...createCharacter({ handle: "Examiner", givenName: "Ada", origin: "spire", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 } }), sceneId: "memory_reconstruction" });
const step = (state: GameState, id: string) => commitChoice(state, getScene(state.sceneId).choices.find((choice) => choice.id === id)!).state;
it("attributes both answers across reload without creating proof, consent or absolution", () => {
  let state = step(base(), "question-mara");
  for (const id of ["ask-evacuation-assurance", "record-assurance-limit", "ask-command-contact", "record-channel-limit", "close-cross-exam"]) state = importRun(exportRun(step(state, id)));
  assert.equal(state.sceneId, "memory_reconstruction");
  assert.equal(state.flags.order_verified, undefined);
  assert.equal(state.flags.witness_consent, undefined);
  assert.ok(state.journal.every((entry) => entry.kind === "claim"));
  assert.match(aftermath(state).find((row) => row.title === "Mara’s answers")!.text, /did not erase her authorization/);
  assert.equal(presentChoices(state, getScene(state.sceneId)).some((choice) => choice.id === "question-mara"), false);
});
it("allows leaving questions unfinished and keeps the old direct interpretation", () => {
  const original = step(base(), "separate-decisions");
  const early = step(step(step(base(), "question-mara"), "close-cross-exam"), "separate-decisions");
  assert.equal(original.sceneId, "memory_publication");
  assert.equal(early.sceneId, original.sceneId);
  assert.equal(early.flags.memory_assurance_heard, undefined);
  assert.equal(early.journal.some((entry) => entry.id === "mara-assurance"), false);
});

import assert from "node:assert/strict";
import { it } from "node:test";
import { createCharacter, commitChoice, getScene, presentChoices } from "./engine";
import { aftermath } from "./evidence";
import { objectives } from "./objectives";
import { exportRun, importRun } from "./vault";
import type { GameState } from "./types";
const base = (flags: Record<string, boolean>, sceneId = "act3_neighborhood"): GameState => ({ ...createCharacter({ handle: "Return", givenName: "Ada", origin: "gutterwire", bonus: { chrome: 1, nerve: 1, face: 0, ghost: 0 } }), sceneId, creds: 10, flags });
const step = (state: GameState, id: string) => commitChoice(state, getScene(state.sceneId).choices.find((choice) => choice.id === id)!).state;
it("records a public consequence then permits a later response without erasing observation", () => {
  let state = base({ notice_started: true, notice_done: true, notice_public_route: true });
  for (const id of ["visit-notice", "record-public-reply"]) state = step(state, id);
  state = importRun(exportRun(state));
  assert.equal(objectives(state).find((row) => row.id === "notice-followup")!.status, "Compromised");
  state = step(state, "return-notice-response"); state = step(state, "fund-private-replies"); state = step(state, "leave-notice-result");
  assert.equal(state.creds, 0); assert.equal(state.flags.notice_monitored, true);
  assert.match(aftermath(state).find((row) => row.title === "Clinic distribution")!.text, /new appointments remain unconfirmed/);
  assert.equal(presentChoices(state, getScene(state.sceneId)).some((choice) => choice.id === "return-notice-response"), false);
});
it("allows free withdrawal at zero resources and bounds private acknowledgements", () => {
  let state = { ...base({ notice_started: true, notice_done: true, notice_public_route: true }), creds: 0 };
  for (const id of ["visit-notice", "repair-public-window"]) state = step(state, id);
  assert.throws(() => step(state, "fund-private-replies"));
  state = step(state, "withdraw-notice-window"); state = step(state, "leave-notice-result");
  assert.match(aftermath(state).find((row) => row.title === "Clinic distribution")!.text, /earlier observation remains/);
  let privateRun = base({ notice_started: true, notice_done: true, notice_private_confirmed: true });
  privateRun = step(step(privateRun, "visit-notice"), "record-private-reply");
  assert.match(objectives(privateRun).find((row) => row.id === "notice-followup")!.detail, /all attendance remain unknown/);
  assert.equal(privateRun.flags.notice_monitored, undefined);
});
it("keeps contact boundaries independent of testimony, public permission and earlier breach", () => {
  for (const id of ["accept-clinic-relay", "give-nia-space"]) {
    let state = base({ witness_lost: true, witness_consent: true, nia_public_consent: true }, "act3_witness_visit");
    state.journal = [{ id: "nia-account", text: "Previously recorded account.", kind: "fact" }];
    state = step(step(state, "ask-nia-contact"), id); state = importRun(exportRun(state));
    assert.equal(state.flags.witness_lost, true); assert.equal(state.flags.witness_safe, undefined);
    assert.equal(state.flags.nia_public_consent, true); assert.equal(state.flags.witness_consent, true);
    assert.ok(state.journal.some((entry) => entry.id === "nia-account"));
    assert.equal(state.flags.nia_contact_set, true);
  }
  const noAccount = step(step(base({}, "act3_witness_visit"), "ask-nia-contact"), "accept-clinic-relay");
  assert.equal(noAccount.flags.witness_consent, undefined); assert.equal(noAccount.flags.nia_public_consent, undefined);
});

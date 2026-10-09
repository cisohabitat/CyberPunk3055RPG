import assert from "node:assert/strict";
import { it } from "node:test";
import { createCharacter } from "./engine";
import { sourceLedger, sourceReadiness } from "./source-ledger";
import { testimonyPacket } from "./testimony";
const base = () => createCharacter({ handle: "Reader", givenName: "Ada", origin: "spire", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 } });
it("shows only acquired evidence and retains claims, corrections and their original text", () => {
  const state = base();
  assert.deepEqual(sourceLedger(state), []);
  state.journal = [
    { id: "public-packet", text: "Original allegation.", kind: "claim" },
    { id: "packet-correction", text: "Its correction.", kind: "claim" },
    { id: "verified-order", text: "Later source.", kind: "fact" },
    { id: "week-recovery", text: "Not a source about the order.", kind: "fact" },
  ];
  const before = JSON.stringify(state);
  assert.deepEqual(sourceLedger(state).map((entry) => [entry.id, entry.kind, entry.text]), [["public-packet", "claim", "Original allegation."], ["packet-correction", "claim", "Its correction."], ["verified-order", "fact", "Later source."]]);
  assert.equal(JSON.stringify(state), before);
});
it("distinguishes export, corroboration and key authentication without trusting a lone key flag", () => {
  const state = base(); state.flags = { archive_key_authenticated: true };
  assert.match(sourceReadiness(state).cancellation, /still needed/);
  assert.doesNotMatch(testimonyPacket(state)[1].text, /reader authenticated/);
  state.flags = { order_verified: true };
  assert.match(sourceReadiness(state).cancellation, /key not authenticated/);
  state.flags.archive_key_authenticated = true;
  assert.equal(sourceReadiness(state).cancellation, "Issuing key authenticated");
});
it("keeps contact, recording and public quotation distinct and preserves breach limits", () => {
  const state = base(); state.flags = { nia_contact_relay: true, witness_safe: true };
  assert.equal(sourceReadiness(state).quotation, "No approved witness account");
  state.journal = [{ id: "nia-account", text: "Approved private account.", kind: "fact" }];
  assert.match(sourceReadiness(state).quotation, /public permission not given/);
  state.flags.nia_public_consent = true;
  assert.match(sourceReadiness(state).quotation, /authorized/);
  state.flags.witness_lost = true; state.flags.witness_relocated = true;
  assert.match(sourceReadiness(state).quotation, /withheld after location breach/);
});
it("keeps cross-examination attributed even after corroboration arrives", () => {
  const state = base(); state.flags = { memory_assurance_heard: true, memory_channel_heard: true, order_verified: true };
  assert.match(testimonyPacket(state).find((row) => row.title === "Mara’s answers")!.text, /not independent dispatch confirmation/);
});

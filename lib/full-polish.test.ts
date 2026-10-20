import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createCharacter } from "./engine";
import { kitComparison } from "./kit-comparison";
import { characterConduct, relationshipAftermath } from "./relationships";
import { finaleCommitments } from "./finale-commitments";

const base = createCharacter({ handle: "Review", givenName: "Jo", origin: "spire", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 } });
describe("build and consequence polish", () => {
  it("compares real check probabilities without granting equipment, access or progress", () => {
    const before = JSON.stringify(base);
    const rows = kitComparison({ ...base, flags: { perk_chrome: true } }, "archive-probe");
    assert.equal(rows.length, 2); assert.ok(rows.every(row => row.before === 100 && row.after === 100));
    for (const kit of ["chair-harness", "desk-guide", "route-shroud"]) for (const row of kitComparison(base, kit)) {
      assert.ok(row.after >= row.before); assert.ok(row.after - row.before <= 20); assert.ok(row.after <= 100);
    }
    assert.deepEqual(kitComparison(base, "__proto__"), []);
    assert.deepEqual(kitComparison({ ...base, items: ["archive-probe"] }, "archive-probe"), []);
    assert.equal(JSON.stringify(base), before);
  });
  it("retains actual employment consequences without inventing restored archive access", () => {
    assert.equal(characterConduct(base, "Edda"), undefined);
    const state = { ...base, flags: { archive_custody: true, archive_method_face: true, edda_shift_paid: true } };
    assert.match(characterConduct(state, "Edda")!, /still identifies.*paid bench assignment.*access remains suspended/s);
    assert.match(relationshipAftermath(state).find(row => row.title === "Edda’s source and working life")!.text, /records inquiry continues/);
    const pending = { ...base, flags: { edda_shift_consent: true, edda_shift_done: true } };
    assert.match(characterConduct(pending, "Edda")!, /pending; no paid assignment/);
  });
  it("keeps receipts separate from treatment and paused contact above a stale relay", () => {
    assert.equal(characterConduct(base, "Asa"), undefined);
    assert.match(characterConduct({ ...base, flags: { freight_late_received: true, freight_started: true, freight_done: true } }, "Asa")!, /no passenger clearance.*treatment remains unobserved/);
    const history = characterConduct({ ...base, flags: { nia_contact_paused: true, nia_contact_relay: true } }, "Nia Pell")!;
    assert.match(history, /pause further questions/); assert.doesNotMatch(history, /may relay a question/);
  });
  it("shows every earned commitment at each finale without completing an open promise", () => {
    for (const sceneId of ["ending_names", "ending_quiet", "ending_witness", "ending_listed"]) {
      const state = { ...base, sceneId, flags: { memory_witness: true, witness_lost: true, kerr_route_promised: true, kerr_route_private: true, kerr_route_trace: true, edda_shift_consent: true, edda_shift_done: true } };
      const before = JSON.stringify(state); const result = finaleCommitments(state)!;
      assert.equal(result.compromised, 2); assert.equal(result.unresolved, 1); assert.equal(result.complete, 0);
      assert.equal(result.rows.length, 3); assert.equal(JSON.stringify(state), before);
    }
    assert.equal(finaleCommitments(base), null);
    assert.equal(finaleCommitments({ ...base, sceneId: "ending_quiet" }), null);
  });
  it("never labels corroboration as completed key authentication in an ending", () => {
    const state = { ...base, sceneId: "ending_names", flags: { memory_intact: true, order_verified: true } };
    const row = finaleCommitments(state)!.rows.find(row => row.id === "archive")!;
    assert.equal(row.status, "Complete"); assert.match(row.title, /source/);
    assert.match(row.detail, /No issuing-key authentication is recorded/);
    const authenticated = finaleCommitments({ ...state, flags: { ...state.flags, archive_key_authenticated: true } })!.rows.find(row => row.id === "archive")!;
    assert.match(authenticated.detail, /reader authenticated the issuing key/);
  });
});

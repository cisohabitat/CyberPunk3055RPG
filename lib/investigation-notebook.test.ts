import assert from "node:assert/strict";
import { it } from "node:test";
import { createCharacter } from "./engine";
import { canConsultSources, filterNotebookSources, notebookSources } from "./investigation-notebook";
import { sourceReadiness } from "./source-ledger";
const base = () => createCharacter({ handle: "Reader", givenName: "Ada", origin: "spire", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 } });
it("consults only acquired entries and attaches inspected provenance without changing recorded text or order", () => {
  const s = base(); s.flags = { memory_order: true, memory_signature: true };
  assert.deepEqual(notebookSources(s), []);
  s.journal = [{ id: "memory-roster", text: "Legacy roster text.", kind: "fact" }, { id: "week-recovery", text: "Unrelated recovery." }, { id: "memory-order", text: "A preserved receipt with issuer unresolved.", kind: "fact" }];
  const before = JSON.stringify(s); const rows = notebookSources(s);
  assert.deepEqual(rows.map(row => [row.id, row.time, row.provenance, row.text]), [["memory-roster", "02:19", "Shift roster and exit log", "Legacy roster text."], ["memory-order", "02:16", "Helion command receipt", "A preserved receipt with issuer unresolved."]]);
  assert.equal(JSON.stringify(s), before); assert.ok(!rows.some(row => row.id === "memory-signature"));
});
it("finds timestamps and phrases across title, attribution and text while keeping interpretations separate from archive records", () => {
  const s = base(); s.journal = [{ id: "memory-order", text: "The issuing key needs verification.", kind: "fact" }, { id: "bench-verdict", text: "An initial key allegation.", kind: "claim" }, { id: "bench-correction", text: "The corrected certainty.", kind: "claim" }, { id: "archive-gap", text: "The issuing key remains unverified.", kind: "fact" }];
  assert.deepEqual(filterNotebookSources(s, "all", "  02:16 HELION ").map(row => row.id), ["memory-order"]);
  assert.deepEqual(filterNotebookSources(s, "interpretation", "").map(row => row.id), ["bench-verdict", "bench-correction"]);
  assert.deepEqual(filterNotebookSources(s, "archive", "issuing key").map(row => row.id), ["archive-gap"]);
  const before = JSON.stringify(s); assert.deepEqual(filterNotebookSources(s, "witness", ""), []);
  assert.equal(sourceReadiness(s).cancellation, "Independent corroboration still needed"); assert.equal(JSON.stringify(s), before);
});
it("a lone safety/permission flag grants no witness record and search cannot lift an exposure limit", () => {
  const s = base(); s.flags = { witness_safe: true, nia_public_consent: true };
  assert.deepEqual(filterNotebookSources(s, "witness", ""), []);
  assert.equal(sourceReadiness(s).quotation, "No approved witness account");
  s.journal = [{ id: "nia-account", text: "An approved private account.", kind: "fact" }];
  s.flags.witness_lost = true; s.flags.witness_relocated = true;
  assert.equal(filterNotebookSources(s, "witness", "private").length, 1);
  assert.match(sourceReadiness(s).quotation, /withheld after location breach/);
});
it("offers consultation in investigations only after a record exists, with no opening disclosure", () => {
  const s = base(); s.journal = [{ id: "memory-signature", text: "Acquired." }];
  for (const sceneId of ["memory_sequence", "act2_archive_gap", "act3_testimony_hearing"]) assert.equal(canConsultSources({ ...s, sceneId }), true);
  for (const sceneId of ["opening_city", "stall", "districts", "ending_quiet"]) assert.equal(canConsultSources({ ...s, sceneId }), false);
  assert.equal(canConsultSources({ ...s, sceneId: "memory_table", journal: [] }), false);
});

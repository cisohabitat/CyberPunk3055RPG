import assert from "node:assert/strict";
import { it } from "node:test";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { createCharacter, commitChoice, getScene, presentChoices, previewCheck, sceneText, stageCheck } from "./engine";
import { replayCampaign, type ReplaySpec } from "./story-replay";
import { commitArchivePlan } from "./archive-plan";
import { craftBond, craftBondRecord, craftSettlement, CRAFT_QUOTES as Q } from "./encounter-craft";
import { exportRun, importRun } from "./vault";
import { visibleCampaignDialogue } from "./campaign-dialogue";
import { sceneIllustration } from "./art";
import phase from "../qa/media/encounter-craft.json";
import bindings from "../qa/media/encounter-craft-dialogue-bindings.json";
import provenance from "../qa/media/encounter-craft-dialogue-provenance.json";
import transcripts from "../qa/media/encounter-craft-dialogue-transcripts.json";
const hash = (v: string | Buffer) => createHash("sha256").update(v).digest("hex");
const load = (file: string) => JSON.parse(readFileSync(`qa/routes/${file}`, "utf8")) as ReplaySpec;
function take(s: ReturnType<typeof createCharacter>, id: string, roll?: number) { const c = presentChoices(s, getScene(s.sceneId)).find(c => c.id === id && c.enabled); assert.ok(c, `${s.sceneId}/${id}`); return commitChoice(s, c, c.check ? { roll: roll! } : undefined).state; }
function checkpoint(name: string, action: string) {
  const spec = load(`encounter-craft/${name}.json`); let s = createCharacter(spec.character);
  for (const step of spec.steps) { if (step.choiceId === action) return s; s = take(s, step.choiceId, step.roll); }
  throw Error(`Missing ${name}/${action}`);
}
for (const file of phase.newRoutes) it(`plays ${file} with all held saves and its actual finale`, () => {
  const result = replayCampaign(load(file)); assert.ok(result.transcript.every(row => row.restored)); assert.deepEqual(importRun(exportRun(result.state)), result.state);
});
it("keeps legacy factories and held checks intact while opting new runs in explicitly", () => {
  const input = load("kerr-ghost.json").character;
  assert.deepEqual(createCharacter({ ...input, craftedEncounters: false }), createCharacter(input));
  assert.equal(createCharacter({ ...input, craftedEncounters: true }).flags.encounter_craft_enabled, true);
  assert.throws(() => createCharacter({ ...input, craftedEncounters: "yes" as unknown as boolean }), /Invalid encounter/);
  const s = checkpoint("archive-reader-failure", "craft-trace-receipt"), held = stageCheck(s, "craft-trace-receipt", 1);
  assert.deepEqual(importRun(exportRun(held)), held);
  assert.throws(() => commitChoice(held, { id: "craft-extract-paid", label: "injected", next: "act2_archive_custody" }), /recorded roll|Illegal/);
  const actual = presentChoices(s, getScene(s.sceneId)).find(c => c.id === "craft-trace-receipt")!, original = getScene("act2_archive_door").choices.find(c => c.id === "trace-receipt")!;
  assert.deepEqual(actual.check, original.check);
});
it("makes inspection and drafting free, retains wrong interpretations and prevents planned setup bypass", () => {
  const start = checkpoint("archive-reader-success", "craft-archive-question"), board = take(start, "craft-archive-question");
  assert.ok(!presentChoices(board, getScene(board.sceneId)).some(c => c.id.startsWith("craft-question-")));
  let read = board; for (const id of ["export", "plant", "movement"]) read = take(read, `craft-read-${id}`);
  for (const k of ["creds", "strain", "factions", "items", "journal", "rolls"] as const) assert.deepEqual(read[k], start[k]);
  assert.equal(read.flags.order_verified, start.flags.order_verified); assert.equal(read.flags.archive_key_authenticated, undefined);
  const wrong = take(read, "craft-question-conflate"); assert.equal(wrong.flags.craft_archive_conflated, true);
  const revised = take(wrong, "craft-revise-question"); assert.equal(revised.flags.craft_archive_conflated, true);
  const planned = commitArchivePlan(start, { objective: "authenticate", approach: "reader", contingency: "staffed" });
  assert.ok(!presentChoices(planned, getScene(planned.sceneId)).some(c => c.id === "craft-archive-question"));
  const failed = take(checkpoint("archive-reader-failure", "craft-trace-receipt"), "craft-trace-receipt", 1);
  assert.equal(failed.sceneId, "act2_archive_gap"); assert.equal(failed.flags.archive_key_authenticated, undefined);
  assert.ok(!presentChoices({ ...failed, sceneId: "act2_archive_compare" }, getScene("act2_archive_compare")).some(c => c.id === "craft-archive-question"));
});
it("charges each extraction's actual cost and distinguishes corroboration from a key match", () => {
  for (const [name, action, fee, trace] of [["archive-staffed-scope", "craft-extract-paid", 25, 1], ["archive-face-countersign", "craft-extract-face", 0, 1], ["archive-badge-scarce", "craft-extract-badge", 0, 2]] as const) {
    const s = checkpoint(name, action), done = take(s, action);
    assert.equal(done.creds, s.creds - fee); assert.equal(done.factions.helion, Math.min(5, s.factions.helion + trace));
    assert.equal(done.flags.order_verified, true); assert.equal(done.flags.archive_key_authenticated, undefined);
    assert.equal(done.flags.edda_public_consent, undefined); assert.equal(done.flags.nia_public_consent, undefined);
    assert.equal(done.journal.find(j => j.id === "verified-order")!.kind, "fact");
  }
  const s = checkpoint("archive-reader-success", "craft-isolate-key"), done = take(s, "craft-isolate-key"); assert.equal(done.strain, s.strain + 1); assert.equal(done.flags.archive_key_authenticated, true);
  const conflict = { ...s, flags: { ...s.flags, craft_scope_movement: true } };
  assert.ok(!presentChoices(conflict, getScene(conflict.sceneId)).some(c => c.id === "craft-isolate-key"));
});
it("holds real security and removes the pledged tool's real check contribution", () => {
  const cash = checkpoint("kerr-cash-private", "craft-bond-cash"), paid = take(cash, "craft-bond-cash"); assert.equal(paid.creds, cash.creds - 20); assert.equal(craftBond(paid), "cash");
  const tool = checkpoint("kerr-tool-private", "craft-bond-tool"), held = take(tool, "craft-bond-tool"); assert.ok(tool.items.includes("signal-baffle")); assert.ok(!held.items.includes("signal-baffle"));
  const crossing = checkpoint("kerr-tool-held-archive", "craft-trace-receipt"), check = presentChoices(crossing, getScene(crossing.sceneId)).find(c => c.id === "craft-trace-receipt")!.check!;
  assert.equal(previewCheck({ ...crossing, items: [...crossing.items, "signal-baffle"] }, check).bonus, previewCheck(crossing, check).bonus + 1);
  assert.equal(craftBond({ ...paid, journal: [] }), undefined);
  assert.equal(craftBond({ ...paid, flags: { ...paid.flags, craft_bond_tool: true } }), undefined);
  const self = checkpoint("kerr-self-funded", "craft-bond-self"), free = take({ ...self, creds: 0 }, "craft-bond-self"); assert.equal(free.creds, 0); assert.equal(craftBond(free), "self");
});
it("settles private cash/tool/fare only once against actual records and never repays unspent stairs", () => {
  for (const [name, cash, tool] of [["kerr-cash-private", 30, false], ["kerr-tool-private", 10, true], ["kerr-self-funded", 0, false], ["kerr-late-settlement", 30, false]] as const) {
    const s = checkpoint(name, "craft-record-settlement"), result = craftSettlement(s)!; assert.equal(result.cash, cash); assert.equal(result.tool, tool);
    const settled = take(s, "craft-record-settlement"); assert.equal(settled.creds, s.creds + cash); assert.equal(settled.flags.craft_kerr_settled, true);
    assert.equal(craftSettlement(settled), undefined); assert.equal(settled.flags.kerr_route_delivered, true);
    assert.ok(!presentChoices({ ...settled, sceneId: "act2_middle" }, getScene("act2_middle")).some(c => c.id === "craft-settle-kerr"));
    assert.equal(craftSettlement({ ...s, journal: s.journal.filter(j => j.id !== "kerr-collection-outcome") })?.cash, 0);
  }
  const s = checkpoint("kerr-cash-private", "craft-record-settlement");
  assert.equal(craftSettlement({ ...s, flags: { ...s.flags, kerr_entry_lift: false } })!.cash, 20);
});
it("keeps breach/failure losses and only allows genuine cancellation before the week and journey", () => {
  for (const name of ["kerr-breached", "kerr-failed", "kerr-late-failed"]) { const s = checkpoint(name, "craft-record-settlement"); assert.equal(craftSettlement(s)!.cash, 0); assert.equal(craftSettlement(s)!.tool, false); }
  const s = checkpoint("kerr-breached", "craft-record-settlement"); assert.equal(craftSettlement({ ...s, flags: { ...s.flags, kerr_route_trace: false } })!.cash, 0);
  const canceled = checkpoint("kerr-cancel", "craft-record-settlement"), done = take(canceled, "craft-record-settlement"); assert.equal(done.creds, canceled.creds + 20); assert.equal(done.flags.kerr_route_delivered, undefined); assert.equal(done.flags.craft_kerr_canceled, true); assert.ok(done.journal.some(j => j.id === "kerr-collection-promise"));
  const late = { ...canceled, sceneId: "act3_craft_kerr_settlement", flags: { ...canceled.flags, act2_done: true } }; assert.equal(craftSettlement(late)!.canceled, false); assert.equal(craftSettlement(late)!.cash, 0); assert.doesNotMatch(craftBondRecord(late), /Cancel before departure/);
});
it("covers every bound new quote in legal campaigns and verifies delivered words/actors/levels/art", () => {
  const seen = new Set<string>();
  for (const file of phase.newRoutes) { const spec = load(file); let s = createCharacter(spec.character); for (const step of spec.steps) { const sc = getScene(s.sceneId); for (const l of visibleCampaignDialogue(sc.id, sc.speaker, sceneText(sc, s))) if (phase.voiceIds.includes(l.id)) seen.add(l.key); s = take(s, step.choiceId, step.roll); } }
  assert.deepEqual([...seen].sort(), bindings.map(l => l.key).sort()); assert.equal(provenance.lines.length, 9);
  const words = (s: string) => s.toLowerCase().replace(/[’']/g, "").match(/[\p{L}\p{N}]+/gu) ?? [];
  for (const l of provenance.lines) { const b = bindings.find(b => b.id === l.id)!, t = transcripts.lines.find(t => t.id === l.id)!; assert.equal(b.text, l.text); assert.equal(b.speaker, l.speaker); assert.equal(l.voice, l.speaker === "Edda" ? "af_kore" : "am_adam"); assert.equal(hash(readFileSync(l.path)), l.sha256); assert.equal(t.sha256, l.sha256); assert.deepEqual(words(t.transcription), words(l.text)); assert.ok(Math.abs(l.integratedLufs + 23.5) <= .6); assert.ok(l.truePeakDbtp <= -1.5); }
  assert.ok(Object.values(Q).every(q => bindings.some(b => b.text === q))); for (const id of phase.newScenes) assert.ok(sceneIllustration(id));
});

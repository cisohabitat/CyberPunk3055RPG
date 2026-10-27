import assert from "node:assert/strict";
import { it } from "node:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createCharacter, getScene, presentChoices, commitChoice, sceneText, stageCheck } from "./engine";
import { replayCampaign, type ReplaySpec } from "./story-replay";
import { parseSave } from "./storage";
import { exportRun, importRun } from "./vault";
import { visibleCampaignDialogue, quotedSpeech } from "./campaign-dialogue";
import { kerrTermsCoda, kerrTermsOutcome, kerrTermsReturn } from "./kerr-terms";
import { nightRetell } from "./story/retell";
import phase from "../qa/media/kerr-confrontation.json";
import bindings from "../qa/media/kerr-terms-dialogue-bindings.json";
import deliveries from "../qa/media/kerr-terms-dialogue-provenance.json";
import transcripts from "../qa/media/kerr-terms-dialogue-transcripts.json";
import audit from "../qa/media/kerr-terms-dialogue-audit.json";

const load = (file: string) => JSON.parse(readFileSync(`qa/routes/${file}`, "utf8")) as ReplaySpec;
function checkpoint(file: string, sceneId: string) {
  const spec = load(file); let state = createCharacter(spec.character);
  for (const step of spec.steps) {
    if (state.sceneId === sceneId) return state;
    const choice = presentChoices(state, getScene(state.sceneId)).find(c => c.id === step.choiceId && c.enabled)!;
    state = commitChoice(state, choice, choice.check ? { roll: step.roll! } : undefined).state;
  }
  throw new Error(`Missing ${file}/${sceneId}`);
}
const take = (state: ReturnType<typeof createCharacter>, id: string, roll?: number) => {
  const choice = presentChoices(state, getScene(state.sceneId)).find(c => c.id === id && c.enabled)!;
  assert.ok(choice, `${state.sceneId}/${id}`); return commitChoice(state, choice, choice.check ? { roll: roll! } : undefined).state;
};

it("enables new-run terms explicitly while preserving legacy creation and held choices", () => {
  const input = load("integration-names.json").character;
  assert.deepEqual(createCharacter({ ...input, expandedKerr: false }), createCharacter(input));
  assert.equal(createCharacter({ ...input, expandedKerr: true }).flags.kerr_terms_enabled, true);
  const old = checkpoint("integration-names.json", "kerr");
  assert.ok(!presentChoices(old, getScene("kerr")).some(c => c.id === "kerr-open-terms"));
  const held = stageCheck(old, "talk-leave", 6);
  assert.deepEqual(importRun(exportRun(held)), held);
  assert.equal(take(held, "talk-leave", 6).pendingCheck, undefined);
});

for (const file of phase.newRoutes) it(`completes ${file} through native held-roll reloads and an original finale`, () => {
  const result = replayCampaign(load(file));
  assert.equal(result.state.sceneId, "ending_quiet");
  assert.deepEqual(importRun(exportRun(result.state)), result.state);
  assert.ok(result.transcript.every(step => step.restored));
  assert.ok(kerrTermsCoda(result.state));
  for (const flag of ["order_verified", "archive_key_authenticated", "witness_public_consent", "kerr_week_paid"]) assert.equal(Boolean(result.state.flags[flag]), false, flag);
});

it("commits the real negotiated cost once and rejects an unaffordable forged choice", () => {
  const state = checkpoint("kerr/named.json", "kerr_terms_negotiate");
  const paid = take(state, "kerr-terms-pay");
  assert.equal(paid.creds, state.creds - 20); assert.equal(paid.strain, state.strain);
  assert.equal(paid.factions.helion, Math.min(5, state.factions.helion + 1));
  assert.equal(paid.items.filter(i => i === "shard").length, 1);
  assert.ok(!presentChoices({ ...paid, sceneId: "kerr" }, getScene("kerr")).some(c => c.id === "kerr-open-terms"));
  for (const creds of [0, 10, 19]) {
    const scarce = { ...state, creds }, choice = presentChoices(scarce, getScene(scarce.sceneId)).find(c => c.id === "kerr-terms-pay")!;
    assert.equal(choice.enabled, false); assert.throws(() => commitChoice(scarce, { ...choice, effects: { creds: 999 } }), /Illegal choice/);
  }
});

it("keeps a recorded bluff face through import and prevents reroll, retreat or payment before resolution", () => {
  const state = checkpoint("kerr/scarce-exposed.json", "kerr_terms_bluff");
  const held = importRun(exportRun(stageCheck(state, "kerr-terms-bluff-check", 2)))!;
  assert.equal(held.pendingCheck?.roll, 2);
  assert.throws(() => take(held, "kerr-terms-bluff-check", 10), /recorded roll/);
  assert.throws(() => take(held, "kerr-terms-back"), /recorded roll/);
  const failed = take(held, "kerr-terms-bluff-check", 2);
  assert.equal(failed.strain, state.strain + 1); assert.equal(kerrTermsOutcome(failed), "exposed");
  assert.equal(presentChoices({ ...failed, sceneId: "kerr_terms_bluff" }, getScene("kerr_terms_bluff")).some(c => c.id === "kerr-terms-bluff-check"), false);
  const fight = take(failed, "kerr-terms-exposed-fight");
  assert.equal(fight.sceneId, "kerr_fight"); assert.equal(fight.flags.kerr_terms_exposed, true);
  const heldFight = importRun(exportRun(stageCheck(fight, "meet", 8)))!;
  const escaped = take(heldFight, "meet", 8);
  assert.equal(escaped.sceneId, "after_kerr"); assert.equal(escaped.flags.kerr_terms_exposed, true);
  assert.equal(escaped.flags.kerr_down, true); assert.equal(escaped.pendingCheck, undefined);
});

it("withdraws awake without inventing an assault, taking the original or erasing an exposed lie", () => {
  for (const file of ["scarce-withdrew", "scarce-exposed"]) {
    const state = checkpoint(`kerr/${file}.json`, "kerr_terms_retreat"), next = take(state, "kerr-terms-withdraw");
    assert.equal(next.sceneId, "ending_walk"); assert.ok(!next.items.includes("shard"));
    assert.equal(next.creds, state.creds); assert.equal(next.strain, state.strain);
    assert.match(sceneText(getScene(next.sceneId), next), /alley awake/);
    assert.doesNotMatch(sceneText(getScene(next.sceneId), next), /You wake|Dawn will edit/);
    assert.match(nightRetell(next)[0], /original hour/);
    if (file === "scarce-exposed") { assert.equal(kerrTermsOutcome(next), "exposed"); assert.equal(next.flags.kerr_terms_withdrew, undefined); }
  }
});

it("routes an unheld original through Mara's memo before leaving, without granting verification", () => {
  const state = checkpoint("kerr/unheld-named.json", "kerr_terms_negotiate");
  assert.equal(state.items.includes("shard"), false); assert.equal(Boolean(state.flags.heard_memo), false);
  let next = take(take(state, "kerr-terms-pay"), "kerr-terms-named-exit");
  assert.equal(next.sceneId, "memo"); next = take(next, "heard"); assert.equal(next.sceneId, "mara_why");
  assert.equal(take(next, "why-signed").sceneId, "after_kerr");
  const unheldTerms = checkpoint("kerr/unheld-named.json", "kerr_terms");
  const withdrawn = take(take(unheldTerms, "kerr-terms-step-back"), "kerr-terms-withdraw");
  assert.equal(Boolean(withdrawn.flags.heard_memo), false); assert.equal(withdrawn.items.includes("shard"), false);
  assert.match(sceneText(getScene(withdrawn.sceneId), withdrawn), /leave the original in the chair room/);
  assert.doesNotMatch(sceneText(getScene(withdrawn.sceneId), withdrawn), /put the original down/);
});

it("ties reactions and coda to one actual recorded outcome and keeps admission separate from repair", () => {
  const state = replayCampaign(load("kerr/bluffed-owned.json")).state;
  assert.match(kerrTermsReturn(state), /doesn't make the first story true/); assert.match(kerrTermsCoda(state)!, /does not cross it out/);
  assert.equal(kerrTermsReturn({ ...state, journal: [] }), ""); assert.equal(kerrTermsCoda({ ...state, journal: [] }), undefined);
  const withoutAdmission = { ...state, journal: state.journal.filter(j => j.id !== "kerr-terms-owned") };
  assert.match(kerrTermsReturn(withoutAdmission), /made my shift longer/);
  assert.doesNotMatch(kerrTermsCoda(withoutAdmission)!, /You admitted/);
  const conflicting = { ...state, flags: { ...state.flags, kerr_terms_named: true } };
  assert.equal(kerrTermsOutcome(conflicting), undefined); assert.equal(kerrTermsReturn(conflicting), "");
  assert.equal(kerrTermsCoda(conflicting), undefined);
});

it("covers all thirteen exact new actor quotations in legal complete campaigns and measures every delivery", () => {
  const seen = new Set<string>();
  for (const file of phase.newRoutes) {
    const spec = load(file); let state = createCharacter(spec.character);
    for (const step of spec.steps) {
      const scene = getScene(state.sceneId), text = sceneText(scene, state), lines = visibleCampaignDialogue(scene.id, scene.speaker, text);
      for (const line of lines.filter(l => phase.voiceIds.includes(l.id))) {
        assert.equal(line.speaker, "Kerr");
        const index = quotedSpeech(text).findIndex(q => q.text === line.quote); assert.ok(index >= 0);
        const decision = audit.decisions.find(d => d.bindingKeys.includes(line.key))!;
        assert.equal(decision.index, index); assert.equal(decision.scene, scene.id); assert.equal(decision.speaker, line.speaker); assert.equal(decision.text, line.text);
        seen.add(line.key);
      }
      state = take(state, step.choiceId, step.roll);
    }
  }
  assert.equal(bindings.length, 13); assert.equal(deliveries.lines.length, 13);
  assert.deepEqual([...seen].sort(), bindings.map(b => b.key).sort());
  for (const binding of bindings) {
    const record = deliveries.lines.find(l => l.id === binding.id)!;
    assert.equal(record.text, binding.text); assert.equal(record.speaker, binding.speaker); assert.equal(record.voice, "am_adam");
    assert.ok(Math.abs(record.integratedLufs + 23.5) <= .6); assert.ok(record.truePeakDbtp <= -1.5);
    assert.equal(createHash("sha256").update(readFileSync(record.path)).digest("hex"), record.sha256);
  }
  assert.ok(phase.voiceIds.every(id => id.startsWith("voice-campaign-kerr-terms-")));
  assert.equal(phase.artAssets.flatMap(a => a.files).length, 3);
  assert.equal(transcripts.lines.length, 13);
  const words = (text: string) => text.toLowerCase().replace(/[’']/g, "").replace(/\b20\b/g, "twenty").match(/[\p{L}\p{N}]+/gu) ?? [];
  for (const line of transcripts.lines) {
    assert.equal(line.exactNormalizedWords, true, line.transcription);
    assert.deepEqual(words(line.transcription), words(line.authoredText), line.id);
    assert.equal(deliveries.lines.find(d => d.id === line.id)?.sha256, line.sha256);
    assert.equal(deliveries.lines.find(d => d.id === line.id)?.text, line.authoredText);
  }
});

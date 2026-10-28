import assert from "node:assert/strict";
import { it } from "node:test";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { createCharacter, getScene, sceneText, presentChoices, commitChoice, stageCheck } from "./engine";
import { replayCampaign, type ReplaySpec } from "./story-replay";
import { sceneIllustration, portraitArt } from "./art";
import { visibleCampaignDialogue, quotedSpeech } from "./campaign-dialogue";
import { exportRun, importRun } from "./vault";
import { maraAccountCoda, maraAccountOutcome, maraAccountQuestionHeard, maraAccountRecord, maraAccountRepaired, maraNight, MARA_ACCOUNT_QUOTES as Q } from "./mara-account";
import phase from "../qa/media/mara-relationship.json";
import witness from "../qa/media/witness-return.json";
import bindings from "../qa/media/mara-account-dialogue-bindings.json";
import deliveries from "../qa/media/mara-account-dialogue-provenance.json";
import transcripts from "../qa/media/mara-account-dialogue-transcripts.json";
import type { GameState } from "./types";
import { sceneSoundPlan } from "./sound";

const sha = (v: string | Buffer) => createHash("sha256").update(v).digest("hex");
const load = (name: string) => JSON.parse(readFileSync(`qa/routes/${name}`, "utf8")) as ReplaySpec;
const take = (state: GameState, id: string, roll?: number) => {
  const choice = presentChoices(state, getScene(state.sceneId)).find(c => c.id === id && c.enabled);
  assert.ok(choice, `${state.sceneId}/${id}`);
  return commitChoice(state, choice, choice.check ? { roll: roll! } : undefined).state;
};
function checkpoint(name: string, sceneId: string, choiceId?: string) {
  const spec = load(`mara-account/${name}.json`); let state = createCharacter(spec.character);
  for (const step of spec.steps) {
    if (state.sceneId === sceneId && (!choiceId || step.choiceId === choiceId)) return state;
    state = take(state, step.choiceId, step.roll);
  }
  throw Error(`Missing ${name}/${sceneId}/${choiceId}`);
}
function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? files(`${dir}/${e.name}`) : [`${dir}/${e.name}`]);
}

it("preserves all 171 preceding full campaigns, 12,201 visits, actor/voice/art and every preceding delivery", () => {
  const rows = [], old = files("qa/routes").filter(f => f.endsWith(".json") && ![...phase.newRoutes, ...witness.newRoutes].includes(f.slice("qa/routes/".length))).sort();
  assert.equal(old.length, phase.baseline.routes);
  for (const file of old) {
    const spec = JSON.parse(readFileSync(file, "utf8")) as ReplaySpec; let state = createCharacter(spec.character);
    for (let step = 0; step <= spec.steps.length; step++) {
      const scene = getScene(state.sceneId), text = sceneText(scene, state), choices = presentChoices(state, scene);
      rows.push({ file, step, state, text, choices, voice: visibleCampaignDialogue(scene.id, scene.speaker, text), actor: scene.speaker, art: sceneIllustration(scene.id, state.flags), portrait: portraitArt(scene.speaker, scene.id, state.flags) });
      if (step === spec.steps.length) break;
      const entry = spec.steps[step]; state = take(state, entry.choiceId, entry.roll);
    }
  }
  assert.equal(rows.length, phase.baseline.visits); assert.equal(sha(JSON.stringify(rows)), phase.baseline.campaignSha256);
  for (const media of phase.baseline.media) assert.equal(sha(readFileSync(media.path)), media.sha256, media.path);
});

for (const route of phase.newRoutes) it(`completes ${route} through native held-roll saves without inventing an ending`, () => {
  const result = replayCampaign(load(route));
  assert.ok(["ending_names", "ending_quiet"].includes(result.state.sceneId));
  assert.ok(result.transcript.every(s => s.restored)); assert.deepEqual(importRun(exportRun(result.state)), result.state);
  assert.ok(maraAccountRecord(result.state)); assert.ok(maraAccountCoda(result.state));
});

it("opts new runs in while retaining default creation, old held faces and edited-night limits", () => {
  const input = load("integration-names.json").character;
  assert.deepEqual(createCharacter({ ...input, expandedMara: false }), createCharacter(input));
  assert.equal(createCharacter({ ...input, expandedMara: true }).flags.mara_account_enabled, true);
  assert.throws(() => createCharacter({ ...input, expandedMara: "yes" as unknown as boolean }), /Invalid Mara/);
  const state = checkpoint("sold-owned", "kerr"), held = stageCheck(state, "talk-leave", 6);
  assert.deepEqual(importRun(exportRun(held)), held);
  assert.throws(() => take(importRun(exportRun(held))!, "talk-leave", 10), /recorded roll/);
  const terms = checkpoint("sold-owned", "act2_response_terms", "mara-account-open");
  for (const invalid of [
    { ...terms, flags: { ...terms.flags, mara_account_enabled: false } },
    { ...terms, journal: terms.journal.filter(j => j.id !== "mara-response-terms") },
    { ...terms, flags: { ...terms.flags, act1_sold: false, act1_sainted: true } },
    { ...terms, flags: { ...terms.flags, act1_both: true } },
  ]) assert.ok(!presentChoices(invalid, getScene(invalid.sceneId)).some(c => c.id === "mara-account-open"));
});

it("Mara learns the real night only through disclosure; pausing and honest distance do not invent knowledge", () => {
  const entry = checkpoint("sold-owned", "act2_mara_account"), before = entry.journal;
  assert.doesNotMatch(sceneText(getScene(entry.sceneId), entry), /He paid you/);
  const paused = take(entry, "mara-account-pause"); assert.deepEqual(paused.journal, before); assert.equal(maraAccountOutcome(paused), undefined);
  const told = take(entry, "mara-account-disclose"); assert.match(sceneText(getScene(told.sceneId), told), /He paid you for it/);
  assert.ok(told.journal.some(j => j.id === "mara-account-night-sold"));
  const distance = take(entry, "mara-account-distance"); assert.equal(maraAccountOutcome(distance), "distance");
  assert.ok(!distance.journal.some(j => j.id.startsWith("mara-account-night-")));
  assert.deepEqual(distance.items, entry.items); assert.deepEqual(distance.factions, entry.factions);
});

it("personal choices change no resources, evidence, care, letter status or original company terms", () => {
  const state = checkpoint("sold-owned", "act2_mara_account_told");
  for (const id of ["mara-account-own", "mara-account-deflect"]) {
    const next = take(state, id);
    for (const key of ["creds", "strain", "items", "factions", "rolls", "pendingCheck"] as const) assert.deepEqual(next[key], state[key], key);
    for (const flag of ["order_verified", "archive_key_authenticated", "nia_public_consent", "response_sent", "response_received", "response_private_consent", "mara_company_kept"]) assert.equal(next.flags[flag], state.flags[flag], flag);
    const terms = take(next, "mara-account-dispatch");
    assert.equal(presentChoices(terms, getScene(terms.sceneId)).some(c => c.id === "ask-mara-tomorrow" && c.enabled), id === "mara-account-own");
    assert.ok(presentChoices(terms, getScene(terms.sceneId)).some(c => c.id === "arrange-response-dispatch" && c.enabled));
  }
  const scarce = replayCampaign(load("mara-account/scarce-company-distance.json")).state;
  assert.equal(scarce.creds, 0); assert.equal(scarce.strain, 5); assert.equal(scarce.flags.mara_company_kept, true);
  const earlierCompany = replayCampaign(load("mara-account/company-before-deflection.json")).state;
  assert.equal(earlierCompany.flags.mara_company_kept, true); assert.equal(maraAccountOutcome(earlierCompany), "deflected");
  assert.ok(earlierCompany.journal.some(j => j.id === "mara-window-choice"));
});

it("acknowledgment retains deflection and its closed personal question, including reload and forged actions", () => {
  const state = checkpoint("destroyed-corrected", "act3_mara_account_return");
  assert.ok(!presentChoices(state, getScene(state.sceneId)).some(c => c.id === "mara-account-ask"));
  const fixed = importRun(exportRun(take(state, "mara-account-correct")))!;
  assert.equal(maraAccountRepaired(fixed), true); assert.equal(maraAccountOutcome(fixed), "deflected");
  assert.equal(maraAccountQuestionHeard(fixed), false); assert.ok(fixed.journal.some(j => j.id === "mara-account-deflected"));
  const returned = { ...fixed, sceneId: "act3_mara_account_return" };
  assert.ok(!presentChoices(returned, getScene(returned.sceneId)).some(c => ["mara-account-ask", "mara-account-correct"].includes(c.id)));
  const own = checkpoint("sold-owned", "act3_mara_account_return");
  const forged = presentChoices(own, getScene(own.sceneId)).find(c => c.id === "mara-account-ask")!;
  assert.throws(() => commitChoice(state, forged), /Illegal choice/);
});

it("missing or contradictory imported records fail closed for speech, contact and ending memories", () => {
  const state = replayCampaign(load("mara-account/sold-owned.json")).state;
  for (const broken of [
    { ...state, journal: [] },
    { ...state, flags: { ...state.flags, mara_account_deflected: true } },
    { ...state, flags: { ...state.flags, mara_account_night_left: true } },
    { ...state, flags: { ...state.flags, act1_both: true } },
  ]) {
    assert.equal(maraAccountOutcome(broken), undefined); assert.equal(maraAccountCoda(broken), undefined);
    const view = { ...broken, sceneId: "act3_mara_account_question" };
    assert.doesNotMatch(sceneText(getScene(view.sceneId), view), /A morning market/);
    assert.ok(!presentChoices(view, getScene(view.sceneId)).some(c => c.id === "mara-account-keep-answer"));
  }
  const noAnswerRecord = { ...state, journal: state.journal.filter(j => j.id !== "mara-account-question") };
  assert.equal(maraAccountQuestionHeard(noAnswerRecord), false); assert.doesNotMatch(maraAccountCoda(noAnswerRecord)!, /shutters rise/);
  const late = checkpoint("sold-unfinished", "act2_mara_account_told");
  assert.ok(!presentChoices({ ...late, flags: { ...late.flags, act2_done: true } }, getScene(late.sceneId)).some(c => ["mara-account-own", "mara-account-deflect"].includes(c.id)));
});

it("covers every new exact actor line in legal complete campaigns and verifies delivery and raw ASR words", () => {
  const seen = new Set<string>();
  for (const route of phase.newRoutes) {
    const spec = load(route); let state = createCharacter(spec.character);
    for (const step of spec.steps) {
      const scene = getScene(state.sceneId), text = sceneText(scene, state);
      for (const line of visibleCampaignDialogue(scene.id, scene.speaker, text).filter(l => phase.voiceIds.includes(l.id))) {
        assert.equal(line.speaker, "Mara"); assert.ok(quotedSpeech(text).some(q => q.text === line.quote)); seen.add(line.key);
      }
      state = take(state, step.choiceId, step.roll);
    }
  }
  assert.equal(bindings.length, 15); assert.deepEqual([...seen].sort(), bindings.map(b => b.key).sort());
  assert.equal(deliveries.lines.length, bindings.length); assert.equal(transcripts.lines.length, bindings.length);
  const words = (s: string) => s.toLowerCase().replace(/[’']/g, "").match(/[\p{L}\p{N}]+/gu) ?? [];
  for (const binding of bindings) {
    const d = deliveries.lines.find(d => d.id === binding.id)!; const t = transcripts.lines.find(t => t.id === binding.id)!;
    assert.equal(d.text, binding.text); assert.equal(d.voice, "af_sarah"); assert.equal(sha(readFileSync(d.path)), d.sha256);
    assert.ok(Math.abs(d.integratedLufs + 23.5) <= .6); assert.ok(d.truePeakDbtp <= -1.5);
    assert.equal(t.sha256, d.sha256); assert.equal(t.authoredText, binding.text); assert.deepEqual(words(t.transcription), words(binding.text), t.id);
  }
  for (const sceneId of phase.newScenes) {
    assert.equal(sceneIllustration(sceneId)?.src, "/art/mara-account.jpg");
    const state = { ...createCharacter(load(phase.newRoutes[0]).character), sceneId };
    assert.deepEqual(sceneSoundPlan(state, getScene(sceneId).location, "The Week"), { mood: "quiet", district: "clinic" });
  }
  assert.equal(maraNight(replayCampaign(load("mara-account/partial-deflected.json")).state), "partial");
  assert.ok(Object.values(Q).every(quote => bindings.some(b => b.quote === quote)));
});

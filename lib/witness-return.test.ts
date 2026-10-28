import assert from "node:assert/strict";
import { it } from "node:test";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { createCharacter, getScene, presentChoices, commitChoice, sceneText, stageCheck } from "./engine";
import { replayCampaign, type ReplaySpec } from "./story-replay";
import { exportRun, importRun } from "./vault";
import { sceneIllustration, portraitArt } from "./art";
import { quotedSpeech, visibleCampaignDialogue } from "./campaign-dialogue";
import { witnessWorkReply, WITNESS_RETURN_QUOTES as Q } from "./witness-return";
import { sceneSoundPlan } from "./sound";
import { campaignCoda } from "./campaign-consequences";
import phase from "../qa/media/witness-return.json";
import bindings from "../qa/media/witness-return-dialogue-bindings.json";
import deliveries from "../qa/media/witness-return-dialogue-provenance.json";
import transcripts from "../qa/media/witness-return-dialogue-transcripts.json";

const hash = (data: string | Buffer) => createHash("sha256").update(data).digest("hex");
const load = (name: string) => JSON.parse(readFileSync(`qa/routes/${name}`, "utf8")) as ReplaySpec;
const files = (path: string): string[] => readdirSync(path, { withFileTypes: true }).flatMap(row => row.isDirectory() ? files(`${path}/${row.name}`) : [`${path}/${row.name}`]);
const take = (state: ReturnType<typeof createCharacter>, id: string, roll?: number) => {
  const choice = presentChoices(state, getScene(state.sceneId)).find(c => c.id === id && c.enabled);
  assert.ok(choice, `${state.sceneId}/${id}`); return commitChoice(state, choice, choice.check ? { roll: roll! } : undefined).state;
};
const checkpoint = (name: string, choiceId: string) => {
  const spec = load(`witness-return/${name}.json`); let state = createCharacter(spec.character);
  for (const step of spec.steps) { if (step.choiceId === choiceId) return state; state = take(state, step.choiceId, step.roll); }
  throw Error(`Missing ${name}/${choiceId}`);
};

it("preserves all 182 preceding campaigns, 12,775 visits and every prior art/audio delivery", () => {
  const rows = [], old = files("qa/routes").filter(file => file.endsWith(".json") && !phase.newRoutes.includes(file.slice("qa/routes/".length))).sort();
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
  assert.equal(rows.length, phase.baseline.visits); assert.equal(hash(JSON.stringify(rows)), phase.baseline.campaignSha256);
  for (const media of phase.baseline.media) assert.equal(hash(readFileSync(media.path)), media.sha256, media.path);
});
for (const route of phase.newRoutes) it(`plays ${route} through held saves to its original finale`, () => {
  const result = replayCampaign(load(route));
  assert.ok(result.transcript.every(row => row.restored)); assert.deepEqual(importRun(exportRun(result.state)), result.state);
  if (route.includes("waiting-unfinished")) { assert.equal(result.state.journal.some(row => row.id === "nia-account"), false); assert.equal(result.state.flags.order_verified, undefined); }
  if (route.includes("relocated")) { assert.equal(result.state.flags.witness_lost, true); assert.equal(result.state.flags.witness_return_registered, true); assert.equal(result.state.flags.witness_return_relocated, true); }
  if (route.includes("unkept")) { assert.equal(result.state.flags.witness_shift_kept, undefined); assert.match(campaignCoda(result.state)!, /unworked shift/); }
});
it("opts new runs in explicitly and retains legacy held rolls and paused contact", () => {
  const input = load("integration-names.json").character;
  assert.deepEqual(createCharacter({ ...input, expandedWitness: false }), createCharacter(input));
  assert.equal(createCharacter({ ...input, expandedWitness: true }).flags.witness_returns_enabled, true);
  assert.throws(() => createCharacter({ ...input, expandedWitness: "yes" as unknown as boolean }), /Invalid witness/);
  const state = checkpoint("private-paid", "hear-witness-account");
  for (const flags of [{ ...state.flags, witness_returns_enabled: false }, { ...state.flags, witness_lost: true }, { ...state.flags, act2_done: true }, { ...state.flags, nia_contact_paused: true }]) {
    assert.ok(!presentChoices({ ...state, flags }, getScene(state.sceneId)).some(c => c.id === "hear-witness-account"));
  }
  assert.ok(!presentChoices({ ...state, journal: state.journal.filter(row => row.id !== "nia-account") }, getScene(state.sceneId)).some(c => c.id === "hear-witness-account"));
  const spec = load("witness-return/private-paid.json"); let held = createCharacter(spec.character);
  for (const step of spec.steps) { const c = presentChoices(held, getScene(held.sceneId)).find(c => c.id === step.choiceId)!; if (c.check) { held = stageCheck(held, c.id, step.roll!); break; } held = take(held, c.id); }
  assert.deepEqual(importRun(exportRun(held)), held);
  assert.throws(() => commitChoice(held, { id: "hear-witness-account", label: "injected", next: "act2_witness_return_private" }), /recorded roll|Illegal/);
});
it("records each heard milestone once without granting a source, permission, standing or spent resource", () => {
  const state = checkpoint("private-paid", "hear-witness-account"), entered = take(state, "hear-witness-account"), returned = take(entered, "keep-witness-room-boundary");
  for (const key of ["creds", "strain", "stats", "factions", "items", "rolls"] as const) assert.deepEqual(returned[key], state[key]);
  for (const flag of ["witness_safe", "witness_lost", "witness_consent", "order_verified", "archive_key_authenticated", "nia_public_consent", "nia_contact_set"]) assert.equal(returned.flags[flag], state.flags[flag]);
  assert.ok(!presentChoices(returned, getScene(returned.sceneId)).some(c => c.id === "hear-witness-account"));
  assert.equal(returned.journal.find(row => row.id === "witness-room-return")!.kind, "claim");
  const owed = checkpoint("private-unkept", "hear-witness-account");
  assert.match(witnessWorkReply(owed), /still waiting/);
  assert.equal(witnessWorkReply({ ...owed, journal: [] }), "");
  const kept = checkpoint("private-waiting-kept", "hear-witness-account"); assert.match(witnessWorkReply(kept), /went home/);
  const late = checkpoint("private-unkept", "hear-unkept-witness-shift");
  for (const edited of [{ ...late, flags: { ...late.flags, act2_done: false } }, { ...late, flags: { ...late.flags, witness_shift_kept: true } }, { ...late, journal: [] }]) assert.ok(!presentChoices(edited, getScene(edited.sceneId)).some(c => c.id === "hear-unkept-witness-shift"));
});
it("covers every new exact quotation in legal campaigns and verifies matching delivered words, actors and art", () => {
  const seen = new Set<string>();
  for (const route of phase.newRoutes) {
    const spec = load(route); let state = createCharacter(spec.character);
    for (const step of spec.steps) {
      const scene = getScene(state.sceneId), text = sceneText(scene, state);
      for (const line of visibleCampaignDialogue(scene.id, scene.speaker, text).filter(line => phase.voiceIds.includes(line.id))) { assert.ok(quotedSpeech(text).some(q => q.text === line.quote)); seen.add(line.key); }
      state = take(state, step.choiceId, step.roll);
    }
  }
  assert.deepEqual([...seen].sort(), bindings.map(row => row.key).sort()); assert.equal(bindings.length, 7);
  const words = (s: string) => s.toLowerCase().replace(/[’']/g, "").match(/[\p{L}\p{N}]+/gu) ?? [];
  for (const binding of bindings) {
    const line = deliveries.lines.find(line => line.id === binding.id)!, transcript = transcripts.lines.find(line => line.id === binding.id)!;
    assert.equal(line.text, binding.text); assert.equal(line.speaker, binding.speaker); assert.equal(line.voice, binding.speaker === "Nia Pell" ? "af_nova" : "af_heart");
    assert.equal(hash(readFileSync(line.path)), line.sha256); assert.ok(Math.abs(line.integratedLufs + 23.5) <= .6); assert.ok(line.truePeakDbtp <= -1.5);
    assert.equal(transcript.sha256, line.sha256); assert.deepEqual(words(transcript.transcription), words(binding.text));
  }
  assert.ok(Object.values(Q).every(text => bindings.some(line => line.text === text)));
  for (const id of phase.newScenes) { assert.ok(sceneIllustration(id)); const scene = getScene(id), state = { ...createCharacter(load(phase.newRoutes[0]).character), sceneId: id }; assert.deepEqual(sceneSoundPlan(state, scene.location, "The Week"), { mood: "quiet", district: id === "act2_witness_return_private" ? "witness" : "clinic" }); }
});

import assert from "node:assert/strict";
import { it } from "node:test";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { createCharacter, commitChoice, getScene, presentChoices, sceneText } from "./engine";
import { eddaPayoff, kerrPayoff, payoffReturnEffect, PAYOFF_QUOTES as Q } from "./emotional-payoff";
import { visibleCampaignDialogue } from "./campaign-dialogue";
import { sceneIllustration, portraitArt } from "./art";
import { replayCampaign, type ReplaySpec } from "./story-replay";
import { exportRun, importRun } from "./vault";
import phase from "../qa/media/emotional-payoff.json";
import bindings from "../qa/media/emotional-payoff-dialogue-bindings.json";
import deliveries from "../qa/media/emotional-payoff-dialogue-provenance.json";
import transcripts from "../qa/media/emotional-payoff-dialogue-transcripts.json";

const hash = (s: string | Buffer) => createHash("sha256").update(s).digest("hex");
const files = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap(row => row.isDirectory() ? files(`${dir}/${row.name}`) : [`${dir}/${row.name}`]);
const load = (name: string) => JSON.parse(readFileSync(`qa/routes/${name}.json`, "utf8")) as ReplaySpec;
function take(state: ReturnType<typeof createCharacter>, id: string, roll?: number) {
  const choice = presentChoices(state, getScene(state.sceneId)).find(c => c.id === id && c.enabled); assert.ok(choice, `${state.sceneId}/${id}`);
  return commitChoice(state, choice, choice.check ? { roll: roll! } : undefined).state;
}
function checkpoint(name: string, id: string) {
  const spec = load(`emotional-payoff/${name}`); let state = createCharacter(spec.character);
  for (const step of spec.steps) { if (step.choiceId === id) return state; state = take(state, step.choiceId, step.roll); }
  throw Error(`Missing ${name}/${id}`);
}
for (const file of phase.newRoutes) it(`plays ${file} through held saves and its actual finale`, () => {
  const result = replayCampaign(load(file.slice(0, -5))); assert.ok(result.transcript.every(row => row.restored));
  assert.deepEqual(importRun(exportRun(result.state)), result.state);
});
it("preserves all 203 preceding campaigns, 14,304 visits and all 785 preceding art/audio bytes", () => {
  const routes = files("qa/routes").filter(file => file.endsWith(".json") && !phase.newRoutes.includes(file.slice("qa/routes/".length))).sort(), rows = [];
  assert.equal(routes.length, phase.baseline.routes);
  for (const file of routes) {
    const spec = JSON.parse(readFileSync(file, "utf8")) as ReplaySpec; let state = createCharacter(spec.character);
    for (let step = 0; step <= spec.steps.length; step++) {
      const scene = getScene(state.sceneId), text = sceneText(scene, state), choices = presentChoices(state, scene);
      rows.push({ file, step, state, text, choices, voice: visibleCampaignDialogue(scene.id, scene.speaker, text), actor: scene.speaker, art: sceneIllustration(scene.id, state.flags), portrait: portraitArt(scene.speaker, scene.id, state.flags) });
      if (step === spec.steps.length) break;
      const action = spec.steps[step]; state = take(state, action.choiceId, action.roll);
    }
  }
  assert.equal(rows.length, phase.baseline.visits); assert.equal(hash(JSON.stringify(rows)), phase.baseline.campaignSha256);
  const media = [...files("public/art"), ...files("public/audio")].filter(path => !phase.voiceIds.some(id => path === `public/audio/${id}.mp3`)).sort().map(path => ({ path, sha256: hash(readFileSync(path)) }));
  assert.deepEqual(media, phase.baseline.media);
});
it("opts in new UI cohorts without changing default factories, saves or game rules", () => {
  const input = load("encounter-craft/kerr-cash-private").character;
  assert.deepEqual(createCharacter(input), createCharacter({ ...input, emotionalPayoffs: false }));
  assert.equal(createCharacter({ ...input, emotionalPayoffs: true }).flags.emotional_payoffs_enabled, true);
  assert.throws(() => createCharacter({ ...input, emotionalPayoffs: "yes" as unknown as boolean }), /Invalid emotional/);
  const result = replayCampaign(load("emotional-payoff/edda-authenticated-names")).state;
  assert.equal(result.version, 2);
});
it("distinguishes an issuing-key match, ledger, failed search and unsubmitted question", () => {
  for (const [name, expected] of [["edda-authenticated-names", "authenticated"], ["edda-corroborated-witness", "corroborated"], ["edda-failed-quiet", "unanswered"], ["edda-deferred-quiet", "unanswered"]] as const) {
    const state = checkpoint(name, "payoff-keep-edda"), before = JSON.stringify(state);
    assert.equal(eddaPayoff(state), expected); assert.ok(sceneText(getScene(state.sceneId), state).includes(Q[expected]));
    assert.equal(eddaPayoff({ ...state, flags: { ...state.flags, craft_scope_issuer: true, craft_scope_movement: true } }), undefined);
    if (expected !== "unanswered") assert.equal(eddaPayoff({ ...state, journal: state.journal.filter(j => j.id !== "verified-order") }), undefined);
    assert.equal(JSON.stringify(state), before);
    const done = take(state, "payoff-keep-edda");
    for (const key of ["creds", "strain", "items", "rolls", "factions"] as const) assert.deepEqual(done[key], state[key]);
    assert.equal(done.flags.archive_key_authenticated, state.flags.archive_key_authenticated); assert.equal(done.flags.order_verified, state.flags.order_verified);
    assert.deepEqual(payoffReturnEffect(done, "edda"), {}); assert.equal(done.journal.find(j => j.id === "payoff-edda-moment")!.kind, "claim");
  }
  const failed = checkpoint("edda-failed-quiet", "payoff-keep-edda"), deferred = checkpoint("edda-deferred-quiet", "payoff-keep-edda");
  assert.match(sceneText(getScene(failed.sceneId), failed), /question you submitted/);
  assert.match(sceneText(getScene(deferred.sceneId), deferred), /drafted but never submitted/);
});
it("makes actual handover, recipient trace and uncollected space distinct without settling or curing", () => {
  for (const [name, expected] of [["kerr-private-witness", "private"], ["kerr-registered-listed", "registered"], ["kerr-canceled-quiet", "uncollected"], ["kerr-failed-quiet", "uncollected"], ["kerr-unfinished-names", "uncollected"]] as const) {
    const state = checkpoint(name, "payoff-keep-kerr"), done = take(state, "payoff-keep-kerr"); assert.equal(kerrPayoff(state), expected);
    for (const key of ["creds", "strain", "items", "rolls", "factions"] as const) assert.deepEqual(done[key], state[key]);
    for (const key of ["craft_kerr_settled", "kerr_contact_open", "kerr_route_trace", "kerr_route_delivered"] as const) assert.equal(done.flags[key], state.flags[key]);
    assert.deepEqual(payoffReturnEffect(done, "kerr"), {}); assert.equal(done.journal.find(j => j.id === "payoff-kerr-moment")!.kind, "claim");
    if (expected !== "uncollected") assert.equal(kerrPayoff({ ...state, journal: state.journal.filter(j => j.id !== "kerr-collection-outcome") }), undefined);
  }
  const trace = checkpoint("kerr-registered-listed", "payoff-keep-kerr");
  assert.equal(kerrPayoff({ ...trace, flags: { ...trace.flags, kerr_route_trace: false } }), "registered");
  const denied = { ...trace, flags: { ...trace.flags, kerr_route_denied: true } };
  assert.deepEqual(payoffReturnEffect(denied, "kerr"), {}); assert.ok(!presentChoices(denied, getScene(denied.sceneId)).some(c => c.id === "payoff-keep-kerr"));
  assert.ok(!sceneText(getScene(denied.sceneId), denied).includes(Q.registered));
  assert.equal(kerrPayoff({ ...trace, flags: { ...trace.flags, kerr_route_delivered: false, kerr_route_collected: true } }), undefined);
  const failed = checkpoint("kerr-failed-quiet", "payoff-keep-kerr");
  for (const id of ["kerr-itinerary", "kerr-collection-outcome"]) assert.equal(kerrPayoff({ ...failed, journal: failed.journal.filter(j => j.id !== id) }), undefined);
});
it("closes each coherent wall choice with its own acted beat before the factual aftermath", () => {
  for (const [name, quote] of [["finale-names-unvisited", Q.names], ["finale-quiet-unvisited", Q.quiet], ["finale-witness-unvisited", Q.witness], ["finale-listed-unvisited", Q.listed]] as const) {
    const state = replayCampaign(load(`emotional-payoff/${name}`)).state, before = JSON.stringify(state), scene = getScene(state.sceneId), text = sceneText(scene, state);
    assert.ok(text.endsWith(`"${quote}"`)); assert.ok(!text.includes("You remember the minute you stayed with Edda"));
    const queue = visibleCampaignDialogue(scene.id, scene.speaker, text); assert.equal(queue.filter(line => phase.voiceIds.includes(line.id)).length, 1);
    const legacy = { ...state, flags: { ...state.flags, emotional_payoffs_enabled: false } };
    assert.ok(!sceneText(scene, legacy).includes(quote)); assert.ok(visibleCampaignDialogue(scene.id, scene.speaker, sceneText(scene, legacy)).every(l => !phase.voiceIds.includes(l.id)));
    const conflicting = { ...state, flags: { ...state.flags, spoke_names: true, confirmed_leak: true } };
    assert.ok(!sceneText(scene, conflicting).includes(quote)); assert.equal(JSON.stringify(state), before);
  }
});
it("recalls only visits actually heard, retains a later denial, and gives wall actors no private knowledge", () => {
  const heard = replayCampaign(load("emotional-payoff/edda-authenticated-names")).state;
  assert.match(sceneText(getScene(heard.sceneId), heard), /You remember the minute you stayed with Edda/);
  assert.doesNotMatch(sceneText(getScene(heard.sceneId), { ...heard, journal: heard.journal.filter(j => j.id !== "payoff-edda-moment") }), /You remember the minute you stayed with Edda/);
  const denied = replayCampaign(load("emotional-payoff/kerr-contact-denied-witness")).state;
  assert.equal(denied.flags.kerr_route_denied, true); assert.match(sceneText(getScene(denied.sceneId), denied), /You remember the space beside Kerr's table/);
  assert.equal(presentChoices({ ...denied, sceneId: "act3_kerr_collection" }, getScene("act3_kerr_collection")).some(c => c.id === "payoff-kerr-moment"), false);
});
it("delivers ten exact quoted performances with existing actors, reviewed art and retained raw ASR", () => {
  assert.equal(bindings.length, 10); assert.equal(deliveries.lines.length, 10); assert.equal(transcripts.lines.length, 10);
  const seen = new Set<string>();
  for (const file of phase.newRoutes) {
    const spec = load(file.slice(0, -5)); let s = createCharacter(spec.character);
    const review = () => { const scene = getScene(s.sceneId); for (const b of visibleCampaignDialogue(scene.id, scene.speaker, sceneText(scene, s))) if (phase.voiceIds.includes(b.id)) seen.add(b.key); };
    review(); for (const step of spec.steps) { s = take(s, step.choiceId, step.roll); review(); }
  }
  assert.deepEqual([...seen].sort(), bindings.map(b => b.key).sort());
  for (const b of bindings) {
    const row = deliveries.lines.find(r => r.id === b.id)!, transcript = transcripts.lines.find(r => r.id === b.id)!;
    assert.equal(row.text, b.quote); assert.equal(row.speaker, b.speaker); assert.equal(hash(readFileSync(row.path)), row.sha256); assert.equal(transcript.sha256, row.sha256); assert.equal(transcript.exactNormalizedWords, true);
    assert.equal(row.voice, ({ Edda: "af_kore", Kerr: "am_adam", Sera: "af_bella", Ives: "am_eric" } as Record<string, string>)[row.speaker]);
    assert.ok(Math.abs(row.integratedLufs + 23.5) <= .6); assert.ok(row.truePeakDbtp <= -1.5); assert.ok(sceneIllustration(b.scene)); assert.ok(portraitArt(b.speaker, b.scene));
  }
});

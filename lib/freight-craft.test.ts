import { withoutSeraArt } from '../qa/production/sera-shift-cohort';
import { isConnectedPerformanceFile } from "../qa/production/connected-performance-media";
import routing from "../qa/media/return-routing.json";
import assert from "node:assert/strict";
import { it } from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { createCharacter, getScene, presentChoices, commitChoice, sceneText } from "./engine";
import { replayCampaign, type ReplaySpec } from "./story-replay";
import { routeCheckpoint } from "../qa/production/route-checkpoint";
import { rampAgreement, rampOutcome, rampPaid, rampSceneAvailable, RAMP_QUOTES, RAMP_SCENES } from "./freight-craft";
import { sceneIllustration, portraitArt } from "./art";
import { visibleCampaignDialogue } from "./campaign-dialogue";
import { importRun, exportRun } from "./vault";
import { objectives } from "./objectives";
import phase from "../qa/media/freight-craft.json";
import bindings from "../qa/media/freight-craft-dialogue-bindings.json";
import deliveries from "../qa/media/freight-craft-dialogue-provenance.json";
import transcripts from "../qa/media/freight-craft-dialogue-transcripts.json";
import history from "../qa/media/freight-craft-performance-review.json";
import currentArt from "../qa/media/scene-art.json";
import currentGallery from "../qa/media/art-gallery.json";
import originalGallery from "../qa/media/freight-craft-preceding-art-gallery.json";
import originalArt from "../qa/media/freight-craft-preceding-scene-art.json";
import { sceneSoundPlan } from "./sound";
const hash = (path: string) => createHash("sha256").update(readFileSync(path)).digest("hex");
const files = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap(r => r.isDirectory() ? files(`${dir}/${r.name}`) : [`${dir}/${r.name}`]).filter(p => !isConnectedPerformanceFile(p) && !routing.newMedia.includes(p) && !routing.newRoutes.includes(p.replace(/^qa\/routes\//, "")));
const checkpoint = (name: string, scene: string, action?: string) => routeCheckpoint(`freight-craft/${name}`, scene, action);
const take = (s: ReturnType<typeof createCharacter>, id: string) => { const c = presentChoices(s, getScene(s.sceneId)).find(c => c.id === id && c.enabled); assert.ok(c, `${s.sceneId}/${id}`); return commitChoice(s, c).state; };
for (const file of phase.newRoutes) it(`plays ${file} through actual held saves, receipts and finale`, () => {
  const spec = JSON.parse(readFileSync(`qa/routes/${file}`, "utf8")) as ReplaySpec, result = replayCampaign(spec);
  assert.deepEqual(importRun(exportRun(result.state)), result.state); assert.ok(result.transcript.every(t => t.restored));
});
it("preserves the precise historical route/media cohort and appends only thirteen new deliveries", () => {
  const oldRoutes = files("qa/routes").filter(f => f.endsWith(".json") && !phase.newRoutes.includes(f.slice(10)));
  assert.equal(oldRoutes.length, phase.baseline.routes); assert.equal(phase.baseline.routes, 219); assert.equal(phase.baseline.visits, 15496);
  assert.equal(phase.newRoutes.length, 12); assert.equal(new Set(phase.newRoutes).size, 12); assert.deepEqual(phase.newScenes, [...RAMP_SCENES]);
  const added = [...phase.artAssets.flatMap(a => a.files).map(f => f.path), ...phase.voiceIds.map(id => `public/audio/${id}.mp3`)]; assert.equal(added.length, 13);
  const current = [...files("public/art"), ...files("public/audio")].filter(f => !added.includes(f)).sort().map(path => ({ path, sha256: hash(path) }));
  assert.deepEqual(current, phase.baseline.media);
  for (const p of phase.baseline.preservedManifests) assert.equal(hash(p.path), p.sha256, p.path);
  assert.equal(hash(phase.baseline.sceneArt.path), phase.baseline.sceneArt.sha256);
  const reconstructed = withoutSeraArt(currentArt);
  reconstructed.decisions = reconstructed.decisions.filter(row => !row.scenes.some(id => routing.newScenes.includes(id)));
  for (const actor of reconstructed.speakingPortraits) actor.scenes = actor.scenes.filter(id => !routing.newScenes.includes(id));
  reconstructed.decisions = reconstructed.decisions.filter(row => !row.scenes.some(id => phase.newScenes.includes(id)));
  reconstructed.variants = reconstructed.variants.filter(row => !row.scenes.some(id => phase.newScenes.includes(id)));
  for (const actor of reconstructed.speakingPortraits) actor.scenes = actor.scenes.filter(id => !phase.newScenes.includes(id));
  assert.deepEqual(reconstructed, originalArt);
  assert.equal(hash(phase.baseline.artGallery.path), phase.baseline.artGallery.sha256);
  assert.deepEqual({ ...currentGallery, entries: currentGallery.entries.filter(row => row.src !== "/art/freight-ramp.jpg") }, originalGallery);
});
it("makes survey/cancellation free, commits actual support costs once, and leaves equipment owned", () => {
  const survey = checkpoint("bare-names", "act2_ramp_survey"), a = take(survey, "ramp-inspect-landing");
  for (const key of ["creds", "strain", "items", "factions", "rolls"] as const) assert.deepEqual(a[key], survey[key]);
  for (const [name, action, cash, strain] of [["bare-names", "ramp-lift-bare", 0, 2], ["blocks-witness", "ramp-lift-blocks", 5, 1], ["harness-listed", "ramp-lift-harness", 0, 1]] as const) {
    const s = checkpoint(name, "act2_ramp_gear"), paid = take(s, action); assert.equal(paid.creds, s.creds - cash); assert.equal(paid.strain, s.strain + strain); assert.deepEqual(paid.items, s.items); assert.ok(rampPaid(paid));
    assert.ok(!presentChoices(paid, getScene(paid.sceneId)).some(c => c.id.startsWith("ramp-lift-")));
  }
  const before = checkpoint("cancel", "act2_ramp_survey"), canceled = take(before, "ramp-cancel"); assert.equal(canceled.creds, before.creds); assert.equal(canceled.strain, before.strain); assert.equal(rampOutcome(canceled), "closed"); assert.ok(rampAgreement(canceled));
  assert.ok(!presentChoices(canceled, getScene(canceled.sceneId)).some(c => c.id === "ramp-open-plan"));
});
it("requires training, owned gear, affordable materials and real strain capacity; scarcity keeps a legal exit", () => {
  const poor = checkpoint("scarce", "act2_ramp_gear", "ramp-lift-bare"); assert.equal(poor.creds, 0);
  const choices = presentChoices(poor, getScene(poor.sceneId)); assert.equal(choices.find(c => c.id === "ramp-lift-blocks")!.enabled, false); assert.equal(choices.find(c => c.id === "ramp-lift-harness"), undefined); assert.ok(choices.find(c => c.id === "ramp-cancel")!.enabled);
  const high = { ...poor, strain: 5 }; assert.ok(presentChoices(high, getScene(high.sceneId)).filter(c => c.id.startsWith("ramp-lift-")).every(c => !c.enabled));
  const ghost = checkpoint("decline-ghost", "act2_ramp_terms"); assert.equal(presentChoices(ghost, getScene(ghost.sceneId)).find(c => c.id === "ramp-agree"), undefined);
  const stopped = checkpoint("failed-desk", "act2_ramp_stopped"), recovered = take(stopped, "ramp-recover-desk"); assert.equal(recovered.creds, stopped.creds); assert.equal(recovered.flags.freight_exposed, true); assert.equal(recovered.flags.freight_delivered, undefined);
});
it("keeps a carry distinct from the actual stock receipt, route clearance and treatment", () => {
  const s = checkpoint("bare-names", "act2_ramp_load"), arrived = take(s, "ramp-rest-before");
  assert.equal(arrived.flags.freight_at_intake, true); assert.equal(arrived.flags.freight_delivered, undefined); assert.ok(!arrived.items.includes("burner-route")); assert.equal(arrived.flags.order_verified, s.flags.order_verified);
  const stopped = take(s, "ramp-carry-past"); assert.equal(stopped.strain, s.strain); assert.equal(stopped.creds, s.creds); assert.equal(stopped.flags.freight_exposed, undefined); assert.equal(stopped.flags.freight_at_intake, undefined); assert.equal(rampOutcome(stopped), "failed");
  const paid = take(checkpoint("failed-courier", "act2_ramp_stopped"), "ramp-recover-courier"); assert.equal(paid.flags.freight_exposed, undefined); assert.equal(paid.flags.freight_delivered, undefined);
  const intake = checkpoint("bare-names", "act2_freight_intake"), received = take(intake, "acknowledge-freight-receipt"); assert.equal(received.flags.freight_delivered, true); assert.ok(received.items.includes("burner-route"));
});
it("keeps personal returns and private finale memories coherent, once-only and without new rights", () => {
  for (const [name, outcome] of [["bare-names", "kept"], ["failed-desk", "failed"], ["cancel", "closed"], ["decline-ghost", "closed"], ["unfinished", "unfinished"]] as const) {
    const s = checkpoint(name, "act3_ramp_return"), next = take(s, "ramp-keep-minute"); assert.equal(rampOutcome(s), outcome);
    for (const key of ["creds", "strain", "items", "factions", "rolls"] as const) assert.deepEqual(next[key], s[key]);
    assert.ok(!presentChoices(next, getScene(next.sceneId)).some(c => c.id === "ramp-ask-return"));
    const spec = JSON.parse(readFileSync(`qa/routes/freight-craft/${name}.json`, "utf8")) as ReplaySpec, final = replayCampaign(spec).state;
    assert.match(sceneText(getScene(final.sceneId), final), /At the wall, you remember/);
  }
  const unvisited = replayCampaign(JSON.parse(readFileSync("qa/routes/freight-craft/skipped-return.json", "utf8"))).state; assert.doesNotMatch(sceneText(getScene(unvisited.sceneId), unvisited), /At the wall, you remember/);
  const unfinished = checkpoint("unfinished", "act3_ramp_return"); assert.match(sceneText(getScene(unfinished.sceneId), unfinished), /week closed without/); assert.equal(objectives(unfinished).find(r => r.id === "freight-ramp")!.status, "Unresolved");
  for (const change of ["missing", "mixed", "kind", "disabled"] as const) {
    const s = structuredClone(checkpoint("bare-names", "act3_ramp_return"));
    if (change === "missing") s.journal = s.journal.filter(j => j.id !== "freight-ramp-handover");
    if (change === "mixed") s.flags.ramp_failed = true;
    if (change === "kind") s.journal.find(j => j.id === "freight-ramp-handover")!.kind = "claim";
    if (change === "disabled") s.flags.freight_craft_enabled = false;
    assert.equal(rampOutcome(s), undefined); assert.equal(rampSceneAvailable(s, s.sceneId), false); assert.equal(visibleCampaignDialogue(s.sceneId, "Asa", sceneText(getScene(s.sceneId), s)).length, 0);
  }
});
it("binds every final exact-word Asa performance to legal scenes, fitting art and quiet beds", () => {
  const seen = new Set<string>();
  for (const file of phase.newRoutes) {
    const spec = JSON.parse(readFileSync(`qa/routes/${file}`, "utf8")) as ReplaySpec; let s = createCharacter(spec.character);
    for (const step of spec.steps) { for (const l of visibleCampaignDialogue(s.sceneId, getScene(s.sceneId).speaker, sceneText(getScene(s.sceneId), s))) if (phase.voiceIds.includes(l.id)) seen.add(l.key); const c = presentChoices(s, getScene(s.sceneId)).find(c => c.id === step.choiceId && c.enabled)!; s = commitChoice(s, c, c.check ? { roll: step.roll! } : undefined).state; }
  }
  assert.deepEqual([...seen].sort(), bindings.map(b => b.key).sort()); assert.equal(deliveries.lines.length, 10); assert.equal(transcripts.lines.length, 10); assert.equal(history.iterations.length, 3); assert.ok(history.iterations[0].transcripts.lines.some(l => !l.exactNormalizedWords));
  for (const line of deliveries.lines) { const binding = bindings.find(b => b.id === line.id)!, transcript = transcripts.lines.find(t => t.id === line.id)!; assert.equal(line.voice, "af_alloy"); assert.equal(line.speaker, "Asa"); assert.equal(line.text, binding.text); assert.equal(hash(line.path), line.sha256); assert.equal(transcript.sha256, line.sha256); assert.ok(transcript.exactNormalizedWords); assert.deepEqual(transcript.transcription.toLowerCase().replace(/[’']/g, "").match(/[a-z0-9]+/g), line.text.toLowerCase().replace(/[’']/g, "").match(/[a-z0-9]+/g)); assert.ok(Math.abs(line.integratedLufs + 23.5) <= .6); assert.ok(line.truePeakDbtp <= -1.5); }
  assert.deepEqual(new Set(Object.values(RAMP_QUOTES)), new Set(bindings.map(b => b.text)));
  for (const id of RAMP_SCENES) { assert.ok(sceneIllustration(id)); assert.equal(portraitArt("Asa", id), "/art/asa-terms.jpg"); const example = phase.newRoutes.map(f => { try { return routeCheckpoint(f.slice(0, -5), id); } catch { return undefined; } }).find(Boolean)!; assert.equal(sceneSoundPlan(example, getScene(id).location).mood, "quiet"); }
});

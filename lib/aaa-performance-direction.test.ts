import freight from "../qa/media/freight-craft.json";
import assert from "node:assert/strict";
import { it } from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { DIRECTED_VOICE_IDS, performanceVoicePath } from "./performance-delivery";
import { voiceLevel } from "./voice-level";
import { getScene, sceneText } from "./engine";
import { visibleCampaignDialogue } from "./campaign-dialogue";
import { routeCheckpoint } from "../qa/production/route-checkpoint";
import phase from "../qa/media/aaa-performance-direction.json";
import visual from "../qa/media/aaa-visual-direction.json";
import lines from "../qa/media/aaa-performance-lines.json";
import review from "../qa/media/aaa-performance-review.json";
import precedingAsr from "../qa/media/emotional-payoff-dialogue-transcripts.json";
import audition from "../qa/media/aaa-performance-audition.json";
const hash = (file: string) => createHash("sha256").update(readFileSync(file)).digest("hex");
const files = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap(row => row.isDirectory() ? files(`${dir}/${row.name}`) : [`${dir}/${row.name}`]);
const words = (value: string) => value.toLowerCase().replace(/[’']/g, "").match(/[a-z0-9]+/g) ?? [];
it("retains all807 existing art/audio deliveries and the independently captured219-campaign contract", () => {
  assert.equal(phase.baseline.routes, 219); assert.equal(phase.baseline.visits, 15496);
  assert.equal(phase.baseline.campaignSha256, visual.baseline.campaignSha256);
  assert.equal(files("qa/routes").filter(f => f.endsWith(".json") && !freight.newRoutes.includes(f.slice("qa/routes/".length))).length, 219);
  assert.equal(phase.baseline.media.length, 807);
  const current = [...files("public/art"), ...files("public/audio")].filter(p => !phase.deliveries.some(d => d.path === p) && ![...freight.artAssets.flatMap(a => a.files).map(r => r.path), ...freight.voiceIds.map(id => `public/audio/${id}.mp3`)].includes(p)).sort().map(path => ({ path, sha256: hash(path) }));
  assert.deepEqual(current, phase.baseline.media); assert.equal(phase.newScenes.length, 0); assert.equal(phase.newRoutes.length, 0); assert.equal(phase.artAssets.length, 0);
});
it("selects only seven reviewed same-word actors and preserves actual authored scene bindings", () => {
  assert.deepEqual([...DIRECTED_VOICE_IDS], phase.selectedIds); assert.deepEqual(lines.map(l => l.id), phase.selectedIds);
  assert.equal(phase.selectedIds.length, 7); assert.equal(phase.retainedIds.length, 12); assert.equal(phase.examples.length, 19);
  for (const example of phase.examples) {
    const state = routeCheckpoint(example.route, example.sceneId, example.nextChoiceId), scene = getScene(state.sceneId);
    const line = visibleCampaignDialogue(scene.id, scene.speaker, sceneText(scene, state)).find(l => l.id === example.id);
    assert.ok(line); assert.equal(line.text, example.text); assert.equal(line.speaker, example.speaker); assert.equal(sceneText(scene, state), example.sceneText);
    assert.equal(performanceVoicePath(example.id), phase.selectedIds.includes(example.id) ? `/audio/performance-direction-v1/${example.id}.mp3` : undefined);
  }
  for (const id of ["unknown", "constructor", "__proto__", "../voice", "voice-campaign-encounter-craft-ba69df93d8d5"]) assert.equal(performanceVoicePath(id), undefined);
});
it("ships measured exact-word alternatives while retaining each exact original fallback", () => {
  assert.equal(phase.deliveries.length, 7);
  for (const row of phase.deliveries) {
    const old = review.before.lines.find(l => l.id === row.id)!, transcript = review.finalTranscripts.find(l => l.id === row.id)!;
    assert.equal(row.text, old.text); assert.equal(row.voice, old.voice); assert.equal(row.speaker, old.speaker);
    assert.equal(row.previousPath, row.fallbackPath); assert.equal(hash(row.fallbackPath), row.previousSha256); assert.equal(row.previousSha256, old.sha256);
    assert.equal(row.path, `public${performanceVoicePath(row.id)}`); assert.equal(hash(row.path), row.sha256); assert.equal(readFileSync(row.path).length, row.bytes);
    assert.ok(row.bytes < 3 * 1024 * 1024); assert.equal(row.channels, 1); assert.equal(row.sampleRate, 24000);
    assert.ok(Math.abs(row.integratedLufs + 23.5) <= .6); assert.ok(row.truePeakDbtp <= -1.5); assert.ok(row.peak < .95); assert.equal(voiceLevel(row.id), 1);
    assert.equal(row.segments.map(s => s.text).join(" "), row.text); assert.equal(transcript.sha256, row.sha256); assert.deepEqual(words(transcript.transcription), words(row.text));
  }
});
it("retains failed candidate observations and every historical scene/art/voice manifest unchanged", () => {
  for (const file of phase.preservedManifests) assert.equal(hash(file.path === "qa/media/scene-art.json" ? freight.baseline.sceneArt.path : file.path === "qa/media/art-gallery.json" ? freight.baseline.artGallery.path : file.path), file.sha256, file.path);
  assert.deepEqual(review.asrModel.files, precedingAsr.modelFiles);
  assert.equal(review.before.lines.length, 19); assert.equal(review.iterations.length, 3);
  assert.ok(review.before.lines.some(l => !l.exactNormalizedWords));
  assert.ok(review.iterations.every(r => r.transcripts.lines.some(l => !l.exactNormalizedWords)));
  const rejected = "voice-campaign-encounter-craft-ba69df93d8d5";
  assert.ok(phase.retainedIds.includes(rejected)); assert.equal(performanceVoicePath(rejected), undefined);
  for (const row of review.finalTranscripts) assert.deepEqual(words(row.transcription), words(row.text));
});
it("provides complete before/current scene-bed comparisons without replacing their source gains or words", () => {
  assert.equal(audition.samples.length, 19); assert.equal(audition.channels, 2); assert.equal(hash(audition.previewPath), audition.previewSha256);
  assert.equal(audition.samples.flatMap(r => r.versions).length, 26);
  for (const row of audition.samples) {
    assert.equal(hash(row.musicPath), row.musicSha256); assert.equal(hash(row.ambiencePath), row.ambienceSha256);
    assert.equal(row.text, phase.examples.find(e => e.id === row.id)!.text);
    assert.deepEqual(row.versions.map(v => v.version), phase.selectedIds.includes(row.id) ? ["before", "directed"] : ["retained"]);
    for (const version of row.versions) { assert.equal(hash(version.path), version.sha256); assert.ok(version.peak < .99); assert.ok(version.bedRms > 0); }
  }
});

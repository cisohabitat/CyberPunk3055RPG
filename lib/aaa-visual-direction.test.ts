import routing from "../qa/media/return-routing.json";
import freight from "../qa/media/freight-craft.json";
import performance from "../qa/media/aaa-performance-direction.json";
import assert from "node:assert/strict";
import { it } from "node:test";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { createCharacter, getScene, presentChoices, sceneText, commitChoice } from "./engine";
import { sceneIllustration, portraitArt } from "./art";
import { visibleCampaignDialogue } from "./campaign-dialogue";
import { VISUAL_DIRECTIONS, VISUAL_SHOTS, visualDirection } from "./visual-direction";
import { auditSceneArt } from "./scene-art";
import { SCENES } from "./story";
import { GALLERY_ART } from "./art-gallery";
import { ART_PREVIEWS } from "./art-previews";
import type { ReplaySpec } from "./story-replay";
import phase from "../qa/media/aaa-visual-direction.json";
import decisions from "../qa/media/scene-art.json";
import provenance from "../qa/media/art-provenance.json";

const hash = (v: string | Buffer) => createHash("sha256").update(v).digest("hex");
const files = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap(row => row.isDirectory() ? files(`${dir}/${row.name}`) : [`${dir}/${row.name}`]).filter(p => !routing.newMedia.includes(p) && !routing.newRoutes.includes(p.replace(/^qa\/routes\//, "")));
it("preserves every one of 219 campaigns, 15,496 visits, exact voices and original primary/earned shots", () => {
  const routes = files("qa/routes").filter(f => f.endsWith(".json") && !freight.newRoutes.includes(f.slice("qa/routes/".length))).sort(), rows = [];
  assert.equal(routes.length, phase.baseline.routes);
  for (const file of routes) {
    const spec = JSON.parse(readFileSync(file, "utf8")) as ReplaySpec; let state = createCharacter(spec.character);
    for (let step = 0; step <= spec.steps.length; step++) {
      const scene = getScene(state.sceneId), text = sceneText(scene, state), choices = presentChoices(state, scene);
      rows.push({ file, step, state, text, choices, voice: visibleCampaignDialogue(scene.id, scene.speaker, text), actor: scene.speaker, art: sceneIllustration(scene.id, state.flags), portrait: portraitArt(scene.speaker, scene.id, state.flags) });
      if (step === spec.steps.length) break;
      const action = spec.steps[step], choice = choices.find(c => c.id === action.choiceId && c.enabled); assert.ok(choice, `${file}/${action.choiceId}`);
      state = commitChoice(state, choice, choice.check ? { roll: action.roll! } : undefined).state;
    }
  }
  assert.equal(rows.length, phase.baseline.visits); assert.equal(hash(JSON.stringify(rows)), phase.baseline.campaignSha256);
  const additions = phase.artAssets.flatMap(a => a.files).map(f => f.path);
  const media = [...files("public/art"), ...files("public/audio")].filter(f => !additions.includes(f) && !performance.deliveries.some(d => d.path === f) && ![...freight.artAssets.flatMap(a => a.files).map(r => r.path), ...freight.voiceIds.map(id => `public/audio/${id}.mp3`)].includes(f)).sort().map(path => ({ path, sha256: hash(readFileSync(path)) }));
  assert.deepEqual(media, phase.baseline.media);
});
it("directs precisely fourteen actual places/actors with no unknown-scene or actor-only fallback", () => {
  assert.deepEqual(Object.keys(VISUAL_DIRECTIONS), phase.stages); assert.equal(phase.stages.length, 14);
  for (const id of phase.stages) {
    const direction = visualDirection(id)!; assert.equal(direction.kind, "conversation"); assert.ok(sceneIllustration(id));
    if (direction.person) assert.equal(direction.personSpeaker, getScene(id).speaker);
    if (getScene(id).speaker === "Edda") { assert.equal(direction.person, VISUAL_SHOTS.edda); assert.equal(direction.detail, VISUAL_SHOTS.question); }
    if (id.includes("kerr")) { assert.equal(direction.person, VISUAL_SHOTS.kerr); assert.equal(direction.detail, VISUAL_SHOTS.counter); }
    if (getScene(id).finale) { assert.equal(direction.person, undefined); assert.equal(direction.detail, VISUAL_SHOTS.memorial); }
  }
  for (const id of ["memo", "act2_witness_brief", "act2_middle", "act3_edda_reply", "__proto__", "constructor", "unknown"]) assert.equal(visualDirection(id), undefined);
});
it("keeps the explicit view audit in agreement and rejects missing, wrong-actor or unreviewed views", () => {
  assert.equal(Object.keys(auditSceneArt(SCENES)).length, Object.keys(SCENES).length);
  for (const change of ["missing", "actor", "image"] as const) {
    const source = structuredClone(decisions);
    if (change === "missing") source.sequenceViews.pop();
    if (change === "actor") source.sequenceViews[0].personSpeaker = "Mara";
    if (change === "image") source.sequenceViews[0].detail.src = "/art/finale-listed.jpg";
    assert.throws(() => auditSceneArt(SCENES, source), /Sequence view catalog/);
  }
});
it("ships four reviewed reference-matched paintings as twelve bounded same-master deliveries", () => {
  assert.equal(phase.artAssets.length, 4); const paths = new Set<string>();
  for (const asset of phase.artAssets) {
    assert.deepEqual(provenance.assets.find(a => a.id === asset.id), asset);
    assert.equal(asset.files.length, 3);
    for (const reference of asset.references) assert.equal(hash(readFileSync(reference.path)), reference.sha256);
    for (const row of asset.files) {
      assert.ok(!paths.has(row.path)); paths.add(row.path); const bytes = readFileSync(row.path);
      assert.equal(bytes.length, row.bytes); assert.equal(hash(bytes), row.sha256); assert.ok(row.bytes < 1048576);
      assert.equal(bytes.readUInt16BE(0), 0xffd8); assert.equal(bytes.readUInt16BE(bytes.length - 2), 0xffd9);
      assert.deepEqual([row.width, row.height], row.path.includes("previews/") ? [96, 64] : row.path.endsWith("-small.jpg") ? [600, 400] : [1200, 800]);
    }
    const entry = GALLERY_ART.find(r => r.src === `/art/${asset.id}.jpg`)!; assert.ok(entry);
    assert.equal(entry.small, `/art/${asset.id}-small.jpg`); assert.equal(ART_PREVIEWS[entry.src], `/art/previews/${asset.id}.jpg`);
  }
  assert.equal(paths.size, 12); assert.equal(phase.voiceIds.length, 0); assert.equal(phase.newScenes.length, 0); assert.equal(phase.newRoutes.length, 0);
});
it("retains the older visual review and every independently captured historical phase manifest", () => {
  assert.equal(phase.preservedManifests.length, 5);
  for (const file of phase.preservedManifests) assert.equal(hash(readFileSync(file.path)), file.sha256, file.path);
});

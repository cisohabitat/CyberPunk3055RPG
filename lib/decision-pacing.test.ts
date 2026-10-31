import { isConnectedPerformanceFile } from "../qa/production/connected-performance-media";
import routing from "../qa/media/return-routing.json";
import freight from "../qa/media/freight-craft.json";
import performance from "../qa/media/aaa-performance-direction.json";
import visual from "../qa/media/aaa-visual-direction.json";
import payoff from "../qa/media/emotional-payoff.json";
import craft from "../qa/media/encounter-craft.json";
import assert from "node:assert/strict";
import { it } from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { createCharacter, getScene, presentChoices, sceneText, commitChoice } from "./engine";
import { visibleCampaignDialogue } from "./campaign-dialogue";
import { sceneIllustration, portraitArt } from "./art";
import { DECISION_FIRST_SCENES, decisionFirstScene } from "./decision-pacing";
import type { ReplaySpec } from "./story-replay";
import baseline from "../qa/media/decision-pacing.json";
const files = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap(row => row.isDirectory() ? files(`${dir}/${row.name}`) : [`${dir}/${row.name}`]).filter(p => !isConnectedPerformanceFile(p) && !routing.newMedia.includes(p) && !routing.newRoutes.includes(p.replace(/^qa\/routes\//, "")));
const hash = (data: string | Buffer) => createHash("sha256").update(data).digest("hex");
it("preserves all 188 campaigns, 13,154 full visits and all 776 existing art/audio deliveries", () => {
  const routes = files("qa/routes").filter(file => file.endsWith(".json") && ![...craft.newRoutes, ...payoff.newRoutes, ...freight.newRoutes].includes(file.slice("qa/routes/".length))).sort(), rows = [];
  assert.equal(routes.length, baseline.routes);
  for (const file of routes) {
    const spec = JSON.parse(readFileSync(file, "utf8")) as ReplaySpec; let state = createCharacter(spec.character);
    for (let step = 0; step <= spec.steps.length; step++) {
      const scene = getScene(state.sceneId), text = sceneText(scene, state), choices = presentChoices(state, scene);
      rows.push({ file, step, state, text, choices, voice: visibleCampaignDialogue(scene.id, scene.speaker, text), actor: scene.speaker, art: sceneIllustration(scene.id, state.flags), portrait: portraitArt(scene.speaker, scene.id, state.flags) });
      if (step === spec.steps.length) break;
      const action = spec.steps[step], choice = choices.find(c => c.id === action.choiceId && c.enabled)!;
      assert.ok(choice); state = commitChoice(state, choice, choice.check ? { roll: action.roll! } : undefined).state;
    }
  }
  assert.equal(rows.length, baseline.visits); assert.equal(hash(JSON.stringify(rows)), baseline.campaignSha256);
  const media = [...files("public/art"), ...files("public/audio")].sort().filter(path => ![...craft.voiceIds, ...payoff.voiceIds].some(id => path === `public/audio/${id}.mp3`) && !visual.artAssets.flatMap(a => a.files).some(f => f.path === path) && !performance.deliveries.some(d => d.path === path) && ![...freight.artAssets.flatMap(a => a.files).map(r => r.path), ...freight.voiceIds.map(id => `public/audio/${id}.mp3`)].includes(path)).map(path => ({ path, sha256: hash(readFileSync(path)) }));
  assert.equal(media.length, baseline.mediaFiles); assert.equal(hash(JSON.stringify(media)), baseline.mediaSha256);
});
it("limits relocation to explicitly authored conversations and hubs, retaining every active task workspace", () => {
  assert.equal(new Set(DECISION_FIRST_SCENES).size, DECISION_FIRST_SCENES.length);
  for (const id of DECISION_FIRST_SCENES) { const scene = getScene(id); assert.equal(scene.memory, undefined); assert.ok(!scene.finale); assert.ok(decisionFirstScene(id)); }
  assert.deepEqual(DECISION_FIRST_SCENES.filter(id => getScene(id).choices.some(c => c.check)), ["act3_arrival"]);
  for (const id of ["memory_table", "memory_sequence", "act2_archive_compare", "act2_archive_prep", "act2_archive_door", "act2_archive_gap", "act2_archive_custody", "act2_workshop", "act2_witness_plan", "act2_witness_door", "act2_witness_checkpoint", "act3_testimony_review", "act2_technique_bench", "act2_route_map", "ending_names", "opening_city", "future-scene", "__proto__"]) assert.equal(decisionFirstScene(id), false, id);
});

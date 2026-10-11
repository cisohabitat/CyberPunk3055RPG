import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { commitChoice, createCharacter, getScene, presentChoices, sceneText } from "../lib/engine";
import { SCENES } from "../lib/story";
import { nightRetell } from "../lib/story/retell";
import { replayCampaign, type ReplaySpec } from "../lib/story-replay";
import type { GameState } from "../lib/types";

// Development-only paired prose audit. Keep the state-bearing baseline outside Git.
type Visit = { route: string; step: number; state: GameState; text: string; retell: string[] };
type Baseline = { mechanics: string; finals: Record<string, string>; visits: Visit[] };
const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value, (_, item) => typeof item === "function" ? item.toString() : item)).digest("hex");
const words = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;
const mechanics = () => hash(Object.fromEntries(Object.entries(SCENES).map(([id, scene]) => [id, { ...scene, text: undefined }])));
const [mode, baselinePath, outputPath] = process.argv.slice(2);
if (!baselinePath || !["capture", "compare"].includes(mode) || (mode === "compare" && !outputPath)) throw new Error("Use capture PRIVATE_BASELINE or compare PRIVATE_BASELINE SUMMARY_JSON");
if (mode === "capture") {
  const visits: Visit[] = [], finals: Record<string, string> = {};
  for (const file of readdirSync("qa/routes").filter(name => name.endsWith(".json")).sort()) {
    const spec = JSON.parse(readFileSync(`qa/routes/${file}`, "utf8")) as ReplaySpec;
    finals[file] = hash(replayCampaign(spec).state);
    let state = createCharacter(spec.character);
    for (let step = 0; step <= spec.steps.length; step++) {
      visits.push({ route: file, step, state, text: sceneText(getScene(state.sceneId), state), retell: nightRetell(state) });
      if (step === spec.steps.length) break;
      const entry = spec.steps[step];
      const choice = presentChoices(state, getScene(state.sceneId)).find(choice => choice.id === entry.choiceId && choice.enabled);
      assert.ok(choice, `${file}:${step}`);
      state = commitChoice(state, choice, choice.check ? { roll: entry.roll! } : undefined).state;
    }
  }
  writeFileSync(baselinePath, JSON.stringify({ mechanics: mechanics(), finals, visits }));
  console.log(JSON.stringify({ routes: Object.keys(finals).length, visits: visits.length }));
} else {
  const baseline = JSON.parse(readFileSync(baselinePath, "utf8")) as Baseline;
  assert.equal(mechanics(), baseline.mechanics, "Canonical choices, effects, gates, destinations and non-prose scene definitions changed");
  for (const [file, expected] of Object.entries(baseline.finals)) {
    const spec = JSON.parse(readFileSync(`qa/routes/${file}`, "utf8")) as ReplaySpec;
    assert.equal(hash(replayCampaign(spec).state), expected, `${file}: canonical final state changed`);
  }
  const audit = new Map<string, { scene: string; visits: number; changedVisits: number; before: number; after: number; maxBefore: number; maxAfter: number }>();
  let before = 0, after = 0, retellChanges = 0;
  for (const visit of baseline.visits) {
    const current = sceneText(getScene(visit.state.sceneId), visit.state), oldWords = words(visit.text), newWords = words(current);
    before += oldWords; after += newWords;
    if (["ending_names", "ending_quiet", "ending_witness", "ending_listed"].includes(visit.state.sceneId) && hash(nightRetell(visit.state)) !== hash(visit.retell)) retellChanges++;
    const row = audit.get(visit.state.sceneId) ?? { scene: visit.state.sceneId, visits: 0, changedVisits: 0, before: 0, after: 0, maxBefore: 0, maxAfter: 0 };
    row.visits++; row.changedVisits += Number(current !== visit.text); row.before += oldWords; row.after += newWords;
    row.maxBefore = Math.max(row.maxBefore, oldWords); row.maxAfter = Math.max(row.maxAfter, newWords); audit.set(row.scene, row);
  }
  const result = { method: "Identical pre-choice states from deterministic full-campaign fixtures; authored dice and retained source knowledge. Aggregate scene prose, excluding separately rendered finale retell. No reading-time or human-comprehension claim.", routes: Object.keys(baseline.finals).length, visits: baseline.visits.length, canonicalDefinitionsUnchanged: true, finalStatesUnchanged: true, wordsBefore: before, wordsAfter: after, changePercent: Number(((after / before - 1) * 100).toFixed(2)), retellChangedVisits: retellChanges, changedScenes: [...audit.values()].filter(row => row.changedVisits) };
  writeFileSync(outputPath, JSON.stringify(result, null, 2) + "\n"); console.log(JSON.stringify(result));
}

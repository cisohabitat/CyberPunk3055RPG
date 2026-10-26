/** Offline QA only. Raw character states never ship in the application. */
import { readFileSync, readdirSync } from "node:fs";
import { createCharacter, commitChoice, getScene, presentChoices, sceneText, stageCheck } from "../../lib/engine";
import { visibleCampaignDialogue, visibleCheckDialogue } from "../../lib/campaign-dialogue";
import { SCENES } from "../../lib/story";
import type { Choice, GameState, CheckResult } from "../../lib/types";
import type { ReplaySpec } from "../../lib/story-replay";
import { allCampaignDialogue as bindings } from "../../lib/campaign-dialogue";

type Example = { state: GameState; route: string; source: "authored-route" | "seeded-route" | "branch-sample"; checkResult?: boolean };
export function dialogueExamples(): Map<string, Example> {
  const examples = new Map<string, Example>(), representative = new Map<string, GameState>(), flags = new Set<string>();
  const target = new Set(bindings.map(line => line.id));
  const record = (state: GameState, route: string, source: Example["source"]) => {
    const scene = getScene(state.sceneId);
    if (source !== "branch-sample") { if (!representative.has(scene.id)) representative.set(scene.id, state); Object.keys(state.flags).forEach(flag => flags.add(flag)); }
    for (const line of visibleCampaignDialogue(scene.id, scene.speaker, sceneText(scene, state))) if (!examples.has(line.id)) examples.set(line.id, { state, route, source });
  };
  const recordCheck = (state: GameState, choice: Choice, check: CheckResult | null, route: string, source: Example["source"]) => {
    if (!check) return;
    const scene = getScene(state.sceneId);
    for (const line of visibleCheckDialogue(scene.id, choice.id, scene.speaker, check.success, check.flavor)) if (!examples.has(line.id)) {
      examples.set(line.id, { state: stageCheck(state, choice.id, check.roll), route, source, checkResult: true });
    }
  };
  for (const file of readdirSync("qa/routes").filter(f => f.endsWith(".json")).sort()) {
    const spec = JSON.parse(readFileSync(`qa/routes/${file}`, "utf8")) as ReplaySpec;
    let state = createCharacter(spec.character); record(state, file, "authored-route");
    for (const step of spec.steps) {
      const choice = presentChoices(state, getScene(state.sceneId)).find(c => c.id === step.choiceId && c.enabled);
      if (!choice) throw new Error(`Unavailable authored choice ${file}/${step.choiceId}`);
      const committed = commitChoice(state, choice, choice.check ? { roll: step.roll! } : undefined);
      recordCheck(state, choice, committed.check, file, "authored-route"); state = committed.state; record(state, file, "authored-route");
    }
  }
  for (let seed = 1; seed <= 900 && examples.size < target.size; seed++) {
    let value = seed >>> 0;
    const random = () => { value = (Math.imul(value, 1664525) + 1013904223) >>> 0; return value / 4294967296; };
    let state = createCharacter({ handle: "Media review", givenName: "Jo", origin: (["gutterwire", "spire", "dustline"] as const)[seed % 3], complication: (["debt", "optic", "on-file"] as const)[seed % 3], bonus: { chrome: seed % 2, nerve: 0, face: 1, ghost: 1 - seed % 2 }, startWithPrologue: seed % 2 === 0 });
    for (let n = 0; n < 180; n++) {
      record(state, `seed:${seed}`, "seeded-route"); const scene = getScene(state.sceneId); if (scene.finale) break;
      const choices = presentChoices(state, scene).filter(c => c.enabled); if (!choices.length) break;
      const choice = choices[Math.floor(random() * choices.length)], committed = commitChoice(state, choice, choice.check ? { roll: 1 + Math.floor(random() * 10) } : undefined);
      recordCheck(state, choice, committed.check, `seed:${seed}`, "seeded-route"); state = committed.state;
    }
  }
  // Imported checkpoints and authored conditional branches receive separate labels;
  // sampling flags is not reported as a legally completed player route.
  for (const path of readdirSync("lib", { recursive: true }).filter(path => String(path).endsWith(".ts") && !String(path).endsWith(".test.ts"))) {
    const text = readFileSync(`lib/${path}`, "utf8"); for (const match of text.matchAll(/flags\.([a-z0-9_]+)/g)) flags.add(match[1]);
  }
  for (const scene of Object.values(SCENES)) {
    if (examples.size === target.size) break;
    const base = representative.get(scene.id) ?? createCharacter({ handle: "Media review", givenName: "Jo", origin: "spire", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 } });
    const sample = (flags: GameState["flags"]) => record({ ...base, sceneId: scene.id, flags }, "authored-branch-sample", "branch-sample");
    sample({}); sample(Object.fromEntries([...flags].map(flag => [flag, true])));
    for (const flag of flags) { sample({ ...base.flags, [flag]: true }); sample({ ...base.flags, [flag]: false }); sample({ [flag]: true }); }
  }
  const missing = [...target].filter(id => !examples.has(id)); if (missing.length) throw new Error(`No displayed source example for ${missing.join(", ")}`);
  return examples;
}

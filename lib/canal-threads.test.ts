import assert from "node:assert/strict";
import { it } from "node:test";
import { readdirSync, readFileSync } from "node:fs";
import { CANAL_THREADS, canalThreads } from "./canal-threads";
import { createCharacter, commitChoice, getScene, presentChoices } from "./engine";
import type { ReplaySpec } from "./story-replay";

it("classifies actual canal work exactly once while leaving the chapter decision separate", () => {
  const ids = CANAL_THREADS.flatMap(thread => [...thread.choices]);
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual([...ids, "stand", "deal"].sort(), getScene("act2_middle").choices.map(choice => choice.id).sort());
  assert.deepEqual(canalThreads("__proto__", []), []);
  assert.deepEqual(canalThreads("act3_arrival", []), []);
});
it("guides only enabled authored actions without changing any replay state, choice order or metadata", () => {
  let visits = 0;
  for (const file of readdirSync("qa/routes").filter(file => file.endsWith(".json"))) {
    const spec = JSON.parse(readFileSync(`qa/routes/${file}`, "utf8")) as ReplaySpec;
    let state = createCharacter(spec.character);
    for (const step of spec.steps) {
      const choices = presentChoices(state, getScene(state.sceneId));
      const before = JSON.stringify({ state, choices });
      const threads = canalThreads(state.sceneId, choices);
      if (state.sceneId === "act2_middle") {
        visits++;
        const links = threads.flatMap(thread => thread.choices);
        assert.ok(links.every(choice => choice.enabled && choices.includes(choice)));
        assert.ok(links.every(choice => !["stand", "deal"].includes(choice.id)));
        for (const thread of threads) {
          const ids = new Set<string>(CANAL_THREADS.find(row => row.id === thread.id)!.choices);
          assert.deepEqual(thread.choices, choices.filter(choice => choice.enabled && ids.has(choice.id)));
        }
        assert.deepEqual(canalThreads(state.sceneId, choices.map(choice => ({ ...choice, enabled: false }))), []);
      } else assert.deepEqual(threads, []);
      assert.equal(JSON.stringify({ state, choices }), before);
      const choice = choices.find(choice => choice.id === step.choiceId && choice.enabled)!;
      state = commitChoice(state, choice, choice.check ? { roll: step.roll! } : undefined).state;
    }
  }
  assert.ok(visits > 100);
});

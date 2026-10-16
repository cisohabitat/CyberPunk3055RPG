import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { GOAL_DECIDE, GOAL_LIFT, GOAL_WALL, GOAL_WEEK } from "./story/goal.ts";

const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");
const agents = readFileSync(new URL("../AGENTS.md", import.meta.url), "utf8");

describe("docs", () => {
  it("keeps the readme and the agent guide on the same game", () => {
    for (const sentence of [GOAL_LIFT, GOAL_DECIDE, GOAL_WEEK, GOAL_WALL]) {
      assert.ok(readme.includes(sentence), `README missing: ${sentence}`);
      assert.ok(agents.includes(sentence), `AGENTS missing: ${sentence}`);
    }
    assert.ok(readme.includes("saint-shard-3055-v1"));
    assert.ok(agents.includes("saint-shard-3055-v1"));
    assert.ok(readme.includes("AGENTS.md"));
    assert.ok(agents.includes("README.md"));
    assert.match(agents, /update `README\.md` and `AGENTS\.md` in the same change/);
  });
  it("requires documentation updates in CI and keeps the always-update instructions aligned", () => {
    const workflow = readFileSync(new URL("../.github/workflows/ci.yml", import.meta.url), "utf8");
    const cursor = readFileSync(new URL("../.cursor/rules/keep-docs.mdc", import.meta.url), "utf8");
    const source = workflow.split("\n  test:")[1].split("\n  browser:")[0];
    assert.match(source, /fetch-depth: 0/);
    assert.match(source, /name: Require README and agent guide updates\s+run: node scripts\/docs-freshness\.mjs/);
    assert.ok(source.indexOf("node scripts/docs-freshness.mjs") < source.indexOf("run: npm ci"));
    const requiredSteps = source.split("      - name: Upload gameplay balance evidence")[0];
    assert.doesNotMatch(requiredSteps, /continue-on-error|if:/);
    assert.match(requiredSteps, /name: Audit gameplay balance\s+run: npm run balance:audit/);
    assert.match(requiredSteps, /name: Compare matched mission objectives\s+run: npm run balance:missions/);
    assert.match(requiredSteps, /name: Check goal-driven campaign economy\s+run: npm run balance:campaigns/);
    assert.match(requiredSteps, /name: Check overlapping clinic and witness work\s+run: npm run balance:overlap/);
    const scripts = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).scripts;
    assert.match(scripts["balance:overlap"], /clinic-overlap\.ts && node --import tsx scripts\/distribution-overlap\.ts/);
    assert.match(source, /name: Upload gameplay balance evidence\s+if: always\(\)/);
    for (const text of [readme, agents, cursor]) assert.match(text, /For every repository change/);
    assert.doesNotMatch(agents + cursor, /A change that does not move those facts can leave both files/);
  });
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { GOAL_DECIDE, GOAL_LIFT, GOAL_WALL, GOAL_WEEK } from "./story/goal.ts";
import { parse } from "yaml";

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
    const source = parse(workflow).jobs.test.steps;
    assert.equal(source.find((step: any) => step.uses?.startsWith("actions/checkout@")).with["fetch-depth"], 0);
    const docs = source.findIndex((step: any) => step.run === "node scripts/docs-freshness.mjs");
    assert.ok(docs >= 0 && docs < source.findIndex((step: any) => step.run === "npm ci"));
    const requiredSteps = source.slice(0, source.findIndex((step: any) => step.name === "Upload gameplay balance evidence"));
    for (const step of requiredSteps) { assert.equal(step.if, undefined); assert.equal(step["continue-on-error"], undefined); }
    for (const run of ["npm run balance:audit", "npm run balance:missions", "npm run balance:campaigns", "npm run balance:overlap"]) assert.ok(requiredSteps.some((step: any) => step.run === run));
    const scripts = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).scripts;
    assert.match(scripts["balance:overlap"], /clinic-overlap\.ts && node --import tsx scripts\/distribution-overlap\.ts/);
    assert.equal(source.find((step: any) => step.name === "Upload gameplay balance evidence").if, "always()");
    for (const text of [readme, agents, cursor]) assert.match(text, /For every repository change/);
    assert.doesNotMatch(agents + cursor, /A change that does not move those facts can leave both files/);
  });
});

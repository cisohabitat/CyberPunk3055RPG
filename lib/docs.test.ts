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
});

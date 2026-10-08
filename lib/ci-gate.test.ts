import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { productionDecision } from "../scripts/ci-gate.mjs";

const workflow = readFileSync(fileURLToPath(new URL("../.github/workflows/ci.yml", import.meta.url)), "utf8");
const vercel = readFileSync(fileURLToPath(new URL("../vercel.json", import.meta.url)), "utf8");

function run(name: string, status: string, conclusion: string | null, started_at = "2026-10-08T00:00:00Z") {
  return { name, status, conclusion, started_at };
}

describe("production gate", () => {
  it("waits until both checks have passed", () => {
    assert.equal(productionDecision([]), "wait");
    assert.equal(productionDecision([run("Test", "completed", "success")]), "wait");
    assert.equal(
      productionDecision([run("Test", "completed", "success"), run("Build", "in_progress", null)]),
      "wait",
    );
  });

  it("builds only after Test and Build both succeed", () => {
    assert.equal(
      productionDecision([run("Test", "completed", "success"), run("Build", "completed", "success")]),
      "build",
    );
  });

  it("skips production when a check fails or is skipped", () => {
    assert.equal(productionDecision([run("Test", "completed", "failure")]), "skip");
    assert.equal(
      productionDecision([run("Test", "completed", "success"), run("Build", "completed", "skipped")]),
      "skip",
    );
  });

  it("uses the latest run when a check was rerun", () => {
    assert.equal(
      productionDecision([
        run("Test", "completed", "failure", "2026-10-08T00:00:00Z"),
        run("Test", "completed", "success", "2026-10-08T00:05:00Z"),
        run("Build", "completed", "success", "2026-10-08T00:06:00Z"),
      ]),
      "build",
    );
  });

  it("keeps the workflow job names wired to the production gate", () => {
    assert.match(workflow, /name: Test/);
    assert.match(workflow, /needs: test/);
    assert.match(workflow, /name: Build/);
    assert.match(workflow, /npm test/);
    assert.match(workflow, /npm run build/);
    assert.match(vercel, /node scripts\/wait-for-ci\.mjs/);
  });
});

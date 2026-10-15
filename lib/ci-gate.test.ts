import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { BROWSER_CHECKS, productionDecision, requiredMatrixPassed } from "../scripts/ci-gate.mjs";
import { spawnSync } from "node:child_process";

const workflow = readFileSync(fileURLToPath(new URL("../.github/workflows/ci.yml", import.meta.url)), "utf8");
const vercel = readFileSync(fileURLToPath(new URL("../vercel.json", import.meta.url)), "utf8");

function run(name: string, status: string, conclusion: string | null, started_at = "2026-10-08T00:00:00Z") {
  return { name, status, conclusion, started_at };
}
const passedBrowsers = () => BROWSER_CHECKS.map(name => run(name, "completed", "success"));

describe("production gate", () => {
  it("requires the successful source job and complete browser matrix, including failure/skip/cancel/unknown states", () => {
    const statuses = [undefined, "", "success", "failure", "cancelled", "skipped", "pending", "in_progress"];
    for (const source of statuses) for (const browsers of statuses) assert.equal(requiredMatrixPassed(source, browsers), source === "success" && browsers === "success");
    for (const [source, browsers] of [["success", "success"], ["success", "failure"], ["failure", "success"], ["success", "skipped"], ["success", "cancelled"], ["", ""]]) {
      const processResult = spawnSync(process.execPath, ["scripts/require-browser-checks.mjs"], { env: { ...process.env, TEST_RESULT: source, BROWSER_RESULT: browsers } });
      assert.equal(processResult.status, source === "success" && browsers === "success" ? 0 : 1);
    }
    assert.match(workflow, /project: \[chromium, phone, firefox, webkit\]/);
    assert.match(workflow, /fail-fast: false/);
    assert.match(workflow, /needs: \[test, browser\]/);
    assert.match(workflow, /--project=\$\{\{ matrix\.project \}\} --workers=4/);
    assert.match(workflow, /run: node scripts\/require-browser-checks\.mjs/);
  });
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
      productionDecision([run("Test", "completed", "success"), run("Build", "completed", "success"), ...passedBrowsers()]),
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
        ...passedBrowsers(),
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

  it("never publishes an incomplete, failed or stale browser matrix behind a successful aggregate", () => {
    const checks = [run("Test", "completed", "success"), run("Build", "completed", "success"), ...passedBrowsers()];
    assert.equal(productionDecision(checks.slice(0, -1)), "wait");
    for (const conclusion of ["failure", "skipped", "cancelled"]) assert.equal(productionDecision([...checks.slice(0, -1), run("Browser (webkit)", "completed", conclusion)]), "skip");
    for (const status of ["queued", "in_progress"]) assert.equal(productionDecision([...checks.slice(0, -1), run("Browser (webkit)", status, null)]), "wait");
    const old = checks.map((check, index) => ({ ...check, id: 100 + index }));
    const freshTest = { ...run("Test", "completed", "success"), id: 200 };
    assert.equal(productionDecision([...old, freshTest]), "wait");
    assert.equal(productionDecision([...old.map(check => ({ ...check, conclusion: "failure" })), freshTest]), "wait");
    assert.equal(productionDecision([freshTest, { ...run("Build", "completed", "success"), id: 205 }, ...passedBrowsers()]), "wait");
    const newBrowsers = passedBrowsers().map((check, index) => ({ ...check, id: 201 + index }));
    assert.equal(productionDecision([...old, freshTest, ...newBrowsers]), "wait");
    assert.equal(productionDecision([...old, freshTest, ...newBrowsers, { ...run("Build", "completed", "success"), id: 205 }]), "build");
  });

  it("waits for a newer queued rerun even before its start time exists", () => {
    assert.equal(productionDecision([
      { ...run("Test", "completed", "success"), id: 100 },
      { ...run("Build", "completed", "success"), id: 101 },
      { ...run("Build", "queued", null), id: 102, started_at: null },
    ]), "wait");
  });
});

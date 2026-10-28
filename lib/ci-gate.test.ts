import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { BROWSER_CHECKS, productionDecision, requiredMatrixPassed } from "../scripts/ci-gate.mjs";
import { spawnSync } from "node:child_process";
import { parse } from "yaml";
import { PROJECTS, SHARD_COUNT, WORKERS } from "../scripts/browser-ci-core.mjs";

const workflow = readFileSync(fileURLToPath(new URL("../.github/workflows/ci.yml", import.meta.url)), "utf8");
const vercel = readFileSync(fileURLToPath(new URL("../vercel.json", import.meta.url)), "utf8");
const jobs = parse(workflow).jobs;

function run(name: string, status: string, conclusion: string | null, started_at = "2026-10-08T00:00:00Z") {
  return { name, status, conclusion, started_at };
}
const passedBrowsers = () => BROWSER_CHECKS.map(name => run(name, "completed", "success"));

describe("production gate", () => {
  it("never combines required checks from different workflow suites", () => {
    const checks = [run("Test", "completed", "success"), ...passedBrowsers(), run("Build", "completed", "success")]
      .map((check, index) => ({ ...check, id: 100 + index, check_suite: { id: 10 } }));
    assert.equal(productionDecision(checks), "build");
    for (let index = 1; index < checks.length; index++) {
      assert.equal(productionDecision(checks.map((check, position) => position === index ? { ...check, check_suite: { id: 20 } } : check)), "wait");
      assert.equal(productionDecision(checks.map((check, position) => position === index ? { ...check, check_suite: undefined } : check)), "wait");
    }
  });
  it("requires the successful source job and complete browser matrix, including failure/skip/cancel/unknown states", () => {
    const statuses = [undefined, "", "success", "failure", "cancelled", "skipped", "pending", "in_progress"];
    for (const source of statuses) for (const browsers of statuses) assert.equal(requiredMatrixPassed(source, browsers), source === "success" && browsers === "success");
    for (const [source, browsers] of [["success", "success"], ["success", "failure"], ["failure", "success"], ["success", "skipped"], ["success", "cancelled"], ["", ""]]) {
      const processResult = spawnSync(process.execPath, ["scripts/require-browser-checks.mjs"], { env: { ...process.env, TEST_RESULT: source, BROWSER_RESULT: browsers } });
      assert.equal(processResult.status, source === "success" && browsers === "success" ? 0 : 1);
    }
    assert.deepEqual(jobs.browser.strategy.matrix.project, PROJECTS);
    assert.deepEqual(jobs.browser_shard.strategy.matrix.project, PROJECTS);
    assert.deepEqual(jobs.browser_shard.strategy.matrix.shard, Array.from({ length: SHARD_COUNT }, (_, i) => i + 1));
    for (const job of [jobs.browser, jobs.browser_shard]) assert.equal(job.strategy["fail-fast"], false);
    assert.deepEqual(jobs.build.needs, ["test", "browser"]);
    assert.deepEqual(jobs.browser.needs, ["test", "browser_shard"]);
    assert.equal(jobs.browser.if, "${{ always() }}");
    assert.equal(jobs.build.if, "${{ always() }}");
    const verify = jobs.browser.steps.find((step: { name: string }) => step.name === "Require every shard and exact complete project coverage");
    assert.equal(verify.env.TEST_RESULT, "${{ needs.test.result }}");
    assert.equal(verify.env.SHARDS_RESULT, "${{ needs.browser_shard.result }}");
    assert.equal(verify.run, "node scripts/browser-ci.mjs verify ${{ matrix.project }}");
    assert.equal(jobs.browser_shard.steps.find((step: { name: string }) => step.name === "Run and verify the required browser shard").run,
      "node scripts/browser-ci.mjs run ${{ matrix.project }} ${{ matrix.shard }}");
    assert.equal(WORKERS, 4);
    assert.ok(jobs.build.steps.some((step: { run: string }) => step.run === "node scripts/require-browser-checks.mjs"));
    for (const job of Object.values(jobs) as { steps: { [key: string]: unknown }[] }[]) {
      assert.equal((job as any)["runs-on"], "ubuntu-24.04");
      assert.equal(Object.hasOwn(job, "continue-on-error"), false);
      for (const step of job.steps) assert.equal(Object.hasOwn(step, "continue-on-error"), false);
    }
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
    assert.equal(jobs.test.name, "Test");
    assert.equal(jobs.browser.name, "Browser (${{ matrix.project }})");
    assert.equal(jobs.build.name, "Build");
    assert.equal(jobs.browser_shard.needs, "test");
    const steps = Object.values(jobs).flatMap((job: any) => job.steps);
    assert.equal(steps.filter(step => step.run === "npm run build").length, 1);
    assert.equal(steps.filter(step => step.run === "npm run production:report").length, 1);
    assert.ok(jobs.test.steps.some((step: any) => step.run === "npm test"));
    assert.ok(jobs.test.steps.some((step: any) => step.run === "node scripts/browser-ci.mjs plan"));
    const artifact = jobs.test.steps.find((step: any) => step.with?.name === "browser-build-${{ github.run_attempt }}");
    assert.equal(artifact.with["include-hidden-files"], true);
    assert.equal(artifact.with["if-no-files-found"], "error");
    assert.match(artifact.with.path, /!\.next\/cache\//);
    const native = jobs.browser_shard.steps.find((step: any) => step.name === "Check native menu permission before campaign regressions");
    assert.equal(native.if, "matrix.project == 'chromium' && matrix.shard == 1");
    assert.match(native.run, /--workers=1/);
    const captions = jobs.browser_shard.steps.find((step: any) => step.name === "Check all speaker captions before campaign regressions");
    assert.equal(captions.if, "matrix.shard == 1");
    assert.match(captions.run, /--grep "all actors identify" --project=\$\{\{ matrix.project \}\} --workers=4/);
    for (const name of ["browser", "browser_shard"]) {
      for (const step of jobs[name].steps.filter((step: any) => step.uses?.startsWith("actions/download-artifact@"))) {
        assert.equal(step.with["run-id"], undefined);
        assert.ok(String(step.with.name ?? step.with.pattern).includes("${{ github.run_attempt }}"));
      }
    }
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

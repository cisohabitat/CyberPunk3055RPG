import assert from "node:assert/strict";
import { it } from "node:test";
import config from "../playwright.config";
import { makePlan, PROJECTS, SHARD_COUNT, verifyProject, verifyShard } from "../scripts/browser-ci-core.mjs";

const identity = { sha: "a".repeat(40), lock: "b".repeat(64), build: "same-build", playwright: "1.64.0", node: "22", platform: "linux", arch: "x64", run: "local", attempt: "1" };
function fixture(project = "webkit") {
  const tests = PROJECTS.flatMap(project => Array.from({ length: 8 }, (_, i) => ({ id: `${project}-${i}`, project, file: "game.spec.ts", title: `case ${i}`, titles: [project, "game.spec.ts", `case ${i}`] })));
  const plan = makePlan(tests, identity);
  const reports = Array.from({ length: SHARD_COUNT }, (_, i) => ({ schema: 1, identity: { ...identity }, project, shard: i + 1, shards: 4, workers: 4,
    status: "passed", errors: [], tests: tests.filter(test => test.project === project).filter((_, n) => n % 4 === i).map(test => ({ ...test,
      expectedStatus: "passed", outcome: "expected", results: [{ status: "passed", retry: 0, duration: 10 }] })) }));
  return { plan, reports };
}
it("requires every original browser project, complete discovery and unchanged runner policy", () => {
  assert.equal(config.testDir, "./tests"); assert.equal(config.fullyParallel, true); assert.equal(config.timeout, 30_000);
  assert.equal(config.retries, process.env.CI ? 1 : 0); assert.equal(config.forbidOnly, Boolean(process.env.CI));
  for (const key of ["testMatch", "testIgnore", "grep", "grepInvert"]) assert.equal((config as Record<string, unknown>)[key], undefined);
  assert.deepEqual(config.projects!.map(project => project.name), PROJECTS);
  const { plan, reports } = fixture();
  assert.deepEqual(verifyProject(plan, reports, "webkit", "success"), { project: "webkit", revision: identity.sha, total: 8, passed: 8, flaky: 0, skipped: 0 });
});
it("rejects missing, extra, duplicated and stale shard coverage, including a successful-looking partial report", () => {
  const { plan, reports } = fixture();
  for (const result of [undefined, "", "skipped", "cancelled", "failure", "in_progress"]) assert.throws(() => verifyProject(plan, reports, "webkit", result));
  assert.throws(() => verifyProject(plan, reports.slice(1), "webkit", "success"));
  assert.throws(() => verifyProject(plan, [...reports, reports[0]], "webkit", "success"));
  assert.throws(() => verifyProject(plan, [reports[0], reports[0], reports[2], reports[3]], "webkit", "success"));
  for (const edit of [
    (r: any) => r.tests.pop(),
    (r: any) => r.tests.push(r.tests[0]),
    (r: any) => { r.tests[0].id = "not-planned"; },
    (r: any) => { r.tests[0].title = "renamed"; },
    (r: any) => { r.tests[0].file = "other.spec.ts"; },
    (r: any) => { r.tests[0].project = "firefox"; },
    (r: any) => { r.status = "interrupted"; },
    (r: any) => { r.errors = ["unattributed failure"]; },
    (r: any) => { r.workers = 1; },
    (r: any) => { r.shards = 3; },
  ]) { const changed = structuredClone(reports); edit(changed[0]); assert.throws(() => verifyProject(plan, changed, "webkit", "success")); }
  for (const key of Object.keys(identity)) {
    const changed = structuredClone(reports); (changed[0].identity as any)[key] = "other";
    assert.throws(() => verifyProject(plan, changed, "webkit", "success"));
  }
  assert.throws(() => makePlan(plan.tests.filter(test => test.project !== "phone"), identity));
  assert.throws(() => makePlan([...plan.tests, plan.tests[0]], identity));
});
it("requires real final passes and honest retry history; allows only the two existing native-policy skips", () => {
  const { plan, reports } = fixture();
  for (const status of ["failed", "timedOut", "interrupted", "skipped"]) {
    const changed = structuredClone(reports); changed[0].tests[0].results[0].status = status;
    assert.throws(() => verifyShard(plan, changed[0], "webkit", 1));
  }
  const retry = structuredClone(reports);
  retry[0].tests[0].results = [{ status: "timedOut", retry: 0, duration: 30_000 }, { status: "passed", retry: 1, duration: 12 }];
  retry[0].tests[0].outcome = "flaky";
  assert.equal(verifyProject(plan, retry, "webkit", "success").flaky, 1);
  retry[0].tests[0].outcome = "expected";
  assert.throws(() => verifyProject(plan, retry, "webkit", "success"));
  for (const project of PROJECTS) {
    const fixtureData = fixture(project), row = fixtureData.plan.tests.find(test => test.project === project)!;
    row.file = "menu-autoplay-policy.spec.ts"; row.title = "native title autoplay policy document-user-activation-required";
    row.titles = [project, row.file, row.title];
    Object.assign(fixtureData.reports[0].tests[0], row, { outcome: "skipped", expectedStatus: "skipped", results: [{ status: "skipped", retry: 0, duration: 0 }] });
    if (project === "chromium") assert.throws(() => verifyProject(fixtureData.plan, fixtureData.reports, project, "success"));
    else {
      assert.equal(verifyProject(fixtureData.plan, fixtureData.reports, project, "success").skipped, 1);
      row.titles.splice(2, 0, "new nested case");
      fixtureData.reports[0].tests[0].titles = [...row.titles];
      assert.throws(() => verifyProject(fixtureData.plan, fixtureData.reports, project, "success"));
    }
  }
});

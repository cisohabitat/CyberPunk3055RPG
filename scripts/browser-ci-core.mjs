import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";

export const PROJECTS = ["chromium", "phone", "firefox", "webkit"];
export const SHARD_COUNT = 4;
export const WORKERS = 4;
export const PLAN_PATH = ".ci/browser-plan.json";
const SCHEMA = 1;
const nativePolicies = ["no-user-gesture-required", "document-user-activation-required"];
export function allowedSkip(test) {
  return ["phone", "firefox", "webkit"].includes(test.project) && test.file === "menu-autoplay-policy.spec.ts"
    && nativePolicies.some(policy => test.title === `native title autoplay policy ${policy}`)
    && JSON.stringify(test.titles) === JSON.stringify([test.project, test.file, test.title]);
}
export function assertProject(project) {
  if (!PROJECTS.includes(project)) throw new Error(`Unknown browser project: ${project}`);
}
export function assertShard(shard) {
  if (!Number.isInteger(shard) || shard < 1 || shard > SHARD_COUNT) throw new Error("Invalid browser shard");
}
export function digest(value) { return createHash("sha256").update(value).digest("hex"); }
export function readJson(path) { return JSON.parse(readFileSync(path, "utf8")); }
export function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(value, null, 2) + "\n");
}
export function identity() {
  const head = spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" });
  if (head.status !== 0) throw new Error("Cannot establish build revision");
  const sha = head.stdout.trim();
  if (!/^[0-9a-f]{40}$/.test(sha) || (process.env.GITHUB_SHA && process.env.GITHUB_SHA !== sha)) throw new Error("Build revision mismatch");
  return { sha, lock: digest(readFileSync("package-lock.json")), build: readFileSync(".next/BUILD_ID", "utf8").trim(),
    playwright: readJson("node_modules/@playwright/test/package.json").version, node: process.versions.node.split(".")[0], platform: process.platform, arch: process.arch,
    run: process.env.GITHUB_RUN_ID ?? "local", attempt: process.env.GITHUB_RUN_ATTEMPT ?? "1" };
}
function assertIdentity(actual, expected) {
  for (const key of ["sha", "lock", "build", "playwright", "node", "platform", "arch", "run", "attempt"]) {
    if (!actual?.[key] || actual[key] !== expected?.[key]) throw new Error(`Browser evidence ${key} mismatch`);
  }
}
export function validatePlan(plan) {
  if (plan?.schema !== SCHEMA || plan.shards !== SHARD_COUNT || plan.workers !== WORKERS || !Array.isArray(plan.tests)) throw new Error("Invalid browser plan");
  const build = plan.identity;
  if (!/^[0-9a-f]{40}$/.test(build?.sha ?? "") || !/^[0-9a-f]{64}$/.test(build?.lock ?? "") || !build?.build
    || !/^\d+\.\d+\.\d+/.test(build?.playwright ?? "") || !/^\d+$/.test(build?.node ?? "") || !build?.platform || !build?.arch
    || !/^(local|\d+)$/.test(build?.run ?? "") || !/^[1-9]\d*$/.test(build?.attempt ?? "")) throw new Error("Invalid build identity");
  const seen = new Set(), names = new Set();
  for (const test of plan.tests) {
    assertProject(test.project);
    const titlePath = JSON.stringify(test.titles);
    if (!test.id || !test.file || !test.title || !Array.isArray(test.titles) || test.titles[0] !== test.project || test.titles[1] !== test.file
      || test.titles.at(-1) !== test.title || names.has(titlePath) || seen.has(`${test.project}:${test.id}`)) throw new Error("Duplicate or invalid planned test");
    seen.add(`${test.project}:${test.id}`);
    names.add(titlePath);
  }
  for (const project of PROJECTS) if (!plan.tests.some(test => test.project === project)) throw new Error(`Missing full project inventory: ${project}`);
  return plan;
}
export function makePlan(tests, build) {
  return validatePlan({ schema: SCHEMA, identity: build, shards: SHARD_COUNT, workers: WORKERS, tests });
}
export function verifyShard(plan, report, project, shard) {
  validatePlan(plan); assertProject(project); assertShard(shard);
  assertIdentity(report?.identity, plan.identity);
  if (report.schema !== SCHEMA || report.project !== project || report.shard !== shard || report.shards !== SHARD_COUNT
    || report.workers !== WORKERS || report.status !== "passed" || !Array.isArray(report.errors) || report.errors.length !== 0 || !Array.isArray(report.tests) || !report.tests.length) throw new Error("Incomplete or unsuccessful browser shard");
  const expected = new Set(plan.tests.filter(test => test.project === project).map(test => test.id)), seen = new Set();
  for (const test of report.tests) {
    if (test.project !== project || !expected.has(test.id) || seen.has(test.id)) throw new Error("Unexpected or duplicate shard test");
    seen.add(test.id);
    const original = plan.tests.find(row => row.project === project && row.id === test.id);
    if (test.file !== original.file || test.title !== original.title || JSON.stringify(test.titles) !== JSON.stringify(original.titles)
      || !Array.isArray(test.results) || !test.results.length) throw new Error("Missing test execution");
    const last = test.results.at(-1);
    if (test.results.length > 2 || test.results.some((row, index) => row.retry !== index || !Number.isFinite(row.duration) || row.duration < 0)
      || test.results.slice(0, -1).some(row => !["failed", "timedOut"].includes(row.status))) throw new Error("Invalid retry execution history");
    if (last.status === "skipped") {
      if (!allowedSkip(original) || test.outcome !== "skipped" || test.expectedStatus !== "skipped") throw new Error("New or unexpected skipped browser case");
    } else if (last.status !== "passed" || test.expectedStatus !== "passed" || test.outcome !== (test.results.length === 1 ? "expected" : "flaky")) throw new Error("Browser case did not pass");
  }
  return report;
}
export function verifyProject(plan, reports, project, shardResult) {
  if (shardResult !== "success") throw new Error("Every browser shard job must succeed");
  if (!Array.isArray(reports) || reports.length !== SHARD_COUNT) throw new Error("Missing or extra browser shard evidence");
  const seenShards = new Set(), seenTests = new Set();
  for (const report of reports) {
    verifyShard(plan, report, project, report.shard);
    if (seenShards.has(report.shard)) throw new Error("Repeated browser shard");
    seenShards.add(report.shard);
    for (const test of report.tests) {
      if (seenTests.has(test.id)) throw new Error("Browser case executed in multiple shards");
      seenTests.add(test.id);
    }
  }
  const expected = plan.tests.filter(test => test.project === project);
  if (seenTests.size !== expected.length || expected.some(test => !seenTests.has(test.id))) throw new Error("Full browser coverage is incomplete");
  const tests = reports.flatMap(report => report.tests);
  return { project, revision: plan.identity.sha, total: tests.length,
    passed: tests.filter(test => test.outcome === "expected").length,
    flaky: tests.filter(test => test.outcome === "flaky").length,
    skipped: tests.filter(test => test.outcome === "skipped").length };
}
export function runPlaywright(args, env = {}) {
  const result = spawnSync(process.execPath, ["node_modules/@playwright/test/cli.js", "test", ...args], { stdio: "inherit", env: { ...process.env, ...env } });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Playwright failed (${result.signal ?? result.status})`);
}
function manifests(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? manifests(path) : entry.name === "result.json" ? [readJson(path)] : [];
  });
}
function blobReports(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? blobReports(path) : entry.name.endsWith(".zip") && dirname(path).endsWith("/blob") ? [path] : [];
  });
}
export async function main() {
  const [command, project, index] = process.argv.slice(2);
  if (command === "plan") {
    rmSync(PLAN_PATH, { force: true });
    rmSync(".next/ci-build.json", { force: true });
    runPlaywright(["--list", "--reporter=./qa/ci/coverage-reporter.ts"], { CI_REPORT_MODE: "plan", CI_REPORT_PATH: PLAN_PATH });
    const plan = validatePlan(readJson(PLAN_PATH)); assertIdentity(plan.identity, identity());
    writeJson(".next/ci-build.json", { schema: SCHEMA, identity: plan.identity, plan: digest(readFileSync(PLAN_PATH)) });
    console.log(`Planned ${plan.tests.length} browser executions across ${PROJECTS.length} complete projects.`);
  } else if (command === "run") {
    assertProject(project); const shard = Number(index); assertShard(shard);
    const plan = validatePlan(readJson(PLAN_PATH)), build = readJson(".next/ci-build.json");
    assertIdentity(plan.identity, identity()); assertIdentity(build.identity, plan.identity);
    if (build.schema !== SCHEMA || build.plan !== digest(readFileSync(PLAN_PATH))) throw new Error("Restored build/plan integrity mismatch");
    const directory = `.ci/results/${project}-${shard}`;
    // A failed reporter must never leave an older successful result usable.
    rmSync(`${directory}/result.json`, { force: true });
    rmSync(`${directory}/blob`, { force: true, recursive: true });
    runPlaywright([`--project=${project}`, `--shard=${shard}/${SHARD_COUNT}`, `--workers=${WORKERS}`,
      `--output=${directory}/test-results`, "--reporter=github,blob,./qa/ci/coverage-reporter.ts"],
    { CI_REPORT_MODE: "shard", CI_REPORT_PATH: `${directory}/result.json`, CI_BROWSER_PROJECT: project, CI_BROWSER_SHARD: String(shard), PLAYWRIGHT_BLOB_OUTPUT_DIR: `${directory}/blob` });
    verifyShard(plan, readJson(`${directory}/result.json`), project, shard);
  } else if (command === "verify") {
    assertProject(project);
    if (process.env.TEST_RESULT !== "success") throw new Error("Source tests and shared build must succeed");
    const plan = validatePlan(readJson(PLAN_PATH));
    // Aggregators do not download the application build, so check the checkout
    // and lockfile directly; the shard manifests carry its exact build identity.
    const head = spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" });
    if (head.status !== 0 || head.stdout.trim() !== plan.identity.sha || (process.env.GITHUB_SHA && process.env.GITHUB_SHA !== plan.identity.sha)
      || digest(readFileSync("package-lock.json")) !== plan.identity.lock
      || plan.identity.run !== (process.env.GITHUB_RUN_ID ?? "local") || plan.identity.attempt !== (process.env.GITHUB_RUN_ATTEMPT ?? "1")) throw new Error("Aggregate revision or workflow attempt mismatch");
    const reports = manifests(".ci/shards");
    const summary = verifyProject(plan, reports, project, process.env.SHARDS_RESULT);
    if (reports.every(report => Number.isFinite(report.duration) && report.duration >= 0)) summary.longestShardSeconds = Math.round(Math.max(...reports.map(report => report.duration)) / 100) / 10;
    const blobs = blobReports(".ci/shards");
    if (blobs.length !== SHARD_COUNT) throw new Error("Missing or extra browser blob reports");
    mkdirSync(".ci/merge", { recursive: true });
    blobs.forEach((path, index) => copyFileSync(path, `.ci/merge/report-${index + 1}.zip`));
    writeJson(`qa/production/reports/browser-${project}.json`, summary);
    console.log(JSON.stringify(summary));
    if (process.env.GITHUB_STEP_SUMMARY) writeFileSync(process.env.GITHUB_STEP_SUMMARY,
      `### ${project}\n\n${summary.total} collected; ${summary.passed} passed; ${summary.flaky} passed on retry; ${summary.skipped} existing skips. All four shards and the complete inventory verified.\n${summary.longestShardSeconds === undefined ? "" : `\nLongest test shard: ${summary.longestShardSeconds}s (excluding dependency setup and preflight).\n`}`, { flag: "a" });
  } else throw new Error("Expected plan, run or verify");
}

export const TEST_CHECK = "Test";
export const BUILD_CHECK = "Build";
export const BROWSER_CHECKS = ["Browser (chromium)", "Browser (phone)", "Browser (firefox)", "Browser (webkit)"];

export function requiredMatrixPassed(testResult, browserResult) {
  return testResult === "success" && browserResult === "success";
}

export function latestRun(runs, name) {
  const matches = runs.filter((run) => run.name === name);
  // A newly queued rerun may have no started_at yet. GitHub's assigned run id
  // still orders it after an earlier successful attempt.
  matches.sort((a, b) => {
    if (Number.isSafeInteger(a.id) && Number.isSafeInteger(b.id) && a.id !== b.id) return b.id - a.id;
    return String(b.started_at ?? "").localeCompare(String(a.started_at ?? ""));
  });
  return matches[0];
}

function finished(run) {
  return Boolean(run && run.status === "completed");
}

export function productionDecision(runs) {
  const test = latestRun(runs, TEST_CHECK);
  // A workflow rerun can expose a fresh Test before its aggregate Build exists.
  // Earlier successors, successful or failed, are absent from the new cohort.
  const successors = [latestRun(runs, BUILD_CHECK), ...BROWSER_CHECKS.map(name => latestRun(runs, name))]
    .map(check => test && Number.isSafeInteger(test.id) && (!Number.isSafeInteger(check?.id) || check.id <= test.id) ? undefined : check);
  const required = [test, ...successors];
  if (required.some(check => finished(check) && check.conclusion !== "success")) return "skip";
  if (required.every(check => finished(check) && check.conclusion === "success")) return "build";
  return "wait";
}

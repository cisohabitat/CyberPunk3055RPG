export const TEST_CHECK = "Test";
export const BUILD_CHECK = "Build";

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
  const build = latestRun(runs, BUILD_CHECK);
  if (finished(test) && test.conclusion !== "success") return "skip";
  if (finished(build) && build.conclusion !== "success") return "skip";
  if (finished(test) && test.conclusion === "success" && finished(build) && build.conclusion === "success") return "build";
  return "wait";
}

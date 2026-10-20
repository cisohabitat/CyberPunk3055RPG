import { BUILD_CHECK, TEST_CHECK, productionDecision } from "./ci-gate.mjs";

export const CI_DEADLINE_MS = 45 * 60_000;
export const CHECK_REQUEST_MS = 10_000;
export const CI_POLL_MS = 60_000;

async function readChecks(url, signal) {
  const response = await fetch(url, {
    signal,
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "saint-shard-ci",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!response.ok) throw new Error(`GitHub checks returned ${response.status}`);
  const body = await response.json();
  if (!Array.isArray(body.check_runs) || !Number.isSafeInteger(body.total_count) || body.total_count !== body.check_runs.length) {
    throw new Error("GitHub checks response is incomplete or invalid");
  }
  // A third-party integration can publish a check with the same display name.
  // Only GitHub Actions is allowed to satisfy this repository's deploy gate.
  const checks = body.check_runs.filter(run => run && run.app?.slug === "github-actions");
  if (checks.some(run => !Number.isSafeInteger(run.id) || run.id <= 0 || !Number.isSafeInteger(run.check_suite?.id) || run.check_suite.id <= 0)) {
    throw new Error("GitHub check identity is invalid");
  }
  return checks;
}

// Exit 1 permits Vercel's build; all uncertain or unsuccessful states exit 0.
export async function waitForProductionChecks({
  url, read = readChecks, now = Date.now,
  sleep = ms => new Promise(resolve => setTimeout(resolve, ms)),
  onWait = message => console.log(message),
  deadlineMs = CI_DEADLINE_MS, requestMs = CHECK_REQUEST_MS, intervalMs = CI_POLL_MS,
}) {
  const deadline = now() + deadlineMs;
  const timeout = { exitCode: 0, message: "CI did not finish in time. Skipping the production deploy." };
  for (;;) {
    const remaining = deadline - now();
    if (remaining <= 0) return timeout;
    let decision;
    try { decision = productionDecision(await read(url, AbortSignal.timeout(Math.min(requestMs, remaining)))); }
    catch { return { exitCode: 0, message: "Could not read CI status within its request limit. Skipping the production deploy." }; }
    if (now() >= deadline) return timeout;
    if (decision === "build") return { exitCode: 1, message: `${TEST_CHECK}, ${BUILD_CHECK} and all required Browser checks passed. Building production.` };
    if (decision === "skip") return { exitCode: 0, message: `Required ${TEST_CHECK}, ${BUILD_CHECK} or Browser checks did not pass. Skipping the production deploy.` };
    onWait(`Waiting for ${TEST_CHECK}, ${BUILD_CHECK} and all required Browser checks.`);
    await sleep(Math.min(intervalMs, deadline - now()));
  }
}

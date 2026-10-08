import { BUILD_CHECK, TEST_CHECK, productionDecision } from "./ci-gate.mjs";

const INTERVAL_MS = 10_000;
const DEADLINE_MS = 10 * 60 * 1000;

function proceed(message) {
  console.log(message);
  process.exit(1);
}

function skip(message) {
  console.log(message);
  process.exit(0);
}

if (process.env.VERCEL_ENV !== "production") {
  proceed("Not a production deploy. Building without waiting for CI.");
}

const owner = process.env.VERCEL_GIT_REPO_OWNER;
const repo = process.env.VERCEL_GIT_REPO_SLUG;
const sha = process.env.VERCEL_GIT_COMMIT_SHA;

if (!owner || !repo || !sha) {
  skip("Production deploy is missing git metadata. Skipping so an untested build cannot ship.");
}

const url = `https://api.github.com/repos/${owner}/${repo}/commits/${sha}/check-runs?per_page=100`;

async function checks() {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "saint-shard-ci",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!response.ok) throw new Error(`GitHub checks returned ${response.status}`);
  const body = await response.json();
  return Array.isArray(body.check_runs) ? body.check_runs : [];
}

const started = Date.now();

try {
  for (;;) {
    const decision = productionDecision(await checks());
    if (decision === "build") {
      proceed(`${TEST_CHECK} and ${BUILD_CHECK} passed. Building production.`);
    }
    if (decision === "skip") {
      skip(`${TEST_CHECK} or ${BUILD_CHECK} did not pass. Skipping the production deploy.`);
    }
    if (Date.now() - started > DEADLINE_MS) {
      skip("CI did not finish in time. Skipping the production deploy.");
    }
    console.log(`Waiting for ${TEST_CHECK} and ${BUILD_CHECK}.`);
    await new Promise((resolve) => setTimeout(resolve, INTERVAL_MS));
  }
} catch (error) {
  console.error(error);
  skip("Could not read CI status. Skipping the production deploy.");
}

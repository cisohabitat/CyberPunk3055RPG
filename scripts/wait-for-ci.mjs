import { waitForProductionChecks } from "./ci-wait.mjs";

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

const result = await waitForProductionChecks({ url });
console.log(result.message);
process.exitCode = result.exitCode;

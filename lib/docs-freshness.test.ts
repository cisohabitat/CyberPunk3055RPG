import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { it, type TestContext } from "node:test";
import { fileURLToPath } from "node:url";
import { checkDocumentation } from "../scripts/docs-freshness.mjs";

const script = fileURLToPath(new URL("../scripts/docs-freshness.mjs", import.meta.url));
function fixture(t: TestContext) {
  const dir = mkdtempSync(join(tmpdir(), "saint-docs-")), repo = join(dir, "repo"); mkdirSync(repo);
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const git = (...args: string[]) => execFileSync("git", ["-c", "user.name=Docs gate test", "-c", "user.email=docs@example.invalid", "-c", "core.hooksPath=/dev/null", ...args], { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  const write = (path: string, text: string) => writeFileSync(join(repo, path), text);
  const commit = () => { git("add", "--all"); git("commit", "--no-gpg-sign", "-qm", "Docs gate fixture"); return git("rev-parse", "HEAD"); };
  git("init", "-q", "-b", "main"); git("config", "core.filemode", "true");
  write("README.md", "Player guide.\n"); write("AGENTS.md", "Agent guide.\n"); write("app.txt", "Before.\n");
  const base = commit();
  const check = (head: string, start: string | null = base) => checkDocumentation({ base: start, head, repo });
  const event = (name: string, data: unknown) => {
    const path = join(dir, "event.json"); writeFileSync(path, JSON.stringify(data));
    const result = spawnSync(process.execPath, [script], { cwd: repo, encoding: "utf8", env: { ...process.env, GITHUB_EVENT_NAME: name, GITHUB_EVENT_PATH: path } });
    assert.equal(result.error, undefined, result.error?.message);
    return result;
  };
  return { repo, base, git, write, commit, check, event };
}

it("requires current content in both docs for every changed repository tree", t => {
  const f = fixture(t); f.write("app.txt", "New feature.\n");
  assert.deepEqual(f.check(f.commit()).missing, ["README.md", "AGENTS.md"]);
  f.write("README.md", "Player guide. New feature explained.\n");
  assert.deepEqual(f.check(f.commit()).missing, ["AGENTS.md"]);
  f.write("AGENTS.md", "Agent guide. New feature implementation and maintenance.\n");
  assert.equal(f.check(f.commit()).ok, true);
});

it("rejects permission-only updates, reverted doc content and deleted documents", t => {
  const f = fixture(t); f.write("app.txt", "Changed.\n");
  for (const path of ["README.md", "AGENTS.md"]) chmodSync(join(f.repo, path), 0o755);
  assert.deepEqual(f.check(f.commit()).missing, ["README.md", "AGENTS.md"]);
  f.write("README.md", "Updated player guide.\n"); f.write("AGENTS.md", "Updated agent guide.\n"); f.commit();
  f.write("README.md", "Player guide.\n"); f.write("AGENTS.md", "Agent guide.\n");
  assert.deepEqual(f.check(f.commit()).missing, ["README.md", "AGENTS.md"]);
  f.write("README.md", "Updated player guide.\n"); rmSync(join(f.repo, "AGENTS.md"));
  assert.deepEqual(f.check(f.commit()).missing, ["AGENTS.md"]);
});

it("checks a complete multi-commit push rather than just its final commit", t => {
  const f = fixture(t); f.write("README.md", "Player guide for the coming feature.\n"); f.write("AGENTS.md", "Agent guide for the coming feature.\n");
  const docs = f.commit(); f.write("app.txt", "Feature implementation.\n"); const head = f.commit();
  assert.equal(f.check(head, docs).ok, false);
  const result = f.event("push", { before: f.base, after: head });
  assert.equal(result.status, 0, result.stderr); assert.match(result.stdout, /both documents have updated content/);
});

it("checks PR changes since the merge base and never credits unrelated base-branch documentation", t => {
  const f = fixture(t); f.git("checkout", "-qb", "feature"); f.write("app.txt", "PR feature.\n"); const feature = f.commit();
  f.git("checkout", "main"); f.write("README.md", "Unrelated main player documentation.\n"); f.write("AGENTS.md", "Unrelated main agent documentation.\n"); const main = f.commit();
  const data = (head: string) => ({ pull_request: { base: { sha: main }, head: { sha: head } } });
  const rejected = f.event("pull_request", data(feature));
  assert.equal(rejected.status, 1); assert.match(rejected.stderr, /README\.md, AGENTS\.md/);
  f.git("checkout", "feature"); f.write("README.md", "PR player documentation.\n"); f.write("AGENTS.md", "PR agent documentation.\n");
  const accepted = f.event("pull_request", data(f.commit())); assert.equal(accepted.status, 0, accepted.stderr);
});

it("handles an initial branch snapshot and an unchanged tree without inventing doc edits", t => {
  const f = fixture(t);
  assert.equal(f.check(f.base, null).ok, true);
  assert.equal(f.check(f.base).changedFiles, 0); assert.equal(f.check(f.base).ok, true);
  const initial = f.event("push", { before: "0".repeat(40), after: f.base }); assert.equal(initial.status, 0, initial.stderr);
  rmSync(join(f.repo, "AGENTS.md")); assert.deepEqual(f.check(f.commit(), null).missing, ["AGENTS.md"]);
});

it("fails closed on unavailable history, malformed events and unsupported event types", t => {
  const f = fixture(t);
  const missing = f.event("push", { before: "f".repeat(40), after: f.base });
  assert.equal(missing.status, 1); assert.match(missing.stderr, /unavailable history never bypasses/);
  assert.equal(f.event("push", { before: "bad", after: f.base }).status, 1);
  assert.equal(f.event("push", { before: f.base, after: "0".repeat(40) }).status, 1);
  assert.equal(f.event("pull_request", {}).status, 1);
  assert.equal(f.event("workflow_dispatch", {}).status, 1);
  const local = spawnSync(process.execPath, [script, f.base, f.base], { cwd: f.repo, encoding: "utf8", env: process.env });
  assert.equal(local.error, undefined, local.error?.message); assert.equal(local.status, 0, local.stderr); assert.match(local.stdout, /no repository content changed/);
});

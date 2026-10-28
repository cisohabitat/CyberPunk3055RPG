import assert from "node:assert/strict";
import { cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { it } from "node:test";

it("collects, executes and verifies all real reporter shards without accepting omitted evidence", { timeout: 120_000 }, () => {
  // Synthetic assertion-only cases exercise the actual Playwright reporter and
  // CLI protocol; they require no browser binary or deployment credentials.
  const root = fileURLToPath(new URL("../", import.meta.url));
  const directory = mkdtempSync(join(tmpdir(), "saint-ci-protocol-"));
  function command(executable: string, args: string[], env = {}) {
    const result = spawnSync(executable, args, { cwd: directory, encoding: "utf8", env: { ...process.env, ...env }, timeout: 30_000 });
    assert.equal(result.status, 0, result.error?.message ?? result.stderr + result.stdout);
    return result.stdout.trim();
  }
  try {
    mkdirSync(join(directory, "scripts")); mkdirSync(join(directory, "qa/ci"), { recursive: true });
    mkdirSync(join(directory, "tests")); mkdirSync(join(directory, ".next"));
    for (const file of ["scripts/browser-ci.mjs", "scripts/browser-ci-core.mjs", "qa/ci/coverage-reporter.ts"]) cpSync(join(root, file), join(directory, file));
    symlinkSync(join(root, "node_modules"), join(directory, "node_modules"), "dir");
    writeFileSync(join(directory, "package-lock.json"), '{"fixture":true}\n');
    writeFileSync(join(directory, ".next/BUILD_ID"), "protocol-fixture\n");
    writeFileSync(join(directory, "playwright.config.js"), `const {defineConfig}=require('@playwright/test');module.exports=defineConfig({testDir:'./tests',fullyParallel:true,retries:1,projects:['chromium','phone','firefox','webkit'].map(name=>({name}))});`);
    writeFileSync(join(directory, "tests/basic.spec.ts"), `import {test,expect} from '@playwright/test';for(let n=0;n<8;n++)test('fixture case '+n,()=>expect(n).toBeGreaterThanOrEqual(0));`);
    writeFileSync(join(directory, "tests/menu-autoplay-policy.spec.ts"), `import {test} from '@playwright/test';for(const policy of ['no-user-gesture-required','document-user-activation-required'])test('native title autoplay policy '+policy,({},info)=>{test.skip(info.project.name!=='chromium');});`);
    command("git", ["init", "-q"]); command("git", ["add", "scripts", "qa", "tests", "playwright.config.js", "package-lock.json"]);
    command("git", ["-c", "user.name=CI protocol fixture", "-c", "user.email=ci-fixture@example.invalid", "commit", "-qm", "fixture"]);
    const sha = command("git", ["rev-parse", "HEAD"]);
    const env = { GITHUB_SHA: sha, GITHUB_STEP_SUMMARY: "" };
    command(process.execPath, ["scripts/browser-ci.mjs", "plan"], env);
    const plan = JSON.parse(readFileSync(join(directory, ".ci/browser-plan.json"), "utf8"));
    assert.equal(plan.tests.length, 40);
    for (const project of ["chromium", "phone", "firefox", "webkit"]) {
      for (const shard of [1, 2, 3, 4]) command(process.execPath, ["scripts/browser-ci.mjs", "run", project, String(shard)], env);
      const artifacts = join(directory, ".ci/shards"); mkdirSync(artifacts, { recursive: true });
      for (const shard of [1, 2, 3, 4]) cpSync(join(directory, `.ci/results/${project}-${shard}`), join(artifacts, String(shard)), { recursive: true });
      command(process.execPath, ["scripts/browser-ci.mjs", "verify", project], { ...env, TEST_RESULT: "success", SHARDS_RESULT: "success" });
      const result = JSON.parse(readFileSync(join(directory, `qa/production/reports/browser-${project}.json`), "utf8"));
      assert.equal(result.total, 10); assert.equal(result.flaky, 0); assert.equal(result.skipped, project === "chromium" ? 0 : 2);
      // One mixed pass/skip merge exercises the format; repeating the same
      // HTML compilation for every synthetic project adds no protocol coverage.
      if (project === "webkit") {
        command(process.execPath, ["node_modules/@playwright/test/cli.js", "merge-reports", "--reporter=html", ".ci/merge"],
          { ...env, PLAYWRIGHT_HTML_OPEN: "never", PLAYWRIGHT_HTML_OUTPUT_DIR: ".ci/html" });
        assert.equal(existsSync(join(directory, ".ci/html/index.html")), true);
      }
      rmSync(artifacts, { recursive: true }); rmSync(join(directory, ".ci/merge"), { recursive: true });
    }
    mkdirSync(join(directory, ".ci/shards"));
    cpSync(join(directory, ".ci/results/chromium-1"), join(directory, ".ci/shards/1"), { recursive: true });
    const missing = spawnSync(process.execPath, ["scripts/browser-ci.mjs", "verify", "chromium"], { cwd: directory, encoding: "utf8", env: { ...process.env, ...env, TEST_RESULT: "success", SHARDS_RESULT: "success" } });
    assert.equal(missing.status, 1); assert.match(missing.stderr, /Missing or extra/);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

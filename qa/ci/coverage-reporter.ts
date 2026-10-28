import type { FullConfig, FullResult, Reporter, Suite, TestCase, TestError } from "@playwright/test/reporter";
import { relative } from "node:path";
import { identity, makePlan, writeJson, SHARD_COUNT, WORKERS } from "../../scripts/browser-ci-core.mjs";

export default class CoverageReporter implements Reporter {
  private tests: TestCase[] = [];
  private root = "";
  private errors: string[] = [];
  private entry(test: TestCase) {
    return { id: test.id, project: test.parent.project()!.name, file: relative(this.root, test.location.file).replaceAll("\\", "/"),
      title: test.title, titles: test.titlePath().filter(Boolean) };
  }
  onBegin(config: FullConfig, suite: Suite) {
    this.root = config.rootDir;
    this.tests = suite.allTests();
    if (process.env.CI_REPORT_MODE === "plan") writeJson(process.env.CI_REPORT_PATH!, makePlan(this.tests.map(test => this.entry(test)), identity()));
  }
  onError(error: TestError) { this.errors.push(error.message ?? "Unattributed browser error"); }
  onEnd(result: FullResult) {
    if (process.env.CI_REPORT_MODE !== "shard") return;
    writeJson(process.env.CI_REPORT_PATH!, { schema: 1, identity: identity(), project: process.env.CI_BROWSER_PROJECT,
      shard: Number(process.env.CI_BROWSER_SHARD), shards: SHARD_COUNT, workers: WORKERS, status: result.status, duration: result.duration, errors: this.errors,
      tests: this.tests.map(test => ({ ...this.entry(test), expectedStatus: test.expectedStatus, outcome: test.outcome(),
        results: test.results.map(row => ({ status: row.status, retry: row.retry, duration: row.duration })) })) });
  }
}

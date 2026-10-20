import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CHECK_REQUEST_MS, CI_DEADLINE_MS, CI_POLL_MS, waitForProductionChecks } from "../scripts/ci-wait.mjs";
import { BROWSER_CHECKS } from "../scripts/ci-gate.mjs";

const passing = ["Test", "Build", ...BROWSER_CHECKS].map((name, index) => ({ id: 100 + index, check_suite: { id: 10 }, name, status: "completed", conclusion: "success" }));
const url = "https://api.github.com/repos/owner/repo/commits/exact-sha/check-runs?per_page=100";
const onWait = () => {};

describe("bounded production CI wait", () => {
  it("fails closed when a successful-looking response is incomplete", async t => {
    t.mock.method(globalThis, "fetch", async () => Response.json({
      total_count: 101,
      check_runs: passing.map(check => ({ ...check, app: { slug: "github-actions" } })),
    }));
    const result = await waitForProductionChecks({ url, onWait });
    assert.equal(result.exitCode, 0);
    assert.match(result.message, /Could not read/);
  });

  it("rejects missing, nonnumeric and mismatched response counts", async t => {
    let count: unknown;
    t.mock.method(globalThis, "fetch", async () => Response.json({
      total_count: count, check_runs: passing.map(check => ({ ...check, app: { slug: "github-actions" } })),
    }));
    for (count of [undefined, null, -1, 5, "6", 7]) {
      const result = await waitForProductionChecks({ url, onWait });
      assert.equal(result.exitCode, 0);
      assert.match(result.message, /Could not read/);
    }
  });
  it("accepts checks only from GitHub Actions, ignoring same-name third-party checks", async t => {
    let checks: object[] = [];
    t.mock.method(globalThis, "fetch", async (requested: string) => {
      assert.equal(requested, url);
      return Response.json({ total_count: checks.length, check_runs: checks });
    });
    for (const slug of [undefined, "third-party-ci", "github-actions"]) {
      let time = 0;
      checks = passing.map(check => ({ ...check, ...(slug ? { app: { slug } } : {}) }));
      const result = await waitForProductionChecks({ url, deadlineMs: 2, intervalMs: 1, now: () => time, sleep: async ms => { time += ms; }, onWait });
      assert.equal(result.exitCode, slug === "github-actions" ? 1 : 0);
    }
    checks = [...passing.map(check => ({ ...check, app: { slug: "github-actions" } })),
      { name: "Test", status: "completed", conclusion: "failure", id: 999, app: { slug: "third-party-ci" } }];
    assert.equal((await waitForProductionChecks({ url, onWait })).exitCode, 1);
  });

  it("fails closed when trusted checks lack numeric job or suite identity", async t => {
    let checks: object[] = [];
    t.mock.method(globalThis, "fetch", async () => Response.json({ total_count: checks.length, check_runs: checks }));
    for (const patch of [{ id: undefined }, { id: 0 }, { check_suite: undefined }, { check_suite: { id: "10" } }]) {
      checks = passing.map((check, index) => ({ ...check, ...(index === 0 ? patch : {}), app: { slug: "github-actions" } }));
      assert.equal((await waitForProductionChecks({ url, onWait })).exitCode, 0);
    }
  });

  it("allows the full suite to complete after thirty minutes on the exact commit URL", async () => {
    let time = 0;
    const result = await waitForProductionChecks({ url, now: () => time,
      sleep: async ms => { time += ms; }, onWait,
      read: async (requested: string, signal: AbortSignal) => {
        assert.equal(requested, url); assert.equal(signal.aborted, false);
        return time >= 34 * 60_000 ? passing : [];
      },
    });
    assert.equal(result.exitCode, 1);
    assert.equal(time, 34 * 60_000);
    assert.equal(CI_DEADLINE_MS, 45 * 60_000);
    assert.equal(CHECK_REQUEST_MS, 10_000);
  });

  it("expires without another request or an oversized last polling delay", async () => {
    let time = 0, requests = 0;
    const result = await waitForProductionChecks({ url, deadlineMs: 25, intervalMs: 10,
      now: () => time, sleep: async ms => { time += ms; }, onWait,
      read: async () => { requests++; return []; },
    });
    assert.equal(result.exitCode, 0); assert.equal(time, 25); assert.equal(requests, 3);
  });

  it("limits the complete forty-five-minute wait to forty-five status requests", async () => {
    let time = 0, requests = 0;
    const result = await waitForProductionChecks({ url, now: () => time, onWait,
      sleep: async ms => { time += ms; }, read: async () => { requests++; return []; },
    });
    assert.equal(result.exitCode, 0); assert.equal(time, CI_DEADLINE_MS);
    assert.equal(CI_POLL_MS, 60_000); assert.equal(requests, 45);
  });

  it("rejects checks that arrive after the deadline", async () => {
    let time = 0;
    const result = await waitForProductionChecks({ url, deadlineMs: 25, now: () => time, onWait,
      read: async () => { time = 26; return passing; },
    });
    assert.equal(result.exitCode, 0);
  });

  it("skips a failed check immediately", async () => {
    const result = await waitForProductionChecks({ url, onWait, read: async () => [{ name: "Test", status: "completed", conclusion: "failure" }] });
    assert.equal(result.exitCode, 0); assert.match(result.message, /did not pass/);
  });

  it("fails closed on unreadable status", async () => {
    const result = await waitForProductionChecks({ url, onWait, read: async () => { throw new Error("unavailable"); } });
    assert.equal(result.exitCode, 0); assert.match(result.message, /Could not read/);
  });

  it("fails closed on malformed check entries", async () => {
    const result = await waitForProductionChecks({ url, onWait, read: async () => [null] });
    assert.equal(result.exitCode, 0); assert.match(result.message, /Could not read/);
  });

  it("aborts a stalled status request instead of waiting indefinitely", async () => {
    // Keep the event loop alive while AbortSignal.timeout's unref'd timer fires.
    const keepAlive = setInterval(() => {}, 1000);
    try {
      const result = await waitForProductionChecks({ url, requestMs: 10, onWait,
        read: async (_url: string, signal: AbortSignal) => new Promise((_resolve, reject) => {
          signal.addEventListener("abort", () => reject(signal.reason), { once: true });
        }),
      });
      assert.equal(result.exitCode, 0); assert.match(result.message, /request limit/);
    } finally { clearInterval(keepAlive); }
  });
});

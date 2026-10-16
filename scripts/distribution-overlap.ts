import { deepStrictEqual } from "node:assert";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { distributionReport, distributionSummary, validateDistribution } from "../lib/distribution-overlap";
const args = process.argv.slice(2), candidate = args.includes("--record-baseline");
if (args.some(a => !/^(--out=.+|--seeds=\d+|--record-baseline)$/.test(a))) throw new Error("Usage: distribution-overlap.ts [--out=PATH] [--seeds=N] [--record-baseline]");
const out = args.find(a => a.startsWith("--out="))?.slice(6) ?? "qa/production/reports/balance/distribution-current.json";
if (resolve(out) === resolve("qa/balance/distribution-overlap.json")) throw new Error("Do not overwrite the reviewed baseline");
const report = distributionReport(Number(args.find(a => a.startsWith("--seeds="))?.slice(8) ?? 20));
mkdirSync(dirname(out), { recursive: true }); writeFileSync(out, JSON.stringify(report, null, 2) + "\n");
const md = out.replace(/\.json$/, "") + ".md"; writeFileSync(md, distributionSummary(report)); validateDistribution(report);
if (!candidate) {
  const baseline = JSON.parse(readFileSync("qa/balance/distribution-overlap.json", "utf8")); validateDistribution(baseline);
  deepStrictEqual(report, baseline, "Distribution overlap changed; review per-cell evidence before any baseline replacement");
}
writeFileSync(md, distributionSummary(report) + (candidate ? "\nCandidate only; no historical comparison.\n" : "\nExact reviewed comparison passed.\n"));
console.log(JSON.stringify({ campaigns: report.rows.length * report.seeds, cells: report.rows.length, failures: report.failures.length, out, candidate }));

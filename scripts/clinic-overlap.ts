import { deepStrictEqual } from "node:assert";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { clinicOverlapReport, clinicOverlapSummary, validateOverlapReport } from "../lib/clinic-overlap";
const args = process.argv.slice(2), candidate = args.includes("--record-baseline");
if (args.some(a => !/^(--out=.+|--seeds=\d+|--record-baseline)$/.test(a))) throw new Error("Usage: clinic-overlap.ts [--out=PATH] [--seeds=N] [--record-baseline]");
const out = args.find(a => a.startsWith("--out="))?.slice(6) ?? "qa/production/reports/balance/clinic-overlap-current.json";
if (resolve(out) === resolve("qa/balance/clinic-overlap.json")) throw new Error("Do not overwrite the reviewed baseline");
const report = clinicOverlapReport(Number(args.find(a => a.startsWith("--seeds="))?.slice(8) ?? 25));
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(report, null, 2) + "\n");
const md = out.replace(/\.json$/, "") + ".md";
writeFileSync(md, clinicOverlapSummary(report));
validateOverlapReport(report);
if (!candidate) {
  const baseline = JSON.parse(readFileSync("qa/balance/clinic-overlap.json", "utf8")); validateOverlapReport(baseline);
  deepStrictEqual(report, baseline, "Clinic overlap differs from reviewed baseline; inspect per-cell evidence before recording any candidate");
}
writeFileSync(md, clinicOverlapSummary(report) + (candidate ? "\nCandidate only; no historical comparison.\n" : "\nExact reviewed comparison passed.\n"));
console.log(JSON.stringify({ campaigns: report.rows.length * report.config.seeds, cells: report.rows.length, failures: report.failures.length, out, candidate }));

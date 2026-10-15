import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { BALANCE_CONFIG, balanceIssues, balanceSummary, runBalanceAudit } from "../lib/balance-audit";
import type { BalanceReport } from "../lib/balance-audit";

const args = process.argv.slice(2);
if (args.some(arg => !/^(--out=.+|--baseline=.+|--record-baseline)$/.test(arg))) throw new Error("Usage: balance-audit.ts [--out=PATH] [--baseline=PATH] [--record-baseline]");
const baselinePath = args.find(arg => arg.startsWith("--baseline="))?.slice(11) ?? "qa/balance/baseline.json";
const out = args.find(arg => arg.startsWith("--out="))?.slice(6) ?? "qa/production/reports/balance/current.json";
if (resolve(out) === resolve(baselinePath)) throw new Error("Report output must not overwrite the reviewed baseline");
const report = runBalanceAudit();
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(report, null, 2) + "\n");
const markdownPath = out.replace(/\.json$/, "") + ".md";
writeFileSync(markdownPath, balanceSummary(report));
const baseline: BalanceReport = args.includes("--record-baseline") ? report : JSON.parse(readFileSync(baselinePath, "utf8"));
// Reading/comparison errors fail the command; never silently establish a new baseline.
const issues = balanceIssues(report, baseline);
writeFileSync(markdownPath, balanceSummary(report) + (issues.length ? `\n## Regressions\n\n${issues.map(issue => `- ${issue}`).join("\n")}\n` : args.includes("--record-baseline") ? "\nCandidate baseline; historical regression comparison not performed.\n" : "\nRegression gate passed.\n"));
console.log(JSON.stringify({ runs: report.cells.length * BALANCE_CONFIG.runsPerCell, cells: report.cells.length, failures: report.failures.length, scenes: report.coverage.scenes.length, choices: report.coverage.choices.length, out, issues }, null, 2));
if (issues.length) process.exitCode = 1;
if (args.includes("--record-baseline")) console.log("Candidate baseline only: review the report, then explicitly copy the JSON to qa/balance/baseline.json. CI never records a baseline.");

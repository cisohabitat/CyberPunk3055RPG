import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { matchedMissionReport, matchedMissionSummary } from "../lib/matched-balance";

const args = process.argv.slice(2);
if (args.some(arg => !/^(--out=.+|--record-baseline)$/.test(arg))) throw new Error("Usage: matched-balance.ts [--out=PATH] [--record-baseline]");
const out = args.find(arg => arg.startsWith("--out="))?.slice(6) ?? "qa/production/reports/balance/matched-current.json";
const baseline = "qa/balance/matched-missions.json";
if (resolve(out) === resolve(baseline)) throw new Error("Do not overwrite the reviewed baseline");
const report = matchedMissionReport();
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(report, null, 2) + "\n");
writeFileSync(out.replace(/\.json$/, "") + ".md", matchedMissionSummary(report));
if (!args.includes("--record-baseline")) {
  const previous = JSON.parse(readFileSync(baseline, "utf8"));
  if (!isDeepStrictEqual(report, previous)) throw new Error("Matched mission results changed: review the report against qa/balance/matched-missions.json before approving an intentional baseline revision");
}
console.log(JSON.stringify({ scenarios: report.rows.length, leaves: report.rows.reduce((sum, row) => sum + row.leaves, 0), out, comparison: args.includes("--record-baseline") ? "candidate only; review before recording" : "passed" }));

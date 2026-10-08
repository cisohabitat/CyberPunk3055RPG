import { writeFileSync } from "node:fs";
import { storyReport, simulateCampaign } from "../lib/story-report";
import type { OriginId } from "../lib/types";

const report = storyReport();
const endings: Record<string, Record<string, number>> = {};
for (const origin of ["gutterwire", "spire", "dustline"] as OriginId[]) {
  endings[origin] = {};
  for (let seed = 1; seed <= 300; seed++) {
    const result = simulateCampaign(seed, origin);
    endings[origin][result.finale] = (endings[origin][result.finale] ?? 0) + 1;
  }
}
const output = JSON.stringify({ ...report, simulations: { runs: 900, endings }, note: "Random completion checks are not player preference or balance measurements." }, null, 2);
if (process.argv[2]) writeFileSync(process.argv[2], output);
else console.log(output);
if (report.missing.length) process.exitCode = 1;

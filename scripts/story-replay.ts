import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { replayCampaign, type ReplaySpec } from "../lib/story-replay";

const paths = process.argv.slice(2);
const files = paths.length ? paths : readdirSync("qa/routes").filter((file) => file.endsWith(".json")).sort().map((file) => join("qa/routes", file));
if (!files.length) throw new Error("No campaign replay fixtures found");
for (const file of files) {
  try {
    const result = replayCampaign(JSON.parse(readFileSync(file, "utf8")) as ReplaySpec);
    console.log(JSON.stringify({ file, name: result.name, steps: result.transcript.length, sceneId: result.state.sceneId, restoredCheckpoints: result.transcript.filter((step) => step.restored).length }));
  } catch (error) {
    console.error(`${file}: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}

import { writeFileSync } from "node:fs";
import { commitChoice, createCharacter, getScene, presentChoices, stageCheck } from "../lib/engine";
import { parseSave } from "../lib/storage";
import type { GameState, StatId } from "../lib/types";

// Matched, synthetic eligible states isolate decision structure from campaign
// resources. These are engine runs, not UI campaigns or independent players.
const stats: StatId[] = ["chrome", "ghost", "nerve", "face"];
const rows = [];
for (const stat of stats) for (const roll of [8, 1]) for (const encounter of ["chapel", "nia", "kerr"]) {
  let s = createCharacter({ handle: "Comparison", givenName: "Ada", origin: "spire", bonus: { chrome: 0, ghost: 0, nerve: 0, face: 0, [stat]: 2 } });
  s = { ...s, creds: 100, strain: 0, flags: { [`perk_${stat}`]: true, chapel_window_3: true, witness_briefed: true, witness_scanner: true, witness_scouted: true, witness_escort: true, witness_braced: true, kerr_route_started: true, [`kerr_exit_${stat === "chrome" ? "ramp" : stat === "nerve" ? "walk" : "gap"}`]: true }, factions: { ...s.factions, lumen: 2 } };
  const paths: Record<string, Record<StatId, string[]>> = {
    chapel: { chrome: ["window-inspect-reader", "window-use-reader", "window-quiet-exit"], ghost: ["window-scout-gap", "window-use-gap", "window-quiet-exit"], nerve: ["window-force-hatch", "window-quiet-exit"], face: ["offer-chapel-service", "bargain-service-entry"] },
    nia: { chrome: ["chrome-transfer"], ghost: ["ghost-transfer"], nerve: ["nerve-transfer"], face: ["face-transfer"] },
    kerr: { chrome: ["route-use-sensor"], ghost: ["route-use-gap"], nerve: ["route-use-stairs"], face: ["route-negotiate"] },
  };
  s.sceneId = encounter === "chapel" ? stat === "face" ? "chapel_methods" : "chapel_window_plan" : encounter === "nia" ? "act2_witness_door" : "act2_route_crossing";
  const steps: { choice: string; check: string | null }[] = [];
  for (const id of paths[encounter][stat]) {
    const c = presentChoices(s, getScene(s.sceneId)).find(c => c.id === id && c.enabled);
    if (!c) break; // a failed preparation changes which continuation is available
    if (c.check) s = stageCheck(s, id, roll);
    s = parseSave(JSON.stringify(s))!;
    s = commitChoice(s, c, c.check ? { roll } : undefined).state;
    s = parseSave(JSON.stringify(s))!;
    steps.push({ choice: id, check: c.check ? `${c.check.stat} ${c.check.dc}` : null });
  }
  rows.push({ encounter, build: stat, directedDie: roll, syntheticPreparation: true, steps, end: s.sceneId, credsSpent: 100 - s.creds, strainAdded: s.strain, recipientRegistered: Boolean(s.flags.kerr_route_trace), witnessRecording: Boolean(s.flags.witness_consent) });
}
const result = { schema: 1, scope: "24 source-familiar engine scenarios with matched synthetic eligible preparations; directed dice 8/1, including deterministic methods unaffected by dice. Not fresh-player or UI evidence.", conclusion: "The existing four Kerr stat approaches each make one DC 8 check; Chapel has a saved action allowance/service debt and Nia has preparation/standing/strain choices with separate consent.", rows };
writeFileSync(process.argv[2] ?? "qa/editorial/build-variety-baseline.json", JSON.stringify(result, null, 2) + "\n");
console.log(`${rows.length} comparison scenarios recorded`);

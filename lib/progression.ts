import type { GameState, StatId } from "./types";
export const PERKS: { stat: StatId; name: string; description: string }[] = [
  { stat: "chrome", name: "Signal discipline", description: "Chrome checks +1. Isolate an archive key locally; scanner preparation unlocks a clinic-only transfer at a strain cost." },
  { stat: "nerve", name: "Steady hands", description: "Nerve checks +1. Hold an archive hatch for Edda; chair preparation unlocks a physical transfer route." },
  { stat: "face", name: "Read the room", description: "Face checks +1. Request a countersigned invoice; escort preparation unlocks a clinic favor for a room." },
  { stat: "ghost", name: "Count the exits", description: "Ghost checks +1. Recover a carbon ledger; patrol preparation unlocks a silent transfer at a strain cost." },
];
export function learnedPerks(state: GameState) { return PERKS.filter((perk) => state.flags[`perk_${perk.stat}`]); }

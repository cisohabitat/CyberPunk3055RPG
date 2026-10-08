import type { GameState, StatId } from "./types";
export const PERKS: { stat: StatId; name: string; description: string }[] = [
  { stat: "chrome", name: "Signal discipline", description: "Chrome checks +1. You learn to keep the handshake clean." },
  { stat: "nerve", name: "Steady hands", description: "Nerve checks +1. You keep the breath through a threat." },
  { stat: "face", name: "Read the room", description: "Face checks +1. You listen for the price behind a sentence." },
  { stat: "ghost", name: "Count the exits", description: "Ghost checks +1. You practice leaving before the door closes." },
];
export function learnedPerks(state: GameState) { return PERKS.filter((perk) => state.flags[`perk_${perk.stat}`]); }

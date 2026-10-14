import levels from "../qa/media/voice-levels.json";

/** Offline measured delivery trims; the player's voice slider remains the bus gain. */
export function voiceLevel(id: string): number {
  return (levels as Record<string, number>)[id] ?? 1;
}

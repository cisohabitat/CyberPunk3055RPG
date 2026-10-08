import type { StatId } from "../types";

export const STAT_VOICE: Record<StatId, string> = {
  chrome: "Chrome counts the handshake before it counts the person.",
  nerve: "Nerve stays in the body and asks if the exit is still there.",
  face: "Face reads the mouth, then decides what the mouth is allowed to hear.",
  ghost: "Ghost spends the minute nobody else numbered.",
};

export function statVoice(stat: StatId): string {
  return STAT_VOICE[stat];
}

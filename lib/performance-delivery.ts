import { connectedPerformancePath } from "./connected-performance";

/** Reviewed same-word alternatives only. Original files remain the bounded fallback.
 * No actor, binding key, source gain, preference or queue timing changes here.
 */
export const DIRECTED_VOICE_IDS = [
  "voice-campaign-encounter-craft-570639a0f84d",
  "voice-campaign-encounter-craft-cd0a455809ce",
  "voice-campaign-encounter-craft-a3b854d736a3",
  "voice-campaign-encounter-craft-43e701b3e2c1",
  "voice-campaign-encounter-craft-62b70985aa0d",
  "voice-campaign-emotional-payoff-0a1b8bb22589",
  "voice-campaign-emotional-payoff-26350d370631",
] as const;
const directed = new Set<string>(DIRECTED_VOICE_IDS);
export function performanceVoicePath(id: string): string | undefined {
  return connectedPerformancePath(id) ?? (directed.has(id) ? `/audio/performance-direction-v1/${id}.mp3` : undefined);
}

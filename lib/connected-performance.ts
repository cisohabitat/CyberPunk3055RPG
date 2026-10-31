/** Offline-reviewed Kerr alternatives only; canonical ids and originals stay intact. */
export const CONNECTED_PERFORMANCE_IDS = [
  'voice-campaign-kerr-10b6e71a11eb',
  'voice-campaign-kerr-e8022742ad26',
  'voice-campaign-kerr-f001a675c451',
  'voice-campaign-kerr-f829eb68f234',
  'voice-campaign-kerr-1903a3d3a421',
] as const;
const selected = new Set<string>(CONNECTED_PERFORMANCE_IDS);
export function connectedPerformancePath(id: string): string | undefined {
  return selected.has(id) ? `/audio/connected-performance-v1/${id}.mp3` : undefined;
}

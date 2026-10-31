import phase from '../qa/media/connected-scenes.json';
/** Reviewed exact-word/cast deliveries. No preference, story or queue mutation. */
export function scenePerformancePath(id: string): string | undefined {
  const row = phase.deliveries.find(row => row.id === id);
  return row ? `/${row.path.slice('public/'.length)}` : undefined;
}
/** Bound to the bytes actually decoded, including a cached original fallback. */
export function scenePerformanceLevel(id: string, path: string): number | undefined {
  const row = phase.deliveries.find(row => row.id === id);
  if (!row) return;
  if (path === `/${row.path.slice('public/'.length)}`) return row.sourceGain;
  if (path === `/${row.fallbackPath.slice('public/'.length)}`) return row.fallbackGain;
}
export const SCENE_PERFORMANCE_IDS = phase.deliveries.map(row => row.id);

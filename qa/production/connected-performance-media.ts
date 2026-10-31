import { CONNECTED_PERFORMANCE_IDS, connectedPerformancePath } from '../../lib/connected-performance';
/** Precisely enumerated additive Phase14 files; never exclude a directory or future file. */
export const CONNECTED_PERFORMANCE_MEDIA = CONNECTED_PERFORMANCE_IDS.map(id => `public${connectedPerformancePath(id)}`);
export const CONNECTED_PERFORMANCE_MANIFESTS = [
  'qa/media/expressive-performance-lines.json',
  'qa/media/expressive-performance-review.json',
  'qa/media/expressive-performance.json',
  'qa/media/expressive-performance-audition.json',
];
export const isConnectedPerformanceFile = (path: string) => CONNECTED_PERFORMANCE_MEDIA.includes(path) || CONNECTED_PERFORMANCE_MANIFESTS.includes(path);

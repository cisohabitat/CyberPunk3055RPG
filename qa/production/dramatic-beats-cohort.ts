import phase from '../media/dramatic-beats.json';
/** Exact additive inventory only; older snapshots never admit an unknown future file. */
export const isDramaticBeatsFile = (path: string) => phase.newMedia.includes(path) || phase.newManifests.includes(path) || phase.newRoutes.some(p => path === `qa/routes/${p}`);

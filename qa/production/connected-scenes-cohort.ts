import phase from '../media/connected-scenes.json';
/** Exact additive filenames only; unknown and future files remain errors. */
export const isConnectedScenesFile = (path: string) => phase.newMedia.includes(path) || phase.newManifests.includes(path);

import { isNavigationReleaseFile } from './navigation-release-cohort';
import phase from '../media/connected-scenes.json';
/** Exact additive filenames only; unknown and future files remain errors. */
export const isConnectedScenesFile = (path: string) => isNavigationReleaseFile(path) || phase.newMedia.includes(path) || phase.newManifests.includes(path);

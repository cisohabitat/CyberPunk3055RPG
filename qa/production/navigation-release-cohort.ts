import phase from '../media/navigation-release.json';
/** Only the eight named existing-story QA routes and this manifest are additive. */
export const isNavigationReleaseFile=(path:string)=>phase.newRoutes.includes(path)||phase.newManifests.includes(path);

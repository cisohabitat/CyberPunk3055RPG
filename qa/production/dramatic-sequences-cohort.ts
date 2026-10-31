import phase from '../media/dramatic-sequences.json';
/** Only exact named assets/manifests/routes are additive. */
export const isDramaticSequencesFile=(path:string)=>phase.newMedia.includes(path)||phase.newManifests.includes(path)||phase.newRoutes.includes(path);

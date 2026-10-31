import { isDramaticSequencesFile } from './dramatic-sequences-cohort';
import phase from '../media/consequential-expansion.json';
/** Precisely enumerated current expansion additions; no future-prefix exemptions. */
export const isConsequentialExpansionFile=(path:string)=>isDramaticSequencesFile(path)||phase.newManifests.includes(path)||phase.newRoutes.some(p=>path===`qa/routes/${p}`);

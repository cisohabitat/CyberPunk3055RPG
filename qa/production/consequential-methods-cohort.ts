import phase from '../media/consequential-methods.json';
/** Exact Phase17 additions; no prefix or future-path exemptions. */
export const isConsequentialMethodsFile = (path: string) => phase.newManifests.includes(path) || phase.newRoutes.some(p => path === `qa/routes/${p}`);

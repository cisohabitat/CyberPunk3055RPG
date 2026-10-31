import phase from '../media/sera-shift.json';
import precedingArt from '../editorial/sera-shift-preceding-scene-art.json';
/** Only the independently inventoried Phase16 pilot additions. No prefix/directory exemptions. */
export const isSeraShiftFile = (path: string) => phase.newMedia.includes(path) || phase.newManifests.includes(path) || phase.newRoutes.some(p => path === `qa/routes/${p}`);
export const precedingSeraArt = (path: string) => path === 'qa/media/scene-art.json' ? phase.precedingSceneArt : path;
export const withoutSeraArt = <T>(art: T): T => {
  const copy = structuredClone(art) as typeof precedingArt;
  copy.decisions = copy.decisions.filter(row => !row.scenes.some(id => phase.newScenes.includes(id)));
  for (const row of copy.speakingPortraits) {
    const old = precedingArt.speakingPortraits.find(r => r.speaker === row.speaker);
    row.scenes = row.scenes.filter(id => !phase.newScenes.includes(id) && (id !== 'act3_testimony_record' || row.speaker !== 'Sera' || Boolean(old?.scenes.includes(id))));
  }
  return copy as T;
};

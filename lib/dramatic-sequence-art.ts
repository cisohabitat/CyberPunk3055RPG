import phase from '../qa/media/dramatic-sequences.json';
import type { Illustration } from './art';
/** New-run visuals only. No story state, knowledge or media playback is mutated. */
export function dramaticSequenceIllustration(scene: string, flags: Readonly<Record<string, boolean>>): Illustration | undefined {
  if (!flags.dramatic_sequence_art_enabled) return;
  return phase.rules.find(r=>r.scenes.includes(scene)&&r.allFlags.every(f=>flags[f])
    &&(!r.anyFlags.length||r.anyFlags.some(f=>flags[f]))&&r.noneFlags.every(f=>!flags[f]))?.illustration;
}
export const DRAMATIC_SEQUENCE_GALLERY = phase.galleryEntries;
export const DRAMATIC_SEQUENCE_PAINTED_ACTORS = Object.fromEntries(phase.rules.map(r=>[r.illustration.src,[r.actor]]));

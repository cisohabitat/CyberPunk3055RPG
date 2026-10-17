/** Decorative layers only: no face, evidence, source status or outcome animation. */
export const ART_ATMOSPHERES = {
  "/art/opening.jpg": "rain",
  "/art/canal-dispatch.jpg": "reflection",
  "/art/incinerator-flue.jpg": "lamp",
  "/art/held-case.jpg": "lamp",
} as const;
export function artAtmosphere(src: string) {
  return Object.hasOwn(ART_ATMOSPHERES, src) ? ART_ATMOSPHERES[src as keyof typeof ART_ATMOSPHERES] : undefined;
}

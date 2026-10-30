import type { Illustration } from "./art";
import { VISUAL_SHOTS } from "./visual-direction";

/** Optional, place-specific inspection. Never selects a portrait or changes a sound plan. */
export const ORDINARY_DIRECTIONS = {
  act2_district_kerr: { label: "Kerr's counter · before you share", speaker: "Kerr", scene: {
    src: "/art/stall.jpg", small: "/art/stall.jpg", caption: "Ward Four · beneath the awning",
    description: "An amber-lit cooking counter and empty stool overlook rainy walkways. This setting view leaves Kerr and your private notes outside the frame; no disclosure or introduction is depicted.",
  }, person: VISUAL_SHOTS.kerr, detail: VISUAL_SHOTS.counter },
  act2_district_kerr_reply: { label: "Kerr's counter · his answer", speaker: "Kerr", scene: {
    src: "/art/stall.jpg", small: "/art/stall.jpg", caption: "Ward Four · the counter remains",
    description: "The same sheltered cooking counter and empty stool overlook the wet walkway. The view depicts no agreed introduction, recipient entry, wage, recovery or erased breach.",
  }, person: VISUAL_SHOTS.kerr, detail: VISUAL_SHOTS.counter },
} satisfies Record<string, { label: string; speaker: string; scene: Illustration; person: Illustration; detail: Illustration }>;

export function ordinaryDirection(sceneId: string) {
  return Object.hasOwn(ORDINARY_DIRECTIONS, sceneId) ? ORDINARY_DIRECTIONS[sceneId as keyof typeof ORDINARY_DIRECTIONS] : undefined;
}

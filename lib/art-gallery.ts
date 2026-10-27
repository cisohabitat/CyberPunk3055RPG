import catalog from "../qa/media/art-gallery.json";
import type { ViewableArt } from "./art";

export type GalleryEntry = ViewableArt & { category: string; width: number; height: number };
export const GALLERY_ART: readonly GalleryEntry[] = catalog.entries;
export const GALLERY_CATEGORIES = ["Scenes & places", "Characters", "Equipment & sources", "Title & city"] as const;
export const GALLERY_PAGE_SIZE = 24;
export function filterGallery(category: string, query: string): readonly GalleryEntry[] {
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return GALLERY_ART.filter(art => (category === "All artwork" || art.category === category)
    && words.every(word => `${art.caption} ${art.description}`.toLocaleLowerCase().includes(word)));
}

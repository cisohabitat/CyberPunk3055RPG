import type { ViewableArt } from "./art";

const EQUIPMENT: Record<string, { tile: number; description: string }> = {
  "archive-probe": { tile: 0, description: "A worn copper contact scanner with a coiled probe cable." },
  "chair-harness": { tile: 1, description: "Folded padded support straps with worn metal buckles." },
  "desk-guide": { tile: 2, description: "A small cream procedural booklet with a clipped pencil." },
  "route-shroud": { tile: 3, description: "Folded charcoal shielding fabric with a worn stitched edge." },
  "signal-baffle": { tile: 4, description: "A shielded copper receiver with a short antenna." },
  "burner-route": { tile: 5, description: "An orange disposable freight-clearance card with abstract bars." },
  "witness-token": { tile: 6, description: "A round verdigris brass room token with a square opening." },
  "counterfeit-pass": { tile: 7, description: "A pale blue appointment card with an anonymous silhouette and indistinct fields." },
  "layout-scrap": { tile: 8, description: "Folded thermal paper carrying a service diagram without readable labels." },
  "spoof-chip": { tile: 9, description: "A dark ceramic chip with exposed copper contacts." },
  "mono-knife": { tile: 10, description: "A small worn utility knife with a narrow blade." },
  sedative: { tile: 11, description: "A sealed amber medicine vial without a readable label." },
  shard: { tile: 12, description: "A thin intact glass memory sliver with softly glowing cyan edges." },
  "clinic-marker": { tile: 13, description: "A pale frosted-glass debt token in a copper rim." },
};

/** Lookup accepts only owned, known item ids; artwork never grants the depicted item. */
export function inventoryThumbnailArt(id: string, damaged = false): ViewableArt | undefined {
  if (!Object.hasOwn(EQUIPMENT, id)) return undefined;
  const item = EQUIPMENT[id], ash = id === "shard" && damaged;
  return { src: "/art/equipment-atlas.jpg", small: "/art/equipment-atlas-small.jpg", caption: "Equipment · illustrative detail",
    tile: ash ? 14 : item.tile, description: ash ? "A chipped and cracked glass memory sliver with a dim uneven cyan edge." : item.description };
}

const DETAILS: Record<string, string> = { shard: "item-shard", "archive-probe": "item-archive-probe", "witness-token": "item-witness-token",
  "chair-harness": "item-chair-harness", "desk-guide": "item-desk-guide", "route-shroud": "item-route-shroud",
  "signal-baffle": "item-signal-baffle", "burner-route": "item-burner-route", "counterfeit-pass": "item-counterfeit-pass",
  "layout-scrap": "item-layout-scrap", "spoof-chip": "item-spoof-chip", "mono-knife": "item-mono-knife",
  sedative: "item-sedative", "clinic-marker": "item-clinic-marker" };
/** Keep the compact atlas for Gear; load individual paintings only on inspection. */
export function inventoryArt(id: string, damaged = false): ViewableArt | undefined {
  const thumbnail = inventoryThumbnailArt(id, damaged);
  if (!thumbnail || !Object.hasOwn(DETAILS, id)) return thumbnail;
  const name = id === "shard" && damaged ? "item-shard-damaged" : DETAILS[id];
  return { src: `/art/${name}.jpg`, small: `/art/${name}-small.jpg`, caption: thumbnail.caption, description: thumbnail.description };
}

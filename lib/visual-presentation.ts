import { districtForScene } from "./city-map";
import { getScene, type VisibleChoice } from "./engine";

/** Place identity only. Never infer allegiance, progress or permission from a theme. */
export const DISTRICT_PRESENTATIONS = {
  market: { symbol: "market", label: "Ward Four market" },
  chapel: { symbol: "chapel", label: "Glass Chapel" },
  canal: { symbol: "canal", label: "Canal district" },
  spire: { symbol: "helion", label: "Helion Spire" },
  shelter: { symbol: "wards", label: "Ward Four shelter" },
  clinic: { symbol: "lumen", label: "Ward Four clinic" },
  "clinic-service": { symbol: "archive", label: "Clinic service stops" },
  "ward-nine": { symbol: "witness", label: "Ward Nine" },
} as const;

export function sceneDistrict(sceneId: string) {
  return districtForScene(sceneId) ?? "city";
}

/** Only authored static exits are marked as travel. Never invoke a next function for decoration. */
export function choicePresentation(sceneId: string, choice: VisibleChoice) {
  if (choice.check) return { kind: "check", label: "Check", symbol: "die" } as const;
  if (typeof choice.next === "string" && choice.next !== sceneId) {
    const target = getScene(choice.next), source = getScene(sceneId);
    if (target.location !== source.location && !target.ending && !target.finale) {
      return { kind: "travel", label: "Move on", symbol: "departure" } as const;
    }
  }
  return { kind: "action", label: "Action", symbol: "action" } as const;
}


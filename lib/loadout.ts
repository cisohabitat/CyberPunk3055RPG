import type { GameState, StatId } from "./types";

export const FIELD_KITS: { id: string; stat: StatId; name: string; price: number; uses: string }[] = [
  { id: "archive-probe", stat: "chrome", name: "Archive Probe", price: 140, uses: "+2 to scanner inspection, archive index preparation, receipt authentication, and the depot sensor ramp." },
  { id: "chair-harness", stat: "nerve", name: "Chair Harness", price: 120, uses: "+2 to chair preparation, physical witness transfer, archive hatch preparation, physical ledger inspection, carrying sealed clinic cards, and carrying Kerr’s case." },
  { id: "desk-guide", stat: "face", name: "Clinic Desk Guide", price: 100, uses: "+2 to arranging a volunteer escort, negotiating a checkpoint transfer, private clinic dispatch, and the depot counter. It supplies procedure, not a forged signature." },
  { id: "route-shroud", stat: "ghost", name: "Route Shroud", price: 140, uses: "+2 to patrol scouting, service-hatch witness transfer, archive interval preparation, carbon retrieval, and the depot patrol gap." },
];
export const kitBonuses = (stat: StatId) => FIELD_KITS.filter((kit) => kit.stat === stat).map((kit) => ({ item: kit.id, amount: 2 }));
export const equippedKits = (state: GameState) => FIELD_KITS.filter((kit) => state.items.includes(kit.id));

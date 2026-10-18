import { getScene, presentChoices } from "./engine";
import type { GameState } from "./types";

// Exact authored place names only: new locations require an explicit map decision.
export const MAP_DISTRICTS = [
  { id: "market", name: "Ward Four market", flags: ["met_quill"], locations: ["Kite City, Ward Four · before midnight", "Ward Four, under the awnings", "Ward Four night market", "Noodle counter, Ward Four", "Noodle stall, Ward Four", "Under the awning", "District board, Ward Four", "Ward Four", "District board", "District repair bench", "Ward Four stall"] },
  { id: "chapel", name: "Glass Chapel", flags: ["hired", "met_lumen", "heard_memo", "memory_prepared"], locations: ["Chapel basin", "Incinerator vein", "Choir door", "Chapel undercroft", "Chapel stair", "The chair room", "Chapel alley", "Glass Chapel", "Memory bench, Glass Chapel", "Witness room, Glass Chapel", "Clinic dispatch desk, Glass Chapel", "Glass Chapel service bench", "Glass Chapel service landing"] },
  { id: "canal", name: "Canal district", flags: ["freight_started", "freight_delivered", "kerr_route_promised", "kerr_route_started", "kerr_route_done"], locations: ["The dry canal", "Canal freight gate", "Canal dispatch table", "Canal service turn", "Canal checkpoint", "Canal cold cabinet", "Canal service map", "Canal dispatch alcove"] },
  { id: "spire", name: "Helion Spire", flags: ["met_ives", "spire_briefed", "spire_done", "archive_briefed", "archive_custody"], locations: ["Helion Spire", "Helion service counter", "Spire service alcove", "Spire maintenance terminal", "Helion staffed service desk", "Spire service exit", "Helion service archive", "Helion payroll relay"] },
  { id: "shelter", name: "Ward Four shelter", flags: ["shelter_briefed", "shelter_started", "shelter_restored", "shelter_declined", "shelter_done", "shelter_reserved"], locations: ["Ward Four shelter stair", "Shelter landing", "Shelter pump room", "Shelter exit ramp", "Ward Four staffed hall", "Shelter dry landing"] },
  { id: "clinic", name: "Ward Four clinic", flags: ["response_started", "response_private_consent", "response_sent", "mara_company_chosen"], locations: ["Clinic side room, Ward Four"] },
  { id: "clinic-service", name: "Clinic service stops", flags: ["freight_at_intake"], locations: ["Clinic freight hatch", "Clinic loading ramp"] },
  { id: "ward-nine", name: "Ward Nine", flags: ["heard_memo", "walk_nine", "witness_safe", "pump_done"], locations: ["Ward Nine", "Ward Nine records table", "Witness room, Ward Nine", "Ward Nine payroll table", "Ward Nine neighbor table", "Ward Nine courier table", "Ward Nine coolant station", "Ward Nine clinic service door", "Clinic return desk, Ward Nine", "Clinic relay, Ward Nine", "Ward Nine stall", "Clinic desk, Ward Nine"] },
] as const;
const HUBS = new Set(["districts", "act2_middle", "act3_neighborhood", "act3_arrival", "street_after"]);
const WALL_ENDINGS = new Set(["ending_names", "ending_quiet", "ending_witness", "ending_listed"]);
export function districtForScene(sceneId: string) {
  if (WALL_ENDINGS.has(sceneId)) return "ward-nine";
  const location = getScene(sceneId).location;
  return MAP_DISTRICTS.find(d => (d.locations as readonly string[]).includes(location))?.id;
}
export function cityMap(state: GameState) {
  const current = districtForScene(state.sceneId);
  const available = HUBS.has(state.sceneId) ? presentChoices(state, getScene(state.sceneId)).flatMap(choice => {
    if (!choice.enabled || choice.check || !choice.next) return [];
    const target = typeof choice.next === "function" ? choice.next(state) : choice.next;
    if (target === state.sceneId || getScene(target).ending) return [];
    const district = districtForScene(target);
    return district ? [{ id: choice.id, label: choice.label, district }] : [];
  }) : [];
  return MAP_DISTRICTS.filter(d => d.id === "market" || d.id === current || d.flags.some(flag => state.flags[flag]) || available.some(choice => choice.district === d.id)
    || d.id === "ward-nine" && state.journal.some(entry => entry.id === "ward-nine"))
    .map(d => ({ id: d.id, name: d.name, current: d.id === current, choices: available.filter(choice => choice.district === d.id) }));
}

/** Reviewed neutral landmarks; revealed only inside an already-known place card. */
export const MAP_LANDMARKS = {
  market: { src: "/art/opening-small.jpg", description: "An amber noodle stall under rainy Ward Four awnings." },
  chapel: { src: "/art/chapel.jpg", description: "The empty halo chair beneath Glass Chapel’s cyan and magenta windows." },
  canal: { src: "/art/canal.jpg", description: "Rain-dark canal infrastructure beneath the city lights." },
  spire: { src: "/art/spire.jpg", description: "Helion’s tall illuminated tower above the lower walkways." },
  shelter: { src: "/art/shelter-small.jpg", description: "The shelter landing and its passable ramp, before any repair outcome." },
  clinic: { src: "/art/clinic-conversation-small.jpg", description: "A modest clinic conversation room with an empty visitor chair." },
  "clinic-service": { src: "/art/clinic-relay-small.jpg", description: "A clinic service relay and closed routing papers." },
  "ward-nine": { src: "/art/memorial-stair-small.jpg", description: "The rain-worn memorial stair, without readable identities." },
} as const;

/** Presentation priority only; canonical discovery and choice order stay untouched. */
export function mapDisplayRows(state: GameState) {
  const priority = (row: ReturnType<typeof cityMap>[number]) => row.current ? 0 : row.choices.length ? 1 : 2;
  return cityMap(state).toSorted((a, b) => priority(a) - priority(b));
}

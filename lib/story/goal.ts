import type { GameState } from "../types";

export const GOAL_ARRIVE = "Find Quill at the Ward Four noodle stall. Hear what he is offering.";

export const GOAL_LIFT = "Lift Mara Voss's hour from Glass Chapel before dawn. Kerr is paid to stop you.";
export const GOAL_DECIDE = "You know what the hour is. Decide who gets it.";
export const GOAL_WEEK = "The week wants a buyer or a witness.";
export const GOAL_WALL = "The wall has the names. Say them, or leave them to the rain.";

const WEEK = new Set([
  "card_week",
  "street_after",
  "districts",
  "act2_kerr_door",
  "act2_lumen_door",
  "act2_helion_door",
  "ending_week_wards",
  "ending_week_deal",
  "ending_exposed",
]);

const WALL = new Set(["card_wall", "ward_wall", "ending_names", "ending_quiet", "ending_witness", "ending_listed"]);

export function actName(state: GameState): string {
  const id = state.sceneId;
  if (WALL.has(id) || id.startsWith("act3_")) return "The Wall";
  if (WEEK.has(id) || id.startsWith("act2_")) return "The Week";
  return "The Hour";
}

export function currentGoal(state: GameState): string {
  const id = state.sceneId;
  if (id.startsWith("opening_")) return GOAL_ARRIVE;
  if (WALL.has(id) || id.startsWith("act3_")) return GOAL_WALL;
  if (WEEK.has(id) || id.startsWith("act2_")) return GOAL_WEEK;
  if (state.flags.heard_memo || state.journal.some((entry) => entry.id === "ward-nine")) return GOAL_DECIDE;
  return GOAL_LIFT;
}

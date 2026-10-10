import type { GameState } from "../types";
import { windowRemaining } from "../chapel-window";

export const GOAL_ARRIVE = "Find Quill at the Ward Four noodle stall. Hear what he is offering.";

export const GOAL_SELF = "Choose what you want tonight's work to buy.";
export const GOAL_OFFER = "Hear Quill's terms. Decide whether to take Mara Voss's hour from Glass Chapel.";

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

const BRIEFING = new Set(["stall", "pay", "pay_yes", "pay_no", "why", "chapel", "job_owner"]);

export function actName(state: GameState): string {
  const id = state.sceneId;
  if (WALL.has(id) || id.startsWith("act3_")) return "The Wall";
  if (WEEK.has(id) || id.startsWith("act2_")) return "The Week";
  return "The Hour";
}

export function currentGoal(state: GameState): string {
  const id = state.sceneId;
  if (id === "chapel_window_plan" || id === "chapel_window_exit") {
    const count = windowRemaining(state);
    return `Service window: ${count} ${count === 1 ? "opportunity" : "opportunities"} left. Save one for a quiet exit, or use the staffed recovery.`;
  }
  if (id === "chapel_window_expired") return "The service window closed. Ordinary doors remain available without a fee.";
  if (id === "opening_self") return GOAL_SELF;
  if (id.startsWith("opening_")) return GOAL_ARRIVE;
  if (WALL.has(id) || id.startsWith("act3_")) return GOAL_WALL;
  if (WEEK.has(id) || id.startsWith("act2_")) return GOAL_WEEK;
  if (state.flags.heard_memo || state.journal.some((entry) => entry.id === "ward-nine")) return GOAL_DECIDE;
  if (BRIEFING.has(id) && !state.flags.hired) return GOAL_OFFER;
  return GOAL_LIFT;
}

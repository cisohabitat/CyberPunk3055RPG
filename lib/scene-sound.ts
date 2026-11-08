import type { GameState } from "./types";
import { windowRemaining } from "./chapel-window";
import { districtRemaining } from "./district-response";
import { investigationScene } from "./investigation-scenes";

export type SoundMood = "street" | "chapel" | "ward" | "week" | "reading" | "quiet" | "pressure" | "title";
export type SoundDistrict = "street" | "chapel" | "spire" | "canal" | "ward" | "clinic" | "witness" | "stall";

/** Read-only scene direction; no AudioContext, playback or mutable cache state. */
export function sceneMood(location: string, act = ""): SoundMood {
  const value = location.toLowerCase();
  if (value.includes("ward nine") || value.includes("wall") || value.includes("witness")) return "ward";
  if (value.includes("chapel") || value.includes("chair") || value.includes("memory")) return "chapel";
  return act === "The Week" ? "week" : "street";
}
const QUIET_SCENES = new Set(["act2_ramp_terms","act2_ramp_survey","act2_ramp_gear","act2_ramp_load","act2_ramp_arrived","act2_ramp_stopped","act3_ramp_return","act3_payoff_edda", "act3_payoff_kerr", "act2_craft_archive","act2_craft_archive_challenge","act2_craft_archive_issuer","act2_craft_archive_ledger","act3_craft_archive_return","act2_craft_kerr_offer","act2_craft_kerr_settlement","act3_craft_kerr_settlement","act2_mara_quiet", "act2_mara_company", "act2_mara_company_kept", "act2_lumen_quiet", "act3_lumen_boundary", "act3_mara_followup", "act3_kerr_personal_question", "act3_chapel_return", "ending_quiet", "act2_witness_return_private"]);
const CLINIC_SCENES = new Set(["act2_witness_return_registered", "act2_witness_return_relocated", "act3_witness_shift_return", "act2_response_invitation", "act2_response_agenda", "act2_response_refusal", "act2_response_terms", "act2_response_dispatch", "act2_response_receipt", "act2_mara_quiet", "act2_mara_company", "act2_mara_company_kept", "act2_lumen_quiet", "act3_response_visit", "act3_mara_followup", "act3_lumen_boundary", "act2_mara_account", "act2_mara_account_told", "act2_mara_account_owned", "act2_mara_account_deflected", "act2_mara_account_distance", "act3_mara_account_return", "act3_mara_account_question", "act3_mara_account_repair"]);
const ROOM_SCENES: Readonly<Record<string, SoundDistrict>> = { act3_payoff_edda: "ward", act3_payoff_kerr: "stall", "act2_craft_archive": "spire","act2_craft_archive_challenge": "spire","act2_craft_archive_issuer": "spire","act2_craft_archive_ledger": "spire","act3_craft_archive_return": "ward","act2_craft_kerr_offer": "stall","act2_craft_kerr_settlement": "stall","act3_craft_kerr_settlement": "stall", act2_witness_return_private: "witness", stall: "stall", pay: "stall", pay_yes: "stall", pay_no: "stall", why: "stall", job_owner: "stall", act2_route_receipt: "stall", act3_kerr_personal_question: "stall", act2_witness_brief: "clinic", act2_witness_support: "clinic", act2_witness_arrival: "witness", act2_witness_safe: "witness", act3_testimony_nia: "witness" };
/** Read-only staging. A saved allowance is pressure; no real-time clock is added. */
export function sceneSoundPlan(state: GameState, location: string, act = ""): { mood: SoundMood; district: SoundDistrict } {
  const value = location.toLowerCase();
  const district: SoundDistrict = CLINIC_SCENES.has(state.sceneId) ? "clinic" : ROOM_SCENES[state.sceneId] ?? (state.sceneId.startsWith("ending_") && ["ending_names", "ending_quiet", "ending_witness", "ending_listed"].includes(state.sceneId) ? "ward"
    : /ward nine|wall|witness/.test(value) ? "ward" : /chapel|chair|memory|clinic|conversation room/.test(value) ? "chapel"
    : /spire|helion/.test(value) ? "spire" : /canal|depot/.test(value) ? "canal" : "street");
  const pressure = state.sceneId.startsWith("chapel_window_") && state.flags.chapel_window_started && !state.flags.chapel_window_done && windowRemaining(state) > 0
    || ["act2_district_canal", "act2_district_work", "act2_district_rest"].includes(state.sceneId) && state.flags.district_query_sent && !state.flags.district_window_closed && districtRemaining(state) > 0;
  const mood = pressure ? "pressure" : state.sceneId.includes("_district_") || state.sceneId.startsWith("act2_technique_") || ["act2_return_routing_terms","act2_return_routing_read","act2_return_routing_prepare","act2_return_routing_route","act2_return_routing_result","act3_return_routing_return"].includes(state.sceneId) || investigationScene(state.sceneId) || QUIET_SCENES.has(state.sceneId) || CLINIC_SCENES.has(state.sceneId) || ["act2_witness_brief", "act2_witness_support", "act2_witness_arrival", "act2_route_receipt"].includes(state.sceneId) ? "quiet"
    : state.sceneId === "memo" || state.sceneId === "mara_why" || state.sceneId.startsWith("memory_") && state.sceneId !== "memory_table" ? "reading"
    : state.sceneId.startsWith("ending_") && district === "ward" ? "ward" : sceneMood(location, act);
  return { mood, district };
}
export function locationCue(location: string, ending: boolean): string {
  if (ending) return "sting-ending";
  const value = location.toLowerCase();
  if (value.includes("memory")) return "sting-memory";
  if (value.includes("ward nine") || value.includes("witness")) return "sting-ward";
  if (value.includes("district") || value.includes("board") || value === "the week") return "sting-week";
  if (value.includes("chapel") || value.includes("chair") || value.includes("stair")) return "sting-chapel";
  if (value.includes("ward") || value.includes("alley") || value.includes("canal") || value.includes("hatch")) return "sting-alley";
  if (value.includes("spire") || value.includes("helion")) return "sting-ending";
  return "sting-stall";
}

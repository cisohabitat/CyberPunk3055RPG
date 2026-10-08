import type { GameState } from "../types";

export type CastMember = { name: string; role: string };

const ORDER: CastMember[] = [
  { name: "Quill", role: "The broker" },
  { name: "Mara Voss", role: "The patient" },
  { name: "Kerr", role: "Her shadow" },
  { name: "Sister Lumen", role: "The nurse" },
  { name: "Ives", role: "The folio" },
  { name: "Sera", role: "The wall" },
];

export function speakerRole(speaker: string): string | undefined {
  if (speaker === "Mara") return "The patient";
  return ORDER.find((person) => person.name === speaker)?.role;
}

export function metCast(state: GameState, speaker?: string): CastMember[] {
  const met = new Set<string>(["Quill"]);
  if (speaker === "Mara") met.add("Mara Voss");
  if (speaker) met.add(speaker);
  if (state.flags.met_mara || state.flags.heard_memo || state.journal.some((entry) => entry.id === "ward-nine")) met.add("Mara Voss");
  if (state.flags.met_kerr || state.flags.kerr_down || state.flags.kerr_slipped || state.flags.kerr_talked || state.flags.knee || state.flags.kerr_sold_you) {
    met.add("Kerr");
  }
  if (state.flags.met_lumen || state.flags.knows_truth || state.flags.lumen_here || state.flags.honest || state.flags.brushed || state.flags.walk_nine) {
    met.add("Sister Lumen");
  }
  if (state.flags.met_ives || state.flags.gave_copy || state.flags.ives_open || state.flags.ives_satisfied) met.add("Ives");
  if (state.flags.met_sera) met.add("Sera");
  return ORDER.filter((person) => met.has(person.name));
}

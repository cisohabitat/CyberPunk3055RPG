import type { GameState } from "../types";
import { visibleCampaignDialogue } from "../campaign-dialogue";

export type CastMember = { name: string; speaker: string; role: string; metFlag: string; thumbnail: string };

export const CAST: readonly CastMember[] = [
  { name: "Asa", speaker: "Asa", role: "The courier", metFlag: "met_asa", thumbnail: "/art/cast-asa.jpg" },
  { name: "Quill", speaker: "Quill", role: "The broker", metFlag: "met_quill", thumbnail: "/art/cast-quill.jpg" },
  { name: "Mara Voss", speaker: "Mara", role: "The patient", metFlag: "met_mara", thumbnail: "/art/cast-mara.jpg" },
  { name: "Kerr", speaker: "Kerr", role: "Her shadow", metFlag: "met_kerr", thumbnail: "/art/cast-kerr.jpg" },
  { name: "Sister Lumen", speaker: "Sister Lumen", role: "The nurse", metFlag: "met_lumen", thumbnail: "/art/cast-lumen.jpg" },
  { name: "Ives", speaker: "Ives", role: "The folio", metFlag: "met_ives", thumbnail: "/art/cast-ives.jpg" },
  { name: "Sera", speaker: "Sera", role: "The wall", metFlag: "met_sera", thumbnail: "/art/cast-sera.jpg" },
  { name: "Edda", speaker: "Edda", role: "The archive technician", metFlag: "met_edda", thumbnail: "/art/cast-edda.jpg" },
  { name: "Nia Pell", speaker: "Nia Pell", role: "The living witness", metFlag: "met_nia", thumbnail: "/art/cast-nia.jpg" },
  { name: "Ren", speaker: "Ren", role: "The shelter contact", metFlag: "met_ren", thumbnail: "/art/cast-ren.jpg" },
  { name: "Orderly", speaker: "Orderly", role: "The Chapel attendant", metFlag: "met_orderly", thumbnail: "/art/cast-orderly.jpg" },
  { name: "Stallholder", speaker: "Stallholder", role: "The noodle seller", metFlag: "met_stallholder", thumbnail: "/art/cast-stallholder.jpg" },
  { name: "Dispatcher", speaker: "Dispatcher", role: "The dispatch contact", metFlag: "met_dispatcher", thumbnail: "/art/cast-dispatcher.jpg" },
  { name: "Mechanic", speaker: "Mechanic", role: "The records contact", metFlag: "met_mechanic", thumbnail: "/art/cast-mechanic.jpg" },
  { name: "Masked attendant", speaker: "Masked attendant", role: "The hatch attendant", metFlag: "met_attendant", thumbnail: "/art/cast-attendant.jpg" },
];

export function speakerRole(speaker: string): string | undefined {
  return CAST.find((person) => person.speaker === speaker)?.role;
}

/** Only explicitly attributed, actually present dialogue introduces a second actor. */
export function encounteredCast(sceneId: string, speaker: string | undefined, text: string): CastMember[] {
  const present = new Set([speaker, ...visibleCampaignDialogue(sceneId, speaker, text).map(line => line.speaker)]);
  return CAST.filter(person => present.has(person.speaker));
}

export function metCast(state: GameState, speaker?: string, visibleText = ""): CastMember[] {
  const met = new Set<string>(["Quill"]);
  for (const person of encounteredCast(state.sceneId, speaker, visibleText)) met.add(person.name);
  for (const person of CAST) if (state.flags[person.metFlag]) met.add(person.name);
  if (state.flags.met_mara || state.flags.heard_memo || state.journal.some((entry) => entry.id === "ward-nine")) met.add("Mara Voss");
  if (state.flags.met_kerr || state.flags.kerr_down || state.flags.kerr_slipped || state.flags.kerr_talked || state.flags.knee || state.flags.kerr_sold_you) {
    met.add("Kerr");
  }
  if (state.flags.met_lumen || state.flags.knows_truth || state.flags.lumen_here || state.flags.honest || state.flags.brushed || state.flags.walk_nine) {
    met.add("Sister Lumen");
  }
  if (state.flags.met_ives || state.flags.gave_copy || state.flags.ives_open || state.flags.ives_satisfied) met.add("Ives");
  if (state.flags.met_sera) met.add("Sera");
  if (state.flags.met_asa) met.add("Asa");
  if (state.flags.met_edda) met.add("Edda");
  if (state.flags.met_nia) met.add("Nia Pell");
  if (state.flags.opening_neighbor_heard) met.add("Stallholder");
  return CAST.filter((person) => met.has(person.name));
}

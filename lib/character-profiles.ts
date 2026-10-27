import { PORTRAIT_ART } from "./art";
import { metCast } from "./story/cast";
import type { GameState, JournalEntry } from "./types";

/** Introductions use only the public identity available at the first encounter.
 * Later biography comes from the actual journal, with its original qualifications.
 * No flag guesses a missing conversation, receipt, permission or personal history.
 */
export const CHARACTER_PROFILES: Readonly<Record<string, { introduction: string; journalIds: readonly string[] }>> = {
  Asa: {
    introduction: "A courier you remember from the flats. Asa handles sealed clinic freight at the canal gate, where keeping a parcel cold and getting it received are different jobs.",
    journalIds: ["freight-promise", "freight-receipt", "freight-late-reply"],
  },
  Quill: {
    introduction: "A broker who arranges work outside official records. His Ward Four noodle-stall meeting offers a way to earn money in a city where every door has a price.",
    journalIds: ["quill-late-payment"],
  },
  Mara: {
    introduction: "The patient whose hour Quill wants taken from Glass Chapel. A recorded hour and the person living beyond it need to be heard on their own terms.",
    journalIds: ["ward-nine", "mara-assurance", "mara-channel", "mara-tomorrow", "mara-window-choice", "mara-account-night-sold", "mara-account-night-both", "mara-account-night-destroyed", "mara-account-night-partial", "mara-account-night-left", "mara-account-owned", "mara-account-deflected", "mara-account-distance", "mara-account-repaired", "mara-account-question", "response-public-refusal", "mara-response-terms", "mara-response-dispatch", "mara-response-intake"],
  },
  Kerr: {
    introduction: "Mara’s shadow at Glass Chapel. He stands between the runner and the shard, doing a job for Helion.",
    journalIds: ["kerr-knee", "kerr-collection-promise", "kerr-collection-outcome", "kerr-collection-response", "kerr-personal-answer"],
  },
  "Sister Lumen": {
    introduction: "A nurse at Glass Chapel, with clean hands and rain-marked shoes. She works where care and the city’s trade in memory meet.",
    journalIds: ["clinic-debt", "lumen-staying", "response-clinic-refusal", "chapel-return-response", "lumen-contact-limit"],
  },
  Ives: {
    introduction: "Helion sends Ives down from the Spire with a dry coat and an open folio. He brings the tower’s business to the street in clauses and offers.",
    journalIds: [],
  },
  Sera: {
    introduction: "A Ward Nine neighbor who keeps names and accounts in view. She asks what a runner can stand behind when the city wants a final sentence.",
    journalIds: ["shelter-promise", "shelter-room", "shelter-arrival", "shelter-followup", "wall-account"],
  },
  Edda: {
    introduction: "A technician working with Helion’s service records. Her name belongs to a person who has to return to work, as well as to the records you may ask her to handle.",
    journalIds: ["spire-promise", "spire-closure", "spire-desk-request", "spire-payroll-response", "spire-late-closure", "archive-custody", "edda-review", "edda-shift-request", "edda-shift-response"],
  },
  "Nia Pell": {
    introduction: "A living witness with a photograph of her own to keep. Her care, her words and her choice of contact each belong to her.",
    journalIds: ["witness-promise", "nia-account", "nia-contact"],
  },
  Ren: {
    introduction: "A Ward Four neighbor whose family is part of the life behind the district’s case files. She speaks in her own voice about what matters to the people living here.",
    journalIds: ["shelter-arrival", "shelter-room", "shelter-followup"],
  },
  Orderly: {
    introduction: "The white-coated attendant at the Chapel basin, with a gold filament in one tooth. Their practiced courtesy is also the first test at the front door.",
    journalIds: ["chapel-shift-promise"],
  },
  Stallholder: {
    introduction: "The woman behind the Ward Four noodle counter. She keeps dinner going under the awning while the city advertises a life without yesterday.",
    journalIds: [],
  },
  Dispatcher: {
    introduction: "A desk contact for clinic notice dispatch. Sealed cards, delivery windows and return contacts are the practical details of this encounter.",
    journalIds: ["notice-receipt", "notice-reply"],
  },
  Mechanic: {
    introduction: "A neighbor comparing sources at the Ward Nine records table. He wants an account that can keep its questions visible.",
    journalIds: ["packet-correction"],
  },
  "Masked attendant": {
    introduction: "The technician at the hot maintenance vein behind the Chapel. A mask, a collar mic and a working tool make this a different door into the building.",
    journalIds: [],
  },
};

export type CharacterProfile = { introduction: string; portrait: string; notes: JournalEntry[] };

/** Same revealed-speaker gate as People, including partial paragraph reading. */
export function characterProfile(state: GameState, actor: string, speaker?: string, visibleText = ""): CharacterProfile | undefined {
  if (!metCast(state, speaker, visibleText).some(person => person.speaker === actor)) return;
  const profile = CHARACTER_PROFILES[actor];
  if (!profile) return;
  return {
    introduction: profile.introduction,
    portrait: PORTRAIT_ART[actor],
    notes: state.journal.filter(entry => profile.journalIds.includes(entry.id)).map(entry => ({ ...entry })),
  };
}

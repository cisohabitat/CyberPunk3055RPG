import type { ComplicationId, FactionId, OriginId, StatId } from "./types";

export const STATS: StatId[] = ["chrome", "nerve", "face", "ghost"];

export const STAT_INFO: Record<StatId, { name: string; blurb: string }> = {
  chrome: {
    name: "Chrome",
    blurb: "Machines, locks, and old corporate handshakes.",
  },
  nerve: {
    name: "Nerve",
    blurb: "Violence, steadiness, and staying in your body.",
  },
  face: {
    name: "Face",
    blurb: "Lies, bargains, and the read on a person.",
  },
  ghost: {
    name: "Ghost",
    blurb: "Hatches, silence, and the minute nobody counted.",
  },
};

export const POINTS = 2;
export const STAT_CAP = 5;
export const STRAIN_MAX = 5;

export type Origin = {
  id: OriginId;
  name: string;
  perk: string;
  perkStat: StatId;
  perkText: string;
  blurb: string;
  stats: Record<StatId, number>;
  creds: number;
};

export const ORIGINS: Record<OriginId, Origin> = {
  gutterwire: {
    id: "gutterwire",
    name: "Gutterwire",
    perk: "Alley Math",
    perkStat: "nerve",
    perkText: "Nerve checks +1. You count exits before you count threats.",
    blurb: "Raised under the leaks. You can smell a squad car and a lie at the same range.",
    stats: { chrome: 1, nerve: 3, face: 2, ghost: 2 },
    creds: 60,
  },
  spire: {
    id: "spire",
    name: "Spire Exile",
    perk: "Old Clearance",
    perkStat: "chrome",
    perkText: "Chrome checks +1. Some doors still remember your old name.",
    blurb: "You wore a Helion badge until the badge stopped wearing you.",
    stats: { chrome: 3, nerve: 2, face: 2, ghost: 1 },
    creds: 100,
  },
  dustline: {
    id: "dustline",
    name: "Dustline",
    perk: "Weather Eye",
    perkStat: "ghost",
    perkText: "Ghost checks +1. You were finding ways around walls before this dome.",
    blurb: "Courier from the flats. The dome is a rumor you decided to invoice.",
    stats: { chrome: 2, nerve: 2, face: 1, ghost: 3 },
    creds: 40,
  },
};

export const FACTIONS: FactionId[] = ["quill", "lumen", "helion", "wards"];

export const FACTION_INFO: Record<FactionId, { name: string; blurb: string }> = {
  quill: { name: "Quill", blurb: "The stall. The advance. The man who does not do sentiment." },
  lumen: { name: "Lumen", blurb: "Glass Chapel's nurse with an optic and a longer memory than the chair." },
  helion: { name: "Helion", blurb: "The tower that paid to forget Ward Nine." },
  wards: { name: "The wards", blurb: "People who still live under the leaks." },
};

export const FACTION_CHECK: Record<FactionId, string> = {
  quill: "No die reads this number. The stall remembers it.",
  lumen: "At 2 or more, she uses your handle on the chapel step. No die reads this number.",
  helion: "At 1 or more, closing Ives's folio is easier.",
  wards: "At 1 or more, telling Kerr the names is easier.",
};

export type Complication = {
  id: ComplicationId;
  name: string;
  perk: string;
  cost: string;
  blurb: string;
};

export const COMPLICATIONS: Record<ComplicationId, Complication> = {
  debt: {
    id: "debt",
    name: "Quill's tab",
    perk: "He starts one step warmer.",
    cost: "You start 40 creds poorer.",
    blurb: "You already owe the stall. He will pretend that is loyalty.",
  },
  optic: {
    id: "optic",
    name: "Live optic",
    perk: "Chrome checks +1.",
    cost: "You begin the night at Strain 1. It does not power down.",
    blurb: "A chapel leftover. The eye keeps looking after you ask it to stop.",
  },
  "on-file": {
    id: "on-file",
    name: "Still on file",
    perk: "Helion already knows the name.",
    cost: "The tower starts two steps ahead of you.",
    blurb: "A badge you burned did not burn the record.",
  },
};

export function startingFactions(origin: OriginId, complication: ComplicationId | null): Record<FactionId, number> {
  const scores: Record<FactionId, number> = { quill: 0, lumen: 0, helion: 0, wards: 0 };
  if (origin === "gutterwire") scores.wards = 1;
  if (origin === "spire") scores.helion = 1;
  if (origin === "dustline") scores.quill = 1;
  if (complication === "debt") scores.quill += 1;
  if (complication === "optic") scores.lumen += 1;
  if (complication === "on-file") scores.helion += 2;
  return scores;
}

export function isValidName(value: string, max = 18): boolean {
  const trimmed = value.trim();
  if (trimmed.length < 1 || trimmed.length > max) return false;
  return /^[A-Za-z0-9]+(?:[ '\-][A-Za-z0-9]+)*$/.test(trimmed);
}

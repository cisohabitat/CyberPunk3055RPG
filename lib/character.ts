import type { OriginId, StatId } from "./types";

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

export function isValidName(value: string, max = 18): boolean {
  const trimmed = value.trim();
  if (trimmed.length < 1 || trimmed.length > max) return false;
  return /^[A-Za-z0-9]+(?:[ '\-][A-Za-z0-9]+)*$/.test(trimmed);
}

export type StatId = "chrome" | "nerve" | "face" | "ghost";
export type OriginId = "gutterwire" | "spire" | "dustline";
export type FactionId = "quill" | "lumen" | "helion" | "wards";
export type ComplicationId = "debt" | "optic" | "on-file";

export type JournalEntry = {
  id: string;
  text: string;
};

export type Effect = {
  strain?: number;
  creds?: number;
  itemsAdd?: string[];
  itemsRemove?: string[];
  flags?: string[];
  flagsOff?: string[];
  journal?: Array<string | JournalEntry>;
  factions?: Partial<Record<FactionId, number>>;
};

export type GameState = {
  version: 2;
  handle: string;
  givenName: string;
  origin: OriginId;
  complication: ComplicationId | null;
  stats: Record<StatId, number>;
  factions: Record<FactionId, number>;
  creds: number;
  strain: number;
  items: string[];
  flags: Record<string, boolean>;
  journal: JournalEntry[];
  chapters: string[];
  rolls: RollLog[];
  sceneId: string;
};

export type EffectSpec = Effect | ((state: GameState) => Effect);
export type NextSpec = string | ((state: GameState) => string);

export type FactionBonus = {
  faction: FactionId;
  min: number;
  amount: number;
  label: string;
};

export type CheckSpec = {
  stat: StatId;
  dc: number;
  label: string;
  itemBonuses?: { item: string; amount: number }[];
  flagBonuses?: { flag: string; amount: number; label: string }[];
  factionBonuses?: FactionBonus[];
  journalBonuses?: { id: string; amount: number; label: string }[];
};

export type Choice = {
  id: string;
  label: string;
  detail?: string;
  hideIfFlag?: string;
  hideIfAnyFlag?: string[];
  hideIfItem?: string;
  requireFlag?: string;
  requireAnyFlag?: string[];
  requireItem?: string;
  requireJournal?: string;
  hideIfJournal?: string;
  requireCreds?: number;
  check?: CheckSpec;
  effects?: EffectSpec;
  successEffects?: EffectSpec;
  failEffects?: EffectSpec;
  consumeItems?: string[];
  next?: NextSpec;
  nextSuccess?: NextSpec;
  nextFail?: NextSpec;
  resultSuccess?: string;
  resultFail?: string;
};

export type Scene = {
  id: string;
  location: string;
  speaker?: string;
  ending?: boolean;
  finale?: boolean;
  endingTitle?: string;
  text: string | ((state: GameState) => string);
  choices: Choice[];
};

export type RollLog = {
  label: string;
  roll: number;
  total: number;
  dc: number;
  success: boolean;
};

export type BonusPart = { label: string; value: number };

export type CheckPreview = {
  label: string;
  stat: StatId;
  dc: number;
  bonus: number;
  parts: BonusPart[];
  hits: number;
};

export type Codex = {
  seen: { id: string; title: string }[];
  keepsakes: string[];
};

export type CheckResult = CheckPreview & {
  roll: number;
  total: number;
  success: boolean;
  crit: null | "success" | "fail";
  flavor: string;
};

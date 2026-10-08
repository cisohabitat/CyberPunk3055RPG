export type StatId = "chrome" | "nerve" | "face" | "ghost";
export type OriginId = "gutterwire" | "spire" | "dustline";

export type Effect = {
  strain?: number;
  creds?: number;
  itemsAdd?: string[];
  itemsRemove?: string[];
  flags?: string[];
  flagsOff?: string[];
  journal?: string[];
};

export type GameState = {
  version: 1;
  handle: string;
  givenName: string;
  origin: OriginId;
  stats: Record<StatId, number>;
  creds: number;
  strain: number;
  items: string[];
  flags: Record<string, boolean>;
  journal: string[];
  rolls: RollLog[];
  sceneId: string;
};

export type EffectSpec = Effect | ((state: GameState) => Effect);
export type NextSpec = string | ((state: GameState) => string);

export type CheckSpec = {
  stat: StatId;
  dc: number;
  label: string;
  itemBonuses?: { item: string; amount: number }[];
  flagBonuses?: { flag: string; amount: number; label: string }[];
};

export type Choice = {
  id: string;
  label: string;
  detail?: string;
  hideIfFlag?: string;
  hideIfAnyFlag?: string[];
  hideIfItem?: string;
  requireFlag?: string;
  requireItem?: string;
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

export type CheckResult = CheckPreview & {
  roll: number;
  total: number;
  success: boolean;
  crit: null | "success" | "fail";
  flavor: string;
};

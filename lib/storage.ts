import { FACTIONS, ORIGINS, startingFactions } from "./character";
import { journalEntry } from "./journal";
import { SCENES } from "./story";
import { ITEMS } from "./items";
import type { Codex, ComplicationId, FactionId, GameState, JournalEntry, OriginId } from "./types";

const SAVE_KEY = "saint-shard-3055-v1";
const SOUND_KEY = "saint-shard-sound";
const TEXT_KEY = "saint-shard-text";
const CODEX_KEY = "saint-shard-codex";

function readStored(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStored(key: string, value: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

const COMPLICATIONS = new Set<ComplicationId>(["debt", "optic", "on-file"]);

function isOrigin(value: unknown): value is OriginId {
  return value === "gutterwire" || value === "spire" || value === "dustline";
}

function isJournal(value: unknown): value is JournalEntry[] {
  return (
    Array.isArray(value) &&
    value.every((entry) => entry && typeof entry.id === "string" && typeof entry.text === "string")
  );
}

function isFactions(value: unknown): value is Record<FactionId, number> {
  if (!value || typeof value !== "object") return false;
  return FACTIONS.every((faction) => typeof (value as Record<string, unknown>)[faction] === "number");
}

function migrate(data: Record<string, unknown>): GameState | null {
  if (typeof data.handle !== "string" || typeof data.sceneId !== "string") return null;
  if (!SCENES[data.sceneId] || !isOrigin(data.origin)) return null;
  if (!data.stats || typeof data.creds !== "number" || typeof data.strain !== "number") return null;
  if (!Array.isArray(data.items) || !Array.isArray(data.journal) || !Array.isArray(data.rolls)) return null;
  if (!data.flags || typeof data.flags !== "object") return null;
  const journal = data.journal.map((line) => (typeof line === "string" ? journalEntry(line) : line));
  if (!isJournal(journal)) return null;
  const complication = COMPLICATIONS.has(data.complication as ComplicationId) ? (data.complication as ComplicationId) : null;
  return {
    version: 2,
    handle: data.handle,
    givenName: typeof data.givenName === "string" && data.givenName ? data.givenName : data.handle,
    origin: data.origin,
    complication,
    stats: data.stats as GameState["stats"],
    factions: isFactions(data.factions) ? data.factions : startingFactions(data.origin, complication),
    creds: data.creds,
    strain: data.strain,
    items: data.items.filter((id): id is string => typeof id === "string"),
    flags: data.flags as GameState["flags"],
    journal,
    chapters: Array.isArray(data.chapters) ? data.chapters.filter((title): title is string => typeof title === "string") : [],
    rolls: data.rolls as GameState["rolls"],
    log: Array.isArray(data.log) ? data.log.filter((line): line is string => typeof line === "string").slice(0, 24) : [],
    sceneId: data.sceneId,
  };
}

export function parseSave(raw: string | null): GameState | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Record<string, unknown>;
    if (data?.version !== 1 && data?.version !== 2) return null;
    const state = migrate(data);
    if (!state || !ORIGINS[state.origin]) return null;
    return state;
  } catch {
    return null;
  }
}

export function loadSave(): GameState | null {
  return parseSave(readStored(SAVE_KEY));
}

export function writeSave(state: GameState): boolean {
  return writeStored(SAVE_KEY, JSON.stringify(state));
}

export function clearSave(): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.removeItem(SAVE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function loadSound(): boolean {
  return readStored(SOUND_KEY) === "on";
}

export function writeSound(on: boolean) {
  return writeStored(SOUND_KEY, on ? "on" : "off");
}

export function loadTextStep(): number {
  const step = Number(readStored(TEXT_KEY));
  return step === 1 || step === 2 ? step : 0;
}

export function writeTextStep(step: number) {
  return writeStored(TEXT_KEY, String(step === 1 || step === 2 ? step : 0));
}

export function emptyCodex(): Codex {
  return { seen: [], keepsakes: [] };
}

export function parseCodex(raw: string | null): Codex {
  if (!raw) return emptyCodex();
  try {
    const data = JSON.parse(raw) as Codex;
    const seen = Array.isArray(data.seen)
      ? data.seen.filter((entry) => entry && typeof entry.id === "string" && typeof entry.title === "string")
      : [];
    const keepsakes = Array.isArray(data.keepsakes)
      ? data.keepsakes.filter((id): id is string => typeof id === "string" && Boolean(ITEMS[id]))
      : [];
    return { seen, keepsakes };
  } catch {
    return emptyCodex();
  }
}

export function loadCodex(): Codex {
  return parseCodex(readStored(CODEX_KEY));
}

export function writeCodex(codex: Codex) {
  return writeStored(CODEX_KEY, JSON.stringify(codex));
}

export function rememberEnding(id: string, title: string, keepsakes?: string[]) {
  const current = loadCodex();
  const seen = current.seen.some((entry) => entry.id === id) ? current.seen : [...current.seen, { id, title }];
  const nextKeepsakes = keepsakes?.filter((item) => ITEMS[item]) ?? current.keepsakes;
  return writeCodex({ seen, keepsakes: nextKeepsakes });
}

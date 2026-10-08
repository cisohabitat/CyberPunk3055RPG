import { ORIGINS } from "./character";
import { SCENES } from "./story";
import type { GameState } from "./types";

const SAVE_KEY = "saint-shard-3055-v1";
const SOUND_KEY = "saint-shard-sound";

export function parseSave(raw: string | null): GameState | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as GameState;
    if (data?.version !== 1) return null;
    if (typeof data.handle !== "string" || typeof data.sceneId !== "string") return null;
    if (!SCENES[data.sceneId] || !ORIGINS[data.origin]) return null;
    if (!data.stats || typeof data.creds !== "number" || typeof data.strain !== "number") return null;
    if (!Array.isArray(data.items) || !Array.isArray(data.journal) || !Array.isArray(data.rolls)) return null;
    if (!data.flags || typeof data.flags !== "object") return null;
    return data;
  } catch {
    return null;
  }
}

export function loadSave(): GameState | null {
  if (typeof window === "undefined") return null;
  return parseSave(window.localStorage.getItem(SAVE_KEY));
}

export function writeSave(state: GameState) {
  window.localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

export function clearSave() {
  window.localStorage.removeItem(SAVE_KEY);
}

export function loadSound(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(SOUND_KEY) === "on";
}

export function writeSound(on: boolean) {
  window.localStorage.setItem(SOUND_KEY, on ? "on" : "off");
}

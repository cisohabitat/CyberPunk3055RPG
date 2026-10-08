import { loadSound, loadTextStep, readStored, writeStored } from "./storage";

export type Preferences = {
  textStep: number;
  contrast: "standard" | "high";
  reading: "paragraph" | "all";
  motion: "system" | "reduce";
  sound: boolean;
  music: number;
  ambience: number;
  effects: number;
  controller: boolean;
};
export const DEFAULT_PREFERENCES: Preferences = { textStep: 0, contrast: "standard", reading: "paragraph", motion: "system", sound: false, music: 60, ambience: 50, effects: 70, controller: false };
export function parsePreferences(raw: string | null): Preferences {
  let data;
  try { data = raw ? JSON.parse(raw) : {}; } catch { data = {}; }
  const defaults = DEFAULT_PREFERENCES;
  const volume = (value: unknown, fallback: number) => typeof value === "number" && Number.isFinite(value) ? Math.round(Math.max(0, Math.min(100, value))) : fallback;
  return {
    textStep: data?.textStep === 1 || data?.textStep === 2 ? data.textStep : 0,
    contrast: data?.contrast === "high" ? "high" : "standard",
    reading: data?.reading === "all" ? "all" : "paragraph",
    motion: data?.motion === "reduce" ? "reduce" : "system",
    sound: typeof data?.sound === "boolean" ? data.sound : defaults.sound,
    music: volume(data?.music, defaults.music), ambience: volume(data?.ambience, defaults.ambience), effects: volume(data?.effects, defaults.effects),
    controller: data?.controller === true,
  };
}
export function loadPreferences(): Preferences {
  const raw = readStored("saint-shard-preferences");
  return raw ? parsePreferences(raw) : { ...DEFAULT_PREFERENCES, sound: loadSound(), textStep: loadTextStep() };
}
export function writePreferences(value: Preferences): boolean { return writeStored("saint-shard-preferences", JSON.stringify(value)); }
export function applyPreferences(value: Preferences) {
  document.documentElement.dataset.text = String(value.textStep);
  document.documentElement.dataset.contrast = value.contrast;
  document.documentElement.dataset.motion = value.motion;
}

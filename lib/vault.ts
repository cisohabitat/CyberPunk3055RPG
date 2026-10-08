import { parseSave, readStored, removeStored, writeStored } from "./storage";
import type { GameState } from "./types";

export const SLOT_IDS = [1, 2, 3] as const;
export type SlotId = typeof SLOT_IDS[number];
export type Snapshot = { format: "saint-shard-save"; schema: 1; savedAt: string; checksum: string; state: GameState };

function checksum(text: string): string {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index++) hash = Math.imul(hash ^ text.charCodeAt(index), 16777619);
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function exportRun(state: GameState): string {
  const snapshot: Snapshot = { format: "saint-shard-save", schema: 1, savedAt: new Date().toISOString(), checksum: checksum(JSON.stringify(state)), state };
  return JSON.stringify(snapshot, null, 2);
}

export function importRun(raw: string): GameState {
  if (raw.length > 1_048_576) throw new Error("This save is too large. Choose a Saint Shard save under 1 MB.");
  let data;
  try { data = JSON.parse(raw); } catch { throw new Error("That file is not valid JSON. Your current run is unchanged."); }
  if (data?.format === "saint-shard-save") {
    if (data.schema !== 1) throw new Error("This save needs a different version of Saint Shard.");
    if (checksum(JSON.stringify(data.state)) !== data.checksum) throw new Error("The save failed its integrity check. Try a backup.");
    data = data.state;
  }
  const state = parseSave(JSON.stringify(data));
  if (!state) throw new Error("This file does not contain a supported Saint Shard run.");
  return state;
}

function key(id: SlotId) { return `saint-shard-slot-${id}`; }
export function loadSlot(id: SlotId): Snapshot | null {
  const raw = readStored(key(id));
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Snapshot;
    return { ...data, state: importRun(raw) };
  } catch { return null; }
}
export function saveSlot(id: SlotId, state: GameState): boolean { return writeStored(key(id), exportRun(state)); }
export function deleteSlot(id: SlotId): boolean { return removeStored(key(id)); }

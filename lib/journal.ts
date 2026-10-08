import type { JournalEntry } from "./types";

const KNOWN: Record<string, string> = {
  "Mara Voss signed the Ward Nine coolant dump. Three hundred people, one memo.": "ward-nine",
  "Kerr's knee is still his own, and it is bad. You also pocketed a sedative.": "kerr-knee",
  "The plinth's calibration window is four minutes.": "calibration",
  "A second copy of Mara's hour exists.": "shard-copy",
  "Helion's crime has a second copy loose in the wards.": "shard-copy",
  "Sister Lumen pressed a clinic marker into your palm.": "clinic-debt",
};

function slug(text: string): string {
  const id = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
  return id || "note";
}

export function journalEntry(item: string | JournalEntry): JournalEntry {
  if (typeof item !== "string") return item;
  return { id: KNOWN[item] ?? slug(item), text: item };
}

export function mergeJournal(current: JournalEntry[], incoming: Array<string | JournalEntry> | undefined): JournalEntry[] {
  const next = [...current];
  for (const item of incoming ?? []) {
    const entry = journalEntry(item);
    if (!next.some((line) => line.id === entry.id)) next.push(entry);
  }
  return next;
}

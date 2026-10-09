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

export const JOURNAL_TITLES: Record<string, string> = {
  "ward-nine": "Ward Nine",
  "kerr-knee": "Kerr's knee",
  calibration: "Calibration",
  "shard-copy": "The second copy",
  "clinic-debt": "Clinic marker",
  "memory-signature": "Mara's signature",
  "memory-order": "The exported counter-order",
  "memory-roster": "The living witness",
  "wall-account": "The public hearing",
  "archive-method": "Source comparison",
  "archive-custody": "Archive custody",
  "edda-review": "Edda’s shift review",
  "archive-promise": "Authenticate the receipt",
  "witness-promise": "Protect Nia Pell",
  "nia-account": "Nia's account",
  "verified-order": "Command chain verified",
  "archive-gap": "An unverified issuing key",
  "memory-analysis": "Two decisions, separate questions",
  "public-packet": "The public account",
  "packet-correction": "An attached correction",
};

export function journalTitle(entry: JournalEntry): string {
  if (JOURNAL_TITLES[entry.id]) return JOURNAL_TITLES[entry.id];
  return entry.text.split(/\s+/).slice(0, 5).join(" ").replace(/[.,;:]$/, "");
}

export function journalKind(entry: JournalEntry): "fact" | "claim" | "promise" {
  return entry.kind ?? (entry.id === "clinic-debt" ? "promise" : "fact");
}

export function promiseStatus(id: string, flags: Record<string, boolean>, journal: JournalEntry[] = []): string {
  if (id === "witness-promise") return flags.witness_lost ? "Location exposed" : flags.witness_safe && journal.some((entry) => entry.id === "nia-account") ? "Kept" : flags.witness_safe ? "Account pending" : "Unresolved";
  if (id === "archive-promise") return flags.order_verified ? "Corroborated" : flags.archive_unresolved ? "Gap recorded" : "Unresolved";
  return "Recorded";
}

export function mergeJournal(current: JournalEntry[], incoming: Array<string | JournalEntry> | undefined): JournalEntry[] {
  const next = [...current];
  for (const item of incoming ?? []) {
    const entry = journalEntry(item);
    if (!next.some((line) => line.id === entry.id)) next.push(entry);
  }
  return next;
}

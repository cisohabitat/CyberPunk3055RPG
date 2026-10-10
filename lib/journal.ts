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
  "mara-response-terms": "Mara’s current private terms",
  "response-public-refusal": "Mara’s refusal of public release",
  "response-clinic-refusal": "Lumen’s refusal of endorsement",
  "mara-tomorrow": "The morning Mara hopes for",
  "lumen-staying": "Why Lumen stays",
  "mara-response-dispatch": "The private dispatch stub",
  "mara-response-intake": "The unanswered records queue",
  "lumen-contact-limit": "Lumen’s own contact terms",
  "kerr-collection-promise": "Kerr’s collection terms",
  "kerr-itinerary": "The committed depot route",
  "kerr-collection-outcome": "The observed collection outcome",
  "kerr-collection-response": "Kerr’s reply to the disclosure",
  "kerr-personal-answer": "The walk Kerr hopes for",
  "quill-late-payment": "Quill’s late tab repayment",
  "timeline-mismatch": "The first timeline mismatch",
  "timeline-checked": "Timestamp comparison",
  "timeline-limit": "Unresolved timeline draft",
  "bench-verdict": "The runner’s tested verdict",
  "bench-challenge": "Lumen’s source challenge",
  "bench-correction": "The bench verdict correction",
  "bench-repeat": "The repeated bench verdict",
  "spire-promise": "Edda’s key-retirement terms",
  "spire-billing": "Two billing numbers",
  "spire-protocol": "Both-store retirement protocol",
  "spire-receiver": "Receiver handover terms",
  "spire-closure": "Matched key-closure receipt",
  "spire-desk-request": "Accepted retirement request",
  "spire-payroll-response": "Maintenance payroll position",
  "spire-late-closure": "Later key-retirement reply",
  "shelter-promise": "Shelter response terms",
  "shelter-room": "Shelter room allocation",
  "shelter-arrival": "Staffed hall arrival",
  "shelter-followup": "Neighbor follow-up",
  "freight-promise": "Asa’s delivery terms",
  "freight-seal": "Diagnostic case seal",
  "freight-manifest": "Clinic cargo slip",
  "freight-window": "Gate service timetable",
  "freight-receipt": "Clinic stock receipt",
  "freight-late-reply": "Clinic stock reply",
  "edda-shift-request": "Edda’s private payroll request",
  "edda-shift-response": "Edda’s payroll reply",
  "pump-inspection": "Coolant inspection appointment",
  "pump-repair": "Clinic coolant repair",
  "pump-transfer": "Cold-storage transfer",
  "ward-nine": "Ward Nine",
  "kerr-knee": "Kerr's knee",
  calibration: "Calibration",
  "shard-copy": "The second copy",
  "clinic-debt": "Clinic marker",
  "memory-signature": "Mara's signature",
  "memory-order": "The exported counter-order",
  "memory-roster": "The living witness",
  "field-kit": "Field equipment",
  "week-recovery": "The recovery visit",
  "wall-account": "The public hearing",
  "archive-method": "Source comparison",
  "archive-custody": "Archive custody",
  "edda-review": "Edda’s shift review",
  "archive-promise": "Authenticate the receipt",
  "witness-promise": "Protect Nia Pell",
  "nia-account": "Nia's account",
  "verified-order": "Command chain verified",
  "archive-gap": "An unverified issuing key",
  "nia-contact": "Nia’s future contact boundary",
  "notice-reply": "The clinic distribution reply",
  "notice-response": "Response to the observed window",
  "notice-promise": "Private clinic distribution",
  "notice-slip": "Private housing destinations",
  "notice-map": "The public clinic stop",
  "notice-card": "The appointment window",
  "notice-receipt": "Clinic dispatch receipt",
  "mara-assurance": "The assurance Mara accepted",
  "mara-channel": "The unnamed dispatch relay",
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
  if (id === "kerr-collection-promise") return flags.kerr_route_private && flags.kerr_route_trace ? "Private terms broken; register remains" : flags.kerr_route_delivered ? "Receipt observed" : flags.kerr_route_done ? "Collection unfinished" : "Collection open";
  if (id === "spire-promise") return flags.old_badge_traced ? flags.spire_closure_recorded ? "Closed; badge trace remains" : "Badge traced; closure unresolved" : flags.spire_closure_recorded ? "Closure recorded" : flags.spire_done ? "Closure unresolved" : "Retirement open";
  if (id === "notice-promise") return flags.notice_unresolved ? "Distribution unresolved" : flags.notice_done ? "Dispatched; delivery unobserved" : "Distribution open";
  if (id === "edda-shift-request") return flags.edda_shift_paid ? "Temporary paid work" : flags.edda_shift_done ? "Review pending" : "Application open";
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

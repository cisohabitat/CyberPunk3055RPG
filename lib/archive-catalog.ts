import type { Choice, GameState } from "./types";

/** Catalog descriptions are search aids, never retrieved evidence. */
export const ARCHIVE_CATALOG = [
  { id: "authorization", reference: "WN/COOL/AUTH", title: "Flush authorizations", scope: "The original coolant approval", entry: "Mara's authorization, before the evacuation revision.", limit: "Indexes approval of the flush. No later evacuation instruction is indexed here.", mismatch: "The returned locator covers the original authorization. It cannot corroborate the later cancellation. No independent record was retrieved." },
  { id: "revision", reference: "WN/SHIFT/REV", title: "Shift amendments", scope: "Changes to worker movement", entry: "A later evacuation revision, with the coolant work retained.", limit: "A catalog entry for a possible second source. The ledger must still be retrieved; its description authenticates no issuing key.", mismatch: "" },
  { id: "service", reference: "WN/COOL/SVC", title: "Plant service cycles", scope: "Equipment maintenance", entry: "Coolant plant service intervals, without worker-movement amendments.", limit: "Indexes machinery work. It supplies no evacuation revision or account from a worker.", mismatch: "The returned locator covers equipment servicing. It supplies no worker-movement revision. No independent record was retrieved." },
] as const;
const common = ["archive_briefed", "memory_intact", "archive_catalog_open"];
const completed = ["archive_done", "archive_unresolved"];
const here = "act2_archive_compare";
const retrieved = (badge: boolean) => ({
  ...(badge ? { factions: { helion: 1 }, flags: ["archive_done", "order_verified", "archive_catalog_retrieved", "old_badge_traced", "archive_catalog_badge"] } : { creds: -25, flags: ["archive_done", "order_verified", "archive_catalog_retrieved"] }),
  flagsOff: ["archive_catalog_open"],
  journal: [{ id: "archive-catalog-extraction", kind: "fact" as const, text: `A staffed extraction at WN/SHIFT/REV corroborates the evacuation cancellation. ${badge ? "The search was billed to your old employee number, leaving another badge trace." : "You paid twenty-five creds for the search."} No reader authenticated the digital issuing key; custody and source-name permission remain separate.` }, { id: "verified-order", kind: "fact" as const, text: "A staffed search retrieved the shift-ledger extraction at WN/SHIFT/REV. It independently corroborates the evacuation cancellation while the flush remained scheduled. No reader authenticated the digital issuing key." }],
});

export const CATALOG_CHOICES: Choice[] = [
  { id: "open-archive-catalog", label: "Work the catalog before choosing a retrieval method.", detail: "Inspect descriptions freely. Each submitted locator logs a query: Helion +1. Finding a locator supplies no evidence.", requireAllFlags: ["archive_briefed", "memory_intact"], hideIfAnyFlag: [...completed, "archive_catalog_open"], effects: { flags: ["archive_catalog_open"] }, next: here },
  ...ARCHIVE_CATALOG.map(record => ({ id: `catalog-inspect-${record.id}`, label: `Inspect ${record.reference} · ${record.title.toLowerCase()}.`, detail: "Read the catalog description. No fee, query or roll.", requireAllFlags: common, hideIfAnyFlag: [...completed, `archive_catalog_read_${record.id}`], effects: { flags: [`archive_catalog_read_${record.id}`] }, next: here })),
  ...ARCHIVE_CATALOG.map(record => ({ id: `catalog-request-${record.id}`, label: `Submit ${record.reference} as the evacuation-revision locator.`, detail: "Logged query: Helion +1. A mismatched request also alerts the reader (−1 to authentication/carbon retrieval). No fee and no roll.", requireAllFlags: [...common, `archive_catalog_read_${record.id}`], hideIfAnyFlag: [...completed, "archive_catalog_located", `archive_catalog_queried_${record.id}`], effects: { factions: { helion: 1 }, flags: [`archive_catalog_queried_${record.id}`, "archive_flagged", ...(record.id === "revision" ? ["archive_catalog_located", "archive_compared"] : ["archive_reader_alert"])], journal: [{ id: record.id === "revision" ? "archive-catalog" : `archive-catalog-${record.id}`, kind: "claim" as const, text: record.id === "revision" ? "Catalog locator WN/SHIFT/REV identifies a possible independent ledger for the evacuation revision. The logged lookup retrieved no record and authenticated no issuing key." : `The logged ${record.reference} request did not locate an evacuation revision. ${record.mismatch}` }] }, next: here })),
  { id: "catalog-buy-extraction", label: "Commission the staffed ledger extraction. Pay 25 creds.", detail: "No roll. Receive independent corroboration, then decide custody. The logged lookup remains; the digital issuing key stays unauthenticated.", requireAllFlags: [...common, "archive_catalog_located", "archive_catalog_read_revision", "archive_catalog_queried_revision"], hideIfAnyFlag: completed, requireCreds: 25, effects: retrieved(false), next: "act2_archive_custody" },
  { id: "catalog-bill-employee", label: "Bill the staffed extraction to your old employee number.", detail: "Spire. No fee or roll; Helion +1 and another trace on your old badge. Receive corroboration, then decide custody. No digital-key authentication.", requireAllFlags: [...common, "archive_catalog_located", "archive_catalog_read_revision", "archive_catalog_queried_revision"], hideIfAnyFlag: completed, requireOrigin: "spire", effects: retrieved(true), next: "act2_archive_custody" },
  { id: "close-archive-catalog", label: "Close the catalog. Keep the inspected descriptions and query history.", detail: "Free. Choose an existing retrieval method below, or reopen the catalog later at this desk.", requireFlag: "archive_catalog_open", effects: { flagsOff: ["archive_catalog_open"] }, next: here },
];

export const CATALOG_ACTIONS = new Set(CATALOG_CHOICES.filter(choice => choice.id !== "open-archive-catalog").map(choice => choice.id));
export function catalogFeedback(state: GameState) {
  return ARCHIVE_CATALOG.filter(record => state.flags[`archive_catalog_queried_${record.id}`]).map(record => ({
    id: record.id, text: record.id === "revision" ? "Locator accepted: WN/SHIFT/REV. A staffed extraction is now available. No ledger has been received and no issuing key authenticated by this lookup." : record.mismatch,
  }));
}

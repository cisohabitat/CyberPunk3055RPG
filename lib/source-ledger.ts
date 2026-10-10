import { journalKind, journalTitle } from "./journal";
import type { GameState } from "./types";

const SOURCES = new Set(["timeline-mismatch", "timeline-checked", "timeline-limit", "bench-verdict", "bench-challenge", "bench-correction", "bench-repeat", "memory-signature", "memory-order", "memory-roster", "mara-assurance", "mara-channel", "memory-analysis", "public-packet", "packet-correction", "archive-method", "verified-order", "archive-gap", "archive-custody", "nia-account", "wall-account"]);

// Only show records the player has acquired. Keep the source text and its kind.
export function sourceLedger(state: GameState) {
  return state.journal.filter((entry) => SOURCES.has(entry.id)).map((entry) => ({ id: entry.id, title: journalTitle(entry), kind: journalKind(entry), text: entry.text }));
}

export function sourceReadiness(state: GameState) {
  const corroborated = Boolean(state.flags.order_verified);
  const key = corroborated && Boolean(state.flags.archive_key_authenticated);
  const account = state.journal.some((entry) => entry.id === "nia-account");
  return {
    cancellation: key ? "Issuing key authenticated" : corroborated ? "Independently corroborated; key not authenticated" : "Independent corroboration still needed",
    quotation: !account ? "No approved witness account" : state.flags.witness_lost ? "Public quotation withheld after location breach" : state.flags.nia_public_consent ? "Quotation authorized for this account" : "Private account; public permission not given",
  };
}

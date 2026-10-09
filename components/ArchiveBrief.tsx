import type { GameState } from "@/lib/types";

export function ArchiveBrief({ state }: { state: GameState }) {
  if (!state.flags.archive_briefed || !["act2_archive_door", "act2_archive_gap", "act2_archive_custody"].includes(state.sceneId)) return null;
  const preparation = [
    state.flags.archive_indexed && "Index compared · authentication +2",
    state.flags.archive_patrol && "Service interval mapped · carbon retrieval +2",
    state.flags.archive_hatch && "Hatch braced · physical inspection +2",
  ].filter(Boolean);
  return <aside className="transfer-brief" aria-label="Archive source and preparation" data-testid="archive-brief">
    <p><strong>Archive preparation</strong> {preparation.length ? preparation.join(" · ") : "No preparation bonus. Staffed ledger recovery remains available."}</p>
    {state.flags.archive_reader_alert && <p className="transfer-warning">Reader alerted · authentication and carbon retrieval −1.</p>}
    <p className="hint">A ledger can corroborate the cancellation. Only a successful key match authenticates its digital issuer. Custody follows retrieval.</p>
  </aside>;
}

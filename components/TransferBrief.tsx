import type { GameState } from "@/lib/types";

export function TransferBrief({ state }: { state: GameState }) {
  if (!state.flags.witness_briefed || !["act2_witness_door", "act2_witness_checkpoint"].includes(state.sceneId)) return null;
  const preparations = [
    state.flags.witness_scanner && "Scanner protocol known",
    state.flags.witness_scouted && "Patrol gap mapped · stealth +2",
    state.flags.witness_escort && "Volunteer escort · checkpoint negotiation +1",
    state.flags.witness_braced && "Chair braced · physical transfer +2",
  ].filter(Boolean);
  return <aside className="transfer-brief" aria-label="Transfer preparation" data-testid="transfer-brief">
    <p><strong>Transfer preparation</strong> {preparations.length ? preparations.join(" · ") : "No preparation bonus. Earned tools, favors, and paid care remain available."}</p>
    {state.flags.witness_alert && <p className="transfer-warning">The desk is alerted · stealth and checkpoint negotiation −1.</p>}
    <p className="hint">Nia agreed to the move. She reviews any recording after arrival.</p>
  </aside>;
}

import { campaignThread, campaignThreadLeads, hasCampaignThread } from "@/lib/campaign-thread";
import type { GameState } from "@/lib/types";

export function CampaignThread({ state, choices = [] }: { state: GameState; choices?: readonly { id: string; label: string; enabled: boolean }[] }) {
  if (!hasCampaignThread(state.sceneId)) return null;
  const rows = campaignThread(state), leads = campaignThreadLeads(choices);
  if (!rows.length) return null;
  return <details className="campaign-thread" data-testid="campaign-thread" key={state.sceneId}>
    <summary>Follow your campaign thread · {rows.length} connections</summary>
    <h2>Your choices across the three acts</h2>
    <p className="hint">Your choices, their recorded consequences, and the questions still open. Reviewing this changes nothing.</p>
    <ol>{rows.map(row => <li key={row.id} data-testid={`thread-${row.id}`}>
      <h3>{row.title}</h3>
      <p>{row.decision}</p>
      <p className="thread-consequence">{row.consequence}</p>
      <p className="hint">{row.limit}</p>
    </li>)}</ol>
    {leads.length > 0 && <nav aria-label="Available campaign follow-ups">
      <p>Continue a thread: jump to an available decision, then review its terms before selecting it.</p>
      <ul>{leads.map(lead => <li key={lead.id}><a href={`#campaign-choice-${lead.id}`} onClick={event => {
        const target = document.getElementById(`campaign-choice-${lead.id}`);
        if (!target) return;
        event.preventDefault();
        target.focus({ preventScroll: true });
        target.scrollIntoView({ block: "center", behavior: "instant" });
      }}>{lead.label}</a></li>)}</ul>
    </nav>}
  </details>;
}

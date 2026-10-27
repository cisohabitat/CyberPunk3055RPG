import type { GameState } from "@/lib/types";
import { ORIGINS, STRAIN_MAX } from "@/lib/character";
import { campaignCoda } from "@/lib/campaign-consequences";
import { finalePersonalEcho } from "@/lib/finale-direction";
import { aftermath } from "@/lib/evidence";
import { endingCoda } from "@/lib/story/codas";
import { nightRetell } from "@/lib/story/retell";
import { CampaignRecap } from "./CampaignRecap";
import { CampaignThread } from "./CampaignThread";
import { finaleCommitments } from "@/lib/finale-commitments";
import { finaleConsequenceEcho } from "@/lib/campaign-presentation";
import { kerrTermsCoda } from "@/lib/kerr-terms";
import { maraAccountCoda } from "@/lib/mara-account";

export function FinaleReflection({ state, artwork = true }: { state: GameState; artwork?: boolean }) {
  const campaign = campaignCoda(state), personal = finalePersonalEcho(state);
  const commitments = finaleCommitments(state);
  const consequence = finaleConsequenceEcho(state);
  const threshold = kerrTermsCoda(state);
  const mara = maraAccountCoda(state);
  return <section className="finale-reflection" aria-label="After the wall" data-testid="finale-reflection">
    {(campaign || personal || consequence || threshold || mara) && <section className="finale-carry" aria-labelledby="finale-carry-title">
      <h2 id="finale-carry-title">What you carry</h2>
      {campaign && <p data-testid="campaign-coda">{campaign}</p>}
      {personal && <p className="relationship-coda" data-testid="relationship-coda">{personal}</p>}
      {consequence && <aside className="consequence-echo" data-testid="consequence-echo"><h3>{consequence.title}</h3><p>{consequence.text}</p></aside>}
      {threshold && <aside className="consequence-echo" data-testid="kerr-terms-coda"><h3>What the doorway kept</h3><p>{threshold}</p></aside>}
      {mara && <aside className="consequence-echo" data-testid="mara-account-coda"><h3>What you told Mara</h3><p>{mara}</p></aside>}
    </section>}
    <section className="aftermath" aria-label="What your choices changed">
      <h2>What remains</h2>
      {commitments && <section className="finale-commitments" data-testid="finale-commitments" aria-label="Commitments at the ending">
        <p>{commitments.complete} complete · {commitments.open} open · {commitments.unresolved} unresolved · {commitments.compromised} compromised</p>
        <details><summary>Review every commitment and its limits</summary><ul>{commitments.rows.map(row => <li key={row.id}><strong>{row.title} · {row.status}</strong><p>{row.detail}</p></li>)}</ul></details>
      </section>}
      <details data-testid="aftermath-details"><summary>Review the factual aftermath</summary>
        {aftermath(state).map(row => <section key={row.title}><h3>{row.title}</h3><p>{row.text}</p></section>)}
      </details>
      <details className="finale-history" data-testid="finale-history"><summary>Revisit the three chapters and final resources</summary>
        {state.chapters.length > 0 && <ol className="chapter-stack" data-testid="chapter-stack">{state.chapters.map(title => <li key={title}>{title}</li>)}</ol>}
        <ul className="recap" data-testid="ending-recap"><li>{ORIGINS[state.origin].name}</li><li>{state.creds} cr</li><li>Strain {state.strain}/{STRAIN_MAX}</li></ul>
        <ol className="finale-retell">{nightRetell(state).map(line => <li key={line} data-testid="night-retell">{line}</li>)}</ol>
        <p>{endingCoda(state.sceneId)}</p>
      </details>
    </section>
    <CampaignThread state={state} />
    <CampaignRecap state={state} artwork={artwork} />
  </section>;
}

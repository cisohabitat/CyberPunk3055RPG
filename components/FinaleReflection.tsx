import type { GameState } from "@/lib/types";
import { ORIGINS, STRAIN_MAX } from "@/lib/character";
import { campaignCoda } from "@/lib/campaign-consequences";
import { finalePersonalEcho } from "@/lib/finale-direction";
import { aftermath } from "@/lib/evidence";
import { endingCoda } from "@/lib/story/codas";
import { nightRetell } from "@/lib/story/retell";
import { CampaignRecap } from "./CampaignRecap";

export function FinaleReflection({ state, artwork = true }: { state: GameState; artwork?: boolean }) {
  const campaign = campaignCoda(state), personal = finalePersonalEcho(state);
  return <section className="finale-reflection" aria-label="After the wall" data-testid="finale-reflection">
    {(campaign || personal) && <section className="finale-carry" aria-labelledby="finale-carry-title">
      <h2 id="finale-carry-title">What you carry</h2>
      {campaign && <p data-testid="campaign-coda">{campaign}</p>}
      {personal && <p className="relationship-coda" data-testid="relationship-coda">{personal}</p>}
    </section>}
    <section className="aftermath" aria-label="What your choices changed">
      <h2>What remains</h2>
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
    <CampaignRecap state={state} artwork={artwork} />
  </section>;
}

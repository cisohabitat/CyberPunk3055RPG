import { testimonyPacket } from "@/lib/testimony";
import { sourceLedger, sourceReadiness } from "@/lib/source-ledger";
import type { GameState } from "@/lib/types";

const COMPARISON_SCENES = new Set(["memory_reconstruction", "memory_publication", "act2_archive_compare", "act2_public_response", "act3_records_visit"]);
export function TestimonyBrief({ state }: { state: GameState }) {
  const publicAccount = state.sceneId.startsWith("act3_testimony_");
  if (!publicAccount && !COMPARISON_SCENES.has(state.sceneId)) return null;
  const sources = sourceLedger(state);
  const readiness = sourceReadiness(state);
  return <aside className="transfer-brief" aria-label="Public account sources and permission" data-testid="testimony-brief">
    {publicAccount ? <dl className="testimony-sources">
      {testimonyPacket(state).map((row) => <div key={row.title}><dt>{row.title}</dt><dd>{row.text}</dd></div>)}
    </dl> : <p className="hint">A source’s contents, independent corroboration and permission to publish are separate questions.</p>}
    <details className="source-ledger" data-testid="source-ledger">
      <summary>Review acquired sources and permissions · {sources.length} records</summary>
      <dl className="testimony-sources">
        <div><dt>Cancellation</dt><dd>{readiness.cancellation}</dd></div>
        <div><dt>Nia’s public words</dt><dd>{readiness.quotation}</dd></div>
      </dl>
      {sources.length ? <ul>{sources.map((source) => <li key={source.id}><h3>{source.title}</h3><p className="hint">Recorded as {source.kind}</p><p>{source.text}</p></li>)}</ul> : <p>No source records are attached yet. Reviewing this brief supplies no evidence.</p>}
      <p className="hint">Entries retain what was known when recorded. A later source can add corroboration; an earlier allegation and its correction remain separate.</p>
    </details>
  </aside>;
}

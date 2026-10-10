"use client";

import { useEffect, useRef, useState } from "react";
import { FRAGMENTS, memoryDisposition } from "@/lib/evidence";
import type { VisibleChoice } from "@/lib/engine";
import type { GameState } from "@/lib/types";
import { SourceDetails } from "./SourceArtwork";

export function MemoryPlate({ state, choices, onInspect, artwork }: { state: GameState; choices: VisibleChoice[]; onInspect: (choice: VisibleChoice) => void; artwork: boolean }) {
  const [lastInspected, setLastInspected] = useState<string | null>(null);
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    if (lastInspected && state.flags[`memory_${lastInspected}`]) {
      root.current?.querySelector<HTMLElement>(`#memory-source-${lastInspected}`)?.focus({ preventScroll: true });
    }
  }, [lastInspected, state.flags]);
  const inspected = FRAGMENTS.filter((fragment) => state.flags[fragment.flag]).length;
  return <section ref={root} className="memory-plate" aria-label="Memory evidence" data-testid="memory-plate">
    <div className="memory-header"><span className="eyebrow">Voss / unedited hour</span><span role="status">{inspected} / 3 inspected</span></div>
    <ol className="memory-timeline">{FRAGMENTS.map((fragment) => {
      const choice = choices.find((option) => option.id === `inspect-${fragment.id}`);
      const read = Boolean(state.flags[fragment.flag]);
      return <li key={fragment.id} className={read ? "examined" : "sealed"}>
        <span className="memory-time">{fragment.time}</span>
        {read ? <SourceDetails id={fragment.id} summaryId={`memory-source-${fragment.id}`} summary={`${fragment.title} · inspected`} artwork={artwork} initialOpen={lastInspected === fragment.id}><p>{fragment.text}</p><small>{fragment.kind} · {fragment.source}</small></SourceDetails>
          : <><h3>{fragment.title}</h3>{choice && <button type="button" className="ghost" data-testid={`choice-${choice.id}`} aria-keyshortcuts={String(choices.indexOf(choice) + 1)} disabled={!choice.enabled} onClick={() => { setLastInspected(fragment.id); onInspect(choice); }}>{choices.indexOf(choice) + 1} · Inspect {fragment.title.toLowerCase()}</button>}</>}
      </li>;
    })}</ol>
    {inspected === 3 && <section className="evidence-case" aria-label="Evidence comparison" data-testid="evidence-case">
      <h3>Build the account</h3>
      <dl>
        <div><dt>Recorded</dt><dd>Mara authorized the flush. The exported receipt records a later cancellation of evacuation.</dd></div>
        <div><dt>Still unknown</dt><dd>Who issued the cancellation? What did Mara know before signing?</dd></div>
        <div><dt>At risk</dt><dd>The roster can expose a living witness. Keeping her home private does not move her to safety.</dd></div>
      </dl>
      {state.flags.memory_prepared && <p className="packet-label"><strong>Packet label</strong> {state.flags.memory_public_claim ? "Helion accused · issuing key awaits corroboration" : "Cancellation recorded · issuing key unverified"}</p>}
    </section>}
    <p className="hint">{memoryDisposition(state)} · Redaction changes the public record, not what you heard.</p>
  </section>;
}

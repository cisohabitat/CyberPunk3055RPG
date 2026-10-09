"use client";

import { useEffect, useRef, useState } from "react";
import { FRAGMENTS, memoryDisposition } from "@/lib/evidence";
import type { VisibleChoice } from "@/lib/engine";
import type { GameState } from "@/lib/types";

export function MemoryPlate({ state, choices, onInspect }: { state: GameState; choices: VisibleChoice[]; onInspect: (choice: VisibleChoice) => void }) {
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
        {read ? <details open={lastInspected === fragment.id}><summary id={`memory-source-${fragment.id}`}>{fragment.title} · inspected</summary><p>{fragment.text}</p><small>{fragment.kind} · {fragment.source}</small></details>
          : <><h3>{fragment.title}</h3>{choice && <button type="button" className="ghost" data-testid={`choice-${choice.id}`} aria-keyshortcuts={String(choices.indexOf(choice) + 1)} disabled={!choice.enabled} onClick={() => { setLastInspected(fragment.id); onInspect(choice); }}>{choices.indexOf(choice) + 1} · Inspect {fragment.title.toLowerCase()}</button>}</>}
      </li>;
    })}</ol>
    <p className="hint">{memoryDisposition(state)} · Redaction changes the public record, not what you heard.</p>
  </section>;
}

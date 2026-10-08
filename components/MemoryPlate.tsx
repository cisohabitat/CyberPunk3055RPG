import { FRAGMENTS, memoryDisposition } from "@/lib/evidence";
import type { GameState } from "@/lib/types";

export function MemoryPlate({ state }: { state: GameState }) {
  const inspected = FRAGMENTS.filter((fragment) => state.flags[fragment.flag]).length;
  return <section className="memory-plate" aria-label="Memory evidence" data-testid="memory-plate">
    <div className="memory-header"><span className="eyebrow">Voss / unedited hour</span><span>{inspected} / 3 inspected</span></div>
    <ol className="memory-timeline">{FRAGMENTS.map((fragment) => <li key={fragment.id} className={state.flags[fragment.flag] ? "examined" : "sealed"}>
      <span className="memory-time">{fragment.time}</span><h3>{fragment.title}</h3><p>{state.flags[fragment.flag] ? fragment.text : "Sealed fragment. Inspect it below to establish what this source can prove."}</p>
      <small>{state.flags[fragment.flag] ? `${fragment.kind} · ${fragment.source}` : "Unexamined"}</small>
    </li>)}</ol><p className="hint">{memoryDisposition(state)} · Editing the public record does not erase what you already heard.</p>
  </section>;
}
